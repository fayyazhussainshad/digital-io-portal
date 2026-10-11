-- ============================================================================
-- Digital IO — 90_fix_zimni_policies.sql
-- ----------------------------------------------------------------------------
-- MASLA: `zimni_reports` aur `zimni_androoni_reports` par aisi policies lagi
-- hain jo kisi afsar ko doosre se alag nahi karti:
--
--   zimni_reports          → zimni_read / zimni_write / zimni_update /
--                            zimni_delete, shart sirf:
--                                auth.role() = 'authenticated'
--   zimni_androoni_reports → zimni_androoni_all, shart:  true / true
--
-- Yaani "jo bhi logged-in hai, sab kuch". Aur chunke PERMISSIVE policies OR se
-- jurti hain, ye khuli policies us achhi policy ko bhi be-asar kar deti hain
-- jo saath lagi hai.
--
-- ASAL POSTGRES PAR NAAPA GAYA (do afsar, do mocaddme):
--     afsar A ko apni aur B ki — SAB zimniyat nazar aayin
--     afsar A ne B ki zimni MITA bhi di                     ← sab se sanjeeda
--
-- Ye poore nizam ka sab se hassas mawad hai (tafteesh ki rozana karwai), aur
-- in do tables par RLS enable karne se bhi tahaffuz MILTA HI NAHI — jab tak
-- ye policies durust na hon.
--
-- ── YE FILE KYA LAGATI HAI ─────────────────────────────────────────────────
--   PARHNA  : apna record, apna mocaddma, ya jo mocaddma aap ke sath share
--             kiya gaya ho (`case_shares`)
--   LIKHNA  : SIRF apne (ya write-share wale) MOCADDME me — aur officer_id
--             apna hi ho sakta hai
--   MITANA  : sirf apne mocaddme ke andar (share par mitane ka haq nahi)
--
-- ── DO BAATEIN JO JAANCH SE MALOOM HUIN (aur isi liye shart aisi hai) ──────
--
--   1) `officer_id` ko OR me rakhna GHALAT hai. Pehli koshish me shart aisi
--      thi: "officer_id mera ho YA case mera ho". Us se afsar A, apna hi
--      officer_id likh kar, B ke MOCADDME me zimni DAAL sakta tha — yaani
--      doosre ki misal me andraaj plant karna. Ab likhne ke liye MOCADDMA
--      apna hona lazmi hai (AND), aur officer_id apna hi ho sakta hai.
--
--   2) `Officers manage own zimni` ko chhoRna bhi GHALAT tha. Wo PERMISSIVE
--      ALL policy hai; ALL ke liye `with check` apne `using` par chala jata
--      hai (officer_id mera) — aur permissive policies OR se jurti hain, is
--      liye wo akeli hi upar wala sorakh dobara khol deti thi. Is liye ab wo
--      bhi hatai ja rahi hai aur uski jagah neeche ki saaf policies hain.
--
-- ── KYUN `case_id` KE SATH `officer_id` BHI (parhne me) ───────────────────
--   `zimni.js` `officer_id` conditionally bharta hai
--   (`if (oid) rec.officer_id = oid`), aur kuch purani rows me `case_id` bhi
--   khali ho sakta hai. Parhne ki shart me dono raaste rakhe gaye hain taake
--   koi purana andraaj GHAYAB na ho jaye.
--
-- AHEM: ye file RLS ENABLE NAHI karti. Is liye isay chalane se app ke kaam me
-- koi tabdeeli NAHI aani chahiye — ye sirf policies durust karti hai taake
-- agla qadam (RLS on) waqai tahaffuz de. Pehle ye, phir `91`.
--
-- WAPSI: `90_fix_zimni_policies_ROLLBACK.sql`
-- ============================================================================

-- ── 1) zimni_reports ───────────────────────────────────────────────────────
drop policy if exists zimni_read                   on public.zimni_reports;
drop policy if exists zimni_write                  on public.zimni_reports;
drop policy if exists zimni_update                 on public.zimni_reports;
drop policy if exists zimni_delete                 on public.zimni_reports;
drop policy if exists "Officers manage own zimni"  on public.zimni_reports;

drop policy if exists dio_zimni_sel on public.zimni_reports;
drop policy if exists dio_zimni_ins on public.zimni_reports;
drop policy if exists dio_zimni_upd on public.zimni_reports;
drop policy if exists dio_zimni_del on public.zimni_reports;

create policy dio_zimni_sel on public.zimni_reports
  for select to authenticated
  using (
    officer_id = public.dio_my_officer_id()
    or case_id in (select c.id from public.cases c
                   where c.officer_id = public.dio_my_officer_id())
    or case_id in (select s.case_id from public.case_shares s
                   where s.shared_with = public.dio_my_officer_id())
  );

create policy dio_zimni_ins on public.zimni_reports
  for insert to authenticated
  with check (
    (officer_id is null or officer_id = public.dio_my_officer_id())
    and (
      case_id in (select c.id from public.cases c
                  where c.officer_id = public.dio_my_officer_id())
      or case_id in (select s.case_id from public.case_shares s
                     where s.shared_with = public.dio_my_officer_id()
                       and s.permission::text = 'write')
    )
  );

create policy dio_zimni_upd on public.zimni_reports
  for update to authenticated
  using (
    case_id in (select c.id from public.cases c
                where c.officer_id = public.dio_my_officer_id())
    or case_id in (select s.case_id from public.case_shares s
                   where s.shared_with = public.dio_my_officer_id()
                     and s.permission::text = 'write')
    or (case_id is null and officer_id = public.dio_my_officer_id())
  )
  with check (
    (officer_id is null or officer_id = public.dio_my_officer_id())
    and (
      case_id in (select c.id from public.cases c
                  where c.officer_id = public.dio_my_officer_id())
      or case_id in (select s.case_id from public.case_shares s
                     where s.shared_with = public.dio_my_officer_id()
                       and s.permission::text = 'write')
      or (case_id is null and officer_id = public.dio_my_officer_id())
    )
  );

create policy dio_zimni_del on public.zimni_reports
  for delete to authenticated
  using (
    case_id in (select c.id from public.cases c
                where c.officer_id = public.dio_my_officer_id())
    or (case_id is null and officer_id = public.dio_my_officer_id())
  );


-- ── 2) zimni_androoni_reports ──────────────────────────────────────────────
drop policy if exists zimni_androoni_all on public.zimni_androoni_reports;

drop policy if exists dio_za_sel on public.zimni_androoni_reports;
drop policy if exists dio_za_ins on public.zimni_androoni_reports;
drop policy if exists dio_za_upd on public.zimni_androoni_reports;
drop policy if exists dio_za_del on public.zimni_androoni_reports;

create policy dio_za_sel on public.zimni_androoni_reports
  for select to authenticated
  using (
    officer_id = public.dio_my_officer_id()
    or case_id in (select c.id from public.cases c
                   where c.officer_id = public.dio_my_officer_id())
    or case_id in (select s.case_id from public.case_shares s
                   where s.shared_with = public.dio_my_officer_id())
  );

create policy dio_za_ins on public.zimni_androoni_reports
  for insert to authenticated
  with check (
    (officer_id is null or officer_id = public.dio_my_officer_id())
    and (
      case_id in (select c.id from public.cases c
                  where c.officer_id = public.dio_my_officer_id())
      or case_id in (select s.case_id from public.case_shares s
                     where s.shared_with = public.dio_my_officer_id()
                       and s.permission::text = 'write')
    )
  );

create policy dio_za_upd on public.zimni_androoni_reports
  for update to authenticated
  using (
    case_id in (select c.id from public.cases c
                where c.officer_id = public.dio_my_officer_id())
    or case_id in (select s.case_id from public.case_shares s
                   where s.shared_with = public.dio_my_officer_id()
                     and s.permission::text = 'write')
    or (case_id is null and officer_id = public.dio_my_officer_id())
  )
  with check (
    (officer_id is null or officer_id = public.dio_my_officer_id())
    and (
      case_id in (select c.id from public.cases c
                  where c.officer_id = public.dio_my_officer_id())
      or case_id in (select s.case_id from public.case_shares s
                     where s.shared_with = public.dio_my_officer_id()
                       and s.permission::text = 'write')
      or (case_id is null and officer_id = public.dio_my_officer_id())
    )
  );

create policy dio_za_del on public.zimni_androoni_reports
  for delete to authenticated
  using (
    case_id in (select c.id from public.cases c
                where c.officer_id = public.dio_my_officer_id())
    or (case_id is null and officer_id = public.dio_my_officer_id())
  );


-- ── 3) case_document_versions — INSERT ki policy hi nahi thi ───────────────
--  Sirf `cdv_select_own` (parhna) mojood hai. RLS on karne par dastavez ka
--  naya version MEHFOOZ HONA RUK JAYEGA (`trg_snapshot_case_document` trigger
--  usi table me likhta hai). Is liye pehle se hi likhne ki ijazat de dete hain
--  — apne (ya write-share wale) mocaddme ki hadd me.
drop policy if exists dio_cdv_ins on public.case_document_versions;
create policy dio_cdv_ins on public.case_document_versions
  for insert to authenticated
  with check (
    case_id in (select c.id from public.cases c
                where c.officer_id = public.dio_my_officer_id())
    or case_id in (select s.case_id from public.case_shares s
                   where s.shared_with = public.dio_my_officer_id()
                     and s.permission::text = 'write')
  );


-- ── 4) Tasdeeq: koi khuli (allow-all) policy baqi na rahe ──────────────────
--  Tawaqqo: KHALI natija. Kuch aaye to us table par RLS on NA karein.
select tablename as table_name,
       policyname as policy_name,
       cmd,
       coalesce(qual, '(koi shart nahi)')       as using_expr,
       coalesce(with_check, '(koi shart nahi)') as check_expr
from pg_policies
where schemaname = 'public'
  and permissive = 'PERMISSIVE'
  and (
        coalesce(qual, '')       in ('true', '(auth.role() = ''authenticated''::text)')
     or coalesce(with_check, '') in ('true', '(auth.role() = ''authenticated''::text)')
  )
  and tablename in ('zimni_reports', 'zimni_androoni_reports',
                    'case_document_versions', 'cases', 'case_documents',
                    'evidence', 'reminders', 'case_accused', 'case_witnesses',
                    'court_dates', 'cro_cards', 'fir_copies', 'fir_matn',
                    'hamrahi_mulazman', 'incident_reports', 'rfa_forms',
                    'sarkari_gari', 'suspects', 'templates', 'cdr_imei_requests')
order by tablename, policyname;

-- ── 5) Ab in teen tables par kaun kaun si policies hain ────────────────────
select tablename as table_name, policyname as policy_name, permissive, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('zimni_reports', 'zimni_androoni_reports', 'case_document_versions')
order by tablename, policyname;
