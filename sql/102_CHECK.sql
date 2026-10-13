-- 102_CHECK — SIRF PARHTI HAI. AIK statement. Dono khane mojood = THEEK.
select t.col,
       case when c.column_name is not null then 'THEEK (' || c.data_type || ')' else 'MOJOOD NAHI — 102 chalayen' end as halat
from (values ('case_id'), ('fir_number')) as t(col)
left join information_schema.columns c
  on c.table_schema = 'public' and c.table_name = 'applications_5c' and c.column_name = t.col
order by t.col;
