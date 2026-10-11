-- ============================================================================
-- Digital IO — 91_CHECK.sql   (SIRF PARHTI HAI)
-- ----------------------------------------------------------------------------
-- Ye AIK hi statement hai, is liye Supabase ka editor iska natija zaroor
-- dikhayega. Maqsad: dekhna ke `91_trial_on_approval.sql` waqai laga ya nahi.
--
-- Teen sawal:
--   1) trigger bana?            → trigger_laga
--   2) function bana?           → function_bana
--   3) GAA 738 ko trial mila?   → afsar[] me us ki laine
-- ============================================================================

select jsonb_pretty(jsonb_build_object(

  'trigger_laga', exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'officers'
      and t.tgname  = 'dio_trial_on_approval'
  ),

  'function_bana', exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'dio_grant_trial_on_approval'
  ),

  'kul_officers', (select count(*) from public.officers),

  'kul_subscriptions', (select count(*) from public.subscriptions),

  'afsar', (
    select jsonb_agg(jsonb_build_object(
             'badge',       o.badge_number,
             'role',        o.role,
             'is_approved', to_jsonb(o) ->> 'is_approved',
             'suspended',   to_jsonb(o) ->> 'suspended',
             'subs_rows',   (select count(*) from public.subscriptions s
                             where s.officer_id = o.id),
             'trial_miyaad', (select max(s.expires_at)::date::text
                              from public.subscriptions s
                              where s.officer_id = o.id and s.status = 'trial'),
             'gate_khula', (
               o.role = 'superadmin'
               or (
                    coalesce((to_jsonb(o) ->> 'suspended')::boolean, false) = false
                and coalesce((to_jsonb(o) ->> 'is_approved')::boolean, false)
                and (
                      o.role = 'admin'
                   or exists (
                        select 1 from public.subscriptions s2
                        where s2.officer_id = o.id
                          and s2.status in ('active', 'trial')
                          and (case when s2.status = 'active'
                                    then (s2.expires_at is null or s2.expires_at > now())
                                    else s2.expires_at > now() end)
                      )
                )
               )
             ))
           order by o.role, o.badge_number)
    from public.officers o
  )

)) as digital_io_91_check;
