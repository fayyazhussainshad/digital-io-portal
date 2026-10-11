-- ============================================================================
-- Digital IO — STEP 1b: jo PEHLE SE laga hua hai, usay dekhna
-- ----------------------------------------------------------------------------
-- YE SIRF PARHTI HAI. Kuch bhi nahi badalti.
--
-- Step 1 ke natije se do baatein saamne aayin:
--   1) is DB par pehle hi `dio_*` functions, trigger, index aur `dio_sub_sel`
--      policies maujood hain — yaani is kaam ka aik purana daur chal chuka hai.
--   2) jin tables par `dio_sub_sel` lagi hai, un SAB par RLS BAND hai.
--
-- Aage barhne se pehle teen cheezein dekhni zaroori hain:
--   • mojooda `dio_has_active_sub()` waqai kya faisla karta hai
--   • mojooda policies ki asal shart (qual / with_check) kya hai
--   • `authenticated` role ko table par kya haq diya gaya hai (GRANT)
--
-- Chalane ka tareeqa: Supabase → SQL Editor → paste → Run → Download CSV.
-- ============================================================================

select (jsonb_build_object(

  -- 1) Mojooda dio_* functions ki POORI tareef
  'dio_function_definitions', coalesce((
    select jsonb_agg(jsonb_build_object(
             'name', p.proname,
             'args', pg_get_function_identity_arguments(p.oid),
             'definition', pg_get_functiondef(p.oid))
           order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'dio_%'), '[]'::jsonb),

  -- 2) Officers par lage triggers ki poori tareef
  'officers_trigger_definitions', coalesce((
    select jsonb_agg(jsonb_build_object(
             'trigger_name', t.tgname,
             'definition', pg_get_triggerdef(t.oid))
           order by t.tgname)
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'officers'
      and not t.tgisinternal), '[]'::jsonb),

  -- 3) Ahem tables par policies ki ASAL shart
  'policy_expressions', coalesce((
    select jsonb_agg(jsonb_build_object(
             'table_name', tablename,
             'policy', policyname,
             'permissive', permissive,
             'cmd', cmd,
             'roles', roles::text,
             'using_expr', qual,
             'check_expr', with_check)
           order by tablename, policyname)
    from pg_policies
    where schemaname = 'public'
      and tablename in ('cases','case_documents','evidence','reminders',
                        'officers','subscriptions','subscription_plans',
                        'client_errors','misal','report_173')), '[]'::jsonb),

  -- 4) GRANT: authenticated/anon ko kya haq hai (RLS band ho to YAHI faisla karta hai)
  'table_grants', coalesce((
    select jsonb_agg(jsonb_build_object(
             'table_name', table_name,
             'grantee', grantee,
             'privileges', privs)
           order by table_name, grantee)
    from (
      select table_name, grantee, string_agg(privilege_type, ',' order by privilege_type) as privs
      from information_schema.role_table_grants
      where table_schema = 'public'
        and grantee in ('anon','authenticated')
        and table_name in ('cases','case_documents','evidence','reminders',
                           'officers','subscriptions','zimni_reports','misal',
                           'report_173','case_witnesses','case_accused')
      group by table_name, grantee
    ) g), '[]'::jsonb),

  -- 5) client_errors ke khane (file 30 inhi par chalegi)
  'client_errors_columns', coalesce((
    select jsonb_agg(jsonb_build_object(
             'column_name', column_name, 'data_type', data_type, 'is_nullable', is_nullable)
           order by ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'client_errors'), '[]'::jsonb),

  -- 6) ASAL SAWAL: mojooda gate aap ke asli afsaron ke liye kya kehta hai?
  --    (haath se wohi shart lagai gayi hai jo gate lagata hai — koi tabdeeli nahi)
  'officers_gate_status', coalesce((
    select jsonb_agg(jsonb_build_object(
             'badge', o.badge_number,
             'role', o.role,
             'is_approved', to_jsonb(o) ->> 'is_approved',
             'suspended', to_jsonb(o) ->> 'suspended',
             'faal_sub', exists (
                select 1 from public.subscriptions s
                where s.officer_id = o.id
                  and s.status in ('active','trial')
                  and (s.expires_at is null or s.expires_at > now())),
             'gate_khulna_chahiye', (
                o.role = 'superadmin'
                or (
                     coalesce((to_jsonb(o) ->> 'suspended')::boolean, false) = false
                 and coalesce((to_jsonb(o) ->> 'is_approved')::boolean, false)
                 and (
                       o.role = 'admin'
                    or exists (
                         select 1 from public.subscriptions s2
                         where s2.officer_id = o.id
                           and s2.status in ('active','trial')
                           and (s2.expires_at is null or s2.expires_at > now()))
                 )
                )
             ))
           order by o.role)
    from public.officers o), '[]'::jsonb),

  -- 7) Subscription rows ki asal haalat
  'subscription_rows', coalesce((
    select jsonb_agg(jsonb_build_object(
             'officer_badge', o.badge_number,
             'status', s.status,
             'started_at', s.started_at,
             'expires_at', s.expires_at,
             'miyaad_baqi', (s.expires_at is null or s.expires_at > now()))
           order by s.created_at desc)
    from public.subscriptions s
    left join public.officers o on o.id = s.officer_id), '[]'::jsonb),

  -- 8) Kaun kaun si tables par RLS BAND hai magar per-officer policies mojood hain
  --    (yahi wo fehrist hai jahan tahaffuz so'ee pari hai)
  'rls_band_magar_policies_mojood', coalesce((
    select jsonb_agg(jsonb_build_object(
             'table_name', c.relname,
             'policy_count', (select count(*) from pg_policy p where p.polrelid = c.oid))
           order by c.relname)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
      and c.relrowsecurity = false
      and exists (select 1 from pg_policy p where p.polrelid = c.oid)), '[]'::jsonb)

)) as digital_io_existing_state;
