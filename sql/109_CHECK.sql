-- 109_CHECK — SIRF PARHTI HAI. Aik statement. Sab "true" hon to theek.
-- 'backup_barabar': backup ki qataarein = asal ki qataarein (109 chalne ke foran baad).
-- Baad me afsar naya kaam kare to asal barh jati hai — tab ye false hona theek hai.
with core(t) as (values ('cases'), ('zimni_reports'), ('zimni_androoni_reports'), ('report_173')),
c as (
  select t,
    (select count(*) = 4 from information_schema.columns where table_schema = 'public' and table_name = t
       and column_name in ('rev', 'deleted_at', 'last_device', 'updated_at')) as khane,
    exists (select 1 from pg_trigger where tgname = 'dio_sync_touch' and tgrelid = to_regclass('public.' || t)) as trigger,
    exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) as realtime,
    to_regclass('public.dio_bak_109_' || t) is not null as backup,
    case when to_regclass('public.dio_bak_109_' || t) is not null then
      (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', 'dio_bak_109_' || t), false, true, '')))[1]::text::bigint end as backup_qataarein,
    (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', t), false, true, '')))[1]::text::bigint as asal_qataarein,
    coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.dio_bak_109_' || t)), false) as backup_rls,
    not exists (select 1 from information_schema.role_table_grants where table_schema = 'public'
                and table_name = 'dio_bak_109_' || t and grantee in ('anon', 'authenticated')) as backup_band
  from core
)
select jsonb_pretty(jsonb_build_object(
  'har_table', (select jsonb_object_agg(t, jsonb_build_object('khane', khane, 'trigger', trigger, 'realtime', realtime,
                  'backup', backup, 'backup_rls', backup_rls, 'backup_api_se_band', backup_band,
                  'backup_qataarein', backup_qataarein, 'asal_qataarein', asal_qataarein,
                  'backup_barabar', backup_qataarein = asal_qataarein)) from c),
  'sab_4_tayyar', (select bool_and(khane and trigger and realtime and backup and backup_rls and backup_band) from c),
  'user_data_mojood', to_regclass('public.dio_user_data') is not null,
  'user_data_rls_on', coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.dio_user_data')), false),
  'user_data_apni_4', (select count(*) = 4 from pg_policies where schemaname = 'public' and tablename = 'dio_user_data'
                         and policyname in ('dio_ud_sel', 'dio_ud_ins', 'dio_ud_upd', 'dio_ud_del') and permissive = 'PERMISSIVE'),
  'user_data_rok_3', (select count(*) = 3 from pg_policies where schemaname = 'public' and tablename = 'dio_user_data'
                         and policyname in ('dio_wgate_ins', 'dio_wgate_upd', 'dio_wgate_del') and permissive = 'RESTRICTIVE'),
  'user_data_koi_aur_policy_nahi', (select count(*) = 7 from pg_policies where schemaname = 'public' and tablename = 'dio_user_data'),
  'user_data_anon_band', not exists (select 1 from information_schema.role_table_grants
                         where table_schema = 'public' and table_name = 'dio_user_data' and grantee = 'anon'),
  'user_data_authenticated_sirf_4', (select array_agg(privilege_type::text order by privilege_type) = array['DELETE','INSERT','SELECT','UPDATE']
                         from information_schema.role_table_grants
                         where table_schema = 'public' and table_name = 'dio_user_data' and grantee = 'authenticated'),
  'user_data_realtime', exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
                         and schemaname = 'public' and tablename = 'dio_user_data'),
  'user_data_trigger', exists (select 1 from pg_trigger where tgname = 'dio_sync_touch' and tgrelid = to_regclass('public.dio_user_data')),
  'user_data_qataarein', case when to_regclass('public.dio_user_data') is not null then
                         (xpath('/row/n/text()', query_to_xml('select count(*) as n from public.dio_user_data', false, true, '')))[1]::text::bigint end
)) as digital_io_109_check;
