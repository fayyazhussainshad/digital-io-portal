-- ═══════════════════════════════════════════════════════════
--  DIGITAL IO — FIX "Protected" COMPLAINANT NAMES
--  Run ONCE in Supabase Dashboard → SQL Editor
--
--  This copies the decrypted complainant name from the
--  cases_decrypted view back into the cases table for any
--  row that currently shows "Protected" or is empty.
--  Does NOT touch cases that already have a real name.
-- ═══════════════════════════════════════════════════════════

UPDATE cases c
SET    complainant = cd.complainant
FROM   cases_decrypted cd
WHERE  c.id = cd.id
  AND  cd.complainant IS NOT NULL
  AND  cd.complainant <> ''
  AND  cd.complainant <> 'Protected'
  AND  (c.complainant IS NULL
        OR c.complainant = ''
        OR c.complainant = 'Protected');

-- Show how many rows were fixed
SELECT COUNT(*) AS rows_fixed
FROM   cases
WHERE  complainant IS NOT NULL
  AND  complainant <> ''
  AND  complainant <> 'Protected';
