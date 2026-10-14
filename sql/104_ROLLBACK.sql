-- 104_ROLLBACK — «گشت لاگ» کی table ہٹاتی ہے۔ AIK statement.
-- ⚠ اس سے تمام گشت ریکارڈ ہمیشہ کے لیے مٹ جاتے ہیں۔ اسی لیے: table میں ایک
-- بھی قطار ہو تو یہ فائل کچھ نہیں کرتی اور خطا دیتی ہے — پہلے «بیک اپ» لیں
-- اور خالی کرنا ہو تو جان بوجھ کر الگ سے کریں۔
do $gasht104rb$
declare n bigint;
begin
  if to_regclass('public.gasht_logs') is null then
    raise notice '104_ROLLBACK — gasht_logs pehle hi mojood nahi';
    return;
  end if;
  execute 'select count(*) from public.gasht_logs' into n;
  if n > 0 then
    raise exception 'Digital IO 104_ROLLBACK: gasht_logs me % qataarein hain — data mitne se bachane ke liye ruk gaya', n;
  end if;
  drop table public.gasht_logs;
  drop function if exists public.dio_gasht_touch();
  notify pgrst, 'reload schema';
  raise notice '104_ROLLBACK — gasht_logs hata di gayi (khali thi)';
end;
$gasht104rb$;
