-- 96_CHECK — SIRF PARHTI HAI (kuch nahi badalti). AIK statement.
--
-- Maqsad: do baatein jo repo ki failon se jaanchi nahi ja saktin, kyunke
-- unki policy/trigger pehle se DB mein hai (sql/README.md):
--
--   1) client_errors — koi afsar DOOSRE afsar ke naam par ghalti darj na
--      kar sake (INSERT ki shart afsar ki apni pehchan se bandhi ho), anon
--      sirf likh sake, parh na sake.
--   2) officers — dio_protect_officers() trigger INSERT + UPDATE + DELETE
--      teeno par lage, server ki pehchan `service_role` se ho (na ke
--      "uid null ho to chhoot" se — wo anon ko bhi raasta de deta hai),
--      manzoori NULL par ikhtiyar na mile (fail-closed), aur har user ka
--      aik hi record ho. (Tabsare jaanch se pehle hata diye jate hain.)
--
-- Natija: har hisse ka `nateeja` = 'THEEK' ya 'DEKHEN: <wajah>'.
-- 'DEKHEN' aaye to poora natija bhej dein — kuch badalne se pehle dekha jayega.
with
ce as (
  select c.oid, c.relrowsecurity
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'client_errors' and c.relkind = 'r'
),
ce_pol as (
  select p.policyname, p.cmd, p.permissive, p.roles, p.qual, p.with_check,
         -- INSERT ke liye asal shart with_check hai; ALL me with_check na ho to qual
         coalesce(p.with_check, case when p.cmd = 'ALL' then p.qual end) as likhne_ki_shart
  from pg_policies p
  where p.schemaname = 'public' and p.tablename = 'client_errors'
),
ce_write as (
  select * from ce_pol where cmd in ('INSERT', 'ALL') and permissive = 'PERMISSIVE'
),
ce_anon as (
  select coalesce(jsonb_agg(privilege_type order by privilege_type), '[]'::jsonb) as haq
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'client_errors' and grantee = 'anon'
),
off as (
  select c.oid
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'officers' and c.relkind = 'r'
),
trg as (
  select t.tgname, p.proname, t.tgenabled,
         (t.tgtype & 4)  <> 0 as on_insert,
         (t.tgtype & 8)  <> 0 as on_delete,
         (t.tgtype & 16) <> 0 as on_update,
         (t.tgtype & 2)  <> 0 as before
  from pg_trigger t
  join pg_proc p on p.oid = t.tgfoid
  where t.tgrelid = (select oid from off) and not t.tgisinternal
),
prot as (
  select bool_or(on_insert) as ins, bool_or(on_update) as upd, bool_or(on_delete) as del,
         bool_and(before) as before, bool_and(tgenabled <> 'D') as fa_al
  from trg where proname = 'dio_protect_officers'
),
fn as (
  -- tabsare (-- ... aur /* ... */) hata kar sirf ASAL code jaancha jaye
  select regexp_replace(regexp_replace(p.prosrc, '/\*.*?\*/', '', 'g'), '--[^\n]*', '', 'g') as prosrc
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'dio_protect_officers'
  limit 1
),
uniq as (
  select exists (
    select 1 from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = i.indkey[0]
    where i.indrelid = (select oid from off) and i.indisunique
      and i.indnatts = 1 and a.attname = 'user_id'
  ) as hai
),
ce_v as (
  select
    (select count(*) from ce) = 1                                         as mojood,
    coalesce((select relrowsecurity from ce), false)                      as rls_on,
    (select count(*) from ce_write)                                       as likhne_wali,
    (select count(*) from ce_write
      where likhne_ki_shart is null
         or likhne_ki_shart ~* '^\(*\s*true\s*\)*$')                      as khuli,
    (select count(*) from ce_write
      where likhne_ki_shart is not null
        and likhne_ki_shart !~* '^\(*\s*true\s*\)*$'
        and likhne_ki_shart !~ 'auth\.uid\(\)'
        and likhne_ki_shart !~ 'dio_my_officer_id\(\)')                   as be_pehchan,
    (select haq from ce_anon)                                             as anon_haq
),
of_v as (
  select
    (select count(*) from off) = 1                                        as mojood,
    (select prosrc from fn) is not null                                   as fn_mojood,
    coalesce((select prosrc from fn) ~ 'service_role', false)             as service_role,
    -- sirf CHHOOT pakRo: "uid null ho to RETURN" — "to RAISE" (rokna) theek hai
    coalesce((select prosrc from fn) ~* 'auth\.uid\(\)\s+is\s+null[^;]*then\s+return', false) as uid_null,
    -- manzoori NULL ho to ikhtiyar mil jana (fail-open)
    coalesce((select prosrc from fn) ~* 'coalesce\(\s*[a-z_.]*is_approved\s*,\s*true\s*\)', false) as manzoori_khuli,
    coalesce((select ins from prot), false)                               as ins,
    coalesce((select upd from prot), false)                               as upd,
    coalesce((select del from prot), false)                               as del,
    coalesce((select before from prot), false)                            as before,
    coalesce((select fa_al from prot), false)                             as fa_al,
    (select hai from uniq)                                                as uniq
)
select jsonb_pretty(jsonb_build_object(
  '1_client_errors', jsonb_build_object(
    'table_mojood',            ce_v.mojood,
    'rls_on',                  ce_v.rls_on,
    'likhne_wali_policies',    ce_v.likhne_wali,
    'khuli_policies_true',     ce_v.khuli,
    'pehchan_ke_baghair',      ce_v.be_pehchan,
    'anon_ke_haq',             ce_v.anon_haq,
    'policies',                coalesce((select jsonb_agg(jsonb_build_object(
                                  'naam', policyname, 'hukm', cmd, 'qism', permissive,
                                  'roles', roles, 'using', qual, 'with_check', with_check)
                                  order by policyname) from ce_pol), '[]'::jsonb),
    'nateeja', case
      when not ce_v.mojood                then 'DEKHEN: client_errors table nahi mili'
      when not ce_v.rls_on                then 'DEKHEN: RLS band hai — koi bhi kisi ke naam par likh sakta hai'
      when ce_v.likhne_wali = 0           then 'DEKHEN: likhne ki koi policy nahi (ghaltiyan darj nahi hongi)'
      when ce_v.khuli > 0                 then 'DEKHEN: likhne ki shart hamesha sach (true) — kisi bhi officer_id par likha ja sakta hai'
      when ce_v.be_pehchan > 0            then 'DEKHEN: likhne ki shart afsar ki pehchan se bandhi nahi'
      when ce_v.anon_haq ?| array['SELECT','UPDATE','DELETE','TRUNCATE']
                                          then 'DEKHEN: anon ke paas likhne ke ilawa bhi haq hai'
      else 'THEEK' end),
  '2_officers_trigger', jsonb_build_object(
    'table_mojood',            of_v.mojood,
    'function_mojood',         of_v.fn_mojood,
    'service_role_se_pehchan', of_v.service_role,
    'uid_null_wali_chhoot',    of_v.uid_null,
    'manzoori_null_par_khula', of_v.manzoori_khuli,
    'insert_par',              of_v.ins,
    'update_par',              of_v.upd,
    'delete_par',              of_v.del,
    'before_trigger',          of_v.before,
    'trigger_chalu',           of_v.fa_al,
    'har_user_aik_record',     of_v.uniq,
    'triggers',                coalesce((select jsonb_agg(jsonb_build_object(
                                  'naam', tgname, 'function', proname,
                                  'insert', on_insert, 'update', on_update, 'delete', on_delete,
                                  'before', before, 'chalu', tgenabled <> 'D')
                                  order by tgname) from trg), '[]'::jsonb),
    'nateeja', case
      when not of_v.mojood                then 'DEKHEN: officers table nahi mili'
      when not of_v.fn_mojood             then 'DEKHEN: dio_protect_officers() function nahi mila'
      when not (of_v.ins and of_v.upd and of_v.del)
                                          then 'DEKHEN: trigger teeno (INSERT/UPDATE/DELETE) par nahi'
      when not of_v.before                then 'DEKHEN: trigger BEFORE nahi — rok kaam nahi karegi'
      when not of_v.fa_al                 then 'DEKHEN: trigger band (disabled) hai'
      when not of_v.service_role          then 'DEKHEN: server ki pehchan service_role se nahi'
      when of_v.uid_null                  then 'DEKHEN: auth.uid() is null wali chhoot — anon ko bhi raasta'
      when of_v.manzoori_khuli            then 'DEKHEN: coalesce(is_approved, true) — NULL manzoori wala admin ikhtiyar pa leta hai'
      when not of_v.uniq                  then 'DEKHEN: user_id par unique index nahi — aik user ke do record ban sakte hain'
      else 'THEEK' end)
)) as digital_io_96_check
from ce_v, of_v;
