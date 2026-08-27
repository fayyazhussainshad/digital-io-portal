/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — نیا/ترمیمی مقدمہ کا فارم (کراس ورژن سمیت)
   (پہلے یہ cases.js میں تھا)
   ═══════════════════════════════════════════════════════════ */

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
    + '.cf-row-sim{display:grid;grid-template-columns:repeat(4,1fr);gap:2px 8px;width:100%;}'
    + '.cf-row2 .cf-field,.cf-row3 .cf-field,.cf-row4 .cf-field,.cf-row4-rapat .cf-field,.cf-row-7030 .cf-field,.cf-row-sim .cf-field{margin-bottom:9px;}'
    + '.cf-box{padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:12px;}'
    + '.cf-box-title{font-size:14pt;font-weight:800;color:var(--accent);margin-bottom:9px;text-align:right;'
    +   'font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;}'
    + '.cf-hint{font-size:11px;color:var(--text-muted);margin:-4px 0 9px;padding-right:2px;}'
    + '@media(max-width:640px){.cf-row3{grid-template-columns:1fr 1fr;}.cf-row4,.cf-row4-rapat{grid-template-columns:1fr 1fr;}.cf-row-sim{grid-template-columns:repeat(2,1fr);}}'
    + '@media(max-width:480px){'
    +   '.cf-row2,.cf-row3,.cf-row4,.cf-row4-rapat,.cf-row-7030,.cf-row-sim{grid-template-columns:1fr;}'
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
    + '<div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:4px;">📱 موبائل نمبر '+i+'</div>'
    + '<div class="cf-row3">'
    +   '<div class="cf-field"><label class="cf-label">IMEI 1</label>'
    +     '<input class="form-input" dir="ltr" inputmode="numeric" maxlength="15" id="cf-mobile-imei-'+i+'-1" value="'+esc(p.imei1)+'" placeholder="000000000000000" oninput="_imeiLookupIdx(this,'+i+')"></div>'
    +   '<div class="cf-field"><label class="cf-label">IMEI 2</label>'
    +     '<input class="form-input" dir="ltr" inputmode="numeric" maxlength="15" id="cf-mobile-imei-'+i+'-2" value="'+esc(p.imei2)+'" placeholder="000000000000000" oninput="_imeiLookupIdx(this,'+i+')"></div>'
    +   '<div class="cf-field"><label class="cf-label">ماڈل / کمپنی</label>'
    +     '<input class="form-input" id="cf-mobile-brand-'+i+'" value="'+esc(p.brand)+'" placeholder="IMEI سے خودکار، یا خود لکھیں"></div>'
    + '</div>'
    + '</div>';
}

// ── Mobile-theft: one pooled SIM field (labeled with which phone it belongs to) ──
function _cfSimFieldHTML(phoneIdx, simIdx, value) {
  return '<div class="cf-field"><label class="cf-label">موبائل '+phoneIdx+' - سم '+simIdx+'</label>'
    + '<input class="form-input" dir="ltr" id="cf-mobile-sim-'+phoneIdx+'-'+simIdx+'" value="'+esc(value)+'" placeholder="0000-0000000" oninput="autoFormatCell(this)"></div>';
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

// ── Mobile-theft: indexed IMEI → brand auto-detect (editable, doesn't overwrite manual entry) ──
function _imeiLookupIdx(input, idx) {
  var v = (input.value || '').replace(/\D/g, '').slice(0, 15);
  input.value = v;
  var brandField = document.getElementById('cf-mobile-brand-'+idx);
  if (!brandField || v.length < 8) return;
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
  if (brand && (!brandField.value || brandField.dataset.auto === '1')) {
    brandField.value = brand;
    brandField.dataset.auto = '1';
  }
  brandField.oninput = function() { brandField.dataset.auto = '0'; };
}

// ── Mobile-theft: join all phone blocks into the theft_* DB columns (comma-separated) ──
function _cfMobileFieldsPayload() {
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
  var date = c.fir_date || '';
  var occ = c.occurrence_date || '';
  var accused = c.accused_name || '';
  var cnic = c.accused_cnic || '';
  var cell = c.accused_cell || '';
  var complainant = c.complainant || '';
  var cmpCnic = c.complainant_cnic || '';
  var cmpCell = c.complainant_cell || '';
  var cmpProf = c.complainant_profession || '';
  var section = c.section_of_law || '';
  var offence = c.offence_type || '';
  var sho = c.sho || '';
  var sdpo = c.sdpo || '';
  var firWriter = c.fir_writer || '';
  var compSender = c.complaint_sender || '';
  var notes = c.notes || '';
  var status = c.status || 'under';
  var position = c.position || 'pending';
  var isCross = c.is_cross_version || false;

  var statusOpts = '<option value="under"'+(status==='under'?' selected':'')+'>&#x0632;&#x06CC;&#x0631; &#x062A;&#x0641;&#x062A;&#x06CC;&#x0634; (Under Investigation)</option>'
    + '<option value="complete"'+(status==='complete'?' selected':'')+'>&#x0645;&#x06A9;&#x0645;&#x0644; &#x0686;&#x0627;&#x0644;&#x0627;&#x0646; (Complete)</option>'
    + '<option value="incomplete"'+(status==='incomplete'?' selected':'')+'>&#x0646;&#x0627;&#x0645;&#x06A9;&#x0645;&#x0644; &#x0686;&#x0627;&#x0644;&#x0627;&#x0646; (Incomplete)</option>'
    + '<option value="challan512"'+(status==='challan512'?' selected':'')+'>\u0686\u0627\u0644\u0627\u0646 512\u0636 \u0641 (512 CrPC)</option>'
    + '<option value="untrace"'+(status==='untrace'?' selected':'')+'>&#x0639;&#x062F;&#x0645; &#x067E;&#x062A;&#x06C1; (Untraced)</option>'
    + '<option value="cancel"'+(status==='cancel'?' selected':'')+'>&#x0627;&#x062E;&#x0631;&#x0627;&#x062C; (Cancelled)</option>';

  var posOpts = '<option value="pending"'+(position==='pending'?' selected':'')+'>' + '&#x23F3; Pending</option>'
    + '<option value="court"'+(position==='court'?' selected':'')+'>&#x2696;&#xFE0F; In Court</option>';

  var sectionTags = selectedSections.map(function(s) { return sectionTag(s); }).join('');
  var docList = renderDocChecklist(ALL_MISAL_DOCS, selectedDocuments);

  var crossFields = '';
  if (isCross) {
    crossFields = buildCrossFields(c);
  }

  var html = ''
    + '<div class="cf-form" style="max-height:70vh;overflow-y:auto;padding-right:4px;">'

    // Row 1: مقدمہ نمبر + تاریخ اندراج + تاریخ وقوعہ + ملزمان (چاروں ایک ہی سطر)
    + '<div class="cf-row4">'
    + '<div class="cf-field"><label class="cf-label">مقدمہ نمبر *</label>'
    + '<input class="form-input" id="cf-fir" value="'+fir+'" placeholder="e.g. 245/2025" dir="ltr" style="text-align:left;" oninput="_cfLiveSyncCross()"></div>'
    + '<div class="cf-field"><label class="cf-label">تاریخ اندراج *</label>'
    + '<input class="form-input" id="cf-date" value="'+date+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this);_cfLiveSyncCross()" dir="ltr" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">تاریخ وقوعہ</label>'
    + '<input class="form-input" id="cf-occurrence-date" value="'+occ+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)" dir="ltr" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">ملزمان</label>'
    + '<select class="form-input" id="cf-mulzman-type">'
    + '<option value="maloom" '+(c.mulzman_type==='maloom'?'selected':'')+'>✅ معلوم</option>'
    + '<option value="namaloom" '+(c.mulzman_type==='namaloom'||!c.mulzman_type?'selected':'')+'>⚠️ نامعلوم</option>'
    + '</select></div>'
    + '</div>'

    // Row 2: دفعات قانون (پوری چوڑائی — سرچ باکس)
    + '<div class="cf-field" style="align-items:flex-start;">'
    + '<label class="cf-label" style="margin-top:8px;">دفعات قانون *</label>'
    + '<div style="flex:1;min-width:0;">'
    + '<div style="position:relative;">'
    + '<input class="form-input" id="cf-section-search" placeholder="🔍 دفعہ نمبر یا کلیدی الفاظ..." dir="ltr" style="text-align:left;" oninput="searchPenalCodes(this.value)" autocomplete="off">'
    + '<div id="section-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:var(--bg-card);border:1px solid var(--accent);border-radius:0 0 var(--radius-sm) var(--radius-sm);max-height:180px;overflow-y:auto;z-index:200;box-shadow:var(--shadow);"></div>'
    + '</div>'
    + '<div id="selected-sections" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">'+sectionTags+'</div>'
    + '<input type="hidden" id="cf-section" value="'+section+'">'
    + '</div>'
    + '</div>'

    // Mobile theft detail (shown only when section 379-402 PPC selected)
    + '<div id="cf-mobile-box" style="display:'+(_hasMobileSection(selectedSections)?'block':'none')+';background:var(--bg-secondary);border:1px solid var(--amber);border-radius:8px;padding:12px;margin-bottom:12px;">'
    +   '<div style="font-size:14pt;font-weight:700;color:var(--amber);margin-bottom:8px;font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;">📱 موبائل چوری کی تفصیل</div>'
    +   '<div class="cf-row2">'
    +     '<div class="cf-field"><label class="cf-label">چوری شدہ چیز</label>'
    +       '<select class="form-input" id="cf-theft-item">'
    +         '<option value="mobile" selected>📱 موبائل فون</option>'
    +       '</select></div>'
    +     '<div class="cf-field"><label class="cf-label">تعداد موبائل فون</label>'
    +       '<input class="form-input" type="number" id="cf-mobile-count" min="1" max="20" value="'+_mobilePhonesSeed.length+'" oninput="_cfRenderMobilePhones()"></div>'
    +   '</div>'
    +   '<input type="hidden" id="cf-mobile-seed" value="'+esc(JSON.stringify(_mobilePhonesSeed))+'">'
    +   '<div id="cf-mobile-phones-container"></div>'
    +   '<div style="font-size:12px;font-weight:700;color:var(--text-muted);margin:10px 0 6px;border-top:1px dashed var(--border);padding-top:8px;">📶 سم نمبرز</div>'
    +   '<div id="cf-mobile-sims-container" class="cf-row-sim"></div>'
    + '</div>'


    // مدعی کی تفصیل (ہیڈنگ ہٹا دی گئی)
    + '<div class="cf-box">'

    // Row 1: مدعی (full width with voice + live counter)
    + '<div class="cf-field">'
    + '<label class="cf-label">مدعی *</label>'
    + '<div style="display:flex;gap:6px;direction:rtl;align-items:center;flex:1;min-width:0;">'
    + '<div style="flex:1;position:relative;">'
    + '<input class="form-input" id="cf-complainant" value="'+complainant+'" placeholder="مدعی کا نام" dir="auto" oninput="var _cc=document.getElementById(\'cf-comp-count\');if(_cc)_cc.textContent=this.value.length+\' حروف\';">'
    + '<span id="cf-comp-count" style="position:absolute;bottom:4px;left:8px;font-size:9px;color:var(--text-faint);">'+(complainant?complainant.length+' حروف':'')+'</span>'
    + '</div>'
    + '<button id="vmb-cf-complainant" type="button" onclick="voiceType(\'cf-complainant\',\'vmb-cf-complainant\')" style="width:36px;height:36px;flex-shrink:0;border:1px solid var(--border);border-radius:6px;background:var(--bg-tertiary);font-size:16px;cursor:pointer;">🎙️</button>'
    + '</div>'
    + '</div>'

    // Row 2: شناختی کارڈ + موبائل نمبر + پیشہ (تینوں ایک ہی سطر)
    + '<div class="cf-row3">'
    + '<div class="cf-field"><label class="cf-label">شناختی کارڈ</label>'
    + '<input class="form-input" id="cf-complainant-cnic" value="'+cmpCnic+'" placeholder="XXXXX-XXXXXXX-X" oninput="autoFormatCNIC(this)" dir="ltr" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">موبائل نمبر</label>'
    + '<input class="form-input" id="cf-complainant-cell" value="'+cmpCell+'" placeholder="0XXX-XXXXXXX" oninput="autoFormatCell(this)" dir="ltr" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">پیشہ</label>'
    + '<input class="form-input" id="cf-complainant-profession" value="'+cmpProf+'" placeholder="پیشہ" dir="auto"></div>'
    + '</div>'

    + '</div>'

    // FIR کی تفصیل (ہیڈنگ ہٹا دی گئی)
    + '<div class="cf-box">'
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">مرتبہ مرسلہ</label>'
    + '<div style="display:flex;gap:4px;direction:rtl;flex:1;min-width:0;"><input class="form-input" id="cf-complaint-sender" value="'+compSender+'" placeholder="مرتبہ مرسلہ" dir="auto" style="flex:1;"><button id="vmb-cs" type="button" onclick="voiceType(\'cf-complaint-sender\',\'vmb-cs\')" style="width:34px;height:34px;flex-shrink:0;border:1px solid var(--border);border-radius:5px;background:var(--bg-tertiary);font-size:14px;cursor:pointer;">🎙️</button></div></div>'
    + '<div class="cf-field"><label class="cf-label">محرر</label>'
    + '<div style="display:flex;gap:4px;direction:rtl;flex:1;min-width:0;"><input class="form-input" id="cf-fir-writer" value="'+firWriter+'" placeholder="محرر کا نام" dir="auto" style="flex:1;"><button id="vmb-fw" type="button" onclick="voiceType(\'cf-fir-writer\',\'vmb-fw\')" style="width:34px;height:34px;flex-shrink:0;border:1px solid var(--border);border-radius:5px;background:var(--bg-tertiary);font-size:14px;cursor:pointer;">🎙️</button></div></div>'
    + '</div>'
    + '</div>'

    // صورتحال + پوزیشن (آخر میں، ایک ہی سطر — ترجیح ہٹا دی گئی)
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">صورتحال *</label>'
    + '<select class="form-input" id="cf-status">'+statusOpts+'</select></div>'
    + '<div class="cf-field"><label class="cf-label">پوزیشن</label>'
    + '<select class="form-input" id="cf-position">'+posOpts+'</select></div>'
    + '</div>'

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
    + '<option value="under"'+(crossStatus==='under'?' selected':'')+'>زیر تفتیش (Under Investigation)</option>'
    + '<option value="complete"'+(crossStatus==='complete'?' selected':'')+'>مکمل چالان (Complete)</option>'
    + '<option value="incomplete"'+(crossStatus==='incomplete'?' selected':'')+'>نامکمل چالان (Incomplete)</option>'
    + '<option value="challan512"'+(crossStatus==='challan512'?' selected':'')+'>چالان 512ض ف (512 CrPC)</option>'
    + '<option value="untrace"'+(crossStatus==='untrace'?' selected':'')+'>عدم پتہ (Untraced)</option>'
    + '<option value="cancel"'+(crossStatus==='cancel'?' selected':'')+'>اخراج (Cancelled)</option>';
  var crossPosOpts = ''
    + '<option value="pending"'+(crossPosition==='pending'?' selected':'')+'>⏳ Pending</option>'
    + '<option value="court"'+(crossPosition==='court'?' selected':'')+'>⚖️ In Court</option>';
  return ''
    // رپٹ نمبر (آدھی چوڑائی) + رپٹ تاریخ + کراس ورژن مقدمہ نمبر + کراس ورژن مقدمہ کی تاریخ (چاروں ایک سطر)
    + '<div class="cf-row4-rapat">'
    + '<div class="cf-field"><label class="cf-label">&#x0631;&#x067E;&#x0679; &#x0646;&#x0645;&#x0628;&#x0631;</label>'
    + '<input class="form-input" id="cf-cross-rapat" value="'+crn+'" placeholder="e.g. 12" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">&#x0631;&#x067E;&#x0679; &#x062A;&#x0627;&#x0631;&#x06CC;&#x062E;</label>'
    + '<input class="form-input" id="cf-cross-rapat-date" value="'+crd+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)"></div>'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن مقدمہ نمبر</label>'
    + '<input class="form-input" id="cf-cross-fir" data-auto="'+(cfnAuto?'1':'0')+'" value="'+cfn+'" placeholder="e.g. 246/2025" dir="auto" oninput="this.dataset.auto=\'0\'"></div>'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن مقدمہ کی تاریخ</label>'
    + '<input class="form-input" id="cf-cross-fir-date" data-auto="'+(cfdAuto?'1':'0')+'" value="'+cfd+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this);this.dataset.auto=\'0\'"></div>'
    + '</div>'

    // کراس ورژن مدعی کا نام (پوری چوڑائی)
    + '<div class="cf-field"><label class="cf-label">کراس ورژن مدعی کا نام</label>'
    + '<input class="form-input" id="cf-cross-complainant" value="'+cc+'" placeholder="&#x0645;&#x062F;&#x0639;&#x06CC; &#x06A9;&#x0627; &#x0646;&#x0627;&#x0645;" dir="auto"></div>'

    // شناختی کارڈ + موبائل نمبر + پیشہ (تینوں ایک سطر)
    + '<div class="cf-row3">'
    + '<div class="cf-field"><label class="cf-label">&#x0634;&#x0646;&#x0627;&#x062E;&#x062A;&#x06CC; &#x06A9;&#x0627;&#x0631;&#x0688;</label>'
    + '<input class="form-input" id="cf-cross-complainant-cnic" value="'+ccc+'" placeholder="XXXXX-XXXXXXX-X" oninput="autoFormatCNIC(this)"></div>'
    + '<div class="cf-field"><label class="cf-label">&#x0645;&#x0648;&#x0628;&#x0627;&#x0626;&#x0644; &#x0646;&#x0645;&#x0628;&#x0631;</label>'
    + '<input class="form-input" id="cf-cross-complainant-cell" value="'+ccl+'" placeholder="0XXX-XXXXXXX" oninput="autoFormatCell(this)"></div>'
    + '<div class="cf-field"><label class="cf-label">&#x067E;&#x06CC;&#x0634;&#x06C1;</label>'
    + '<input class="form-input" id="cf-cross-complainant-profession" value="'+ccp+'" placeholder="&#x067E;&#x06CC;&#x0634;&#x06C1;" dir="auto"></div>'
    + '</div>'

    // کراس ورژن دفعات (70%) + کراس ورژن محرر (30%، سطر کے آخر میں)
    + '<div class="cf-row-7030">'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن دفعات</label>'
    + '<input class="form-input" id="cf-cross-section" value="'+cs+'" placeholder="e.g. 302 PPC + 34 PPC" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن محرر</label>'
    + '<input class="form-input" id="cf-cross-fir-writer" value="'+cfw+'" placeholder="محرر کا نام" dir="auto"></div>'
    + '</div>'

    // کراس ورژن صورتحال + کراس ورژن پوزیشن (ایک ہی سطر، مرکزی فارم کی طرح)
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن صورتحال</label>'
    + '<select class="form-input" id="cf-cross-status">'+crossStatusOpts+'</select></div>'
    + '<div class="cf-field"><label class="cf-label">کراس ورژن پوزیشن</label>'
    + '<select class="form-input" id="cf-cross-position">'+crossPosOpts+'</select></div>'
    + '</div>'

    + '<div style="padding:8px 10px;background:rgba(239,68,68,0.06);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);font-size:11px;color:var(--red);margin-top:4px;">'
    + '&#x26A0;&#xFE0F; Cross Version cases are linked to the original FIR. Both cases will appear in the case workspace under the same folder.'
    + '</div>';
}


function sectionTag(sectionStr) {
  return `<div style="display:inline-flex;align-items:center;gap:6px;background:var(--nav-active);border:1px solid var(--accent);border-radius:20px;padding:4px 10px;font-size:11px;color:var(--accent);">
    <b>${sectionStr}</b>
    <span onclick="removeSection('${sectionStr}')" style="cursor:pointer;color:var(--text-muted);font-size:14px;line-height:1;" title="Remove">×</span>
  </div>`;
}


async function openEditCaseModal(id){const c=await getCase(id);if(!c)return;openModal(`✏️ ترمیم — مقدمہ ${c.fir_number}`,caseFormHTML(c),`<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button><button class="btn btn-primary" onclick="saveEditCase('${id}')">💾 تبدیلیاں محفوظ کریں</button>`);setTimeout(_cfRenderMobilePhones,50);}

async function saveNewCase(){
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
  if(!fir){showToast('⚠️ مقدمہ نمبر درج کریں','error');document.getElementById('cf-fir')?.focus();return;}
  if(!section){showToast('⚠️ دفعہ قانون درج کریں','error');document.getElementById('cf-section-search')?.focus();return;}
  if(!complainant){showToast('⚠️ مدعی کا نام درج کریں','error');document.getElementById('cf-complainant')?.focus();return;}
  try{
    var _cfMobile = _cfMobileFieldsPayload();
    await addCase({
      fir_number:fir,
      fir_date:document.getElementById('cf-date').value.trim(),
      occurrence_date:document.getElementById('cf-occurrence-date')?.value.trim()||'',
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
      offence_type:document.getElementById('cf-offence')?.value?.trim()||'',
      sho:document.getElementById('cf-sho')?.value.trim()||'',
      sdpo:document.getElementById('cf-sdpo')?.value.trim()||'',
      status:document.getElementById('cf-status').value,
      mulzman_type:document.getElementById('cf-mulzman-type')?.value||'namaloom',
      position:document.getElementById('cf-position').value,
      notes:document.getElementById('cf-notes')?.value.trim()||'',
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
    // Auto reminders
    const firDate = document.getElementById('cf-date').value.trim();
    const mulzmanType = document.getElementById('cf-mulzman-type')?.value||'namaloom';
    await _createAutoReminders(fir, firDate, mulzmanType, complainant);
    closeModal();showToast('✅ مقدمہ درج ہو گیا: FIR '+fir,'success');await updateBadges();renderCases(document.getElementById('page-content'));
  }catch(err){showToast('Error: '+err.message,'error');}
}

// ── DOCUMENTS CHECKLIST ────────────────────────────────────────
const _DOCS_LIST = [
  'ایف آئی آر','کراس ورشن','رپورٹ 173 ض ف','جائے واردات',
  'نامزد ملزمان','گواہان FIR','گواہان کراس ورشن','بیانات 161 ض ف',
  'وقوعہ جات','فردات','ضمنیات','میمورنڈم','فارم گرفتاری',
  'انکشافات','درخواستیں','بریف مقدمہ','شہادتیں','انسدادی کاروائی',
  'وارنٹ','اشتہار','پراگریس رپورٹ','فارم مفروری','CDR/IMEI',
  'ہمراہی ملازمان','انڈیکس نقل مسل',
];


async function saveEditCase(id){
  // Resolve section: use selected, else typed search value
  var _editSection=document.getElementById('cf-section').value.trim();
  if(!_editSection){
    var _typed=document.getElementById('cf-section-search')?.value.trim()||'';
    if(_typed) _editSection=_typed;
  }
  try{
    var _cfMobile = _cfMobileFieldsPayload();
    await updateCase(id,{
      fir_number:document.getElementById('cf-fir').value.trim(),
      fir_date:document.getElementById('cf-date').value.trim(),
      occurrence_date:document.getElementById('cf-occurrence-date')?.value.trim()||'',
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
      offence_type:document.getElementById('cf-offence')?.value?.trim()||'',
      sho:document.getElementById('cf-sho')?.value.trim()||'',
      sdpo:document.getElementById('cf-sdpo')?.value.trim()||'',
      status:document.getElementById('cf-status').value,
      mulzman_type:document.getElementById('cf-mulzman-type')?.value||'namaloom',
      position:document.getElementById('cf-position').value,
      notes:document.getElementById('cf-notes')?.value.trim()||'',
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
    closeModal();
    showToast('✅ Case updated!','success');
    // Wait briefly so DB write propagates through cases_decrypted view before re-fetching
    await new Promise(r=>setTimeout(r,300));
    await updateBadges();
    await renderCases(document.getElementById('page-content'));
  }catch(err){showToast('❌ Error: '+err.message,'error');}
}
// viewCase now opens workspace
