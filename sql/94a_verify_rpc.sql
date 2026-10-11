-- 94a — admin: darkhwast manzoor kare. AIK statement.
-- Shart SERVER par: sirf ghair-mo'attal admin/superadmin. Columns aap ke
-- schema ke mutabiq: verified_by, verified_at, started_at, expires_at.
create or replace function public.dio_verify_subscription(p_sub_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $fn$
declare
  _me   uuid;
  _days int;
begin
  if not exists (
    select 1 from public.officers o
    where o.user_id = auth.uid()
      and (o.role = 'admin' or o.role = 'superadmin')
      and coalesce(o.suspended, false) = false
      and coalesce(o.is_approved, false) = true
  ) then
    raise exception 'Digital IO: ye kaam sirf admin kar sakta hai' using errcode = '42501';
  end if;

  select o.id into _me from public.officers o where o.user_id = auth.uid() limit 1;

  select coalesce(sp.duration_days, 30) into _days
  from public.subscriptions s
  left join public.subscription_plans sp on sp.id = s.plan_id
  where s.id = p_sub_id;

  if _days is null then
    raise exception 'Digital IO: darkhwast nahi mili' using errcode = 'P0002';
  end if;

  update public.subscriptions
     set status      = 'active',
         verified_by = _me,
         verified_at = now(),
         started_at  = coalesce(started_at, now()),
         expires_at  = now() + make_interval(days => _days)
   where id = p_sub_id;
end;
$fn$;
