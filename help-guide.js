/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — مدد و رہنمائی  (help-guide.js)
   Phase 4H — onboarding / help

   Naye afsar ke liye saada Urdu rehnumai. Purely additive page —
   koi maujooda code nahi badalta. Agar ye file load na ho to nav
   item khud-ba-khud "jald aa raha hai" dikha deta hai (safe).
   ═══════════════════════════════════════════════════════════════ */

registerPage('help', renderHelpGuide);

function renderHelpGuide(container) {
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const name = o.full_name || 'افسر صاحب';

  // Har section: { icon, title, body(HTML) }. Body plain, saaf Urdu.
  const sections = [
    { icon:'📁', title:'نیا مقدمہ کیسے بنائیں',
      body:`بائیں مینو سے <b>«میرے مقدمات»</b> کھولیں، پھر <b>«نیا مقدمہ»</b> کا بٹن دبائیں۔
            FIR نمبر، تھانہ، دفعات اور بنیادی تفصیل بھر کر محفوظ کریں۔ ایک بار محفوظ ہونے کے بعد
            مقدمہ آپ کی فہرست میں آ جائے گا اور کہیں سے بھی کھل جائے گا۔` },
    { icon:'📝', title:'زمنی / رپورٹ لکھنا',
      body:`مقدمہ کھولیں اور اندر موجود <b>زمنی</b> کے خانے میں جائیں۔ یہاں آپ اپنی روزمرہ کارروائی
            لکھ سکتے ہیں۔ لکھتے وقت سسٹم خودکار محفوظ کرتا رہتا ہے — پریشان ہونے کی ضرورت نہیں کہ
            کام ضائع ہو جائے گا۔` },
    { icon:'⚖️', title:'چالان (173) تیار کرنا',
      body:`مقدمہ مکمل ہونے پر <b>چالان / رپورٹ 173</b> کے حصے میں جائیں۔ نظامِ کار خود بخود
            مقدمہ کی معلومات بھر دیتا ہے۔ آپ صرف پڑھ کر تسلی کریں، ضرورت ہو تو ترمیم کریں، پھر
            پرنٹ کر لیں۔` },
    { icon:'📄', title:'RFA اور دیگر فارم',
      body:`RFA (Request for Assistance) اور دیگر تیار فارم مقدمہ کے اندر دستیاب ہیں۔ زیادہ تر خانے
            سسٹم سے خود بھر جاتے ہیں تاکہ آپ کا وقت بچے۔ پرانے فارم بھی محفوظ رہتے ہیں اور دوبارہ
            دیکھے جا سکتے ہیں۔` },
    { icon:'🔬', title:'شہادت (تصاویر / ویڈیو) لگانا',
      body:`مقدمہ میں <b>شہادت</b> کے حصے سے آپ موقع پر ہی کیمرے سے تصویر لے سکتے ہیں یا فائل منتخب
            کر سکتے ہیں۔ ہر شہادت کے ساتھ ایک <b>حفاظتی زنجیر</b> بنتی ہے — یعنی کس نے، کب دیکھی یا
            استعمال کی، سب ریکارڈ رہتا ہے۔ یہ عدالت میں شہادت کی سچائی ثابت کرنے میں مدد دیتا ہے۔` },
    { icon:'🤝', title:'مقدمہ کسی ساتھی افسر سے شیئر کرنا',
      body:`اگر تفتیش میں کسی دوسرے افسر کی مدد درکار ہو تو مقدمہ شیئر کیا جا سکتا ہے۔ آپ یہ بھی طے
            کر سکتے ہیں کہ رسائی کب تک رہے، اور جب چاہیں واپس لے لیں۔ آپ کا اپنا ڈیٹا صرف آپ کے
            اختیار میں رہتا ہے۔` },
    { icon:'🔔', title:'یاددہانیاں اور عدالتی پیشیاں',
      body:`<b>«یاددہانیاں»</b> میں اہم تاریخیں اور پیشیاں محفوظ کریں تاکہ کوئی تاریخ نہ بھولے۔
            سسٹم آنے والی اور گزری ہوئی تاریخیں نمایاں کر دیتا ہے۔` },
    { icon:'🔍', title:'تلاش',
      body:`اوپر یا مینو میں <b>«تلاش»</b> سے آپ FIR نمبر، ملزم کا نام یا دفعہ کے ذریعے کوئی بھی
            مقدمہ فوراً ڈھونڈ سکتے ہیں۔` },
    { icon:'☁️', title:'بیک اپ اور آف لائن کام',
      body:`آپ کا ڈیٹا محفوظ سرور پر رہتا ہے۔ انٹرنیٹ نہ ہونے کی صورت میں بھی آپ کام جاری رکھ سکتے
            ہیں — رابطہ بحال ہوتے ہی سب کچھ خودکار محفوظ ہو جاتا ہے۔ اضافی اطمینان کے لیے
            <b>«بیک اپ»</b> کا حصہ بھی موجود ہے۔` },
    { icon:'🗑️', title:'غلطی سے کچھ حذف ہو جائے تو؟',
      body:`گھبرائیں نہیں۔ حذف شدہ چیزیں فوراً ختم نہیں ہوتیں — پہلے <b>«حذف شدہ مواد»</b> (ری سائیکل بن)
            میں جاتی ہیں، جہاں سے انہیں دوبارہ بحال کیا جا سکتا ہے۔` },
    { icon:'🔒', title:'میرا ڈیٹا کتنا محفوظ ہے؟',
      body:`ہر افسر صرف اپنا اور اپنے تھانہ کا ڈیٹا دیکھ سکتا ہے۔ پاس ورڈ کبھی سادہ شکل میں محفوظ
            نہیں ہوتے، اور ہر حساس کارروائی کا ناقابلِ تبدیل ریکارڈ رہتا ہے۔ تفصیل ایڈمن پینل کے
            <b>«حفاظتی مرکز»</b> میں دیکھی جا سکتی ہے۔` },
  ];

  container.innerHTML = `
  <div style="max-width:820px;margin:0 auto;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">

    <!-- Welcome -->
    <div style="background:linear-gradient(135deg,#0d2a45,#1a3a5c);border-radius:14px;padding:20px;margin-bottom:16px;">
      <div style="font-size:20px;font-weight:800;color:#fff;">خوش آمدید، ${_hgEsc(name)} 👋</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:6px;line-height:1.9;">
        Digital IO آپ کے دفتری کام کو آسان بنانے کے لیے ہے — تاکہ آپ کاغذی بوجھ سے آزاد ہو کر
        اطمینان سے تفتیش پر توجہ دے سکیں۔ نیچے ہر اہم کام کی سادہ رہنمائی موجود ہے۔ کسی خانے پر
        دبائیں تو تفصیل کھل جائے گی۔
      </div>
    </div>

    <!-- Quick start -->
    <div class="card" style="margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">🚀 جلدی شروع کریں</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[
          ['📁','نیا مقدمہ','cases'],
          ['🔔','یاددہانی','reminders'],
          ['🔍','تلاش','search'],
        ].map(([i,l,p])=>`
          <button class="btn btn-secondary" style="flex-direction:column;padding:14px 8px;font-family:'Jameel Noori Nastaleeq',serif;" onclick="showPage('${p}',null)">
            <div style="font-size:22px;">${i}</div>
            <div style="font-size:12px;margin-top:4px;">${l}</div>
          </button>`).join('')}
      </div>
    </div>

    <!-- Accordion sections -->
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${sections.map((s,i)=>`
        <div class="card" style="padding:0;overflow:hidden;">
          <div onclick="_hgToggle(${i})" style="display:flex;align-items:center;gap:10px;padding:14px 16px;cursor:pointer;">
            <span style="font-size:18px;">${s.icon}</span>
            <span style="font-size:14px;font-weight:700;flex:1;">${s.title}</span>
            <span id="hg-arrow-${i}" style="font-size:12px;color:var(--text-muted);transition:transform 0.2s;">▼</span>
          </div>
          <div id="hg-body-${i}" style="display:none;padding:0 16px 16px 16px;font-size:12.5px;color:var(--text-secondary);line-height:2;">
            ${s.body}
          </div>
        </div>`).join('')}
    </div>

    <!-- Reassurance footer -->
    <div class="card" style="margin-top:16px;background:var(--bg-secondary);text-align:center;">
      <div style="font-size:13px;line-height:2;color:var(--text-secondary);">
        💙 یاد رکھیں: آپ کا کام خودکار محفوظ ہوتا ہے، اور غلطی سے حذف شدہ چیزیں بحال ہو سکتی ہیں۔
        اطمینان سے کام کریں۔ مزید مدد کے لیے اپنے سسٹم ایڈمن سے رابطہ کریں۔
      </div>
    </div>

  </div>`;
}

// Sirf isi page ke andar chalne wale helpers (global naam ki takraar se bachne ke liye _hg-)
function _hgToggle(i) {
  var body = document.getElementById('hg-body-' + i);
  var arrow = document.getElementById('hg-arrow-' + i);
  if (!body) return;
  var open = body.style.display !== 'none';
  body.style.display = open ? 'none' : 'block';
  if (arrow) arrow.style.transform = open ? 'rotate(0deg)' : 'rotate(180deg)';
}

function _hgEsc(s) {
  s = (s == null) ? '' : String(s);
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
