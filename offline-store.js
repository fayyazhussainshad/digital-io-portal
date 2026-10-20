/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — OFFLINE STORE  (offline-store.js)
   Full offline-first capability for all app sections:
     Cases · Evidence · 5-C Applications · Reminders
   
   Strategy:
     READ  → Supabase first, IndexedDB fallback when offline
     WRITE → Supabase if online; else IndexedDB + sync queue
     SYNC  → On reconnect, replay queued ops to Supabase
   ═══════════════════════════════════════════════════════════ */

// ── v538: data-URL → Blob، fetch کے بغیر ──────────────────────────────
//   ایپ کی CSP (`connect-src`) میں `data:` شامل نہیں — اس لیے fetch('data:…')
//   براؤزر روک دیتا ہے ("Failed to fetch")۔ اسی وجہ سے کیمرے کی تصویر والی
//   شہادت محفوظ نہیں ہوتی تھی اور آف لائن لی گئی شہادت کبھی sync نہیں ہوتی
//   تھی۔ CSP ڈھیلی کرنے کے بجائے یہاں سیدھا تبادلہ (dio-card.js جیسا)۔
function dioDataUrlToBlob(u) {
  const s = String(u || '');
  const comma = s.indexOf(',');
  const head = comma >= 0 ? s.slice(0, comma) : '';
  const body = comma >= 0 ? s.slice(comma + 1) : '';
  const mime = (/^data:([^;,]+)/.exec(head) || [])[1] || 'application/octet-stream';
  let bin;
  if (/;base64/i.test(head)) bin = atob(body);
  else bin = decodeURIComponent(body);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i) & 0xff;
  return new Blob([arr], { type: mime });
}
window.dioDataUrlToBlob = dioDataUrlToBlob;

const _ODB_NAME    = 'digital-io-v2';
const _ODB_VERSION = 2;          // bumped — adds session_cache store
let   _odb         = null;

let _odbClosing = false;

function _openDB(){
  // Band hota hua connection dobara istemal na karo — naya kholo
  if(_odb && !_odbClosing) return Promise.resolve(_odb);
  if(_odbClosing){ try{ _odb && _odb.close(); }catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ } _odb=null; _odbClosing=false; }
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
    req.onsuccess =e=>{
      _odb=e.target.result;
      _odbClosing=false;
      // Connection band ho jaye to nishan laga do (agli dafa naya khulega)
      _odb.onclose = ()=>{ _odbClosing=true; _odb=null; };
      _odb.onversionchange = ()=>{ _odbClosing=true; try{_odb.close();}catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ } _odb=null; };
      resolve(_odb);
    };
    req.onerror   =e=>reject(e.target.error);
  });
}

// Koi bhi kaam — agar connection band ho gaya ho to NAYA khol kar
// aik dafa DOBARA aazmao (warna kaam zaya ho jata tha)
// ── helpers ──────────────────────────────────────────────────
function _tx(store,mode='readonly'){
  try {
    return _odb.transaction(store,mode).objectStore(store);
  } catch(e){
    // Connection band ho gaya — nishan laga do taake agli dafa naya khule
    _odbClosing = true; _odb = null;
    throw e;
  }
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
    if(!_odb) await _openDB();
    const tx=_odb.transaction(storeName,'readwrite');
    tx.objectStore(storeName).delete(id);
    return _txComplete(tx);
  },

  // Store a file (data-URL string or ArrayBuffer) for offline upload
  async storeFile(fid,fileData,meta){
    await _openDB();
    if(!_odb) await _openDB();
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
    if(!_odb) await _openDB();
    const tx=_odb.transaction('pending_files','readwrite');
    tx.objectStore('pending_files').delete(fid);
    return _txComplete(tx);
  },

  // ── SYNC QUEUE ─────────────────────────────────────────────

  // v547: key (اختیاری) — اسی key کا زیرِ التوا اندراج پہلے سے قطار میں ہو تو نیا
  //   نہیں بنتا، اسی کا ڈیٹا بدل جاتا ہے۔ (سرکاری گاڑی: انٹرنیٹ کے بغیر دو بار
  //   «محفوظ» پر پہلے قطار میں دو insert بنتے، انٹرنیٹ آنے پر سرور پر دو قطاریں۔)
  async enqueue(table,op,data,tempId,key){
    await _openDB();
    if(!_odb) await _openDB();
    const tx=_odb.transaction('sync_queue','readwrite');
    const store=tx.objectStore('sync_queue');
    const rec={
      table, op, data, tempId,
      status:    'pending',
      queued_at: new Date().toISOString(),
    };
    if(key){
      rec.key=key;
      const pending=(await _p(store.index('by_status').getAll(IDBKeyRange.only('pending'))))||[];
      const same=pending.find(p=>p.key===key && p.table===table && p.op===op);
      if(same){ store.put({...same, data, tempId, queued_at: rec.queued_at}); return _txComplete(tx); }
    }
    store.add(rec);
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
    if(!_odb) await _openDB();
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

    let synced=0, failed=0;
    for(const item of pending){
      try{
        await this._runOp(sb,item);
        await this._markQueueItem(item.qid,'synced',{synced_at:new Date().toISOString()});
        synced++;
      }catch(err){
        // KHAMI THI: har nakaami par item HAMESHA 'pending' rehta tha —
        // koi ginti, koi hadd, koi ittila nahi. RLS se rad-shuda andraaj
        // (mo'attal afsar, miyaad khatam) MUSTAQIL nakaami hai, magar wo
        // har reconnect par dobara bheja jata aur afsar samajhta rehta ke
        // uski zimni mehfooz ho gayi. Ab: mustaqil ghalti = 'failed'.
        const msg  = String((err && err.message) || err || '');
        const code = String((err && err.code) || '');
        const permanent =
          code === '42501' || code === 'PGRST301' || code === 'DIO_SUB' || code === 'DIO_NOROW' ||
          /row-level security|violates row-level|permission denied|not authorized|سبسکرپشن/i.test(msg);
        const attempts = (item.attempts || 0) + 1;
        if (permanent || attempts >= 5) {
          try {
            await this._markQueueItem(item.qid, 'failed',
              { attempts, last_error: msg.slice(0, 300), failed_at: new Date().toISOString() });
          } catch (_) { if (typeof dioLogError === 'function') dioLogError('sync queue: item failed mark nakaam', _); }
          failed++;
        } else {
          try { await this._markQueueItem(item.qid, 'pending', { attempts, last_error: msg.slice(0, 300) }); } catch (_) { if (typeof dioLogError === 'function') dioLogError('sync queue: item retry mark nakaam', _); }
        }
        console.warn('[OfflineStore] Sync failed:', item.op, msg, permanent ? '(mustaqil)' : '(attempt ' + attempts + ')');
      }
    }
    this._clearSynced(); // housekeeping
    if (failed) {
      // Afsar ko KHAMOSHI se na chhoro — ye adaalati record hai
      try {
        if (typeof showToast === 'function')
          showToast('' + failed + ' اندراجات سرور نے مسترد کیے — dioFailedSyncs() سے تفصیل دیکھیں', 'error', 8000);
      } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
      try { if (window.dioLogError) dioLogError('offline sync: ' + failed + ' mustaqil nakaam'); } catch (_) { /* logging khud kabhi na phatte */ }
    }
    return synced;
  },

  // Afsar/support ke liye: kaun se andraaj rad huay aur kyun
  async getFailed(){
    try{
      await _openDB();
      const idx=_odb.transaction('sync_queue','readonly').objectStore('sync_queue').index('by_status');
      return (await _p(idx.getAll(IDBKeyRange.only('failed'))))||[];
    }catch(_){ return []; }
  },

  async _runOp(sb,item){
    const {table,op,data,tempId}=item;

    // v552: ضمنی کا اپنا مقامی ذخیرہ اور اپنا sync ہے (zimni.js → _zimniSyncPending)۔
    //   پرانی قطار کے ضمنی اندراج یہاں سے نہیں بھیجے جاتے — ورنہ ایک ہی ضمنی دو بار
    //   جا سکتی تھی، اور پرانی قطار میں تاریخ DD/MM شکل میں تھی جو سرور رد کرتا ہے۔
    //   مواد اسی آلے پر پہلے سے محفوظ ہے؛ ترمیم والے اندراج کو «sync باقی» نشان۔
    if(table==='zimni_reports'){
      try{ if(op==='update' && data && data.id && typeof window._zimniMarkPending==='function') window._zimniMarkPending(data.case_id, data.id); }
      catch(_){ /* nishan na lag sake to bhi qatar saaf */ }
      try{ if(typeof window._zimniSyncPending==='function') setTimeout(function(){ window._zimniSyncPending(); }, 1500); }catch(_){ /* baad mein */ }
      return;
    }

    // ── INSERT ──────────────────────────────────────────────
    if(op==='insert'){
      const payload={...data};
      delete payload._offline; delete payload._tempId;
      // Offline par jo local cache row dikhane ke liye rakhi thi (jaise
      // metadata-only evidence) — sync ke baad hata do (duplicate se bachao).
      const _localId = payload._localId;   delete payload._localId;
      const _cacheStore = payload._cacheStore; delete payload._cacheStore;

      // Cases: use trigger-based station auto-fill; numbers handled below
      if(table==='fivec'){
        const{numbers,_mainId,...main}=payload;
        // v547: درخواست بن چکی (پچھلی کوشش میں) تو دوبارہ نہ بناؤ — صرف نمبر باقی
        let rec;
        if(_mainId){ rec={...main,id:_mainId}; }
        else {
          const r=await sb.from('applications_5c').insert(main).select().single();
          if(r.error) throw r.error;
          rec=r.data;
        }
        if(numbers&&numbers.length){
          const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:rec.id}));
          if(rows.length){
            // v547: نمبر محفوظ نہ ہوں تو اندراج «synced» نہ گنو (پہلے نمبر خاموشی سے ضائع)۔
            //   درخواست کا id قطار میں رکھ دو تاکہ اگلی کوشش دوہری درخواست نہ بنائے۔
            const{error:nErr}=await sb.from('application_5c_numbers').insert(rows);
            if(nErr){
              try{ await this._markQueueItem(item.qid,'pending',{data:{...data,_mainId:rec.id}}); }
              catch(_){ if(typeof dioLogError==='function') dioLogError('sync queue: 5-C id yaad nakaam',_); }
              throw nErr;
            }
          }
        }
        if(tempId){ await this.remove('fivec_cache',tempId); await this.cache('fivec_cache',rec); }
      } else {
        const{data:rec,error}=await sb.from(table).insert(payload).select().single();
        if(error) throw error;
        if(tempId){ await this.remove(table+'_cache',tempId); await this.cache(table+'_cache',rec); }
      }
      if(_localId && _cacheStore){ try{ await this.remove(_cacheStore, _localId); }catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ } }

    // ── UPDATE ──────────────────────────────────────────────
    } else if(op==='update'){
      const{id,...fields}=data;
      if(table==='fivec'){
        const{numbers,...main}=fields;
        const{error}=await sb.from('applications_5c').update(main).eq('id',id);
        if(error) throw error;
        if(numbers!==undefined){
          // v547: دونوں کا نتیجہ دیکھو — ناکامی پر throw، تاکہ اندراج قطار میں رہے اور
          //   دوبارہ چلے (دوبارہ چلانا محفوظ ہے: پرانے نمبر ہٹا کر وہی نئے نمبر)۔
          const{error:dErr}=await sb.from('application_5c_numbers').delete().eq('application_5c_id',id);
          if(dErr) throw dErr;
          const rows=numbers.filter(n=>n.application_number).map(n=>({...n,application_5c_id:id}));
          if(rows.length){ const{error:nErr}=await sb.from('application_5c_numbers').insert(rows); if(nErr) throw nErr; }
        }
      } else {
        // v547: RLS (مثلاً میعاد ختم) update کو بغیر غلطی 0 قطاروں پر روک دیتا ہے —
        //   پہلے یہ بھی «synced» گنا جاتا اور ترمیم خاموشی سے ضائع۔ اب مستقل ناکامی۔
        const{data:upd,error}=await sb.from(table).update(fields).eq('id',id).select('id');
        if(error) throw error;
        if(Array.isArray(upd) && !upd.length){ const e=new Error('سرور پر ریکارڈ نہیں ملا یا اجازت نہیں'); e.code='DIO_NOROW'; throw e; }
      }

    // ── DELETE ──────────────────────────────────────────────
    } else if(op==='delete'){
      const{error}=await sb.from(table).delete().eq('id',data.id);
      if(error) throw error;
      // v546: ہر table کا local cache store نہیں ہوتا (مثلاً case_documents) —
      //   پہلے یہاں غلطی آتی اور سرور سے حذف ہو چکا اندراج بھی «ناکام» گنا جاتا
      if(_odb && _odb.objectStoreNames.contains(table+'_cache')) await this.remove(table+'_cache',data.id);

    // ── EVIDENCE FILE UPLOAD ─────────────────────────────────
    } else if(op==='upload_evidence'){
      const fileRec=await this.getFile(data.fid);
      if(!fileRec) throw new Error('Offline file not found: '+data.fid);

      let uploadData;
      if(typeof fileRec.fileData==='string'&&fileRec.fileData.startsWith('data:')){
        // data-URL from camera — convert to Blob
        uploadData=dioDataUrlToBlob(fileRec.fileData);   // v538: fetch نہیں (CSP)
      } else {
        uploadData=new Blob([fileRec.fileData],{type:fileRec.mimeType||'application/octet-stream'});
      }

      const path=`${data.officerId}/${data.caseId||'general'}/${Date.now()}_${data.fileName}`;
      const{error:upErr}=await sb.storage.from('evidence').upload(path,uploadData);
      if(upErr) throw upErr;

      // Shahadat ab SIRF signed URL se dikhti hai — yahan public URL
      // banana usi khami ko wapas laata hai. storage_path mehfooz, file_url null.
      const{error:dbErr}=await sb.from('evidence').insert({
        ...data.meta,
        officer_id: data.officerId,
        // v538: yahan `url` naam ka variable parha jata tha jo kahin bana hi nahi, is liye
        //   ReferenceError: file upload ho jati magar shahadat ka DB record kabhi
        //   na banta (offline li gayi har tasveer/file sync mein atak jati).
        file_url:   null,
        storage_path: path,
      });
      if(dbErr) throw dbErr;
      await this.removeFile(data.fid);
      // Offline par jo "local-" evidence row dikhane ke liye cache mein rakhi thi,
      // sync hone ke baad hata do — warna asal DB row ke saath DO nazar aati.
      if(data.localId){ try{ await this.remove('evidence_cache', data.localId); }catch(_){ /* sirf local cache — na ho sake to bhi aage chalo */ } }

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
    }catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ }
  },

  async isAvailable(){
    try{ await _openDB(); return true; }catch(_){ return false; }
  },

  // ── OFFLINE SESSION (for login without internet) ──────────

  // Call after every successful online login to cache the profile
  async saveSession(user, officer){
    // user (aur uska id) na ho to kuch save mat karo — warna crash aata hai
    if (!user || !user.id) return;
    await _openDB();
    if(!_odb) await _openDB();
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
    if(!_odb) await _openDB();
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
    if(!_odb) await _openDB();
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
    if(!_odb) await _openDB();
    const tx=_odb.transaction('session_cache','readwrite');
    tx.objectStore('session_cache').delete('pin_hash');
    return _txComplete(tx);
  },
  // ── OFFLINE AUTH ─────────────────────────────────────────

  async saveOfflineProfile(userId,profile){
    await _openDB();
    if(!_odb) await _openDB();
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
    if(!_odb) await _openDB();
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
