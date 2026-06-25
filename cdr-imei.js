/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — CDR / IMEI REQUEST FORM
   Auto-fills IMEI & SIM numbers from case mobile-theft data.
   ═══════════════════════════════════════════════════════════ */

let _cdrICaseId = null;
let _cdrICase = null;
let _cdrISaved = null;

async function openCdrImei(caseId) {
  _cdrICaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
            || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _cdrICaseId) {
    try { _cdrICase = await getCase(_cdrICaseId); } catch(_) { _cdrICase = null; }
  }
  await _loadCdr();
  _renderCdr();
}

async function _loadCdr() {
  if (!navigator.onLine) {
    try { _cdrISaved = JSON.parse(localStorage.getItem('dio_cdr_'+_cdrICaseId)||'null'); } catch(_) { _cdrISaved=null; }
    return;
  }
  try {
    const { data } = await supabaseClient.from('cdr_imei_requests').select('*').eq('case_id', _cdrICaseId).order('created_at',{ascending:false}).limit(1).maybeSingle();
    _cdrISaved = data || null;
    try { localStorage.setItem('dio_cdr_'+_cdrICaseId, JSON.stringify(_cdrISaved)); } catch(_) {}
  } catch(_) {
    try { _cdrISaved = JSON.parse(localStorage.getItem('dio_cdr_'+_cdrICaseId)||'null'); } catch(_2) { _cdrISaved=null; }
  }
}

// Build initial rows — auto-fill from case IMEI & cell numbers
function _cdrInitialRows() {
  const c = _cdrICase || {};
  const rows = [];
  // IMEI numbers
  if (c.theft_imei) {
    String(c.theft_imei).split(/[،,]/).map(s=>s.trim()).filter(Boolean).forEach(imei => {
      rows.push({ req: imei, model: c.theft_brand||'', from:'', to:'' });
    });
  }
  // Cell / SIM numbers
  if (c.theft_cell) {
    String(c.theft_cell).split(/[،,]/).map(s=>s.trim()).filter(Boolean).forEach(cell => {
      rows.push({ req: cell, model:'', from:'', to:'' });
    });
  }
  // Pad to 9 rows
  while (rows.length < 12) rows.push({ req:'', model:'', from:'', to:'' });
  return rows;
}

function _renderCdr() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _cdrICase || {};
  const s = _cdrISaved || {};
  const rows = (s.rows && s.rows.length) ? s.rows : _cdrInitialRows();
  const v = (k, def) => (s[k] !== undefined && s[k] !== null) ? s[k] : (def||'');
  // Today in dd/mm/yyyy for auto-fill
  const _t = new Date();
  const _today = `${String(_t.getDate()).padStart(2,'0')}/${String(_t.getMonth()+1).padStart(2,'0')}/${_t.getFullYear()}`;

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Toolbar -->
    <div style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <button class="btn btn-secondary btn-sm" onclick="_cdrAddRow()">➕ قطار شامل کریں</button>
      <div style="margin-right:auto;display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="_saveCdr()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary btn-sm" onclick="_printCdr()">🖨️ پرنٹ کریں</button>
        <button class="btn btn-secondary btn-sm" onclick="_newCdr()">📄 نئی درخواست</button>
      </div>
    </div>

    <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-tertiary);">
      <div id="cdr-doc" style="max-width:210mm;margin:0 auto;padding:14mm;background:#fff;color:#111;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:18.67px;line-height:1.8;direction:rtl;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;">

        <!-- Header -->
        <div style="display:flex;justify-content:space-between;">
          <span>تھانہ: <b contenteditable="true">${o.station||'صدر ملتان'}</b></span>
          <span>ڈائری نمبر: <span contenteditable="true" data-k="diary_number" style="border-bottom:1px solid #999;min-width:200px;display:inline-block;">${v('diary_number')}</span> مورخہ: <span contenteditable="true" data-k="diary_date" style="border-bottom:1px solid #999;min-width:140px;display:inline-block;">${v('diary_date')}</span></span>
          <span>ضلع: <b contenteditable="true">${o.district||'ملتان'}</b></span>
        </div>
        <div style="margin-top:6px;">مقدمہ نمبر: <b>${c.fir_number||''}</b> &nbsp; مورخہ: <b>${c.fir_date||''}</b> &nbsp; بجرم: <b>${c.section_of_law||''} ${c.offence_type||''}</b> ت پ تھانہ ${o.station||'صدر ملتان'}</div>
        <div style="margin-top:4px;display:flex;justify-content:space-between;"><span>تاریخ/وقت وقوعہ: <b>${c.occurrence_date||''}</b></span><span style="min-width:40%;text-align:right;">مقام وقوعہ: <b>${c.occurrence_place||''}</b></span></div>
        <div style="margin-top:4px;display:flex;justify-content:space-between;"><span>تفتیشی آفیسر: <b>${(() => {
          let rank = o.rank || o.designation || '';
          let nm = o.full_name || '';
          if (!nm) { try { const p = JSON.parse(localStorage.getItem('officer_profile')||localStorage.getItem('dio_officer_cache')||'{}'); rank = rank||p.rank||p.designation||''; nm = p.name||p.full_name||''; } catch(_) {} }
          return [rank, nm].filter(Boolean).join(' ');
        })()}</b></span><span style="min-width:40%;text-align:right;">موبائل نمبر: <b>${o.phone||''}</b></span></div>

        <!-- Main table -->
        <table style="width:100%;border-collapse:collapse;font-size:18.67px;margin-top:10px;" id="cdr-table">
          <thead><tr style="background:#f0f0f0;">
            <th style="border:1px solid #999;padding:8px 6px;width:8%;font-size:18.67px;font-weight:bold;text-align:center;vertical-align:middle;">نمبر شمار</th>
            <th style="border:1px solid #999;padding:8px 6px;font-size:18.67px;font-weight:bold;text-align:center;vertical-align:middle;">مطلوبہ درکار CDR/IMEI</th>
            <th style="border:1px solid #999;padding:8px 6px;font-size:18.67px;font-weight:bold;text-align:center;vertical-align:middle;">ماڈل فون (اگر معلوم ہو)</th>
            <th style="border:1px solid #999;padding:8px 6px;font-size:18.67px;font-weight:bold;text-align:center;vertical-align:middle;">ڈیٹا کی ابتدائی تاریخ</th>
            <th style="border:1px solid #999;padding:8px 6px;font-size:18.67px;font-weight:bold;text-align:center;vertical-align:middle;">ڈیٹا کی آخری تاریخ</th>
          </tr></thead>
          <tbody>
            ${rows.map((r,i)=>`<tr>
              <td style="border:1px solid #999;padding:5px;text-align:center;">${i+1}</td>
              <td contenteditable="true" data-c="req" style="border:1px solid #999;padding:8px 6px;font-size:18.67px;text-align:center;vertical-align:middle;" dir="ltr">${r.req||''}</td>
              <td contenteditable="true" data-c="model" style="border:1px solid #999;padding:8px 6px;font-size:18.67px;text-align:center;vertical-align:middle;">${r.model||''}</td>
              <td contenteditable="true" data-c="from" style="border:1px solid #999;padding:8px 6px;font-size:18.67px;text-align:center;vertical-align:middle;" dir="ltr">${r.from||''}</td>
              <td contenteditable="true" data-c="to" style="border:1px solid #999;padding:8px 6px;font-size:18.67px;text-align:center;vertical-align:middle;" dir="ltr">${r.to||''}</td>
            </tr>`).join('')}
          </tbody>
        </table>

        <!-- Summary footer -->
        <table style="width:100%;border-collapse:collapse;font-size:18.67px;margin-top:10px;">
          <tr style="background:#f0f0f0;">
            <th style="border:1px solid #999;padding:5px;">ٹوٹل تعداد</th>
            <th style="border:1px solid #999;padding:5px;">تعداد سم نمبرز</th>
            <th style="border:1px solid #999;padding:5px;">موبائل سیٹ نمبرز</th>
            <th style="border:1px solid #999;padding:5px;">سم لوکیشن</th>
            <th style="border:1px solid #999;padding:5px;">سم ملکیت</th>
            <th style="border:1px solid #999;padding:5px;">دستخط درخواست کنندہ/تفتیشی آفیسر معہ تاریخ</th>
          </tr>
          <tr>
            <td style="border:1px solid #999;padding:5px;text-align:center;" id="cdr-total">${rows.filter(r=>r.req).length}</td>
            <td style="border:1px solid #999;padding:5px;text-align:center;" id="cdr-sim-count">0</td>
            <td style="border:1px solid #999;padding:5px;text-align:center;" id="cdr-imei-count">0</td>
            <td style="border:1px solid #999;padding:5px;text-align:center;">
              <label><input type="radio" name="sim_loc" data-pk="sim_location" value="yes" ${v('sim_location')==='yes'?'checked':''}>YES</label>
              <label><input type="radio" name="sim_loc" value="no" ${v('sim_location')==='no'?'checked':''}>NO</label>
            </td>
            <td style="border:1px solid #999;padding:5px;text-align:center;">
              <label><input type="radio" name="sim_own" data-pk="sim_ownership" value="yes" ${v('sim_ownership')==='yes'?'checked':''}>YES</label>
              <label><input type="radio" name="sim_own" value="no" ${v('sim_ownership')==='no'?'checked':''}>NO</label>
            </td>
            <td contenteditable="true" data-k="signature" style="border:1px solid #999;padding:5px;">${v('signature')}</td>
          </tr>
        </table>
        <div style="font-size:11px;margin-top:4px;color:#444;">اس کیلئے یہی فارم علیحدہ سے بمعہ FIR لف کریں</div>

        <!-- Notes -->
        <div style="margin-top:12px;font-size:16px;line-height:1.7;color:#333;border:1px solid #ccc;padding:8px;">
          <div>۱۔ موبائل فون کال ڈیٹا ریکارڈ صرف FIR یا FIR سے متعلقہ ہونے کی صورت میں فراہم کیا جائے گا۔</div>
          <div>۲۔ اگر CDR's/IMEI's کا اندراج FIR میں نہ ہو تو ضمنی میں اندراج کریں۔</div>
          <div style="display:flex;align-items:center;flex-direction:row;gap:14px;justify-content:flex-start;flex-wrap:wrap;">
            <span style="display:flex;align-items:center;gap:4px;">ضمنی نمبر <span contenteditable="true" data-k="zimni_number" style="min-width:70px;display:inline-block;${v('zimni_number')?'font-weight:bold;':''}">${v('zimni_number')}</span></span>
            <span style="display:flex;align-items:center;gap:6px;">تاریخ <span contenteditable="true" data-k="zimni_date" style="min-width:90px;display:inline-block;font-weight:bold;margin-right:4px;">${v('zimni_date', _today)}</span></span>
            <span style="display:flex;align-items:center;gap:6px;">${(() => {
              let rank = o.rank || o.designation || '';
              let nm = o.full_name || '';
              if (!nm) { try { const p = JSON.parse(localStorage.getItem('officer_profile')||localStorage.getItem('dio_officer_cache')||'{}'); rank = rank||p.rank||p.designation||''; nm = p.name||p.full_name||''; } catch(_) {} }
              const fullTitle = [rank, nm].filter(Boolean).join(' ');
              if (fullTitle) {
                // مرتبہ + name, both normal weight, no line
                return `<span>مرتبہ</span> <span>${fullTitle}</span>`;
              }
              return `مرتبہ <span contenteditable="true" data-k="zimni_marba" style="min-width:90px;display:inline-block;">${v('zimni_marba')}</span>`;
            })()}</span>
            <span style="white-space:nowrap;">(کاپی ضمنی ہمراہ بھجوائیں)</span>
          </div>
          <div>۴۔ CDR کے غلط استعمال کی صورت میں ذمہ دار افسر کے خلاف سخت محکمانہ کاروائی کی جائیگی۔</div>
          <div>۵۔ CDR کے ذریعے کیس ٹریس ہونے/ملزمان/اشتہاری پکڑے جانے پر IT آفس (موبائل ٹریکنگ سیل ملتان) کو بھی رپورٹ ارسال کی جائے۔</div>
        </div>

        <!-- Forwarding (DSP right, SHO left, signature gap, all centered) -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-top:24px;gap:20px;">
          <div style="flex:1;text-align:center;">
            <div style="font-weight:600;text-align:center;">Forwarded Please</div>
            <div style="height:60px;"></div>
            <div style="font-weight:bold;text-align:center;">${(typeof getDSPName==='function'?getDSPName():'')}</div>
            <div style="border-top:1px solid #333;width:70%;margin:0 auto;padding-top:6px;text-align:center;">سرکل DSP/SDPO</div>
          </div>
          <div style="flex:1;text-align:center;">
            <div style="font-weight:600;text-align:center;">Forwarded</div>
            <div style="height:60px;"></div>
            <div style="font-weight:bold;text-align:center;">${(typeof getSHOName==='function'?getSHOName():'')}</div>
            <div style="border-top:1px solid #333;width:70%;margin:0 auto;padding-top:6px;text-align:center;">SHO تھانہ ${o.station||'صدر ملتان'}</div>
          </div>
        </div>

      </div>
    </div>
  </div>`;

  setTimeout(_cdrUpdateCounts, 50);
}

function _cdrAddRow() {
  const tbody = document.querySelector('#cdr-table tbody');
  if (!tbody) return;
  const i = tbody.children.length;
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="border:1px solid #999;padding:5px;text-align:center;">${i+1}</td>
    <td contenteditable="true" data-c="req" style="border:1px solid #999;padding:8px 6px;font-size:18.67px;text-align:center;vertical-align:middle;" dir="ltr"></td>
    <td contenteditable="true" data-c="model" style="border:1px solid #999;padding:8px 6px;font-size:18.67px;text-align:center;vertical-align:middle;"></td>
    <td contenteditable="true" data-c="from" style="border:1px solid #999;padding:8px 6px;font-size:18.67px;text-align:center;vertical-align:middle;" dir="ltr"></td>
    <td contenteditable="true" data-c="to" style="border:1px solid #999;padding:8px 6px;font-size:18.67px;text-align:center;vertical-align:middle;" dir="ltr"></td>`;
  tbody.appendChild(tr);
}

// Count totals: IMEI = 15 digits, SIM = phone-like
function _cdrUpdateCounts() {
  const tbody = document.querySelector('#cdr-table tbody');
  if (!tbody) return;
  let total=0, sim=0, imei=0;
  tbody.querySelectorAll('tr').forEach(tr => {
    const req = (tr.querySelector('[data-c="req"]')?.innerText||'').replace(/\D/g,'');
    if (req) {
      total++;
      if (req.length === 15) imei++;
      else if (req.length >= 10 && req.length <= 12) sim++;
    }
  });
  const t=document.getElementById('cdr-total'); if(t)t.textContent=total;
  const s=document.getElementById('cdr-sim-count'); if(s)s.textContent=sim;
  const im=document.getElementById('cdr-imei-count'); if(im)im.textContent=imei;
}

function _collectCdr() {
  const doc = document.getElementById('cdr-doc');
  const data = { rows: [] };
  doc.querySelectorAll('#cdr-table tbody tr').forEach(tr => {
    data.rows.push({
      req: tr.querySelector('[data-c="req"]')?.innerText.trim()||'',
      model: tr.querySelector('[data-c="model"]')?.innerText.trim()||'',
      from: tr.querySelector('[data-c="from"]')?.innerText.trim()||'',
      to: tr.querySelector('[data-c="to"]')?.innerText.trim()||'',
    });
  });
  doc.querySelectorAll('[data-k]').forEach(el => { data[el.dataset.k] = el.innerText.trim(); });
  doc.querySelectorAll('input[type="radio"]:checked[data-pk]').forEach(el => { data[el.dataset.pk] = el.value; });
  return data;
}

async function _saveCdr() {
  _cdrUpdateCounts();
  const d = _collectCdr();
  const rec = {
    case_id: _cdrICaseId,
    diary_number: d.diary_number||null,
    diary_date: d.diary_date||null,
    rows: d.rows,
    sim_location: d.sim_location||null,
    sim_ownership: d.sim_ownership||null,
    zimni_number: d.zimni_number||null,
    zimni_date: d.zimni_date||null,
    signature: d.signature||null,
  };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    if (_cdrISaved && _cdrISaved.id) {
      await supabaseClient.from('cdr_imei_requests').update(rec).eq('id', _cdrISaved.id);
    } else {
      const { data } = await supabaseClient.from('cdr_imei_requests').insert(rec).select().single();
      _cdrISaved = data || { ...rec, id:'tmp_'+Date.now() };
    }
    try { localStorage.setItem('dio_cdr_'+_cdrICaseId, JSON.stringify(_cdrISaved)); } catch(_) {}
    showToast('✅ درخواست محفوظ ہو گئی', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

function _newCdr() {
  _cdrISaved = null;
  _renderCdr();
  showToast('📄 نئی درخواست', 'info');
}

function _printCdr() {
  const doc = document.getElementById('cdr-doc');
  if (!doc) return;
  const dateStr = formatDate(new Date());
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>@page{size:A4;margin:8mm}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;font-size:13px;line-height:1.3;color:#000;margin:0;}
      table{border-collapse:collapse;width:100%;}
      td,th{border:1px solid #000;padding:2px 4px;line-height:1.2;font-size:12px;vertical-align:middle;}
      tr{height:22px;}
      #cdr-doc > div:first-child, #cdr-doc > div:nth-child(2){margin-bottom:3px !important;}
      .dio-print-footer{position:fixed;bottom:3mm;left:0;right:0;text-align:center;font-size:9px;color:#999;}
    </style></head>
    <body>${doc.innerHTML}<div class="dio-print-footer">Digital IO | printed on ${dateStr}</div></body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w=window.open('','_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),300); }
}
