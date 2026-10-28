#!/usr/bin/env bash
# 110_no_case_sharing — اصل PostgreSQL 16 پر جانچ (Supabase جیسا: anon/authenticated، auth.uid()، RLS)
# ڈھانچہ: پیداوار جیسی شیئر کی پالیسیاں (مقدمہ + ضمنی پڑھنا «اپنا یا مجھ سے شیئر»، 90 جیسی)۔
# چلانا:  PGHOST=<socket dir> PGPORT=5433 bash sql/tests/110_test.sh
set -u
cd "$(dirname "$0")/../.."
DB=t110
P="psql -U postgres -v ON_ERROR_STOP=1 -q"
pass=0; fail=0
ok()   { echo "PASS $1"; pass=$((pass+1)); }
bad()  { echo "FAIL $1 :: $2"; fail=$((fail+1)); }
eq()   { if [ "$2" == "$3" ]; then ok "$1"; else bad "$1" "got [$2] want [$3]"; fi; }
has()  { if echo "$2" | grep -q -- "$3"; then ok "$1"; else bad "$1" "[$2] lacks [$3]"; fi; }
sql()  { $P -d $DB -At -c "$1" 2>&1; }
as()   { printf "set role authenticated; set request.jwt.claim.sub = '%s';\n%s\n" "$1" "$2" | $P -d $DB -At 2>&1; }

A=aaaaaaaa-0000-4000-8000-00000000000a; B=bbbbbbbb-0000-4000-8000-00000000000b
UA=11111111-0000-4000-8000-00000000000a; UB=22222222-0000-4000-8000-00000000000b
CA=cccccccc-0000-4000-8000-0000000000a1; CB=cccccccc-0000-4000-8000-0000000000b1

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
create function public.dio_my_officer_id() returns uuid language sql stable security definer set search_path = public
  as \$\$ select id from public.officers where user_id = auth.uid() \$\$;
grant execute on function public.dio_my_officer_id() to authenticated;
create table public.cases (id uuid primary key, officer_id uuid, fir_number text);
create table public.case_shares (id uuid primary key default gen_random_uuid(), case_id uuid, shared_by uuid, shared_with uuid,
  permission text default 'read', revoked_at timestamptz, created_at timestamptz default now());
create table public.zimni_reports (id uuid primary key default gen_random_uuid(), case_id uuid, officer_id uuid, serial_no int, content jsonb);
create table public.gasht_logs (id uuid primary key default gen_random_uuid(), officer_id uuid);
alter table public.cases enable row level security;
alter table public.case_shares enable row level security;
alter table public.zimni_reports enable row level security;
alter table public.gasht_logs enable row level security;
grant select, insert, update, delete on public.cases, public.case_shares, public.zimni_reports, public.gasht_logs to authenticated;
-- پیداوار جیسی: اپنا مقدمہ، یا جو مجھ سے شیئر ہوا
create policy sel on public.cases for select to authenticated using (officer_id = public.dio_my_officer_id()
  or id in (select s.case_id from public.case_shares s where s.shared_with = public.dio_my_officer_id() and s.revoked_at is null));
create policy wr on public.cases for all to authenticated using (officer_id = public.dio_my_officer_id()) with check (officer_id = public.dio_my_officer_id());
create policy sel on public.zimni_reports for select to authenticated using (officer_id = public.dio_my_officer_id()
  or case_id in (select s.case_id from public.case_shares s where s.shared_with = public.dio_my_officer_id()));
create policy sh_sel on public.case_shares for select to authenticated using (shared_by = public.dio_my_officer_id() or shared_with = public.dio_my_officer_id());
create policy sh_ins on public.case_shares for insert to authenticated with check (shared_by = public.dio_my_officer_id()
  and case_id in (select c.id from public.cases c where c.officer_id = public.dio_my_officer_id()));
create policy sh_upd on public.case_shares for update to authenticated using (shared_by = public.dio_my_officer_id()) with check (shared_by = public.dio_my_officer_id());
create policy sh_del on public.case_shares for delete to authenticated using (shared_by = public.dio_my_officer_id());
insert into public.officers values ('$A', '$UA'), ('$B', '$UB');
insert into public.cases values ('$CA', '$A', '681/26'), ('$CB', '$B', '9/26');
insert into public.zimni_reports (case_id, officer_id, serial_no, content) values ('$CA', '$A', 1, '{"bodyHtml":"<p>اول</p>"}');
SQL

# ── 0) پہلے: شیئر کا راستہ واقعی کھلا تھا (جانچ کا ڈھانچہ درست) ──
eq "پہلے: A اپنا مقدمہ B سے شیئر کر سکتا تھا" "$(as $UA "insert into case_shares (case_id, shared_by, shared_with) values ('$CA', '$A', '$B') returning 1;")" "1"
eq "پہلے: B کو A کا مقدمہ نظر آتا تھا" "$(as $UB "select count(*) from cases where id='$CA';")" "1"
eq "پہلے: B کو A کی ضمنی نظر آتی تھی" "$(as $UB "select count(*) from zimni_reports where case_id='$CA';")" "1"

# ── 1) جدول میں قطار ہو تو 110 رک جاتی ہے، کچھ نہیں بدلتا ──
R0=$($P -d $DB -f sql/110_no_case_sharing.sql 2>&1)
has "قطار موجود: 110 رک گئی (گنتی کے ساتھ)" "$R0" "110 رک گئی"
eq "رکنے پر کچھ نہیں بدلا (لکھنے کا حق باقی)" "$(sql "select has_table_privilege('authenticated','public.case_shares','INSERT')")" "t"
eq "رکنے پر کوئی نئی پالیسی نہیں" "$(sql "select count(*) from pg_policies where tablename='case_shares' and policyname like 'dio110%'")" "0"
eq "رکنے پر قطار جوں کی توں" "$(sql "select count(*) from case_shares")" "1"
as $UA "delete from case_shares;" >/dev/null

# ── 2) چلانا (جدول خالی — جیسا آپ کے 108_CHECK میں: 0) ──
R1=$($P -d $DB -f sql/110_no_case_sharing.sql 2>&1); has "110 چلی" "$R1" "110 — mukammal"; eq "110: کوئی ERROR نہیں" "$(echo "$R1" | grep -c ERROR)" "0"
R2=$($P -d $DB -f sql/110_no_case_sharing.sql 2>&1); has "110 دوبارہ چلانا محفوظ" "$R2" "110 — mukammal"
has "A: اب شیئر کی نئی قطار نہیں بن سکتی" "$(as $UA "insert into case_shares (case_id, shared_by, shared_with) values ('$CA', '$A', '$B');")" "permission denied"
eq "B: A کا مقدمہ نظر نہیں" "$(as $UB "select count(*) from cases where id='$CA';")" "0"
eq "B: A کی ضمنی نظر نہیں" "$(as $UB "select count(*) from zimni_reports where case_id='$CA';")" "0"
eq "A: اپنا مقدمہ نظر آتا ہے" "$(as $UA "select count(*) from cases where id='$CA';")" "1"
eq "A: اپنی ضمنی نظر آتی ہے" "$(as $UA "select count(*) from zimni_reports where case_id='$CA';")" "1"
eq "A: اپنا مقدمہ بدل سکتا ہے" "$(as $UA "update cases set fir_number='681/26 ' where id='$CA' returning 1;")" "1"
sql "grant insert, update on public.case_shares to authenticated" >/dev/null
has "حق دوبارہ مل بھی جائے: RLS نئی قطار روکتی ہے" "$(as $UA "insert into case_shares (case_id, shared_by, shared_with) values ('$CA', '$A', '$B');")" "row-level security"
sql "revoke insert, update on public.case_shares from authenticated" >/dev/null
CHK=$($P -d $DB -At -f sql/110_CHECK.sql 2>&1)
for k in likhne_ka_haq_band_ok nayi_qatar_ki_rok_ok tabdeeli_ki_rok_ok jadwal_khali_ok rls_on_ok; do has "CHECK: $k" "$CHK" "\"$k\": true"; done
has "CHECK: case_shares = 0" "$CHK" '"case_shares_qataarein": 0'
has "CHECK: gasht_logs گنتی" "$CHK" '"gasht_logs_qataarein": 0'
has "CHECK: شیئر شرط والی پالیسیاں (معلومات)" "$CHK" 'cases.sel'
has "CHECK فائل صرف پڑھتی ہے (کوئی لکھنے والا statement نہیں)" "$(grep -viE '^\s*--' sql/110_CHECK.sql | grep -ciE '^\s*(insert|update|delete|drop|alter|create|grant|revoke|truncate|comment)\b' || true)" "^0$"

# ── 3) واپسی ──
RB=$($P -d $DB -f sql/110_ROLLBACK.sql 2>&1); eq "ROLLBACK چلا" "$RB" ""
eq "ROLLBACK: شیئر دوبارہ ممکن" "$(as $UA "insert into case_shares (case_id, shared_by, shared_with) values ('$CA', '$A', '$B') returning 1;")" "1"
eq "ROLLBACK: ڈیٹا جوں کا توں (ضمنی)" "$(sql "select content->>'bodyHtml' from zimni_reports where case_id='$CA'")" "<p>اول</p>"
as $UA "delete from case_shares;" >/dev/null
R3=$($P -d $DB -f sql/110_no_case_sharing.sql 2>&1); has "ROLLBACK کے بعد 110 دوبارہ" "$R3" "110 — mukammal"
has "دوبارہ: CHECK" "$($P -d $DB -At -f sql/110_CHECK.sql 2>&1)" '"nayi_qatar_ki_rok_ok": true'

echo; echo "$pass PASS / $fail FAIL"
[ $fail -eq 0 ]
