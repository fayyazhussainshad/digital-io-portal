-- 97_ROLLBACK — dio_protect_officers() ko bilkul pehle wali halat par wapas. AIK statement.
-- (13 Oct 2026 ko DB se pg_get_functiondef ke zariye liya gaya asal matn.)
-- ⚠ Iske baad NULL manzoori wala admin phir se ikhtiyar pa lega (fail-open).
--    Sirf us soorat me chalayen jab 97 ke baad koi ASAL kaam ruk jaye.
CREATE OR REPLACE FUNCTION public.dio_protect_officers()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public', 'pg_temp'
AS $function$
declare
  v_priv boolean;
begin
  -- service_role (admin panel / Edge Function) — poora ikhtiyar.
  -- NOTE: `auth.uid() is null` par bharosa NAHI (anon par bhi null hota hai).
  if current_user = 'service_role' or coalesce(auth.role(),'') = 'service_role' then
    return case when tg_op = 'DELETE' then old else new end;
  end if;

  -- Ghair-mutaiyan (anon/kharab JWT) — kuch bhi nahi
  if auth.uid() is null then
    raise exception 'ijazat nahi';
  end if;

  select exists (
    select 1 from public.officers o
    where o.user_id = auth.uid()
      and o.role in ('admin','superadmin')
      and coalesce(o.suspended,false) = false
      and coalesce(o.is_approved,true)   = true
  ) into v_priv;

  -- ── INSERT ───────────────────────────────────────────────────
  if tg_op = 'INSERT' then
    if not v_priv then
      -- Khud ki registration: sirf apne user_id par, aam afsar, ghair-manzoor
      new.user_id      := auth.uid();
      new.role         := 'officer';
      new.is_approved  := false;
      new.suspended := false;
    end if;
    return new;
  end if;

  -- ── DELETE ───────────────────────────────────────────────────
  if tg_op = 'DELETE' then
    if not v_priv then
      raise exception 'afsar ka record sirf admin hata sakta hai';
    end if;
    return old;
  end if;

  -- ── UPDATE ───────────────────────────────────────────────────
  if not v_priv then
    -- Sirf APNI row (pehle kisi ki bhi badal sakte the)
    if old.user_id is distinct from auth.uid() then
      raise exception 'sirf apni profile tabdeel ki ja sakti hai';
    end if;
    -- Hassas column wapas purani qeemat par
    new.role         := old.role;
    new.is_approved  := old.is_approved;
    new.suspended := old.suspended;
    new.user_id      := old.user_id;
    new.id           := old.id;
  end if;
  return new;
end $function$;
