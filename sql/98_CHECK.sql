-- 98_CHECK — SIRF PARHTI HAI (kuch nahi badalti). AIK statement.
--
-- Maqsad: "policies ki safai" (README, rah gaya kaam #2) se PEHLE poori
-- tasveer — taake koi zaroori cheez ghalti se na hate.
--
--   1) hubahu_doharavi_policies — poore `public` schema me woh policies jo
--      bilkul aik jaisi hain (wahi table, wahi hukm, wahi roles, wahi shart).
--      Aisi do me se aik hatane se hifazat par koi farq nahi parta.
--   2) audit_log / audit_logs — dono tables: mojood? kitni qataren? kaun se
--      khane? kaun si policies? aur DB ka kaun sa function inme likhta hai.
--      (App ka code — dio-audit.js — sirf `audit_logs` me likhta hai; magar
--      officers ke DB triggers shayad `audit_log` me likhte hon. Is liye
--      kisi ko hatane ka faisla isi natije se hoga, andaze se nahi.)
--   3) case_accused ki tamam policies — doharavi pehchanne ke liye.
with
dup as (
  select p.tablename, p.cmd, p.permissive, p.roles, p.qual, p.with_check,
         array_agg(p.policyname order by p.policyname) as naam, count(*) as tadaad
  from pg_policies p
  where p.schemaname = 'public'
  group by p.tablename, p.cmd, p.permissive, p.roles, p.qual, p.with_check
  having count(*) > 1
),
tbl as (
  select t.naam, to_regclass('public.' || t.naam) as oid
  from (values ('audit_log'), ('audit_logs')) as t(naam)
),
info as (
  select tbl.naam,
         tbl.oid is not null as mojood,
         case when tbl.oid is null then null
              else (xpath('/row/c/text()',
                     query_to_xml('select count(*) as c from public.' || quote_ident(tbl.naam),
                                  false, true, '')))[1]::text::bigint
         end as qataren,
         (select jsonb_agg(c.column_name::text order by c.ordinal_position)
            from information_schema.columns c
           where c.table_schema = 'public' and c.table_name = tbl.naam) as khane,
         (select c.relrowsecurity from pg_class c where c.oid = tbl.oid) as rls_on,
         (select jsonb_agg(jsonb_build_object('naam', p.policyname, 'hukm', p.cmd,
                   'qism', p.permissive,
                   'roles', p.roles, 'using', p.qual, 'with_check', p.with_check)
                   order by p.policyname)
            from pg_policies p
           where p.schemaname = 'public' and p.tablename = tbl.naam) as policies,
         -- kaun se DB functions is table ka naam lete hain (\m \M = poora lafz;
         -- is liye 'audit_log' 'audit_logs' se nahi milta)
         (select jsonb_agg(distinct pr.proname::text)
            from pg_proc pr join pg_namespace n on n.oid = pr.pronamespace
           where n.nspname = 'public'
             and pr.prosrc ~ ('\m' || tbl.naam || '\M')) as functions_jo_naam_lete_hain
  from tbl
)
select jsonb_pretty(jsonb_build_object(
  '1_hubahu_doharavi_policies', jsonb_build_object(
    'tadaad', (select count(*) from dup),
    'fehrist', coalesce((select jsonb_agg(jsonb_build_object(
                  'table', tablename, 'hukm', cmd, 'qism', permissive, 'roles', roles,
                  'policies', naam, 'using', qual, 'with_check', with_check)
                  order by tablename, cmd) from dup), '[]'::jsonb)),
  '2_audit_tables', (select jsonb_object_agg(naam, jsonb_build_object(
                  'mojood', mojood, 'qataren', qataren, 'rls_on', rls_on, 'khane', khane,
                  'policies', coalesce(policies, '[]'::jsonb),
                  'functions_jo_naam_lete_hain', coalesce(functions_jo_naam_lete_hain, '[]'::jsonb)))
                from info),
  '3_case_accused_policies', coalesce((select jsonb_agg(jsonb_build_object(
                  'naam', p.policyname, 'hukm', p.cmd, 'qism', p.permissive, 'roles', p.roles,
                  'using', p.qual, 'with_check', p.with_check) order by p.policyname)
                from pg_policies p
                where p.schemaname = 'public' and p.tablename = 'case_accused'), '[]'::jsonb)
)) as digital_io_98_check;
