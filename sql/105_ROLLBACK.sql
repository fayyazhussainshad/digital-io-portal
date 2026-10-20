-- 105_ROLLBACK — 105_zimni_content.sql ki wapsi. AIK statement.
-- ⚠ Sirf tab chalayein jab `content` khana ISI file (105) ne banaya ho aur us
--   mein koi ضمنی mehfooz na hui ho — warna ضمنیات ka mawad mit jayega.
--   Pehle 105_CHECK.sql chala kar dekh lein.
alter table public.zimni_reports drop column if exists content;
