-- 100 — ای میل اطلاعات (رجسٹریشن / منظوری / سبسکرپشن). AIK statement.
--
-- ⚠ PEHLE Edge Function `dio-notify` deploy kar lein aur us ke do secrets
--   (DIO_SMTP_USER, DIO_SMTP_PASS) laga dein. Warna trigger to chalega magar
--   email nahi jayegi (registration/manzoori phir bhi BILKUL theek chalegi —
--   trigger kabhi rukawat nahi banta).
--
-- Kya banta hai:
--   1) pg_net extension (DB se HTTP — Supabase par mojood).
--   2) public.dio_email_log — har bheji gayi email ka record. (kind, ref) UNIQUE
--      = aik waqia, aik email. RLS ON; sirf admin/superadmin parh sakte hain;
--      likhai sirf Edge Function (service role) karta hai.
--   3) public.dio_email_notify() — trigger function. Sirf {kind, officer_id, ref}
--      bhejta hai; baqi sab Edge Function DB se khud parhta hai.
--   4) Teen triggers:
--        officers INSERT                      → registered (ya approved agar
--                                               record pehle se manzoor bana)
--        officers is_approved: false → true   → approved (trial ki tareekhon ke sath)
--        subscriptions status → 'active'      → subscription (از … تا …)
--
-- Tarteeb ka masla NAHI: pg_net darkhwast transaction COMMIT ke BAAD bhejta
-- hai, is liye dio_trial_on_approval ka banaya trial Edge Function ko mil jata hai.
-- Anon key AWAMI hai (app-core.js me bhi yahi hai) — koi raaz nahi.
do $email$
begin
  execute 'create extension if not exists pg_net with schema extensions';

  execute $q$
    create table if not exists public.dio_email_log (
      id          bigint generated always as identity primary key,
      kind        text not null check (kind in ('registered','approved','subscription')),
      ref         uuid not null,
      officer_id  uuid,
      to_email    text,
      status      text not null default 'sending' check (status in ('sending','sent','failed')),
      error       text,
      created_at  timestamptz not null default now(),
      updated_at  timestamptz not null default now(),
      unique (kind, ref)
    )
  $q$;
  execute 'alter table public.dio_email_log enable row level security';
  execute 'revoke all on public.dio_email_log from anon';
  execute 'revoke insert, update, delete, truncate on public.dio_email_log from authenticated';
  execute 'drop policy if exists "Admins read email log" on public.dio_email_log';
  execute $q$
    create policy "Admins read email log" on public.dio_email_log
      for select to authenticated
      using (exists (
        select 1 from public.officers o
        where o.user_id = auth.uid()
          and o.role in ('admin','superadmin')
          and coalesce(o.suspended, false) = false
      ))
  $q$;

  execute $q$
    create or replace function public.dio_email_notify()
    returns trigger
    language plpgsql
    security definer
    set search_path = pg_catalog, public, pg_temp
    as $fn$
    declare
      _kind text;
      _oid  uuid;
      _ref  uuid;
      _anon constant text := 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicmh0b2t5bnhtbGp1bXh5YWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzU5ODIsImV4cCI6MjA5NTUxMTk4Mn0.o4uKyqhIx9vWDX-CeJjwujWUYK6Cy0XzEZ5fw_efQMA';
    begin
      if tg_table_name = 'officers' then
        _oid := new.id;
        _ref := new.id;
        if tg_op = 'INSERT' then
          _kind := case when coalesce(new.is_approved, false) then 'approved' else 'registered' end;
        elsif coalesce(new.is_approved, false) and not coalesce(old.is_approved, false) then
          _kind := 'approved';
        end if;
      elsif tg_table_name = 'subscriptions' then
        if new.status = 'active' and coalesce(old.status, '') <> 'active' then
          _kind := 'subscription';
          _oid  := new.officer_id;
          _ref  := new.id;
        end if;
      end if;

      if _kind is null or _oid is null then
        return new;
      end if;

      -- Email ki koi bhi kharabi registration/manzoori ko KABHI na roke
      begin
        perform net.http_post(
          url     := 'https://bbrhtokynxmljumxyaeh.supabase.co/functions/v1/dio-notify',
          body    := jsonb_build_object('kind', _kind, 'officer_id', _oid, 'ref', _ref),
          headers := jsonb_build_object(
                       'Content-Type',  'application/json',
                       'Authorization', 'Bearer ' || _anon,
                       'apikey',        _anon),
          timeout_milliseconds := 10000
        );
      exception when others then
        raise warning 'dio_email_notify (%): %', _kind, sqlerrm;
      end;
      return new;
    end;
    $fn$
  $q$;
  execute 'revoke all on function public.dio_email_notify() from public, anon, authenticated';

  execute 'drop trigger if exists dio_email_on_officer_insert on public.officers';
  execute 'create trigger dio_email_on_officer_insert after insert on public.officers
             for each row execute function public.dio_email_notify()';
  execute 'drop trigger if exists dio_email_on_officer_approve on public.officers';
  execute 'create trigger dio_email_on_officer_approve after update of is_approved on public.officers
             for each row execute function public.dio_email_notify()';
  execute 'drop trigger if exists dio_email_on_sub_active on public.subscriptions';
  execute 'create trigger dio_email_on_sub_active after update of status on public.subscriptions
             for each row execute function public.dio_email_notify()';
end
$email$;
