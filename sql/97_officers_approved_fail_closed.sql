-- 97 — dio_protect_officers(): admin ka ikhtiyar sirf MANZOOR-SHUDA ko. AIK statement.
--
-- MASLA (96_CHECK ne pakRa, 13 Oct 2026): mojooda function mein
--     and coalesce(o.is_approved,true) = true
-- yaani jis admin/superadmin ki manzoori ka khana KHALI (NULL) ho, use
-- manzoor maan kar poora ikhtiyar mil jata hai (fail-open). Baqi poore
-- nazam (91a, 94a–94d) mein qaida ulta hai: NULL = ghair-manzoor.
--
-- TABDEELI: sirf wahi aik lafz — true → false. Function ka baqi har hissa
-- bilkul wahi hai jo DB par chal raha hai (pg_get_functiondef se liya gaya).
--
-- EHTIYAT: agar is waqt koi admin/superadmin aisa hai jiski manzoori NULL
-- hai, to ye file KUCH NAHI BADALTI aur ruk jati hai — warna wo admin
-- (shayad aap khud) foran ikhtiyar kho deta. Pehle us ki manzoori theek
-- karein, phir ye file dobara chalayen.
--
-- Wapsi: 97_ROLLBACK.sql   |   Jaanch: 96_CHECK.sql (nateeja THEEK aana chahiye)
do $fix97$
declare
  v_null_admins text;
begin
  select string_agg(coalesce(o.id::text, '?') || ' (' || o.role || ')', ', ')
    into v_null_admins
  from public.officers o
  where o.role in ('admin', 'superadmin') and o.is_approved is null;

  if v_null_admins is not null then
    raise exception 'RUKA: in admin ki manzoori NULL hai — pehle is_approved = true karein: %', v_null_admins
      using errcode = 'P0001';
  end if;

  execute $sql$
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
      and coalesce(o.is_approved,false)  = true   -- v97: NULL = ghair-manzoor (fail-closed)
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
end $function$
$sql$;

  raise notice 'mukammal — admin ka ikhtiyar ab sirf manzoor-shuda ko (NULL = ghair-manzoor)';
end;
$fix97$;
