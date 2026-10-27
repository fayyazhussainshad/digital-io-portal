-- ============================================================================
-- Digital IO — 109_ROLLBACK.sql   AIK statement.   (109 ki wapsi)
-- ----------------------------------------------------------------------------
-- KOI DATA ZAYA NAHI HOTA:
--   • Agar kisi qataar par «حذف» (deleted_at) ka nishan laga ho to wapsi RUK jati
--     hai — warna wo qataar fehrist me wapas aa jati (afsar ki marzi ke khilaf).
--     Pehle «حذف شدہ مواد» se faisla karein.
--   • dio_user_data mitayi nahi jati — naam badal kar `dio_user_data_rb109`
--     (masoode/settings mehfooz). Backup tables `dio_bak_109_*` bhi jaisi ki taisi.
--   • report_173.updated_at sirf tab hatta hai jab 109 ne banaya ho (nishan 'dio109').
-- ============================================================================
do $rb109$
declare
  t text;
  core text[] := array['cases', 'zimni_reports', 'zimni_androoni_reports', 'report_173'];
  n bigint;
begin
  foreach t in array core loop
    if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = t and column_name = 'deleted_at') then
      execute format('select count(*) from public.%I where deleted_at is not null', t) into n;
      if n > 0 then
        raise exception 'Digital IO 109 ROLLBACK ruk gaya: % me % qataarein «حذف» nishan wali hain — kuch nahi badla', t, n;
      end if;
    end if;
  end loop;

  foreach t in array (core || array['dio_user_data']) loop
    if exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime drop table public.%I', t);
    end if;
  end loop;

  foreach t in array core loop
    execute format('drop trigger if exists dio_sync_touch on public.%I', t);
    execute format('drop index if exists public.%I', t || '_dio_upd_idx');
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_dio_last_device_len');
    execute format('alter table public.%I drop column if exists rev', t);
    execute format('alter table public.%I drop column if exists deleted_at', t);
    execute format('alter table public.%I drop column if exists last_device', t);
    if col_description(to_regclass('public.' || t),
         (select attnum from pg_attribute where attrelid = to_regclass('public.' || t) and attname = 'updated_at' and not attisdropped)) = 'dio109' then
      execute format('alter table public.%I drop column updated_at', t);
    end if;
  end loop;

  if to_regclass('public.dio_user_data') is not null then
    if to_regclass('public.dio_user_data_rb109') is not null then
      raise exception 'Digital IO 109 ROLLBACK: dio_user_data_rb109 pehle se mojood — kuch nahi mitaya; pehle us ka faisla karein';
    end if;
    drop trigger if exists dio_sync_touch on public.dio_user_data;
    alter table public.dio_user_data rename to dio_user_data_rb109;
    -- index/constraint ke naam bhi badlo — warna 109 dobara chalne par «already exists»
    -- ya (index) khamoshi se purani table wala index maan liya jata
    for t in select conname from pg_constraint where conrelid = 'public.dio_user_data_rb109'::regclass and contype in ('p', 'u') loop
      execute format('alter table public.dio_user_data_rb109 rename constraint %I to %I', t, t || '_rb109');
    end loop;
    for t in select c.relname from pg_index i join pg_class c on c.oid = i.indexrelid
             where i.indrelid = 'public.dio_user_data_rb109'::regclass
               and not exists (select 1 from pg_constraint k where k.conindid = i.indexrelid) loop
      execute format('alter index public.%I rename to %I', t, t || '_rb109');
    end loop;
    revoke all on public.dio_user_data_rb109 from anon, authenticated;
  end if;
  drop function if exists public.dio_sync_touch();

  notify pgrst, 'reload schema';
  raise notice '109 ROLLBACK — mukammal (backup aur dio_user_data_rb109 mehfooz)';
end;
$rb109$;
