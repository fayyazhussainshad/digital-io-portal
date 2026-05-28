// ═══════════════════════════════════════════════════
//  DIGITAL IO — CONFIGURATION
//  Replace YOUR_SUPABASE_URL and YOUR_SUPABASE_ANON_KEY
//  with your actual values from Supabase Project Settings > API
// ═══════════════════════════════════════════════════

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// App Configuration
const APP_CONFIG = {
  name: 'Digital IO',
  version: '4.0.0',
  edition: 'Police Case Management System',
  sessionTimeout: 3600000,      // 1 hour in milliseconds
  backupInterval: 5000,         // Backup check every 5 seconds
  maxLoginAttempts: 5,          // Lock after 5 failed attempts
  lockoutDuration: 1800000,     // 30 minutes lockout
  toastDuration: 3000,          // Toast notification duration
};

// Status Labels (Urdu)
const STATUS_LABELS = {
  under:      'زیر تفتیش',
  complete:   'مکمل چالان',
  incomplete: 'نامکمل چالان',
  untrace:    'عدم پتہ',
  cancel:     'اخراج',
};

const STATUS_CLASSES = {
  under:      'pill-blue',
  complete:   'pill-green',
  incomplete: 'pill-amber',
  untrace:    'pill-purple',
  cancel:     'pill-red',
};

// Police News Feed
const POLICE_NEWS = [
  '⚖️ Supreme Court: Right to bail is a constitutional right under Article 10 — SC Judgment 2024',
  '🏛️ Lahore High Court: Expedited challan submission within 14 days of arrest — LHC Standing Order',
  '📋 AMENDMENT: Section 302 PPC — Court can award Diyat in addition to Qisas — SC Ruling',
  '🚨 Punjab Police: e-FIR system introduced for Category-B offences — effective citywide',
  '⚖️ SC: Confessions under duress are inadmissible — Full Bench Ruling confirmed',
  '🔵 HIGH COURT: Forensic evidence must accompany challan for CNSA cases — LHC Order',
  '📜 AMENDMENT: Anti-Rape Act 2021 — DNA evidence mandatory within 72 hours of incident',
  '🏛️ SC: Accused right to free legal aid reaffirmed under Article 10-A Constitution of Pakistan',
  '⚠️ ADVISORY: Section 160 CrPC notices must be served via proper channel — SHO responsible',
  '📋 AMENDMENT: Arms Ordinance 1965 — Possession of prohibited bore now non-bailable',
  '🔵 LHC ORDER: Medical examination in hurt cases must be conducted within 6 hours — mandatory',
  '⚖️ SC JUDGMENT: Absconder declaration under Section 87 CrPC requires prior Sections 86/87',
  '🚨 NEW LAW: PECA amendments — digital evidence now fully admissible in Pakistani courts',
  '📜 Punjab Police: Bodycam footage to be uploaded to secure server within 24 hours',
  '🏛️ HIGH COURT: Challan incomplete without postmortem in homicide cases — strict compliance ordered',
];

// Initialize Supabase
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

console.log('✅ Digital IO Config Loaded');
