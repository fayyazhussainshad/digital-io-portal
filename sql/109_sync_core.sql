-- ============================================================================
-- Digital IO — 109_sync_core.sql   (v560 — Cross-device sync، مرحلہ 1)   AIK statement.
-- ----------------------------------------------------------------------------
-- KYA KARTI HAI (sirf izafa — koi qataar, policy ya purana khana nahi badalta):
--
--  0) PEHLE BACKUP: cases, zimni_reports, zimni_androoni_reports, report_173 ki
--     poori naqal `dio_bak_109_*` tables me (RLS on, API se koi rasai nahi).
--     Dobara chalane par backup dobara nahi banta (pehla hi rehta hai).
--
--  1) In 4 tables par sync ke khane (agar pehle se na hon):
--       rev         bigint  — har tabdeeli par +1 (server khud badhata hai).
--                             Do aalaat ek hi dastavez badlen to isi se pata
--                             chalta hai — dono nuskhe rakh kar afsar se poocha
--                             jata hai (koi tehreer khamoshi se zaya nahi).
--       deleted_at  timestamptz — «حذف» = sirf nishan (soft-delete); asal
--                             qataar mehfooz, «حذف شدہ مواد» se wapas.
--       last_device text    — aakhri tabdeeli kis aale se (لیپ ٹاپ / موبائل).
--       updated_at          — report_173 me nahi tha, ab hai.
--     Trigger `dio_sync_touch`: har UPDATE par rev +1 aur updated_at = now()
--     (client rev ya waqt khud nahi likh sakta).
--
--  2) Nayi table `dio_user_data` — jo aaj SIRF aik aale par hai (ضمنی/بیان ke
--     khudkar masoode, SHO/DSP naam, تفصیل کاغذات, kaghaz ka size, apni aqsam…).
--     Har afsar SIRF apna data dekhe/likhe (officer_id = dio_my_officer_id()),
--     miyaad khatam = parh sakta hai likh nahi sakta (dio_wgate_*), anon: kuch nahi.
--
--  3) Realtime: in 5 tables ko `supabase_realtime` me shamil — dusre aale par
--     tabdeeli khud nazar aaye (refresh ke baghair). Realtime RLS ki paband hai:
--     har afsar ko sirf wohi tabdeeli milti hai jo wo waise bhi parh sakta hai.
--
-- Dobara chalane se koi nuqsan nahi (IF NOT EXISTS / pehle se ho to chhoR do).
-- JAANCH: 109_CHECK.sql   ·   WAPSI: 109_ROLLBACK.sql
-- Aasli Postgres 16 par jaancha gaya: sql/tests/109_test.sh
-- ============================================================================
do $sync109$
declare
  t text;
  core text[] := array['cases', 'zimni_reports', 'zimni_androoni_reports', 'report_173'];
  added int := 0;
begin
  if to_regprocedure('public.dio_my_officer_id()') is null
     or to_regprocedure('public.dio_has_active_sub()') is null then
    raise exception 'Digital IO 109: dio_my_officer_id() / dio_has_active_sub() nahi mile — pehle 91–94 chalayen';
  end if;
  foreach t in array core loop
    if to_regclass('public.' || t) is null then
      raise exception 'Digital IO 109: table % nahi mili — kuch nahi badla', t;
    end if;
  end loop;
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise exception 'Digital IO 109: supabase_realtime publication nahi mili — kuch nahi badla';
  end if;

  -- ── 0) BACKUP (sirf pehli dafa) ─────────────────────────────────────────
  foreach t in array core loop
    if to_regclass('public.dio_bak_109_' || t) is null then
      execute format('create table public.%I as table public.%I', 'dio_bak_109_' || t, t);
      execute format('alter table public.%I enable row level security', 'dio_bak_109_' || t);
      execute format('revoke all on public.%I from anon, authenticated', 'dio_bak_109_' || t);
      execute format('comment on table public.%I is %L', 'dio_bak_109_' || t,
                     'Digital IO 109 backup — ' || to_char(now() at time zone 'Asia/Karachi', 'DD/MM/YYYY HH24:MI'));
    end if;
  end loop;

  -- ── 1) sync ke khane + trigger ──────────────────────────────────────────
  create or replace function public.dio_sync_touch() returns trigger
    language plpgsql set search_path = pg_catalog, public as
  $t$
  begin
    new.rev := coalesce(old.rev, 0) + 1;      -- client ka bheja rev kabhi nahi chalta
    new.updated_at := now();
    return new;
  end;
  $t$;
  revoke all on function public.dio_sync_touch() from public, anon, authenticated;

  foreach t in array core loop
    if not exists (select 1 from information_schema.columns
                   where table_schema = 'public' and table_name = t and column_name = 'updated_at') then
      execute format('alter table public.%I add column updated_at timestamptz not null default now()', t);
      execute format('comment on column public.%I.updated_at is %L', t, 'dio109');   -- wapsi ke liye nishan
      added := added + 1;
    end if;
    execute format('alter table public.%I add column if not exists rev bigint not null default 1', t);
    execute format('alter table public.%I add column if not exists deleted_at timestamptz', t);
    execute format('alter table public.%I add column if not exists last_device text', t);
    if not exists (select 1 from pg_constraint where conname = t || '_dio_last_device_len') then
      execute format('alter table public.%I add constraint %I check (last_device is null or char_length(last_device) <= 60)',
                     t, t || '_dio_last_device_len');
    end if;
    execute format('create index if not exists %I on public.%I (updated_at)', t || '_dio_upd_idx', t);
    execute format('drop trigger if exists dio_sync_touch on public.%I', t);
    execute format('create trigger dio_sync_touch before update on public.%I for each row execute function public.dio_sync_touch()', t);
  end loop;

  -- ── 2) dio_user_data ────────────────────────────────────────────────────
  create table if not exists public.dio_user_data (
    id          uuid        primary key default gen_random_uuid(),
    officer_id  uuid        not null default public.dio_my_officer_id()
                            references public.officers(id) on delete cascade,
    kind        text        not null,          -- 'zimni_draft' | 'za_draft' | 'setting' | …
    doc_key     text        not null,          -- masalan: <case_id>:new:<waqt>  ya  digital_io_sho
    case_id     uuid,
    data        jsonb       not null default '{}'::jsonb,
    rev         bigint      not null default 1,
    last_device text,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    deleted_at  timestamptz,
    constraint dio_user_data_kind_len   check (char_length(kind) between 1 and 40),
    constraint dio_user_data_key_len    check (char_length(doc_key) between 1 and 300),
    constraint dio_user_data_dev_len    check (last_device is null or char_length(last_device) <= 60),
    constraint dio_user_data_size       check (pg_column_size(data) <= 5242880),
    constraint dio_user_data_one_key    unique (officer_id, kind, doc_key)
  );
  create index if not exists dio_user_data_upd_idx on public.dio_user_data (officer_id, updated_at);
  alter table public.dio_user_data enable row level security;

  drop policy if exists dio_ud_sel on public.dio_user_data;
  drop policy if exists dio_ud_ins on public.dio_user_data;
  drop policy if exists dio_ud_upd on public.dio_user_data;
  drop policy if exists dio_ud_del on public.dio_user_data;
  create policy dio_ud_sel on public.dio_user_data for select to authenticated
    using (officer_id = public.dio_my_officer_id());
  create policy dio_ud_ins on public.dio_user_data for insert to authenticated
    with check (officer_id = public.dio_my_officer_id());
  create policy dio_ud_upd on public.dio_user_data for update to authenticated
    using (officer_id = public.dio_my_officer_id())
    with check (officer_id = public.dio_my_officer_id());
  create policy dio_ud_del on public.dio_user_data for delete to authenticated
    using (officer_id = public.dio_my_officer_id());

  drop policy if exists dio_wgate_ins on public.dio_user_data;
  drop policy if exists dio_wgate_upd on public.dio_user_data;
  drop policy if exists dio_wgate_del on public.dio_user_data;
  create policy dio_wgate_ins on public.dio_user_data as restrictive for insert to authenticated
    with check (public.dio_has_active_sub());
  create policy dio_wgate_upd on public.dio_user_data as restrictive for update to authenticated
    using (public.dio_has_active_sub()) with check (public.dio_has_active_sub());
  create policy dio_wgate_del on public.dio_user_data as restrictive for delete to authenticated
    using (public.dio_has_active_sub());

  revoke all on public.dio_user_data from anon;
  revoke all on public.dio_user_data from authenticated;
  grant select, insert, update, delete on public.dio_user_data to authenticated;

  drop trigger if exists dio_sync_touch on public.dio_user_data;
  create trigger dio_sync_touch before update on public.dio_user_data
    for each row execute function public.dio_sync_touch();

  -- ── 3) Realtime ─────────────────────────────────────────────────────────
  foreach t in array (core || array['dio_user_data']) loop
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;

  notify pgrst, 'reload schema';
  raise notice '109 — mukammal: backup 4 tables, sync khane + trigger 4 tables (naya updated_at: %), dio_user_data (RLS on), realtime 5 tables', added;
end;
$sync109$;
