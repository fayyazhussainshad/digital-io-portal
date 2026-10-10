<div dir="rtl">

# Digital IO — مکمل سیکیورٹی پیکج (SW v488)

14 نکاتی آڈٹ کے **تمام** نکات بند۔ ہر فائل `origin/main` سے حقیقی طور پر مختلف ہے
(بے تبدیلی فائل ایک بھی نہیں)۔ فولڈر کا ڈھانچہ repo جیسا ہے — GitHub پر اسی جگہ اپلوڈ کریں۔

**اہم:** git push cloud سے بند (403) ہے، اس لیے فائلیں **manually اپلوڈ** کریں۔

---

## آڈٹ کے 14 نکات — حتمی حالت

| # | نکتہ | حالت |
|---|---|---|
| 1 | PIN سادہ متن / btoa | ✅ PBKDF2 (150k، salt) + خودکار migration |
| 2 | ٹوکن localStorage میں | ✅ اپنے ٹوکن + **Supabase سیشن** دونوں AES-GCM انکرپٹڈ |
| 3 | ایپ لاک بند | ✅ PIN + 5-منٹ ٹائم آؤٹ + visibilitychange re-lock |
| 4 | شہادت کے عوامی لنک | ✅ صرف signed URL؛ `getPublicUrl` مکمل ختم |
| 5 | کردار کے دو ذرائع | ⚪ **غلط نکلی** — واحد ذریعہ `officers.role` |
| 6 | پروفائل — کوئی بھی کالم | ✅ `_OFFICER_PROTECTED` denylist + DB trigger |
| 7 | CSP صرف Report-Only | ✅ نافذ؛ `unsafe-eval` ختم |
| 8 | بے تحاشا innerHTML (XSS) | ✅ **28 فائلیں** — locked فائلوں سمیت |
| 9 | آف لائن خودکار trial | ✅ **fail-closed** — ٹوکن ← cache ← 3-دن grace |
| 10 | DB اسکیما/RLS ریپو میں نہیں | ✅ SQL + **RLS enable** (گیٹ اب واقعی فعال) |
| 11 | admin.js سب کو | ✅ lazy-load صرف ایڈمن کو |
| 12 | دہرے گلوبل فنکشن | ✅ ٹھیک + ESLint `no-redeclare` سے دوبارہ نہ ہوں |
| 13 | خاموش catch، کوئی ٹیسٹ نہیں | ✅ error-handler + ESLint + **12 چلتے ٹیسٹ** |
| 14 | بڑی فائلیں + no-store | ✅ کیشنگ `no-cache, must-revalidate`؛ SW v488 |

---

## 1) روٹ فائلیں — repo کی جڑ میں اسی نام سے replace کریں

**نئی (5):** `error-handler.js`، `secure-storage.js`، `license-token.js`،
`package.json`، `eslint.config.mjs`

**تبدیل شدہ (40):** `admin.js`، `ahkamat.js`، `app-core.js`، `auth.js`، `bin.js`،
`case-docs.js`، `case-form.js`، `cases.js`، `cdr-imei.js`، `court.js`، `cro-card.js`،
`dashboard.js`، `data-api.js`، `dio-custody.js`، `evidence.js`، `fir.js`، `fivec.js`،
`incident.js`، `index.html`، `law-library.js`، `misal-docs.js`، `misal-fir.js`،
`mulziman.js`، `offline-store.js`، `performance.js`، `reminders.js`، `report173.js`،
`saza-slip.js`، `search.js`، `settings.js`، `sho-dsp.js`، `staff-v2.js`،
`subscription.js`، `suspects.js`، `sw.js`، `templates.js`، `toolbar.js`،
`vercel.json`، `witnesses.js`، `zimni.js`

اپلوڈ کے بعد سائٹ ری فریش کریں — نیا SW (**v488**) پرانا کیش صاف کر دے گا۔

### خاص طور پر دھیان دینے والی تبدیلیاں
- **`app-core.js` لازمی ہے** — initApp سے PIN-wipe لائن ہٹائی گئی؛ اس کے بغیر ایپ لاک کام نہیں کرتا۔
- **`subscription.js`** — آف لائن اب نیا 30-دن trial نہیں ملتا۔ ترتیب: دستخط شدہ لائسنس ٹوکن ←
  آخری کامیاب آن لائن تصدیق کا cache (گزرے دنوں کی کٹوتی کے ساتھ) ← صرف **3 دن** grace۔
  معطل افسر انٹرنیٹ بند کر کے پابندی نہیں توڑ سکتا۔
- **`secure-storage.js`** — `app-core.js` سے **پہلے** لوڈ ہونی چاہیے (index.html میں ترتیب درست ہے)۔
  Crypto دستیاب نہ ہو تو سادہ localStorage پر لوٹ جاتی ہے — لاگ اِن کبھی نہیں ٹوٹتا۔
- **`zimni.js`** — پرنٹ/PDF کے چاروں راستے اب `DIO.html.safe()` سے گزرتے ہیں (یہ stored XSS تھا:
  ایڈیٹر sanitize کرتا تھا، پرنٹ نہیں)۔

## 2) Supabase SQL — console → SQL Editor، **اسی ترتیب سے**

1. `sql/00_export_current_schema.sql` — پہلے موجودہ schema کا **بیک اپ** (صرف پڑھتا ہے)۔
2. `sql/40_rls_status_audit.sql` — **صرف پڑھتا ہے۔** بتاتا ہے کن ٹیبلز پر RLS بند ہے۔
3. `sql/10_subscription_enforcement.sql` — `dio_has_active_sub()` + 21 ٹیبل پر restrictive
   write-gate۔ واپسی: `10_..._ROLLBACK.sql`۔
4. `sql/41_rls_enable_safe.sql` — **یہی نکتہ 10 کو اصل میں بند کرتا ہے۔** جن ٹیبلز پر RLS بند ہے
   وہاں پہلے permissive allow-all policy لگاتا ہے، **پھر** RLS آن کرتا ہے — اس لیے ایک لمحہ بھی
   ٹیبل بند نہیں ہوتا، اور گیٹ جاگ جاتی ہے۔ واپسی: `41_..._ROLLBACK.sql`۔
5. `sql/20_officers_protect_trigger.sql` — عام افسر اپنا `role`/approval خود نہ بدل سکے۔
   واپسی: `20_..._ROLLBACK.sql`۔
6. `sql/30_client_errors_optional.sql` — **اختیاری** (error-handler کے لیے)۔

> **کیوں ضروری:** Postgres میں restrictive policy صرف اُس ٹیبل پر اثر کرتی ہے جہاں RLS **پہلے سے**
> آن ہو۔ اسی لیے اکیلی قدم 3 کافی نہیں تھی — قدم 4 کے بغیر گیٹ بے اثر رہتی۔ یہ اصلی
> PostgreSQL 16 پر جانچا گیا: بغیر سبسکرپشن insert رک جاتا ہے، فعال سبسکرپشن پر چل جاتا ہے،
> اور پڑھنا کبھی نہیں ٹوٹتا۔

## 3) License edge function (آف لائن نفاذ مضبوط کرنے کے لیے)

`supabase/functions/dio-license/index.ts` deploy کریں؛ env میں `DIO_LICENSE_PRIV_JWK` سیٹ کریں
اور مماثل public JWK `license-token.js` کے `DIO_LICENSE_PUB_JWK` میں ڈالیں۔

> یہ **اختیاری** ہے۔ keys سیٹ نہ ہوں تب بھی `subscription.js` محفوظ ہے — وہ cache اور
> 3-دن grace پر چلے گا۔ keys سیٹ ہونے پر ٹوکن سب سے مضبوط درجہ بن جاتا ہے۔

## 4) ٹیسٹ اور lint (اختیاری، ڈویلپر کے لیے)

```
npm install
npm test     # 12 سیکیورٹی ٹیسٹ
npm run lint # نئی خاموش catch/خامیاں پکڑتا ہے
```
ٹیسٹ یہ بھی جانچتے ہیں کہ ٹھیک کی ہوئی خامیاں **واپس نہ آئیں** (PIN-wipe، getPublicUrl،
unsafe-eval، admin.js static load، SW precache)۔

---

## deploy کے بعد لازمی ٹیسٹ
- **ایپ لاک:** PIN سیٹ کریں → ٹیب چھوڑ کر واپس آئیں → لاک آئے؛ 5 منٹ idle → لاک۔
- **آف لائن:** انٹرنیٹ بند کریں → ایپ چلے (cache کی بنیاد پر)؛ معطل افسر **نہ** چلے۔
- **شہادت:** تصاویر افسر کو دکھیں، مگر public link سے نہ کھلیں۔
- **سبسکرپشن:** معطل/میعاد ختم افسر لکھ نہ سکے، پڑھ سکے۔
- **زمنی پرنٹ:** زمنی پرنٹ/PDF درست رینڈر ہو (sanitize کے بعد بھی فارمیٹنگ برقرار)۔

## واپسی (rollback)
- کوڈ: پرانی فائلیں GitHub پر واپس؛ SW ورژن گھٹنے پر کیش خود صاف۔
- SQL: متعلقہ `_ROLLBACK.sql` چلائیں (41 → 20 → 10 کی الٹی ترتیب)۔

</div>
