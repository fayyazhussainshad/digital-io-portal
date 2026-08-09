-- ═══════════════════════════════════════════════════════════════════
--  کراس ورژن — رپٹ نمبر اور رپٹ کی تاریخ کے نئے خانے
--  Supabase → SQL Editor میں چلائیں (ایک ہی بار)
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS cross_rapat_number TEXT,
  ADD COLUMN IF NOT EXISTS cross_rapat_date   DATE;

-- ── تصدیق: نیچے چلائیں، دونوں خانے نظر آنے چاہئیں ──
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'cases'
  AND column_name IN ('cross_rapat_number', 'cross_rapat_date')
ORDER BY column_name;
