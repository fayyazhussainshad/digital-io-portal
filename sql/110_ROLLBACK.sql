-- ═══════════════════════════════════════════════════════════════════════
--  110_ROLLBACK — 110_no_case_sharing کی واپسی (صرف اگر کبھی شیئر دوبارہ چاہیے ہو)
--  ڈیٹا کو ہاتھ نہیں لگاتی — صرف 110 کی دو پابندیاں ہٹاتی اور لکھنے کا حق واپس دیتی ہے۔
--  نوٹ: ایپ (v561) میں شیئر کا کوئی راستہ نہیں — ایپ کی واپسی الگ کام ہے۔
-- ═══════════════════════════════════════════════════════════════════════
begin;
drop policy if exists dio110_noshare_ins on public.case_shares;
drop policy if exists dio110_noshare_upd on public.case_shares;
grant insert, update, delete on public.case_shares to authenticated;
comment on table public.case_shares is null;
commit;
