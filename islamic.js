/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — ISLAMIC MESSAGES  v3  (islamic.js)
   60% Quran (full 6236 ayaat via API) · 40% Hadith
   No repeat until full cycle · Durood every 1 hour
   ═══════════════════════════════════════════════════════════ */

// ── HADITH COLLECTION (40%) ──────────────────────────────────
const _AHADITH = [
  // Bukhari
  { t:'📗 بخاری', m:'اعمال کا دارومدار نیتوں پر ہے — (بخاری)' },
  { t:'📗 بخاری', m:'مسلمان وہ ہے جس کی زبان اور ہاتھ سے دوسرے محفوظ رہیں — (بخاری)' },
  { t:'📗 بخاری', m:'دین آسان ہے، جو دین میں سختی کرے گا دین اس پر غالب آجائے گا — (بخاری)' },
  { t:'📗 بخاری', m:'تم میں سے بہترین وہ ہے جو قرآن سیکھے اور سکھائے — (بخاری)' },
  { t:'📗 بخاری', m:'جو لوگوں پر رحم نہیں کرتا اللہ اس پر رحم نہیں فرماتا — (بخاری)' },
  { t:'📗 بخاری', m:'سچائی نیکی کی طرف لے جاتی ہے اور نیکی جنت کی طرف — (بخاری)' },
  { t:'📗 بخاری', m:'تم میں سے کوئی اس وقت تک مومن نہیں جب تک اپنے بھائی کے لیے وہ نہ چاہے جو اپنے لیے چاہتا ہے — (بخاری)' },
  { t:'📗 بخاری', m:'حیا ایمان کی شاخ ہے — (بخاری)' },
  { t:'📗 بخاری', m:'مجلس میں امانت ہے — (بخاری)' },
  { t:'📗 بخاری', m:'صدقہ مال کو کم نہیں کرتا — (بخاری)' },
  { t:'📗 بخاری', m:'غصے کو پیو — (بخاری)' },
  { t:'📗 بخاری', m:'جو اللہ اور یومِ آخرت پر ایمان رکھتا ہو وہ اچھی بات کہے یا خاموش رہے — (بخاری)' },
  { t:'📗 بخاری', m:'پڑوسی کے بارے میں جبرائیل ؑ نے مجھے اتنی وصیت کی کہ مجھے گمان ہوا وہ پڑوسی کو وارث بنا دیں گے — (بخاری)' },
  { t:'📗 بخاری', m:'سب سے بڑا گناہ اللہ کے ساتھ شرک، والدین کی نافرمانی اور جھوٹی گواہی ہے — (بخاری)' },
  { t:'📗 بخاری', m:'آسانی کرو، مشکل مت بناؤ — (بخاری)' },
  { t:'📗 بخاری', m:'جو ہمارے بڑوں کی عزت نہ کرے اور چھوٹوں پر رحم نہ کرے وہ ہم میں سے نہیں — (بخاری)' },
  { t:'📗 بخاری', m:'جنت ماں کے پاؤں تلے ہے — (بخاری)' },
  { t:'📗 بخاری', m:'علم حاصل کرنا ہر مسلمان پر فرض ہے — (بخاری)' },
  { t:'📗 بخاری', m:'مسلمان کو گالی دینا فسق ہے اور قتل کرنا کفر — (بخاری)' },
  { t:'📗 بخاری', m:'تحفے دو، آپس میں محبت بڑھے گی — (بخاری)' },
  // Muslim
  { t:'📘 مسلم', m:'ایمان کی ستر سے زیادہ شاخیں ہیں، سب سے افضل لا الہ الا اللہ اور سب سے ادنی تکلیف دہ چیز راستے سے ہٹانا — (مسلم)' },
  { t:'📘 مسلم', m:'جو شخص اللہ سے ملنا پسند کرتا ہے اللہ اس سے ملنا پسند فرماتا ہے — (مسلم)' },
  { t:'📘 مسلم', m:'دنیا مومن کے لیے قید خانہ اور کافر کے لیے جنت ہے — (مسلم)' },
  { t:'📘 مسلم', m:'جو اللہ کی خوشنودی کے لیے جھکے اللہ اسے بلند کرتا ہے — (مسلم)' },
  { t:'📘 مسلم', m:'ہر نیکی صدقہ ہے — (مسلم)' },
  { t:'📘 مسلم', m:'پانی سے وضو کرو، غسل کرو، مسواک کرو — (مسلم)' },
  { t:'📘 مسلم', m:'جو شخص ایک بالشت زمین ناحق لے گا قیامت کے دن سات زمینوں کا طوق اس کے گلے میں ڈالا جائے گا — (مسلم)' },
  { t:'📘 مسلم', m:'صلہ رحمی کرنے والا وہ نہیں جو بدلے میں کرے بلکہ وہ ہے جو قطع رحمی کرنے پر بھی ملاتا رہے — (مسلم)' },
  { t:'📘 مسلم', m:'میں ظلم کو اپنے لیے حرام کیا اور تمہارے درمیان بھی حرام ہے پس ظلم نہ کرو — (مسلم — قدسی)' },
  { t:'📘 مسلم', m:'اللہ خوبصورت ہے اور خوبصورتی کو پسند فرماتا ہے — (مسلم)' },
  // Abu Dawood
  { t:'📙 ابو داؤد', m:'جو شخص اپنے آپ کو پاک رکھے اللہ اسے پاک کرتا ہے — (ابو داؤد)' },
  { t:'📙 ابو داؤد', m:'قاضی کو غصے کی حالت میں فیصلہ نہیں کرنا چاہیے — (ابو داؤد)' },
  { t:'📙 ابو داؤد', m:'ظالم کا ہاتھ پکڑو اور مظلوم کی مدد کرو — (ابو داؤد)' },
  { t:'📙 ابو داؤد', m:'جو کسی مسلمان بھائی کا راز فاش کرے اللہ اس کا راز فاش کرے گا — (ابو داؤد)' },
  { t:'📙 ابو داؤد', m:'انصاف کرنے والوں کو قیامت کے دن نور کے منبروں پر بٹھایا جائے گا — (مسلم)' },
  // Tirmizi
  { t:'📕 ترمذی', m:'عقل مند وہ ہے جو اپنے نفس کو قابو میں رکھے — (ترمذی)' },
  { t:'📕 ترمذی', m:'مومن آسانی اور نرمی سے حاصل کر لیتا ہے جو سختی سے حاصل نہیں ہوتا — (ترمذی)' },
  { t:'📕 ترمذی', m:'اللہ کی رحمت سے مایوس نہ ہو — (ترمذی)' },
  { t:'📕 ترمذی', m:'جو شکر نہیں کرتا وہ صبر بھی نہیں کر سکتا — (ترمذی)' },
  { t:'📕 ترمذی', m:'توبہ کرنے والا گناہ سے ایسے ہے جیسے اس نے گناہ کیا ہی نہیں — (ترمذی)' },
  // Ibn Majah
  { t:'📒 ابن ماجہ', m:'قناعت ایسا خزانہ ہے جو کبھی ختم نہیں ہوتا — (ابن ماجہ)' },
  { t:'📒 ابن ماجہ', m:'بیمار کی عیادت کرو، بھوکے کو کھانا کھلاؤ — (ابن ماجہ)' },
  { t:'📒 ابن ماجہ', m:'جو اپنے اہل خانہ کے ساتھ اچھا ہے وہ بہترین ہے — (ابن ماجہ)' },
  // Nawawi
  { t:'📓 نووی', m:'حلال واضح ہے، حرام واضح ہے، اور ان کے درمیان مشتبہ چیزیں ہیں — (بخاری)' },
  { t:'📓 نووی', m:'جو میں نہ جانو وہ چھوڑو — (ترمذی)' },
  { t:'📓 نووی', m:'نیکی حسنِ اخلاق کا نام ہے — (مسلم)' },
  { t:'📓 نووی', m:'کسی کو تکلیف نہ دو اور کسی سے تکلیف نہ لو — (ابن ماجہ)' },
];

// ── DUROOD (shown every 1 hour) ───────────────────────────────
const _DUROOD = '🌹 اللّٰھُمَّ صَلِّ عَلٰی مُحَمَّدٍ وَّعَلٰی اٰلِ مُحَمَّدٍ کَمَا صَلَّیْتَ عَلٰی اِبْرَاہِیْمَ وَعَلٰی اٰلِ اِبْرَاہِیْمَ اِنَّکَ حَمِیْدٌ مَّجِیْد — درود ابراہیمی';

// ── STATE ─────────────────────────────────────────────────────
let _quranPool   = [];      // filled live from API (full Quran)
let _msgQueue    = [];      // shuffled queue of all messages (no repeat)
let _islamicTimer = null;
let _duroodTimer  = null;
const _SEEN_KEY  = 'dio_islamic_seen';   // tracks shown indices across sessions
const ROTATE_MS  = 13000;                // message every 13s
const DUROOD_MS  = 60 * 60 * 1000;       // durood every 1 hour

// ── INIT ──────────────────────────────────────────────────────
async function initIslamicMessages() {
  // Show durood first
  _renderIslamic(_DUROOD);

  // Build initial queue from hadith + pre-cached quran (localStorage)
  _loadCachedQuran();
  _rebuildQueue();

  // Start rotation
  clearInterval(_islamicTimer);
  _islamicTimer = setInterval(_nextIslamicMsg, ROTATE_MS);

  // Durood every hour (separate, always shown)
  clearInterval(_duroodTimer);
  _duroodTimer = setInterval(() => _renderIslamic(_DUROOD), DUROOD_MS);

  // Fetch the FULL Quran in the background (all 6236 ayaat), cache it
  _fetchFullQuran();
}

// ── BUILD QUEUE (60% Quran / 40% Hadith, shuffled, no-repeat) ──
function _rebuildQueue() {
  // Weight: to get ~60/40, repeat quran refs more in the pool ratio
  const hadith = _AHADITH.map((h,i) => ({ id:'H'+i, txt: `${h.t}: ${h.m}` }));
  const quran  = _quranPool.map((q,i) => ({ id:'Q'+i, txt: q }));

  // Build a 60/40 weighted list:
  // If we have lots of quran, take all; pad hadith so quran is ~60%.
  let pool = [];
  if (quran.length) {
    pool = pool.concat(quran);
    // hadith count to make hadith ~40% of total → hadithTarget = quran*0.4/0.6
    const hadithTarget = Math.max(hadith.length, Math.round(quran.length * 0.66));
    for (let i=0; i<hadithTarget; i++) pool.push(hadith[i % hadith.length]);
  } else {
    // No quran yet — use hadith + small built-in quran fallback
    pool = hadith.concat(_QURAN_FALLBACK.map((q,i)=>({id:'QF'+i, txt:q})));
  }

  // Remove already-seen this cycle
  let seen = {};
  try { seen = JSON.parse(localStorage.getItem(_SEEN_KEY) || '{}'); } catch(_) {}
  let remaining = pool.filter(p => !seen[p.id]);

  // If everything seen → reset cycle (start fresh, no repeat until all shown again)
  if (remaining.length === 0) {
    seen = {};
    try { localStorage.setItem(_SEEN_KEY, '{}'); } catch(_) {}
    remaining = pool.slice();
  }

  _msgQueue = _shuffle(remaining);
}

// ── NEXT MESSAGE ──────────────────────────────────────────────
function _nextIslamicMsg() {
  if (!_msgQueue.length) _rebuildQueue();
  if (!_msgQueue.length) return;

  const item = _msgQueue.shift();

  // Mark as seen
  try {
    const seen = JSON.parse(localStorage.getItem(_SEEN_KEY) || '{}');
    seen[item.id] = 1;
    localStorage.setItem(_SEEN_KEY, JSON.stringify(seen));
  } catch(_) {}

  _renderIslamic(item.txt);
}

// ── RENDER (fade transition) ──────────────────────────────────
function _renderIslamic(text) {
  const el = document.getElementById('islamic-ticker');
  if (!el) return;
  el.style.transition = 'opacity 0.4s';
  el.style.opacity = '0';
  setTimeout(() => {
    const el2 = document.getElementById('islamic-ticker');
    if (el2) { el2.innerHTML = text; el2.style.opacity = '1'; }
  }, 400);
}

// ── FETCH FULL QURAN (all 6236 ayaat, Urdu translation) ───────
async function _fetchFullQuran() {
  // If already cached fully, skip
  try {
    const cached = JSON.parse(localStorage.getItem('dio_quran_full') || '[]');
    if (cached.length >= 6000) { _quranPool = cached; _rebuildQueue(); return; }
  } catch(_) {}

  // Fetch whole Quran in ONE request (Urdu translation by Ahmed Ali)
  try {
    const r = await fetch('https://api.alquran.cloud/v1/quran/ur.ahmedali');
    if (!r.ok) throw new Error('fetch failed');
    const d = await r.json();
    const surahs = d?.data?.surahs || [];
    const out = [];
    surahs.forEach(su => {
      (su.ayahs || []).forEach(a => {
        if (a.text) {
          out.push(`📖 ${a.text} <span style="font-size:11px;opacity:0.65;">(${su.name||''} ${su.number}:${a.numberInSurah})</span>`);
        }
      });
    });
    if (out.length) {
      _quranPool = out;
      try { localStorage.setItem('dio_quran_full', JSON.stringify(out)); } catch(_) {}
      _rebuildQueue();
    }
  } catch(e) {
    // Network failed — fallback to built-in selection
    if (!_quranPool.length) { _quranPool = _QURAN_FALLBACK.slice(); _rebuildQueue(); }
  }
}

function _loadCachedQuran() {
  try {
    const cached = JSON.parse(localStorage.getItem('dio_quran_full') || '[]');
    if (cached.length) _quranPool = cached;
  } catch(_) {}
}

// ── FALLBACK QURAN (used only if API unreachable) ─────────────
const _QURAN_FALLBACK = [
  '📖 وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ — صبر اور نماز سے مدد طلب کرو (البقرہ 2:45)',
  '📖 إِنَّ مَعَ الْعُسْرِ يُسْرًا — بے شک تکلیف کے ساتھ آسانی ہے (الانشراح 94:6)',
  '📖 وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا — جو اللہ سے ڈرے اللہ راستہ دیتا ہے (الطلاق 65:2)',
  '📖 إِنَّ اللَّهَ مَعَ الصَّابِرِينَ — اللہ صبر کرنے والوں کے ساتھ ہے (البقرہ 2:153)',
  '📖 وَتَوَكَّلْ عَلَى اللَّهِ — اللہ پر بھروسہ کرو (الاحزاب 33:3)',
  '📖 أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ — اللہ کی یاد سے دلوں کو سکون ملتا ہے (الرعد 13:28)',
  '📖 فَاذْكُرُونِي أَذْكُرْكُمْ — مجھے یاد کرو میں تمہیں یاد کروں گا (البقرہ 2:152)',
  '📖 إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ — اللہ کے نزدیک سب سے عزت والا سب سے زیادہ متقی ہے (الحجرات 49:13)',
  '📖 وَأَقِمِ الصَّلَاةَ لِذِكْرِي — نماز قائم کرو میری یاد کے لیے (طہٰ 20:14)',
  '📖 لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ — اللہ کی رحمت سے مایوس نہ ہو (الزمر 39:53)',
];

// ── UTIL ──────────────────────────────────────────────────────
function _shuffle(arr) {
  const a = [...arr];
  for (let i=a.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// ── LEGACY COMPAT ─────────────────────────────────────────────
function _startIslamicTicker() { initIslamicMessages(); }
function startNewsTicker()     { initIslamicMessages(); }
