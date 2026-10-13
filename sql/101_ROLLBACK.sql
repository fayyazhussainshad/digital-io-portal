-- 101_ROLLBACK — naye khane hata deti hai. AIK statement.
-- ⚠ In khanon me mehfooz IZAFI tasaveer, شناختی کارڈ ka pichhla rukh aur
--   سابقہ ریکارڈ HAMESHA ke liye mit jayenge. Pehli tasveer (photo_url) aur
--   ملزم ka cnic_copy_url purane khane hain — wo rehte hain.
--   Sirf us soorat me chalayen jab 101 ke baad koi ASAL kaam ruk jaye.
--   (101_CHECK pehle chala kar dekh lein: agar case_witnesses.photo_url 101 se
--    PEHLE mojood tha to us ki line is file se hata kar chalayen.)
do $undo101$
begin
  alter table public.case_accused   drop column if exists photos;
  alter table public.case_accused   drop column if exists cnic_back_url;
  alter table public.case_accused   drop column if exists prev_records;
  alter table public.case_witnesses drop column if exists photo_url;
  alter table public.case_witnesses drop column if exists photos;
  alter table public.case_witnesses drop column if exists cnic_copy_url;
  alter table public.case_witnesses drop column if exists cnic_back_url;
  alter table public.case_witnesses drop column if exists prev_records;
  notify pgrst, 'reload schema';
  raise warning 'WAPSI — 101 ke naye khane hata diye gaye';
end;
$undo101$;
