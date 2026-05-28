// ═══════════════════════════════════════════════════
//  DIGITAL IO — CONFIGURATION
// ═══════════════════════════════════════════════════

const SUPABASE_URL = 'https://bbrhtokynxmljumxyaeh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJicmh0b2t5bnhtbGp1bXh5YWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MzU5ODIsImV4cCI6MjA5NTUxMTk4Mn0.o4uKyqhIx9vWDX-CeJjwujWUYK6Cy0XzEZ5fw_efQMA';

const APP_CONFIG = {
  name: 'Digital IO',
  version: '4.0.0',
  edition: 'Police Case Management System',
  sessionTimeout: 3600000,
  backupInterval: 5000,
  maxLoginAttempts: 5,
  lockoutDuration: 1800000,
  toastDuration: 3000,
};

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
