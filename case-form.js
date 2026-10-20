/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — نیا/ترمیمی مقدمہ کا فارم (کراس ورژن سمیت)
   (پہلے یہ cases.js میں تھا)
   ═══════════════════════════════════════════════════════════ */

// v538: یہ دو فہرستیں پہلے کہیں declare نہیں تھیں (خاموش implicit global) —
//   cases.js بھی انہیں پڑھتا ہے۔ صاف اعلان؛ رویہ وہی (window پر ہی رہتی ہیں)۔
var selectedSections = [];
var selectedDocuments = [];
// ── FORM CSS (compact, single-line label+field, 14pt — injected once) ──
function _cfInjectCSS() {
  if (document.getElementById('cf-form-css')) return;
  var s = document.createElement('style');
  s.id = 'cf-form-css';
  s.textContent = ''
    + '.cf-form{direction:rtl;text-align:right;width:100%;box-sizing:border-box;}'
    + '.cf-form *{box-sizing:border-box;}'
    + '.cf-label{font-size:14pt;font-weight:700;text-align:right;white-space:nowrap;'
    +   'font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;'
    +   'margin:0;color:var(--text-primary);line-height:1.3;flex:0 0 auto;}'
    + '.cf-field{display:flex;flex-direction:row;align-items:center;gap:6px;min-width:0;margin-bottom:9px;}'
    + '.cf-field > .form-input,.cf-field > select.form-input,.cf-field > div{flex:1;min-width:0;}'
    + '.cf-form .form-input{font-size:14pt;padding:6px 8px;margin:0;}'
    + '.cf-row2{display:grid;grid-template-columns:1fr 1fr;gap:2px 14px;align-items:center;width:100%;}'
    + '.cf-row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px 10px;align-items:center;width:100%;}'
    + '.cf-row4{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:2px 8px;align-items:center;width:100%;}'
    + '.cf-row4-rapat{display:grid;grid-template-columns:0.5fr 1fr 1fr 1.5fr;gap:2px 8px;align-items:center;width:100%;}'
    + '.cf-row-7030{display:grid;grid-template-columns:7fr 3fr;gap:2px 10px;align-items:center;width:100%;}'
    + '.cf-row1{display:grid;grid-template-columns:1fr;gap:2px 10px;width:100%;}'
    + '.cf-row4m{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:2px 8px;align-items:center;width:100%;}'
    + '.cf-row3s{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px 10px;align-items:center;width:100%;}'
    + '.cf-row-sim{display:grid;grid-template-columns:repeat(4,1fr);gap:2px 8px;width:100%;}'
    /* v552: IMEI (15 ہندسے) کے خانے بڑے، ماڈل/کمپنی کا خانہ چھوٹا */
    + '.cf-row-imei{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1.3fr) minmax(0,0.75fr);gap:2px 10px;align-items:center;width:100%;}'
    + '.cf-row-imei input[dir=ltr]{letter-spacing:.02em;}'
    + '.cf-row2 .cf-field,.cf-row3 .cf-field,.cf-row4 .cf-field,.cf-row4-rapat .cf-field,.cf-row-7030 .cf-field,.cf-row-sim .cf-field,.cf-row-imei .cf-field{margin-bottom:9px;}'
    + '.cf-box{padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:12px;}'
    + '.cf-box-title{font-size:14pt;font-weight:800;color:var(--accent);margin-bottom:9px;text-align:right;'
    +   'font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;}'
    + '.cf-hint{font-size:11px;color:var(--text-muted);margin:-4px 0 9px;padding-right:2px;}'
    /* «نیا اندراج» کارڈ: نام خانے کے اوپری دائیں کنارے پر، 14pt، چھوٹی اونچائی، ڈیٹا جتنی چوڑائی */
    + '.dio-entry .cf-form{max-height:none!important;overflow:visible!important;padding:4px 0 0!important;}'
    + '.dio-entry .cf-box{background:none!important;padding:0!important;margin:0!important;}'
    + '.dio-entry .cf-field{position:relative!important;display:block!important;margin:0!important;padding-top:0!important;}'
    + '.dio-entry .cf-field > .cf-label{position:absolute!important;top:-0.8em!important;inset-inline-start:10px!important;z-index:2;padding:0 5px!important;margin:0!important;'
    +   'background:var(--bg-card,#fff)!important;color:var(--accent,#0369a1)!important;font-size:var(--dio-h3,11.25pt)!important;line-height:1.35!important;'
    +   'white-space:nowrap!important;pointer-events:none;max-width:calc(100% - 16px);overflow:hidden;text-overflow:ellipsis;}'
    + '.dio-entry .cf-field > .cf-label[style]{margin-top:0!important;}'
    + '.dio-entry .cf-form input.form-input,.dio-entry .cf-form select.form-input{height:40px!important;font-size:14pt!important;padding:0 10px!important;'
    +   'border:1.5px solid var(--border,#c8d8e8)!important;border-radius:9px!important;width:100%;background:var(--bg-card,#fff)!important;}'
    + '.dio-entry #cross-version-fields .cf-field > .cf-label{background:var(--bg-card,#fff)!important;}'
    + '.dio-entry .cf-form input[dir=ltr].form-input{font-family:Aptos,"Segoe UI",system-ui,sans-serif!important;font-size:12pt!important;text-align:right!important;}'
    + '.dio-entry .cf-form .cf-field > div{width:100%;}'
    /* سطروں کے درمیان کم فاصلہ (اکتوبر 2026) — صرف اتنا کہ کنارے والا نام آ جائے */
    + '.dio-entry .cf-row1,.dio-entry .cf-row2,.dio-entry .cf-row3,.dio-entry .cf-row3s,.dio-entry .cf-row4,.dio-entry .cf-row4m,.dio-entry .cf-row4-rapat,.dio-entry .cf-row-7030,.dio-entry .cf-row-sim,.dio-entry .cf-row-imei{gap:12px 10px!important;padding-top:13px;}'
    + '.dio-entry .cf-form > .cf-field,.dio-entry .cf-box > .cf-field,.dio-entry #cross-version-fields > .cf-field,.dio-entry #cf-mobile-fields-wrap > .cf-field{margin-top:13px!important;}'
    + '.dio-entry #selected-sections:empty{display:none;}.dio-entry #selected-sections{margin-top:4px!important;}'
    + '.dio-entry #cf-mobile-box{margin:10px 0 0!important;padding:4px 10px 8px!important;}'

    + '@media(min-width:761px){'
    +   '.dio-entry .cf-row4{grid-template-columns:8em 9em 9em 1fr!important;}'
    +   '.dio-entry .cf-row3{grid-template-columns:10.5em 8.8em 1fr!important;}'
    +   '.dio-entry .cf-row4m{grid-template-columns:10.5em 8.8em 1fr 7em!important;}'
    +   '.dio-entry .cf-row3s{grid-template-columns:1fr 1fr 11em!important;}'
    +   '.dio-entry .cf-row4-rapat{grid-template-columns:5em 9em 1fr 13em!important;}'
    + '}'
    + '@media(max-width:640px){.cf-row-imei{grid-template-columns:1fr 1fr;}.cf-row-imei > .cf-field:last-child{grid-column:1 / -1;}.cf-row3,.cf-row3s,.cf-row4m{grid-template-columns:1fr 1fr;}.cf-row4,.cf-row4-rapat{grid-template-columns:1fr 1fr;}.cf-row-sim{grid-template-columns:repeat(2,1fr);}}'
    + '@media(max-width:480px){'
    +   '.cf-row2,.cf-row3,.cf-row-7030,.cf-row-sim{grid-template-columns:1fr;}'
    +   '.cf-row4,.cf-row4-rapat{grid-template-columns:1fr 1fr;}'
    +   '.cf-row3s{grid-template-columns:1fr 1fr;}.cf-row3s > .cf-field:last-child{grid-column:1 / -1;}'
    +   '.cf-row4m{grid-template-columns:1fr 1fr;}'
    +   '.cf-field{flex-wrap:wrap;}'
    +   '.cf-label{white-space:normal;}'
    + '}';
  document.head.appendChild(s);
}


// ── Keep کراس ورژن مقدمہ نمبر/تاریخ live-synced with the top مقدمہ نمبر/تاریخ اندراج ──
// (runs on every keystroke in the top fields; stops touching a field once the officer types into it manually)
function _cfLiveSyncCross() {
  var mFir = document.getElementById('cf-fir');
  var mDate = document.getElementById('cf-date');
  var cfirEl = document.getElementById('cf-cross-fir');
  var cfirDateEl = document.getElementById('cf-cross-fir-date');
  if (cfirEl && mFir && cfirEl.dataset.auto !== '0') cfirEl.value = mFir.value;
  if (cfirDateEl && mDate && cfirDateEl.dataset.auto !== '0') cfirDateEl.value = mDate.value;
}

// ── Toggle cross-version box + do an immediate sync when it's switched on ──
function _cfToggleCross(el) {
  var box = document.getElementById('cross-version-fields');
  if (box) box.style.display = el.checked ? 'block' : 'none';
  if (el.checked) _cfLiveSyncCross();
}

// ── Mobile-theft: parse saved comma-strings back into per-phone objects ──
function _cfParseMobilePhones(c) {
  c = c || {};
  var imeis = (c.theft_imei || '').split(',').map(function(s){ return s.trim(); }).filter(Boolean);
  var brands = (c.theft_brand || '').split(',').map(function(s){ return s.trim(); });
  var sims = c.theft_cell ? c.theft_cell.split(',').map(function(s){ return s.trim(); }) : [];
  var count = Math.max(1, Math.ceil(imeis.length / 2), brands.filter(Boolean).length, Math.ceil(sims.length / 2));
  var phones = [];
  for (var i = 0; i < count; i++) {
    phones.push({
      imei1: imeis[i*2] || '',
      imei2: imeis[i*2+1] || '',
      brand: brands[i] || '',
      sim1: sims[i*2] || '',
      sim2: sims[i*2+1] || ''
    });
  }
  return phones;
}

// ── Mobile-theft: build one phone's field block (IMEI + brand only; SIMs are pooled below) ──
function _cfPhoneBlockHTML(i, p) {
  p = p || {};
  return '<div class="cf-mobile-phone-block" style="border-top:1px dashed var(--border);padding-top:6px;margin-top:6px;">'
    + '<div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:4px;">موبائل نمبر '+i+'</div>'
    + '<div class="cf-row-imei">'
    +   '<div class="cf-field"><label class="cf-label">IMEI 1</label>'
    +     '<input class="form-input" dir="ltr" inputmode="numeric" maxlength="15" id="cf-mobile-imei-'+i+'-1" value="'+esc(p.imei1)+'" placeholder="000000000000000" oninput="_imeiLookupIdx(this,'+i+')"></div>'
    +   '<div class="cf-field"><label class="cf-label">IMEI 2</label>'
    +     '<input class="form-input" dir="ltr" inputmode="numeric" maxlength="15" id="cf-mobile-imei-'+i+'-2" value="'+esc(p.imei2)+'" placeholder="000000000000000" oninput="_imeiLookupIdx(this,'+i+')"></div>'
    +   '<div class="cf-field"><label class="cf-label">ماڈل / کمپنی</label>'
    +     '<input class="form-input" id="cf-mobile-brand-'+i+'" value="'+esc(p.brand)+'" data-auto="'+(p.brand?'0':'1')+'" placeholder="خودکار، یا خود لکھیں" oninput="this.dataset.auto=\'0\'" title="IMEI سے خودکار (سابقہ اندراجات سے بھی) — آپ خود بھی لکھ / بدل سکتے ہیں"></div>'
    + '</div>'
    + '</div>';
}

// ── Mobile-theft: one pooled SIM field (labeled with which phone it belongs to) ──
function _cfSimFieldHTML(phoneIdx, simIdx, value) {
  return '<div class="cf-field"><label class="cf-label">موبائل '+phoneIdx+' - سم '+simIdx+'</label>'
    + '<input class="form-input" dir="ltr" id="cf-mobile-sim-'+phoneIdx+'-'+simIdx+'" value="'+esc(value)+'" placeholder="0000-0000000" inputmode="numeric" maxlength="12" dir="ltr" oninput="autoFormatCell(this)"></div>';
}

// ── Mobile-theft: read current values back out of the DOM ──
function _cfCollectMobilePhones() {
  var out = [];
  var container = document.getElementById('cf-mobile-phones-container');
  if (!container) return out;
  var blocks = container.querySelectorAll('.cf-mobile-phone-block');
  for (var idx = 0; idx < blocks.length; idx++) {
    var i = idx + 1;
    out.push({
      imei1: (document.getElementById('cf-mobile-imei-'+i+'-1') || {}).value || '',
      imei2: (document.getElementById('cf-mobile-imei-'+i+'-2') || {}).value || '',
      brand: (document.getElementById('cf-mobile-brand-'+i) || {}).value || '',
      sim1: (document.getElementById('cf-mobile-sim-'+i+'-1') || {}).value || '',
      sim2: (document.getElementById('cf-mobile-sim-'+i+'-2') || {}).value || ''
    });
  }
  return out;
}

// ── Mobile-theft: (re)generate the N phone blocks + pooled SIM fields based on the count field ──
function _cfRenderMobilePhones() {
  var countEl = document.getElementById('cf-mobile-count');
  var n = Math.max(1, Math.min(20, parseInt((countEl && countEl.value) || '1', 10) || 1));
  if (countEl) countEl.value = n;
  var container = document.getElementById('cf-mobile-phones-container');
  var simContainer = document.getElementById('cf-mobile-sims-container');
  if (!container || !simContainer) return;
  var isFirst = container.children.length === 0;
  var prev;
  if (isFirst) {
    var seedEl = document.getElementById('cf-mobile-seed');
    try { prev = seedEl ? JSON.parse(seedEl.value || '[]') : []; } catch(e) { prev = []; }
  } else {
    prev = _cfCollectMobilePhones();
  }
  var html = '';
  var simHtml = '';
  for (var i = 1; i <= n; i++) {
    var p = prev[i-1] || {};
    html += _cfPhoneBlockHTML(i, p);
    simHtml += _cfSimFieldHTML(i, 1, p.sim1);
    simHtml += _cfSimFieldHTML(i, 2, p.sim2);
  }
  container.innerHTML = html;
  simContainer.innerHTML = simHtml;
}

// ── v552: سابقہ اندراجات سے سیکھا ہوا IMEI → ماڈل (اسی افسر کے پچھلے مقدمات) ──
//  پورا IMEI پہلے کسی مقدمے میں ماڈل کے ساتھ درج ہو → وہی ماڈل؛ ورنہ پہلے 8 ہندسے
//  (TAC — ایک ماڈل کی پہچان) کسی سابقہ IMEI سے ملیں → اسی کا ماڈل؛ ورنہ عام فہرست۔
var _cfImeiHist = null;
function _cfLoadImeiHistory() {
  if (_cfImeiHist) return Promise.resolve(_cfImeiHist);
  var h = { full: {}, tac: {} };
  var p = (typeof getCases === 'function') ? getCases() : Promise.resolve([]);
  return Promise.resolve(p).then(function (list) {
    (list || []).forEach(function (c) {
      var phones = _cfParseMobilePhones(c);
      phones.forEach(function (ph) {
        var br = String(ph.brand || '').trim();
        if (!br) return;
        [ph.imei1, ph.imei2].forEach(function (im) {
          im = String(im || '').replace(/\D/g, '');
          if (im.length >= 14) { h.full[im] = br; h.tac[im.slice(0, 8)] = br; }
        });
      });
    });
    _cfImeiHist = h; return h;
  }).catch(function () { _cfImeiHist = h; return h; });
}
window._cfLoadImeiHistory = _cfLoadImeiHistory;

// ── Mobile-theft: indexed IMEI → brand auto-detect (editable, doesn't overwrite manual entry) ──
function _imeiLookupIdx(input, idx) {
  var v = (input.value || '').replace(/\D/g, '').slice(0, 15);
  input.value = v;
  var brandField = document.getElementById('cf-mobile-brand-'+idx);
  if (!brandField || v.length < 8) return;
  // سابقہ اندراجات (پہلے) — افسر کا اپنا لکھا ہوا ماڈل کبھی نہیں بدلتا
  var hist = _cfImeiHist;
  var known = hist ? (hist.full[v] || hist.tac[v.slice(0, 8)] || '') : '';
  if (known) {
    if (!brandField.value || brandField.dataset.auto !== '0') { brandField.value = known; brandField.dataset.auto = '1'; }
    return;
  }
  if (!hist) { _cfLoadImeiHistory().then(function () { try { _imeiLookupIdx(input, idx); } catch (_) { /* ikhtiyari */ } }); }
  var TAC_BRANDS = {
    '35':'(عام GSM)','01':'Apple iPhone','35332':'Apple','35326':'Apple',
    '86':'Xiaomi / Redmi','86891':'Xiaomi','86553':'Oppo','86742':'Vivo',
    '35846':'Samsung','35649':'Samsung','35878':'Samsung','35291':'Nokia',
    '35395':'Huawei','86095':'Huawei','86227':'Tecno','86303':'Infinix',
    '86997':'Realme','35775':'OnePlus','86452':'itel'
  };
  var brand = '';
  for (var len = 6; len >= 2; len--) {
    var pre = v.slice(0, len);
    if (TAC_BRANDS[pre]) { brand = TAC_BRANDS[pre]; break; }
  }
  if (brand && (!brandField.value || brandField.dataset.auto !== '0')) {
    brandField.value = brand;
    brandField.dataset.auto = '1';
  }
}

// ── Mobile-theft: reveal/hide the phone+SIM fields based on the "was a mobile stolen?" checkbox ──
function _cfToggleMobileTheft(el) {
  var wrap = document.getElementById('cf-mobile-fields-wrap');
  if (wrap) wrap.style.display = el.checked ? 'block' : 'none';
  if (el.checked) _cfRenderMobilePhones();
}

// ── Mobile-theft: join all phone blocks into the theft_* DB columns (comma-separated) ──
function _cfMobileFieldsPayload() {
  var checkEl = document.getElementById('cf-mobile-theft-check');
  if (checkEl && !checkEl.checked) {
    return { theft_item: null, theft_imei: null, theft_brand: null, theft_cell: null };
  }
  var phones = _cfCollectMobilePhones();
  var imeis = [], brands = [], sims = [];
  phones.forEach(function(p){
    if (p.imei1) imeis.push(p.imei1);
    if (p.imei2) imeis.push(p.imei2);
    brands.push(p.brand || '');
    sims.push(p.sim1 || '');
    sims.push(p.sim2 || '');
  });
  var hasAny = imeis.length > 0 || brands.some(Boolean) || sims.some(Boolean);
  return {
    theft_item: hasAny ? 'mobile' : null,
    theft_imei: imeis.length ? imeis.join(',') : null,
    theft_brand: brands.some(Boolean) ? brands.join(',') : null,
    theft_cell: sims.some(Boolean) ? sims.join(',') : null
  };
}

function caseFormHTML(c) {
  _cfInjectCSS();
  c = c || {};
  selectedSections = c.section_of_law ? c.section_of_law.split(' + ').filter(Boolean) : [];
  try {
    selectedDocuments = c.documents_checklist
      ? (typeof c.documents_checklist === 'string'
          ? JSON.parse(c.documents_checklist)
          : Array.isArray(c.documents_checklist) ? c.documents_checklist : [])
      : [];
  } catch(e) { selectedDocuments = []; }

  var fir = c.fir_number || '';
  var _mobilePhonesSeed = _cfParseMobilePhones(c);
  var _mobileTheftChecked = c.theft_item === 'mobile';
  var date = c.fir_date || '';
  var occ = c.occurrence_date || '';
  var occPlace = c.occurrence_place || '';   // بحد / جائے وقوعہ (پرانی occurrence_place کالم — کوئی نیا کالم نہیں)
  var complainant = c.complainant || '';
  var cmpCnic = c.complainant_cnic || '';
  var cmpCell = c.complainant_cell || '';
  var cmpProf = c.complainant_profession || '';
  var section = c.section_of_law || '';
  var firWriter = c.fir_writer || '';
  var compSender = c.complaint_sender || '';
  var status = c.status || 'under';
  var position = c.position || 'pending';
  var isCross = c.is_cross_version || false;

  var statusOpts = '<option value="under"'+(status==='under'?' selected':'')+'>&#x0632;&#x06CC;&#x0631; &#x062A;&#x0641;&#x062A;&#x06CC;&#x0634;</option>'
    + '<option value="complete"'+(status==='complete'?' selected':'')+'>&#x0645;&#x06A9;&#x0645;&#x0644; &#x0686;&#x0627;&#x0644;&#x0627;&#x0646;</option>'
    + '<option value="incomplete"'+(status==='incomplete'?' selected':'')+'>&#x0646;&#x0627;&#x0645;&#x06A9;&#x0645;&#x0644; &#x0686;&#x0627;&#x0644;&#x0627;&#x0646;</option>'
    + '<option value="challan512"'+(status==='challan512'?' selected':'')+'>\u0686\u0627\u0644\u0627\u0646 512\u0636 \u0641</option>'
    + '<option value="untrace"'+(status==='untrace'?' selected':'')+'>&#x0639;&#x062F;&#x0645; &#x067E;&#x062A;&#x06C1;</option>'
    + '<option value="cancel"'+(status==='cancel'?' selected':'')+'>&#x0627;&#x062E;&#x0631;&#x0627;&#x062C;</option>';

  var sectionTags = selectedSections.map(function(s) { return sectionTag(s); }).join('');

  var html = ''
    + '<div class="cf-form" style="max-height:70vh;overflow-y:auto;padding-right:4px;">'

    // Row 1: مقدمہ نمبر + تاریخ اندراج + تاریخ وقوعہ + بحد (چاروں ایک ہی سطر — اکتوبر 2026)
    + '<div class="cf-row4">'
    + '<div class="cf-field"><label class="cf-label">مقدمہ نمبر *</label>'
    + '<input class="form-input" id="cf-fir" value="'+esc(fir)+'" placeholder="e.g. 245/2025" dir="ltr" style="text-align:left;" oninput="_cfLiveSyncCross()" onblur="_cfCheckFirLive('+(c.id?'\''+esc(String(c.id))+'\'':'null')+')"></div>'
    + '<div class="cf-field"><label class="cf-label">تاریخ اندراج *</label>'
    + '<input class="form-input" id="cf-date" value="'+esc(date)+'" placeholder="DD/MM/YYYY" inputmode="numeric" maxlength="10" oninput="autoFormatDate(this);_cfLiveSyncCross()" dir="ltr" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">تاریخ وقوعہ</label>'
    + '<input class="form-input" id="cf-occurrence-date" value="'+esc(occ)+'" placeholder="DD/MM/YYYY" inputmode="numeric" maxlength="10" oninput="autoFormatDate(this)" dir="ltr" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">بحد</label>'
    + '<input class="form-input" id="cf-occurrence-place" value="'+esc(occPlace)+'" placeholder="جائے وقوعہ / بحد" dir="auto"></div>'
    + '</div>'
    + '<div id="cf-fir-dup" role="alert" style="display:none;margin:6px 0 2px;padding:6px 10px;border-radius:8px;background:rgba(220,38,38,.08);border:1px solid rgba(220,38,38,.35);color:#b91c1c;font-size:12pt;font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;"></div>'

    // Row 2: دفعات قانون (پوری سطر)۔ v544: «جرم» کا خانہ ختم (افسر کا فیصلہ) — پورے
    //   سسٹم میں «بجرم» کے آگے صرف دفعات چھپتی ہیں، جرم کی تفصیل (چوری، قتل…) نہیں۔
    + '<div class="cf-row1" style="align-items:flex-start;">'
    + '<div class="cf-field" style="align-items:flex-start;">'
    + '<label class="cf-label" style="margin-top:8px;">دفعات قانون *</label>'
    + '<div style="flex:1;min-width:0;">'
    + '<div style="position:relative;">'
    + '<input class="form-input" id="cf-section-search" placeholder="دفعہ نمبر یا کلیدی الفاظ..." dir="ltr" style="text-align:left;" oninput="searchPenalCodes(this.value)" autocomplete="off">'
    + '<div id="section-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg-card);border:1px solid var(--accent);border-radius:0 0 var(--radius-sm) var(--radius-sm);max-height:180px;overflow-y:auto;z-index:200;box-shadow:var(--shadow);"></div>'
    + '</div>'
    + '<div id="selected-sections" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">'+sectionTags+'</div>'
    + '<input type="hidden" id="cf-section" value="'+esc(section)+'">'
    + '</div>'
    + '</div>'
    + '</div>'

    // Mobile theft detail (shown only when section 379-402 PPC selected)
    + '<div id="cf-mobile-box" style="display:'+(_hasMobileSection(selectedSections)?'block':'none')+';background:var(--bg-secondary);border:1px solid var(--amber);border-radius:8px;padding:12px;margin-bottom:12px;">'
    +   '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14pt;font-weight:700;color:var(--amber);'
    +     'font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;">'
    +     '<input type="checkbox" id="cf-mobile-theft-check" '+(_mobileTheftChecked?'checked':'')+' onchange="_cfToggleMobileTheft(this)" style="width:18px;height:18px;cursor:pointer;">'
    +     'کیا موبائل فون چوری ہوا؟'
    +   '</label>'
    +   '<div id="cf-mobile-fields-wrap" style="display:'+(_mobileTheftChecked?'block':'none')+';margin-top:10px;">'
    +     '<div class="cf-field"><label class="cf-label">تعداد موبائل فون</label>'
    +       '<input class="form-input" type="number" id="cf-mobile-count" min="1" max="20" value="'+_mobilePhonesSeed.length+'" oninput="_cfRenderMobilePhones()"></div>'
    +     '<input type="hidden" id="cf-mobile-seed" value="'+esc(JSON.stringify(_mobilePhonesSeed))+'">'
    +     '<div id="cf-mobile-phones-container"></div>'
    +     '<div style="font-size:12px;font-weight:700;color:var(--text-muted);margin:10px 0 6px;border-top:1px dashed var(--border);padding-top:8px;">سم نمبرز</div>'
    +     '<div id="cf-mobile-sims-container" class="cf-row-sim"></div>'
    +   '</div>'
    + '</div>'


    // مدعی کی تفصیل (ہیڈنگ ہٹا دی گئی)
    + '<div class="cf-box">'

    // Row 1: مدعی (full width with voice + live counter)
    + '<div class="cf-field">'
    + '<label class="cf-label">مدعی — نام و پتہ *</label>'
    + '<div style="display:flex;gap:6px;direction:rtl;align-items:center;flex:1;min-width:0;">'
    + '<div style="flex:1;position:relative;">'
    + '<input class="form-input" id="cf-complainant" value="'+esc(complainant)+'" placeholder="نام ولد ولدیت قوم … سکنہ موضع / محلہ، تحصیل، ضلع" dir="auto" data-dio-name="1" oninput="var _cc=document.getElementById(\'cf-comp-count\');if(_cc)_cc.textContent=this.value.length+\' حروف\';">'
    + '</div>'
    + ''
    + '</div>'
    + '</div>'

    // شناختی کارڈ + موبائل نمبر + پیشہ + ملزمان (چاروں ایک ہی سطر — اکتوبر 2026)
    + '<div class="cf-row4m">'
    + '<div class="cf-field"><label class="cf-label">شناختی کارڈ</label>'
    + '<input class="form-input" id="cf-complainant-cnic" value="'+esc(cmpCnic)+'" placeholder="00000-0000000-0" inputmode="numeric" maxlength="15" dir="ltr" oninput="autoFormatCNIC(this)" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">موبائل نمبر</label>'
    + '<input class="form-input" id="cf-complainant-cell" value="'+esc(cmpCell)+'" placeholder="0000-0000000" inputmode="numeric" maxlength="12" dir="ltr" oninput="autoFormatCell(this)" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">پیشہ</label>'
    + '<input class="form-input" id="cf-complainant-profession" value="'+esc(cmpProf)+'" placeholder="پیشہ" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">ملزمان</label>'
    + '<select class="form-input" id="cf-mulzman-type">'
    + '<option value="maloom" '+(c.mulzman_type==='maloom'?'selected':'')+'>معلوم</option>'
    + '<option value="namaloom" '+(c.mulzman_type==='namaloom'||!c.mulzman_type?'selected':'')+'>نامعلوم</option>'
    + '</select></div>'
    + '</div>'

    + '</div>'

    // FIR کی تفصیل (ہیڈنگ ہٹا دی گئی)
    + '<div class="cf-box">'
    + '<div class="cf-row3s">'
    + '<div class="cf-field"><label class="cf-label">مرتبہ مرسلہ</label>'
    + '<div style="display:flex;gap:4px;direction:rtl;flex:1;min-width:0;"><input class="form-input" id="cf-complaint-sender" value="'+esc(compSender)+'" placeholder="مرتبہ مرسلہ" dir="auto" style="flex:1;"></div></div>'
    + '<div class="cf-field"><label class="cf-label">محرر</label>'
    + '<div style="display:flex;gap:4px;direction:rtl;flex:1;min-width:0;"><input class="form-input" id="cf-fir-writer" value="'+esc(firWriter)+'" placeholder="محرر کا نام" dir="auto" style="flex:1;"></div></div>'
    + '<div class="cf-field"><label class="cf-label">صورتحال *</label>'
    + '<select class="form-input" id="cf-status">'+statusOpts+'</select></div>'
    + '</div>'
    + '</div>'
    // پوزیشن کا خانہ ہٹا دیا گیا (اکتوبر 2026) — پرانی قدر چھپے خانے میں محفوظ رہتی ہے
    + '<input type="hidden" id="cf-position" value="'+esc(position)+'">'
    // v544: جرم، SHO، SDPO اور نوٹ — چاروں فارم سے ختم (افسر کا فیصلہ)۔ ترمیم
    //   محفوظ کرنے پر یہ بھیجے ہی نہیں جاتے، اس لیے ڈیٹابیس کی پرانی قدریں جوں کی
    //   توں رہتی ہیں (کچھ نہیں مٹتا)؛ نئے مقدمے پر پہلے کی طرح خالی قدر جاتی ہے۔

    // ── کراس ورژن ──────────────────────────────────────────────
    + '<div class="dio-full" style="margin-top:14px;padding:10px 12px;background:rgba(239,68,68,0.06);'
    + 'border:1px solid rgba(239,68,68,0.25);border-radius:var(--radius-sm);">'
    + '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:14pt;font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;">'
    + '<input type="checkbox" id="cf-cross-version" ' + (isCross ? 'checked' : '')
    + ' onchange="_cfToggleCross(this)"'
    + ' style="width:18px;height:18px;cursor:pointer;">'
    + '&#x2694;&#xFE0F; &#x06A9;&#x0631;&#x0627;&#x0633; &#x0648;&#x0631;&#x0698;&#x0646; &#x0645;&#x0648;&#x062C;&#x0648;&#x062F; &#x06C1;&#x06D2;'
    + '</label>'
    + '<div id="cross-version-fields" style="display:' + (isCross ? 'block' : 'none') + ';margin-top:12px;">'
    + buildCrossFields(c)
    + '</div>'
    + '</div>'

    + '</div>';

  return html;
}


function buildCrossFields(c) {
  c = c || {};
  var cfn = c.cross_fir_number || c.fir_number || '';
  var cfd = c.cross_fir_date || c.fir_date || '';
  // Stay auto-synced with the top مقدمہ نمبر/تاریخ unless a genuinely different value was saved before
  var cfnAuto = !c.cross_fir_number || c.cross_fir_number === c.fir_number;
  var cfdAuto = !c.cross_fir_date || c.cross_fir_date === c.fir_date;
  var cc = c.cross_complainant || '';
  var ccc = c.cross_complainant_cnic || '';
  var ccl = c.cross_complainant_cell || '';
  var ccp = c.cross_complainant_profession || '';
  var cs = c.cross_section_of_law || '';
  var cfw = c.cross_fir_writer || '';
  var crn = c.cross_rapat_number || '';
  var crd = c.cross_rapat_date || '';
  var crossStatus = c.cross_status || 'under';
  var crossPosition = c.cross_position || 'pending';
  var crossStatusOpts = ''
    + '<option value="under"'+(crossStatus==='under'?' selected':'')+'>زیر تفتیش</option>'
    + '<option value="complete"'+(crossStatus==='complete'?' selected':'')+'>مکمل چالان</option>'
    + '<option value="incomplete"'+(crossStatus==='incomplete'?' selected':'')+'>نامکمل چالان</option>'
    + '<option value="challan512"'+(crossStatus==='challan512'?' selected':'')+'>چالان 512ض ف</option>'
    + '<option value="untrace"'+(crossStatus==='untrace'?' selected':'')+'>عدم پتہ</option>'
    + '<option value="cancel"'+(crossStatus==='cancel'?' selected':'')+'>اخراج</option>';
  return ''
    // رپٹ نمبر (آدھی چوڑائی) + رپٹ تاریخ + کراس ورژن مقدمہ نمبر + کراس ورژن مقدمہ کی تاریخ (چاروں ایک سطر)
    + '<div class="cf-row4-rapat">'
    + '<div class="cf-field"><label class="cf-label">&#x0631;&#x067E;&#x0679; &#x0646;&#x0645;&#x0628;&#x0631;</label>'
    + '<input class="form-input" id="cf-cross-rapat" value="'+esc(crn)+'" placeholder="e.g. 12" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">&#x0631;&#x067E;&#x0679; &#x062A;&#x0627;&#x0631;&#x06CC;&#x062E;</label>'
    + '<input class="form-input" id="cf-cross-rapat-date" value="'+esc(crd)+'" placeholder="DD/MM/YYYY" inputmode="numeric" maxlength="10" oninput="autoFormatDate(this)"></div>'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن مقدمہ نمبر</label>'
    + '<input class="form-input" id="cf-cross-fir" data-auto="'+(cfnAuto?'1':'0')+'" value="'+esc(cfn)+'" placeholder="e.g. 246/2025" dir="auto" oninput="this.dataset.auto=\'0\'"></div>'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن مقدمہ کی تاریخ</label>'
    + '<input class="form-input" id="cf-cross-fir-date" data-auto="'+(cfdAuto?'1':'0')+'" value="'+esc(cfd)+'" placeholder="DD/MM/YYYY" inputmode="numeric" maxlength="10" oninput="autoFormatDate(this);this.dataset.auto=\'0\'"></div>'
    + '</div>'

    // کراس ورژن مدعی کا نام (پوری چوڑائی)
    + '<div class="cf-field"><label class="cf-label">کراس ورژن مدعی — نام و پتہ</label>'
    + '<input class="form-input" id="cf-cross-complainant" value="'+esc(cc)+'" placeholder="نام ولد ولدیت قوم … سکنہ موضع / محلہ، تحصیل، ضلع" dir="auto" data-dio-name="1"></div>'

    // شناختی کارڈ + موبائل نمبر + پیشہ (تینوں ایک سطر)
    + '<div class="cf-row3">'
    + '<div class="cf-field"><label class="cf-label">&#x0634;&#x0646;&#x0627;&#x062E;&#x062A;&#x06CC; &#x06A9;&#x0627;&#x0631;&#x0688;</label>'
    + '<input class="form-input" id="cf-cross-complainant-cnic" value="'+esc(ccc)+'" placeholder="00000-0000000-0" inputmode="numeric" maxlength="15" dir="ltr" oninput="autoFormatCNIC(this)"></div>'
    + '<div class="cf-field"><label class="cf-label">&#x0645;&#x0648;&#x0628;&#x0627;&#x0626;&#x0644; &#x0646;&#x0645;&#x0628;&#x0631;</label>'
    + '<input class="form-input" id="cf-cross-complainant-cell" value="'+esc(ccl)+'" placeholder="0000-0000000" inputmode="numeric" maxlength="12" dir="ltr" oninput="autoFormatCell(this)"></div>'
    + '<div class="cf-field"><label class="cf-label">&#x067E;&#x06CC;&#x0634;&#x06C1;</label>'
    + '<input class="form-input" id="cf-cross-complainant-profession" value="'+esc(ccp)+'" placeholder="&#x067E;&#x06CC;&#x0634;&#x06C1;" dir="auto"></div>'
    + '</div>'

    // کراس ورژن دفعات + محرر + صورتحال (ایک سطر — اکتوبر 2026)
    + '<div class="cf-row3s">'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن دفعات</label>'
    + '<input class="form-input" id="cf-cross-section" value="'+esc(cs)+'" placeholder="e.g. 302 PPC + 34 PPC" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن محرر</label>'
    + '<input class="form-input" id="cf-cross-fir-writer" value="'+esc(cfw)+'" placeholder="محرر کا نام" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن صورتحال</label>'
    + '<select class="form-input" id="cf-cross-status">'+crossStatusOpts+'</select></div>'
    + '</div>'
    // کراس ورژن پوزیشن کا خانہ ہٹا دیا گیا — پرانی قدر چھپے خانے میں محفوظ
    + '<input type="hidden" id="cf-cross-position" value="'+esc(crossPosition)+'">'

    + '<div style="padding:8px 10px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);font-size:11px;color:var(--red);margin-top:4px;">'
    + '&#x26A0;&#xFE0F; Cross Version cases are linked to the original FIR. Both cases will appear in the case workspace under the same folder.'
    + '</div>';
}


function sectionTag(sectionStr) {
  return `<div style="display:inline-flex;align-items:center;gap:6px;background:var(--nav-active);border:1px solid var(--accent);border-radius:20px;padding:4px 10px;font-size:11px;color:var(--accent);">
    <b>${esc(sectionStr)}</b>
    <span onclick="removeSection('${_dioJsHtml(sectionStr)}')" style="cursor:pointer;color:var(--text-muted);font-size:14px;line-height:1;" title="Remove">×</span>
  </div>`;
}


async function openEditCaseModal(id){const c=await getCase(id);if(!c)return;_cfOpenCard(true,caseFormHTML(c),"saveEditCase('"+id+"')",'تبدیلیاں محفوظ کریں');}
// «نیا اندراج — مقدمہ» / «ترمیم — مقدمہ» — مشترکہ DIO کارڈ (اکتوبر 2026)
function _cfOpenCard(isEdit, html, saveCall, saveLabel){
  if (window.DIOCard) {
    DIOCard.open('مقدمہ', isEdit, html, saveCall, saveLabel);
  } else {
    openModal(isEdit ? 'ترمیم — مقدمہ' : 'نیا اندراج — مقدمہ', html,
      '<button class="btn btn-primary" onclick="'+saveCall+'">'+saveLabel+'</button><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>');
  }
  setTimeout(function(){
    // v552: سابقہ اندراجات سے IMEI → ماڈل (تازہ)
    try { _cfImeiHist = null; _cfLoadImeiHistory(); } catch (_) { /* ikhtiyari */ }
    if (typeof _cfRenderMobilePhones === 'function') _cfRenderMobilePhones();
    // Mobile: مدعی کا نام و پتہ الگ سطروں میں (محفوظ وہی ایک خانہ)
    if (window.DIOCard && DIOCard.splitNameInput) { DIOCard.splitNameInput('cf-complainant', 'مدعی'); DIOCard.splitNameInput('cf-cross-complainant', 'کراس ورژن مدعی'); }
  },50);
}

// ═══════════════════════════════════════════════════════════════
//  v552 — دوہرا مقدمہ نہیں: پہچان مقدمہ نمبر (+ سال + تھانہ) سے، صرف مدعی کے نام سے نہیں
//  «651/26» = «651/2026» = «651 / 26» = «۶۵۱/۲۶»۔ سال نہ لکھا ہو تو تاریخ اندراج کا سال۔
// ═══════════════════════════════════════════════════════════════
function _cfAscii(t) {
  return String(t == null ? '' : t)
    .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x06F0); })
    .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x0660); });
}
function _cfFirKey(fir, firDate) {
  var t = _cfAscii(fir).trim();
  if (!t) return '';
  var m = t.match(/(\d+)\s*[\/\-\\]\s*(\d{2,4})/);
  if (m) { var y = m[2]; if (y.length === 2) y = '20' + y; return parseInt(m[1], 10) + '/' + y; }
  var n = t.match(/\d+/);
  if (!n) return t.toLowerCase();
  var yy = (_cfAscii(firDate).match(/(\d{4})/) || [])[1] || '';
  return parseInt(n[0], 10) + '/' + yy;
}
window._cfFirKey = _cfFirKey;
function _cfNameCore(n) { return String(n || '').split(/\s+(?:ولد|بنت|زوجہ|قوم|سکنہ)\s+/)[0].replace(/\s+/g, ''); }
function _cfSameStation(c) {
  var st = (typeof currentOfficer !== 'undefined' && currentOfficer && currentOfficer.station) || '';
  return !c.case_station || !st || String(c.case_station).trim() === String(st).trim();
}
async function _cfFindDuplicate(fir, firDate, excludeId) {
  var key = _cfFirKey(fir, firDate);
  if (!key) return null;
  var list = [];
  try { list = (typeof getCases === 'function') ? (await getCases()) : []; } catch (_) { list = []; }
  // انٹرنیٹ ہو تو سرور سے بھی تصدیق (cache پرانا ہو سکتا ہے)
  try {
    if (navigator.onLine && typeof supabaseClient !== 'undefined' && typeof getOfficerId === 'function') {
      var oid = await getOfficerId();
      var num = (_cfAscii(fir).match(/\d+/) || [])[0];
      if (oid && num) {
        var r = await supabaseClient.from('cases').select('id,fir_number,fir_date,complainant,section_of_law,occurrence_date,case_station,status')
          .eq('officer_id', oid).ilike('fir_number', '%' + num + '%');
        if (r && r.data) r.data.forEach(function (c) { if (!list.some(function (x) { return String(x.id) === String(c.id); })) list.push(c); });
      }
    }
  } catch (_) { /* sirf cache se */ }
  return (list || []).find(function (c) {
    return c && String(c.id) !== String(excludeId || '') &&
      _cfFirKey(c.fir_number, c.fir_date) === key && _cfSameStation(c);
  }) || null;
}
window._cfFindDuplicate = _cfFindDuplicate;
// نمبر الگ مگر مدعی + تاریخ وقوعہ + دفعہ ایک — ممکنہ دوہرا (صرف خبردار)
async function _cfFindSimilar(complainant, occDate, section, excludeId) {
  var core = _cfNameCore(complainant), od = _cfAscii(occDate).replace(/\s/g, '');
  if (!core || !od) return null;
  var nums = (_cfAscii(section).match(/(?<!\d)\d{3}(?!\d)/g) || []);
  var list = [];
  try { list = (typeof getCases === 'function') ? (await getCases()) : []; } catch (_) { list = []; }
  return list.find(function (c) {
    if (!c || String(c.id) === String(excludeId || '')) return false;
    if (_cfNameCore(c.complainant) !== core) return false;
    if (_cfAscii(c.occurrence_date).replace(/\s/g, '') !== od) return false;
    var cn = (_cfAscii(c.section_of_law).match(/(?<!\d)\d{3}(?!\d)/g) || []);
    return !nums.length || nums.some(function (n) { return cn.indexOf(n) !== -1; });
  }) || null;
}
function _cfCaseLine(c) {
  var parts = ['مقدمہ نمبر ' + (c.fir_number || '—')];
  if (c.fir_date) parts.push('مورخہ ' + (typeof formatDate === 'function' ? formatDate(c.fir_date) : c.fir_date));
  if (c.section_of_law) parts.push('بجرم ' + c.section_of_law);
  if (c.case_station) parts.push('تھانہ ' + c.case_station);
  if (c.complainant) parts.push('مدعی: ' + String(c.complainant).split(/\s+(?:ولد|بنت|زوجہ)\s+/)[0]);
  return parts.join(' · ');
}
// «مقدمہ نمبر» کا خانہ چھوڑتے ہی خبردار (محفوظ کرتے وقت بھی روک)
async function _cfCheckFirLive(excludeId) {
  var el = document.getElementById('cf-fir'); var hint = document.getElementById('cf-fir-dup');
  if (!el || !hint) return null;
  var d = await _cfFindDuplicate(el.value, (document.getElementById('cf-date') || {}).value, excludeId);
  if (d) {
    hint.innerHTML = '⚠ یہ مقدمہ پہلے سے درج ہے: ' + esc(_cfCaseLine(d));
    hint.style.display = 'block';
  } else { hint.textContent = ''; hint.style.display = 'none'; }
  return d;
}
window._cfCheckFirLive = _cfCheckFirLive;

async function saveNewCase(){
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم پر نیا مقدمہ بند
  if (window.DIO && DIO.sub && !DIO.sub.guard('نیا مقدمہ')) return;
  // Check case limit
  if (typeof checkCaseLimit==='function') {
    const allowed = await checkCaseLimit();
    if (!allowed) return;
  }
  var fir=document.getElementById('cf-fir')?.value.trim()||'';
  var section=document.getElementById('cf-section')?.value.trim()||'';
  // Fallback: if user typed a section but didn't pick from dropdown, use the typed text
  if(!section){
    var typedSec=document.getElementById('cf-section-search')?.value.trim()||'';
    if(typedSec){ section=typedSec; var _sh=document.getElementById('cf-section'); if(_sh)_sh.value=typedSec; }
  }
  var complainant=document.getElementById('cf-complainant')?.value.trim()||'';
  if(!fir){showToast('مقدمہ نمبر درج کریں','error');document.getElementById('cf-fir')?.focus();return;}
  if(!section){showToast('دفعہ قانون درج کریں','error');document.getElementById('cf-section-search')?.focus();return;}
  if(!complainant){showToast('مدعی کا نام درج کریں','error');document.getElementById('cf-complainant')?.focus();return;}
  // تاریخ کی جانچ — دن ۱–۳۱، مہینہ ۱–۱۲، سال ۴ ہندسے (نامکمل/غلط تاریخ محفوظ نہ ہو)
  if(typeof _dioValidDate==='function'){
    if(!_dioValidDate(document.getElementById('cf-date')?.value)){showToast('تاریخ اندراج درست درج کریں — دن ۱–۳۱، مہینہ ۱–۱۲، سال مکمل ۴ ہندسے','error');document.getElementById('cf-date')?.focus();return;}
    if(!_dioValidDate(document.getElementById('cf-occurrence-date')?.value)){showToast('تاریخ وقوعہ درست درج کریں — دن ۱–۳۱، مہینہ ۱–۱۲، سال مکمل ۴ ہندسے','error');document.getElementById('cf-occurrence-date')?.focus();return;}
  }
  // v552: دوہرا مقدمہ نمبر — درج نہیں ہوگا
  try {
    var _dup = await _cfFindDuplicate(fir, document.getElementById('cf-date')?.value, null);
    if (_dup) {
      try { await _cfCheckFirLive(null); } catch (_) { /* ikhtiyari */ }
      if (confirm('یہ مقدمہ پہلے سے درج ہے، دوبارہ درج نہیں ہو سکتا:\n\n' + _cfCaseLine(_dup) + '\n\nکیا پہلے سے درج مقدمہ کھولیں؟ («Cancel» = اسی فارم پر رہیں اور نمبر درست کریں)')) {
        closeModal();
        if (typeof openCaseWorkspace === 'function') openCaseWorkspace(_dup.id);
      } else { document.getElementById('cf-fir')?.focus(); }
      return;
    }
    var _sim = await _cfFindSimilar(complainant, document.getElementById('cf-occurrence-date')?.value, section, null);
    if (_sim && !confirm('ممکنہ دوہرا اندراج — اسی مدعی، اسی تاریخ وقوعہ اور اسی دفعہ کا ایک مقدمہ پہلے سے درج ہے:\n\n' + _cfCaseLine(_sim) + '\n\nکیا یہ واقعی الگ مقدمہ ہے اور درج کرنا ہے؟')) return;
  } catch (_) { /* jaanch na ho saki — server/cache na ho; andraj na rukay */ }
  try{
    var _cfMobile = _cfMobileFieldsPayload();
    const _newCaseRow = await addCase({
      fir_number:fir,
      fir_date:document.getElementById('cf-date').value.trim(),
      occurrence_date:document.getElementById('cf-occurrence-date')?.value.trim()||'',
      occurrence_place:document.getElementById('cf-occurrence-place')?.value.trim()||'',   // بحد / جائے وقوعہ
      complainant:complainant,
      complainant_cnic:document.getElementById('cf-complainant-cnic')?.value.trim()||'',
      complainant_cell:document.getElementById('cf-complainant-cell')?.value.trim()||'',
      complainant_profession:document.getElementById('cf-complainant-profession')?.value.trim()||'',
      fir_writer:document.getElementById('cf-fir-writer')?.value.trim()||'',
      complaint_sender:document.getElementById('cf-complaint-sender')?.value.trim()||'',
      section_of_law:section,
      theft_item:_cfMobile.theft_item,
      theft_imei:_cfMobile.theft_imei,
      theft_brand:_cfMobile.theft_brand,
      theft_cell:_cfMobile.theft_cell,
      // v544: یہ چار خانے فارم میں نہیں — نئے مقدمے پر وہی خالی قدر جو ہمیشہ سے جاتی رہی
      offence_type:'', sho:'', sdpo:'', notes:'',
      status:document.getElementById('cf-status').value,
      mulzman_type:document.getElementById('cf-mulzman-type')?.value||'namaloom',
      position:document.getElementById('cf-position').value,
      documents_checklist:selectedDocuments?.length>0?selectedDocuments:[],
      is_cross_version:document.getElementById('cf-cross-version')?.checked||false,
      cross_fir_number:document.getElementById('cf-cross-fir')?.value.trim()||null,
      cross_fir_date:document.getElementById('cf-cross-fir-date')?.value.trim()||null,
      cross_complainant:document.getElementById('cf-cross-complainant')?.value.trim()||null,
      cross_complainant_cnic:document.getElementById('cf-cross-complainant-cnic')?.value.trim()||null,
      cross_complainant_cell:document.getElementById('cf-cross-complainant-cell')?.value.trim()||null,
      cross_complainant_profession:document.getElementById('cf-cross-complainant-profession')?.value.trim()||null,
      cross_section_of_law:document.getElementById('cf-cross-section')?.value.trim()||null,
      cross_rapat_number:document.getElementById('cf-cross-rapat')?.value.trim()||null,
      cross_rapat_date:document.getElementById('cf-cross-rapat-date')?.value.trim()||null,
      cross_fir_writer:document.getElementById('cf-cross-fir-writer')?.value.trim()||null,
      cross_status:document.getElementById('cf-cross-status')?.value||null,
      cross_position:document.getElementById('cf-cross-position')?.value||null,
      case_station:  currentOfficer?.station  || null,
      case_district: currentOfficer?.district || null,
    });
    // AUDIT — case.created (Phase 4B). CNIC/cell auto-redact hoti hain.
    try {
      if (window.DIO && DIO.audit && _newCaseRow) {
        DIO.audit.log('case.created', 'case', _newCaseRow.id, {
          case_id: _newCaseRow.id,
          after: {
            fir_number: fir,
            section_of_law: section,
            status: _newCaseRow.status,
            complainant: complainant,
            is_cross_version: _newCaseRow.is_cross_version || false
          }
        });
      }
    } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
    // Auto reminders
    const firDate = document.getElementById('cf-date').value.trim();
    const mulzmanType = document.getElementById('cf-mulzman-type')?.value||'namaloom';
    await _createAutoReminders(fir, firDate, mulzmanType, complainant);
    closeModal();showToast('مقدمہ درج ہو گیا: FIR '+fir,'success');await updateBadges();renderCases(document.getElementById('page-content'));
  }catch(err){showToast('Error: '+err.message,'error');}
}

// ── DOCUMENTS CHECKLIST ────────────────────────────────────────
async function saveEditCase(id){
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم پر ترمیم بند
  if (window.DIO && DIO.sub && !DIO.sub.guard('ترمیم محفوظ')) return;
  // تاریخ کی جانچ — دن ۱–۳۱، مہینہ ۱–۱۲، سال ۴ ہندسے
  if(typeof _dioValidDate==='function'){
    if(!_dioValidDate(document.getElementById('cf-date')?.value)){showToast('تاریخ اندراج درست درج کریں — دن ۱–۳۱، مہینہ ۱–۱۲، سال مکمل ۴ ہندسے','error');document.getElementById('cf-date')?.focus();return;}
    if(!_dioValidDate(document.getElementById('cf-occurrence-date')?.value)){showToast('تاریخ وقوعہ درست درج کریں — دن ۱–۳۱، مہینہ ۱–۱۲، سال مکمل ۴ ہندسے','error');document.getElementById('cf-occurrence-date')?.focus();return;}
  }
  // Resolve section: use selected, else typed search value
  var _editSection=document.getElementById('cf-section').value.trim();
  if(!_editSection){
    var _typed=document.getElementById('cf-section-search')?.value.trim()||'';
    if(_typed) _editSection=_typed;
  }
  // v552: ترمیم میں مقدمہ نمبر کسی دوسرے درج شدہ مقدمے جیسا نہ ہو
  try {
    var _dupE = await _cfFindDuplicate(document.getElementById('cf-fir')?.value, document.getElementById('cf-date')?.value, id);
    if (_dupE) {
      showToast('یہ مقدمہ نمبر کسی دوسرے درج شدہ مقدمے کا ہے: ' + _cfCaseLine(_dupE), 'error', 9000);
      try { await _cfCheckFirLive(id); } catch (_) { /* ikhtiyari */ }
      document.getElementById('cf-fir')?.focus();
      return;
    }
  } catch (_) { /* jaanch na ho saki */ }
  // AUDIT — "before" snapshot (Phase 4B). Silent fail agar fetch na ho.
  var _beforeCase = null;
  try {
    if (window.DIO && DIO.audit && typeof getCase === 'function') {
      _beforeCase = await getCase(id);
    }
  } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
  try{
    var _cfMobile = _cfMobileFieldsPayload();
    await updateCase(id,{
      fir_number:document.getElementById('cf-fir').value.trim(),
      fir_date:document.getElementById('cf-date').value.trim(),
      occurrence_date:document.getElementById('cf-occurrence-date')?.value.trim()||'',
      occurrence_place:document.getElementById('cf-occurrence-place')?.value.trim()||'',   // بحد / جائے وقوعہ
      complainant:document.getElementById('cf-complainant').value.trim(),
      complainant_cnic:document.getElementById('cf-complainant-cnic')?.value.trim()||'',
      complainant_cell:document.getElementById('cf-complainant-cell')?.value.trim()||'',
      complainant_profession:document.getElementById('cf-complainant-profession')?.value.trim()||'',
      fir_writer:document.getElementById('cf-fir-writer')?.value.trim()||'',
      complaint_sender:document.getElementById('cf-complaint-sender')?.value.trim()||'',
      section_of_law:_editSection,
      theft_item:_cfMobile.theft_item,
      theft_imei:_cfMobile.theft_imei,
      theft_brand:_cfMobile.theft_brand,
      theft_cell:_cfMobile.theft_cell,
      status:document.getElementById('cf-status').value,
      mulzman_type:document.getElementById('cf-mulzman-type')?.value||'namaloom',
      position:document.getElementById('cf-position').value,
      documents_checklist:selectedDocuments.length>0?selectedDocuments:[],
      is_cross_version:document.getElementById('cf-cross-version')?.checked||false,
      cross_fir_number:document.getElementById('cf-cross-fir')?.value.trim()||null,
      cross_fir_date:document.getElementById('cf-cross-fir-date')?.value.trim()||null,
      cross_complainant:document.getElementById('cf-cross-complainant')?.value.trim()||null,
      cross_complainant_cnic:document.getElementById('cf-cross-complainant-cnic')?.value.trim()||null,
      cross_complainant_cell:document.getElementById('cf-cross-complainant-cell')?.value.trim()||null,
      cross_complainant_profession:document.getElementById('cf-cross-complainant-profession')?.value.trim()||null,
      cross_section_of_law:document.getElementById('cf-cross-section')?.value.trim()||null,
      cross_rapat_number:document.getElementById('cf-cross-rapat')?.value.trim()||null,
      cross_rapat_date:document.getElementById('cf-cross-rapat-date')?.value.trim()||null,
      cross_fir_writer:document.getElementById('cf-cross-fir-writer')?.value.trim()||null,
      cross_status:document.getElementById('cf-cross-status')?.value||null,
      cross_position:document.getElementById('cf-cross-position')?.value||null,
    });
    // AUDIT — case.updated (Phase 4B). Key fields ka before/after diff.
    try {
      if (window.DIO && DIO.audit) {
        const _pickKeys = ['fir_number','fir_date','section_of_law','status','position','complainant','mulzman_type'];
        const _pick = (o) => o ? _pickKeys.reduce((a,k)=>{ if(o[k]!==undefined) a[k]=o[k]; return a; }, {}) : null;
        DIO.audit.log('case.updated', 'case', id, {
          case_id: id,
          before: _pick(_beforeCase),
          after: {
            fir_number: document.getElementById('cf-fir').value.trim(),
            fir_date: document.getElementById('cf-date').value.trim(),
            section_of_law: _editSection,
            status: document.getElementById('cf-status').value,
            position: document.getElementById('cf-position').value,
            complainant: document.getElementById('cf-complainant').value.trim(),
            mulzman_type: document.getElementById('cf-mulzman-type')?.value || 'namaloom'
          }
        });
      }
    } catch (_) { /* audit/custody ka masla asal kaam na roke */ }
    closeModal();
    showToast('Case updated!','success');
    // Wait briefly so DB write propagates through cases_decrypted view before re-fetching
    await new Promise(r=>setTimeout(r,300));
    await updateBadges();
    await renderCases(document.getElementById('page-content'));
  }catch(err){showToast('Error: '+err.message,'error');}
}
// viewCase now opens workspace
