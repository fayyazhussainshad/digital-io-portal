-- ============================================================================
-- Digital IO — 80_close_anon_hole.sql     ★ FORAN CHALANE WALI FILE ★
-- ----------------------------------------------------------------------------
-- MASLA (aap ke apne DB se tasdeeq shuda, 11 Oct 2026):
--
--   `anon` role ko in tables par SELECT, INSERT, UPDATE, DELETE aur TRUNCATE
--   ka haq diya hua hai — AUR inhi 21 tables par RLS BAND hai.
--
--   `anon` wo role hai jo PUBLIC anon key ke sath chalta hai. Wo key
--   `app-core.js` me likhi hui hai, yaani jo bhi site kholta hai use mil
--   jati hai. RLS band hone ka matlab hai ke row ki koi chhantai nahi hoti.
--
--   Natija: BINA LOGIN, sirf us key se, poora case record parha, badla aur
--   MITAYA ja sakta hai — FIR ka matn, gawahan, mulziman, shahadaten, zimni.
--
-- YE FILE KYA KARTI HAI:
--   `anon` se un 21 tables par data ka haq WAPAS LETI hai. Bas.
--   RLS ko haath nahi lagati. Kisi policy ko nahi chhedti. Koi data nahi
--   badalti. Is liye kisi afsar ka tala nahi lagta.
--
-- KYUN YE PEHLA QADAM HAI (RLS enable karna nahi):
--   App login ke baad `authenticated` role par chalti hai, `anon` par nahi.
--   Is liye ye revoke app ke kisi kaam ko nahi rokta. RLS enable karna agla
--   qadam hai, magar us me aik afsar ka tala lag sakta hai (neeche dekhein)
--   — is liye wo soch kar, alag se.
--
--   Login/registration ke raaste ko bhi haath nahi lagaya: `officers`,
--   `subscription_plans`, `pending_registrations` is fehrist me NAHI hain
--   (un par RLS pehle se aan hai, yaani wo mehfooz hain).
--
-- CHALANE KA TAREEQA: Supabase → SQL Editor → paste → Run.
-- WAPSI: `80_close_anon_hole_ROLLBACK.sql`
-- ============================================================================

-- ── 1) PEHLE: abhi anon ko kya kya mila hua hai ────────────────────────────
select table_name,
       string_agg(privilege_type, ', ' order by privilege_type) as anon_ke_haq
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE')
group by table_name
order by table_name;


-- ── 2) HAQ WAPAS LO ────────────────────────────────────────────────────────
do $shut$
declare
  khuli text[] := array[
    'cases', 'case_documents', 'case_document_versions', 'case_accused',
    'case_witnesses', 'zimni_reports', 'zimni_androoni_reports',
    'evidence', 'reminders', 'court_dates', 'fir_matn', 'fir_copies',
    'suspects', 'incident_reports', 'hamrahi_mulazman', 'cdr_imei_requests',
    'cro_cards', 'rfa_forms', 'sarkari_gari', 'templates', 'ahkamat'
  ];
  t text;
  n int := 0;
begin
  foreach t in array khuli loop
    if not exists (
      select 1 from pg_class c
      join pg_namespace ns on ns.oid = c.relnamespace
      where ns.nspname = 'public' and c.relname = t and c.relkind = 'r'
    ) then
      raise notice 'chhoRa (table nahi): %', t;
      continue;
    end if;

    -- Sirf data ka haq. REFERENCES/TRIGGER be-zarar hain, unhein chhoR diya.
    execute format(
      'revoke select, insert, update, delete, truncate on public.%I from anon', t);

    n := n + 1;
    raise notice 'anon ka haq wapas liya: %', t;
  end loop;

  raise notice 'mukammal — % tables band ki gayin', n;
end;
$shut$;


-- ── 3) BAAD ME: tasdeeq — in 21 tables par anon ka naam na aaye ────────────
select table_name,
       string_agg(privilege_type, ', ' order by privilege_type) as anon_ke_haq
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE')
group by table_name
order by table_name;


-- ============================================================================
-- CHALANE KE BAAD YE JAANCH KAREIN (5 minute)
-- ----------------------------------------------------------------------------
--   1) App kholein, logout karein, phir LOGIN karein     → chalna chahiye
--   2) Mocaddmaat ki fehrist                              → aani chahiye
--   3) Naya mocaddma banayen / zimni likhein               → chalna chahiye
--   4) Challan / report 173 kholein                        → chalna chahiye
--   5) Nayi registration (naya afsar)                      → chalna chahiye
--
-- Agar in me se kuch RUK jaye to foran ROLLBACK file chala dein aur mujhe
-- batayen ke kaun sa qadam ruka aur kya paighaam aaya.
--
-- NOTE: is file ke baad bhi AIK masla baqi rehta hai — RLS band hone ki wajah
-- se aik LOGGED-IN afsar doosre afsar ka data parh sakta hai. Us ka hal RLS
-- enable karna hai, jo agla qadam hai.
-- ============================================================================
