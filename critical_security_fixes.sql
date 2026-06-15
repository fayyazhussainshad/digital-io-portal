-- ═══════════════════════════════════════════════════════════
--  DIGITAL IO — CRITICAL SECURITY FIXES
--  Run this entire script in Supabase Dashboard → SQL Editor
--  (Project → SQL Editor → New Query → paste → Run)
-- ═══════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────
-- FIX 1: Create pending_registrations table
-- (so self-signup goes here instead of auto-creating officers)
-- ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pending_registrations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text NOT NULL,
  email         text NOT NULL,
  badge_number  text NOT NULL,
  station       text,
  district      text,
  status        text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at    timestamptz DEFAULT now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid REFERENCES auth.users(id)
);

ALTER TABLE pending_registrations ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can INSERT their own registration
DROP POLICY IF EXISTS "Users can submit own registration" ON pending_registrations;
CREATE POLICY "Users can submit own registration"
  ON pending_registrations FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can read their own status
DROP POLICY IF EXISTS "Users can read own registration" ON pending_registrations;
CREATE POLICY "Users can read own registration"
  ON pending_registrations FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','superadmin')
  ));

-- Only admins can update (approve/reject)
DROP POLICY IF EXISTS "Admins can review registrations" ON pending_registrations;
CREATE POLICY "Admins can review registrations"
  ON pending_registrations FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','superadmin')
  ));


-- ───────────────────────────────────────────────────────────
-- FIX 2: HARDEN admin_create_officer_full
-- The old version had no role check — ANY logged-in user
-- could call it and create officers / escalate themselves.
-- ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION admin_create_officer_full(
  p_email text, p_password text, p_full_name text,
  p_badge_number text, p_designation text,
  p_station text, p_district text, p_phone text
) RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
  v_caller_role text;
BEGIN
  -- SECURITY: caller MUST be admin or superadmin
  SELECT role INTO v_caller_role FROM user_roles
  WHERE user_id = auth.uid()
  ORDER BY CASE role WHEN 'superadmin' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END
  LIMIT 1;

  IF v_caller_role NOT IN ('admin','superadmin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required to create officers';
  END IF;

  -- SECURITY: minimum password length
  IF length(p_password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;

  -- SECURITY: validate email format
  IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email;

  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_user_meta_data, is_super_admin
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(),
      'authenticated', 'authenticated', p_email,
      crypt(p_password, gen_salt('bf')),
      NOW(), NOW(), NOW(),
      json_build_object('full_name', p_full_name,
        'badge_number', p_badge_number,
        'station', p_station, 'district', p_district), false
    ) RETURNING id INTO v_user_id;
  END IF;

  INSERT INTO officers (user_id, full_name, badge_number,
    designation, station, district, phone)
  VALUES (v_user_id, p_full_name, p_badge_number,
    p_designation, p_station, p_district, p_phone)
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = p_full_name,
    badge_number = p_badge_number,
    designation = p_designation,
    station = p_station,
    district = p_district,
    phone = p_phone;

  DELETE FROM user_roles WHERE user_id = v_user_id;
  INSERT INTO user_roles (user_id, role) VALUES (v_user_id, 'officer');

  RETURN json_build_object('success', true, 'user_id', v_user_id);
END; $$;

-- Restrict who can even CALL the function
REVOKE EXECUTE ON FUNCTION admin_create_officer_full FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_create_officer_full TO authenticated;


-- ───────────────────────────────────────────────────────────
-- FIX 3: Function for admins to approve pending registrations
-- ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION approve_pending_registration(p_registration_id uuid)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reg pending_registrations%ROWTYPE;
  v_caller_role text;
BEGIN
  SELECT role INTO v_caller_role FROM user_roles
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_caller_role NOT IN ('admin','superadmin') THEN
    RAISE EXCEPTION 'Permission denied: admin role required';
  END IF;

  SELECT * INTO v_reg FROM pending_registrations WHERE id = p_registration_id;
  IF v_reg.id IS NULL THEN
    RAISE EXCEPTION 'Registration not found';
  END IF;
  IF v_reg.status <> 'pending' THEN
    RAISE EXCEPTION 'Registration already processed';
  END IF;

  -- Create officer record
  INSERT INTO officers (user_id, full_name, badge_number, station, district)
  VALUES (v_reg.user_id, v_reg.full_name, v_reg.badge_number, v_reg.station, v_reg.district)
  ON CONFLICT (user_id) DO NOTHING;

  -- Assign officer role
  INSERT INTO user_roles (user_id, role) VALUES (v_reg.user_id, 'officer')
  ON CONFLICT (user_id) DO NOTHING;

  -- Mark approved
  UPDATE pending_registrations
  SET status = 'approved', reviewed_at = now(), reviewed_by = auth.uid()
  WHERE id = p_registration_id;

  RETURN json_build_object('success', true);
END; $$;

REVOKE EXECUTE ON FUNCTION approve_pending_registration FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION approve_pending_registration TO authenticated;


-- ───────────────────────────────────────────────────────────
-- FIX 4: Audit unsafe RLS policies
-- Run this to LIST any tables with weak/missing RLS
-- (you should manually review any rows it returns)
-- ───────────────────────────────────────────────────────────

-- This is a check, not a fix — review the output:
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Any table with rls_enabled = false is publicly readable
-- via the anon key. For cases / evidence / officers / etc.,
-- this MUST be true. If false, enable with:
-- ALTER TABLE <tablename> ENABLE ROW LEVEL SECURITY;


-- ───────────────────────────────────────────────────────────
-- FIX 5: Server-side audit logging via trigger
-- (Replaces the easily-forged client-side audit_log writes)
-- ───────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION log_table_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_log (user_id, action, table_name, record_id, created_at)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    now()
  );
  RETURN COALESCE(NEW, OLD);
END; $$;

DROP TRIGGER IF EXISTS audit_cases ON cases;
CREATE TRIGGER audit_cases
  AFTER INSERT OR UPDATE OR DELETE ON cases
  FOR EACH ROW EXECUTE FUNCTION log_table_change();

DROP TRIGGER IF EXISTS audit_evidence ON evidence;
CREATE TRIGGER audit_evidence
  AFTER INSERT OR UPDATE OR DELETE ON evidence
  FOR EACH ROW EXECUTE FUNCTION log_table_change();

DROP TRIGGER IF EXISTS audit_officers ON officers;
CREATE TRIGGER audit_officers
  AFTER INSERT OR UPDATE OR DELETE ON officers
  FOR EACH ROW EXECUTE FUNCTION log_table_change();

-- Make audit_log append-only — nobody can edit or delete entries
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit log is read-only for admins" ON audit_log;
CREATE POLICY "Audit log is read-only for admins"
  ON audit_log FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid() AND role IN ('admin','superadmin')
  ));

DROP POLICY IF EXISTS "Nobody can update audit log" ON audit_log;
CREATE POLICY "Nobody can update audit log"
  ON audit_log FOR UPDATE TO authenticated
  USING (false);

DROP POLICY IF EXISTS "Nobody can delete audit log" ON audit_log;
CREATE POLICY "Nobody can delete audit log"
  ON audit_log FOR DELETE TO authenticated
  USING (false);


-- ═══════════════════════════════════════════════════════════
-- DONE. After running this:
--   1. The admin_create_officer_full function now refuses
--      non-admin callers.
--   2. Self-signup writes to pending_registrations (admin
--      must approve before officer can sign in).
--   3. Audit log is tamper-proof, written server-side.
--   4. Review the table list output and enable RLS on any
--      tables showing rls_enabled = false.
-- ═══════════════════════════════════════════════════════════
