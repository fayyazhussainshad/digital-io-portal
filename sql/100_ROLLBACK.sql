-- 100_ROLLBACK — email ka nizam band. AIK statement. (pg_net aur email ka
-- record (dio_email_log) BAQI rehte hain — un se koi nuqsan nahi.)
do $rb$
begin
  execute 'drop trigger if exists dio_email_on_officer_insert on public.officers';
  execute 'drop trigger if exists dio_email_on_officer_approve on public.officers';
  execute 'drop trigger if exists dio_email_on_sub_active on public.subscriptions';
  execute 'drop function if exists public.dio_email_notify()';
end
$rb$;
