-- ═══════════════════════════════════════════════════════════
--  DIGITAL IO — 5-C APPLICATIONS MODULE
--  Run this entire script in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────
-- 1. MAIN TABLE: applications_5c
--    Each row is one application from a complainant that's
--    been forwarded by one or more senior officers.
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS applications_5c (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  officer_id          uuid NOT NULL REFERENCES officers(id) ON DELETE CASCADE,
  serial_number       int  NOT NULL,
  complainant_name    text,
  complainant_cnic    text,
  complainant_cell    text,
  subject             text,
  application_date    date,
  response_date       date,
  response_text       text,
  status              text DEFAULT 'received' CHECK (status IN ('received','in_progress','responded','closed')),
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  UNIQUE(officer_id, serial_number)
);

-- ───────────────────────────────────────────────────────────
-- 2. RELATED TABLE: application_5c_numbers
--    One application can have multiple application numbers
--    (one per senior officer who forwarded it).
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS application_5c_numbers (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_5c_id           uuid NOT NULL REFERENCES applications_5c(id) ON DELETE CASCADE,
  application_number          text NOT NULL,
  senior_officer_designation  text,
  senior_officer_name         text,
  forwarded_date              date,
  notes                       text,
  created_at                  timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────
-- 3. ATTACHMENTS: application_5c_attachments
--    Scans of the original application + response + others.
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS application_5c_attachments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_5c_id   uuid NOT NULL REFERENCES applications_5c(id) ON DELETE CASCADE,
  file_name           text NOT NULL,
  storage_path        text NOT NULL,
  file_size           int,
  mime_type           text,
  category            text DEFAULT 'attachment' CHECK (category IN ('application_scan','response_scan','attachment')),
  uploaded_at         timestamptz DEFAULT now()
);

-- ───────────────────────────────────────────────────────────
-- 4. INDEXES — make searches fast
-- ───────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_5c_officer        ON applications_5c(officer_id);
CREATE INDEX IF NOT EXISTS idx_5c_cnic           ON applications_5c(complainant_cnic);
CREATE INDEX IF NOT EXISTS idx_5c_cell           ON applications_5c(complainant_cell);
CREATE INDEX IF NOT EXISTS idx_5c_name           ON applications_5c(lower(complainant_name));
CREATE INDEX IF NOT EXISTS idx_5c_num_appno      ON application_5c_numbers(application_number);
CREATE INDEX IF NOT EXISTS idx_5c_num_desig      ON application_5c_numbers(senior_officer_designation);
CREATE INDEX IF NOT EXISTS idx_5c_num_appid      ON application_5c_numbers(application_5c_id);
CREATE INDEX IF NOT EXISTS idx_5c_att_appid      ON application_5c_attachments(application_5c_id);

-- ───────────────────────────────────────────────────────────
-- 5. TRIGGERS — auto serial number + auto updated_at
-- ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_5c_serial()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.serial_number IS NULL OR NEW.serial_number = 0 THEN
    SELECT COALESCE(MAX(serial_number),0) + 1 INTO NEW.serial_number
    FROM applications_5c WHERE officer_id = NEW.officer_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_5c_serial ON applications_5c;
CREATE TRIGGER trg_5c_serial BEFORE INSERT ON applications_5c
  FOR EACH ROW EXECUTE FUNCTION set_5c_serial();

CREATE OR REPLACE FUNCTION set_5c_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_5c_updated ON applications_5c;
CREATE TRIGGER trg_5c_updated BEFORE UPDATE ON applications_5c
  FOR EACH ROW EXECUTE FUNCTION set_5c_updated_at();

-- ───────────────────────────────────────────────────────────
-- 6. ROW-LEVEL SECURITY — officers see only their own data
-- ───────────────────────────────────────────────────────────

ALTER TABLE applications_5c              ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_5c_numbers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_5c_attachments   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "5c_apps_own" ON applications_5c;
CREATE POLICY "5c_apps_own" ON applications_5c FOR ALL TO authenticated
  USING       (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()))
  WITH CHECK  (officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "5c_nums_own" ON application_5c_numbers;
CREATE POLICY "5c_nums_own" ON application_5c_numbers FOR ALL TO authenticated
  USING       (application_5c_id IN (SELECT id FROM applications_5c WHERE officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())))
  WITH CHECK  (application_5c_id IN (SELECT id FROM applications_5c WHERE officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())));

DROP POLICY IF EXISTS "5c_atts_own" ON application_5c_attachments;
CREATE POLICY "5c_atts_own" ON application_5c_attachments FOR ALL TO authenticated
  USING       (application_5c_id IN (SELECT id FROM applications_5c WHERE officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())))
  WITH CHECK  (application_5c_id IN (SELECT id FROM applications_5c WHERE officer_id IN (SELECT id FROM officers WHERE user_id = auth.uid())));

-- ───────────────────────────────────────────────────────────
-- 7. STORAGE BUCKET — for scans & uploaded files
--    Each user's files live under: <user_id>/<application_id>/<filename>
-- ───────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('5c-attachments', '5c-attachments', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "5c_storage_upload" ON storage.objects;
CREATE POLICY "5c_storage_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = '5c-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "5c_storage_read" ON storage.objects;
CREATE POLICY "5c_storage_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = '5c-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "5c_storage_delete" ON storage.objects;
CREATE POLICY "5c_storage_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = '5c-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- ═══════════════════════════════════════════════════════════
-- DONE. After running this:
--   • 5-C Applications tab will work in your portal.
--   • Each officer sees only their own applications.
--   • File scans are securely stored per-user in Supabase Storage.
-- ═══════════════════════════════════════════════════════════
