-- ═══════════════════════════════════════════════════════════════════════
--  111 — گشت مکمل ختم (v562، افسر کا حکم 28 اکتوبر 2026: «gasht ko complete remove kren»)
-- ───────────────────────────────────────────────────────────────────────
--  ایپ میں گشت کا ہر راستہ v561/v562 میں ہٹ چکا۔ یہ فائل ڈیٹابیس سے بھی اس کا جدول ہٹاتی ہے
--  (gasht_logs + اس کی پالیسیاں، trigger اور function)۔
--
--  حفاظت:
--   • پہلے بیک اپ: dio_bak_111_gasht_logs (پورا جدول، خالی ہو تب بھی) — RLS on، کسی کو رسائی نہیں۔
--   • اگر gasht_logs میں ایک بھی قطار ہو، یا «حذف شدہ مواد» (recycle_bin) میں گشت کا کوئی اندراج ہو،
--     تو یہ فائل رک جاتی ہے اور کچھ نہیں بدلتا (پہلے گنتی اور آپ کا فیصلہ)۔
--     آپ کے 108_CHECK (28 اکتوبر 2026) میں gasht_logs کی قطاریں: 0۔
--   • دوبارہ چلانا محفوظ۔ واپسی: 111_ROLLBACK.sql
--  چلانا: Supabase → SQL Editor → پوری فائل → Run۔ پھر 111_CHECK.sql چلا کر نتیجہ بھیجیں۔
-- ═══════════════════════════════════════════════════════════════════════
begin;

do $$
declare n bigint := 0; nb bigint := 0;
begin
  if to_regclass('public.gasht_logs') is null then
    raise notice '111 — gasht_logs پہلے ہی موجود نہیں';
    return;
  end if;
  execute 'select count(*) from public.gasht_logs' into n;
  if to_regclass('public.recycle_bin') is not null then
    execute 'select count(*) from public.recycle_bin where item_type = ''gasht''' into nb;
  end if;
  if n > 0 or nb > 0 then
    raise exception '111 رک گئی — گشت کی % قطاریں، «حذف شدہ مواد» میں %۔ کچھ نہیں بدلا۔ پہلے گنتی دیکھ کر فیصلہ کریں۔', n, nb;
  end if;

  -- بیک اپ پہلے (ڈھانچہ + جو کچھ ہو)
  if to_regclass('public.dio_bak_111_gasht_logs') is null then
    execute 'create table public.dio_bak_111_gasht_logs as table public.gasht_logs';
  end if;
  execute 'alter table public.dio_bak_111_gasht_logs enable row level security';
  execute 'revoke all on public.dio_bak_111_gasht_logs from anon, authenticated';
  execute 'comment on table public.dio_bak_111_gasht_logs is '
          || quote_literal('dio111: gasht_logs کا بیک اپ (28 اکتوبر 2026) — واپسی: 111_ROLLBACK.sql');

  -- جدول ہٹاؤ (پالیسیاں، index اور trigger اسی کے ساتھ)۔ cascade نہیں: کوئی اور چیز اس پر ٹکی ہو تو یہیں رک جائے
  execute 'drop table public.gasht_logs';
end $$;

drop function if exists public.dio_gasht_touch();

notify pgrst, 'reload schema';
do $$ begin raise notice '111 — mukammal (گشت ڈیٹابیس سے بھی ہٹ گیا؛ بیک اپ: dio_bak_111_gasht_logs)'; end $$;
commit;
