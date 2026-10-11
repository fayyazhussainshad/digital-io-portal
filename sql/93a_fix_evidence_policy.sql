-- 93a — `evidence` par UPDATE ki policy hi nahi thi (sirf select/insert/delete).
-- RLS on karne par "نام بدلیں" (cases.js:799 ka update) ruk jata. AIK statement.
create policy dio_evidence_upd on public.evidence
  for update to authenticated
  using (officer_id in (select officers.id from public.officers
                        where officers.user_id = auth.uid()))
  with check (officer_id in (select officers.id from public.officers
                             where officers.user_id = auth.uid()));
