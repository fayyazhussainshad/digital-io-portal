-- 100_CHECK — SIRF PARHTI HAI. Aik statement. Sab "true" hon to theek.
select jsonb_pretty(jsonb_build_object(
  'pg_net_installed', exists (select 1 from pg_extension where extname = 'pg_net'),
  'email_log_table',  to_regclass('public.dio_email_log') is not null,
  'email_log_rls_on', coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.dio_email_log')), false),
  'notify_function',  to_regprocedure('public.dio_email_notify()') is not null,
  'triggers', (select jsonb_agg(tgname order by tgname) from pg_trigger
               where not tgisinternal and tgname like 'dio_email_on_%'),
  'teen_triggers_mojood', (select count(*) = 3 from pg_trigger
               where not tgisinternal and tgname like 'dio_email_on_%'),
  'aakhri_10_emails', (select jsonb_agg(jsonb_build_object(
        'kind', kind, 'to', to_email, 'status', status, 'error', error,
        'waqt', to_char(created_at at time zone 'Asia/Karachi', 'DD/MM/YYYY HH24:MI')) order by created_at desc)
      from (select * from public.dio_email_log order by created_at desc limit 10) x)
)) as digital_io_100_check;
