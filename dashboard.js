/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — DASHBOARD v4
   New card order · Full screen · Activity feed
   ═══════════════════════════════════════════════════════════ */

registerPage('dashboard', renderDashboard);

async function renderDashboard(container) {
  // Phase 3C — DIO.states.loading() with fallback
  const _loadingHtml = (window.DIO && DIO.states)
    ? DIO.states.loading('ڈیش بورڈ لوڈ ہو رہا ہے')
    : `<div style="text-align:center;padding:32px;color:var(--text-muted);font-family:'Jameel Noori Nastaleeq',serif;">لوڈ ہو رہا ہے...</div>`;
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
  <div class="dio-idcard">
    <div class="dio-id-row">
      <div class="dio-id-main">
        <b class="dio-id-name">${esc(o.full_name)||'افسر'}</b>
        <div class="dio-id-sub">${esc(o.designation||'')}${o.station?' · تھانہ '+esc(o.station):''}${o.district?' · ضلع '+esc(o.district):''}</div>
        <small class="dio-id-date">${formatDate(new Date())}</small>
      </div>
      <div id="dash-welcome-avatar" style="width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#0ea5e9);display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:900;color:#fff;flex-shrink:0;overflow:hidden;cursor:pointer;" onclick="showPage('settings',null)">
        ${(() => {
          let p = o.profile_photo;
          if (!p) { try { p = localStorage.getItem('dio_profile_photo') || localStorage.getItem('officer_photo_url'); } catch(_) {} }
          if (p) return `<img src="${esc(p)}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
          return (o.full_name||'IO').split(' ').map(w=>w[0]||'').join('').slice(0,2).toUpperCase();
        })()}
      </div>
    </div>
  </div>

  <!-- مرکزی تلاش — سائیڈ بار سے ہٹا کر یہاں (v524) -->
  ${_dashSearchBox()}

  <!-- مرکزی بٹن — سائیڈ بار ختم، سب کچھ یہیں (v524) -->
  ${_dashMainTiles(total, pendRem.length)}

  <!-- Cases Stats — 7 سفید کارڈ (mockup اسٹائل — outline آئیکن) -->
  <b class="dio-sec-h" role="heading" aria-level="2">مقدمات کی صورتحال</b>
  ${_dashStatCards(total, statusCounts)}

  <!-- اسلامی ٹِکر — اسٹیٹس کے نیچے (درود + قرآن/حدیث، ہر 6 سیکنڈ) -->
  ${_islamicBarHTML()}

  <!-- Recently viewed -->
  <div style="direction:rtl;text-align:right;margin-bottom:14px;">
    ${_recentlyViewedBar()}
  </div>

  <!-- آج کی ترجیحات (حقیقی reminders/cases) -->
  ${_dashPriorityCards(nextRem, upcomingRem.length, overdueRem.length, thisMonthCount)}

  <!-- (سوالات اور مفید نکتہ افسر کی ہدایت پر ہٹا دیے گئے — ڈیش بورڈ صرف کام پر) -->`;

  // ٹِکر (6s) + سوالات خودکار (12s) — render ke baad
  try { initIslamicMessages(); } catch(_) {}
}

// ── STAT CARDS — mockup اسٹائل (سفید کارڈ + outline آئیکن، theme-aware) ──
function _dashStatCards(total, sc) {
  sc = sc || {};
  // `s` = status code jo "میرے مقدمات" par FILTER ban kar jata hai.
  // (Pehle har card `showPage('cases')` bulata tha — har card TAMAM maqdmaat dikhata tha.)
  const cards = [
    { s:'',           l:'کل مقدمات',      v:total,             col:'var(--accent)', ic:'<path d="m12 2 9 4.5-9 4.5-9-4.5L12 2Z"/><path d="m3 12 9 4.5 9-4.5"/><path d="m3 17 9 4.5 9-4.5"/>' },
    { s:'under',      l:'زیر تفتیش',      v:sc.under||0,       col:'#2563eb',       ic:'<path d="M7 3h10M7 21h10M8 3v3.5a4 4 0 0 0 1.5 3.1l2.5 2 2.5-2A4 4 0 0 0 16 6.5V3M8 21v-3.5a4 4 0 0 1 1.5-3.1l2.5-2 2.5 2A4 4 0 0 1 16 17.5V21"/>' },
    { s:'untrace',    l:'عدم پتہ',        v:sc.untrace||0,     col:'#7c3aed',       ic:'<path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M11 11a1.5 1.5 0 1 1 2 1.3c-.6.3-1 .7-1 1.4M12 16.5h.01"/>' },
    { s:'challan512', l:'چالان 512 ض ف',  v:sc.challan512||0,  col:'#ea8a2f',       ic:'<path d="M4 6a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>' },
    { s:'incomplete', l:'چالان نامکمل',   v:sc.incomplete||0,  col:'#d97706',       ic:'<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M9 13h4M9 16h6"/>' },
    { s:'complete',   l:'چالان مکمل',     v:sc.complete||0,    col:'var(--green)',  ic:'<circle cx="12" cy="12" r="9"/><path d="m8.5 12 2.5 2.5 4.5-5"/>' },
    { s:'cancel',     l:'اخراج',          v:sc.cancel||0,      col:'var(--red)',    ic:'<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="m9.5 12 5 5M14.5 12l-5 5"/>' },
  ];
  return `
  <div style="margin-bottom:14px;">
    <div class="dash-stats-grid dio-stats">
      ${cards.map(c=>`
      <button type="button" class="dio-stat${(+c.v)?'':' is-zero'}" style="--st:${c.col}" onclick="dioOpenCases('${c.s}')" aria-label="${c.l}">
        <svg class="dio-stat-ic" viewBox="0 0 24 24" aria-hidden="true">${c.ic}</svg>
        <b class="dio-stat-num">${c.v}</b>
        <span class="dio-stat-lbl">${c.l}</span>
      </button>`).join('')}
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════
//  مرکزی تلاش + مرکزی بٹن (v524)
//  افسر کی ہدایت: سائیڈ بار نہیں چاہیے — تمام اہم بٹن اور تلاش
//  مرکزی صفحے پر ہوں۔ تلاش وہی پورے سسٹم والی (search.js) ہے —
//  یہاں صرف اس کا خانہ اور نتائج کی جگہ ہے (#sr-query / #sr-results)۔
// ═══════════════════════════════════════════════════════════════
function _dashSearchBox() {
  return `
  <div id="dash-search" class="dio-dsearch" role="search">
    <svg class="dio-dsearch-ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/></svg>
    <input id="sr-query" type="search" autocomplete="off" dir="auto"
      placeholder="تلاش — مقدمہ نمبر، مدعی، ملزم، گواہ، شناختی کارڈ، موبائل…"
      aria-label="پورے سسٹم میں تلاش"
      oninput="window._srDebounced&&_srDebounced()"
      onkeydown="if(event.key==='Escape'){this.value='';window._srDebounced&&_srDebounced();}">
  </div>
  <div id="sr-results" class="dio-dsearch-res" aria-live="polite"></div>`;
}

const _DT_IC = {
  add:    '<path d="M12 5v14M5 12h14"/>',
  cases:  '<path d="M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/>',
  rem:    '<path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10z"/><path d="M10.2 19a2 2 0 0 0 3.6 0"/>',
  inc:    '<path d="M12 4 3 19.5h18z"/><path d="M12 10v4.5M12 17.2h.01"/>',
  law:    '<path d="M12 4v16M5 8h14M7 8l-3 6a3 3 0 0 0 6 0L7 8ZM17 8l-3 6a3 3 0 0 0 6 0l-3-6ZM8 20h8"/>',
  fivec:  '<rect x="5" y="3.5" width="14" height="17" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  people: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9" r="2.5"/><path d="M15.5 14.2A4.5 4.5 0 0 1 21 18.5"/>',
  tpl:    '<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M8 13h8M8 17h5"/>',
  orders: '<path d="M6 3.5h9l3 3V20.5H6z"/><path d="M9 10h6M9 14h6"/>',
  sho:    '<path d="M4 20h16M6 20V9l6-4 6 4v11M10 20v-5h4v5"/>',
  dsp:    '<circle cx="12" cy="9" r="5"/><path d="m9.5 13.5-1.5 7 4-2 4 2-1.5-7"/>',
  car:    '<path d="M5 16V11l2-4.5h10L19 11v5"/><path d="M3.5 16h17v2.5h-17z"/><circle cx="7.5" cy="18.5" r="1.4"/><circle cx="16.5" cy="18.5" r="1.4"/>',
  backup: '<path d="M7 18a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4 4 0 0 1-.5 8.5Z"/><path d="M12 11v6M9.5 13.5 12 11l2.5 2.5"/>',
  sub:    '<path d="M6 4h12l3 5-9 11L3 9z"/><path d="M3 9h18"/>',
  bin:    '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
  help:   '<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.4c-.6.3-1 .8-1 1.5v.5M12 17h.01"/>',
  set:    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  admin:  '<path d="M12 2.6 20 5.4v6.1c0 4.7-3.2 8.2-8 9.9-4.8-1.7-8-5.2-8-9.9V5.4Z"/><path d="m8.6 12 2.4 2.4 4.4-4.8"/>',
  out:    '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
};

function _dashTile(t, big) {
  return `
    <button type="button" class="dio-tile${big ? ' dio-tile-big' : ''}${t.tone ? ' tone-' + t.tone : ''}" onclick="${t.go}" aria-label="${t.l}">
      <svg class="dio-tile-ic" viewBox="0 0 24 24" aria-hidden="true">${_DT_IC[t.ic] || ''}</svg>
      <b class="dio-tile-lbl">${t.l}</b>
      ${(t.badge > 0) ? `<small class="dio-tile-badge">${t.badge}</small>` : ''}
    </button>`;
}

function _dashMainTiles(totalCases, pendingRem) {
  const isAdmin = (typeof canAccess === 'function') && canAccess('admin');
  const primary = [
    { l:'نیا اندراج',          ic:'add',    go:"window.openAddCaseModal&&openAddCaseModal()", tone:'brand' },
    { l:'میرے مقدمات',         ic:'cases',  go:"dioOpenCases('')", badge: totalCases },
    { l:'یاددہانیاں',          ic:'rem',    go:"showPage('reminders',null)", badge: pendingRem },
    { l:'واقعاتی رپورٹ',       ic:'inc',    go:"showPage('incident',null)" },
    { l:'قانونی لائبریری',     ic:'law',    go:"showPage('law',null)" },
    { l:'مارک شدہ درخواستیں',  ic:'fivec',  go:"showPage('fivec',null)" },
    { l:'ملزمان / گواہان',     ic:'people', go:"showPage('suspects',null)" },
    { l:'ٹمپلیٹس',             ic:'tpl',    go:"showPage('templates',null)" },
  ];
  const more = [
    { l:'احکامات و ضوابط',  ic:'orders', go:"showPage('ahkamat',null)" },
    { l:'SHO کا نام',        ic:'sho',    go:"window.openShoDspModal&&openShoDspModal('sho')" },
    { l:'DSP/SDPO کا نام',   ic:'dsp',    go:"window.openShoDspModal&&openShoDspModal('dsp')" },
    { l:'سرکاری گاڑی',       ic:'car',    go:"window.openSarkariGari&&openSarkariGari()" },
    { l:'بیک اپ',            ic:'backup', go:"showPage('backup',null)" },
    { l:'سبسکرپشن',          ic:'sub',    go:"window.showSubscriptionPage&&showSubscriptionPage()" },
    { l:'حذف شدہ مواد',      ic:'bin',    go:"showPage('bin',null)" },
    { l:'مدد و رہنمائی',     ic:'help',   go:"showPage('help',null)" },
    { l:'ترتیبات',           ic:'set',    go:"showPage('settings',null)" },
  ];
  if (isAdmin) more.push({ l:'ایڈمن', ic:'admin', go:"showPage('admin',null)" });
  more.push({ l:'لاگ آؤٹ', ic:'out', go:"window.doLogout&&doLogout()", tone:'alert' });
  return `
  <b class="dio-sec-h" role="heading" aria-level="2">اہم سیکشن</b>
  <div class="dio-tiles dio-tiles-main">${primary.map(t => _dashTile(t, true)).join('')}</div>
  <b class="dio-sec-h" role="heading" aria-level="2">دیگر سہولیات</b>
  <div class="dio-tiles dio-tiles-more">${more.map(t => _dashTile(t, false)).join('')}</div>`;
}

// ── (خبریں / نیوز کا حصہ افسر کی درخواست پر مکمل ہٹا دیا گیا) ──

// ── SMART BRIEF — آج کی ترجیحات (real reminders/cases data) ──
function _dashPriorityCards(nextRem, upCount, overdueCount, monthCount) {
  const F = (d) => (typeof formatDate === 'function' && d) ? formatDate(d) : '—';
  const cards = [
    { tone:'info', big:upCount,
      lbl:'آنے والی یاددہانیاں', sub: nextRem ? ('اگلی: ' + F(nextRem.reminder_date)) : 'کوئی آئندہ نہیں',
      go:"showPage('reminders',null)" },
    { tone: overdueCount > 0 ? 'alert' : 'ok', big: overdueCount,
      lbl:'زیر التواء (گزر چکیں)', sub: overdueCount>0 ? 'فوری توجہ درکار' : 'سب وقت پر',
      go:"showPage('reminders',null)" },
    { tone:'calm', big:monthCount,
      lbl:'اس ماہ نئے مقدمات', sub:'رواں مہینہ', go:"dioOpenCases('',{month:'"+new Date().toISOString().slice(0,7)+"'})" },
  ];
  return `
  <div style="margin-bottom:14px;">
    <b class="dio-sec-h" role="heading" aria-level="2">آج کی ترجیحات</b>
    <div class="dash-brief-grid dio-prio">
      ${cards.map(c=>`
        <button type="button" class="dio-prio-card tone-${c.tone}" onclick="${c.go}">
          <b class="dio-prio-num">${c.big}</b>
          <span class="dio-prio-lbl">${c.lbl}</span>
          <small class="dio-prio-sub">${c.sub}</small>
        </button>`).join('')}
    </div>
  </div>`;
}

// ── SMART BRIEF — 6 ماہ کی کارکردگی (visual bar chart، real monthly data) ──
// ── SMART BRIEF — آج کا نکتہ (روزانہ بدلتا پیشہ ورانہ مشورہ؛ curated، محفوظ) ──
// ── مفید نکات (روزانہ + "اگلا" بٹن سے مزید) ──
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
    class="dio-ayat" style="border-radius:10px;padding:8px 14px;margin-bottom:14px;direction:rtl;overflow:hidden;cursor:pointer;">
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
// ── HELPERS ───────────────────────────────────────────────────
function _recentlyViewedBar() {
  let recent = [];
  try { recent = JSON.parse(localStorage.getItem('dio_recent_cases')||'[]'); } catch(_) {}
  if (!recent.length) return '';
  return `
  <div style="margin-bottom:14px;direction:rtl;">
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;font-weight:700;">حال ہی میں دیکھے گئے</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap;">
      ${recent.map(r=>`
        <button onclick="openCaseWorkspace('${r.id}')"
          style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:5px 12px;font-size:11px;cursor:pointer;color:var(--text-secondary);display:flex;align-items:center;gap:6px;"
          onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'">
          <span style="color:var(--accent);font-weight:700;">FIR ${esc(r.fir)}</span>
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
  <div id="dio-onboard-card" class="dio-onboard">
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <div style="flex:1;">
        <div class="dio-hs2" style="font-size:15px;font-weight:800;color:#fff;">Digital IO میں خوش آمدید!</div>
        <div style="font-size:12px;color:rgba(255,255,255,0.8);margin-top:5px;line-height:1.9;">
          یہ آپ کا دفتری کام آسان بنانے کے لیے ہے — کاغذی بوجھ کم، اطمینان زیادہ۔
          پہلی بار استعمال کر رہے ہیں؟ ایک نظر رہنمائی پر ڈال لیں۔
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn btn-primary btn-sm" style="font-family:'Jameel Noori Nastaleeq',serif;" onclick="_dioOnboardOpenHelp()">رہنمائی کھولیں</button>
          <button class="btn btn-secondary btn-sm" style="font-family:'Jameel Noori Nastaleeq',serif;" onclick="_dioOnboardDismiss()">سمجھ گیا</button>
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
