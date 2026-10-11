-- 92_ROLLBACK — likhne ki rok hatao aur parhne ki purani rok wapas lagao.
-- ⚠ Wapsi ka matlab: miyaad-khatam afsar APNA kaam bhi nahi dekh sakega
--    (yahi purana masla tha), magar likh sakega. Sirf zaroorat par chalayen.
do $undo92$
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
  purani text[] := array[
    'ahkamat','case_accused','case_document_versions','case_documents',
    'case_witnesses','cases','cdr_imei_requests','court_dates','cro_cards',
    'evidence','fir_copies','fir_matn','hamrahi_mulazman','incident_reports',
    'reminders','rfa_forms','sarkari_gari','suspects','templates',
    'zimni_androoni_reports','zimni_reports','applications_5c',
    'application_5c_numbers','application_5c_attachments','officer_transfers'
  ];
  t text; n int := 0; m int := 0;
begin
  foreach t in array gated loop
    execute format('drop policy if exists dio_wgate_ins on public.%I', t);
    execute format('drop policy if exists dio_wgate_upd on public.%I', t);
    execute format('drop policy if exists dio_wgate_del on public.%I', t);
    n := n + 1;
  end loop;

  foreach t in array purani loop
    if exists (select 1 from pg_class c join pg_namespace ns on ns.oid=c.relnamespace
               where ns.nspname='public' and c.relname=t and c.relkind='r') then
      execute format('drop policy if exists dio_sub_sel on public.%I', t);
      execute format('create policy dio_sub_sel on public.%I as restrictive '
        || 'for select to authenticated using (public.dio_has_active_sub())', t);
      m := m + 1;
    end if;
  end loop;

  raise warning 'WAPSI — likhne ki rok % tables se hatai, parhne ki purani rok % tables par wapas lagi.', n, m;
end;
$undo92$;
