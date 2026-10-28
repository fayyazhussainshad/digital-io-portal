-- ═══════════════════════════════════════════════════════════════════════
--  111_CHECK — صرف پڑھتی ہے (READ-ONLY)۔ کچھ تبدیل، حذف یا نیا نہیں بنتا۔
--  111 سے پہلے (گنتی) اور بعد (تصدیق) دونوں وقت چلا سکتے ہیں۔ 111 کے بعد ہر «..._ok» = true۔
-- ═══════════════════════════════════════════════════════════════════════
select jsonb_pretty(jsonb_build_object(
  'gasht_jadwal_mojood',     to_regclass('public.gasht_logs') is not null,
  'gasht_qataarein',         (case when to_regclass('public.gasht_logs') is null then null
                                else (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.gasht_logs', false, true, '')))[1]::text::bigint end),
  'hazf_shuda_mein_gasht',   (case when to_regclass('public.recycle_bin') is null then null
                                else (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.recycle_bin where item_type = ''gasht''', false, true, '')))[1]::text::bigint end),
  'gasht_hata_ok',           to_regclass('public.gasht_logs') is null,
  'backup_mojood_ok',        to_regclass('public.dio_bak_111_gasht_logs') is not null,
  'backup_rls_ok',           coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.dio_bak_111_gasht_logs')), false),
  'backup_band_ok',          coalesce((select not has_table_privilege('authenticated', c.oid, 'SELECT')
                                          and not has_table_privilege('anon', c.oid, 'SELECT')
                                     from pg_class c where c.oid = to_regclass('public.dio_bak_111_gasht_logs')), false),
  'backup_qataarein',        (case when to_regclass('public.dio_bak_111_gasht_logs') is null then null
                                else (xpath('/row/c/text()', query_to_xml('select count(*) as c from public.dio_bak_111_gasht_logs', false, true, '')))[1]::text::bigint end),
  'touch_function_hata_ok',  to_regprocedure('public.dio_gasht_touch()') is null
)) as digital_io_111_check;
