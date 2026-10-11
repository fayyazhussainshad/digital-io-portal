-- ============================================================================
-- Digital IO — 71_license_diagnose.sql
-- ----------------------------------------------------------------------------
-- YE FAIL SIRF PARHTI HAI. Koi policy, function, trigger ya row nahi badalti.
-- Jitni baar chahein chalayen — bila-khatar.
--
-- Kab chalayen: jab license na mile aur wajah samajh na aaye. Edge function
-- ka jawab (no_officer / suspended / not_approved / not_entitled) sirf natija
-- batata hai, SABAB nahi. Ye file sabab dikhati hai — har auth user ke saamne
-- uska afsar record aur gate ka natija.
--
-- SECTION 2 khaas tor par dekhein: aik hi user_id par do records ho jayen to
-- kaun sa record chuna jayega ye ittefaq par chala jata hai — aur yahi wajah
-- hoti hai ke "kal chal raha tha, aaj nahi".
--
-- COLUMN KE NAAM PAR BHAROSA NAHI: khane `to_jsonb(...)` se parhe jate hain.
-- Is liye chahe is schema me mo'attali ka column `suspended` ho ya purane
-- naam se, ye query 42703 par rad nahi hoti — khana khali aa jata hai, bas.
-- ============================================================================


-- ── SECTION 1: HAR AUTH USER — uska afsar record aur gate ka natija ────────
with o as (
  select officers.*, to_jsonb(officers) as j
  from public.officers
)
select u.id                   as auth_user_id,
       u.email,
       u.created_at           as user_bana,
       o.id                   as officer_id,
       o.role,
       o.j ->> 'is_approved'  as is_approved,
       o.j ->> 'suspended'    as suspended_khana,
       case
         when o.id is null
           then 'no_officer — is auth user ka koi afsar record nahi'
         when o.role = 'superadmin'
           then 'KHULA (maalik — bila-shart)'
         when coalesce((o.j ->> 'suspended')::boolean, false)
           then 'BAND — mo''attal'
         when not coalesce((o.j ->> 'is_approved')::boolean, false)
           then 'BAND — manzoori nahi (NULL bhi manzoori nahi)'
         when o.role = 'admin'
           then 'KHULA (admin — sabscription ki shart se riaayat)'
         when exists (
                select 1 from public.subscriptions s
                where s.officer_id = o.id
                  and s.status in ('active', 'trial')
                  and (s.expires_at is null or s.expires_at > now())
              )
           then 'KHULA — sabscription faal'
         else 'BAND — miyaad khatam ya koi faal sabscription nahi'
       end                    as gate_ka_natija
from auth.users u
left join o on o.user_id = u.id
order by u.created_at desc;


-- ── SECTION 2: DUPLICATE AFSAR RECORDS (sab se aam chhupi wajah) ───────────
--  Khali natija = theek. Kuch bhi aaye to pehle usay saaf karna hoga, warna
--  `officers_user_id_uidx` bhi nahi ban payega aur gate ka jawab badalta
--  rahega.
select user_id,
       count(*)      as kitni_rows,
       array_agg(id) as officer_ids,
       array_agg(role) as roles
from public.officers
where user_id is not null
group by user_id
having count(*) > 1
order by count(*) desc;


-- ── SECTION 3: officers ke khane — asal naam ki tasdeeq ────────────────────
--  Yahan dekhein ke mo'attali ka khana kis naam se mojood hai. Har SQL file
--  isi par chalti hai.
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name   = 'officers'
order by ordinal_position;


-- ── SECTION 4: har afsar ki sabscription ki haalat ─────────────────────────
with o as (
  select officers.*, to_jsonb(officers) as j
  from public.officers
)
select o.id            as officer_id,
       o.role,
       o.j ->> 'suspended'   as suspended_khana,
       o.j ->> 'is_approved' as is_approved,
       s.id            as subscription_id,
       s.status,
       s.started_at,
       s.expires_at,
       case
         when s.id is null then 'koi sabscription record nahi'
         when s.status not in ('active', 'trial') then 'status faal nahi: ' || s.status
         when s.expires_at is null then 'be-miyaad (mustaqil)'
         when s.expires_at > now() then 'baqi — ' ||
              (date_part('day', s.expires_at - now()))::int::text || ' din'
         else 'miyaad khatam'
       end             as miyaad
from o
left join public.subscriptions s on s.officer_id = o.id
order by o.role, o.id, s.created_at desc;


-- ── SECTION 5: gate ka function kis haalat me hai ──────────────────────────
select p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as args,
       case p.prosecdef when true then 'SECURITY DEFINER' else 'security invoker' end as sec,
       p.provolatile as volatility
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname like 'dio_%'
order by p.proname;


-- ── SECTION 6: kaun si rok kahan lagi hui hai ──────────────────────────────
select tablename  as table_name,
       policyname as policy_name,
       permissive,
       cmd,
       qual       as using_expr,
       with_check as check_expr
from pg_policies
where schemaname = 'public'
  and policyname like 'dio_%'
order by tablename, policyname;
