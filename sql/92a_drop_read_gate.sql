-- 92a — `dio_sub_sel` (parhne ki rok) har table se hatao. AIK statement.
-- Faisla: miyaad khatam = dekh sakte ho, badal nahi sakte. Is liye parhne ki
-- rok hat rahi hai; likhne ki rok 92b me lagegi.
do $drop_read_gate$
declare r record; n int := 0;
begin
  for r in select tablename from pg_policies
           where schemaname = 'public' and policyname = 'dio_sub_sel'
           order by tablename
  loop
    execute format('drop policy if exists dio_sub_sel on public.%I', r.tablename);
    n := n + 1;
    raise notice 'hataya: %', r.tablename;
  end loop;
  raise notice 'mukammal — % tables se parhne ki rok hat gayi', n;
end;
$drop_read_gate$;
