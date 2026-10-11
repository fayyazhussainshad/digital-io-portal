-- 93_ROLLBACK — un 21 tables par RLS dobara BAND. AIK statement.
-- ⚠ Iske baad har logged-in afsar har doosre afsar ka case data parh/badal
--    sakega (policies so jati hain). Sirf us soorat me chalayen jab 93 ke baad
--    app ka koi ASAL kaam ruk jaye aur foran kaam chalana zaroori ho.
do $undo93$
declare
  t text; n int := 0;
  band text[] := array[
    'ahkamat','case_accused','case_document_versions','case_documents',
    'case_witnesses','cases','cdr_imei_requests','court_dates','cro_cards',
    'evidence','fir_copies','fir_matn','hamrahi_mulazman','incident_reports',
    'reminders','rfa_forms','sarkari_gari','suspects','templates',
    'zimni_androoni_reports','zimni_reports'
  ];
begin
  foreach t in array band loop
    if exists (select 1 from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
               where ns.nspname='public' and c.relname=t and c.relkind='r') then
      execute format('alter table public.%I disable row level security', t);
      n := n + 1;
    end if;
  end loop;
  raise warning 'WAPSI — % tables par RLS band kar di gayi. Afsaron ke darmiyan tahaffuz khatam.', n;
end;
$undo93$;
