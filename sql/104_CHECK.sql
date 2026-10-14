-- 104_CHECK — SIRF PARHTI HAI. Aik statement. Sab "true" hon to theek.
-- Aakhri khana (authenticated_truncate) 104 ka hissa nahi — sirf ittila:
-- jin tables par logged-in afsar ko TRUNCATE ka haq hai (RLS us par lagti
-- hi nahi — 81 dekhein). Natija bhejein; fehrist khali na ho to alag file
-- se band kiya jayega.
select jsonb_pretty(jsonb_build_object(
  'table_mojood',     to_regclass('public.gasht_logs') is not null,
  'rls_on',           coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.gasht_logs')), false),
  'apni_4_policies',  (select count(*) = 4 from pg_policies where schemaname = 'public' and tablename = 'gasht_logs'
                         and policyname in ('dio_gasht_sel','dio_gasht_ins','dio_gasht_upd','dio_gasht_del')
                         and permissive = 'PERMISSIVE'),
  'rok_3_policies',   (select count(*) = 3 from pg_policies where schemaname = 'public' and tablename = 'gasht_logs'
                         and policyname in ('dio_wgate_ins','dio_wgate_upd','dio_wgate_del')
                         and permissive = 'RESTRICTIVE'),
  'koi_aur_policy_nahi', (select count(*) = 7 from pg_policies where schemaname = 'public' and tablename = 'gasht_logs'),
  'anon_ka_koi_haq_nahi', not exists (select 1 from information_schema.role_table_grants
                         where table_schema = 'public' and table_name = 'gasht_logs' and grantee = 'anon'),
  'authenticated_ke_haq', (select coalesce(jsonb_agg(privilege_type order by privilege_type), '[]'::jsonb)
                         from information_schema.role_table_grants
                         where table_schema = 'public' and table_name = 'gasht_logs' and grantee = 'authenticated'),
  'authenticated_sirf_4', (select array_agg(privilege_type::text order by privilege_type)
                         = array['DELETE','INSERT','SELECT','UPDATE']
                         from information_schema.role_table_grants
                         where table_schema = 'public' and table_name = 'gasht_logs' and grantee = 'authenticated'),
  'updated_at_trigger', exists (select 1 from pg_trigger where tgname = 'dio_gasht_touch'
                         and tgrelid = to_regclass('public.gasht_logs')),
  'qataarein',        (select count(*) from public.gasht_logs),
  'ittila_authenticated_truncate', (select coalesce(jsonb_agg(table_name order by table_name), '[]'::jsonb)
                         from information_schema.role_table_grants
                         where table_schema = 'public' and grantee = 'authenticated' and privilege_type = 'TRUNCATE')
)) as digital_io_104_check;
