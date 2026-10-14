-- ============================================================================
-- Digital IO — 104_gasht_log.sql   («گشت لاگ» — اکتوبر 2026)   AIK statement.
-- ----------------------------------------------------------------------------
-- NAYI TABLE `gasht_logs` banati hai — aik gasht = aik qataar:
--   gasht_date, area (علاقہ/روٹ), status ('jari' | 'mukammal'),
--   started_at / ended_at (روانگی / واپسی), aur `data` (jsonb) me poori
--   report: ہمراہی ملازمان، سرکاری گاڑی، اور گشت کے تمام اندراجات
--   (وقت، نوعیت، مقام، Lat/Long، تفصیل و کارروائی)۔
--
-- PURANI patrol tables (patrol_logs, patrol_shifts, patrol_tokens,
-- shared_patrol_entries) KO HAATH NAHI LAGAYA. Wo kisi code me istemal nahi
-- hotin (81 me check kiya gaya), un ki policies kabhi jaanchi nahi gayin, aur
-- un par likhne ki rok (92b) bhi nahi — is liye un me naya data likhna ghalat
-- hota. Nayi table shuru se usi hifazat ke sath hai jo baqi app ki hai:
--
--   • RLS ON — har afsar SIRF apne gasht dekhe/likhe/mitaye
--     (officer_id = dio_my_officer_id(); doosre ka officer_id likh nahi sakta)
--   • Miyaad khatam = parh sakta hai, likh nahi sakta (dio_wgate_*, 92b jaisi)
--   • anon: koi haq nahi
--   • authenticated: sirf SELECT/INSERT/UPDATE/DELETE — TRUNCATE nahi
--     (TRUNCATE par RLS lagti hi nahi — 81 dekhein)
--
-- Dobara chalane se koi nuqsan nahi (IF NOT EXISTS / DROP POLICY IF EXISTS).
-- Koi purani table, data ya policy nahi badalti.
-- JAANCH: 104_CHECK.sql   ·   WAPSI: 104_ROLLBACK.sql
-- Jab tak ye file nahi chalti, «گشت لاگ» is aale par mehfooz hota hai aur
-- app saaf batati hai ke sql/104 abhi nahi chali.
-- ============================================================================
do $gasht104$
begin
  if to_regprocedure('public.dio_my_officer_id()') is null
     or to_regprocedure('public.dio_has_active_sub()') is null then
    raise exception 'Digital IO 104: dio_my_officer_id() / dio_has_active_sub() nahi mile — pehle 91–94 chalayen';
  end if;

  create table if not exists public.gasht_logs (
    id          uuid        primary key default gen_random_uuid(),
    officer_id  uuid        not null default public.dio_my_officer_id()
                            references public.officers(id) on delete cascade,
    gasht_date  date,
    area        text,
    status      text        not null default 'jari',
    started_at  timestamptz,
    ended_at    timestamptz,
    data        jsonb       not null default '{}'::jsonb,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    constraint gasht_logs_status_chk check (status in ('jari', 'mukammal')),
    constraint gasht_logs_area_len   check (area is null or char_length(area) <= 500)
  );
  create index if not exists gasht_logs_officer_created on public.gasht_logs (officer_id, created_at desc);

  alter table public.gasht_logs enable row level security;

  -- ── اپنا ریکارڈ ──
  drop policy if exists dio_gasht_sel on public.gasht_logs;
  drop policy if exists dio_gasht_ins on public.gasht_logs;
  drop policy if exists dio_gasht_upd on public.gasht_logs;
  drop policy if exists dio_gasht_del on public.gasht_logs;
  create policy dio_gasht_sel on public.gasht_logs for select to authenticated
    using (officer_id = public.dio_my_officer_id());
  create policy dio_gasht_ins on public.gasht_logs for insert to authenticated
    with check (officer_id = public.dio_my_officer_id());
  create policy dio_gasht_upd on public.gasht_logs for update to authenticated
    using (officer_id = public.dio_my_officer_id())
    with check (officer_id = public.dio_my_officer_id());
  create policy dio_gasht_del on public.gasht_logs for delete to authenticated
    using (officer_id = public.dio_my_officer_id());

  -- ── likhne ki rok (miyaad khatam) — 92b ka hu-ba-hu tareeqa ──
  drop policy if exists dio_wgate_ins on public.gasht_logs;
  drop policy if exists dio_wgate_upd on public.gasht_logs;
  drop policy if exists dio_wgate_del on public.gasht_logs;
  create policy dio_wgate_ins on public.gasht_logs as restrictive for insert to authenticated
    with check (public.dio_has_active_sub());
  create policy dio_wgate_upd on public.gasht_logs as restrictive for update to authenticated
    using (public.dio_has_active_sub()) with check (public.dio_has_active_sub());
  create policy dio_wgate_del on public.gasht_logs as restrictive for delete to authenticated
    using (public.dio_has_active_sub());

  -- ── haq (Supabase ke DEFAULT PRIVILEGES har nayi table par sab kuch de dete hain) ──
  revoke all on public.gasht_logs from anon;
  revoke all on public.gasht_logs from authenticated;
  grant select, insert, update, delete on public.gasht_logs to authenticated;

  -- updated_at khud
  create or replace function public.dio_gasht_touch() returns trigger
    language plpgsql set search_path = pg_catalog, public as
  $t$ begin new.updated_at := now(); return new; end; $t$;
  revoke all on function public.dio_gasht_touch() from public, anon, authenticated;
  drop trigger if exists dio_gasht_touch on public.gasht_logs;
  create trigger dio_gasht_touch before update on public.gasht_logs
    for each row execute function public.dio_gasht_touch();

  notify pgrst, 'reload schema';
  raise notice '104 — gasht_logs tayyar (RLS on, 4 apni + 3 rok policies, anon band, truncate band)';
end;
$gasht104$;
