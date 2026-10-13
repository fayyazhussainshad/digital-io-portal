/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — دستاویز کا پورے صفحے والا منظر + ٹیبز
   (پہلے یہ misal-docs.js میں تھا)
   AHEM: misal-docs.js کے BAAD لوڈ ہو
   ═══════════════════════════════════════════════════════════ */

function _dioDocName(docId) {
  const special = {
    witnesses_fir:   'گواہان FIR',
    witnesses_cross: 'گواہان کراس ورژن',
    named_accused:   'ملزمان FIR',
    accused_cross:   'ملزمان کراس ورژن',
    shahadatain:     'شہادتیں',
    fir:             'الف آئی آر',
    cross_version:   'کراس ورژن',
    'r173:list':           'رپورٹ 173 ض ف',
    'r173:mukammal':       'رپورٹ 173 — چالان مکمل',
    'r173:namukammal':     'رپورٹ 173 — چالان نامکمل',
    'r173:interim':        'رپورٹ 173 — انٹیرم چالان',
    'r173:ikhraj':         'رپورٹ 173 — اخراج',
    'r173:adampata':       'رپورٹ 173 — عدم پتہ',
    'r173:tatima_challan': 'رپورٹ 173 — تتمہ چالان',
    'r173:ch512':          'رپورٹ 173 — چالان 512 ض ف',
  };
  if (special[docId]) return special[docId];
  const d = MISAL_CASE_DOCS.find(x => x.id === docId);
  return d ? d.name : docId;
}

// ── Overlay banao aur editor-area us ke andar le jao ──

function _dioEnterDocView() {
  if (document.getElementById('dio-docview')) return; // already open
  /* ══ اصول: ہر دستاویز پورے صفحے والے منظر میں کھلے ══════════════════════
     پہلے یہاں `if (!area) return;` تھا۔ مقدمہ کھلتے وقت درمیانی حصے میں صرف
     «دستاویز منتخب کریں» کا پیغام ہوتا ہے — #workspace-editor-area موجود ہی
     نہیں ہوتا۔ نتیجہ: یہ فنکشن خاموشی سے واپس چلا جاتا، اور دستاویز کیس کے
     صفحے میں chip پٹی کے نیچے کھل جاتی (اصل ایپ پر ناپا گیا: 30 میں سے 0
     دستاویزات پورے صفحے میں کھلتی تھیں)۔ چالان بھی صرف اتفاق سے پورے صفحے
     میں آتا تھا — جب پہلے کوئی اور دستاویز یہ خانہ بنا چکی ہوتی۔
     اب: خانہ نہ ہو تو یہیں بنا لو — جو کچھ دستاویز پہلے سے بنا چکی ہو وہ
     اُسی خانے میں منتقل، کچھ ضائع نہیں — پھر پورا صفحہ عام طریقے سے۔ */
  let area = document.getElementById('workspace-editor-area');
  if (!area) {
    const tc = document.getElementById('workspace-tab-content');
    if (!tc) return;                       // مقدمہ کا صفحہ ہی نہیں — پہلے جیسا
    area = document.createElement('div');
    area.id = 'workspace-editor-area';
    area.className = 'workspace-main';
    area.style.width = '100%';
    while (tc.firstChild) area.appendChild(tc.firstChild);
    tc.appendChild(area);
  }
  _dioAreaHome = area.parentElement;   // wapas isi jagah rakhenge

  const ov = document.createElement('div');
  ov.id = 'dio-docview';
  ov.style.cssText =
    'position:fixed;inset:0;z-index:9500;background:var(--bg-primary);' +
    'display:flex;flex-direction:column;direction:rtl;';
  // Full-page view mein har module ke apne محفوظ/پرنٹ buttons chhupa dete hain —
  // upar wale bar mein pehle se hain, warna do do buttons nazar aate the.
  if (!document.getElementById('dio-dv-style')) {
    const st = document.createElement('style');
    st.id = 'dio-dv-style';
    st.textContent =
      '#dio-dv-body .dio-modbtn{display:none !important;}' +
      /* Full page: dastawez poore safhe par phaile (aadhe par nahi) */
      '#dio-dv-body{display:flex;flex-direction:column;}' +
      '#dio-dv-body > #workspace-editor-area{flex:1;min-height:0;width:100%;display:flex;flex-direction:column;}' +
      '#dio-dv-body #workspace-editor-area > *{flex:1;min-height:0;}' +
      /* AHEM — چالان ka safha yahan se ZABARDASTI chaura NA kiya jaye.
         Pehle yahan 'width:100% !important' tha. Us waqt چالان ki apni koi
         naap nahi thi, is liye woh theek tha. Ab چالان khud KAGHAZ ki asal
         naap (Legal 8.5in / A4 8.27in) par chalta hai, aur yeh !important
         us naap ko zabardasti tor deta tha — safha 816px ki bajaye 1244px
         chaura ho jata tha. Us se کالم 7 screen par chaura ho kar matn nigal
         leta tha (system samajhta tha kuch bahar hai hi nahi), magar kaghaz
         8.5in ka hone ki wajah se chapai mein matn KAT jata tha. Isi liye
         چالان akele theek chalta tha aur doosri tabs ke saath kharab. */
      '#dio-dv-body #misal-editor{min-height:calc(100vh - 160px) !important;}' +
      /* ── مقدمہ کی chip پٹی (واپس / مقدمہ نمبر / دستاویزات کے بٹن) ───────
         ترتیب (صارف کی وضاحت، چالان کی طرح):
           1) سب سے اوپر: ماڈیول کے ترمیمی اوزار — ہمیشہ نظر میں
           2) اُن کے نیچے: یہ chip پٹی — صرف اُس وقت جب کرسر اوپر جائے
         یہ پٹی ہمیشہ بہاؤ سے باہر (absolute) رہتی ہے، اِس لیے نہ اوپر کوئی
         خالی پٹی بنتی ہے نہ نیچے، اور ترمیمی اوزار خود بخود بالکل اوپر
         آ جاتے ہیں۔ چھپی ہوئی حالت میں یہ اپنی اونچائی جتنی اوپر چلی جاتی
         ہے؛ دکھاتے وقت اُوپر والے اوزاروں کے ٹھیک نیچے آ کر رکتی ہے۔     */
      '#dio-dv-bar{position:absolute;left:0;right:0;z-index:60;' +
      'transition:top .18s ease;box-shadow:0 6px 18px rgba(0,0,0,.16);}' +
      '@media print{#dio-dv-bar{display:none !important;}}';
    document.head.appendChild(st);
  }
  ov.innerHTML = `
    <div id="dio-dv-bar" style="display:flex;align-items:center;gap:8px;padding:8px 12px;direction:rtl;
         background:var(--bg-secondary);border-bottom:1px solid var(--border);flex-wrap:wrap;">
      <!-- واپس — poori sakreen wali dastavez topbar ko dhak leti hai, is liye
           yahan apna button chahiye. Shakl aur jagah topbar jaisi hi hai
           (daain taraf, teer + "واپس") taake afsar ko farq mehsoos na ho. -->
      <button onclick="dioGoBack()" class="dio-backbtn" title="واپس" aria-label="واپس"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 6l6 6-6 6"/><path d="M20 12H4"/></svg><span>واپس</span></button>
      <span id="dio-dv-fir" style="font-size:14px;font-weight:900;color:var(--accent);
            font-family:var(--font-mono);flex-shrink:0;white-space:nowrap;"></span>
      <div id="dio-dv-tabs" style="display:flex;gap:6px;flex:1;flex-wrap:wrap;min-width:0;"></div>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button onclick="_dioAddDocPicker()" title="نئی دستاویز کھولیں (موجودہ بند نہیں ہوگی)"
          style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--accent);
                 border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;
                 font-family:'Jameel Noori Nastaleeq',serif;">نئی دستاویز</button>
        <button onclick="_dioSaveCurrent()" title="محفوظ کریں"
          style="background:var(--green,#16a34a);color:#fff;border:none;border-radius:8px;padding:8px 16px;
                 font-size:13px;font-weight:700;cursor:pointer;
                 font-family:'Jameel Noori Nastaleeq',serif;">محفوظ</button>
        <button onclick="_dioPrintCurrent()" title="پرنٹ"
          style="background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 16px;
                 font-size:13px;font-weight:700;cursor:pointer;
                 font-family:'Jameel Noori Nastaleeq',serif;">پرنٹ</button>
        <button onclick="_dioRequestApproval()" title="منظوری کے لیے بھیجیں"
          style="background:var(--bg-tertiary);color:var(--text-primary);border:1px solid var(--amber,#f59e0b);
                 border-radius:8px;padding:8px 14px;font-size:13px;font-weight:700;cursor:pointer;
                 font-family:'Jameel Noori Nastaleeq',serif;">منظوری</button>
      </div>
    </div>
    <div id="dio-dv-body" style="flex:1;min-height:0;overflow:auto;"></div>`;
  document.body.appendChild(ov);
  document.getElementById('dio-dv-body').appendChild(area);
  try {
    const f = document.getElementById('dio-dv-fir');
    if (f && _misalCase) f.textContent = 'مقدمہ ' + (_misalCase.fir_number || '—');
  } catch(_) {}
  document.body.style.overflow = 'hidden';

  // Escape se band
  document.addEventListener('keydown', _dioDocViewEsc);

  // اوپر والی پٹی کو «چلتی» بناؤ
  try { _dioBarPeekInit(ov); } catch (_) {}
}

/* ══ chip پٹی: کرسر اوپر → سامنے، کرسر نیچے → غائب ════════════════════
   • پٹی ہمیشہ absolute ہے — بہاؤ میں جگہ نہیں لیتی، اِس لیے کوئی خالی پٹی
     نہیں بنتی اور ماڈیول کے ترمیمی اوزار بالکل اوپر رہتے ہیں۔
   • دکھاتے وقت وہ اوپر والے اوزاروں کے **نیچے** آتی ہے۔ اُن اوزاروں کی
     اونچائی ناپی جاتی ہے — کسی ایک ماڈیول کا نام لکھے بغیر: دونوں
     (نقشہ موقع کا #naq-topwrap اور چالان کی اپنی پٹی) پر `no-print` لگا
     ہوا ہے، اِس لیے جو بھی `no-print` پٹی بالکل اوپر بیٹھی ہو اُسی کے نیچے
     آ جاتی ہے۔ (report173.js کو ہاتھ نہیں لگایا گیا — وہ مقفل ہے۔)
   • موبائل کے لیے: اوپر کی طرف scroll کرنے سے بھی سامنے آ جاتی ہے۔      */
let _dioBarLastY = null;
let _dioBarBusy = 0;

function _dioTopToolbarBottom(body) {
  // جو `no-print` پٹی بالکل اوپر لگی ہو، اُس کا نچلا کنارہ
  try {
    const br = body.getBoundingClientRect();
    let sab = 0;
    body.querySelectorAll('.no-print').forEach(el => {
      const r = el.getBoundingClientRect();
      if (!r.height || !r.width) return;
      if (r.top <= br.top + 6 && r.bottom > br.top && (r.bottom - br.top) < 260) {
        sab = Math.max(sab, Math.round(r.bottom - br.top));
      }
    });
    return sab;
  } catch (_) { return 0; }
}

function _dioBarPeekInit(ov) {
  const bar = ov.querySelector('#dio-dv-bar');
  const body = ov.querySelector('#dio-dv-body');
  if (!bar || !body || ov._dioBarBound) return;
  ov._dioBarBound = true;
  _dioBarLastY = new WeakMap();

  const H = () => bar.offsetHeight || 48;
  const mark = () => { _dioBarBusy = Date.now(); };

  const chupao = () => {
    if (!window._dioBarShown && bar.style.top) return;
    window._dioBarShown = false;
    bar.style.top = '-' + (H() + 6) + 'px';
    mark();
  };
  const dikhao = () => {
    const off = _dioTopToolbarBottom(body);
    bar.style.top = off + 'px';
    if (!window._dioBarShown) { window._dioBarShown = true; mark(); }
  };

  // شروع میں چھپی ہوئی
  requestAnimationFrame(chupao);

  // — موبائل/دونوں: اوپر کی طرف scroll سے سامنے، نیچے سے غائب
  ov.addEventListener('scroll', (e) => {
    const sc = e.target;
    if (!sc || sc.nodeType !== 1 || typeof sc.scrollTop !== 'number') return;
    const y = sc.scrollTop;
    const pichla = _dioBarLastY.get(sc);
    _dioBarLastY.set(sc, y);
    if (pichla == null) return;
    const farq = y - pichla;
    if (Math.abs(farq) < 6) return;
    if ((Date.now() - _dioBarBusy) < 260 && Math.abs(farq) <= H() + 8) return;
    if (farq < 0) dikhao(); else chupao();
  }, true);

  bar.addEventListener('mouseenter', () => clearTimeout(window._dioBarT));

  // — ڈیسک ٹاپ: کرسر اوپری کنارے پر → سامنے؛ نیچے کی طرف → غائب
  if (!window._dioBarMoveBound) {
    window._dioBarMoveBound = true;
    let _pend = false, _y = 0;

    const _kaam = () => {
      _pend = false;
      const o = document.getElementById('dio-docview');
      if (!o) return;
      const b = o.querySelector('#dio-dv-bar');
      const bd = o.querySelector('#dio-dv-body');
      if (!b || !bd) return;
      const h = b.offsetHeight || 48;
      const off = _dioTopToolbarBottom(bd);
      if (_y <= off + 16) {
        clearTimeout(window._dioBarT);
        b.style.top = off + 'px';
        window._dioBarShown = true;
      } else if (window._dioBarShown && _y > off + h + 24) {
        clearTimeout(window._dioBarT);
        window._dioBarT = setTimeout(() => {
          b.style.top = '-' + (h + 6) + 'px';
          window._dioBarShown = false;
        }, 300);
      }
    };

    document.addEventListener('mousemove', (e) => {
      _y = e.clientY;
      // سستا پہرا — زیادہ تر حرکتیں یہیں سے واپس، بغیر کسی DOM کام کے
      if (_y > 220 && !window._dioBarShown) return;
      if (_pend) return;
      _pend = true;
      requestAnimationFrame(_kaam);
    }, { passive: true });
  }
}
window._dioBarPeekInit = _dioBarPeekInit;


function _dioDocViewEsc(e) {
  if (e.key === 'Escape') _dioExitDocView();
}

// ── Band karo — editor-area apni asal jagah wapas ──
// NOTE: Tabs ko JAAN-BOOJH KAR mehfooz rakhte hain, taake wapas ja kar koi
// aur chip kholne par purane tabs band na hon (sab khule rahen).

function _dioExitDocView() {
  const ov = document.getElementById('dio-docview');
  if (!ov) return;
  const area = document.getElementById('workspace-editor-area');
  // Ghair-mehfooz tabdeeli mehfooz kar lo
  try { if (_misalDirty && _openDocId && typeof saveMisalDoc === 'function') saveMisalDoc(_openDocId); } catch(_) {}
  if (area && _dioAreaHome) {
    _dioAreaHome.appendChild(area);
    // Form/dastawez ko yahan chhod kar na jao — warna woh bina chune bhi
    // nazar aata rehta hai. Dastawez sirf chip → fehrist se chunne par khulti hai.
    area.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
           height:100%;min-height:260px;color:var(--text-muted);direction:rtl;">
        <div style="font-size:40px;margin-bottom:10px;"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="opacity:.42;display:inline-block;vertical-align:middle"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h4"/></svg></div>
        <div style="font-size:14px;">اوپر سے کوئی دستاویز منتخب کریں</div>
      </div>`;
  }
  ov.remove();
  document.body.style.overflow = '';
  document.removeEventListener('keydown', _dioDocViewEsc);
}

// Naya case khulne par tabs saaf (purane case ke tabs na rahen)

function _dioResetTabs() { _dioTabs = []; _dioActiveTab = null; }
window._dioResetTabs = _dioResetTabs;

// ── ➕ نئی دستاویز — fullscreen ke ANDAR se naya tab kholo ──
// (Moujooda tab band nahi hota — sab khule rehte hain)

function _dioAddDocPicker() {
  const old = document.getElementById('dio-dv-picker');
  if (old) { old.remove(); return; }   // toggle

  const groups = [
    { title:'انڈیکس / FIR', items:[
      ['index_naql','انڈیکس نقل مسل'], ['fir','الف آئی آر'], ['cross_version','کراس ورژن'],
    ]},
    { title:'ملزمان / گواہان', items:[
      ['named_accused','ملزمان FIR'], ['accused_cross','ملزمان کراس ورژن'],
      ['witnesses_fir','گواہان FIR'], ['witnesses_cross','گواہان کراس ورژن'],
    ]},
    { title:'رپورٹ 173 ض ف', items:[
      ['r173:mukammal','چالان مکمل'], ['r173:namukammal','چالان نامکمل'],
      ['r173:ch512','چالان 512 ض ف'],
      ['r173:interim','انٹیرم چالان'], ['r173:ikhraj','اخراج'],
      ['r173:adampata','عدم پتہ'], ['r173:tatima_challan','تتمہ چالان'],
    ]},
    { title:'دیگر دستاویزات', items: MISAL_CASE_DOCS
        .filter(d => d.id !== 'index_naql').map(d => [d.id, d.name]) },
  ];

  const box = document.createElement('div');
  box.id = 'dio-dv-picker';
  box.style.cssText =
    'position:absolute;top:56px;left:12px;z-index:9600;max-height:70vh;overflow:auto;' +
    'background:var(--bg-card);border:1px solid var(--accent);border-radius:12px;' +
    'padding:12px;box-shadow:0 12px 40px rgba(0,0,0,0.45);direction:rtl;min-width:280px;max-width:92vw;';
  box.innerHTML = groups.map(g => `
    <div style="margin-bottom:10px;">
      <div style="font-size:11px;color:var(--text-muted);font-weight:700;margin-bottom:6px;
                  font-family:'Jameel Noori Nastaleeq',serif;">${g.title}</div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;">
        ${g.items.map(([id,label]) => {
          const open = _dioTabs.some(t => t.id === id);
          return `<span onclick="_dioPickDoc('${id}')"
            style="padding:6px 12px;border-radius:8px;cursor:pointer;font-size:12px;font-weight:600;
                   font-family:'Jameel Noori Nastaleeq',serif;
                   border:1px solid ${open?'var(--accent)':'var(--border)'};
                   background:${open?'var(--accent)':'var(--bg-tertiary)'};
                   color:${open?'#fff':'var(--text-primary)'};">${esc(label)}${open?' ✓':''}</span>`;
        }).join('')}
      </div>
    </div>`).join('') +
    `<div style="text-align:center;padding-top:6px;border-top:1px solid var(--border);">
       <span onclick="document.getElementById('dio-dv-picker')?.remove()"
         style="font-size:12px;color:var(--text-muted);cursor:pointer;
                font-family:'Jameel Noori Nastaleeq',serif;">بند کریں</span>
     </div>`;
  document.getElementById('dio-docview')?.appendChild(box);
}

// Picker se document chuna → naya tab (purane khule rehte hain)

function _dioPickDoc(docId) {
  document.getElementById('dio-dv-picker')?.remove();
  if (_dioTabs.some(t => t.id === docId)) { _dioSwitchTab(docId); return; }
  _dioTabs.push({ id: docId, name: _dioDocName(docId) });
  _dioActiveTab = docId;
  _dioRenderTabs();
  _dioRenderTabContent(docId);
}

// 💾 محفوظ — active dastawez

function _dioSaveCurrent() {
  const id = _dioActiveTab;
  if (!id) return;
  if (id.startsWith('r173:')) {
    if (typeof _saveR173 === 'function') { _saveR173(); return; }
  }
  if (id === 'rfa_form') {
    if (typeof _saveRfa === 'function') { _saveRfa(); return; }
  }
  if (id === 'cdr_imei') {
    if (typeof _saveCdr === 'function') { _saveCdr(); return; }
  }
  if (document.getElementById('misal-editor') && typeof saveMisalDoc === 'function') {
    saveMisalDoc(_openDocId || id); return;
  }
  if (typeof showToast === 'function') showToast('ℹ️ یہ صفحہ خودکار محفوظ ہوتا ہے', 'info');
}

window._dioAddDocPicker = _dioAddDocPicker;
window._dioPickDoc      = _dioPickDoc;
window._dioSaveCurrent  = _dioSaveCurrent;

// ── DOCUMENT APPROVAL (Phase 4H) — additive; save/print ko nahi chhoota ──
async function _dioRequestApproval() {
  if (!(window.DIO && DIO.approvals)) {
    if (typeof showToast === 'function') showToast('ℹ️ منظوری کی سہولت دستیاب نہیں', 'info');
    return;
  }
  const id = _dioActiveTab;
  if (!id) { if (typeof showToast === 'function') showToast('ℹ️ پہلے کوئی دستاویز کھولیں', 'info'); return; }
  const label = (typeof _dioDocName === 'function') ? _dioDocName(id) : id;
  const caseId = (typeof _misalCase !== 'undefined' && _misalCase) ? _misalCase.id : null;
  const fir = (typeof _misalCase !== 'undefined' && _misalCase) ? _misalCase.fir_number : null;

  // Pehle maujooda status dikhayen (agar koi request pehle se ho)
  let existing = null;
  try { existing = await DIO.approvals.latestFor(id); } catch (_) {}
  const existingLine = existing
    ? `<div style="margin-bottom:10px;font-size:12px;direction:rtl;">موجودہ حالت: ${DIO.approvals.badge(existing.status)}${existing.decision_note ? ` — <span style="color:var(--text-muted);">${_dioEsc(existing.decision_note)}</span>` : ''}</div>`
    : '';

  if (typeof openModal !== 'function') {
    // Fallback: seedha request bhej den
    const r = await DIO.approvals.request(id, { label, case_id: caseId, fir_number: fir });
    if (typeof showToast === 'function') showToast(r ? 'منظوری کے لیے بھیج دیا گیا' : 'نہیں بھیجا جا سکا', r ? 'success' : 'error');
    return;
  }

  openModal('منظوری کے لیے بھیجیں',
    `<div style="direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
       ${existingLine}
       <div style="font-size:13px;color:var(--text-secondary);line-height:1.9;">
         یہ دستاویز (<b>${_dioEsc(label)}</b>) SHO / سینئر افسر کو منظوری کے لیے بھیجی جائے گی۔
         منظوری کے بعد آپ کو اطلاع مل جائے گی۔
       </div>
     </div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="_dioDoRequestApproval()">بھیجیں</button>`);
  // Context stash for the confirm handler
  window._dioApprovalCtx = { id, label, caseId, fir };
}

async function _dioDoRequestApproval() {
  const ctx = window._dioApprovalCtx || {};
  if (typeof closeModal === 'function') closeModal();
  if (!(window.DIO && DIO.approvals) || !ctx.id) return;
  const r = await DIO.approvals.request(ctx.id, { label: ctx.label, case_id: ctx.caseId, fir_number: ctx.fir });
  if (typeof showToast === 'function') showToast(r ? 'منظوری کے لیے بھیج دیا گیا' : 'نہیں بھیجا جا سکا', r ? 'success' : 'error');
}

function _dioEsc(s) {
  s = (s == null) ? '' : String(s);
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

window._dioRequestApproval   = _dioRequestApproval;
window._dioDoRequestApproval = _dioDoRequestApproval;

// ── Tab kholo (ya pehle se khuli ho to us par jao) ──

function _dioOpenDocTab(docId) {
  _dioEnterDocView();
  if (!_dioTabs.some(t => t.id === docId)) {
    _dioTabs.push({ id: docId, name: _dioDocName(docId) });
  }
  _dioActiveTab = docId;
  _dioRenderTabs();
}

// ── Tab bar ──

function _dioRenderTabs() {
  const box = document.getElementById('dio-dv-tabs');
  if (!box) return;
  box.innerHTML = _dioTabs.map(t => {
    const on = t.id === _dioActiveTab;
    return `<span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:8px;
      cursor:pointer;font-size:12px;font-weight:700;white-space:nowrap;
      font-family:'Jameel Noori Nastaleeq',serif;transition:all .15s;
      border:1px solid ${on ? 'var(--accent)' : 'var(--border)'};
      background:${on ? 'var(--accent)' : 'var(--bg-tertiary)'};
      color:${on ? '#fff' : 'var(--text-secondary)'};"
      onclick="_dioSwitchTab('${t.id}')">
      ${esc(t.name)}
      <span onclick="event.stopPropagation();_dioCloseTab('${t.id}')" title="بند کریں"
        style="opacity:.75;font-weight:900;padding:0 2px;">✕</span>
    </span>`;
  }).join('');
}

// ── Tab badlo (pehle ghair-mehfooz kaam save) ──

function _dioSwitchTab(docId) {
  if (docId === _dioActiveTab) return;
  try { if (_misalDirty && _openDocId && typeof saveMisalDoc === 'function') saveMisalDoc(_openDocId); } catch(_) {}
  _dioActiveTab = docId;
  _dioRenderTabs();
  _dioRenderTabContent(docId);
}

// ── Tab band karo ──

function _dioCloseTab(docId) {
  _dioTabs = _dioTabs.filter(t => t.id !== docId);
  if (!_dioTabs.length) { _dioActiveTab = null; _dioExitDocView(); return; }
  if (_dioActiveTab === docId) {
    _dioActiveTab = _dioTabs[_dioTabs.length - 1].id;
    _dioRenderTabContent(_dioActiveTab);
  }
  _dioRenderTabs();
}

// ── Tab ka content dobara render karo ──

function _dioRenderTabContent(docId) {
  if (docId.startsWith('r173:')) {
    const type = docId.slice(5);
    if (typeof openReport173WithType === 'function') openReport173WithType(type, true);
    return;
  }
  // FIR / کراس ورژن — inka apna opener hai
  if (docId === 'fir' || docId === 'cross_version') {
    _openDocId = docId;
    if (typeof openFirView === 'function') openFirView(_misalCaseId, docId);
    else if (typeof _renderFIRView === 'function') _renderFIRView();
    return;
  }
  if (typeof _openMisalEditor === 'function') _openMisalEditor(docId, true);
}

// ── Smart print — active dastawez ke hisab se ──

function _dioPrintCurrent() {
  // VIEW-ONLY [4E]: میعاد ختم پر پرنٹ بند (window.print() fallback سمیت)
  if (window.DIO && DIO.sub && !DIO.sub.guard('پرنٹ')) return;
  const id = _dioActiveTab;
  if (!id) return;
  if (id.startsWith('r173:')) {
    if (typeof _printR173 === 'function') { _printR173(); return; }
  }
  if (id === 'fir' || id === 'cross_version') {
    if (typeof _printFIRAll === 'function') { _printFIRAll(); return; }
  }
  if (id === 'rfa_form') {
    if (typeof _printRfa === 'function') { _printRfa(); return; }
  }
  if (id === 'cdr_imei') {
    if (typeof _printCdr === 'function') { _printCdr(); return; }
  }
  // SYSTEM RULE (13 اکتوبر 2026): اوپر کی پٹی کا «پرنٹ» = دستاویز کا اپنا پرنٹ بٹن
  // (درخواستیں، سزا سلپ، CRO، نقشہ موقع، بیانات 161 …) = Ctrl+P — تینوں ایک ہی راستہ۔
  // پہلے یہاں سیدھا printMisalDoc تھا جو #misal-editor نہ ہو تو کچھ بھی نہیں کرتا تھا
  // (ان دستاویزات پر پٹی کا پرنٹ بٹن خاموش رہتا تھا)۔
  const mb = _dioModulePrintBtn(document.getElementById('dio-dv-body'));
  if (mb) { mb.click(); return; }
  if (document.getElementById('misal-editor') && typeof printMisalDoc === 'function') { printMisalDoc(_dioDocName(id)); return; }
  window.print();   // اپنا پرنٹ نہ ہو → براؤزر کی چھپائی (صرف کھلی دستاویز — native isolation)
}

// دستاویز کا اپنا پرنٹ بٹن (چھپا ہوا .dio-modbtn بھی) — واضح نشان [data-dio-print] پہلے،
// پھر .dio-modbtn، پھر جو اکیلا ہو۔ کئی مختلف ہوں (فہرست کی ہر سطر) تو null۔
function _dioModulePrintBtn(root) {
  if (!root) return null;
  const words = /پرنٹ|چھاپ|چھپائی|🖨|print/i;
  const btns = Array.from(root.querySelectorAll('button,[role="button"],a.btn')).filter(b => {
    if (b.disabled) return false;
    if (b.hasAttribute('data-dio-print')) return true;
    const oc = b.getAttribute('onclick') || '';
    if (!/print/i.test(oc)) return false;
    const t = (b.textContent || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.getAttribute('aria-label') || '');
    return !/محفوظ/.test(t) && words.test(t);
  });
  const one = list => {
    const seen = {}, u = [];
    list.forEach(b => { const k = b.getAttribute('onclick') || ''; if (!seen[k]) { seen[k] = 1; u.push(b); } });
    return u.length === 1 ? u[0] : null;
  };
  return one(btns.filter(b => b.hasAttribute('data-dio-print'))) ||
         one(btns.filter(b => b.classList.contains('dio-modbtn'))) || one(btns);
}
window._dioModulePrintBtn = _dioModulePrintBtn;

window._dioExitDocView  = _dioExitDocView;
window._dioSwitchTab    = _dioSwitchTab;
window._dioCloseTab     = _dioCloseTab;
window._dioPrintCurrent = _dioPrintCurrent;
window._dioOpenDocTab   = _dioOpenDocTab;

