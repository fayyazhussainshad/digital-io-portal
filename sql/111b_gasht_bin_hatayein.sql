-- ═══════════════════════════════════════════════════════════════════════
--  111b — «حذف شدہ مواد» میں پڑا گشت کا اندراج: پہلے بیک اپ، پھر وہاں سے ہٹائیں
--  (افسر کا حکم 28 اکتوبر 2026: «gasht ko complete remove kren»)
-- ───────────────────────────────────────────────────────────────────────
--  حفاظت:
--   • پہلے بیک اپ: dio_bak_111_recycle_bin_gasht (پوری قطار جوں کی توں) — RLS on، کسی کو رسائی نہیں۔
--   • بیک اپ میں پہنچنے کی تصدیق کے بعد ہی recycle_bin سے ہٹتا ہے۔
--   • صرف وہی 1 اندراج جو آپ کے 111_CHECK میں دکھا («hazf_shuda_mein_gasht»: 1)۔ اگر چلاتے وقت
--     1 سے زیادہ ہوں تو یہ فائل رک جاتی ہے اور کچھ نہیں بدلتا۔
--   • باقی کسی قسم کا «حذف شدہ مواد» نہیں چھوا جاتا۔ دوبارہ چلانا محفوظ۔ واپسی: 111b_ROLLBACK.sql
--  اس کے بعد: 111_remove_gasht.sql دوبارہ، پھر 111_CHECK.sql
-- ═══════════════════════════════════════════════════════════════════════
begin;

do $$
declare n bigint; nb bigint;
begin
  select count(*) into n from public.recycle_bin where item_type = 'gasht';
  if n = 0 then
    raise notice '111b — «حذف شدہ مواد» میں گشت کا کوئی اندراج نہیں (کچھ نہیں بدلا)';
    return;
  end if;
  if n > 1 then
    raise exception '111b رک گئی — «حذف شدہ مواد» میں گشت کے % اندراج ہیں (1 کی توقع تھی)۔ کچھ نہیں بدلا۔', n;
  end if;

  -- بیک اپ پہلے
  if to_regclass('public.dio_bak_111_recycle_bin_gasht') is null then
    execute 'create table public.dio_bak_111_recycle_bin_gasht as select * from public.recycle_bin where item_type = ''gasht''';
  else
    execute 'insert into public.dio_bak_111_recycle_bin_gasht select r.* from public.recycle_bin r where r.item_type = ''gasht'''
         || ' and not exists (select 1 from public.dio_bak_111_recycle_bin_gasht b where b.id = r.id)';
  end if;
  execute 'alter table public.dio_bak_111_recycle_bin_gasht enable row level security';
  execute 'revoke all on public.dio_bak_111_recycle_bin_gasht from anon, authenticated';
  execute 'comment on table public.dio_bak_111_recycle_bin_gasht is '
          || quote_literal('dio111b: «حذف شدہ مواد» کے گشت اندراج کا بیک اپ (28 اکتوبر 2026) — واپسی: 111b_ROLLBACK.sql');

  -- تصدیق: ہر ہٹایا جانے والا اندراج بیک اپ میں موجود ہو
  execute 'select count(*) from public.recycle_bin r where r.item_type = ''gasht'''
       || ' and exists (select 1 from public.dio_bak_111_recycle_bin_gasht b where b.id = r.id and b.item_data = r.item_data)' into nb;
  if nb <> n then
    raise exception '111b رک گئی — بیک اپ کی تصدیق نہیں ہوئی (% میں سے %)۔ کچھ نہیں بدلا۔', n, nb;
  end if;

  delete from public.recycle_bin where item_type = 'gasht';
  raise notice '111b — mukammal (گشت کا % اندراج بیک اپ میں محفوظ، «حذف شدہ مواد» سے ہٹ گیا)', n;
end $$;

commit;
