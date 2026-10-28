-- ═══════════════════════════════════════════════════════════════════════
--  111_ROLLBACK — 111_remove_gasht کی واپسی (صرف اگر کبھی گشت دوبارہ چاہیے ہو)
--  ترتیب: پہلے sql/104_gasht_log.sql چلائیں (جدول + پالیسیاں دوبارہ)، پھر یہ فائل — بیک اپ کی قطاریں واپس۔
--  نوٹ: ایپ (v561/v562) میں گشت کا کوئی راستہ نہیں — ایپ کی واپسی الگ کام ہے۔
-- ═══════════════════════════════════════════════════════════════════════
begin;
do $$
begin
  if to_regclass('public.gasht_logs') is null then
    raise exception '111_ROLLBACK: پہلے sql/104_gasht_log.sql چلائیں — gasht_logs موجود نہیں';
  end if;
  if to_regclass('public.dio_bak_111_gasht_logs') is null then
    raise exception '111_ROLLBACK: بیک اپ dio_bak_111_gasht_logs نہیں ملا — کچھ نہیں بدلا';
  end if;
  execute 'insert into public.gasht_logs select * from public.dio_bak_111_gasht_logs on conflict (id) do nothing';
  raise notice '111_ROLLBACK — گشت کا جدول واپس (بیک اپ کی قطاریں شامل)';
end $$;
commit;
