-- ═══════════════════════════════════════════════════════════════════════
--  107_CHECK (v558) — صرف پڑھنے والی جانچ (READ-ONLY): کچھ بھی تبدیل یا حذف نہیں ہوتا
--  مقصد: (1) «لیپ ٹاپ پر محفوظ ضمنیاں موبائل پر نظر نہیں آتیں» — سرور پر کون سی ضمنیاں ہیں؟
--        (2) «بیان محفوظ کرنے کے باوجود کہیں نہیں» — سرور پر کون سے بیانات (اندرونی ضمنی) ہیں؟
--        (3) کیا کوئی بیان غلطی سے «چالان» (report_173) کی جدول میں گیا؟
--  Supabase → SQL Editor میں پوری فائل چلائیں (ایک ہی statement — ایک ہی نتیجہ)۔
--    qism = «ضمنی (بیرونی)»              → سرور پر تازہ ترین 30 ضمنیاں
--    qism = «بیان (اندرونی ضمنی)»         → سرور پر تازہ ترین 30 بیانات (گواہان کے نام سمیت)
--    qism = «چالان کی جدول میں بیان»      → یہ قطار نہ آئے = کوئی بیان غلطی سے چالان میں نہیں گیا
-- ═══════════════════════════════════════════════════════════════════════
select * from (
  select 'ضمنی (بیرونی)'::text                    as qism,
         to_jsonb(z)->>'id'                       as id,
         to_jsonb(z)->>'case_id'                  as case_id,
         to_jsonb(z)->>'serial_no'                as serial_no,
         to_jsonb(z)->>'report_date'              as report_date,
         to_jsonb(z)->>'created_at'               as created_at,
         ''::text                                 as gawahan
  from zimni_reports z
  order by coalesce(to_jsonb(z)->>'created_at', '') desc
  limit 30
) z1
union all
select * from (
  select 'بیان (اندرونی ضمنی)'::text,
         to_jsonb(t)->>'id',
         to_jsonb(t)->>'case_id',
         to_jsonb(t)->>'serial_no',
         to_jsonb(t)->>'report_date',
         to_jsonb(t)->>'created_at',
         coalesce(to_jsonb(t)->'content'->>'witnesses', '')
  from zimni_androoni_reports t
  order by coalesce(to_jsonb(t)->>'created_at', '') desc
  limit 30
) a1
union all
select 'چالان کی جدول میں بیان'::text,
       to_jsonb(r)->>'id',
       to_jsonb(r)->>'case_id',
       to_jsonb(r)->>'report_type',
       null,
       to_jsonb(r)->>'created_at',
       ''
from report_173 r
where (to_jsonb(r)->'form_data') ? 'fdate'
   or (to_jsonb(r)->'form_data') ? 'jurm_suf';
