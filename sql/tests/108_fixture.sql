-- 108_CHECK کی جانچ کا آزمائشی ڈیٹابیس (اصل Postgres 16 پر) — Supabase جیسا ڈھانچہ، کچھ جدولیں جان بوجھ کر غائب
create schema if not exists auth;
create schema if not exists storage;
create table auth.users (id uuid primary key, email text);
create table storage.buckets (id text primary key, public boolean);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
create table public.officers (id uuid primary key, user_id uuid, full_name text);
create table public.cases (id uuid primary key default gen_random_uuid(), officer_id uuid, fir_number text, updated_at timestamptz);
create table public.zimni_reports (id uuid primary key default gen_random_uuid(), case_id uuid, officer_id uuid, serial_no int, content jsonb);
create unique index zimni_case_serial on public.zimni_reports (case_id, serial_no);
create table public.zimni_androoni_reports (id uuid primary key default gen_random_uuid(), case_id uuid, serial_no int);   -- officer_id نہیں
create table public.case_accused (id uuid primary key default gen_random_uuid(), case_id uuid, name text, photos jsonb);
create table public.reminders (id bigserial primary key, officer_id uuid, text text, deleted_at timestamptz);   -- id = bigint
create table public.application_5c_numbers (id uuid primary key default gen_random_uuid(), application_5c_id uuid);  -- نہ officer_id نہ case_id
alter table public.cases enable row level security;
create or replace function public.touch() returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end $$;
create trigger cases_touch before update on public.cases for each row execute function public.touch();
create publication supabase_realtime for table public.cases;

insert into auth.users values ('aaaaaaaa-0000-4000-8000-000000000001', 'IO@Test.pk'), ('aaaaaaaa-0000-4000-8000-000000000002', 'other@test.pk');
insert into public.officers values ('bbbbbbbb-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', 'میں'),
                                   ('bbbbbbbb-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000002', 'دوسرا');
insert into public.cases (id, officer_id, fir_number) values
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '1/26'),
  ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000001', '2/26'),
  ('cccccccc-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000002', '3/26');
-- میری ضمنیاں: 3 (2 officer_id کے ساتھ، 1 بغیر officer_id مگر میرے مقدمے میں)؛ دوسرے کی: 1
insert into public.zimni_reports (case_id, officer_id, serial_no) values
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 1),
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', 2),
  ('cccccccc-0000-4000-8000-000000000002', null, 1),
  ('cccccccc-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000002', 1);
insert into public.zimni_androoni_reports (case_id, serial_no) values
  ('cccccccc-0000-4000-8000-000000000001', 1), ('cccccccc-0000-4000-8000-000000000003', 1);
insert into public.case_accused (case_id, name, photos) values
  ('cccccccc-0000-4000-8000-000000000001', 'الف', '["data:image/jpeg;base64,AAAA"]'),
  ('cccccccc-0000-4000-8000-000000000001', 'ب', '[]');
insert into public.reminders (officer_id, text) values ('bbbbbbbb-0000-4000-8000-000000000001', 'x'), ('bbbbbbbb-0000-4000-8000-000000000002', 'y');
insert into storage.buckets values ('evidence', false), ('5c-attachments', true);
insert into storage.objects (bucket_id, name) values ('evidence', 'a'), ('evidence', 'b');
