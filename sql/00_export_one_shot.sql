-- ============================================================================
-- Digital IO — STEP 1 (aik hi query wala tareeqa)
-- ----------------------------------------------------------------------------
-- YE SIRF PARHTI HAI. Koi table, policy, function, trigger ya row NAHI badalti.
-- Jitni baar chahein chalayen — bila-khatar.
--
-- `00_export_current_schema.sql` me 9 alag sections hain (repo ke record ke
-- liye). Ye file wohi kaam AIK natije me kar deti hai, taake aik hi baar Run
-- dabana paday aur aik hi cheez copy karni paday.
--
-- Natija: aik row, aik khana — JSON. Us me:
--   tables                      — har table, RLS on/off, aur us par lagi policies
--   officers_columns            — mo'attali ka khana kis naam se hai (AHEM)
--   subscriptions_columns       — RPC inhi khanon me likhta hai (AHEM)
--   subscription_plans_columns  — duration_days mojood hai ya nahi (AHEM)
--   dio_functions               — hamari lagai gayi functions (ab tak kya laga)
--   public_triggers             — mojooda triggers
--   officers_unique_indexes     — user_id par unique index hai ya nahi
--   officers_duplicate_user_ids — AIK user par do afsar records (khali hona chahiye)
--   officers_role_counts        — kitne superadmin/admin/officer hain
--   subscription_status_counts  — kaun kaun se status waqai istemal me hain
--
-- Chalane ka tareeqa: Supabase → SQL Editor → sab kuch paste karein → Run.
-- Phir natije par "Download CSV" dabayen aur wo file bhej dein.
-- ============================================================================

select (jsonb_build_object(

  'tables', (
    select jsonb_agg(x order by x->>'table_name')
    from (
      select jsonb_build_object(
               'table_name',  c.relname,
               'rls_enabled', c.relrowsecurity,
               'rls_forced',  c.relforcerowsecurity,
               'policies', coalesce((
                 select jsonb_agg(jsonb_build_object(
                          'name', p.polname,
                          'permissive', case p.polpermissive
                                          when true then 'PERMISSIVE'
                                          else 'RESTRICTIVE' end,
                          'cmd', case p.polcmd
                                   when 'r' then 'SELECT'
                                   when 'a' then 'INSERT'
                                   when 'w' then 'UPDATE'
                                   when 'd' then 'DELETE'
                                   else 'ALL' end)
                        order by p.polname)
                 from pg_policy p where p.polrelid = c.oid), '[]'::jsonb)
             ) as x
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    ) s
  ),

  'officers_columns', (
    select jsonb_agg(jsonb_build_object(
             'column_name', column_name,
             'data_type',   data_type,
             'is_nullable', is_nullable)
           order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'officers'
  ),

  'subscriptions_columns', (
    select jsonb_agg(jsonb_build_object(
             'column_name', column_name,
             'data_type',   data_type,
             'is_nullable', is_nullable)
           order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscriptions'
  ),

  'subscription_plans_columns', (
    select jsonb_agg(jsonb_build_object(
             'column_name', column_name,
             'data_type',   data_type)
           order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'subscription_plans'
  ),

  'dio_functions', coalesce((
    select jsonb_agg(jsonb_build_object(
             'name', p.proname,
             'args', pg_get_function_identity_arguments(p.oid),
             'security_definer', p.prosecdef)
           order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'dio_%'), '[]'::jsonb),

  'public_triggers', coalesce((
    select jsonb_agg(jsonb_build_object(
             'table_name', c.relname, 'trigger_name', t.tgname)
           order by c.relname, t.tgname)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and not t.tgisinternal), '[]'::jsonb),

  'officers_unique_indexes', coalesce((
    select jsonb_agg(indexname order by indexname)
    from pg_indexes
    where schemaname = 'public' and tablename = 'officers'
      and indexdef like '%UNIQUE%'), '[]'::jsonb),

  'officers_duplicate_user_ids', coalesce((
    select jsonb_agg(jsonb_build_object('user_id', user_id, 'kitni_rows', n))
    from (
      select user_id, count(*) as n
      from public.officers
      where user_id is not null
      group by user_id
      having count(*) > 1
    ) d), '[]'::jsonb),

  'officers_role_counts', coalesce((
    select jsonb_agg(jsonb_build_object('role', role, 'kitne', n) order by n desc)
    from (select role, count(*) as n from public.officers group by role) r), '[]'::jsonb),

  'subscription_status_counts', coalesce((
    select jsonb_agg(jsonb_build_object('status', status, 'kitne', n) order by n desc)
    from (select status, count(*) as n from public.subscriptions group by status) s2), '[]'::jsonb)

)) as digital_io_schema_report;
