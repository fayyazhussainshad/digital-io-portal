/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — رپورٹ 173 ض ف (FORM 25.56(1))
   5 types: چالان مکمل/نامکمل/انٹیرم/اخراج/عدم پتہ
   ═══════════════════════════════════════════════════════════ */

let _r173CaseId = null;
let _r173Case = null;
let _r173Records = {};  // type -> saved form_data
let _r173Type = 'mukammal';

const R173_TYPES = [
  { id:'mukammal',  name:'چالان مکمل' },
  { id:'namukammal',name:'چالان نامکمل' },
  { id:'interim',   name:'انٹیرم چالان' },
  { id:'ikhraj',    name:'اخراج' },
  { id:'adampata',  name:'عدم پتہ' },
  { id:'tatima_challan', name:'تتمہ چالان' },
];

const R173_TATIMA_SUBS = [
  { id:'aslha',  name:'تتمہ چالان — اسلحہ' },
  { id:'chars',  name:'تتمہ چالان — چرس/منشیات' },
  { id:'sharab', name:'تتمہ چالان — شراب' },
  { id:'zina',   name:'تتمہ چالان — زنا/ڈی این اے' },
];

const R173_TATIMA_BOILER = {
  aslha: 'جناب عالیٰ! مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر 3 کے خلاف چالان نامکمل مرتب ہو چکا ہے اب PFSA لاہور سے رزلٹ نمبری ____________ موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریر فرمائی ہے۔ "The item P1 pistol was examined and found to be in mechanical operating condition" رزلٹ میں پارسل کو item P1 سے ظاہر کیا گیا ہے لہٰذا مقدمہ ہذا میں ملزم بالا کے خلاف تتمہ چالان مکمل مرتب ہو کر ارسال خدمت ہے سماعت فرمائی جائے۔',
  chars: 'جناب عالیٰ! مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر 3 کے خلاف چالان نامکمل مرتب ہو چکا ہے PFSA لاہور سے موصولہ متعلقہ مقدمہ ہذا ایک رزلٹ نمبر ____________ موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریر فرمائی ہے۔ "Sample 01 having net weight ______ grams of dark brown resinous material in sealed parcel contains Chars. Sample is Narcotic Drug as defined in the section 2 of the CNS Act, 1997." تصدیق چرس ہو چکی ہے لہٰذا مقدمہ ہذا میں ملزم بالا کے خلاف تتمہ چالان مکمل مرتب ہو کر ارسال خدمت ہے سماعت فرمائی جائے۔',
  sharab: 'جناب عالیٰ! مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر 3 کے خلاف چالان نامکمل مرتب ہو چکا ہے اب PFSA لاہور سے رزلٹ نمبری ____________ موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریر فرمائی ہے۔ "Presumptive test indicated the presence of alcohol in item 1." لہٰذا مقدمہ ہذا میں ملزم بالا کے خلاف تتمہ چالان مکمل مرتب ہو کر ارسال خدمت ہے سماعت فرمائی جائے۔',
  zina: 'جناب عالیٰ! مقدمہ ہذا میں قبل ازیں ملزم مندرجہ خانہ نمبر 3 کے خلاف چالان نامکمل مرتب ہو چکا ہے اب PFSA لاہور سے رزلٹ نمبری ____________ موصول ہوا ہے جس پر جناب ایگزامینر صاحب نے بحروف انگریزی ذیل رائے تحریر فرمائی ہے۔ "No seminal material was found on item no.1 and 2.1-2.3; therefore no further DNA analysis was conducted on these." مقدمہ ہذا میں تکمیل تفتیش ہو چکی ہے لہٰذا ملزم بالا کے خلاف تتمہ چالان مکمل مرتب ہو کر ارسال خدمت ہے سماعت فرمائی جائے۔',
};

let _r173Subtype = 'aslha';

const R173_BOILER = {
  mukammal: 'جناب عالیٰ! مختصر حالات مقدمہ عنوان بالا اس طرح ہیں کہ دوران تفتیش مقدمہ ہذا مکمل ہوا۔ ملزمان کے خلاف کافی شہادت دستیاب ہوئی۔ چالان مکمل مرتب ہوکر ارسالِ خدمت ہے، سماعت فرمائی جائے۔',
  namukammal: 'جناب عالیٰ! مختصر حالات مقدمہ عنوان بالا اس طرح ہیں کہ تفتیش مقدمہ ہذا تاحال نامکمل ہے۔ بعض ملزمان ابھی گرفتار نہ ہوسکے۔ چالان نامکمل مرتب ہوکر ارسالِ خدمت ہے، سماعت فرمائی جائے۔',
  interim: 'جناب عالیٰ! مختصر حالات مقدمہ عنوان بالا اس طرح ہیں کہ تفتیش مقدمہ جاری ہے سردست انٹیرم رپورٹ مرتب ہوکر ارسال خدمت ہے سماعت فرمائی جائے۔',
  ikhraj: '',
  adampata: 'جناب عالیٰ! مختصر حالات مقدمہ عنوان بالا اس طرح ہیں کہ باوجود بھرپور کوشش ملزمان کا کوئی سراغ نہ مل سکا۔ رپورٹ عدم پتہ مرتب ہوکر ارسالِ خدمت ہے، سماعت فرمائی جائے۔',
};

// ── ENTRY ─────────────────────────────────────────────────────
async function openReport173(caseId) {
  _r173CaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
             || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _r173CaseId) {
    try { _r173Case = await getCase(_r173CaseId); } catch(_) { _r173Case = null; }
  }
  await _loadR173();
  _r173Type = 'mukammal';
  _renderR173();
}

async function _loadR173() {
  if (!navigator.onLine) {
    try { _r173Records = JSON.parse(localStorage.getItem('dio_r173_'+_r173CaseId)||'{}'); } catch(_) { _r173Records={}; }
    return;
  }
  try {
    const { data } = await supabaseClient.from('report_173').select('*').eq('case_id', _r173CaseId);
    _r173Records = {};
    (data||[]).forEach(r => {
      const key = r.report_type === 'tatima_challan' ? 'tatima_challan_' + (r.report_subtype||'aslha') : r.report_type;
      _r173Records[key] = r.form_data || {};
    });
    try { localStorage.setItem('dio_r173_'+_r173CaseId, JSON.stringify(_r173Records)); } catch(_) {}
  } catch(_) {
    try { _r173Records = JSON.parse(localStorage.getItem('dio_r173_'+_r173CaseId)||'{}'); } catch(_2) { _r173Records={}; }
  }
}

function _r173Pick(type) {
  _r173Type = type;
  _closeAllDD && _closeAllDD();
  _renderR173();
}
function _r173PickSub(sub) {
  _r173Subtype = sub;
  _renderR173();
}

// ── RENDER ────────────────────────────────────────────────────
function _renderR173() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _r173Case || {};
  const isTatima = _r173Type === 'tatima_challan';
  let typeName = (R173_TYPES.find(t => t.id === _r173Type) || {}).name || '';
  if (isTatima) typeName = 'تتمہ چالان مکمل';
  // Saved record key (tatima uses subtype)
  const recKey = isTatima ? 'tatima_challan_' + _r173Subtype : _r173Type;
  const saved = _r173Records[recKey] || {};
  const v = (k, def) => saved[k] !== undefined ? saved[k] : (def || '');
  const isIkhraj = _r173Type === 'ikhraj';
  const isAdampata = _r173Type === 'adampata';
  const isClosing = isIkhraj || isAdampata; // both use the 3-col 8-row table layout
  // Boilerplate: tatima uses subtype boiler, others use type boiler
  const boiler = isTatima ? (R173_TATIMA_BOILER[_r173Subtype]||'') : (R173_BOILER[_r173Type]||'');

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Toolbar -->
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <select id="r173-type-sel" onchange="_r173Pick(this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
        ${R173_TYPES.map(t => `<option value="${t.id}" ${t.id===_r173Type?'selected':''}>${t.name}</option>`).join('')}
      </select>
      ${isTatima ? `
      <select id="r173-sub-sel" onchange="_r173PickSub(this.value)" style="padding:6px 10px;border:1px solid var(--amber);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
        ${R173_TATIMA_SUBS.map(s => `<option value="${s.id}" ${s.id===_r173Subtype?'selected':''}>${s.name}</option>`).join('')}
      </select>` : ''}
      <div style="margin-right:auto;display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="_saveR173()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary btn-sm" onclick="_printR173()">🖨️ پرنٹ کریں</button>
      </div>
    </div>

    <!-- Form -->
    <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-tertiary);">
      <div id="r173-doc" style="max-width:210mm;margin:0 auto;padding:16mm;background:#fff;color:#111;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:14px;line-height:1.9;direction:rtl;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;">

        <!-- Header -->
        <div style="text-align:center;font-size:12px;color:#555;">فارم نمبر 25.56(1)</div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin:8px 0;">
          <span style="font-weight:bold;text-decoration:underline;">تھانہ ${o.station||'صدر ملتان'}</span>
          <span style="font-weight:bold;text-decoration:underline;font-size:17px;">${isClosing ? `فارم رپورٹ اختتامی بصیغہ ${isIkhraj?'اخراج':'عدم پتہ'} زیر دفعہ 173 ض ف` : `فارم رپورٹ ${typeName} زیر دفعہ 173 ض ف`}</span>
          <span style="font-weight:bold;text-decoration:underline;">ضلع ${o.district||'ملتان'}</span>
        </div>

        <!-- Case info -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px;">
          <tr>
            <td style="border:1px solid #999;padding:6px;"><b>مقدمہ نمبر:</b> ${c.fir_number||''}</td>
            <td style="border:1px solid #999;padding:6px;"><b>مورخہ:</b> ${c.fir_date||''}</td>
            <td style="border:1px solid #999;padding:6px;"><b>جرم:</b> ${c.section_of_law||''} ${c.offence_type||''}</td>
            <td style="border:1px solid #999;padding:6px;"><b>تھانہ:</b> ${o.station||''}</td>
          </tr>
        </table>

        <!-- Main data table (NOT in closing reports — اخراج/عدم پتہ use 3-col table) -->
        ${!isClosing ? `
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#f0f0f0;">
            <th style="border:1px solid #999;padding:6px;">نام و پتہ مدعی و مستغیث</th>
            <th style="border:1px solid #999;padding:6px;">ملزمان جو گرفتار نہ ہوئے</th>
            <th style="border:1px solid #999;padding:6px;">ملزمان زیر حراست</th>
            <th style="border:1px solid #999;padding:6px;">ملزمان بر ضمانت</th>
            <th style="border:1px solid #999;padding:6px;">مال قبضہ پولیس</th>
            <th style="border:1px solid #999;padding:6px;">تفصیل شہادت</th>
          </tr>
          <tr>
            <td contenteditable="true" data-k="madai" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('madai')}</td>
            <td contenteditable="true" data-k="ghair_giraftar" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('ghair_giraftar')}</td>
            <td contenteditable="true" data-k="zer_hirasat" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('zer_hirasat')}</td>
            <td contenteditable="true" data-k="bar_zamanat" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('bar_zamanat')}</td>
            <td contenteditable="true" data-k="mal_qabza" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('mal_qabza')}</td>
            <td contenteditable="true" data-k="shahadat" style="border:1px solid #999;padding:8px;vertical-align:top;">${v('shahadat')}</td>
          </tr>
        </table>` : ''}

        <!-- مختصر حالات مقدمہ (separate — NOT for closing reports) -->
        ${!isClosing ? `
        <div style="margin-top:12px;font-weight:700;">مختصر حالات مقدمہ معہ جرم:</div>
        <div contenteditable="true" data-k="halaat" data-ph="یہاں پر مختصر حالات لکھیں" style="border:1px solid #999;padding:10px;min-height:120px;text-align:justify;margin-top:4px;${v('halaat', boiler)?'':'color:#999;'}" onfocus="if(this.dataset.ph&&!this.innerText.trim()){this.style.color='#000';}" oninput="this.style.color=this.innerText.trim()?'#000':'#999';">${v('halaat', boiler)}</div>
        <style>[data-k="halaat"]:empty:before{content:attr(data-ph);color:#999;}</style>` : ''}

        ${isTatima ? `
        <!-- Tatima: رزلٹ نمبر + checkboxes -->
        <div style="margin-top:10px;">رزلٹ نمبر: <span contenteditable="true" data-k="result_no" style="border-bottom:1px solid #999;min-width:120px;display:inline-block;">${v('result_no')}</span></div>
        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:8px;font-size:13px;">
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" data-pk="t_form" ${v('t_form')?'checked':''}> فارم ہذا/یک</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" data-pk="t_result" ${v('t_result')?'checked':''}> اصل رزلٹ نمبری/یک</label>
          <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" data-pk="t_fir" ${v('t_fir')?'checked':''}> نقل FIR/یک</label>
        </div>` : ''}

        ${isClosing ? `
        <!-- Closing report 3-column 8-row table (اخراج / عدم پتہ) -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px;">
          <tr style="background:#f0f0f0;">
            <th style="border:1px solid #000;padding:6px;width:8%;">نمبر شمار</th>
            <th style="border:1px solid #000;padding:6px;width:30%;">تفصیل</th>
            <th style="border:1px solid #000;padding:6px;width:62%;">قدر</th>
          </tr>
          ${(() => {
            const autoMadai = (c.complainant_name||'') + (c.complainant_address?(' ساکن '+c.complainant_address):'');
            const autoJurm  = (c.section_of_law||'') + ' ' + (c.offence_type||'');
            const rows = [
              ['madai_i','نام وپتہ مدعی و مستغیث', autoMadai],
              ['jurm_i','مختصر کیفیت جرم', autoJurm.trim()],
              ['masruqa_i','تفصیل مال مسروقہ اگر کوئی ہو',''],
              ['namzad_i','تفصیل ملزمان نامزد',''],
              ['giraftar_i','تفصیل ملزمان گرفتار شدہ',''],
              ['raha_i','تفصیل ملزمان رہا شدہ',''],
              ['baramad_i','تفصیل مال برآمدہ مقبوضہ پولیس','']
            ];
            return rows.map((r,i)=>{
              const val = v(r[0], r[2]);
              const bold = (val && String(val).trim()) ? 'font-weight:bold;' : '';
              return `<tr>
                <td style="border:1px solid #000;padding:6px;text-align:center;">${i+1}</td>
                <td style="border:1px solid #000;padding:6px;font-weight:600;">${r[1]}</td>
                <td contenteditable="true" data-k="${r[0]}" oninput="this.style.fontWeight=this.innerText.trim()?'bold':'normal';" style="border:1px solid #000;padding:6px;${bold}">${val}</td>
              </tr>`;
            }).join('');
          })()}
          <tr>
            <td style="border:1px solid #000;padding:8px;text-align:center;vertical-align:top;width:8%;font-weight:bold;">8</td>
            <td style="border:1px solid #000;padding:8px;font-weight:bold;text-align:right;vertical-align:top;width:30%;">مختصر حالات مقدمہ</td>
            <td style="border:1px solid #000;padding:8px;width:62%;">
              <div contenteditable="true" data-k="halaat" data-ph="یہاں پر متن FIR، متن کراس ورژن، تفتیشی وجوہات ${isIkhraj?'اخراج':'عدم پتہ'} لکھیں" style="width:100%;box-sizing:border-box;min-height:120px;direction:rtl;text-align:justify;font-size:15px;${v('halaat')?'':'color:#999;'}" oninput="this.style.color=this.innerText.trim()?'#000':'#999';">${v('halaat')}</div>
            </td>
          </tr>
        </table>
        <style>[data-k="halaat"]:empty:before{content:attr(data-ph);color:#999;}</style>` : ''}

        <!-- تفصیل کاغذات -->
        ${isClosing ? (() => {
          const _sho = (typeof getSHOName==='function'?getSHOName():'');
          const _shoFull = (_sho?_sho+' ':'')+'SI/SHO تھانہ '+(o.station||'صدر ملتان');
          const shoBlock = `<div class="sho-signature-block" style="text-align:right;min-width:220px;">
            <div style="min-height:50px;border-bottom:1px solid #000;margin-bottom:4px;"></div>
            <div class="sho-signature-line" style="font-weight:bold;font-size:14px;">${_shoFull}</div>
            <div style="margin-top:6px;font-size:13px;">تاریخ: _______________</div>
          </div>`;
          return `
        <!-- Heading row: تفصیل کاغذات (right) + SHO block (left), divider below -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:1px solid #000;padding-bottom:4px;margin:14px 0 16px;">
          ${shoBlock}
          <div style="font-weight:bold;font-size:15px;">تفصیل کاغذات:</div>
        </div>
        <!-- Items: one row, underlined labels, blank editable input (no dash) below -->
        <div style="display:flex;justify-content:space-around;align-items:flex-start;flex-wrap:wrap;gap:8px;">
          ${['فارم ہذا','نقل TR','اصل تحریر','نقشہ موقع','اطلاع نامہ مدعی','اصل ضمنی SHO'].map((p,i)=>`
            <div style="display:inline-flex;flex-direction:column;align-items:center;margin:0 8px;text-align:center;">
              <span style="font-size:14px;text-decoration:underline;">${p}</span>
              <input type="text" inputmode="numeric" pattern="[0-9]*" data-k="paper_${i}" value="${v('paper_'+i)}" oninput="_r173Qita(this)"
                style="width:45px;border:none;border-bottom:none;background:transparent;text-align:center;margin-top:4px;font-size:14px;outline:none;color:#000;">
              <span class="qita-label" style="font-size:12px;text-align:center;min-height:16px;color:#555;">${(() => { const n=parseInt(v('paper_'+i)); return n===1?'قطعہ':(n>1?'قطعات':''); })()}</span>
            </div>`).join('')}
        </div>
        <!-- Bottom SHO block (bottom-left, identical structure) -->
        <div style="display:flex;justify-content:flex-start;margin-top:32px;">
          ${shoBlock}
        </div>`;
        })() : `
        <!-- تفصیل کاغذات (non-closing types) -->
        <div style="margin-top:14px;font-weight:700;text-align:right;">تفصیل کاغذات:</div>
        <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:13px;justify-content:center;margin-top:8px;">
          ${['فارم ہذا','نقل FIR','اصل تحریر','فارم ریمانڈ','نقشہ موقع','اطلاع نامہ مدعی','اصل ضمنی SHO'].map((p,i)=>`
            <div style="display:inline-flex;flex-direction:column;align-items:center;margin:0 6px;">
              <span style="text-decoration:underline;">${p}</span>
              <input type="text" inputmode="numeric" pattern="[0-9]*" data-k="paper_${i}" value="${v('paper_'+i)}" oninput="_r173Qita(this)"
                style="width:45px;border:none;border-bottom:1px solid #000;text-align:center;background:transparent;margin-top:4px;font-size:14px;outline:none;">
              <span class="qita-label" style="font-size:11px;min-height:14px;color:#555;">${(() => { const n=parseInt(v('paper_'+i)); return n===1?'قطعہ':(n>1?'قطعات':''); })()}</span>
            </div>`).join('')}
        </div>`}

        <!-- SHO signature — non-closing types only (one line, SHO only) -->
        ${!isClosing ? `
        <div style="margin-top:24px;display:flex;justify-content:flex-start;">
          <div style="border-top:1px solid #333;padding-top:6px;display:flex;flex-direction:row-reverse;gap:8px;align-items:center;font-weight:bold;">
            ${(() => {
              const shoName = (typeof getSHOName === 'function') ? getSHOName() : '';
              const val = v('sho_name', shoName);
              return `<span contenteditable="true" data-k="sho_name" oninput="this.style.fontWeight='bold';" style="min-width:120px;">${val}</span>`;
            })()}
            <span>SI/SHO تھانہ ${o.station||'صدر ملتان'}</span>
          </div>
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

// ── SAVE ──────────────────────────────────────────────────────
function _collectR173() {
  const doc = document.getElementById('r173-doc');
  if (!doc) return {};
  const data = {};
  doc.querySelectorAll('[data-k]').forEach(el => {
    data[el.dataset.k] = (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') ? el.value : el.innerHTML;
  });
  doc.querySelectorAll('[data-pk]').forEach(el => { data[el.dataset.pk] = el.checked; });
  return data;
}

async function _saveR173() {
  const form_data = _collectR173();
  const isTatima = _r173Type === 'tatima_challan';
  const recKey = isTatima ? 'tatima_challan_' + _r173Subtype : _r173Type;
  _r173Records[recKey] = form_data;
  const rec = { case_id: _r173CaseId, report_type: _r173Type, form_data };
  if (isTatima) rec.report_subtype = _r173Subtype;
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    // One record per type (and subtype for tatima) per case
    let q = supabaseClient.from('report_173').select('id').eq('case_id', _r173CaseId).eq('report_type', _r173Type);
    if (isTatima) q = q.eq('report_subtype', _r173Subtype);
    const { data: existing } = await q.maybeSingle();
    if (existing) {
      await supabaseClient.from('report_173').update(rec).eq('id', existing.id);
    } else {
      await supabaseClient.from('report_173').insert(rec);
    }
    try { localStorage.setItem('dio_r173_'+_r173CaseId, JSON.stringify(_r173Records)); } catch(_) {}
    showToast('✅ رپورٹ محفوظ ہو گئی', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── PRINT (only the form) ─────────────────────────────────────
function _printR173() {
  const doc = document.getElementById('r173-doc');
  if (!doc) return;
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>@page{size:A4;margin:12mm}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;font-size:14px;line-height:1.9;color:#000;}
      table{border-collapse:collapse;width:100%;}td,th{border:1px solid #000;padding:6px;}
    </style></head><body>${doc.innerHTML}</body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),300); }
}

// Open report 173 with a specific type pre-selected (from dropdown)
async function openReport173WithType(type) {
  await openReport173(_misalCaseId || (typeof currentCaseId !== 'undefined' ? currentCaseId : null));
  _r173Type = type || 'mukammal';
  _renderR173();
}

// Update قطعہ/قطعات label based on count
function _r173Qita(input) {
  if (!input) return;
  const label = input.parentElement && input.parentElement.querySelector('.qita-label');
  if (!label) return;
  const n = parseInt(input.value);
  label.textContent = n === 1 ? 'قطعہ' : (n > 1 ? 'قطعات' : '');
}
