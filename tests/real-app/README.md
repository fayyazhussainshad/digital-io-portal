# اصل ایپ کی جانچ (Real-app test) — live سے پہلے لازمی

ASI کا اصول: کوئی تبدیلی live نہیں جاتی جب تک **اصل ایپ** (index.html + تمام
اصل scripts اور CSS) Desktop اور Mobile دونوں پر، اور Ctrl+P / «پرنٹ» بٹن دونوں
سے، جانچ نہ لی جائے۔ یہاں صرف Supabase کی جگہ آزمائشی ڈیٹا (`mock-supabase.js`) ہے؛
باقی سب کچھ بالکل وہی جو افسر کے آلے پر چلتا ہے۔

## دو جانچیں

| فائل | کیا جانچتی ہے |
|---|---|
| `real_test.py` | واقعاتی رپورٹ: A4 پرنٹ (Ctrl+P = پرنٹ بٹن، pixel تک)، فہرست سے پرنٹ، نام بدلنا، کاپی، شیئر، ترمیم، حذف — Desktop + Mobile |
| `core_test.py` | (v547) مقدمہ: نیا اندراج، ترمیم، خودکار یاددہانیاں · مقدمہ / یاددہانی / پیشی کا حذف صرف «حذف شدہ مواد» میں نقل کے بعد · بحالی · مثل کی دستاویز: محفوظ، سرور پر ریکارڈ نہ ہو تو نیا، رد ہو تو صاف ناکامی، پرنٹ · ملزم کے سابقہ ریکارڈ کا لیبل · سرکاری گاڑی آف لائن (دو بار محفوظ = ایک قطار) · 5-C آف لائن قطار · مشتبہ / ٹیمپلیٹ / 5-C / شیئر میں سرور کی روک پر جھوٹی کامیابی نہیں — Desktop + Mobile |

ہر جانچ ناکامی پر exit code 1 دیتی ہے (GitHub Actions میں PR رک جاتا ہے)۔

## چلانا
```bash
cd tests/real-app
mkdir -p .deps/fontpkg .deps/purify
(cd .deps/fontpkg && npm pack @fontsource/noto-nastaliq-urdu && tar xzf *.tgz)
(cd .deps/purify && npm pack dompurify@3.1.6 && tar xzf *.tgz)
(cd ../.. && python3 -m http.server 8770 &)      # ریپو کی جڑ سے
python3 real_test.py                               # Python Playwright درکار
python3 core_test.py
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

## نوٹ
- `page.emulate_media('screen')` کے بعد `page.pdf` سکرین چھاپتا ہے — اسی لیے
  ناپ کے بعد ہمیشہ `emulate_media(media='null')`۔
- `page.evaluate("… = function(){…}")` کا آخری نتیجہ function ہو تو Playwright
  اسے **چلا دیتا ہے** — ایسی سطروں کے آخر میں `; 0` لگائیں۔
- ایپ انٹرنیٹ واپس آتے ہی خود آف لائن قطار چلاتی ہے — سرور کی ناکامی کی نقل
  `set_offline(False)` سے **پہلے** لگائیں۔
