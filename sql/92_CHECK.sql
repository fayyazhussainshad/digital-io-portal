-- 92_CHECK — SIRF PARHTI HAI. Aik statement, is liye natija zaroor dikhega.
select jsonb_pretty(jsonb_build_object(
  'parhne_ki_rok_baqi', (select count(*) from pg_policies
                         where schemaname='public' and policyname='dio_sub_sel'),
  'likhne_ki_rok_tables', (select count(distinct tablename) from pg_policies
                           where schemaname='public' and policyname like 'dio_wgate_%'),
  'likhne_ki_rok_policies', (select count(*) from pg_policies
                             where schemaname='public' and policyname like 'dio_wgate_%'),
  'bina_rok_tables', (select jsonb_agg(t order by t) from (
      select unnest(array[
        'cases','case_documents','case_document_versions','case_accused',
        'case_witnesses','case_shares','zimni_reports','zimni_androoni_reports',
        'evidence','reminders','court_dates','fir_matn','fir_copies','suspects',
        'incident_reports','hamrahi_mulazman','cdr_imei_requests','cdr_uploads',
        'cro_cards','rfa_forms','sarkari_gari','templates','ahkamat','law_library',
        'recycle_bin','misal','report_173','applications_5c',
        'application_5c_numbers','application_5c_attachments','diary_entries',
        'document_approvals','officer_transfers']) as t) x
    where exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
                  where n.nspname='public' and c.relname=x.t and c.relkind='r')
      and not exists (select 1 from pg_policies p where p.schemaname='public'
                      and p.tablename=x.t and p.policyname='dio_wgate_ins')),
  'khuli_rehni_wali_tables_par_rok_lag_gayi', (select jsonb_agg(tablename order by tablename)
      from (select distinct tablename from pg_policies
            where schemaname='public' and policyname like 'dio_wgate_%'
              and tablename in ('officers','subscriptions','subscription_plans',
                                'client_errors','audit_log','audit_logs',
                                'evidence_custody_events','usage_stats',
                                'station_activity','pending_registrations')) y),
  'rls_abhi_band_hai', (select count(*) from pg_class c
      join pg_namespace n on n.oid=c.relnamespace
      where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false
        and exists (select 1 from pg_policy p where p.polrelid=c.oid))
)) as digital_io_92_check;
