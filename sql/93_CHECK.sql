-- 93_CHECK — SIRF PARHTI HAI. Aik statement.
select jsonb_pretty(jsonb_build_object(
  'rls_band_baqi', (select count(*) from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false
        and exists (select 1 from pg_policy p where p.polrelid=c.oid)),
  'rls_band_tables', (select jsonb_agg(c.relname order by c.relname) from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false
        and exists (select 1 from pg_policy p where p.polrelid=c.oid)),
  'evidence_update_policy', exists (select 1 from pg_policies
      where schemaname='public' and tablename='evidence' and cmd='UPDATE'),
  'khatarnak_rls_on_bina_policy', (select jsonb_agg(c.relname order by c.relname) from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relrowsecurity=true
        and not exists (select 1 from pg_policy p where p.polrelid=c.oid and p.polpermissive)),
  'hukm_jin_ki_policy_nahi', (select jsonb_agg(jsonb_build_object('table', x.t, 'hukm', x.cmd) order by x.t, x.cmd)
    from (
      select c.relname as t, u.cmd
      from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      cross join (values ('SELECT'),('INSERT'),('UPDATE'),('DELETE')) u(cmd)
      where n.nspname='public' and c.relkind='r' and c.relrowsecurity=true
        and c.relname in ('ahkamat','case_accused','case_documents','case_witnesses',
                          'cases','cdr_imei_requests','court_dates','cro_cards','evidence',
                          'fir_copies','fir_matn','hamrahi_mulazman','incident_reports',
                          'reminders','rfa_forms','sarkari_gari','suspects','templates',
                          'zimni_androoni_reports','zimni_reports')
        and not exists (select 1 from pg_policies p
                        where p.schemaname='public' and p.tablename=c.relname
                          and p.permissive='PERMISSIVE'
                          and (p.cmd = u.cmd or p.cmd='ALL'))
    ) x)
)) as digital_io_93_check;
