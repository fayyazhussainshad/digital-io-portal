-- 95 — `subscriptions` par client ki likhai BAND. AIK statement.
--
-- ⚠ PEHLE subscription.js + admin.js (naye) UPLOAD KAR LEIN. Warna
--   sabscription aur admin ke safhe likh nahi payenge.
--
-- MASLA: `Officers own subs` aik PERMISSIVE **ALL** policy hai jiska check
-- `officer_id in (apna)` hai. Yaani afsar apni hi row INSERT kar sakta hai —
-- aur `dio_has_active_sub()` trial ko future miyaad ke sath qabool karta hai.
-- Natija: miyaad khatam afsar khud ko naya trial de kar write-gate se guzar
-- jata tha. Yahi wo aakhri sorakh hai.
--
-- AB: parhna khula (apni rows + admin ko sab), likhne ki KOI policy nahi.
-- Likhai ka raasta sirf chaar RPC (security definer) hain — wo table ke
-- maalik ke ikhtiyar se chalti hain, is liye RLS unhein nahi rokti.
do $lockdown$
begin
  -- Likhne wali purani policies hatao
  drop policy if exists "Officers own subs"         on public.subscriptions;
  drop policy if exists "Officers own subscriptions" on public.subscriptions;
  drop policy if exists "Admins manage subs"        on public.subscriptions;

  -- Parhne ke do saaf raaste (pehle se mojood) — inhein chhoRa ja raha hai:
  --   dio_sub_read_own    : officer_id = dio_my_officer_id()
  --   dio_sub_read_admin  : ghair-mo'attal admin/superadmin
  -- `Admins view all subs` bhi parhne wali hai, magar dio_sub_read_admin se
  -- doharaav hai — aur wo `suspended` nahi dekhti. Is liye wo bhi hat rahi hai.
  drop policy if exists "Admins view all subs" on public.subscriptions;

  -- Ehtiyat: agar parhne ka koi raasta hi na bache to afsar apni miyaad bhi
  -- na dekh paye — is soorat me rukna behtar hai.
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'subscriptions'
      and permissive = 'PERMISSIVE' and (cmd = 'SELECT' or cmd = 'ALL')
  ) then
    raise exception 'RUKA: subscriptions par parhne ki koi policy nahi bachi — kuch nahi badla gaya';
  end if;

  raise notice 'mukammal — likhai band, parhna khula (dio_sub_read_own / dio_sub_read_admin)';
end;
$lockdown$;
