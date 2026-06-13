/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — TEMPLATES & OFFICIAL FORMS  (forms.js)
   Punjab Police standard forms · Auto-fill from officer data
   ═══════════════════════════════════════════════════════════ */

registerPage('forms', renderOfficialForms);

const _FORMS = [
  { id:'fir_printer',  icon:'📄', name:'FIR پرنٹر',         desc:'مقدمے کے ڈیٹا سے مکمل FIR دستاویز' },
  { id:'arrest_form',  icon:'🔒', name:'فارم گرفتاری',      desc:'ملزم کی گرفتاری کا سرکاری فارم' },
  { id:'bail_form',    icon:'⚖️', name:'درخواست ضمانت',     desc:'ضمانت کی درخواست کا فارم' },
  { id:'warrant_req',  icon:'📋', name:'وارنٹ درخواست',     desc:'گرفتاری وارنٹ کی درخواست' },
  { id:'char_cert',    icon:'🏅', name:'کردار سرٹیفکیٹ',    desc:'کردار سرٹیفکیٹ فارم' },
  { id:'noc_form',     icon:'✅', name:'NOC فارم',           desc:'کوئی اعتراض نہیں سرٹیفکیٹ' },
  { id:'surety_form',  icon:'🤝', name:'ضامن فارم',         desc:'ضامن کی معلومات کا فارم' },
  { id:'challan_form', icon:'📁', name:'چالان فارم',        desc:'عدالت میں پیش کرنے کا چالان' },
  { id:'remand_form',  icon:'🔐', name:'ریمانڈ درخواست',    desc:'ملزم کے ریمانڈ کی درخواست' },
  { id:'progress_rep', icon:'📊', name:'پراگریس رپورٹ',     desc:'تفتیش کی پیش رفت کی رپورٹ' },
];

async function renderOfficialForms(container) {
  const o = currentOfficer || {};
  container.innerHTML = `
  <div style="max-width:900px;margin:0 auto;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:18px;font-weight:800;">📥 سرکاری فارمز</div>
        <div style="font-size:12px;color:var(--text-muted);">تھانہ ${o.station||'—'} · ضلع ${o.district||'—'}</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;">
      ${_FORMS.map(f => `
        <div onclick="_openForm('${f.id}')"
          style="background:var(--bg-card);border:1px solid var(--border);border-radius:12px;
                 padding:20px 16px;cursor:pointer;text-align:center;transition:all 0.15s;"
          onmouseover="this.style.borderColor='var(--accent)';this.style.transform='translateY(-2px)'"
          onmouseout="this.style.borderColor='var(--border)';this.style.transform=''">
          <div style="font-size:36px;margin-bottom:10px;">${f.icon}</div>
          <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:4px;
                      font-family:'Jameel Noori Nastaleeq',serif;">${f.name}</div>
          <div style="font-size:11px;color:var(--text-muted);">${f.desc}</div>
        </div>`).join('')}
    </div>

    <!-- FIR Printer section -->
    <div class="card">
      <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;">📄 FIR پرنٹر — مقدمے سے براہ راست</div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:12px;direction:rtl;">
        مقدمہ نمبر درج کریں — تمام ڈیٹا خودکار بھر جائے گا
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <input class="form-input" id="fir-print-num" placeholder="FIR نمبر درج کریں" style="flex:1;min-width:180px;" dir="ltr">
        <button class="btn btn-primary" onclick="_printFIR()">🖨️ FIR پرنٹ کریں</button>
      </div>
      <div id="fir-print-status" style="font-size:12px;color:var(--text-muted);margin-top:8px;"></div>
    </div>
  </div>`;
}

async function _printFIR() {
  const firNum = document.getElementById('fir-print-num')?.value.trim();
  const status = document.getElementById('fir-print-status');
  if (!firNum) { showToast('⚠️ FIR نمبر درج کریں','error'); return; }
  if (status) status.textContent = '⏳ مقدمہ تلاش ہو رہا ہے...';
  try {
    const cases = await getCases();
    const c = cases.find(x => x.fir_number?.toLowerCase().includes(firNum.toLowerCase()));
    if (!c) { if(status) status.textContent='⚠️ مقدمہ نہیں ملا'; return; }
    if (status) status.textContent='✅ مقدمہ مل گیا — پرنٹ ہو رہا ہے...';
    _renderFIR(c);
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

function _renderFIR(c) {
  const o = currentOfficer || {};
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html dir="rtl"><head>
  <meta charset="UTF-8"><title>FIR ${c.fir_number}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page { margin:15mm; size:A4; }
    body { font-family:'Noto Nastaliq Urdu','Jameel Noori Nastaleeq',Arial,sans-serif; direction:rtl; color:#111; font-size:13px; }
    .header { text-align:center; border-bottom:3px double #000; padding-bottom:10px; margin-bottom:14px; }
    .header h1 { font-size:20px; font-weight:900; margin-bottom:4px; }
    .header h2 { font-size:16px; font-weight:700; }
    table { width:100%; border-collapse:collapse; margin-bottom:12px; }
    td, th { border:1px solid #333; padding:6px 10px; font-size:13px; }
    th { background:#f0f0f0; font-weight:700; width:35%; }
    .section-title { font-size:14px; font-weight:700; background:#e8e8e8; padding:6px 10px; margin:12px 0 6px; border-right:4px solid #333; }
    .sig-block { display:flex; justify-content:space-between; margin-top:40px; }
    .sig-box { text-align:center; min-width:200px; }
    .sig-line { border-top:1px solid #333; margin-bottom:6px; padding-top:6px; }
    .footer { text-align:center; font-size:10px; color:#666; margin-top:30px; border-top:1px solid #ccc; padding-top:8px; }
    @media print { body { margin:0; } }
  </style></head><body>

  <div class="header">
    <h1>محکمہ پولیس پنجاب</h1>
    <h2>تھانہ ${o.station||'_______'} ضلع ${o.district||'_______'}</h2>
    <div style="font-size:15px;font-weight:700;margin-top:6px;">فرسٹ انفارمیشن رپورٹ (FIR)</div>
    <div style="font-size:12px;margin-top:3px;">FIRST INFORMATION REPORT</div>
  </div>

  <table>
    <tr><th>مقدمہ نمبر</th><td><b style="font-size:15px;">${c.fir_number||'—'}</b></td></tr>
    <tr><th>تاریخ اندراج مقدمہ</th><td>${formatDate(c.fir_date)}</td></tr>
    <tr><th>تاریخ وقوعہ</th><td>${formatDate(c.occurrence_date)}</td></tr>
    <tr><th>دفعات قانون</th><td><b>${c.section_of_law||'—'}</b></td></tr>
    <tr><th>جرم</th><td>${c.offence_type||'—'}</td></tr>
    <tr><th>تھانہ</th><td>${c.case_station||o.station||'—'}</td></tr>
    <tr><th>ضلع</th><td>${c.case_district||o.district||'—'}</td></tr>
    <tr><th>صورتحال</th><td>${STATUS_LABELS?.[c.status]||c.status||'—'}</td></tr>
    <tr><th>ملزمان</th><td>${c.mulzman_type==='maloom'?'✅ معلوم':'⚠️ نامعلوم'}</td></tr>
  </table>

  <div class="section-title">مدعی کی تفصیل</div>
  <table>
    <tr><th>مدعی کا نام</th><td><b>${c.complainant||'—'}</b></td></tr>
    <tr><th>شناختی کارڈ</th><td>${c.complainant_cnic||'—'}</td></tr>
    <tr><th>موبائل نمبر</th><td>${c.complainant_cell||'—'}</td></tr>
    <tr><th>پیشہ</th><td>${c.complainant_profession||'—'}</td></tr>
  </table>

  ${c.fir_writer||c.complaint_sender ? `
  <div class="section-title">FIR کی تفصیل</div>
  <table>
    ${c.fir_writer?`<tr><th>محرر</th><td>${c.fir_writer}</td></tr>`:''}
    ${c.complaint_sender?`<tr><th>مرتبہ مرسلہ</th><td>${c.complaint_sender}</td></tr>`:''}
  </table>` : ''}

  <div class="section-title">واقعے کی تفصیل / روداد</div>
  <div style="min-height:80px;border:1px solid #333;padding:10px;margin-bottom:12px;line-height:2;">
    ${c.notes||'_'.repeat(200)}
  </div>

  <div class="sig-block">
    <div class="sig-box">
      <div style="height:50px;"></div>
      <div class="sig-line">دستخط مدعی</div>
      <div style="font-size:12px;">${c.complainant||'_____________'}</div>
    </div>
    <div class="sig-box">
      <div style="height:50px;"></div>
      <div class="sig-line">دستخط محرر</div>
      <div style="font-size:12px;">${c.fir_writer||'_____________'}</div>
    </div>
    <div class="sig-box">
      <div style="height:50px;"></div>
      <div class="sig-line">SHO تھانہ ${o.station||'_______'}</div>
      <div style="font-size:12px;">مہر و دستخط</div>
    </div>
  </div>

  <div class="footer">
    Digital IO · محکمہ پولیس پنجاب · تاریخ پرنٹ: ${new Date().toLocaleDateString('en-PK')}
  </div>

  <script>window.onload=()=>setTimeout(()=>window.print(),500);<\/script>
  </body></html>`);
  w.document.close();
}

function _openForm(id) {
  const o = currentOfficer || {};
  const forms = {
    arrest_form: _getArrestForm(o),
    bail_form:   _getBailForm(o),
    warrant_req: _getWarrantForm(o),
    progress_rep:_getProgressReport(o),
    remand_form: _getRemandForm(o),
    char_cert:   _getCharCert(o),
    noc_form:    _getNOC(o),
    surety_form: _getSuretyForm(o),
    challan_form:_getChallanForm(o),
    fir_printer: null,
  };
  if (id === 'fir_printer') {
    document.getElementById('fir-print-num')?.focus();
    showToast('نیچے FIR نمبر درج کریں','info');
    return;
  }
  const html = forms[id];
  if (!html) return;
  const w = window.open('','_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 600);
}

function _formHead(title, o) {
  return `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8"><title>${title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    @page{margin:15mm;size:A4;} body{font-family:'Noto Nastaliq Urdu','Jameel Noori Nastaleeq',Arial,sans-serif;direction:rtl;color:#111;font-size:13px;}
    .hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:8px;margin-bottom:12px;}
    .hdr h1{font-size:18px;font-weight:900;margin-bottom:2px;} .hdr h2{font-size:14px;}
    table{width:100%;border-collapse:collapse;margin-bottom:10px;} td,th{border:1px solid #333;padding:6px 10px;font-size:13px;}
    th{background:#f0f0f0;width:40%;} .blank{border-bottom:1px solid #999;min-height:30px;margin-bottom:8px;}
    .sig{display:flex;justify-content:space-between;margin-top:30px;} .sig-box{text-align:center;}
    .sig-line{border-top:1px solid #000;padding-top:5px;margin-top:30px;} .footer{font-size:10px;color:#666;text-align:center;margin-top:20px;}
  </style></head><body>
  <div class="hdr"><h1>محکمہ پولیس پنجاب</h1><h2>تھانہ ${o.station||'_______'} ضلع ${o.district||'_______'}</h2><div style="font-size:14px;font-weight:700;margin-top:4px;">${title}</div></div>`;
}
function _formFoot() { return `<div class="footer">Digital IO · محکمہ پولیس پنجاب · ${new Date().toLocaleDateString('en-PK')}</div><script>window.onload=()=>setTimeout(()=>window.print(),500);<\/script></body></html>`; }

function _getArrestForm(o) {
  return _formHead('فارم گرفتاری', o) +
  `<table><tr><th>گرفتاری کی تاریخ</th><td></td></tr>
  <tr><th>FIR نمبر</th><td></td></tr>
  <tr><th>ملزم کا نام</th><td></td></tr>
  <tr><th>والد کا نام</th><td></td></tr>
  <tr><th>شناختی کارڈ</th><td></td></tr>
  <tr><th>رہائش</th><td></td></tr>
  <tr><th>دفعات</th><td></td></tr>
  <tr><th>گرفتار کرنے والے افسر</th><td>${o.full_name||''} — ${o.designation||''}</td></tr></table>
  <div style="margin-top:10px;"><b>گرفتاری کی وجہ:</b><div class="blank"></div><div class="blank"></div></div>
  <div class="sig"><div class="sig-box"><div class="sig-line">دستخط گرفتار ملزم</div></div>
  <div class="sig-box"><div class="sig-line">دستخط گرفتاری افسر<br>${o.full_name||''}</div></div>
  <div class="sig-box"><div class="sig-line">SHO تھانہ ${o.station||''}</div></div></div>` + _formFoot();
}

function _getBailForm(o) {
  return _formHead('درخواست ضمانت', o) +
  `<p style="text-align:right;margin-bottom:10px;">بخدمت جناب عدالت محترم</p>
  <table><tr><th>درخواست گزار کا نام</th><td></td></tr>
  <tr><th>FIR نمبر</th><td></td></tr>
  <tr><th>دفعات</th><td></td></tr>
  <tr><th>گرفتاری کی تاریخ</th><td></td></tr>
  <tr><th>ضامن کا نام</th><td></td></tr>
  <tr><th>ضامن کا شناختی کارڈ</th><td></td></tr></table>
  <div style="margin:10px 0;"><b>درخواست:</b><div class="blank"></div><div class="blank"></div><div class="blank"></div></div>
  <div class="sig"><div class="sig-box"><div class="sig-line">دستخط درخواست گزار</div></div>
  <div class="sig-box"><div class="sig-line">SHO تھانہ ${o.station||''}</div></div></div>` + _formFoot();
}

function _getWarrantForm(o) {
  return _formHead('وارنٹ گرفتاری کی درخواست', o) +
  `<table><tr><th>FIR نمبر</th><td></td></tr>
  <tr><th>مطلوب ملزم کا نام</th><td></td></tr>
  <tr><th>والد کا نام</th><td></td></tr>
  <tr><th>رہائش</th><td></td></tr>
  <tr><th>دفعات</th><td></td></tr>
  <tr><th>آخری معلوم مقام</th><td></td></tr></table>
  <div style="margin:10px 0;"><b>وجوہات:</b><div class="blank"></div><div class="blank"></div></div>
  <div class="sig"><div class="sig-box"><div class="sig-line">تفتیشی افسر<br>${o.full_name||''} ${o.designation||''}</div></div>
  <div class="sig-box"><div class="sig-line">SHO ${o.station||''}</div></div></div>` + _formFoot();
}

function _getProgressReport(o) {
  return _formHead('پراگریس رپورٹ — رپورٹ 173 ض ف', o) +
  `<table><tr><th>FIR نمبر</th><td></td></tr>
  <tr><th>تاریخ</th><td>${new Date().toLocaleDateString('en-PK')}</td></tr>
  <tr><th>تفتیشی افسر</th><td>${o.full_name||''} ${o.designation||''}</td></tr>
  <tr><th>تفتیش کی موجودہ صورتحال</th><td></td></tr></table>
  <div style="margin:10px 0;"><b>اب تک کی کاروائی:</b><div class="blank"></div><div class="blank"></div><div class="blank"></div></div>
  <div style="margin:10px 0;"><b>شواہد:</b><div class="blank"></div><div class="blank"></div></div>
  <div style="margin:10px 0;"><b>آئندہ لائحہ عمل:</b><div class="blank"></div><div class="blank"></div></div>
  <div class="sig"><div class="sig-box"><div class="sig-line">تفتیشی افسر<br>${o.full_name||''}</div></div>
  <div class="sig-box"><div class="sig-line">SHO ${o.station||''}</div></div></div>` + _formFoot();
}

function _getRemandForm(o) {
  return _formHead('درخواست ریمانڈ', o) +
  `<p style="text-align:right;margin-bottom:10px;">بخدمت جناب مجسٹریٹ / جج صاحب</p>
  <table><tr><th>ملزم کا نام</th><td></td></tr>
  <tr><th>FIR نمبر</th><td></td></tr>
  <tr><th>دفعات</th><td></td></tr>
  <tr><th>گرفتاری کی تاریخ</th><td></td></tr>
  <tr><th>مطلوب ریمانڈ مدت</th><td></td></tr></table>
  <div style="margin:10px 0;"><b>ریمانڈ کی ضرورت:</b><div class="blank"></div><div class="blank"></div><div class="blank"></div></div>
  <div class="sig"><div class="sig-box"><div class="sig-line">تفتیشی افسر</div></div>
  <div class="sig-box"><div class="sig-line">SHO ${o.station||''}</div></div></div>` + _formFoot();
}

function _getCharCert(o) {
  return _formHead('کردار سرٹیفکیٹ', o) +
  `<p style="margin:10px 0;direction:rtl;">یہ سرٹیفکیٹ اس بات کی تصدیق کے لیے جاری کیا جاتا ہے کہ:</p>
  <table><tr><th>نام</th><td></td></tr>
  <tr><th>والد کا نام</th><td></td></tr>
  <tr><th>شناختی کارڈ</th><td></td></tr>
  <tr><th>رہائش</th><td></td></tr></table>
  <p style="margin:10px 0;line-height:2;">مذکورہ شخص تھانہ <b>${o.station||'_______'}</b> کے ریکارڈ کے مطابق کسی مجرمانہ سرگرمی میں ملوث نہیں پایا گیا اور اس کا کردار اطمینان بخش ہے۔</p>
  <div class="sig"><div class="sig-box"><div class="sig-line">SHO تھانہ ${o.station||'_______'}<br>مہر و دستخط</div></div></div>` + _formFoot();
}

function _getNOC(o) {
  return _formHead('NOC — کوئی اعتراض نہیں', o) +
  `<table><tr><th>درخواست گزار</th><td></td></tr>
  <tr><th>شناختی کارڈ</th><td></td></tr>
  <tr><th>مقصد</th><td></td></tr>
  <tr><th>تاریخ</th><td>${new Date().toLocaleDateString('en-PK')}</td></tr></table>
  <p style="margin:12px 0;line-height:2;">تھانہ <b>${o.station||'_______'}</b> کی طرف سے تصدیق کی جاتی ہے کہ مذکورہ شخص کے خلاف اس دفتر میں کوئی مقدمہ زیر سماعت نہیں اور اسے مطلوبہ مقصد کے لیے کوئی اعتراض نہیں۔</p>
  <div class="sig"><div class="sig-box"><div class="sig-line">SHO ${o.station||'_______'}<br>مہر و دستخط</div></div></div>` + _formFoot();
}

function _getSuretyForm(o) {
  return _formHead('ضامن فارم', o) +
  `<table><tr><th>ضامن کا نام</th><td></td></tr>
  <tr><th>والد کا نام</th><td></td></tr>
  <tr><th>شناختی کارڈ</th><td></td></tr>
  <tr><th>رہائش</th><td></td></tr>
  <tr><th>پیشہ</th><td></td></tr>
  <tr><th>موبائل</th><td></td></tr>
  <tr><th>جس کے لیے ضمانت</th><td></td></tr></table>
  <p style="margin:10px 0;line-height:2;">میں <b>________________________</b> حلفاً بیان کرتا ہوں کہ مذکورہ ملزم کی ضمانت دیتا ہوں اور اسے عدالت میں پیش کرنے کا ذمہ لیتا ہوں۔</p>
  <div class="sig"><div class="sig-box"><div class="sig-line">دستخط ضامن</div></div>
  <div class="sig-box"><div class="sig-line">تصدیق کنندہ SHO ${o.station||''}</div></div></div>` + _formFoot();
}

function _getChallanForm(o) {
  return _formHead('پولیس چالان', o) +
  `<table><tr><th>FIR نمبر</th><td></td></tr>
  <tr><th>عدالت</th><td></td></tr>
  <tr><th>جج صاحب</th><td></td></tr>
  <tr><th>تاریخ پیشی</th><td></td></tr>
  <tr><th>ملزمان</th><td></td></tr>
  <tr><th>دفعات</th><td></td></tr>
  <tr><th>گواہان کی تعداد</th><td></td></tr>
  <tr><th>شواہد</th><td></td></tr></table>
  <div style="margin:10px 0;"><b>مختصر واقعہ:</b><div class="blank"></div><div class="blank"></div></div>
  <div class="sig"><div class="sig-box"><div class="sig-line">تفتیشی افسر<br>${o.full_name||''} ${o.designation||''}</div></div>
  <div class="sig-box"><div class="sig-line">SHO ${o.station||''}<br>مہر و دستخط</div></div></div>` + _formFoot();
}
