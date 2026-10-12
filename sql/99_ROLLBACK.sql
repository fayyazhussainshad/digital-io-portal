-- 99_ROLLBACK — dono policies bilkul pehle wali halat (PERMISSIVE) par wapas. AIK statement.
-- ⚠ Iske baad afsar apna audit_log record phir mita/badal sakega.
--    Sirf us soorat me chalayen jab 99 ke baad koi ASAL kaam ruk jaye.
do $undo99$
begin
  drop policy if exists "Nobody can delete audit log" on public.audit_log;
  create policy "Nobody can delete audit log" on public.audit_log
    as permissive for delete to authenticated using (false);

  drop policy if exists "Nobody can update audit log" on public.audit_log;
  create policy "Nobody can update audit log" on public.audit_log
    as permissive for update to authenticated using (false);

  raise warning 'WAPSI — audit_log ki dono policies phir PERMISSIVE (be-asar) hain';
end;
$undo99$;
