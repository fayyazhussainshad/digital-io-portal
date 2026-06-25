/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — CDR ANALYZER  (cdr.js)
   Pakistan Networks: Jazz/Mobilink · Telenor · Ufone · Zong
   Rule-based forensic analysis — No AI hallucination
   Court-ready professional report
   ═══════════════════════════════════════════════════════════ */

registerPage('cdr', renderCDR);

// Guard against double-load: only declare once
var _cdrData = window._cdrData || [];   // parsed CDR rows
var _cdrMeta = window._cdrMeta || {};   // file info
var _cdrCase = window._cdrCase || null; // linked case
window._cdrData = _cdrData; window._cdrMeta = _cdrMeta; window._cdrCase = _cdrCase;

// ── MAIN RENDER ───────────────────────────────────────────────
async function renderCDR(container) {
  container.innerHTML = `
  <div style="max-width:1000px;margin:0 auto;" id="cdr-root">
    <div style="margin-bottom:12px;"><button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">↩</button></div>

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1a3a5c,#0d2a45);border-radius:12px;padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;gap:14px;">
      <div style="font-size:40px;">📞</div>
      <div>
        <div style="font-size:18px;font-weight:800;color:#fff;">CDR Analyzer</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.6);">Call Detail Record Analysis — Jazz · Telenor · Ufone · Zong</div>
      </div>
    </div>

    <!-- CDR Request Form Generator -->
    <div class="card" style="margin-bottom:16px;direction:rtl;">
      <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px;">📝 CDR درخواست فارم بنائیں</div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">FIR کی عبارت یہاں لکھیں — اگر موبائل/چوری/چھیننے کا ذکر ہوا تو CDR درخواست فارم خودبخود تیار ہو جائے گا</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
        <input class="form-input" id="cdrrq-fir" placeholder="FIR نمبر">
        <input class="form-input" id="cdrrq-number" dir="ltr" placeholder="موبائل نمبر (جس کا CDR چاہیے)">
      </div>
      <textarea class="form-input" id="cdrrq-text" rows="3" placeholder="FIR کی تفصیل یہاں لکھیں یا پیسٹ کریں..." style="margin-bottom:8px;" oninput="_liveScanCdr(this.value)"></textarea>
      <div id="cdrrq-keywords" style="font-size:11px;margin-bottom:8px;"></div>
      <button class="btn btn-primary" onclick="_generateCdrRequest()" style="width:100%;">📄 CDR درخواست فارم بنائیں</button>
    </div>

    <!-- Upload + Link Case -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;direction:rtl;margin-bottom:16px;">

      <!-- Upload CDR -->
      <div class="card">
        <div style="font-size:11px;color:var(--accent);font-weight:700;letter-spacing:1px;margin-bottom:10px;">CDR فائل اپ لوڈ کریں</div>
        <label style="display:flex;flex-direction:column;align-items:center;justify-content:center;border:2px dashed var(--border);border-radius:10px;padding:20px;cursor:pointer;transition:all 0.2s;background:var(--bg-tertiary);"
          onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <span style="font-size:32px;margin-bottom:8px;">📂</span>
          <span style="font-size:12px;color:var(--text-muted);">CSV / Excel فائل یہاں ڈراپ کریں</span>
          <span style="font-size:10px;color:var(--text-faint);margin-top:4px;">Jazz · Telenor · Ufone · Zong CDR formats supported</span>
          <input type="file" accept=".csv,.xlsx,.xls,.txt" onchange="_cdrUpload(this)" style="display:none;">
        </label>
        <div id="cdr-file-info" style="margin-top:8px;font-size:11px;color:var(--text-muted);"></div>
      </div>

      <!-- Link to Case -->
      <div class="card">
        <div style="font-size:11px;color:var(--accent);font-weight:700;letter-spacing:1px;margin-bottom:10px;">مقدمے سے منسلک کریں</div>
        <input class="form-input" id="cdr-fir" placeholder="FIR نمبر داخل کریں" style="margin-bottom:8px;" oninput="_cdrSearchCase(this.value)">
        <div id="cdr-case-info" style="font-size:12px;color:var(--text-muted);">FIR نمبر لکھیں — مقدمہ خودبخود جڑ جائے گا</div>
        <div style="margin-top:10px;">
          <div style="font-size:11px;color:var(--accent);font-weight:700;letter-spacing:1px;margin-bottom:6px;">مشکوک نمبر (Optional)</div>
          <textarea class="form-input" id="cdr-suspects" rows="2" placeholder="مشکوک نمبر یہاں لکھیں — ہر نمبر نئی لائن میں&#10;0300-1234567&#10;0321-9876543"></textarea>
        </div>
        <button class="btn btn-primary" style="width:100%;margin-top:10px;" onclick="_cdrAnalyze()">🔍 تجزیہ شروع کریں</button>
      </div>
    </div>

    <!-- Results -->
    <div id="cdr-results"></div>
  </div>`;
}

function _liveScanCdr(text) {
  const keywords = _scanCdrKeywords(text);
  const kwDiv = document.getElementById('cdrrq-keywords');
  if (!kwDiv) return;
  if (!text) { kwDiv.innerHTML = ''; return; }
  if (keywords.length) {
    kwDiv.innerHTML = `<span style="color:var(--green);">✅ CDR درکار ہے — ملے: ${keywords.join('، ')}</span>`;
  } else {
    kwDiv.innerHTML = '<span style="color:var(--text-muted);">کوئی متعلقہ لفظ نہیں ملا</span>';
  }
}

// ── CDR EXCEL EXPORT (B5) ─────────────────────────────────────
function _exportCdrExcel() {
  if (!_cdrData.length) { showToast('⚠️ پہلے CDR اپ لوڈ کریں', 'warn'); return; }
  const top = _analyzeTopContacts();
  const cols = ['درجہ','نمبر','کالیں','کل وقت (سیکنڈ)','اوسط (سیکنڈ)'];
  const rows = top.map((c,i) => [
    i+1, c.num, c.calls, c.duration, c.calls?Math.round(c.duration/c.calls):0
  ]);
  const csv = [cols.join(','), ...rows.map(r=>r.map(v=>`"${v}"`).join(','))].join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));
  a.download = `CDR-تجزیہ-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  showToast('✅ Excel فائل ڈاؤنلوڈ ہو گئی', 'success');
}

// ── CDR REQUEST FORM GENERATOR (B1) ───────────────────────────
// Keywords that indicate a phone/theft crime needing CDR
var CDR_KEYWORDS = window.CDR_KEYWORDS || [
  'موبائل','موبئل','فون','چوری','چھینا','چھین','چھینے','چھیننے','ڈکیتی','رہزنی',
  'snatch','snatched','mobile','phone','theft','robbery','dacoity','imei','sim'
];
window.CDR_KEYWORDS = CDR_KEYWORDS;

function _scanCdrKeywords(text) {
  const found = [];
  const lower = (text||'').toLowerCase();
  CDR_KEYWORDS.forEach(kw => {
    if (lower.includes(kw.toLowerCase()) && !found.includes(kw)) found.push(kw);
  });
  return found;
}

async function _generateCdrRequest() {
  const fir = document.getElementById('cdrrq-fir')?.value.trim() || '';
  const number = document.getElementById('cdrrq-number')?.value.trim() || '';
  const text = document.getElementById('cdrrq-text')?.value.trim() || '';

  const keywords = _scanCdrKeywords(text);
  const kwDiv = document.getElementById('cdrrq-keywords');

  if (text && !keywords.length) {
    if (kwDiv) kwDiv.innerHTML = '<span style="color:var(--amber);">⚠️ کوئی متعلقہ لفظ نہیں ملا (موبائل/چوری/چھیننا) — پھر بھی فارم بنا سکتے ہیں</span>';
  } else if (keywords.length) {
    if (kwDiv) kwDiv.innerHTML = `<span style="color:var(--green);">✅ ملے: ${keywords.join('، ')}</span>`;
  }

  if (!number) { showToast('⚠️ موبائل نمبر ضروری ہے', 'error'); return; }

  const o = currentOfficer || {};
  const today = formatDate(new Date());

  // Court-ready CDR request letter
  const html = `
  <div style="font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;padding:40px;max-width:800px;margin:0 auto;line-height:2;color:#000;">
    <div style="text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:20px;">
      <div style="font-size:22px;font-weight:800;"></div>
      <div style="font-size:16px;">تھانہ ${o.station||'____'} ضلع ${o.district||'____'}</div>
    </div>

    <div style="text-align:center;font-size:18px;font-weight:800;text-decoration:underline;margin-bottom:20px;">CDR درخواست فارم</div>

    <table style="width:100%;font-size:15px;border-collapse:collapse;margin-bottom:20px;">
      <tr><td style="padding:6px;width:35%;font-weight:700;">مقدمہ نمبر (FIR):</td><td style="padding:6px;"><span dir="ltr">${fir||'________'}</span></td></tr>
      <tr><td style="padding:6px;font-weight:700;">موبائل نمبر:</td><td style="padding:6px;"><span dir="ltr">${number}</span></td></tr>
      <tr><td style="padding:6px;font-weight:700;">تاریخ:</td><td style="padding:6px;"><span dir="ltr">${today}</span></td></tr>
      <tr><td style="padding:6px;font-weight:700;">درخواست گزار:</td><td style="padding:6px;">${o.full_name||'____'} (${o.designation||'افسر'})</td></tr>
    </table>

    <div style="font-size:15px;margin-bottom:14px;text-align:justify;">
      جناب والا، بخدمت متعلقہ ٹیلی کام کمپنی،<br><br>
      مذکورہ بالا مقدمہ کی تفتیش کے سلسلے میں درج ذیل موبائل نمبر
      <b><span dir="ltr">${number}</span></b> کا مکمل کال ڈیٹا ریکارڈ (CDR)
      بشمول موقع محل وقوعہ (Location/Tower)، IMEI نمبر، اور رابطہ نمبرز،
      عرصہ ${''} کے لیے فراہم کیا جائے تاکہ تفتیش مکمل کی جا سکے۔
      ${keywords.length ? `<br><br><b>نوعیتِ جرم:</b> ${keywords.join('، ')}` : ''}
    </div>

    <div style="margin-top:50px;text-align:left;">
      <div style="display:inline-block;text-align:center;">
        <div style="border-top:1px solid #000;padding-top:5px;font-size:14px;">
          ${o.full_name||'____'}<br>${o.designation||'تفتیشی افسر'}<br>تھانہ ${o.station||'____'}
        </div>
      </div>
    </div>
  </div>`;

  // Print via dioPrint
  if (typeof dioPrint === 'function') {
    dioPrint(html);
  } else {
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close(); w.print();
  }
  showToast('✅ CDR درخواست فارم تیار', 'success');
}

// ── FILE UPLOAD & PARSE ───────────────────────────────────────
async function _cdrUpload(input) {
  const file = input.files[0];
  if (!file) return;
  const info = document.getElementById('cdr-file-info');
  if (info) info.textContent = '⏳ فائل پڑھی جا رہی ہے...';

  try {
    const text = await _readFile(file);
    const rows = _parseCSV(text);
    if (rows.length < 2) { showToast('⚠️ فائل خالی ہے یا غلط format ہے','error'); return; }

    const headers = rows[0].map(h => h.trim().toLowerCase());
    const network = _detectNetwork(headers, file.name);
    const mapped  = _mapRows(rows.slice(1), headers, network);
    _cdrData = mapped;
    _cdrMeta = { filename: file.name, network, total: mapped.length, headers };

    if (info) info.innerHTML = `✅ <b>${mapped.length}</b> records لوڈ ہوئے — Network: <b style="color:var(--accent);">${network}</b>`;
    showToast(`✅ ${mapped.length} CDR records loaded — ${network}`, 'success');
  } catch(e) {
    showToast('❌ فائل خرابی: ' + e.message, 'error');
    if (info) info.textContent = '❌ فائل نہیں پڑھ سکا';
  }
}

function _readFile(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = () => rej(new Error('File read failed'));
    r.readAsText(file, 'utf-8');
  });
}

function _parseCSV(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  return lines.map(line => {
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; continue; }
      if ((line[i] === ',' || line[i] === '\t' || line[i] === '|') && !inQ) {
        cols.push(cur.trim()); cur = '';
      } else { cur += line[i]; }
    }
    cols.push(cur.trim());
    return cols;
  });
}

// Network auto-detection from headers/filename
function _detectNetwork(headers, filename) {
  const fn = filename.toLowerCase();
  if (fn.includes('jazz') || fn.includes('mobilink') || headers.some(h=>h.includes('jazz'))) return 'Jazz/Mobilink';
  if (fn.includes('telenor') || headers.some(h=>h.includes('telenor'))) return 'Telenor';
  if (fn.includes('ufone') || headers.some(h=>h.includes('ufone'))) return 'Ufone';
  if (fn.includes('zong') || headers.some(h=>h.includes('zong'))) return 'Zong';
  return 'Unknown Network';
}

// Map CSV columns to standard CDR fields
function _mapRows(rows, headers, network) {
  const find = (keys) => {
    for (const k of keys) {
      const i = headers.findIndex(h => h.includes(k));
      if (i >= 0) return i;
    }
    return -1;
  };
  const iA    = find(['calling','a party','a-party','caller','msisdn a','from','number a']);
  const iB    = find(['called','b party','b-party','callee','msisdn b','to','number b','dest']);
  const iDate = find(['date','call date','start date','datetime']);
  const iTime = find(['time','call time','start time']);
  const iDur  = find(['duration','seconds','sec','mins','minute']);
  const iType = find(['type','call type','direction','event','service']);
  const iCell = find(['cell','bts','site','tower','cell id','location']);
  const iIMEI = find(['imei','device']);

  return rows.filter(r => r.length > 1).map(r => ({
    a:    iA>=0   ? _cleanNum(r[iA])   : '',
    b:    iB>=0   ? _cleanNum(r[iB])   : '',
    date: iDate>=0 ? r[iDate]?.trim()  : '',
    time: iTime>=0 ? r[iTime]?.trim()  : '',
    dur:  iDur>=0  ? parseInt(r[iDur]) || 0 : 0,
    type: iType>=0 ? r[iType]?.trim()  : 'CALL',
    cell: iCell>=0 ? r[iCell]?.trim()  : '',
    imei: iIMEI>=0 ? r[iIMEI]?.trim()  : '',
    raw:  r,
  }));
}

function _cleanNum(n) {
  if (!n) return '';
  return n.toString().replace(/[^0-9+]/g,'');
}

// ── LINK TO CASE ──────────────────────────────────────────────
async function _cdrSearchCase(fir) {
  const info = document.getElementById('cdr-case-info');
  if (!fir || fir.length < 2) {
    if (info) info.textContent = 'FIR نمبر لکھیں — مقدمہ خودبخود جڑ جائے گا';
    _cdrCase = null; return;
  }
  try {
    const { data } = await supabaseClient.from('cases').select('*')
      .ilike('fir_number', '%' + fir + '%').limit(1);
    if (data?.length) {
      _cdrCase = data[0];
      if (info) info.innerHTML = `✅ مقدمہ ملا: <b style="color:var(--green);">FIR ${_cdrCase.fir_number}</b> — ${_cdrCase.complainant||'—'}`;
    } else {
      _cdrCase = null;
      if (info) info.textContent = '⚠️ یہ FIR نمبر نہیں ملا';
    }
  } catch(_) {}
}

// ── MAIN ANALYSIS ─────────────────────────────────────────────
async function _cdrAnalyze() {
  if (!_cdrData.length) { showToast('⚠️ پہلے CDR فائل اپ لوڈ کریں','error'); return; }

  const res = document.getElementById('cdr-results');
  res.innerHTML = `<div style="text-align:center;padding:30px;color:var(--text-muted);">⏳ تجزیہ جاری ہے...</div>`;

  const suspectRaw = document.getElementById('cdr-suspects')?.value || '';
  const suspects   = suspectRaw.split(/\n|,/).map(n => _cleanNum(n)).filter(Boolean);

  // Run all analysis modules
  const analysis = {
    overview:     _analyzeOverview(),
    topContacts:  _analyzeTopContacts(),
    timePattern:  _analyzeTimePattern(),
    nightCalls:   _analyzeNightCalls(),
    shortCalls:   _analyzeShortCalls(),
    imeiChanges:  _analyzeIMEI(),
    suspectHits:  _analyzeSuspects(suspects),
    intlCalls:    _analyzeInternational(),
    locationTrail:_analyzeLocations(),
    commonWithAll:_analyzeCommon(),
    flags:        [],
  };

  // Auto-flag suspicious patterns
  analysis.flags = _generateFlags(analysis, suspects);

  // Save to Supabase
  try {
    const oid = await getOfficerId();
    await supabaseClient.from('cdr_uploads').insert({
      officer_id: oid,
      case_id:    _cdrCase?.id || null,
      fir_number: _cdrCase?.fir_number || document.getElementById('cdr-fir')?.value || '',
      msisdn:     analysis.overview.primaryNumber,
      network:    _cdrMeta.network,
      total_records: _cdrData.length,
      analysis,
    });
  } catch(_) {}

  // Render results
  res.innerHTML = _renderAnalysis(analysis, suspects);
}

// ── ANALYSIS MODULES ──────────────────────────────────────────

function _analyzeOverview() {
  const numbers = {};
  _cdrData.forEach(r => {
    if (r.a) numbers[r.a] = (numbers[r.a]||0)+1;
    if (r.b) numbers[r.b] = (numbers[r.b]||0)+1;
  });
  const primary = Object.entries(numbers).sort((a,b)=>b[1]-a[1])[0]?.[0] || '';
  const totalDur = _cdrData.reduce((s,r)=>s+r.dur,0);
  const dates    = _cdrData.map(r=>r.date).filter(Boolean).sort();
  return {
    primaryNumber: primary,
    totalCalls:    _cdrData.length,
    totalDuration: totalDur,
    dateFrom:      dates[0]||'—',
    dateTo:        dates[dates.length-1]||'—',
    uniqueContacts:new Set([..._cdrData.map(r=>r.b),..._cdrData.map(r=>r.a)]).size,
    outgoing:      _cdrData.filter(r=>r.type?.toLowerCase().includes('out')||r.type?.toLowerCase().includes('mo')).length,
    incoming:      _cdrData.filter(r=>r.type?.toLowerCase().includes('in')||r.type?.toLowerCase().includes('mt')).length,
  };
}

function _analyzeTopContacts() {
  const cnt = {};
  const dur = {};
  _cdrData.forEach(r => {
    const num = r.b || r.a;
    if (!num) return;
    cnt[num] = (cnt[num]||0)+1;
    dur[num] = (dur[num]||0)+r.dur;
  });
  return Object.entries(cnt)
    .sort((a,b)=>b[1]-a[1]).slice(0,30)
    .map(([num,calls])=>({ num, calls, duration:dur[num]||0 }));
}

function _analyzeTimePattern() {
  const hours = Array(24).fill(0);
  _cdrData.forEach(r => {
    const t = r.time || '';
    const h = parseInt(t.split(':')[0]);
    if (!isNaN(h) && h>=0 && h<24) hours[h]++;
  });
  return hours;
}

function _analyzeNightCalls() {
  return _cdrData.filter(r => {
    const t = r.time || '';
    const h = parseInt(t.split(':')[0]);
    return h >= 23 || h <= 5;
  });
}

function _analyzeShortCalls() {
  // Very short calls (< 5 seconds) often signal lookout/surveillance
  return _cdrData.filter(r => r.dur > 0 && r.dur < 5);
}

function _analyzeIMEI() {
  const imeis = [...new Set(_cdrData.map(r=>r.imei).filter(Boolean))];
  const changes = [];
  let lastImei = '';
  _cdrData.forEach((r,i) => {
    if (r.imei && r.imei !== lastImei && lastImei) {
      changes.push({ at: i, from: lastImei, to: r.imei, date: r.date, time: r.time });
    }
    if (r.imei) lastImei = r.imei;
  });
  return { unique: imeis, changes };
}

function _analyzeSuspects(suspects) {
  if (!suspects.length) return [];
  return suspects.map(s => {
    const calls = _cdrData.filter(r => r.a===s || r.b===s);
    return { number: s, calls: calls.length, records: calls.slice(0,10) };
  }).filter(s => s.calls > 0);
}

function _analyzeInternational() {
  return _cdrData.filter(r => {
    const n = r.b || r.a;
    return n && (n.startsWith('+') || n.startsWith('00')) && !n.startsWith('+92') && !n.startsWith('0092');
  });
}

function _analyzeLocations() {
  const cells = {};
  _cdrData.forEach(r => {
    if (r.cell) cells[r.cell] = (cells[r.cell]||0)+1;
  });
  return Object.entries(cells).sort((a,b)=>b[1]-a[1]).slice(0,15)
    .map(([cell,count])=>({ cell, count }));
}

function _analyzeCommon() {
  // Numbers appearing in both A and B party — strong contact
  const aSet = new Set(_cdrData.map(r=>r.a).filter(Boolean));
  const bSet = new Set(_cdrData.map(r=>r.b).filter(Boolean));
  const common = [...aSet].filter(n => bSet.has(n));
  return common.slice(0,10);
}

// ── AUTO FLAGS ────────────────────────────────────────────────
function _generateFlags(analysis, suspects) {
  const flags = [];

  if (analysis.nightCalls.length > 10)
    flags.push({ level:'high', icon:'🌙', title:'رات کے اوقات میں زیادہ کالیں', detail:`${analysis.nightCalls.length} کالیں رات 11 بجے سے صبح 5 بجے کے درمیان` });

  if (analysis.shortCalls.length > 20)
    flags.push({ level:'high', icon:'⚡', title:'مشکوک مختصر کالیں', detail:`${analysis.shortCalls.length} کالیں 5 سیکنڈ سے کم — نگرانی کی علامت ہو سکتی ہے` });

  if (analysis.imeiChanges.changes.length > 1)
    flags.push({ level:'high', icon:'📱', title:'IMEI تبدیلی', detail:`${analysis.imeiChanges.changes.length} مرتبہ موبائل ڈیوائس تبدیل کی گئی` });

  if (analysis.intlCalls.length > 0)
    flags.push({ level:'medium', icon:'🌍', title:'بین الاقوامی رابطے', detail:`${analysis.intlCalls.length} بیرون ملک کالیں` });

  if (suspects.length && analysis.suspectHits.length)
    flags.push({ level:'critical', icon:'🚨', title:'مشکوک نمبر سے رابطہ', detail:`${analysis.suspectHits.reduce((s,h)=>s+h.calls,0)} کالیں مشکوک نمبروں سے` });

  const top = analysis.topContacts[0];
  if (top && top.calls > _cdrData.length * 0.3)
    flags.push({ level:'medium', icon:'📞', title:'ایک نمبر سے غیر معمولی رابطہ', detail:`${top.num} — کل ${top.calls} کالیں (${Math.round(top.calls/_cdrData.length*100)}% کالیں)` });

  return flags;
}

// ── RENDER RESULTS ────────────────────────────────────────────
function _renderAnalysis(a, suspects) {
  const ov = a.overview;
  const flagColors = { critical:'var(--red)', high:'var(--amber)', medium:'#4fc3f7', low:'var(--green)' };

  return `
  <!-- Flags / Alerts -->
  ${a.flags.length ? `
  <div class="card" style="margin-bottom:12px;border:1px solid var(--red);">
    <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:10px;">🚨 خودکار انتباہات (${a.flags.length})</div>
    ${a.flags.map(f=>`
      <div style="display:flex;gap:10px;direction:rtl;align-items:flex-start;padding:8px;background:rgba(239,83,80,0.07);border-radius:8px;margin-bottom:6px;border-left:3px solid ${flagColors[f.level]||'var(--amber)'};">
        <span style="font-size:20px;">${f.icon}</span>
        <div>
          <div style="font-size:13px;font-weight:700;color:${flagColors[f.level]||'var(--amber)'};">${f.title}</div>
          <div style="font-size:12px;color:var(--text-secondary);">${f.detail}</div>
        </div>
        <span style="margin-inline-start:auto;font-size:10px;padding:2px 8px;border-radius:10px;background:${flagColors[f.level]};color:#fff;font-weight:700;white-space:nowrap;">${f.level.toUpperCase()}</span>
      </div>`).join('')}
  </div>` : ''}

  <!-- Overview -->
  <div class="card" style="margin-bottom:12px;">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;">📊 مجموعی جائزہ</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;direction:rtl;margin-bottom:10px;">
      ${[
        ['کل ریکارڈز', ov.totalCalls, '📋'],
        ['منفرد رابطے', ov.uniqueContacts, '👥'],
        ['رات کی کالیں', a.nightCalls.length, '🌙'],
        ['مختصر کالیں', a.shortCalls.length, '⚡'],
      ].map(([l,v,i])=>`
        <div style="background:var(--bg-tertiary);border-radius:8px;padding:10px;text-align:center;border:1px solid var(--border);">
          <div style="font-size:22px;">${i}</div>
          <div style="font-size:18px;font-weight:800;color:var(--accent);">${v}</div>
          <div style="font-size:10px;color:var(--text-muted);">${l}</div>
        </div>`).join('')}
    </div>
    <div style="font-size:12px;color:var(--text-secondary);line-height:2;">
      <div>📱 <b>Network:</b> ${_cdrMeta.network} &nbsp;|&nbsp; 📅 <b>مدت:</b> ${ov.dateFrom} — ${ov.dateTo}</div>
      <div>⬆️ <b>Outgoing:</b> ${ov.outgoing} &nbsp;|&nbsp; ⬇️ <b>Incoming:</b> ${ov.incoming} &nbsp;|&nbsp; ⏱ <b>کل وقت:</b> ${Math.round(ov.totalDuration/60)} منٹ</div>
      ${ov.primaryNumber?`<div>📞 <b>Primary Number:</b> ${ov.primaryNumber}</div>`:''}
    </div>
  </div>

  <!-- Suspect hits (if any) -->
  ${a.suspectHits.length ? `
  <div class="card" style="margin-bottom:12px;border:1px solid var(--red);">
    <div style="font-size:13px;font-weight:700;color:var(--red);margin-bottom:10px;">🚨 مشکوک نمبروں سے رابطہ</div>
    ${a.suspectHits.map(s=>`
      <div style="background:rgba(239,83,80,0.08);border-radius:8px;padding:10px;margin-bottom:8px;">
        <div style="font-size:14px;font-weight:700;color:var(--red);">📞 ${s.number} — ${s.calls} کالیں</div>
        ${s.records.map(r=>`<div style="font-size:11px;color:var(--text-muted);padding:2px 0;">${r.date} ${r.time} | ${r.type} | ${r.dur}s | Cell: ${r.cell||'—'}</div>`).join('')}
      </div>`).join('')}
  </div>` : ''}

  <!-- Top Contacts (Frequency Hierarchy) -->
  <div class="card" style="margin-bottom:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;">
      <div>
        <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px;">📞 سب سے زیادہ رابطے — ترتیب (زیادہ سے کم)</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">مشکوک نمبر 🚨 سے نشان زدہ · ساتھی ملزم تلاش کرنے میں مدد</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="_exportCdrExcel()">📊 Excel میں نکالیں</button>
    </div>
    <div style="overflow-x:auto;">
    <table class="data-table" style="width:100%;">
      <thead><tr><th>درجہ</th><th>نمبر</th><th>کالیں</th><th>کل وقت</th><th>اوسط</th><th>بار %</th><th>نوٹ</th></tr></thead>
      <tbody>
        ${a.topContacts.map((c,i)=>{
          const pct = Math.round(c.calls/ov.totalCalls*100);
          const isSusp = suspects.includes(c.num);
          const avg = c.calls ? Math.round(c.duration/c.calls) : 0;
          const rankBadge = i===0?'🥇':i===1?'🥈':i===2?'🥉':`${i+1}`;
          return `<tr style="${isSusp?'background:rgba(239,83,80,0.1);':i<3?'background:rgba(56,189,248,0.06);':''}">
            <td style="font-weight:700;color:${i<3?'var(--accent)':'var(--text-muted)'};font-size:${i<3?'14px':'12px'};">${rankBadge}</td>
            <td style="font-family:monospace;font-weight:700;color:${isSusp?'var(--red)':i<3?'var(--accent)':'var(--text-primary)'};"><span dir="ltr">${c.num}</span>${isSusp?' 🚨':''}</td>
            <td style="font-weight:700;">${c.calls}</td>
            <td>${Math.round(c.duration/60)} min</td>
            <td style="font-size:11px;color:var(--text-muted);">${avg}s</td>
            <td>
              <div style="background:var(--bg-tertiary);border-radius:4px;overflow:hidden;width:80px;height:12px;">
                <div style="background:${isSusp?'var(--red)':i<3?'var(--accent)':'var(--text-muted)'};height:100%;width:${Math.min(pct*3,100)}%;"></div>
              </div>
              <span style="font-size:10px;">${pct}%</span>
            </td>
            <td style="font-size:11px;color:var(--text-muted);">${isSusp?'🚨 مشکوک':i===0?'سب سے زیادہ':''}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>
    </div>
  </div>

  <!-- Hourly Pattern -->
  <div class="card" style="margin-bottom:12px;">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">🕐 وقت کا نمونہ (24 گھنٹے)</div>
    <div style="display:flex;align-items:flex-end;gap:3px;height:80px;padding-bottom:20px;position:relative;">
      ${a.timePattern.map((v,h)=>{
        const max = Math.max(...a.timePattern)||1;
        const pct = Math.round(v/max*100);
        const night = h>=23||h<=5;
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;" title="${h}:00 — ${v} calls">
          <div style="width:100%;background:${night?'var(--red)':'var(--accent)'};border-radius:2px 2px 0 0;height:${Math.max(pct*0.7,2)}px;opacity:0.85;"></div>
          <div style="font-size:8px;color:var(--text-faint);">${h}</div>
        </div>`;
      }).join('')}
    </div>
    <div style="font-size:10px;color:var(--text-muted);">
      🔴 رات کے اوقات (11pm-5am) &nbsp;|&nbsp; 🔵 دن کے اوقات
    </div>
  </div>

  <!-- IMEI Analysis -->
  ${a.imeiChanges.unique.length ? `
  <div class="card" style="margin-bottom:12px;">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">📱 IMEI / ڈیوائس تجزیہ</div>
    <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;">
      <b>${a.imeiChanges.unique.length}</b> مختلف ڈیوائسز استعمال کی گئیں
      ${a.imeiChanges.changes.length?`<span style="color:var(--red);margin-left:10px;">⚠️ ${a.imeiChanges.changes.length} مرتبہ ڈیوائس تبدیل</span>`:''}
    </div>
    ${a.imeiChanges.unique.map(i=>`<div style="font-family:monospace;font-size:12px;padding:4px 8px;background:var(--bg-tertiary);border-radius:4px;margin-bottom:4px;">${i}</div>`).join('')}
    ${a.imeiChanges.changes.map(c=>`
      <div style="font-size:11px;color:var(--amber);padding:4px 8px;background:rgba(245,158,11,0.1);border-radius:4px;margin-top:4px;">
        ⚠️ ${c.date} ${c.time}: ${c.from} → ${c.to}
      </div>`).join('')}
  </div>` : ''}

  <!-- International Calls -->
  ${a.intlCalls.length ? `
  <div class="card" style="margin-bottom:12px;">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">🌍 بین الاقوامی کالیں (${a.intlCalls.length})</div>
    ${a.intlCalls.slice(0,10).map(r=>`
      <div style="font-size:12px;padding:4px 8px;background:var(--bg-tertiary);border-radius:4px;margin-bottom:4px;display:flex;gap:10px;">
        <span>${r.date} ${r.time}</span>
        <span style="font-family:monospace;color:var(--accent);">${r.b||r.a}</span>
        <span style="color:var(--text-muted);">${r.dur}s</span>
      </div>`).join('')}
  </div>` : ''}

  <!-- Location Trail -->
  ${a.locationTrail.length ? `
  <div class="card" style="margin-bottom:12px;">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">📍 مقامات کا سراغ (Cell Tower)</div>
    ${a.locationTrail.map((l,i)=>`
      <div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:16px;">${i===0?'🔴':'📍'}</span>
        <div style="flex:1;font-size:12px;font-family:monospace;">${l.cell}</div>
        <div style="font-size:11px;color:var(--text-muted);">${l.count} بار</div>
        ${i===0?`<span style="font-size:10px;padding:2px 6px;background:var(--red);color:#fff;border-radius:8px;">سب سے زیادہ</span>`:''}
      </div>`).join('')}
  </div>` : ''}

  <!-- Expert Opinion -->
  <div class="card" style="margin-bottom:12px;border:1px solid var(--accent);">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;">📋 ماہرانہ رائے (Expert Opinion)</div>
    <div style="font-size:13px;color:var(--text-secondary);line-height:2;direction:rtl;text-align:right;font-family:'Jameel Noori Nastaleeq',serif;">
      ${_generateExpertOpinion(a, suspects)}
    </div>
  </div>

  <!-- Actions -->
  <div style="display:flex;gap:10px;direction:rtl;margin-bottom:16px;">
    <button class="btn btn-primary" style="flex:1;" onclick="_cdrPrintReport()">🖨️ رپورٹ پرنٹ کریں</button>
    <button class="btn btn-secondary" style="flex:1;" onclick="_cdrDownloadReport()">⬇️ رپورٹ ڈاؤنلوڈ کریں</button>
    <button class="btn btn-secondary" style="flex:1;" onclick="_cdrShareReport()">📱 WhatsApp شیئر</button>
  </div>`;
}

// ── EXPERT OPINION (rule-based, no AI) ────────────────────────
function _generateExpertOpinion(a, suspects) {
  const ov   = a.overview;
  const date = formatDate(new Date());
  let op = `مورخہ ${date} کو موصول شدہ CDR ریکارڈ کا تجزیہ کیا گیا۔<br>`;
  op += `Network: ${_cdrMeta.network} | کل ریکارڈز: ${ov.totalCalls} | مدت: ${ov.dateFrom} تا ${ov.dateTo}<br><br>`;

  if (a.flags.length === 0) {
    op += `CDR میں کوئی واضح مشکوک نمونہ نہیں ملا۔ تمام کالیں معمول کی ہیں۔`;
  } else {
    op += `تجزیے کے دوران مندرجہ ذیل قابل توجہ نکات سامنے آئے:<br><br>`;
    a.flags.forEach((f,i) => {
      op += `${i+1}۔ ${f.title}: ${f.detail}<br>`;
    });
    op += `<br>`;
    if (suspects.length && a.suspectHits.length) {
      op += `مشکوک نمبروں سے براہ راست رابطہ ثابت ہوتا ہے جو تفتیش کے لیے اہم ہے۔<br>`;
    }
    if (a.nightCalls.length > 10) {
      op += `رات کے اوقات میں غیر معمولی رابطے مشکوک سرگرمی کی طرف اشارہ کرتے ہیں۔<br>`;
    }
    if (a.imeiChanges.changes.length > 0) {
      op += `ڈیوائس تبدیلی شواہد چھپانے کی کوشش ہو سکتی ہے۔<br>`;
    }
    op += `<br>مذکورہ تجزیہ CDR ڈیٹا پر مبنی ہے۔ حتمی رائے مزید تفتیش پر منحصر ہے۔`;
  }
  return op;
}

// ── REPORT ACTIONS ────────────────────────────────────────────
function _cdrPrintReport() {
  const el = document.getElementById('cdr-results');
  if (!el) return;
  let _printHTML = '';
  _printHTML += (`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>CDR Analysis Report</title>
    <style>body{font-family:Arial,sans-serif;padding:20px;direction:rtl;}
    table{border-collapse:collapse;width:100%;}td,th{border:1px solid #ccc;padding:6px;font-size:12px;}
    th{background:#f0f0f0;}.card{border:1px solid #ccc;border-radius:8px;padding:12px;margin-bottom:12px;}
    </style></head><body>
    <h2 style="text-align:center;">CDR Analysis Report — Digital IO</h2>
    <p style="text-align:center;">FIR: ${_cdrCase?.fir_number||'—'} | Network: ${_cdrMeta.network} | Date: ${formatDate(new Date())}</p>
    ${el.innerHTML}
    </body></html>`);
  dioPrint(_printHTML);
  
}

function _cdrDownloadReport() {
  const el = document.getElementById('cdr-results');
  if (!el) return;
  const ov = _analyzeOverview();
  let txt = 'CDR ANALYSIS REPORT — DIGITAL IO\n';
  txt += '='.repeat(50)+'\n';
  txt += `FIR: ${_cdrCase?.fir_number||'—'}\n`;
  txt += `Network: ${_cdrMeta.network}\n`;
  txt += `Total Records: ${ov.totalCalls}\n`;
  txt += `Period: ${ov.dateFrom} to ${ov.dateTo}\n`;
  txt += `Generated: ${new Date().toLocaleString()}\n\n`;
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt],{type:'text/plain'}));
  a.download = 'CDR-Report-'+new Date().toISOString().slice(0,10)+'.txt';
  a.click();
  showToast('⬇️ رپورٹ ڈاؤنلوڈ ہو رہی ہے','success');
}

function _cdrShareReport() {
  const ov = _analyzeOverview();
  const txt = `CDR Analysis — Digital IO\nFIR: ${_cdrCase?.fir_number||'—'}\nNetwork: ${_cdrMeta.network}\nRecords: ${ov.totalCalls}\nDate: ${formatDate(new Date())}`;
  if (navigator.share) { navigator.share({title:'CDR Report',text:txt}).catch(()=>{}); }
  else { navigator.clipboard.writeText(txt).then(()=>showToast('Copy ہو گئی — WhatsApp میں paste کریں','info')); }
}
