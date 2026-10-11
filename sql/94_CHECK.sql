-- 94_CHECK — SIRF PARHTI HAI. Aik statement.
select jsonb_pretty(jsonb_build_object(
  'rpc_mojood', (select jsonb_agg(jsonb_build_object(
      'naam', p.proname, 'dalilen', pg_get_function_identity_arguments(p.oid),
      'definer', p.prosecdef) order by p.proname)
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname in (
      'dio_request_subscription','dio_verify_subscription',
      'dio_reject_subscription','dio_suspend_subscription')),
  'purani_3_dalil_wali_baqi', exists (
    select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='dio_request_subscription'
      and pg_get_function_identity_arguments(p.oid) = 'p_plan_id uuid, p_amount numeric, p_ref text')
)) as digital_io_94_check;
