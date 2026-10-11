<div dir="rtl">

# Digital IO — مکمل سیکیورٹی پیکج (SW v492)

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

اپلوڈ کے بعد سائٹ ری فریش کریں — نیا SW (**v492**) پرانا کیش صاف کر دے گا۔

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


---

## دوسرے دور کا جائزہ — مزید 16 خامیاں ملیں اور بند ہوئیں

پہلے دور کے بعد پورے سسٹم کا آزادانہ جائزہ لیا گیا۔ یہ ملا:

**سنگین**
- **IndexedDB کا ٹکراؤ:** `auth.js` اور `secure-storage.js` دونوں ایک ہی ڈیٹابیس (`dio_sec`, version 1)
  مگر مختلف store کھولتے تھے۔ `onupgradeneeded` صرف ایک بار چلتا ہے، اس لیے دو میں سے ایک
  انکرپشن پرت **خاموشی سے مردہ** تھی — ٹوکن سادہ متن میں رہ جاتے۔ اب الگ ڈیٹابیس۔
- **PIN/بایومیٹرک لاگ اِن گیٹ سے بچ نکلتا تھا:** معطلی کا چیک صرف پاس ورڈ لاگ اِن پر تھا، جبکہ
  PIN ڈیفالٹ پینل ہے۔ اب گیٹ `_dioLoginWithToken` کے **اندر** ہے، تو ہر راستہ اس سے گزرتا ہے۔
- **معطل افسر پر write-guard کا فلیگ لگتا ہی نہیں تھا:** صرف `<div>` بدلتا تھا؛ سیشن زندہ رہتا،
  پرنٹ چلتا رہتا اور `showPage()` سے UI واپس آ جاتی۔ اب فلیگ + guard + logout۔
- **آف لائن بائی پاس:** cache مٹا دینے پر صاف ریکارڈ بن جاتا تھا۔ اب fail-closed۔

**اہم**
- `admin.js` میں **وہی کالم بگ** (`o.suspended`) رہ گیا تھا — معطل افسر فہرست میں نظر ہی نہیں آتا تھا
  اور ایڈمن اسے **بحال بھی نہیں کر سکتا تھا**۔ 7 جگہ ٹھیک۔
- `is_suspended` کلائنٹ کی denylist میں نہیں تھا۔ شامل۔
- آف لائن cache کی officer-binding: `o` فیلڈ **ہٹا دینے** سے cache ہر افسر پر لگ جاتا تھا۔ اب سخت۔
- لائسنس ٹوکن bearer تھا (کسی اور کا copy کر لیں) — اب `officer_id` سے بندھا۔
- گھڑی پیچھے کرنے سے میعاد بڑھتی تھی — اب monotonic گارڈ۔
- `client_errors` کی `with check (true)` — کوئی بھی کسی کے نام پر لکھ سکتا تھا۔ اب `auth.uid()` سے بندھا۔
- error log میں CNIC/موبائل/ای میل/ٹوکن جاتے تھے — اب redaction + لمبائی کی حد + logout پر صفائی۔
- `index.html` کے ڈیبگ بینر میں `innerHTML` (DOM XSS) — اب `textContent`۔

**میری اپنی ڈالی ہوئی خرابیاں (پہلے دور میں) — ٹھیک کر دیں**
- `witnesses.js`: `_dioJsHtml` نے "بھریں" بٹن توڑ دیا تھا (object-literal جگہ پر JS-string escaper)۔ اب `esc()`۔
- `zimni.js` پرنٹ: sanitize کے بعد picker بٹن کا **`▾` عدالتی کاغذ پر چھپ جاتا**۔ اب بٹن مکمل نکلتا ہے۔
- `evidence.js`: تھمب نیل پرانے `file_url` پر منحصر تھا (اب null) — تصاویر غائب ہو جاتیں۔ ٹھیک۔
- `cases.js`: inline onclick میں `esc()` — اپوسٹرافی والے FIR نمبر پر بٹن ٹوٹتے۔ اب `_dioJsHtml`۔

**پہلے سے موجود خرابی جو جائزے میں پکڑی گئی**
- `dio-html.js` کے `ALLOWED_URI_REGEXP` میں `:` کی جگہ `;` تھا — DOMPurify **https/mailto/blob سب کاٹ
  دیتا تھا**۔ یعنی زمنی میں لگی تصویر اور دستاویز کے لنک ٹوٹ جاتے۔ ٹھیک (`javascript:` اب بھی رکتا ہے)۔

## معطل افسر — اب کیا ہوتا ہے (اصلی PostgreSQL پر جانچا)

| کردار (سب کے پاس **فعال** سبسکرپشن) | نتیجہ |
|---|---|
| superadmin (معطل نشان زد) | چل سکتا ہے — مالک کبھی بند نہیں |
| admin (معطل) | 🔒 رک گیا |
| افسر (معطل) | 🔒 رک گیا |
| افسر (ٹھیک) | چل رہا ہے |
| افسر (غیر منظور شدہ) | 🔒 رک گیا |

تین تہیں: (1) لاگ اِن گیٹ — ہر راستہ (پاس ورڈ/PIN/بایومیٹرک/آف لائن)، (2) کلائنٹ write-guard +
داخلہ بند، (3) **ڈیٹابیس** — `sql/50_suspend_hard_gate.sql`، جو کلائنٹ بائی پاس ہونے پر بھی روکتا ہے۔

> SQL کی ترتیب میں اب **`50`** بھی شامل ہے: `00` → `40` → `10` → `41` → `20` → **`50`** → `30`

---

## تیسرے دور کا جائزہ — 17 مزید خامیاں (SW v492)

اس دور میں SQL، Edge Function، آف لائن sync اور service worker کا گہرا جائزہ لیا گیا — یہ حصے
پہلے نہیں دیکھے گئے تھے۔ سب سے اہم یہ نکلا:

### 🔴 نظام کی بنیادی خامی — ایک INSERT سے پورا نفاذ ختم
`dio_has_active_sub()` فیصلہ `subscriptions` ٹیبل سے کرتا ہے — **مگر وہی ٹیبل افسر کے لیے کھلی تھی**
(نہ RLS، نہ policy؛ کلائنٹ whitelist میں بھی "تجدید کے لیے")۔ یعنی:
`insert into subscriptions values (<اپنا id>,'active','2099-01-01')` — اور 21 ٹیبل کی گیٹ، معطلی،
سب بند۔ پھر Edge Function اسی جعلی row پر دستخط شدہ لائسنس بھی دے دیتا۔
**حل:** `sql/60_subscriptions_lockdown.sql` — افسر اپنی سبسکرپشن صرف **پڑھ** سکتا ہے؛ تجدید اب
`dio_request_subscription()` سے، جو صرف `pending` بناتی ہے۔ `active` صرف ایڈمن/service_role۔

### 🔴 `officers` میں INSERT سے superadmin بن جانا
پرانا trigger صرف `before update` تھا۔ افسر اپنے `user_id` کے ساتھ نئی row `role='superadmin'`
ڈال دیتا — اور گیٹ `exists(... role='superadmin')` دیکھتی ہے، یعنی مستقل مالک۔ ساتھ ہی: کسی بھی
دوسرے افسر کی row بدلی اور مٹائی جا سکتی تھی، اور `auth.uid() is null` کو "service_role" مان لیا گیا تھا
(حالانکہ anon پر بھی null آتا ہے)۔
**حل:** `sql/21_officers_protect_v2.sql` — INSERT + UPDATE + DELETE، `user_id` پر unique index،
ملکیت کا چیک، اور `current_user`/`auth.role()` سے اصل کردار کی جانچ۔

### 🔴 Edge Function نے وہی سوراخ دوبارہ کھولا
صرف `id, role` پڑھتا تھا — نہ معطلی، نہ منظوری — اور **ایڈمن کو بلا شرط 72 گھنٹے** دیتا تھا (بالکل وہی
خامی جو `50_suspend_hard_gate.sql` میں بند کی تھی)۔ معطل افسر کا refresh token زندہ رہتا ہے، تو وہ
curl سے نیا ٹوکن لے کر 48–72 گھنٹے آف لائن پورا کام کر لیتا۔
**حل:** دستخط سے **پہلے** معطلی/منظوری کا گیٹ؛ صرف superadmin مستثنیٰ؛ بلا حق `403 not_entitled`
(کوئی دستخط نہیں)؛ payload میں `sub`/`kid`؛ اندرونی error باہر نہیں جاتا۔

### دیگر (سب ٹھیک)
| # | خامی | حل |
|---|---|---|
| 4 | `41` کا rollback اُن ٹیبلز کی RLS بھی بند کر دیتا جو اُس نے چھوئی ہی نہ تھیں — سسٹم **پہلے سے زیادہ کھلا** | `dio_migration_state` میں ریکارڈ |
| 5 | `41` اُن ٹیبلز پر allow-all لگا دیتا جن پر per-officer policies پہلے سے تھیں (انہیں ہمیشہ کے لیے بے اثر) | ایسی ٹیبل چھوڑ کر warning |
| 6 | `coalesce(is_approved, true)` — NULL کو **منظور** مان لیتا | `false` (fail-closed) |
| 7 | `expires_at IS NULL` پر اصلی paying افسر **block** ہو جاتا | `active` + NULL = مستقل |
| 8 | `status:'none'` پر write-guard **بالکل بند** — cache مٹا کر آف لائن جانا کافی تھا | `none`/`unknown` بھی blocked |
| 9 | 3-دن grace **ہر کال پر نئی** بن جاتی — یعنی ہمیشہ کی چھوٹ | `dio_grace_start` سے ایک ہی بار |
| 10 | `storage.from()` گیٹ سے باہر — معطل افسر فائلیں اپلوڈ کرتا رہتا | storage + rpc بھی guard میں |
| 11 | SW ہر navigation کا جواب `/index.html` پر لکھتا — **cache poisoning**، deep link ٹوٹنا | اپنی key پر + 503 fallback |
| 12 | لائسنس binding دو short-circuit سے fail-open | دونوں طرف لازمی |
| 13 | write-guard 3 سیکنڈ بعد لگتا — شروع کی ہر write بلا روک | فوراً |
| 14 | مسترد شدہ آف لائن اندراج **ہمیشہ pending** — افسر سمجھتا زمنی محفوظ ہے | مستقل غلطی = `failed` + اطلاع + `dioFailedSyncs()` |
| 15 | `client_errors`: `= (select ...)` دو rows پر exception؛ `is null` سے بے پہچان inserts | `in (...)`، NULL شاخ ختم |
| 16 | `secure-storage` کی key IndexedDB transaction کے **اندر** بنتی — سست فون پر لاگ اِن **hang** | key پہلے، پھر ایک transaction |
| 17 | میری اپنی: `offline-store.js` دوبارہ کاپی کرنے سے `getPublicUrl` واپس آ گیا تھا | ٹیسٹ نے پکڑا، ہٹا دیا |

### SQL کی حتمی ترتیب
`00` → `40` (audit) → `10` → `41` → **`21`** → **`60`** → `50` → `30`
(`20` کی جگہ اب `21` ہے۔ ہر ایک کا ROLLBACK موجود اور جانچا ہوا۔)

## ⚠️ ایک بڑی بات جو ابھی کھلی ہے — ضرور پڑھیں

`41_rls_enable_safe.sql` جو `dio_base_all` policy لگاتی ہے وہ `using(true)` ہے۔ اس کا مطلب:
سبسکرپشن گیٹ پاس کرنے کے بعد **ایک افسر دوسرے تھانے کے کیس بھی پڑھ اور بدل سکتا ہے**۔
یہ **نئی خامی نہیں** — جن ٹیبلز پر RLS پہلے سے بند تھی وہاں یہ پہلے بھی ممکن تھا، اور ایپ کی
حفاظت صرف query-scoping (`mine()`) سے تھی۔ مگر اب یہ policy کی شکل میں لکھی ہوئی ہے۔

**اصل حل** per-officer policies ہیں (`officer_id = dio_my_officer_id()` + ایڈمن + case-sharing)۔
یہ ہر ٹیبل کے ownership کالم پر منحصر ہے، اس لیے اندازے سے لکھنا خطرناک ہے — اگلے مرحلے میں
`40_rls_status_audit.sql` کی رپورٹ دیکھ کر ٹیبل بہ ٹیبل کرنا چاہیے۔

---

# موبائل — فون پر وہی روانی (SW v492)

پروجیکٹ کا مقصد ہی "work on the go" ہے، اس لیے موبائل بنیادی آلہ ہے۔ **ناپ کر** کام کیا گیا۔

## ۱) دستاویزی ایڈیٹر — فارم موڈ (نئی: `mobile.css`, `mobile.js`)

**مسئلہ (ناپا گیا):** زمنی/چالان A4 چوڑائی پر بنے ہیں۔

| آلہ | سکرین | دستاویز | |
|---|---|---|---|
| iPhone SE | 375px | 816px | **2.18×** چوڑا |
| عام Android | 412px | 816px | **1.98×** |

**حل:** فون پر ہر اندراج ایک **کارڈ** بن جاتا ہے — اوپر "تاریخ / وقت"، کونے میں سیریل کا گول بیج،
نیچے "حالاتِ تفتیش" کا پورا چوڑا خانہ (16px)۔ تمہید اور اختتام اپنے اپنے کارڈ میں۔
اوپر **📝 فارم / 📄 کاغذ** کا بٹن، اور انگوٹھے کی پہنچ میں **＋ نیا اندراج**۔

**نتیجہ:** 816px → **323px**، افقی اسکرول ختم۔

**سب سے اہم — یہ سب خالص CSS ہے۔** ایک بھی DOM node نہیں ہلتی۔ وجہ: save اور print دونوں
`#ch173-doc` کی اصل innerHTML پڑھتے ہیں؛ اگر نوڈ فارم میں منتقل کیے جاتے تو فارم موڈ میں save
کرتے ہی مواد ضائع ہو سکتا تھا۔ **اصلی کی بورڈ سے جانچا:** حالات، تاریخ اور "نیا اندراج" تینوں
اصل دستاویز تک پہنچتے ہیں۔ **چھپائی PDF بنا کر دیکھی** — فارم موڈ آن ہونے کے باوجود کاغذ پر
مکمل ٹیبل (تاریخ | نمبر شمار | حالاتِ تفتیش | از۔)، کوئی موبائل لیبل یا بیج نہیں۔

## ۲) سست نیٹ پر رفتار (نئی: `boot.js`)

**مسئلہ (Fast-3G، خالی کیش):** پہلا منظر 1.16s — مگر **DOM تیار 10.1 سیکنڈ**، کیونکہ
62 JS فائلیں (1.86 MB) سب `defer` سے پہلے لازمی تھیں۔

**حل، دو تہیں:** (۱) صفحے کا ماڈیول **مانگ پر** — `registerPage()` ایک ہی راستہ ہے اور
`showPage()` پہلے سے "ماڈیول نہیں ملا" سنبھالتا ہے۔ (۲) باقی بھاری ماڈیول **فرصت میں**
(`load` کے بعد، `requestIdleCallback`) خود آ جاتے ہیں۔ کسی ماڈیول کا کوڈ بدلنا نہیں پڑا۔

| | پہلے | بعد |
|---|---|---|
| DOM تیار (DCL) | 10,071ms | **2,903ms** (3.5× تیز) |
| ابتدائی JS | 1,859 KB | **402 KB** |
| Blocking scripts | 58 | **28** |

**جانچ:** 17 میں سے 16 صفحے فوراً کھلے (سترہواں `dashboard` ٹیسٹ ہارنس میں اصل ڈیٹا نہ ہونے
سے "Loading..." دکھاتا ہے — اصل بلڈ میں بھی وہی، یعنی regression نہیں)۔ کوئی page error نہیں۔

> راستے میں ایک حقیقی خامی پکڑی: میرا loader `window._pages` پر انحصار کر رہا تھا، مگر
> `app-core.js` میں وہ `const _pages` ہے اور top-level `const` کبھی `window` پر نہیں آتا —
> اس لیے **ہر** صفحہ lazy راستے پر چلا جاتا اور `help` اٹک گیا تھا۔ اب سوال سیدھا ہے:
> فائل آئی ہے یا نہیں۔

## ۳) ٹیبل → موبائل کارڈ
`table.data-table` فون پر کارڈ بن جاتی ہے؛ ہر خانے پر اس کا عنوان (`thead` سے خودکار)۔
بٹن والا خانہ اپنی پوری قطار لیتا ہے۔

## ۴) ایک ہاتھ سے چلانا
نیچے **انگوٹھے کی پٹی**: ہوم · مقدمات · تلاش · یاددہانی۔ `safe-area-inset` کا خیال،
اور مواد پٹی کے نیچے نہیں چھپتا۔

## ۵) نقشہ موقع — ٹچ
ایک انگلی = ڈرائنگ، **دو انگلیاں = zoom + pan** (`zoomToPoint` + viewport)، اور ڈرائنگ
کے دوران صفحہ نہیں کھسکتا (`touch-action: none`)۔

---

**نئی فائلیں:** `mobile.css`, `mobile.js`, `boot.js` (تینوں SW precache میں — آف لائن پر بھی ملیں گی)
**تبدیل:** `index.html` (34 بھاری ماڈیول blocking list سے نکلے)، `sw.js` (**v492**)


</div>
