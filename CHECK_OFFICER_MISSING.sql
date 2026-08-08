-- ═══════════════════════════════════════════════════════════════════
--  افسر کا ریکارڈ نہ ملنے کی تشخیص
--  Supabase → SQL Editor میں ایک ایک کر کے چلائیں
-- ═══════════════════════════════════════════════════════════════════

-- ── قدم 1: جس اکاؤنٹ سے لاگ اِن ہیں، اُس کا افسر ریکارڈ ہے یا نہیں؟ ──
SELECT
  u.id            AS user_id,
  u.email,
  u.created_at    AS account_bana,
  o.id            AS officer_id,
  o.full_name,
  o.station,
  o.role,
  CASE WHEN o.id IS NULL
       THEN '❌ افسر ریکارڈ نہیں — یہی مسئلہ ہے'
       ELSE '✅ ٹھیک ہے'
  END AS halat
FROM auth.users u
LEFT JOIN officers o ON o.user_id = u.id
WHERE u.id = '2fad866f-bec5-4c0e-8314-8ab5b72155b4';


-- ── قدم 2: اِس سسٹم کے تمام اکاؤنٹس اور اُن کے افسر ریکارڈ ──
--     (دیکھیں آپ کا اصل اکاؤنٹ کون سا ہے)
SELECT
  u.email,
  u.id AS user_id,
  o.full_name,
  o.station,
  o.role,
  CASE WHEN o.id IS NULL THEN '❌ ریکارڈ نہیں' ELSE '✅ موجود' END AS halat
FROM auth.users u
LEFT JOIN officers o ON o.user_id = u.id
ORDER BY u.created_at DESC;


-- ── قدم 3: کیا پرانا افسر ریکارڈ کسی اور user_id سے جڑا ہے؟ ──
--     (پہلے والا officer_id: d6b3b62b-76d9-4436-a681-a532941f9d90)
SELECT id, user_id, full_name, station, role, created_at
FROM officers
ORDER BY created_at DESC;


-- ═══════════════════════════════════════════════════════════════════
--  ⚠️  نیچے والا حصہ صرف اُس صورت میں چلائیں جب قدم 1 میں
--      '❌ افسر ریکارڈ نہیں' آئے اور آپ کو یقین ہو کہ یہی آپ کا
--      اصل اکاؤنٹ ہے۔ پہلے قدم 2 دیکھ لیں — ہو سکتا ہے آپ کا
--      اصل اکاؤنٹ کوئی اور ای میل ہو، تو صرف اُس سے لاگ اِن کر لیں۔
-- ═══════════════════════════════════════════════════════════════════

-- ── صورت الف: پرانا افسر ریکارڈ موجود ہے، بس user_id غلط ہے ──
--     (یعنی آپ نے نیا اکاؤنٹ بنا لیا مگر ڈیٹا پرانے سے جڑا ہے)
--     نیچے کی سطر سے -- ہٹا کر چلائیں:

-- UPDATE officers
-- SET user_id = '2fad866f-bec5-4c0e-8314-8ab5b72155b4'
-- WHERE id = 'd6b3b62b-76d9-4436-a681-a532941f9d90';


-- ── صورت ب: بالکل نیا افسر ریکارڈ بنانا ہے ──
--     نام/رینک/تھانہ اپنے مطابق بدل لیں، پھر -- ہٹا کر چلائیں:

-- INSERT INTO officers (user_id, full_name, designation, station, district, role)
-- VALUES (
--   '2fad866f-bec5-4c0e-8314-8ab5b72155b4',
--   'فیاض حسین شاد',      -- نام
--   'ASI',                 -- عہدہ
--   'صدر ملتان',           -- تھانہ
--   'ملتان',               -- ضلع
--   'superadmin'           -- کردار
-- );


-- ── تصدیق: چلانے کے بعد قدم 1 دوبارہ چلائیں، '✅ ٹھیک ہے' آنا چاہیے ──
