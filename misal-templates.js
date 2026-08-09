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
  } catch(_) {}
  // ضمنیاں → انڈکس ضمنیات (نمبر کے مطابق مورخہ + تفتیشی افسر)
  // FIX 3: har زمنی entry ka apna date + apna تفتیشی افسر (officer_id lookup);
  // value na ho to cell blank chhoro (koi placeholder nahi).
  try {
    const { data: zs } = await supabaseClient.from('zimni_reports')
      .select('serial_no,report_date,officer_id').eq('case_id', _misalCaseId)
      .order('serial_no', { ascending: true });
    // Officer names ek dafa fetch (id → naam) taake har entry ka apna افسر lag sake
    const _ofcIds = [...new Set((zs || []).map(z => z.officer_id).filter(Boolean))];
    let _ofcMap = {};
    if (_ofcIds.length) {
      try {
        const { data: ofs } = await supabaseClient.from('officers')
          .select('id,full_name,designation').in('id', _ofcIds);
        (ofs || []).forEach(o => {
          _ofcMap[o.id] = (o.full_name || '') + (o.designation ? ' (' + o.designation + ')' : '');
        });
      } catch(_) {}
    }
    const _selfName = (currentOfficer && currentOfficer.full_name) || '';
    (zs || []).forEach(z => {
      const n = parseInt(z.serial_no);
      if (!n || n < 1 || n > 18) return;
      const d = document.getElementById('idxz-d-' + n);
      if (d && z.report_date) d.textContent = (typeof formatDate==='function') ? formatDate(z.report_date) : z.report_date;
      const oEl = document.getElementById('idxz-o-' + n);
      if (oEl) {
        const nm = (z.officer_id && _ofcMap[z.officer_id]) ? _ofcMap[z.officer_id] : (z.officer_id ? _selfName : '');
        if (nm) oEl.textContent = nm;
      }
    });
  } catch(_) {}
}

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
    // Columns: <col> widths + per-cell width + break-word => long text wraps
    // INSIDE the cell (row grows down), column proportions stay put.
    const _cellWrap = 'word-wrap:break-word;overflow-wrap:break-word;white-space:normal;';
    const _thBase = 'border:none;border-top:1.5pt solid #000;border-bottom:1.5pt solid #000;padding:2px 3px;font-weight:normal;text-align:center;font-size:17pt;line-height:1.7;vertical-align:middle;'+_cellWrap;
    const _tdBase = 'border:none;border-bottom:1.5pt solid #000;padding:3px;text-align:center;font-size:17pt;line-height:1.7;vertical-align:top;'+_cellWrap;
    const _vline  = 'border-left:0.5pt solid #000;';

    // ── Section 5 zimni: full 0.5pt grid (FIX 3: fixed layout too) ──
    const _thZ = 'border:0.5pt solid #000;padding:1px 3px;font-weight:normal;text-align:center;font-size:15pt;line-height:1.6;height:6mm;vertical-align:middle;'+_cellWrap;
    const _tdZ = 'border:0.5pt solid #000;padding:1px 3px;text-align:center;font-size:15pt;line-height:1.6;height:7mm;vertical-align:middle;'+_cellWrap;

    // ── FIX 2: aligned dotted fill-line (fixed width, dotted bottom border) ──
    const _fill = (id, w, extra) => `<span ${id?('id="'+id+'"'):''} class="fill-line" style="display:inline-block;width:${w};border-bottom:1.5px dotted #000;vertical-align:bottom;text-align:center;${extra||''}">&nbsp;</span>`;

    const _cCnic = _fc(c?.complainant_cnic) || '';
    const _cCell = _fm(c?.complainant_cell) || '';
    const _ltrS  = 'unicode-bidi:isolate;direction:ltr;';

    // ── Section 3: four accused blocks (sab par sirf "بنام"); equal fixed-width lines ──
    let _bnam = '';
    for (let i=1;i<=4;i++){
      _bnam += `<div style="font-size:16pt;line-height:8mm;">بنام ${_fill('idxn-name-'+i,'82%','font-weight:bold;')}</div>
<div style="font-size:16pt;line-height:8mm;">رابطہ نمبر ${_fill('idxn-cell-'+i,'28%',_ltrS)} شناختی کارڈ نمبر ${_fill('idxn-cnic-'+i,'34%',_ltrS)}</div>`;
    }

    // ── Section 5 rows: numbers column-wise 1–6 / 7–12 / 13–18 ──
    let _zHead = '<tr>';
    for (let g=0;g<3;g++){
      _zHead += `<th style="${_thZ}width:7.8%;">ضمنی نمبر</th><th style="${_thZ}width:10.4%;">مورخہ</th><th style="${_thZ}width:14.3%;">تفتیشی افسر</th>`;
    }
    _zHead += '</tr>';
    let _zRows = '';
    for (let r=0;r<6;r++){
      _zRows += '<tr>';
      for (let g=0;g<3;g++){
        const n = g*6 + r + 1;
        _zRows += `<td style="${_tdZ}">${n}</td><td style="${_tdZ}" id="idxz-d-${n}">&nbsp;</td><td style="${_tdZ}" id="idxz-o-${n}">&nbsp;</td>`;
      }
      _zRows += '</tr>';
    }
    // FIX 3: <col> widths for zimni table (3 groups × 7.8/10.4/14.3)
    let _zCols = '';
    for (let g=0;g<3;g++){
      _zCols += '<col style="width:7.8%;"><col style="width:10.4%;"><col style="width:14.3%;">';
    }

    return `
<div style="display:flex;align-items:baseline;width:100%;margin:0 0 6px 0;">
  <span style="flex:1 1 0;white-space:nowrap;text-align:right;padding-right:8%;font-size:18pt;">تھانہ ${_e(_sta)}</span>
  <span style="flex:1 1 0;white-space:nowrap;text-align:center;font-size:22pt;font-weight:bold;text-decoration:underline;">انڈکس نقل مسل پولیس</span>
  <span style="flex:1 1 0;white-space:nowrap;text-align:left;font-size:18pt;">ضلع ${_e(_dst)}</span>
</div>
<table style="width:100%;border-collapse:collapse;border:none;margin-bottom:6px;table-layout:fixed;">
  <colgroup>
    <col style="width:11.4%;"><col style="width:10.8%;"><col style="width:11.3%;"><col style="width:14.4%;"><col style="width:15.5%;"><col style="width:36.6%;">
  </colgroup>
  <tr style="height:14mm;">
    <th style="${_thBase}${_vline}width:11.4%;">مقدمہ نمبر</th>
    <th style="${_thBase}${_vline}width:10.8%;">تاریخ وقوعہ</th>
    <th style="${_thBase}${_vline}width:11.3%;">تاریخ رجوعہ</th>
    <th style="${_thBase}${_vline}width:14.4%;">جرم</th>
    <th style="${_thBase}${_vline}width:15.5%;">تعداد اوراق</th>
    <th style="${_thBase}width:36.6%;">حکم اخیر عدالت</th>
  </tr>
  <tr style="height:40mm;">
    <td style="${_tdBase}${_vline}">${_e(c?.fir_number||'')}</td>
    <td style="${_tdBase}${_vline}">${_fd(c?.occurrence_date)}</td>
    <td style="${_tdBase}${_vline}">${_fd(c?.fir_date)}</td>
    <td style="${_tdBase}${_vline}">${_e(c?.section_of_law||'')}</td>
    <td style="${_tdBase}${_vline}"></td>
    <td style="${_tdBase}"></td>
  </tr>
</table>
<div style="padding:0 14px;">
  <div style="font-size:16pt;line-height:8mm;">سرکار بذریعہ <span id="idxn-complainant" class="fill-line" style="display:inline-block;width:82%;border-bottom:1.5px dotted #000;vertical-align:bottom;text-align:center;font-weight:bold;">${_e(c?.complainant||'')||'&nbsp;'}</span></div>
  <div style="font-size:16pt;line-height:8mm;">رابطہ نمبر <span id="idxn-mudai-cell" class="fill-line" style="display:inline-block;width:28%;border-bottom:1.5px dotted #000;vertical-align:bottom;text-align:center;${_ltrS}">${_e(_cCell)||'&nbsp;'}</span> شناختی کارڈ نمبر <span id="idxn-mudai-cnic" class="fill-line" style="display:inline-block;width:34%;border-bottom:1.5px dotted #000;vertical-align:bottom;text-align:center;${_ltrS}">${_e(_cCnic)||'&nbsp;'}</span></div>
  ${_bnam}
</div>
<div style="text-align:center;font-size:20pt;font-weight:bold;text-decoration:underline;margin:3px 0 2px;">انڈکس ضمنیات</div>
<table style="width:100%;border-collapse:collapse;table-layout:fixed;"><colgroup>${_zCols}</colgroup>${_zHead}${_zRows}</table>`;
  }

  const o   = currentOfficer || {};
  const fir = c?.fir_number  || '________';
  const dt  = c?.fir_date    || '________';
  const sec = c?.section_of_law || '________';
  const ofc = c?.offence_type   || '________';
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
      <div style="font-size:14px;">تھانہ ${sta} &nbsp;—&nbsp; ضلع ${dst}</div>
      <div style="font-size:16px;font-weight:bold;margin-top:6px;">${title}</div>
      <div style="font-size:12px;margin-top:4px;">مقدمہ نمبر: ${fir} &nbsp;|&nbsp; تاریخ: ${dt}</div>
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
        <div style="font-size:12px;">دستخط مدعی</div>
      </div>
      <div style="text-align:center;">
        <div>_______________________</div>
        <div style="font-size:12px;">${rnk} ${ion} (${bdg})</div>
        <div style="font-size:12px;">تفتیشی افسر</div>
      </div>
    </div>`;

  const templates = {

    fir: `${header('ایف آئی آر — مقدمہ اول اطلاع')}
      ${table(
        row('مقدمہ نمبر', fir) +
        row('تاریخ و وقت', dt) +
        row('دفعات', sec) +
        row('نوعیت جرم', ofc) +
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

    crime_scene: `${header('جائے واردات کا نقشہ و رپورٹ')}
      ${table(
        row('مقدمہ نمبر', fir) +
        row('تاریخ وقوعہ', c?.occurrence_date||'________') +
        row('مقام وقوعہ', '________') +
        row('موسم و روشنی', '________')
      )}
      <div style="font-weight:bold;margin-bottom:6px;">جائے واردات کی تفصیل:</div>
      <div style="min-height:100px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">مقام وقوعہ کی تفصیل یہاں درج کریں...</div>
      <div style="font-weight:bold;margin:12px 0 6px;">جائے واردات کا خاکہ / نقشہ:</div>
      <div style="min-height:160px;border:2px dashed #ccc;padding:10px;border-radius:4px;text-align:center;color:#999;" contenteditable="true">نقشہ یہاں بنائیں یا تفصیل لکھیں</div>
      <div style="font-weight:bold;margin:12px 0 6px;">موقع سے برآمد شدہ نشانات:</div>
      <div style="min-height:60px;border:1px solid #ccc;padding:10px;border-radius:4px;" contenteditable="true">نشانات...</div>
      ${sig}`,

    named_accused: `${header('نامزد ملزمان')}
      <div style="font-size:12px;margin-bottom:12px;">مقدمہ نمبر: ${fir} &nbsp;|&nbsp; دفعات: ${sec}</div>
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
      <div style="font-size:12px;margin-bottom:12px;">مقدمہ نمبر: ${fir}</div>
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
      <div style="font-size:12px;margin-bottom:12px;">مقدمہ نمبر: ${fir}</div>
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
