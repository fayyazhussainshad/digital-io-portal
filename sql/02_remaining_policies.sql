-- ============================================================================
-- Digital IO — STEP 2: baqi 17 tables ki policies ki ASAL shart
-- ----------------------------------------------------------------------------
-- YE SIRF PARHTI HAI. Kuch nahi badalti.
--
-- Kyun zaroori hai: agli cheez un 21 tables par RLS ENABLE karna hai jahan
-- abhi band hai. Jis lamhe RLS on hoti hai, us table ki SO'EE PARI policies
-- JAAG jati hain — aur phir sirf wohi kaam chalta hai jo policy ijazat de.
--
-- Is liye RLS on karne se PEHLE har policy ki shart parhna lazmi hai. Misal:
-- `ahkamat` (Orders/SOPs) agar sirf "apne" record dikhata hai, to RLS on karne
-- par har afsar ke liye ahkamat ki fehrist KHALI ho jayegi — halanke ahkamat
-- sab ke liye hone chahiyen. Aise table ki policy pehle theek karni paDegi.
--
-- 4 tables (cases, case_documents, evidence, reminders) ki shart pehle mil
-- chuki hai. Ye file baqi 17 ki deti hai.
--
-- CHALANE KA TAREEQA: Supabase → SQL Editor → paste → Run → Download CSV.
-- ============================================================================

select p.tablename   as table_name,
       p.policyname  as policy_name,
       p.permissive,
       p.cmd,
       p.roles::text as roles,
       p.qual        as using_expr,
       p.with_check  as check_expr
from pg_policies p
where p.schemaname = 'public'
  and p.tablename in (
    'ahkamat', 'case_accused', 'case_document_versions', 'case_witnesses',
    'cdr_imei_requests', 'court_dates', 'cro_cards', 'fir_copies', 'fir_matn',
    'hamrahi_mulazman', 'incident_reports', 'rfa_forms', 'sarkari_gari',
    'suspects', 'templates', 'zimni_androoni_reports', 'zimni_reports'
  )
order by p.tablename, p.policyname;
