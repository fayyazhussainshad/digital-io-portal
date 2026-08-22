/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — رپورٹ ضمنی (ZIMNI / PROGRESS REPORT)
   Police Form 25-54(1) — rich text editor
   ═══════════════════════════════════════════════════════════ */

let _zimniCaseId = null;
let _zimniCase   = null;
let _zimniList   = [];
let _zimniActive = null;  // currently open zimni record

// ── ENTRY POINT (called when ضمنیات/میمورنڈم button pressed) ──
async function openZimniEditor(caseId) {
  _zimniCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
              || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _zimniCaseId) {
    try { _zimniCase = await getCase(_zimniCaseId); } catch(_) { _zimniCase = null; }
  }
  await _loadZimni();
  _renderZimniList();
}

async function _loadZimni() {
  if (!navigator.onLine) {
    try { _zimniList = JSON.parse(localStorage.getItem('dio_zimni_' + _zimniCaseId) || '[]'); }
    catch(_) { _zimniList = []; }
    return;
  }
  try {
    const { data } = await supabaseClient
      .from('zimni_reports').select('*')
      .eq('case_id', _zimniCaseId)
      .order('serial_no', { ascending: true });
    _zimniList = data || [];
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
  } catch(_) {
    try { _zimniList = JSON.parse(localStorage.getItem('dio_zimni_' + _zimniCaseId) || '[]'); }
    catch(_2) { _zimniList = []; }
  }
}

// ── LIST VIEW (all zimni entries for this case) ───────────────
function _renderZimniList() {
  try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(false); } catch (_) {}  // chips wapas
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}
  area.innerHTML = `
  <style>
    .zt{ width:100%; border-collapse:collapse; font-size:13px; direction:rtl;
         font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; }
    .zt th{ background:var(--bg-tertiary); border:1px solid var(--border);
            padding:7px 6px; font-weight:700; white-space:nowrap; }
    .zt td{ border:1px solid var(--border); padding:6px; vertical-align:middle; }
    .zt tbody tr:nth-child(odd){ background:var(--bg-secondary); }
    .zt tbody tr:hover{ background:var(--hover-bg); }
    .zt .num{ text-align:center; font-weight:700; width:52px; }
    .zt .act{ white-space:nowrap; text-align:center; width:190px; }
    .zab{ border:1px solid var(--border); background:var(--bg-card); border-radius:6px;
          padding:3px 7px; margin:0 1px; cursor:pointer; font-size:14px; line-height:1; }
    .zab:hover{ background:var(--hover-bg); }
    .zt .khulasa{ font-size:12px; color:var(--text-secondary); max-width:340px; }
  </style>
  <div style="padding:14px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap;">
      <button class="btn btn-primary btn-sm" onclick="_newZimni()">➕ ضمنی درج کریں</button>
      <button class="btn btn-secondary btn-sm" onclick="_printAllZimni()">🖨️ تمام ضمنیاں پرنٹ کریں</button>
      <div style="margin-right:auto;font-weight:700;font-size:15px;">ضمنیات</div>
    </div>
    ${_zimniList.length ? `
    <table class="zt">
      <thead>
        <tr>
          <th class="num">ضمنی نمبر</th>
          <th>ضمنی</th>
          <th>بنام</th>
          <th>مرتبہ</th>
          <th>تاریخ</th>
          <th>فقرہ نمبر</th>
          <th>خلاصہ</th>
          <th class="act">ایکشن</th>
        </tr>
      </thead>
      <tbody>
        ${_zimniList.slice().sort((a,b)=>(parseInt(b.serial_no)||0)-(parseInt(a.serial_no)||0)).map((z, i) => {
          const c = z.content || {};
          const plain = (c.bodyHtml || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          const khulasa = plain ? (plain.length > 90 ? plain.slice(0, 90) + '…' : plain) : '—';
          const dt = z.report_date ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '—';
          // Save ka WAQT (challan jaisa) — تاریخ ke neeche
          let wq = '';
          try {
            const iso = c.saved_at || '';
            if (iso) { const x = new Date(iso); if (!isNaN(x)) {
              let h = x.getHours(); const m = String(x.getMinutes()).padStart(2,'0');
              const ap = h < 12 ? 'am' : 'pm'; h = h % 12 || 12;
              wq = String(h).padStart(2,'0') + ':' + m + ' ' + ap;
            } }
          } catch (_) {}
          // بنام — body se "بنام۔" ke aage wala نکالو (agar mojood)
          let banam = c.banam || '';
          if (!banam) { const mm = (c.bodyHtml||'').match(/بنام[۔:\s]*<\/span>\s*<span[^>]*>([^<]*)</); if (mm) banam = mm[1].trim(); }
          const murattib = (typeof getIOSignLine === 'function') ? getIOSignLine()
                         : ((currentOfficer && currentOfficer.full_name ? currentOfficer.full_name + ' ' : '')
                            + (currentOfficer && currentOfficer.designation ? currentOfficer.designation + ' ' : '')
                            + 'تھانہ ' + ((currentOfficer && currentOfficer.station) || ''));
          return `
          <tr ondblclick="_openZimni('${z.id}')" style="cursor:pointer;">
            <td class="num">${esc(String(z.serial_no || (i + 1)))}</td>
            <td>${esc(c.unwan || 'رپورٹ ضمنی')}</td>
            <td>${esc(banam)}</td>
            <td style="white-space:nowrap;">${esc(murattib)}</td>
            <td style="text-align:center;white-space:nowrap;font-family:var(--font-mono);">${esc(dt)}${wq?`<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${esc(wq)}</div>`:''}</td>
            <td style="text-align:center;">${esc(String(c.faqra_no || 1))}</td>
            <td class="khulasa">${esc(khulasa)}</td>
            <td class="act">
              <button class="zab" onclick="event.stopPropagation();_openZimni('${z.id}')" title="ترمیم">✏️</button>
              <button class="zab" onclick="event.stopPropagation();_deleteZimni('${z.id}')" title="حذف">🗑️</button>
              <button class="zab" onclick="event.stopPropagation();_printZimniById('${z.id}')" title="پرنٹ">🖨️</button>
              <button class="zab" onclick="event.stopPropagation();_emailZimni('${z.id}')" title="بھیجیں">✉️</button>
              <button class="zab" onclick="event.stopPropagation();_pdfZimni('${z.id}')" title="PDF" style="font-size:10px;font-weight:800;color:#b91c1c;">PDF</button>
            </td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>` : `
    <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:40px;margin-bottom:10px;">📋</div>
      <div style="font-size:14px;">ابھی کوئی ضمنی رپورٹ نہیں</div>
      <div style="font-size:11px;margin-top:6px;">اوپر "ضمنی درج کریں" پر کلک کریں</div>
    </div>`}
  </div>`;
}

function _newZimni() {
  const nextSerial = (_zimniList.reduce((m,z)=>Math.max(m, parseInt(z.serial_no)||0), 0)) + 1;
  _zimniActive = { id: null, serial_no: nextSerial, content: null };
  _renderZimniEditor();
}

function _openZimni(id) {
  _zimniActive = _zimniList.find(z => z.id === id) || null;
  if (!_zimniActive) return;
  _renderZimniEditor();
}

// ── EDITOR (Police Form 25-54(1)) ──────────────
function _renderZimniEditor() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _zimniCase || {};
  const z = _zimniActive || {};
  const saved = z.content || {};

  const savedBody = saved.bodyHtml ? sanitizeHtml(saved.bodyHtml) : _zimniDefaultBody(o, c);

  // چالان/اخراج jaisi settings — kaghaz, side margin, font list, button style —
  // sab report173 se (guess nahi)
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const side  = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : '0.2cm';
  const sizes = (typeof R173_FONT_SIZES !== 'undefined')
    ? R173_FONT_SIZES : [8,9,10,10.5,11,12,14,16,18,20,22,24,26,28,36,48,72];
  const btn = (typeof _chBtn === 'function') ? _chBtn()
    : 'min-width:30px;height:28px;border:1px solid #ccc;border-radius:6px;background:#fff;color:#111;cursor:pointer;font-size:13px;padding:0 7px;margin:0 1px;';
  const sep = '<span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>';
  const selCss = 'height:28px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text-primary,#111);font-size:13px;padding:0 6px;margin:0 1px;cursor:pointer;';

  area.innerHTML = `
  <style>${(typeof _ch173CSS === 'function') ? _ch173CSS() : ''}${_zimniFormCSS()}</style>
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Topbar — report173 jaisa (chips patti cursor upar jane par nazar aati hai) -->
    <div class="no-print" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <select id="ch173-paper-sel" onchange="_ch173SetPaper(this.value)" title="کاغذ کا سائز" style="${selCss}font-family:'Jameel Noori Nastaleeq',serif;">
        <option value="legal" ${paper==='legal'?'selected':''}>لیگل (8.5×13)</option>
        <option value="a4"    ${paper==='a4'   ?'selected':''}>A4 (8.27×11.7)</option>
      </select>
      <div style="margin-right:auto;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">
        <button id="zf-btn-b" onmousedown="event.preventDefault()" onclick="_zimniFmt('bold')" title="بولڈ" style="${btn}font-weight:900;">B</button>
        <button id="zf-btn-i" onmousedown="event.preventDefault()" onclick="_zimniFmt('italic')" title="ترچھا" style="${btn}font-style:italic;">I</button>
        <button id="zf-btn-u" onmousedown="event.preventDefault()" onclick="_zimniFmt('underline')" title="انڈر لائن" style="${btn}text-decoration:underline;">U</button>
        ${sep}
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('justifyRight')" title="دائیں سیدھ" style="${btn}">⇥</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('justifyCenter')" title="درمیان" style="${btn}">⇔</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('justifyLeft')" title="بائیں سیدھ" style="${btn}">⇤</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('justifyFull')" title="دونوں طرف برابر" style="${btn}">☰</button>
        ${sep}
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('insertUnorderedList')" title="نقطہ دار فہرست" style="${btn}">•</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('insertOrderedList')" title="نمبر والی فہرست" style="${btn}font-size:11px;">1.</button>
        <button onmousedown="event.preventDefault()" onclick="_ch173ClearFmt()" title="فارمیٹ ختم کریں" style="${btn}">🧹</button>
        ${sep}
        <button id="ch173-brush-btn" onmousedown="event.preventDefault()"
          onclick="_ch173BrushClick(false)" ondblclick="_ch173BrushClick(true)"
          title="فارمیٹ پینٹر — ایک کلک: ایک بار، ڈبل کلک: بار بار" style="${btn}">🖌</button>
        <select id="ch173-font-sel" onchange="_zimniSetFont(this.value)" title="فونٹ سائز" style="${selCss}">
          ${sizes.map(s => `<option value="${s}" ${String(s)==='14'?'selected':''}>${s}</option>`).join('')}
        </select>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('undo')" title="واپس (Undo)" style="${btn}">↶</button>
        <button onmousedown="event.preventDefault()" onclick="_zimniFmt('redo')" title="دوبارہ (Redo)" style="${btn}">↷</button>
        <button class="btn btn-primary btn-sm dio-modbtn" onclick="_saveZimni()">💾 محفوظ</button>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_printZimni()">🖨️ پرنٹ</button>
      </div>
    </div>

    <!-- Document — poora editable (har jaga likha ja sake), kaghaz asal naap par -->
    <div style="flex:1;overflow:auto;min-height:0;padding:16px;background:var(--bg-tertiary);">
      <div id="ch173-doc" contenteditable="true" spellcheck="false" style="
        width:${paper==='a4'?'8.27in':'8.5in'};max-width:none;
        min-height:${paper==='a4'?'11.7in':'13in'};margin:0 auto;
        padding:1cm ${side};background:#fff;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;
        line-height:1.4;box-sizing:border-box;">${savedBody}</div>
    </div>
  </div>`;

  // ═══ report173 ke asal functions — behavior bilkul چالان/اخراج jaisa ═══
  try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}
  try { if (typeof _ch173BlockFloatBar === 'function') _ch173BlockFloatBar(); } catch (_) {}
  setTimeout(() => {
    try { if (typeof _ch173FullPage === 'function') _ch173FullPage(area); } catch (_) {}
    try { if (typeof _ch173FitPaper === 'function') _ch173FitPaper(); } catch (_) {}
    try { if (typeof _ch173BindKeys === 'function') _ch173BindKeys(); } catch (_) {}       // Tab/Enter/Ctrl+BIU
    try { if (typeof _ch173BrushOff === 'function') _ch173BrushOff(); } catch (_) {}
    try { if (typeof _ch173BindBrush === 'function') _ch173BindBrush(); } catch (_) {}     // format painter
    try { if (typeof _ch173BindCellPick === 'function') _ch173BindCellPick(); } catch (_) {}
    try { if (typeof _ch173FocusMode === 'function') _ch173FocusMode(true); } catch (_) {} // chips peek
    try { if (typeof _ch173WatchFit === 'function') _ch173WatchFit(); } catch (_) {}
    try { _zimniBindFindReplace(); } catch (_) {}                                          // Ctrl+F / Ctrl+H
    try { _zimniColResize(); } catch (_) {}                                                // table ki lakeerein moveable
    // Cursor ke mutabiq font dropdown + B/I/U ki halat khud badle (MS Word jaisa)
    try {
      if (!window._zfSyncBound) {
        window._zfSyncBound = true;
        document.addEventListener('selectionchange', () => { try { _zimniSyncFmtBtns(); } catch (_) {} });
      }
    } catch (_) {}
    if (typeof applyMicButtons === 'function') applyMicButtons(area);
  }, 60);
}

// ═══════════════════════════════════════════════════════════════
//  MS Word جیسا Find (Ctrl+F) اور Replace (Ctrl+H) — editor (#ch173-doc)
// ═══════════════════════════════════════════════════════════════
let _zfrIdx = -1;

function _zimniBindFindReplace() {
  if (window._zfrBound) return;
  window._zfrBound = true;
  document.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = String(e.key || '').toLowerCase();
    if (k !== 'f' && k !== 'h') return;
    // Sirf tab jab editor (#ch173-doc) safhe par mojood ho
    const doc = (typeof _ch173Doc === 'function') ? _ch173Doc() : document.getElementById('ch173-doc');
    if (!doc) return;
    e.preventDefault();
    _zimniFindReplaceUI(k === 'h');
  }, true);
}
window._zimniBindFindReplace = _zimniBindFindReplace;

function _zfrMatches(term, matchCase) {
  const doc = (typeof _ch173Doc === 'function') ? _ch173Doc() : document.getElementById('ch173-doc');
  const out = [];
  if (!doc || !term) return out;
  const w = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, null);
  const t = matchCase ? term : term.toLowerCase();
  let n;
  while ((n = w.nextNode())) {
    const raw = n.nodeValue || '';
    const hay = matchCase ? raw : raw.toLowerCase();
    let i = 0;
    while ((i = hay.indexOf(t, i)) !== -1) { out.push({ node: n, start: i, end: i + term.length }); i += term.length; }
  }
  return out;
}

function _zfrSelect(m) {
  try {
    const r = document.createRange();
    r.setStart(m.node, m.start); r.setEnd(m.node, m.end);
    const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    const el = m.node.parentElement;
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  } catch (_) {}
}

function _zfrFindNext(back) {
  const box = document.getElementById('zfr-box'); if (!box) return;
  const term = box.querySelector('#zfr-find').value;
  const mc = box.querySelector('#zfr-mc').checked;
  const ms = _zfrMatches(term, mc);
  const cnt = box.querySelector('#zfr-count');
  if (!ms.length) { if (cnt) cnt.textContent = '0/0'; _zfrIdx = -1; return; }
  _zfrIdx = back ? (_zfrIdx <= 0 ? ms.length - 1 : _zfrIdx - 1)
                 : (_zfrIdx >= ms.length - 1 ? 0 : _zfrIdx + 1);
  _zfrSelect(ms[_zfrIdx]);
  if (cnt) cnt.textContent = (_zfrIdx + 1) + '/' + ms.length;
}

function _zfrReplaceOne() {
  const box = document.getElementById('zfr-box'); if (!box) return;
  const term = box.querySelector('#zfr-find').value;
  const rep  = box.querySelector('#zfr-rep-in') ? box.querySelector('#zfr-rep-in').value : '';
  const mc = box.querySelector('#zfr-mc').checked;
  const sel = window.getSelection();
  const cur = sel && sel.toString();
  const eq = mc ? (cur === term) : (String(cur).toLowerCase() === String(term).toLowerCase());
  if (cur && eq && sel.rangeCount) {
    const r = sel.getRangeAt(0);
    r.deleteContents(); r.insertNode(document.createTextNode(rep));
    try { _r173Dirty = true; } catch (_) {}
  }
  _zfrFindNext(false);
}

function _zfrReplaceAll() {
  const box = document.getElementById('zfr-box'); if (!box) return;
  const term = box.querySelector('#zfr-find').value;
  const rep  = box.querySelector('#zfr-rep-in') ? box.querySelector('#zfr-rep-in').value : '';
  const mc = box.querySelector('#zfr-mc').checked;
  const doc = (typeof _ch173Doc === 'function') ? _ch173Doc() : document.getElementById('ch173-doc');
  if (!doc || !term) return;
  let count = 0;
  const w = document.createTreeWalker(doc, NodeFilter.SHOW_TEXT, null);
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), mc ? 'g' : 'gi');
  let n;
  while ((n = w.nextNode())) {
    const before = n.nodeValue;
    const after = before.replace(re, () => { count++; return rep; });
    if (after !== before) n.nodeValue = after;
  }
  const cnt = box.querySelector('#zfr-count');
  if (cnt) cnt.textContent = count + ' بدلے';
  try { _r173Dirty = true; } catch (_) {}
}

function _zimniFindReplaceUI(withReplace) {
  let box = document.getElementById('zfr-box');
  if (box) {
    box.style.display = 'flex';
    box.querySelector('#zfr-rep-row').style.display = withReplace ? 'flex' : 'none';
    const f = box.querySelector('#zfr-find'); f.focus(); f.select();
    return;
  }
  box = document.createElement('div');
  box.id = 'zfr-box';
  box.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:100000;' +
    'background:var(--bg-card,#fff);border:1px solid #0369a1;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.28);' +
    "direction:rtl;padding:8px;display:flex;flex-direction:column;gap:6px;font-family:'Jameel Noori Nastaleeq',serif;min-width:300px;";
  const inp = "flex:1;min-width:0;border:1px solid var(--border,#cbd5e1);border-radius:6px;padding:5px 8px;font-size:14px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;outline:none;";
  const b = "border:1px solid var(--border,#cbd5e1);border-radius:6px;background:var(--bg-secondary,#f8fafc);cursor:pointer;padding:5px 9px;font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;";
  box.innerHTML = `
    <div style="display:flex;gap:6px;align-items:center;">
      <input id="zfr-find" placeholder="تلاش کریں…" style="${inp}">
      <span id="zfr-count" style="font-size:11px;color:var(--text-muted);min-width:38px;text-align:center;">0/0</span>
      <button id="zfr-prev" title="پچھلا" style="${b}">▲</button>
      <button id="zfr-next" title="اگلا" style="${b}">▼</button>
      <button id="zfr-x" title="بند" style="${b}">✕</button>
    </div>
    <div id="zfr-rep-row" style="display:${withReplace ? 'flex' : 'none'};gap:6px;align-items:center;">
      <input id="zfr-rep-in" placeholder="بدلیں…" style="${inp}">
      <button id="zfr-rep1" style="${b}">بدلیں</button>
      <button id="zfr-repall" style="${b}">سب بدلیں</button>
    </div>
    <label style="display:flex;align-items:center;gap:5px;font-size:12px;color:var(--text-secondary);">
      <input type="checkbox" id="zfr-mc"> حروف کا فرق (Case)
    </label>`;
  document.body.appendChild(box);
  box.querySelector('#zfr-next').onclick  = () => _zfrFindNext(false);
  box.querySelector('#zfr-prev').onclick  = () => _zfrFindNext(true);
  box.querySelector('#zfr-x').onclick     = () => { box.style.display = 'none'; };
  box.querySelector('#zfr-rep1').onclick  = () => _zfrReplaceOne();
  box.querySelector('#zfr-repall').onclick= () => _zfrReplaceAll();
  const fi = box.querySelector('#zfr-find');
  fi.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); _zfrFindNext(!!e.shiftKey); }
    if (e.key === 'Escape') { e.preventDefault(); box.style.display = 'none'; }
  });
  fi.addEventListener('input', () => { _zfrIdx = -1; });
  fi.focus();
}
window._zimniFindReplaceUI = _zimniFindReplaceUI;

// ═══════════════════════════════════════════════════════════════
//  فونٹ سائز — ضمنی کے اپنے خانوں پر (report173 کا _ch173FontToDoc
//  صرف چالان کی classes پر چلتا ہے، اسی لیے یہاں الگ ضروری ہے)
// ═══════════════════════════════════════════════════════════════
function _zimniDoc() {
  return (typeof _ch173Doc === 'function' && _ch173Doc()) || document.getElementById('ch173-doc');
}
window._zimniDoc = _zimniDoc;

function _zimniFontToDoc(pt) {
  const doc = _zimniDoc();
  if (!doc) return;
  doc.dataset.fs = pt;
  doc.style.fontSize = pt + 'pt';
  // PEHLE andar chipki purani naapein saaf (warna nayi naap un par nahi lagti)
  try {
    doc.querySelectorAll('.zf-meta *, .zf-body *, .zf-tbl td *, .zf-tbl th *')
       .forEach(el => { if (el.style && el.style.fontSize) el.style.fontSize = ''; });
  } catch (_) {}
  // Har woh hissa jis ki apni naap CSS mein likhi hai — usay seedha naap do
  // (عنوان "رپورٹ ضمنی" apni 20pt par rehta hai; usay badalna ho to matn chun kar badlein)
  const HISSE = ['.zf-formno', '.zf-zila', '.zf-meta', '.zf-lbl', '.zf-ln',
                 '.zf-tbl th', '.zf-tbl td', '.zf-bl', '.zf-bdyln', '.zf-body'].join(', ');
  try { doc.querySelectorAll(HISSE).forEach(el => { el.style.fontSize = pt + 'pt'; }); } catch (_) {}
  try { _r173Dirty = true; } catch (_) {}
}
window._zimniFontToDoc = _zimniFontToDoc;

// Dropdown se font — matn chuna ho to sirf usi par, warna poore safhe par
function _zimniSetFont(val) {
  const pt = parseFloat(val);
  if (!pt || isNaN(pt)) return;
  try { if (typeof _ch173RestoreRange === 'function') _ch173RestoreRange(); } catch (_) {}
  const fs = document.getElementById('ch173-font-sel');
  if (fs) fs.value = String(pt);                       // dropdown wapas na palte
  try {
    if (typeof _ch173FontToSelection === 'function' && _ch173FontToSelection(pt)) {
      if (typeof _ch173SaveRange === 'function') _ch173SaveRange();
      try { _r173Dirty = true; } catch (_) {}
      return;
    }
  } catch (_) {}
  _zimniFontToDoc(pt);
}
window._zimniSetFont = _zimniSetFont;

// ═══ B / I / U — cursor jahan ho wahan ki halat button par nazar aaye ═══
function _zimniSyncFmtBtns() {
  const doc = _zimniDoc();
  if (!doc) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount || !sel.anchorNode || !doc.contains(sel.anchorNode)) return;
  const st = (c) => { try { return document.queryCommandState(c); } catch (_) { return false; } };
  [['zf-btn-b','bold'], ['zf-btn-i','italic'], ['zf-btn-u','underline']].forEach(([id, cmd]) => {
    const b = document.getElementById(id);
    if (!b) return;
    const on = st(cmd);
    b.style.background = on ? '#0369a1' : 'var(--bg-card,#fff)';
    b.style.color      = on ? '#fff'    : 'var(--text-primary,#111)';
  });
  // Font dropdown bhi cursor ke mutabiq
  try {
    const selEl = document.getElementById('ch173-font-sel');
    if (selEl && document.activeElement !== selEl) {
      let n = sel.anchorNode; if (n.nodeType === 3) n = n.parentElement;
      if (n) {
        const px = parseFloat(getComputedStyle(n).fontSize);
        if (px) {
          const pt = Math.round(px * 0.75 * 2) / 2;
          if ([...selEl.options].some(op => parseFloat(op.value) === pt)) selEl.value = String(pt);
        }
      }
    }
  } catch (_) {}
}
window._zimniSyncFmtBtns = _zimniSyncFmtBtns;

// Formatting lagao + button ki halat foran update
function _zimniFmt(cmd) {
  try { if (typeof _ch173Fmt === 'function') _ch173Fmt(cmd); }
  catch (_) { try { document.execCommand(cmd, false, null); } catch (__) {} }
  setTimeout(_zimniSyncFmtBtns, 10);
}
window._zimniFmt = _zimniFmt;

// ═══════════════════════════════════════════════════════════════
//  ٹیبل کی لکیریں MOVEABLE — MS Word جیسی (چوڑائی + اونچائی)
// ═══════════════════════════════════════════════════════════════
function _zimniColResize() {
  const doc = _zimniDoc();
  const table = doc && doc.querySelector('table.zf-tbl');
  if (!table || table._zfResizeReady) return;
  table._zfResizeReady = true;
  const cols = [...table.querySelectorAll('colgroup col')];
  if (cols.length < 2) return;

  // ── Column ki BAYEN lakeer — chaurai badlo (RTL) ──
  [...table.querySelectorAll('thead th')].forEach((th, i) => {
    if (i + 1 >= cols.length) return;                     // aakhri column ke bayen kuch nahi
    const g = document.createElement('div');
    g.className = 'zf-colgrip';
    g.contentEditable = 'false';
    g.title = 'چوڑائی بدلنے کے لیے کھینچیں';
    th.appendChild(g);
    g.addEventListener('mousedown', (e) => {
      e.preventDefault(); e.stopPropagation();
      const tW = table.offsetWidth || 1;
      const startX = e.clientX;
      const wA = parseFloat(cols[i].style.width)     || (100 / cols.length);
      const wB = parseFloat(cols[i + 1].style.width) || (100 / cols.length);
      document.body.style.cursor = 'col-resize';
      const onMove = (ev) => {
        const dx = (startX - ev.clientX) / tW * 100;      // RTL
        const nA = wA + dx, nB = wB - dx;
        if (nA < 3 || nB < 3) return;
        cols[i].style.width     = nA.toFixed(2) + '%';
        cols[i + 1].style.width = nB.toFixed(2) + '%';
      };
      const onUp = () => {
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        document.body.style.cursor = '';
        try { _r173Dirty = true; } catch (_) {}
      };
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  });

  // ── Header ki NEECHE wali lakeer — header ki unchai badlo ──
  const hRow = table.querySelector('thead tr');
  if (hRow) {
    hRow.querySelectorAll('th').forEach(th => {
      const g = document.createElement('div');
      g.className = 'zf-rowgrip';
      g.contentEditable = 'false';
      g.title = 'اونچائی بدلنے کے لیے کھینچیں';
      th.appendChild(g);
      g.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startY = e.clientY, startH = hRow.offsetHeight;
        document.body.style.cursor = 'row-resize';
        const onMove = (ev) => {
          const nh = startH + (ev.clientY - startY);
          if (nh < 26) return;
          hRow.querySelectorAll('th').forEach(c => { c.style.height = nh + 'px'; });
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          try { _r173Dirty = true; } catch (_) {}
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }

  // ── Data row ki NEECHE wali lakeer — qatar ki unchai ──
  const bRow = table.querySelector('tbody tr');
  if (bRow) {
    bRow.querySelectorAll('td').forEach(td => {
      const g = document.createElement('div');
      g.className = 'zf-rowgrip';
      g.contentEditable = 'false';
      g.title = 'اونچائی بدلنے کے لیے کھینچیں';
      td.appendChild(g);
      g.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startY = e.clientY, startH = bRow.offsetHeight;
        document.body.style.cursor = 'row-resize';
        const onMove = (ev) => {
          const nh = startH + (ev.clientY - startY);
          if (nh < 80) return;
          bRow.querySelectorAll('td').forEach(c => { c.style.height = nh + 'px'; });
        };
        const onUp = () => {
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.body.style.cursor = '';
          try { _r173Dirty = true; } catch (_) {}
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
      });
    });
  }
}
window._zimniColResize = _zimniColResize;

// Grips مکمل طور پر دکھاوے کے لیے ہیں — محفوظ/چھپائی سے پہلے ہٹا دیے جاتے ہیں
function _zimniCleanHTML(html) {
  return String(html || '').replace(/<div[^>]*class="zf-(col|row)grip"[^>]*><\/div>/g, '');
}
window._zimniCleanHTML = _zimniCleanHTML;

// Berooni Zimni form ki CSS (editor + print) — sab #ch173-doc ke andar, naap pt mein.
function _zimniFormCSS() {
  return `
  /* ── HEADER ── form no + رپورٹ ضمنی page ke CENTER; ضلع top-LEFT usi seedh mein ── */
  #ch173-doc .zf-head{ direction:rtl; margin-bottom:6px; line-height:1.5; }
  #ch173-doc .zf-formno{ font-size:16pt; font-weight:600; direction:ltr; text-align:center; margin-bottom:4px; }
  #ch173-doc .zf-titlerow{ position:relative; text-align:center; min-height:1.6em; }
  #ch173-doc .zf-title{ font-size:20pt; font-weight:700; text-decoration:underline; text-underline-offset:5px; line-height:1.5; }
  #ch173-doc .zf-berooni{ font-size:14pt; font-weight:700; }              /* (بیرونی) — 14pt */
  #ch173-doc .zf-zila{ position:absolute; left:0; top:0; font-size:16pt; font-weight:normal; white-space:nowrap; }

  /* ── METADATA (table ke ooper ka poora hissa) ── 16pt, bold nahi, spacing 1.5 ── */
  #ch173-doc .zf-meta{ margin:10px 0 8px; font-size:16pt; font-weight:normal; direction:rtl; line-height:1.5; }
  #ch173-doc .zf-mrow{ display:flex; gap:22px; flex-wrap:wrap; align-items:baseline; margin-bottom:7px; direction:rtl; }
  #ch173-doc .zf-mrow2{ display:flex; gap:22px; align-items:baseline; margin-bottom:7px; direction:rtl; }
  #ch173-doc .zf-half{ flex:1 1 0; display:flex; align-items:baseline; gap:8px; min-width:0; }
  #ch173-doc .zf-fld{ display:flex; align-items:baseline; gap:6px; }
  #ch173-doc .zf-fld.grow{ flex:1; }
  #ch173-doc .zf-lbl{ font-weight:normal; white-space:nowrap; }
  #ch173-doc .zf-ln{ flex:1; min-width:40px; padding:0 4px; outline:none; unicode-bidi:plaintext; }

  /* ── MAIN TABLE ── */
  #ch173-doc table.zf-tbl{ width:100%; border-collapse:collapse; table-layout:fixed; direction:rtl; }
  #ch173-doc table.zf-tbl thead{ display:table-header-group; }
  /* ROW 1 (header) — 16pt, BOLD nahi */
  #ch173-doc table.zf-tbl th{ border:1px solid #000; padding:6px 5px; font-size:16pt; font-weight:normal;
    text-align:center; line-height:1.5; vertical-align:middle; position:relative; }
  /* ROW 2 (data) — justified; column 3 (حالات) 14pt + spacing 1.5 */
  #ch173-doc table.zf-tbl td{ border:1px solid #000; padding:8px 9px; font-size:14pt; vertical-align:top;
    line-height:1.5; text-align:justify; text-align-last:right; overflow-wrap:anywhere; word-break:break-word; position:relative; }
  #ch173-doc td.zf-c-action{ text-align:center; text-align-last:center; }
  #ch173-doc td.zf-c-serial{ text-align:center; text-align-last:center; }
  #ch173-doc table.zf-tbl tbody td{ height:21cm; }
  /* Bahar ki DAYEN, BAYEN aur NEECHE ki lines nahi */
  #ch173-doc .zf-tbl tr > th:first-child, #ch173-doc .zf-tbl tr > td:first-child{ border-right:none; }
  #ch173-doc .zf-tbl tr > th:last-child,  #ch173-doc .zf-tbl tr > td:last-child{ border-left:none; }
  #ch173-doc .zf-tbl tbody td{ border-bottom:none; }
  /* body cell — 14pt, spacing 1.5, koi dotted line nahi */
  #ch173-doc .zf-bl{ margin-bottom:6px; font-size:14pt; line-height:1.5; }
  #ch173-doc .zf-bdyln{ display:inline; border:none; outline:none; }
  #ch173-doc .zf-body{ margin-top:8px; font-size:14pt; line-height:1.5; text-align:justify; text-align-last:right; outline:none; }

  /* ── Table ki lakeerein MOVEABLE (MS Word jaisi) ── */
  #ch173-doc .zf-colgrip{ position:absolute; top:0; left:-3px; width:7px; height:100%;
    cursor:col-resize; user-select:none; z-index:6; }
  #ch173-doc .zf-colgrip:hover{ background:rgba(56,189,248,.35); }
  #ch173-doc .zf-rowgrip{ position:absolute; bottom:0; left:0; width:100%; height:9px;
    cursor:row-resize; user-select:none; z-index:6; }
  #ch173-doc .zf-rowgrip:hover{ background:rgba(56,189,248,.45); }
  @media print{ #ch173-doc .zf-colgrip, #ch173-doc .zf-rowgrip{ display:none !important; } }

  /* Paste kiya hua matn hamesha Nastaliq */
  #ch173-doc .zf-body *, #ch173-doc .zf-tbl td *, #ch173-doc .zf-meta *{
    font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif !important;
  }
  @media print{ #ch173-doc table.zf-tbl thead{ page-break-inside:avoid; } }`;
}

// Default document body — editable بیرونی Zimni form (Police Form 25-54(1))
// Fixed chrome (headings/labels/table header) = contenteditable=false.
// Fill-in values + main body = editable. Known fields pre-filled from case/officer.
function _zimniDefaultBody(o, c) {
  o = o || {}; c = c || {};
  const z = _zimniActive || {};
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : (v == null ? '' : String(v));
  const D = (v) => v ? ((typeof formatDate === 'function') ? formatDate(v) : v) : '';
  const year = new Date().getFullYear();
  const io = (typeof getIOSignLine === 'function') ? getIOSignLine()
           : ((o.full_name || '') + (o.designation ? ' ' + o.designation : '') + (o.station ? ' تھانہ ' + o.station : ''));
  // ── Auto-fetch (case + officer record se) ──
  const district = E(o.district || '');
  const thana    = E(o.station || '');
  const firNo    = E(c.fir_number || '');
  const firDate  = E(D(c.fir_date || ''));                                   // مورخہ = FIR کی تاریخ
  const waqoia   = E([D(c.occurrence_date || ''),
                      (c.place_of_occurrence || c.occurrence_place || c.jaye_waqoia || '')]
                      .filter(Boolean).join(' '));                          // تاریخ و مقام وقوعہ
  const behad    = E(c.behad || c.distance || c.samt || '');                // بحد
  const jurm     = E(((c.section_of_law || '') + ' ' + (c.offence_type || '')).trim());
  const compl    = E(c.complainant_name || c.complainant || '');
  const serial   = E(z.serial_no || '');
  const ioE      = E(io);

  return `
  <div class="zf-head">
    <div class="zf-formno">پولیس فارم نمبر&nbsp;25—54(1)</div>
    <div class="zf-titlerow">
      <span class="zf-zila" data-k="zila">ضلع ${district}</span>
      <span class="zf-title">رپورٹ ضمنی <span class="zf-berooni">(بیرونی)</span></span>
    </div>
  </div>

  <div class="zf-meta">
    <div class="zf-mrow">
      <div class="zf-fld grow"><span class="zf-lbl">تھانہ۔</span><span class="zf-ln" data-k="thana">${thana}</span></div>
      <div class="zf-fld"><span class="zf-lbl">سال</span><span class="zf-ln" data-k="saal" style="min-width:70px">${year}</span></div>
      <div class="zf-fld"><span class="zf-lbl">ضمنی نمبر</span><span class="zf-ln" data-k="zno" style="min-width:70px">${serial}</span></div>
    </div>
    <div class="zf-mrow2">
      <div class="zf-half"><span class="zf-lbl">مقدمہ نمبر</span><span class="zf-ln" data-k="fir">${firNo}</span><span class="zf-lbl">مورخہ</span><span class="zf-ln" data-k="fdate">${firDate}</span></div>
      <div class="zf-half"><span class="zf-lbl">تھانہ میں پہنچنے کا وقت و تاریخ</span><span class="zf-ln" data-k="arrival"></span></div>
    </div>
    <div class="zf-mrow2">
      <div class="zf-half"><span class="zf-lbl">تاریخ و مقام وقوعہ۔</span><span class="zf-ln" data-k="waqoia">${waqoia}</span></div>
      <div class="zf-half"><span class="zf-lbl">تھانہ سے روانگی کا وقت و تاریخ</span><span class="zf-ln" data-k="depart"></span></div>
    </div>
    <div class="zf-mrow">
      <div class="zf-fld"><span class="zf-lbl">بحد۔</span><span class="zf-ln" data-k="behad" style="min-width:120px">${behad}</span></div>
      <div class="zf-fld grow"><span class="zf-lbl">جرم۔</span><span class="zf-ln" data-k="jurm">${jurm}</span></div>
    </div>
  </div>

  <table class="zf-tbl">
    <colgroup>
      <col style="width:14%"><col style="width:7%"><col style="width:55%"><col style="width:24%">
    </colgroup>
    <thead>
      <tr>
        <th class="zf-c-action">تاریخ و وقت<br>کارروائی</th>
        <th class="zf-c-serial">رپورٹ نمبر شمار<br>سلسلہ وار</th>
        <th class="zf-c-body">حالاتِ تفتیش</th>
        <th class="zf-c-from">از۔</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="zf-c-action" data-k="action"></td>
        <td class="zf-c-serial" data-k="serial">${serial}</td>
        <td class="zf-c-body" colspan="2">
          <div class="zf-bl"><span class="zf-lbl">سرکار بذریعہ ۔</span> <span class="zf-bdyln" data-k="sarkar">${compl}</span></div>
          <div class="zf-bl"><span class="zf-lbl">بنام۔</span> <span class="zf-bdyln" data-k="banam"></span></div>
          <div class="zf-bl">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="zf-lbl">مرتبہ ۔</span> <span class="zf-bdyln" data-k="murattib">${ioE}</span></div>
          <div class="zf-body" data-mic="true" data-k="halaat"><br></div>
        </td>
      </tr>
    </tbody>
  </table>`;
}

// ── SAVE ──────────────────────────────────────────────────────
async function _saveZimni() {
  const ed = (typeof _ch173Doc === 'function' && _ch173Doc()) || document.getElementById('ch173-doc');
  if (!ed) return;
  const bodyHtml = _zimniCleanHTML(ed.innerHTML);   // grips (کھینچنے والی پٹیاں) محفوظ نہ ہوں
  const z = _zimniActive || {};
  // ضمنی نمبر ab EDITABLE hai — doc ke field se parho (khali ho to purana/1)
  let serialNo = z.serial_no || 1;
  try {
    const sf = ed.querySelector('[data-k="zno"]') || ed.querySelector('[data-k="serial"]');
    const sv = sf ? parseInt(String(sf.innerText || sf.textContent).replace(/[^\d]/g, ''), 10) : NaN;
    if (!isNaN(sv) && sv > 0) serialNo = sv;
  } catch (_) {}
  z.serial_no = serialNo;
  const savedAt = new Date().toISOString();
  const rec = {
    case_id: _zimniCaseId,
    serial_no: serialNo,
    report_date: savedAt.slice(0,10),
    content: { bodyHtml, saved_at: savedAt },   // waqت bhi (challan jaisa: تاریخ + وقت + نمبر)
  };
  // محفوظ فائلوں کی فہرست میں درج (نمبر شمار + تاریخ)
  try {
    if (typeof dioRegisterSaved === 'function')
      dioRegisterSaved('zimni', 'ضمنی نمبر ' + serialNo,
        { case_id: _zimniCaseId, serial_no: serialNo });
  } catch(_) {}
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    let savedRec = null;
    if (z.id) {
      const { data } = await supabaseClient.from('zimni_reports').update(rec).eq('id', z.id).select().single();
      savedRec = data || { ...rec, id: z.id };
      const idx = _zimniList.findIndex(x => x.id === z.id);
      if (idx >= 0) _zimniList[idx] = savedRec;
    } else {
      const { data, error } = await supabaseClient.from('zimni_reports').insert(rec).select().single();
      if (error) throw error;
      savedRec = data || { ...rec, id: 'tmp_'+Date.now() };
      _zimniList.push(savedRec);
    }
    _zimniActive = savedRec;
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
    showToast('✅ ضمنی محفوظ ہو گئی', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _deleteZimni(id) {
  if (!confirm('کیا آپ یہ ضمنی حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('zimni_reports').delete().eq('id', id);
    _zimniList = _zimniList.filter(z => z.id !== id);
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
    _renderZimniList();
    showToast('🗑️ حذف ہو گئی', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── PRINT (only the document — MS-Word rule) ──────────────────
function _printZimni() {
  const ed = (typeof _ch173Doc === 'function' && _ch173Doc()) || document.getElementById('ch173-doc');
  if (!ed) return;
  _zimniPrintDoc(_zimniCleanHTML(ed.innerHTML));
}

// چالان/اخراج jaisa print: kaghaz + margins (1cm / _ch173SideMargin) report173 se,
// CSS bhi report173 (_ch173CSS) + zimni form CSS — screen aur print bilkul aik.
function _zimniPrintHTML(inner) {
  const paper = (typeof _ch173Paper !== 'undefined') ? _ch173Paper : 'legal';
  const side  = (typeof _ch173SideMargin === 'function') ? _ch173SideMargin() : '0.2cm';
  const size  = (paper === 'a4') ? 'A4 portrait' : '8.5in 13in';
  const css173 = (typeof _ch173CSS === 'function') ? _ch173CSS() : '';
  return `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page{ size:${size}; margin:1cm ${side}; }
      *{ -webkit-print-color-adjust:exact; print-color-adjust:exact; box-sizing:border-box; }
      html,body{ margin:0; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Tahoma',sans-serif;
            direction:rtl; text-align:justify; color:#000; line-height:1.4; }
      ${css173}
      ${_zimniFormCSS()}
      /* Print overrides — sirf working document (koi toolbar/button nahi) */
      #ch173-doc{ width:100% !important; max-width:none !important; height:auto !important;
        min-height:0 !important; padding:0 !important; margin:0 !important;
        transform:none !important; box-shadow:none !important; border-radius:0 !important; }
      #ch173-doc table.zf-tbl thead{ display:table-header-group !important; page-break-inside:avoid; }
      .no-print, button, select{ display:none !important; }
      #ch173-doc, #ch173-doc *{ orphans:2; widows:2; }
    </style></head><body><div id="ch173-doc">${inner}</div></body></html>`;
}
window._zimniPrintHTML = _zimniPrintHTML;

function _zimniPrintDoc(inner) {
  const html = _zimniPrintHTML(inner);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// ═══════════════════════════════════════════════════════════════
//  ضمنیات — fehrist ke ایکشن buttons (پرنٹ / بھیجیں / PDF)
// ═══════════════════════════════════════════════════════════════

// Aik ضمنی ka poora chhapne wala safha — sirf working document
function _zimniDocHTML(z) {
  const c = z.content || {};
  return _zimniPrintHTML(c.bodyHtml || '');
}

function _zimniById(id) { return (_zimniList || []).find(z => String(z.id) === String(id)); }

// 🖨️ Aik ضمنی print
function _printZimniById(id) {
  const z = _zimniById(id);
  if (!z) { if (typeof showToast === 'function') showToast('⚠️ ضمنی نہیں ملی', 'error'); return; }
  const html = _zimniDocHTML(z);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// 🖨️ Tamam ضمنیاں aik saath
function _printAllZimni() {
  if (!_zimniList || !_zimniList.length) {
    if (typeof showToast === 'function') showToast('⚠️ کوئی ضمنی موجود نہیں', 'info'); return;
  }
  const body = _zimniList.map((z, i) => {
    const c = z.content || {};
    const brk = (i < _zimniList.length - 1) ? 'style="page-break-after:always;"' : '';
    return `<div ${brk}>${c.bodyHtml || ''}</div>`;
  }).join('');
  const html = _zimniPrintHTML(body);
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}

// 📄 PDF — print window se "Save as PDF"
function _pdfZimni(id) {
  if (typeof showToast === 'function')
    showToast('📄 پرنٹ ونڈو میں "Save as PDF" منتخب کریں', 'info', 4000);
  _printZimniById(id);
}

// ✉️ Bhejna — share sheet ya email
async function _emailZimni(id) {
  const z = _zimniById(id);
  if (!z) return;
  const c    = z.content || {};
  const dt   = z.report_date ? (typeof formatDate === 'function' ? formatDate(z.report_date) : z.report_date) : '';
  const text = (c.bodyHtml || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/\n{3,}/g, '\n\n').trim();
  const subj = `ضمنی نمبر ${z.serial_no || ''}${dt ? ' — ' + dt : ''}`;
  try {
    if (navigator.share) { await navigator.share({ title: subj, text: subj + '\n\n' + text }); return; }
  } catch (_) {}
  try {
    window.location.href = 'mailto:?subject=' + encodeURIComponent(subj) + '&body=' + encodeURIComponent(text);
  } catch (_) {
    try { await navigator.clipboard.writeText(subj + '\n\n' + text);
      if (typeof showToast === 'function') showToast('📋 نقل ہو گیا', 'success'); } catch (__) {}
  }
}

window._printZimniById = _printZimniById;
window._printAllZimni  = _printAllZimni;
window._pdfZimni       = _pdfZimni;
window._emailZimni     = _emailZimni;
window._zimniDocHTML   = _zimniDocHTML;
