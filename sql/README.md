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
| 96 | `96_CHECK.sql` | `client_errors` کی پالیسی اور `officers` کا trigger براہِ راست DB سے جانچتی ہے | صرف پڑھتی ہے |
| 97 | `97_officers_approved_fail_closed.sql` | `dio_protect_officers()`: manzoori NULL والا admin اب اختیار نہیں پاتا (fail-closed)۔ ایسا admin موجود ہو تو فائل کچھ نہیں بدلتی۔ واپسی: `97_ROLLBACK.sql` | **چل چکی** (13 اکتوبر 2026 — 96_CHECK: دونوں THEEK) |
| 98 | `98_CHECK.sql` | پالیسیوں کی صفائی سے **پہلے** کی تصویر: ہوبہو دوہری policies، `audit_log`/`audit_logs` کس کے کام کی ہیں، `case_accused` کی policies | صرف پڑھتی ہے |
| 99 | `99_audit_log_immutable.sql` | `audit_log` کی "Nobody can delete/update" policies PERMISSIVE تھیں، یعنی بے اثر — افسر اپنا آڈٹ ریکارڈ مٹا/بدل سکتا تھا۔ اب RESTRICTIVE۔ پڑھنا/لکھنا ویسا ہی۔ واپسی: `99_ROLLBACK.sql` | **چل چکی** (13 اکتوبر 2026 — دونوں RESTRICTIVE کی تصدیق) |
| 100 | `100_email_notify.sql` | رجسٹریشن / منظوری / سبسکرپشن پر خودکار ای میل (Edge Function `dio-notify` پہلے deploy کریں) | **نئی** |
| 101 | `101_naya_andraj.sql` | «نیا اندراج»: ملزم/گواہ کی کئی تصاویر، شناختی کارڈ کے دونوں رخ، سابقہ ریکارڈ — صرف نئے کالم جوڑتی ہے (کچھ نہیں بدلتی)۔ جانچ: `101_CHECK.sql`، واپسی: `101_ROLLBACK.sql` | **چل چکی** (13 اکتوبر 2026 — 101_CHECK: تمام 8 خانے THEEK) |
| 102 | `102_5c_muqadma.sql` | 5-C درخواست کو مقدمے سے جوڑنا (اختیاری): `applications_5c` میں `case_id` اور `fir_number` — صرف نئے کالم۔ جانچ: `102_CHECK.sql`، واپسی: `102_ROLLBACK.sql` | **نئی — چلانی ہے** |

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

**ٹیسٹ (v529):** `tests/security.test.js` کے SQL ٹیسٹ پہلے اوپر والے مسودوں
کو ڈھونڈتے تھے (اس لیے 10 ٹیسٹ ناکام تھے)۔ اب وہی حفاظتی شرطیں **اصل چلائی
گئی** فائلوں (91–95) پر جانچی جاتی ہیں، اور یہ بھی کہ اوپر والے خطرناک مسودے
(20/21/70) دوبارہ ریپو میں نہ آئیں۔

---

## رہ گیا کام

1. ~~**Edge function deploy کریں** (`dio-license`)~~ — **مکمل (13 اکتوبر 2026 کو تصدیق)۔**
   ایپ سے تازہ لائسنس ملا (`plan: owner`)۔ پرانا v2 غلط کالم (`is_suspended`)
   کی وجہ سے ہر افسر پر ناکام ہوتا تھا اور کبھی لائسنس نہیں دیتا تھا — یعنی
   درست ورژن چل رہا ہے۔ Gateway پر "Verify JWT" **آن** ہے، اور یہ ٹھیک ہے:
   ایپ لائسنس مانگتے وقت لاگ اِن شدہ افسر کا JWT خود بھیجتی ہے۔ (اسی وجہ سے
   براؤزر میں سیدھا `?pubkey` کھولنے پر `UNAUTHORIZED_NO_AUTH_HEADER` آتا
   ہے — یہ خرابی نہیں۔)
2. ~~**پالیسیوں کی صفائی**~~ — **مکمل (13 اکتوبر 2026)۔** `audit_log` پر دو تقریباً ایک جیسی
   "Nobody can delete" policies، `case_accused` پر دو ایک جیسی ownership
   policies، اور دو الگ audit tables (`audit_log` اور `audit_logs`)۔
   **نتیجہ (13 اکتوبر 2026، `98_CHECK`):** ہوبہو دوہری policy **کوئی نہیں** —
   ہٹانے کو کچھ نہیں۔ دونوں audit tables **استعمال میں** ہیں اور الگ کام کی ہیں:
   `audit_log` (335 قطاریں) میں DB کے triggers/functions لکھتے ہیں، `audit_logs`
   (362) میں ایپ (`dio-audit.js`)۔ دونوں رہیں گی۔ البتہ ایک اصل خامی ملی:
   `audit_log` کی "Nobody can…" policies PERMISSIVE (بے اثر) تھیں → `99` **چل چکی** — **یہ کام مکمل۔**
3. ~~**`getIOSignLine`** کہیں define نہیں~~ — **حل ہو چکا:** `app-core.js`
   میں بن چکا ہے (نام + عہدہ + تھانہ، `darkhwastain.js` کی `_dkIoLine()` جیسا)،
   اس لیے ضمنی کی دستاویزات میں تفتیشی افسر کی لائن اب آتی ہے۔
