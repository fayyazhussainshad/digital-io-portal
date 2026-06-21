/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SUBSCRIPTION SYSTEM  (subscription.js)
   Plans · Payment · Trial · License · Admin verify
   ═══════════════════════════════════════════════════════════ */

// ── SUBSCRIPTION CHECK ON LOGIN ───────────────────────────────
async function checkSubscription() {
  try {
    const oid = await getOfficerId();
    if (!oid) return { status:'none' };
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
  // Remove any existing top banner.
  const existing = document.getElementById('sub-banner');
  if (existing) existing.remove();
  // Only show blocking screen if subscription expired/suspended.
  const sub = await checkSubscription();
  if (sub.status === 'expired' || sub.status === 'suspended') {
    showSubscriptionRequired(sub);
  }
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
          <li>✅ مقدمات و گشت</li>
          <li>✅ CDR Analyzer</li>
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
          <li>✅ CDR Analyzer</li>
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
          <li>✅ CDR Analyzer</li>
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
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;">
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
        <div>1️⃣ JazzCash/EasyPaisa سے اوپر نمبر پر <b>Rs. ${amount}</b> بھیجیں</div>
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
        <option value="bank">🏦 Bank Transfer</option>
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
    } else {
      el.textContent = '❌ مدت ختم';
      el.style.color = 'var(--red)';
    }
  } catch(_) {}
}
