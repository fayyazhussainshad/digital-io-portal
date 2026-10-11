-- 92b — likhne ki rok: miyaad khatam afsar insert/update/delete na kar sake.
-- Parhna chhua hi nahi gaya. AIK statement. (92a ke BAAD chalayen.)
do $write_gate$
declare
  gated text[] := array[
    'cases','case_documents','case_document_versions','case_accused',
    'case_witnesses','case_shares','zimni_reports','zimni_androoni_reports',
    'evidence','reminders','court_dates','fir_matn','fir_copies','suspects',
    'incident_reports','hamrahi_mulazman','cdr_imei_requests','cdr_uploads',
    'cro_cards','rfa_forms','sarkari_gari','templates','ahkamat','law_library',
    'recycle_bin','misal','report_173','applications_5c',
    'application_5c_numbers','application_5c_attachments','diary_entries',
    'document_approvals','officer_transfers'
  ];
  t text; n int := 0;
begin
  foreach t in array gated loop
    if not exists (select 1 from pg_class c
                   join pg_namespace ns on ns.oid = c.relnamespace
                   where ns.nspname = 'public' and c.relname = t and c.relkind = 'r')
    then raise notice 'chhoRa (table nahi): %', t; continue; end if;

    execute format('drop policy if exists dio_wgate_ins on public.%I', t);
    execute format('drop policy if exists dio_wgate_upd on public.%I', t);
    execute format('drop policy if exists dio_wgate_del on public.%I', t);

    execute format('create policy dio_wgate_ins on public.%I as restrictive '
      || 'for insert to authenticated with check (public.dio_has_active_sub())', t);
    execute format('create policy dio_wgate_upd on public.%I as restrictive '
      || 'for update to authenticated using (public.dio_has_active_sub()) '
      || 'with check (public.dio_has_active_sub())', t);
    execute format('create policy dio_wgate_del on public.%I as restrictive '
      || 'for delete to authenticated using (public.dio_has_active_sub())', t);

    n := n + 1;
  end loop;
  raise notice 'mukammal — likhne ki rok % tables par lagi', n;
end;
$write_gate$;
