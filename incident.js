/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — INCIDENT REPORT  (incident.js)
   Professional Urdu form
   Auto date · Signature + Stamp block · Print/Download
   ═══════════════════════════════════════════════════════════ */

registerPage('incident', renderIncident);

function renderIncident(container) {
  const o   = currentOfficer || {};
  const now = new Date();
  const today = `${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
  const timeNow = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  const incNum = 'IR-' + now.getFullYear() + '-' + String(Math.floor(Math.random()*9000)+1000);

  container.innerHTML = `
  <div style="max-width:900px;margin:0 auto;" id="inc-root">
    <div style="margin-bottom:12px;"><button onclick="showPage('dashboard',null)" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">↩</button></div>

    <!-- Action Bar — compact -->
    <div style="display:flex;gap:6px;direction:rtl;margin-bottom:12px;flex-wrap:wrap;align-items:center;background:var(--bg-card);padding:10px 12px;border-radius:10px;border:1px solid var(--border);">
      <span style="font-size:13px;font-weight:700;color:var(--accent);">🚨 واقعاتی رپورٹ</span>
      <button class="btn btn-secondary btn-sm" onclick="_incReset()">➕ نئی رپورٹ</button>
      <div style="flex:1;"></div>
      <button class="btn btn-primary btn-sm" onclick="_incSaveAndPrint()">🖨️ محفوظ و پرنٹ</button>
      <button class="btn btn-primary btn-sm" onclick="_incSaveToDB()">💾 محفوظ کریں</button>
      <button class="btn btn-secondary btn-sm" onclick="_incDownload()">⬇️ ڈاؤنلوڈ</button>
      <button class="btn btn-secondary btn-sm" onclick="_incShare()">📱 WhatsApp</button>
      <button class="btn btn-secondary btn-sm" onclick="_showPrevReports()">📋 پرانی رپورٹس</button>
    </div>

    <!-- FORM -->
    <div id="inc-form" style="background:#fff;color:#111;direction:rtl;text-align:right;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
      padding:24px;">

      <!-- Row 1: Thana (right, 0.7in gap) ... Zila (left) -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;font-size:16px;font-weight:800;color:#1a3a5c;margin-bottom:4px;">
        <div style="padding-right:0.7in;">تھانہ ${o.station||'_______'}</div>
        <div>ضلع ${o.district||'_______'}</div>
      </div>

      <!-- Row 2: واقعاتی رپورٹ (centered, underlined) -->
      <div style="text-align:center;margin:8px 0 12px;">
        <span style="font-size:20px;font-weight:800;border-bottom:2px solid #1a3a5c;padding-bottom:2px;">واقعاتی رپورٹ</span>
      </div>

      <!-- Report Number + Type -->
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:8px;border-bottom:1px solid #ccc;">
        <div style="font-size:14px;">
          <span style="color:#555;">واقعاتی رپورٹ نمبر:</span>
          <input value="${incNum}" id="inc-num" style="${_iStyle('150px')}font-family:monospace;font-weight:700;color:#1a3a5c;">
        </div>
        <div style="font-size:14px;">
          <span style="color:#555;">نوعیت:</span>
          <select id="inc-severity" style="${_iStyle('170px')}">
            <option>قتل</option><option>ڈکیتی</option><option>چوری</option><option>اغوا</option>
            <option>دہشت گردی</option><option>فساد</option><option>ٹریفک حادثہ</option><option>جنسی زیادتی</option>
            <option>غیر قانونی اسلحہ</option><option>منشیات</option><option>فراڈ / دھوکہ</option><option>توڑ پھوڑ</option>
            <option>خودکشی</option><option>لاوارث لاش</option><option>آگ لگنا</option><option>دیگر</option>
          </select>
        </div>
      </div>

      <!-- MAIN TABLE -->
      <div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tbody>
            <!-- Row 1: Caller name only (no phone column) -->
            <tr>
              <td style="${_tdL()}">نام اطلاع دہندہ</td>
              <td colspan="3" style="${_tdV()}"><input id="inc-caller-name" style="${_tIn()}"></td>
            </tr>
            <!-- Row 2: تفصیل متعلقہ — label + dropdown stacked in column 1, name in column 2 -->
            <tr>
              <td style="${_tdL()}vertical-align:top;">
                <div style="display:flex;flex-direction:column;gap:6px;align-items:stretch;">
                  <span style="font-weight:700;text-align:right;">تفصیل متعلقہ</span>
                  <div style="display:flex;gap:4px;align-items:center;">
                    <select id="inc-person-type" style="${_tIn()}flex:1;font-weight:700;">
                      <option>مقتول</option><option>مضروب</option><option>مغوی</option><option>victim</option><option>متاثرہ</option>
                    </select>
                    <button onclick="_incAddPersonType()" style="border:1px solid #ccc;border-radius:4px;background:#f0f4f8;cursor:pointer;padding:2px 8px;flex-shrink:0;" title="نیا">➕</button>
                  </div>
                </div>
              </td>
              <td colspan="3" style="${_tdV()}vertical-align:top;">
                <input id="inc-person-name" placeholder="نام و ولدیت، قوم، کارڈ اور حلیہ یہاں لکھیں..." style="${_tIn()}">
              </td>
            </tr>
            <!-- Row: مقام وقوعہ (full width) | تاریخ و وقت (empty/blank) -->
            <tr>
              <td style="${_tdL()}">مقام وقوعہ</td>
              <td style="${_tdV()}"><input id="inc-place" style="${_tIn()}"></td>
              <td style="${_tdL()}">تاریخ و وقت وقوعہ</td>
              <td style="${_tdV()}"><input id="inc-datetime" style="${_tIn()}text-align:center;"></td>
            </tr>
            <!-- Row 5: Visiting officers (editable free-text, checkboxes removed for space) -->
            <tr>
              <td style="${_tdL()}">موقع وزٹ کرنے والے افسران</td>
              <td colspan="3" style="${_tdV()}"><input id="inc-visiting-officers" placeholder="افسران کے نام یہاں لکھیں..." style="${_tIn()}"></td>
            </tr>
            <!-- Row 6: مختصر حالات (full-width, justified RTL, voice + handwriting) -->
            <tr>
              <td colspan="4" style="border:1px solid #1a3a5c;padding:8px 10px;">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
                  <span style="font-weight:800;font-size:14px;color:#1a3a5c;">مختصر حالات:</span>
                  <div style="display:flex;gap:6px;">
                    <button onclick="_incVoice('inc-narrative','mic-narr')" id="mic-narr" style="width:32px;height:32px;border:1px solid #ccc;border-radius:6px;background:#f0f4f8;font-size:15px;cursor:pointer;" title="وائس ٹائپنگ">🎙️</button>
                    <button onclick="_incHandwriting()" style="width:32px;height:32px;border:1px solid #ccc;border-radius:6px;background:#f0f4f8;font-size:15px;cursor:pointer;" title="ہینڈ رائٹنگ">✍️</button>
                  </div>
                </div>
                <textarea id="inc-narrative" rows="6" placeholder="مختصر حالات یہاں سے شروع ہوں گے..."
                  style="width:100%;border:none;outline:none;background:transparent;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;font-size:15px;line-height:2.2;direction:rtl;text-align:justify;resize:vertical;min-height:120px;box-sizing:border-box;"></textarea>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- SHO + date (LEFT corner — flex-end in RTL = left) -->
        <div style="margin-top:30px;display:flex;justify-content:flex-end;">
          <div style="text-align:center;min-width:260px;">
            <div style="height:40px;border-bottom:1px solid #1a3a5c;"></div>
            <div style="font-size:17px;font-weight:800;color:#1a3a5c;padding-top:6px;">
              ${(() => { const s=(typeof getSHOName==='function')?getSHOName():''; return (s?s+' ':'')+'SHO تھانہ '+(o.station||'صدر ملتان'); })()}
            </div>
            <input id="inc-sign-date" value="${today}"
              style="border:none;border-bottom:1px solid #aaa;padding:1px 4px;text-align:center;width:130px;outline:none;background:transparent;display:block;margin:4px auto 0;font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;">
          </div>
        <style>[data-ph]:empty:before{content:attr(data-ph);color:#999;font-weight:normal;}</style>
        </div>

        <!-- Created by footer -->
        <div style="text-align:left;margin-top:14px;font-size:10px;color:#bbb;">Created by DIGITAL IO</div>

      </div>
    </div>
  </div>`;

  // Load previous reports
  _loadPrevReports();

  // Smart suggestions (Rule 5) — recent locations on مقام وقوعہ, dismissible
  setTimeout(() => {
    const placeEl = document.getElementById('inc-place');
    if (placeEl && typeof attachSuggestions === 'function') attachSuggestions(placeEl, 'location');
  }, 60);
}

// ── PREVIOUS REPORTS ──────────────────────────────────────────
async function _loadPrevReports() {
  const el = document.getElementById('inc-prev-list');
  if (!el) return;
  try {
    const oid = await getOfficerId();
    const { data } = await supabaseClient
      .from('incident_reports')
      .select('id,report_number,incident_date,incident_type,address,created_at')
      .eq('officer_id', oid)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!data || !data.length) {
      el.innerHTML = `<div style="text-align:center;padding:10px;color:var(--text-muted);font-size:12px;">ابھی کوئی رپورٹ نہیں</div>`;
      return;
    }
    el.innerHTML = data.map(r => `
      <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:18px;">🚨</span>
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:700;color:var(--accent);">${r.report_number||'—'}</div>
          <div style="font-size:11px;color:var(--text-muted);">${r.incident_type||'—'} · ${r.incident_date||'—'} · ${r.address||'—'}</div>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="_viewIncReport('${r.id}')">👁️ دیکھیں</button>
        <button class="btn btn-danger btn-sm" onclick="_delIncReport('${r.id}')">🗑️</button>
      </div>`).join('');
  } catch(_) {
    el.innerHTML = `<div style="font-size:11px;color:var(--text-muted);padding:8px;">ریکارڈ دستیاب نہیں</div>`;
  }
}

async function _delIncReport(id) {
  try {
    try { const {data:ir}=await supabaseClient.from("incident_reports").select("*").eq("id",id).single(); if(ir) await softDelete("incident",id,ir); } catch(_) {}
    await supabaseClient.from("incident_reports").delete().eq("id",id);
    showToast('🗑️ رپورٹ ہٹا دی گئی', 'info');
    _loadPrevReports();
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _viewIncReport(id) {
  showToast('⏳ رپورٹ لوڈ ہو رہی ہے...', 'info');
  try {
    const { data } = await supabaseClient.from('incident_reports').select('*').eq('id', id).single();
    if (!data) return;
    const fir = data.data?.fir_number || '';
    openModal('🚨 ' + (data.report_number||'Incident Report'),
      `<div style="font-size:13px;line-height:2.2;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
        <div><b>رپورٹ نمبر:</b> ${data.report_number||'—'}</div>
        <div><b>تاریخ:</b> ${data.incident_date||'—'} &nbsp;·&nbsp; <b>وقت:</b> ${data.incident_time||'—'}</div>
        <div><b>قسم:</b> ${data.incident_type||'—'}</div>
        <div><b>مقام:</b> ${data.address||'—'}</div>
        ${fir ? `<div><b>FIR نمبر:</b> <span style="color:var(--accent);font-weight:700;">${fir}</span>
          <button class="btn btn-secondary btn-sm" onclick="closeModal();showPage('cases',null);setTimeout(()=>{const c=Array.from(document.querySelectorAll('td')).find(t=>t.textContent.includes('${fir}')); if(c)c.click();},800);">مقدمہ دیکھیں →</button>
        </div>` : ''}
        <div style="border-top:1px solid #ddd;margin:8px 0;padding-top:8px;"><b>روداد:</b> ${data.narrative||'—'}</div>
        <div><b>اقدامات:</b> ${data.action_taken||'—'}</div>
      </div>`,
      `<button class="btn btn-danger btn-sm" onclick="closeModal();_delIncReport('${id}')">🗑️ حذف</button>
       <button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>`
    );
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── HELPERS ───────────────────────────────────────────────────
function _iStyle(w) {
  return `border:none;border-bottom:1px solid #aaa;padding:3px 6px;font-family:'Jameel Noori Nastaleeq',serif;font-size:15px;background:transparent;outline:none;width:${w};direction:rtl;`;
}
// Table cell helpers for واقعاتی رپورٹ one-page layout
function _tdL() { return 'border:1px solid #1a3a5c;padding:8px 10px;background:#f0f4f8;font-weight:700;font-size:13px;color:#1a3a5c;white-space:nowrap;width:1%;'; }
function _tdV() { return 'border:1px solid #1a3a5c;padding:4px 8px;'; }
function _tIn() { return "border:none;outline:none;background:transparent;font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;width:100%;direction:rtl;padding:3px 4px;box-sizing:border-box;"; }
function _incAddPersonType() {
  const val = prompt('نئی حیثیت درج کریں:');
  if (!val || !val.trim()) return;
  const sel = document.getElementById('inc-person-type');
  if (!sel) return;
  const opt = document.createElement('option');
  opt.value = val.trim(); opt.textContent = val.trim(); opt.selected = true;
  sel.appendChild(opt);
}
function _incHandwriting() {
  showToast('✍️ ہینڈ رائٹنگ: اپنے فون کی کی بورڈ ہینڈ رائٹنگ استعمال کریں، یا ٹائپ کریں', 'info', 4000);
  const ta = document.getElementById('inc-narrative');
  if (ta) ta.focus();
}
function _lbl() { return 'font-size:13px;color:#555;margin-bottom:4px;display:block;'; }
function _grid2() { return 'display:grid;grid-template-columns:1fr 1fr;gap:12px;direction:rtl;margin-bottom:12px;'; }
function _addBtn() { return 'padding:5px 14px;border:1px dashed #1a3a5c;border-radius:4px;background:#f0f4f8;color:#1a3a5c;cursor:pointer;font-family:"Jameel Noori Nastaleeq",serif;font-size:13px;margin-bottom:14px;'; }

function _secHeader(num, title) {
  return `<div style="background:#1a3a5c;color:#fff;padding:6px 12px;border-radius:4px;margin:16px 0 10px;font-size:15px;font-weight:700;">
    ${num}. ${title}
  </div>`;
}

function _field(label, id, val, type) {
  return `<div>
    <label style="${_lbl()}">${label}</label>
    <input id="${id}" value="${val}" type="${type}"
      style="${_iStyle('100%')}border:1px solid #ddd;border-radius:4px;padding:6px 10px;">
  </div>`;
}

function _fieldFull(label, id, val, rows) {
  return `<div style="margin-bottom:12px;">
    <label style="${_lbl()}">${label}</label>
    <div style="display:flex;gap:6px;direction:rtl;align-items:flex-start;">
      <textarea id="${id}" rows="${rows}"
        style="flex:1;border:1px solid #ddd;border-radius:4px;padding:8px 10px;
               font-family:'Jameel Noori Nastaleeq',serif;font-size:15px;
               direction:rtl;resize:vertical;outline:none;box-sizing:border-box;">${val}</textarea>
      <button id="mic-${id}" onclick="_incVoice('${id}','mic-${id}')"
        style="width:38px;height:38px;border:1px solid #ddd;border-radius:6px;background:#f0f4f8;
               font-size:18px;cursor:pointer;flex-shrink:0;margin-top:2px;">🎙️</button>
    </div>
  </div>`;
}

// Dynamic row generators
let _victimCount = 0, _suspectCount = 0, _witnessCount = 0;

function _incAddVictim() {
  _victimCount++;
  const i = _victimCount;
  const div = document.createElement('div');
  div.id = 'victim-' + i;
  div.style.cssText = 'background:#f9f9f9;border:1px solid #ddd;border-radius:6px;padding:10px 12px;margin-bottom:8px;';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="font-size:13px;font-weight:700;color:#1a3a5c;">متاثرہ ${i}</div>
      <button onclick="document.getElementById('victim-${i}').remove()" style="border:none;background:none;color:#c00;cursor:pointer;font-size:16px;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;direction:rtl;">
      <div><label style="${_lbl()}">نام</label><input style="${_iStyle('100%')}border:1px solid #ddd;border-radius:4px;padding:5px 8px;"></div>
      <div><label style="${_lbl()}">شناختی کارڈ</label><input style="${_iStyle('100%')}border:1px solid #ddd;border-radius:4px;padding:5px 8px;"></div>
      <div><label style="${_lbl()}">چوٹیں / حالت</label>
        <select style="${_iStyle('100%')}border:1px solid #ddd;border-radius:4px;padding:5px 8px;">
          <option>زخمی</option><option>جاں بحق</option><option>محفوظ</option><option>لاپتہ</option>
        </select>
      </div>
    </div>`;
  document.getElementById('inc-victims-list').appendChild(div);
}

function _incAddSuspect() {
  _suspectCount++;
  const i = _suspectCount;
  const div = document.createElement('div');
  div.id = 'suspect-' + i;
  div.style.cssText = 'background:#fff5f5;border:1px solid #fecaca;border-radius:6px;padding:10px 12px;margin-bottom:8px;';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="font-size:13px;font-weight:700;color:#c00;">ملزم ${i}</div>
      <button onclick="document.getElementById('suspect-${i}').remove()" style="border:none;background:none;color:#c00;cursor:pointer;font-size:16px;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;direction:rtl;">
      <div><label style="${_lbl()}">نام / عرفیت</label><input style="${_iStyle('100%')}border:1px solid #fecaca;border-radius:4px;padding:5px 8px;"></div>
      <div><label style="${_lbl()}">شناختی کارڈ</label><input style="${_iStyle('100%')}border:1px solid #fecaca;border-radius:4px;padding:5px 8px;"></div>
      <div><label style="${_lbl()}">موبائل نمبر</label><input style="${_iStyle('100%')}border:1px solid #fecaca;border-radius:4px;padding:5px 8px;"></div>
      <div><label style="${_lbl()}">حیثیت</label>
        <select style="${_iStyle('100%')}border:1px solid #fecaca;border-radius:4px;padding:5px 8px;">
          <option>گرفتار</option><option>فرار</option><option>مطلوب</option><option>نامعلوم</option>
        </select>
      </div>
    </div>`;
  document.getElementById('inc-suspects-list').appendChild(div);
}

function _incAddWitness() {
  _witnessCount++;
  const i = _witnessCount;
  const div = document.createElement('div');
  div.id = 'witness-' + i;
  div.style.cssText = 'background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:10px 12px;margin-bottom:8px;';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="font-size:13px;font-weight:700;color:#0369a1;">گواہ ${i}</div>
      <button onclick="document.getElementById('witness-${i}').remove()" style="border:none;background:none;color:#c00;cursor:pointer;font-size:16px;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;direction:rtl;">
      <div><label style="${_lbl()}">نام</label><input style="${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:5px 8px;"></div>
      <div><label style="${_lbl()}">شناختی کارڈ</label><input style="${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:5px 8px;"></div>
      <div><label style="${_lbl()}">موبائل نمبر</label><input style="${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:5px 8px;"></div>
    </div>`;
  document.getElementById('inc-witnesses-list').appendChild(div);
}

let _officerCount = 0;
function _incAddOfficer() {
  _officerCount++;
  const i = _officerCount;
  const div = document.createElement('div');
  div.id = 'officer-' + i;
  div.style.cssText = 'background:#f0f4f8;border:1px solid #bae6fd;border-radius:6px;padding:8px 12px;margin-bottom:6px;';
  div.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
      <div style="font-size:13px;font-weight:700;color:#1a3a5c;">افسر ${i}</div>
      <button onclick="document.getElementById('officer-${i}').remove()" style="border:none;background:none;color:#c00;cursor:pointer;font-size:16px;">✕</button>
    </div>
    <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:8px;direction:rtl;">
      <div><label style="${_lbl()}">نام</label><input style="${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:4px 8px;"></div>
      <div><label style="${_lbl()}">رینک</label>
        <select style="${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:4px 8px;">
          <option>Constable</option><option>HC</option><option>ASI</option>
          <option>SI</option><option>Inspector</option>
        </select>
      </div>
      <div><label style="${_lbl()}">عہدہ</label>
        <select id="off-uhda-${i}" style="${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:4px 8px;"
          onchange="_checkOtherUhda('off-uhda-${i}','off-uhda-other-${i}')">
          <option value="">— منتخب کریں —</option>
          <option>SHO</option>
          <option>IG</option>
          <option>ADDL. IG</option>
          <option>RPO</option>
          <option>CPO</option>
          <option>SSP OPS</option>
          <option>SSP INV</option>
          <option>SP DIVISION</option>
          <option>DSP</option>
          <option>DSP/SDPO CIRCLE</option>
          <option value="+">+ دیگر عہدہ</option>
        </select>
        <input id="off-uhda-other-${i}" placeholder="عہدہ لکھیں"
          style="display:none;${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:4px 8px;margin-top:4px;">
      </div>
    </div>`;
  document.getElementById('inc-officers-list').appendChild(div);
}

function _checkOtherUhda(selId, inputId) {
  const sel = document.getElementById(selId);
  const inp = document.getElementById(inputId);
  if (!sel || !inp) return;
  inp.style.display = sel.value === '+' ? 'block' : 'none';
}

// ── VOICE INPUT ───────────────────────────────────────────────
let _incVoiceRec = null, _incVoiceOn = false, _incVoiceTgt = null;
function _incVoice(targetId, btnId) {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { showToast('⚠️ Browser mein voice support nahi','error'); return; }
  if (_incVoiceOn && _incVoiceTgt === targetId) {
    _incVoiceRec?.stop(); _incVoiceOn=false; _incVoiceTgt=null;
    const b=document.getElementById(btnId); if(b){b.style.background='#f0f4f8';b.textContent='🎙️';}
    return;
  }
  if (_incVoiceOn) _incVoiceRec?.stop();
  _incVoiceTgt=targetId; _incVoiceOn=true;
  const b=document.getElementById(btnId); if(b){b.style.background='#ef4444';b.style.color='#fff';b.textContent='⏹';}
  _incVoiceRec=new SR(); _incVoiceRec.lang='ur-PK'; _incVoiceRec.continuous=false; _incVoiceRec.interimResults=false;
  _incVoiceRec.onresult=e=>{
    const inp=document.getElementById(targetId);
    if(inp)inp.value+=(inp.value?' ':'')+e.results[0][0].transcript;
  };
  _incVoiceRec.onend=()=>{_incVoiceOn=false;_incVoiceTgt=null;const b=document.getElementById(btnId);if(b){b.style.background='#f0f4f8';b.style.color='';b.textContent='🎙️';}};
  _incVoiceRec.onerror=()=>{_incVoiceOn=false;const b=document.getElementById(btnId);if(b){b.style.background='#f0f4f8';b.style.color='';b.textContent='🎙️';}};
  _incVoiceRec.start();
}

// ── GPS ───────────────────────────────────────────────────────
function _incGPS() {
  const status = document.getElementById('inc-gps-status');
  if (status) status.textContent = '📡 GPS لیا جا رہا ہے...';
  if (!navigator.geolocation) { if(status)status.textContent='⚠️ GPS دستیاب نہیں'; return; }
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude, lng = pos.coords.longitude;
    const gpsInp = document.getElementById('inc-gps');
    if (gpsInp) gpsInp.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    if (status) status.textContent = `✅ ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    // Reverse geocode
    if (navigator.onLine) {
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const j = await r.json();
        const addr = document.getElementById('inc-place');
        if (addr && !addr.value) addr.value = j.display_name?.split(',').slice(0,4).join(',') || '';
      } catch(_) {}
    }
  }, () => { if(status)status.textContent='⚠️ GPS نہیں مل سکا'; }, {timeout:10000});
}

async function _incSaveAndPrint() {
  await _incSaveToDB();
  _incPrint();
}

// ── SAVE TO DB ────────────────────────────────────────────────
async function _incSaveToDB() {
  try {
    const oid = await getOfficerId();
    if (!oid) { showToast('⚠️ لاگ ان نہیں', 'error'); return; }
    const incType = document.getElementById('inc-severity')?.value || '';
    const num     = document.getElementById('inc-num')?.value?.trim() || '';
    const datetime = document.getElementById('inc-datetime')?.value?.trim() || '';
    const place    = document.getElementById('inc-place')?.value?.trim() || '';
    const narr     = document.getElementById('inc-narrative')?.value?.trim() || '';
    const accused  = document.getElementById('inc-accused')?.value?.trim() || '';
    const callerName  = document.getElementById('inc-caller-name')?.value?.trim() || '';
    const callerPhone = document.getElementById('inc-caller-phone')?.value?.trim() || '';
    const personName  = document.getElementById('inc-person-name')?.value?.trim() || '';
    const personType  = document.getElementById('inc-person-type')?.value || '';
    const officersText = document.getElementById('inc-visiting-officers')?.value?.trim() || '';
    const officers = officersText ? officersText.split(/[,،]/).map(s=>s.trim()).filter(Boolean) : [];

    if (!num) { showToast('⚠️ رپورٹ نمبر ضروری ہے', 'error'); return; }

    await supabaseClient.from('incident_reports').insert({
      officer_id:    oid,
      report_number: num,
      incident_date: datetime,
      incident_type: incType,
      address:       place,
      narrative:     narr,
      action_taken:  accused,
      data: {
        severity:     document.getElementById('inc-severity')?.value,
        caller_name:  callerName,
        caller_phone: callerPhone,
        person_name:  personName,
        person_type:  personType,
        place:        place,
        datetime:     datetime,
        accused:      accused,
        officers:     officers,
        sign_date:    document.getElementById('inc-sign-date')?.value,
      }
    });
    showToast('✅ رپورٹ محفوظ ہو گئی', 'success');
  } catch(e) {
    showToast('❌ ' + e.message, 'error');
    console.error('incident save error:', e);
  }
}

async function _showPrevReports() {
  try {
    const oid = await getOfficerId();
    const { data } = await supabaseClient
      .from('incident_reports')
      .select('id,report_number,incident_date,incident_type,address,created_at,data')
      .eq('officer_id', oid)
      .order('created_at', { ascending: false })
      .limit(20);

    const items = data || [];
    openModal('📋 پرانی Incident Reports',
      `<div style="max-height:60vh;overflow-y:auto;">
        ${items.length ? items.map(r => `
          <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border);direction:rtl;">
            <span style="font-size:18px;">🚨</span>
            <div style="flex:1;">
              <div style="font-size:13px;font-weight:700;color:var(--accent);">${r.report_number||'—'}</div>
              <div style="font-size:11px;color:var(--text-muted);">${r.incident_type||'—'} · ${r.incident_date||'—'}</div>
              <div style="font-size:11px;color:var(--text-faint);">${r.address||'—'}</div>
              ${r.data?.fir_number ? `<div style="font-size:10px;color:var(--accent);">FIR: ${r.data.fir_number}</div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:4px;">
              <button class="btn btn-secondary btn-sm" onclick="_viewIncReport('${r.id}')">👁️</button>
              <button class="btn btn-danger btn-sm" onclick="_delIncReport('${r.id}')">🗑️</button>
            </div>
          </div>`).join('')
        : '<div style="text-align:center;padding:20px;color:var(--text-muted);">کوئی پرانی رپورٹ نہیں</div>'}
      </div>`,
      `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">بند کریں</button>`
    );
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _loadPrevReports() { /* kept for compatibility */ }

// ── PRINT ─────────────────────────────────────────────────────
function _incPrint() {
  const form = document.getElementById('inc-form');
  if (!form) return;
  let _printHTML = '';
  _printHTML += (`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
    <style>
      @page{margin:8mm;size:A4;}
      body{margin:0;padding:0;font-family:'Noto Nastaliq Urdu','Jameel Noori Nastaleeq',serif;direction:rtl;font-size:13px;}
      input,select,textarea{border:none!important;border-bottom:1px solid #999!important;background:transparent!important;
        font-family:'Noto Nastaliq Urdu',serif!important;font-size:12px!important;width:100%!important;}
      button{display:none!important;}
      label{font-size:11px!important;}
      textarea{font-size:12px!important;height:auto!important;}
      div[style*="padding:20px 24px"]{padding:8px 14px!important;}
      div[style*="margin:16px 0 10px"]{margin:8px 0 6px!important;padding:4px 10px!important;}
      div[style*="margin-bottom:12px"]{margin-bottom:6px!important;}
      div[style*="margin-bottom:8px"]{margin-bottom:4px!important;}
      div[style*="height:55px"]{height:40px!important;}
      *{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    </style>
    </head><body>${form.outerHTML}</body></html>`);
  dioPrint(_printHTML);
  
}

// ── DOWNLOAD ──────────────────────────────────────────────────
function _incDownload() {
  const num      = document.getElementById('inc-num')?.value||'IR';
  const datetime = document.getElementById('inc-datetime')?.value||'';
  const place    = document.getElementById('inc-place')?.value||'';
  const narr     = document.getElementById('inc-narrative')?.value||'';
  const accused  = document.getElementById('inc-accused')?.value||'';
  const type     = document.getElementById('inc-severity')?.value||'';
  const caller   = document.getElementById('inc-caller-name')?.value||'';

  let txt = 'واقعاتی رپورٹ\n';
  txt += '='.repeat(50)+'\n';
  txt += `واقعاتی رپورٹ نمبر: ${num}\n`;
  txt += `نوعیت: ${type}\n`;
  txt += `اطلاع دہندہ: ${caller}\n`;
  txt += `تاریخ و وقت وقوعہ: ${datetime}\n`;
  txt += `مقام وقوعہ: ${place}\n\n`;
  txt += `نام و پتہ ملزمان: ${accused}\n\n`;
  txt += `مختصر حالات:\n${narr}\n\n`;
  txt += `تاریخ: ${document.getElementById('inc-sign-date')?.value||''}\n`;
  txt += '\n' + '='.repeat(50) + '\nDigital IO';

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain;charset=utf-8'}));
  a.download = `Waqiati-Report-${num}.txt`;
  a.click();
  showToast('⬇️ رپورٹ ڈاؤنلوڈ ہو رہی ہے','success');
}

// ── SHARE ─────────────────────────────────────────────────────
function _incShare() {
  const num   = document.getElementById('inc-num')?.value||'';
  const dt    = document.getElementById('inc-datetime')?.value||'';
  const place = document.getElementById('inc-place')?.value||'';
  const type  = document.getElementById('inc-severity')?.value||'';
  const txt = `واقعاتی رپورٹ\nنمبر: ${num}\nنوعیت: ${type}\nتاریخ و وقت: ${dt}\nمقام: ${place}\n\nDigital IO`;
  if (navigator.share) { navigator.share({title:'واقعاتی رپورٹ',text:txt}).catch(()=>{}); }
  else { navigator.clipboard.writeText(txt).then(()=>showToast('Copy ہو گئی — WhatsApp میں paste کریں','info')); }
}

// ── RESET ─────────────────────────────────────────────────────
function _incReset() {
  _victimCount=0; _suspectCount=0; _witnessCount=0;
  const c = document.getElementById('page-content');
  if (c) renderIncident(c);
}
