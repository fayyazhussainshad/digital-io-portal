-- ═══════════════════════════════════════════════════════════════════════
--  108_CHECK (v560 تیاری — Cross-device sync)   صرف پڑھتی ہے (READ-ONLY)
--  کچھ بھی تبدیل، حذف یا نیا نہیں بنتا۔ ایک ہی statement — ایک ہی نتیجہ۔
-- ───────────────────────────────────────────────────────────────────────
--  مقصد: sync کا ڈیزائن اندازوں پر نہیں، آپ کے اصل ڈیٹابیس پر ہو:
--   • ہر جدول: موجود؟ RLS؟ کون سے خانے (officer_id، case_id، updated_at،
--     deleted_at، id کی قسم)؟ Realtime میں شامل؟ unique پابندیاں؟
--   • کل قطاریں، اور آپ کی اپنی قطاریں (migration سے «پہلے» کی گنتی)
--   • Storage buckets (private / public) اور فائلوں کی تعداد
--   • ملزم/گواہ کی تصاویر جو ابھی جدول کے اندر (data:image) رکھی ہیں
--
--  چلانا: Supabase → SQL Editor → یہ پوری فائل paste کریں → نیچے ایک جگہ
--  'YOUR_EMAIL_HERE' کی جگہ اپنی لاگ اِن ای میل لکھیں → Run → نتیجہ بھیجیں۔
-- ═══════════════════════════════════════════════════════════════════════
with params as (
  select lower(trim('YOUR_EMAIL_HERE'))::text as email
),
me as (
  select (select o.id::text
            from public.officers o
            join auth.users u on u.id::text = to_jsonb(o)->>'user_id'
           where lower(u.email) = (select email from params)
           limit 1) as oid
),
t(name) as (
  values ('cases'), ('zimni_reports'), ('zimni_androoni_reports'), ('report_173'),
         ('case_documents'), ('case_document_versions'), ('case_accused'), ('case_witnesses'),
         ('hamrahi_mulazman'), ('fir_matn'), ('fir_copies'), ('rfa_forms'), ('cro_cards'),
         ('cdr_imei_requests'), ('incident_reports'), ('applications_5c'), ('application_5c_numbers'),
         ('application_5c_attachments'), ('evidence'), ('evidence_custody_events'), ('reminders'),
         ('court_dates'), ('templates'), ('suspects'), ('sarkari_gari'), ('officer_transfers'),
         ('recycle_bin'), ('case_shares'), ('document_approvals'), ('gasht_logs'), ('ahkamat'),
         ('law_library')
),
cols as (
  select t.name,
         to_regclass('public.' || t.name) is not null as mojood,
         coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.' || t.name)), false) as rls,
         exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = t.name and c.column_name = 'officer_id') as has_officer,
         exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = t.name and c.column_name = 'case_id')    as has_case,
         exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = t.name and c.column_name = 'updated_at') as has_updated,
         exists (select 1 from information_schema.columns c where c.table_schema = 'public' and c.table_name = t.name and c.column_name = 'deleted_at') as has_deleted,
         (select c.data_type from information_schema.columns c where c.table_schema = 'public' and c.table_name = t.name and c.column_name = 'id')        as id_type,
         (select c.column_default from information_schema.columns c where c.table_schema = 'public' and c.table_name = t.name and c.column_name = 'id') as id_default,
         exists (select 1 from pg_publication_tables p where p.pubname = 'supabase_realtime' and p.schemaname = 'public' and p.tablename = t.name) as realtime,
         (select coalesce(jsonb_agg(i.indexdef order by i.indexname), '[]'::jsonb) from pg_indexes i
           where i.schemaname = 'public' and i.tablename = t.name and i.indexdef ilike 'create unique%' and i.indexname not ilike '%pkey') as unique_idx,
         exists (select 1 from pg_trigger g where g.tgrelid = to_regclass('public.' || t.name) and not g.tgisinternal and g.tgtype & 16 = 16) as has_update_trigger
  from t
),
counted as (
  select c.*,
    case when c.mojood then
      (xpath('/row/n/text()', query_to_xml(format('select count(*) as n from public.%I', c.name), false, true, '')))[1]::text::bigint
    end as kul,
    case when c.mojood and (select oid from me) is not null and (c.has_officer or c.has_case) then
      (xpath('/row/n/text()', query_to_xml(format(
        'select count(*) as n from public.%I x where %s',
        c.name,
        concat_ws(' or ',
          case when c.has_officer then format('x.officer_id::text = %L', (select oid from me)) end,
          case when c.has_case and c.name <> 'cases' then format(
            'x.case_id::text in (select k.id::text from public.cases k where k.officer_id::text = %L)', (select oid from me)) end)
      ), false, true, '')))[1]::text::bigint
    end as meri
  from cols c
),
img as (
  select jsonb_object_agg(x.name, x.n) as j from (
    select v.name,
      case when to_regclass('public.' || v.name) is not null then
        (xpath('/row/n/text()', query_to_xml(format(
          'select count(*) filter (where to_jsonb(a)::text like %L) as n from public.%I a', '%data:image%', v.name), false, true, '')))[1]::text::bigint
      end as n
    from (values ('case_accused'), ('case_witnesses'), ('hamrahi_mulazman'), ('suspects'), ('incident_reports')) v(name)
  ) x
),
buckets as (
  select case when to_regclass('storage.buckets') is not null then
    (query_to_xml('select b.id, b.public, (select count(*) from storage.objects o where o.bucket_id = b.id) as files from storage.buckets b order by b.id', false, true, ''))::text
  end as x
)
select jsonb_pretty(jsonb_build_object(
  'email_di_gayi',     (select email <> lower('YOUR_' || 'EMAIL_HERE') from params),
  'afsar_mila',        (select oid is not null from me),
  'officer_id',        (select oid from me),
  'tables',            (select jsonb_agg(jsonb_build_object(
                          'jadwal', name, 'mojood', mojood, 'rls', rls,
                          'officer_id', has_officer, 'case_id', has_case,
                          'updated_at', has_updated, 'deleted_at', has_deleted,
                          'update_trigger', has_update_trigger,
                          'id_qisam', id_type, 'id_default', id_default,
                          'realtime', realtime, 'unique', unique_idx,
                          'kul_qataarein', kul, 'meri_qataarein', meri) order by name) from counted),
  'tasaveer_jadwal_ke_andar', (select j from img),
  'storage_buckets_xml', (select x from buckets),
  'realtime_publication_mojood', exists (select 1 from pg_publication where pubname = 'supabase_realtime')
)) as digital_io_108_check;
