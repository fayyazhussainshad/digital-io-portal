-- 102_ROLLBACK — 5-C درخواست ka mocaddme se jor hata deti hai. AIK statement.
-- ⚠ Har 5-C درخواست par likha مقدمہ نمبر mit jayega (درخواست khud rehti hai).
do $undo102$
begin
  alter table public.applications_5c drop column if exists case_id;
  alter table public.applications_5c drop column if exists fir_number;
  notify pgrst, 'reload schema';
  raise warning 'WAPSI — applications_5c se case_id / fir_number hata diye';
end;
$undo102$;
