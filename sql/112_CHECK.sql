-- ═══════════════════════════════════════════════════════════════════════
--  112_CHECK (v568 — TASK 7-C)   صرف پڑھتی ہے (READ-ONLY): کچھ بھی تبدیل، حذف یا نیا نہیں بنتا۔
--  ایک ہی statement — ایک ہی نتیجہ۔
-- ───────────────────────────────────────────────────────────────────────
--  مقصد: افسر کی شکایت (4 نومبر 2026) — «بیان 161 محفوظ کیا، سبز پیغام «سرور پر محفوظ ہو گئی» آیا، پھر
--  غائب»۔ ایپ میں یہ صرف ایک صورت میں ہوتا تھا: سرور نئے بیان کو «دوہرا» (23505 — unique) کہہ کر رد کرے
--  اور ایپ اسے اپنی پچھلی کوشش سمجھ لے۔ یہ جانچ دکھاتی ہے کہ آپ کے ڈیٹابیس میں ایسی پابندی ہے یا نہیں:
--   • qism = 'unique'   → بیانات / ضمنیات کی جدول پر ہر unique index (id کے علاوہ) — اگر (case_id, serial_no)
--                          نظر آئے تو اصل وجہ یہی تھی
--   • qism = 'حذف شدہ'  → حذف شدہ (deleted_at) بیانات جن کا نمبر اسی مقدمے میں دوبارہ آ سکتا تھا
--  چلانا: Supabase → SQL Editor → یہ پوری فائل paste کریں → Run → نتیجہ بھیجیں۔
-- ═══════════════════════════════════════════════════════════════════════
select 'unique'::text                      as qism,
       i.tablename::text                   as jadwal,
       i.indexname::text                   as naam,
       i.indexdef::text                    as tafseel
  from pg_indexes i
 where i.schemaname = 'public'
   and i.tablename in ('zimni_androoni_reports', 'zimni_reports')
   and i.indexdef ilike '%unique%'
   and i.indexname not like '%_pkey'
union all
select 'حذف شدہ',
       'zimni_androoni_reports',
       count(*)::text,
       'حذف شدہ بیانات (deleted_at) — مقدمات: ' || count(distinct to_jsonb(t)->>'case_id')::text
  from public.zimni_androoni_reports t
 where to_jsonb(t)->>'deleted_at' is not null;
