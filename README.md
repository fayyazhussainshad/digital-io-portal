# Digital IO — Police Case Management System

## ⚙️ SETUP INSTRUCTIONS

### Step 1: Update Supabase Config
Open `js/config.js` and replace:
```
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```
With your actual values from: Supabase → Project Settings → API

### Step 2: Upload to GitHub
Upload ALL files keeping the same folder structure.

### Step 3: Connect Vercel
Connect your GitHub repo to Vercel. It will auto-deploy.

## 📁 File Structure
```
digital-io-portal/
├── index.html          ← Main app
├── vercel.json         ← Vercel config
├── manifest.json       ← PWA manifest
├── sw.js               ← Service worker (offline)
├── css/
│   └── main.css        ← All styles
└── js/
    ├── config.js       ← ⚠️ ADD YOUR SUPABASE KEYS HERE
    ├── auth.js         ← Login / MFA / Session
    ├── db.js           ← Database operations
    ├── ui.js           ← UI utilities
    ├── backup.js       ← Real-time backup
    ├── app.js          ← App bootstrap
    └── pages/
        ├── dashboard.js
        ├── cases.js
        ├── evidence.js
        └── all-pages.js  ← Misal, Search, Law, Reminders, etc.
```

## 🔐 Security
- AES-256 field encryption
- Row Level Security (RLS)
- MFA / TOTP required
- Full audit logging
- Session timeout: 1 hour

## 📱 Features
- PWA — works on desktop + mobile
- Real-time backup to Google Drive
- MISAL Builder with editable FIR
- Evidence with live camera
- Advanced search with CNIC/Cell filters
- Law Library with 12+ laws
- Admin panel for officer management

## 💰 License
Digital IO v4.0 — Proprietary Software
