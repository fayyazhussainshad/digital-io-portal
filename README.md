# Digital IO — DB اسکیما و RLS (قدم 4: خامی 9 اور 10)

یہ فولڈر ڈیٹا بیس سے متعلق فکسز کو **ورژن کنٹرول میں** لاتا ہے (خامی 10) اور
سبسکرپشن کے سرور سائیڈ نفاذ کی مائیگریشن دیتا ہے (خامی 9)۔ تمام SQL آپ
**Supabase → SQL Editor** میں چلائیں گے۔ (کلاؤڈ سیشن سے Supabase تک رسائی نہیں،
اس لیے یہ مسودے آپ چلائیں گے۔)

## فائلیں

| فائل | کیا کرتی ہے | کہاں چلائیں |
|---|---|---|
| `00_export_current_schema.sql` | **صرف پڑھتی ہے** — موجودہ tables، columns، RLS on/off، policies، functions، triggers، FKs، اور storage buckets ایکسپورٹ کرتی ہے۔ | Supabase SQL Editor |
| `10_subscription_enforcement.sql` | `dio_has_active_sub()` فنکشن + content tables پر **restrictive write-gate** policies۔ میعاد ختم = صرف پڑھنے (view-only)، لکھنا DB سطح پر بند۔ | Supabase SQL Editor |
| `10_subscription_enforcement_ROLLBACK.sql` | اوپر والی ہر پالیسی و فنکشن ہٹا دیتی ہے (حفاظتی واپسی)۔ | ضرورت پڑنے پر |

## ترتیب (اہم)

1. **پہلے `00_export_current_schema.sql` چلائیں۔** ہر نتیجہ (خاص طور پر سیکشن 2:
   `rls_enabled`) کاپی کر کے اس فولڈر میں `current_schema/` کے تحت محفوظ کریں۔
   اس سے خامی 10 حل ہوتی ہے (schema/RLS اب ریپو میں) اور اگلا قدم "بغیر ہوا میں"
   ہوتا ہے۔

2. **پھر `10_subscription_enforcement.sql` — مگر پہلے صرف ایک table پر ٹیسٹ کریں۔**
   فائل کے آخر میں دی گئی 3 لائنیں صرف `cases` پر چلائیں، ایک میعاد-ختم اور ایک
   فعال افسر سے لکھ کر دیکھیں، پھر پورا `do $$ ... $$` بلاک چلائیں۔

## یہ کیسے کام کرتا ہے (تصدیق شدہ)

- **رشتے (کوڈ سے تصدیق شدہ):** `officers.user_id = auth.uid()`،
  `subscriptions.officer_id = officers.id`، `subscriptions.status` in
  (trial/active/suspended/expired)، `subscriptions.expires_at`۔
- **`dio_has_active_sub()`** (security definer) true دیتا ہے اگر افسر کے پاس فعال/trial
  (غیر منقضی) سبسکرپشن ہو، یا وہ superadmin/admin ہو۔
- **Restrictive write-gate:** ہر content table پر صرف insert/update/delete پر
  `dio_has_active_sub()` لازمی۔ **SELECT کو ہاتھ نہیں لگایا** — اس لیے میعاد ختم
  ہونے پر افسر ڈیٹا **دیکھ** سکتا ہے مگر **بدل/بڑھا** نہیں سکتا۔ کلائنٹ کوڈ بدلنے
  سے فرق نہیں پڑتا — فیصلہ DB کرتا ہے۔

### حقیقی PostgreSQL پر جانچ کا نتیجہ
| صارف | `dio_has_active_sub()` | insert | select |
|---|---|---|---|
| فعال افسر | true | ✅ کامیاب | ✅ |
| **میعاد ختم افسر** | false | ⛔ **بلاک** (RLS violation) | ✅ (view-only) |
| admin (بلا سبسکرپشن) | true | ✅ کامیاب | ✅ |

Rollback نے تینوں پالیسیاں + فنکشن صاف ہٹا دیے۔

## حفاظتی اصول (پڑھ لیں)

- یہ اسکرپٹ کسی table پر **RLS enable نہیں کرتا**۔ صرف restrictive policies جوڑتا ہے
  جو **صرف اُنہی tables پر فعال** ہوتی ہیں جہاں RLS پہلے سے آن ہے۔ جہاں RLS بند ہے
  وہاں یہ غیر فعال رہتی ہیں (کچھ نہیں ٹوٹتا)۔
- کسی table پر **خود سے RLS enable نہ کریں** جب تک اُس پر ایک permissive SELECT
  policy موجود نہ ہو — ورنہ اُس کا پڑھنا رک جائے گا۔ (اسی لیے پہلے export چلائیں۔)
- `subscriptions` اور `subscription_plans` جان بوجھ کر gate سے باہر ہیں تاکہ میعاد
  ختم افسر **تجدید** کر سکے (پھنس نہ جائے)۔ `officers` بھی باہر (پروفائل)۔ لاگ tables
  (`audit_logs`, `evidence_custody_events`) بھی باہر تاکہ ریکارڈ چلتا رہے۔

## باقی کام (اس قدم سے آگے)

1. **کلائنٹ fail-open (offline trial):** یہ SQL صرف **آن لائن** لکھائی نافذ کرتا ہے۔
   `subscription.js` اب بھی آف لائن/error پر 30-دن trial دیتا ہے۔ مکمل حل کے لیے
   ایک **Edge Function** درکار ہے جو لاگ اِن پر مختصر مدت (24–72 گھنٹے) کا **دستخط
   شدہ لائسنس ٹوکن** جاری کرے، اور کلائنٹ آف لائن صرف اُسی کی میعاد تک چلے (خودکار
   trial نہیں)۔ یہ الگ ٹاسک ہے۔
2. **profile allowlist کا DB جڑواں (خامی 6):** قدم 1 میں کلائنٹ allowlist لگا؛
   مکمل ضمانت کے لیے `officers` پر ایک BEFORE UPDATE trigger بنائیں جو `role`،
   `is_approved`، `subscription_*` وغیرہ کو کلائنٹ سے بدلنے سے روکے (صرف
   service_role/RPC اجازت)۔ (چاہیں تو اگلا مسودہ دے دوں۔)
