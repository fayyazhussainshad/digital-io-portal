/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — INCIDENT REPORT  (incident.js)
   Professional Urdu form · Punjab Police standard
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

    <!-- Action Bar -->
    <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">
      <button class="btn btn-primary" onclick="_incPrint()">🖨️ پرنٹ کریں</button>
      <button class="btn btn-secondary" onclick="_incDownload()">⬇️ ڈاؤنلوڈ کریں</button>
      <button class="btn btn-secondary" onclick="_incShare()">📱 WhatsApp</button>
      <button class="btn btn-secondary" onclick="_incReset()">🔄 نئی رپورٹ</button>
    </div>

    <!-- FORM -->
    <div id="inc-form" style="background:#fff;color:#111;direction:rtl;text-align:right;
      font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
      border:2px solid #1a3a5c;border-radius:4px;padding:0;overflow:hidden;">

      <!-- Header -->
      <div style="background:#1a3a5c;color:#fff;padding:16px 24px;text-align:center;">
        <div style="font-size:22px;font-weight:800;margin-bottom:4px;">محکمہ پولیس پنجاب — ضلع ${o.district||'_______'}</div>
        <div style="font-size:16px;margin-bottom:2px;">واقعاتی / حادثاتی رپورٹ</div>
        <div style="font-size:13px;opacity:0.8;">INCIDENT REPORT — PUNJAB POLICE</div>
      </div>

      <!-- Report Number + Incident Type -->
      <div style="background:#f0f4f8;padding:10px 24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #ccc;">
        <div style="font-size:13px;">
          <span style="color:#555;">رپورٹ نمبر:</span>
          <input value="${incNum}" id="inc-num" style="${_iStyle('140px')}font-family:monospace;font-weight:700;color:#1a3a5c;">
        </div>
        <div style="font-size:13px;">
          <span style="color:#555;">واقعے کی قسم:</span>
          <select id="inc-severity" style="${_iStyle('160px')}">
            <option>قتل</option>
            <option>ڈکیتی</option>
            <option>چوری</option>
            <option>اغوا</option>
            <option>دہشت گردی</option>
            <option>فساد</option>
            <option>ٹریفک حادثہ</option>
            <option>جنسی زیادتی</option>
            <option>غیر قانونی اسلحہ</option>
            <option>منشیات</option>
            <option>فراڈ / دھوکہ</option>
            <option>توڑ پھوڑ</option>
            <option>خودکشی</option>
            <option>لاوارث لاش</option>
            <option>آگ لگنا</option>
            <option>دیگر</option>
          </select>
        </div>
      </div>

      <div style="padding:20px 24px;">

        <!-- Section 1: Incident Details -->
        ${_secHeader('1', 'واقعے کی تفصیل')}
        <div style="${_grid2()}">
          ${_field('واقعے کی تاریخ', 'inc-date', today, 'text')}
          ${_field('واقعے کا وقت', 'inc-time', timeNow, 'text')}
          ${_field('رپورٹ کی تاریخ', 'inc-rdate', today, 'text')}
          ${_field('رپورٹ کا وقت', 'inc-rtime', timeNow, 'text')}
        </div>

        <!-- Section 2: Location -->
        ${_secHeader('2', 'مقام واقعہ')}
        <div style="${_grid2()}">
          ${_field('تھانہ', 'inc-station', o.station||'', 'text')}
          ${_field('ضلع', 'inc-district', o.district||'', 'text')}
        </div>
        ${_fieldFull('درست پتہ / مقام', 'inc-address', '', 2)}
        <div style="${_grid2()}">
          ${_field('قریبی نشانی', 'inc-landmark', '', 'text')}
          ${_field('GPS / نقشہ نمبر', 'inc-gps', '', 'text')}
        </div>
        <div style="margin-bottom:12px;">
          <button onclick="_incGPS()" style="padding:6px 14px;border:1px solid #1a3a5c;border-radius:4px;background:#f0f4f8;color:#1a3a5c;cursor:pointer;font-family:'Jameel Noori Nastaleeq',serif;font-size:13px;">📍 GPS خودکار لیں</button>
          <span id="inc-gps-status" style="font-size:12px;color:#666;margin-right:10px;"></span>
        </div>

        <!-- Section 3: Victims -->
        ${_secHeader('3', 'متاثرین / مظلومین')}
        <div id="inc-victims-list"></div>
        <button onclick="_incAddVictim()" style="${_addBtn()}">+ متاثرہ شخص شامل کریں</button>

        <!-- Section 4: Suspects -->
        ${_secHeader('4', 'مشتبہ ملزمان')}
        <div id="inc-suspects-list"></div>
        <button onclick="_incAddSuspect()" style="${_addBtn()}">+ مشتبہ ملزم شامل کریں</button>

        <!-- Section 5: Witnesses -->
        ${_secHeader('5', 'گواہان')}
        <div id="inc-witnesses-list"></div>
        <button onclick="_incAddWitness()" style="${_addBtn()}">+ گواہ شامل کریں</button>

        <!-- Section 6: Narrative -->
        ${_secHeader('6', 'واقعے کی تفصیلی روداد')}
        ${_fieldFull('واقعہ کیسے پیش آیا — مکمل تفصیل', 'inc-narrative', '', 5)}

        <!-- Section 7: Action Taken -->
        ${_secHeader('7', 'اقدامات / کاروائی')}
        ${_fieldFull('فوری اقدامات', 'inc-action', '', 3)}
        <div style="${_grid2()}">
          ${_field('FIR نمبر (اگر درج ہو)', 'inc-fir', '', 'text')}
          ${_field('گرفتار ملزمان کی تعداد', 'inc-arrested', '0', 'text')}
        </div>
        <div style="margin-bottom:12px;">
          <div style="${_lbl()}">متعلقہ محکمے (جو بلائے گئے)</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px;">
            ${['ایمبولینس','فائر بریگیڈ','رینجرز','فوج','ٹریفک پولیس','سی ٹی ڈی','ایف آئی اے'].map(t=>
              `<label style="display:flex;align-items:center;gap:4px;font-size:14px;cursor:pointer;">
                <input type="checkbox" name="inc-dept" value="${t}" style="accent-color:#1a3a5c;width:14px;height:14px;">
                ${t}
              </label>`).join('')}
          </div>
        </div>

        <!-- Section 8: Evidence -->
        ${_secHeader('8', 'شواہد / مادی ثبوت')}
        ${_fieldFull('موقع واردات سے برآمد شواہد', 'inc-evidence', '', 2)}

        <!-- Section 9: Visiting Officers -->
        ${_secHeader('9', 'موقع وزٹ کرنے والے افسران')}
        <div id="inc-officers-list"></div>
        <button onclick="_incAddOfficer()" style="${_addBtn()}">+ افسر شامل کریں</button>

        <!-- Signature Block -->
        <div style="margin-top:28px;border-top:2px solid #1a3a5c;padding-top:20px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:16px;">

            <!-- Left: Reporting Officer signature -->
            <div style="text-align:center;flex:1;border:1px solid #ddd;border-radius:6px;padding:12px;">
              <div style="height:55px;border-bottom:1px solid #aaa;margin-bottom:8px;"></div>
              <div style="font-size:13px;color:#333;font-weight:700;">${o.full_name||'_________________'}</div>
              <div style="font-size:12px;color:#555;">${o.designation||''}</div>
              <div style="font-size:12px;color:#555;">${o.station||''} تھانہ</div>
              <div style="font-size:11px;color:#888;margin-top:4px;">دستخط رپورٹنگ افسر</div>
            </div>

            <!-- Right: SHO signature — blank space on top for signature -->
            <div style="text-align:center;flex:1;border:1px solid #ddd;border-radius:6px;padding:12px;">
              <div style="height:55px;border-bottom:1px solid #aaa;margin-bottom:8px;">
                <!-- SHO signs here — space intentionally left blank -->
              </div>
              <div style="font-size:13px;font-weight:700;color:#1a3a5c;">SHO ${o.station||'_______'} تھانہ</div>
              <div style="margin-top:8px;">
                <div style="font-size:11px;color:#555;margin-bottom:3px;">تاریخ:</div>
                <input id="inc-sign-date" value="${today}"
                  style="border:none;border-bottom:1px solid #aaa;padding:2px 6px;
                  font-family:'Jameel Noori Nastaleeq',serif;font-size:13px;
                  text-align:center;width:140px;outline:none;background:transparent;">
              </div>
              <div style="font-size:11px;color:#888;margin-top:6px;">دستخط SHO</div>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div style="margin-top:16px;padding-top:8px;border-top:1px solid #ccc;text-align:center;font-size:10px;color:#aaa;">
          Digital IO — محکمہ پولیس پنجاب
        </div>

      </div>
    </div>
  </div>`;

  // Add initial rows
  _incAddVictim();
  _incAddSuspect();
  _incAddWitness();
  _incAddOfficer();
}

// ── HELPERS ───────────────────────────────────────────────────
function _iStyle(w) {
  return `border:none;border-bottom:1px solid #aaa;padding:3px 6px;font-family:'Jameel Noori Nastaleeq',serif;font-size:15px;background:transparent;outline:none;width:${w};direction:rtl;`;
}
function _lbl() { return 'font-size:13px;color:#555;margin-bottom:4px;display:block;'; }
function _grid2() { return 'display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;'; }
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
    <div style="display:flex;gap:6px;align-items:flex-start;">
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
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
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
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;">
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
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
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
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
      <div><label style="${_lbl()}">نام</label><input style="${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:4px 8px;"></div>
      <div><label style="${_lbl()}">عہدہ / رینک</label>
        <select style="${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:4px 8px;">
          <option>ASI</option><option>SI</option><option>Inspector</option><option>DSP</option>
          <option>SP</option><option>SSP</option><option>DIG</option><option>Constable</option><option>HC</option>
        </select>
      </div>
      <div><label style="${_lbl()}">بیج نمبر</label><input style="${_iStyle('100%')}border:1px solid #bae6fd;border-radius:4px;padding:4px 8px;"></div>
    </div>`;
  document.getElementById('inc-officers-list').appendChild(div);
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
        const addr = document.getElementById('inc-address');
        if (addr && !addr.value) addr.value = j.display_name?.split(',').slice(0,4).join(',') || '';
      } catch(_) {}
    }
  }, () => { if(status)status.textContent='⚠️ GPS نہیں مل سکا'; }, {timeout:10000});
}

// ── PRINT ─────────────────────────────────────────────────────
function _incPrint() {
  const form = document.getElementById('inc-form');
  if (!form) return;
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
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
  w.document.close();
  setTimeout(()=>w.print(),700);
}

// ── DOWNLOAD ──────────────────────────────────────────────────
function _incDownload() {
  const num    = document.getElementById('inc-num')?.value||'IR';
  const date   = document.getElementById('inc-date')?.value||'';
  const addr   = document.getElementById('inc-address')?.value||'';
  const narr   = document.getElementById('inc-narrative')?.value||'';
  const action = document.getElementById('inc-action')?.value||'';
  const off    = document.getElementById('inc-off-name')?.value||'';
  const rank   = document.getElementById('inc-off-rank')?.value||'';
  const types  = [...document.querySelectorAll('input[name="inc-type"]:checked')].map(e=>e.value).join('، ');

  let txt = 'واقعاتی رپورٹ — پولیس محکمہ پنجاب\n';
  txt += '='.repeat(50)+'\n';
  txt += `رپورٹ نمبر: ${num}\n`;
  txt += `تاریخ: ${date}\n`;
  txt += `واقعے کی قسم: ${types||'—'}\n`;
  txt += `مقام: ${addr}\n\n`;
  txt += `روداد:\n${narr}\n\n`;
  txt += `اقدامات:\n${action}\n\n`;
  txt += `رپورٹنگ افسر: ${off} — ${rank}\n`;
  txt += `تاریخ دستخط: ${document.getElementById('inc-sign-date')?.value||''}\n`;
  txt += '\n' + '='.repeat(50) + '\nDigital IO — Punjab Police';

  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain;charset=utf-8'}));
  a.download = `Incident-Report-${num}-${date.replace(/\//g,'-')}.txt`;
  a.click();
  showToast('⬇️ رپورٹ ڈاؤنلوڈ ہو رہی ہے','success');
}

// ── SHARE ─────────────────────────────────────────────────────
function _incShare() {
  const num  = document.getElementById('inc-num')?.value||'';
  const date = document.getElementById('inc-date')?.value||'';
  const addr = document.getElementById('inc-address')?.value||'';
  const off  = document.getElementById('inc-off-name')?.value||'';
  const types = [...document.querySelectorAll('input[name="inc-type"]:checked')].map(e=>e.value).join('، ');
  const txt = `واقعاتی رپورٹ\nرپورٹ نمبر: ${num}\nتاریخ: ${date}\nقسم: ${types||'—'}\nمقام: ${addr}\nافسر: ${off}\n\nDigital IO — Punjab Police`;
  if (navigator.share) { navigator.share({title:'Incident Report',text:txt}).catch(()=>{}); }
  else { navigator.clipboard.writeText(txt).then(()=>showToast('Copy ہو گئی — WhatsApp میں paste کریں','info')); }
}

// ── RESET ─────────────────────────────────────────────────────
function _incReset() {
  _victimCount=0; _suspectCount=0; _witnessCount=0;
  const c = document.getElementById('page-content');
  if (c) renderIncident(c);
}
