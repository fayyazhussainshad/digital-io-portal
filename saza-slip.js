/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — سزا سلپ  (Saza Slip · فارم نمبر27-2(1)(الف))
   ───────────────────────────────────────────────────────────
   Poore-safhe ka editor — bilkul report173.js (چالان) jaisa:
     • Fixed toolbar (B/I/U · alignment · font size · undo/redo ·
       محفوظ · پرنٹ) — چالان ke _chBtn() jaise buttons.
     • Chip patti (misal-doc-bar) پیچھے چلی جاتی ہے aur cursor
       ooper le jane par jhalak (peek) jati hai — چالان ka
       _ch173FocusMode jaisa.
     • Safha asal kaghaz ki naap par (لیگل 8.5×13 / A4) — چالان
       ka _ch173FullPage/_ch173FitPaper jaisa.
     • کالم 2 (تاریخ گرفتاری) aur کالم 3 (جرم) ka matn 270° khada
       (writing-mode) — har ملزم ke saamne.
     • ملزمان dropdown (▾) — چالان ke _ch173AccPicker jaisa: system
       (case_accused) se naam chun kar کالم 1 mein.
     • Table ke bayen/dayen BAAHRI kinare khule (sirf andar ki
       lakeerein).
     • Table ke NEECHE koi izafi text field NAHI — sirf SHO block
       (dastkhat ki jagah → naam bold underline → تاریخ).
     • Doosre safhe par (chapai): zimni jaisa — aik satar ki jagah
       + bayen ooper kone mein مثلث (triangle bind mark). Headings
       doosre safhe par NAHI dohrati.
     • Margins report173 ke mutabiq (1cm ooper/neeche, side tang).

   FONT: sab 14pt (چالان ka default). عنوان "سزاسلپ" 24pt underline.
   فارم نمبر 12pt. ضلع/تھانہ 14pt. Sab pt mein (px kahin nahi).

   DATA (case_accused — mulziman.js se confirmed columns):
     name · cnic · mobile · arrest_date(YYYY-MM-DD) · pesha ·
     rang · chehra · jism · qad · umar · nishan · taleem
     (ولدیت/قومیت/سکونت columns MOJOOD NAHI — حلیہ un sub-fields
      se banta hai, mulziman ke _accViewDetail jaisa.)

   CHIP: misal-docs.js ki MISAL_CASE_DOCS mein 'saza_slip' pehle se
   darj hai. Us ki chip dabane par yeh module khule — is ke liye
   misal-docs.js ke _openMisalEditor() / _doAddMisalDoc() mein aik
   chhoti si "special" shart add ki gayi hai (jaise statements_161,
   cro_card waghera ke liye hai). Baqi kahin haath nahi lagaya.
   ═══════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────────
let _sazaCaseId = null;
let _sazaCase = null;
let _sazaAccused = null;   // case_accused (raw)
let _sazaDirty = false;
let _sazaPaper = (function () {
  try { return localStorage.getItem('dio_saza_paper') || 'legal'; } catch (_) { return 'legal'; }
})();

// ═══ ENTRY POINT — chip se yahi khulta hai ═══
async function openSazaSlip(caseId) {
  _sazaAccused = null;
  _sazaCaseId = caseId
    || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
    || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _sazaCaseId) {
    try { _sazaCase = await getCase(_sazaCaseId); } catch (_) { _sazaCase = null; }
  }
  await _sazaLoadSaved();
  await _sazaLoadAccused();
  // Full-page tab kholo (misal-docs ka tab nizam) — jaise چالان karta hai
  if (typeof _dioOpenDocTab === 'function') { try { _dioOpenDocTab('saza_slip'); } catch (_) {} }
  _sazaRender();
}
window.openSazaSlip = openSazaSlip;

// Saved form_data (case_documents.content) — aik hi saza slip per case
async function _sazaLoadSaved() {
  _sazaSaved = {};
  try {
    if (typeof _misalDocs !== 'undefined' && _misalDocs && _misalDocs['saza_slip']
        && _misalDocs['saza_slip'].content) {
      _sazaSaved = _misalDocs['saza_slip'].content || {};
    }
  } catch (_) { _sazaSaved = {}; }
}
let _sazaSaved = {};

async function _sazaLoadAccused() {
  const cid = _sazaCaseId;
  if (!cid) { _sazaAccused = []; return; }
  try {
    const { data } = await supabaseClient.from('case_accused')
      .select('*').eq('case_id', cid).order('created_at', { ascending: true });
    _sazaAccused = data || [];
  } catch (_) {
    try { _sazaAccused = JSON.parse(localStorage.getItem('dio_accused_' + cid) || '[]'); }
    catch (_2) { _sazaAccused = []; }
  }
}

// FIR ke ملزمان (dropdown + block ke liye)
// name khane mein aksar ولدیت/قومیت/سکونت pehle se shamil hota hai
// (mulziman card isi tarah save karta hai). پیشہ aur حلیہ ALAG —
// yeh DOOSRI satar (body description) mein jate hain.
function _sazaAccList() {
  return (_sazaAccused || []).map(a => ({
    name: (a.name || '').trim(),
    cnic: (a.cnic || '').trim(),
    pesha: (a.pesha || '').trim(),
    arrest_date: a.arrest_date || '',
    halia: _sazaHalia(a),
  })).filter(a => a.name);
}

// ═══ جرم — "ت پ" (تعزیراتِ پاکستان) ka qanoon — report173 (_ch173JurmParts)
//    ka BILKUL wahi tareeqa: دفعات (body) aur "ت پ" (suffix) ALAG. Body LTR-
//    isolate, ت پ RTL — is se ت پ hamesha دفعات ke BAAD, bayen kinare par. ═══
const SAZA_TP_RE = /[\s،,\-]*(ت\s*\.?\s*پ|تعزیرات\s*پاکستان)\s*$/;
function _sazaJurmParts(raw, savedSuf) {
  const txt = String(raw || '').trim();
  const m = txt.match(SAZA_TP_RE);
  const body = m ? txt.slice(0, m.index).trim() : txt;
  let suffix;
  if (savedSuf !== undefined && savedSuf !== null) suffix = String(savedSuf);
  else if (m) suffix = m[1].replace(/\s+/g, ' ').trim();
  else suffix = body ? 'ت پ' : '';       // dafaat hon to hi ت پ lagao
  return { body, suffix };
}
// Sirf plain text (fallback/save ke liye) — body + ت پ
function _sazaOffenceWithTP(raw) {
  const p = _sazaJurmParts(raw);
  return p.body ? (p.body + (p.suffix ? ' ' + p.suffix : '')) : '';
}

// حلیہ — sub-fields se (mulziman _accViewDetail jaisa)
function _sazaHalia(a) {
  return [
    a.rang && ('رنگ: ' + a.rang),
    a.chehra && ('چہرہ: ' + a.chehra),
    a.jism && ('جسم: ' + a.jism),
    a.qad && ('قد: ' + a.qad),
    a.umar && ('عمر: ' + a.umar),
    a.nishan && ('نشان: ' + a.nishan),
  ].filter(Boolean).join(' ، ');
}

// ── SIDE MARGIN (report173 ke mutabiq) ──
function _sazaSideMargin() { return (_sazaPaper === 'a4') ? '0.5cm' : '0.2cm'; }

function _sazaSetPaper(v) {
  _sazaPaper = v;
  try { localStorage.setItem('dio_saza_paper', v); } catch (_) {}
  _sazaRender();
}
window._sazaSetPaper = _sazaSetPaper;

// ═══ RENDER — poore safhe ka editor ═══
function _sazaRender() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _sazaCase || {};
  const sv = _sazaSaved || {};
  const v = (k, def) => (typeof sanitizeHtml === 'function'
    ? sanitizeHtml(sv[k] !== undefined ? sv[k] : (def || ''))
    : (sv[k] !== undefined ? sv[k] : (def || '')));

  // Chune hue ملزمان — saved se (warna khali; system ke tamam KHUD nahi bharte)
  try { _sazaChosen = sv.acc ? (JSON.parse(sv.acc) || []) : []; } catch (_) { _sazaChosen = []; }

  const fir = c.fir_number || '';
  const firDate = (typeof formatDate === 'function') ? formatDate(c.fir_date) : (c.fir_date || '');
  const offence = ((c.section_of_law || '') + (c.offence_type ? ' ' + c.offence_type : '')).trim();

  // Rows: saved ho to wahi, warna system ke ملزمان se, warna aik khali row.
  const rows = _sazaBuildRows(sv, c, o);

  const docFont = _sazaDocFont(sv);

  area.innerHTML = `
  <style>${_sazaCSS()}</style>
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- ── FIXED TOOLBAR (report173 jaisa) ── -->
    <div class="no-print" style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <span style="font-family:'Jameel Noori Nastaleeq',serif;font-size:15px;font-weight:700;color:var(--accent);">📜 سزا سلپ</span>
      <select id="saza-paper-sel" onchange="_sazaSetPaper(this.value)" title="کاغذ کا سائز"
        style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
        <option value="legal" ${_sazaPaper==='legal'?'selected':''}>لیگل (8.5×13)</option>
        <option value="a4" ${_sazaPaper==='a4'?'selected':''}>A4 (8.27×11.7)</option>
      </select>
      <span style="font-size:11px;color:var(--text-muted);">↔ ملزم شامل کرنے کے لیے کالم 1 میں ▾ دبائیں</span>
      <div style="margin-right:auto;display:flex;gap:6px;align-items:center;">
        <button onmousedown="event.preventDefault()" onclick="_sazaFmt('bold')" title="بولڈ" style="${_sazaBtn()}font-weight:900;">B</button>
        <button onmousedown="event.preventDefault()" onclick="_sazaFmt('italic')" title="ترچھا" style="${_sazaBtn()}font-style:italic;">I</button>
        <button onmousedown="event.preventDefault()" onclick="_sazaFmt('underline')" title="انڈر لائن" style="${_sazaBtn()}text-decoration:underline;">U</button>
        <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
        <button onmousedown="event.preventDefault()" onclick="_sazaFmt('justifyRight')" title="دائیں سیدھ" style="${_sazaBtn()}">⇥</button>
        <button onmousedown="event.preventDefault()" onclick="_sazaFmt('justifyCenter')" title="درمیان" style="${_sazaBtn()}">⇔</button>
        <button onmousedown="event.preventDefault()" onclick="_sazaFmt('justifyLeft')" title="بائیں سیدھ" style="${_sazaBtn()}">⇤</button>
        <button onmousedown="event.preventDefault()" onclick="_sazaFmt('justifyFull')" title="دونوں طرف برابر" style="${_sazaBtn()}">☰</button>
        <span style="width:1px;height:22px;background:var(--border,#ccc);margin:0 4px;"></span>
        <select id="saza-font-sel" onchange="_sazaSetFont(this.value)" title="فونٹ سائز"
          style="height:28px;border:1px solid var(--border,#ccc);border-radius:6px;background:var(--bg-card,#fff);color:var(--text-primary,#111);font-size:13px;padding:0 6px;margin:0 1px;cursor:pointer;">
          ${SAZA_FONT_SIZES.map(s => `<option value="${s}" ${String(s)===String(docFont)?'selected':''}>${s}</option>`).join('')}
        </select>
        <button onmousedown="event.preventDefault()" onclick="_sazaFmt('undo')" title="واپس" style="${_sazaBtn()}">↶</button>
        <button onmousedown="event.preventDefault()" onclick="_sazaFmt('redo')" title="دوبارہ" style="${_sazaBtn()}">↷</button>
        <button class="btn btn-primary btn-sm dio-modbtn" onclick="_sazaSave()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_sazaPrint()">🖨️ پرنٹ کریں</button>
      </div>
    </div>

    <!-- ── PAGE AREA ── -->
    <div style="flex:1;overflow:auto;min-height:0;padding:16px;background:var(--bg-tertiary);">
      <div id="saza-doc" data-fs="${esc(String(docFont))}" style="width:${_sazaPaper==='a4'?'8.27in':'8.5in'};max-width:none;min-height:${_sazaPaper==='a4'?'11.7in':'13in'};margin:0 auto;
           padding:1cm ${_sazaSideMargin()};
           background:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;
           line-height:1.4;box-sizing:border-box;font-size:${docFont}pt;">

        <!-- Line 1: فارم نمبر (center, 12pt) -->
        <div class="saza-formno">فارم نمبر27-2(1)(الف)</div>

        <!-- Line 2: تھانہ (right, 1in) · سزاسلپ (center, 24pt underline) · ضلع (left) -->
        <div class="saza-title-row">
          <span class="saza-tt-right">تھانہ <span class="fl" contenteditable="true" data-k="thana">${v('thana', esc(o.station||''))}</span></span>
          <span class="saza-tt-mid">سزاسلپ</span>
          <span class="saza-tt-left">ضلع <span class="fl" contenteditable="true" data-k="zila">${v('zila', esc(o.district||''))}</span></span>
        </div>

        <!-- Line 3: FIR no / date / جرم (body LTR + "ت پ" suffix — report173 jaisa) -->
        <div class="saza-caseline">
          <span>مقدمہ نمبر <span class="fl" contenteditable="true" data-k="cl_fir">${v('cl_fir', esc(fir))}</span></span>
          <span>مورخہ <span class="fl" contenteditable="true" data-k="cl_date">${v('cl_date', esc(firDate))}</span></span>
          <span>جرم <span class="fl fl-lg" contenteditable="true" data-k="cl_jurm">${v('cl_jurm', esc(_sazaJurmParts(c.section_of_law || c.offence_type).body))}</span> <span class="fl fl-suf" contenteditable="true" data-k="cl_jurm_suf">${v('cl_jurm_suf', esc(_sazaJurmParts(c.section_of_law || c.offence_type).suffix))}</span></span>
        </div>

        <!-- ── TABLE: 4 columns · headings row + AIK data row ── -->
        <table class="saza-table" id="saza-table">
          <colgroup>
            ${(function(){
              let w = [45,10,10,35];
              try { const s = JSON.parse(sv.col_w || 'null'); if (Array.isArray(s) && s.length===4) w = s; } catch(_){}
              return w.map(x => `<col style="width:${x}%">`).join('');
            })()}
          </colgroup>
          <thead>
            <tr>
              <th class="saza-h1">نام ولدیت قومیت سکونت حلیہ و پیشہ ملزم <button class="saza-acc-pick no-print" onclick="_sazaAccPicker(event)" title="ملزمان منتخب کریں">▾</button></th>
              <th class="saza-h2">تاریخ گرفتاری</th>
              <th class="saza-h3">جرم</th>
              <th class="saza-h4">حکم اخیر عدالت</th>
            </tr>
          </thead>
          <tbody id="saza-tbody">
            ${rows}
          </tbody>
        </table>

        <input type="hidden" data-k="doc_font" value="${esc(String(docFont))}">
      </div>
    </div>
  </div>`;

  _sazaFullPage(area);
  _sazaBlockFloatBar();
  setTimeout(() => {
    _sazaFullPage(area);
    _sazaBindKeys();
    _sazaFocusMode(true);
    // Saved doc font wapas lagao
    try { const df = _sazaDocFont(sv); if (df) _sazaFontToDoc(df); } catch (_) {}
    // کالم ki lakeerein khiska kar chaurai badalne wale handle
    try { _sazaMakeResizable(); } catch (_) {}
    // Table ki lakeerein safhe ke NEECHE tak (default) — data row ko phailao
    try { _sazaStretchTable(); } catch (_) {}
    [250, 800].forEach(ms => setTimeout(() => { try { _sazaStretchTable(); } catch (_) {} }, ms));
    window.addEventListener('resize', () => { try { _sazaFitPaper(); _sazaStretchTable(); } catch (_) {} });
    if (typeof applyAutoDirection === 'function') { try { applyAutoDirection(area); } catch (_) {} }
  }, 60);
}
window._sazaRender = _sazaRender;

// ═══ Table ki lakeerein safhe ke NEECHE tak (default) ═══
// Aakhri qatar (SHO wali) ki unchai itni kar do ke table ka neecha kinara
// safhe ke neeche wale hashiye tak pohanche — magar SIRF SCREEN par. Print
// par yeh naap nahi lagti (warna table page 2 par chala jata tha).
function _sazaStretchTable() {
  const doc = _sazaDoc(); if (!doc) return;
  const table = doc.querySelector('#saza-table'); if (!table) return;
  // Aakhri qatar ka کالم 1 khana (SHO wala) — usay barhao
  const lastC1 = doc.querySelector('#saza-tbody tr:last-child .saza-c1'); if (!lastC1) return;
  const IN = 96;
  const pageH = ((_sazaPaper === 'a4') ? 11.7 : 13) * IN;
  let padB = 0;
  try { padB = parseFloat(getComputedStyle(doc).paddingBottom) || 0; } catch (_) {}
  const docTop = doc.getBoundingClientRect().top;
  const bottomLimit = docTop + pageH - padB - 2;
  lastC1.style.height = '';                     // pehle purani naap hatao
  const tblBottom = table.getBoundingClientRect().bottom;
  const gap = bottomLimit - tblBottom;
  if (gap > 4) {
    const cur = lastC1.offsetHeight || 0;
    lastC1.style.height = (cur + gap) + 'px';
  }
}
window._sazaStretchTable = _sazaStretchTable;

// ═══ کالم ki lakeerein khiska kar chaurai badlo (movable/flexible) ═══
// report173 _ch173MakeResizable jaisa — har header cell ke BAYEN kinare par
// aik "grip" lagta hai; usay pakad kar khiskao to us کالم aur agle کالم ki
// chaurai badalti hai. Naap فیصد (%) mein rehti hai, save par mehfooz.
function _sazaMakeResizable() {
  const doc = _sazaDoc(); if (!doc) return;
  const table = doc.querySelector('#saza-table'); if (!table) return;
  const cols = table.querySelectorAll('colgroup col');
  const heads = table.querySelectorAll('thead th');
  if (cols.length !== 4 || heads.length !== 4) return;
  // Grips sirf pehle 3 headers ke bayen kinare par (k, k+1 pair)
  heads.forEach((th, i) => {
    if (i >= 3) return;                          // aakhri کالم ka bayan kinara table ka bahar
    if (th.querySelector('.saza-colgrip')) return;
    th.style.position = 'relative';
    const grip = document.createElement('span');
    grip.className = 'saza-colgrip no-print';
    grip.addEventListener('mousedown', ev => _sazaColDragStart(ev, i));
    th.appendChild(grip);
  });
}
window._sazaMakeResizable = _sazaMakeResizable;

let _sazaDrag = null;
function _sazaColDragStart(ev, idx) {
  ev.preventDefault(); ev.stopPropagation();
  const doc = _sazaDoc(); if (!doc) return;
  const table = doc.querySelector('#saza-table'); if (!table) return;
  const cols = table.querySelectorAll('colgroup col');
  const tw = table.getBoundingClientRect().width || 1;
  _sazaDrag = {
    idx, startX: ev.clientX, tw,
    // Mojooda % (computed)
    w: [...cols].map(c => (c.getBoundingClientRect().width / tw) * 100),
    cols,
  };
  document.addEventListener('mousemove', _sazaColDragMove);
  document.addEventListener('mouseup', _sazaColDragEnd);
}
function _sazaColDragMove(ev) {
  if (!_sazaDrag) return;
  const { idx, startX, tw, w, cols } = _sazaDrag;
  // RTL: bayen (left) کھینچنے par is کالم ki chaurai barhti hai, agle ki ghatti.
  const dpx = ev.clientX - startX;
  let dpct = (dpx / tw) * 100;
  const MIN = 5;
  // is کالم (idx) aur agle (idx+1) ke darmiyan naap ka tabadla.
  // RTL mein col[idx] dayen, col[idx+1] bayen — bayen grip ko bayen le jane
  // (dpx negative) se col[idx] barhta hai.
  let a = w[idx] - dpct;        // dayan (current)
  let b = w[idx + 1] + dpct;    // bayan (agla)
  if (a < MIN) { b -= (MIN - a); a = MIN; }
  if (b < MIN) { a -= (MIN - b); b = MIN; }
  cols[idx].style.width = a + '%';
  cols[idx + 1].style.width = b + '%';
}
function _sazaColDragEnd() {
  document.removeEventListener('mousemove', _sazaColDragMove);
  document.removeEventListener('mouseup', _sazaColDragEnd);
  _sazaDrag = null;
  try { _sazaStretchTable(); } catch (_) {}
  try { _sazaDirty = true; } catch (_) {}
}

//    allocated khana charon کالم mein:
//      کالم 1 — satar 1: naam(+ولدیت/قومیت/سکونت) · satar 2: پیشہ + حلیہ
//      کالم 2 — us ملزم ki تاریخ گرفتاری (270° khadi)
//      کالم 3 — جرم SIRF AIK DAFA (pehli qatar par rowspan, ت پ ke saath)
//      کالم 4 — حکم اخیر عدالت (khali, har ملزم ka apna)
//    Beech mein koi UFQI (horizontal) lakeer nahi. SHO ka khana aakhri
//    ملزم ke NEECHE aik alag qatar mein (کالم 1), bayen sidh.
//    SIRF woh ملزمان jo dropdown se chune gaye — baqi nahi. ──
function _sazaBuildRows(sv, c, o) {
  o = o || (typeof currentOfficer !== 'undefined' && currentOfficer) || {};

  // Chune hue ملزمان: pehle saved (sv.acc = naam ki list), warna KHALI
  // (system ke tamam ملزمان KHUD nahi bharte — sirf dropdown se aate hain).
  let chosenNames = [];
  if (sv.acc) { try { chosenNames = JSON.parse(sv.acc) || []; } catch (_) { chosenNames = []; } }
  const all = _sazaAccList();
  let people = chosenNames.map(nm => all.find(a => (a.name || '') === nm)).filter(Boolean);

  // کالم 3 (جرم) ka matn — user ki hidayat: SIRF "مندرجہ بالا" (offence nahi).
  const jurmDefault = 'مندرجہ بالا';
  const _v = (k, def) => (typeof sanitizeHtml === 'function'
    ? sanitizeHtml(sv[k] !== undefined ? sv[k] : (def || ''))
    : (sv[k] !== undefined ? sv[k] : (def || '')));

  // SHO ki تاریخ — default aaj ki (report173 _ch173Today jaisa), phir editable
  const shoDateDef = _sazaToday();
  const shoBlock = `
    <div class="saza-sho-inline">
      <div class="saza-sho-space"></div>
      <div class="saza-sho-line" contenteditable="true" data-k="sho">${_v('sho', esc(_sazaShoLine(o)))}</div>
      <div class="saza-sho-line saza-sho-date" contenteditable="true" data-k="sho_date"
           onclick="_sazaPickDate(this)" title="تاریخ ڈالنے کے لیے کلک کریں">${_v('sho_date', 'تاریخ: ' + esc(shoDateDef))}</div>
    </div>`;

  // Koi ملزم nahi chuna → aik hint qatar + SHO qatar
  if (!people.length) {
    return `
    <tr data-row="0" class="saza-acc-row">
      <td class="saza-c1">
        <div class="saza-c1-body" contenteditable="true" data-k="c1_0"><span class="saza-hint no-print">اوپر کالم 1 کی سرخی میں ▾ سے ملزمان منتخب کریں</span></div>
      </td>
      <td class="saza-c2 rotcell"><div class="rotcell-in" contenteditable="true" data-k="c2"></div></td>
      <td class="saza-c3 rotcell"><div class="rotcell-in saza-jurm" contenteditable="true" data-k="c3">${esc(jurmDefault)}</div></td>
      <td class="saza-c4"><div class="saza-c4-body" contenteditable="true" data-k="c4_0"></div></td>
    </tr>
    <tr data-row="sho">
      <td class="saza-c1 saza-c1-sho">${shoBlock}</td>
      <td class="saza-c2"></td>
      <td class="saza-c3"></td>
      <td class="saza-c4"></td>
    </tr>`;
  }

  const N = people.length;
  const uniqDates = [...new Set(people.map(a => a.arrest_date
    ? ((typeof formatDate === 'function') ? formatDate(a.arrest_date) : a.arrest_date) : '').filter(Boolean))];
  const dateTxt = (sv.c2 !== undefined)
    ? (typeof sanitizeHtml === 'function' ? sanitizeHtml(sv.c2) : sv.c2)
    : esc(uniqDates.join(' / '));
  const jurmTxt = (sv.c3 !== undefined)
    ? (typeof sanitizeHtml === 'function' ? sanitizeHtml(sv.c3) : sv.c3)
    : esc(jurmDefault);

  const rowsHtml = people.map((a, i) => {
    const c1 = (sv['c1_' + i] !== undefined)
      ? (typeof sanitizeHtml === 'function' ? sanitizeHtml(sv['c1_' + i]) : sv['c1_' + i])
      : _sazaAccusedBlock(a);
    const cv = (sv['c4_' + i] !== undefined)
      ? (typeof sanitizeHtml === 'function' ? sanitizeHtml(sv['c4_' + i]) : sv['c4_' + i]) : '';
    // کالم 2 (تاریخ) aur کالم 3 (جرم) SIRF pehli qatar par — rowspan = tamam
    // ملزمان (asal form jaisa: aik hi khadi تاریخ aur aik hi "مندرجہ بالا").
    // Safha-tor par Chrome in ki khadi lakeerein khud agle safhe par jari
    // rakhta hai (safha 2 par "sirf lakeerein"). Matn OOPER (safha 1) rehta hai.
    const spanCells = (i === 0)
      ? `<td class="saza-c2 rotcell" rowspan="${N}"><div class="rotcell-in" contenteditable="true" data-k="c2">${dateTxt}</div></td>
      <td class="saza-c3 rotcell" rowspan="${N}"><div class="rotcell-in saza-jurm" contenteditable="true" data-k="c3">${jurmTxt}</div></td>`
      : '';
    return `<tr data-row="${i}" class="saza-acc-row">
      <td class="saza-c1"><div class="saza-c1-body" contenteditable="true" data-k="c1_${i}">${c1}</div></td>
      ${spanCells}
      <td class="saza-c4"><div class="saza-c4-body" contenteditable="true" data-k="c4_${i}">${cv}</div></td>
    </tr>`;
  }).join('');

  // SHO qatar — aakhri ملزم ke NEECHE. کالم 1 mein SHO block (bayen sidh).
  const shoRow = `<tr data-row="sho">
    <td class="saza-c1 saza-c1-sho">${shoBlock}</td>
    <td class="saza-c2"></td>
    <td class="saza-c3"></td>
    <td class="saza-c4"></td>
  </tr>`;

  return rowsHtml + shoRow;
}

// کالم 1 ka block — satar 1: naam (+ولدیت/قومیت/سکونت, UNBOLD 14pt),
// satar 2: پیشہ + حلیہ (body description). Beech mein koi lakeer nahi.
function _sazaAccusedBlock(a) {
  if (!a.name && !a.halia && !a.pesha) return '';
  const parts = [];
  if (a.name) parts.push('<div class="saza-acc-name">' + esc(a.name) + '</div>');
  const desc = [a.pesha ? ('پیشہ ' + a.pesha) : '', a.halia || ''].filter(Boolean).join(' — ');
  if (desc) parts.push('<div class="saza-acc-desc">' + esc(desc) + '</div>');
  return parts.join('');
}

// ═══ ملزمان منتخب کریں (▾) — report173 ka _ch173AccPicker jaisa ═══
function _sazaAccPicker(ev) {
  ev.preventDefault(); ev.stopPropagation();
  document.getElementById('saza-acc-menu')?.remove();
  const list = _sazaAccList();
  if (!list.length) {
    if (typeof showToast === 'function') showToast('ℹ️ اس مقدمہ میں کوئی ملزم درج نہیں', 'info');
    return;
  }
  const tbody = document.getElementById('saza-tbody');
  // Pehle se chune hue naam (state se, warna کالم 1 ke naam-satar se)
  const mine = new Set(_sazaChosen || []);
  if (!mine.size && tbody) tbody.querySelectorAll('.saza-c1-body .saza-acc-name').forEach(el => {
    const nm = (el.innerText || '').trim();
    if (nm) mine.add(nm);
  });

  const box = document.createElement('div');
  box.id = 'saza-acc-menu';
  box.style.cssText =
    'position:fixed;z-index:99999;background:#fff;border:1px solid #0369a1;border-radius:10px;' +
    'box-shadow:0 10px 30px rgba(0,0,0,.28);direction:rtl;width:260px;max-width:92vw;' +
    'display:flex;flex-direction:column;max-height:min(60vh,340px);overflow:hidden;';
  const rows = list.map(a => {
    const nm = a.name;
    const on = mine.has(nm);
    return `<label style="display:flex;align-items:center;gap:8px;padding:7px 6px;cursor:pointer;font-size:13px;
              border-bottom:1px solid #f1f5f9;font-family:'Jameel Noori Nastaleeq',serif;">
              <input type="checkbox" ${on?'checked':''} value="${esc(nm)}"> <span>${esc(nm)}</span></label>`;
  }).join('');
  box.innerHTML = `
    <div style="padding:8px 10px;border-bottom:1px solid #e5e7eb;font-size:12px;font-weight:700;color:#0369a1;
                font-family:'Jameel Noori Nastaleeq',serif;background:#f8fafc;">ملزمان منتخب کریں</div>
    <div style="flex:1;overflow-y:auto;padding:4px 8px;min-height:0;">
      ${rows || '<div style="font-size:12px;color:#777;padding:10px;">کوئی ملزم نہیں</div>'}
    </div>
    <div style="display:flex;gap:6px;padding:8px;border-top:1px solid #e5e7eb;background:#f8fafc;flex-shrink:0;">
      <button id="saza-acc-ok" style="flex:1;padding:8px;border:none;border-radius:6px;background:#0369a1;
        color:#fff;cursor:pointer;font-size:13px;font-weight:700;font-family:'Jameel Noori Nastaleeq',serif;">✔ شامل کریں</button>
      <button id="saza-acc-x" style="padding:8px 12px;border:1px solid #cbd5e1;border-radius:6px;background:#fff;
        cursor:pointer;font-size:13px;font-family:'Jameel Noori Nastaleeq',serif;">بند</button>
    </div>`;
  document.body.appendChild(box);

  const r = ev.currentTarget.getBoundingClientRect();
  const bw = box.offsetWidth, bh = box.offsetHeight;
  let top = r.bottom + 6;
  if (top + bh > window.innerHeight - 8) top = Math.max(8, r.top - bh - 6);
  if (top + bh > window.innerHeight - 8) top = Math.max(8, window.innerHeight - bh - 8);
  let left = r.left + r.width/2 - bw/2;
  left = Math.max(8, Math.min(left, window.innerWidth - bw - 8));
  box.style.top = top + 'px';
  box.style.left = left + 'px';

  setTimeout(() => {
    const off = (e) => { if (!box.contains(e.target)) { box.remove(); document.removeEventListener('mousedown', off); } };
    document.addEventListener('mousedown', off);
  }, 0);

  box.querySelector('#saza-acc-x').onclick = () => box.remove();
  box.querySelector('#saza-acc-ok').onclick = () => {
    const picked = [...box.querySelectorAll('input:checked')].map(i => i.value);
    box.remove();
    _sazaSetAccused(picked);
    try { _sazaDirty = true; } catch (_) {}
  };
}
window._sazaAccPicker = _sazaAccPicker;

// Chune hue ملزمان (naam) — sirf yehi کالم 1 mein dikhte hain (#9)
let _sazaChosen = [];

// Dropdown se ملزمان chunne par poora tbody dobara banao (per-ملزم qatarein)
function _sazaSetAccused(names) {
  _sazaChosen = names.slice();
  const doc = _sazaDoc(); if (!doc) return;
  const tbody = doc.querySelector('#saza-tbody'); if (!tbody) return;
  const c = _sazaCase || {};
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) || {};
  // Naye chunao par saved per-row matn nazar-andaz — sirf chosen se banao.
  // (SHO/thana/zila waghera doc mein pehle se hain — unhein dobara na chھero:
  //  save par woh apne data-k se collect ho jate hain.)
  const sho = doc.querySelector('[data-k="sho"]');
  const shoDate = doc.querySelector('[data-k="sho_date"]');
  const shoHtml = sho ? sho.innerHTML : esc(_sazaShoLine(o));
  const shoDateHtml = shoDate ? shoDate.innerHTML : '';
  const svLike = { acc: JSON.stringify(names), sho: shoHtml, sho_date: shoDateHtml };
  tbody.innerHTML = _sazaBuildRows(svLike, c, o);
  try { _sazaBindKeys(); } catch (_) {}
  try { _sazaStretchTable(); } catch (_) {}
}

// ═══ Aaj ki تاریخ — DD/MM/YYYY (report173 _ch173Today jaisa) ═══
function _sazaToday() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const manual = dd + '/' + mm + '/' + d.getFullYear();
  if (typeof formatDate === 'function') {
    try {
      const f = formatDate(d);
      if (f && /^\d{2}\/\d{2}\/\d{4}$/.test(String(f).trim())) return String(f).trim();
    } catch (_) {}
  }
  return manual;
}

// ═══ SHO line — report173 ka _ch173ShoLine jaisa ═══
function _sazaShoLine(o) {
  o = o || (typeof currentOfficer !== 'undefined' ? currentOfficer : {}) || {};
  const st = o.station || '';
  if (typeof getSHOSignLine === 'function') {
    const line = getSHOSignLine(st);
    if (line && line.trim()) return line;
  }
  try {
    const sho = JSON.parse(localStorage.getItem('digital_io_sho') || '{}');
    const parts = [];
    if (sho.name) parts.push(String(sho.name).trim());
    if (sho.rank) parts.push(String(sho.rank).trim());
    let l = parts.join(' ');
    if (st) l += (l ? ' ' : '') + 'تھانہ ' + st;
    if (l.trim()) return l;
  } catch (_) {}
  return st ? ('تھانہ ' + st) : '';
}

function _sazaPickDate(el) {
  if (!el) return;
  const cur = (el.innerText || '').trim();
  const inp = prompt('تاریخ درج کریں (DD/MM/YYYY):', cur);
  if (inp === null) return;
  const t = inp.trim();
  if (!t) { el.innerText = ''; return; }
  el.innerText = (typeof formatDate === 'function') ? formatDate(t) : t;
  try { _sazaDirty = true; } catch (_) {}
}
window._sazaPickDate = _sazaPickDate;

// ═══ TOOLBAR helpers (report173 jaise) ═══
function _sazaBtn() {
  return 'min-width:30px;height:28px;border:1px solid var(--border,#ccc);border-radius:6px;' +
         'background:var(--bg-card,#fff);color:var(--text-primary,#111);cursor:pointer;' +
         'font-size:13px;padding:0 7px;margin:0 1px;';
}
const SAZA_FONT_SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];
const SAZA_FONT_DEFAULT = 14;
function _sazaDocFont(sv) {
  const n = parseFloat((sv && sv.doc_font) || '');
  return (n && !isNaN(n)) ? n : SAZA_FONT_DEFAULT;
}

function _sazaDoc() {
  const all = document.querySelectorAll('#saza-doc');
  if (!all.length) return null;
  for (let i = all.length - 1; i >= 0; i--) {
    const el = all[i];
    if (el.offsetParent !== null || el.getClientRects().length) return el;
  }
  return all[all.length - 1];
}

// Selection yaad rakho (toolbar tap par focus na khoye)
let _sazaRange = null;
function _sazaSaveRange() {
  const doc = _sazaDoc(); if (!doc) return;
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return;
  const r = sel.getRangeAt(0);
  if (doc.contains(r.commonAncestorContainer)) _sazaRange = r.cloneRange();
}
function _sazaRestoreRange() {
  const doc = _sazaDoc(); if (!doc || !_sazaRange) return false;
  if (!doc.contains(_sazaRange.commonAncestorContainer)) { _sazaRange = null; return false; }
  try {
    let n = _sazaRange.commonAncestorContainer;
    if (n.nodeType === 3) n = n.parentElement;
    const host = n && n.closest ? n.closest('[contenteditable="true"]') : null;
    if (host) host.focus({ preventScroll: true });
    const sel = window.getSelection();
    sel.removeAllRanges(); sel.addRange(_sazaRange);
    return true;
  } catch (_) { return false; }
}

function _sazaFmt(cmd) {
  const doc = _sazaDoc();
  const sel = window.getSelection();
  const live = doc && sel && sel.rangeCount && doc.contains(sel.getRangeAt(0).commonAncestorContainer);
  if (!live) _sazaRestoreRange();
  try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
  try { document.execCommand(cmd, false, null); } catch (_) {}
  _sazaSaveRange();
  try { _sazaDirty = true; } catch (_) {}
}
window._sazaFmt = _sazaFmt;

// Font — chune hue matn par (ya poore doc par agar kuch chuna na ho)
function _sazaSetFont(val) {
  const pt = parseFloat(val); if (!pt) return;
  const doc = _sazaDoc(); if (!doc) return;
  const sel = window.getSelection();
  const live = sel && sel.rangeCount && !sel.isCollapsed && doc.contains(sel.anchorNode) && doc.contains(sel.focusNode);
  if (!live) _sazaRestoreRange();
  const sel2 = window.getSelection();
  const hasSel = sel2 && sel2.rangeCount && !sel2.isCollapsed && doc.contains(sel2.anchorNode);
  if (hasSel && _sazaFontToSelection(pt)) { _sazaSaveRange(); _sazaDirty = true; return; }
  _sazaFontToDoc(pt);
  const hid = doc.querySelector('[data-k="doc_font"]'); if (hid) hid.value = String(pt);
  try { _sazaDirty = true; } catch (_) {}
}
window._sazaSetFont = _sazaSetFont;

function _sazaFontToSelection(pt) {
  const doc = _sazaDoc(); if (!doc) return false;
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return false;
  if (!doc.contains(sel.anchorNode) || !doc.contains(sel.focusNode)) return false;
  try { document.execCommand('styleWithCSS', false, false); } catch (_) {}
  let ok = false;
  try { ok = document.execCommand('fontSize', false, '7'); } catch (_) {}
  if (!ok) return false;
  doc.querySelectorAll('font[size="7"]').forEach(f => {
    const span = document.createElement('span');
    while (f.firstChild) span.appendChild(f.firstChild);
    span.style.fontSize = pt + 'pt';
    f.parentNode.replaceChild(span, f);
  });
  return true;
}

function _sazaFontToDoc(pt) {
  const doc = _sazaDoc(); if (!doc) return;
  doc.dataset.fs = pt;
  doc.style.fontSize = pt + 'pt';
  const fsel = document.getElementById('saza-font-sel');
  if (fsel) fsel.value = String(pt);
}

function _sazaBindKeys() {
  const doc = _sazaDoc(); if (!doc) return;
  doc.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') { e.preventDefault(); _sazaFmt('bold'); }
      if (e.key === 'u') { e.preventDefault(); _sazaFmt('underline'); }
      if (e.key === 'i') { e.preventDefault(); _sazaFmt('italic'); }
    }
  });
  doc.addEventListener('input', () => { _sazaDirty = true; });
  doc.addEventListener('mouseup', _sazaSaveRange);
  doc.addEventListener('keyup', _sazaSaveRange);
}

// ═══ Floating toolbar (dioBindEditor) is doc par na lage ═══
function _sazaBlockFloatBar() {
  try {
    if (typeof window.dioBindEditor === 'function' && !window._sazaBindPatched) {
      window._sazaBindPatched = true;
      const _orig = window.dioBindEditor;
      window.dioBindEditor = function (el) {
        try {
          if (el && (el.id === 'saza-doc' ||
                    (el.closest && el.closest('#saza-doc')) ||
                    (el.querySelector && el.querySelector('#saza-doc')))) return;
        } catch (_) {}
        return _orig.apply(this, arguments);
      };
    }
  } catch (_) {}
}

// ═══ Poore safhe par (report173 _ch173FullPage jaisa) ═══
function _sazaFullPage(area) {
  try {
    document.body.classList.add('workspace-mode');
    ['.workspace-sidebar', '#workspace-doc-list', '.misal-sidebar'].forEach(sel => {
      document.querySelectorAll(sel).forEach(el => { el.style.display = 'none'; });
    });
    let el = area, hops = 0;
    while (el && el !== document.body && hops++ < 8) {
      el.style.width = '100%'; el.style.maxWidth = 'none';
      el.style.marginRight = '0'; el.style.marginLeft = '0';
      if (getComputedStyle(el).display === 'flex') el.style.flex = '1 1 auto';
      el = el.parentElement;
    }
    document.querySelectorAll('.workspace-layout, .misal-layout').forEach(w => {
      w.style.display = 'block'; w.style.gridTemplateColumns = '1fr';
    });
    const doc = _sazaDoc();
    if (doc) {
      doc.style.maxWidth = 'none'; doc.style.margin = '0 auto';
      _sazaFitPaper();
      if (!window._sazaFitBound) {
        window._sazaFitBound = true;
        window.addEventListener('resize', () => { try { _sazaFitPaper(); } catch (_) {} });
      }
    }
  } catch (_) {}
}

function _sazaFitPaper() {
  const doc = _sazaDoc(); if (!doc) return;
  const host = doc.parentElement; if (!host) return;
  try {
    let el = host, hops = 0;
    while (el && el !== document.body && hops++ < 4) {
      const top = el.getBoundingClientRect().top;
      const hh = Math.max(200, (window.innerHeight || 0) - top - 2);
      el.style.height = hh + 'px'; el.style.maxHeight = 'none'; el.style.flexShrink = '0';
      el = el.parentElement;
    }
    host.style.overflow = 'auto'; host.style.flexShrink = '0';
  } catch (_) {}
  const IN = 96;
  const wPx = ((_sazaPaper === 'a4') ? 8.27 : 8.5) * IN;
  doc.style.width = wPx + 'px'; doc.style.maxWidth = 'none';
  doc.style.minHeight = ((_sazaPaper === 'a4') ? 11.7 : 13) * IN + 'px';
  try { doc.style.padding = '1cm ' + _sazaSideMargin(); } catch (_) {}
}
window._sazaFitPaper = _sazaFitPaper;

// ═══ Focus mode — chip patti peechay/peek (report173 jaisa) ═══
function _sazaFocusMode(on) {
  const b = document.body; if (!b) return;
  if (!on) {
    b.classList.remove('saza-focus');
    const bar = document.getElementById('misal-doc-bar');
    if (bar) { bar.classList.remove('peek'); try { if (bar.parentElement) bar.parentElement.style.position = ''; } catch (_) {} }
    try { clearTimeout(window._sazaPeekT); } catch (_) {}
    return;
  }
  b.classList.add('saza-focus');
  try {
    const bar0 = document.getElementById('misal-doc-bar');
    const par = bar0 && bar0.parentElement;
    if (par && getComputedStyle(par).position === 'static') par.style.position = 'relative';
  } catch (_) {}
  if (window._sazaPeekBound) return;
  window._sazaPeekBound = true;
  document.addEventListener('mousemove', (e) => {
    if (!document.body.classList.contains('saza-focus')) return;
    const bar = document.getElementById('misal-doc-bar'); if (!bar) return;
    let near = e.clientY <= 70;
    if (!near) {
      try {
        const r = bar.getBoundingClientRect();
        near = e.clientY >= r.top - 10 && e.clientY <= r.bottom + 10 && e.clientX >= r.left && e.clientX <= r.right;
      } catch (_) {}
    }
    if (near) {
      clearTimeout(window._sazaPeekT);
      try {
        const d0 = _sazaDoc();
        const host = d0 && d0.parentElement;
        const wrap = host && host.parentElement;
        const tbar = wrap && wrap.querySelector('.no-print');
        const par = bar.offsetParent || bar.parentElement;
        if (tbar && par) {
          const rp = par.getBoundingClientRect();
          const rt = tbar.getBoundingClientRect();
          bar.style.top = Math.max(0, Math.round(rt.bottom - rp.top)) + 'px';
        }
      } catch (_) {}
      bar.classList.add('peek');
    } else if (bar.classList.contains('peek')) {
      clearTimeout(window._sazaPeekT);
      window._sazaPeekT = setTimeout(() => { try { bar.classList.remove('peek'); } catch (_) {} }, 400);
    }
  }, { passive: true });
}
window._sazaFocusMode = _sazaFocusMode;

// ═══ SAVE ═══
async function _sazaSave() {
  const doc = _sazaDoc(); if (!doc) return;
  const data = {};
  doc.querySelectorAll('[data-k]').forEach(el => {
    const k = el.getAttribute('data-k');
    if (el.tagName === 'INPUT') data[k] = el.value;
    else data[k] = el.innerHTML;
  });
  data.doc_font = doc.dataset.fs || String(SAZA_FONT_DEFAULT);
  data.acc = JSON.stringify(_sazaChosen || []);   // chune hue ملزمان (naam)
  // کالم ki chaurai (%) — movable lakeeron ke baad mehfooz
  try {
    const cols = doc.querySelectorAll('#saza-table colgroup col');
    if (cols.length === 4) {
      const tw = doc.querySelector('#saza-table').getBoundingClientRect().width || 1;
      data.col_w = JSON.stringify([...cols].map(c =>
        Math.round((c.getBoundingClientRect().width / tw) * 1000) / 10));
    }
  } catch (_) {}
  data.saved_at = new Date().toISOString();
  try {
    // case_documents mein 'saza_slip' record — misal-docs.js jaisa
    let exists = false;
    try { exists = !!(typeof _misalDocs !== 'undefined' && _misalDocs && _misalDocs['saza_slip']); } catch (_) {}
    if (!exists) {
      const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
      const { data: ins, error } = await supabaseClient
        .from('case_documents')
        .insert({ case_id: _sazaCaseId, officer_id: oid, document_type: 'saza_slip', status: 'complete', content: data })
        .select().single();
      if (error) throw error;
      try { if (typeof _misalDocs !== 'undefined') _misalDocs['saza_slip'] = ins; } catch (_) {}
    } else {
      const { error } = await supabaseClient
        .from('case_documents')
        .update({ content: data, status: 'complete', updated_at: new Date().toISOString() })
        .eq('case_id', _sazaCaseId).eq('document_type', 'saza_slip');
      if (error) throw error;
      try { _misalDocs['saza_slip'].content = data; } catch (_) {}
    }
    _sazaSaved = data;
    _sazaDirty = false;
    try { if (typeof _refreshMisalBar === 'function') _refreshMisalBar(); } catch (_) {}
    try {
      if (typeof dioRegisterSaved === 'function')
        dioRegisterSaved('misal', 'سزا سلپ', { case_id: _sazaCaseId, doc_id: 'saza_slip' });
    } catch (_) {}
    if (typeof showToast === 'function') showToast('✅ سزا سلپ محفوظ ہو گئی', 'success');
  } catch (e) {
    if (typeof showToast === 'function') showToast('❌ ' + (e.message || e), 'error');
  }
}
window._sazaSave = _sazaSave;

// ═══ PRINT — report173 jaisa. Agar data PAGE 1 se barh jaye:
//   • سرخیاں (thead) SIRF page 1 par — page 2+ par sirf table ki (khadi)
//     lakeerein (thead display:table-row-group se khud aisa hota hai).
//   • Har naye safhe ke OOPER BAYEN kone mein مثلث (triangle) — misl
//     baandhne ke liye — aur pehli satar ko OOPER se AIK satar ki jagah.
//   Yeh report173 ke bind-marks (_ch173AddBindMarks) ka table-version hai:
//   LIVE DOM se har ملزم-qatar ki jagah naap kar safhe ki hadd maloom karte
//   hain, phir CLONE mein us qatar se pehle page-break + مثلث daal dete hain.
// ═══
function _sazaPrint() {
  const doc = _sazaDoc(); if (!doc) return;
  try { _sazaStretchTable(); } catch (_) {}

  // ── Safhe ki hadd par konsi ملزم-qatar page 2 par jati hai (LIVE naap) ──
  const breakBeforeRows = _sazaComputePageBreaks(doc);   // Set of data-row values

  const clone = doc.cloneNode(true);
  clone.querySelectorAll('.no-print, .saza-acc-pick, .saza-colgrip').forEach(el => el.remove());

  // Clone ki un qataron par page-break + مثلث lagao jo naye safhe par shuru hoti hain
  breakBeforeRows.forEach(rk => {
    const tr = clone.querySelector('#saza-tbody tr[data-row="' + rk + '"]');
    if (!tr) return;
    tr.classList.add('saza-pgbreak');
    const firstTd = tr.querySelector('.saza-c1');
    if (firstTd) {
      // مثلث + aik satar ki jagah — کالم 1 (naye safhe ke top-left) mein
      const tri = document.createElement('span');
      tri.className = 'saza-bind';
      firstTd.insertBefore(tri, firstTd.firstChild);
    }
  });

  const inner = clone.innerHTML;
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page{ size:${_sazaPaper === 'a4' ? 'A4 portrait' : '8.5in 13in'}; margin:6mm ${_sazaSideMargin()}; }
      html, body{ margin:0 !important; padding:0 !important;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        direction:rtl; line-height:1.4; color:#000; font-size:${_sazaDocFont(_sazaSaved)}pt; }
      ${_sazaCSS()}
      #saza-doc{ width:100% !important; max-width:none !important; height:auto !important;
        min-height:0 !important; padding:0 !important; margin:0 !important;
        transform:none !important; box-shadow:none !important; border-radius:0 !important; }
      .no-print, .saza-acc-pick, .saza-colgrip, button, select{ display:none !important; }
      /* Unwan (form no.) bilkul OOPER se shuru — koi izafi top margin nahi */
      #saza-doc .saza-formno{ margin-top:0 !important; }
      /* سرخیاں SIRF page 1 par (page 2+ par sirf lakeerein) */
      .saza-table thead{ display:table-row-group; }
      /* Har ملزم ki qatar poori rahe; SHO (lambi) qatar toot sakti hai */
      .saza-acc-row{ page-break-inside:avoid; break-inside:avoid; }
      tr[data-row="sho"]{ page-break-inside:auto; break-inside:auto; }
      /* ── Naye safhe par jane wali qatar — safha TOR + OOPER aik satar ki jagah ── */
      #saza-doc tr.saza-pgbreak{ break-before:page; page-break-before:always; }
      #saza-doc tr.saza-pgbreak .saza-c1{ padding-top:1.6em; }   /* aik satar ki jagah */
      /* مثلث — naye safhe ke OOPER BAYEN kone mein (misl baandhne ke liye,
         report173 jaisa). Nok top-left kone par; matn is se bach kar behta
         hai (shape-outside). Andar halka bhara hua (nazar aata) taake print
         par nishan zaahir ho. */
      #saza-doc .saza-bind{
        float:left; width:1.3in; height:1.3in; margin:0 0.15in 0.1in 0;
        shape-outside:polygon(0 0, 1.3in 0, 0 1.3in);
        -webkit-shape-outside:polygon(0 0, 1.3in 0, 0 1.3in);
        shape-margin:3mm; -webkit-shape-margin:3mm;
        clip-path:polygon(0 0, 1.3in 0, 0 1.3in);
        -webkit-clip-path:polygon(0 0, 1.3in 0, 0 1.3in);
        background:#000; opacity:0.14; display:block;
      }
      #saza-doc, #saza-doc *{ orphans:2; widows:2; }
    </style></head><body><div id="saza-doc">${inner}</div></body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}
window._sazaPrint = _sazaPrint;

// ── Har ملزم-qatar ki jagah naap kar page ki hadd maloom karo ──
//    Wapas: un data-row values ka Set jo NAYE safhe par shuru hoti hain.
function _sazaComputePageBreaks(doc) {
  const out = new Set();
  try {
    const rows = [...doc.querySelectorAll('#saza-tbody tr.saza-acc-row')];
    if (rows.length < 2) return out;
    const IN = 96;
    const pageH = ((_sazaPaper === 'a4') ? 11.7 : 13) * IN;
    // @page margin 6mm ooper + neeche = ~45px kul
    const marginPx = (6 / 25.4) * IN * 2;
    const usable = pageH - marginPx;                 // aik safhe ki kaam ki unchai
    if (usable < 120) return out;
    // Table doc ke top se kitna neeche shuru hoti hai (unwan ki unchai)
    const docTop = doc.getBoundingClientRect().top;
    let pageBottom = usable;                          // pehli hadd (doc-top se)
    for (const tr of rows) {
      const r = tr.getBoundingClientRect();
      const top = r.top - docTop;
      const bottom = r.bottom - docTop;
      // Agar yeh qatar mojooda safhe ki hadd ko paar karti hai → agle safhe par
      if (bottom > pageBottom + 1) {
        const rk = tr.getAttribute('data-row');
        if (rk) out.add(rk);
        // Is qatar ke NAYE safhe se agli hadd ginno
        pageBottom = top + usable;
      }
    }
  } catch (_) {}
  return out;
}
window._sazaComputePageBreaks = _sazaComputePageBreaks;

// ═══ CSS — report173 ke #ch173-doc conventions ki naql ═══
function _sazaCSS() {
  return `
    /* Chip patti چھپتی ہے، cursor ooper le jate hi jhalak jati hai (report173 jaisa) */
    body.saza-focus #misal-doc-bar{
      position:absolute; top:0; left:0; right:0; z-index:60;
      max-height:0 !important; padding-top:0 !important; padding-bottom:0 !important;
      opacity:0; overflow:hidden; background:var(--bg-secondary, #fff);
      transition:max-height .18s ease, opacity .18s ease, padding .18s ease;
    }
    body.saza-focus #misal-doc-bar.peek{
      max-height:240px !important; opacity:1;
      padding-top:6px !important; padding-bottom:6px !important;
      box-shadow:0 8px 18px rgba(0,0,0,.18);
    }
    body.saza-focus .bottombar{ display:none !important; }

    /* Root doc — 14pt, RTL, Jameel Noori */
    #saza-doc{ direction:rtl; font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif; color:#000; font-size:14pt; }
    #saza-doc .fl{ outline:none; unicode-bidi:isolate; direction:rtl; min-width:30px; display:inline-block; }

    /* Line 1 — فارم نمبر (center, 12pt) */
    #saza-doc .saza-formno{ text-align:center; font-size:12pt; margin:0 0 3pt; }

    /* Line 2 — تھانہ(dayen) · سزاسلپ(center, 24pt underline · UNBOLD) · ضلع(bayen).
       tt-mid absolute 50% par — hamesha safha-center. تھانہ/ضلع 14pt.
       AHEM: پہلے تھانہ کے دائیں 1in padding تھی جو ضلع کو بائیں کنارے سے
       باہر دھکیل دیتی تھی (پرنٹ میں ضلع کٹ جاتا تھا). اب دونوں کناروں پر
       تھوڑی سی (6mm) جگہ — ضلع پورا نظر آتا ہے. */
    /* Line 2 — تھانہ(dayen) · سزاسلپ(center) · ضلع(bayen). Dono kinaron par
       6mm jagah taake print mein ضلع/تھانہ kinare se na kate (0.2cm @page
       margin ke ilawa). */
    #saza-doc .saza-title-row{ position:relative; display:flex; align-items:baseline;
      justify-content:space-between; width:100%; min-height:1.8em; padding:0 6mm; box-sizing:border-box; }
    #saza-doc .saza-title-row > span{ white-space:nowrap; }
    #saza-doc .saza-tt-right{ text-align:right; font-size:14pt; }
    #saza-doc .saza-tt-left{ text-align:left; font-size:14pt; }
    #saza-doc .saza-tt-mid{ position:absolute; left:50%; transform:translateX(-50%);
      white-space:nowrap; font-size:24pt; text-decoration:underline; font-weight:normal; }

    /* Line 3 — مقدمہ نمبر / مورخہ / جرم (center, 14pt).
       جرم: دفعات (body, LTR-isolate) + "ت پ" (suffix, alag khana) — report173
       jaisa, taake ت پ hamesha دفعات ke BAAD bayen kinare par aaye. */
    #saza-doc .saza-caseline{ display:flex; gap:22px; align-items:baseline; font-size:14pt;
      margin:14px 0 12px 0; direction:rtl; flex-wrap:wrap; line-height:1.4; justify-content:center; }
    #saza-doc .saza-caseline .fl{ display:inline-block; min-width:40px; border:none;
      text-align:right; outline:none; font-weight:normal; unicode-bidi:isolate; direction:rtl; }
    #saza-doc .saza-caseline .fl-lg{ min-width:60px; }
    #saza-doc .saza-caseline .fl-suf{ min-width:24px; }

    /* ── TABLE ── lakeerein PATLI (0.5pt) · sab khane editable · Urdu RTL
       + English LTR + poori satar barabar (justify). ── */
    #saza-doc .saza-table{ width:100%; border-collapse:collapse; table-layout:fixed; direction:rtl; margin:0; }
    #saza-doc .saza-table th, #saza-doc .saza-table td{
      border:0.5pt solid #000; padding:3px 5px; font-size:14pt; vertical-align:top;
      word-wrap:break-word; overflow-wrap:break-word;
    }
    /* Har editable khana — Urdu RTL, angrezi/hindse LTR (plaintext se khud) */
    #saza-doc .saza-table [contenteditable]{ direction:rtl; unicode-bidi:plaintext; outline:none; }
    /* Row 1 (headings) — sab کالم BOLD + 16pt, matn ke OOPER/NEECHE khuli jagah */
    #saza-doc .saza-table thead th{
      text-align:center; vertical-align:middle; font-weight:bold; font-size:16pt;
      line-height:1.3; padding:12px 6px;
    }
    /* Baahri bayen/dayen kinare khule (sirf andar ki lakeerein) */
    #saza-doc .saza-table th:first-child, #saza-doc .saza-table td:first-child{ border-right:none; }
    #saza-doc .saza-table th:last-child, #saza-doc .saza-table td:last-child{ border-left:none; }
    /* HAR ملزم ki qatar ke DARMIYAN koi UFQI lakeer nahi (na ooper na neeche). */
    #saza-doc .saza-table tbody td{ border-top:none; border-bottom:none; }
    #saza-doc .saza-acc-row{ page-break-inside:avoid; break-inside:avoid; }
    /* کالم ki khadi lakeer ko pakad kar chaurai badalne wala handle (chapai mein nahi) */
    #saza-doc .saza-colgrip{
      position:absolute; top:0; bottom:0; left:-4px; width:8px; cursor:col-resize;
      z-index:4; background:transparent;
    }
    #saza-doc .saza-colgrip:hover{ background:rgba(3,105,161,0.18); }

    /* کالم 1 — HAR ملزم: satar 1 naam, satar 2 پیشہ+حلیہ. UNBOLD 14pt.
       Urdu RTL, English LTR, POORI SATAR BARABAR (justify). */
    #saza-doc .saza-c1{ position:relative; vertical-align:top; }
    #saza-doc .saza-c1-body{ outline:none; padding:2px 4px; direction:rtl; unicode-bidi:plaintext;
      text-align:justify; text-align-last:right; }
    #saza-doc .saza-acc-name{ font-weight:normal; font-size:14pt; }
    #saza-doc .saza-acc-desc{ font-weight:normal; font-size:14pt; }
    #saza-doc .saza-hint{ color:#999; font-size:12pt; }
    /* ملزمان chunne wala ▾ — کالم 1 ki SARKHI (header) mein, naam ke saath.
       Ab yeh header ke andar inline button hai (data cell mein nahi). */
    #saza-doc .saza-acc-pick{
      display:inline-block; vertical-align:middle; margin-right:6px;
      width:26px; height:24px; line-height:22px; padding:0;
      border:1px solid #0369a1; border-radius:5px; background:#0369a1; color:#fff;
      cursor:pointer; font-size:13px; font-weight:700; text-align:center;
    }
    #saza-doc .saza-acc-pick:hover{ background:#025687; }

    /* SHO qatar — aakhri ملزم ke NEECHE (کالم 1). BAYEN sidh (image 4 jaisa).
       AHEM: کالم 1 ka default RTL/justify SHO khane par lagu na ho — is liye
       yahan alag se BAYEN (left) mqarرر. */
    #saza-doc .saza-c1-sho{ vertical-align:top; text-align:left; }
    #saza-doc .saza-sho-inline{ padding-top:10px; direction:rtl; text-align:left; }
    #saza-doc .saza-sho-space{ min-height:52px; }  /* dastkhat ki khali jagah — koi lakeer nahi */
    #saza-doc .saza-sho-line{ font-weight:bold; font-size:14pt; text-align:left !important;
      text-align-last:left; outline:none; white-space:nowrap; min-height:20px; unicode-bidi:plaintext; }
    #saza-doc .saza-sho-line:empty::before{ content:'⚠ اوزار → SHO سے نام درج کریں'; color:#c00; font-size:11pt; font-weight:normal; }
    #saza-doc .saza-sho-date{ font-weight:normal; margin-top:4px; cursor:pointer; text-align:left !important; }
    #saza-doc .saza-sho-date:empty::before{ content:'تاریخ…'; color:#aaa; font-weight:normal; }

    /* کالم 2 (تاریخ) aur کالم 3 (جرم) — dono AIK khadi (270°) column (rowspan).
       Matn OOPER se (pehle ملزم ke saamne). */
    #saza-doc .saza-table td.rotcell{ padding:0; text-align:center; vertical-align:top; position:relative; }
    #saza-doc .rotcell-in{
      writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
      transform:rotate(180deg); -webkit-transform:rotate(180deg);
      white-space:nowrap; line-height:1.35; unicode-bidi:plaintext; font-size:14pt;
      outline:none; margin:6px auto 0; padding:2px;
    }
    /* کالم 4 — حکم اخیر عدالت (khali/دستی) — RTL/justify */
    #saza-doc .saza-c4-body{ outline:none; direction:rtl; unicode-bidi:plaintext;
      text-align:justify; text-align-last:right; min-height:40px; }
    /* Screen par مثلث nazar nahi aata — sirf chapai ke liye (print CSS mein). */
    #saza-doc .saza-bind{ display:none; }
  `;
}
window._sazaCSS = _sazaCSS;

// ═══════════════════════════════════════════════════════════════
//  CHIP WIRING — misal-docs.js ke _openMisalEditor() aur
//  _doAddMisalDoc() mein 'saza_slip' ki special shart add kar di gayi
//  hai (statements_161 / cro_card jaisi). Woh chip ka click seedha
//  openSazaSlip() par le aati hai. Is liye yahan alag se koi
//  observer/hook ki zaroorat NAHI.
// ═══════════════════════════════════════════════════════════════

