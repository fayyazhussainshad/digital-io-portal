-- ============================================================================
-- Digital IO — 90_fix_zimni_policies_ROLLBACK.sql
-- ----------------------------------------------------------------------------
-- `90_fix_zimni_policies.sql` ko wapas le leti hai: nayi policies hata kar
-- bilkul wohi purani policies dobara bana deti hai jo aap ke DB par theen.
--
-- ⚠ KHABARDAR — purani haalat me in do tables par koi tahaffuz NAHI hai:
--   har logged-in afsar har doosre afsar ki zimniyat parh, badal aur mita
--   sakta hai (asal Postgres par naapa gaya).
--
--   Chunke in tables par RLS abhi BAND hai, is waqt amli farq sirf us waqt
--   padega jab `91` (RLS enable) chal chuka ho. Phir bhi, wapsi ka matlab hai
--   tahaffuz khatam — sirf us soorat me chalayen jab 90 ke baad zimni ka koi
--   ASAL kaam ruk gaya ho, aur phir mujhe foran batayen.
-- ============================================================================

-- ── 1) Nayi policies hatao ─────────────────────────────────────────────────
drop policy if exists dio_zimni_sel on public.zimni_reports;
drop policy if exists dio_zimni_ins on public.zimni_reports;
drop policy if exists dio_zimni_upd on public.zimni_reports;
drop policy if exists dio_zimni_del on public.zimni_reports;

drop policy if exists dio_za_sel on public.zimni_androoni_reports;
drop policy if exists dio_za_ins on public.zimni_androoni_reports;
drop policy if exists dio_za_upd on public.zimni_androoni_reports;
drop policy if exists dio_za_del on public.zimni_androoni_reports;

drop policy if exists dio_cdv_ins on public.case_document_versions;


-- ── 2) Purani policies bilkul waisi hi wapas ───────────────────────────────
create policy "Officers manage own zimni" on public.zimni_reports
  for all to public
  using (officer_id in ( select officers.id
                           from public.officers
                          where officers.user_id = auth.uid() ));

create policy zimni_read on public.zimni_reports
  for select to public
  using (auth.role() = 'authenticated'::text);

create policy zimni_write on public.zimni_reports
  for insert to public
  with check (auth.role() = 'authenticated'::text);

create policy zimni_update on public.zimni_reports
  for update to public
  using (auth.role() = 'authenticated'::text);

create policy zimni_delete on public.zimni_reports
  for delete to public
  using (auth.role() = 'authenticated'::text);

create policy zimni_androoni_all on public.zimni_androoni_reports
  for all to public
  using (true)
  with check (true);

do $warn$
begin
  raise warning 'WAPSI MUKAMMAL — zimni ki purani khuli policies dobara lag gayi hain. In par tahaffuz NAHI hai.';
end;
$warn$;


-- ── 3) Tasdeeq ─────────────────────────────────────────────────────────────
select tablename as table_name, policyname as policy_name, permissive, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('zimni_reports', 'zimni_androoni_reports', 'case_document_versions')
order by tablename, policyname;
