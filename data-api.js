/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ڈیٹا (Supabase سے لینا/محفوظ کرنا)
   مقدمات، یاد دہانیاں، شہادت، ڈیش بورڈ کے اعداد
   (پہلے یہ app-core.js میں تھا)
   AHEM: app-core.js کے BAAD لوڈ ہو
   ═══════════════════════════════════════════════════════════ */

async function getOfficerId() {
  if (currentOfficer?.id) return currentOfficer.id;
  // Try cached officer (offline / fast path)
  try {
    const cached = JSON.parse(localStorage.getItem('dio_officer_cache')||'null');
    if (cached?.id) {
      if (!currentOfficer) currentOfficer = cached;
      return cached.id;
    }
  } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
  // Resolve user id safely
  let uid = currentUser?.id;
  if (!uid) {
    try { const r = await supabaseClient.auth.getUser(); uid = r.data?.user?.id; } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
  }
  if (!uid) return null;  // Don't query with undefined — prevents 400 errors
  if (!navigator.onLine) return null;  // Can't look up offline without cache
  try {
    const { data } = await supabaseClient.from('officers').select('*').eq('user_id', uid).single();
    if (data?.id) {
      if (!currentOfficer || !currentOfficer.id) currentOfficer = data;
      try { localStorage.setItem('dio_officer_cache', JSON.stringify(data)); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
      return data.id;
    }
    return null;
  } catch(_) { return null; }
}


async function getCases(status, query) {
  try {
    const oid = await getOfficerId();
    // Helper: filter cached list by status/query
    const filterCached = (all) => {
      if (status) all = all.filter(c => c.status === status);
      if (query) {
        const w = query.toLowerCase();
        all = all.filter(c => (c.fir_number||'').toLowerCase().includes(w) ||
          (c.complainant||'').toLowerCase().includes(w) ||
          (c.section_of_law||'').toLowerCase().includes(w) ||
          (c.complainant_cnic||'').toLowerCase().includes(w) ||
          (c.complainant_cell||'').toLowerCase().includes(w));
      }
      return all.sort((a,b)=> String(a.fir_number||'').localeCompare(String(b.fir_number||''), undefined, {numeric:true}));
    };

    if (!oid) {
      if (typeof offlineStore !== 'undefined') {
        // FIX v524: yahan bhi status/talaash lagao (pehle sab lauta deta tha)
        try { return filterCached(await offlineStore.getAll('cases_cache') || []); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
      }
      return [];
    }

    // CACHE-FIRST: try to return cached instantly
    let cached = null;
    if (typeof offlineStore !== 'undefined') {
      try { cached = await offlineStore.getAll('cases_cache', oid); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    }

    // If offline — return cache only (instant)
    if (!navigator.onLine) {
      return cached ? filterCached(cached) : [];
    }

    // ONLINE: if we have cache, refresh it in the BACKGROUND (don't block)
    if (cached && cached.length) {
      _refreshCasesInBackground(oid);
      return filterCached(cached);
    }

    // No cache yet — fetch from server now (first ever load)
    let q = supabaseClient.from('cases').select('*').eq('officer_id',oid).order('fir_number',{ascending:false});
    if (status) q = q.eq('status',status);
    if (query) {
      const w = `%${query}%`;
      q = q.or(`fir_number.ilike.${w},complainant.ilike.${w},section_of_law.ilike.${w},complainant_cnic.ilike.${w},complainant_cell.ilike.${w}`);
    }
    const { data } = await q;
    let all = data || [];
    // P9: merge in cases shared with this officer
    try {
      const shared = await _getSharedCases(oid);
      if (shared && shared.length) {
        const ownIds = new Set(all.map(c => c.id));
        shared.forEach(sc => { if (!ownIds.has(sc.id)) all.push(sc); });
      }
    } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    if (typeof markSynced === 'function') markSynced();
    if (typeof offlineStore !== 'undefined' && all && !status && !query) {
      try { await offlineStore.cache('cases_cache', all); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    }
    // FIX v524: shared maqdmaat upar BINA status/talaash ke jor diye jate thay —
    // "چالان مکمل" chunne par bhi dusre status ke shared maqdmaat aa jate thay.
    if (status || query) return filterCached(all);
    return all;
  } catch(e) {
    console.error('getCases error:', e);
    return [];
  }
}

// P9: fetch cases shared with this officer (marked with _shared flag + permission)

async function _getSharedCases(oid) {
  try {
    const { data: shares } = await supabaseClient.from('case_shares')
      .select('case_id,permission').eq('shared_with', oid);
    if (!shares || !shares.length) return [];
    const ids = shares.map(s => s.case_id);
    const permMap = {}; shares.forEach(s => { permMap[s.case_id] = s.permission; });
    const { data: cases } = await supabaseClient.from('cases').select('*').in('id', ids);
    return (cases||[]).map(c => ({ ...c, _shared: true, _sharePermission: permMap[c.id] || 'read' }));
  } catch(_) { return []; }
}

// Background refresh — updates cache silently, refreshes UI if cases page open
let _bgRefreshTimer = null;

async function _refreshCasesInBackground(oid) {
  if (_bgRefreshTimer) return; // throttle
  _bgRefreshTimer = setTimeout(()=>{ _bgRefreshTimer = null; }, 2000);
  try {
    const { data } = await supabaseClient.from('cases').select('*').eq('officer_id',oid).order('fir_number',{ascending:false});
    let all = data || [];
    try {
      const shared = await _getSharedCases(oid);
      if (shared && shared.length) {
        const ownIds = new Set(all.map(c => c.id));
        shared.forEach(sc => { if (!ownIds.has(sc.id)) all.push(sc); });
      }
    } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    if (all && typeof offlineStore !== 'undefined') {
      try { await offlineStore.cache('cases_cache', all); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
      if (typeof markSynced === 'function') markSynced();
      // If cases page currently open AND not in a workspace, silently refresh the list
      //
      // AHEM — do purani kharabiyan yahin se aati thin:
      //  1) `renderCases(c)` BINA daleel bulaya jata tha, is liye afsar ka
      //     chuna hua filter (زیر تفتیش / چالان / عدم پتہ) khud-ba-khud
      //     saaf ho jata tha aur saare mocaddme wapas aa jate the.
      //  2) Poora safha dobara banta tha — talaash ke khane se cursor nikal
      //     jata tha aur afsar do-teen huroof se aage likh hi nahi sakta tha.
      // Ab: sirf TABLE ki qatarein badalti hain, aur agar afsar us waqt
      // talaash ke khane mein likh raha ho to kuch bhi nahi chheRa jata.
      if (window._activePage === 'cases' && !window._inWorkspace) {
        const c = document.getElementById('page-content');
        if (c && !document.querySelector('.workspace-tabs') &&
            !document.querySelector('.modal-overlay[style*="flex"]')) {
          const typing = document.activeElement &&
                         document.activeElement.id === 'case-search';
          if (!typing) {
            if (typeof _csRefreshRows === 'function' && document.getElementById('cs-rows')) {
              _csRefreshRows();
            } else if (typeof renderCases === 'function') {
              renderCases(c);
            }
          }
        }
      }
    }
  } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
}


async function getCase(id) {
  // CACHE-FIRST: return cached instantly if available
  if (typeof offlineStore !== 'undefined') {
    try {
      const cached = await offlineStore.getOne('cases_cache', id);
      if (cached) {
        // Refresh in background if online
        if (navigator.onLine) {
          supabaseClient.from('cases').select('*').eq('id',id).single()
            .then(({data}) => { if (data) { try { offlineStore.cache('cases_cache', data); } catch(_){ /* sirf local cache — na ho sake to bhi aage chalo */ } } })
            .catch(()=>{});
        }
        return cached;
      }
    } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
  }
  // Not cached — fetch now
  if (!navigator.onLine) return null;
  try {
    const { data } = await supabaseClient.from('cases').select('*').eq('id',id).single();
    if (data && typeof offlineStore !== 'undefined') {
      try { await offlineStore.cache('cases_cache', data); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    }
    return data;
  } catch(_) { return null; }
}


// ═══ v546: محفوظ کرو — نہ ہو سکے تو آف لائن قطار — ورنہ صاف غلطی ═══════════
//  پہلے کئی جگہ سرور پر لکھنے کا نتیجہ دیکھا ہی نہیں جاتا تھا (Supabase غلطی
//  پھینکتا نہیں، {error} لوٹاتا ہے) اور پھر بھی «محفوظ» دکھا دیا جاتا تھا۔
//  نتیجہ (status):
//    'ok'      — سرور پر محفوظ (data = محفوظ شدہ قطار)
//    'queued'  — انٹرنیٹ نہیں/کنکشن ٹوٹا: آف لائن قطار میں، انٹرنیٹ آتے ہی خود sync
//    'missing' — update/delete: سرور پر قطار نہیں ملی (یا اجازت نہیں)
//    'error'   — سرور نے رد کیا (error = اصل وجہ)؛ dioLogError میں درج
function _dioIsNetErr(e) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  const m = String((e && e.message) || e || '');
  return !(e && e.code) && /failed to fetch|networkerror|load failed|network request failed|fetch failed/i.test(m);
}
//  opts.queueKey (v547): آف لائن قطار میں اسی چابی کا زیرِ التوا اندراج پہلے سے ہو تو
//    نیا اندراج نہیں بنتا، وہی بدل جاتا ہے (دو بار محفوظ = سرور پر ایک ہی قطار)۔
async function dioSaveRow(table, op, rec, opts) {
  const queue = async () => {
    if (typeof offlineStore === 'undefined' || !offlineStore.enqueue) throw new Error('آف لائن قطار دستیاب نہیں');
    await offlineStore.enqueue(table, op, { ...rec }, undefined, opts && opts.queueKey);
    return { status: 'queued' };
  };
  const fail = (e) => {
    if (typeof dioLogError === 'function') dioLogError(table + ' ' + op + ' nakaam', e);
    return { status: 'error', error: e };
  };
  try {
    if (typeof supabaseClient === 'undefined' || !supabaseClient || navigator.onLine === false) return await queue();
    const r = { ...rec };
    let res;
    for (let g = 0; g < 6; g++) {
      if (op === 'insert') res = await supabaseClient.from(table).insert(r).select().single();
      else if (op === 'update') { const { id, ...f } = r; res = await supabaseClient.from(table).update(f).eq('id', id).select(); }
      else if (op === 'delete') res = await supabaseClient.from(table).delete().eq('id', r.id).select('id');
      else return fail(new Error('نامعلوم عمل: ' + op));
      // DB میں کوئی کالم نہ ہو (schema فرق) تو اسے نکال کر دوبارہ — addCase جیسا
      const m = /Could not find the '([^']+)' column/i.exec((res && res.error && res.error.message) || '');
      if (m && m[1] in r && m[1] !== 'id') { delete r[m[1]]; continue; }
      break;
    }
    if (res.error) return _dioIsNetErr(res.error) ? await queue() : fail(res.error);
    const data = res.data;
    if (op !== 'insert' && Array.isArray(data) && !data.length) return { status: 'missing' };
    return { status: 'ok', data: Array.isArray(data) ? data[0] : data };
  } catch (e) {
    if (_dioIsNetErr(e)) { try { return await queue(); } catch (q) { return fail(q); } }
    return fail(e);
  }
}
// نتیجے کے مطابق صاف پیغام — «محفوظ» صرف تب جب واقعی محفوظ ہوا ہو۔
//  w = { ok: 'محفوظ ہو گئی', fail: 'محفوظ نہیں ہوئی', local: 'اس آلے پر محفوظ' }
//  (نہ دیں تو مذکر «محفوظ ہو گیا / نہیں ہوا»)
function dioSaveToast(res, label, w) {
  if (typeof showToast !== 'function' || !res) return;
  w = w || {};
  const ok = w.ok || 'محفوظ ہو گیا', fail = w.fail || 'محفوظ نہیں ہوا', local = w.local || 'اس آلے پر محفوظ';
  const why = (e) => (window.DIO && DIO.errors && DIO.errors.userMessage) ? DIO.errors.userMessage(e) : String((e && e.message) || e || '');
  if (res.status === 'ok') showToast('✅ ' + label + ' ' + ok, 'success');
  else if (res.status === 'queued') showToast('📴 انٹرنیٹ نہیں — ' + label + ' ' + local + '؛ انٹرنیٹ آتے ہی خود سرور پر چلا جائے گا', 'info', 6000);
  else if (res.status === 'missing') showToast('❌ ' + label + ': سرور پر ' + fail + ' — ریکارڈ نہیں ملا یا اجازت نہیں', 'error', 7000);
  else showToast('❌ ' + label + ': سرور پر ' + fail + ' — ' + why(res.error), 'error', 7000);
}
window.dioSaveRow = dioSaveRow;
window.dioSaveToast = dioSaveToast;

// ═══ v547: ہر سرور لکھائی کا نتیجہ — دیکھے بغیر کامیابی کا پیغام نہیں ═══════════
//  Supabase غلطی پھینکتا نہیں، {error} لوٹاتا ہے۔ اور RLS (مثلاً میعاد ختم یا کسی
//  اور کا ریکارڈ) update/delete کو بغیر غلطی کے 0 قطاروں پر روک دیتا ہے۔
//  dioWriteOk(res, what, needRow) دونوں صورتیں پکڑ کر throw کرتا ہے، تاکہ
//  «محفوظ / حذف» کا پیغام صرف اصل کامیابی پر آئے۔ needRow=true کے لیے query کے
//  آخر میں .select('id') لگائیں (ورنہ بدلی ہوئی قطاریں واپس نہیں آتیں)۔
function dioWriteOk(res, what, needRow) {
  const err = res && res.error;
  if (err) {
    if (typeof dioLogError === 'function') dioLogError((what || 'server write') + ' nakaam', err);
    throw err;
  }
  if (needRow) {
    const d = res ? res.data : null;
    if (!(Array.isArray(d) ? d.length : d)) {
      const e = new Error('سرور پر ریکارڈ نہیں ملا یا اجازت نہیں');
      e.code = 'DIO_NOROW';
      if (typeof dioLogError === 'function') dioLogError((what || 'server write') + ' — 0 qataar', e);
      throw e;
    }
  }
  return res ? res.data : null;
}
// ناکامی کا صاف پیغام — catch میں: dioWriteFail('پیشی', e, 'محفوظ نہیں ہوئی')
function dioWriteFail(label, e, failWord) {
  const offline = (typeof _dioIsNetErr === 'function') && _dioIsNetErr(e);
  const why = offline ? 'انٹرنیٹ نہیں — دوبارہ کوشش کریں'
    : ((window.DIO && DIO.errors && DIO.errors.userMessage) ? DIO.errors.userMessage(e) : String((e && e.message) || e || ''));
  if (typeof showToast === 'function') showToast('❌ ' + label + ' ' + (failWord || 'محفوظ نہیں ہوا') + ' — ' + why, 'error', 7000);
}
window.dioWriteOk = dioWriteOk;
window.dioWriteFail = dioWriteFail;

// v547: «حذف شدہ مواد» میں نقل — اصل ریکارڈ حذف کرنے سے پہلے لازمی۔
//  bin.js فرصت میں آتی ہے؛ ابھی نہ آئی ہو تو پہلے لے آؤ (ورنہ softDelete موجود ہی
//  نہ ہوتا اور نقل کے بغیر حذف)۔ نتیجہ: بن کی قطار کا id، یا false۔
async function dioBinCopy(type, itemId, itemData) {
  try {
    if (typeof softDelete !== 'function' && typeof dioLoadScript === 'function') await dioLoadScript('bin.js');
  } catch (e) { if (typeof dioLogError === 'function') dioLogError('bin.js load nakaam', e); }
  if (typeof softDelete !== 'function') return false;
  return softDelete(type, itemId, itemData);
}
window.dioBinCopy = dioBinCopy;

async function addCase(caseData) {
  const oid = await getOfficerId();
  const rec = {...caseData, officer_id:oid};
  // OFFLINE: save locally + queue for sync
  if (!navigator.onLine && typeof offlineStore !== 'undefined') {
    const tempId = 'local-' + Date.now();
    const localRec = { ...rec, id: tempId, created_at: new Date().toISOString(), _pending: true };
    await offlineStore.cache('cases_cache', localRec);
    await offlineStore.enqueue('cases', 'insert', rec);
    showToast('آف لائن محفوظ — انٹرنیٹ آنے پر sync ہوگا', 'info');
    return localRec;
  }
  let { data, error } = await supabaseClient.from('cases').insert(rec).select().single();
  // SELF-HEAL: اگر کوئی کالم DB میں موجود نہ ہو (schema mismatch، مثلاً بحد/occurrence_place)
  // تو اسے نکال کر دوبارہ کوشش — مقدمہ محفوظ ہونا کبھی نہ رکے۔
  let _g = 0;
  while (error && _g++ < 8) {
    const m = /Could not find the '([^']+)' column/i.exec((error && error.message) || '');
    if (!m || !(m[1] in rec)) break;
    delete rec[m[1]];
    ({ data, error } = await supabaseClient.from('cases').insert(rec).select().single());
  }
  if (error) throw error;
  if (typeof offlineStore !== 'undefined') { try { await offlineStore.cache('cases_cache', data); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ } }
  return data;
}


async function updateCase(id, updates) {
  if (!navigator.onLine && typeof offlineStore !== 'undefined') {
    const existing = await offlineStore.getOne('cases_cache', id) || {};
    const merged = { ...existing, ...updates, id };
    await offlineStore.cache('cases_cache', merged);
    await offlineStore.enqueue('cases', 'update', { id, ...updates });
    showToast('آف لائن محفوظ — sync باقی', 'info');
    return merged;
  }
  let { data, error } = await supabaseClient.from('cases').update(updates).eq('id',id).select().single();
  // SELF-HEAL: missing column (schema mismatch) نکال کر دوبارہ — ترمیم کبھی نہ رکے۔
  let _g = 0;
  while (error && _g++ < 8) {
    const m = /Could not find the '([^']+)' column/i.exec((error && error.message) || '');
    if (!m || !(m[1] in updates)) break;
    delete updates[m[1]];
    ({ data, error } = await supabaseClient.from('cases').update(updates).eq('id',id).select().single());
  }
  if (error) throw error;
  if (typeof offlineStore !== 'undefined') { try { await offlineStore.cache('cases_cache', data); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ } }
  return data;
}


async function deleteCase(id) {
  if (!navigator.onLine && typeof offlineStore !== 'undefined') {
    await offlineStore.remove('cases_cache', id);
    await offlineStore.enqueue('cases', 'delete', { id });
    return;
  }
  // v547: 0 قطار (RLS/میعاد ختم) بھی ناکامی — ورنہ «حذف ہو گیا» کا جھوٹا پیغام
  dioWriteOk(await supabaseClient.from('cases').delete().eq('id',id).select('id'), 'case delete', true);
  if (typeof offlineStore !== 'undefined') { try { await offlineStore.remove('cases_cache', id); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ } }
}

let _remindersFailedAt = 0;  // timestamp of last network failure (backoff)


async function getReminders() {
  const oid = await getOfficerId();
  if (!oid) return [];
  const lsKey = 'cache_reminders_' + oid;
  const _fromLS = () => { try { return JSON.parse(localStorage.getItem(lsKey)||'[]'); } catch(_) { return []; } };

  // Offline — use cache, never hit network
  if (!navigator.onLine) {
    if (typeof offlineStore !== 'undefined') {
      try { return await offlineStore.getAll('reminders_cache', oid); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    }
    return _fromLS();
  }
  // Backoff: if a fetch failed in the last 30s, serve cache instead of retrying (stops error spam)
  if (_remindersFailedAt && (Date.now() - _remindersFailedAt) < 30000) {
    return _fromLS();
  }
  try {
    const { data, error } = await supabaseClient.from('reminders').select('*').eq('officer_id',oid).order('reminder_date',{ascending:true});
    if (error) throw error;
    _remindersFailedAt = 0;
    if (data) {
      try { localStorage.setItem(lsKey, JSON.stringify(data)); } catch(_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
      if (typeof offlineStore !== 'undefined') { try { await offlineStore.cache('reminders_cache', data); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ } }
    }
    return data||[];
  } catch(_) {
    // Network failed — mark backoff, fall back to cache
    _remindersFailedAt = Date.now();
    if (typeof offlineStore !== 'undefined') {
      try { return await offlineStore.getAll('reminders_cache', oid); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    }
    return _fromLS();
  }
}

// Reset backoff when connection returns
window.addEventListener('online', () => { _remindersFailedAt = 0; });

// ── EVIDENCE ──────────────────────────────────────────────────

// SECURITY (Correct-5): evidence bucket ko PRIVATE karne ki tayyari.
// Public URL private bucket par kaam nahi karti — is liye har row ke liye
// aik short-lived SIGNED URL banate hain (jaisa fivec.js pehle se karti hai).
// createSignedUrl PUBLIC aur PRIVATE dono par chalti hai → ye code bucket
// private karne se PEHLE bhi mehfooz hai (koi downtime nahi). Agar signing
// fail ho ya path na mile, purani public file_url par khud-ba-khud fallback.
function _evidenceStoragePath(e) {
  if (e && e.storage_path) return e.storage_path;
  const u = e && e.file_url;
  if (!u || u.indexOf('data:') === 0) return null;     // data: URL — as-is chhor do
  const marker = '/object/public/evidence/';
  const idx = u.indexOf(marker);
  if (idx === -1) return null;
  const raw = u.substring(idx + marker.length).split('?')[0];
  try { return decodeURIComponent(raw); } catch(_) { return raw; }
}

async function _attachEvidenceViewUrls(rows) {
  if (!Array.isArray(rows) || !rows.length) return rows;
  await Promise.all(rows.map(async e => {
    // Offline "local-" row jis ka apna preview (dataURL) hai — usay na chhero
    if ((e._local || e._pendingUpload) && e._viewUrl) return;
    e._viewUrl = null;                                  // عوامی URL کبھی نہیں — صرف signed
    const p = _evidenceStoragePath(e);
    if (!p) return;
    try {
      const { data, error } = await supabaseClient.storage.from('evidence').createSignedUrl(p, 3600);
      if (!error && data && data.signedUrl) e._viewUrl = data.signedUrl;
    } catch(_) { /* signing fail → koi preview nahi (public URL expose nahi karte) */ }
  }));
  return rows;
}

async function getEvidence(firNumber) {
  let rows = [];
  const oid = await getOfficerId().catch(() => null);
  // ── ONLINE: Supabase se lo + offline dekhne ke liye cache karo ──
  if (navigator.onLine && oid) {
    try {
      let q = supabaseClient.from('evidence').select('*').eq('officer_id',oid).order('fir_number',{ascending:true});
      if (firNumber) q = q.eq('fir_number', firNumber);
      const { data } = await q;
      rows = data || [];
      try { if (typeof offlineStore !== 'undefined' && rows.length) await offlineStore.cache('evidence_cache', rows); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    } catch(_) { rows = []; }
  }
  // ── offline cache se local/pending rows merge (ya offline par poori list) ──
  try {
    if (typeof offlineStore !== 'undefined') {
      const cached = await offlineStore.getAll('evidence_cache');
      if (!navigator.onLine) {
        rows = cached || [];                              // offline: sab kuch cache se
      } else {
        // online: woh "sync ke muntazir" local rows jo abhi DB mein nahi aaye
        (cached || []).forEach(c => {
          if (c && (c._pendingUpload || String(c.id).startsWith('local-')) &&
              !rows.some(r => String(r.id) === String(c.id))) rows.push(c);
        });
      }
      if (firNumber) rows = rows.filter(r => !r.fir_number || String(r.fir_number) === String(firNumber));
    }
  } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
  return await _attachEvidenceViewUrls(rows);             // signed view URL (_viewUrl) attach karo
}


async function addEvidence(ev) {
  const oid = await getOfficerId();
  if (!oid) throw new Error('افسر کی شناخت دستیاب نہیں — دوبارہ لاگ اِن کریں');  // orphan (officer_id:null) row se bachao
  const { data, error } = await supabaseClient.from('evidence').insert({...ev, officer_id:oid}).select().single();
  if (error) throw error;
  return data;
}

// ── EVIDENCE + FILE (photo/file) — online upload, ya OFFLINE store+queue ──
// meta: { name, fir_number, type, evidence_date, notes, is_readonly }
// fileInfo: { dataUrl } (camera) | { file } (File) | null (sirf metadata)
function _blobToDataUrl(blob) {
  return new Promise((res, rej) => {
    try { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(blob); }
    catch (e) { rej(e); }
  });
}

async function addEvidenceWithFile(meta, fileInfo) {
  const oid = await getOfficerId();
  if (!oid) throw new Error('افسر کی شناخت دستیاب نہیں — دوبارہ لاگ اِن کریں');
  const firHint = meta.fir_number || 'general';

  // blob + fileName tay karo
  let blob = null, fileName = '';
  if (fileInfo && fileInfo.dataUrl) {
    blob = dioDataUrlToBlob(fileInfo.dataUrl);   // v538: fetch('data:') کو CSP روکتی تھی
    fileName = ((meta.name || 'evidence').replace(/\s+/g, '_')) + '.jpg';
  } else if (fileInfo && fileInfo.file) {
    blob = fileInfo.file;
    fileName = String(fileInfo.file.name || ((meta.name || 'evidence') + '.dat')).replace(/\s+/g, '_');
  }

  // ── ONLINE ──
  if (navigator.onLine) {
    let file_url = null, storage_path = null;
    if (blob) {
      const path = `${(typeof currentUser !== 'undefined' && currentUser && currentUser.id) || oid}/${firHint}/${Date.now()}_${fileName}`;
      const { error: upErr } = await supabaseClient.storage.from('evidence').upload(path, blob, { upsert: true });
      if (upErr) throw upErr;
      // عوامی URL محفوظ نہ کریں — صرف storage_path (دیکھنا signed URL سے)
      storage_path = path;
    }
    const { data, error } = await supabaseClient.from('evidence')
      .insert({ ...meta, officer_id: oid, file_url, storage_path }).select().single();
    if (error) throw error;
    try { if (typeof offlineStore !== 'undefined') await offlineStore.cache('evidence_cache', data); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
    return data;
  }

  // ── OFFLINE ──
  if (typeof offlineStore === 'undefined') throw new Error('آف لائن محفوظ دستیاب نہیں');
  const localId = 'local-ev-' + Date.now();
  let fid = null, previewUrl = null;
  if (blob) {
    fid = 'fid-' + Date.now() + '-' + Math.floor(Math.random() * 1e6);
    previewUrl = (fileInfo && fileInfo.dataUrl) || await _blobToDataUrl(blob);
    try { await offlineStore.storeFile(fid, previewUrl, { mimeType: blob.type || 'image/jpeg', fileName }); } catch(_) { if (typeof dioLogError === 'function') dioLogError('offline evidence: file local store nakaam', _); }
  }
  const localRow = { id: localId, ...meta, officer_id: oid, _local: true, _pendingUpload: true,
    _viewUrl: previewUrl || null, file_url: null, storage_path: null, created_at: new Date().toISOString() };
  try { await offlineStore.cache('evidence_cache', localRow); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
  // sync op: file ho to upload_evidence, warna sada insert
  if (fid) {
    await offlineStore.enqueue('evidence', 'upload_evidence', {
      fid, officerId: oid, caseId: firHint, fileName, localId, meta: { ...meta }
    });
  } else {
    await offlineStore.enqueue('evidence', 'insert', { ...meta, officer_id: oid, _localId: localId, _cacheStore: 'evidence_cache' });
  }
  return localRow;
}
window.addEvidenceWithFile = addEvidenceWithFile;


async function deleteEvidence(id) {
  const { error } = await supabaseClient.from('evidence').delete().eq('id',id);
  if (error) throw error;
  try { if (typeof offlineStore !== 'undefined') await offlineStore.remove('evidence_cache', id); } catch(_) { /* sirf local cache — na ho sake to bhi aage chalo */ }
}


async function addReminder(rem) {
  const oid = await getOfficerId();
  if (!oid) throw new Error('افسر کی شناخت دستیاب نہیں — دوبارہ لاگ اِن کریں');  // orphan (officer_id:null) row se bachao
  const { data, error } = await supabaseClient.from('reminders').insert({...rem,officer_id:oid}).select().single();
  if (error) throw error;
  return data;
}


async function updateReminder(id,updates) {
  const { data,error } = await supabaseClient.from('reminders').update(updates).eq('id',id).select().single();
  if (error) throw error;
  return data;
}


async function deleteReminder(id) {
  // v547: 0 قطار (RLS/پہلے سے حذف) بھی ناکامی — ورنہ «حذف» کا جھوٹا پیغام
  dioWriteOk(await supabaseClient.from('reminders').delete().eq('id',id).select('id'), 'reminder delete', true);
}


// کلائنٹ سے کبھی نہ بدلنے والے حساس کالم (اختیار/اکاؤنٹ کی چوری روکنے کے لیے)۔
// یہ defense-in-depth ہے — اصل نفاذ DB trigger/RLS میں ہونا چاہیے۔
const _OFFICER_PROTECTED = [
  'role','is_approved','is_admin','approved_by','approved_at','is_verified','verified',
  'subscription_status','subscription_plan','subscription_expiry','subscription_ends_at',
  'subscription_started_at','trial_ends_at','trial_used',
  'is_suspended','suspended','suspension_reason','suspended_by','suspended_at',
  'id','officer_id','user_id','auth_id','created_at'
];
async function updateOfficerProfile(updates) {
  const oid = await getOfficerId();
  if (!oid) throw new Error('افسر کی شناخت دستیاب نہیں — دوبارہ لاگ اِن کریں');  // id=eq.null update se bachao
  // حساس کالم چھان کر نکال دو — افسر خود کو ایڈمن/منظور شدہ/سبسکرائبڈ نہ بنا سکے
  const safe = {};
  for (const k in updates) { if (Object.prototype.hasOwnProperty.call(updates, k) && !_OFFICER_PROTECTED.includes(k)) safe[k] = updates[k]; }
  const { data, error } = await supabaseClient.from('officers').update(safe).eq('id',oid).select().single();
  if (error) throw error;
  currentOfficer = {...currentOfficer,...safe,...data};
  return currentOfficer;
}

// ── BADGES ────────────────────────────────────────────────────
