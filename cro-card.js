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
  const v = (k, def) => (s[k] !== undefined && s[k] !== null && s[k] !== '') ? s[k] : (def || '');
  const photo = a.photo_url || a.photo || '';

  // Rule 2: editable cell — bold ONLY if filled
  const ec = (k, val) => {
    const value = v(k, val);
    const bold = (value && String(value).trim() !== '') ? 'font-weight:bold;' : 'font-weight:normal;';
    return `<td contenteditable="true" data-k="${k}" oninput="_croBoldCell(this)" style="border:1px solid #000;padding:4px;${bold}">${value}</td>`;
  };
  // label cell (always plain)
  const lc = (t) => `<td style="border:1px solid #000;padding:4px;background:#f7f7f7;white-space:nowrap;">${t}</td>`;

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
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

      <!-- ═══ PAGE 1 — طرف الف ═══ -->
      <div class="cro-page" style="max-width:210mm;margin:0 auto 20px;padding:10mm;background:#fff;color:#000;font-size:11px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;">
        <div style="text-align:left;font-size:10px;">طرف الف</div>
        <div style="text-align:center;font-size:15px;font-weight:800;">سٹینڈرڈ کریمینل انڈکس کارڈ</div>
        <div style="text-align:center;font-size:11px;">(برائے جیل)</div>
        <div style="display:flex;justify-content:flex-start;gap:20px;margin-top:4px;font-size:11px;">
          <span>CRO نمبر: <span contenteditable="true" data-k="cro_number" oninput="_croBoldCell(this)" style="border-bottom:1px solid #999;min-width:80px;display:inline-block;${v('cro_number')?'font-weight:bold;':''}">${v('cro_number')}</span></span>
          <span>فوٹوگراف تاریخ: <span contenteditable="true" data-k="cro_date" oninput="_croBoldCell(this)" style="border-bottom:1px solid #999;min-width:80px;display:inline-block;${v('cro_date')?'font-weight:bold;':''}">${v('cro_date')}</span></span>
        </div>

        <!-- 4 photo boxes -->
        <div style="display:flex;gap:6px;margin-top:8px;">
          ${['سامنے مل','سامنے چہرہ','بائیں رخ چہرہ','دائیں رخ چہرہ'].map((lbl,i)=>`
          <div style="flex:1;border:1px solid #000;height:120px;display:flex;align-items:flex-end;justify-content:center;font-size:9px;text-align:center;overflow:hidden;position:relative;">
            ${(i===3 && photo) ? `<img src="${photo}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;">` : ''}
            <span style="position:relative;background:rgba(255,255,255,0.7);padding:1px;">${lbl}<br>یہاں نہ چپاں کریں</span>
          </div>`).join('')}
        </div>

        <div style="margin-top:6px;">متعلقہ رپورٹی پولیس اسٹیشن: <span contenteditable="true" data-k="police_station" oninput="_croBoldCell(this)" style="border-bottom:1px solid #999;min-width:140px;display:inline-block;${v('police_station',o.station)?'font-weight:bold;':''}">${v('police_station', o.station||'')}</span></div>

        <!-- Name row -->
        <table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:11px;">
          <tr>${lc('نام')}${ec('name', a.name||'')}${lc('عرف')}${ec('alias')}${lc('ذات')}${ec('caste')}${lc('قومیت')}${ec('nationality','پاکستانی')}${lc('تعلیم')}${ec('education')}</tr>
          <tr>${lc('والد/شوہر کا نام')}${ec('father_name')}${lc('عرف')}${ec('father_alias')}${lc('تاریخ پیدائش/عمر')}${ec('dob', a.umar||'')}${lc('مستقل پتہ')}${ec('perm_address')}${lc('عارضی پتہ')}${ec('temp_address')}</tr>
        </table>

        <!-- Two columns: right physical / middle crime -->
        <div style="display:flex;gap:6px;margin-top:8px;">
          <!-- Middle crime column -->
          <table style="width:55%;border-collapse:collapse;font-size:10px;">
            <tr>${lc('کیفیت')}${ec('kaifiyat')}</tr>
            <tr>${lc('نوعیت واردات')}${ec('noiyat_wardat')}</tr>
            <tr>${lc('نوعیت مسروقہ')}${ec('noiyat_masruqa')}</tr>
            <tr>${lc('طریقہ واردات')}<td contenteditable="true" data-k="modus" oninput="_croBoldCell(this)" style="border:1px solid #000;padding:4px;min-height:50px;${v('modus')?'font-weight:bold;':''}">${v('modus')}</td></tr>
            <tr>${lc('جسمانی نقص')}${ec('jismani_nuqs')}</tr>
            <tr>${lc('ناگرڈ')}${ec('nagird')}</tr>
            <tr>${lc('اسلحہ واردات')}${ec('aslha_wardat')}</tr>
            <tr>${lc('آنے کی سواری')}${ec('arrival_vehicle')}</tr>
            <tr>${lc('جانے کی سواری')}${ec('depart_vehicle')}</tr>
            <tr>${lc('تفصیل سواری واردات')}<td contenteditable="true" data-k="sawari_detail" oninput="_croBoldCell(this)" style="border:1px solid #000;padding:4px;min-height:40px;${v('sawari_detail')?'font-weight:bold;':''}">${v('sawari_detail')}</td></tr>
            <tr>${lc('دیگر خاص بات')}<td contenteditable="true" data-k="other_notes" oninput="_croBoldCell(this)" style="border:1px solid #000;padding:4px;min-height:40px;${v('other_notes')?'font-weight:bold;':''}">${v('other_notes')}</td></tr>
            <tr>${lc('گینگ کا وزیہ')}${ec('gang')}</tr>
            <tr>${lc('واردات طبہ')}${ec('wardat_taba')}</tr>
            <tr>${lc('جرائم کا نوعیت')}${ec('jarayim')}</tr>
            <tr>${lc('ظاہری شناختی نشانات (1)')}${ec('mark1', a.nishan||'')}</tr>
            <tr>${lc('(2)')}${ec('mark2')}</tr>
          </table>

          <!-- Right physical column -->
          <table style="width:45%;border-collapse:collapse;font-size:10px;">
            <tr>${lc('شناختی کارڈ نمبر')}${ec('cnic', a.cnic||'')}</tr>
            <tr>${lc('جنس')}${ec('gender')}</tr>
            <tr>${lc('جسمانی وضع')}${ec('build', a.jism||'')}</tr>
            <tr>${lc('آواز')}${ec('voice')}</tr>
            <tr>${lc('انداز گفتگو')}${ec('speech')}</tr>
            <tr>${lc('زبان')}${ec('language')}</tr>
            <tr>${lc('وضع قطع')}${ec('waza_qata')}</tr>
            <tr>${lc('پیشن متعارف')}${ec('paishani')}</tr>
            <tr>${lc('عادات')}${ec('habits')}</tr>
            <tr>${lc('لباس (ذریعہ)')}${ec('dress_type')}</tr>
            <tr>${lc('لباس (حیثیت)')}${ec('dress_status')}</tr>
            <tr>${lc('رنگت/چہرہ')}${ec('rang', a.rang||'')}</tr>
            <tr>${lc('بال (رنگ)')}${ec('hair_color')}</tr>
            <tr>${lc('بال (سائز)')}${ec('hair_size')}</tr>
            <tr>${lc('بال (علیہ)')}${ec('hair_type')}</tr>
            <tr>${lc('داڑھی')}${ec('beard')}</tr>
            <tr>${lc('مونچھیں')}${ec('mustache')}</tr>
            <tr>${lc('رخسار')}${ec('cheeks', a.chehra||'')}</tr>
            <tr>${lc('کان')}${ec('ears')}</tr>
            <tr>${lc('آنکھیں (رنگت)')}${ec('eyes_color')}</tr>
            <tr>${lc('آنکھیں (سائز)')}${ec('eyes_size')}</tr>
            <tr>${lc('ناک (علیہ)')}${ec('nose_type')}</tr>
            <tr>${lc('ناک (سائز)')}${ec('nose_size')}</tr>
            <tr>${lc('گردن')}${ec('neck')}</tr>
            <tr>${lc('چھاتی')}${ec('chest')}</tr>
            <tr>${lc('قد')}${ec('qad', a.qad||'')}</tr>
            <tr>${lc('دانت (رنگت/ساخت)')}${ec('teeth')}</tr>
          </table>
        </div>

        <div style="margin-top:8px;font-size:11px;">
          تحقیقی افسر: نام وعہدہ <b>${o.full_name||''} ${o.designation||''}</b> | تھانہ <b>${o.station||''}</b> | موبائل نمبر <b>${o.phone||''}</b>
        </div>
      </div>

      <!-- ═══ PAGE 2 — طرف ب ═══ -->
      <div class="cro-page" style="max-width:210mm;margin:0 auto;padding:10mm;background:#fff;color:#000;font-size:11px;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;">
        <div style="text-align:left;font-size:10px;">طرف ب</div>

        ${_croBackTable('ملزم کا موجودہ سابقہ ریکارڈ', ['نمبر شمار','مقدمہ نمبر','تھانہ','جرم','سزا','رہائی','تاریخ','نتیجہ'], 'prev_record', v)}
        ${_croBackTable('ملزم کے قانونی ریکارڈ', ['نمبر شمار','مقدمہ نمبر','تھانہ','جرم','سزا','رہائی','تاریخ','نتیجہ'], 'legal_record', v)}
        ${_croBackTable('ملاقاتی اشخاص کے کوائف', ['نمبر شمار','نام وپتہ بمعہ سکونت','شناختی کارڈ نمبر','موبائل نمبر','رشتہ/تعلق'], 'visitors', v)}
        ${_croBackTable('شریک جرم کے کوائف', ['نمبر شمار','نام وپتہ بمعہ سکونت','نوعیت (ملاقات/تاریخ/مقام)','CRO نمبر'], 'accomplices', v)}

        <div style="text-align:center;font-weight:600;margin-top:12px;">نشانات انگشت گھمائے ہوئے سادہ یک وقتی</div>
        <table style="width:100%;border-collapse:collapse;font-size:9px;text-align:center;margin-top:4px;">
          <tr>
            ${['دائیں چھوٹی','دائیں انگشتی','دائیں درمیانی','دائیں شہادت','دائیں انگوٹھا'].map(f=>`<td style="border:1px solid #000;height:90px;width:20%;vertical-align:bottom;">${f}</td>`).join('')}
          </tr>
          <tr>
            ${['بائیں چھوٹی','بائیں انگشتی','بائیں درمیانی','بائیں شہادت','بائیں انگوٹھا'].map(f=>`<td style="border:1px solid #000;height:90px;width:20%;vertical-align:bottom;">${f}</td>`).join('')}
          </tr>
        </table>
        <table style="width:100%;border-collapse:collapse;font-size:9px;text-align:center;margin-top:6px;">
          <tr>
            <td style="border:1px solid #000;height:80px;width:25%;vertical-align:bottom;">دائیں چاراں انگلیاں یک وقتی</td>
            <td style="border:1px solid #000;height:80px;width:25%;vertical-align:bottom;">دایاں انگوٹھا</td>
            <td style="border:1px solid #000;height:80px;width:25%;vertical-align:bottom;">بایاں انگوٹھا</td>
            <td style="border:1px solid #000;height:80px;width:25%;vertical-align:bottom;">بائیں چاراں انگلیاں یک وقتی</td>
          </tr>
        </table>

        <div style="margin-top:12px;font-size:11px;">تیار کنندہ کا نام/عہدہ: <span contenteditable="true" data-k="prepared_by" oninput="_croBoldCell(this)" style="border-bottom:1px solid #999;min-width:200px;display:inline-block;${v('prepared_by',(o.full_name||''))?'font-weight:bold;':''}">${v('prepared_by', (o.full_name||'')+' '+(o.designation||''))}</span></div>
      </div>

      </div>
    </div>
  </div>`;
}

// Rule 2: bold cell only when it has content
function _croBoldCell(el) {
  if (!el) return;
  const txt = (el.innerText || el.textContent || '').trim();
  el.style.fontWeight = txt ? 'bold' : 'normal';
}
function _croBackTable(title, cols, key, v) {
  let rows = '';
  for (let i = 0; i < 4; i++) {
    rows += '<tr>' + cols.map((col, ci) => {
      if (ci === 0) return `<td style="border:1px solid #000;padding:4px;text-align:center;width:7%;">${i+1}</td>`;
      const val = v(key+'_'+i+'_'+ci);
      const bold = (val && String(val).trim() !== '') ? 'font-weight:bold;' : '';
      return `<td contenteditable="true" data-k="${key}_${i}_${ci}" oninput="_croBoldCell(this)" style="border:1px solid #000;padding:4px;${bold}">${val}</td>`;
    }).join('') + '</tr>';
  }
  return `
    <div style="margin-top:10px;font-weight:600;text-align:center;">${title}</div>
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
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;font-size:10pt;color:#000;margin:0;}
      table{border-collapse:collapse;width:100%;}td,th{border:1px solid #000;padding:2px 4px;}
      .cro-page{page-break-after:always;box-shadow:none !important;border-radius:0 !important;padding:0 !important;margin:0 !important;}
      .cro-page:last-child{page-break-after:auto;}
      img{max-width:100%;}
    </style></head>
    <body>${doc.innerHTML}</body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w=window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),400); }
}
