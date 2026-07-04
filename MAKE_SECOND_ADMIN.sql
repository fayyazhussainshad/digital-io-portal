-- ═══════════════════════════════════════════════════════════════
-- Digital IO — دوسرا ایڈمن بنائیں (Co-Admin)
-- Akela admin hona kamzori hai. Ek bharosemand officer ko admin banayein.
-- ═══════════════════════════════════════════════════════════════

-- STEP 1: Pehle dekhein kaun-kaun registered hai (yeh chalayein, list dekhein):
SELECT id, full_name, badge_number, designation, station, role, is_approved
FROM officers
ORDER BY full_name;

-- ═══════════════════════════════════════════════════════════════
-- STEP 2: Upar ki list se jis officer ko admin banana hai, uska
-- badge_number neeche daal kar YEH line chalayein:
-- (YAHAN_BADGE ko asli badge number se badlein, quotes ke andar)

UPDATE officers
SET role = 'admin'
WHERE badge_number = 'YAHAN_BADGE';

-- ═══════════════════════════════════════════════════════════════
-- STEP 3: Confirm karein ke ban gaya:
SELECT full_name, badge_number, role FROM officers WHERE role IN ('admin','superadmin');

-- NOTE: Superadmin sirf aap rahenge (asal malik). Yeh officer 'admin'
-- hai — approvals aur admin panel chala sakta hai, lekin baaki
-- superadmin-only cheezein nahi.
