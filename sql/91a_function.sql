-- 91a — manzoori par 30-din ka trial dene wala function. AIK hi statement.
create or replace function public.dio_grant_trial_on_approval()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $fn$
begin
  if coalesce(new.is_approved, false) = true
     and coalesce(old.is_approved, false) = false then
    if not exists (
      select 1 from public.subscriptions s where s.officer_id = new.id
    ) then
      insert into public.subscriptions (officer_id, status, started_at, expires_at)
      values (new.id, 'trial', now(), now() + interval '30 days');
    end if;
  end if;
  return new;
end;
$fn$;
