/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — RFA فارم  (Request for Assistance)  — FULL ENGLISH
   Annex-A (RFA details) · Annex-B (assistance requested) · Annex-C (feedback)
   • A4 fixed · exactly 2 pages on print (page1: Annex-A+B, page2: Annex-C)
   • Poora form English · data system سے fetch (district/PS/FIR/officer)
     Urdu ڈیٹا خودکار English میں (transliteration) — ہر خانہ editable + محفوظ
   • Full-page view (chip bar ڈھک جاتی ہے) + formatting toolbar (challan/zimni جیسا)
   • Database: table `rfa_forms` — ایک مقدمے میں کئی RFA (history)
   ═══════════════════════════════════════════════════════════ */

let _rfaCaseId  = null;
let _rfaCase    = null;
let _rfaList    = [];
let _rfaCurrent = null;
let _rfaDirty   = false;

// ── Urdu → English transliteration ────────────────────────────
// Districts (Punjab) — standard government English spellings
const _RFA_DISTRICTS = {
  'ملتان':'Multan','لاہور':'Lahore','فیصل آباد':'Faisalabad','فیصل‌آباد':'Faisalabad',
  'راولپنڈی':'Rawalpindi','گوجرانوالہ':'Gujranwala','سرگودھا':'Sargodha','بہاولپور':'Bahawalpur',
  'ساہیوال':'Sahiwal','ڈیرہ غازی خان':'Dera Ghazi Khan','شیخوپورہ':'Sheikhupura','جھنگ':'Jhang',
  'قصور':'Kasur','اوکاڑہ':'Okara','وہاڑی':'Vehari','رحیم یار خان':'Rahim Yar Khan',
  'مظفر گڑھ':'Muzaffargarh','مظفرگڑھ':'Muzaffargarh','خانیوال':'Khanewal','لودھراں':'Lodhran',
  'پاکپتن':'Pakpattan','ننکانہ صاحب':'Nankana Sahib','چنیوٹ':'Chiniot','حافظ آباد':'Hafizabad',
  'منڈی بہاؤالدین':'Mandi Bahauddin','منڈی بہاءالدین':'Mandi Bahauddin','نارووال':'Narowal',
  'سیالکوٹ':'Sialkot','گجرات':'Gujrat','جہلم':'Jhelum','اٹک':'Attock','چکوال':'Chakwal',
  'بھکر':'Bhakkar','خوشاب':'Khushab','میانوالی':'Mianwali','لیہ':'Layyah','راجن پور':'Rajanpur',
  'بہاولنگر':'Bahawalnagar','ٹوبہ ٹیک سنگھ':'Toba Tek Singh',
};
// Common police-station / word parts
const _RFA_WORDS = {
  'صدر':'Saddar','شہر':'City','کینٹ':'Cantt','چھاؤنی':'Cantt','نیو':'New','پرانا':'Old',
  'گلگشت':'Gulgasht','مسلم':'Muslim','ٹاؤن':'Town','منڈی':'Mandi','سول':'Civil','لائن':'Lines',
  'تھانہ':'','پی ایس':'','ضلع':'',
  // common name components
  'محمد':'Muhammad','حسین':'Hussain','علی':'Ali','احمد':'Ahmed','احمر':'Ahmar','خان':'Khan',
  'شاہ':'Shah','عباس':'Abbas','حسن':'Hassan','رضا':'Raza','بشیر':'Bashir','نذیر':'Nazir',
  'اکرم':'Akram','اسلم':'Aslam','ارشد':'Arshad','طارق':'Tariq','اقبال':'Iqbal','جاوید':'Javed',
  'ندیم':'Nadeem','عمران':'Imran','عرفان':'Irfan','ذوالفقار':'Zulfiqar','غلام':'Ghulam',
  'عبد':'Abdul','عبدالرحمن':'Abdul Rehman','فیاض':'Fayyaz','شاد':'Shad','بی بی':'Bibi',
};
// Rank shorthand (usually already English, but just in case)
const _RFA_RANKS = {
  'اے ایس آئی':'ASI','ایس آئی':'SI','انسپکٹر':'Inspector','ہیڈ کانسٹیبل':'Head Constable',
  'کانسٹیبل':'Constable','ڈی ایس پی':'DSP','ایس پی':'SP','ایس ایچ او':'SHO',
};
// Character-level fallback (rough transliteration for unknown words)
const _RFA_CHARS = {
  'آ':'a','ا':'a','ب':'b','پ':'p','ت':'t','ٹ':'t','ث':'s','ج':'j','چ':'ch','ح':'h','خ':'kh',
  'د':'d','ڈ':'d','ذ':'z','ر':'r','ڑ':'r','ز':'z','ژ':'zh','س':'s','ش':'sh','ص':'s','ض':'z',
  'ط':'t','ظ':'z','ع':'a','غ':'gh','ف':'f','ق':'q','ک':'k','گ':'g','ل':'l','م':'m','ن':'n',
  'ں':'n','و':'o','ؤ':'o','ہ':'h','ھ':'h','ة':'h','ء':'','ی':'i','ي':'i','ئ':'y','ے':'e','۔':'','،':',',
};
function _rfaTranslitWord(w) {
  if (!w) return '';
  if (_RFA_DISTRICTS[w]) return _RFA_DISTRICTS[w];
  if (_RFA_WORDS[w] !== undefined) return _RFA_WORDS[w];
  if (_RFA_RANKS[w]) return _RFA_RANKS[w];
  // Joined word ending with a known district (e.g. صدرملتان → صدر + ملتان)
  for (const d in _RFA_DISTRICTS) {
    if (w.length > d.length && w.endsWith(d)) {
      const pre = _rfaTranslitWord(w.slice(0, w.length - d.length));
      return (pre ? pre + ' ' : '') + _RFA_DISTRICTS[d];
    }
  }
  let out = '';
  for (const ch of w) out += (_RFA_CHARS[ch] !== undefined) ? _RFA_CHARS[ch] : ch;
  out = out.replace(/\s+/g, ' ').trim();
  return out ? out.charAt(0).toUpperCase() + out.slice(1) : '';
}
// Convert a whole Urdu string → English (word by word). Already-English text passes through.
function _rfaEn(text) {
  const t = String(text == null ? '' : text).trim();
  if (!t) return '';
  if (!/[؀-ۿ]/.test(t)) return t;            // no Urdu → return as-is
  if (_RFA_DISTRICTS[t]) return _RFA_DISTRICTS[t];      // whole-string district
  if (_RFA_RANKS[t]) return _RFA_RANKS[t];             // whole-string rank
  const parts = t.split(/\s+/).map(_rfaTranslitWord).filter(Boolean);
  return parts.join(' ');
}

// ── OPEN → list ───────────────────────────────────────────────
async function openRfaForm(caseId) {
  _rfaCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
            || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _rfaCaseId) {
    try { _rfaCase = await getCase(_rfaCaseId); } catch(_) { _rfaCase = null; }
  }
  await _loadRfaList();
  // Full-page view (chip bar ڈھک جائے) — jaise saza/challan
  if (typeof _dioOpenDocTab === 'function') { try { _dioOpenDocTab('rfa_form'); } catch(_) {} }
  _renderRfaList();
}
window.openRfaForm = openRfaForm;

async function _loadRfaList() {
  _rfaList = [];
  try {
    const { data } = await supabaseClient.from('rfa_forms').select('*')
      .eq('case_id', _rfaCaseId).order('created_at', { ascending: true });
    _rfaList = data || [];
    try { localStorage.setItem('dio_rfalist_' + _rfaCaseId, JSON.stringify(_rfaList)); } catch(_) {}
  } catch(_) {
    try { _rfaList = JSON.parse(localStorage.getItem('dio_rfalist_' + _rfaCaseId) || '[]'); }
    catch(_2) { _rfaList = []; }
  }
}

function _rfaStrip(s) { return (s == null) ? '' : String(s).replace(/<[^>]*>/g, '').trim(); }

// ── LIST view ─────────────────────────────────────────────────
function _renderRfaList() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;

  const rows = _rfaList.map((r, i) => {
    const fd = r.form_data || {};
    const no = _rfaStrip(r.rfa_number || fd.a_rfa_no) || ('RFA #' + (i + 1));
    const purpose = _rfaStrip(fd.a_purpose) || '—';
    const dt = (r.created_at ? String(r.created_at).slice(0, 10) : '');
    const done = r.status === 'complete';
    return `
    <div onclick="_openRfaDoc('${r.id}')" style="display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bg-card);border:1px solid var(--border);border-radius:10px;margin-bottom:8px;cursor:pointer;direction:rtl;"
      onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
      <span style="font-size:20px;">${done ? '✅' : '📝'}</span>
      <div style="flex:1;min-width:0;">
        <div style="font-weight:700;font-size:15px;direction:ltr;text-align:left;font-family:Arial,sans-serif;">${esc(no)}</div>
        <div style="font-size:13px;color:var(--text-muted);direction:ltr;text-align:left;font-family:Arial,sans-serif;">Purpose: ${esc(purpose)}${dt ? '  ·  ' + dt : ''}</div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();_rfaDelete('${r.id}')" title="حذف کریں">🗑️</button>
      <button class="btn btn-primary btn-sm" onclick="event.stopPropagation();_openRfaDoc('${r.id}')">کھولیں</button>
    </div>`;
  }).join('');

  area.innerHTML = `
  <div style="padding:16px;direction:rtl;height:100%;overflow-y:auto;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">
    <div style="display:flex;align-items:center;gap:10px;border-bottom:2px solid var(--accent);padding-bottom:8px;margin-bottom:14px;">
      <div style="font-size:18px;font-weight:800;color:var(--accent);">RFA فارم — فہرست</div>
      <button class="btn btn-primary btn-sm" style="margin-right:auto;" onclick="_newRfa()">+ نیا RFA فارم</button>
    </div>
    ${_rfaList.length ? rows : `
      <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
        <div style="font-size:40px;margin-bottom:10px;">📄</div>
        <div style="font-size:16px;">ابھی کوئی RFA محفوظ نہیں — "نیا RFA فارم" دبائیں</div>
      </div>`}
  </div>`;
}
window._renderRfaList = _renderRfaList;

function _newRfa()      { _rfaCurrent = null; _rfaDirty = false; _renderRfaForm(); }
function _openRfaDoc(id){ _rfaCurrent = _rfaList.find(r => String(r.id) === String(id)) || null; _rfaDirty = false; _renderRfaForm(); }
function _rfaBackToList(){ if (_rfaDirty && !confirm('غیر محفوظ تبدیلیاں ضائع ہو جائیں گی۔ واپس فہرست پر جائیں؟')) return; _renderRfaList(); }
window._newRfa = _newRfa; window._openRfaDoc = _openRfaDoc; window._rfaBackToList = _rfaBackToList;

// ── formatting toolbar button (challan/zimni جیسا) ────────────
function _rfaBtn() {
  return 'min-width:30px;height:30px;border:1px solid var(--border);background:var(--bg-card);' +
         'color:var(--text-primary);border-radius:6px;cursor:pointer;font-size:14px;';
}
function _rfaFmt(cmd) {
  try { document.execCommand(cmd, false, null); } catch(_) {}
}
window._rfaFmt = _rfaFmt;

// ── FORM view (A4) ────────────────────────────────────────────
function _renderRfaForm() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;

  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _rfaCase || {};
  const s = (_rfaCurrent && _rfaCurrent.form_data) ? _rfaCurrent.form_data : {};
  const _san = (typeof sanitizeHtml === 'function') ? sanitizeHtml : (x => (x==null?'':String(x)));
  const v = (k, def) => _san((s[k] !== undefined && s[k] !== null && s[k] !== '') ? s[k] : (def || ''));

  // system data → English
  const dstEn = _rfaEn(o.district || c.case_district || '');
  const staEn = _rfaEn(o.station  || c.case_station  || '');
  const fir   = c.fir_number || '';
  const ionEn = _rfaEn(o.full_name || '');
  const rnk   = _rfaEn(o.designation || o.rank || '');
  const phone = o.official_phone || o.phone || '';

  const editFont = "font-family:Arial,'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',sans-serif;";
  const rTh  = "border:1px solid #333;padding:6px 9px;background:#ececec;font-weight:700;text-align:left;font-size:12.5px;font-family:Arial,sans-serif;";
  const rThC = rTh.replace('text-align:left', 'text-align:center');
  const rTd  = "border:1px solid #333;padding:6px 9px;font-size:12.5px;text-align:left;font-family:Arial,sans-serif;vertical-align:middle;";
  const rTdC = rTd.replace('text-align:left', 'text-align:center');
  const ec = (k, def) => `<td contenteditable="true" data-k="${k}" oninput="_rfaBold(this)" style="border:1px solid #333;padding:6px 9px;font-size:12.5px;text-align:left;${editFont}unicode-bidi:plaintext;${v(k,def)?'font-weight:bold;':''}">${v(k, def)}</td>`;
  // inline editable span (for header / signature)
  const es = (k, def, extra) => `<span contenteditable="true" data-k="${k}" oninput="_rfaBold(this)" style="${editFont}unicode-bidi:plaintext;${extra||''}${v(k,def)?'font-weight:bold;':''}">${v(k, def)}</span>`;

  const pageStyle = "width:210mm;min-height:297mm;box-sizing:border-box;margin:0 auto 18px;padding:16mm 15mm;background:#fff;color:#111;direction:ltr;text-align:left;font-family:Arial,'Times New Roman',sans-serif;font-size:13px;line-height:1.6;box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:3px;";

  const headBlock = (annex) => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;border-bottom:2px solid #333;padding-bottom:6px;margin-bottom:2px;">
      <span style="font-weight:bold;font-size:15px;">Police Department</span>
      <span style="font-weight:bold;font-size:15px;">District ${es('h_district', dstEn)}</span>
    </div>
    <div style="text-align:right;font-size:12px;font-style:italic;margin:2px 0;">${annex}</div>`;

  const aRows = [
    ['1','RFA Number','a_rfa_no',''],
    ['2','Requesting District','a_req_dist', dstEn],
    ['3','Date of Request','a_date_req',''],
    ['4','Date when Assistance is Needed','a_date_need',''],
    ['5','Date of Expiry of Request','a_date_exp',''],
    ['6','Case FIR No.','a_fir', fir],
    ['7','Police Station','a_ps', staEn],
    ['8','Assisting District','a_assist_dist',''],
    ['9','Police Station of Mission Jurisdiction','a_mission_ps',''],
    ['10','Purpose of Request','a_purpose',''],
    ['11','Name of Officer Requesting Assistance','a_officer', ionEn],
    ['12','Rank','a_rank', rnk],
    ['13','Posting','a_posting', staEn],
    ['14','Cell Phone of the Officer','a_cell', phone],
    ['15','Status','a_status',''],
  ];
  const bRows = [
    ['1','Upper Subordinates','b_upper'], ['2','Lower Subordinates','b_lower'],
    ['3','Vehicles','b_vehicles'], ['4','Elite Teams','b_elite'],
    ['5','Locator','b_locator'], ['6','Other','b_other'],
  ];
  const cRows = [
    ['1','Has the request been completed? Yes / No','c_completed'],
    ['2','Date of completion','c_date'],
    ['3','Was the assistance provided? Yes / No','c_provided'],
    ['4','Check the items requested for assistance','c_items'],
    ['5','Was the purpose of mission achieved?','c_purpose'],
    ['6','If No, what was the reason?','c_reason'],
  ];

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:ltr;">
    <!-- Toolbar: formatting (challan/zimni جیسا) + save/print (full-page میں چھپ جاتے ہیں) -->
    <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <button class="btn btn-secondary btn-sm" onclick="_rfaBackToList()" style="direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">← واپس فہرست</button>
      <span style="width:1px;height:22px;background:var(--border);margin:0 4px;"></span>
      <button onmousedown="event.preventDefault()" onclick="_rfaFmt('bold')" title="Bold" style="${_rfaBtn()}font-weight:900;">B</button>
      <button onmousedown="event.preventDefault()" onclick="_rfaFmt('italic')" title="Italic" style="${_rfaBtn()}font-style:italic;">I</button>
      <button onmousedown="event.preventDefault()" onclick="_rfaFmt('underline')" title="Underline" style="${_rfaBtn()}text-decoration:underline;">U</button>
      <span style="width:1px;height:22px;background:var(--border);margin:0 4px;"></span>
      <button onmousedown="event.preventDefault()" onclick="_rfaFmt('justifyLeft')" title="Left" style="${_rfaBtn()}">⇤</button>
      <button onmousedown="event.preventDefault()" onclick="_rfaFmt('justifyCenter')" title="Center" style="${_rfaBtn()}">⇔</button>
      <button onmousedown="event.preventDefault()" onclick="_rfaFmt('justifyRight')" title="Right" style="${_rfaBtn()}">⇥</button>
      <span style="width:1px;height:22px;background:var(--border);margin:0 4px;"></span>
      <button onmousedown="event.preventDefault()" onclick="_rfaFmt('undo')" title="Undo" style="${_rfaBtn()}">↶</button>
      <button onmousedown="event.preventDefault()" onclick="_rfaFmt('redo')" title="Redo" style="${_rfaBtn()}">↷</button>
      <div style="margin-left:auto;display:flex;gap:6px;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
        <button class="btn btn-primary btn-sm dio-modbtn" onclick="_saveRfa()">💾 محفوظ کریں</button>
        <button class="btn btn-secondary btn-sm dio-modbtn" onclick="_printRfa()">🖨️ پرنٹ کریں</button>
      </div>
    </div>

    <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-tertiary);">
      <div id="rfa-doc" oninput="_rfaDirty=true">

        <!-- ═══ PAGE 1 — Annex-A + Annex-B ═══ -->
        <div class="rfa-page" style="${pageStyle}">
          ${headBlock('Annex-A')}
          <div style="text-align:center;font-size:17px;font-weight:bold;text-decoration:underline;margin:8px 0 14px;">Request for Assistance (RFA)</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
            <tr><th style="${rThC}width:8%;">Sr.</th><th style="${rTh}width:44%;">Particulars</th><th style="${rTh}">Details</th></tr>
            ${aRows.map(r=>`<tr><td style="${rTdC}">${r[0]}</td><td style="${rTd}font-weight:600;">${r[1]}</td>${ec(r[2], r[3])}</tr>`).join('')}
          </table>

          ${headBlock('Annex-B')}
          <div style="text-align:center;font-size:16px;font-weight:bold;text-decoration:underline;margin:8px 0 14px;">Assistance Requested in the RFA</div>
          <table style="width:100%;border-collapse:collapse;margin-bottom:22px;">
            <tr><th style="${rThC}width:8%;">Sr.</th><th style="${rTh}width:56%;">Item</th><th style="${rTh}">Number / Quantity</th></tr>
            ${bRows.map(r=>`<tr><td style="${rTdC}">${r[0]}</td><td style="${rTd}">${r[1]}</td>${ec(r[2],'')}</tr>`).join('')}
          </table>

          <!-- Forwarding + signature — italic -->
          <div style="font-style:italic;margin-bottom:6px;">Forwarded please,</div>
          <div style="display:flex;justify-content:space-between;margin-top:40px;font-style:italic;">
            <div style="text-align:left;">
              <div>${es('sig_officer', ionEn, 'font-style:italic;')}${rnk?(', '+esc(rnk)):''}</div>
              <div>P.S ${es('sig_ps', staEn, 'font-style:italic;')}.</div>
            </div>
            <div style="text-align:left;">
              <div>&nbsp;</div>
              <div>SHO PS ${es('sig_sho_ps', staEn, 'font-style:italic;')}.</div>
            </div>
          </div>
        </div>

        <!-- ═══ PAGE 2 — Annex-C ═══ -->
        <div class="rfa-page" style="${pageStyle}">
          ${headBlock('Annex-C')}
          <div style="text-align:center;font-size:17px;font-weight:bold;text-decoration:underline;margin:8px 0 14px;">Feedback Form</div>
          <table style="width:100%;border-collapse:collapse;">
            <tr><th style="${rThC}width:8%;">Sr.</th><th style="${rTh}width:56%;">Question</th><th style="${rTh}">Feedback</th></tr>
            ${cRows.map(r=>`<tr><td style="${rTdC}">${r[0]}</td><td style="${rTd}">${r[1]}</td>${ec(r[2],'')}</tr>`).join('')}
          </table>
        </div>

      </div>
    </div>
  </div>`;
}
window._renderRfaForm = _renderRfaForm;

function _rfaBold(el) {
  if (!el) return;
  const t = (el.innerText || el.textContent || '').trim();
  el.style.fontWeight = t ? 'bold' : 'normal';
}
window._rfaBold = _rfaBold;

// ── COLLECT / SAVE / DELETE / PRINT ───────────────────────────
function _collectRfa() {
  const doc = document.getElementById('rfa-doc');
  const data = {};
  if (doc) doc.querySelectorAll('[data-k]').forEach(el => { data[el.dataset.k] = el.innerHTML; });
  return data;
}

async function _saveRfa() {
  if (!_rfaCaseId) { showToast('❌ مقدمہ منتخب نہیں', 'error'); return; }
  const form_data = _collectRfa();
  const rfa_number = _rfaStrip(form_data.a_rfa_no) || null;
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    let saved = null;
    if (_rfaCurrent && _rfaCurrent.id && String(_rfaCurrent.id).indexOf('tmp_') !== 0) {
      const { data, error } = await supabaseClient.from('rfa_forms')
        .update({ rfa_number, status: 'complete', form_data })
        .eq('id', _rfaCurrent.id).select().single();
      if (error) throw error;
      saved = data;
    } else {
      const rec = { case_id: _rfaCaseId, rfa_number, status: 'complete', form_data };
      if (oid) rec.officer_id = oid;
      const { data, error } = await supabaseClient.from('rfa_forms').insert(rec).select().single();
      if (error) throw error;
      saved = data;
    }
    _rfaCurrent = saved;
    const idx = _rfaList.findIndex(r => String(r.id) === String(saved.id));
    if (idx >= 0) _rfaList[idx] = saved; else _rfaList.push(saved);
    try { localStorage.setItem('dio_rfalist_' + _rfaCaseId, JSON.stringify(_rfaList)); } catch(_) {}
    // chip ko GREEN karne ke liye _misalDocs mein bithao (RFA alag table use karti hai)
    try { if (typeof _misalDocs !== 'undefined' && _misalDocs) _misalDocs['rfa_form'] = { document_type:'rfa_form', status:'complete', content:{ count:_rfaList.length } }; } catch(_) {}
    try { if (typeof _refreshMisalBar === 'function') _refreshMisalBar(); } catch(_) {}
    try { if (typeof dioRegisterSaved === 'function') dioRegisterSaved('rfa', 'RFA فارم', { case_id: _rfaCaseId, rfa_id: saved.id }); } catch(_) {}
    _rfaDirty = false;
    showToast('✅ RFA فارم محفوظ ہو گیا', 'success');
  } catch(e) {
    try {
      const tmp = { id: (_rfaCurrent && _rfaCurrent.id) || ('tmp_' + Date.now()), case_id: _rfaCaseId,
                    rfa_number, status: 'complete', form_data, created_at: new Date().toISOString() };
      const idx = _rfaList.findIndex(r => String(r.id) === String(tmp.id));
      if (idx >= 0) _rfaList[idx] = tmp; else _rfaList.push(tmp);
      _rfaCurrent = tmp;
      localStorage.setItem('dio_rfalist_' + _rfaCaseId, JSON.stringify(_rfaList));
      showToast('⚠️ آف لائن محفوظ (انٹرنیٹ آنے پر سنک کریں)', 'info');
    } catch(_) { showToast('❌ ' + e.message, 'error'); }
  }
}
window._saveRfa = _saveRfa;

async function _rfaDelete(id) {
  if (!confirm('یہ RFA فارم حذف کر دیا جائے؟')) return;
  try { if (String(id).indexOf('tmp_') !== 0) await supabaseClient.from('rfa_forms').delete().eq('id', id); }
  catch(e) { showToast('❌ ' + e.message, 'error'); return; }
  _rfaList = _rfaList.filter(r => String(r.id) !== String(id));
  try { localStorage.setItem('dio_rfalist_' + _rfaCaseId, JSON.stringify(_rfaList)); } catch(_) {}
  try { if (typeof _misalDocs !== 'undefined' && _misalDocs) { if (_rfaList.length) _misalDocs['rfa_form'] = { document_type:'rfa_form', status:'complete', content:{ count:_rfaList.length } }; else delete _misalDocs['rfa_form']; } } catch(_) {}
  try { if (typeof _refreshMisalBar === 'function') _refreshMisalBar(); } catch(_) {}
  showToast('🗑️ حذف ہو گیا', 'success');
  _renderRfaList();
}
window._rfaDelete = _rfaDelete;

// Print — A4, exactly 2 pages (tight so page 1 fits Annex-A+B, page 2 Annex-C)
function _printRfa() {
  const doc = document.getElementById('rfa-doc');
  if (!doc) return;
  const html = `<!DOCTYPE html><html dir="ltr"><head><meta charset="UTF-8"><title> </title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
    <style>
      @page{ size:A4; margin:11mm; }
      *{ box-sizing:border-box; }
      body{ font-family:Arial,'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Times New Roman',sans-serif;
            direction:ltr; text-align:left; font-size:10.5px !important; line-height:1.32 !important; color:#111; margin:0; }
      table{ border-collapse:collapse; width:100%; margin-bottom:12px !important; }
      /* inline cell styles ko override (warna print 3 safhe par chala jata tha) */
      td,th{ border:1px solid #333 !important; padding:2px 6px !important; font-size:10.5px !important; }
      .rfa-page{ page-break-after:always; box-shadow:none !important; border-radius:0 !important;
                 width:auto !important; min-height:auto !important; padding:0 !important; margin:0 !important;
                 font-size:10.5px !important; line-height:1.32 !important; }
      .rfa-page:last-child{ page-break-after:auto; }
      .rfa-page tr{ page-break-inside:avoid; }
      .rfa-page > div{ margin-top:4px !important; margin-bottom:4px !important; }
    </style></head><body>${doc.innerHTML}</body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
  else { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(()=>w.print(), 400); }
}
window._printRfa = _printRfa;
