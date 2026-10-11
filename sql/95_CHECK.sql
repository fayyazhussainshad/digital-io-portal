-- 95_CHECK — SIRF PARHTI HAI. Aik statement.
select jsonb_pretty(jsonb_build_object(
  'subscriptions_policies', (select jsonb_agg(jsonb_build_object(
      'naam', policyname, 'permissive', permissive, 'hukm', cmd) order by policyname)
    from pg_policies where schemaname='public' and tablename='subscriptions'),
  'likhne_wali_policies_baqi', (select count(*) from pg_policies
    where schemaname='public' and tablename='subscriptions'
      and permissive='PERMISSIVE' and cmd in ('INSERT','UPDATE','DELETE','ALL')),
  'parhne_wali_policies', (select count(*) from pg_policies
    where schemaname='public' and tablename='subscriptions'
      and permissive='PERMISSIVE' and cmd in ('SELECT','ALL')),
  'rls_on', (select relrowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
             where n.nspname='public' and c.relname='subscriptions')
)) as digital_io_95_check;
