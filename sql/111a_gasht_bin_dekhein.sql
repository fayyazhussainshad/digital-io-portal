-- ═══════════════════════════════════════════════════════════════════════
--  111a — «حذف شدہ مواد» میں گشت کا اندراج دیکھیں — صرف پڑھتی ہے (READ-ONLY)
--  111 اس لیے رکی کہ recycle_bin میں گشت کا 1 اندراج ہے (وہ گشت جو کبھی ایپ میں حذف کیا گیا تھا)۔
--  یہ فائل صرف دکھاتی ہے کہ وہ کیا ہے — کچھ تبدیل، حذف یا نیا نہیں بنتا۔
-- ═══════════════════════════════════════════════════════════════════════
select r.id                                                   as bin_id,
       r.item_id                                              as gasht_id,
       to_char(r.deleted_at at time zone 'Asia/Karachi', 'DD/MM/YYYY HH24:MI') as hazf_kiya,
       to_char(r.expires_at at time zone 'Asia/Karachi', 'DD/MM/YYYY')         as khud_mitne_ki_tareekh,
       r.item_data ->> 'gasht_date'                           as gasht_ki_tareekh,
       r.item_data ->> 'area'                                 as ilaqa,
       r.item_data ->> 'status'                               as halat,
       case when jsonb_typeof(r.item_data -> 'data' -> 'entries') = 'array'
            then jsonb_array_length(r.item_data -> 'data' -> 'entries') else 0 end as indiraaj,
       length(r.item_data::text)                              as size_bytes
  from public.recycle_bin r
 where r.item_type = 'gasht'
 order by r.deleted_at;
