// ════════════════════════════════════════════════════════════════
//  DIGITAL IO — ESLint (Khami 13)
//  Maqsad: NAYI khamoshi rokna. Mojooda ~800 khali catch ko aik saath
//  badalna khatarnak hai, is liye wo abhi WARNING hain (build nahi
//  torte) — magar koi NAYA khali catch ya ghalti foran nazar aa jaye.
//  Chalane ka tareeqa:  npm install  &&  npm run lint
// ════════════════════════════════════════════════════════════════
import globals from 'globals';

export default [
  {
    files: ['**/*.js'],
    ignores: ['node_modules/**', 'sw.js', 'supabase/**'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',          // classic <script defer>, module nahi
      globals: {
        ...globals.browser,
        // App ke apne global helpers / modules
        supabaseClient: 'writable', currentOfficer: 'writable', currentUser: 'writable',
        esc: 'readonly', _dioJsHtml: 'readonly', DIO: 'readonly',
        showToast: 'readonly', showPage: 'readonly', openModal: 'readonly', closeModal: 'readonly',
        formatDate: 'readonly', getOfficerId: 'readonly', sanitizeHtml: 'readonly',
        STATUS_LABELS: 'readonly', dioLicenseValid: 'readonly', dioRefreshLicense: 'readonly',
        dioSecureStorage: 'readonly', dioLogError: 'readonly',
      },
    },
    rules: {
      // ── XSS aur khamoshi ke liye ahem ────────────────────────
      'no-empty': ['warn', { allowEmptyCatch: false }],   // khali catch → warning
      'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_' }],

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
];
