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
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/></svg>', title:'نیا مقدمہ کیسے بنائیں',
      body:`بائیں مینو سے <b>«میرے مقدمات»</b> کھولیں، پھر <b>«نیا مقدمہ»</b> کا بٹن دبائیں۔
            FIR نمبر، تھانہ، دفعات اور بنیادی تفصیل بھر کر محفوظ کریں۔ ایک بار محفوظ ہونے کے بعد
            مقدمہ آپ کی فہرست میں آ جائے گا اور کہیں سے بھی کھل جائے گا۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/></svg>', title:'زمنی / رپورٹ لکھنا',
      body:`مقدمہ کھولیں اور اندر موجود <b>زمنی</b> کے خانے میں جائیں۔ یہاں آپ اپنی روزمرہ کارروائی
            لکھ سکتے ہیں۔ لکھتے وقت سسٹم خودکار محفوظ کرتا رہتا ہے — پریشان ہونے کی ضرورت نہیں کہ
            کام ضائع ہو جائے گا۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v16"/><path d="M6 20h12"/><path d="M4 9l3-4 3 4"/><path d="M14 9l3-4 3 4"/></svg>', title:'چالان (173) تیار کرنا',
      body:`مقدمہ مکمل ہونے پر <b>چالان / رپورٹ 173</b> کے حصے میں جائیں۔ نظامِ کار خود بخود
            مقدمہ کی معلومات بھر دیتا ہے۔ آپ صرف پڑھ کر تسلی کریں، ضرورت ہو تو ترمیم کریں، پھر
            پرنٹ کر لیں۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M10 13h6"/><path d="M10 17h4"/></svg>', title:'RFA اور دیگر فارم',
      body:`RFA (Request for Assistance) اور دیگر تیار فارم مقدمہ کے اندر دستیاب ہیں۔ زیادہ تر خانے
            سسٹم سے خود بھر جاتے ہیں تاکہ آپ کا وقت بچے۔ پرانے فارم بھی محفوظ رہتے ہیں اور دوبارہ
            دیکھے جا سکتے ہیں۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9.5 3.5v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4A1.5 1.5 0 0 0 19.5 19l-5-9.5v-6"/><path d="M8 3.5h8"/></svg>', title:'شہادت (تصاویر / ویڈیو) لگانا',
      body:`مقدمہ میں <b>شہادت</b> کے حصے سے آپ موقع پر ہی کیمرے سے تصویر لے سکتے ہیں یا فائل منتخب
            کر سکتے ہیں۔ ہر شہادت کے ساتھ ایک <b>حفاظتی زنجیر</b> بنتی ہے — یعنی کس نے، کب دیکھی یا
            استعمال کی، سب ریکارڈ رہتا ہے۔ یہ عدالت میں شہادت کی سچائی ثابت کرنے میں مدد دیتا ہے۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 12.5l4-4 4.5 4.5 4.5-4.5 4 4"/><path d="M3.5 12.5V17a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-4.5"/></svg>', title:'مقدمہ کسی ساتھی افسر سے شیئر کرنا',
      body:`اگر تفتیش میں کسی دوسرے افسر کی مدد درکار ہو تو مقدمہ شیئر کیا جا سکتا ہے۔ آپ یہ بھی طے
            کر سکتے ہیں کہ رسائی کب تک رہے، اور جب چاہیں واپس لے لیں۔ آپ کا اپنا ڈیٹا صرف آپ کے
            اختیار میں رہتا ہے۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10z"/><path d="M10.2 19a2 2 0 0 0 3.6 0"/></svg>', title:'یاددہانیاں اور عدالتی پیشیاں',
      body:`<b>«یاددہانیاں»</b> میں اہم تاریخیں اور پیشیاں محفوظ کریں تاکہ کوئی تاریخ نہ بھولے۔
            سسٹم آنے والی اور گزری ہوئی تاریخیں نمایاں کر دیتا ہے۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>', title:'تلاش',
      body:`اوپر یا مینو میں <b>«تلاش»</b> سے آپ FIR نمبر، ملزم کا نام یا دفعہ کے ذریعے کوئی بھی
            مقدمہ فوراً ڈھونڈ سکتے ہیں۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7.5 19a4.5 4.5 0 0 1 0-9 6 6 0 0 1 11.3 1.6A3.7 3.7 0 0 1 18 19z"/></svg>', title:'بیک اپ اور آف لائن کام',
      body:`آپ کا ڈیٹا محفوظ سرور پر رہتا ہے۔ انٹرنیٹ نہ ہونے کی صورت میں بھی آپ کام جاری رکھ سکتے
            ہیں — رابطہ بحال ہوتے ہی سب کچھ خودکار محفوظ ہو جاتا ہے۔ اضافی اطمینان کے لیے
            <b>«بیک اپ»</b> کا حصہ بھی موجود ہے۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/></svg>', title:'غلطی سے کچھ حذف ہو جائے تو؟',
      body:`گھبرائیں نہیں۔ حذف شدہ چیزیں فوراً ختم نہیں ہوتیں — پہلے <b>«حذف شدہ مواد»</b> (ری سائیکل بن)
            میں جاتی ہیں، جہاں سے انہیں دوبارہ بحال کیا جا سکتا ہے۔` },
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5.5 11h13v9.5h-13z"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/></svg>', title:'میرا ڈیٹا کتنا محفوظ ہے؟',
      body:`ہر افسر صرف اپنا اور اپنے تھانہ کا ڈیٹا دیکھ سکتا ہے۔ پاس ورڈ کبھی سادہ شکل میں محفوظ
            نہیں ہوتے، اور ہر حساس کارروائی کا ناقابلِ تبدیل ریکارڈ رہتا ہے۔ تفصیل ایڈمن پینل کے
            <b>«حفاظتی مرکز»</b> میں دیکھی جا سکتی ہے۔` },
  ];

  container.innerHTML = `
  <div style="max-width:820px;margin:0 auto;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">

    <!-- Welcome -->
    <div style="background:linear-gradient(135deg,#0d2a45,#1a3a5c);border-radius:14px;padding:20px;margin-bottom:16px;">
      <div style="font-size:20px;font-weight:800;color:#fff;">خوش آمدید، ${_hgEsc(name)}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:6px;line-height:1.9;">
        Digital IO آپ کے دفتری کام کو آسان بنانے کے لیے ہے — تاکہ آپ کاغذی بوجھ سے آزاد ہو کر
        اطمینان سے تفتیش پر توجہ دے سکیں۔ نیچے ہر اہم کام کی سادہ رہنمائی موجود ہے۔ کسی خانے پر
        دبائیں تو تفصیل کھل جائے گی۔
      </div>
    </div>

    <!-- Quick start -->
    <div class="card" style="margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">جلدی شروع کریں</div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
        ${[
          ["<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z'/></svg>",'نیا مقدمہ','cases'],
          ["<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><path d='M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10z'/><path d='M10.2 19a2 2 0 0 0 3.6 0'/></svg>",'یاددہانی','reminders'],
          ["<svg viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='1.9' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><circle cx='11' cy='11' r='6.5'/><path d='M16 16l4.5 4.5'/></svg>",'تلاش','search'],
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
        یاد رکھیں: آپ کا کام خودکار محفوظ ہوتا ہے، اور غلطی سے حذف شدہ چیزیں بحال ہو سکتی ہیں۔
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
