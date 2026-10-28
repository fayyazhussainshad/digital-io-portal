#!/usr/bin/env bash
# 111_remove_gasht — اصل PostgreSQL 16 پر جانچ (Supabase جیسا: anon/authenticated، auth.uid()، RLS)
# گشت کا جدول اصل sql/104_gasht_log.sql سے بنتا ہے، پھر 111 / 111_CHECK / 111_ROLLBACK۔
# چلانا:  PGHOST=<socket dir> PGPORT=5433 bash sql/tests/111_test.sh
set -u
cd "$(dirname "$0")/../.."
DB=t111
P="psql -U postgres -v ON_ERROR_STOP=1 -q"
pass=0; fail=0
ok()   { echo "PASS $1"; pass=$((pass+1)); }
bad()  { echo "FAIL $1 :: $2"; fail=$((fail+1)); }
eq()   { if [ "$2" == "$3" ]; then ok "$1"; else bad "$1" "got [$2] want [$3]"; fi; }
has()  { if echo "$2" | grep -q -- "$3"; then ok "$1"; else bad "$1" "[$2] lacks [$3]"; fi; }
sql()  { $P -d $DB -At -c "$1" 2>&1; }
as()   { printf "set role authenticated; set request.jwt.claim.sub = '%s';\n%s\n" "$1" "$2" | $P -d $DB -At 2>&1; }

A=aaaaaaaa-0000-4000-8000-00000000000a
UA=11111111-0000-4000-8000-00000000000a

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
create table public.officers (id uuid primary key, user_id uuid, full_name text);
create function public.dio_my_officer_id() returns uuid language sql stable security definer set search_path = public
  as \$\$ select id from public.officers where user_id = auth.uid() \$\$;
create function public.dio_has_active_sub() returns boolean language sql stable as \$\$ select true \$\$;
grant execute on function public.dio_my_officer_id(), public.dio_has_active_sub() to authenticated;
create table public.recycle_bin (id uuid primary key default gen_random_uuid(), officer_id uuid, item_type text, item_id uuid, item_data jsonb,
  deleted_at timestamptz default now(), expires_at timestamptz default now() + interval '30 days');
alter table public.recycle_bin enable row level security;
create table public.case_shares (id uuid primary key default gen_random_uuid(), case_id uuid);
alter table public.case_shares enable row level security;
insert into public.officers values ('$A', '$UA', 'فیاض حسین شاد');
SQL
R104=$($P -d $DB -f sql/104_gasht_log.sql 2>&1)
has "تیاری: اصل 104 سے گشت کا جدول بنا" "$R104" "gasht_logs tayyar"
eq "تیاری: A اپنا گشت لکھ سکتا تھا" "$(as $UA "insert into gasht_logs (area) values ('چوک کمہاراں') returning 1;")" "1"

# ── 1) گشت میں قطار ہو تو 111 رک جاتی ہے، کچھ نہیں بدلتا ──
R0=$($P -d $DB -f sql/111_remove_gasht.sql 2>&1)
has "قطار موجود: 111 رک گئی (گنتی کے ساتھ)" "$R0" "111 رک گئی"
eq "رکنے پر جدول جوں کا توں" "$(sql "select count(*) from gasht_logs")" "1"
eq "رکنے پر کوئی بیک اپ نہیں بنا" "$(sql "select to_regclass('public.dio_bak_111_gasht_logs') is null")" "t"
sql "delete from gasht_logs" >/dev/null

# ── 2) «حذف شدہ مواد» میں گشت ہو تب بھی رکے (جیسا آپ کے live ڈیٹابیس میں: 1 اندراج) ──
G1=eeeeeeee-0000-4000-8000-0000000000e1
sql "insert into recycle_bin (officer_id, item_type, item_id, item_data) values ('$A', 'gasht', '$G1', '{\"area\":\"چوک کمہاراں\",\"gasht_date\":\"2026-10-20\",\"status\":\"mukammal\",\"data\":{\"entries\":[{\"t\":\"1\"},{\"t\":\"2\"}]}}')" >/dev/null
sql "insert into recycle_bin (officer_id, item_type, item_data) values ('$A', 'case', '{\"fir_number\":\"681/26\"}')" >/dev/null
R0b=$($P -d $DB -f sql/111_remove_gasht.sql 2>&1)
has "«حذف شدہ مواد» میں گشت: 111 رک گئی" "$R0b" "«حذف شدہ مواد» میں 1"
eq "رکنے پر جدول باقی" "$(sql "select to_regclass('public.gasht_logs') is not null")" "t"
# 111a — صرف دکھاتی ہے
V=$($P -d $DB -At -F '|' -f sql/111a_gasht_bin_dekhein.sql 2>&1)
has "111a: اندراج دکھایا (علاقہ)" "$V" "چوک کمہاراں"
has "111a: اندراجات کی گنتی 2" "$V" "|mukammal|2|"
has "111a فائل صرف پڑھتی ہے" "$(grep -viE '^\s*--' sql/111a_gasht_bin_dekhein.sql | grep -ciE '^\s*(insert|update|delete|drop|alter|create|grant|revoke|truncate|comment)\b' || true)" "^0$"
# 111b — دو اندراج ہوں تو رکے
sql "insert into recycle_bin (officer_id, item_type, item_data) values ('$A', 'gasht', '{}')" >/dev/null
RB2=$($P -d $DB -f sql/111b_gasht_bin_hatayein.sql 2>&1)
has "111b: 2 اندراج → رک گئی" "$RB2" "111b رک گئی"
eq "111b رکی: کچھ نہیں بدلا" "$(sql "select count(*) from recycle_bin where item_type='gasht'")|$(sql "select to_regclass('public.dio_bak_111_recycle_bin_gasht') is null")" "2|t"
sql "delete from recycle_bin where item_type='gasht' and item_id is null" >/dev/null
# 111b — 1 اندراج: بیک اپ پھر ہٹانا
RB1=$($P -d $DB -f sql/111b_gasht_bin_hatayein.sql 2>&1)
has "111b چلی" "$RB1" "111b — mukammal"
eq "111b: گشت «حذف شدہ مواد» سے ہٹ گیا" "$(sql "select count(*) from recycle_bin where item_type='gasht'")" "0"
eq "111b: بیک اپ میں وہی اندراج (پورا)" "$(sql "select item_id||'|'||(item_data->>'area') from dio_bak_111_recycle_bin_gasht")" "$G1|چوک کمہاراں"
eq "111b: باقی «حذف شدہ مواد» (مقدمہ) جوں کا توں" "$(sql "select count(*) from recycle_bin where item_type='case'")" "1"
eq "111b: بیک اپ پر RLS" "$(sql "select relrowsecurity from pg_class where oid='public.dio_bak_111_recycle_bin_gasht'::regclass")" "t"
has "111b: بیک اپ افسر نہیں پڑھ سکتا" "$(as $UA "select count(*) from dio_bak_111_recycle_bin_gasht;")" "permission denied"
RB1b=$($P -d $DB -f sql/111b_gasht_bin_hatayein.sql 2>&1)
has "111b دوبارہ چلانا محفوظ" "$RB1b" "گشت کا کوئی اندراج نہیں"
RBR=$($P -d $DB -f sql/111b_ROLLBACK.sql 2>&1)
has "111b_ROLLBACK چلا" "$RBR" "111b_ROLLBACK"
eq "111b_ROLLBACK: اندراج واپس" "$(sql "select count(*) from recycle_bin where item_type='gasht' and item_id='$G1'")" "1"
RB3=$($P -d $DB -f sql/111b_gasht_bin_hatayein.sql 2>&1)
has "واپسی کے بعد 111b دوبارہ" "$RB3" "111b — mukammal"
eq "دوبارہ: بیک اپ میں دوہرا نہیں" "$(sql "select count(*) from dio_bak_111_recycle_bin_gasht")" "1"

# ── 3) چلانا (جیسا آپ کے 108_CHECK میں: 0 قطاریں) ──
PRE=$($P -d $DB -At -f sql/111_CHECK.sql 2>&1)
has "پہلے CHECK: جدول موجود" "$PRE" '"gasht_jadwal_mojood": true'
has "پہلے CHECK: قطاریں 0" "$PRE" '"gasht_qataarein": 0'
R1=$($P -d $DB -f sql/111_remove_gasht.sql 2>&1)
has "111 چلی" "$R1" "111 — mukammal"
eq "111: کوئی ERROR نہیں" "$(echo "$R1" | grep -c ERROR)" "0"
eq "گشت کا جدول ہٹ گیا" "$(sql "select to_regclass('public.gasht_logs') is null")" "t"
eq "touch function ہٹ گیا" "$(sql "select to_regprocedure('public.dio_gasht_touch()') is null")" "t"
eq "بیک اپ موجود" "$(sql "select to_regclass('public.dio_bak_111_gasht_logs') is not null")" "t"
eq "بیک اپ پر RLS" "$(sql "select relrowsecurity from pg_class where oid='public.dio_bak_111_gasht_logs'::regclass")" "t"
has "بیک اپ: افسر نہیں پڑھ سکتا" "$(as $UA "select count(*) from dio_bak_111_gasht_logs;")" "permission denied"
eq "باقی ڈیٹا جوں کا توں (افسر)" "$(sql "select full_name from officers where id='$A'")" "فیاض حسین شاد"
CHK=$($P -d $DB -At -f sql/111_CHECK.sql 2>&1)
for k in gasht_hata_ok backup_mojood_ok backup_rls_ok backup_band_ok touch_function_hata_ok; do has "CHECK: $k" "$CHK" "\"$k\": true"; done
has "CHECK: گشت کا جدول نہیں" "$CHK" '"gasht_jadwal_mojood": false'
has "CHECK فائل صرف پڑھتی ہے (کوئی لکھنے والا statement نہیں)" "$(grep -viE '^\s*--' sql/111_CHECK.sql | grep -ciE '^\s*(insert|update|delete|drop|alter|create|grant|revoke|truncate|comment)\b' || true)" "^0$"
C110=$($P -d $DB -At -f sql/110_CHECK.sql 2>&1)
has "110_CHECK گشت کے بغیر بھی چلتی ہے" "$C110" '"gasht_logs_qataarein": null'
R2=$($P -d $DB -f sql/111_remove_gasht.sql 2>&1)
has "111 دوبارہ چلانا محفوظ" "$R2" "111 — mukammal"
eq "دوبارہ: کوئی ERROR نہیں" "$(echo "$R2" | grep -c ERROR)" "0"

# ── 4) واپسی ──
RB0=$($P -d $DB -f sql/111_ROLLBACK.sql 2>&1)
has "ROLLBACK بغیر 104: صاف پیغام، کچھ نہیں بدلا" "$RB0" "پہلے sql/104_gasht_log.sql"
$P -d $DB -f sql/104_gasht_log.sql >/dev/null 2>&1
RB=$($P -d $DB -f sql/111_ROLLBACK.sql 2>&1)
has "ROLLBACK چلا" "$RB" "111_ROLLBACK"
eq "ROLLBACK: افسر دوبارہ گشت لکھ سکتا ہے" "$(as $UA "insert into gasht_logs (area) values ('واپسی') returning 1;")" "1"
sql "delete from gasht_logs" >/dev/null
R3=$($P -d $DB -f sql/111_remove_gasht.sql 2>&1); has "ROLLBACK کے بعد 111 دوبارہ" "$R3" "111 — mukammal"

echo; echo "$pass PASS / $fail FAIL"
[ $fail -eq 0 ]
