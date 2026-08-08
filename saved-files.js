// ═══════════════════════════════════════════════════════════════════════
//  محفوظ فائلیں — har save ki hui dastawez نمبر شمار + تاریخ ke sath
//  neeche fehrist mein aa jati hai, jahan se: کھولیں / نقل / پرنٹ /
//  بھیجیں / حذف کر sakte hain.
// ═══════════════════════════════════════════════════════════════════════

let _dioSavedList = [];

// ── Aik dastawez ko register mein darj karo (save ke foran baad) ──────
// kind : 'report_173' | 'zimni' | 'misal' waghera
// name : dikhaane wala naam (jaise 'چالان مکمل')
// meta : { case_id, report_type, report_subtype, doc_id }
async function dioRegisterSaved(kind, name, meta) {
  try {
    const rec = {
      kind: kind || 'doc',
      name: name || 'دستاویز',
      meta: meta || {},
      case_id: (meta && meta.case_id) || null,
      saved_at: new Date().toISOString(),
    };
    // Pehle localStorage mein (foran nazar aaye, offline bhi chale)
    const key = 'dio_saved_files';
    let list = [];
    try { list = JSON.parse(localStorage.getItem(key) || '[]'); } catch (_) {}
    // Wahi dastawez dobara save ho to purani entry hata kar nayi upar
    list = list.filter(x => !(x.kind === rec.kind && x.name === rec.name &&
                              x.case_id === rec.case_id &&
                              JSON.stringify(x.meta) === JSON.stringify(rec.meta)));
    list.unshift(rec);
    if (list.length > 300) list = list.slice(0, 300);
    localStorage.setItem(key, JSON.stringify(list));
    _dioSavedList = list;
    if (document.getElementById('dio-saved-box')) dioRenderSavedBox();
  } catch (_) {}
}
window.dioRegisterSaved = dioRegisterSaved;

// ── Mojooda مقدمہ ki mehfooz files ───────────────────────────────────
// caseId ke saath — aur agar docKey diya jaye to SIRF usi button ki files
function dioSavedForCase(caseId, docKey) {
  let list = [];
  try { list = JSON.parse(localStorage.getItem('dio_saved_files') || '[]'); } catch (_) {}
  if (caseId) list = list.filter(x => x.case_id === caseId);
  if (docKey) {
    list = list.filter(x => (x.meta && (x.meta.doc_id === docKey || x.meta.report_type === docKey))
                          || x.kind === docKey);
  }
  return list;
}
window.dioSavedForCase = dioSavedForCase;

// ── Fehrist ka HTML ──────────────────────────────────────────────────
function dioSavedBoxHTML(caseId, docKey, title) {
  const list = dioSavedForCase(caseId, docKey);
  const rows = list.map((x, i) => {
    const d = x.saved_at ? (typeof formatDate === 'function' ? formatDate(x.saved_at) : x.saved_at.slice(0, 10)) : '—';
    const t = x.saved_at ? new Date(x.saved_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '';
    const j = encodeURIComponent(JSON.stringify(x));
    return `
    <tr>
      <td style="text-align:center;font-weight:700;">${i + 1}</td>
      <td>${(typeof esc === 'function' ? esc(x.name) : x.name)}</td>
      <td style="text-align:center;font-family:var(--font-mono);white-space:nowrap;">${d}${t ? ' <span style="color:var(--text-muted);font-size:11px;">' + t + '</span>' : ''}</td>
      <td style="text-align:center;white-space:nowrap;">
        <button class="btn btn-sm btn-secondary" onclick="dioSavedOpen('${j}')"  title="کھولیں / ترمیم">✏️</button>
        <button class="btn btn-sm btn-secondary" onclick="dioSavedPrint('${j}')" title="پرنٹ">🖨️</button>
        <button class="btn btn-sm btn-secondary" onclick="dioSavedShare('${j}')" title="بھیجیں">📤</button>
        <button class="btn btn-sm btn-secondary" onclick="dioSavedDelete('${j}')" title="فہرست سے ہٹائیں">🗑️</button>
      </td>
    </tr>`;
  }).join('');

  return `
  <div id="dio-saved-box" style="margin-top:14px;border:1px solid var(--border);border-radius:10px;
       background:var(--bg-card);overflow:hidden;direction:rtl;">
    <div style="padding:8px 12px;background:var(--bg-secondary);border-bottom:1px solid var(--border);
         font-weight:700;font-size:14px;">📁 ${title || 'محفوظ شدہ فائلیں'}</div>
    ${list.length ? `
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <thead>
        <tr style="background:var(--bg-tertiary);">
          <th style="padding:6px;width:56px;">نمبر شمار</th>
          <th style="padding:6px;text-align:right;">دستاویز</th>
          <th style="padding:6px;width:140px;">تاریخ</th>
          <th style="padding:6px;width:170px;">کارروائی</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`
    : `<div style="padding:14px;color:var(--text-muted);font-size:13px;">ابھی کوئی فائل محفوظ نہیں</div>`}
  </div>`;
}
window.dioSavedBoxHTML = dioSavedBoxHTML;

function dioRenderSavedBox(caseId, docKey) {
  const box = document.getElementById('dio-saved-box');
  if (!box) return;
  const cid = caseId || box.dataset.caseId || null;
  const dk  = docKey || box.dataset.docKey || null;
  box.outerHTML = dioSavedBoxHTML(cid, dk);
  const nb = document.getElementById('dio-saved-box');
  if (nb) { if (cid) nb.dataset.caseId = cid; if (dk) nb.dataset.docKey = dk; }
}
window.dioRenderSavedBox = dioRenderSavedBox;

// ── Kaarrwai: kholna / print / bhejna / hatana ───────────────────────
function _dioSavedParse(j) { try { return JSON.parse(decodeURIComponent(j)); } catch (_) { return null; } }

function dioSavedOpen(j) {
  const x = _dioSavedParse(j); if (!x) return;
  const m = x.meta || {};
  if (x.kind === 'report_173' && typeof openReport173WithType === 'function') {
    openReport173WithType(m.report_type, true);
    return;
  }
  if (x.kind === 'misal' && m.doc_id && typeof _openMisalEditor === 'function') {
    _openMisalEditor(m.doc_id);
    return;
  }
  if (x.kind === 'zimni' && typeof showPage === 'function') { showPage('zimni', null); return; }
  if (typeof showToast === 'function') showToast('ℹ️ یہ دستاویز کھولنے کا راستہ دستیاب نہیں', 'info');
}
window.dioSavedOpen = dioSavedOpen;

function dioSavedPrint(j) {
  const x = _dioSavedParse(j); if (!x) return;
  dioSavedOpen(j);   // pehle kholo
  setTimeout(() => {
    if (typeof _printR173 === 'function' && x.kind === 'report_173') { _printR173(); return; }
    if (typeof _dioPrintCurrent === 'function') { _dioPrintCurrent(); return; }
    window.print();
  }, 900);
}
window.dioSavedPrint = dioSavedPrint;

async function dioSavedShare(j) {
  const x = _dioSavedParse(j); if (!x) return;
  const d = x.saved_at ? (typeof formatDate === 'function' ? formatDate(x.saved_at) : x.saved_at.slice(0, 10)) : '';
  const txt = `${x.name}${d ? ' — ' + d : ''}`;
  try {
    if (navigator.share) { await navigator.share({ title: x.name, text: txt }); return; }
    await navigator.clipboard.writeText(txt);
    if (typeof showToast === 'function') showToast('📋 نقل ہو گیا', 'success');
  } catch (_) {}
}
window.dioSavedShare = dioSavedShare;

function dioSavedDelete(j) {
  const x = _dioSavedParse(j); if (!x) return;
  if (!confirm('کیا یہ اندراج فہرست سے ہٹا دیں؟\n(اصل دستاویز محفوظ رہے گی)')) return;
  try {
    let list = JSON.parse(localStorage.getItem('dio_saved_files') || '[]');
    list = list.filter(y => y.saved_at !== x.saved_at || y.name !== x.name);
    localStorage.setItem('dio_saved_files', JSON.stringify(list));
    dioRenderSavedBox(x.case_id);
    if (typeof showToast === 'function') showToast('🗑️ فہرست سے ہٹا دیا', 'info');
  } catch (_) {}
}
window.dioSavedDelete = dioSavedDelete;
