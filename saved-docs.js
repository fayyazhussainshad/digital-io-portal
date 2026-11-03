/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SAVED DOCUMENTS (مشترکہ) — har chip ka kaam
   TAREEKH · WAQT · SERIAL ke hisab se save + fehrist + دوبارہ استعمال
   ───────────────────────────────────────────────────────────
   Chalan (report_173) aur zimni ki tarah — magar misal ki tamam
   chips (درخواستیں، سزا سلپ، ڈاکٹ ہائے، RFA فارم waghera) ke liye.
   AIK case_documents table mein HAR save AIK NAYA record banata hai
   (overwrite nahi) — is se aik hi qism ke kai (jaise 20+ درخواستیں)
   mehfooz reh sakte hain, har aik apni تاریخ/وقت/سیریل ke saath.

   Public API:
     dioSaveDocEntry(docType, title, content, opts) → Promise<entry>
        • docType: 'darkhwastain' | 'saza_slip' | 'daakt_haye' | ...
        • title  : fehrist mein dikhaya jane wala unwan (qism/heading)
        • content: koi bhi JSON (module ka apna data)
        • opts.id: agar mojood ho to ussi record mein ترمیم, warna naya
     dioLoadDocEntries(docType) → Promise<Array>  (سیریل/تاریخ ترتیب)
     dioRenderDocList(docType, cfg) → fehrist صفحہ (workspace-editor-area)
        cfg = { caseId, heading, onNew(), onOpen(entry), onDelete?(entry) }
     dioDeleteDocEntry(docType, id) → Promise<{status}>  (v546: ok/queued/error — dioSaveRow)
   ═══════════════════════════════════════════════════════════ */

// ── localStorage keys (offline backup) ──
function _sdKey(caseId, docType) { return 'dio_sd_' + docType + '_' + (caseId || ''); }

function _sdCaseId(explicit) {
  return explicit
    || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
    || (typeof currentCaseId !== 'undefined' ? currentCaseId : null)
    || (window._workspaceCase && window._workspaceCase.id) || null;
}

function _sdNowISO() { return new Date().toISOString(); }

// ── SAVE — har dafa NAYA record (ya opts.id par ترمیم) ──
async function dioSaveDocEntry(docType, title, content, opts) {
  opts = opts || {};
  const caseId = _sdCaseId(opts.caseId);
  if (!caseId) throw new Error('caseId missing');
  const now = _sdNowISO();
  const payload = Object.assign({}, content || {});
  payload.__title = title || payload.__title || '';
  payload.saved_at = now;

  let entry = null;
  // localStorage backup pehle (hamesha) — taake data zaya na ho
  const lsKey = _sdKey(caseId, docType);
  let localList = [];
  try { localList = JSON.parse(localStorage.getItem(lsKey) || '[]') || []; } catch (_) { localList = []; }

  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (opts.id && !String(opts.id).startsWith('local-')) {
      // ترمیم — mojooda record
      const { data, error } = await supabaseClient.from('case_documents')
        .update({ content: payload, status: 'complete', updated_at: now })
        .eq('id', opts.id).select().single();
      if (error) throw error;
      entry = data;
    } else {
      // NAYA record
      const { data, error } = await supabaseClient.from('case_documents')
        .insert({ case_id: caseId, officer_id: oid, document_type: docType, status: 'complete', content: payload })
        .select().single();
      if (error) throw error;
      entry = data;
    }
  } catch (e) {
    // DB fail / offline — local record bana lo (id: local-…)
    entry = {
      id: opts.id || ('local-' + Date.now()),
      case_id: caseId, document_type: docType, status: 'complete',
      content: payload, created_at: now, updated_at: now, _local: true,
    };
  }

  // localStorage list update (id se dedup)
  try {
    const i = localList.findIndex(x => String(x.id) === String(entry.id));
    const lite = { id: entry.id, content: payload, created_at: entry.created_at || now, updated_at: now };
    // Agar DB save NAKAAM raha (offline/ڈھانچہ) to is entry ko "sync ke muntazir"
    // nishan lagao — internet aane par _dioSyncDocs() ise Supabase par bhej dega.
    if (entry._local) {
      lite._pendingSync = true;
      lite._syncOp = (opts.id && !String(opts.id).startsWith('local-')) ? 'update' : 'insert';
    }
    if (i >= 0) localList[i] = lite; else localList.push(lite);
    localStorage.setItem(lsKey, JSON.stringify(localList));
  } catch (_) { if (typeof dioLogError === 'function') dioLogError('saved doc: local backup save nakaam', _); }

  // Misal chip "مکمل" mark (chip green ho jaye)
  try {
    if (typeof _misalDocs !== 'undefined' && _misalDocs) {
      if (!_misalDocs[docType]) _misalDocs[docType] = { document_type: docType };
      _misalDocs[docType].status = 'complete';
      _misalDocs[docType].content = payload;
    }
    if (typeof _refreshMisalBar === 'function') _refreshMisalBar();
  } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }

  // Saved-files list mein bhi (jahan baqi mehfooz dastawezat aati hain)
  try { if (typeof dioRegisterSaved === 'function') dioRegisterSaved('misal', title || docType, { case_id: caseId, doc_id: docType, entry_id: entry.id }); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }

  return entry;
}
window.dioSaveDocEntry = dioSaveDocEntry;

// ── LOAD — aik qism ke tamam records (سیریل/تاریخ ترتیب: purana → naya) ──
async function dioLoadDocEntries(docType, explicitCaseId) {
  const caseId = _sdCaseId(explicitCaseId);
  if (!caseId) return [];
  let rows = [];
  try {
    const { data, error } = await supabaseClient.from('case_documents')
      .select('*').eq('case_id', caseId).eq('document_type', docType)
      .order('created_at', { ascending: true });
    if (error) throw error;
    rows = data || [];
    // Online fetch ko localStorage mein cache karo — taake OFFLINE bhi yeh
    // dastawezat nazar aayen. "sync ke muntazir" (pending/local-) entries mehfooz.
    try {
      const key = _sdKey(caseId, docType);
      let prev = []; try { prev = JSON.parse(localStorage.getItem(key) || '[]') || []; } catch (_2) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
      const pending = prev.filter(x => x && (x._pendingSync || String(x.id).startsWith('local-')));
      const fresh = rows.map(r => ({ id: r.id, content: r.content, created_at: r.created_at, updated_at: r.updated_at }));
      const merged = fresh.concat(pending.filter(p => !fresh.some(f => String(f.id) === String(p.id))));
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (_3) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  } catch (_) {
    // DB fail — localStorage se
    try {
      const local = JSON.parse(localStorage.getItem(_sdKey(caseId, docType)) || '[]') || [];
      rows = local.map(x => ({ id: x.id, case_id: caseId, document_type: docType, content: x.content, created_at: x.created_at, updated_at: x.updated_at, _local: true }));
    } catch (_2) { rows = []; }
  }
  // localStorage-only (jo DB mein na aa sake — offline saves) merge
  try {
    const local = JSON.parse(localStorage.getItem(_sdKey(caseId, docType)) || '[]') || [];
    local.forEach(x => {
      if (String(x.id).startsWith('local-') && !rows.some(r => String(r.id) === String(x.id))) {
        rows.push({ id: x.id, case_id: caseId, document_type: docType, content: x.content, created_at: x.created_at, updated_at: x.updated_at, _local: true });
      }
    });
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  rows.sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || '')));
  return rows;
}
window.dioLoadDocEntries = dioLoadDocEntries;

// ── DELETE ──
async function dioDeleteDocEntry(docType, id, explicitCaseId) {
  const caseId = _sdCaseId(explicitCaseId);
  // v546: سرور کا نتیجہ دیکھا جاتا ہے۔ سرور نے رد کیا تو اس آلے سے بھی نہیں ہٹتی
  //   (ورنہ اگلی بار سرور سے واپس آ جاتی)؛ انٹرنیٹ نہ ہو تو حذف قطار میں۔
  let res = { status: 'ok' };
  if (id && !String(id).startsWith('local-')) {
    res = await dioSaveRow('case_documents', 'delete', { id });
    if (res.status === 'missing') res = { status: 'ok' };   // سرور پر پہلے ہی نہیں
    if (res.status === 'error') return res;
  }
  // localStorage se bhi
  try {
    const k = _sdKey(caseId, docType);
    let list = JSON.parse(localStorage.getItem(k) || '[]') || [];
    list = list.filter(x => String(x.id) !== String(id));
    localStorage.setItem(k, JSON.stringify(list));
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  return res;
}
window.dioDeleteDocEntry = dioDeleteDocEntry;

// ═══════════════════════════════════════════════════════════════
//  OFFLINE → ONLINE SYNC (Phase 2) — case_documents ke woh saves
//  jo offline localStorage mein "local-" ban kar reh gaye (ya offline
//  edits) — internet aane par Supabase par bhej do. Baqi (cases,
//  zimni, challan/report_173, 5C) apna offline-sync khud rakhte hain;
//  yeh SIRF is shared doc layer (darkhwastain/saza/misal chips/RFA) ke liye.
// ═══════════════════════════════════════════════════════════════
let _dioDocsSyncing = false;

async function _dioSyncDocs() {
  if (_dioDocsSyncing) return 0;
  if (!navigator.onLine || typeof supabaseClient === 'undefined' || !supabaseClient) return 0;
  _dioDocsSyncing = true;
  let synced = 0;
  try {
    let oid = null;
    try { oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null; } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }

    // Tamam 'dio_sd_<docType>_<caseId>' keys jama karo
    const keys = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.indexOf('dio_sd_') === 0) keys.push(k);
      }
    } catch (_) { _dioDocsSyncing = false; return 0; }

    for (const k of keys) {
      let list;
      try { list = JSON.parse(localStorage.getItem(k) || '[]') || []; } catch (_) { continue; }
      if (!Array.isArray(list) || !list.length) continue;

      // key ke aakhri '_' ke baad caseId (UUID mein '_' nahi hota),
      // us se pehle docType (jaise 'saza_slip' mein '_' ho sakta hai).
      const rest = k.slice(7);              // 'dio_sd_'.length === 7
      const us = rest.lastIndexOf('_');
      if (us < 0) continue;
      const docType = rest.slice(0, us);
      const caseId  = rest.slice(us + 1);
      if (!caseId) continue;

      let changed = false;
      for (let j = 0; j < list.length; j++) {
        const it = list[j];
        if (!it || !it._pendingSync) continue;
        try {
          if (it._syncOp === 'update' && !String(it.id).startsWith('local-')) {
            const { error } = await supabaseClient.from('case_documents')
              .update({ content: it.content, status: 'complete', updated_at: new Date().toISOString() })
              .eq('id', it.id);
            if (error) throw error;
          } else {
            const { data, error } = await supabaseClient.from('case_documents')
              .insert({ case_id: caseId, officer_id: oid, document_type: docType, status: 'complete', content: it.content })
              .select().single();
            if (error) throw error;
            if (data && data.id) { it.id = data.id; it.created_at = data.created_at || it.created_at; }
          }
          delete it._pendingSync; delete it._syncOp;
          changed = true; synced++;
        } catch (e) {
          // Abhi bhi nakaam (offline/server) — pending chhod do, agli dafa retry
        }
      }
      if (changed) { try { localStorage.setItem(k, JSON.stringify(list)); } catch (_) { if (typeof dioLogError === 'function') dioLogError('saved doc: sync ke baad local list save nakaam', _); } }
    }
  } catch (_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
  _dioDocsSyncing = false;
  if (synced > 0 && typeof showToast === 'function') showToast('' + synced + ' دستاویزات sync ہو گئیں', 'success');
  return synced;
}
window._dioSyncDocs = _dioSyncDocs;

// Internet wapas aane par + app-start par sync (baqi sync ke saath)
try {
  window.addEventListener('online', function () { setTimeout(function () { try { _dioSyncDocs(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }, 1800); });
  setTimeout(function () { if (navigator.onLine) { try { _dioSyncDocs(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } } }, 4500);
} catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }

// ── تاریخ/وقت — DD/MM/YYYY، ہر ماحول میں ──
function _sdDateTime(iso) {
  try {
    const d = iso ? new Date(iso) : new Date();
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    let hh = d.getHours(); const min = String(d.getMinutes()).padStart(2, '0');
    const ap = hh >= 12 ? 'PM' : 'AM'; hh = hh % 12 || 12;
    return { date: dd + '/' + mm + '/' + d.getFullYear(), time: hh + ':' + min + ' ' + ap };
  } catch (_) { return { date: '', time: '' }; }
}

// ── FEHRIST (list) صفحہ — چالان/ضمنی جیسی ──
//   cfg = { caseId, heading, chipName, onNew, onOpen, titleOf(entry) }
async function dioRenderDocList(docType, cfg) {
  cfg = cfg || {};
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const caseId = _sdCaseId(cfg.caseId);
  const heading = cfg.heading || cfg.chipName || 'محفوظ دستاویزات';
  area.innerHTML = `<div style="direction:rtl;padding:16px;font-family:'Jameel Noori Nastaleeq';">
    ${(window.DIO && DIO.states) ? DIO.states.loading('فہرست لوڈ ہو رہی ہے') : '<div style="text-align:center;color:var(--text-muted);padding:24px;">فہرست لوڈ ہو رہی ہے…</div>'}</div>`;

  const rows = await dioLoadDocEntries(docType, caseId);

  const items = rows.map((r, i) => {
    const dt = _sdDateTime(r.created_at || (r.content && r.content.saved_at));
    const title = (cfg.titleOf ? cfg.titleOf(r) : ((r.content && r.content.__title) || '')) || heading;
    const esc2 = (typeof esc === 'function') ? esc : (s => String(s == null ? '' : s));
    return `<tr style="border-bottom:1px solid var(--border);">
      <td style="padding:10px 8px;text-align:center;font-weight:700;width:54px;">${i + 1}</td>
      <td style="padding:10px 8px;text-align:center;font-size:10.5pt;">${esc2(title)}</td>
      <td style="padding:10px 8px;text-align:center;font-size:9pt;color:var(--text-muted);white-space:nowrap;"><bdi class="dio-ltr">${esc2(dt.date)}</bdi><br><bdi class="dio-ltr">${esc2(dt.time)}</bdi></td>
      <td style="padding:8px;text-align:center;white-space:nowrap;">
        <button class="btn btn-primary btn-sm" onclick="_sdOpen('${docType}','${r.id}')" title="کھولیں">کھولیں</button>
        <button aria-label="حذف" class="btn btn-danger btn-sm" onclick="_sdDelete('${docType}','${r.id}')" title="حذف"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg></button>
      </td>
    </tr>`;
  }).join('');

  // Save ke liye handlers global mein rakho (is fehrist ke liye)
  window._sdCurrentCfg = cfg;
  window._sdCurrentType = docType;

  area.innerHTML = `
  <div style="direction:rtl;height:100%;display:flex;flex-direction:column;font-family:'Jameel Noori Nastaleeq';">
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-bottom:1px solid var(--border);background:var(--bg-secondary);flex-wrap:wrap;">
      <button class="btn btn-primary dio-add-btn" onclick="_sdNew('${docType}')">+ ${(typeof esc==='function'?esc(cfg.itemName || heading):(cfg.itemName || heading))} درج کریں</button>
      <span style="font-size:12pt;font-weight:700;color:var(--accent);margin-right:auto;">${(typeof esc==='function'?esc(heading):heading)} — محفوظ فہرست</span>
    </div>
    <div style="flex:1;overflow:auto;padding:16px;">
      ${rows.length ? `
      <table style="width:100%;border-collapse:collapse;background:var(--bg-card,#fff);border-radius:8px;overflow:hidden;">
        <thead><tr style="background:var(--bg-secondary);">
          <th style="padding:10px 8px;font-size:9pt;">نمبر شمار</th>
          <th style="padding:10px 8px;font-size:9pt;text-align:center;">عنوان / قسم</th>
          <th style="padding:10px 8px;font-size:9pt;">تاریخ / وقت</th>
          <th style="padding:10px 8px;font-size:9pt;">عمل</th>
        </tr></thead>
        <tbody>${items}</tbody>
      </table>` : `
      <div style="text-align:center;padding:48px;color:var(--text-muted);">
        <div style="font-size:33pt;"><svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h4"/></svg></div>
        <div style="margin-top:10px;font-size:11.25pt;">ابھی کوئی محفوظ ${(typeof esc==='function'?esc(heading):heading)} نہیں</div>
        <div style="font-size:9pt;margin-top:4px;">"نیا" دبا کر نئی بنائیں</div>
      </div>`}
    </div>
  </div>`;
  try { if (typeof _dkFocusMode === 'function') _dkFocusMode(false); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
  try { if (typeof _sazaFocusMode === 'function') _sazaFocusMode(false); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
}
window.dioRenderDocList = dioRenderDocList;

// ── Fehrist ke buttons (global) ──
function _sdNew(docType) {
  const cfg = window._sdCurrentCfg || {};
  if (typeof cfg.onNew === 'function') cfg.onNew();
}
window._sdNew = _sdNew;

async function _sdOpen(docType, id) {
  const cfg = window._sdCurrentCfg || {};
  const rows = await dioLoadDocEntries(docType, cfg.caseId);
  const entry = rows.find(r => String(r.id) === String(id));
  if (entry && typeof cfg.onOpen === 'function') cfg.onOpen(entry);
}
window._sdOpen = _sdOpen;

async function _sdDelete(docType, id) {
  if (!confirm('کیا آپ یہ دستاویز مستقل حذف کرنا چاہتے ہیں؟')) return;
  const res = await dioDeleteDocEntry(docType, id);
  const cfg = window._sdCurrentCfg || {};
  try { dioRenderDocList(docType, cfg); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  dioSaveToast(res, 'دستاویز', { ok: 'حذف ہو گئی', fail: 'حذف نہیں ہوئی', local: 'اس آلے سے حذف ہو گئی' });
}
window._sdDelete = _sdDelete;
