-- ============================================================================
-- Digital IO — 81_anon_lockdown_ROLLBACK.sql
-- ----------------------------------------------------------------------------
-- `81_anon_lockdown.sql` ko wapas le leti hai.
--
-- ⚠ KHABARDAR — ye haalat MEHFOOZ NAHI hai. Is ke baad dobara:
--     • bina login, public anon key se, har table parhi/badli ja sakegi
--     • `admin_dashboard` view RLS ko by-pass kar ke poora data dikhayega
--     • anon AUR logged-in afsar, dono poori tables TRUNCATE kar sakenge
--       (RLS TRUNCATE ko rokti hi nahi)
--
-- Sirf us soorat me chalayen jab 81 ke baad app ka koi ASAL kaam ruk gaya ho
-- aur aap ko foran kaam chalana ho. Us ke baad mujhe batayen — hum wo kaam
-- sirf utna khol denge jitna zaroori hai, poora darwaza kholne ke bajaye.
-- ============================================================================

grant all privileges on all tables in schema public to anon;
alter default privileges in schema public grant all on tables to anon;

grant truncate, trigger on all tables in schema public to authenticated;
alter default privileges in schema public grant truncate, trigger on tables to authenticated;

do $warn$
begin
  raise warning 'WAPSI MUKAMMAL — anon ko dobara poora haq mil gaya hai. Ye haalat mehfooz NAHI hai.';
end;
$warn$;

-- ── Tasdeeq ────────────────────────────────────────────────────────────────
select grantee,
       count(distinct table_name) as kitni_tables,
       string_agg(distinct privilege_type, ', ' order by privilege_type) as haq
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon','authenticated')
group by grantee
order by grantee;
