/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — CRO کارڈ (Standard Criminal Index Card)
   2-sided official form, auto-filled from case + accused data
   ═══════════════════════════════════════════════════════════ */

let _croCaseId = null;
let _croCase = null;
let _croAccused = null;
let _croSaved = null;

let _croAllAccused = [];
let _croAllCards = {};   // accused_id -> saved card
let _croDirty = false;

async function openCroCard(caseId) {
  _croCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
            || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _croCaseId) {
    try { _croCase = await getCase(_croCaseId); } catch(_) { _croCase = null; }
  }
  await _loadCroList();
  _renderCroList();
}

async function _loadCroList() {
  // Load ALL accused (both fir + cross_version)
  try {
    const { data } = await supabaseClient.from('case_accused').select('*')
      .eq('case_id', _croCaseId).order('created_at',{ascending:true});
    _croAllAccused = data || [];
  } catch(_) {
    try { _croAllAccused = JSON.parse(localStorage.getItem('dio_accused_'+_croCaseId)||'[]'); } catch(_2) { _croAllAccused = []; }
  }
  // Load ALL saved CRO cards for this case (keyed by accused_id)
  _croAllCards = {};
  try {
    const { data } = await supabaseClient.from('cro_cards').select('*').eq('case_id', _croCaseId);
    (data||[]).forEach(card => { if (card.accused_id) _croAllCards[card.accused_id] = card; });
  } catch(_) {}
}

function _renderCroList() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;

  if (!_croAllAccused.length) {
    area.innerHTML = `<div style="padding:40px 20px;text-align:center;direction:rtl;color:var(--text-muted);">
      <div style="font-size:40px;margin-bottom:10px;">👤</div>
      <div style="font-size:16px;font-family:'Jameel Noori Nastaleeq',serif;">ملزمان درج نہیں — پہلے ملزمان شامل کریں</div>
    </div>`;
    return;
  }

  const rows = _croAllAccused.map(a => {
    const hasCard = !!_croAllCards[a.id];
    const typeName = (a.accused_type === 'cross_version') ? 'کراس ورژن' : 'FIR';
    const typeColor = (a.accused_type === 'cross_version') ? 'var(--amber)' : 'var(--accent)';
    return `
    <div onclick="_openCroForAccused('${a.id}')" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer;direction:rtl;"
      onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
      <span style="font-size:20px;">${hasCard ? '✅' : '➕'}</span>
      <div style="flex:1;">
        <div style="font-weight:700;font-size:16px;font-family:'Jameel Noori Nastaleeq',serif;">${a.name||'—'}</div>
        <div style="font-size:13px;color:var(--text-muted);">${a.cnic||'بدون شناختی کارڈ'} · <span style="color:${typeColor};">${typeName}</span></div>
      </div>
      <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();_openCroForAccused('${a.id}')">CRO کارڈ دیکھیں/بنائیں</button>
    </div>`;
  }).join('');

  area.innerHTML = `
  <div style="padding:14px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="font-size:18px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;border-bottom:2px solid var(--accent);padding-bottom:8px;margin-bottom:14px;color:var(--accent);">CRO کارڈ — ملزمان کی فہرست</div>
    ${rows}
  </div>`;
}

async function _openCroForAccused(accusedId) {
  _croAccused = _croAllAccused.find(a => a.id === accusedId) || null;
  _croSaved = _croAllCards[accusedId] || null;
  _croDirty = false;
  _renderCro();
}

function _croBackToList() {
  if (_croDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ کیا واپس جانا چاہتے ہیں؟')) return;
  _renderCroList();
}

async function _loadCro() {
  if (!navigator.onLine) {
    try { _croSaved = JSON.parse(localStorage.getItem('dio_cro_'+_croCaseId)||'null'); } catch(_) { _croSaved=null; }
    return;
  }
  try {
    const { data } = await supabaseClient.from('cro_cards').select('*')
      .eq('case_id', _croCaseId).order('created_at',{ascending:false}).limit(1).maybeSingle();
    _croSaved = data || null;
    try { localStorage.setItem('dio_cro_'+_croCaseId, JSON.stringify(_croSaved)); } catch(_) {}
  } catch(_) {
    try { _croSaved = JSON.parse(localStorage.getItem('dio_cro_'+_croCaseId)||'null'); } catch(_2) { _croSaved=null; }
  }
}

function _renderCro() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _croCase || {};
  const a = _croAccused || {};
  const s = (_croSaved && _croSaved.form_data) ? _croSaved.form_data : {};
  const v = (k, def) => (s[k] !== undefined && s[k] !== null) ? s[k] : (def || '');
  const photo = a.photo_url || a.photo || '';

  const cell = (k, val) => `<td contenteditable="true" data-k="${k}" style="border:1px solid #000;padding:5px;min-width:60px;">${v(k, val)}</td>`;
  const lbl = (t) => `<td style="border:1px solid #000;padding:5px;background:#f0f0f0;font-weight:600;white-space:nowrap;">${t}</td>`;

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Toolbar -->
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <button class="btn btn-secondary btn-sm" onclick="_croBackToList()">← واپس فہرست</button>
      <div style="font-weight:700;font-size:14px;font-family:'Jameel Noori Nastaleeq',serif;">CRO کارڈ — ${a.name||'ملزم'}</div>
      <div style="margin-right:auto;display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="_saveCro()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary btn-sm" onclick="_printCro()">🖨️ پرنٹ کریں (دونوں طرف)</button>
      </div>
    </div>

    <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-tertiary);">
      <div id="cro-doc" oninput="_croDirty=true" style="font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;">

        <!-- ═══ PAGE 1 — FRONT ═══ -->
        <div class="cro-page" style="max-width:210mm;margin:0 auto 20px;padding:12mm;background:#fff;color:#000;font-size:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div style="border:1px solid #000;width:90px;height:110px;display:flex;align-items:center;justify-content:center;overflow:hidden;">
              ${photo ? `<img src="${photo}" style="width:100%;height:100%;object-fit:cover;">` : '<span style="font-size:10px;color:#999;">تصویر</span>'}
            </div>
            <div style="text-align:center;flex:1;">
              <div style="font-size:16px;font-weight:800;">سٹینڈرڈ کریمینل انڈکس کارڈ</div>
              <div style="font-size:12px;">(برائے ضلع ${o.district||'ملتان'})</div>
            </div>
            <div style="text-align:left;font-size:11px;">
              <div>CRO نمبر: <span contenteditable="true" data-k="cro_number" style="border-bottom:1px solid #999;min-width:60px;display:inline-block;">${v('cro_number')}</span></div>
              <div>تاریخ: <span contenteditable="true" data-k="cro_date" style="border-bottom:1px solid #999;min-width:60px;display:inline-block;">${v('cro_date')}</span></div>
            </div>
          </div>

          <!-- Personal details -->
          <table style="width:100%;border-collapse:collapse;margin-top:10px;font-size:12px;">
            <tr>${lbl('نام')}${cell('name', a.name||'')}${lbl('عرف')}${cell('alias')}${lbl('قومیت')}${cell('nationality','پاکستانی')}</tr>
            <tr>${lbl('والد/شوہر کا نام')}${cell('father_name')}${lbl('ذات')}${cell('caste')}${lbl('تعلیم')}${cell('education')}</tr>
            <tr>${lbl('مستقل پتہ')}${cell('perm_address')}${lbl('عارضی پتہ')}${cell('temp_address')}${lbl('پیشہ')}${cell('pesha', a.pesha||'')}</tr>
            <tr>${lbl('شناختی کارڈ نمبر')}${cell('cnic', a.cnic||'')}${lbl('موبائل')}${cell('mobile', a.mobile||'')}${lbl('عمر')}${cell('umar', a.umar||'')}</tr>
          </table>

          <!-- Physical description (two columns) -->
          <div style="display:flex;gap:10px;margin-top:10px;">
            <table style="width:50%;border-collapse:collapse;font-size:11px;">
              <tr>${lbl('رنگت/چہرہ')}${cell('rang', a.rang||'')}</tr>
              <tr>${lbl('قد')}${cell('qad', a.qad||'')}</tr>
              <tr>${lbl('جسم')}${cell('jism', a.jism||'')}</tr>
              <tr>${lbl('بال (رنگ)')}${cell('hair_color')}</tr>
              <tr>${lbl('داڑھی')}${cell('beard')}</tr>
              <tr>${lbl('مونچھیں')}${cell('mustache')}</tr>
              <tr>${lbl('آنکھیں')}${cell('eyes')}</tr>
              <tr>${lbl('ناک')}${cell('nose')}</tr>
            </table>
            <table style="width:50%;border-collapse:collapse;font-size:11px;">
              <tr>${lbl('زبان')}${cell('language','اردو/پنجابی')}</tr>
              <tr>${lbl('آواز')}${cell('voice')}</tr>
              <tr>${lbl('اندازِ گفتگو')}${cell('speech')}</tr>
              <tr>${lbl('دانت')}${cell('teeth')}</tr>
              <tr>${lbl('کان')}${cell('ears')}</tr>
              <tr>${lbl('گردن')}${cell('neck')}</tr>
              <tr>${lbl('وضع قطع')}${cell('build')}</tr>
              <tr>${lbl('لباس')}${cell('dress')}</tr>
            </table>
          </div>

          <!-- طریقہ واردات -->
          <div style="margin-top:10px;font-weight:600;">طریقہ واردات:</div>
          <div contenteditable="true" data-k="modus" style="border:1px solid #000;min-height:50px;padding:6px;">${v('modus')}</div>

          <!-- ملکیت واردات / سواری -->
          <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:11px;">
            <tr>${lbl('آنے کی سواری')}${cell('arrival_vehicle')}${lbl('جانے کی سواری')}${cell('depart_vehicle')}</tr>
          </table>

          <!-- ظاہری شناختی نشانات -->
          <div style="margin-top:10px;font-weight:600;">ظاہری شناختی نشانات:</div>
          <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <tr>${lbl('(1)')}${cell('mark1', a.nishan||'')}${lbl('(2)')}${cell('mark2')}</tr>
          </table>

          <div style="margin-top:8px;font-weight:600;">دیگر خاص بات:</div>
          <div contenteditable="true" data-k="other_notes" style="border:1px solid #000;min-height:40px;padding:6px;">${v('other_notes')}</div>

          <!-- Officer -->
          <div style="margin-top:12px;font-size:11px;">
            تحقیقی افسر: <b>${o.full_name||''}</b> | عہدہ: <b>${o.designation||''}</b> | تھانہ: <b>${o.station||''}</b> | موبائل: <b>${o.phone||''}</b>
          </div>
        </div>

        <!-- ═══ PAGE 2 — BACK ═══ -->
        <div class="cro-page" style="max-width:210mm;margin:0 auto;padding:12mm;background:#fff;color:#000;font-size:12px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;">
          <div style="text-align:center;font-size:14px;font-weight:800;margin-bottom:10px;">CRO کارڈ — طرف ب</div>

          ${_croBackTable('موجودہ سابقہ ریکارڈ', ['نمبر شمار','مقدمہ نمبر','تھانہ','جرم','سزا','نتیجہ'], 'prev_record', v)}
          ${_croBackTable('قانونی ریکارڈ', ['نمبر شمار','مقدمہ نمبر','تھانہ','جرم','سزا','نتیجہ'], 'legal_record', v)}
          ${_croBackTable('ملاقاتی اشخاص کے کوائف', ['نمبر شمار','نام وپتہ بمعہ شہرت','رابطہ','تعلق'], 'visitors', v)}
          ${_croBackTable('شریک جرم کے کوائف', ['نمبر شمار','نام وپتہ بمعہ شہرت','نوعیت','CRO نمبر'], 'accomplices', v)}

          <!-- Fingerprints -->
          <div style="margin-top:12px;font-weight:600;">نشانات انگشت:</div>
          <table style="width:100%;border-collapse:collapse;font-size:9px;text-align:center;margin-top:4px;">
            <tr>
              ${['دائیں انگوٹھا','دائیں شہادت','دائیں درمیانی','دائیں انگشتی','دائیں چھنگلی'].map(f=>`<td style="border:1px solid #000;height:70px;width:20%;vertical-align:bottom;">${f}</td>`).join('')}
            </tr>
            <tr>
              ${['بائیں انگوٹھا','بائیں شہادت','بائیں درمیانی','بائیں انگشتی','بائیں چھنگلی'].map(f=>`<td style="border:1px solid #000;height:70px;width:20%;vertical-align:bottom;">${f}</td>`).join('')}
            </tr>
          </table>
          <table style="width:100%;border-collapse:collapse;font-size:9px;text-align:center;margin-top:6px;">
            <tr>
              <td style="border:1px solid #000;height:60px;width:25%;vertical-align:bottom;">دائیں انگلیاں یک وقتی</td>
              <td style="border:1px solid #000;height:60px;width:25%;vertical-align:bottom;">دائیں انگوٹھا</td>
              <td style="border:1px solid #000;height:60px;width:25%;vertical-align:bottom;">بائیں انگوٹھا</td>
              <td style="border:1px solid #000;height:60px;width:25%;vertical-align:bottom;">بائیں انگلیاں یک وقتی</td>
            </tr>
          </table>

          <div style="margin-top:14px;font-size:11px;">تیار کنندہ کا نام/عہدہ: <span contenteditable="true" data-k="prepared_by" style="border-bottom:1px solid #999;min-width:200px;display:inline-block;">${v('prepared_by', (o.full_name||'')+' '+(o.designation||''))}</span></div>
        </div>

      </div>
    </div>
  </div>`;
}

// Back-side editable table builder (4 rows)
function _croBackTable(title, cols, key, v) {
  let rows = '';
  for (let i = 0; i < 4; i++) {
    rows += '<tr>' + cols.map((col, ci) => {
      if (ci === 0) return `<td style="border:1px solid #000;padding:4px;text-align:center;width:8%;">${i+1}</td>`;
      return `<td contenteditable="true" data-k="${key}_${i}_${ci}" style="border:1px solid #000;padding:4px;">${v(key+'_'+i+'_'+ci)}</td>`;
    }).join('') + '</tr>';
  }
  return `
    <div style="margin-top:10px;font-weight:600;">${title}:</div>
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:4px;">
      <tr style="background:#f0f0f0;">${cols.map(c=>`<th style="border:1px solid #000;padding:4px;">${c}</th>`).join('')}</tr>
      ${rows}
    </table>`;
}

function _collectCro() {
  const doc = document.getElementById('cro-doc');
  const data = {};
  if (doc) doc.querySelectorAll('[data-k]').forEach(el => { data[el.dataset.k] = el.innerHTML; });
  return data;
}

async function _saveCro() {
  const form_data = _collectCro();
  const rec = {
    case_id: _croCaseId,
    accused_id: (_croAccused && _croAccused.id) ? _croAccused.id : null,
    cro_number: form_data.cro_number || null,
    form_data,
  };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    if (_croSaved && _croSaved.id) {
      await supabaseClient.from('cro_cards').update(rec).eq('id', _croSaved.id);
    } else {
      const { data } = await supabaseClient.from('cro_cards').insert(rec).select().single();
      _croSaved = data || { ...rec, id:'tmp_'+Date.now() };
    }
    try { localStorage.setItem('dio_cro_'+_croCaseId, JSON.stringify(_croSaved)); } catch(_) {}
    if (_croAccused && _croAccused.id) _croAllCards[_croAccused.id] = _croSaved;
    _croDirty = false;
    showToast('✅ CRO کارڈ محفوظ ہو گیا', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

function _printCro() {
  const doc = document.getElementById('cro-doc');
  if (!doc) return;
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>@page{size:A4;margin:8mm}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;font-size:11pt;color:#000;margin:0;}
      table{border-collapse:collapse;width:100%;}td,th{border:1px solid #000;}
      .cro-page{page-break-after:always;box-shadow:none !important;border-radius:0 !important;padding:0 !important;margin:0 !important;}
      .cro-page:last-child{page-break-after:auto;}
      img{max-width:100%;}
    </style></head>
    <body>${doc.innerHTML}</body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w=window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),400); }
}
