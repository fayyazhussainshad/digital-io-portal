-- 101_CHECK — SIRF PARHTI HAI. AIK statement. Natija: har khana mojood = THEEK.
select t.tbl, t.col,
       case when c.column_name is not null then 'THEEK' else 'MOJOOD NAHI — 101 chalayen' end as halat
from (values
  ('case_accused','photos'), ('case_accused','cnic_back_url'), ('case_accused','prev_records'),
  ('case_witnesses','photo_url'), ('case_witnesses','photos'), ('case_witnesses','cnic_copy_url'),
  ('case_witnesses','cnic_back_url'), ('case_witnesses','prev_records')
) as t(tbl, col)
left join information_schema.columns c
  on c.table_schema = 'public' and c.table_name = t.tbl and c.column_name = t.col
order by t.tbl, t.col;
