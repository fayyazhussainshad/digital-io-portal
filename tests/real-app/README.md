# اصل ایپ کی جانچ (Real-app test) — live سے پہلے لازمی

ASI کا اصول: کوئی تبدیلی live نہیں جاتی جب تک **اصل ایپ** (index.html + تمام
اصل scripts اور CSS) Desktop اور Mobile دونوں پر، اور Ctrl+P / «پرنٹ» بٹن دونوں
سے، جانچ نہ لی جائے۔ یہاں صرف Supabase کی جگہ آزمائشی ڈیٹا (`mock-supabase.js`) ہے؛
باقی سب کچھ بالکل وہی جو افسر کے آلے پر چلتا ہے۔

## اصل ایپ کی جانچیں

| فائل | کیا جانچتی ہے |
|---|---|
| `real_test.py` | واقعاتی رپورٹ: A4 پرنٹ (Ctrl+P = پرنٹ بٹن، pixel تک)، فہرست سے پرنٹ، نام بدلنا، کاپی، شیئر، ترمیم، حذف — Desktop + Mobile |
| `gasht_test.py` | (v548) گشت لاگ: Dashboard، «نیا اندراج» hub، نیا گشت (نظام سے ڈیٹا، عنوانات 20/16/14pt)، اندراج کارڈ (وقت/GPS خود، موبائل 0000-0000000)، خود محفوظ، ترمیم، گشت ختم، Ctrl+P = پرنٹ بٹن (pixel)، لمبی رپورٹ اگلے صفحے پر، تلاش، کاپی، سرور کی روک، حذف/بحالی، sql/104 سے پہلے، آف لائن، میعاد ختم — Desktop + Mobile |
| `core_test.py` | (v547) مقدمہ: نیا اندراج، ترمیم، خودکار یاددہانیاں · مقدمہ / یاددہانی / پیشی کا حذف صرف «حذف شدہ مواد» میں نقل کے بعد · بحالی · مثل کی دستاویز: محفوظ، سرور پر ریکارڈ نہ ہو تو نیا، رد ہو تو صاف ناکامی، پرنٹ · ملزم کے سابقہ ریکارڈ کا لیبل · سرکاری گاڑی آف لائن (دو بار محفوظ = ایک قطار) · 5-C آف لائن قطار · مشتبہ / ٹیمپلیٹ / 5-C / شیئر میں سرور کی روک پر جھوٹی کامیابی نہیں — Desktop + Mobile |

ہر جانچ ناکامی پر exit code 1 دیتی ہے (GitHub Actions میں PR رک جاتا ہے)۔

## چلانا
```bash
cd tests/real-app
mkdir -p .deps/fontpkg .deps/jameel .deps/purify
(cd .deps/fontpkg && npm pack @fontsource/noto-nastaliq-urdu && tar xzf *.tgz)
(cd .deps/jameel && npm pack jameel-noori@1.1.2 && tar xzf *.tgz)   # ایپ کا اصل فونٹ
(cd .deps/purify && npm pack dompurify@3.1.6 && tar xzf *.tgz)
(cd ../.. && python3 -m http.server 8770 &)      # ریپو کی جڑ سے
python3 real_test.py                               # Python Playwright درکار
python3 core_test.py
python3 gasht_test.py
```
نتیجہ: ہر جانچ PASS/FAIL، اور `out/` میں سکرین اور A4 پرنٹ کی تصاویر/PDF۔

## سرور کی ناکامی کی نقل (`mock-supabase.js`)
اصل Supabase کی طرح غلطی پھینکی نہیں جاتی، `{ error }` لوٹتا ہے:
- `window.__opts.fail = ['recycle_bin:insert']` — سرور کا رد (RLS، code `42501`)۔
  `window.__opts.failCode = '57014'` دیں تو عارضی غلطی (دوبارہ کوشش والی)۔
- `window.__opts.silent = ['reminders:delete']` — RLS کی **خاموش** روک: کوئی غلطی
  نہیں، مگر 0 قطار بدلی (مثلاً میعاد ختم ہونے پر)۔ یہی وہ صورت تھی جس میں پہلے
  «محفوظ / حذف ہو گیا» کا جھوٹا پیغام آتا تھا۔
- `delete().select()` اصل PostgREST کی طرح حذف شدہ قطاریں لوٹاتا ہے۔
- `window.__opts.noTable = ['gasht_logs']` — table ابھی بنی ہی نہیں (sql چلنے سے پہلے؛ PostgREST کا `PGRST205`)۔

## فونٹ
ایپ اردو کے لیے «Jameel Noori Nastaleeq» (npm: `jameel-noori`, jsdelivr سے) استعمال کرتی ہے — افسر کے آلے پر کاغذ
اسی فونٹ میں بنتا اور چھپتا ہے، اس لیے جانچ بھی اسی میں ہوتی ہے (`.deps/jameel`)۔ یہ فائل نہ ہو تو جانچ اسی نام سے
Noto Nastaliq چلاتی ہے (یعنی وہ صورت جب Jameel ابھی ڈاؤن لوڈ نہ ہوا ہو)؛ `DIO_JAMEEL=/nonexistent` دے کر یہ صورت
جان بوجھ کر بھی جانچی جا سکتی ہے۔ نوٹ: Jameel کا اردو متن PDF سے (`pdftotext`) درست نہیں نکلتا — PDF کی جانچ
انگریزی نشانوں (ASI، SHO، تاریخ، موبائل نمبر) یا تصویر سے کی جاتی ہے۔

## نوٹ
- `page.emulate_media('screen')` کے بعد `page.pdf` سکرین چھاپتا ہے — اسی لیے
  ناپ کے بعد ہمیشہ `emulate_media(media='null')`۔
- `page.evaluate("… = function(){…}")` کا آخری نتیجہ function ہو تو Playwright
  اسے **چلا دیتا ہے** — ایسی سطروں کے آخر میں `; 0` لگائیں۔
- ایپ انٹرنیٹ واپس آتے ہی خود آف لائن قطار چلاتی ہے — سرور کی ناکامی کی نقل
  `set_offline(False)` سے **پہلے** لگائیں۔
