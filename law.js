/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — LAW LIBRARY  (law.js)
   Upload · Download · Read Online · Print · Add New
   Built-in PPC + CrPC sections + custom uploads
   ═══════════════════════════════════════════════════════════ */

registerPage('law', renderLaw);

// ── BUILT-IN LAW SECTIONS ────────────────────────────────────
const LAWS = [
  // PPC
  { id:'ppc-302', cat:'PPC', title:'دفعہ 302 — قتل عمد', short:'302 PPC', content:'جو شخص کسی انسان کا قتل عمد کرے اسے سزائے موت یا عمر قید دی جائے گی اور جرمانہ بھی ہو گا۔ (قصاص/دیت کے احکام اسلامی شریعت کے مطابق لاگو ہوں گے)' },
  { id:'ppc-306', cat:'PPC', title:'دفعہ 306 — قتل بالعفو', short:'306 PPC', content:'جب مقتول کے وارثان قاتل کو معاف کر دیں تو عدالت تعزیر کے طور پر 25 سال تک قید کی سزا دے سکتی ہے۔' },
  { id:'ppc-307', cat:'PPC', title:'دفعہ 307 — قتل کی کوشش', short:'307 PPC', content:'جو شخص کسی انسان کو قتل کرنے کی کوشش کرے اسے 10 سال تک قید اور جرمانہ ہو سکتا ہے۔ اگر زخم آئے تو اضافی سزا۔' },
  { id:'ppc-320', cat:'PPC', title:'دفعہ 320 — غیر ارادی قتل', short:'320 PPC', content:'غیر ارادی قتل (Culpable Homicide) — 10 سال تک قید یا جرمانہ یا دونوں۔' },
  { id:'ppc-324', cat:'PPC', title:'دفعہ 324 — قتل کی کوشش', short:'324 PPC', content:'قتل کرنے کی نیت سے زخمی کرنا — 10 سال قید اور جرمانہ۔' },
  { id:'ppc-365', cat:'PPC', title:'دفعہ 365 — اغوا', short:'365 PPC', content:'کسی شخص کو غیر قانونی طور پر قید میں رکھنا یا اغوا کرنا — 7 سال قید اور جرمانہ۔' },
  { id:'ppc-365b', cat:'PPC', title:'دفعہ 365-B — اغوا برائے تاوان', short:'365-B PPC', content:'تاوان کے لیے اغوا — موت یا عمر قید اور جرمانہ۔' },
  { id:'ppc-377', cat:'PPC', title:'دفعہ 377 — غیر فطری جرائم', short:'377 PPC', content:'2 سال سے عمر قید تک اور جرمانہ۔' },
  { id:'ppc-392', cat:'PPC', title:'دفعہ 392 — ڈکیتی', short:'392 PPC', content:'ڈکیتی — 10 سال تک سخت قید اور جرمانہ۔ اگر شب میں ہو تو 14 سال۔' },
  { id:'ppc-395', cat:'PPC', title:'دفعہ 395 — ڈکیتی بالاشتراک', short:'395 PPC', content:'5 یا زیادہ افراد کا گروہ ڈکیتی کرے — عمر قید یا 10 سال سخت قید اور جرمانہ۔' },
  { id:'ppc-396', cat:'PPC', title:'دفعہ 396 — قتل بمعہ ڈکیتی', short:'396 PPC', content:'ڈکیتی کے دوران قتل — موت یا عمر قید۔' },
  { id:'ppc-406', cat:'PPC', title:'دفعہ 406 — خیانت', short:'406 PPC', content:'امانت میں خیانت — 3 سال قید اور جرمانہ یا دونوں۔' },
  { id:'ppc-419', cat:'PPC', title:'دفعہ 419 — دھوکہ', short:'419 PPC', content:'کسی کو نقصان پہنچانے کی نیت سے دھوکہ — 3 سال قید یا جرمانہ یا دونوں۔' },
  { id:'ppc-420', cat:'PPC', title:'دفعہ 420 — فراڈ', short:'420 PPC', content:'فراڈ اور بددیانتی سے جائیداد لینا — 7 سال قید اور جرمانہ۔' },
  { id:'ppc-436', cat:'PPC', title:'دفعہ 436 — آتشزدگی', short:'436 PPC', content:'کسی عمارت یا گاڑی کو آگ لگانا — عمر قید یا 10 سال اور جرمانہ۔' },
  { id:'ppc-447', cat:'PPC', title:'دفعہ 447 — تجاوز', short:'447 PPC', content:'غیر قانونی تجاوز — 3 ماہ قید یا 500 روپے جرمانہ یا دونوں۔' },
  { id:'ppc-452', cat:'PPC', title:'دفعہ 452 — مسلح تجاوز', short:'452 PPC', content:'گھر میں مسلح گھسنا — 7 سال قید اور جرمانہ۔' },
  { id:'ppc-489f', cat:'PPC', title:'دفعہ 489-F — چیک ڈس آنر', short:'489-F PPC', content:'جھوٹا چیک دینا — 3 سال قید یا جرمانہ یا دونوں۔' },
  { id:'ppc-506', cat:'PPC', title:'دفعہ 506 — دھمکی', short:'506 PPC', content:'جان سے مارنے کی دھمکی — 2 سال قید یا جرمانہ۔ اگر ملکیت نقصان کی دھمکی ہو — 7 سال۔' },
  { id:'ppc-511', cat:'PPC', title:'دفعہ 511 — جرم کی کوشش', short:'511 PPC', content:'اصل جرم کی نصف سزا۔' },
  // CrPC
  { id:'crpc-54', cat:'CrPC', title:'دفعہ 54 — بغیر وارنٹ گرفتاری', short:'54 CrPC', content:'پولیس افسر مشکوک شخص کو بغیر وارنٹ گرفتار کر سکتا ہے جب معقول شبہ ہو کہ وہ قابل دست اندازی جرم میں ملوث ہے۔' },
  { id:'crpc-155', cat:'CrPC', title:'دفعہ 155 — غیر قابل دست اندازی جرم', short:'155 CrPC', content:'غیر قابل دست اندازی جرائم میں مجسٹریٹ کی اجازت ضروری ہے۔' },
  { id:'crpc-161', cat:'CrPC', title:'دفعہ 161 — پولیس بیانات', short:'161 CrPC', content:'تفتیش کے دوران گواہان کے بیانات قلمبند کرنا — یہ بیانات عدالت میں ثبوت کے طور پر استعمال ہو سکتے ہیں۔' },
  { id:'crpc-173', cat:'CrPC', title:'دفعہ 173 — پولیس رپورٹ', short:'173 CrPC', content:'تفتیش مکمل ہونے پر پولیس افسر 173 رپورٹ مجسٹریٹ کو بھیجے گا — اس میں تمام واقعات، گواہان اور شواہد کا ذکر ہو۔ عام طور پر 14 دن میں جمع کروانی ہوتی ہے۔' },
  { id:'crpc-188', cat:'CrPC', title:'دفعہ 188 — اشتہاری', short:'188 CrPC', content:'فرار ملزم کو اشتہاری قرار دینے کی کارروائی — 30 دن کا اشتہار۔' },
  { id:'crpc-436', cat:'CrPC', title:'دفعہ 436 — ضمانت', short:'436 CrPC', content:'قابل ضمانت جرائم میں گرفتاری کے وقت ضمانت کا حق۔' },
  { id:'crpc-497', cat:'CrPC', title:'دفعہ 497 — ضمانت کی درخواست', short:'497 CrPC', content:'ناقابل ضمانت جرائم میں عدالت صوابدیدی بنیاد پر ضمانت دے سکتی ہے — بیمار، عورت، بچہ وغیرہ۔' },
  // CNSA
  { id:'cnsa-6', cat:'CNSA', title:'CNSA دفعہ 6 — منشیات تیار کرنا', short:'6 CNSA', content:'منشیات تیار کرنا یا درآمد کرنا — موت یا عمر قید۔' },
  { id:'cnsa-9', cat:'CNSA', title:'CNSA دفعہ 9 — منشیات رکھنا', short:'9 CNSA', content:'منشیات اپنے پاس رکھنا — مقدار کے مطابق 2 سال سے موت تک۔' },
  // Arms Ordinance
  { id:'arms-13', cat:'ہتھیار', title:'آرمز آرڈیننس دفعہ 13', short:'Arms 13', content:'ممنوع ہتھیار رکھنا — 7 سال سے عمر قید تک۔' },
];

// ── MAIN RENDER ───────────────────────────────────────────────
async function renderLaw(container) {
  container.innerHTML = `<div style="max-width:900px;margin:0 auto;" id="law-root">
    <div style="text-align:center;padding:20px;color:var(--text-muted);">⏳ لوڈ ہو رہا ہے...</div>
  </div>`;
  await _buildLaw();
}

async function _buildLaw() {
  const root = document.getElementById('law-root');
  if (!root) return;

  // Load custom uploaded laws
  let customLaws = [];
  try {
    const oid = await getOfficerId();
    const { data } = await supabaseClient.from('law_library')
      .select('*').eq('officer_id', oid)
      .order('created_at', { ascending: false });
    customLaws = data || [];
  } catch(_) {}

  const cats = ['سب', 'PPC', 'CrPC', 'CNSA', 'ہتھیار', 'کسٹم', 'دیگر'];

  root.innerHTML = `
  <!-- Back + Header -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;direction:rtl;">
    <button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);">← واپس</button>
    <div>
      <div style="font-size:18px;font-weight:800;">⚖️ قانونی لائبریری</div>
      <div style="font-size:12px;color:var(--text-muted);">PPC · CrPC · CNSA · ہتھیار · کسٹم اپ لوڈ</div>
    </div>
    <div style="margin-left:auto;">
      <button class="btn btn-primary" onclick="_openAddLaw()">+ نئی قانونی دفعہ</button>
    </div>
  </div>

  <!-- Search -->
  <div style="position:relative;margin-bottom:12px;">
    <span style="position:absolute;right:14px;top:50%;transform:translateY(-50%);">🔍</span>
    <input id="law-search" class="form-input" placeholder="دفعہ نمبر یا کلیدی الفاظ..." oninput="_filterLaws(this.value)"
      style="padding-right:40px;direction:rtl;">
  </div>

  <!-- Category filters -->
  <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap;direction:rtl;">
    ${cats.map((c,i) => `
      <button id="cat-${c}" onclick="_setCat('${c}')"
        class="btn ${i===0?'btn-primary':'btn-secondary'}" style="font-size:12px;padding:5px 12px;">
        ${c}
      </button>`).join('')}
  </div>

  <!-- External links -->
  <div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;direction:rtl;">
    <button class="btn btn-secondary btn-sm" onclick="window.open('https://punjabcode.punjab.gov.pk/urdu/index')">🔗 Punjab Code</button>
    <button class="btn btn-secondary btn-sm" onclick="window.open('https://pakistancode.gov.pk')">🔗 Pakistan Code</button>
    <button class="btn btn-secondary btn-sm" onclick="window.open('https://data.lhc.gov.pk/dynamic/approved_judgments_result_new.php')">🔗 LHC فیصلے</button>
    <button class="btn btn-secondary btn-sm" onclick="window.open('https://supremecourt.gov.pk')">🔗 Supreme Court</button>
  </div>

  <!-- Custom uploaded laws -->
  ${customLaws.length ? `
  <div class="card" style="margin-bottom:14px;">
    <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;">📁 میری اپ لوڈ کردہ دفعات / فائلیں (${customLaws.length})</div>
    ${customLaws.map(l => `
      <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);align-items:flex-start;direction:rtl;">
        <span style="font-size:20px;">${l.file_url ? '📄' : '📋'}</span>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:700;">${l.title}</div>
          <div style="font-size:11px;color:var(--text-muted);">${l.category} · ${formatDate(l.created_at)}</div>
          ${l.content ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:3px;">${l.content.slice(0,100)}${l.content.length>100?'...':''}</div>` : ''}
        </div>
        <div style="display:flex;gap:4px;flex-direction:column;">
          ${l.content ? `<button class="btn btn-secondary btn-sm" onclick="_readLaw('${l.id}')">👁️ پڑھیں</button>` : ''}
          ${l.file_url ? `<button class="btn btn-secondary btn-sm" onclick="window.open('${l.file_url}')">⬇️ ڈاؤنلوڈ</button>` : ''}
          ${l.content ? `<button class="btn btn-secondary btn-sm" onclick="_printLaw('${l.id}')">🖨️</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="_deleteLaw('${l.id}')">🗑️</button>
        </div>
      </div>`).join('')}
  </div>` : ''}

  <!-- Built-in Laws Grid -->
  <div id="law-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
    ${_renderLawCards(LAWS, 'سب', '')}
  </div>`;

  window._lawCat = 'سب';
  window._lawSearch = '';
}

function _renderLawCards(laws, cat, search) {
  const filtered = laws.filter(l => {
    const matchCat = cat === 'سب' || l.cat === cat;
    const matchSearch = !search || l.title.includes(search) || l.short.includes(search) || l.content.includes(search);
    return matchCat && matchSearch;
  });

  if (!filtered.length) return `<div style="grid-column:1/-1;text-align:center;padding:30px;color:var(--text-muted);">کوئی دفعہ نہیں ملی</div>`;

  return filtered.map(l => `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:14px;cursor:pointer;direction:rtl;"
      onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <span style="font-size:10px;padding:2px 8px;background:var(--accent-glow);color:var(--accent);border-radius:8px;font-weight:700;">${l.cat}</span>
        <span style="font-size:13px;font-weight:800;color:var(--accent);">${l.short}</span>
      </div>
      <div style="font-size:13px;font-weight:700;margin-bottom:6px;font-family:'Jameel Noori Nastaleeq',serif;">${l.title}</div>
      <div style="font-size:11px;color:var(--text-muted);line-height:1.6;">${l.content.slice(0,80)}...</div>
      <div style="display:flex;gap:6px;margin-top:10px;direction:rtl;">
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();_readBuiltinLaw('${l.id}')">👁️ پڑھیں</button>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();_printBuiltinLaw('${l.id}')">🖨️</button>
        <button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();_copyLaw('${l.short}','${l.title.replace(/'/g,'')}')">📋</button>
      </div>
    </div>`).join('');
}

// ── FILTERS ───────────────────────────────────────────────────
function _setCat(cat) {
  window._lawCat = cat;
  document.querySelectorAll('[id^="cat-"]').forEach(b => b.className = 'btn btn-secondary');
  const active = document.getElementById('cat-' + cat);
  if (active) active.className = 'btn btn-primary';
  const grid = document.getElementById('law-grid');
  if (grid) grid.innerHTML = _renderLawCards(LAWS, cat, window._lawSearch || '');
}

function _filterLaws(q) {
  window._lawSearch = q;
  const grid = document.getElementById('law-grid');
  if (grid) grid.innerHTML = _renderLawCards(LAWS, window._lawCat || 'سب', q);
}

// ── READ / PRINT ──────────────────────────────────────────────
function _readBuiltinLaw(id) {
  const l = LAWS.find(x => x.id === id);
  if (!l) return;
  openModal(`⚖️ ${l.title}`,
    `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">
      <div style="background:var(--accent-glow);border-radius:8px;padding:10px 14px;margin-bottom:12px;text-align:center;">
        <span style="font-size:18px;font-weight:900;color:var(--accent);">${l.short}</span>
      </div>
      <div style="font-size:14px;line-height:2.2;color:var(--text-primary);">${l.content}</div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">بند</button>
      <button class="btn btn-secondary" onclick="_printBuiltinLaw('${id}')">🖨️ پرنٹ</button>
      <button class="btn btn-secondary" onclick="_copyLaw('${l.short}','${l.title.replace(/'/g,'')}')">📋 کاپی</button>
    </div>`
  );
}

function _printBuiltinLaw(id) {
  const l = LAWS.find(x => x.id === id);
  if (!l) return;
  const o = currentOfficer || {};
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
    <style>@page{margin:20mm;}body{font-family:'Noto Nastaliq Urdu',serif;direction:rtl;color:#111;font-size:14px;}
    .hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px;}
    .sec{font-size:22px;font-weight:900;color:#1a3a5c;text-align:center;margin:12px 0;}
    .body{font-size:15px;line-height:2.5;padding:10px;border:1px solid #ccc;border-radius:6px;}
    .footer{font-size:10px;color:#888;text-align:center;margin-top:20px;border-top:1px solid #ccc;padding-top:8px;}</style>
    </head><body>
    <div class="hdr"><h2>محکمہ پولیس پنجاب — قانونی حوالہ</h2>
    <div>تھانہ ${o.station||'—'} · ضلع ${o.district||'—'}</div></div>
    <div class="sec">${l.short}</div>
    <h3 style="text-align:center;">${l.title}</h3>
    <div class="body">${l.content}</div>
    <div class="footer">Digital IO · ${new Date().toLocaleDateString('en-PK')}</div>
    <script>window.onload=()=>setTimeout(()=>window.print(),400);<\/script>
    </body></html>`);
  w.document.close();
}

function _copyLaw(short, title) {
  navigator.clipboard.writeText(`${short} — ${title}`).then(() => showToast('📋 کاپی ہو گئی', 'success'));
}

// ── CUSTOM LAW READ/PRINT ──────────────────────────────────────
async function _readLaw(id) {
  try {
    const { data } = await supabaseClient.from('law_library').select('*').eq('id',id).single();
    if (!data) return;
    openModal(`📋 ${data.title}`,
      `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;line-height:2.2;max-height:60vh;overflow-y:auto;">
        ${data.content || '<div style="color:var(--text-muted);">مواد دستیاب نہیں</div>'}
      </div>`,
      `<div style="display:flex;gap:8px;direction:rtl;">
        <button class="btn btn-secondary" onclick="closeModal()">بند</button>
        <button class="btn btn-secondary" onclick="_printLaw('${id}')">🖨️ پرنٹ</button>
        ${data.file_url?`<button class="btn btn-primary" onclick="window.open('${data.file_url}')">⬇️ ڈاؤنلوڈ</button>`:''}
      </div>`
    );
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _printLaw(id) {
  try {
    const { data } = await supabaseClient.from('law_library').select('*').eq('id',id).single();
    if (!data) return;
    const o = currentOfficer || {};
    const w = window.open('','_blank');
    w.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
      <style>@page{margin:20mm;}body{font-family:'Noto Nastaliq Urdu',serif;direction:rtl;color:#111;font-size:14px;line-height:2;}
      .hdr{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;margin-bottom:14px;}
      .footer{font-size:10px;color:#888;text-align:center;margin-top:20px;border-top:1px solid #ccc;padding-top:8px;}</style>
      </head><body>
      <div class="hdr"><h2>محکمہ پولیس پنجاب · قانونی لائبریری</h2>
      <div>تھانہ ${o.station||'—'} · ضلع ${o.district||'—'}</div></div>
      <h2 style="text-align:center;">${data.title}</h2>
      <p style="text-align:center;color:#555;">${data.category} · ${formatDate(data.created_at)}</p>
      <div style="border:1px solid #ccc;padding:12px;border-radius:6px;">${(data.content||'').replace(/\n/g,'<br>')}</div>
      <div class="footer">Digital IO · ${new Date().toLocaleDateString('en-PK')}</div>
      <script>window.onload=()=>setTimeout(()=>window.print(),400);<\/script>
      </body></html>`);
    w.document.close();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _deleteLaw(id) {
  openModal('🗑️ حذف',
    `<p style="color:var(--red);direction:rtl;">کیا آپ یہ دفعہ حذف کرنا چاہتے ہیں؟</p>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-danger" onclick="closeModal();_doDeleteLaw('${id}')">🗑️ حذف</button>
    </div>`
  );
}

async function _doDeleteLaw(id) {
  await supabaseClient.from('law_library').delete().eq('id', id);
  showToast('🗑️ حذف ہو گئی', 'info');
  _buildLaw();
}

// ── ADD NEW LAW ───────────────────────────────────────────────
function _openAddLaw() {
  openModal('+ نئی قانونی دفعہ / فائل',
    `<div style="direction:rtl;">
      <label class="form-label">عنوان / دفعہ نمبر *</label>
      <input class="form-input" id="nl-title" placeholder="مثلاً دفعہ 302 PPC — قتل عمد">
      <div class="form-row" style="margin-top:10px;">
        <div>
          <label class="form-label">زمرہ</label>
          <select class="form-input" id="nl-cat">
            <option>PPC</option><option>CrPC</option><option>CNSA</option>
            <option>ہتھیار</option><option>کسٹم</option><option>دیگر</option>
          </select>
        </div>
      </div>
      <div style="margin-top:10px;">
        <label class="form-label">متن / مواد</label>
        <textarea class="form-input" id="nl-content" rows="5" placeholder="دفعہ کا مکمل متن یا نوٹس..."></textarea>
      </div>
      <div style="margin-top:10px;">
        <label class="form-label">PDF / دستاویز اپ لوڈ کریں (اختیاری)</label>
        <input type="file" id="nl-file" accept=".pdf,.doc,.docx,.txt,.jpg,.png"
          style="width:100%;padding:8px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);">
        <div id="nl-upload-progress" style="font-size:11px;color:var(--text-muted);margin-top:4px;"></div>
      </div>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" id="nl-save-btn" onclick="_saveNewLaw()">💾 محفوظ</button>
    </div>`
  );
}

async function _saveNewLaw() {
  const title   = document.getElementById('nl-title')?.value.trim();
  const cat     = document.getElementById('nl-cat')?.value || 'دیگر';
  const content = document.getElementById('nl-content')?.value.trim() || '';
  const fileInp = document.getElementById('nl-file');
  const file    = fileInp?.files?.[0];
  const btn     = document.getElementById('nl-save-btn');
  const prog    = document.getElementById('nl-upload-progress');

  if (!title) { showToast('⚠️ عنوان ضروری ہے','error'); return; }
  if (!content && !file) { showToast('⚠️ متن یا فائل ضروری ہے','error'); return; }

  if (btn) { btn.textContent = '⏳...'; btn.disabled = true; }

  try {
    const oid = await getOfficerId();
    let fileUrl = null, fileName = null, fileType = null;

    // Upload file if provided
    if (file) {
      if (prog) prog.textContent = '📤 فائل اپ لوڈ ہو رہی ہے...';
      const ext = file.name.split('.').pop();
      const path = `${oid}/${Date.now()}.${ext}`;
      const { data: upData, error: upErr } = await supabaseClient.storage
        .from('law-files').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabaseClient.storage.from('law-files').getPublicUrl(path);
      fileUrl  = urlData.publicUrl;
      fileName = file.name;
      fileType = file.type;
      if (prog) prog.textContent = '✅ فائل اپ لوڈ ہو گئی';
    }

    await supabaseClient.from('law_library').insert({
      officer_id: oid, title, category: cat, content, file_url: fileUrl,
      file_name: fileName, file_type: fileType,
    });

    closeModal();
    showToast('✅ دفعہ محفوظ ہو گئی', 'success');
    _buildLaw();
  } catch(e) {
    showToast('❌ ' + e.message, 'error');
    if (btn) { btn.textContent = '💾 محفوظ'; btn.disabled = false; }
  }
}

// Legacy
function renderLawCards(l) { return _renderLawCards(l, 'سب', ''); }
function filterLaws(q) { _filterLaws(q); }
