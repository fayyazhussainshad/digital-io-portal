-- 93b — un 21 tables par RLS ON jahan abhi BAND hai. AIK statement.
-- Yahi qadam aik afsar ko doosre afsar ka data parhne se rokta hai.
-- (93a ke BAAD chalayen.)
do $enable_rls$
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
    if not exists (select 1 from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
                   where ns.nspname='public' and c.relname=t and c.relkind='r')
    then raise notice 'chhoRa (table nahi): %', t; continue; end if;

    -- ehtiyat: policy hi na ho to RLS on karna sab kuch band kar deta hai
    if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                   join pg_namespace ns on ns.oid=c.relnamespace
                   where ns.nspname='public' and c.relname=t and p.polpermissive)
    then raise warning 'chhoRa (koi permissive policy nahi): %', t; continue; end if;

    execute format('alter table public.%I enable row level security', t);
    n := n + 1;
    raise notice 'RLS on: %', t;
  end loop;
  raise notice 'mukammal — % tables par RLS on ho gayi', n;
end;
$enable_rls$;
