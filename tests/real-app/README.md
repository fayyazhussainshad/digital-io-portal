# اصل ایپ کی جانچ (Real-app test) — live سے پہلے لازمی

ASI کا اصول: کوئی تبدیلی live نہیں جاتی جب تک **اصل ایپ** (index.html + تمام
اصل scripts اور CSS) Desktop اور Mobile دونوں پر، اور Ctrl+P / «پرنٹ» بٹن دونوں
سے، جانچ نہ لی جائے۔ یہاں صرف Supabase کی جگہ آزمائشی ڈیٹا (`mock-supabase.js`) ہے؛
باقی سب کچھ بالکل وہی جو افسر کے آلے پر چلتا ہے۔

## چلانا
```bash
cd tests/real-app
mkdir -p .deps/fontpkg .deps/purify
(cd .deps/fontpkg && npm pack @fontsource/noto-nastaliq-urdu && tar xzf *.tgz)
(cd .deps/purify && npm pack dompurify@3.1.6 && tar xzf *.tgz)
(cd ../.. && python3 -m http.server 8770 &)      # ریپو کی جڑ سے
python3 real_test.py                               # Python Playwright درکار
```
نتیجہ: ہر جانچ PASS/FAIL، اور `out/` میں سکرین اور A4 پرنٹ کی تصاویر/PDF۔

## نوٹ
- `page.emulate_media('screen')` کے بعد `page.pdf` سکرین چھاپتا ہے — اسی لیے
  ناپ کے بعد ہمیشہ `emulate_media(media='null')`۔
- `page.evaluate("… = function(){…}")` کا آخری نتیجہ function ہو تو Playwright
  اسے **چلا دیتا ہے** — ایسی سطروں کے آخر میں `; 0` لگائیں۔
