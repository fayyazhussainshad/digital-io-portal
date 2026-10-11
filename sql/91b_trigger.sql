-- 91b — trigger. AIK hi statement. (91a ke BAAD chalayen.)
create or replace trigger dio_trial_on_approval
  after update of is_approved on public.officers
  for each row execute function public.dio_grant_trial_on_approval();
