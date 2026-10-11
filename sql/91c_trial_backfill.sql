-- 91c — jo afsar manzoor shuda hain magar unka koi subscription record nahi,
-- unhein aaj se 30-din ka trial. AIK hi statement — aur jo rows banti hain
-- wohi natije me nazar aa jayengi (is liye "no rows returned" ka shak nahi).
insert into public.subscriptions (officer_id, status, started_at, expires_at)
select o.id, 'trial', now(), now() + interval '30 days'
from public.officers o
where not exists (select 1 from public.subscriptions s where s.officer_id = o.id)
  and coalesce(o.is_approved, false) = true
  and coalesce(o.suspended, false) = false
returning officer_id,
          status,
          started_at::date as shuru,
          expires_at::date as miyaad;
