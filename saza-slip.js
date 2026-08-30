/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — سزا سلپ  (Saza Slip · Form No. 27-2(1)(الف))
   Case workspace ke "misal-doc-bar" chip se khulti hai (modal).
   Print alag se dioPrint() ke zariye saaf HTML document ban kar
   jata hai — A4 aur 8.5×13in Folio/Legal ledger dono @page
   rules support karta hai (toggle se chunte hain).

   AHEM — is session mein misal-docs.js, mulziman.js, report173.js,
   zimni.js, witnesses.js upload NAHI hui thin. Is liye do jagah
   "best-guess" tareeqa istemal hua hai — dono jagah neeche mark
   ki gayi hain, aur asaani se ek line mein theek ho sakti hain:

   1) CHIP INJECTION (misal-doc-bar mein button dikhana):
      Chunke misal-docs.js ka asal code nahi dekha ja saka, is
      liye renderMisalBar() ke andar chhera nahi gaya — bilkul
      SAFE/ADDITIVE tareeqa istemal hua: cases.js ke renderWorkspace()
      ke aakhir mein sirf EK line add ki gayi hai jo injectSazaSlipChip(c)
      ko call karti hai (neeche dekhein). Ek MutationObserver bhi
      lagaya gaya hai — agar bar kabhi dobara render ho (kisi aur
      jagah se) to chip khud-bakhud wapas aa jayegi.

   2) ACCUSED FIELD NAMES (case_accused table):
      حلیہ aur تاریخ گرفتاری ke column names confirm nahi ho sakay
      (mulziman.js upload nahi hui thi). _sazaNormalizeAccused()
      neeche kai mumkin naam try karta hai. Agar print mein woh
      khaana khaali aaye to bas asal column ka naam bata dein —
      ek line tabdeel karni hogi.
   ═══════════════════════════════════════════════════════════ */

// ── STATE ─────────────────────────────────────────────────────
let _sazaState = null;

// ── ENTRY POINT (chip onclick) ───────────────────────────────
async function openSazaSlip(caseId) {
  try {
    showToast('⏳ سزا سلپ تیار ہو رہی ہے...', 'info', 1200);
    const c = (typeof getCase === 'function') ? await getCase(caseId) : null;
    if (!c) { showToast('❌ مقدمہ نہیں ملا', 'error'); return; }

    let accused = [];
    try {
      const { data, error } = await supabaseClient
        .from('case_accused')
        .select('*')
        .eq('case_id', caseId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      accused = data || [];
    } catch (e) {
      console.warn('[SazaSlip] case_accused fetch failed:', e);
      showToast('⚠️ ملزمان کی فہرست خودکار لوڈ نہیں ہوئی — دستی طور پر شامل کریں', 'warn', 3500);
    }

    const normAccused = accused.map(_sazaNormalizeAccused);

    _sazaState = {
      caseId,
      case: c,
      accused: normAccused.length ? normAccused : [_sazaBlankAccused()],
      paperSize: localStorage.getItem('dio_saza_paper') || 'a4',
      fontKey: localStorage.getItem('dio_saza_font') || 'jameel',
      colWidths: _sazaLoadColWidths(),
      shoText: c.sho || '',
      footerDate: formatDate(new Date()),
    };
    _sazaInjectEditorCSS();
    _sazaRenderModal();
  } catch (err) {
    console.error('[SazaSlip] openSazaSlip error:', err);
    showToast('❌ سزا سلپ کھولنے میں مسئلہ: ' + ((err && err.message) || err), 'error');
  }
}
window.openSazaSlip = openSazaSlip;

function _sazaLoadColWidths() {
  try {
    const saved = JSON.parse(localStorage.getItem('dio_saza_colwidths') || 'null');
    if (Array.isArray(saved) && saved.length === 4) {
      const sum = saved.reduce((a, b) => a + b, 0);
      if (sum > 95 && sum < 105) return saved;
    }
  } catch (_) {}
  return [45, 10, 10, 35]; // ── LOCKED DEFAULT RATIO — spec ke mutabiq ──
}

// ── DATA NORMALIZATION (best-guess field names — dekhein header note 2) ──
function _sazaNormalizeAccused(a) {
  a = a || {};
  return {
    id: a.id || null,
    name: a.name || a.full_name || a.accused_name || '',
    halia: a.halia || a.halya || a.hulia || a.description || a.physical_description || a.appearance || '',
    arrestDate: a.arrest_date || a.date_of_arrest || a.giraftari_date || a.tareekh_giraftari || a.arrested_on || '',
  };
}
function _sazaBlankAccused() { return { id: null, name: '', halia: '', arrestDate: '' }; }

// ── CHIP WIRING ────────────────────────────────────────────────
// Shafi ke real misal-doc-bar mein "سزا سلپ" / "سزاسلپ" chip PEHLE
// SE maujood hai (misal-docs.js ki apni list mein — دیکھیں screenshot).
// Is liye NAYA chip append nahi karte — jo chip pehle se hai USI ka
// onclick apne openSazaSlip() par mor dete hain. Sirf agar (kisi wajah
// se) woh chip bilkul na milay, tab hi ek fallback chip append hota
// hai (neeche دوسرا حصہ).
function _sazaFindExistingChip(bar) {
  const all = bar.querySelectorAll('*');
  let best = null, bestLen = Infinity;
  for (const el of all) {
    if (el.id === 'saza-slip-chip') continue; // apna hi fallback chip nazar-andaz karo
    let ownText = '';
    for (const node of el.childNodes) {
      if (node.nodeType === 3) ownText += node.textContent; // sirf is element ka APNA text (bachon ka nahi)
    }
    const txt = ownText.replace(/\s+/g, '');
    if (txt.indexOf('سزا') !== -1 && txt.indexOf('سلپ') !== -1 && txt.length < bestLen) {
      best = el; bestLen = txt.length;
    }
  }
  return best;
}

function injectSazaSlipChip(c) {
  try {
    if (!c) return;
    const bar = document.getElementById('misal-doc-bar');
    if (!bar) return;

    // 1) PEHLE SE maujood "سزا سلپ" chip dhoondo aur hijack karo
    const real = _sazaFindExistingChip(bar);
    if (real) {
      real.setAttribute('onclick', '');   // purana inline handler (jo khaali page dikhata tha) hatao
      real.onclick = () => openSazaSlip(c.id);
      real.style.cursor = 'pointer';
      real.dataset.sazaWired = '1';
      return;
    }

    // 2) Fallback — agar bar mein "سزا سلپ" naam ka chip sirey se hi na ho
    const already = document.getElementById('saza-slip-chip');
    if (already) { already.onclick = () => openSazaSlip(c.id); return; }
    const rows = bar.querySelectorAll(':scope > div');
    const row = rows.length ? rows[rows.length - 1] : bar;
    const chip = document.createElement('span');
    chip.id = 'saza-slip-chip';
    chip.className = 'mdoc-chip';
    chip.setAttribute('role', 'button');
    chip.style.cursor = 'pointer';
    chip.textContent = '📜 سزا سلپ';
    chip.onclick = () => openSazaSlip(c.id);
    row.appendChild(chip);
  } catch (e) { console.warn('[SazaSlip] chip inject failed:', e); }
}
window.injectSazaSlipChip = injectSazaSlipChip;

// Self-healing safety net — agar misal-doc-bar kabhi cases.js ke
// hook se BAAHAR dobara render ho (kisi aur module se), wiring phir
// se lag jaye. #page-content tak scoped hai (poori body nahi) taake
// performance par asar na pade.
(function _sazaObserverInit() {
  function trySetup() {
    const target = document.getElementById('page-content');
    if (!target) { setTimeout(trySetup, 800); return; }
    try {
      const obs = new MutationObserver(function () {
        const bar = document.getElementById('misal-doc-bar');
        const c = window._workspaceCase;
        if (!bar || !c) return;
        const alreadyWired = bar.querySelector('[data-saza-wired="1"]') || document.getElementById('saza-slip-chip');
        if (!alreadyWired) injectSazaSlipChip(c);
      });
      obs.observe(target, { childList: true, subtree: true });
    } catch (_) {}
  }
  if (document.readyState !== 'loading') trySetup();
  else document.addEventListener('DOMContentLoaded', trySetup);
})();

// ── EDITOR CSS (ek dafa inject hoti hai) ───────────────────────
function _sazaInjectEditorCSS() {
  if (document.getElementById('saza-editor-css')) return;
  const st = document.createElement('style');
  st.id = 'saza-editor-css';
  st.textContent = `
    .saza-handle { position:absolute; top:0; bottom:0; width:14px; margin-inline-start:-7px; cursor:col-resize; touch-action:none; z-index:5; }
    .saza-handle::after { content:''; position:absolute; top:0; bottom:0; left:6px; width:2px; background:transparent; }
    .saza-handle:hover::after, .saza-handle.dragging::after { background: var(--accent,#2563eb); }
    #saza-edit-tbl textarea, #saza-edit-tbl input { outline:none; }
    #saza-edit-tbl textarea:focus, #saza-edit-tbl input:focus { background:#fffbea !important; }
  `;
  document.head.appendChild(st);
}

// ── MODAL RENDER ──────────────────────────────────────────────
function _sazaRenderModal() {
  const footer = `
    <div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;flex-wrap:wrap;width:100%;">
      <button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>
      <button class="btn btn-primary" onclick="_sazaPrint()">🖨️ پرنٹ کریں</button>
    </div>`;
  openModal('📜 سزا سلپ — فارم نمبر 27-2(1)(الف)', _sazaModalBodyHTML(), footer);
  setTimeout(_sazaInitResize, 60);
}

function _sazaModalBodyHTML() {
  const st = _sazaState;
  const c = st.case;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) || {};
  const zila = o.district || c.case_district || '';
  const thana = o.station || c.case_station || '';
  const fir = c.fir_number || '';
  const firDate = formatDate(c.fir_date);
  const offence = c.offence_type || c.section_of_law || '';
  const rowsHtml = st.accused.map(function (a, i) { return _sazaRowHTML(a, i); }).join('');

  return `
    <div style="direction:rtl;">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <div style="display:flex;gap:6px;align-items:center;">
          <span style="font-size:11px;color:var(--text-muted);">کاغذ کا سائز</span>
          <button type="button" id="saza-paper-a4" class="btn btn-sm ${st.paperSize === 'a4' ? 'btn-primary' : 'btn-secondary'}" onclick="_sazaSetPaper('a4')">A4</button>
          <button type="button" id="saza-paper-legal" class="btn btn-sm ${st.paperSize === 'legal' ? 'btn-primary' : 'btn-secondary'}" onclick="_sazaSetPaper('legal')">Legal 8.5×13</button>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span style="font-size:11px;color:var(--text-muted);">فونٹ</span>
          <select id="saza-font-sel" onchange="_sazaSetFont(this.value)" style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;padding:4px 8px;font-size:11px;color:var(--text-secondary);">
            <option value="jameel" ${st.fontKey === 'jameel' ? 'selected' : ''}>Jameel Noori Nastaleeq</option>
            <option value="noto" ${st.fontKey === 'noto' ? 'selected' : ''}>Noto Nastaliq Urdu</option>
            <option value="times" ${st.fontKey === 'times' ? 'selected' : ''}>Times New Roman</option>
            <option value="arial" ${st.fontKey === 'arial' ? 'selected' : ''}>Arial</option>
          </select>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="_sazaAddRow()" style="margin-inline-start:auto;">+ ملزم شامل کریں</button>
      </div>

      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">
        مقدمہ نمبر <bdi class="dio-ltr">${esc(fir)}</bdi> · مورخہ <bdi class="dio-ltr">${esc(firDate)}</bdi> · بجرم ${esc(offence)} · ضلع ${esc(zila)} · تھانہ ${esc(thana)}
      </div>

      <div id="saza-tbl-wrap" style="overflow-x:auto;background:#fff;border-radius:6px;padding:10px;">
        <div id="saza-resize-wrap" style="position:relative;min-width:460px;">
          <table id="saza-edit-tbl" dir="rtl" style="width:100%;border-collapse:collapse;table-layout:fixed;color:#000;">
            <colgroup>
              <col id="saza-col-1" style="width:${st.colWidths[0]}%">
              <col id="saza-col-2" style="width:${st.colWidths[1]}%">
              <col id="saza-col-3" style="width:${st.colWidths[2]}%">
              <col id="saza-col-4" style="width:${st.colWidths[3]}%">
            </colgroup>
            <thead>
              <tr style="background:#f0f0f0;">
                <th style="border:1px solid #999;padding:6px;font-size:12px;">نام و حلیہ ملزمان</th>
                <th style="border:1px solid #999;padding:6px;font-size:12px;">تاریخ گرفتاری</th>
                <th style="border:1px solid #999;padding:6px;font-size:12px;">مندجہ بالا</th>
                <th style="border:1px solid #999;padding:6px;font-size:12px;">خالی</th>
              </tr>
            </thead>
            <tbody id="saza-edit-tbody">${rowsHtml}</tbody>
          </table>
          <div class="saza-handle" data-idx="0"></div>
          <div class="saza-handle" data-idx="1"></div>
          <div class="saza-handle" data-idx="2"></div>
        </div>
      </div>
      <div style="font-size:10px;color:var(--text-faint);margin-top:4px;">↔️ کالموں کے درمیان لکیر پکڑ کر چوڑائی گھٹائیں بڑھائیں — پرنٹ میں بھی یہی تناسب جائے گا</div>

      <div style="margin-top:16px;padding-top:10px;border-top:1px dashed var(--border);width:45%;">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">SHO — نام / رینک (پرنٹ پر بولڈ و انڈرلائن ہوگا، ساتھ تھانہ خودکار جڑے گا)</div>
        <input id="saza-sho-input" class="form-input" style="margin-bottom:8px;" value="${esc(st.shoText)}" placeholder="مثلاً: محمد اسلم ASI">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">تاریخ</div>
        <input id="saza-date-input" class="form-input dio-ltr" style="text-align:left;" oninput="autoFormatDate(this)" value="${esc(st.footerDate)}">
      </div>
    </div>`;
}

function _sazaRowHTML(a, i) {
  const dateVal = a.arrestDate ? formatDate(a.arrestDate) : '';
  const removeBtn = i > 0
    ? `<button type="button" onclick="_sazaRemoveRow(${i})" title="یہ ملزم ہٹائیں" style="position:absolute;top:2px;left:2px;border:none;background:rgba(200,0,0,0.08);color:#c00;cursor:pointer;font-size:12px;line-height:1;padding:2px 5px;border-radius:3px;">✕</button>`
    : '';
  return `<tr data-row="${i}">
    <td style="border:1px solid #999;padding:6px;vertical-align:top;">
      <textarea class="saza-name-input" data-row="${i}" rows="1" style="width:100%;border:none;background:transparent;font-family:inherit;font-size:13px;resize:vertical;margin-bottom:4px;color:#000;" placeholder="نام ملزم" onblur="_sazaSyncRow(${i})">${esc(a.name)}</textarea>
      <textarea class="saza-halia-input" data-row="${i}" rows="2" style="width:100%;border:1px dashed #ccc;background:#fafafa;font-family:inherit;font-size:11px;resize:vertical;color:#000;" placeholder="حلیہ" onblur="_sazaSyncRow(${i})">${esc(a.halia)}</textarea>
    </td>
    <td style="border:1px solid #999;padding:4px;text-align:center;vertical-align:middle;">
      <input class="saza-date-input-row dio-ltr" data-row="${i}" style="width:88%;text-align:center;border:1px solid #ccc;font-size:11px;color:#000;" oninput="autoFormatDate(this)" onblur="_sazaSyncRow(${i})" value="${esc(dateVal)}" placeholder="DD-MM-YYYY">
    </td>
    <td style="border:1px solid #999;padding:4px;text-align:center;font-size:11px;color:#666;">${i > 0 ? 'مندجہ بالا' : ''}</td>
    <td style="border:1px solid #999;padding:4px;position:relative;">${removeBtn}</td>
  </tr>`;
}

// ── ROW OPS ────────────────────────────────────────────────────
function _sazaSyncRow(i) {
  const st = _sazaState;
  if (!st || !st.accused[i]) return;
  const nameEl = document.querySelector('.saza-name-input[data-row="' + i + '"]');
  const haliaEl = document.querySelector('.saza-halia-input[data-row="' + i + '"]');
  const dateEl = document.querySelector('.saza-date-input-row[data-row="' + i + '"]');
  if (nameEl) st.accused[i].name = nameEl.value;
  if (haliaEl) st.accused[i].halia = haliaEl.value;
  if (dateEl) st.accused[i].arrestDate = dateEl.value;
}
function _sazaSyncAllRows() {
  if (!_sazaState) return;
  _sazaState.accused.forEach(function (_, i) { _sazaSyncRow(i); });
}
function _sazaAddRow() {
  _sazaSyncAllRows();
  _sazaState.accused.push(_sazaBlankAccused());
  _sazaRefreshTable();
}
function _sazaRemoveRow(i) {
  _sazaSyncAllRows();
  if (_sazaState.accused.length <= 1) { showToast('⚠️ کم از کم ایک ملزم درکار ہے', 'warn'); return; }
  _sazaState.accused.splice(i, 1);
  _sazaRefreshTable();
}
function _sazaRefreshTable() {
  const tbody = document.getElementById('saza-edit-tbody');
  if (tbody) tbody.innerHTML = _sazaState.accused.map(function (a, i) { return _sazaRowHTML(a, i); }).join('');
}
window._sazaAddRow = _sazaAddRow;
window._sazaRemoveRow = _sazaRemoveRow;
window._sazaSyncRow = _sazaSyncRow;

// ── PAPER / FONT TOGGLES ───────────────────────────────────────
function _sazaSetPaper(v) {
  _sazaState.paperSize = v;
  localStorage.setItem('dio_saza_paper', v);
  const a4 = document.getElementById('saza-paper-a4');
  const lg = document.getElementById('saza-paper-legal');
  if (a4) a4.className = 'btn btn-sm ' + (v === 'a4' ? 'btn-primary' : 'btn-secondary');
  if (lg) lg.className = 'btn btn-sm ' + (v === 'legal' ? 'btn-primary' : 'btn-secondary');
}
function _sazaSetFont(v) {
  _sazaState.fontKey = v;
  localStorage.setItem('dio_saza_font', v);
}
window._sazaSetPaper = _sazaSetPaper;
window._sazaSetFont = _sazaSetFont;

// ── COLUMN RESIZE (drag handles — "movable/adjustable grid") ───
function _sazaApplyColWidths() {
  const w = _sazaState.colWidths;
  ['saza-col-1', 'saza-col-2', 'saza-col-3', 'saza-col-4'].forEach(function (id, i) {
    const el = document.getElementById(id);
    if (el) el.style.width = w[i] + '%';
  });
}
function _sazaPositionHandles() {
  const wrap = document.getElementById('saza-resize-wrap');
  if (!wrap) return;
  const w = _sazaState.colWidths;
  // Table dir=rtl → column 1 (index0) renders on the RIGHT. Handle
  // "right" position = cumulative width from the right edge.
  const cum = [w[0], w[0] + w[1], w[0] + w[1] + w[2]];
  wrap.querySelectorAll('.saza-handle').forEach(function (h, i) {
    h.style.right = cum[i] + '%';
    h.style.left = 'auto';
  });
}
function _sazaInitResize() {
  const wrap = document.getElementById('saza-resize-wrap');
  if (!wrap) return;
  _sazaPositionHandles();
  wrap.querySelectorAll('.saza-handle').forEach(function (h) {
    h.addEventListener('pointerdown', _sazaHandleDown);
  });
}
function _sazaHandleDown(e) {
  e.preventDefault();
  const handle = e.currentTarget;
  const idx = parseInt(handle.dataset.idx, 10); // 0,1,2 → boundary between col(idx+1) & col(idx+2)
  const wrap = document.getElementById('saza-resize-wrap');
  if (!wrap) return;
  const rect = wrap.getBoundingClientRect();
  const startX = e.clientX;
  const startWidths = _sazaState.colWidths.slice();
  handle.classList.add('dragging');

  function onMove(ev) {
    const dx = ev.clientX - startX; // physical screen delta (rect is always LTR-measured)
    const deltaPct = (dx / rect.width) * 100;
    const MIN = 6;
    let newA = startWidths[idx] - deltaPct;     // right-side column of this handle
    let newB = startWidths[idx + 1] + deltaPct; // left-side column of this handle
    if (newA < MIN) { newB -= (MIN - newA); newA = MIN; }
    if (newB < MIN) { newA -= (MIN - newB); newB = MIN; }
    const nw = startWidths.slice();
    nw[idx] = newA;
    nw[idx + 1] = newB;
    _sazaState.colWidths = nw;
    _sazaApplyColWidths();
    _sazaPositionHandles();
  }
  function onUp() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    handle.classList.remove('dragging');
    try { localStorage.setItem('dio_saza_colwidths', JSON.stringify(_sazaState.colWidths)); } catch (_) {}
  }
  document.addEventListener('pointermove', onMove);
  document.addEventListener('pointerup', onUp);
}

// ── PRINT ────────────────────────────────────────────────────
function _sazaPrint() {
  if (!_sazaState) return;
  _sazaSyncAllRows();
  const shoInput = document.getElementById('saza-sho-input');
  const dateInput = document.getElementById('saza-date-input');
  _sazaState.shoText = shoInput ? shoInput.value : (_sazaState.case.sho || '');
  _sazaState.footerDate = dateInput ? dateInput.value : formatDate(new Date());
  const html = _sazaBuildPrintHTML(_sazaState);
  if (typeof dioPrint === 'function') dioPrint(html);
  else showToast('❌ پرنٹ فنکشن دستیاب نہیں (dioPrint missing)', 'error');
}
window._sazaPrint = _sazaPrint;

function _sazaNl2br(s) { return esc(s).replace(/\n/g, '<br>'); }

function _sazaBuildPrintHTML(state) {
  const c = state.case;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) || {};
  const zila = o.district || c.case_district || '';
  const thana = o.station || c.case_station || '';
  const fir = c.fir_number || '';
  const firDate = formatDate(c.fir_date);
  const offence = c.offence_type || c.section_of_law || '';
  const w = state.colWidths;

  const fonts = {
    jameel: "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif",
    noto: "'Noto Nastaliq Urdu',serif",
    times: "'Times New Roman',serif",
    arial: "Arial,sans-serif",
  };
  const fontFamily = fonts[state.fontKey] || fonts.jameel;

  // ── DUAL PAPER SIZE — spec: A4 aur 8.5×13in Folio/Legal ledger.
  // (Codebase mein pehle se "Folio 8.5×13in" hi is qism ke form ke
  //  liye istemal hoti hai — misal-templates.js ka index_naql
  //  template dekhein — is liye "8x13" ko usi standard Folio size
  //  ke barabar liya gaya hai.)
  const pageCSS = state.paperSize === 'legal'
    ? 'size: 8.5in 13in; margin: 0.5cm;'
    : 'size: A4; margin: 0.5cm;';

  const rowsHtml = state.accused.map(function (a, i) {
    const dateHtml = a.arrestDate
      ? '<span class="saza-vert dio-ltr">' + esc(formatDate(a.arrestDate)) + '</span>'
      : '';
    const col3Html = i > 0 ? '<span class="saza-vert">مندجہ بالا</span>' : '';
    return `<tr>
      <td class="saza-c1">${_sazaNl2br(a.name)}${a.halia ? '<div class="saza-halia">' + _sazaNl2br(a.halia) + '</div>' : ''}</td>
      <td class="saza-c2"><div class="saza-vwrap">${dateHtml}</div></td>
      <td class="saza-c3"><div class="saza-vwrap">${col3Html}</div></td>
      <td class="saza-c4"></td>
    </tr>`;
  }).join('');

  const shoLine = state.shoText ? esc(state.shoText) : '';
  const thanaBit = thana ? ' — تھانہ ' + esc(thana) : '';

  return `<!DOCTYPE html>
<html dir="rtl" lang="ur">
<head>
<meta charset="UTF-8">
<title>سزا سلپ — ${esc(fir)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  @font-face {
    font-family: 'Jameel Noori Nastaleeq';
    src: local('Jameel Noori Nastaleeq'), local('JameelNooriNastaleeq'), local('Jameel Noori Nastaleeq Regular'),
         url('https://cdn.jsdelivr.net/npm/jameel-noori/fonts/jameel-noori-nastaleeq4.woff2') format('woff2'),
         url('https://unpkg.com/jameel-noori/fonts/jameel-noori-nastaleeq4.woff2') format('woff2');
  }
  @page { ${pageCSS} }
  * { box-sizing: border-box; }
  html, body { margin:0; padding:0; }
  body {
    font-family: ${fontFamily};
    direction: rtl;
    text-align: right;
    font-size: 14pt;
    color: #000;
  }
  /* Mixed Urdu+English bidi — house convention (dioNameWithCnic pattern) */
  .dio-ltr { direction: ltr; unicode-bidi: isolate; }

  /* ── Form number — 12pt, center, unbold ── */
  .saza-formno { text-align:center; font-size:12pt; font-weight:normal; margin:0 0 3pt; }

  /* ── Line 2 — ضلع far-left(0.25in) / سزا سلپ exact-center(24pt underline) / تھانہ far-right(1in) ── */
  .saza-line2 { position:relative; width:100%; margin:0 0 3pt; }
  .saza-zila { position:absolute; left:0.25in; top:50%; transform:translateY(-50%); font-size:14pt; font-weight:normal; white-space:nowrap; }
  .saza-thana { position:absolute; right:1in; top:50%; transform:translateY(-50%); font-size:14pt; font-weight:normal; white-space:nowrap; }
  .saza-title { text-align:center; font-size:24pt; font-weight:normal; text-decoration:underline; margin:0; }

  .saza-sub { text-align:center; font-size:14pt; margin:0 0 6pt; }

  /* ── Table — outer left/right borders removed, only inner + horizontal remain ── */
  table.saza-tbl { width:100%; border-collapse:collapse; table-layout:fixed; margin:0; }
  table.saza-tbl th, table.saza-tbl td { font-size:14pt; padding:4pt 6pt; }
  table.saza-tbl th { font-weight:normal; }
  thead .saza-c1 { vertical-align:middle; text-align:center; }
  .saza-c1 { border-top:1pt solid #000; border-bottom:1pt solid #000; border-left:1pt solid #000; vertical-align:top; }
  .saza-c2 { border-top:1pt solid #000; border-bottom:1pt solid #000; border-left:1pt solid #000; text-align:center; vertical-align:middle; }
  .saza-c3 { border-top:1pt solid #000; border-bottom:1pt solid #000; border-left:1pt solid #000; text-align:center; vertical-align:middle; }
  .saza-c4 { border-top:1pt solid #000; border-bottom:1pt solid #000; } /* koi left/right border nahi — bilkul khali */

  /* ── Column 2/3 rotated text — 270deg, center ── */
  .saza-vwrap { display:flex; align-items:center; justify-content:center; min-height:50pt; }
  .saza-vert { display:inline-block; transform:rotate(270deg); white-space:nowrap; font-size:14pt; }

  .saza-halia { font-size:14pt; margin-top:2pt; }

  /* ── SHO footer — column1 ke neeche, left-aligned, 45% width ── */
  .saza-footer { width:${w[0]}%; text-align:left; margin-top:22pt; }
  .saza-sho-line { font-weight:bold; text-decoration:underline; font-size:14pt; }
  .saza-sho-date { margin-top:3pt; font-size:14pt; }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>
  <div class="saza-formno">فارم نمبر 27-2(1)(الف)</div>
  <div class="saza-line2">
    <span class="saza-zila">ضلع ${esc(zila)}</span>
    <div class="saza-title">سزا سلپ</div>
    <span class="saza-thana">تھانہ ${esc(thana)}</span>
  </div>
  <div class="saza-sub">مقدمہ نمبر <bdi class="dio-ltr">${esc(fir)}</bdi> مورخہ <bdi class="dio-ltr">${esc(firDate)}</bdi> بجرم ${esc(offence)}</div>
  <table class="saza-tbl">
    <colgroup>
      <col style="width:${w[0]}%"><col style="width:${w[1]}%"><col style="width:${w[2]}%"><col style="width:${w[3]}%">
    </colgroup>
    <thead>
      <tr>
        <th class="saza-c1">ملزمان کے نام و حلیہ</th>
        <th class="saza-c2"></th>
        <th class="saza-c3"></th>
        <th class="saza-c4"></th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="saza-footer">
    <div class="saza-sho-line">${shoLine}${thanaBit}</div>
    <div class="saza-sho-date">${esc(state.footerDate || '')}</div>
  </div>
</body>
</html>`;
}
