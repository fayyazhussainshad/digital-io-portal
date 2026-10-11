-- 94c — admin: sabscription mo'attal kare. AIK statement.
create or replace function public.dio_suspend_subscription(p_sub_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $fn$
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

  update public.subscriptions set status = 'suspended' where id = p_sub_id;
end;
$fn$;
