/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — سزا سلپ  (Saza Slip · Form No. 27-2(1)(الف))
   Case workspace ke "misal-doc-bar" chip se khulti hai (modal).

   V3 — Shafi ki hidayaat ke mutabiq DOBARA:
     • Pehli tamam settings (kaghaz toggle, font selector, column
       resize handles, niche wali "حکم اخیر عدالت" text field) HATA
       di gayin.
     • Font, table, headings, SHO name, تاریخ, aur directions bilkul
       waise set kiye hain JAISE report173.js (چالان) mein hain —
       _ch173CSS() ke conventions ki naql:
         - Root doc: direction:rtl · Jameel Noori · color:#000 · 14pt
         - Title row: FORM No.(12pt italic ltr, center) + عنوان
           (20pt bold underline, center) + تھانہ(dayen, 14pt) /
           ضلع(bayen, 14pt) — .tt-mid/.form-no absolute 50% par
         - Case line: مقدمہ نمبر / مورخہ — center, 14pt
         - Table: border 1px solid #000 · padding 2px 4px · center ·
           14pt · header font-weight:normal
     • FONT: 14pt (چالان jaisa), pehle 16/18pt tha.
     • Table ke NEECHE koi izafi text field NAHI (حکم اخیر عدالت
       sirf table ka column rehta hai — us se neeche kuch nahi).
     • SHO block: NAAM se OOPER dastkhat ke liye JAGAH (khali lakeer),
       phir SHO naam (bold), phir تاریخ neeche — bilkul چالان ke
       "sho-signature-block-bottom" jaisa.

   DATA — case_accused table (mulziman.js se confirmed columns):
     name · cnic · mobile · arrest_date(YYYY-MM-DD) · pesha ·
     rang · chehra · jism · qad · umar · nishan · taleem
     (ولدیت/قومیت/سکونت columns MOJOOD NAHI — is liye حلیہ un
      sub-fields se BANAYA jata hai, mulziman ke _accViewDetail
      jaise: رنگ/چہرہ/جسم/قد/نشان.)

   CHIP WIRING: misal-doc-bar mein "سزا سلپ" chip PEHLE SE maujood
   hai — naya nahi banate, usi ka onclick apne openSazaSlip() par
   mor dete hain. cases.js mein sirf EK line add hui hai jo
   injectSazaSlipChip(c) call karti hai.
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
    // Column 3 "جرم" — pehli row case ke offence se auto, baqi rows "مندرجہ بالا"
    normAccused.forEach(function (a, i) {
      a.jurm = i === 0 ? (c.section_of_law || c.offence_type || '') : 'مندرجہ بالا';
    });

    _sazaState = {
      caseId,
      case: c,
      accused: normAccused,
      shoText: (typeof getSHOSignLine === 'function')
        ? getSHOSignLine((currentOfficer && currentOfficer.station) || '')
        : (c.sho || ''),
      footerDate: '',
    };
    _sazaRenderModal();
  } catch (err) {
    console.error('[SazaSlip] openSazaSlip error:', err);
    showToast('❌ سزا سلپ کھولنے میں مسئلہ: ' + ((err && err.message) || err), 'error');
  }
}
window.openSazaSlip = openSazaSlip;

// ── DATA NORMALIZATION (case_accused — real columns from mulziman.js) ──
function _sazaNormalizeAccused(a) {
  a = a || {};
  return {
    id: a.id || null,
    name: a.name || '',
    cnic: a.cnic || '',
    pesha: a.pesha || '',
    arrestDate: a.arrest_date || '',
    // حلیہ sub-fields (mulziman _accViewDetail jaisa)
    rang: a.rang || '',
    chehra: a.chehra || '',
    jism: a.jism || '',
    qad: a.qad || '',
    umar: a.umar || '',
    nishan: a.nishan || '',
    // is form ke apne
    halia: '',   // niche compose hoti hai (editor mein editable single field)
    jurm: '',
  };
}
function _sazaBlankAccused() {
  return { id: null, name: '', cnic: '', pesha: '', arrestDate: '',
           rang: '', chehra: '', jism: '', qad: '', umar: '', nishan: '',
           halia: '', jurm: '' };
}

// حلیہ — sub-fields se banao (mulziman ke haleeya formula jaisa)
function _sazaComposeHalia(a) {
  if (a.halia) return a.halia; // user ne khud likh diya to wohi
  return [
    a.rang && ('رنگ: ' + a.rang),
    a.chehra && ('چہرہ: ' + a.chehra),
    a.jism && ('جسم: ' + a.jism),
    a.qad && ('قد: ' + a.qad),
    a.umar && ('عمر: ' + a.umar),
    a.nishan && ('نشان: ' + a.nishan),
  ].filter(Boolean).join(' ، ');
}

// نام + پیشہ ek line (ولدیت/قومیت/سکونت DB mein nahi)
function _sazaAccusedLine(a) {
  const parts = [];
  if (a.name) parts.push(a.name);
  if (a.pesha) parts.push('پیشہ ' + a.pesha);
  return parts.join('، ');
}

// ── CHIP WIRING ────────────────────────────────────────────────
// misal-doc-bar mein "سزا سلپ" chip PEHLE SE maujood hai — naya nahi
// banate, usi ka onclick apne openSazaSlip() par mor dete hain.
function _sazaFindExistingChip(bar) {
  const all = bar.querySelectorAll('*');
  let best = null, bestLen = Infinity;
  for (const el of all) {
    if (el.id === 'saza-slip-chip') continue;
    let ownText = '';
    for (const node of el.childNodes) {
      if (node.nodeType === 3) ownText += node.textContent;
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

    const real = _sazaFindExistingChip(bar);
    if (real) {
      real.setAttribute('onclick', '');
      real.onclick = () => openSazaSlip(c.id);
      real.style.cursor = 'pointer';
      real.dataset.sazaWired = '1';
      return;
    }

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

// Self-healing — bar dobara render ho to wiring wapas lag jaye
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

// ── MODAL RENDER (simple editor — koi paper/font/resize UI nahi) ──
function _sazaRenderModal() {
  const footer = `
    <div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;flex-wrap:wrap;width:100%;">
      <button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>
      <button class="btn btn-primary" onclick="_sazaPrint()">🖨️ پرنٹ کریں</button>
    </div>`;
  openModal('📜 سزا سلپ — فارم نمبر27-2(1)(الف)', _sazaModalBodyHTML(), footer);
}

function _sazaModalBodyHTML() {
  const st = _sazaState;
  const c = st.case;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) || {};
  const zila = o.district || c.case_district || '';
  const thana = o.station || c.case_station || '';
  const fir = c.fir_number || '';
  const firDate = formatDate(c.fir_date);
  const rowsHtml = st.accused.map(function (a, i) { return _sazaRowHTML(a, i); }).join('');

  return `
    <div style="direction:rtl;">
      <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid var(--border);">
        <div style="font-size:11px;color:var(--text-muted);">
          مقدمہ نمبر <bdi class="dio-ltr">${esc(fir)}</bdi> · مورخہ <bdi class="dio-ltr">${esc(firDate)}</bdi> · ضلع ${esc(zila)} · تھانہ ${esc(thana)}
        </div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="_sazaAddRow()" style="margin-inline-start:auto;">+ ملزم شامل کریں</button>
      </div>

      <div style="overflow-x:auto;background:#fff;border-radius:6px;padding:10px;">
        <table dir="rtl" style="width:100%;border-collapse:collapse;table-layout:fixed;color:#000;min-width:520px;">
          <colgroup>
            <col style="width:47%"><col style="width:12%"><col style="width:12%"><col style="width:29%">
          </colgroup>
          <thead>
            <tr style="background:#f0f0f0;">
              <th style="border:1px solid #999;padding:6px;font-size:12px;">نام و پیشہ و حلیہ ملزم</th>
              <th style="border:1px solid #999;padding:6px;font-size:12px;">تاریخ گرفتاری</th>
              <th style="border:1px solid #999;padding:6px;font-size:12px;">جرم</th>
              <th style="border:1px solid #999;padding:6px;font-size:12px;">حکم اخیر عدالت</th>
            </tr>
          </thead>
          <tbody id="saza-edit-tbody">${rowsHtml}</tbody>
        </table>
      </div>

      <div style="margin-top:16px;padding-top:10px;border-top:1px dashed var(--border);max-width:340px;">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">SHO — نام / رینک / تھانہ (پرنٹ پر بولڈ، اوپر دستخط کی جگہ خودکار)</div>
        <input id="saza-sho-input" class="form-input" style="margin-bottom:8px;" value="${esc(st.shoText)}" placeholder="مثلاً: محمد اسلم انسپکٹر تھانہ صدر">
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">تاریخ (خالی رہے تو پرنٹ پر لکیر آئے گی)</div>
        <input id="saza-date-input" class="form-input dio-ltr" style="text-align:left;" oninput="autoFormatDate(this)" value="${esc(st.footerDate)}" placeholder="DD-MM-YYYY">
      </div>
    </div>`;
}

function _sazaRowHTML(a, i) {
  const dateVal = a.arrestDate ? formatDate(a.arrestDate) : '';
  const halia = _sazaComposeHalia(a);
  const removeBtn = i > 0
    ? `<button type="button" onclick="_sazaRemoveRow(${i})" title="یہ ملزم ہٹائیں" style="position:absolute;top:2px;left:2px;border:none;background:rgba(200,0,0,0.08);color:#c00;cursor:pointer;font-size:12px;line-height:1;padding:2px 5px;border-radius:3px;z-index:2;">✕</button>`
    : '';
  return `<tr data-row="${i}">
    <td style="border:1px solid #999;padding:6px;vertical-align:top;">
      <textarea class="saza-name-input" data-row="${i}" rows="1" style="width:100%;border:none;background:transparent;font-family:inherit;font-size:13px;font-weight:600;resize:vertical;margin-bottom:4px;color:#000;" placeholder="نام ملزم" onblur="_sazaSyncRow(${i})">${esc(a.name)}</textarea>
      <input class="saza-pesha-input" data-row="${i}" style="width:100%;border:1px solid #ddd;background:#fafafa;font-family:inherit;font-size:11px;color:#000;padding:2px 4px;margin-bottom:3px;" placeholder="پیشہ" onblur="_sazaSyncRow(${i})" value="${esc(a.pesha)}">
      <textarea class="saza-halia-input" data-row="${i}" rows="2" style="width:100%;border:1px dashed #ccc;background:#fafafa;font-family:inherit;font-size:11px;resize:vertical;color:#000;" placeholder="حلیہ" onblur="_sazaSyncRow(${i})">${esc(halia)}</textarea>
    </td>
    <td style="border:1px solid #999;padding:4px;text-align:center;vertical-align:middle;">
      <input class="saza-date-input-row dio-ltr" data-row="${i}" style="width:92%;text-align:center;border:1px solid #ccc;font-size:11px;color:#000;" oninput="autoFormatDate(this)" onblur="_sazaSyncRow(${i})" value="${esc(dateVal)}" placeholder="DD-MM-YYYY">
    </td>
    <td style="border:1px solid #999;padding:4px;text-align:center;vertical-align:middle;">
      <textarea class="saza-jurm-input" data-row="${i}" rows="2" style="width:92%;border:1px solid #ccc;font-size:11px;color:#000;text-align:center;resize:vertical;" placeholder="جرم" onblur="_sazaSyncRow(${i})">${esc(a.jurm)}</textarea>
    </td>
    <td style="border:1px solid #999;padding:4px;position:relative;vertical-align:top;">
      ${removeBtn}
      <textarea class="saza-court-input" data-row="${i}" rows="3" style="width:100%;border:1px solid #ddd;background:#fafafa;font-family:inherit;font-size:11px;color:#000;resize:vertical;padding-top:${i > 0 ? '18px' : '2px'};" placeholder="حکم اخیر عدالت (اختیاری)" onblur="_sazaSyncRow(${i})">${esc(a.courtOrder || '')}</textarea>
    </td>
  </tr>`;
}

// ── ROW OPS ────────────────────────────────────────────────────
function _sazaSyncRow(i) {
  const st = _sazaState;
  if (!st || !st.accused[i]) return;
  const q = (cls) => document.querySelector(cls + '[data-row="' + i + '"]');
  const nameEl = q('.saza-name-input'), peshaEl = q('.saza-pesha-input'), haliaEl = q('.saza-halia-input');
  const dateEl = q('.saza-date-input-row'), jurmEl = q('.saza-jurm-input'), courtEl = q('.saza-court-input');
  if (nameEl) st.accused[i].name = nameEl.value;
  if (peshaEl) st.accused[i].pesha = peshaEl.value;
  if (haliaEl) st.accused[i].halia = haliaEl.value; // user-edited halia override
  if (dateEl) st.accused[i].arrestDate = dateEl.value;
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
  blank.jurm = 'مندرجہ بالا';
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

// ── PRINT ────────────────────────────────────────────────────
function _sazaPrint() {
  if (!_sazaState) return;
  _sazaSyncAllRows();
  const shoInput = document.getElementById('saza-sho-input');
  const dateInput = document.getElementById('saza-date-input');
  if (shoInput) _sazaState.shoText = shoInput.value;
  if (dateInput) _sazaState.footerDate = dateInput.value;
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

  const rowsHtml = state.accused.map(function (a, i) {
    const dateHtml = a.arrestDate
      ? '<span class="saza-vert dio-ltr">' + esc(formatDate(a.arrestDate)) + '</span>'
      : '';
    const jurmHtml = a.jurm ? '<span class="saza-vert">' + _sazaNl2br(a.jurm) + '</span>' : '';
    const detailLine = _sazaAccusedLine(a);
    const halia = _sazaComposeHalia(a);
    return `<tr>
      <td class="saza-c1">${detailLine ? _sazaNl2br(detailLine) : ''}${halia ? '<div class="saza-halia">حلیہ: ' + _sazaNl2br(halia) + '</div>' : ''}</td>
      <td class="saza-c2"><div class="saza-vwrap">${dateHtml}</div></td>
      <td class="saza-c3"><div class="saza-vwrap">${jurmHtml}</div></td>
      <td class="saza-c4">${a.courtOrder ? _sazaNl2br(a.courtOrder) : ''}</td>
    </tr>`;
  }).join('');

  const shoLine = state.shoText ? esc(state.shoText) : '';
  const dateLine = state.footerDate ? esc(state.footerDate) : '_______________';

  // ── چالان (report173.js) jaisa print document — WAHI conventions ──
  //   @page 8.5in×13in Folio (چالان ka default), side margin چالان jaisa.
  //   Font 14pt, Jameel Noori, direction:rtl, color #000.
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
  /* چالان jaisa: Folio 8.5×13, side margin tang, upar/neeche 1cm */
  @page { size: 8.5in 13in; margin: 1cm 0.2cm; }
  * { box-sizing: border-box; }
  html, body { margin:0 !important; padding:0 !important; }
  /* ── چالان ke #ch173-doc jaisa root ── */
  body {
    font-family: 'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
    direction: rtl;
    color: #000;
    font-size: 14pt;
    line-height: 1.4;
  }
  /* Mixed Urdu+English bidi — چالان/dioNameWithCnic convention */
  .dio-ltr { direction: ltr; unicode-bidi: isolate; }

  /* ── عنوان کی سطر — چالان ke .ch173-title-row jaisa ──
     FORM No. aur عنوان dono absolute 50% par (bilkul aik center) */
  .saza-title-row { position:relative; display:flex; align-items:baseline;
    justify-content:space-between; width:100%; min-height:1.6em; }
  .saza-title-row > span { white-space:nowrap; }
  .tt-right { text-align:right; font-size:14pt; padding-right:1in; }
  .tt-left  { text-align:left; font-size:14pt; }
  .tt-mid, .form-no { position:absolute; left:50%; transform:translateX(-50%); white-space:nowrap; }
  .tt-mid  { font-weight:bold; text-decoration:underline; font-size:20pt; }
  .form-no { font-style:italic; font-size:12pt; }

  /* مقدمہ نمبر / مورخہ — چالان ke .ch173-caseline jaisa (center, 14pt) */
  .saza-caseline { display:flex; gap:22px; align-items:baseline; font-size:14pt;
    margin:18px 0 16px 0; direction:rtl; flex-wrap:wrap; line-height:1.4; justify-content:center; }

  /* ── جدول — چالان ke .ch173-table jaisa: border 1px solid #000 · center · 14pt ── */
  table.saza-tbl { width:100%; border-collapse:collapse; table-layout:fixed; direction:rtl; margin:0; }
  table.saza-tbl th, table.saza-tbl td {
    border:1px solid #000; padding:2px 4px; text-align:center;
    white-space:normal; word-wrap:break-word; overflow-wrap:break-word;
    line-height:1.15; font-size:14pt;
  }
  table.saza-tbl thead th { font-size:14pt; vertical-align:middle; font-weight:normal; }
  /* Left/right OUTER borders remove — sirf andar ki + horizontal (asal saza form jaisa) */
  .saza-c1 { border-right:none; }
  .saza-c4 { border-left:none; }
  .saza-c1 { vertical-align:top; text-align:justify; }
  .saza-c2, .saza-c3 { vertical-align:middle; }
  .saza-c4 { vertical-align:top; }
  table.saza-tbl td.saza-c1 { padding:5px 6px; }

  /* Column 2/3 rotated (270deg) — tareekh + جرم khadi.
     rotate layout mein jagah reserve nahi karta, is liye row ki
     min-height se space diya (text single-line nowrap rehta hai). */
  .saza-vwrap { display:flex; align-items:center; justify-content:center; min-height:90pt; }
  .saza-vert  { display:inline-block; transform:rotate(270deg); white-space:nowrap; font-size:14pt; }

  .saza-halia { font-size:14pt; margin-top:2px; }

  /* ── SHO block — چالان ke .sho-signature-block-bottom jaisa:
     upar dastkhat ki KHALI jagah → naam (bold) → تاریخ neeche.
     Table ke NEECHE koi aur field nahi. ── */
  .saza-sho-block { text-align:right; margin-top:20px; min-width:220px; display:inline-block; }
  .saza-sho-sign  { border-bottom:1px solid #000; min-height:50px; margin-bottom:6px; }
  .saza-sho-name  { font-weight:bold; font-size:14pt; }
  .saza-sho-date  { font-size:14pt; margin-top:6px; }

  @media print {
    body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  }
</style>
</head>
<body>
  <div class="saza-title-row"><span></span><span class="form-no">فارم نمبر27-2(1)(الف)</span><span></span></div>
  <div class="saza-title-row" style="margin:2px 0 8px;">
    <span class="tt-right">تھانہ ${esc(thana)}</span>
    <span class="tt-mid">سزاسلپ</span>
    <span class="tt-left">ضلع ${esc(zila)}</span>
  </div>
  <div class="saza-caseline">
    <span>مقدمہ نمبر <bdi class="dio-ltr">${esc(fir)}</bdi></span>
    <span>مورخہ <bdi class="dio-ltr">${esc(firDate)}</bdi></span>
  </div>
  <table class="saza-tbl">
    <colgroup>
      <col style="width:47%"><col style="width:12%"><col style="width:12%"><col style="width:29%">
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
  <div class="saza-sho-block">
    <div class="saza-sho-sign"></div>
    <div class="saza-sho-name">${shoLine}</div>
    <div class="saza-sho-date">تاریخ: ${dateLine}</div>
  </div>
</body>
</html>`;
}
