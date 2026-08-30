/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — سزا سلپ  (Saza Slip · Form No. 27-2(1)(الف))
   Case workspace ke "misal-doc-bar" chip se khulti hai (modal).
   Print alag se dioPrint() ke zariye saaf HTML document ban kar
   jata hai — A4 aur 8.5×13in Folio/Legal ledger dono @page
   rules support karta hai (toggle se chunte hain).

   V2 — SAZA_SLIP.docx (asal manzoor-shuda form) ke hisab se dobara
   banaya gaya. Woh docx word/document.xml se nikali gayi EXACT
   qadrein is file mein hain: column widths (5130/990/900/3835 dxa
   = 47.26/9.12/8.29/35.33%), column headers, font sizes (form no.
   12pt · ضلع/تھانہ 16pt · عنوان 24pt bold+underline · جدول کے
   headers 16-18pt · متن 16-18pt), "مندرجہ بالا" ki sahih ہجے (ر
   ke sath), SHO block center-aligned (docx mein bhi center hai).
   Column 3 ka header "جرم" hai (sirf repetition-mark nahi) — pehli
   row mein asal جرم/دفعہ likha jata hai, agli rows mein "مندرجہ
   بالا"۔ Column 4 ka header "حکم اخیر عدالت" hai (adalat ka aakhri
   faisla — dastak/print ke baad دستی طور پر لکھا جاتا ہے).

   AHEM — mulziman.js is session mein bhi upload nahi hui, is liye
   case_accused table ke column names (ولدیت/قومیت/سکونت/پیشہ/حلیہ/
   تاریخ گرفتاری) ab bhi ANDAZE se try kiye ja rahe hain
   (_sazaNormalizeAccused). Print mein jo khaana khaali aaye uska
   asal column naam bata dein — ek line tabdeel karni hogi.

   CHIP WIRING: misal-doc-bar mein "سزا سلپ" chip PEHLE SE maujood
   hai (Shafi ki screenshot se confirm) — is liye naya chip nahi
   banate, jo hai USI ka onclick apne openSazaSlip() par mor dete
   hain (neeche _sazaFindExistingChip). cases.js mein sirf EK line
   add hui hai jo injectSazaSlipChip(c) call karti hai.
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
    if (!normAccused.length) normAccused.push(_sazaBlankAccused());
    // Column 3 "جرم" — pehli row case ke offence se auto-bharti hai,
    // baqi rows "مندرجہ بالا" (repeat marker) — dono editable rehte hain.
    normAccused.forEach(function (a, i) {
      a.jurm = i === 0 ? (c.offence_type || c.section_of_law || '') : 'مندرجہ بالا';
    });

    _sazaState = {
      caseId,
      case: c,
      accused: normAccused,
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
  return [47.3, 9.1, 8.3, 35.3]; // ── LOCKED DEFAULT — asal SAZA_SLIP.docx ke gridCol se (5130/990/900/3835 dxa) ──
}

// ── DATA NORMALIZATION (best-guess field names — dekhein header note) ──
function _sazaNormalizeAccused(a) {
  a = a || {};
  return {
    id: a.id || null,
    name: a.name || a.full_name || a.accused_name || '',
    walid: a.walid || a.father_name || a.waldiat || a.s_o || a.wd_name || '',
    qaumiyat: a.qaumiyat || a.caste || a.cast || a.nationality || '',
    sukoonat: a.sukoonat || a.address || a.residence || a.sukunat || '',
    pesha: a.pesha || a.occupation || a.profession || '',
    halia: a.halia || a.halya || a.hulia || a.description || a.physical_description || a.appearance || '',
    arrestDate: a.arrest_date || a.date_of_arrest || a.giraftari_date || a.tareekh_giraftari || a.arrested_on || '',
    jurm: '',        // is Saza Slip ke liye khaas — row0 par case ke offence se auto-bhar jata hai
    courtOrder: '',  // حکم اخیر عدالت — hamesha khaali/دستی (adalat ka faisla baad mein likha jata hai)
  };
}
function _sazaBlankAccused() {
  return { id: null, name: '', walid: '', qaumiyat: '', sukoonat: '', pesha: '', halia: '', arrestDate: '', jurm: '', courtOrder: '' };
}

// نام ولدیت قومیت سکونت پیشہ — ek jumlay mein jorta hai (حلیہ alag line par)
function _sazaAccusedLine(a) {
  const parts = [];
  if (a.name) parts.push(a.name);
  if (a.walid) parts.push('ولد ' + a.walid);
  if (a.qaumiyat) parts.push('قوم ' + a.qaumiyat);
  if (a.sukoonat) parts.push('سکونت ' + a.sukoonat);
  if (a.pesha) parts.push('پیشہ ' + a.pesha);
  return parts.join('، ');
}

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
                <th style="border:1px solid #999;padding:6px;font-size:12px;">نام ولدیت قومیت سکونت حلیہ و پیشہ ملزم</th>
                <th style="border:1px solid #999;padding:6px;font-size:12px;font-weight:700;">تاریخ گرفتاری</th>
                <th style="border:1px solid #999;padding:6px;font-size:12px;font-weight:700;">جرم</th>
                <th style="border:1px solid #999;padding:6px;font-size:12px;">حکم اخیر عدالت</th>
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
    ? `<button type="button" onclick="_sazaRemoveRow(${i})" title="یہ ملزم ہٹائیں" style="position:absolute;top:2px;left:2px;border:none;background:rgba(200,0,0,0.08);color:#c00;cursor:pointer;font-size:12px;line-height:1;padding:2px 5px;border-radius:3px;z-index:2;">✕</button>`
    : '';
  const miniInput = (cls, val, ph) =>
    `<input class="${cls}" data-row="${i}" style="width:100%;border:1px solid #ddd;background:#fafafa;font-family:inherit;font-size:11px;color:#000;padding:2px 4px;margin-bottom:3px;" placeholder="${ph}" onblur="_sazaSyncRow(${i})" value="${esc(val)}">`;
  return `<tr data-row="${i}">
    <td style="border:1px solid #999;padding:6px;vertical-align:top;">
      <textarea class="saza-name-input" data-row="${i}" rows="1" style="width:100%;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:600;resize:vertical;margin-bottom:4px;color:#000;" placeholder="نام ملزم" onblur="_sazaSyncRow(${i})">${esc(a.name)}</textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
        ${miniInput('saza-walid-input', a.walid, 'ولدیت')}
        ${miniInput('saza-qaumiyat-input', a.qaumiyat, 'قومیت')}
        ${miniInput('saza-sukoonat-input', a.sukoonat, 'سکونت')}
        ${miniInput('saza-pesha-input', a.pesha, 'پیشہ')}
      </div>
      <textarea class="saza-halia-input" data-row="${i}" rows="2" style="width:100%;border:1px dashed #ccc;background:#fafafa;font-family:inherit;font-size:11px;resize:vertical;color:#000;margin-top:2px;" placeholder="حلیہ" onblur="_sazaSyncRow(${i})">${esc(a.halia)}</textarea>
    </td>
    <td style="border:1px solid #999;padding:4px;text-align:center;vertical-align:middle;">
      <input class="saza-date-input-row dio-ltr" data-row="${i}" style="width:88%;text-align:center;border:1px solid #ccc;font-size:11px;color:#000;" oninput="autoFormatDate(this)" onblur="_sazaSyncRow(${i})" value="${esc(dateVal)}" placeholder="DD-MM-YYYY">
    </td>
    <td style="border:1px solid #999;padding:4px;text-align:center;vertical-align:middle;">
      <textarea class="saza-jurm-input" data-row="${i}" rows="2" style="width:92%;border:1px solid #ccc;font-size:11px;color:#000;text-align:center;resize:vertical;" placeholder="جرم" onblur="_sazaSyncRow(${i})">${esc(a.jurm)}</textarea>
    </td>
    <td style="border:1px solid #999;padding:4px;position:relative;vertical-align:top;">
      ${removeBtn}
      <textarea class="saza-court-input" data-row="${i}" rows="4" style="width:100%;border:1px solid #ddd;background:#fafafa;font-family:inherit;font-size:11px;color:#000;resize:vertical;padding-top:${i > 0 ? '18px' : '2px'};" placeholder="حکم اخیر عدالت (بعد میں دستی)" onblur="_sazaSyncRow(${i})">${esc(a.courtOrder)}</textarea>
    </td>
  </tr>`;
}

// ── ROW OPS ────────────────────────────────────────────────────
function _sazaSyncRow(i) {
  const st = _sazaState;
  if (!st || !st.accused[i]) return;
  const q = (cls) => document.querySelector(cls + '[data-row="' + i + '"]');
  const nameEl = q('.saza-name-input'), haliaEl = q('.saza-halia-input'), dateEl = q('.saza-date-input-row');
  const walidEl = q('.saza-walid-input'), qaumEl = q('.saza-qaumiyat-input');
  const sukoonEl = q('.saza-sukoonat-input'), peshaEl = q('.saza-pesha-input');
  const jurmEl = q('.saza-jurm-input'), courtEl = q('.saza-court-input');
  if (nameEl) st.accused[i].name = nameEl.value;
  if (haliaEl) st.accused[i].halia = haliaEl.value;
  if (dateEl) st.accused[i].arrestDate = dateEl.value;
  if (walidEl) st.accused[i].walid = walidEl.value;
  if (qaumEl) st.accused[i].qaumiyat = qaumEl.value;
  if (sukoonEl) st.accused[i].sukoonat = sukoonEl.value;
  if (peshaEl) st.accused[i].pesha = peshaEl.value;
  if (jurmEl) st.accused[i].jurm = jurmEl.value;
  if (courtEl) st.accused[i].courtOrder = courtEl.value;
}
function _sazaSyncAllRows() {
  if (!_sazaState) return;
  _sazaState.accused.forEach(function (_, i) { _sazaSyncRow(i); });
}
function _sazaAddRow() {
  _sazaSyncAllRows();
  const blank = _sazaBlankAccused();
  blank.jurm = 'مندرجہ بالا'; // naya row hamesha pehli row ke baad hi aata hai
  _sazaState.accused.push(blank);
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
  const w = state.colWidths;

  const fonts = {
    jameel: "'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif",
    noto: "'Noto Nastaliq Urdu',serif",
    times: "'Times New Roman',serif",
    arial: "Arial,sans-serif",
  };
  const fontFamily = fonts[state.fontKey] || fonts.jameel;

  // ── DUAL PAPER SIZE — A4 (asal SAZA_SLIP.docx isi size mein hai)
  // aur 8.5×13in Folio/Legal ledger. ("8x13" ko standard Folio ke
  // barabar liya gaya hai — misal-templates.js ka index_naql bhi
  // yehi size istemal karta hai.)
  const pageCSS = state.paperSize === 'legal'
    ? 'size: 8.5in 13in; margin: 0.5in 0.375in 0.5in 0.25in;'
    : 'size: A4; margin: 0.5in 0.375in 0.5in 0.25in;'; // asal docx ke pgMar se (top/right/bottom/left)

  const rowsHtml = state.accused.map(function (a, i) {
    const dateHtml = a.arrestDate
      ? '<span class="saza-vert dio-ltr">' + esc(formatDate(a.arrestDate)) + '</span>'
      : '';
    const jurmHtml = a.jurm ? '<span class="saza-vert">' + _sazaNl2br(a.jurm) + '</span>' : '';
    const detailLine = _sazaAccusedLine(a);
    return `<tr>
      <td class="saza-c1">${detailLine ? _sazaNl2br(detailLine) : ''}${a.halia ? '<div class="saza-halia">حلیہ: ' + _sazaNl2br(a.halia) + '</div>' : ''}</td>
      <td class="saza-c2"><div class="saza-vwrap">${dateHtml}</div></td>
      <td class="saza-c3"><div class="saza-vwrap">${jurmHtml}</div></td>
      <td class="saza-c4">${a.courtOrder ? _sazaNl2br(a.courtOrder) : ''}</td>
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
    font-size: 16pt;
    color: #000;
  }
  /* Mixed Urdu+English bidi — house convention (dioNameWithCnic pattern) */
  .dio-ltr { direction: ltr; unicode-bidi: isolate; }

  /* ── Form number — 12pt, center, unbold (asal docx ke mutabiq) ── */
  .saza-formno { text-align:center; font-size:12pt; font-weight:normal; margin:0 0 3pt; }

  /* ── Line 2 — ضلع far-left(0.25in) / سزا سلپ exact-center(24pt bold+underline) / تھانہ far-right(1in) ── */
  .saza-line2 { position:relative; width:100%; margin:0 0 6pt; min-height:26pt; }
  .saza-zila { position:absolute; left:0.25in; top:50%; transform:translateY(-50%); font-size:16pt; font-weight:normal; white-space:nowrap; }
  .saza-thana { position:absolute; right:1in; top:50%; transform:translateY(-50%); font-size:16pt; font-weight:normal; white-space:nowrap; }
  .saza-title { text-align:center; font-size:24pt; font-weight:bold; text-decoration:underline; margin:0; }

  /* Digital IO ka izafi (docx mein nahi tha) — sirf case identify karne ke liye, chhota aur halka */
  .saza-sub { text-align:center; font-size:11pt; color:#444; margin:0 0 8pt; }

  /* ── Table — outer left/right borders removed, only inner + horizontal remain ── */
  table.saza-tbl { width:100%; border-collapse:collapse; table-layout:fixed; margin:0; }
  table.saza-tbl th, table.saza-tbl td { padding:5pt 6pt; }
  /* Data cells (defaults) — thead scoped selectors neeche INHI ko override karte hain (higher specificity, source-order se azad) */
  .saza-c1 { border-top:1pt solid #000; border-bottom:1pt solid #000; border-left:1pt solid #000; vertical-align:top; font-size:16pt; text-align:justify; }
  .saza-c2 { border-top:1pt solid #000; border-bottom:1pt solid #000; border-left:1pt solid #000; text-align:center; vertical-align:middle; font-size:16pt; }
  .saza-c3 { border-top:1pt solid #000; border-bottom:1pt solid #000; border-left:1pt solid #000; text-align:center; vertical-align:middle; font-size:18pt; }
  .saza-c4 { border-top:1pt solid #000; border-bottom:1pt solid #000; font-size:18pt; font-weight:bold; text-align:center; vertical-align:top; } /* koi left/right border nahi — bilkul khali/دستی */
  /* Header cells — asal docx ke mutabiq: col1/col4 unbold, col2/col3 bold; col2 16pt, باقی 18pt */
  thead .saza-c1 { font-size:18pt; font-weight:normal; vertical-align:middle; text-align:center; }
  thead .saza-c2 { font-size:16pt; font-weight:bold; text-align:center; vertical-align:middle; }
  thead .saza-c3 { font-size:18pt; font-weight:bold; text-align:center; vertical-align:middle; }
  thead .saza-c4 { font-size:18pt; font-weight:normal; text-align:center; vertical-align:middle; }

  /* ── Column 2/3 rotated text — 270deg, center.
     AHEM: transform:rotate() us jagah ke hisaab se apne CONTAINER
     mein koi space reserve nahi karta (sirf paint hoti hai ghoom
     kar) — un-rotated width hi row ki HEIGHT ban jati hai jab yeh
     270° ghoomti hai. Is liye row ko generous min-height di gayi
     hai (100pt) taake tareekh/جرم ka text agli/pichli row ke upar
     na chadhe — asal text hamesha single-line (nowrap) rehta hai
     taake un-rotated HEIGHT (= final WIDTH) hamesha column ki
     tang chaudai (8-9%) mein aaram se sama jaye. ── */
  .saza-vwrap { display:flex; align-items:center; justify-content:center; min-height:100pt; }
  .saza-vert { display:inline-block; transform:rotate(270deg); white-space:nowrap; }

  .saza-halia { font-size:16pt; margin-top:2pt; }

  /* ── SHO footer — column1 ke neeche, CENTER-aligned (asal docx ke mutabiq), col1 ki width ── */
  .saza-footer { width:${w[0]}%; text-align:center; margin-top:26pt; }
  .saza-sho-line { font-weight:bold; text-decoration:underline; font-size:18pt; }
  .saza-sho-date { margin-top:4pt; font-size:16pt; font-weight:normal; }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>
  <div class="saza-formno">فارم نمبر27-2(1)(الف)</div>
  <div class="saza-line2">
    <span class="saza-zila">ضلع ${esc(zila)}</span>
    <div class="saza-title">سزاسلپ</div>
    <span class="saza-thana">تھانہ ${esc(thana)}</span>
  </div>
  <div class="saza-sub">مقدمہ نمبر <bdi class="dio-ltr">${esc(fir)}</bdi> مورخہ <bdi class="dio-ltr">${esc(firDate)}</bdi></div>
  <table class="saza-tbl">
    <colgroup>
      <col style="width:${w[0]}%"><col style="width:${w[1]}%"><col style="width:${w[2]}%"><col style="width:${w[3]}%">
    </colgroup>
    <thead>
      <tr>
        <th class="saza-c1">نام ولدیت قومیت سکونت حلیہ و پیشہ ملزم</th>
        <th class="saza-c2">تاریخ گرفتاری</th>
        <th class="saza-c3">جرم</th>
        <th class="saza-c4">حکم اخیر عدالت</th>
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
