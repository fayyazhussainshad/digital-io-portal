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
];

const R173_BOILER = {
  mukammal: 'جناب عالیٰ! مختصر حالات مقدمہ عنوان بالا اس طرح ہیں کہ دوران تفتیش مقدمہ ہذا مکمل ہوا۔ ملزمان کے خلاف کافی شہادت دستیاب ہوئی۔ چالان مکمل مرتب ہوکر ارسالِ خدمت ہے، سماعت فرمائی جائے۔',
  namukammal: 'جناب عالیٰ! مختصر حالات مقدمہ عنوان بالا اس طرح ہیں کہ تفتیش مقدمہ ہذا تاحال نامکمل ہے۔ بعض ملزمان ابھی گرفتار نہ ہوسکے۔ چالان نامکمل مرتب ہوکر ارسالِ خدمت ہے، سماعت فرمائی جائے۔',
  interim: 'جناب عالیٰ! مختصر حالات مقدمہ عنوان بالا اس طرح ہیں کہ تفتیش مقدمہ جاری ہے سردست انٹیرم رپورٹ مرتب ہوکر ارسال خدمت ہے سماعت فرمائی جائے۔',
  ikhraj: 'جناب عالیٰ! پیش آمدہ حالات کی روشنی میں مقدمہ قابل اخراج پایا جاکر مدعیہ کو نتیجہ تفتیش سے آگاہ کرتے ہوئے رپورٹ اخراج مرتب کی گئی ہے جو ارسال خدمت ہے سماعت فرمائی جائے۔',
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
    (data||[]).forEach(r => { _r173Records[r.report_type] = r.form_data || {}; });
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

// ── RENDER ────────────────────────────────────────────────────
function _renderR173() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _r173Case || {};
  const typeName = (R173_TYPES.find(t => t.id === _r173Type) || {}).name || '';
  const saved = _r173Records[_r173Type] || {};
  const v = (k, def) => saved[k] !== undefined ? saved[k] : (def || '');
  const isIkhraj = _r173Type === 'ikhraj';

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Toolbar -->
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <select id="r173-type-sel" onchange="_r173Pick(this.value)" style="padding:6px 10px;border:1px solid var(--border);border-radius:8px;background:var(--bg-card);color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
        ${R173_TYPES.map(t => `<option value="${t.id}" ${t.id===_r173Type?'selected':''}>${t.name}</option>`).join('')}
      </select>
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
        <div style="display:flex;justify-content:space-between;font-weight:700;margin:6px 0;">
          <span>تھانہ <span contenteditable="true" style="border-bottom:1px solid #999;">${o.station||'صدر ملتان'}</span></span>
          <span>ضلع <span contenteditable="true" style="border-bottom:1px solid #999;">${o.district||'ملتان'}</span></span>
        </div>
        <div style="text-align:center;font-size:17px;font-weight:800;margin:10px 0;">فارم رپورٹ ${typeName} زیر دفعہ 173 ض ف</div>

        <!-- Case info -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px;">
          <tr>
            <td style="border:1px solid #999;padding:6px;"><b>مقدمہ نمبر:</b> ${c.fir_number||''}</td>
            <td style="border:1px solid #999;padding:6px;"><b>مورخہ:</b> ${c.fir_date||''}</td>
            <td style="border:1px solid #999;padding:6px;"><b>جرم:</b> ${c.section_of_law||''} ${c.offence_type||''}</td>
            <td style="border:1px solid #999;padding:6px;"><b>تھانہ:</b> ${o.station||''}</td>
          </tr>
        </table>

        <!-- Main data table -->
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
        </table>

        <!-- مختصر حالات مقدمہ -->
        <div style="margin-top:12px;font-weight:700;">مختصر حالات مقدمہ معہ جرم:</div>
        <div contenteditable="true" data-k="halaat" style="border:1px solid #999;padding:10px;min-height:120px;text-align:justify;margin-top:4px;">${v('halaat', R173_BOILER[_r173Type]||'')}</div>

        ${isIkhraj ? `
        <!-- Ikhraj extra numbered table -->
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:12px;">
          ${[['madai_i','نام وپتہ مدعی و مستغیث'],['jurm_i','مختصر کیفیت جرم'],['masruqa_i','تفصیل مال مسروقہ اگر کوئی ہو'],['namzad_i','تفصیل ملزمان نامزد'],['giraftar_i','تفصیل ملزمان گرفتار شدہ'],['raha_i','تفصیل ملزمان رہا شدہ'],['baramad_i','تفصیل مال برآمدہ مقبوضہ پولیس']].map((r,i)=>`
          <tr><td style="border:1px solid #999;padding:6px;width:30%;font-weight:600;background:#f9f9f9;">${i+1}. ${r[1]}</td><td contenteditable="true" data-k="${r[0]}" style="border:1px solid #999;padding:6px;">${v(r[0])}</td></tr>`).join('')}
        </table>` : ''}

        <!-- Footer: papers checklist -->
        <div style="margin-top:14px;font-weight:700;">تفصیل کاغذات:</div>
        <div style="display:flex;flex-wrap:wrap;gap:14px;margin-top:6px;font-size:13px;">
          ${['فارم ہذا','نقل FIR','اصل تحریر','فارم ریمانڈ','نقشہ موقع','اطلاع نامہ مدعی','اصل ضمنی SHO'].map((p,i)=>`
            <label style="display:flex;align-items:center;gap:4px;"><input type="checkbox" data-pk="paper_${i}" ${v('paper_'+i)?'checked':''}> ${p}</label>`).join('')}
        </div>

        <!-- Officer signature -->
        <div style="margin-top:24px;text-align:left;">
          <div style="border-top:1px solid #333;display:inline-block;padding-top:4px;">
            ${o.full_name||''}<br>${o.designation||''} ${o.station||''}
          </div>
        </div>

      </div>
    </div>
  </div>`;
}

// ── SAVE ──────────────────────────────────────────────────────
function _collectR173() {
  const doc = document.getElementById('r173-doc');
  if (!doc) return {};
  const data = {};
  doc.querySelectorAll('[data-k]').forEach(el => { data[el.dataset.k] = el.innerHTML; });
  doc.querySelectorAll('[data-pk]').forEach(el => { data[el.dataset.pk] = el.checked; });
  return data;
}

async function _saveR173() {
  const form_data = _collectR173();
  _r173Records[_r173Type] = form_data;
  const rec = { case_id: _r173CaseId, report_type: _r173Type, form_data };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    // One record per type per case — check existing
    const { data: existing } = await supabaseClient.from('report_173').select('id').eq('case_id', _r173CaseId).eq('report_type', _r173Type).maybeSingle();
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
