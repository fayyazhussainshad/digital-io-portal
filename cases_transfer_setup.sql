-- ═══════════════════════════════════════════════════════════
--  DIGITAL IO — CASES TABLE VIEW + TRANSFER TRACKING
--  Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- 1. Add station columns to cases
--    Stores the station where the case was REGISTERED,
--    independent of the officer's current (possibly transferred) station.
-- ───────────────────────────────────────────────────────────

ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_station  text;
ALTER TABLE cases ADD COLUMN IF NOT EXISTS case_district text;

-- ───────────────────────────────────────────────────────────
-- 2. Auto-populate case_station on INSERT via trigger
--    Even if the JS doesn't pass station, the DB fills it
--    from the officer's station at that moment.
-- ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_case_station()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.case_station IS NULL OR NEW.case_station = '' THEN
    SELECT station, district
    INTO   NEW.case_station, NEW.case_district
    FROM   officers
    WHERE  id = NEW.officer_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_case_station ON cases;
CREATE TRIGGER trg_case_station
  BEFORE INSERT ON cases
  FOR EACH ROW EXECUTE FUNCTION set_case_station();

-- Back-fill existing cases that have no case_station yet
UPDATE cases c
SET    case_station  = o.station,
       case_district = o.district
FROM   officers o
WHERE  c.officer_id = o.id
  AND  (c.case_station IS NULL OR c.case_station = '');

-- ───────────────────────────────────────────────────────────
-- 3. Officer transfer history table
--    Each row = one posting/transfer of an officer.
--    Old cases keep their original case_station.
--    Officer sees ALL cases regardless of current station
--    (they're linked by officer_id, not station).
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS officer_transfers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id      uuid NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  from_station    text,
  from_district   text,
  to_station      text NOT NULL,
  to_district     text,
  transfer_date   date,
  order_number    text,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE officer_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Officers manage own transfers" ON officer_transfers;
CREATE POLICY "Officers manage own transfers" ON officer_transfers
  FOR ALL TO authenticated
  USING      (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()))
  WITH CHECK (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_transfers_officer ON officer_transfers(officer_id);
CREATE INDEX IF NOT EXISTS idx_transfers_date    ON officer_transfers(transfer_date DESC);

-- ═══════════════════════════════════════════════════════════
-- DONE.
-- After running:
--   • Existing cases get their station back-filled.
--   • New cases auto-capture the station at creation time.
--   • Officers can record transfers; cases remain linked to them.
-- ═══════════════════════════════════════════════════════════
