-- ═══════════════════════════════════════════════════════════════════════
--  110_CHECK — صرف پڑھتی ہے (READ-ONLY)۔ کچھ تبدیل، حذف یا نیا نہیں بنتا۔
--  110_no_case_sharing چلانے سے پہلے بھی چلا سکتے ہیں (گنتی)، اور بعد میں (تصدیق)۔
--  ہر «..._ok» = true ہو تو مقدمہ شیئر ڈیٹابیس میں بھی مکمل بند۔
-- ═══════════════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'case_shares_qataarein', (select count(*) from public.case_shares),
  -- گشت کا جدول sql/111 سے ہٹ سکتا ہے — سیدھا نام نہیں، موجود ہو تب ہی گنتی (ورنہ null)
  'gasht_logs_qataarein',  (case when to_regclass('public.gasht_logs') is null then null
                             else (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.gasht_logs', false, true, '')))[1]::text::bigint end),
  'likhne_ka_haq_band_ok', not (has_table_privilege('authenticated', 'public.case_shares', 'INSERT')
                             or has_table_privilege('authenticated', 'public.case_shares', 'UPDATE')
                             or has_table_privilege('anon', 'public.case_shares', 'INSERT')),
  'nayi_qatar_ki_rok_ok',  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'case_shares'
                                     and policyname = 'dio110_noshare_ins' and permissive = 'RESTRICTIVE'),
  'tabdeeli_ki_rok_ok',    exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'case_shares'
                                     and policyname = 'dio110_noshare_upd' and permissive = 'RESTRICTIVE'),
  'jadwal_khali_ok',       (select count(*) = 0 from public.case_shares),
  'rls_on_ok',             (select relrowsecurity from pg_class where oid = 'public.case_shares'::regclass),
  -- معلومات: دوسری جدولوں کی وہ پالیسیاں جن میں شیئر کی شرط ہے (خالی جدول = کبھی سچ نہیں)
  'share_shart_wali_policies', (select coalesce(jsonb_agg(tablename || '.' || policyname order by tablename, policyname), '[]'::jsonb)
                                  from pg_policies where schemaname = 'public' and tablename <> 'case_shares'
                                   and (coalesce(qual, '') ilike '%case_shares%' or coalesce(with_check, '') ilike '%case_shares%'))
)) as digital_io_110_check;
