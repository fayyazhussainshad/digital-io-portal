// ════════════════════════════════════════════════════════════════
//  DIGITAL IO — ESLint (Khami 13)
//  Maqsad: NAYI khamoshi rokna. v545: tamam 965 khali catch nipat gaye —
//  jahan ghalti chhupne se data zaya ho sakta tha wahan dioLogError (47),
//  baqi har jagah wajah ka comment. Ab khali catch ERROR hai (build rokta
//  hai): har naye catch mein ya ghalti darj karein ya wajah likhein.
//  Chalane ka tareeqa:  npm install  &&  npm run lint
// ════════════════════════════════════════════════════════════════
import globals from 'globals';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── v538: aik file ka naam doosri file mein — "not defined" ka jhoota alarm ──
//  Classic <script> sab aik hi global scope mein chalti hain. ESLint har file
//  alag dekhta hai, is liye 739 "not defined" aate the jin mein se 171 naam
//  asal mein KISI AUR file mein bane hue the (jhoota alarm) aur sirf chand
//  waqai kahin nahi bane the (asli ghalti — jaise getIOSignLine,
//  _saveOfflineAuth, printContent). Ab app ki har file ke top-level naam
//  (function/const/let/var/class aur window.X =) khud-ba-khud "maloom"
//  maane jate hain — `no-undef` sirf ASLI ghaltiyan dikhata hai.
const ROOT = path.dirname(fileURLToPath(import.meta.url));
function appGlobals() {
  const out = {};
  const add = (n) => { if (n && !(n in out)) out[n] = 'writable'; };
  const scan = (t) => {
    for (const m of t.matchAll(/^\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)) add(m[1]);
    for (const m of t.matchAll(/^(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) add(m[1]);
    for (const m of t.matchAll(/window\.([A-Za-z_$][\w$]*)\s*=(?!=)/g)) add(m[1]);
  };
  try {
    for (const f of fs.readdirSync(ROOT)) {
      if (f.endsWith('.js') && f !== 'sw.js') scan(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    }
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    for (const m of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) scan(m[1]);
  } catch (_) { /* scan na ho sake to purana rawaiya */ }
  return out;
}

export default [
  { ignores: ['node_modules/**', 'sw.js', 'supabase/**', 'backups/**', 'tests/real-app/.deps/**', 'tests/real-app/out/**'] },   // .deps = real_test کی باہر کی لائبریریاں
  {
    files: ['tests/**/*.js'],
    languageOptions: { globals: { ...globals.node } },
  },
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'sw.js', 'supabase/**', 'backups/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',          // classic <script defer>, module nahi
      globals: {
        ...globals.browser,
        ...appGlobals(),
        // CDN se aane wali libraries
        DOMPurify: 'readonly', mammoth: 'readonly', fabric: 'readonly',
        // ikhtiyari hooks — har jagah `typeof X === 'function'` ke peeche (kabhi error nahi)
        checkLicense: 'readonly', checkCaseLimit: 'readonly', currentCase: 'readonly', dioFormatDate: 'readonly',
        // App ke apne global helpers / modules
        supabaseClient: 'writable', currentOfficer: 'writable', currentUser: 'writable',
        esc: 'readonly', _dioJsHtml: 'readonly', DIO: 'readonly',
        DIOCard: 'readonly', DIOPrev: 'readonly', DIOEntry: 'readonly',
        showToast: 'readonly', showPage: 'readonly', openModal: 'readonly', closeModal: 'readonly',
        formatDate: 'readonly', getOfficerId: 'readonly', sanitizeHtml: 'readonly',
        STATUS_LABELS: 'readonly', dioLicenseValid: 'readonly', dioRefreshLicense: 'readonly',
        dioSecureStorage: 'readonly', dioLogError: 'readonly',
      },
    },
    rules: {
      // ── XSS aur khamoshi ke liye ahem ────────────────────────
      'no-empty': ['error', { allowEmptyCatch: false }],  // khali catch → error (v545: 0 baqi)
      // v540: `vars: 'local'` — top-level naam (function/const) doosri files aur
      //   HTML onclick se istemal hote hain, jo ESLint dekh nahi sakta (jhoota
      //   alarm). Waqai murda top-level function ki jaanch tests/security.test.js
      //   ("koi murda function ya khana na bacha ho") poore system par karta hai.
      //   `caughtErrors: 'none'` — na-istemal `catch (e)` khami nahi (ESLint 8 tak
      //   yahi default tha).
      'no-unused-vars': ['warn', { vars: 'local', args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],

      // ── asli ghaltiyan — ye build rok dein ──────────────────
      'no-undef': 'error',
      'no-dupe-keys': 'error',
      'no-dupe-args': 'error',
      'no-duplicate-case': 'error',
      'no-unreachable': 'error',
      'no-cond-assign': 'error',
      'no-func-assign': 'error',
      'no-obj-calls': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      // Khami 12 dobara na ho — aik hi naam do baar
      'no-redeclare': ['error', { builtinGlobals: false }],
    },
  },
  // ── jaan-boojh kar istisna (v538) — sirf yahi, aur wajah ke sath ──
  {
    // tests: app ki files ko alag sandbox mein chala kar jaanchte hain
    files: ['tests/**/*.js'],
    rules: { 'no-eval': 'off', 'no-new-func': 'off' },
  },
];
