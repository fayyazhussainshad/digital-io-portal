-- 105_CHECK — SIRF PARHTI HAI (kuch nahi badalta). Aik statement.
-- Maqsad (v552): ضمنی محفوظ نہ ہونے کی وجہ ڈیٹابیس کی طرف سے پکی کرنا۔
-- Natija bhejein. Agar 'mawad_ka_khana' (content) false ho to 105_zimni_content.sql chalayein;
-- true ho to KUCH NA chalayein — app (v552) khud theek ho chuki hai (تاریخ YYYY-MM-DD)۔
select jsonb_pretty(jsonb_build_object(
  'table_mojood',      to_regclass('public.zimni_reports') is not null,
  'mawad_ka_khana',    exists (select 1 from information_schema.columns
                         where table_schema = 'public' and table_name = 'zimni_reports' and column_name = 'content'),
  'khanay_aur_qism',   (select coalesce(jsonb_object_agg(column_name, data_type order by ordinal_position), '{}'::jsonb)
                         from information_schema.columns
                         where table_schema = 'public' and table_name = 'zimni_reports'),
  'report_date_qism',  (select data_type from information_schema.columns
                         where table_schema = 'public' and table_name = 'zimni_reports' and column_name = 'report_date'),
  'datestyle',         current_setting('datestyle'),
  'policies',          (select coalesce(jsonb_agg(policyname order by policyname), '[]'::jsonb)
                         from pg_policies where schemaname = 'public' and tablename = 'zimni_reports')
));
