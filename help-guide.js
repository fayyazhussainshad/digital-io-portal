/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — مدد و رہنمائی  (help-guide.js)
   Phase 4H — onboarding / help

   Naye afsar ke liye saada Urdu rehnumai. Purely additive page —
   koi maujooda code nahi badalta. Agar ye file load na ho to nav
   item khud-ba-khud "jald aa raha hai" dikha deta hai (safe).
   ═══════════════════════════════════════════════════════════════ */

registerPage('help', renderHelpGuide);

// ═══ v553: ٹول بار کے تمام بٹن — کون سا بٹن کیا کرتا ہے اور کیسے (افسر کی ہدایت) ═══
//   یہ فہرست اصل ایپ کے بٹنوں (عنوان/title) سے ملا کر لکھی گئی ہے۔ نیا بٹن آئے تو یہاں بھی لکھیں۔
//   ہر سطر: [بٹن / نشان، کیا کرتا ہے، کیسے استعمال کریں]
const HG_TOOLS = [
  { h: 'دستاویز کی اوپر والی پٹی (ہر کھلی دستاویز میں)',
    note: 'کرسر صفحے کے بالکل اوپری کنارے پر لے جائیں (موبائل پر صفحے کو ذرا واپس اوپر کی طرف scroll کریں) تو یہ پٹی سامنے آ جاتی ہے۔',
    rows: [
      ['واپس', 'پچھلی جگہ پر واپس', 'دبائیں — مقدمے کا صفحہ / پچھلا صفحہ کھل جاتا ہے۔'],
      ['مقدمہ نمبر', 'کون سا مقدمہ کھلا ہے', 'صرف دکھاتا ہے۔'],
      ['دستاویز کے ٹیب', 'کھلی دستاویزات کے درمیان آنا جانا', 'ٹیب دبائیں تو وہ دستاویز سامنے؛ ٹیب کے ✕ سے وہ ٹیب بند۔'],
      ['نئی دستاویز', 'اسی مقدمے کی کوئی اور دستاویز ساتھ کھولیں', 'دبائیں، فہرست سے دستاویز چنیں — موجودہ دستاویز بند نہیں ہوتی (نیا ٹیب بنتا ہے)۔'],
      ['محفوظ', 'کھلی دستاویز محفوظ / اپ ڈیٹ', 'دبائیں یا <bdi dir="ltr">Ctrl+S</bdi>۔ پرانی دستاویز میں ترمیم ہو تو وہی اپ ڈیٹ ہوتی ہے، نئی نہیں بنتی۔'],
      ['پرنٹ', 'دستاویز کی چھپائی', 'دبائیں یا <bdi dir="ltr">Ctrl+P</bdi> (دونوں کا نتیجہ ایک)۔ چالان، ضمنی، سزا سلپ اور درخواستوں میں کاغذ (<bdi dir="ltr">A4</bdi> / <bdi dir="ltr">Legal</bdi>) پرنٹ کے وقت پوچھا جاتا ہے اور تحریر اسی کاغذ کے مطابق خود ترتیب پاتی ہے۔'],
      ['شیئر', 'پوری دستاویز <bdi dir="ltr">PDF</bdi> / <bdi dir="ltr">Word</bdi> میں', 'دبائیں، پھر <bdi dir="ltr">PDF</bdi>، <bdi dir="ltr">Word</bdi> یا دونوں چنیں — جدول، سرخیاں اور تمام حروف بالکل پرنٹ جیسے۔ موبائل پر شیئر کی فہرست (WhatsApp وغیرہ) کھلتی ہے، کمپیوٹر پر فائل ڈاؤن لوڈ ہو جاتی ہے۔'],
    ] },
  { h: 'تحریر کی ٹول بار (چالان، ضمنی، سزا سلپ، درخواستیں، بریف اور دیگر تحریری دستاویزات)',
    note: 'جن بٹنوں پر «منتخب» لکھا ہے، ان میں پہلے متن کو ماؤس / انگلی سے منتخب کریں، پھر بٹن دبائیں۔',
    rows: [
      ['<b>B</b>', 'بولڈ (موٹا متن)', 'متن منتخب کر کے دبائیں — یا <bdi dir="ltr">Ctrl+B</bdi>۔ دوبارہ دبانے سے ہٹ جاتا ہے۔'],
      ['<i>I</i>', 'ترچھا متن', 'متن منتخب کر کے دبائیں — یا <bdi dir="ltr">Ctrl+I</bdi>۔'],
      ['<u>U</u>', 'انڈر لائن (نیچے لکیر)', 'متن منتخب کر کے دبائیں — یا <bdi dir="ltr">Ctrl+U</bdi>۔'],
      ['⇥ ⇔ ⇤ ☰', 'سیدھ: دائیں، درمیان، بائیں، دونوں طرف برابر', 'کرسر پیرا میں رکھ کر مطلوبہ بٹن دبائیں۔'],
      ['•', 'نقطہ دار فہرست', 'کرسر سطر میں رکھ کر دبائیں؛ ہر نئی سطر (Enter) پر نیا نقطہ۔'],
      ['1.', 'نمبر والی فہرست', 'کرسر سطر میں رکھ کر دبائیں؛ نمبر خود بڑھتے ہیں۔'],
      ['🧹 / ✕', 'فارمیٹنگ ہٹائیں', 'متن منتخب کر کے دبائیں — بولڈ، ترچھا، رنگ، سائز سب ہٹ کر سادہ متن رہ جاتا ہے۔'],
      ['🖌', 'فارمیٹ پینٹر (شکل نقل کریں)', 'پہلے اُس متن پر کلک کریں / منتخب کریں جس کی شکل نقل کرنی ہے، پھر 🖌 دبائیں، پھر جس متن پر لگانی ہے اسے منتخب کریں۔ چالان و ضمنی میں ایک کلک = ایک بار، ڈبل کلک = بار بار (<bdi dir="ltr">Esc</bdi> سے بند)۔'],
      ['فونٹ سائز (فہرست)', 'متن کا سائز <bdi dir="ltr">pt</bdi> میں', 'متن منتخب ہو تو صرف اسی کا سائز؛ کچھ منتخب نہ ہو تو پوری دستاویز کا (بریف وغیرہ میں: جس خانے میں کرسر ہو)۔ معیاری سائز <bdi dir="ltr">14pt</bdi> ہے۔'],
      ['A+ / A−', 'فونٹ ایک درجہ بڑا / چھوٹا', 'دبائیں — یا <bdi dir="ltr">Ctrl +</bdi> / <bdi dir="ltr">Ctrl −</bdi>۔'],
      ['↶ / ↷', 'واپس (<bdi dir="ltr">Undo</bdi>) / دوبارہ (<bdi dir="ltr">Redo</bdi>)', 'آخری تبدیلی واپس / دوبارہ — یا <bdi dir="ltr">Ctrl+Z</bdi> / <bdi dir="ltr">Ctrl+Y</bdi>۔'],
      ['؈ / EN', 'تحریر کا رُخ: اردو (دائیں سے بائیں) / English (بائیں سے دائیں)', 'کرسر پیرا میں رکھ کر دبائیں — صرف وہی پیرا بدلتا ہے، باقی دستاویز ویسی رہتی ہے۔'],
      ['🔎', 'ڈھونڈیں اور بدلیں', 'دبائیں (یا <bdi dir="ltr">Ctrl+F</bdi> / <bdi dir="ltr">Ctrl+H</bdi>)، لفظ لکھیں، نیا لفظ لکھیں، پھر «بدلیں» یا «سب بدلیں»۔'],
    ] },
  { h: 'ہر دستاویز کے اپنے بٹن',
    rows: [
      ['چالان — قسم کی فہرست', 'چالان کی قسم (مکمل، نامکمل، <bdi dir="ltr">512</bdi> ض ف، تتمہ وغیرہ)', 'فہرست سے قسم چنیں — اسی قسم کا خاکہ کھل جاتا ہے۔'],
      ['چالان — ورژن', '<bdi dir="ltr">FIR</bdi> یا کراس ورژن کا چالان', 'چنیں — دونوں الگ الگ چالان کے طور پر محفوظ ہوتے ہیں۔'],
      ['ضمنی — ← فہرست', 'اس مقدمے کی تمام ضمنیات کی فہرست', 'دبائیں — فہرست میں ہر ضمنی کے ساتھ ترمیم، پرنٹ، شیئر وغیرہ۔'],
      ['ضمنی — مرکزی / ذیلی ضمنی', 'ضمنی کی قسم؛ سرخی خود اسی کے مطابق', 'پہلے مرکزی، پھر ذیلی قسم چنیں؛ «➕ نئی قسم…» سے اپنی قسم بنائیں۔'],
      ['ضمنی — 💾 محفوظ / 🖨️ پرنٹ / 📤 شیئر', 'کھلی ضمنی محفوظ، پرنٹ یا <bdi dir="ltr">PDF</bdi> / <bdi dir="ltr">Word</bdi> میں شیئر', 'دبائیں — محفوظ کے بعد ضمنی کھلی رہتی ہے۔'],
      ['ضمنیات — + ضمنی درج کریں / 🖨️ تمام ضمنیاں', 'نئی ضمنی / تمام ضمنیات ایک ساتھ پرنٹ', 'دبائیں۔'],
      ['درخواستیں — قسم / ↺ خاکہ / فہرست', 'درخواست کی قسم؛ اسی قسم کا نیا خاکہ؛ محفوظ درخواستوں کی فہرست', 'قسم چنیں؛ «↺ خاکہ» موجودہ متن ہٹا کر نیا خاکہ لاتا ہے (پہلے تصدیق پوچھتا ہے)۔'],
      ['سزا سلپ — 📜 نسخے', 'اس سزا سلپ کے پرانے محفوظ نسخے', 'دبائیں — محفوظ شدہ پرانے نسخوں کی فہرست؛ «دیکھیں» سے پرانا نسخہ دیکھیں۔'],
      ['▾ (بنام / ملزمان)', 'اس مقدمے کے ملزمان کی فہرست', 'دبائیں، جن ملزمان پر نشان لگائیں اُن کے نام دستاویز کے «بنام» / ملزم والے خانے میں آ جاتے ہیں۔'],
      ['CDR — ← فہرست / تاحال / ملزم', 'تمام CDR درخواستیں؛ دوسری تاریخ کی جگہ «تاحال»؛ ملزم کا نام', 'دبائیں / فہرست سے چنیں۔ فہرست کی ہر سطر میں «کھولیں»، «🖨️ پرنٹ» اور «📤 شیئر»۔'],
      ['ایف آئی آر — + متن درج کریں / + فوٹو کاپی اپلوڈ کریں', 'متن ایف آئی آر لکھنا / ایف آئی آر کی نقل لگانا', 'دبائیں۔ ہر سطر میں ترمیم، دیکھیں، پرنٹ، شیئر اور حذف۔ لگی ہوئی فائل موبائل پر بھی کھلتی ہے۔'],
      ['ملزمان / گواہان — + ملزم درج کریں / + گواہ درج کریں', 'نیا ملزم / گواہ', 'دبائیں۔ ہر سطر میں ترمیم، «سابقہ ریکارڈ» (سسٹم کا اور درج کیا ہوا ریکارڈ یکجا، بغیر دہرائے) اور حذف۔'],
      ['مقدمات کی فہرست — اقدامات', 'کھولیں، ترمیم، پرنٹ، ڈاؤن لوڈ، شیئر، حذف', 'پرنٹ / ڈاؤن لوڈ / شیئر دبانے پر اس مقدمے کی تمام دستاویزات کی فہرست کھلتی ہے — جن کا پرنٹ / فائل چاہیے انہیں منتخب کریں۔'],
      ['لگی ہوئی فائل — پرنٹ / شیئر / محفوظ', 'تصویر، <bdi dir="ltr">PDF</bdi> یا <bdi dir="ltr">Word</bdi> فائل', '«شیئر»: اصل فائل (تصویر ہو تو <bdi dir="ltr">PDF</bdi> / <bdi dir="ltr">Word</bdi> بھی)؛ «محفوظ»: فائل ڈاؤن لوڈ۔'],
    ] },
  { h: 'نقشہ موقع کی ٹول بار',
    note: 'نقشہ موقع کا چِپ دبانے پر پہلے محفوظ نقشوں کی فہرست (قسم، ملزم، تاریخ، وقت) کھلتی ہے؛ اوپر دائیں «+ نقشہ موقع درج کریں»۔ فہرست کی ہر سطر میں ترمیم، پرنٹ (سیدھا پرنٹ)، ڈاؤن لوڈ (<bdi dir="ltr">PDF</bdi>)، کاپی اور حذف۔',
    rows: [
      ['← فہرست', 'اس مقدمے کے تمام محفوظ نقشے', 'دبائیں۔'],
      ['↖', 'منتخب / حرکت', 'کسی چیز پر کلک کر کے کھینچیں، کونوں سے چھوٹا بڑا کریں۔'],
      ['✏️', 'قلم (آزاد ڈرائنگ)', 'دبائیں، پھر نقشے پر ہاتھ سے لکیر کھینچیں۔'],
      ['╱ / ➜', 'لکیر / تیر', 'دبائیں، پھر شروع سے آخر تک کھینچیں۔ <bdi dir="ltr">Ctrl</bdi> (یا <bdi dir="ltr">Shift</bdi>) دبا کر کھینچیں تو لکیر سیدھی (<bdi dir="ltr">0° / 45° / 90°</bdi>) رہتی ہے۔'],
      ['▭ / ◯', 'مستطیل / دائرہ', 'دبائیں، پھر نقشے پر کھینچیں۔'],
      ['📏', 'سیدھی لکیر کا بٹن', 'موبائل پر (جہاں <bdi dir="ltr">Ctrl</bdi> نہیں) یہ دبائیں — ہر لکیر سیدھی بنے گی؛ دوبارہ دبانے سے بند۔'],
      ['🚔', 'پولیس علامات (لاش، اسلحہ، گاڑی…)', 'دبائیں، علامت چنیں — نقشے پر آ جاتی ہے۔'],
      ['①', 'امتیازی نشان', 'دبائیں — ①②③ نشان لگتا ہے اور نیچے «امتیازی نشانات» کی فہرست خود بنتی ہے۔'],
      ['رنگ / موٹائی', 'لکیر کا رنگ اور موٹائی', 'رنگ چنیں / موٹائی (<bdi dir="ltr">1–8px</bdi>) چنیں۔'],
      ['🖼️ / 🔁', 'تصویر داخل کریں / منتخب تصویر بدلیں', 'دبائیں اور فائل چنیں۔'],
      ['🅣', 'متن کا خانہ', 'دبائیں — نقشے پر لکھنے کا خانہ؛ «متن سائز» سے سائز (<bdi dir="ltr">pt</bdi>)۔'],
      ['⟲ / ⟳', 'منتخب چیز بائیں / دائیں <bdi dir="ltr">90°</bdi> گھمائیں', 'چیز منتخب کر کے دبائیں۔'],
      ['⇋ / ⇅', 'افقی / عمودی پلٹ', 'چیز منتخب کر کے دبائیں۔'],
      ['✂️', 'کراپ (تصویر کاٹیں)', 'تصویر منتخب کر کے دبائیں، رکھنے والا حصہ چنیں۔'],
      ['⧉ / 📋 / 🗑️', 'کاپی / چسپاں / حذف', 'چیز منتخب کر کے دبائیں۔'],
      ['⬆️ / ⬇️', 'آگے / پیچھے (اوپر نیچے کی تہہ)', 'چیز منتخب کر کے دبائیں۔'],
      ['↶ / ↷', 'واپس / دوبارہ', 'دبائیں — یا <bdi dir="ltr">Ctrl+Z</bdi> / <bdi dir="ltr">Ctrl+Y</bdi>۔'],
      ['✋ / ＋ / － / 1:1', 'پین (نقشہ کھسکائیں)، زوم اِن، زوم آؤٹ، اصل سائز', 'دبائیں۔'],
      ['📐 … انچ', 'نقشے کی جگہ (عنوان اور امتیازی نشانات کے درمیان) — ساتھ پیمانہ (ruler) بتاتا ہے کتنا صفحہ باقی ہے', 'انچ میں اونچائی لکھیں (یا نقشے کی جگہ کا نیچے والا کنارہ کھینچیں) — ساتھ «صفحہ 1 میں باقی» جگہ خود بدلتی ہے؛ کاغذ کے ساتھ عمودی پیمانہ (انچ) اور صفحہ 1 کے اختتام کی لکیر چھپائی میں نظر نہیں آتی۔'],
      ['⤓ صفحہ', 'نقشے کی جگہ پورے باقی صفحے کے برابر', 'دبائیں۔'],
      ['💾 محفوظ / 🖨️', 'نقشہ محفوظ / چھپائی', 'دبائیں — یا <bdi dir="ltr">Ctrl+S</bdi> / <bdi dir="ltr">Ctrl+P</bdi>۔'],
    ] },
  { h: 'چھپی ہوئی کلیدیں (MS Word کی طرح — کوئی ٹول بار نہیں)',
    note: 'یہ کلیدیں پورے سسٹم میں ہر تحریر پر چلتی ہیں؛ محفوظ کرنے پر ترمیم کے مطابق محفوظ ہوتا ہے۔',
    rows: [
      ['<bdi dir="ltr">Ctrl+A</bdi>', 'سب منتخب', 'خانے میں کرسر رکھ کر دبائیں۔'],
      ['<bdi dir="ltr">Ctrl+C / Ctrl+X / Ctrl+V</bdi>', 'کاپی / کاٹیں / چسپاں', 'متن منتخب کر کے۔'],
      ['<bdi dir="ltr">Ctrl+B / Ctrl+I / Ctrl+U</bdi>', 'بولڈ / ترچھا / انڈر لائن', 'متن منتخب کر کے۔'],
      ['<bdi dir="ltr">Ctrl+Z / Ctrl+Y</bdi>', 'واپس / دوبارہ', '—'],
      ['<bdi dir="ltr">Ctrl+F / Ctrl+H</bdi>', 'ڈھونڈیں / ڈھونڈیں اور بدلیں (سب بدلیں سمیت)', 'کسی بھی کھلی دستاویز میں۔'],
      ['<bdi dir="ltr">Ctrl + / Ctrl −</bdi>', 'فونٹ بڑا / چھوٹا', 'متن منتخب ہو تو اسی کا۔'],
      ['<bdi dir="ltr">Ctrl+S</bdi>', 'کھلی دستاویز / فارم محفوظ', 'براؤزر کا «صفحہ محفوظ کریں» نہیں کھلتا۔'],
      ['<bdi dir="ltr">Ctrl+P</bdi>', 'پرنٹ — بالکل «پرنٹ» بٹن جیسا', '—'],
      ['<bdi dir="ltr">Tab / Shift+Tab</bdi>', 'تحریر میں خالی جگہ / واپس', 'چھوٹے ایک سطر والے خانوں میں Tab اگلے خانے پر جاتا ہے۔'],
      ['دو کلک / کھینچنا', 'لفظ منتخب / منتخب متن کو کھینچ کر دوسری جگہ لے جانا', '—'],
    ] },
];

function _hgToolsHtml(forPrint) {
  return HG_TOOLS.map((g, gi) => {
    const tbl = `<table class="hg-tt"><thead><tr><th style="width:24%;">بٹن</th><th style="width:30%;">کیا کرتا ہے</th><th>کیسے</th></tr></thead><tbody>` +
      g.rows.map(r => `<tr><td class="hg-b">${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('') + `</tbody></table>`;
    const note = g.note ? `<div class="hg-note">${g.note}</div>` : '';
    if (forPrint) return `<h2>${gi + 1}۔ ${g.h}</h2>${note}${tbl}`;
    return `<details class="hg-grp"${gi === 0 ? ' open' : ''}><summary class="dio-hs3">${gi + 1}۔ ${g.h} <small>(${g.rows.length})</small></summary>${note}${tbl}</details>`;
  }).join('');
}

// پرنٹ / شیئر — 14pt، یکساں سطری فاصلہ
function _hgPrintTools() {
  const html = `<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title> </title>
    ${typeof dioFontHead === 'function' ? dioFontHead() : ''}
    <style>@page{size:A4;margin:14mm 12mm;}*{box-sizing:border-box;}
      body{margin:0;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;color:#000;font-size:14pt;line-height:1.9;}
      h1{text-align:center;font-size:20pt;margin:0 0 6pt;line-height:1.9;}
      h2{font-size:16pt;margin:12pt 0 4pt;line-height:1.9;break-after:avoid;}
      .hg-note{font-size:12pt;color:#333;margin:0 0 6pt;}
      table{width:100%;border-collapse:collapse;}th,td{border:1pt solid #000;padding:3pt 6pt;vertical-align:top;text-align:right;}
      th{background:#eee;}tr{break-inside:avoid;}.hg-b{white-space:nowrap;}bdi{unicode-bidi:isolate;}
    </style></head><body><h1>ٹول بار کے بٹن — کون سا بٹن کیا کرتا ہے اور کیسے</h1>${_hgToolsHtml(true)}</body></html>`;
  if (typeof dioPrint === 'function') dioPrint(html);
}
window._hgPrintTools = _hgPrintTools;

function renderHelpGuide(container) {
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const name = o.full_name || 'افسر صاحب';

  // Har section: { icon, title, body(HTML) }. Body plain, saaf Urdu.
  const sections = [
    { icon:'<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/></svg>', title:'نیا مقدمہ کیسے بنائیں',
      body:`بائیں مینو سے <b>«میرے مقدمات»</b> کھولیں، پھر <b>«+ مقدمہ درج کریں»</b> کا بٹن دبائیں۔
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
      <div class="dio-hs2" style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:10px;">جلدی شروع کریں</div>
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

    <!-- v553: ٹول بار کے تمام بٹن -->
    <div class="card hg-tools" style="margin-bottom:16px;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <div class="dio-hs2" style="font-size:14px;font-weight:700;color:var(--accent);flex:1;min-width:180px;">ٹول بار کے بٹن — کون سا بٹن کیا کرتا ہے اور کیسے</div>
        <button class="btn btn-secondary btn-sm" onclick="_hgPrintTools()" title="یہ فہرست پرنٹ کریں">پرنٹ</button>
        <button class="btn btn-secondary btn-sm" onclick="dioSharePrint(()=>_hgPrintTools(),'ٹول بار کے بٹن')" title="یہ فہرست شیئر کریں — PDF / Word">شیئر</button>
      </div>
      ${_hgToolsHtml(false)}
    </div>
    <style>
      .hg-tools .hg-grp{border:1px solid var(--border);border-radius:10px;margin-top:8px;overflow:hidden;background:var(--bg-card);}
      .hg-tools .hg-grp > summary{cursor:pointer;padding:10px 12px;font-weight:700;color:var(--text-primary);background:var(--bg-secondary);list-style-position:inside;}
      .hg-tools .hg-grp > summary small{color:var(--text-muted);font-weight:400;}
      .hg-tools .hg-note{color:var(--text-secondary);line-height:2;padding:8px 12px 0;}
      .hg-tools table.hg-tt{width:100%;border-collapse:collapse;line-height:1.9;margin:8px 0 4px;}
      .hg-tools table.hg-tt th,.hg-tools table.hg-tt td{border-top:1px solid var(--border);padding:6px 10px;text-align:right;vertical-align:top;color:var(--text-primary);}
      .hg-tools table.hg-tt th{color:var(--text-muted);font-weight:700;background:var(--bg-secondary);}
      .hg-tools table.hg-tt td.hg-b{font-weight:700;white-space:nowrap;}
      .hg-tools bdi{unicode-bidi:isolate;}
      @media (max-width:640px){
        .hg-tools table.hg-tt thead{display:none;}
        .hg-tools table.hg-tt, .hg-tools table.hg-tt tbody, .hg-tools table.hg-tt tr, .hg-tools table.hg-tt td{display:block;width:100% !important;}
        .hg-tools table.hg-tt tr{border-top:1px solid var(--border);padding:6px 0;}
        .hg-tools table.hg-tt td{border:0;padding:2px 12px;}
        .hg-tools table.hg-tt td.hg-b{white-space:normal;color:var(--accent);}
      }
    </style>

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
