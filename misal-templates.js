/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — مسل کی دستاویزات کے ٹیمپلیٹ
   (انڈیکس نقل مسل سمیت۔ پہلے یہ misal-docs.js میں تھا)
   AHEM: misal-docs.js کے BAAD لوڈ ہو
   ═══════════════════════════════════════════════════════════ */

async function _fillIndexNaqlData() {
  if (!_misalCaseId) return;
  // ملزمان → بنام blocks (max 4)
  try {
    const { data: acc } = await supabaseClient.from('case_accused')
      .select('*').eq('case_id', _misalCaseId)
      .order('created_at', { ascending: true });
    (acc || []).slice(0, 4).forEach((a, i) => {
      const n = i + 1;
      const nm = a.name || a.full_name || '';
      const _fcx = (typeof formatCNIC==='function') ? formatCNIC : (s=>s||'');
      const _fmx = (typeof formatCell==='function') ? formatCell : (s=>s||'');
      const elN = document.getElementById('idxn-name-' + n);
      if (elN && nm) elN.textContent = ' ' + nm + ' ';
      const elC = document.getElementById('idxn-cell-' + n);
      if (elC && a.cell) elC.textContent = ' ' + (_fmx(a.cell) || a.cell) + ' ';
      const elI = document.getElementById('idxn-cnic-' + n);
      if (elI && a.cnic) elI.textContent = ' ' + (_fcx(a.cnic) || a.cnic) + ' ';
    });
  } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
  // ضمنیاں → انڈکس ضمنیات
  // جیسے جیسے مقدمے کی ضمنی لکھی جاتی ہے، وہ اپنے نمبر، تاریخ اور تفتیشی افسر کے
  // ساتھ اگلے خالی خانے میں آ جاتی ہے۔ جب تک ضمنی نہ لکھی جائے، نمبر شمار خالی رہتا ہے۔
  try {
    const { data: zs } = await supabaseClient.from('zimni_reports')
      .select('serial_no,report_date,officer_id').eq('case_id', _misalCaseId)
      .order('serial_no', { ascending: true });
    // Officer names ek dafa fetch (id → naam) taake har entry ka apna افسر lag sake
    const _ofcIds = [...new Set((zs || []).map(z => z.officer_id).filter(Boolean))];
    let _ofcMap = {};
    if (_ofcIds.length) {
      try {
        // `officers_directory` — doosre afsaron ke naam ke liye (SQL file 96).
        // `officers` par ab sirf apna record parha ja sakta hai.
        const { data: ofs } = await supabaseClient.from('officers_directory')
          .select('id,full_name,designation').in('id', _ofcIds);
        (ofs || []).forEach(o => {
          _ofcMap[o.id] = (o.full_name || '') + (o.designation ? ' (' + o.designation + ')' : '');
        });
      } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
    }
    const _selfName = (currentOfficer && currentOfficer.full_name) || '';
    const _fdz = (v) => v ? ((typeof formatDate === 'function') ? formatDate(v) : v) : '';
    const list = (zs || [])
      .slice()
      .sort((a, b) => (parseInt(a.serial_no) || 1e9) - (parseInt(b.serial_no) || 1e9))
      .map((z, i) => ({
        n: parseInt(z.serial_no) || (i + 1),
        d: _fdz(z.report_date),
        o: (z.officer_id && _ofcMap[z.officer_id]) ? _ofcMap[z.officer_id] : (z.officer_id ? _selfName : ''),
      }));
    const old = document.getElementById('idxz-table');
    if (old) old.outerHTML = _idxZimniTableHTML(list);
  } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }
  _idxFitCells(document.getElementById('misal-editor'));
}

// ═══ انڈکس ضمنیات کی جدول — 2 حصے (ہر حصے میں: ضمنی نمبر | مورخہ | تفتیشی افسر) ═══
// • کم از کم 18 خانے (9 سطریں × 2)؛ ضمنیاں زیادہ ہوں تو سطریں خود بڑھ جاتی ہیں۔
// • ترتیب کالم وار: پہلا حصہ (دائیں) 1–9، دوسرا حصہ 10–18۔
// • ضمنی نمبر کی چوڑائی پہلے جتنی (7.8%)؛ باقی جگہ مورخہ اور تفتیشی افسر میں —
//   تفتیشی افسر کو زیادہ۔ کوئی خانہ دوسری سطر میں نہیں ٹوٹتا (data-fit)۔
function _idxZimniTableHTML(list) {
  list = list || [];
  const _e = (typeof esc === 'function') ? esc : (s => String(s ?? ''));
  const W = { n: 7.8, d: 14.5, o: 27.7 };
  const one = 'white-space:nowrap;overflow:hidden;';
  const th = 'border:0.5pt solid #000;padding:1px 3px;font-weight:normal;text-align:center;font-size:14pt;line-height:1.5;height:8mm;vertical-align:middle;' + one;
  const td = 'border:0.5pt solid #000;padding:1px 3px;text-align:center;font-size:15pt;line-height:1.5;height:9mm;vertical-align:middle;' + one;
  const ltr = 'unicode-bidi:isolate;direction:ltr;';
  const slots = Math.max(18, list.length + (list.length % 2));
  const rows = slots / 2;
  let cols = '', head = '<tr>';
  for (let g = 0; g < 2; g++) {
    cols += `<col style="width:${W.n}%;"><col style="width:${W.d}%;"><col style="width:${W.o}%;">`;
    head += `<th data-fit style="${th}width:${W.n}%;">ضمنی نمبر</th><th data-fit style="${th}width:${W.d}%;">مورخہ</th><th data-fit style="${th}width:${W.o}%;">تفتیشی افسر</th>`;
  }
  head += '</tr>';
  let body = '';
  for (let r = 0; r < rows; r++) {
    body += '<tr>';
    for (let g = 0; g < 2; g++) {
      const z = list[g * rows + r];
      body += `<td class="idxz-n" data-fit style="${td}">${z ? _e(z.n) : ''}</td>`
            + `<td class="idxz-d" data-fit style="${td}">${z && z.d ? `<span style="${ltr}">${_e(z.d)}</span>` : ''}</td>`
            + `<td class="idxz-o" data-fit style="${td}">${z ? _e(z.o) : ''}</td>`;
    }
    body += '</tr>';
  }
  return `<table id="idxz-table" style="width:100%;border-collapse:collapse;table-layout:fixed;"><colgroup>${cols}</colgroup>${head}${body}</table>`;
}

// ═══ ایک سطر میں رکھو: [data-fit] خانے کا متن جگہ سے بڑا ہو تو فونٹ تھوڑا چھوٹا ═══
// (کاغذ / سکرین دونوں پر — اسی کا متن پرنٹ میں بھی چلتا ہے، _IDX_FIT_SRC)
function _idxFitCells(root) {
  if (!root) return;
  root.querySelectorAll('[data-fit]').forEach(el => {
    // اصل ناپ (ٹیمپلیٹ والی، مثلاً 15pt) ایک بار یاد رکھو — دوبارہ چلے تو وہیں سے شروع
    if (!el.getAttribute('data-fs0')) el.setAttribute('data-fs0', el.style.fontSize || getComputedStyle(el).fontSize);
    const f0 = el.getAttribute('data-fs0');
    // v560: ناپ ہمیشہ pt میں — پرانی px قدر (محفوظ دستاویز / computed) اسی ناپ کے pt میں، قدم بھی وہی (0.5px = 0.375pt)
    const isPt = /pt$/.test(f0);
    let fs = isPt ? (parseFloat(f0) || 12) : (parseFloat(f0) || 12) * 0.75;
    const step = isPt ? 0.5 : 0.375;
    const min = fs * 0.6;
    el.style.fontSize = fs + 'pt';
    let n = 0;
    while (el.scrollWidth > el.clientWidth + 1 && fs > min && n < 60) {
      fs -= step; el.style.fontSize = fs + 'pt'; n++;
    }
  });
}
// پرنٹ والے کاغذ میں یہی کام (فونٹ لوڈ ہونے کے بعد، چھپائی سے پہلے)
const _IDX_FIT_SRC = '<script>(function(){' + _idxFitCells.toString() +
  // پرنٹ کا iframe سکرین پر 0×0 ہوتا ہے — ناپ کاغذ کی اصل چوڑائی پر لو
  // (8.5in − بائیں 8mm − دائیں 8.5mm)، پھر body پہلے جیسی۔
  ';function go(){var b=document.body,w=b.style.width,m=b.style.margin;' +
  'b.style.width="calc(8.5in - 16.5mm)";b.style.margin="0";' +
  '_idxFitCells(b);b.style.width=w;b.style.margin=m;}go();' +
  'if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go);})();</scr' + 'ipt>';

// Formatting helpers

function getMisalTemplate(docId, c) {
  // ═══ انڈکس نقل مسل پولیس — GENUINE FORMAT (user ke INDEX.docx ka hoo-ba-hoo) ═══
  // Auto-fill: مقدمہ data + مدعی (sync) · ملزمان + ضمنیاں (async _fillIndexNaqlData)
  if (docId === 'index_naql') {
    // ═══ انڈکس نقل مسل پولیس — EXACT physical Word original ═══
    // Page: 8.5in × 13in (Folio) · margins 11/8.5/6.5/8 mm (print via printMisalDoc)
    const _o    = currentOfficer || {};
    const _sta  = _o.station  || c?.case_station  || '';
    const _dst  = _o.district || c?.case_district || '';
    const _fd   = (v)=> v ? ((typeof formatDate==='function') ? formatDate(v) : v) : '';
    const _e    = (typeof esc==='function') ? esc : (s=>String(s??''));
    const _fc   = (typeof formatCNIC==='function') ? formatCNIC : (s=>s||'');
    const _fm   = (typeof formatCell==='function') ? formatCell : (s=>s||'');

    // ── Section 2 borders: NO outer left/right · top/bottom/header 1.5pt · internal 0.5pt ──
    // Columns: <col> widths + per-cell width. تاریخوں کے کالم اتنے چوڑے کہ تاریخ
    // (DD/MM/YYYY) ایک ہی سطر میں رہے — یہ چوڑائی «حکم اخیر عدالت» سے لی گئی۔
    const _cellWrap = 'word-wrap:break-word;overflow-wrap:break-word;white-space:normal;';
    const _noWrap   = 'white-space:nowrap;overflow:hidden;';
    const _thBase = 'border:none;border-top:1.5pt solid #000;border-bottom:1.5pt solid #000;padding:2px 3px;font-weight:normal;text-align:center;font-size:14pt;line-height:1.7;vertical-align:middle;'+_cellWrap;
    const _tdBase = 'border:none;border-bottom:1.5pt solid #000;padding:3px;text-align:center;font-size:17pt;line-height:1.7;vertical-align:top;'+_cellWrap;
    const _tdDate = 'border:none;border-bottom:1.5pt solid #000;padding:3px;text-align:center;font-size:17pt;line-height:1.7;vertical-align:top;'+_noWrap;
    const _vline  = 'border-left:0.5pt solid #000;';

    // ── «ایک Enter» کی جگہ = فارم کی ایک سطر (8mm) — پورے انڈیکس میں یہی ایک ناپ ──
    const _gap = '8mm';

    // ── Dotted fill-line: ہر سطر میں لکیر باقی ساری جگہ لیتی ہے (flex) — اس لیے
    //    تمام لکیریں ایک ہی کنارے پر ختم ہوتی ہیں، اور رابطہ نمبر / شناختی کارڈ
    //    والی دونوں لکیریں برابر لمبی۔ ──
    const _row  = 'display:flex;align-items:flex-end;gap:2mm;font-size:16pt;line-height:8mm;';
    const _lbl  = 'flex:0 0 auto;white-space:nowrap;';
    const _fill = (id, val, extra) => `<span ${id?('id="'+id+'"'):''} class="fill-line" style="flex:1 1 0;min-width:0;display:inline-block;border-bottom:1.5px dotted #000;text-align:center;line-height:8mm;${extra||''}">${val||'&nbsp;'}</span>`;

    const _cCnic = _fc(c?.complainant_cnic) || '';
    const _cCell = _fm(c?.complainant_cell) || '';
    const _ltrS  = 'unicode-bidi:isolate;direction:ltr;';
    const _contact = (cellId, cellVal, cnicId, cnicVal) =>
      `<div style="${_row}"><span style="${_lbl}">رابطہ نمبر</span>${_fill(cellId, cellVal, _ltrS)}<span style="${_lbl}">شناختی کارڈ نمبر</span>${_fill(cnicId, cnicVal, _ltrS)}</div>`;

    // ── Section 3: four accused blocks (sab par sirf "بنام") ──
    let _bnam = '';
    for (let i=1;i<=4;i++){
      _bnam += `<div style="${_row}"><span style="${_lbl}">بنام</span>${_fill('idxn-name-'+i, '', 'font-weight:bold;')}</div>
${_contact('idxn-cell-'+i, '', 'idxn-cnic-'+i, '')}`;
    }

    return `
<div id="idxn-head" style="display:grid;grid-template-columns:1fr auto 1fr;align-items:baseline;width:100%;margin:${_gap} 0 ${_gap} 0;">
  <span style="white-space:nowrap;text-align:right;padding-right:8%;font-size:14pt;">تھانہ ${_e(_sta)}</span>
  <span style="white-space:nowrap;text-align:center;font-size:20pt;font-weight:bold;text-decoration:underline;">انڈکس نقل مسل پولیس</span>
  <span style="text-align:left;padding-left:8%;"><span id="idxn-dst" style="white-space:nowrap;font-size:14pt;">ضلع ${_e(_dst)}</span></span>
</div>
<table id="idxn-main" style="width:100%;border-collapse:collapse;border:none;margin-bottom:${_gap};table-layout:fixed;">
  <colgroup>
    <col style="width:11.4%;"><col style="width:16.5%;"><col style="width:16.5%;"><col style="width:14.4%;"><col style="width:15.5%;"><col style="width:25.7%;">
  </colgroup>
  <tr style="height:14mm;">
    <th style="${_thBase}${_vline}width:11.4%;">مقدمہ نمبر</th>
    <th style="${_thBase}${_vline}width:16.5%;">تاریخ وقوعہ</th>
    <th style="${_thBase}${_vline}width:16.5%;">تاریخ رجوعہ</th>
    <th style="${_thBase}${_vline}width:14.4%;">جرم</th>
    <th style="${_thBase}${_vline}width:15.5%;">تعداد اوراق</th>
    <th style="${_thBase}width:25.7%;">حکم اخیر عدالت</th>
  </tr>
  <tr style="height:65.4mm;">
    <td style="${_tdBase}${_vline}">${_e(c?.fir_number||'')}</td>
    <td data-fit style="${_tdDate}${_vline}"><span style="${_ltrS}">${_fd(c?.occurrence_date)}</span></td>
    <td data-fit style="${_tdDate}${_vline}"><span style="${_ltrS}">${_fd(c?.fir_date)}</span></td>
    <td style="${_tdBase}${_vline}">${_e(c?.section_of_law||'')}</td>
    <td style="${_tdBase}${_vline}"></td>
    <td style="${_tdBase}"></td>
  </tr>
</table>
<div id="idxn-parties" style="padding:0 14px;">
  <div style="${_row}"><span style="${_lbl}">سرکار بذریعہ</span>${_fill('idxn-complainant', _e(c?.complainant||''), 'font-weight:bold;')}</div>
  ${_contact('idxn-mudai-cell', _e(_cCell), 'idxn-mudai-cnic', _e(_cCnic))}
  ${_bnam}
</div>
<div id="idxz-head" style="text-align:center;font-size:16pt;font-weight:bold;text-decoration:underline;margin:${_gap} 0 2px;">انڈکس ضمنیات</div>
${_idxZimniTableHTML([])}`;
  }

  const o   = currentOfficer || {};
  const fir = c?.fir_number  || '________';
  const dt  = c?.fir_date    || '________';
  const sec = c?.section_of_law || '________';
  const sta = o.station || c?.case_station || '________';
  const dst = o.district|| c?.case_district|| '________';
  const cmp = c?.complainant   || '________';
  const cnic= c?.complainant_cnic||'________';
  const cel = c?.complainant_cell||'________';
  const ion = o.full_name      || '________';
  const rnk = o.designation   || '________';
  const bdg = o.badge_number  || '________';

  const header = (title) => `
    <div style="text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:16px;">
      <div style="font-size:10.5pt;">تھانہ ${sta} &nbsp;—&nbsp; ضلع ${dst}</div>
      <div style="font-size:12pt;font-weight:bold;margin-top:6px;">${title}</div>
      <div style="font-size:9pt;margin-top:4px;">مقدمہ نمبر: ${fir} &nbsp;|&nbsp; تاریخ: ${dt}</div>
    </div>`;

  const row = (label, val='') => `
    <tr>
      <td style="width:35%;font-weight:bold;background:#f5f5f5;">${label}</td>
      <td>${val}</td>
    </tr>`;

  const table = (rows) => `<table style="width:100%;border-collapse:collapse;margin-bottom:12px;">${rows}</table>`;

  const sig = `
    <div style="margin-top:40px;display:flex;justify-content:space-between;">
      <div style="text-align:center;">
        <div>_______________________</div>
        <div style="font-size:9pt;">دستخط مدعی</div>
      </div>
      <div style="text-align:center;">
        <div>_______________________</div>
        <div style="font-size:9pt;">${rnk} ${ion} (${bdg})</div>
        <div style="font-size:9pt;">تفتیشی افسر</div>
      </div>
    </div>`;

  const templates = {

    fir: `${header('ایف آئی آر — مقدمہ اول اطلاع')}
      ${table(
        row('مقدمہ نمبر', fir) +
        row('تاریخ و وقت', dt) +
        row('دفعات', sec) +
        row('تھانہ', sta) +
        row('ضلع', dst) +
        row('مدعی / شکایت کنندہ', cmp) +
        row('شناختی کارڈ', cnic) +
        row('رابطہ نمبر', cel)
      )}
      <div style="font-weight:bold;margin-bottom:6px;">بیان مدعی:</div>
      <div style="min-height:120px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">بیان یہاں درج کریں...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">اطلاع کردہ ملزمان:</div>
      <div style="min-height:60px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">ملزمان کے نام...</div>
      ${sig}`,

    report_173: `${header('رپورٹ 173 ضابطہ فوجداری')}
      <div style="margin-bottom:10px;">بخدمت جناب عدالت __________</div>
      ${table(
        row('مقدمہ نمبر', fir) +
        row('دفعات', sec) +
        row('تاریخ وقوعہ', c?.occurrence_date||'________') +
        row('تھانہ', sta) +
        row('مدعی', cmp)
      )}
      <div style="font-weight:bold;margin-bottom:6px;">تفتیش کا نتیجہ:</div>
      <div style="min-height:80px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">تفتیش کے نتیجے یہاں درج کریں...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">گواہان:</div>
      <div style="min-height:60px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">گواہان کی فہرست...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">ملزمان:</div>
      <div style="min-height:60px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">ملزمان کی فہرست...</div>
      ${sig}`,

    named_accused: `${header('نامزد ملزمان')}
      <div style="font-size:9pt;margin-bottom:12px;">مقدمہ نمبر: ${fir} &nbsp;|&nbsp; دفعات: ${sec}</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">نام</th>
          <th style="padding:6px;border:1px solid #555;">ولدیت</th>
          <th style="padding:6px;border:1px solid #555;">قوم / ذات</th>
          <th style="padding:6px;border:1px solid #555;">پتہ</th>
          <th style="padding:6px;border:1px solid #555;">شناختی کارڈ</th>
          <th style="padding:6px;border:1px solid #555;">حالت</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4,5].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true">زیر حراست / فرار</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    unknown_accused: `${header('نامعلوم ملزمان')}
      <div style="font-size:9pt;margin-bottom:12px;">مقدمہ نمبر: ${fir}</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">حلیہ</th>
          <th style="padding:6px;border:1px solid #555;">عمر (تخمینہ)</th>
          <th style="padding:6px;border:1px solid #555;">قد</th>
          <th style="padding:6px;border:1px solid #555;">خصوصی نشانات</th>
          <th style="padding:6px;border:1px solid #555;">لباس</th>
        </tr></thead>
        <tbody>
          ${[1,2,3].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    witnesses: `${header('گواہان')}
      <div style="font-size:9pt;margin-bottom:12px;">مقدمہ نمبر: ${fir}</div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">نام گواہ</th>
          <th style="padding:6px;border:1px solid #555;">ولدیت</th>
          <th style="padding:6px;border:1px solid #555;">پتہ</th>
          <th style="padding:6px;border:1px solid #555;">رابطہ</th>
          <th style="padding:6px;border:1px solid #555;">قسم گواہ</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4,5].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true">چشم دید / سماعتی</td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    stolen: `${header('مسروقہ مال')}
      ${table(row('مقدمہ نمبر', fir) + row('تاریخ', dt))}
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">مال کی تفصیل</th>
          <th style="padding:6px;border:1px solid #555;">تعداد</th>
          <th style="padding:6px;border:1px solid #555;">مالیت</th>
          <th style="padding:6px;border:1px solid #555;">مالک</th>
          <th style="padding:6px;border:1px solid #555;">نشانِ خاص</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4,5].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    recovery: `${header('برآمدگی مال')}
      ${table(row('مقدمہ نمبر', fir) + row('تاریخ برآمدگی', '________') + row('مقام برآمدگی', '________'))}
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">برآمد شدہ مال</th>
          <th style="padding:6px;border:1px solid #555;">تعداد</th>
          <th style="padding:6px;border:1px solid #555;">مالیت</th>
          <th style="padding:6px;border:1px solid #555;">برآمد از</th>
          <th style="padding:6px;border:1px solid #555;">حالت</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4].map(n=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${n}</td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    court_dates: `${header('عدالت میں ساعت کی تاریخیں')}
      ${table(row('مقدمہ نمبر', fir) + row('عدالت', '________') + row('جج صاحب', '________'))}
      <table style="width:100%;border-collapse:collapse;margin-bottom:12px;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">تاریخ</th>
          <th style="padding:6px;border:1px solid #555;">کارروائی</th>
          <th style="padding:6px;border:1px solid #555;">اگلی تاریخ</th>
          <th style="padding:6px;border:1px solid #555;">نوٹ</th>
        </tr></thead>
        <tbody>
          ${[1,2,3,4,5,6,7,8].map(()=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

    inv_result: `${header('نتیجہ تفتیش')}
      ${table(
        row('مقدمہ نمبر', fir) +
        row('دفعات', sec) +
        row('تھانہ', sta) +
        row('تفتیشی افسر', `${rnk} ${ion} (${bdg})`)
      )}
      <div style="font-weight:bold;margin-bottom:6px;">تفتیش کا خلاصہ:</div>
      <div style="min-height:100px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">تفتیش کا خلاصہ یہاں درج کریں...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">نتیجہ:</div>
      <div style="border:1px solid #ccc;padding:10px;border-radius:4px;">
        <label style="display:block;margin-bottom:6px;"><input type="radio" name="result"> چالان پیش کیا جائے</label>
        <label style="display:block;margin-bottom:6px;"><input type="radio" name="result"> رپورٹ 173 — ملزم فرار</label>
        <label style="display:block;margin-bottom:6px;"><input type="radio" name="result"> کینسل</label>
        <label style="display:block;"><input type="radio" name="result"> عدم پتہ</label>
      </div>
      ${sig}`,

    checklist: `${header('وقوعہ کی چیک لسٹ')}
      ${table(row('مقدمہ نمبر', fir) + row('دفعات', sec))}
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#333;color:#fff;">
          <th style="padding:6px;border:1px solid #555;">نمبر</th>
          <th style="padding:6px;border:1px solid #555;">دستاویز / کارروائی</th>
          <th style="padding:6px;border:1px solid #555;">مکمل</th>
          <th style="padding:6px;border:1px solid #555;">تاریخ</th>
          <th style="padding:6px;border:1px solid #555;">نوٹ</th>
        </tr></thead>
        <tbody>
          ${[
            'ایف آئی آر رجسٹریشن',
            'جائے واردات کا معائنہ',
            'ملزم کی گرفتاری',
            'برآمدگی',
            'طبی معائنہ',
            'فرانزک نمونے',
            'گواہان کے بیانات',
            'فوٹوگرافی',
            'خاکہ جائے واردات',
            'رپورٹ 173 جمع',
          ].map((item,i)=>`<tr>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;">${i+1}</td>
            <td style="border:1px solid #ccc;padding:6px;">${item}</td>
            <td style="border:1px solid #ccc;padding:6px;text-align:center;"><input type="checkbox"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
            <td style="border:1px solid #ccc;padding:6px;" contenteditable="true"></td>
          </tr>`).join('')}
        </tbody>
      </table>
      ${sig}`,

  };

  // USOOL: jis dastawez ka manzoor-shuda format abhi defined nahi, woh sirf
  // KHALI SAFED KAGHAZ par khulti hai — software apni taraf se koi format,
  // heading, khana ya dastakhat nahi deta. Owner/admin khud form set karega.
  const generic = '';

  return templates[docId] || generic;
}

// ═══════════════════════════════════════════════════════════════════════
//  FULL-PAGE DOCUMENT VIEW  (پورے صفحے پر دستاویز)
//  • Chip par click → dastawez poore page par khulti hai
//  • Chips/toolbars background mein chale jate hain
//  • Corner mein sirf: ↩ واپس  aur  🖨️ پرنٹ
//  • Kai dastawezat aik saath khuli reh sakti hain (tabs)
//  Design: #workspace-editor-area ko overlay ke andar MOVE karte hain,
//  is liye har module (witnesses/mulziman/report173/misal) bina tabdeeli
//  ke waise hi kaam karta hai.
// ═══════════════════════════════════════════════════════════════════════

let _dioTabs = [];        // [{id, name}]
let _dioActiveTab = null;
let _dioAreaHome = null;  // original parent of #workspace-editor-area

// ── Document ka Urdu naam nikalo (special views samet) ──
