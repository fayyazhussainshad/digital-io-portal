-- 103_CHECK — SIRF PARHTI HAI (kuch nahi badalti). AIK statement.
--
-- Pas-e-manzar (v542, 14 Oct 2026): muqadme ki TARMEEM par chaar khane
-- (offence_type, sho, sdpo, notes) khali ho kar mit jate the — form mein wo
-- khane the hi nahi, magar mehfooz karne wala code unhein '' likh deta tha.
-- v542 ne aainda ke liye rok diya. Ye jaanch batati hai:
--   1) kitne muqadmat mein ye khane is waqt khali hain
--   2) SHO/SDPO ki purani qeemat jo audit_logs ("case.updated" ka before)
--      mein mehfooz hai — wapsi ke qabil. (offence_type aur notes audit mein
--      darj NAHI hote the — unki wapsi audit se mumkin nahi.)
with
c as (
  select id, fir_number, officer_id,
         nullif(trim(coalesce(offence_type, '')), '') as offence_type,
         nullif(trim(coalesce(sho, '')), '')          as sho,
         nullif(trim(coalesce(sdpo, '')), '')         as sdpo,
         nullif(trim(coalesce(notes, '')), '')        as notes
  from public.cases
),
-- har muqadme ke liye audit mein SHO/SDPO ki aakhri GHAIR-KHALI purani qeemat
aud as (
  select distinct on (al.entity_id, k.key)
         al.entity_id::text as case_id, k.key, k.value as qeemat, al.created_at
  from public.audit_logs al
  cross join lateral jsonb_each_text(coalesce(al.before_data, '{}'::jsonb)) as k(key, value)
  where al.action = 'case.updated'
    and k.key in ('sho', 'sdpo')
    and nullif(trim(coalesce(k.value, '')), '') is not null
  order by al.entity_id, k.key, al.created_at desc
),
wapsi as (
  select c.id, c.fir_number,
         (select a.qeemat from aud a where a.case_id = c.id::text and a.key = 'sho')  as sho_wapas,
         (select a.qeemat from aud a where a.case_id = c.id::text and a.key = 'sdpo') as sdpo_wapas,
         c.sho is null as sho_khali, c.sdpo is null as sdpo_khali
  from c
)
select jsonb_pretty(jsonb_build_object(
  '1_kul_muqadmat',          (select count(*) from c),
  '2_khali_khane', jsonb_build_object(
      'offence_type',        (select count(*) from c where offence_type is null),
      'sho',                 (select count(*) from c where sho is null),
      'sdpo',                (select count(*) from c where sdpo is null),
      'notes',               (select count(*) from c where notes is null)),
  '3_audit_mein_case_updated', (select count(*) from public.audit_logs where action = 'case.updated'),
  '4_wapsi_ke_qabil', jsonb_build_object(
      'sho',                 (select count(*) from wapsi where sho_khali  and sho_wapas  is not null),
      'sdpo',                (select count(*) from wapsi where sdpo_khali and sdpo_wapas is not null),
      'fehrist',             coalesce((select jsonb_agg(jsonb_build_object(
                                 'fir', fir_number,
                                 'sho',  case when sho_khali  then sho_wapas  end,
                                 'sdpo', case when sdpo_khali then sdpo_wapas end) order by fir_number)
                               from wapsi
                               where (sho_khali and sho_wapas is not null)
                                  or (sdpo_khali and sdpo_wapas is not null)), '[]'::jsonb))
)) as digital_io_103_check;
