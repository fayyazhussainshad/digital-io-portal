-- ═══════════════════════════════════════════════════════════
--  DIGITAL IO — EXTENDED OFFICER PROFILE
--  Run in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════

-- Add new profile columns to officers table
ALTER TABLE officers
  ADD COLUMN IF NOT EXISTS cnic_number        text,
  ADD COLUMN IF NOT EXISTS father_name        text,
  ADD COLUMN IF NOT EXISTS date_of_joining    date,
  ADD COLUMN IF NOT EXISTS date_of_birth      date,
  ADD COLUMN IF NOT EXISTS prc_number         text,
  ADD COLUMN IF NOT EXISTS personal_phone     text,
  ADD COLUMN IF NOT EXISTS official_phone     text,
  ADD COLUMN IF NOT EXISTS home_address       text,
  ADD COLUMN IF NOT EXISTS emergency_contact  text,
  ADD COLUMN IF NOT EXISTS emergency_phone    text;

-- ═══════════════════════════════════════════════════════════
-- READ-ONLY FIELDS (admin sets these, officer cannot change):
--   full_name, badge_number, designation, cnic_number,
--   date_of_birth, date_of_joining, prc_number, father_name
--
-- OFFICER-EDITABLE FIELDS:
--   station, district, personal_phone, official_phone,
--   home_address, emergency_contact, emergency_phone,
--   profile_photo_url
-- ═══════════════════════════════════════════════════════════
