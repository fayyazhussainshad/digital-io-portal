-- ============================================================================
-- Digital IO — 81_anon_lockdown.sql     ★ 80 KE BAAD FORAN CHALAYEN ★
-- ----------------------------------------------------------------------------
-- 80 ne un 21 tables se `anon` ka haq wapas liya jin par RLS BAND thi. Magar
-- 80 ke baad ki fehrist ne DO aur sorakh dikhaye — aur ye dono RLS ke BAWAJOOD
-- khule rehte hain. Dono asal Postgres par jaanche gaye hain.
--
-- ── SORAKH 1: TRUNCATE par RLS LAGTI HI NAHI ───────────────────────────────
--   RLS sirf SELECT/INSERT/UPDATE/DELETE ko row ke hisaab se chhanti hai.
--   TRUNCATE table ka haq hai — us par koi policy lagoo nahi hoti.
--
--   Jaanch ka natija (asal Postgres, RLS aan, per-officer policy lagi hui):
--       anon ka SELECT    → 0 rows   (RLS ne roka — theek)
--       anon ka DELETE    → 0 rows   (RLS ne roka — theek)
--       anon ka TRUNCATE  → poori table KHALI ho gayi
--
--   Yaani `misal`, `report_173`, `officers`, `subscriptions`, `recycle_bin`,
--   `case_shares`, `law_library`, `audit_log` — in sab par RLS aan hone ke
--   bawajood, anon key se poori table mitai ja sakti hai.
--
-- ── SORAKH 2: VIEW par RLS LAGTI HI NAHI ───────────────────────────────────
--   View apne MAALIK ke ikhtiyar se chalta hai (`security_invoker` by default
--   band hai). Is liye view ke zariye parhna neeche wali table ki RLS ko
--   bilkul by-pass kar deta hai.
--
--   Jaanch ka natija (wohi mehfooz table, aur us par aik view):
--       anon ka seedha table SELECT      → 0 rows  (RLS ne roka)
--       anon ka VIEW ke zariye SELECT    → poora matn mil gaya
--
--   Aap ke DB par `admin_dashboard` aisa hi aik view hai, aur anon ko us par
--   SELECT mila hua hai.
--
-- ── YE FILE KYA KARTI HAI ──────────────────────────────────────────────────
--   `anon` se public schema ki HAR table aur HAR view ka haq wapas leti hai,
--   phir SIRF do cheezein dobara deti hai jo app ko waqai chahiye:
--       select on subscription_plans   (subscription.js / admin.js)
--       insert on client_errors        (error-handler.js — login se pehle bhi)
--   Aur ehtiyatan `insert on officers` (registration ka raasta; us par RLS
--   pehle se pehra de rahi hai).
--
--   Patrol wali tables, `diary_entries`, `pending_registrations` aur
--   `admin_dashboard` app ke kisi code me istemal hi nahi hotin (check kiya
--   gaya) — is liye unhein band karne se kuch nahi rukta.
--
--   RLS, policies aur data — kisi ko haath nahi lagaya. Sequences ko bhi nahi
--   (warna client_errors ka insert ruk jata).
--
-- CHALANE KA TAREEQA: Supabase → SQL Editor → paste → Run.
-- WAPSI: `81_anon_lockdown_ROLLBACK.sql`
-- ============================================================================

-- ── 1) PEHLE: anon ke paas abhi kya hai ────────────────────────────────────
select table_name,
       string_agg(privilege_type, ', ' order by privilege_type) as anon_ke_haq
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'
group by table_name
order by table_name;

-- ── 1b) Aur public schema me kitne VIEW hain (ye RLS se bahar hote hain) ───
select c.relname as view_name,
       case c.relkind when 'v' then 'VIEW' when 'm' then 'MATERIALIZED VIEW' end as qism,
       c.reloptions as options,
       pg_get_userbyid(c.relowner) as maalik
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('v','m')
order by c.relname;


-- ── 2) SAB KUCH BAND ───────────────────────────────────────────────────────
--  `all tables` me view aur materialized view bhi shamil hote hain.
revoke all privileges on all tables in schema public from anon;

-- Aage banne wali tables par bhi anon ko khud-ba-khud haq na mile
alter default privileges in schema public revoke all on tables from anon;


-- ── 3) Sirf wo do (teen) cheezein dobara khol do jo app ko chahiye ─────────
do $allow$
begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
             where n.nspname='public' and c.relname='subscription_plans') then
    grant select on public.subscription_plans to anon;
    raise notice 'khola: select on subscription_plans';
  end if;

  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
             where n.nspname='public' and c.relname='client_errors') then
    grant insert on public.client_errors to anon;
    raise notice 'khola: insert on client_errors';
  end if;

  -- Registration ka raasta. RLS (officers_insert) pehle se pehra de rahi hai:
  -- anon ke liye auth.uid() null hai, is liye shart poori nahi hoti.
  if exists (select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace
             where n.nspname='public' and c.relname='officers') then
    grant insert on public.officers to anon;
    raise notice 'khola: insert on officers (registration)';
  end if;
end;
$allow$;


-- ── 3b) LOGGED-IN AFSAR SE BHI TRUNCATE aur TRIGGER wapas lo ───────────────
--  Jaanch me ye bhi saamne aaya: `authenticated` ke paas bhi TRUNCATE hai.
--  Yaani aik LOGGED-IN afsar bhi poori `misal` ya `cases` khali kar sakta hai
--  — RLS us par lagti hi nahi (upar SORAKH 1 dekhein). App ka koi hissa
--  TRUNCATE istemal nahi karta (PostgREST sirf select/insert/update/delete
--  bhejta hai), is liye isay wapas lene se kuch nahi rukta.
--
--  TRIGGER bhi wapas liya ja raha hai: us se user khud table par trigger bana
--  sakta hai — app ko iski zaroorat kabhi nahi.
revoke truncate, trigger on all tables in schema public from authenticated;
alter default privileges in schema public revoke truncate, trigger on tables from authenticated;


-- ── 4) BAAD ME: tasdeeq — sirf teen lainein bachni chahiyen ────────────────
select grantee,
       table_name,
       string_agg(privilege_type, ', ' order by privilege_type) as haq
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon','authenticated')
  and privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','TRIGGER')
group by grantee, table_name
having grantee = 'anon'
    or string_agg(privilege_type, ',') like '%TRUNCATE%'
    or string_agg(privilege_type, ',') like '%TRIGGER%'
order by grantee, table_name;
--  Tawaqqo: anon ki sirf 3 lainein (subscription_plans/client_errors/officers),
--  aur `authenticated` ki koi laine NAHI (yaani kisi table par TRUNCATE/TRIGGER
--  baqi nahi raha).


-- ============================================================================
-- CHALANE KE BAAD YE JAANCH KAREIN
-- ----------------------------------------------------------------------------
--   1) Logout → LOGIN                      → chalna chahiye
--   2) Mocaddmaat ki fehrist                → aani chahiye
--   3) Naya mocaddma / zimni                → chalna chahiye
--   4) Challan / report 173                 → khulna chahiye
--   5) Subscription ka safha (plans dikhen) → chalna chahiye
--   6) Nayi registration (test afsar)       → chalna chahiye
--
-- Kuch ruk jaye to `81_anon_lockdown_ROLLBACK.sql` chalayen aur batayen ke
-- kaun sa qadam ruka aur paighaam kya tha.
--
-- NOTE: `admin_dashboard` view ab anon ke liye band hai. Agar aage us view ko
-- kisi ke liye kholna ho to pehle usay `security_invoker = true` par laana
-- hoga, warna wo neeche wali tables ki RLS ko by-pass karta rahega:
--     alter view public.admin_dashboard set (security_invoker = true);
-- (Ye hukm is file me JAAN-BOOJH KAR nahi daala — pehle view ki tareef dekhni
--  chahiye, warna admin ka safha khamoshi se khali ho sakta hai.)
-- ============================================================================
