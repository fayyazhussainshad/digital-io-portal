-- ═══════════════════════════════════════════════════════════════════════
--  110 — مقدمہ شیئر مکمل ختم (v561، افسر کا حکم 28 اکتوبر 2026: «Muqadma share totally remove»)
-- ───────────────────────────────────────────────────────────────────────
--  ایپ میں شیئر کا ہر راستہ v561 میں ہٹ چکا۔ یہ فائل ڈیٹابیس میں بھی دروازہ بند کرتی ہے:
--  case_shares میں نئی قطار نہ بن سکے، نہ کوئی پرانی بدل سکے — یعنی کوئی افسر کسی دوسرے کا
--  مقدمہ (اور اس کی ضمنیاں / چالان) کبھی نہ دیکھ سکے۔ ہر افسر صرف اپنا ڈیٹا۔
--
--  حفاظت:
--   • کچھ حذف نہیں ہوتا۔ جدول اپنی جگہ رہتی ہے (آپ کے 108_CHECK میں: 0 قطاریں، پورے ڈیٹابیس میں)۔
--   • اگر چلاتے وقت case_shares میں ایک بھی قطار ہو تو یہ فائل رک جاتی ہے اور کچھ نہیں بدلتا
--     (پہلے گنتی اور آپ کا فیصلہ)۔
--   • دوبارہ چلانا محفوظ (idempotent)۔ واپسی: 110_ROLLBACK.sql
--  چلانا: Supabase → SQL Editor → پوری فائل → Run۔ پھر 110_CHECK.sql چلا کر نتیجہ بھیجیں۔
-- ═══════════════════════════════════════════════════════════════════════
begin;

do $$
declare n bigint;
begin
  if to_regclass('public.case_shares') is null then
    raise exception '110: public.case_shares موجود نہیں — کچھ نہیں بدلا';
  end if;
  select count(*) into n from public.case_shares;
  if n > 0 then
    raise exception '110 رک گئی — case_shares میں % قطاریں ہیں۔ کچھ نہیں بدلا۔ پہلے گنتی دیکھ کر فیصلہ کریں۔', n;
  end if;
end $$;

-- لکھنے کا حق واپس (پڑھنا رہتا ہے — جدول خالی ہے، کچھ نظر نہیں آتا)
revoke insert, update, delete on public.case_shares from anon, authenticated;

-- اگر کہیں سے حق دوبارہ مل بھی جائے تو RLS کی restrictive پابندی: نئی / بدلی قطار کبھی نہیں
drop policy if exists dio110_noshare_ins on public.case_shares;
create policy dio110_noshare_ins on public.case_shares as restrictive for insert to authenticated with check (false);
drop policy if exists dio110_noshare_upd on public.case_shares;
create policy dio110_noshare_upd on public.case_shares as restrictive for update to authenticated using (false) with check (false);

comment on table public.case_shares is 'dio110: مقدمہ شیئر ختم (28 اکتوبر 2026) — نئی قطار ممکن نہیں۔ واپسی: 110_ROLLBACK.sql';

do $$ begin raise notice '110 — mukammal (مقدمہ شیئر ڈیٹابیس میں بھی بند؛ کچھ حذف نہیں ہوا)'; end $$;
commit;
