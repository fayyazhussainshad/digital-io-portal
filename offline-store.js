/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — OFFLINE STORE  (offline-store.js)
   Full offline-first capability for all app sections:
     Cases · Evidence · 5-C Applications · Reminders
   
   Strategy:
     READ  → Supabase first, IndexedDB fallback when offline
     WRITE → Supabase if online; else IndexedDB + sync queue
     SYNC  → On reconnect, replay queued ops to Supabase
   ═══════════════════════════════════════════════════════════ */

const _ODB_NAME    = 'digital-io-v2';
const _ODB_VERSION = 2;          // bumped — adds session_cache store
let   _odb         = null;

function _openDB(){
  if(_odb) return Promise.resolve(_odb);
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(_ODB_NAME,_ODB_VERSION);
    req.onupgradeneeded=e=>{
      const db=e.target.result;
      ['cases_cache','evidence_cache','fivec_cache','reminders_cache']
        .forEach(s=>{ if(!db.objectStoreNames.contains(s)) db.createObjectStore(s,{keyPath:'id'}); });
      if(!db.objectStoreNames.contains('pending_files'))
        db.createObjectStore('pending_files',{keyPath:'fid'});
      if(!db.objectStoreNames.contains('sync_queue')){
        const sq=db.createObjectStore('sync_queue',{keyPath:'qid',autoIncrement:true});
        sq.createIndex('by_status','status');
        sq.createIndex('by_table','table');
      }
      // ── NEW: session cache for offline login ──────────────
      if(!db.objectStoreNames.contains('session_cache'))
        db.createObjectStore('session_cache',{keyPath:'key'});
    };
    req.onsuccess =e=>{ _odb=e.target.result; resolve(_odb); };
    req.onerror   =e=>reject(e.target.error);
  });
}

// ── helpers ──────────────────────────────────────────────────
function _tx(store,mode='readonly'){
  return _odb.transaction(store,mode).objectStore(store);
}
function _p(req){ return new Promise((res,rej)=>{ req.onsuccess=()=>res(req.result); req.onerror=()=>rej(req.error); }); }
function _txComplete(tx){ return new Promise((res,rej)=>{ tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }

// ── public API ────────────────────────────────────────────────
const offlineStore={

  // ── READ ───────────────────────────────────────────────────

  async getAll(storeName,officerId){
    await _openDB();
    const all=await _p(_tx(storeName).getAll());
    return officerId ? (all||[]).filter(r=>r.officer_id===officerId) : (all||[]);
  },

  async getOne(storeName,id){
    await _openDB();
    return _p(_tx(storeName).get(id));
  },

  // ── WRITE ──────────────────────────────────────────────────

  async cache(storeName,items){
    await _openDB();
    if(!Array.isArray(items)) items=[items];
    const tx=_odb.transaction(storeName,'readwrite');
    items.forEach(i=>tx.objectStore(storeName).put(i));
    return _txComplete(tx);
  },

  async remove(storeName,id){
    await _openDB();
    const tx=_odb.transaction(storeName,'readwrite');
    tx.objectStore(storeName).delete(id);
    return _txComplete(tx);
  },

  // Store a file (data-URL string or ArrayBuffer) for offline upload
  async storeFile(fid,fileData,meta){
    await _openDB();
    const tx=_odb.transaction('pending_files','readwrite');
    tx.objectStore('pending_files').put({fid,fileData,...meta});
    return _txComplete(tx);
  },

  async getFile(fid){
    await _openDB();
    return _p(_tx('pending_files').get(fid));
  },

  async removeFile(fid){
    await _openDB();
    const tx=_odb.transaction('pending_files','readwrite');
    tx.objectStore('pending_files').delete(fid);
    return _txComplete(tx);
  },

  // ── SYNC QUEUE ─────────────────────────────────────────────

  async enqueue(table,op,data,tempId){
    await _openDB();
    const tx=_odb.transaction('sync_queue','readwrite');
    tx.objectStore('sync_queue').add({
      table, op, data, tempId,
      status:    'pending',
      queued_at: new Date().toISOString(),
    });
    return _txComplete(tx);
  },

  async pendingCount(){
    try{
      await _openDB();
      const idx=_odb.transaction('sync_queue','readonly').objectStore('sync_queue').index('by_status');
      return _p(idx.count(IDBKeyRange.only('pending')));
    }catch(_){ return 0; }
  },

  async getPending(){
    try{
      await _openDB();
      const idx=_odb.transaction('sync_queue','readonly').objectStore('sync_queue').index('by_status');
      return (await _p(idx.getAll(IDBKeyRange.only('pending'))))||[];
    }catch(_){ return []; }
  },

  async _markQueueItem(qid,status,extra={}){
    await _openDB();
    const tx=_odb.transaction('sync_queue','readwrite');
    const store=tx.objectStore('sync_queue');
    const item=await _p(store.get(qid));
    if(item) store.put({...item,status,...extra});
    return _txComplete(tx);
  },

  // ── SYNC RUNNER ────────────────────────────────────────────

  async processQueue(sb){
    const pending=await this.getPending();
    if(!pending.length) return 0;

    let synced=0;
    for(const item of pending){
      try{
        await this._runOp(sb,item);
        await this._markQueueItem(item.qid,'synced',{synced_at:new Date().toISOString()});
        synced++;
      }catch(err){
        console.warn('[OfflineStore] Sync failed for op:',item.op,err.message);
        // leave as pending — will retry on next connection
      }
    }
    this._clearSynced(); // housekeeping
    return synced;
  },

  async _runOp(sb,item){
    const {table,op,data,tempId}=item;

    // ── INSERT ──────────────────────────────────────────────
    if(op==='insert'){
      const payload={...data};
      delete payload._offline; delete payload._tempId;

      // Cases: use trigger-based station auto-fill; numbers handled below
      if(table==='fivec'){
        const{numbers,...main}=payload;
        const{data:rec,error}=await sb.from('applications_5c').insert(main).select().single();
        if(error) throw error;
        if(numbers&&numbers.length){
          const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:rec.id}));
          if(rows.length) await sb.from('application_5c_numbers').insert(rows);
        }
        if(tempId){ await this.remove('fivec_cache',tempId); await this.cache('fivec_cache',rec); }
      } else {
        const{data:rec,error}=await sb.from(table).insert(payload).select().single();
        if(error) throw error;
        if(tempId){ await this.remove(table+'_cache',tempId); await this.cache(table+'_cache',rec); }
      }

    // ── UPDATE ──────────────────────────────────────────────
    } else if(op==='update'){
      const{id,...fields}=data;
      if(table==='fivec'){
        const{numbers,...main}=fields;
        const{error}=await sb.from('applications_5c').update(main).eq('id',id);
        if(error) throw error;
        if(numbers!==undefined){
          await sb.from('application_5c_numbers').delete().eq('application_5c_id',id);
          const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:id}));
          if(rows.length) await sb.from('application_5c_numbers').insert(rows);
        }
      } else {
        const{error}=await sb.from(table).update(fields).eq('id',id);
        if(error) throw error;
      }

    // ── DELETE ──────────────────────────────────────────────
    } else if(op==='delete'){
      const{error}=await sb.from(table).delete().eq('id',data.id);
      if(error) throw error;
      await this.remove(table+'_cache',data.id);

    // ── EVIDENCE FILE UPLOAD ─────────────────────────────────
    } else if(op==='upload_evidence'){
      const fileRec=await this.getFile(data.fid);
      if(!fileRec) throw new Error('Offline file not found: '+data.fid);

      let uploadData;
      if(typeof fileRec.fileData==='string'&&fileRec.fileData.startsWith('data:')){
        // data-URL from camera — convert to Blob
        const res=await fetch(fileRec.fileData);
        uploadData=await res.blob();
      } else {
        uploadData=new Blob([fileRec.fileData],{type:fileRec.mimeType||'application/octet-stream'});
      }

      const path=`${data.officerId}/${data.caseId||'general'}/${Date.now()}_${data.fileName}`;
      const{error:upErr}=await sb.storage.from('evidence').upload(path,uploadData);
      if(upErr) throw upErr;

      const{data:url}=sb.storage.from('evidence').getPublicUrl(path);
      const{error:dbErr}=await sb.from('evidence').insert({
        ...data.meta,
        officer_id: data.officerId,
        file_url:   url?.publicUrl||null,
        storage_path: path,
      });
      if(dbErr) throw dbErr;
      await this.removeFile(data.fid);

    // ── REMINDER TOGGLE ──────────────────────────────────────
    } else if(op==='toggle_reminder'){
      const{error}=await sb.from('reminders').update({is_done:data.is_done}).eq('id',data.id);
      if(error) throw error;
    }
  },

  async _clearSynced(){
    try{
      await _openDB();
      const idx=_odb.transaction('sync_queue','readonly').objectStore('sync_queue').index('by_status');
      const synced=await _p(idx.getAll(IDBKeyRange.only('synced')));
      if(!synced||!synced.length) return;
      const tx=_odb.transaction('sync_queue','readwrite');
      synced.forEach(r=>tx.objectStore('sync_queue').delete(r.qid));
    }catch(_){}
  },

  async isAvailable(){
    try{ await _openDB(); return true; }catch(_){ return false; }
  },

  // ── OFFLINE SESSION (for login without internet) ──────────

  // Call after every successful online login to cache the profile
  async saveSession(user, officer){
    await _openDB();
    const tx=_odb.transaction('session_cache','readwrite');
    tx.objectStore('session_cache').put({
      key:       'current',
      userId:    user.id,
      email:     user.email,
      officer:   officer,
      savedAt:   new Date().toISOString(),
    });
    return _txComplete(tx);
  },

  async loadSession(){
    await _openDB();
    return _p(_tx('session_cache').get('current'));
  },

  async clearSession(){
    await _openDB();
    const tx=_odb.transaction('session_cache','readwrite');
    tx.objectStore('session_cache').delete('current');
    return _txComplete(tx);
  },

  // Hash a PIN with SHA-256 + app salt (never stored in plain text)
  async _hashPIN(pin){
    const buf=await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode('digital-io-2026-' + pin)
    );
    return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
  },

  // Save a 4-6 digit offline PIN (hashed)
  async savePIN(pin){
    if(!pin||pin.length<4) throw new Error('PIN must be at least 4 digits');
    const hash=await this._hashPIN(pin);
    await _openDB();
    const tx=_odb.transaction('session_cache','readwrite');
    tx.objectStore('session_cache').put({key:'pin_hash', hash, setAt: new Date().toISOString()});
    return _txComplete(tx);
  },

  async hasPIN(){
    await _openDB();
    const rec=await _p(_tx('session_cache').get('pin_hash'));
    return !!(rec && rec.hash);
  },

  async verifyPIN(pin){
    const rec=await _p(_tx('session_cache').get('pin_hash'));
    if(!rec||!rec.hash) return false;
    const hash=await this._hashPIN(pin);
    return hash===rec.hash;
  },

  async clearPIN(){
    await _openDB();
    const tx=_odb.transaction('session_cache','readwrite');
    tx.objectStore('session_cache').delete('pin_hash');
    return _txComplete(tx);
  },
  // ── OFFLINE AUTH ─────────────────────────────────────────

  async saveOfflineProfile(userId,profile){
    await _openDB();
    const tx=_odb.transaction('offline_profiles','readwrite');
    tx.objectStore('offline_profiles').put({...profile,id:userId,cached_at:new Date().toISOString()});
    return _txComplete(tx);
  },

  async getOfflineProfile(userId){
    await _openDB();
    return _p(_tx('offline_profiles').get(userId));
  },

  async saveOfflineCreds(userId,email,hash,salt){
    await _openDB();
    const tx=_odb.transaction('offline_creds','readwrite');
    tx.objectStore('offline_creds').put({id:userId,email,hash,salt,saved_at:new Date().toISOString()});
    return _txComplete(tx);
  },

  async getOfflineCredsByEmail(email){
    await _openDB();
    const all=await _p(_tx('offline_creds').getAll());
    return (all||[]).find(c=>c.email===email)||null;
  },

};
