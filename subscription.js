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
    this._blocked = (status === 'expired' || status === 'suspended');
    return this._blocked;
  },
  blocked: function () { return this._blocked === true; },
  // guard(label) → true = آگے بڑھو، false = بند (renew prompt دکھایا)۔
  guard: function (label) {
    if (this._blocked !== true) return true;          // allow (default + fail-open)
    try { showToast('⛔ سبسکرپشن ختم — ' + (label || 'یہ عمل') + ' بند ہے۔ تجدید کریں۔', 'error', 4000); } catch (_) {}
    try { if (typeof _showPlans === 'function') _showPlans(); } catch (_) {}
    return false;
  }
};

// ═══════════════════════════════════════════════════════════════
//  CENTRAL WRITE-GUARD [4E.2] — "بالکل کوئی کام نہیں، صرف view"
//  میعاد ختم/معطل پر ہر DB write (insert/update/upsert/delete) بند — پورے
//  سسٹم میں، ہر ماڈیول (RFA/CDR/5C/CRO/سزا/درخواستیں/ٹیمپلیٹ/گواہ/عملہ… سب)۔
//  دو حفاظتی اصول:
//   1) کبھی THROW نہیں کرتا — {data:null,error} لوٹاتا ہے — تاکہ view/login کبھی نہ ٹوٹے۔
//   2) whitelist: subscriptions/subscription_plans کھلے — ورنہ تجدید ممکن نہ ہو (افسر پھنس جائے)۔
//  FAIL-OPEN: guard لگانے میں خرابی ہو تو writes معمول کے مطابق چلیں۔
// ═══════════════════════════════════════════════════════════════
var _DIO_WRITE_WL = { subscriptions: 1, subscription_plans: 1 };
var _dioSubPromptTs = 0;
function _dioSubWritePrompt() {
  var now = Date.now();
  if (now - _dioSubPromptTs < 1500) return;           // throttle — ایک عمل کے کئی writes پر spam نہ ہو
  _dioSubPromptTs = now;
  try { showToast('⛔ سبسکرپشن ختم — صرف دیکھ سکتے ہیں۔ تجدید کریں۔', 'error', 3500); } catch (_) {}
  try { if (typeof _showPlans === 'function') _showPlans(); } catch (_) {}
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
  } catch (_) { /* fail-open */ }
}
// load par bhi koshish (agar supabaseClient mojood ho) + showSubscriptionBanner se bhi (reliable)
try { setTimeout(_installDioWriteGuard, 3000); } catch (_) {}

// ── SUBSCRIPTION CHECK ON LOGIN ───────────────────────────────
async function checkSubscription() {
  try {
    const oid = await getOfficerId();
    if (!oid) return { status:'none' };
    // PERMANENT RULE — superadmin (app ka maalik) par subscription kabhi
    // apply nahi hoti. Owner ko system kabhi block nahi kar sakta.
    if (currentOfficer && currentOfficer.role === 'superadmin') {
      return { status:'active', daysLeft:36500, plan:'مالک — لائف ٹائم' };
    }
    if (!navigator.onLine) return { status:'trial', daysLeft:30, plan:'آزمائشی' };

    const { data, error } = await supabaseClient
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('officer_id', oid)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // If table not accessible (RLS/401) — just allow access silently
    if (error) return { status:'trial', daysLeft:30, plan:'آزمائشی' };

    if (!data) {
      // First time — create trial (ignore errors)
      try { await _createTrial(oid); } catch(_) {}
      return { status:'trial', daysLeft:30, plan:'آزمائشی' };
    }

    const now  = new Date();
    const exp  = new Date(data.expires_at);
    const diff = Math.ceil((exp - now)/(1000*60*60*24));

    window._currentSub = data;

    if (data.status === 'active' && diff > 0) {
      return { status:'active', daysLeft:diff, plan:data.subscription_plans?.name||'فعال' };
    } else if (data.status === 'trial' && diff > 0) {
      return { status:'trial', daysLeft:diff, plan:'آزمائشی' };
    } else if (data.status === 'suspended') {
      return { status:'suspended', daysLeft:0, plan:'معطل' };
    } else {
      return { status:'expired', daysLeft:diff, plan:'میعاد ختم' };
    }
  } catch(_) {
    return { status:'trial', daysLeft:30, plan:'آزمائشی' };
  }
}

async function _createTrial(oid) {
  const exp = new Date();
  exp.setDate(exp.getDate() + 30);
  try {
    await supabaseClient.from('subscriptions').insert({
      officer_id: oid,
      status: 'trial',
      started_at: new Date().toISOString(),
      expires_at: exp.toISOString(),
      amount: 0,
      payment_method: 'trial',
    });
  } catch(_) { /* silent — non-critical */ }
}

// ── SUBSCRIPTION BANNER ───────────────────────────────────────
async function showSubscriptionBanner() {
  // Trial/active info now shows in the BOTTOM bar (footer-license), not below topbar.
  const existing = document.getElementById('sub-banner');
  if (existing) existing.remove();
  const sub = await checkSubscription();
  // VIEW-ONLY ENFORCEMENT [4E]: میعاد ختم/معطل پر اب پورا ایپ LOCK نہیں ہوتا
  // (پہلے showSubscriptionRequired پورا main-app بدل دیتا تھا)۔ اب صرف فلیگ سیٹ
  // ہوتا ہے — افسر اپنا ڈیٹا دیکھ/کھول سکتا ہے؛ پرنٹ/ترمیم/نیا اندراج گارڈز سے رکتے
  // ہیں۔ فوٹر بیج (updateSubBadge) حالت دکھاتا ہے۔
  if (window.DIO && DIO.sub) DIO.sub.setFromStatus(sub.status);
  _installDioWriteGuard();   // central write-guard yaqeeni tor par lagao (supabaseClient ab mojood hai)
}

function showSubscriptionRequired(sub) {
  const app = document.getElementById('main-app');
  if (!app) return;
  app.innerHTML = `
  <div style="display:flex;align-items:center;justify-content:center;height:100vh;width:100%;background:var(--bg-primary);direction:rtl;">
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:40px;max-width:480px;width:90%;text-align:center;box-shadow:var(--shadow);">
      <div style="font-size:64px;margin-bottom:16px;">🔒</div>
      <div style="font-size:20px;font-weight:800;color:var(--text-primary);margin-bottom:8px;font-family:'Jameel Noori Nastaleeq',serif;">
        ${sub.status==='expired'?'سبسکرپشن ختم ہو گئی':'اکاؤنٹ معطل'}
      </div>
      <div style="font-size:13px;color:var(--text-secondary);margin-bottom:24px;">
        ${sub.status==='expired'?'آپ کی سبسکرپشن کی میعاد ختم ہو گئی ہے۔ جاری رکھنے کے لیے تجدید کریں۔':'آپ کا اکاؤنٹ معطل ہے۔ ایڈمن سے رابطہ کریں۔'}
      </div>
      <button class="btn btn-primary" style="width:100%;padding:14px;font-size:15px;margin-bottom:10px;" onclick="_showPlans()">
        💳 پلان خریدیں
      </button>
      <button class="btn btn-secondary" style="width:100%;" onclick="doLogout()">← لاگ آؤٹ</button>
    </div>
  </div>`;
  _showPlans();
}

// ── SUBSCRIPTION PAGE ─────────────────────────────────────────
function showSubscriptionPage() {
  openModal('💎 سبسکرپشن پلان', _plansHTML(), '');
}

function _showPlans() {
  openModal('💎 Digital IO — پلان منتخب کریں', _plansHTML(), '');
}

function _plansHTML() {
  return `
  <div style="direction:rtl;">
    <!-- Plans Grid -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">

      <!-- Trial -->
      <div style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:24px;">🎁</div>
        <div style="font-weight:800;font-size:14px;margin:6px 0;">آزمائشی</div>
        <div style="font-size:22px;font-weight:900;color:var(--green);">مفت</div>
        <div style="font-size:10px;color:var(--text-muted);">30 دن</div>
        <ul style="font-size:11px;color:var(--text-secondary);text-align:right;margin:10px 0;list-style:none;padding:0;">
          <li>✅ تمام فیچرز آزمائیں</li>
          <li>✅ مقدمات</li>
          <li>⏳ 30 دن بعد ادائیگی</li>
        </ul>
      </div>

      <!-- 1 Month -->
      <div style="background:var(--bg-secondary);border:1px solid var(--accent);border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:24px;">⭐</div>
        <div style="font-weight:800;font-size:14px;margin:6px 0;">ماہانہ</div>
        <div style="font-size:22px;font-weight:900;color:var(--accent);">300 روپے</div>
        <div style="font-size:10px;color:var(--text-muted);">1 ماہ</div>
        <ul style="font-size:11px;color:var(--text-secondary);text-align:right;margin:10px 0;list-style:none;padding:0;">
          <li>✅ تمام فیچرز</li>
          <li>✅ لامحدود مقدمات</li>
          <li>✅ تمام دستاویزات</li>
        </ul>
        <button class="btn btn-primary btn-sm" style="width:100%;" onclick="closeModal();_openPayment('ماہانہ',300,30)">خریدیں</button>
      </div>

      <!-- 6 Months -->
      <div style="background:linear-gradient(135deg,rgba(56,189,248,0.1),rgba(14,165,233,0.05));border:2px solid var(--accent);border-radius:10px;padding:16px;text-align:center;position:relative;">
        <div style="position:absolute;top:-10px;right:50%;transform:translateX(50%);background:var(--accent);color:#fff;font-size:10px;padding:2px 10px;border-radius:10px;font-weight:700;">مقبول</div>
        <div style="font-size:24px;">🏛️</div>
        <div style="font-weight:800;font-size:14px;margin:6px 0;">شش ماہی</div>
        <div style="font-size:22px;font-weight:900;color:var(--accent);">1500 روپے</div>
        <div style="font-size:10px;color:var(--text-muted);">6 ماہ (17% بچت)</div>
        <ul style="font-size:11px;color:var(--text-secondary);text-align:right;margin:10px 0;list-style:none;padding:0;">
          <li>✅ تمام فیچرز</li>
          <li>✅ لامحدود مقدمات</li>
          <li>✅ 6 ماہ بے فکری</li>
        </ul>
        <button class="btn btn-primary btn-sm" style="width:100%;" onclick="closeModal();_openPayment('شش ماہی',1500,180)">خریدیں</button>
      </div>

      <!-- 1 Year -->
      <div style="background:linear-gradient(135deg,rgba(167,139,250,0.1),rgba(139,92,246,0.05));border:1px solid #a78bfa;border-radius:10px;padding:16px;text-align:center;">
        <div style="font-size:24px;">👑</div>
        <div style="font-weight:800;font-size:14px;margin:6px 0;">سالانہ</div>
        <div style="font-size:22px;font-weight:900;color:#a78bfa;">2500 روپے</div>
        <div style="font-size:10px;color:var(--text-muted);">1 سال (31% بچت)</div>
        <ul style="font-size:11px;color:var(--text-secondary);text-align:right;margin:10px 0;list-style:none;padding:0;">
          <li>✅ تمام فیچرز</li>
          <li>✅ پریمیم سپورٹ</li>
          <li>✅ نئی فیچرز پہلے</li>
          <li>✅ سب سے کم قیمت</li>
        </ul>
        <button class="btn btn-secondary btn-sm" style="width:100%;border-color:#a78bfa;color:#a78bfa;" onclick="closeModal();_openPayment('سالانہ',2500,365)">خریدیں</button>
      </div>
    </div>
    <div style="text-align:center;font-size:11px;color:var(--text-muted);">
      📞 مدد کے لیے: <b>DigitalIO Support</b>
    </div>
  </div>`;
}

// ── PAYMENT FORM ──────────────────────────────────────────────
function _openPayment(planName, amount, days) {
  openModal(`💳 ادائیگی — ${planName}`,
    `<div style="direction:rtl;">
      <!-- Payment Methods -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        <div style="background:rgba(34,197,94,0.1);border:1px solid var(--green);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;margin-bottom:4px;">📱</div>
          <div style="font-weight:700;font-size:12px;color:var(--green);">JazzCash</div>
          <div style="font-size:13px;font-weight:900;color:var(--text-primary);" id="jc-number">0300-7339260</div>
          <button onclick="navigator.clipboard.writeText('03007339260').then(()=>showToast('نمبر کاپی ہو گیا','success'))" style="font-size:10px;background:none;border:none;color:var(--accent);cursor:pointer;">📋 کاپی کریں</button>
        </div>
        <div style="background:rgba(139,92,246,0.1);border:1px solid #a78bfa;border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;margin-bottom:4px;">📱</div>
          <div style="font-weight:700;font-size:12px;color:#a78bfa;">EasyPaisa</div>
          <div style="font-size:13px;font-weight:900;color:var(--text-primary);">0300-7339260</div>
          <button onclick="navigator.clipboard.writeText('03007339260').then(()=>showToast('نمبر کاپی ہو گیا','success'))" style="font-size:10px;background:none;border:none;color:var(--accent);cursor:pointer;">📋 کاپی کریں</button>
        </div>
        <div style="background:rgba(56,189,248,0.1);border:1px solid var(--accent);border-radius:8px;padding:12px;text-align:center;">
          <div style="font-size:20px;margin-bottom:4px;">🏦</div>
          <div style="font-weight:700;font-size:12px;color:var(--accent);">Raast</div>
          <div style="font-size:13px;font-weight:900;color:var(--text-primary);">0300-7339260</div>
          <button onclick="navigator.clipboard.writeText('03007339260').then(()=>showToast('نمبر کاپی ہو گیا','success'))" style="font-size:10px;background:none;border:none;color:var(--accent);cursor:pointer;">📋 کاپی کریں</button>
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
        <option value="jazzcash">📱 JazzCash</option>
        <option value="easypaisa">📱 EasyPaisa</option>
        <option value="raast">🏦 Raast</option>
      </select>
      <label class="form-label">نوٹ (اختیاری)</label>
      <input class="form-input" id="pay-note" placeholder="کوئی اضافی معلومات...">
    </div>`,
    `<div style="display:flex;gap:8px;direction:rtl;">
      <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
      <button class="btn btn-primary" onclick="_submitPayment('${planName}',${amount},${days})">📤 درخواست بھیجیں</button>
    </div>`
  );
}

async function _submitPayment(planName, amount, days) {
  const txnId  = document.getElementById('pay-txn')?.value.trim();
  const method = document.getElementById('pay-method')?.value;
  const note   = document.getElementById('pay-note')?.value.trim();

  if (!txnId) { showToast('⚠️ Transaction ID ضروری ہے','error'); return; }

  try {
    const oid = await getOfficerId();
    const exp = new Date();
    exp.setDate(exp.getDate() + days);

    // Get plan id
    const { data:plans } = await supabaseClient.from('subscription_plans').select('id').eq('name',planName).single();

    await supabaseClient.from('subscriptions').insert({
      officer_id:     oid,
      plan_id:        plans?.id||null,
      status:         'pending', // pending until admin verifies
      expires_at:     exp.toISOString(),
      payment_ref:    txnId,
      amount:         amount,
      payment_method: method,
    });

    closeModal();
    showToast('✅ درخواست بھیج دی — ایڈمن تصدیق کرے گا','success');

    // WhatsApp notification to admin
    const o = currentOfficer||{};
    const msg = `Digital IO ادائیگی درخواست:\n\nافسر: ${o.full_name||'—'}\nتھانہ: ${o.station||'—'}\nپلان: ${planName}\nرقم: Rs. ${amount}\nTransaction ID: ${txnId}\nطریقہ: ${method}`;
    window.open(`https://wa.me/923007339260?text=${encodeURIComponent(msg)}`);

  } catch(e) { showToast('❌ '+e.message,'error'); }
}

// ── SUBSCRIPTION STATUS IN SIDEBAR ───────────────────────────
async function updateSubBadge() {
  try {
    const sub = await checkSubscription();
    // Show in bottom bar (footer-license)
    const el = document.getElementById('sub-status-badge') || document.getElementById('footer-license');
    if (!el) return;
    if (sub.status==='active') {
      el.textContent = `✅ فعال · ${sub.daysLeft} دن`;
      el.style.color = 'var(--green)';
    } else if (sub.status==='trial') {
      el.textContent = `🎁 آزمائشی · ${sub.daysLeft} دن باقی`;
      el.style.color = 'var(--amber)';
    } else if (sub.status==='suspended') {
      el.textContent = '🔒 معطل · صرف دیکھیں — ایڈمن سے رابطہ';
      el.style.color = 'var(--red)';
      el.style.cursor = 'pointer';
      el.onclick = function(){ try{ _showPlans(); }catch(_){} };
    } else {
      el.textContent = '🔒 میعاد ختم · صرف دیکھیں — تجدید کریں';
      el.style.color = 'var(--red)';
      el.style.cursor = 'pointer';
      el.onclick = function(){ try{ _showPlans(); }catch(_){} };
    }
  } catch(_) {}
}
