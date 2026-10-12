-- 99 — audit_log ko waqai NA-QABIL-E-TABDEEL banao. AIK statement.
--
-- MASLA (98_CHECK + 13 Oct 2026 ka natija):
--   "Nobody can delete audit log"  DELETE  PERMISSIVE  using (false)
--   "Nobody can update audit log"  UPDATE  PERMISSIVE  using (false)
--   "Officers own logs"            ALL     PERMISSIVE  apni rows
-- PERMISSIVE policies aapas me "YA" (OR) hoti hain — `false YA apni row` =
-- apni row. Yaani "Nobody can…" kuch nahi rokti thin, aur afsar apna AUDIT
-- RECORD mita/badal sakta tha.
--
-- TABDEELI: sirf yehi do policies — wahi naam, wahi shart (false) — magar
-- RESTRICTIVE. Restrictive policy "AUR" (AND) hoti hai, is liye ab koi
-- `authenticated` user audit_log ki row na mita sakta hai na badal sakta hai.
-- Parhna aur likhna (INSERT — DB triggers ka kaam) BILKUL waisa hi.
-- Server (service_role / table ka maalik) par RLS lagu nahi — wo pehle jaisa.
--
-- EHTIYAT (kuch na badle aur ruk jaye):
--   1) dono policies mojood na hon (DB ki halat tawaqqo se mukhtalif)
--   2) koi aisa function ho jo audit_log ko UPDATE/DELETE karta ho aur afsar
--      ke ikhtiyar se chalta ho (security definer nahi) — wo toot jata.
--
-- Wapsi: 99_ROLLBACK.sql
do $fix99$
declare
  v_cnt int;
  v_bad text;
begin
  select count(*) into v_cnt
  from pg_policies
  where schemaname = 'public' and tablename = 'audit_log'
    and policyname in ('Nobody can delete audit log', 'Nobody can update audit log');
  if v_cnt <> 2 then
    raise exception 'RUKA: dono "Nobody can…" policies nahi milin (mili: %) — kuch nahi badla', v_cnt;
  end if;

  select string_agg(p.proname, ', ' order by p.proname) into v_bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and not p.prosecdef
    and p.prosrc ~* '(delete\s+from|update)\s+(public\.)?audit_log\M';
  if v_bad is not null then
    raise exception 'RUKA: ye functions audit_log ko badalte/mitate hain aur afsar ke ikhtiyar se chalte hain: % — pehle inhein dekhna hoga, kuch nahi badla', v_bad;
  end if;

  drop policy "Nobody can delete audit log" on public.audit_log;
  create policy "Nobody can delete audit log" on public.audit_log
    as restrictive for delete to authenticated using (false);

  drop policy "Nobody can update audit log" on public.audit_log;
  create policy "Nobody can update audit log" on public.audit_log
    as restrictive for update to authenticated using (false);

  raise notice 'mukammal — audit_log ab na mitaya ja sakta hai na badla (RESTRICTIVE)';
end;
$fix99$;
