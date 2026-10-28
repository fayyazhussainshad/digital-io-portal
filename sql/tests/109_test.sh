#!/usr/bin/env bash
# 109_sync_core — اصل PostgreSQL 16 پر جانچ (Supabase جیسا ڈھانچہ: anon/authenticated، auth.uid()، RLS، write gate)
# ڈھانچہ 108_CHECK کے اصل نتیجے کے مطابق: zimni/androoni میں updated_at ہے، report_173 میں نہیں، cases پر پہلے سے trigger۔
# چلانا:  PGHOST=<socket dir> PGPORT=5433 bash sql/tests/109_test.sh
set -u
cd "$(dirname "$0")/../.."
DB=t109
P="psql -U postgres -v ON_ERROR_STOP=1 -q"
pass=0; fail=0
ok()   { echo "PASS $1"; pass=$((pass+1)); }
bad()  { echo "FAIL $1 :: $2"; fail=$((fail+1)); }
eq()   { if [ "$2" == "$3" ]; then ok "$1"; else bad "$1" "got [$2] want [$3]"; fi; }
has()  { if echo "$2" | grep -q -- "$3"; then ok "$1"; else bad "$1" "[$2] lacks [$3]"; fi; }
sql()  { $P -d $DB -At -c "$1" 2>&1; }
# بطور افسر (authenticated + JWT sub)
as()   { printf "set role authenticated; set request.jwt.claim.sub = '%s';\n%s\n" "$1" "$2" | $P -d $DB -At 2>&1; }
anon() { printf "set role anon;\n%s\n" "$1" | $P -d $DB -At 2>&1; }

A=aaaaaaaa-0000-4000-8000-00000000000a; B=bbbbbbbb-0000-4000-8000-00000000000b
UA=11111111-0000-4000-8000-00000000000a; UB=22222222-0000-4000-8000-00000000000b
CA=cccccccc-0000-4000-8000-0000000000a1; CB=cccccccc-0000-4000-8000-0000000000b1
ZA=dddddddd-0000-4000-8000-0000000000a1

psql -U postgres -q -c "drop database if exists $DB" -c "create database $DB" >/dev/null 2>&1
$P -d $DB <<SQL >/dev/null 2>&1
do \$\$ begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
end \$\$;
create schema auth;
create function auth.uid() returns uuid language sql stable as \$\$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid \$\$;
grant usage on schema auth, public to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
create table public.officers (id uuid primary key, user_id uuid);
create table public.subs (officer_id uuid primary key, active boolean);
create function public.dio_my_officer_id() returns uuid language sql stable security definer set search_path = public
  as \$\$ select id from public.officers where user_id = auth.uid() \$\$;
create function public.dio_has_active_sub() returns boolean language sql stable security definer set search_path = public
  as \$\$ select coalesce((select active from public.subs where officer_id = public.dio_my_officer_id()), false) \$\$;
grant execute on function public.dio_my_officer_id(), public.dio_has_active_sub() to authenticated;

create table public.cases (id uuid primary key default gen_random_uuid(), officer_id uuid, fir_number text,
  status text, created_at timestamptz default now(), updated_at timestamptz default now());
create function public.cases_old_touch() returns trigger language plpgsql as \$\$ begin new.updated_at := now(); return new; end \$\$;
create trigger cases_old_touch before update on public.cases for each row execute function public.cases_old_touch();
create table public.zimni_reports (id uuid primary key default gen_random_uuid(), case_id uuid, officer_id uuid,
  serial_no int, report_date date, content jsonb, body text, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.zimni_androoni_reports (id uuid primary key default gen_random_uuid(), case_id uuid, officer_id uuid,
  serial_no int, report_date date, content jsonb, created_at timestamptz default now(), updated_at timestamptz default now());
create table public.report_173 (id uuid primary key default gen_random_uuid(), case_id uuid, officer_id uuid,
  report_type text, report_subtype text, form_data jsonb, created_at timestamptz default now());
do \$\$ declare t text; begin
  foreach t in array array['cases','zimni_reports','zimni_androoni_reports','report_173'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('create policy dio_wgate_ins on public.%I as restrictive for insert to authenticated with check (public.dio_has_active_sub())', t);
    execute format('create policy dio_wgate_upd on public.%I as restrictive for update to authenticated using (public.dio_has_active_sub()) with check (public.dio_has_active_sub())', t);
    execute format('create policy dio_wgate_del on public.%I as restrictive for delete to authenticated using (public.dio_has_active_sub())', t);
  end loop;
end \$\$;
create policy own on public.cases for all to authenticated using (officer_id = public.dio_my_officer_id()) with check (officer_id = public.dio_my_officer_id());
create policy own on public.report_173 for all to authenticated using (officer_id = public.dio_my_officer_id()) with check (officer_id = public.dio_my_officer_id());
-- 90 جیسی: پڑھنا اپنا یا اپنے مقدمے کا؛ لکھنا صرف اپنے مقدمے میں
create policy sel on public.zimni_reports for select to authenticated using (officer_id = public.dio_my_officer_id()
  or case_id in (select c.id from public.cases c where c.officer_id = public.dio_my_officer_id()));
create policy ins on public.zimni_reports for insert to authenticated with check (officer_id = public.dio_my_officer_id()
  and case_id in (select c.id from public.cases c where c.officer_id = public.dio_my_officer_id()));
create policy upd on public.zimni_reports for update to authenticated
  using (case_id in (select c.id from public.cases c where c.officer_id = public.dio_my_officer_id()))
  with check (case_id in (select c.id from public.cases c where c.officer_id = public.dio_my_officer_id()));
create policy own on public.zimni_androoni_reports for all to authenticated
  using (case_id in (select c.id from public.cases c where c.officer_id = public.dio_my_officer_id()))
  with check (case_id in (select c.id from public.cases c where c.officer_id = public.dio_my_officer_id()));
create publication supabase_realtime;

insert into public.officers values ('$A', '$UA'), ('$B', '$UB');
insert into public.subs values ('$A', true), ('$B', true);
insert into public.cases (id, officer_id, fir_number) values ('$CA', '$A', '681/26'), ('$CB', '$B', '9/26'),
  (gen_random_uuid(), '$A', '645/26');
insert into public.zimni_reports (id, case_id, officer_id, serial_no, report_date, content) values
  ('$ZA', '$CA', '$A', 1, '2026-10-23', '{"bodyHtml":"<p>اول</p>"}'),
  (gen_random_uuid(), '$CA', '$A', 2, '2026-10-24', '{}'), (gen_random_uuid(), '$CB', '$B', 1, '2026-10-01', '{}');
insert into public.zimni_androoni_reports (case_id, officer_id, serial_no) values ('$CA', '$A', 1);
insert into public.report_173 (case_id, officer_id, report_type, form_data) values ('$CA', '$A', 'interim', '{}'), ('$CB', '$B', 'challan', '{}');
SQL

BEFORE=$(sql "select (select count(*) from cases)||','||(select count(*) from zimni_reports)||','||(select count(*) from zimni_androoni_reports)||','||(select count(*) from report_173)")

# ── 1) چلانا، دوبارہ چلانا ──
R1=$($P -d $DB -f sql/109_sync_core.sql 2>&1); has "109 پہلی بار چلی" "$R1" "109 — mukammal"
R2=$($P -d $DB -f sql/109_sync_core.sql 2>&1); has "109 دوبارہ چلانے سے کوئی نقصان نہیں" "$R2" "109 — mukammal"
AFTER=$(sql "select (select count(*) from cases)||','||(select count(*) from zimni_reports)||','||(select count(*) from zimni_androoni_reports)||','||(select count(*) from report_173)")
eq "کوئی قطار نہیں بدلی/گھٹی" "$AFTER" "$BEFORE"
eq "پرانا مواد جوں کا توں (ضمنی 1)" "$(sql "select content->>'bodyHtml' from zimni_reports where id='$ZA'")" "<p>اول</p>"
eq "پرانی قطاروں کا rev = 1" "$(sql "select count(*) from zimni_reports where rev <> 1")" "0"
eq "backup = اصل (4 جدولیں)" "$(sql "select (select count(*) from dio_bak_109_cases)||','||(select count(*) from dio_bak_109_zimni_reports)||','||(select count(*) from dio_bak_109_zimni_androoni_reports)||','||(select count(*) from dio_bak_109_report_173)")" "$BEFORE"
CHK=$($P -d $DB -At -f sql/109_CHECK.sql 2>&1)
has "CHECK: sab_4_tayyar" "$CHK" '"sab_4_tayyar": true'
for k in user_data_mojood user_data_rls_on user_data_apni_4 user_data_rok_3 user_data_koi_aur_policy_nahi user_data_anon_band user_data_authenticated_sirf_4 user_data_realtime user_data_trigger; do
  has "CHECK: $k" "$CHK" "\"$k\": true"
done
eq "Realtime میں 5 جدولیں" "$(sql "select string_agg(tablename, ',' order by tablename) from pg_publication_tables where pubname='supabase_realtime'")" "cases,dio_user_data,report_173,zimni_androoni_reports,zimni_reports"
eq "report_173.updated_at نیا (نشان dio109)" "$(sql "select col_description('public.report_173'::regclass, (select attnum from pg_attribute where attrelid='public.report_173'::regclass and attname='updated_at'))")" "dio109"
eq "zimni.updated_at پہلے سے تھا (نشان نہیں)" "$(sql "select coalesce(col_description('public.zimni_reports'::regclass, (select attnum from pg_attribute where attrelid='public.zimni_reports'::regclass and attname='updated_at')),'-')")" "-"

# ── 2) rev / تنازعہ / soft-delete — بطور افسر A ──
eq "ترمیم پر rev 1→2" "$(as $UA "update zimni_reports set content='{\"bodyHtml\":\"<p>ترمیم</p>\"}' where id='$ZA' returning rev;")" "2"
eq "client کا بھیجا rev نہیں چلتا (99 → 3)" "$(as $UA "update zimni_reports set rev=99 where id='$ZA' returning rev;")" "3"
eq "updated_at خود بدلتا ہے" "$(sql "select updated_at > now() - interval '1 minute' from zimni_reports where id='$ZA'")" "t"
eq "پرانے rev (2) پر ترمیم = 0 قطار (تنازعہ پکڑا گیا)" "$(as $UA "with u as (update zimni_reports set content='{}' where id='$ZA' and rev=2 returning 1) select count(*) from u;")" "0"
eq "تازہ rev (3) پر ترمیم = 1 قطار" "$(as $UA "with u as (update zimni_reports set last_device='موبائل' where id='$ZA' and rev=3 returning 1) select count(*) from u;")" "1"
eq "soft-delete: قطار موجود، نشان لگا" "$(as $UA "update zimni_reports set deleted_at=now() where id='$ZA' returning (deleted_at is not null);")" "t"
eq "soft-delete کے بعد بھی مواد محفوظ" "$(sql "select content is not null from zimni_reports where id='$ZA'")" "t"
eq "report_173 پر بھی rev" "$(as $UA "update report_173 set form_data='{\"x\":1}' where case_id='$CA' returning rev;")" "2"
eq "افسر B، A کی ضمنی نہیں بدل سکتا" "$(as $UB "with u as (update zimni_reports set content='{}' where id='$ZA' returning 1) select count(*) from u;")" "0"
eq "افسر B کو A کی ضمنیاں نظر نہیں" "$(as $UB "select count(*) from zimni_reports where case_id='$CA';")" "0"

# ── 3) dio_user_data ──
eq "A: مسودہ محفوظ (officer_id خود)" "$(as $UA "insert into dio_user_data (kind, doc_key, case_id, data) values ('zimni_draft', '$CA:new:1', '$CA', '{\"bodyHtml\":\"x\"}') returning officer_id;")" "$A"
eq "A: اپنا مسودہ پڑھ سکتا ہے" "$(as $UA "select count(*) from dio_user_data;")" "1"
eq "B: A کا مسودہ نظر نہیں" "$(as $UB "select count(*) from dio_user_data;")" "0"
eq "B: A کا مسودہ بدل نہیں سکتا" "$(as $UB "with u as (update dio_user_data set data='{}' returning 1) select count(*) from u;")" "0"
eq "B: A کا مسودہ حذف نہیں کر سکتا" "$(as $UB "with d as (delete from dio_user_data returning 1) select count(*) from d;")" "0"
has "B: A کے نام سے لکھ نہیں سکتا" "$(as $UB "insert into dio_user_data (officer_id, kind, doc_key) values ('$A', 'setting', 'x');")" "row-level security"
has "ایک ہی چابی دو بار = رد (دوہرا نہیں)" "$(as $UA "insert into dio_user_data (kind, doc_key) values ('zimni_draft', '$CA:new:1');")" "duplicate key"
eq "A: مسودہ ترمیم rev 1→2" "$(as $UA "update dio_user_data set data='{\"bodyHtml\":\"y\"}' returning rev;")" "2"
has "anon: کوئی رسائی نہیں" "$(anon "select count(*) from dio_user_data;")" "permission denied"
has "anon: backup جدول بند" "$(anon "select count(*) from dio_bak_109_zimni_reports;")" "permission denied"
has "authenticated: backup جدول بند" "$(as $UA "select count(*) from dio_bak_109_zimni_reports;")" "permission denied"
sql "update subs set active=false where officer_id='$A'" >/dev/null
has "میعاد ختم: نیا مسودہ نہیں" "$(as $UA "insert into dio_user_data (kind, doc_key) values ('setting', 'digital_io_sho');")" "row-level security"
eq "میعاد ختم: پھر بھی پڑھ سکتا ہے" "$(as $UA "select count(*) from dio_user_data;")" "1"
eq "میعاد ختم: ضمنی پڑھ سکتا ہے" "$(as $UA "select count(*) from zimni_reports where case_id='$CA';")" "2"
eq "میعاد ختم: ضمنی بدل نہیں سکتا" "$(as $UA "with u as (update zimni_reports set content='{}' where case_id='$CA' returning 1) select count(*) from u;")" "0"
sql "update subs set active=true where officer_id='$A'" >/dev/null

# ── 4) واپسی (ROLLBACK) ──
has "ROLLBACK رک جاتا ہے جب «حذف» نشان والی قطار ہو" "$($P -d $DB -f sql/109_ROLLBACK.sql 2>&1)" "ROLLBACK ruk gaya"
eq "رکنے پر کچھ نہیں بدلا (rev باقی)" "$(sql "select count(*) from information_schema.columns where table_name='zimni_reports' and column_name='rev'")" "1"
as $UA "update zimni_reports set deleted_at=null where id='$ZA';" >/dev/null
RB=$($P -d $DB -f sql/109_ROLLBACK.sql 2>&1); has "ROLLBACK مکمل" "$RB" "ROLLBACK — mukammal"
eq "ROLLBACK: rev/deleted_at/last_device ہٹے" "$(sql "select count(*) from information_schema.columns where table_schema='public' and table_name in ('cases','zimni_reports','zimni_androoni_reports','report_173') and column_name in ('rev','deleted_at','last_device')")" "0"
eq "ROLLBACK: report_173.updated_at (109 کا) ہٹا" "$(sql "select count(*) from information_schema.columns where table_name='report_173' and column_name='updated_at'")" "0"
eq "ROLLBACK: zimni.updated_at (پہلے والا) باقی" "$(sql "select count(*) from information_schema.columns where table_name='zimni_reports' and column_name='updated_at'")" "1"
eq "ROLLBACK: cases کا پرانا trigger باقی" "$(sql "select count(*) from pg_trigger where tgname='cases_old_touch'")" "1"
eq "ROLLBACK: مسودے محفوظ (dio_user_data_rb109)" "$(sql "select count(*) from dio_user_data_rb109")" "1"
eq "ROLLBACK: realtime خالی" "$(sql "select count(*) from pg_publication_tables where pubname='supabase_realtime'")" "0"
eq "ROLLBACK: قطاریں جوں کی توں" "$(sql "select (select count(*) from cases)||','||(select count(*) from zimni_reports)||','||(select count(*) from zimni_androoni_reports)||','||(select count(*) from report_173)")" "$BEFORE"
eq "ROLLBACK: ترمیم شدہ مواد محفوظ" "$(sql "select content->>'bodyHtml' from zimni_reports where id='$ZA'")" "<p>ترمیم</p>"
eq "ROLLBACK: backup باقی" "$(sql "select count(*) from dio_bak_109_zimni_reports")" "3"
R3=$($P -d $DB -f sql/109_sync_core.sql 2>&1); has "ROLLBACK کے بعد 109 دوبارہ چلتی ہے" "$R3" "109 — mukammal"
eq "backup پہلی بار والا ہی رہا (3 قطار)" "$(sql "select count(*) from dio_bak_109_zimni_reports")" "3"
eq "نیا index نئی جدول پر (پرانی rb109 پر نہیں)" "$(sql "select indrelid::regclass from pg_index where indexrelid='public.dio_user_data_upd_idx'::regclass")" "dio_user_data"
eq "rb109 کے مسودے پھر بھی محفوظ" "$(sql "select count(*) from dio_user_data_rb109")" "1"
CHK2=$($P -d $DB -At -f sql/109_CHECK.sql 2>&1)
has "دوبارہ: CHECK sab_4_tayyar" "$CHK2" '"sab_4_tayyar": true'
has "دوبارہ: CHECK user_data_koi_aur_policy_nahi" "$CHK2" '"user_data_koi_aur_policy_nahi": true'

echo; echo "$pass PASS / $fail FAIL"
[ $fail -eq 0 ]
