-- 95_ROLLBACK — subscriptions ki purani policies bilkul waisi hi wapas.
-- ⚠ Iske baad afsar dobara khud ko trial/active de sakega (asal Postgres par
--    naapa gaya: 365-din ka trial insert chal gaya tha). Sirf us soorat me
--    chalayen jab 95 ke baad sabscription ya admin ka safha ruk jaye.
do $undo95$
begin
  drop policy if exists "Officers own subs"          on public.subscriptions;
  drop policy if exists "Officers own subscriptions" on public.subscriptions;
  drop policy if exists "Admins manage subs"         on public.subscriptions;
  drop policy if exists "Admins view all subs"       on public.subscriptions;

  create policy "Officers own subs" on public.subscriptions
    for all to public
    using (officer_id in (select officers.id from public.officers
                          where officers.user_id = auth.uid()))
    with check (officer_id in (select officers.id from public.officers
                               where officers.user_id = auth.uid()));

  create policy "Officers own subscriptions" on public.subscriptions
    for all to public
    using ((officer_id in (select officers.id from public.officers
                           where officers.user_id = auth.uid()))
        or exists (select 1 from public.officers
                   where officers.user_id = auth.uid()
                     and officers.role = any (array['admin','superadmin'])));

  create policy "Admins manage subs" on public.subscriptions
    for update to public
    using (exists (select 1 from public.officers
                   where officers.user_id = auth.uid()
                     and officers.role = any (array['admin','superadmin'])));

  create policy "Admins view all subs" on public.subscriptions
    for select to public
    using (exists (select 1 from public.officers
                   where officers.user_id = auth.uid()
                     and officers.role = any (array['admin','superadmin'])));

  raise warning 'WAPSI — subscriptions par client ki likhai dobara khul gayi. Afsar khud ko trial de sakta hai.';
end;
$undo95$;
