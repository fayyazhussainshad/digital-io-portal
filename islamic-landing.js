/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — لینڈنگ (لاگ اِن) صفحے پر قرآن و حدیث  — islamic-landing.js
   افسر کی ہدایت (اکتوبر 2026):
     • اسلامی پٹی سسٹم کے اندر (ڈیش بورڈ) سے ہٹا کر صرف لینڈنگ صفحے پر۔
     • صرف قرآنِ مجید اور احادیثِ مبارکہ — (22 اکتوبر 2026 کی ہدایت) سب درود پاک سے متعلق۔
     • (22 اکتوبر 2026) ہر بار صفحہ کھلنے پر نئی آیت / حدیث — پہلے تاریخ سے شروع ہوتا تھا،
       اس لیے سارا دن ایک ہی حدیث نظر آتی تھی۔ اب ہر آلے پر ملی جلی ترتیب (deck) محفوظ رہتی
       ہے: جب تک سب نظر نہ آ جائیں کوئی دوبارہ نہیں آتی، اور ہر کھلنے پر اگلی۔
     • بدلنے کا وقفہ 15 سیکنڈ (پہلے 30)۔
     • عربی متن بہترین اسلامی عربی فونٹ میں: آیات «Amiri Quran»، احادیث «Amiri»
       (دونوں خود میزبان، OFL — fonts/)؛ اردو ترجمہ «Jameel Noori Nastaleeq» میں۔

   ⚠ ماخذ — کوئی لفظ ہاتھ سے نہیں لکھا گیا، سب ماخذ سے لفظ بہ لفظ نقل:
     • آیات کا عربی متن: quran-json 3.1.2 (عثمانی رسم الخط — The Noble Qur'an Encyclopedia)
     • آیات کا اردو ترجمہ: مولانا سید ابوالاعلیٰ مودودیؒ (تفہیم القرآن — tanzil.net ur.maududi)
     • احادیث کا عربی متن اور اردو ترجمہ: fawazahmed0/hadith-api (ara-/urd- بخاری، مسلم، ترمذی)؛
       حدیث نمبر معیاری (بخاری/ترمذی: معروف نمبر، مسلم: فواد عبدالباقی نمبر)۔
       ترمذی کی صرف وہ احادیث لی گئیں جنہیں شیخ البانی نے صحیح/حسن کہا۔
       (اکتوبر 2026) ابو داؤد / نسائی بھی اسی ماخذ سے (ara-/urd- abudawud، nasai) — شیخ البانی:
       نسائی 1282، 1297 صحیح · ابو داؤد 1531، 2042 صحیح · ابو داؤد 2041 حسن · ترمذی 3545 حسن صحیح۔
       صرف حدیث کا متن (قولِ رسول ﷺ) دکھایا جاتا ہے، سند نہیں۔ جہاں حدیث کا
       صرف ابتدائی حصہ لیا گیا ہے وہاں آخر میں «…» ہے۔ درودِ ابراہیمی (بخاری 3370) مکمل ہے
       مگر پڑھنے کے قابل سائز کے لیے دو حصوں (1/2، 2/2) میں لگاتار دکھایا جاتا ہے۔
   مزید مواد شامل کرنا ہو تو اسی طرح کسی مستند ماخذ سے نقل کریں — ہاتھ سے نہ لکھیں۔
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // k: 'q' = قرآن، 'h' = حدیث · a: عربی · u: اردو ترجمہ · r: حوالہ
  var ITEMS = [
  { k:"q", a:"إِنَّ ٱللَّهَ وَمَلَـٰٓئِكَتَهُۥ يُصَلُّونَ عَلَى ٱلنَّبِيِّۚ يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُواْ صَلُّواْ عَلَيۡهِ وَسَلِّمُواْ تَسۡلِيمًا ۝٥٦", u:"اللہ اور اس کے ملائکہ نبیؐ پر درود بھیجتے ہیں، اے لوگو جو ایمان لائے ہو، تم بھی ان پر درود و سلام بھیجو", r:"الاحزاب 33:56" },
  { k:"h", a:"مَنْ صَلَّى عَلَىَّ وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرًا", u:"جس نے مجھ پر ایک بار درود بھیجا اللہ تعالیٰ اس پر دس بار رحمت نازل فرمائے گا", r:"صحیح مسلم 408" },
  { k:"h", a:"مَنْ صَلَّى عَلَىَّ صَلاَةً وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ عَشْرَ صَلَوَاتٍ وَحُطَّتْ عَنْهُ عَشْرُ خَطِيئَاتٍ وَرُفِعَتْ لَهُ عَشْرُ دَرَجَاتٍ", u:"جو شخص میرے اوپر ایک بار صلاۃ ( درود و رحمت ) بھیجے گا، تو اللہ اس پر دس بار صلاۃ ( درود و رحمت ) بھیجے گا، اور اس کے دس گناہ معاف اور دس درجے بلند کر دیئے جائیں گے", r:"سنن نسائی 1297" },
  { k:"h", a:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ، وَعَلَى آلِ مُحَمَّدٍ، كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ،", u:"اے اللہ! اپنی رحمت نازل فرما محمد صلی اللہ علیہ وسلم پر اور آل محمد صلی اللہ علیہ وسلم پر جیسا کہ تو نے اپنی رحمت نازل فرمائی ابراہیم پر اور آل ابراہیم علیہ السلام پر۔ بیشک تو بڑی خوبیوں والا اور بزرگی والا ہے۔", r:"صحیح بخاری 3370 (1/2)", g:"b3370" },
  { k:"h", a:"اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ، وَعَلَى آلِ مُحَمَّدٍ، كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ، وَعَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ", u:"اے اللہ! برکت نازل فرما محمد پر اور آل محمد پر جیسا کہ تو نے برکت نازل فرمائی ابراہیم پر اور آل ابراہیم پر۔ بیشک تو بڑی خوبیوں والا اور بڑی عظمت والا ہے", r:"صحیح بخاری 3370 (2/2)", g:"b3370" },
  { k:"h", a:"إِنَّ مِنْ أَفْضَلِ أَيَّامِكُمْ يَوْمَ الْجُمُعَةِ فَأَكْثِرُوا عَلَىَّ مِنَ الصَّلاَةِ فِيهِ فَإِنَّ صَلاَتَكُمْ مَعْرُوضَةٌ عَلَىَّ …", u:"جمعہ کا دن تمہارے بہترین دنوں میں سے ہے، لہٰذا اس دن میرے اوپر کثرت سے درود ( صلاۃ ) بھیجا کرو، اس لیے کہ تمہارے درود مجھ پر پیش کئے جاتے ہیں …", r:"سنن ابو داؤد 1531" },
  { k:"h", a:"الْبَخِيلُ الَّذِي مَنْ ذُكِرْتُ عِنْدَهُ فَلَمْ يُصَلِّ عَلَىَّ", u:"بخیل وہ ہے جس کے سامنے میرا ذکر کیا جائے اور پھر بھی وہ مجھ پر صلاۃ (درود) نہ بھیجے", r:"جامع ترمذی 3546" },
  { k:"h", a:"إِنَّ لِلَّهِ مَلاَئِكَةً سَيَّاحِينَ فِي الأَرْضِ يُبَلِّغُونِي مِنْ أُمَّتِي السَّلاَمَ", u:"اللہ تعالیٰ کے کچھ فرشتے ہیں جو زمین میں گھومتے رہتے ہیں، وہ مجھ تک میرے امتیوں کا سلام پہنچاتے ہیں", r:"سنن نسائی 1282" },
  { k:"q", a:"هُوَ ٱلَّذِي يُصَلِّي عَلَيۡكُمۡ وَمَلَـٰٓئِكَتُهُۥ لِيُخۡرِجَكُم مِّنَ ٱلظُّلُمَٰتِ إِلَى ٱلنُّورِۚ وَكَانَ بِٱلۡمُؤۡمِنِينَ رَحِيمٗا ۝٤٣", u:"وہی ہے جو تم پر رحمت فرماتا ہے اور اس کے ملائکہ تمہارے لیے دعائے رحمت کرتے ہیں تاکہ وہ تمہیں تاریکیوں سے روشنی میں نکال لائے، وہ مومنوں پر بہت مہربان ہے", r:"الاحزاب 33:43" },
  { k:"h", a:"اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَأَزْوَاجِهِ وَذُرِّيَّتِهِ، كَمَا صَلَّيْتَ عَلَى آلِ إِبْرَاهِيمَ، وَبَارِكْ عَلَى مُحَمَّدٍ وَأَزْوَاجِهِ وَذُرِّيَّتِهِ، كَمَا بَارَكْتَ عَلَى آلِ إِبْرَاهِيمَ، إِنَّكَ حَمِيدٌ مَجِيدٌ", u:"اے اللہ! رحمت نازل فرما محمد پر اور ان کی بیویوں پر اور ان کی اولاد پر جیسا کہ تو نے رحمت نازل فرمائی ابراہیم پر اور اپنی برکت نازل فرما محمد پر اور ان کی بیویوں اور اولاد پر جیسا کہ تو نے برکت نازل فرمائی آل ابراہیم پر۔ بیشک تو انتہائی خوبیوں والا اور عظمت والا ہے۔", r:"صحیح بخاری 3369" },
  { k:"h", a:"لاَ تَجْعَلُوا بُيُوتَكُمْ قُبُورًا وَلاَ تَجْعَلُوا قَبْرِي عِيدًا وَصَلُّوا عَلَىَّ فَإِنَّ صَلاَتَكُمْ تَبْلُغُنِي حَيْثُ كُنْتُمْ", u:"اپنے گھروں کو قبرستان نہ بناؤ اور میری قبر کو میلا نہ بناؤ ( کہ سب لوگ وہاں اکٹھا ہوں ) ، اور میرے اوپر درود بھیجا کرو کیونکہ تم جہاں بھی رہو گے تمہارا درود مجھے پہنچایا جائے گا", r:"سنن ابو داؤد 2042" },
  { k:"h", a:"رَغِمَ أَنْفُ رَجُلٍ ذُكِرْتُ عِنْدَهُ فَلَمْ يُصَلِّ عَلَىَّ …", u:"اس شخص کی ناک خاک آلود ہو جس کے پاس میرا ذکر کیا جائے اور وہ شخص مجھ پر درود نہ بھیجے …", r:"جامع ترمذی 3545" },
  { k:"h", a:"مَا مِنْ أَحَدٍ يُسَلِّمُ عَلَىَّ إِلاَّ رَدَّ اللَّهُ عَلَىَّ رُوحِي حَتَّى أَرُدَّ عَلَيْهِ السَّلاَمَ", u:"مجھ پر جب بھی کوئی سلام بھیجتا ہے تو اللہ تعالیٰ میری روح مجھے لوٹا دیتا ہے یہاں تک کہ میں اس کے سلام کا جواب دیتا ہوں", r:"سنن ابو داؤد 2041" }
  ];

  var HOLD_MS = 15000;          // ہر آیت/حدیث 15 سیکنڈ (22 اکتوبر 2026 — پہلے 30)
  var idx = -1, timer = null;
  var DECK_KEY = 'dio_zikr_deck_v2';

  // ── ملی جلی ترتیب (deck) — ہر کھلنے پر اگلی، سب دیکھے بغیر کوئی دوبارہ نہیں ──
  //    گروپ (g) والے آئٹم (درودِ ابراہیمی 1/2، 2/2) ہمیشہ ساتھ اور ترتیب سے۔
  function groups() {
    var out = [], byG = {};
    ITEMS.forEach(function (it, i) {
      if (it.g) { if (byG[it.g]) { byG[it.g].push(i); return; } byG[it.g] = [i]; out.push(byG[it.g]); }
      else out.push([i]);
    });
    return out;
  }
  function shuffled(avoidFirst) {
    var g = groups();
    for (var i = g.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)); var t = g[i]; g[i] = g[j]; g[j] = t;
    }
    // پچھلی بار والی آخری چیز نئی ترتیب میں پہلی نہ ہو (لگاتار دو بار ایک ہی نہیں)
    if (g.length > 1 && avoidFirst != null && g[0].indexOf(avoidFirst) >= 0) { var x = g[0]; g[0] = g[1]; g[1] = x; }
    return [].concat.apply([], g);
  }
  function loadDeck() {
    try {
      var d = JSON.parse(localStorage.getItem(DECK_KEY) || 'null');
      if (d && Array.isArray(d.order) && d.order.length === ITEMS.length && typeof d.pos === 'number') return d;
    } catch (_) { /* storage بند — ہر بار نئی ترتیب */ }
    return null;
  }
  function saveDeck(d) { try { localStorage.setItem(DECK_KEY, JSON.stringify(d)); } catch (_) { /* storage بند */ } }
  var deck = null;
  function nextIndex() {
    if (!deck) deck = loadDeck();
    if (!deck || deck.pos >= deck.order.length) {
      var last = (deck && deck.order.length) ? deck.order[deck.order.length - 1] : null;
      deck = { order: shuffled(last), pos: 0 };
    }
    var i = deck.order[deck.pos];
    deck.pos += 1;
    saveDeck(deck);
    return i;
  }

  function el(id) { return document.getElementById(id); }

  function loginVisible() {
    var ls = el('login-screen');
    if (!ls) return false;
    try { return getComputedStyle(ls).display !== 'none'; } catch (_) { return true; }
  }

  function render(i) {
    var box = el('dio-zikr');
    if (!box) return;
    var it = ITEMS[i];
    var kind = el('dio-zikr-kind'), ar = el('dio-zikr-ar'), ur = el('dio-zikr-ur'), ref = el('dio-zikr-ref');
    box.classList.add('is-fading');
    setTimeout(function () {
      box.setAttribute('data-kind', it.k);
      if (kind) kind.textContent = (it.k === 'q') ? 'قرآنِ مجید' : 'حدیثِ مبارکہ';
      if (ar) ar.textContent = it.a;
      if (ur) ur.textContent = it.u;
      if (ref) ref.textContent = it.r;
      fit();
      box.classList.remove('is-fading');
    }, 220);
  }

  // خانے کی اونچائی مقرر ہے؛ لمبا متن ہو تو حروف تھوڑے چھوٹے کر کے پورا متن اسی میں
  // (کوئی لفظ کٹے یا چھپے نہیں، اور ہر 30 سیکنڈ بعد صفحہ اوپر نیچے نہ ہو)
  function fit() {
    var box = el('dio-zikr');
    if (!box) return;
    var zk = 1;
    box.style.setProperty('--zk', '1');
    for (var n = 0; n < 12 && box.scrollHeight > box.clientHeight + 1 && zk > 0.56; n++) {
      zk = Math.round((zk - 0.04) * 100) / 100;
      box.style.setProperty('--zk', String(zk));
    }
  }

  function next() {
    // لاگ اِن ہو جانے کے بعد ٹائمر بند (سسٹم کے اندر یہ پٹی نہیں)
    if (!el('dio-zikr') || !loginVisible()) { stop(); return; }
    idx = nextIndex();
    render(idx);
  }

  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function start() {
    if (!el('dio-zikr')) return;
    stop();
    // ہر بار صفحہ کھلنے پر deck کی اگلی (پچھلی بار والی نہیں)
    next();
    timer = setInterval(next, HOLD_MS);
  }

  // لاگ آؤٹ پر لینڈنگ صفحہ دوبارہ آئے تو پٹی پھر چلے
  function watchLogin() {
    var ls = el('login-screen');
    if (!ls || typeof MutationObserver !== 'function') return;
    new MutationObserver(function () {
      if (loginVisible()) { if (!timer) start(); fitLandSoon(); } else stop();
    }).observe(ls, { attributes: true, attributeFilter: ['style'] });
  }

  // ═══ v552: لینڈنگ صفحہ ڈیسک ٹاپ کی سکرین میں پورا — بغیر scroll ═══
  //  لیپ ٹاپ پر براؤزر کی پٹیوں کے بعد اونچائی اکثر 600–730px رہ جاتی ہے، جبکہ
  //  کارڈ ~736px کا تھا — نیچے کا قانونی اعلان چھپ جاتا اور scroll کرنا پڑتا۔
  //  اب کارڈ کی اصل اونچائی ناپ کر، ضرورت ہو تو پورا کارڈ اسی تناسب سے چھوٹا
  //  (CSS zoom) — ترتیب، فونٹ کا تناسب اور شکل وہی۔ موبائل پر نہیں (وہاں scroll قدرتی)۔
  function fitLand() {
    var ls = el('login-screen');
    if (!ls || !loginVisible()) return;
    var land = ls.querySelector('.dio-land');
    if (!land) return;
    land.style.zoom = '';
    if (window.innerWidth < 861) { ls.classList.remove('dio-land-fit'); return; }
    var cs = getComputedStyle(ls);
    var pad = (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
    var avail = window.innerHeight - pad - 2;
    var r = land.getBoundingClientRect();
    var need = r.height;
    if (need > avail && need > 0) {
      var z = Math.max(0.6, Math.floor((avail / need) * 1000) / 1000);
      land.style.zoom = String(z);
    } else if (need > 0 && r.width > 0) {
      // بڑی سکرین (مثلاً 1920×1080): کارڈ چھوٹا سا بیچ میں نہ رہے — تھوڑا بڑا (زیادہ سے زیادہ 1.15)
      var up = Math.min(1.15, avail / need, (window.innerWidth - 64) / r.width);
      if (up > 1.03) land.style.zoom = String(Math.floor(up * 1000) / 1000);
    }
    ls.classList.add('dio-land-fit');
  }
  var _fitT = null;
  function fitLandSoon() { clearTimeout(_fitT); _fitT = setTimeout(fitLand, 60); }

  // فونٹ دیر سے لوڈ ہو یا اسکرین گھومے/بدلے تو دوبارہ ناپ
  try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fit(); fitLand(); }); } catch (_) { /* ikhtiyari */ }
  window.addEventListener('resize', function () { if (timer) fit(); fitLandSoon(); });
  window.addEventListener('load', function () { setTimeout(fitLand, 50); setTimeout(fitLand, 800); });

  window.DIOZikr = { items: ITEMS, holdMs: HOLD_MS, start: start, stop: stop, next: next, fit: fit, fitLand: fitLand };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { start(); watchLogin(); });
  } else { start(); watchLogin(); }
})();
