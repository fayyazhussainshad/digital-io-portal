# Digital IO — Police Case Management System

A paperless case-management web app for **investigation officers (IOs) in Pakistan** — built to
replace the manual writer (محرر) and let officers write reports, zimniat, challans and other
documents on the go, with peace of mind.

Urdu-first (RTL), works offline, mobile-friendly.

---

## 🧭 What it does

- **Cases (مقدمات):** create and manage FIR-based cases end to end.
- **Zimni (زمنی) & Androoni Zimni:** progress reports with a full editor, auto-numbering, find/replace.
- **Challan / Report 173:** all types (مکمل، نامکمل، 512، تتمہ، عبوری، اخراج، عدم پتہ) with a
  WYSIWYG table editor and precise print layout.
- **RFA, CRO card, CDR/IMEI, 5-C, incident reports** and other standard forms — auto-filled from case data.
- **Evidence (شہادت):** attach photos/video/files, with a court-grade **chain of custody**.
- **Reminders & court dates:** never miss a hearing; works offline.
- **Cross-case person search:** find every case a person appears in (by name/CNIC).
- **Document approval:** send a document to the SHO / senior officer for approve/reject.
- **Admin panel:** officer approvals, roles, station data, usage, data-health & security views.

---

## 📁 File structure

```
digital-io-portal/
├── index.html          ← Officer portal (loads all modules below)
├── admin.html          ← Admin control panel
├── vercel.json         ← Static hosting / routing config (Vercel)
├── app-core.js         ← App bootstrap + Supabase connection (see "Config")
├── data-api.js         ← Data layer (cases, reminders, evidence — with offline cache)
├── *.js                ← ~57 feature modules (cases, zimni, report173, evidence, admin, …)
├── dio-*.js            ← Shared utilities: dio-date, dio-statuses, dio-errors, dio-html,
│                          dio-states, dio-audit, dio-custody, dio-approvals
├── *.sql               ← Supabase schema / migrations (run these in the SQL editor)
└── README.md           ← This file
```

**Architecture:** plain vanilla JavaScript (no framework), loaded as classic `<script>` tags in
`index.html`. All modules share one global scope. Backend is **Supabase** (PostgreSQL + Auth +
Row Level Security).

> **Deploy note:** because modules load via `<script>` tags, every `.js` file must be present and
> tagged in `index.html`. When updating, upload the changed files and keep the `<script>` list
> intact — a missing file/tag breaks that feature.

---

## ⚙️ Config

Supabase project URL and the **public anon key** live in `app-core.js` (top of file). The anon key
is safe to ship in client code — access is protected by Row Level Security in the database.
To point the app at a different Supabase project, update `SUPABASE_URL` and `SUPABASE_KEY` there.

---

## 🗄️ Database setup (Supabase SQL editor)

Run the SQL files to create/upgrade tables and their security policies:

- `audit_logs.sql` — immutable audit trail
- `case_document_versions.sql` — document version history
- `case_shares_v2.sql` — case sharing (with expiry/revoke)
- `evidence_custody_events.sql` — evidence chain of custody (immutable)
- `document_approvals.sql` — document approval workflow
- `rls_audit_DIAGNOSTIC.sql` — read-only RLS security check (run anytime to verify all tables are protected)

---

## 🔐 Security

- **Row Level Security (RLS)** on every table — each officer sees only their own / their station's
  data. (Verified: all tables enabled with policies.)
- **Immutable audit trail** — every sensitive action (login, case create/update, officer approval,
  deletes) is logged and cannot be edited or removed.
- **Chain of custody** for evidence — who viewed/printed/deleted, kept even after the evidence is
  deleted (court-presentable).
- **HTML sanitization** (DOMPurify) against XSS.
- Passwords are never stored in plain text; sensitive local data is cleared on logout.

---

## 📴 Offline

Cases, reminders and evidence are cached locally; the app works without internet and syncs
automatically when the connection returns.

---

## 🚀 Deployment

Static files hosted on **Vercel** (`vercel.json` handles routing). Officer portal at `/`, admin
panel at `/admin.html`.
