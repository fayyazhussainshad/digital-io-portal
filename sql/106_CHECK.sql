-- 106_CHECK — SIRF PARHTI HAI (kuch nahi badalta). Aik statement.
-- (v552) Purani app ضمنی کی تاریخ DD/MM/YYYY شکل میں بھیجتی تھی۔ ڈیٹابیس (DateStyle
-- "ISO, MDY") پہلا حصہ مہینہ سمجھتا ہے: 08/10/2026 → 2026-08-10 (غلط — اگست!) اور
-- 14/10/2026 → رد (یہی «zimni_content» والی خرابی تھی)۔ یہ جانچ گنتی ہے کہ کتنی محفوظ
-- ضمنیوں میں report_date اسی ضمنی کے کالم 1 (col1_date) کی تاریخ سے مختلف ہے۔
-- 'ghalat_tareekh' > 0 ہو تو 106_zimni_report_date_fix.sql چلائیں۔
-- (`content` کا خانہ نہ ہو تو یہ خرابی دے گی — تب پہلے 105_CHECK.sql)
with z as (
  select id, report_date,
         regexp_match(coalesce(content::jsonb ->> 'col1_date', ''), '(\d{1,2})\s*/\s*(\d{1,2})\s*/\s*(\d{4})') as m
  from public.zimni_reports
), p as (
  select id, report_date, m,
         case when m is not null and m[2]::int between 1 and 12 and m[1]::int between 1 and 31
                   and extract(month from (make_date(m[3]::int, m[2]::int, 1) + (m[1]::int - 1))) = m[2]::int
              then (make_date(m[3]::int, m[2]::int, 1) + (m[1]::int - 1)) end as sahi
  from z
)
select jsonb_pretty(jsonb_build_object(
  'kul_zimniyan',      (select count(*) from p),
  'col1_tareekh_wali', (select count(*) from p where sahi is not null),
  'ghalat_tareekh',    (select count(*) from p where sahi is not null and report_date is distinct from sahi),
  'misaal',            (select coalesce(jsonb_agg(jsonb_build_object('id', id, 'mehfooz', report_date, 'sahi', sahi)), '[]'::jsonb)
                          from (select * from p where sahi is not null and report_date is distinct from sahi limit 5) s)
));
