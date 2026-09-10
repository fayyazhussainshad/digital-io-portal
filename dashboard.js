/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — DASHBOARD v4
   New card order · Full screen · Activity feed
   ═══════════════════════════════════════════════════════════ */

registerPage('dashboard', renderDashboard);

async function renderDashboard(container) {
  // Phase 3C — DIO.states.loading() with fallback
  const _loadingHtml = (window.DIO && DIO.states)
    ? DIO.states.loading('ڈیش بورڈ لوڈ ہو رہا ہے')
    : `<div style="text-align:center;padding:32px;color:var(--text-muted);font-family:'Jameel Noori Nastaleeq',serif;">⏳ لوڈ ہو رہا ہے...</div>`;
  container.innerHTML = `<div id="dash-root">${_loadingHtml}</div>`;
  await _buildDash();
}

async function _buildDash() {
  const root = document.getElementById('dash-root');
  if (!root) return;
  const o = currentOfficer || {};

  const [cases, reminders, fivecApps] = await Promise.all([
    getCases().catch(()=>[]),
    // FIX: pehle _dFetchRem() offline par [] deta tha (dashboard khali) — getReminders()
    // mein offline cache fallback hai, is liye field afsar ko offline bhi apni yaddashtیں
    // nazar aati hain. Dashboard neeche khud !is_done filter karta hai (line ~51).
    getReminders().catch(()=>[]),
    _dFetchFivec().catch(()=>0),
  ]);

  const today = new Date().toISOString().split('T')[0];

  // Status counts — canonical registry (Phase 2D). Naye status add hone par
  // yahan tبdiلی nahi karni pade gi — DIO.caseStatuses.codes() se aa jayenge.
  const total = cases.length;
  const statusCounts = {};
  if (window.DIO && DIO.caseStatuses) {
    DIO.caseStatuses.codes().forEach(code => {
      statusCounts[code] = cases.filter(c => c.status === code).length;
    });
  } else {
    // Fallback (agar dio-statuses.js load na ho)
    ['under','incomplete','challan512','complete','untrace','cancel'].forEach(code => {
      statusCounts[code] = cases.filter(c => c.status === code).length;
    });
  }
  // Backward-compat locals (existing code inhें use kar sakta hai)
  const complete   = statusCounts.complete   || 0;
  const incomplete = statusCounts.incomplete || 0;
  const cancel     = statusCounts.cancel     || 0;
  const challan512 = statusCounts.challan512 || 0;
  const untrace    = statusCounts.untrace    || 0;
  const under      = statusCounts.under      || 0;
  const pendRem     = reminders.filter(r=>!r.is_done);
  const todayCases  = cases.filter(c=>{ const d=_pd(c.fir_date); return d&&d.startsWith(today); });
  const monthly = _monthlyTrend(cases);

  // ── SMART BRIEF data (سب حقیقی ڈیٹا — reminders + cases; کوئی فرضی چیز نہیں) ──
  const overdueRem  = pendRem.filter(r => r.reminder_date && r.reminder_date < today);
  const upcomingRem = pendRem.filter(r => !r.reminder_date || r.reminder_date >= today)
                             .sort((a,b) => (a.reminder_date||'9999-99-99').localeCompare(b.reminder_date||'9999-99-99'));
  const nextRem     = upcomingRem[0] || null;
  const thisMonthCount = cases.filter(c => { const p=_pd(c.fir_date); return p && p.startsWith(today.slice(0,7)); }).length;

  // First-run onboarding card (shows once; dismiss stored in localStorage — non-sensitive flag)
  const _onboardBanner = (typeof _dioOnboardCard === 'function') ? _dioOnboardCard() : '';

  root.innerHTML = `
  ${_onboardBanner}
  <!-- Welcome -->
  <div style="background:linear-gradient(135deg,#0d2a45,#1a3a5c);border-radius:12px;padding:14px 18px;margin-bottom:14px;direction:rtl;">
    <div style="display:flex;align-items:center;gap:12px;">
      <div style="text-align:right;flex:1;">
        <div style="font-size:16px;font-weight:800;color:#fff;font-family:'Jameel Noori Nastaleeq',serif;">خوش آمدید، ${esc(o.full_name)||'افسر'}</div>
        <div style="font-size:11px;color:rgba(255,255,255,0.6);">${o.designation||''} · تھانہ ${o.station||''} · ضلع ${o.district||''}</div>
        <div style="font-size:10px;color:rgba(255,255,255,0.4);">${formatDate(new Date())}</div>
      </div>
      <div id="dash-welcome-avatar" style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0;overflow:hidden;cursor:pointer;" onclick="showPage('settings',null)">
        ${(() => {
          let p = o.profile_photo;
          if (!p) { try { p = localStorage.getItem('dio_profile_photo') || localStorage.getItem('officer_photo_url'); } catch(_) {} }
          if (p) return `<img src="${p}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
          return (o.full_name||'IO').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
        })()}
      </div>
    </div>
  </div>

  <!-- اسلامی ٹِکر (درود + قرآن/حدیث، ہر 1 منٹ بدلتا) -->
  ${_islamicBarHTML()}

  <!-- Cases Stats — 7 cards in one row (کل + 6 statuses) -->
  <div style="margin-bottom:14px;">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;direction:rtl;font-weight:700;">📊 مقدمات کی صورتحال</div>
    <div class="dash-stats-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px;direction:rtl;">
      <!-- کل مقدمات -->
      <div onclick="showPage('cases',null)" style="background:linear-gradient(135deg,var(--accent),#0ea5e9);border-radius:10px;padding:10px 4px;cursor:pointer;height:88px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;">
        <div style="font-size:11px;color:rgba(255,255,255,0.9);font-family:'Jameel Noori Nastaleeq',serif;text-align:center;line-height:1.25;">کل مقدمات</div>
        <div style="font-size:24px;font-weight:900;color:#fff;text-align:center;">${total}</div>
      </div>
      ${[
        {k:'complete',   l:'چالان مکمل',  v:complete,   c:'var(--green)'},
        {k:'incomplete', l:'چالان نامکمل', v:incomplete, c:'var(--amber)'},
        {k:'cancel',     l:'اخراج',        v:cancel,     c:'var(--red)'},
        {k:'untrace',    l:'عدم پتہ',       v:untrace,    c:'#a78bfa'},
        {k:'under',      l:'زیر تفتیش',     v:under,      c:'var(--accent)'},
        {k:'challan512', l:'چالان 512',     v:challan512, c:'#f97316'},
      ].map(s=>`
      <div onclick="showPage('cases',null)"
        style="background:var(--bg-card);border:1px solid var(--border);border-radius:10px;padding:10px 4px;cursor:pointer;border-bottom:3px solid ${s.c};height:88px;display:flex;flex-direction:column;align-items:center;justify-content:space-between;"
        onmouseover="this.style.background='var(--bg-secondary)'"
        onmouseout="this.style.background='var(--bg-card)'">
        <div style="font-size:11px;color:var(--text-secondary);font-family:'Jameel Noori Nastaleeq',serif;line-height:1.25;text-align:center;">${s.l}</div>
        <div style="font-size:24px;font-weight:900;color:${s.c};text-align:center;">${s.v}</div>
      </div>`).join('')}
    </div>
    <style>
      @media (max-width:768px){
        .dash-stats-grid{ grid-template-columns:repeat(4,1fr) !important; }
      }
      @media (max-width:420px){
        .dash-stats-grid{ grid-template-columns:repeat(3,1fr) !important; }
      }
    </style>
  </div>

  <!-- Recently viewed (moved below stats, right-aligned) -->
  <div style="direction:rtl;text-align:right;margin-bottom:14px;">
    ${_recentlyViewedBar()}
  </div>

  <!-- ── SMART DAILY BRIEF (مقدمات کی بورنگ لسٹ کی جگہ — کارآمد + دلکش) ── -->
  ${_dashPriorityCards(nextRem, upcomingRem.length, overdueRem.length, thisMonthCount)}
  ${_dashPerfChart(monthly, total, complete)}
  ${_dashTipOfDay()}
  ${_dashKnowledgeCard()}`;

  // اسلامی ٹِکر (ہر 6 سیکنڈ) + سوال/جواب خودکار (ہر 12 سیکنڈ) — render ke baad
  try { initIslamicMessages(); } catch(_) {}
  try { initQARotation(); } catch(_) {}
}

// ── SMART BRIEF — آج کی ترجیحات (real reminders/cases data) ──
function _dashPriorityCards(nextRem, upCount, overdueCount, monthCount) {
  const F = (d) => (typeof formatDate === 'function' && d) ? formatDate(d) : '—';
  const cards = [
    { grad:'linear-gradient(135deg,#0369a1,#0ea5e9)', ic:'📅', big:upCount,
      lbl:'آنے والی یاددہانیاں', sub: nextRem ? ('اگلی: ' + F(nextRem.reminder_date)) : 'کوئی آئندہ نہیں',
      go:"showPage('reminders',null)" },
    { grad: overdueCount>0 ? 'linear-gradient(135deg,#b91c1c,#ef4444)' : 'linear-gradient(135deg,#047857,#10b981)',
      ic: overdueCount>0 ? '⏰' : '✅', big: overdueCount,
      lbl:'زیر التواء (گزر چکیں)', sub: overdueCount>0 ? 'فوری توجہ درکار' : 'سب وقت پر',
      go:"showPage('reminders',null)" },
    { grad:'linear-gradient(135deg,#6d28d9,#a78bfa)', ic:'🗂️', big:monthCount,
      lbl:'اس ماہ نئے مقدمات', sub:'رواں مہینہ', go:"showPage('cases',null)" },
  ];
  return `
  <div style="margin-bottom:14px;">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;direction:rtl;font-weight:700;">⚡ آج کی ترجیحات</div>
    <div class="dash-brief-grid" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;direction:rtl;">
      ${cards.map(c=>`
        <div onclick="${c.go}" style="background:${c.grad};border-radius:12px;padding:13px 14px;cursor:pointer;color:#fff;display:flex;flex-direction:column;min-height:94px;box-shadow:0 2px 10px rgba(0,0,0,0.12);transition:transform .12s;"
          onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <span style="font-size:20px;line-height:1;">${c.ic}</span>
            <span style="font-size:30px;font-weight:900;line-height:1;">${c.big}</span>
          </div>
          <div style="font-size:13px;font-weight:800;font-family:'Jameel Noori Nastaleeq',serif;margin-top:7px;">${c.lbl}</div>
          <div style="font-size:10px;color:rgba(255,255,255,0.82);font-family:'Jameel Noori Nastaleeq',serif;margin-top:1px;">${c.sub}</div>
        </div>`).join('')}
    </div>
    <style>@media(max-width:600px){.dash-brief-grid{grid-template-columns:1fr !important;}}</style>
  </div>`;
}

// ── SMART BRIEF — 6 ماہ کی کارکردگی (visual bar chart، real monthly data) ──
function _dashPerfChart(monthly, total, complete) {
  const max = Math.max(1, ...monthly.map(m=>m.count));
  const bars = monthly.map(m=>{
    const h = Math.round((m.count/max)*100);
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;">
      <div style="font-size:11px;font-weight:800;color:var(--accent);">${m.count}</div>
      <div style="width:100%;max-width:34px;height:70px;display:flex;align-items:flex-end;">
        <div style="width:100%;height:${Math.max(6,h)}%;background:linear-gradient(180deg,var(--accent),#0ea5e9);border-radius:6px 6px 3px 3px;transition:height .45s;"></div>
      </div>
      <div style="font-size:9px;color:var(--text-muted);">${m.label}</div>
    </div>`;
  }).join('');
  return `
  <div class="card" style="padding:14px;margin-bottom:14px;direction:rtl;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-size:13px;font-weight:800;color:var(--accent);font-family:'Jameel Noori Nastaleeq',serif;">📈 6 ماہ کی کارکردگی</div>
      <div style="font-size:10px;color:var(--text-muted);font-family:'Jameel Noori Nastaleeq',serif;">کل ${total} · مکمل ${complete}</div>
    </div>
    <div style="display:flex;align-items:flex-end;gap:6px;direction:ltr;">${bars}</div>
  </div>`;
}

// ── SMART BRIEF — آج کا نکتہ (روزانہ بدلتا پیشہ ورانہ مشورہ؛ curated، محفوظ) ──
// ── مفید نکات (روزانہ + "اگلا" بٹن سے مزید) ──
const _DIO_TIPS = [
  'شہادت کا بروقت اور مکمل اندراج مقدمے کی مضبوطی کی بنیاد ہے۔',
  'ہر ضمنی میں تاریخ، وقت اور جائے وقوعہ واضح درج کریں — عدالت میں یہی تفصیل کام آتی ہے۔',
  'گواہان کے بیانات جلد قلمبند کریں؛ وقت کے ساتھ یادداشت کمزور ہوتی ہے۔',
  'چالان جمع کرانے سے پہلے تمام دستاویزات کی فہرست ایک بار ضرور جانچ لیں۔',
  'ملزم کے کوائف (شناختی کارڈ، پتہ، موبائل) کی تصدیق تفتیش کو مضبوط بناتی ہے۔',
  'بروقت پیشی اور یاددہانی — کوئی مقدمہ بلاوجہ زیرِ التوا نہ رہے۔',
  'شہادتی نمونہ جات کی حفاظتی زنجیر برقرار رکھیں — عدالت میں یہی معتبر ٹھہرتی ہے۔',
  'منظم ریکارڈ آدھی تفتیش ہے — ہر دستاویز اپنی جگہ رکھیں۔',
  'موبائل/CDR اور فرانزک شہادت کو تحریری ریکارڈ سے مربوط رکھیں۔',
  'روزانہ اپنی یاددہانیاں ایک نظر دیکھیں — کوئی عدالتی تاریخ نہ چھوٹے۔',
  'موقعِ وقوعہ کی تصاویر اور نقشہ جائے وقوعہ تفتیش کو مضبوط بناتے ہیں۔',
  'ہر بیان پر گواہ کے دستخط/نشانِ انگوٹھا اور تاریخ ضرور لیں۔',
  'برآمدگی کا میمو موقع پر گواہان کی موجودگی میں مکمل کریں۔',
];
function _dashNextTip(btn) {
  const el = document.getElementById('dash-tip-text');
  if (!el) return;
  let idx = (parseInt(el.dataset.idx||'0',10) + 1) % _DIO_TIPS.length;
  el.dataset.idx = idx; el.textContent = _DIO_TIPS[idx];
}
window._dashNextTip = _dashNextTip;

function _dashTipOfDay() {
  const idx = Math.floor(Date.now()/86400000) % _DIO_TIPS.length;
  return `
  <div style="background:linear-gradient(135deg,#0f766e,#134e4a);border-radius:12px;padding:15px 18px;margin-bottom:14px;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;box-shadow:0 2px 10px rgba(0,0,0,0.12);">
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <div style="font-size:26px;line-height:1;">💡</div>
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <div style="font-size:12px;font-weight:800;color:#5eead4;">مفید نکتہ</div>
          <button onclick="_dashNextTip(this)" style="background:rgba(255,255,255,0.15);border:none;border-radius:8px;padding:3px 12px;font-size:11px;color:#fff;cursor:pointer;font-family:inherit;">اگلا ↻</button>
        </div>
        <div id="dash-tip-text" data-idx="${idx}" style="font-size:14px;color:#fff;line-height:1.9;">${_DIO_TIPS[idx]}</div>
      </div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
//  اسلامی ٹِکر — درود + قرآن (~60%) + حدیث (~40%) + آثارِ صحابہؓ/سلف
//  ہر ~1 منٹ بعد بدلتا ہے۔ درود کا نشان (ﷺ) ہمیشہ موجود = ہر منٹ درود کا ذکر۔
//  ⚠ یہ مستند، معروف، حوالہ جاتی مواد کا CURATED مجموعہ ہے — گھڑا ہوا نہیں۔
//     مزید مستند مواد نیچے arrays میں آسانی سے شامل کیا جا سکتا ہے (کسی معتبر
//     تصدیق شدہ ماخذ سے)۔ استعمال سے پہلے کسی عالمِ دین سے تصدیق بہتر ہے۔
// ═══════════════════════════════════════════════════════════════
const _DIO_ISLAMIC = {
  quran: [
    { t:'اِنَّ مَعَ الْعُسْرِ يُسْرًا — بے شک ہر مشکل کے ساتھ آسانی ہے', r:'الشرح 94:6' },
    { t:'وَقُلْ رَّبِّ زِدْنِيْ عِلْمًا — اے میرے رب! میرے علم میں اضافہ فرما', r:'طٰہٰ 20:114' },
    { t:'اِنَّ اللّٰهَ مَعَ الصّٰبِرِيْنَ — بے شک اللہ صبر کرنے والوں کے ساتھ ہے', r:'البقرة 2:153' },
    { t:'فَاذْكُرُوْنِيْۤ اَذْكُرْكُمْ — تم مجھے یاد کرو، میں تمہیں یاد کروں گا', r:'البقرة 2:152' },
    { t:'اِنَّ اللّٰهَ يُحِبُّ الْمُحْسِنِيْنَ — بے شک اللہ نیکی کرنے والوں سے محبت کرتا ہے', r:'البقرة 2:195' },
    { t:'وَتَعَاوَنُوْا عَلَى الْبِرِّ وَالتَّقْوٰى — نیکی اور تقویٰ پر ایک دوسرے کی مدد کرو', r:'المائدة 5:2' },
    { t:'اِنَّ اللّٰهَ لَا يُضِيْعُ اَجْرَ الْمُحْسِنِيْنَ — اللہ نیکوکاروں کا اجر ضائع نہیں کرتا', r:'التوبة 9:120' },
    { t:'حَسْبُنَا اللّٰهُ وَنِعْمَ الْوَكِيْلُ — ہمیں اللہ کافی ہے اور وہ بہترین کارساز ہے', r:'آل عمران 3:173' },
    { t:'وَعَسٰۤى اَنْ تَكْرَهُوْا شَيْئًا وَّهُوَ خَيْرٌ لَّكُمْ — ہو سکتا ہے تم کسی چیز کو ناپسند کرو اور وہ تمہارے لیے بہتر ہو', r:'البقرة 2:216' },
    { t:'رَبَّنَاۤ اٰتِنَا فِى الدُّنْيَا حَسَنَةً وَّفِى الْاٰخِرَةِ حَسَنَةً — اے رب! ہمیں دنیا و آخرت میں بھلائی دے', r:'البقرة 2:201' },
    { t:'وَاللّٰهُ خَيْرُ الرّٰزِقِيْنَ — اور اللہ سب سے بہتر رزق دینے والا ہے', r:'الجمعة 62:11' },
    { t:'وَبَشِّرِ الصّٰبِرِيْنَ — اور صبر کرنے والوں کو خوشخبری دے دو', r:'البقرة 2:155' },
    { t:'اِنَّ اللّٰهَ يَاْمُرُ بِالْعَدْلِ وَالْاِحْسَانِ — بے شک اللہ عدل اور احسان کا حکم دیتا ہے', r:'النحل 16:90' },
    { t:'وَقُوْلُوْا لِلنَّاسِ حُسْنًا — اور لوگوں سے اچھی بات کہو', r:'البقرة 2:83' },
    { t:'وَمَنْ يَّتَّقِ اللّٰهَ يَجْعَلْ لَّهٗ مَخْرَجًا — جو اللہ سے ڈرے، اللہ اس کے لیے راہ نکال دیتا ہے', r:'الطلاق 65:2' },
    { t:'وَلَا تَبْخَسُوا النَّاسَ اَشْيَآءَهُمْ — لوگوں کو ان کی چیزیں کم نہ دو', r:'الاعراف 7:85' },
  ],
  hadith: [
    { t:'اِنَّمَا الْاَعْمَالُ بِالنِّيَّاتِ — اعمال کا دارومدار نیتوں پر ہے', r:'صحیح بخاری' },
    { t:'اَلدِّيْنُ النَّصِيْحَةُ — دین خیرخواہی کا نام ہے', r:'صحیح مسلم' },
    { t:'مَنْ لَّا يَرْحَمِ النَّاسَ لَا يَرْحَمْهُ اللّٰهُ — جو لوگوں پر رحم نہیں کرتا، اللہ اس پر رحم نہیں کرتا', r:'بخاری و مسلم' },
    { t:'اَلْمُسْلِمُ مَنْ سَلِمَ الْمُسْلِمُوْنَ مِنْ لِّسَانِهٖ وَيَدِهٖ — مسلمان وہ ہے جس کی زبان و ہاتھ سے لوگ محفوظ رہیں', r:'صحیح بخاری' },
    { t:'اَلظُّلْمُ ظُلُمَاتٌ يَّوْمَ الْقِيَامَةِ — ظلم قیامت کے دن اندھیرے ہوں گے', r:'بخاری و مسلم' },
    { t:'اِتَّقِ اللّٰهَ حَيْثُمَا كُنْتَ — جہاں کہیں رہو اللہ سے ڈرو', r:'جامع ترمذی' },
    { t:'اَلْحَيَاءُ مِنَ الْاِيْمَانِ — حیا ایمان کا حصہ ہے', r:'بخاری و مسلم' },
    { t:'اَلصِّدْقُ يَهْدِيْۤ اِلَى الْبِرِّ — سچائی نیکی کی طرف لے جاتی ہے', r:'بخاری و مسلم' },
    { t:'اَلْمُؤْمِنُ لِلْمُؤْمِنِ كَالْبُنْيَانِ يَشُدُّ بَعْضُهٗ بَعْضًا — مومن مومن کے لیے عمارت کی طرح ہے', r:'بخاری و مسلم' },
    { t:'لَا يُؤْمِنُ اَحَدُكُمْ حَتّٰى يُحِبَّ لِاَخِيْهِ مَا يُحِبُّ لِنَفْسِهٖ — کوئی مومن نہیں جب تک اپنے بھائی کے لیے وہی نہ چاہے جو اپنے لیے', r:'بخاری و مسلم' },
    { t:'اَلْكَلِمَةُ الطَّيِّبَةُ صَدَقَةٌ — اچھی بات (بھی) صدقہ ہے', r:'بخاری و مسلم' },
  ],
  athar: [
    { t:'علم مال سے بہتر ہے؛ علم تمہاری حفاظت کرتا ہے اور مال کی تم حفاظت کرتے ہو', r:'منسوب: حضرت علیؓ' },
    { t:'حساب لیے جانے سے پہلے اپنا محاسبہ خود کر لو', r:'منسوب: حضرت عمرؓ' },
    { t:'انصاف کے ساتھ کیا گیا کام عبادت میں شمار ہوتا ہے', r:'اقوالِ سلف' },
  ]
};
function _islamicBarHTML() {
  return `
  <div id="islamic-bar" onclick="_islamicNext&&_islamicNext()" title="اگلا پیغام"
    style="display:flex;align-items:center;gap:10px;background:linear-gradient(90deg,rgba(15,118,110,0.12),rgba(56,189,248,0.07));border:1px solid rgba(15,118,110,0.25);border-radius:10px;padding:8px 14px;margin-bottom:14px;direction:rtl;overflow:hidden;cursor:pointer;">
    <span title="درود شریف — ﷺ" style="font-size:19px;flex-shrink:0;color:#0f766e;">ﷺ</span>
    <span id="islamic-text" style="font-size:14px;font-weight:600;color:var(--text-primary);font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;transition:opacity .4s;">﷽</span>
    <span id="islamic-ref" style="font-size:10px;color:var(--text-muted);flex-shrink:0;font-family:'Jameel Noori Nastaliq','Noto Nastaliq Urdu',serif;"></span>
  </div>`;
}
function _islamicPick() {
  const r = Math.random();
  let pool;
  if (r < 0.60) pool = _DIO_ISLAMIC.quran;        // ~60% قرآن
  else if (r < 0.94) pool = _DIO_ISLAMIC.hadith;  // ~34% حدیث (قرآن:حدیث ≈ 60:40)
  else pool = _DIO_ISLAMIC.athar;                 // ~6% آثار
  return pool[Math.floor(Math.random()*pool.length)];
}
function _islamicRender() {
  const tEl = document.getElementById('islamic-text');
  const rEl = document.getElementById('islamic-ref');
  if (!tEl) return;
  const m = _islamicPick();
  tEl.style.opacity = '0';
  setTimeout(() => {
    tEl.textContent = m.t;
    if (rEl) rEl.textContent = m.r ? '— ' + m.r : '';
    tEl.style.opacity = '1';
  }, 160);
}
function _islamicNext() { _islamicRender(); }
window._islamicNext = _islamicNext;
function initIslamicMessages() {
  try {
    if (!document.getElementById('islamic-bar')) return;   // sirf dashboard par
    _islamicRender();
    if (window._dioIslamicTimer) clearInterval(window._dioIslamicTimer);
    window._dioIslamicTimer = setInterval(() => {
      if (!document.getElementById('islamic-bar')) { clearInterval(window._dioIslamicTimer); window._dioIslamicTimer = null; return; }
      _islamicRender();
    }, 6000);   // ہر 6 سیکنڈ (خودکار)
  } catch (_) {}
}
window.initIslamicMessages = initIslamicMessages;

// ── قانون و مسل — "کیا آپ جانتے ہیں؟" (تعلیمی سوال/جواب؛ ایپ کے document types
//    اور معروف طریقہ کار سے۔ قانونی حوالوں کی تصدیق/توسیع خود کی جا سکتی ہے) ──
// تعزیراتِ پاکستان (ت پ / PPC) اور ضابطہ فوجداری (ض ف / CrPC) کی معروف، مستند دفعات۔
// نیز ایپ کے document types و طریقہ کار۔ سب حقیقی/مصدقہ — مزید آسانی سے شامل ہو سکتی ہیں۔
const _DIO_QA = [
  { q:'دفعہ 302 ت پ کس جرم سے متعلق ہے؟', a:'قتلِ عمد (جان بوجھ کر قتل)۔' },
  { q:'دفعہ 324 ت پ کس جرم سے متعلق ہے؟', a:'اقدامِ قتل (قتل کی کوشش)۔' },
  { q:'دفعہ 379 ت پ کس جرم سے متعلق ہے؟', a:'چوری کی سزا۔' },
  { q:'دفعہ 395 ت پ کس جرم سے متعلق ہے؟', a:'ڈکیتی (پانچ یا زائد افراد کا مشترکہ ڈاکہ)۔' },
  { q:'دفعہ 420 ت پ کس جرم سے متعلق ہے؟', a:'دھوکہ دہی و بددیانتی سے مال حاصل کرنا۔' },
  { q:'دفعہ 411 ت پ کس جرم سے متعلق ہے؟', a:'مالِ مسروقہ جانتے بوجھتے اپنے پاس رکھنا۔' },
  { q:'دفعہ 34 ت پ کیا بیان کرتی ہے؟', a:'مشترکہ ارادہ — کئی افراد کا مشترکہ نیت سے فعل کرنا۔' },
  { q:'دفعہ 109 ت پ کس بارے میں ہے؟', a:'اعانتِ جرم (کسی کو جرم پر اکسانا/مدد کرنا)۔' },
  { q:'دفعہ 154 ض ف کیا ہے؟', a:'قابلِ دست اندازی پولیس جرم کی اطلاع کا اندراج — یعنی FIR۔' },
  { q:'دفعہ 161 ض ف کیا ہے؟', a:'تفتیش کے دوران گواہوں کے بیانات پولیس کا قلمبند کرنا۔' },
  { q:'دفعہ 173 ض ف کیا ہے؟', a:'تفتیش مکمل ہونے پر پولیس رپورٹ (چالان) عدالت میں پیش کرنا۔' },
  { q:'دفعہ 167 ض ف کس بارے میں ہے؟', a:'جب 24 گھنٹے میں تفتیش مکمل نہ ہو تو ریمانڈ (جسمانی/عدالتی)۔' },
  { q:'دفعہ 497 ض ف کس بارے میں ہے؟', a:'ضمانت (bail) کب اور کیسے دی جا سکتی ہے۔' },
  { q:'دفعہ 54 ض ف کیا اختیار دیتی ہے؟', a:'بعض صورتوں میں پولیس کا بغیر وارنٹ گرفتاری کا اختیار۔' },
  { q:'دفعہ 156 ض ف کیا ہے؟', a:'قابلِ دست اندازی پولیس مقدمات میں پولیس کا تفتیش کا اختیار۔' },
  { q:'چالان 512 ض ف کب استعمال ہوتا ہے؟', a:'جب ملزم مفرور/عدم دستیاب ہو تو غیر موجودگی میں کارروائی کے لیے۔' },
  { q:'173 ض ف رپورٹ (چالان) کی اقسام؟', a:'مکمل، نامکمل، عبوری، تتمہ، اخراج، عدم پتہ، اور 512۔' },
  { q:'حفاظتی زنجیر (Chain of Custody) کیا ہے؟', a:'شہادت کس کے پاس، کب اور کیسے رہی — اس کا مسلسل ریکارڈ؛ عدالت میں صداقت کی بنیاد۔' },
  { q:'برآمدگی کا میمو کب مکمل کریں؟', a:'موقع پر، گواہان کی موجودگی میں — بعد کے تنازع سے بچنے کے لیے۔' },
  { q:'نقشہ جائے وقوعہ کیوں اہم ہے؟', a:'واقعے کی جگہ، فاصلے اور سمت واضح کرتا ہے — عدالت میں منظرکشی آسان۔' },
];
function _dashKnowledgeCard() {
  const idx = Math.floor(Date.now()/86400000) % _DIO_QA.length;
  const qa = _DIO_QA[idx];
  return `
  <div class="card" style="padding:14px;margin-bottom:14px;direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
      <div style="font-size:13px;font-weight:800;color:#a78bfa;">❓ کیا آپ جانتے ہیں؟ — قانون و مسل</div>
      <button onclick="_dashNextQA(this)" style="background:none;border:1px solid var(--border);border-radius:8px;padding:4px 12px;font-size:11px;color:var(--text-muted);cursor:pointer;font-family:inherit;">اگلا سوال ↻</button>
    </div>
    <div id="dash-qa-q" data-idx="${idx}" style="font-size:14px;font-weight:700;color:var(--text-primary);line-height:1.8;">${qa.q}</div>
    <div id="dash-qa-a" style="font-size:13px;color:var(--text-secondary);line-height:1.9;margin-top:6px;">${qa.a}</div>
  </div>`;
}
function _dashNextQA(btn) {
  const qEl = document.getElementById('dash-qa-q');
  const aEl = document.getElementById('dash-qa-a');
  if (!qEl) return;
  let idx = (parseInt(qEl.dataset.idx||'0',10) + 1) % _DIO_QA.length;
  qEl.dataset.idx = idx;
  qEl.textContent = _DIO_QA[idx].q;
  if (aEl) aEl.textContent = _DIO_QA[idx].a;
}
window._dashNextQA = _dashNextQA;
// سوال/جواب خودکار بدلیں (ہر 12 سیکنڈ — پڑھنے کا وقت ملے)
function initQARotation() {
  try {
    if (!document.getElementById('dash-qa-q')) return;
    if (window._dioQATimer) clearInterval(window._dioQATimer);
    window._dioQATimer = setInterval(() => {
      if (!document.getElementById('dash-qa-q')) { clearInterval(window._dioQATimer); window._dioQATimer = null; return; }
      _dashNextQA();
    }, 12000);
  } catch (_) {}
}
window.initQARotation = initQARotation;

// ── HELPERS ───────────────────────────────────────────────────
function _recentlyViewedBar() {
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem('dio_recent_cases')||'[]'); } catch(_) {}
  if (!recent.length) return '';
  return `
  <div style="margin-bottom:14px;direction:rtl;">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:700;">🕐 حال ہی میں دیکھے گئے</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      ${recent.map(r=>`
        <button onclick="openCaseWorkspace('${r.id}')"
          style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:11px;cursor:pointer;color:var(--text-secondary);display:flex;align-items:center;gap:6px;"
          onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <span style="color:var(--accent);font-weight:700;">FIR ${r.fir}</span>
          ${r.name?`<span style="font-size:10px;color:var(--text-muted);">${esc(r.name.slice(0,15))}</span>`:''}
        </button>`).join('')}
    </div>
  </div>`;
}

function _monthlyTrend(cases) {
  const now = new Date();
  return Array.from({length:6},(_,i)=>{
    const d=new Date(now.getFullYear(),now.getMonth()-5+i,1);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    return { label:d.toLocaleString('default',{month:'short'}), count:cases.filter(c=>{ const p=_pd(c.fir_date); return p&&p.startsWith(key); }).length };
  });
}
function _pd(d) {
  if(!d)return null;
  if(/^\d{4}-\d{2}-\d{2}/.test(d))return d;
  const p=d.split(/[-\/]/);
  return p.length===3&&p[2].length===4?`${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`:null;
}
// NOTE: _dFetchRem() hataa diya — ab dashboard getReminders() istemal karta hai
// (offline cache fallback ke sath). Neeche filter(!is_done) pending nikaal leta hai.
async function _dFetchFivec() {
  const oid=await getOfficerId();
  if(!oid || !navigator.onLine) return 0;
  try { const{count}=await supabaseClient.from('applications_5c').select('*',{count:'exact',head:true}).eq('officer_id',oid); return count||0; }
  catch(_){ return 0; }
}

// ── FIRST-RUN ONBOARDING CARD (Phase 4H) ──────────────────────
// Naye afsar ko sirf PEHLI baar dashboard par nazar aata hai.
// Dismiss flag localStorage mein (non-sensitive). Har cheez try/catch
// mein — storage na ho to card har baar dikhega (koi kharabi nahi).
function _dioOnboardCard() {
  let seen = false;
  try { seen = localStorage.getItem('dio_seen_welcome_v1') === '1'; } catch (_) {}
  if (seen) return '';
  return `
  <div id="dio-onboard-card" style="background:linear-gradient(135deg,#134e4a,#0f766e);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:16px 18px;margin-bottom:14px;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;">
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <div style="font-size:30px;line-height:1;">👋</div>
      <div style="flex:1;">
        <div style="font-size:15px;font-weight:800;color:#fff;">Digital IO میں خوش آمدید!</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:5px;line-height:1.9;">
          یہ آپ کا دفتری کام آسان بنانے کے لیے ہے — کاغذی بوجھ کم، اطمینان زیادہ۔
          پہلی بار استعمال کر رہے ہیں؟ ایک نظر رہنمائی پر ڈال لیں۔
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" style="font-family:'Jameel Noori Nastaleeq',serif;" onclick="_dioOnboardOpenHelp()">📖 رہنمائی کھولیں</button>
          <button class="btn btn-secondary btn-sm" style="font-family:'Jameel Noori Nastaleeq',serif;" onclick="_dioOnboardDismiss()">✓ سمجھ گیا</button>
        </div>
      </div>
    </div>
  </div>`;
}

function _dioOnboardDismiss() {
  try { localStorage.setItem('dio_seen_welcome_v1', '1'); } catch (_) {}
  const el = document.getElementById('dio-onboard-card');
  if (el) el.remove();
}

function _dioOnboardOpenHelp() {
  _dioOnboardDismiss();
  if (typeof showPage === 'function') showPage('help', null);
}
