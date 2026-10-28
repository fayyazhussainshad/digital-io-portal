/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SUBSCRIPTION SYSTEM  (subscription.js)
   Plans · Payment · Trial · License · Admin verify
   ═══════════════════════════════════════════════════════════ */

// ═══════════════════════════════════════════════════════════════
//  VIEW-ONLY ENFORCEMENT (میعاد ختم پر) — DIO.sub   [4E]
//  Owner rule: میعاد ختم/معطل → ایپ کھلا رہے، ڈیٹا نظر آئے (view),
//  مگر PRINT + EDITING + NEW ADDITION بند۔ کوئی گریس نہیں۔
//  FAIL-OPEN: کسی بھی شک/خرابی پر ہمیشہ ALLOW (اصل افسر کبھی غلط لاک نہ ہو)۔
//  اہم: تجدید/ادائیگی کا راستہ (_submitPayment) کبھی گارڈ نہیں ہوتا — ورنہ
//       افسر پھنس جائے گا۔
// ═══════════════════════════════════════════════════════════════
window.DIO = window.DIO || {};
DIO.sub = {
  _blocked: false,
  setFromStatus: function (status) {
    // 'none' pehle BLOCK NAHI karta tha — afsar offline ja kar
    // dio_officer_cache mita de to getOfficerId() null deta, status 'none'
    // aata, aur guard poori tarah band ho jata. Ab fail-closed.
    this._blocked = (status === 'expired' || status === 'suspended' ||
                     status === 'none'    || status === 'unknown');
    return this._blocked;
  },
  /* `_blocked` ko console se `false` kiya ja sakta hai. Is liye tala
     lagne ki surat (`window._dioLocked`) ko bhi yahin dekha jata hai —
     wo alag nishan hai jo har 1.2 second baad khud ko dobara laga leta
     hai. Do me se koi aik bhi sach ho to sab likhai band. */
  blocked: function () {
    var hardLocked = false, viewOnly = false;
    try { hardLocked = (typeof _dioLockActive === 'function') && _dioLockActive(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    // v561: «صرف دیکھنا» کی حالت بھی closure میں — console سے `_blocked = false` کرنے سے نہیں کھلتی
    try { viewOnly = (typeof _dioViewOnlyActive === 'function') && _dioViewOnlyActive(); } catch (_) { /* ikhtiyari hook */ }
    return this._blocked === true || hardLocked || viewOnly;
  },
  // guard(label) → true = آگے بڑھو، false = بند (renew prompt دکھایا)۔
  guard: function (label) {
    if (!this.blocked()) return true;                 // allow (default + fail-open)
    try { showToast('سبسکرپشن ختم — ' + (label || 'یہ عمل') + ' بند ہے۔ تجدید کریں۔', 'error', 4000); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
    try { if (typeof _showPlans === 'function') _showPlans(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════
//  v561: میعاد ختم = صرف دیکھنا — نہ پرنٹ، نہ لکھنا، نہ ترمیم
//  (افسر / مالک کا حکم، 28 اکتوبر 2026: «Subscription khatam honay par sirf
//   view — no print, no write, no editing»)
//  • پڑھنا کھلا: ہر صفحہ، مقدمہ، ضمنی، چالان کھلتا اور نظر آتا ہے (سرور پر بھی
//    پڑھنا کبھی بند نہیں — sql/92a)۔
//  • لکھنا بند: ہر DB write (نیچے والا مرکزی گارڈ) + سرور کا اپنا گیٹ (sql/92b)۔
//  • ترمیم بند: ہر لکھنے کا خانہ / دستاویز صرف پڑھنے کے لیے (تلاش اور تجدید
//    کے خانے کھلے)؛ ٹائپ، paste، drop سب رد۔
//  • پرنٹ بند: dioPrint، window.print، Ctrl+P، اور PDF/Word شیئر / ڈاؤن لوڈ۔
//  • معطل (suspended) / کوئی سبسکرپشن نہیں (none): پہلے جیسا پورا تالا۔
//  حالت closure میں — console سے `DIO.sub._blocked = false` لکھنے سے نہیں کھلتی۔
// ═══════════════════════════════════════════════════════════════
var _dioViewOnlyState = (function () {
  var on = false;
  return { on: function () { on = true; }, off: function () { on = false; }, is: function () { return on === true; } };
})();
function _dioViewOnlyActive() { return _dioViewOnlyState.is(); }
window._dioViewOnlyActive = _dioViewOnlyActive;

// تلاش / چھانٹی / تجدید / PIN کے خانے — صرف دیکھنے میں بھی کھلے
var _DIO_RO_OK = /(search|srch|find|filter|query|-q$|^sr-|pin|^pay-|pass|login|otp)/i;
function _dioRoOk(el) {
  try {
    if (!el || el.nodeType !== 1) return true;
    if (el.closest && el.closest('[data-dio-ro-ok], #dio-sub-lock, #login-screen, #dio-viewonly-bar')) return true;
    if (el.tagName === 'INPUT' && /^(search|checkbox|radio|button|submit|reset|hidden|range|color|image)$/i.test(el.type || '')) return true;
    if (_DIO_RO_OK.test(el.id || '') || _DIO_RO_OK.test(el.getAttribute('name') || '')) return true;
    if (/\b(search|srch|filter|login-input)\b/i.test(typeof el.className === 'string' ? el.className : '')) return true;
    if (/تلاش/.test(el.getAttribute('placeholder') || '')) return true;
  } catch (_) { return false; }
  return false;
}
function _dioRoApply(root) {
  if (!root || root.nodeType !== 1) return;
  var list = [];
  try {
    if (root.matches && root.matches('input,textarea,select,[contenteditable]')) list.push(root);
    if (root.querySelectorAll) list = list.concat([].slice.call(root.querySelectorAll('input,textarea,select,[contenteditable]')));
  } catch (_) { return; }
  list.forEach(function (el) {
    if (el.hasAttribute('data-dio-ro') || _dioRoOk(el)) return;
    if (el.hasAttribute('contenteditable')) {
      var v = String(el.getAttribute('contenteditable')).toLowerCase();
      if (v === 'false') return;
      el.setAttribute('data-dio-ro', 'ce:' + v);
      el.setAttribute('contenteditable', 'false');
    } else if (el.tagName === 'SELECT' || (el.tagName === 'INPUT' && String(el.type).toLowerCase() === 'file')) {
      // انتخاب (مثلاً ذیلی ضمنی کا سانچہ) بھی دستاویز بدل دیتا ہے — بند؛ چھانٹی والے اوپر _dioRoOk میں کھلے
      if (el.disabled) return;
      el.setAttribute('data-dio-ro', 'dis'); el.disabled = true;
    } else {
      if (el.readOnly) return;
      el.setAttribute('data-dio-ro', 'ro'); el.readOnly = true;
    }
  });
}
function _dioRoRestore() {
  try {
    document.querySelectorAll('[data-dio-ro]').forEach(function (el) {
      var t = el.getAttribute('data-dio-ro') || '';
      el.removeAttribute('data-dio-ro');
      if (t.indexOf('ce:') === 0) el.setAttribute('contenteditable', t.slice(3) || 'true');
      else if (t === 'dis') el.disabled = false;
      else if (t === 'ro') el.readOnly = false;
    });
  } catch (_) { /* ikhtiyari */ }
}
var _dioVoNoticeTs = 0;
var _dioVoNoticeWhat = '';
function _dioVoNotice(what) {
  var n = Date.now();
  if (n - _dioVoNoticeTs < 3000 && _dioVoNoticeWhat === what) return;   // وہی پیغام بار بار نہیں
  _dioVoNoticeTs = n; _dioVoNoticeWhat = what;
  try { showToast('سبسکرپشن ختم — صرف دیکھ سکتے ہیں: ' + (what || 'ترمیم') + ' بند ہے۔ تجدید کریں۔', 'error', 3500); } catch (_) { /* paigham */ }
}
var _dioVo = { obs: null, print: null, on: false };
function _dioVoEditEvent(e) {
  if (!_dioViewOnlyActive()) return;
  if (_dioRoOk(e.target)) return;
  e.preventDefault(); e.stopPropagation();
  _dioVoNotice('ترمیم');
}
function _dioVoKey(e) {
  if (!_dioViewOnlyActive()) return;
  var k = String(e.key || '').toLowerCase();
  if ((e.ctrlKey || e.metaKey) && (k === 'p' || e.code === 'KeyP')) {        // Ctrl+P (اردو کی بورڈ پر بھی)
    e.preventDefault(); e.stopImmediatePropagation(); _dioVoNotice('پرنٹ'); return;
  }
  if ((e.ctrlKey || e.metaKey) && (k === 's' || e.code === 'KeyS')) {        // Ctrl+S — لکھنا بند
    e.preventDefault(); e.stopImmediatePropagation(); _dioVoNotice('محفوظ کرنا'); return;
  }
  var t = e.target;
  if (t && t.closest && t.closest('[data-dio-ro]') && (k.length === 1 || k === 'backspace' || k === 'delete' || k === 'enter')) _dioVoNotice('ترمیم');
}
function _dioVoClick(e) {
  if (!_dioViewOnlyActive()) return;
  var t = e.target;
  if (t && t.closest && t.closest('[data-dio-ro]')) _dioVoNotice('ترمیم');
}
function _dioVoBar() {
  try {
    if (document.getElementById('dio-viewonly-bar')) return;
    var area = document.querySelector('.main-area'), pc = document.getElementById('page-content');
    if (!area || !pc) return;
    var b = document.createElement('div');
    b.id = 'dio-viewonly-bar';
    b.className = 'no-print';
    b.setAttribute('role', 'status');
    b.innerHTML = '<span class="dio-vo-t">سبسکرپشن کی میعاد ختم — صرف دیکھ سکتے ہیں۔ پرنٹ، نیا اندراج اور ترمیم بند ہیں۔</span>' +
      '<span class="dio-vo-b"><button type="button" class="btn btn-primary btn-sm" onclick="_showPlans()">تجدید کریں</button>' +
      '<button type="button" class="btn btn-secondary btn-sm" id="dio-lock-recheck" onclick="_dioUnlockIfRenewed()">میں نے تجدید کر لی — دوبارہ جانچیں</button></span>';
    area.insertBefore(b, pc);
  } catch (_) { /* ikhtiyari */ }
}
function _dioEnterViewOnly() {
  _dioViewOnlyState.on();
  try { if (window.DIO && DIO.sub) DIO.sub._blocked = true; } catch (_) { /* ikhtiyari */ }
  if (_dioVo.on) { _dioVoBar(); return; }
  _dioVo.on = true;
  try { document.documentElement.classList.add('dio-viewonly'); document.body.classList.add('dio-viewonly'); } catch (_) { /* ikhtiyari */ }
  try {
    if (!document.getElementById('dio-viewonly-style')) {
      var st = document.createElement('style'); st.id = 'dio-viewonly-style';
      st.textContent =
        '#dio-viewonly-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;direction:rtl;' +
        'padding:6pt 10pt;background:#fef2f2;border-bottom:1px solid #fecaca;color:#991b1b;font-size:11pt;line-height:1.9;flex-shrink:0}' +
        '#dio-viewonly-bar .dio-vo-b{display:flex;gap:6px;flex-wrap:wrap}' +
        '#dio-viewonly-bar .btn{font-size:10.5pt}' +
        'html.dio-viewonly [data-dio-ro]{cursor:not-allowed}' +
        // براؤزر کے اپنے مینو سے پرنٹ: کاغذ پر کچھ نہیں، صرف پیغام
        '@media print{html.dio-viewonly body *{display:none !important}' +
        'html.dio-viewonly body::before{content:"سبسکرپشن ختم — پرنٹ بند ہے";display:block;text-align:center;font-size:20pt;margin-top:2in;direction:rtl}}';
      document.head.appendChild(st);
    }
  } catch (_) { /* ikhtiyari */ }
  _dioVoBar();
  // موجودہ اور آنے والے ہر خانے / دستاویز پر «صرف پڑھنا»
  try { _dioRoApply(document.body); } catch (_) { /* ikhtiyari */ }
  try {
    _dioVo.obs = new MutationObserver(function (muts) {
      if (!_dioViewOnlyActive()) return;
      muts.forEach(function (m) {
        if (m.type === 'childList') m.addedNodes.forEach(function (n) { if (n.nodeType === 1) _dioRoApply(n); });
        else if (m.type === 'attributes' && m.target && m.target.nodeType === 1) {
          var el = m.target;
          if (m.attributeName === 'contenteditable') {
            var v = String(el.getAttribute('contenteditable') || '').toLowerCase();
            if (v !== 'false' && el.hasAttribute('contenteditable') && !_dioRoOk(el)) {
              if (!el.hasAttribute('data-dio-ro')) el.setAttribute('data-dio-ro', 'ce:' + (v || 'true'));
              el.setAttribute('contenteditable', 'false');
            }
          } else if (m.attributeName === 'readonly' && el.getAttribute('data-dio-ro') === 'ro' && !el.readOnly) el.readOnly = true;
          else if (m.attributeName === 'disabled' && el.getAttribute('data-dio-ro') === 'dis' && !el.disabled) el.disabled = true;
        }
      });
    });
    _dioVo.obs.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['contenteditable', 'readonly', 'disabled'] });
  } catch (_) { /* ikhtiyari */ }
  ['beforeinput', 'paste', 'drop', 'cut'].forEach(function (t) { document.addEventListener(t, _dioVoEditEvent, true); });
  document.addEventListener('keydown', _dioVoKey, true);
  document.addEventListener('click', _dioVoClick, true);
  // window.print (ہر ماڈیول کا اپنا راستہ) — بند
  try {
    if (!_dioVo.print) {
      _dioVo.print = window.print;
      window.print = function () {
        if (window.DIO && DIO.sub && DIO.sub.blocked()) { _dioVoNotice('پرنٹ'); return; }
        return _dioVo.print.apply(window, arguments);
      };
    }
  } catch (_) { /* ikhtiyari */ }
}
function _dioExitViewOnly() {
  _dioViewOnlyState.off();
  if (!_dioVo.on) return;
  _dioVo.on = false;
  try { if (_dioVo.obs) _dioVo.obs.disconnect(); } catch (_) { /* ikhtiyari */ }
  _dioVo.obs = null;
  ['beforeinput', 'paste', 'drop', 'cut'].forEach(function (t) { document.removeEventListener(t, _dioVoEditEvent, true); });
  document.removeEventListener('keydown', _dioVoKey, true);
  document.removeEventListener('click', _dioVoClick, true);
  try { if (_dioVo.print) { window.print = _dioVo.print; _dioVo.print = null; } } catch (_) { /* ikhtiyari */ }
  _dioRoRestore();
  try { document.documentElement.classList.remove('dio-viewonly'); document.body.classList.remove('dio-viewonly'); } catch (_) { /* ikhtiyari */ }
  try { var b = document.getElementById('dio-viewonly-bar'); if (b) b.remove(); } catch (_) { /* ikhtiyari */ }
}
window._dioEnterViewOnly = _dioEnterViewOnly;

// ═══════════════════════════════════════════════════════════════
//  CENTRAL WRITE-GUARD [4E.2] — "بالکل کوئی کام نہیں، صرف view"
//  میعاد ختم/معطل پر ہر DB write (insert/update/upsert/delete) بند — پورے
//  سسٹم میں، ہر ماڈیول (RFA/CDR/5C/CRO/سزا/درخواستیں/ٹیمپلیٹ/گواہ/عملہ… سب)۔
//  دو حفاظتی اصول:
//   1) کبھی THROW نہیں کرتا — {data:null,error} لوٹاتا ہے — تاکہ view/login کبھی نہ ٹوٹے۔
//   2) whitelist: subscriptions/subscription_plans کھلے — ورنہ تجدید ممکن نہ ہو (افسر پھنس جائے)۔
//  FAIL-OPEN: guard لگانے میں خرابی ہو تو writes معمول کے مطابق چلیں۔
// ═══════════════════════════════════════════════════════════════
// KHAMI: yahan `subscriptions` bhi khuli thi "tajdeed ke liye" — magar
// gate KA FAISLA isi table se hota hai, to afsar khud ko 'active' likh kar
// poora nafaz band kar sakta tha. Ab sirf PARHNA khula; tajdeed
// dio_request_subscription() RPC se hoti hai (sirf 'pending' banati hai).
// client_errors: سرور کا گیٹ (sql/92b) بھی اسے کھلا رکھتا ہے — خرابی کی رپورٹ افسر کا لکھا ہوا ڈیٹا نہیں
var _DIO_WRITE_WL = { subscription_plans: 1, client_errors: 1 };
var _dioSubPromptTs = 0;
function _dioSubWritePrompt() {
  var now = Date.now();
  if (now - _dioSubPromptTs < 1500) return;           // throttle — ایک عمل کے کئی writes پر spam نہ ہو
  _dioSubPromptTs = now;
  try { showToast('سبسکرپشن ختم — صرف دیکھ سکتے ہیں۔ تجدید کریں۔', 'error', 3500); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
  // v561: «صرف دیکھنا» میں پس منظر کی کسی لکھائی پر پلان کا کارڈ اچانک نہ کھلے — تجدید کا بٹن اوپر کی پٹی میں ہے
  if (typeof _dioViewOnlyActive === 'function' && _dioViewOnlyActive()) return;
  try { if (typeof _showPlans === 'function') _showPlans(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
}
// blocked "query builder" — chain (.select().single().eq()… ) سب چلے، await پر {data:null,error}
function _dioBlockedBuilder() {
  _dioSubWritePrompt();
  var res = { data: null, error: { message: 'subscription_expired_view_only', code: 'DIO_SUB' } };
  var p = Promise.resolve(res);
  var proxy = new Proxy({}, {
    get: function (_t, prop) {
      if (typeof prop === 'symbol') return undefined;
      if (prop === 'then')    return p.then.bind(p);
      if (prop === 'catch')   return p.catch.bind(p);
      if (prop === 'finally') return p.finally.bind(p);
      return function () { return proxy; };            // ہر chain method → وہی proxy
    }
  });
  return proxy;
}
function _installDioWriteGuard() {
  try {
    if (window._dioWriteGuardOn) return;
    if (!window.supabaseClient || typeof supabaseClient.from !== 'function') return;
    window._dioWriteGuardOn = true;
    var origFrom = supabaseClient.from.bind(supabaseClient);
    supabaseClient.from = function (table) {
      var qb = origFrom(table);
      if (_DIO_WRITE_WL[table]) return qb;             // تجدید/پلان کھلے
      ['insert', 'update', 'upsert', 'delete'].forEach(function (m) {
        if (typeof qb[m] !== 'function') return;
        var orig = qb[m].bind(qb);
        qb[m] = function () {
          if (window.DIO && DIO.sub && DIO.sub.blocked()) return _dioBlockedBuilder();
          return orig.apply(qb, arguments);
        };
      });
      return qb;
    };

    // ── storage bhi guard me ───────────────────────────────────
    //  KHAMI THI: guard sirf .from() par tha. supabaseClient.storage.from()
    //  bilkul khula tha — mo'attal/miyaad-khatam afsar shahadat, templates
    //  aur law-library ki files upload karta rehta (data-api, cases, fivec,
    //  templates, law-library, ahkamat — sab me live call sites hain).
    try {
      if (supabaseClient.storage && typeof supabaseClient.storage.from === 'function') {
        var origSFrom = supabaseClient.storage.from.bind(supabaseClient.storage);
        supabaseClient.storage.from = function (bucket) {
          var sb = origSFrom(bucket);
          ['upload', 'remove', 'copy', 'move', 'createSignedUploadUrl', 'uploadToSignedUrl']
            .forEach(function (m) {
              if (typeof sb[m] !== 'function') return;
              var o = sb[m].bind(sb);
              sb[m] = function () {
                if (window.DIO && DIO.sub && DIO.sub.blocked()) {
                  return Promise.resolve({ data: null,
                    error: { code: 'DIO_SUB', message: 'سبسکرپشن غیر فعال — فائل اپلوڈ بند' } });
                }
                return o.apply(sb, arguments);
              };
            });
          return sb;
        };
      }
    } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }

    // ── rpc: sirf tajdeed/jaanch ki darkhwast khuli ────────────
    try {
      if (typeof supabaseClient.rpc === 'function') {
        var origRpc = supabaseClient.rpc.bind(supabaseClient);
        var RPC_WL = { dio_request_subscription: 1, dio_has_active_sub: 1, dio_my_officer_id: 1 };
        supabaseClient.rpc = function (fn) {
          if (!RPC_WL[fn] && window.DIO && DIO.sub && DIO.sub.blocked()) return _dioBlockedBuilder();
          return origRpc.apply(supabaseClient, arguments);
        };
      }
    } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  } catch (_) { /* fail-open */ }
}
// Guard FAURAN lagao — pehle 3 second ka window tha jis me har write bina
// rok guzar jati thi. setTimeout ab sirf fallback hai (client abhi na bana ho to).
try { _installDioWriteGuard(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
try { setTimeout(_installDioWriteGuard, 1200); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }


// ── #9 FAIL-CLOSED OFFLINE IJAZAT ─────────────────────────────
//  Pehle: har offline/DB-error par NAYA 30-din trial mil jata tha (fail-open)
//  — yaani mo'attal/miyaad-khatam afsar bhi sirf internet band kar ke kaam
//  jari rakh sakta tha. Ab tarteeb ye hai:
//    1) Server ka ECDSA dastkhat-shuda license token (sab se mazboot)
//    2) Aakhri KAMYAB online natija (guzray dinon ki katauti ke sath)
//    3) Kabhi online tasdeeq na hui ho → sirf MUKHTASIR grace, naya trial nahi
//  Field officer phanse na — is liye tasdeeq-shuda afsar ki offline ijazat
//  utni hi chalti hai jitni server ne aakhri baar kahi thi.
const _SUB_CACHE_KEY  = 'dio_sub_cache';
const _SUB_GRACE_DAYS = 3;

function _dioCacheSub(res, oid) {
  try {
    if (!res || !res.status || res.status === 'none') return;
    var closed = (res.status === 'suspended' || res.status === 'expired');
    localStorage.setItem(_SUB_CACHE_KEY, JSON.stringify({
      s: res.status, d: closed ? 0 : (res.daysLeft || 0),
      p: res.plan || '', o: oid || null, t: Date.now()
    }));
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
}

function _dioReadSubCache(oid) {
  try {
    var raw = localStorage.getItem(_SUB_CACHE_KEY);
    if (!raw) return null;
    var c = JSON.parse(raw);
    if (!c || !c.t) return null;
    // Pehle sirf tab radd hota tha jab c.o MOJOOD aur MUKHTALIF ho — yaani
    // `o` field hata dene se cache HAR afsar par lag jata tha. Ab sakht:
    // afsar maloom ho to cache ka afsar bhi maloom AUR barabar hona chahiye.
    if (!oid) return null;                       // afsar hi maloom nahi → cache na maano
    if (!c.o || c.o !== oid) return null;        // ghayab ya mukhtalif → radd
    if (c.s === 'suspended' || c.s === 'expired')
      return { status: c.s, daysLeft: 0, plan: c.p || 'بند' };
    // Ghari peeche karne se elapsed manfi ho kar miyaad BAHRTI thi.
    // Ab: kabhi manfi nahi, aur sab se zyada dekha gaya waqt yaad rakhte hain.
    var _now = Date.now();
    try {
      var hw = +(localStorage.getItem('dio_hw_clock') || 0);
      if (hw > _now) _now = hw; else localStorage.setItem('dio_hw_clock', String(_now));
    } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    var elapsed = Math.max(0, Math.floor((_now - c.t) / 86400000));
    var left = (c.d || 0) - elapsed;
    if (left <= 0)
      return { status: 'expired', daysLeft: 0, plan: 'میعاد ختم — آن لائن تجدید کریں' };
    return { status: c.s, daysLeft: left, plan: (c.p || 'اجازت') + ' (آف لائن)' };
  } catch (_) { return null; }
}

async function _dioOfflineStatus(oid) {
  try {
    if (typeof dioLicenseValid === 'function') {
      var lic = await dioLicenseValid();
      // Token BEARER na ban jaye: doosre afsar ka token copy kar lena
      // kaafi nahi hona chahiye — officer_id milna zaroori hai.
      // Pehle do short-circuit the (`oid &&`, `lic.officerId &&`) — yaani
      // oid maloom na ho ya token me officer_id na ho to kisi AUR afsar ka
      // token bhi qabool ho jata. Ab dono taraf lazmi aur barabar.
      if (lic && lic.valid && !(oid && lic.officerId && lic.officerId === oid)) {
        lic = { valid: false };
      }
      if (lic && lic.valid) {
        return { status: 'active',
                 daysLeft: Math.max(1, Math.ceil((lic.entitledUntil - Date.now()) / 86400000)),
                 plan: lic.plan || 'آف لائن اجازت' };
      }
      if (lic && lic.expired)
        return { status: 'expired', daysLeft: 0, plan: 'میعاد ختم — آن لائن تجدید کریں' };
    }
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  var cached = _dioReadSubCache(oid);
  if (cached) return cached;

  // Grace AIK BAAR — pehle HAR call par naye 3 din ban jate the, yaani
  // cache mita kar offline rehne se hamesha ki chhoot. Ab pehli baar ka
  // waqt likh liya jata hai aur usi se ginti hoti hai.
  try {
    var GK = 'dio_grace_start';
    var st = +(localStorage.getItem(GK) || 0);
    if (!st) { st = Date.now(); localStorage.setItem(GK, String(st)); }
    var used = Math.max(0, Math.floor((Date.now() - st) / 86400000));
    var left = _SUB_GRACE_DAYS - used;
    if (left > 0) {
      return { status: 'trial', daysLeft: left,
               plan: 'عارضی اجازت — آن لائن تصدیق درکار' };
    }
  } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
  return { status: 'expired', daysLeft: 0,
           plan: 'آن لائن تصدیق درکار — تجدید کریں' };
}

// ── SUBSCRIPTION CHECK ON LOGIN ───────────────────────────────
async function checkSubscription() {
  try {
    const oid = await getOfficerId();
    if (!oid) return { status:'none' };
    /* PERMANENT RULE — superadmin (app ka maalik) par subscription kabhi
       apply nahi hoti. Owner ko system kabhi block nahi kar sakta.

       MAGAR: yeh faisla `currentOfficer.role` par hai, aur OFFLINE soorat
       mein wo record afsar ke apne aale (`dio_officer_cache` / offlineStore)
       se aata hai — yaani usay badla ja sakta hai. Pehle yahan se seedha
       "لائف ٹائم" mil jata tha: jis afsar ki miyaad khatam ho chuki ho, wo
       localStorage mein `"role":"superadmin"` likh kar hamesha ke liye
       khul jata tha.
       AB: chhoot sirf ONLINE — wahan `currentOfficer` usi session mein
       server se aaya hai. OFFLINE par faisla `_dioOfflineStatus()` karta
       hai, jo pehle DASTKHAT-SHUDA license token dekhta hai (jise jaali
       nahi banaya ja sakta), phir kiash, phir mehdood grace.
       Taake asal malik maidan mein na ruke: ONLINE hote hi us ka kiash bhi
       likh dete hain aur license token bhi mangwa lete hain (Edge Function
       malik ko 72 ghante ka dastkhat-shuda token deta hai). */
    if (currentOfficer && currentOfficer.role === 'superadmin') {
      if (navigator.onLine) {
        var _ownerOut = { status:'active', daysLeft:36500, plan:'مالک — لائف ٹائم' };
        try { _dioCacheSub(_ownerOut, oid); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
        try { if (typeof dioRefreshLicense === 'function') dioRefreshLicense(); } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
        return _ownerOut;
      }
      return await _dioOfflineStatus(oid);
    }
    // #9 fail-closed: offline par naya trial NAHI — token/cache/grace
    if (!navigator.onLine) return await _dioOfflineStatus(oid);

    const { data, error } = await supabaseClient
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('officer_id', oid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // #9 fail-closed: RLS/401/DB kharabi par bhi naya trial NAHI
    if (error) return await _dioOfflineStatus(oid);

    if (!data) {
      // ═══ TRIAL AB SERVER DETA HAI ═══════════════════════════════
      //  پہلے یہاں کلائنٹ خود اپنے لیے 30 دن کا trial بنا لیتا تھا
      //  (`_createTrial`)۔ یہی سب سے بڑا سوراخ تھا: جس کے پاس بھی app
      //  کا کوڈ ہو، وہ خود کو مسلسل trial دے سکتا تھا — یعنی سبسکرپشن
      //  کا نفاذ بےمعنی ہو جاتا تھا۔
      //
      //  اب trial ڈیٹابیس خود بناتا ہے، اُس لمحے جب ایڈمن افسر کو منظور
      //  کرتا ہے (`dio_trial_on_approval` trigger)۔ اِس لیے یہاں "کوئی
      //  record نہیں" کا مطلب واقعی "کوئی حق نہیں" ہے۔
      //
      //  'none' پہلے سے fail-closed ہے (اوپر والے گارڈز اسے بلاک کرتے
      //  ہیں)، اور `_dioCacheSub` اسے محفوظ نہیں کرتا — یعنی اگلی بار
      //  پھر سرور ہی سے پوچھا جائے گا۔
      return { status:'none', daysLeft:0,
               plan:'کوئی سبسکرپشن نہیں — ایڈمن سے رابطہ کریں' };
    }

    const now  = new Date();
    const exp  = new Date(data.expires_at);
    const diff = Math.ceil((exp - now)/(1000*60*60*24));

    window._currentSub = data;

    var out;
    if (data.status === 'active' && diff > 0) {
      out = { status:'active', daysLeft:diff, plan:data.subscription_plans?.name||'فعال' };
    } else if (data.status === 'trial' && diff > 0) {
      out = { status:'trial', daysLeft:diff, plan:'آزمائشی' };
    } else if (data.status === 'suspended') {
      out = { status:'suspended', daysLeft:0, plan:'معطل' };
    } else {
      out = { status:'expired', daysLeft:diff, plan:'میعاد ختم' };
    }
    // #9: kamyab ONLINE natije ko cache karo + dastkhat-shuda license taza karo
    _dioCacheSub(out, oid);
    try { localStorage.removeItem('dio_grace_start'); } catch (_) { /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
    try {
      if (typeof dioRefreshLicense === 'function' &&
          (out.status === 'active' || out.status === 'trial')) dioRefreshLicense();
    } catch(_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }
    return out;
  } catch(_) {
    // #9 fail-closed: ghair-mutawaqqa khrabi par bhi naya trial NAHI
    try { return await _dioOfflineStatus(null); } catch(_e) {
      return { status:'expired', daysLeft:0, plan:'میعاد ختم — آن لائن تجدید کریں' };
    }
  }
}

/* `_createTrial` جان بوجھ کر ہٹا دیا گیا۔
   یہ کلائنٹ سے `subscriptions` میں status:'trial' کی سطر ڈالتا تھا — یعنی
   app خود کو حق دے دیتی تھی۔ اب یہ کام صرف ڈیٹابیس کرتا ہے (ایڈمن کی
   منظوری پر، 30 دن، اور صرف ایک بار)۔ دیکھیں: sql/91a, 91b.
   یہاں کوئی بدل نہیں رکھا گیا — کوئی بھی کلائنٹ کوڈ trial نہیں بنا سکتا۔ */

// ── SUBSCRIPTION BANNER ───────────────────────────────────────
async function showSubscriptionBanner() {
  /* v527: login ke 3 second baad yeh chalta hai. Agar afsar us se pehle
     log aut kar chuka ho to currentUser khaali hota hai, halat 'none' aati
     hai aur TALA login safhe ke OOPAR lag jata tha — koi bhi (offline bhi)
     login nahi kar pata tha. Ab: koi andar hi nahi to kuch nahi. */
  if (!(typeof currentUser !== 'undefined' && currentUser)) return;
  try { var _ms = document.getElementById('main-app'); if (_ms && _ms.style.display === 'none') return; } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  // Trial/active info now shows in the BOTTOM bar (footer-license), not below topbar.
  const existing = document.getElementById('sub-banner');
  if (existing) existing.remove();
  const sub = await checkSubscription();
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم/معطل پر اب پورا ایپ LOCK نہیں ہوتا
  // (پہلے showSubscriptionRequired پورا main-app بدل دیتا تھا)۔ اب صرف فلیگ سیٹ
  // ہوتا ہے — افسر اپنا ڈیٹا دیکھ/کھول سکتا ہے؛ پرنٹ/ترمیم/نیا اندراج گارڈز سے رکتے
  // ہیں۔ فوٹر بیج (updateSubBadge) حالت دکھاتا ہے۔
  if (window.DIO && DIO.sub) DIO.sub.setFromStatus(sub.status);

  // ══════════════════════════════════════════════════════════════
  //  v561 (28 اکتوبر 2026، مالک کا تازہ حکم): میعاد ختم (expired) = صرف
  //  دیکھنا — اندر آ سکتے ہیں، پڑھ سکتے ہیں؛ پرنٹ / لکھنا / ترمیم بند
  //  (_dioEnterViewOnly)۔ نیچے والا پورا تالا اب صرف: معطل سبسکرپشن،
  //  کوئی سبسکرپشن نہیں (none / unknown)، اور معطل افسر۔
  //  ──────────────────────────────────────────────────────────────
  //  (پرانا متن، تاریخ کے لیے)
  //  MIYAAD KHATAM = DAAKHLA MUKAMMAL BAND   (maalik ki nayi hidayat)
  //  ──────────────────────────────────────────────────────────────
  //  PEHLE: sirf `suspended` par daakhla band tha; `expired` par
  //  "view-only" chalta tha — afsar ander aa kar apna record dekh
  //  sakta tha, bas likh/chhap nahi sakta tha.
  //  AB: miyaad khatam hote hi afsar KISI BHI TARAH ander nahi aa
  //  sakta — jab tak tajdeed na kar le. Yahi maalik ka faisla hai.
  //
  //  Kin haalaton par band: expired, suspended, none, unknown.
  //  'none'/'unknown' bhi is liye ke agar halat maloom hi na ho to
  //  shak ka faida DAAKHLE ko nahi, ROKNE ko jata hai (fail-closed).
  //
  //  Do cheezen HAMESHA khuli rehti hain, warna afsar phans jaye:
  //    • tajdeed/adaayegi ka raasta (dio_request_subscription RPC)
  //    • logout
  //  Aur maalik (superadmin) par ye kabhi lagu nahi hota.
  // ══════════════════════════════════════════════════════════════
  var _owner = (typeof currentOfficer !== 'undefined' && currentOfficer &&
                currentOfficer.role === 'superadmin');
  var _suspOfficer = (typeof _dioIsSuspended === 'function') &&
                     _dioIsSuspended(typeof currentOfficer !== 'undefined' ? currentOfficer : null);
  var _noEntry = (sub.status === 'suspended' ||
                  sub.status === 'none'     || sub.status === 'unknown');
  var _viewOnly = (sub.status === 'expired');
  if (!_owner && (_noEntry || _suspOfficer)) {
    // AHEM: sirf #main-app ka innerHTML badalna KAAFI NAHI tha — session
    // zinda rehta, write-guard ka flag false rehta (wo sirf subscription ki
    // halat se set hota hai), to mo'attal afsar print bhi kar leta aur
    // showPage() se UI wapas bhi le aata. Ab: flag zabardasti TRUE, guard
    // install, safha dikhao, aur session KHATAM karo.
    try { if (window.DIO && DIO.sub) DIO.sub._blocked = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    _installDioWriteGuard();
    try { _dioHardLock(sub); } catch (_) { try { showSubscriptionRequired(sub); } catch (_e) { /* ikhtiyari qadam — na ho sake to chhoR do */ } }
    if (_suspOfficer) {
      // Idara-jati mo'attali → device se raasta band + logout
      try { if (typeof _dioPurgeOnSuspend === 'function') await _dioPurgeOnSuspend(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
      try { await supabaseClient.auth.signOut(); } catch (_) { /* best-effort — na ho sake to bhi aage chalo */ }
      currentUser = null; currentOfficer = null;
    }
    return;
  }

  _installDioWriteGuard();   // central write-guard yaqeeni tor par lagao (supabaseClient ab mojood hai)
  if (!_owner && _viewOnly) { _dioEnterViewOnly(); return; }
  // تجدید ہو چکی (active / trial) — «صرف دیکھنا» ختم
  if (_dioViewOnlyActive()) _dioExitViewOnly();
}

/* ═══════════════════════════════════════════════════════════════
   MUKAMMAL NAAKA-BANDI (hard lock)
   ───────────────────────────────────────────────────────────────
   Sirf safhe ka mawad badal dena KAAFI NAHI hai. Jo shakhs
   chahta ho, wo bara aasani se:
     • Developer Tools khol kar lock wala `<div>` mita de
     • console me `showPage('cases')` likh kar UI wapas le aaye
     • `DIO.sub._blocked = false` kar de
     • localStorage me apni halat 'active' likh de
   In sab par daakhla nahi milna chahiye. Is liye:

     1. `_dioLocked` nishan — poore nizam ka waahid sach.
     2. Lock ka safha har 1.2 second baad KHUD ko dobara laga
        leta hai (agar mita diya jaye).
     3. `showPage()` lapeta gaya — lock ke doran koi safha nahi
        khulta, lock hi dobara aa jata hai.
     4. `DIO.sub.blocked()` par bhi nishan chalta hai — koi
        `_blocked = false` kar bhi de to write-guard band rehta hai.
     5. localStorage ki cache par bharosa NAHI — cache sirf OFFLINE
        surat me kaam aati hai aur wo bhi dastkhat-shuda token ke
        baad; yahan faisla `checkSubscription()` ka hai.

   Do raaste KHULE rehte hain (warna afsar phans jaye):
     • tajdeed/adaayegi
     • logout
   ═══════════════════════════════════════════════════════════════ */
/* Tale ki halat CLOSURE ke andar — `window` par nahi.
   HAMLA JO IS NE PAKRA (naapa gaya): pehle halat `window._dioLocked`
   par thi. Console me `window._dioLocked = false` likhte hi:
     • pehra (interval) khud ko band kar leta tha — kyunki wo usi
       nishan ko dekh kar chalta tha jise hamla-aawar ne ulta diya
     • aur likhai ka guard bhi khul jata tha
   Ab halat bahar se chhui hi nahi ja sakti. Khulne ka SIRF aik
   raasta hai: `_dioUnlockIfRenewed()` — aur wo bhi tab jab ONLINE
   ja kar server se tasdeeq ho jaye.

   YAAD RAHE: asal rok SERVER par hai (sql/70_no_entry_on_expiry.sql).
   Client ka tala afsar ke apne aale par hai — wo har haal mein
   tora ja sakta hai. Is liye ye tala sirf SAAF aur foran rukawat
   ke liye hai; data ki asal hifazat RLS karti hai. */
var _dioLockTimer = null;
var _dioLockState = (function () {
  var locked = false;
  return {
    on:  function () { locked = true; },
    off: function () { locked = false; },
    is:  function () { return locked === true; }
  };
})();

function _dioLockActive() { return _dioLockState.is(); }

function _dioHardLock(sub) {
  _dioLockState.on();
  try { if (window.DIO && DIO.sub) DIO.sub._blocked = true; } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }

  // showPage ko lapeto — lock ke doran koi safha na khule
  try {
    if (typeof window.showPage === 'function' && !window.showPage._dioLockWrapped) {
      var _origShow = window.showPage;
      var wrapped = function (page, el) {
        if (_dioLockActive()) { _dioPaintLock(sub); return; }
        return _origShow.call(window, page, el);
      };
      wrapped._dioLockWrapped = true;
      wrapped._dioOrig = _origShow;
      window.showPage = wrapped;
    }
  } catch (_) { /* ikhtiyari hook — mojood na ho ya phat jaye to asal kaam na ruke */ }

  _dioPaintLock(sub);

  // Har 1.2 second — agar lock mita diya gaya ho to dobara laga do
  try { if (_dioLockTimer) clearInterval(_dioLockTimer); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  _dioLockTimer = setInterval(function () {
    // Pehra SIRF tab rukta hai jab tala waqai khul chuka ho (tajdeed ke
    // baad). Console se koi nishan ulta de to pehra chalta rehta hai.
    if (!_dioLockState.is()) { clearInterval(_dioLockTimer); _dioLockTimer = null; return; }
    try {
      if (window.DIO && DIO.sub) DIO.sub._blocked = true;   // koi false kar de to wapas
      window._dioLocked = true;                              // sirf dikhane ke liye
      if (!document.getElementById('dio-sub-lock')) _dioPaintLock(sub);
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  }, 1200);
}
window._dioHardLock = _dioHardLock;

// v527: log aut par tala hatao — tala ACCOUNT ka hai, login safhe ka nahi.
// Bypass nahi: agli bar login par showSubscriptionBanner() wahi tala dobara lagata hai.
function _dioClearLockOnLogout() {
  try { _dioLockState.off(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { _dioExitViewOnly(); } catch (_) { /* ikhtiyari qadam */ }
  try { if (_dioLockTimer) { clearInterval(_dioLockTimer); _dioLockTimer = null; } } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
  try { var L = document.getElementById('dio-sub-lock'); if (L) L.remove(); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
  window._dioLocked = false;
}
window._dioClearLockOnLogout = _dioClearLockOnLogout;

// Tajdeed ke baad tala khole — sirf ONLINE tasdeeq par
async function _dioUnlockIfRenewed() {
  var btn = document.getElementById('dio-lock-recheck');
  if (btn) { btn.disabled = true; btn.textContent = '\u062c\u0627\u0646\u0686\u0627 \u062c\u0627 \u0631\u06c1\u0627 \u06c1\u06d2\u2026'; }
  try {
    if (!navigator.onLine) {
      try { showToast('\u062a\u062c\u062f\u06cc\u062f \u06a9\u06cc \u062a\u0635\u062f\u06cc\u0642 \u06a9\u06d2 \u0644\u06cc\u06d2 \u0627\u0646\u0679\u0631\u0646\u06cc\u0679 \u062f\u0631\u06a9\u0627\u0631 \u06c1\u06d2\u06d4','error'); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
      return;
    }
    var fresh = await checkSubscription();
    if (fresh && (fresh.status === 'active' || fresh.status === 'trial')) {
      _dioLockState.off();
      try { _dioExitViewOnly(); } catch (_) { /* ikhtiyari qadam */ }
      window._dioLocked = false;
      try { if (window.DIO && DIO.sub) DIO.sub.setFromStatus(fresh.status); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      try { if (_dioLockTimer) { clearInterval(_dioLockTimer); _dioLockTimer = null; } } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      try { var L = document.getElementById('dio-sub-lock'); if (L) L.remove(); } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
      try { showToast('\u062a\u062c\u062f\u06cc\u062f \u062a\u0633\u0644\u06cc\u0645 \u2014 \u062e\u0648\u0634 \u0622\u0645\u062f\u06cc\u062f\u06d4','success'); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
      try { location.reload(); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
      return;
    }
    try { showToast('\u062a\u062c\u062f\u06cc\u062f \u0627\u0628\u06be\u06cc \u062a\u0633\u0644\u06cc\u0645 \u0646\u06c1\u06cc\u06ba \u06c1\u0648\u0626\u06cc\u06d4 \u0627\u06cc\u0688\u0645\u0646 \u06a9\u06cc \u0645\u0646\u0638\u0648\u0631\u06cc کا \u0627\u0646\u062a\u0638\u0627\u0631 \u06a9\u0631\u06cc\u06ba\u06d4','error',4000); } catch (_) { /* paigham na dikh sake to koi baat nahi */ }
  } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ } finally {
    if (btn) { btn.disabled = false; btn.textContent = '\u0645\u06cc\u06ba \u0646\u06d2 \u062a\u062c\u062f\u06cc\u062f \u06a9\u0631 \u0644\u06cc \u2014 \u062f\u0648\u0628\u0627\u0631\u06c1 \u062c\u0627\u0646\u0686\u06cc\u06ba'; }
  }
}
window._dioUnlockIfRenewed = _dioUnlockIfRenewed;

function _dioPaintLock(sub) {
  sub = sub || { status: 'expired' };
  var susp = (sub.status === 'suspended');
  var old = document.getElementById('dio-sub-lock');
  if (old) old.remove();
  var box = document.createElement('div');
  box.id = 'dio-sub-lock';
  box.className = 'no-print';
  box.setAttribute('role', 'alertdialog');
  box.style.cssText = 'position:fixed;inset:0;z-index:2147483600;display:flex;' +
    'align-items:center;justify-content:center;padding:20px;direction:rtl;' +
    'background:var(--bg-primary,#f0f4f8);';
  box.innerHTML =
    '<div style="background:var(--bg-card,#fff);border:1px solid var(--border,#e2e8f0);' +
      'border-radius:16px;padding:32px 26px;max-width:460px;width:100%;text-align:center;' +
      'box-shadow:0 10px 34px rgba(15,27,42,.18);">' +
      '<svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="currentColor" ' +
        'stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
        'style="opacity:.45;margin-bottom:14px;">' +
        '<path d="M5.5 11h13v9.5h-13z"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>' +
      '<div style="font-size:19px;font-weight:800;color:var(--text-primary,#0f1b2a);' +
        'margin-bottom:8px;line-height:1.9;">' +
        (susp ? '\u0627\u06a9\u0627\u0624\u0646\u0679 \u0645\u0639\u0637\u0644 \u06c1\u06d2'
              : '\u0633\u0628\u0633\u06a9\u0631\u067e\u0634\u0646 \u06a9\u06cc \u0645\u06cc\u0639\u0627\u062f \u062e\u062a\u0645 \u06c1\u0648 \u06af\u0626\u06cc') +
      '</div>' +
      '<div style="font-size:13.5px;color:var(--text-secondary,#475569);line-height:2;' +
        'margin-bottom:22px;">' +
        (susp ? '\u0622\u067e \u06a9\u0627 \u0627\u06a9\u0627\u0624\u0646\u0679 \u0627\u06cc\u0688\u0645\u0646 \u0646\u06d2 \u0645\u0639\u0637\u0644 \u06a9\u06cc\u0627 \u06c1\u06d2\u06d4 \u0631\u0627\u0628\u0637\u06c1 \u06a9\u0631\u06cc\u06ba\u06d4'
              : '\u062a\u062c\u062f\u06cc\u062f \u06a9\u06d2 \u0628\u063a\u06cc\u0631 \u0633\u06cc\u0633\u0679\u0645 \u0645\u06cc\u06ba \u062f\u0627\u062e\u0644\u06c1 \u0646\u06c1\u06cc\u06ba\u06d4 \u0622\u067e \u06a9\u0627 \u062a\u0645\u0627\u0645 \u0631\u06cc\u06a9\u0627\u0631\u0688 \u0645\u062d\u0641\u0648\u0638 \u06c1\u06d2 \u2014 \u062a\u062c\u062f\u06cc\u062f \u06a9\u0631\u062a\u06d2 \u06c1\u06cc \u0648\u0627\u067e\u0633 \u0645\u0644 \u062c\u0627\u0626\u06d2 \u06af\u0627\u06d4') +
      '</div>' +
      (susp ? '' :
        '<button class="btn btn-primary" style="width:100%;padding:13px;font-size:15px;' +
          'margin-bottom:9px;" onclick="_showPlans()">\u062a\u062c\u062f\u06cc\u062f \u06a9\u0631\u06cc\u06ba</button>' +
        '<button class="btn btn-secondary" id="dio-lock-recheck" style="width:100%;' +
          'margin-bottom:9px;" onclick="_dioUnlockIfRenewed()">' +
          '\u0645\u06cc\u06ba \u0646\u06d2 \u062a\u062c\u062f\u06cc\u062f \u06a9\u0631 \u0644\u06cc \u2014 \u062f\u0648\u0628\u0627\u0631\u06c1 \u062c\u0627\u0646\u0686\u06cc\u06ba</button>') +
      '<button class="btn btn-secondary" style="width:100%;" onclick="doLogout()">' +
        '\u0644\u0627\u06af \u0622\u0624\u0679</button>' +
    '</div>';
  document.body.appendChild(box);
}

function showSubscriptionRequired(sub) {
  const app = document.getElementById('main-app');
  if (!app) return;
  app.innerHTML = `
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;width:100%;background:var(--bg-primary);direction:rtl;">
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:40px;max-width:480px;width:90%;text-align:center;box-shadow:var(--shadow);">
      <div style="font-size:64px;margin-bottom:16px;"><svg viewBox='0 0 24 24' width='64' height='64' fill='none' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.42;display:inline-block;vertical-align:middle'><path d='M5.5 11h13v9.5h-13z'/><path d='M8.5 11V8a3.5 3.5 0 0 1 7 0v3'/></svg></div>
      <div style="font-size:20px;font-weight:800;color:var(--text-primary);margin-bottom:8px;font-family:'Jameel Noori Nastaleeq',serif;">
        ${sub.status==='expired'?'سبسکرپشن ختم ہو گئی':'اکاؤنٹ معطل'}
      </div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:24px;">
        ${sub.status==='expired'?'آپ کی سبسکرپشن کی میعاد ختم ہو گئی ہے۔ جاری رکھنے کے لیے تجدید کریں۔':'آپ کا اکاؤنٹ معطل ہے۔ ایڈمن سے رابطہ کریں۔'}
      </div>
      <button class="btn btn-primary" style="width:100%;padding:14px;font-size:15px;margin-bottom:10px;" onclick="_showPlans()">
        پلان خریدیں
      </button>
      <button class="btn btn-secondary" style="width:100%;" onclick="doLogout()">← لاگ آؤٹ</button>
    </div>
  </div>`;
  _showPlans();
}

// ── SUBSCRIPTION PAGE ─────────────────────────────────────────
function showSubscriptionPage() {
  openModal('سبسکرپشن پلان', _plansHTML(), '');
}

function _showPlans() {
  openModal('Digital IO — پلان منتخب کریں', _plansHTML(), '');
}

function _plansHTML() {
  return `
  <div style="direction:rtl;">
    <!-- Plans Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">

      <!-- Trial -->
      <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:24px;"><svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.9;display:inline-block;vertical-align:middle'><path d='M3.5 8.5h17V12h-17z'/><path d='M4.5 12v8.5h15V12'/><path d='M12 8.5v12'/></svg></div>
        <div style="font-weight:800;font-size:14px;margin:6px 0;">آزمائشی</div>
        <div style="font-size:22px;font-weight:900;color:var(--green);">مفت</div>
        <div style="font-size:10px;color:var(--text-muted);">30 دن</div>
        <ul style="font-size:11px;color:var(--text-secondary);text-align:right;margin:10px 0;list-style:none;padding:0;">
          <li>تمام فیچرز آزمائیں</li>
          <li>مقدمات</li>
          <li>30 دن بعد ادائیگی</li>
        </ul>
      </div>

      <!-- 1 Month -->
      <div style="background:var(--bg-secondary);border:1px solid var(--accent);border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:24px;"><svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.9;display:inline-block;vertical-align:middle'><path d='M12 3.8l2.5 5.1 5.6.8-4 4 .9 5.6-5-2.6-5 2.6.9-5.6-4-4 5.6-.8z'/></svg></div>
        <div style="font-weight:800;font-size:14px;margin:6px 0;">ماہانہ</div>
        <div style="font-size:22px;font-weight:900;color:var(--accent);">300 روپے</div>
        <div style="font-size:10px;color:var(--text-muted);">1 ماہ</div>
        <ul style="font-size:11px;color:var(--text-secondary);text-align:right;margin:10px 0;list-style:none;padding:0;">
          <li>تمام فیچرز</li>
          <li>لامحدود مقدمات</li>
          <li>تمام دستاویزات</li>
        </ul>
        <button class="btn btn-primary btn-sm" style="width:100%;" onclick="closeModal();_openPayment('ماہانہ',300,30)">خریدیں</button>
      </div>

      <!-- 6 Months -->
      <div style="background:linear-gradient(135deg,rgba(56,189,248,0.1),rgba(14,165,233,0.05));border:2px solid var(--accent);border-radius:10px;padding:16px;text-align:center;position:relative;">
        <div style="position:absolute;top:-10px;right:50%;transform:translateX(50%);background:var(--accent);color:#fff;font-size:10px;padding:2px 10px;border-radius:10px;font-weight:700;">مقبول</div>
        <div style="font-size:24px;"><svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.9;display:inline-block;vertical-align:middle'><path d='M12 3.5l8.5 4.5h-17z'/><path d='M5.5 10v8M10 10v8M14 10v8M18.5 10v8'/><path d='M3.5 20.5h17'/></svg></div>
        <div style="font-weight:800;font-size:14px;margin:6px 0;">شش ماہی</div>
        <div style="font-size:22px;font-weight:900;color:var(--accent);">1500 روپے</div>
        <div style="font-size:10px;color:var(--text-muted);">6 ماہ (17% بچت)</div>
        <ul style="font-size:11px;color:var(--text-secondary);text-align:right;margin:10px 0;list-style:none;padding:0;">
          <li>تمام فیچرز</li>
          <li>لامحدود مقدمات</li>
          <li>6 ماہ بے فکری</li>
        </ul>
        <button class="btn btn-primary btn-sm" style="width:100%;" onclick="closeModal();_openPayment('شش ماہی',1500,180)">خریدیں</button>
      </div>

      <!-- 1 Year -->
      <div style="background:linear-gradient(135deg,rgba(167,139,250,0.1),rgba(139,92,246,0.05));border:1px solid #a78bfa;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:24px;"><svg viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.9;display:inline-block;vertical-align:middle'><path d='M3.5 8l4 4 4.5-6.5L16.5 12l4-4-1.5 10h-14z'/></svg></div>
        <div style="font-weight:800;font-size:14px;margin:6px 0;">سالانہ</div>
        <div style="font-size:22px;font-weight:900;color:#a78bfa;">2500 روپے</div>
        <div style="font-size:10px;color:var(--text-muted);">1 سال (31% بچت)</div>
        <ul style="font-size:11px;color:var(--text-secondary);text-align:right;margin:10px 0;list-style:none;padding:0;">
          <li>تمام فیچرز</li>
          <li>پریمیم سپورٹ</li>
          <li>نئی فیچرز پہلے</li>
          <li>سب سے کم قیمت</li>
        </ul>
        <button class="btn btn-secondary btn-sm" style="width:100%;border-color:#a78bfa;color:#a78bfa;" onclick="closeModal();_openPayment('سالانہ',2500,365)">خریدیں</button>
      </div>
    </div>
    <div style="text-align:center;font-size:11px;color:var(--text-muted);">
      مدد کے لیے: <b>DigitalIO Support</b>
    </div>
  </div>`;
}

// ── PAYMENT FORM ──────────────────────────────────────────────
function _openPayment(planName, amount, days) {
  openModal(`ادائیگی — ${planName}`,
    `<div style="direction:rtl;">
      <!-- Payment Methods -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        <div style="background:rgba(34,197,94,0.1);border:1px solid var(--green);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;margin-bottom:4px;"><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.9;display:inline-block;vertical-align:middle'><path d='M7 3h10v18H7z'/><path d='M10.5 18.2h3'/></svg></div>
          <div style="font-weight:700;font-size:12px;color:var(--green);">JazzCash</div>
          <div style="font-size:13px;font-weight:900;color:var(--text-primary);" id="jc-number">0300-7339260</div>
          <button onclick="navigator.clipboard.writeText('03007339260').then(()=>showToast('نمبر کاپی ہو گیا','success'))" style="font-size:10px;background:none;border:none;color:var(--accent);cursor:pointer;">کاپی کریں</button>
        </div>
        <div style="background:rgba(139,92,246,0.1);border:1px solid #a78bfa;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;margin-bottom:4px;"><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.9;display:inline-block;vertical-align:middle'><path d='M7 3h10v18H7z'/><path d='M10.5 18.2h3'/></svg></div>
          <div style="font-weight:700;font-size:12px;color:#a78bfa;">EasyPaisa</div>
          <div style="font-size:13px;font-weight:900;color:var(--text-primary);">0300-7339260</div>
          <button onclick="navigator.clipboard.writeText('03007339260').then(()=>showToast('نمبر کاپی ہو گیا','success'))" style="font-size:10px;background:none;border:none;color:var(--accent);cursor:pointer;">کاپی کریں</button>
        </div>
        <div style="background:rgba(56,189,248,0.1);border:1px solid var(--accent);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;margin-bottom:4px;"><svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true' style='opacity:.9;display:inline-block;vertical-align:middle'><path d='M12 3.5l8.5 4.5h-17z'/><path d='M5.5 10v8M10 10v8M14 10v8M18.5 10v8'/><path d='M3.5 20.5h17'/></svg></div>
          <div style="font-weight:700;font-size:12px;color:var(--accent);">Raast</div>
          <div style="font-size:13px;font-weight:900;color:var(--text-primary);">0300-7339260</div>
          <button onclick="navigator.clipboard.writeText('03007339260').then(()=>showToast('نمبر کاپی ہو گیا','success'))" style="font-size:10px;background:none;border:none;color:var(--accent);cursor:pointer;">کاپی کریں</button>
        </div>
      </div>

      <!-- Amount -->
      <div style="background:var(--bg-secondary);border-radius:8px;padding:12px;text-align:center;margin-bottom:14px;">
        <div style="font-size:11px;color:var(--text-muted);">رقم</div>
        <div style="font-size:28px;font-weight:900;color:var(--accent);">Rs. ${amount.toLocaleString()}</div>
        <div style="font-size:11px;color:var(--text-muted);">${planName} — ${days} دن</div>
      </div>

      <!-- Steps -->
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:14px;">
        <div style="font-weight:700;margin-bottom:6px;">ادائیگی کے مراحل:</div>
        <div>1️⃣ JazzCash / EasyPaisa / Raast سے اوپر نمبر پر <b>Rs. ${amount}</b> بھیجیں</div>
        <div>2️⃣ Transaction ID نوٹ کریں</div>
        <div>3️⃣ نیچے فارم بھریں</div>
        <div>4️⃣ ایڈمن تصدیق کرے گا (عام طور پر 1-2 گھنٹے)</div>
      </div>

      <!-- Form -->
      <label class="form-label">Transaction ID *</label>
      <input class="form-input" id="pay-txn" placeholder="مثلاً TXN123456789" dir="ltr" style="text-align:left;margin-bottom:8px;">
      <label class="form-label">ادائیگی کا طریقہ</label>
      <select class="form-input" id="pay-method" style="margin-bottom:8px;">
        <option value="jazzcash">JazzCash</option>
        <option value="easypaisa">EasyPaisa</option>
        <option value="raast">Raast</option>
      </select>
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_submitPayment('${planName}',${amount},${days})">درخواست بھیجیں</button>
    </div>`
  );
}

async function _submitPayment(planName, amount, days) {
  const txnId  = document.getElementById('pay-txn')?.value.trim();
  const method = document.getElementById('pay-method')?.value;
  // v541: «نوٹ (اختیاری)» کا خانہ ہٹا دیا — اس میں لکھا کہیں بھیجا نہیں جاتا
  //   تھا (سرور کی درخواست میں اس کی جگہ نہیں)، یعنی افسر کا لکھا ضائع ہوتا تھا۔

  if (!txnId) { showToast('Transaction ID ضروری ہے','error'); return; }

  try {
    // Get plan id
    const { data:plans } = await supabaseClient.from('subscription_plans').select('id').eq('name',planName).single();

    // ═══ درخواست اب RPC سے جاتی ہے ═══════════════════════════════
    //  پہلے یہاں سیدھا `subscriptions` میں insert ہوتا تھا۔ اُس راستے
    //  میں status اور expires_at دونوں کلائنٹ طے کرتا تھا — یعنی app کا
    //  کوڈ بدل کر خود کو 'active' اور لمبی میعاد دی جا سکتی تھی۔
    //
    //  اب `dio_request_subscription` (security definer) یہ سب سرور پر
    //  کرتا ہے: status ہمیشہ 'pending'، میعاد خالی (ایڈمن منظوری پر
    //  plan کے duration_days سے لگتی ہے)، اور معطل/غیر منظور افسر کی
    //  درخواست وہیں رُک جاتی ہے۔
    //
    //  `days` اب استعمال نہیں ہوتا — میعاد کا فیصلہ سرور plan سے کرتا
    //  ہے، تاکہ ایک ہی جگہ سچ ہو۔ (دلیل برقرار ہے تاکہ بلانے والے نہ بدلیں۔)
    const { error: rpcErr } = await supabaseClient.rpc('dio_request_subscription', {
      p_plan_id: plans?.id || null,
      p_amount:  amount,
      p_ref:     txnId,
      p_method:  method,
    });
    if (rpcErr) throw rpcErr;

    closeModal();
    showToast('درخواست بھیج دی — ایڈمن تصدیق کرے گا','success');

    // WhatsApp notification to admin
    const o = currentOfficer||{};
    const msg = `Digital IO ادائیگی درخواست:\n\nافسر: ${o.full_name||'—'}\nتھانہ: ${o.station||'—'}\nپلان: ${planName}\nرقم: Rs. ${amount}\nTransaction ID: ${txnId}\nطریقہ: ${method}`;
    window.open(`https://wa.me/923007339260?text=${encodeURIComponent(msg)}`);

  } catch(e) { showToast(''+e.message,'error'); }
}

// ── SUBSCRIPTION STATUS IN SIDEBAR ───────────────────────────
async function updateSubBadge() {
  try {
    const sub = await checkSubscription();
    // Show in bottom bar (footer-license)
    const el = document.getElementById('sub-status-badge') || document.getElementById('footer-license');
    if (!el) return;
    if (sub.status==='active') {
      el.textContent = `فعال · ${sub.daysLeft} دن`;
      el.style.color = 'var(--green)';
    } else if (sub.status==='trial') {
      el.textContent = `آزمائشی · ${sub.daysLeft} دن باقی`;
      el.style.color = 'var(--amber)';
    } else if (sub.status==='suspended') {
      el.textContent = 'معطل · صرف دیکھیں — ایڈمن سے رابطہ';
      el.style.color = 'var(--red)';
      el.style.cursor = 'pointer';
      el.onclick = function(){ try{ _showPlans(); }catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ } };
    } else {
      el.textContent = 'میعاد ختم · صرف دیکھیں — تجدید کریں';
      el.style.color = 'var(--red)';
      el.style.cursor = 'pointer';
      el.onclick = function(){ try{ _showPlans(); }catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ } };
    }
  } catch(_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
}
