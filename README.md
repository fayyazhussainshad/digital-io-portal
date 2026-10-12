# Digital IO — `sql/` (ڈیٹابیس کا ریکارڈ)

یہ فولڈر وہی سب کچھ ہے جو **11–12 اکتوبر 2026** کو اصل ڈیٹابیس پر چلایا گیا،
اُسی ترتیب میں۔ مقصد: خامی 10 — یعنی schema/RLS کا فیصلہ ریپو میں، نہ کہ صرف
کسی گفتگو میں۔

ہر فائل اصل PostgreSQL 16 پر جانچی گئی، اور جہاں ممکن تھا پہلے خرابی **دوبارہ
پیدا** کر کے دکھائی گئی، پھر فکس کے بعد دوبارہ ناپی گئی۔

---

## چلانے کی ترتیب (یہی چلائی گئی تھی)

| # | فائل | کیا کیا | حالت |
|---|---|---|---|
| 00 | `00_export_one_shot.sql` | پورا schema/RLS/policies ایک JSON میں | صرف پڑھتی ہے |
| 01 | `01_inspect_existing.sql` | پہلے سے موجود `dio_*` functions، triggers، grants | صرف پڑھتی ہے |
| 02 | `02_remaining_policies.sql` | 17 tables کی policy کی اصل شرط | صرف پڑھتی ہے |
| 71 | `71_license_diagnose.sql` | لائسنس نہ ملنے کی تشخیص | صرف پڑھتی ہے |
| 80 | `80_close_anon_hole.sql` | 21 tables سے `anon` کا data حق واپس | **چل چکی** |
| 81 | `81_anon_lockdown.sql` | `anon` سے سب کچھ واپس؛ TRUNCATE + VIEW کے سوراخ بند | **چل چکی** |
| 90 | `90_fix_zimni_policies.sql` | ضمنی/ضمنی اندرونی کی کھلی policies درست | **چل چکی** |
| 91 | `91a` → `91b` → `91c` | منظوری پر 30-دن کا trial (سرور سے) | **چل چکی** |
| 92 | `92a` → `92b` | پڑھنے کی روک ہٹائی، لکھنے کی روک لگائی | **چل چکی** |
| 93 | `93a` → `93b` | evidence کی UPDATE policy؛ 21 tables پر RLS ON | **چل چکی** |
| 94 | `94a` → `94b` → `94c` → `94d` | admin کے تین RPC؛ request RPC کی درستگی | **چل چکی** |
| 95 | `95_subs_lockdown.sql` | `subscriptions` پر client کی لکھائی بند | **چل چکی** |
| 96 | `96_officers_privacy.sql` | افسر کے ذاتی کوائف (CNIC، پتہ، تاریخِ پیدائش) کی حفاظت | **12 اکتوبر** |
| 96b | `96b_fix_view_grants.sql` | ⚠ 96 کی سنگین غلطی کی درستی + تھانہ کی شرط | **12 اکتوبر** |
| A1 | `A1_orphan_auth_users.sql` | "user already exists" کی تشخیص | صرف پڑھتی ہے |
| 97 | `97_audit_dead_tables.sql` | بے کار tables اور دوہری policies کی فہرست | صرف پڑھتی ہے |
| 98 | `98_policy_cleanup.sql` | دوہری policies کی صفائی؛ views پر RLS لازمی | **12 اکتوبر** |
| 99 | `99_verify_subscription_flow.sql` | `payment_ref` درست خانے میں گیا؟ | صرف پڑھتی ہے |

ہر قدم کے ساتھ `*_CHECK.sql` (ایک ہی statement — Supabase کا editor نتیجہ ضرور
دکھاتا ہے) اور جہاں خطرہ تھا وہاں `*_ROLLBACK.sql`۔

---

## بنیادی فیصلے (یہی اِن فائلوں میں نافذ ہیں)

- **میعاد ختم = دیکھ سکتے ہو، بدل نہیں سکتے۔** پڑھنے پر کوئی روک نہیں؛ روک
  صرف insert/update/delete پر (`dio_wgate_*`)۔
- **Trial سرور دیتا ہے**، ایڈمن کی منظوری پر، 30 دن، اور صرف **پہلی بار** —
  منظوری toggle کر کے دوبارہ trial نہیں ملتا۔
- **`subscriptions` پر client کچھ نہیں لکھتا۔** چاروں راستے RPC ہیں
  (`dio_request_subscription`, `dio_verify_subscription`,
  `dio_reject_subscription`, `dio_suspend_subscription`)۔
- **مو'عطلی کا کالم `suspended` ہے** (نہ کہ `is_suspended`) — DB نے خود بتایا:
  `42703 ... Perhaps you meant officers.suspended`۔
- **صرف `superadmin` بلا شرط مستثنیٰ ہے۔** معطل admin بھی روکا جاتا ہے۔
- **افسر کا ریکارڈ صرف اُس کا اپنا۔** `officers` پر پڑھنا اب اپنے ریکارڈ تک
  محدود ہے (یا غیر معطل admin کو سب)۔ ساتھی افسر کا نام/بیج `officers_directory`
  سے آتا ہے، جس میں CNIC، پتہ، تاریخِ پیدائش، فون، email **کبھی نہیں** ہوں گے۔
- **`officers_directory` جان بوجھ کر `security_invoker = false` ہے** — یہی اُس کا
  مقصد ہے۔ فائل 98 کی صفائی اِسے مستثنیٰ رکھتی ہے۔ اگر کبھی اِس پر invoker لگا
  دیا جائے تو افسر اپنے ساتھی کا نام بھی نہ دیکھ پائے اور case sharing رک جائے۔
- **⚠ `officers_directory` پر `authenticated` کو صرف `SELECT` ملنا چاہیے — اور کچھ
  نہیں۔** یہ صرف ایک مشورہ نہیں، لازمی شرط ہے۔ Supabase کے `public` schema پر
  DEFAULT PRIVILEGES ہر نئے object پر `authenticated` کو سب کچھ دے دیتے ہیں، اور
  یہ view ایک ہی table پر سادہ select ہے — یعنی Postgres اِسے "auto-updatable"
  مانتا ہے، اور چونکہ یہ مالک کے اختیار سے چلتا ہے، RLS اِسے **نہیں** روکتی۔
  اصل Postgres پر تینوں حملے کامیاب ہوئے تھے: افسر نے خود کو `superadmin` بنایا،
  ساتھی کو معطل کیا، اور تمام افسران کا ریکارڈ delete کر دیا۔ اِسی لیے `96b` کے
  آخر میں **تصدیق** موجود ہے: اگر `SELECT` کے علاوہ کچھ بھی بچ جائے تو view ہٹا
  کر خطا دی جاتی ہے۔ اگر کبھی یہ view دوبارہ بنانا پڑے تو `96b` ہی چلائیں —
  ہاتھ سے `create view` کے بعد huqooq واپس لینا بھول جانا آسان ہے۔
- **تھانہ کی شرط:** افسر کو صرف اپنے تھانہ کے ساتھی نظر آتے ہیں (اور اپنا ریکارڈ
  ہمیشہ)؛ غیر معطل admin کو سب۔ نتیجہ: دوسرے تھانہ سے share کیے گئے مقدمے کی
  ضمنی پر لکھنے والے افسر کا نام خالی آ سکتا ہے۔ شرط ہٹانے کے لیے `96b_ROLLBACK`۔

---

## ⚠ جو مسودے **نہ** چلائیں

اِس کام کے شروع میں کچھ فائلیں میرے **اندازوں** پر لکھی گئی تھیں، اصل schema
دیکھنے سے پہلے۔ بعد میں معلوم ہوا کہ آپ کے ڈیٹابیس پر پہلے سے بہتر چیزیں موجود
ہیں۔ وہ مسودے جان بوجھ کر اِس فولڈر میں **شامل نہیں** ہیں:

- `20_officers_protect_trigger.sql` / `21_officers_protect_v2.sql` — **خطرناک۔**
  اِن میں `auth.uid() is null` کو "یہ سرور ہے، سب اجازت" مانا گیا تھا۔ مگر
  `anon` کا بھی uid null ہوتا ہے — یعنی یہ trigger anon کو پورا راستہ دے دیتا۔
  آپ کا موجودہ `dio_protect_officers()` `current_user = 'service_role'` دیکھتا
  ہے، جو درست ہے۔ **اُسی کو رکھیں۔**
- `50_suspend_hard_gate.sql` — آپ کا موجودہ `dio_has_active_sub()` بہتر ہے: وہ
  `trial` کو خالی `expires_at` کے ساتھ قبول نہیں کرتا۔ **اُسی کو رکھیں۔**
- `10_subscription_enforcement.sql` — `92b` نے یہ کام لے لیا۔
- `41_rls_enable_safe.sql` — `93b` نے یہ کام لے لیا۔
- `60_subscriptions_lockdown.sql` — `94a–94d` + `95` نے یہ کام لے لیا۔ (اِس میں
  `notes` کالم فرض کیا گیا تھا، جو آپ کے schema میں نہیں ہے۔)
- `70_no_entry_on_expiry.sql` — **منسوخ۔** یہ میعاد ختم پر پڑھنا بھی بند کرتی
  ہے، جو "دیکھ سکتے ہو، بدل نہیں سکتے" کے فیصلے کے خلاف ہے۔ اصل میں یہی خیال
  (`dio_sub_sel`) پہلے لگایا گیا تھا، افسر کا تالا لگا، اور حل کے طور پر RLS
  بند کر دی گئی — یعنی تحفظ ہی ختم ہو گیا۔ **دوبارہ نہ لگائیں۔**
- `30_client_errors_optional.sql` — `client_errors` آپ کے DB میں پہلے سے موجود
  ہے (اپنی policy کے ساتھ)۔ یہ فائل اُس سے ٹکراتی ہے۔

---

## رہ گیا کام

1. **Subscription کا بہاؤ live پر جانچیں** — یہی ایک چیز ہے جو ابھی تک اصل app
   میں چلا کر نہیں دیکھی گئی۔ تفصیل `99_verify_subscription_flow.sql` کے سر پر۔
2. **بے کار tables کا فیصلہ** — `97_audit_dead_tables.sql` چلا کر گنتی دیکھیں۔
   جن میں صفر قطاریں ہوں اور app میں نام بھی نہ آتا ہو، وہ ہٹائی جا سکتی ہیں۔
   **کوئی `DROP` خود بخود نہیں ہوتا — فیصلہ آپ کا۔** app میں اِن میں سے کسی کا
   نام نہیں آتا: `patrol_logs`, `patrol_shifts`, `patrol_tokens`,
   `shared_patrol_entries`, `diary_entries`, `pending_registrations`,
   `cdr_uploads`, `admin_dashboard`, اور `audit_log` (واحد)۔
3. **GAA 738 کا trial 10 نومبر 2026 کو ختم** — اُس کے بعد وہ افسر صرف پڑھ سکے گا
   جب تک subscription منظور نہ ہو۔

### طے ہو گیا (12 اکتوبر)

- **کون سا audit table اصل ہے:** `audit_logs` (جمع)۔ `dio-audit.js` اُسی میں
  لکھتا ہے، `admin.js` اُسی کو پڑھتا ہے۔ `audit_log` (واحد) صرف `admin.js` کے
  ایک comment میں آتا ہے جہاں اُسے "non-existent" کہا گیا — یعنی وہ بے کار ہے۔
- **`getIOSignLine`** اب `app-core.js` میں موجود ہے — وہی طریقہ جو
  `getSHOSignLine` کا ہے (`typeof` گارڈ کے ساتھ)۔ منطق نئی نہیں بنائی، بلکہ
  `darkhwastain.js` کے `_dkIoLine()` کی نقل ہے تاکہ پورے سسٹم میں تفتیشی افسر
  کی لائن ایک جیسی رہے۔ 12 جانچیں پاس۔
- **دوہری policies** — فائل 98 نے صاف کر دیں (صرف وہ جو بالکل ایک جیسی تھیں،
  اِس لیے عمل ذرا برابر نہیں بدلا)۔
- **`admin_dashboard`** — اب `security_invoker = true`، یعنی RLS کو نظرانداز
  نہیں کر سکتا۔
