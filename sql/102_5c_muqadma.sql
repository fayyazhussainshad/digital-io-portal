-- 102 — 5-C درخواست کو مقدمے سے جوڑنا (اختیاری). AIK statement.
--
-- SIRF NAYE KHANE JORTI HAI — koi purana khana, data, policy ya RLS nahi
-- badalti. Dobara chalane se koi nuqsan nahi.
--   applications_5c.case_id    — wohi qisam jo public.cases.id ki hai (khud dekh kar)
--   applications_5c.fir_number — مقدمہ نمبر (mocaddma hat bhi jaye to nambar yaad rahe)
-- Foreign key jaan boojh kar NAHI: mocaddma hazf ho to 5-C درخواست hazf na ho.
do $fivec102$
declare
  id_type text;
begin
  select format_type(a.atttypid, a.atttypmod) into id_type
  from pg_attribute a
  where a.attrelid = 'public.cases'::regclass and a.attname = 'id' and not a.attisdropped;
  if id_type is null then id_type := 'uuid'; end if;

  execute format('alter table public.applications_5c add column if not exists case_id %s', id_type);
  alter table public.applications_5c add column if not exists fir_number text;

  notify pgrst, 'reload schema';
  raise notice '102 — applications_5c: case_id (%) + fir_number tayyar', id_type;
end;
$fivec102$;
