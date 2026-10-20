-- 106_PREP — 106_zimni_report_date_fix.sql se PEHLE aik dafa (backup ki jagah). AIK statement.
-- Sirf aik nayi chhoti table banati hai: (id, purani report_date). Kuch nahi badalta.
create table if not exists public.zimni_report_date_backup_106 (
  id uuid primary key,
  old_report_date date,
  saved_at timestamptz not null default now()
);
