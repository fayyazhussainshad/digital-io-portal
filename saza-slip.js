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

// FIR ke ملزمان (dropdown ke liye) — sirf naam + cnic
function _sazaAccList() {
  return (_sazaAccused || []).map(a => ({
    name: (a.name || '').trim(),
    cnic: (a.cnic || '').trim(),
    pesha: (a.pesha || '').trim(),
    arrest_date: a.arrest_date || '',
    halia: _sazaHalia(a),
  })).filter(a => a.name);
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

  const fir = c.fir_number || '';
  const firDate = (typeof formatDate === 'function') ? formatDate(c.fir_date) : (c.fir_date || '');
  const offence = ((c.section_of_law || '') + (c.offence_type ? ' ' + c.offence_type : '')).trim();

  // Rows: saved ho to wahi, warna system ke ملزمان se, warna aik khali row.
  const rows = _sazaBuildRows(sv, c);

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

        <!-- Line 3: FIR no / date / offence (system) -->
        <div class="saza-caseline">
          <span>مقدمہ نمبر <span class="fl" contenteditable="true" data-k="cl_fir">${v('cl_fir', esc(fir))}</span></span>
          <span>مورخہ <span class="fl" contenteditable="true" data-k="cl_date">${v('cl_date', esc(firDate))}</span></span>
          <span>بجرم <span class="fl fl-lg" contenteditable="true" data-k="cl_jurm">${v('cl_jurm', esc(offence))}</span></span>
        </div>

        <!-- ── TABLE: 4 columns · headings row + accused rows ── -->
        <table class="saza-table" id="saza-table">
          <colgroup>
            <col style="width:45%"><col style="width:10%"><col style="width:10%"><col style="width:35%">
          </colgroup>
          <thead>
            <tr>
              <th class="saza-h1">نام ولدیت قومیت سکونت حلیہ و پیشہ ملزم</th>
              <th class="saza-h2">تاریخ گرفتاری</th>
              <th class="saza-h3">جرم</th>
              <th class="saza-h4">حکم اخیر عدالت</th>
            </tr>
          </thead>
          <tbody id="saza-tbody">
            ${rows}
          </tbody>
        </table>

        <!-- ── SHO block (table ke neeche — sirf yehi, koi izafi text field nahi) ──
             dastkhat ki jagah (khali lakeer) → SHO naam (bold underline) → تاریخ -->
        <div class="saza-sho-block">
          <div class="saza-sho-sign"></div>
          <div class="saza-sho-name" contenteditable="true" data-k="sho">${v('sho', esc(_sazaShoLine(o)))}</div>
          <div class="saza-sho-date" contenteditable="true" data-k="sho_date"
               onclick="_sazaPickDate(this)" title="تاریخ ڈالنے کے لیے کلک کریں">${v('sho_date', '')}</div>
        </div>

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
    window.addEventListener('resize', _sazaFitPaper);
    if (typeof applyAutoDirection === 'function') { try { applyAutoDirection(area); } catch (_) {} }
  }, 60);
}
window._sazaRender = _sazaRender;

// ── Rows banao (saved > system accused > aik khali) ──
function _sazaBuildRows(sv, c) {
  // Agar officer ne pehle se کالم 1 ka matn mehfooz kiya hai to seedha wahi
  // (contenteditable) — warna system ke ملزمان se pehli dafa bhar do.
  let people = _sazaAccList();
  // Har accused = aik row. Kam az kam aik row (khali) hamesha.
  if (!people.length) people = [{ name:'', cnic:'', pesha:'', arrest_date:'', halia:'' }];

  return people.map((a, i) => {
    const key = 'row' + i;
    // کالم 1 — naam + پیشہ + حلیہ (justified right)
    const savedC1 = sv['c1_' + i];
    const c1 = (savedC1 !== undefined)
      ? (typeof sanitizeHtml === 'function' ? sanitizeHtml(savedC1) : savedC1)
      : _sazaAccusedBlock(a);
    // کالم 2 — تاریخ گرفتاری (270° khadi)
    const savedD = sv['c2_' + i];
    const dateTxt = (savedD !== undefined) ? savedD
      : (a.arrest_date ? ((typeof formatDate === 'function') ? formatDate(a.arrest_date) : a.arrest_date) : '');
    // کالم 3 — جرم (270° khadi) — pehli row par case ka جرم, baqi "مندرجہ بالا"
    const savedJ = sv['c3_' + i];
    const jurmTxt = (savedJ !== undefined) ? savedJ
      : (i === 0 ? ((c.section_of_law || c.offence_type || '')) : 'مندرجہ بالا');
    // کالم 4 — حکم اخیر عدالت (khali/دستی)
    const savedCourt = sv['c4_' + i];
    const court = (savedCourt !== undefined)
      ? (typeof sanitizeHtml === 'function' ? sanitizeHtml(savedCourt) : savedCourt) : '';

    const picker = (i === 0)
      ? `<button class="saza-acc-pick no-print" onclick="_sazaAccPicker(event)" title="ملزمان منتخب کریں">▾</button>`
      : '';

    return `<tr data-row="${i}">
      <td class="saza-c1">
        ${picker}
        <div class="saza-c1-body" contenteditable="true" data-k="c1_${i}">${c1}</div>
      </td>
      <td class="saza-c2 rotcell"><div class="rotwrap"><div class="rotinner" contenteditable="true" data-k="c2_${i}">${esc(dateTxt)}</div></div></td>
      <td class="saza-c3 rotcell"><div class="rotwrap"><div class="rotinner" contenteditable="true" data-k="c3_${i}">${esc(jurmTxt)}</div></div></td>
      <td class="saza-c4"><div class="saza-c4-body" contenteditable="true" data-k="c4_${i}">${court}</div></td>
    </tr>`;
  }).join('');
}

// کالم 1 ka block — naam (bold), phir تفصیل، phir حلیہ
function _sazaAccusedBlock(a) {
  if (!a.name && !a.halia) return '';
  const parts = [];
  const nameLine = [a.name, a.pesha ? ('پیشہ ' + a.pesha) : ''].filter(Boolean).join('، ');
  if (nameLine) parts.push('<div class="saza-acc-name">' + esc(nameLine) + '</div>');
  if (a.halia) parts.push('<div class="saza-acc-halia">حلیہ: ' + esc(a.halia) + '</div>');
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
  // Pehle se maujood naam (har row ke کالم 1 se)
  const mine = new Set();
  if (tbody) tbody.querySelectorAll('.saza-c1-body .saza-acc-name').forEach(el => {
    const nm = (el.innerText || '').split('،')[0].trim();
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

// Chune hue ملزمان ke hisaab se poori table dobara banao (har naam = aik row)
function _sazaSetAccused(names) {
  const all = _sazaAccList();
  const chosen = names.map(nm => all.find(a => a.name === nm)).filter(Boolean);
  if (!chosen.length) return;
  const c = _sazaCase || {};
  const tbody = document.getElementById('saza-tbody');
  if (!tbody) return;
  tbody.innerHTML = chosen.map((a, i) => {
    const dateTxt = a.arrest_date ? ((typeof formatDate === 'function') ? formatDate(a.arrest_date) : a.arrest_date) : '';
    const jurmTxt = (i === 0) ? (c.section_of_law || c.offence_type || '') : 'مندرجہ بالا';
    const picker = (i === 0)
      ? `<button class="saza-acc-pick no-print" onclick="_sazaAccPicker(event)" title="ملزمان منتخب کریں">▾</button>` : '';
    return `<tr data-row="${i}">
      <td class="saza-c1">
        ${picker}
        <div class="saza-c1-body" contenteditable="true" data-k="c1_${i}">${_sazaAccusedBlock(a)}</div>
      </td>
      <td class="saza-c2 rotcell"><div class="rotwrap"><div class="rotinner" contenteditable="true" data-k="c2_${i}">${esc(dateTxt)}</div></div></td>
      <td class="saza-c3 rotcell"><div class="rotwrap"><div class="rotinner" contenteditable="true" data-k="c3_${i}">${esc(jurmTxt)}</div></div></td>
      <td class="saza-c4"><div class="saza-c4-body" contenteditable="true" data-k="c4_${i}"></div></td>
    </tr>`;
  }).join('');
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

// ═══ PRINT — report173 jaisa (screen wala hi document, WAHI CSS) ═══
function _sazaPrint() {
  const doc = _sazaDoc(); if (!doc) return;
  const inner = doc.innerHTML;
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
      @page{ size:${_sazaPaper === 'a4' ? 'A4 portrait' : '8.5in 13in'}; margin:1cm ${_sazaSideMargin()}; }
      html, body{ margin:0 !important; padding:0 !important;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        direction:rtl; line-height:1.4; color:#000; font-size:${_sazaDocFont(_sazaSaved)}pt; }
      ${_sazaCSS()}
      #saza-doc{ width:100% !important; max-width:none !important; height:auto !important;
        min-height:0 !important; padding:0 !important; margin:0 !important;
        transform:none !important; box-shadow:none !important; border-radius:0 !important; }
      .no-print, .saza-acc-pick, button, select{ display:none !important; }
      /* Table agle safhe par jaye to headings dobara na aayen */
      .saza-table thead{ display:table-row-group; }
      /* Har row poori rahe (beech se na kate) */
      .saza-table tr{ page-break-inside:avoid; break-inside:avoid; }
      #saza-doc, #saza-doc *{ orphans:2; widows:2; }
      /* Doosre safhe ki bind jagah (مثلث) — chapai mein */
      .saza-bind{ display:none; }
      @media print{ .saza-bind{ display:block; } }
    </style></head><body><div id="saza-doc">${inner}</div></body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 300); }
}
window._sazaPrint = _sazaPrint;

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

    /* Line 2 — تھانہ(dayen, 1in) · سزاسلپ(center, 24pt underline) · ضلع(bayen).
       tt-mid absolute 50% par — hamesha safha-center. */
    #saza-doc .saza-title-row{ position:relative; display:flex; align-items:baseline;
      justify-content:space-between; width:100%; min-height:1.8em; }
    #saza-doc .saza-title-row > span{ white-space:nowrap; }
    #saza-doc .saza-tt-right{ text-align:right; font-size:14pt; padding-right:1in; }
    #saza-doc .saza-tt-left{ text-align:left; font-size:14pt; }
    #saza-doc .saza-tt-mid{ position:absolute; left:50%; transform:translateX(-50%);
      white-space:nowrap; font-size:24pt; text-decoration:underline; font-weight:bold; }

    /* Line 3 — مقدمہ نمبر / مورخہ / بجرم (center, 14pt) */
    #saza-doc .saza-caseline{ display:flex; gap:22px; align-items:baseline; font-size:14pt;
      margin:14px 0 12px 0; direction:rtl; flex-wrap:wrap; line-height:1.4; justify-content:center; }
    #saza-doc .saza-caseline .fl-lg{ min-width:60px; }

    /* ── TABLE ── */
    #saza-doc .saza-table{ width:100%; border-collapse:collapse; table-layout:fixed; direction:rtl; margin:0; }
    #saza-doc .saza-table th, #saza-doc .saza-table td{
      border:1px solid #000; padding:3px 5px; font-size:14pt; vertical-align:top;
      word-wrap:break-word; overflow-wrap:break-word;
    }
    #saza-doc .saza-table thead th{ text-align:center; vertical-align:middle; font-weight:normal; line-height:1.2; }
    /* Baahri bayen/dayen kinare khule (sirf andar ki lakeerein) */
    #saza-doc .saza-table th:first-child, #saza-doc .saza-table td:first-child{ border-right:none; }
    #saza-doc .saza-table th:last-child, #saza-doc .saza-table td:last-child{ border-left:none; }

    /* کالم 1 — naam+تفصیل+حلیہ, right justified */
    #saza-doc .saza-c1{ position:relative; text-align:justify; text-align-last:right; }
    #saza-doc .saza-c1-body{ outline:none; min-height:60px; }
    #saza-doc tr[data-row="0"] .saza-c1-body{ padding-left:26px; }
    #saza-doc .saza-acc-name{ font-weight:bold; }
    #saza-doc .saza-acc-halia{ font-size:14pt; }
    /* ملزمان chunne wala ▾ (chapai mein nahi) */
    #saza-doc .saza-acc-pick{
      position:absolute; top:2px; left:2px; width:22px; height:22px; line-height:1; padding:0;
      border:1px solid #0369a1; border-radius:5px; background:#eef6ff; color:#0369a1;
      cursor:pointer; font-size:13px; z-index:3;
    }

    /* کالم 2 / 3 — 270° khadi matn, khane ke beech mein */
    #saza-doc .saza-table td.rotcell{ padding:0; text-align:center; vertical-align:middle; position:relative; }
    #saza-doc .rotwrap{ display:flex; align-items:center; justify-content:center;
      width:100%; height:100%; min-height:120px; }
    #saza-doc .rotinner{
      display:inline-block; writing-mode:vertical-rl; -webkit-writing-mode:vertical-rl;
      transform:rotate(180deg); -webkit-transform:rotate(180deg);
      white-space:nowrap; line-height:1.3; text-align:center; outline:none;
      unicode-bidi:plaintext; font-size:14pt; padding:2px;
    }

    /* کالم 4 — حکم اخیر عدالت (khali/دستی) */
    #saza-doc .saza-c4-body{ outline:none; min-height:60px; text-align:justify; text-align-last:right; }

    /* ── SHO block (table ke neeche) ── */
    #saza-doc .saza-sho-block{
      display:inline-block; text-align:right; margin-top:20px; min-width:240px; direction:rtl;
    }
    /* dastkhat ki khali jagah — SHO naam ke OOPER */
    #saza-doc .saza-sho-sign{ border-bottom:1px solid #000; min-height:52px; margin-bottom:6px; width:100%; }
    /* SHO naam — bold + underline, bayen sidh (align: block left) */
    #saza-doc .saza-sho-name{
      font-weight:bold; text-decoration:underline; font-size:14pt; text-align:left;
      outline:none; white-space:nowrap; min-height:20px;
    }
    #saza-doc .saza-sho-name:empty::before{ content:'⚠ اوزار → SHO سے نام درج کریں'; color:#c00; font-size:11pt; font-weight:normal; text-decoration:none; }
    #saza-doc .saza-sho-date{ font-size:14pt; margin-top:4px; text-align:left; outline:none; cursor:pointer; min-height:20px; }
    #saza-doc .saza-sho-date:empty::before{ content:'تاریخ…'; color:#aaa; }

    /* ── Doosre safhe ki bind جگہ — مثلث (report173 jaisa) ── */
    #saza-doc .saza-bind{
      float:left; width:2in; height:2in; margin-top:1.25em;
      shape-outside:polygon(0 0, 2in 0, 0 2in);
      -webkit-shape-outside:polygon(0 0, 2in 0, 0 2in);
      shape-margin:3mm; -webkit-shape-margin:3mm;
      clip-path:polygon(0 0, 2in 0, 0 2in);
    }
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

