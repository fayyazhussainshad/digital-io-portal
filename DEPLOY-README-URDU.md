<div dir="rtl">

# Digital IO — سیکیورٹی اپڈیٹ (مکمل پیکج)

یہ **ایک ہی پیکج** میں 14 نکاتی سیکیورٹی آڈٹ کی تمام تبدیلیاں ہیں — پہلے علیحدہ ZIPs
میں دی گئی تھیں، اب یکجا۔ ہر فائل `origin/main` سے **حقیقی طور پر مختلف** ہے (خالی/بے تبدیلی
فائل شامل نہیں)۔ فولڈر کا ڈھانچہ repo جیسا ہے — GitHub پر اسی جگہ اپلوڈ کریں۔

**اہم:** git push cloud سے بند (403) ہے، اس لیے فائلیں **manually GitHub پر اپلوڈ** کریں۔

---

## 1) روٹ فائلیں (repo کی جڑ میں اسی نام سے replace کریں) — 20 فائلیں

| فائل | تبدیلی |
|---|---|
| `error-handler.js` | **نئی** — global error + promise-rejection پکڑ کر localStorage ring buffer (`dio_err_log`, 50) + بہترین کوشش `client_errors` table۔ |
| `license-token.js` | **نئی** — client ECDSA P-256 license verify (`DIO_LICENSE_PUB_JWK` placeholder بھرنا ہے)۔ |
| `auth.js` | ایپ لاک: PBKDF2 PIN hashing + سیشن ٹائم آؤٹ (5 منٹ) + visibilitychange re-lock؛ ٹوکن AES-GCM انکرپشن (IndexedDB non-extractable key)؛ legacy auto-migrate۔ |
| `app-core.js` | **لازمی** — initApp سے PIN-wipe لائن ہٹائی (اس کے بغیر ایپ لاک ٹوٹتا ہے)؛ admin.js lazy-load؛ `_dioJsHtml` escape helper۔ |
| `data-api.js` | ثبوت signed URL only (`getPublicUrl` ہٹا، `storage_path` محفوظ)؛ `_OFFICER_PROTECTED` denylist۔ |
| `cases.js`, `offline-store.js` | ثبوت signed URL only؛ XSS escape۔ |
| `suspects.js`, `staff-v2.js`, `sho-dsp.js`, `admin.js`, `court.js` | XSS: `esc()`/`_dioJsHtml()` (نام، caste، CNIC، موبائل، تاریخیں وغیرہ)۔ |
| `ahkamat.js`, `law-library.js`, `templates.js` | mammoth آؤٹ پٹ `DIO.html.safe` سے۔ |
| `reminders.js` | `_remMarkCourtDone` (نام تبدیل + shadowing bug fix)۔ |
| `settings.js` | "🛡️ ایپ لاک PIN" بٹن۔ |
| `index.html` | static `admin.js` ہٹا؛ `error-handler.js` سب سے پہلے لوڈ۔ |
| `vercel.json` | CSP نافذ (`unsafe-eval` ہٹا، frame-ancestors/base-uri/form-action)؛ js/css کیشنگ `no-cache, must-revalidate`۔ |
| `sw.js` | **v487**؛ `cache:'no-cache'`۔ |

اپلوڈ کے بعد سائٹ ری فریش کریں — نیا SW (v487) پرانا کیش صاف کر دے گا۔

## 2) Supabase SQL (`sql/` فولڈر) — console → SQL Editor میں چلائیں

ترتیب سے:
1. `00_export_current_schema.sql` — پہلے موجودہ schema **بیک اپ** (صرف پڑھتا ہے)۔
2. `10_subscription_enforcement.sql` — `dio_has_active_sub()` + ~21 content tables پر restrictive
   write-gate۔ **RLS enable نہیں کرتا**؛ جہاں پہلے سے on ہے وہیں لاگو۔ واپسی: `10_..._ROLLBACK.sql`۔
3. `20_officers_protect_trigger.sql` — non-admin کے `role`/`is_approved`/`is_suspended`/`user_id`
   بدلنے سے روکتا trigger۔ واپسی: `20_..._ROLLBACK.sql`۔
4. `30_client_errors_optional.sql` — **اختیاری** — error-handler کے لیے `client_errors` table
   (نہ چلائیں تو error-handler خاموشی سے صرف مقامی رکھے گا)۔

`sql/README.md` میں تفصیل موجود ہے۔

## 3) License edge function (اختیاری، آفلائن لائسنس کے لیے)

`supabase/functions/dio-license/index.ts` deploy کریں؛ env میں `DIO_LICENSE_PRIV_JWK` (نجی)
سیٹ کریں اور اس سے مماثل public JWK `license-token.js` کے `DIO_LICENSE_PUB_JWK` میں ڈالیں۔
مختصر مدت ٹوکن سائن کرتا ہے (افسر 48 گھنٹے / admin 72 گھنٹے)۔

---

## deploy کے بعد ٹیسٹ (لازمی)
- ایپ لاک: PIN سیٹ کریں → ٹیب چھوڑ کر واپس آئیں → لاک آنا چاہیے؛ 5 منٹ idle → لاک۔
- ثبوت کی تصاویر: عام صارف کو دکھیں (signed URL) اور public link سے **نہ** کھلیں۔
- سبسکرپشن: suspended/expired افسر content **لکھ نہ سکے** (پڑھ سکے)۔
- کوئی عام صارف اپنا `role`/approval خود نہ بدل سکے۔

## واپسی (rollback) اگر کچھ خراب ہو
- کوڈ: پرانی فائلیں GitHub پر واپس؛ SW ورژن گھٹنے پر خود کیش صاف۔
- SQL: متعلقہ `_ROLLBACK.sql` چلائیں۔

</div>
