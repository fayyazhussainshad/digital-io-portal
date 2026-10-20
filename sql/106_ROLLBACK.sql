-- 106_ROLLBACK — 106_zimni_report_date_fix.sql ki wapsi. AIK statement.
-- Backup table se purani report_date wapas. (Backup table rehti hai — chahein to baad mein khud hata dein.)
update public.zimni_reports r
   set report_date = b.old_report_date
  from public.zimni_report_date_backup_106 b
 where r.id = b.id;
