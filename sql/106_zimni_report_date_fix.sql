-- ============================================================================
-- Digital IO — 106_zimni_report_date_fix.sql   (v552 — صرف ضرورت پر)   AIK statement.
-- ----------------------------------------------------------------------------
-- KAB: 106_CHECK.sql mein 'ghalat_tareekh' > 0 ho.
-- KYA: har ضمنی ki report_date ko usi ضمنی ke کالم 1 (col1_date — jo افسر ne
--   khud likhi) ki sahi tareekh par le aati hai. Sirf wohi qataarein jin mein
--   col1_date mein durust DD/MM/YYYY tareekh ho aur report_date us se mukhtalif ho.
--   Mawad (content), ضمنی نمبر, afsar — kuch nahi chhua jata.
-- WAPSI ka saman: purani tareekh pehle `zimni_report_date_backup_106` mein
--   mehfooz hoti hai (id + purani report_date). WAPSI: 106_ROLLBACK.sql
-- Dobara chalane se koi nuqsan nahi (jo theek ho chuki un ko nahi chhooti;
--   backup mein pehli purani qeemat hi rehti hai).
-- ============================================================================
with z as (
  select id, report_date,
         -- ضمنی کا مواد `content` (jsonb) میں ہو یا پرانی ضمنیوں میں `body` (متن) میں — دونوں دیکھو
         regexp_match(coalesce(content::jsonb ->> 'col1_date',
                               substring(coalesce(body, '') from '"col1_date"\s*:\s*"([^"]*)"'), ''),
                      '(\d{1,2})\s*/\s*(\d{1,2})\s*/\s*(\d{4})') as m
  from public.zimni_reports
), p as (
  select id, report_date,
         case when m is not null and m[2]::int between 1 and 12 and m[1]::int between 1 and 31
                   and extract(month from (make_date(m[3]::int, m[2]::int, 1) + (m[1]::int - 1))) = m[2]::int
              then (make_date(m[3]::int, m[2]::int, 1) + (m[1]::int - 1)) end as sahi
  from z
), bak as (
  insert into public.zimni_report_date_backup_106 (id, old_report_date)
  select id, report_date from p where sahi is not null and report_date is distinct from sahi
  on conflict (id) do nothing
  returning id
)
update public.zimni_reports r
   set report_date = p.sahi
  from p
 where r.id = p.id and p.sahi is not null and r.report_date is distinct from p.sahi;
