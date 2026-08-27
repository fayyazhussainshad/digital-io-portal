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
    + '.cf-row2 .cf-field,.cf-row3 .cf-field{margin-bottom:9px;}'
    + '.cf-box{padding:10px 12px;background:var(--bg-tertiary);border-radius:var(--radius-sm);margin-bottom:12px;}'
    + '.cf-box-title{font-size:14pt;font-weight:800;color:var(--accent);margin-bottom:9px;text-align:right;'
    +   'font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;}'
    + '.cf-hint{font-size:11px;color:var(--text-muted);margin:-4px 0 9px;padding-right:2px;}'
    + '@media(max-width:640px){.cf-row3{grid-template-columns:1fr 1fr;}}'
    + '@media(max-width:480px){'
    +   '.cf-row2,.cf-row3{grid-template-columns:1fr;}'
    +   '.cf-field{flex-wrap:wrap;}'
    +   '.cf-label{white-space:normal;}'
    + '}';
  document.head.appendChild(s);
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

    // Row 1: مقدمہ نمبر + تاریخ اندراج مقدمہ (ایک لائن، لیبل دائیں طرف)
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">مقدمہ نمبر *</label>'
    + '<input class="form-input" id="cf-fir" value="'+fir+'" placeholder="e.g. 245/2025" dir="ltr" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">تاریخ اندراج *</label>'
    + '<input class="form-input" id="cf-date" value="'+date+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)" dir="ltr" style="text-align:left;"></div>'
    + '</div>'

    // Row 2: تاریخ وقوعہ + صورتحال + ترجیح (تین کالم، ایک ہی سطر)
    + '<div class="cf-row3">'
    + '<div class="cf-field"><label class="cf-label">تاریخ وقوعہ</label>'
    + '<input class="form-input" id="cf-occurrence-date" value="'+occ+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)" dir="ltr" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">صورتحال *</label>'
    + '<select class="form-input" id="cf-status">'+statusOpts+'</select></div>'
    + '<div class="cf-field"><label class="cf-label">ترجیح</label>'
    + '<select class="form-input" id="cf-priority">'
    +   '<option value="">— منتخب کریں —</option>'
    +   '<option value="high"'+(c.priority==='high'?' selected':'')+'>🔴 اہم</option>'
    +   '<option value="medium"'+(c.priority==='medium'?' selected':'')+'>🟡 درمیانہ</option>'
    +   '<option value="low"'+(c.priority==='low'?' selected':'')+'>🟢 کم</option>'
    + '</select></div>'
    + '</div>'

    // Row 2b: ملزمان کی صورتحال (ایک لائن + نیچے مختصر وارننگ)
    + '<div class="cf-field"><label class="cf-label">ملزمان</label>'
    + '<select class="form-input" id="cf-mulzman-type">'
    + '<option value="maloom" '+(c.mulzman_type==='maloom'?'selected':'')+'>✅ ملزمان معلوم</option>'
    + '<option value="namaloom" '+(c.mulzman_type==='namaloom'||!c.mulzman_type?'selected':'')+'>⚠️ ملزمان نامعلوم</option>'
    + '</select></div>'
    + '<div class="cf-hint">⚠️ نامعلوم منتخب کریں تو 15 دن بعد خودکار یاددہانی ملے گی</div>'

    // Row 3: دفعات قانون (پوری چوڑائی — سرچ باکس)
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
    + '<div class="cf-hint" style="margin-top:-4px;">(ایک سے زیادہ دفعات منتخب کر سکتے ہیں)</div>'

    // Mobile theft detail (shown only when section 379-402 PPC selected)
    + '<div id="cf-mobile-box" style="display:'+(_hasMobileSection(selectedSections)?'block':'none')+';background:var(--bg-secondary);border:1px solid var(--amber);border-radius:8px;padding:12px;margin-bottom:12px;">'
    +   '<div style="font-size:14pt;font-weight:700;color:var(--amber);margin-bottom:8px;font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;">📱 موبائل چوری کی تفصیل</div>'
    +   '<div class="cf-row2">'
    +     '<div class="cf-field"><label class="cf-label">چوری شدہ چیز</label>'
    +       '<select class="form-input" id="cf-theft-item" onchange="_toggleMobileFields()">'
    +         '<option value="">— منتخب کریں —</option>'
    +         '<option value="mobile"'+(c.theft_item==='mobile'?' selected':'')+'>📱 موبائل فون</option>'
    +         '<option value="motorcycle"'+(c.theft_item==='motorcycle'?' selected':'')+'>🏍️ موٹرسائیکل</option>'
    +         '<option value="car"'+(c.theft_item==='car'?' selected':'')+'>🚗 گاڑی</option>'
    +         '<option value="cash"'+(c.theft_item==='cash'?' selected':'')+'>💵 نقدی</option>'
    +         '<option value="jewelry"'+(c.theft_item==='jewelry'?' selected':'')+'>💍 زیورات</option>'
    +         '<option value="other"'+(c.theft_item==='other'?' selected':'')+'>دیگر</option>'
    +       '</select></div>'
    +     '<div id="cf-mobile-imei-wrap" class="cf-field" style="display:'+(c.theft_item==='mobile'?'flex':'none')+';"><label class="cf-label">IMEI نمبر</label>'
    +       '<input class="form-input" id="cf-mobile-imei" dir="ltr" inputmode="numeric" maxlength="15" value="'+(c.theft_imei||'')+'" placeholder="000000000000000" oninput="_imeiLookup(this)"></div>'
    +     '<div id="cf-mobile-brand-wrap" class="cf-field" style="display:'+(c.theft_item==='mobile'?'flex':'none')+';"><label class="cf-label">کمپنی / ماڈل</label>'
    +       '<input class="form-input" id="cf-mobile-brand" value="'+(c.theft_brand||'')+'" placeholder="IMEI سے خودکار، یا خود لکھیں"></div>'
    +     '<div id="cf-mobile-cell-wrap" class="cf-field" style="display:'+(c.theft_item==='mobile'?'flex':'none')+';grid-column:1/-1;"><label class="cf-label">چوری شدہ نمبر</label>'
    +       '<input class="form-input" id="cf-mobile-cell" dir="ltr" value="'+(c.theft_cell||'')+'" placeholder="0000-0000000، 0000-0000000"></div>'
    +   '</div>'
    + '</div>'


    // مدعی کی تفصیل
    + '<div class="cf-box">'
    + '<div class="cf-box-title">👤 مدعی کی تفصیل</div>'

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

    // Row 2: موبائل نمبر + شناختی کارڈ
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">موبائل نمبر</label>'
    + '<input class="form-input" id="cf-complainant-cell" value="'+cmpCell+'" placeholder="0XXX-XXXXXXX" oninput="autoFormatCell(this)" dir="ltr" style="text-align:left;"></div>'
    + '<div class="cf-field"><label class="cf-label">شناختی کارڈ</label>'
    + '<input class="form-input" id="cf-complainant-cnic" value="'+cmpCnic+'" placeholder="XXXXX-XXXXXXX-X" oninput="autoFormatCNIC(this)" dir="ltr" style="text-align:left;"></div>'
    + '</div>'

    // Row 3: پیشہ
    + '<div class="cf-field"><label class="cf-label">پیشہ</label>'
    + '<input class="form-input" id="cf-complainant-profession" value="'+cmpProf+'" placeholder="پیشہ" dir="auto"></div>'

    + '</div>'

    // FIR کی تفصیل
    + '<div class="cf-box">'
    + '<div class="cf-box-title">📋 FIR کی تفصیل</div>'
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">مرتبہ مرسلہ</label>'
    + '<div style="display:flex;gap:4px;direction:rtl;flex:1;min-width:0;"><input class="form-input" id="cf-complaint-sender" value="'+compSender+'" placeholder="مرتبہ مرسلہ" dir="auto" style="flex:1;"><button id="vmb-cs" type="button" onclick="voiceType(\'cf-complaint-sender\',\'vmb-cs\')" style="width:34px;height:34px;flex-shrink:0;border:1px solid var(--border);border-radius:5px;background:var(--bg-tertiary);font-size:14px;cursor:pointer;">🎙️</button></div></div>'
    + '<div class="cf-field"><label class="cf-label">محرر</label>'
    + '<div style="display:flex;gap:4px;direction:rtl;flex:1;min-width:0;"><input class="form-input" id="cf-fir-writer" value="'+firWriter+'" placeholder="محرر کا نام" dir="auto" style="flex:1;"><button id="vmb-fw" type="button" onclick="voiceType(\'cf-fir-writer\',\'vmb-fw\')" style="width:34px;height:34px;flex-shrink:0;border:1px solid var(--border);border-radius:5px;background:var(--bg-tertiary);font-size:14px;cursor:pointer;">🎙️</button></div></div>'
    + '</div>'
    + '<div class="cf-field"><label class="cf-label">پوزیشن</label>'
    + '<select class="form-input" id="cf-position">'+posOpts+'</select></div>'
    + '</div>'

    // ── کراس ورژن ──────────────────────────────────────────────
    + '<div class="dio-full" style="margin-top:14px;padding:10px 12px;background:rgba(239,68,68,0.06);'
    + 'border:1px solid rgba(239,68,68,0.25);border-radius:var(--radius-sm);">'
    + '<label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:700;font-size:14pt;font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;">'
    + '<input type="checkbox" id="cf-cross-version" ' + (isCross ? 'checked' : '')
    + ' onchange="document.getElementById(\'cross-version-fields\').style.display = this.checked ? \'block\' : \'none\';"'
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
  var cfn = c.cross_fir_number || '';
  var cfd = c.cross_fir_date || '';
  var cc = c.cross_complainant || '';
  var ccc = c.cross_complainant_cnic || '';
  var ccl = c.cross_complainant_cell || '';
  var ccp = c.cross_complainant_profession || '';
  var cs = c.cross_section_of_law || '';
  var co = c.cross_offence_type || '';
  var cfw = c.cross_fir_writer || '';
  var crn = c.cross_rapat_number || '';
  var crd = c.cross_rapat_date || '';
  return '<div style="font-size:14pt;font-weight:800;color:var(--red);margin-bottom:8px;font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;">&#x2694;&#xFE0F; &#x06A9;&#x0631;&#x0627;&#x0633; &#x0648;&#x0631;&#x0698;&#x0646; &#x06A9;&#x06CC; &#x062A;&#x0641;&#x0635;&#x06CC;&#x0644;</div>'
    + '<div class="cf-hint" style="margin-bottom:10px;">'
    + '&#x0645;&#x0642;&#x062F;&#x0645;&#x06C1; &#x0646;&#x0645;&#x0628;&#x0631; &#x0648;&#x06C1;&#x06CC; &#x0631;&#x06C1;&#x06D2; &#x06AF;&#x0627; &#x06C1;&#x06D2;</div>'
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">&#x0631;&#x067E;&#x0679; &#x0646;&#x0645;&#x0628;&#x0631;</label>'
    + '<input class="form-input" id="cf-cross-rapat" value="'+crn+'" placeholder="e.g. 12" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">&#x0631;&#x067E;&#x0679; &#x06A9;&#x06CC; &#x062A;&#x0627;&#x0631;&#x06CC;&#x062E;</label>'
    + '<input class="form-input" id="cf-cross-rapat-date" value="'+crd+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)"></div>'
    + '</div>'
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">Cross FIR Number</label>'
    + '<input class="form-input" id="cf-cross-fir" value="'+cfn+'" placeholder="e.g. 246/2025" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">Cross FIR Date</label>'
    + '<input class="form-input" id="cf-cross-fir-date" value="'+cfd+'" placeholder="DD-MM-YYYY" oninput="autoFormatDate(this)"></div>'
    + '</div>'
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">Cross Complainant</label>'
    + '<input class="form-input" id="cf-cross-complainant" value="'+cc+'" placeholder="&#x0645;&#x062F;&#x0639;&#x06CC; &#x06A9;&#x0627; &#x0646;&#x0627;&#x0645;" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">CNIC</label>'
    + '<input class="form-input" id="cf-cross-complainant-cnic" value="'+ccc+'" placeholder="XXXXX-XXXXXXX-X" oninput="autoFormatCNIC(this)"></div>'
    + '</div>'
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">Cell Number</label>'
    + '<input class="form-input" id="cf-cross-complainant-cell" value="'+ccl+'" placeholder="0XXX-XXXXXXX" oninput="autoFormatCell(this)"></div>'
    + '<div class="cf-field"><label class="cf-label">Profession</label>'
    + '<input class="form-input" id="cf-cross-complainant-profession" value="'+ccp+'" placeholder="&#x067E;&#x06CC;&#x0634;&#x06C1; / Profession" dir="auto"></div>'
    + '</div>'
    + '<div class="cf-row2">'
    + '<div class="cf-field"><label class="cf-label">Cross Sections</label>'
    + '<input class="form-input" id="cf-cross-section" value="'+cs+'" placeholder="e.g. 302 PPC + 34 PPC" dir="auto"></div>'
    + '<div class="cf-field"><label class="cf-label">Cross Offence</label>'
    + '<input class="form-input" id="cf-cross-offence" value="'+co+'" placeholder="Cross offence" dir="auto"></div>'
    + '</div>'
    + '<div class="cf-field"><label class="cf-label">Cross FIR Writer</label>'
    + '<input class="form-input" id="cf-cross-fir-writer" value="'+cfw+'" placeholder="FIR &#x0644;&#x06A9;&#x06BE;&#x0646;&#x06D2; &#x0648;&#x0627;&#x0644;&#x0627;" dir="auto"></div>'
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


async function openEditCaseModal(id){const c=await getCase(id);if(!c)return;openModal(`✏️ ترمیم — مقدمہ ${c.fir_number}`,caseFormHTML(c),`<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button><button class="btn btn-primary" onclick="saveEditCase('${id}')">💾 تبدیلیاں محفوظ کریں</button>`);}

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
      theft_item:document.getElementById('cf-theft-item')?.value||null,
      theft_imei:document.getElementById('cf-mobile-imei')?.value?.trim()||null,
      theft_brand:document.getElementById('cf-mobile-brand')?.value?.trim()||null,
      theft_cell:document.getElementById('cf-mobile-cell')?.value?.trim()||null,
      offence_type:document.getElementById('cf-offence')?.value?.trim()||'',
      sho:document.getElementById('cf-sho')?.value.trim()||'',
      sdpo:document.getElementById('cf-sdpo')?.value.trim()||'',
      status:document.getElementById('cf-status').value,
      priority:document.getElementById('cf-priority')?.value||null,
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
      cross_offence_type:document.getElementById('cf-cross-offence')?.value.trim()||null,
      cross_fir_writer:document.getElementById('cf-cross-fir-writer')?.value.trim()||null,
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
      theft_item:document.getElementById('cf-theft-item')?.value||null,
      theft_imei:document.getElementById('cf-mobile-imei')?.value?.trim()||null,
      theft_brand:document.getElementById('cf-mobile-brand')?.value?.trim()||null,
      theft_cell:document.getElementById('cf-mobile-cell')?.value?.trim()||null,
      offence_type:document.getElementById('cf-offence')?.value?.trim()||'',
      sho:document.getElementById('cf-sho')?.value.trim()||'',
      sdpo:document.getElementById('cf-sdpo')?.value.trim()||'',
      status:document.getElementById('cf-status').value,
      priority:document.getElementById('cf-priority')?.value||null,
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
      cross_offence_type:document.getElementById('cf-cross-offence')?.value.trim()||null,
      cross_fir_writer:document.getElementById('cf-cross-fir-writer')?.value.trim()||null,
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
