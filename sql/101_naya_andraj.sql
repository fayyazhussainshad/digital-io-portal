-- 101 — «نیا اندراج» (اکتوبر 2026): ملزم / گواہ کی ایک سے زیادہ تصاویر،
--        شناختی کارڈ کے دونوں رخ، اور سابقہ ریکارڈ۔ AIK statement.
--
-- SIRF NAYE KHANE JORTI HAI (ADD COLUMN IF NOT EXISTS) — koi purana khana,
-- data, policy ya RLS nahi badalti. Dobara chalane se koi nuqsan nahi.
-- Purane khane (photo_url, cnic_copy_url) wese hi rehte hain; app pehli
-- tasveer photo_url me aur shanakhti card ka samne wala rukh cnic_copy_url
-- me likhti rehti hai — is liye چالان / purana code bilkul wese chalta hai.
--
--   case_accused   : photos (jsonb), cnic_back_url (text), prev_records (jsonb)
--   case_witnesses : photo_url, photos, cnic_copy_url, cnic_back_url, prev_records
--
-- Jab tak ye file nahi chalti, app phir bhi kaam karti hai (bunyadi data
-- mehfooz hota hai) — sirf izafi tasaveer / pichhla rukh / سابقہ ریکارڈ mehfooz
-- nahi hote aur app is ki itla deti hai.
do $naya101$
begin
  alter table public.case_accused   add column if not exists photos        jsonb not null default '[]'::jsonb;
  alter table public.case_accused   add column if not exists cnic_back_url text;
  alter table public.case_accused   add column if not exists prev_records  jsonb not null default '[]'::jsonb;

  alter table public.case_witnesses add column if not exists photo_url     text;
  alter table public.case_witnesses add column if not exists photos        jsonb not null default '[]'::jsonb;
  alter table public.case_witnesses add column if not exists cnic_copy_url text;
  alter table public.case_witnesses add column if not exists cnic_back_url text;
  alter table public.case_witnesses add column if not exists prev_records  jsonb not null default '[]'::jsonb;

  -- PostgREST (Supabase API) ko naye khane foran batao
  notify pgrst, 'reload schema';
  raise notice '101 — naye khane tayyar (case_accused 3, case_witnesses 5)';
end;
$naya101$;
