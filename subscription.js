/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SUBSCRIPTION SYSTEM  (subscription.js)
   Plans · Trial · Payment · License check · Admin verify
   ═══════════════════════════════════════════════════════════ */

registerPage('subscription', renderSubscription);

// ── LICENSE CHECK (call on every login) ───────────────────────
async function checkLicense() {
  try {
    const oid = await getOfficerId();
    if (!oid) return { valid: false, reason: 'no_officer' };

    const { data: sub } = await supabaseClient
      .from('subscriptions')
      .select('*, subscription_plans(*)')
      .eq('officer_id', oid)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const now = new Date();

    if (!sub) {
      // No subscription — create 30-day trial
      const { data: trialPlan } = await supabaseClient
        .from('subscription_plans').select('*').eq('name','آزمائشی').single();
      if (trialPlan) {
        const expires = new Date(now.getTime() + 30*24*60*60*1000);
        await supabaseClient.from('subscriptions').insert({
          officer_id: oid,
          plan_id: trialPlan.id,
          status: 'trial',
          started_at: now.toISOString(),
          expires_at: expires.toISOString(),
        });
        _showLicenseBanner('trial', 30);
        return { valid: true, status: 'trial', daysLeft: 30 };
      }
      return { valid: true, status: 'trial', daysLeft: 30 };
    }

    const expires = new Date(sub.expires_at);
    const daysLeft = Math.ceil((expires - now) / (1000*60*60*24));

    if (sub.status === 'suspended') {
      _showPaymentRequired('suspended');
      return { valid: false, status: 'suspended' };
    }
    if (sub.status === 'expired' || daysLeft <= 0) {
      await supabaseClient.from('subscriptions').update({status:'expired'}).eq('id',sub.id);
      _showPaymentRequired('expired');
      return { valid: false, status: 'expired' };
    }
    if (sub.status === 'trial' && daysLeft <= 7) {
      _showLicenseBanner('trial', daysLeft);
    }
    if (sub.status === 'active' && daysLeft <= 7) {
      _showLicenseBanner('expiring', daysLeft);
    }

    // Store plan features
    window._licenseFeatures = sub.subscription_plans?.features || {};
    window._licenseStatus = sub.status;
    window._licensePlan = sub.subscription_plans?.name || '';

    return { valid: true, status: sub.status, daysLeft, plan: sub.subscription_plans };
  } catch(e) {
    console.warn('License check:', e.message);
    return { valid: true, status: 'trial', daysLeft: 30 }; // Fail open
  }
}

function _showLicenseBanner(type, days) {
  const colors = { trial:'var(--amber)', expiring:'var(--red)', active:'var(--green)' };
  const msgs = {
    trial: `⏳ آزمائشی مدت: ${days} دن باقی — سبسکرپشن لیں`,
    expiring: `⚠️ سبسکرپشن ختم ہونے والی ہے: ${days} دن باقی`,
  };
  const msg = msgs[type];
  if (!msg) return;

  let banner = document.getElementById('license-banner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'license-banner';
    banner.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:9998;padding:6px 16px;text-align:center;font-size:12px;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;cursor:pointer;`;
    banner.onclick = () => showPage('subscription', null);
    document.body.appendChild(banner);
    // Push content down
    const topbar = document.getElementById('topbar');
    if (topbar) topbar.style.marginTop = '30px';
  }
  banner.style.background = colors[type]||'var(--amber)';
  banner.style.color = type==='expiring'?'#fff':'#000';
  banner.innerHTML = `${msg} — <b>ابھی سبسکرپشن لیں →</b>`;
}

function _showPaymentRequired(reason) {
  const app = document.getElementById('main-app');
  const content = document.getElementById('page-content');
  if (!content) return;

  const msgs = {
    expired: 'آپ کی سبسکرپشن ختم ہو گئی ہے',
    suspended: 'آپ کا اکاؤنٹ معطل کر دیا گیا ہے — ایڈمن سے رابطہ کریں',
  };

  content.innerHTML = `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:20px;">
    <div style="font-size:64px;margin-bottom:16px;">🔒</div>
    <div style="font-size:20px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;color:var(--red);margin-bottom:8px;">${msgs[reason]||'رسائی محدود'}</div>
    <div style="font-size:13px;color:var(--text-muted);margin-bottom:24px;">Digital IO استعمال جاری رکھنے کے لیے سبسکرپشن لیں</div>
    <button class="btn btn-primary" style="font-size:16px;padding:14px 32px;" onclick="showPage('subscription',null)">💳 ابھی سبسکرپشن لیں</button>
  </div>`;
}

// ── SUBSCRIPTION PAGE ─────────────────────────────────────────
async function renderSubscription(container) {
  container.innerHTML = `<div id="sub-root"><div style="text-align:center;padding:20px;color:var(--text-muted);">⏳</div></div>`;
  await _buildSubPage();
}

async function _buildSubPage() {
  const root = document.getElementById('sub-root');
  if (!root) return;

  const oid = await getOfficerId();
  const [plansRes, subRes] = await Promise.all([
    supabaseClient.from('subscription_plans').select('*').eq('is_active',true).order('price'),
    supabaseClient.from('subscriptions').select('*,subscription_plans(*)').eq('officer_id',oid).order('created_at',{ascending:false}).limit(1).maybeSingle(),
  ]);

  const plans = plansRes.data||[];
  const current = subRes.data;
  const now = new Date();
  const daysLeft = current?.expires_at ? Math.ceil((new Date(current.expires_at)-now)/(1000*60*60*24)) : 0;

  root.innerHTML = `
  <!-- Header -->
  <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;direction:rtl;flex-wrap:wrap;">
    <button onclick="showPage('dashboard',document.querySelector('.nav-item'))" style="background:var(--bg-secondary);border:1px solid var(--border);border-radius:8px;padding:6px 14px;font-size:13px;font-weight:700;cursor:pointer;color:var(--text-secondary);margin-left:auto;">واپس ←</button>
    <div>
      <div style="font-size:18px;font-weight:800;">💎 سبسکرپشن</div>
      <div style="font-size:12px;color:var(--text-muted);">Digital IO — محکمہ پولیس پنجاب</div>
    </div>
  </div>

  <!-- Current Status -->
  ${current ? `
  <div style="background:linear-gradient(135deg,#0d2a45,#1a3a5c);border-radius:12px;padding:16px 20px;margin-bottom:16px;direction:rtl;">
    <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-bottom:6px;">موجودہ پلان</div>
    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div>
        <div style="font-size:20px;font-weight:900;color:#fff;">${current.subscription_plans?.name||'—'}</div>
        <div style="font-size:12px;color:${daysLeft>7?'#22c55e':daysLeft>0?'#f59e0b':'#ef4444'};">
          ${current.status==='trial'?'آزمائشی · ':''} 
          ${daysLeft>0?daysLeft+' دن باقی':'ختم ہو گئی'}
        </div>
      </div>
      <div style="margin-left:auto;text-align:left;">
        <span style="background:${current.status==='active'?'var(--green)':current.status==='trial'?'var(--amber)':'var(--red)'};color:${current.status==='trial'?'#000':'#fff'};padding:4px 12px;border-radius:8px;font-size:11px;font-weight:700;">
          ${current.status==='active'?'✅ فعال':current.status==='trial'?'⏳ آزمائشی':current.status==='expired'?'❌ ختم':'🚫 معطل'}
        </span>
      </div>
    </div>
    ${daysLeft>0&&daysLeft<=7?`<div style="margin-top:10px;background:rgba(239,68,68,0.2);border-radius:6px;padding:8px;font-size:12px;color:#ef4444;direction:rtl;">⚠️ سبسکرپشن ${daysLeft} دن میں ختم ہو جائے گی — ابھی تجدید کریں</div>`:''}
  </div>` : ''}

  <!-- Plans -->
  <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">📋 دستیاب پلان</div>
  <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:16px;">
    ${plans.map(p=>{
      const isCurrent = current?.plan_id===p.id;
      const features = typeof p.features==='object'?p.features:{};
      return `
      <div style="background:var(--bg-card);border:${isCurrent?'2px solid var(--accent)':'1px solid var(--border)'};border-radius:12px;padding:16px;position:relative;direction:rtl;">
        ${isCurrent?'<div style="position:absolute;top:-10px;right:16px;background:var(--accent);color:#fff;padding:2px 10px;border-radius:10px;font-size:10px;font-weight:700;">موجودہ پلان</div>':''}
        <div style="font-size:16px;font-weight:800;margin-bottom:4px;font-family:'Jameel Noori Nastaleeq',serif;">${p.name}</div>
        <div style="font-size:24px;font-weight:900;color:${p.price===0?'var(--green)':'var(--accent)'};margin-bottom:8px;">
          ${p.price===0?'مفت':`Rs. ${p.price.toLocaleString()}`}
          <span style="font-size:11px;color:var(--text-muted);">/ ${p.duration_days===365?'سال':'ماہ'}</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">
          ${p.duration_days===365?'12 ماہ':p.duration_days+' دن'}
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px;">
          <div style="font-size:11px;direction:rtl;">${features.cases===999||features.cases>50?'✅ لامحدود مقدمات':features.cases?`✅ ${features.cases} مقدمات`:'❌ محدود'}</div>
          <div style="font-size:11px;">${features.patrol?'✅ پیٹرول لاگ':'❌ پیٹرول نہیں'}</div>
          <div style="font-size:11px;">${features.cdr?'✅ CDR تجزیہ':'❌ CDR نہیں'}</div>
          <div style="font-size:11px;">${features.admin?'✅ ایڈمن پینل':'❌ ایڈمن نہیں'}</div>
        </div>
        ${!isCurrent&&p.price>0?`<button class="btn btn-primary btn-sm" style="width:100%;" onclick="_initiatePayment('${p.id}','${p.name}',${p.price})">💳 خریدیں</button>`:''}
        ${p.price===0&&!current?`<button class="btn btn-secondary btn-sm" style="width:100%;" onclick="_startTrial('${p.id}')">🆓 آزمائشی شروع</button>`:''}
      </div>`;
    }).join('')}
  </div>

  <!-- Payment Instructions -->
  <div class="card" style="margin-bottom:14px;">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">💳 ادائیگی کا طریقہ</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;direction:rtl;">
      <div style="background:var(--bg-secondary);border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:24px;margin-bottom:6px;">📱</div>
        <div style="font-size:12px;font-weight:700;">JazzCash</div>
        <div style="font-size:14px;color:var(--accent);font-weight:800;margin:6px 0;font-family:monospace;">0300-XXXXXXX</div>
        <div style="font-size:10px;color:var(--text-muted);">پلان کا نام mention کریں</div>
      </div>
      <div style="background:var(--bg-secondary);border-radius:8px;padding:12px;text-align:center;">
        <div style="font-size:24px;margin-bottom:6px;">💚</div>
        <div style="font-size:12px;font-weight:700;">EasyPaisa</div>
        <div style="font-size:14px;color:var(--green);font-weight:800;margin:6px 0;font-family:monospace;">0300-XXXXXXX</div>
        <div style="font-size:10px;color:var(--text-muted);">Transaction ID محفوظ کریں</div>
      </div>
    </div>
    <div style="margin-top:12px;padding:10px;background:rgba(56,189,248,0.1);border-radius:8px;font-size:12px;direction:rtl;color:var(--text-secondary);">
      ⓘ ادائیگی کے بعد Transaction ID اور Screenshot ایڈمن کو WhatsApp کریں۔ 24 گھنٹے میں فعال ہو جائے گا۔
    </div>
  </div>

  <!-- Submit Payment Proof -->
  <div class="card">
    <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">📤 ادائیگی کی تصدیق</div>
    <div style="direction:rtl;">
      <label class="form-label">پلان منتخب کریں</label>
      <select class="form-input" id="pay-plan" style="margin-bottom:8px;">
        ${plans.filter(p=>p.price>0).map(p=>`<option value="${p.id}">${p.name} — Rs. ${p.price}</option>`).join('')}
      </select>
      <label class="form-label">Transaction ID / Reference</label>
      <input class="form-input" id="pay-ref" placeholder="مثلاً TXN-123456789" dir="ltr" style="text-align:left;margin-bottom:8px;">
      <label class="form-label">ادائیگی کا طریقہ</label>
      <select class="form-input" id="pay-method" style="margin-bottom:8px;">
        <option>JazzCash</option><option>EasyPaisa</option><option>بینک ٹرانسفر</option>
      </select>
      <button class="btn btn-primary" style="width:100%;margin-top:4px;" onclick="_submitPaymentProof()">📤 تصدیق بھیجیں</button>
    </div>
  </div>

  <!-- Payment History -->
  <div id="pay-history" style="margin-top:12px;"></div>`;

  _loadPaymentHistory(oid);
}

// ── PAYMENT FUNCTIONS ─────────────────────────────────────────
function _initiatePayment(planId, planName, price) {
  document.getElementById('pay-plan')?.querySelectorAll('option')?.forEach(o=>{
    if(o.value===planId) o.selected=true;
  });
  document.getElementById('pay-ref')?.focus();
  showToast(`💳 ${planName} — Rs. ${price} — Transaction ID درج کریں`,'info',5000);
  document.getElementById('pay-ref')?.scrollIntoView({behavior:'smooth'});
}

async function _startTrial(planId) {
  try {
    const oid = await getOfficerId();
    const expires = new Date(Date.now()+30*24*60*60*1000);
    await supabaseClient.from('subscriptions').insert({
      officer_id:oid, plan_id:planId, status:'trial',
      expires_at:expires.toISOString(),
    });
    showToast('✅ 30 دن کی آزمائشی مدت شروع','success');
    _buildSubPage();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _submitPaymentProof() {
  const planId = document.getElementById('pay-plan')?.value;
  const ref    = document.getElementById('pay-ref')?.value.trim();
  const method = document.getElementById('pay-method')?.value;
  if (!ref) { showToast('⚠️ Transaction ID ضروری ہے','error'); return; }
  try {
    const oid = await getOfficerId();
    const { data:plan } = await supabaseClient.from('subscription_plans').select('*').eq('id',planId).single();
    // Create pending subscription
    await supabaseClient.from('subscriptions').insert({
      officer_id:oid, plan_id:planId,
      status:'pending', payment_ref:ref,
      amount:plan?.price, payment_method:method,
    });
    showToast('✅ تصدیق بھیج دی گئی — ایڈمن 24 گھنٹے میں فعال کرے گا','success',5000);
    document.getElementById('pay-ref').value='';
    _loadPaymentHistory(oid);

    // WhatsApp to admin
    const o = currentOfficer||{};
    const msg = `Digital IO سبسکرپشن:\nنام: ${o.full_name}\nتھانہ: ${o.station}\nپلان: ${plan?.name||planId}\nTransaction: ${ref}\nطریقہ: ${method}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`);
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _loadPaymentHistory(oid) {
  try {
    const { data } = await supabaseClient.from('subscriptions')
      .select('*,subscription_plans(name)').eq('officer_id',oid)
      .order('created_at',{ascending:false}).limit(5);
    const el = document.getElementById('pay-history');
    if (!el||!data?.length) return;
    el.innerHTML = `
    <div class="card">
      <div style="font-size:12px;font-weight:700;color:var(--accent);margin-bottom:10px;direction:rtl;">📋 ادائیگی کی تاریخ</div>
      ${data.map(s=>`
      <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);direction:rtl;align-items:center;">
        <div style="flex:1;">
          <div style="font-size:12px;font-weight:600;">${s.subscription_plans?.name||'—'}</div>
          <div style="font-size:10px;color:var(--text-muted);">${s.payment_method||'—'} · ${s.payment_ref||'—'} · ${formatDate(s.created_at)}</div>
        </div>
        <span style="font-size:10px;padding:2px 8px;border-radius:6px;font-weight:700;background:${s.status==='active'?'var(--green)':s.status==='pending'?'var(--amber)':s.status==='trial'?'rgba(56,189,248,0.2)':'var(--red)'};color:${s.status==='pending'?'#000':'#fff'};">
          ${s.status==='active'?'✅ فعال':s.status==='pending'?'⏳ زیر التواء':s.status==='trial'?'آزمائشی':'❌ ختم'}
        </span>
        ${s.amount?`<div style="font-size:11px;font-weight:700;color:var(--accent);">Rs. ${s.amount}</div>`:''}
      </div>`).join('')}
    </div>`;
  } catch(_) {}
}

// ── ADMIN: SUBSCRIPTION MANAGEMENT ───────────────────────────
async function renderAdminSubscriptions(container) {
  const { data } = await supabaseClient.from('subscriptions')
    .select('*,subscription_plans(name,price),officers(full_name,station,email)')
    .eq('status','pending').order('created_at',{ascending:false});
  const pending = data||[];

  container.innerHTML = `
  <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:12px;direction:rtl;">
    💳 ادائیگیاں زیر التواء (${pending.length})
  </div>
  ${pending.length ? pending.map(s=>`
  <div style="background:var(--bg-card);border:1px solid var(--amber);border-radius:10px;padding:14px;margin-bottom:10px;direction:rtl;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
      <div>
        <div style="font-size:14px;font-weight:700;">${s.officers?.full_name||'—'}</div>
        <div style="font-size:11px;color:var(--text-muted);">تھانہ ${s.officers?.station||'—'} · ${s.officers?.email||'—'}</div>
        <div style="font-size:12px;margin-top:4px;">پلان: <b>${s.subscription_plans?.name||'—'}</b> · Rs. ${s.amount||'—'}</div>
        <div style="font-size:11px;color:var(--text-muted);">Transaction: <span style="font-family:monospace;">${s.payment_ref||'—'}</span> · ${s.payment_method||'—'}</div>
        <div style="font-size:10px;color:var(--text-faint);">تاریخ: ${formatDate(s.created_at)}</div>
      </div>
      <div style="display:flex;gap:6px;flex-direction:column;">
        <button class="btn btn-primary btn-sm" onclick="_adminActivateSub('${s.id}','${s.plan_id}','${s.officer_id}')">✅ فعال کریں</button>
        <button class="btn btn-danger btn-sm" onclick="_adminRejectSub('${s.id}')">❌ رد کریں</button>
      </div>
    </div>
  </div>`).join('')
  : '<div style="text-align:center;padding:20px;color:var(--text-muted);direction:rtl;">✅ کوئی زیر التواء ادائیگی نہیں</div>'}`;
}

async function _adminActivateSub(subId, planId, officerId) {
  try {
    const { data:plan } = await supabaseClient.from('subscription_plans').select('duration_days').eq('id',planId).single();
    const expires = new Date(Date.now() + (plan?.duration_days||30)*24*60*60*1000);
    const verifier = await getOfficerId();
    await supabaseClient.from('subscriptions').update({
      status:'active', expires_at:expires.toISOString(),
      verified_by:verifier, verified_at:new Date().toISOString(),
    }).eq('id',subId);
    showToast('✅ سبسکرپشن فعال کر دی گئی','success');
    renderAdminSubscriptions(document.getElementById('admin-sub-area'));
  } catch(e) { showToast('❌ '+e.message,'error'); }
}

async function _adminRejectSub(subId) {
  await supabaseClient.from('subscriptions').update({status:'rejected'}).eq('id',subId);
  showToast('❌ ادائیگی رد کر دی گئی','info');
  renderAdminSubscriptions(document.getElementById('admin-sub-area'));
}

// ── FEATURE GATE CHECK ────────────────────────────────────────
async function checkFeatureAccess(feature) {
  try {
    const oid = await getOfficerId();
    const { data:sub } = await supabaseClient.from('subscriptions')
      .select('status,subscription_plans(features)')
      .eq('officer_id',oid).order('created_at',{ascending:false}).limit(1).single();
    if (!sub||sub.status==='expired'||sub.status==='suspended') return false;
    const features = sub.subscription_plans?.features||{};
    if (feature==='cdr') return !!features.cdr;
    if (feature==='admin') return !!features.admin;
    return true;
  } catch(_) { return true; }
}

// Case limit check
async function checkCaseLimit() {
  try {
    const oid = await getOfficerId();
    const [{ data:sub },{ count }] = await Promise.all([
      supabaseClient.from('subscriptions').select('subscription_plans(features)').eq('officer_id',oid).order('created_at',{ascending:false}).limit(1).single(),
      supabaseClient.from('cases').select('id',{count:'exact',head:true}).eq('officer_id',oid),
    ]);
    const maxCases = sub?.data?.subscription_plans?.features?.cases||10;
    if (maxCases===999) return true;
    if ((count||0)>=maxCases) {
      showToast(`⚠️ آپ کے پلان میں ${maxCases} مقدمات کی حد ہے — اپگریڈ کریں`,'error',5000);
      setTimeout(()=>showPage('subscription',null),2000);
      return false;
    }
    return true;
  } catch(_) { return true; }
}
