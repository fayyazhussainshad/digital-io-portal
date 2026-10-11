-- ============================================================================
-- Digital IO — 80_close_anon_hole_ROLLBACK.sql
-- ----------------------------------------------------------------------------
-- `80_close_anon_hole.sql` ko wapas le leti hai: `anon` ko un 21 tables par
-- data ka haq dobara de deti hai.
--
-- ⚠ KHABARDAR: ye chalane ka matlab hai ke bina login, public anon key se,
--   poora case record dobara parha/badla/mitaya ja sakega. Sirf us soorat me
--   chalayen jab 80 ke baad app ka koi asal kaam ruk gaya ho AUR aap ko foran
--   kaam chalana ho. Us ke baad mujhe batayen — hum wo kaam doosre tareeqe se
--   khol denge.
-- ============================================================================

do $undo$
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
      continue;
    end if;

    execute format(
      'grant select, insert, update, delete, truncate on public.%I to anon', t);

    n := n + 1;
    raise notice 'anon ka haq wapas diya: %', t;
  end loop;

  raise warning 'WAPSI MUKAMMAL — % tables dobara anon ke liye khuli hain. Ye haalat mehfooz NAHI hai.', n;
end;
$undo$;

-- ── Tasdeeq ────────────────────────────────────────────────────────────────
select table_name,
       string_agg(privilege_type, ', ' order by privilege_type) as anon_ke_haq
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee = 'anon'
  and privilege_type in ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE')
group by table_name
order by table_name;
