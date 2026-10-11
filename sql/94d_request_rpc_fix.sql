-- 94d — `dio_request_subscription` ki durustagi.
--
-- MOJOODA (aap ke DB par) GHALTI: transaction ID `payment_method` me chala
-- jata tha aur `payment_ref` khali reh jata tha:
--     insert ... (officer_id, status, amount, payment_method, ...)
--     values (v_oid, 'pending', p_amount, coalesce(p_ref,'request'), ...)
-- Yaani admin ko adaigi ka hawala (TXN ID) sahi khane me nazar hi nahi aata.
--
-- Ab: p_ref → payment_ref, aur tareeqa (jazzcash/easypaisa/raast) ka apna
-- khana p_method → payment_method. Purani 3-dalil shakl hata kar nayi 4-dalil
-- banai ja rahi hai (sirf isi liye `drop` zaroori hai — dalilon ki fehrist
-- badalne par `create or replace` nayi alag function bana deta hai).
--
-- Baqi shartein jaisi theen waisi hi: mo'attal/ghair-manzoor afsar darkhwast
-- na de sake, aur 24 ghante me aik hi zer-e-ghaur darkhwast.
drop function if exists public.dio_request_subscription(uuid, numeric, text);

create or replace function public.dio_request_subscription(
  p_plan_id uuid    default null,
  p_amount  numeric default null,
  p_ref     text    default null,
  p_method  text    default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $fn$
declare
  v_oid uuid;
  v_id  uuid;
begin
  v_oid := public.dio_my_officer_id();
  if v_oid is null then
    raise exception 'Digital IO: afsar ka record nahi mila' using errcode = 'P0002';
  end if;

  if exists (select 1 from public.officers o
             where o.id = v_oid
               and (coalesce(o.suspended, false) = true
                 or coalesce(o.is_approved, false) = false)) then
    raise exception 'Digital IO: aap ka account mo''attal ya ghair-manzoor hai'
      using errcode = '42501';
  end if;

  if exists (select 1 from public.subscriptions s
             where s.officer_id = v_oid and s.status = 'pending'
               and s.created_at > now() - interval '24 hours') then
    raise exception 'Digital IO: aap ki darkhwast pehle se zer-e-ghaur hai'
      using errcode = '42501';
  end if;

  insert into public.subscriptions
    (officer_id, plan_id, status, amount, payment_ref, payment_method, started_at, expires_at)
  values
    (v_oid, p_plan_id, 'pending', p_amount, p_ref, coalesce(p_method, 'request'), now(), null)
  returning id into v_id;

  return v_id;
end;
$fn$;
