-- ═══════════════════════════════════════════════════════════════════════
--  111b_ROLLBACK — بیک اپ سے گشت کا اندراج «حذف شدہ مواد» میں واپس (صرف اگر کبھی چاہیے ہو)
-- ═══════════════════════════════════════════════════════════════════════
begin;
do $$
begin
  if to_regclass('public.dio_bak_111_recycle_bin_gasht') is null then
    raise exception '111b_ROLLBACK: بیک اپ dio_bak_111_recycle_bin_gasht نہیں ملا — کچھ نہیں بدلا';
  end if;
  execute 'insert into public.recycle_bin select b.* from public.dio_bak_111_recycle_bin_gasht b'
       || ' where not exists (select 1 from public.recycle_bin r where r.id = b.id)';
  raise notice '111b_ROLLBACK — بیک اپ کا اندراج «حذف شدہ مواد» میں واپس';
end $$;
commit;
