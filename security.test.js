// ════════════════════════════════════════════════════════════════
//  DIGITAL IO — security smoke tests (Khami 13)
//  Chalayein:  npm test      (node --test, koi bahri library nahi)
//  Ye un hifazati qawaneen ko jaanchte hain jo audit me theek kiye gaye.
// ════════════════════════════════════════════════════════════════
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

// ── chhota fake browser (localStorage + navigator) ──────────────
function makeSandbox(online = true) {
  const store = new Map();
  const ctx = {
    console,
    navigator: { onLine: online, userAgent: 'test' },
    location: { href: 'http://localhost/' },
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
      clear: () => store.clear(),
    },
    setTimeout, clearTimeout, Date, JSON, Math, String, Number, Object, Array, Promise,
    showToast() {}, _showPlans() {},
    currentOfficer: null, supabaseClient: null,
    async getOfficerId() { return 'OFF-1'; },
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  return ctx;
}

// ─────────────────────────────────────────────────────────────────
test('esc() har khatarnak character ko badalta hai', () => {
  const ctx = makeSandbox();
  vm.runInContext(read('app-core.js').match(/function esc\(s\)[\s\S]*?\n}/)[0], ctx);
  const out = vm.runInContext('esc(`<img src=x onerror="alert(1)">&\'`)', ctx);
  assert.ok(!out.includes('<'), 'koi < nahi bachna chahiye');
  assert.ok(!out.includes('>'), 'koi > nahi bachna chahiye');
  assert.ok(!out.includes('"'), 'koi " nahi bachna chahiye');
  assert.ok(!out.includes("'"), "koi ' nahi bachna chahiye");
  assert.ok(out.includes('&amp;'), '& pehle badalna chahiye');
});

test('_dioJsHtml() inline onclick ke liye quote/backslash rokta hai', () => {
  const ctx = makeSandbox();
  const src = read('app-core.js');
  vm.runInContext(src.match(/function esc\(s\)[\s\S]*?\n}/)[0], ctx);
  vm.runInContext(src.match(/function _dioJsHtml\(s\)[\s\S]*?\n}/)[0], ctx);
  const out = vm.runInContext(`_dioJsHtml("');alert(1);//")`, ctx);
  assert.ok(!out.includes("'"), 'khaam single-quote nahi bachna chahiye');
  assert.ok(!out.includes('"'), 'khaam double-quote nahi bachna chahiye');
});

// ── Khami 9 — offline fail-CLOSED ───────────────────────────────
function loadSubHelpers(ctx) {
  const src = read('subscription.js');
  const start = src.indexOf('const _SUB_CACHE_KEY');
  const end = src.indexOf('// ── SUBSCRIPTION CHECK ON LOGIN');
  assert.ok(start > -1 && end > start, 'fail-closed helpers subscription.js me milne chahiye');
  vm.runInContext(src.slice(start, end), ctx);
}

test('offline + koi cache nahi = MUKHTASIR grace, naya 30-din trial NAHI', async () => {
  const ctx = makeSandbox(false); loadSubHelpers(ctx);
  const r = await vm.runInContext('_dioOfflineStatus("OFF-1")', ctx);
  assert.notStrictEqual(r.daysLeft, 30, 'purana fail-open wapas nahi aana chahiye');
  assert.ok(r.daysLeft <= 3, 'grace 3 din se zyada nahi');
});

test('offline cache guzray dinon ke mutabiq kam hota hai', async () => {
  const ctx = makeSandbox(false); loadSubHelpers(ctx);
  ctx.localStorage.setItem('dio_sub_cache', JSON.stringify(
    { s: 'active', d: 20, p: 'فعال', o: 'OFF-1', t: Date.now() - 5 * 86400000 }));
  const r = await vm.runInContext('_dioOfflineStatus("OFF-1")', ctx);
  assert.strictEqual(r.status, 'active');
  assert.strictEqual(r.daysLeft, 15, '20 - 5 = 15');
});

test('mo\'attal afsar offline ho kar bhi mo\'attal rehta hai', async () => {
  const ctx = makeSandbox(false); loadSubHelpers(ctx);
  ctx.localStorage.setItem('dio_sub_cache', JSON.stringify(
    { s: 'suspended', d: 0, p: 'معطل', o: 'OFF-1', t: Date.now() - 86400000 }));
  const r = await vm.runInContext('_dioOfflineStatus("OFF-1")', ctx);
  assert.strictEqual(r.status, 'suspended', 'internet band kar ke pabandi na tootay');
});

test('miyaad guzar jane par cache expired deta hai', async () => {
  const ctx = makeSandbox(false); loadSubHelpers(ctx);
  ctx.localStorage.setItem('dio_sub_cache', JSON.stringify(
    { s: 'active', d: 5, p: 'فعال', o: 'OFF-1', t: Date.now() - 9 * 86400000 }));
  const r = await vm.runInContext('_dioOfflineStatus("OFF-1")', ctx);
  assert.strictEqual(r.status, 'expired');
});

test('dusre afsar ka cache istemaal nahi hota', async () => {
  const ctx = makeSandbox(false); loadSubHelpers(ctx);
  ctx.localStorage.setItem('dio_sub_cache', JSON.stringify(
    { s: 'active', d: 99, p: 'فعال', o: 'OFF-2', t: Date.now() }));
  const r = await vm.runInContext('_dioOfflineStatus("OFF-1")', ctx);
  assert.ok(r.daysLeft <= 3, 'OFF-2 ka cache OFF-1 ko 99 din na de');
});

// ── Regression guards (khamiyan wapas na aayen) ─────────────────
test('app-core initApp lock PIN ko nahi mitata', () => {
  assert.ok(!/removeItem\(\s*'digital_io_pin_hash'\s*\)/.test(read('app-core.js')),
    'PIN-wipe wapas aa gayi to app-lock (Khami 3) mar jata hai');
});

test('shahadat ke liye koi getPublicUrl baqi nahi', () => {
  for (const f of ['data-api.js', 'cases.js', 'offline-store.js']) {
    assert.ok(!read(f).includes('getPublicUrl'), f + ' me getPublicUrl wapas aa gaya');
  }
});

test('CSP me unsafe-eval nahi', () => {
  assert.ok(!read('vercel.json').includes('unsafe-eval'), 'unsafe-eval wapas nahi aana chahiye');
});

test('naye hifazati module SW precache me hain (offline zaroori)', () => {
  const sw = read('sw.js');
  for (const f of ['secure-storage.js', 'license-token.js', 'error-handler.js']) {
    assert.ok(sw.includes("'/" + f + "'"), f + ' sw.js CORE_ASSETS me hona chahiye');
  }
});

test('index.html admin.js ko sab ke liye load nahi karti', () => {
  assert.ok(!/<script[^>]+src="admin\.js"/.test(read('index.html')),
    'admin.js dobara sab ke liye static load ho gaya (Khami 11)');
});

// ── Mo'attali ka gate (user ka taqaza: mo'attal afsar andar na aaye) ──
test('mo\'attali ka check DURUST column (is_suspended) par hai', () => {
  const a = read('auth.js');
  assert.ok(/_dioIsSuspended/.test(a), 'mushtarik helper mojood hona chahiye');
  assert.ok(/o\.is_suspended === true/.test(a), 'is_suspended dekhna chahiye');
  // purana bug: sirf `currentOfficer.suspended` dekhna (DB column is_suspended hai)
  assert.ok(!/currentOfficer\.suspended === true/.test(a),
    'purana ghalat-column check wapas aa gaya — gate phir mar jayega');
});

test('_dioIsSuspended dono naam aur string shakl pakRta hai', () => {
  const ctx = makeSandbox();
  vm.runInContext(read('auth.js').match(/function _dioIsSuspended[\s\S]*?\n}/)[0], ctx);
  const f = (o) => vm.runInContext('_dioIsSuspended(' + JSON.stringify(o) + ')', ctx);
  assert.strictEqual(f({ is_suspended: true }), true);
  assert.strictEqual(f({ is_suspended: 'true' }), true);
  assert.strictEqual(f({ suspended: true }), true);          // purane record
  assert.strictEqual(f({ is_suspended: false }), false);
  assert.strictEqual(f({}), false);
  assert.strictEqual(f(null), false);
});

test('offline raasta bhi mo\'attal afsar ko rokta hai', () => {
  const a = read('auth.js');
  const fn = a.slice(a.indexOf('async function _dioOfflineRestore'),
                     a.indexOf('window._dioOfflineRestore'));
  assert.ok(/_dioIsSuspended\(officer\)/.test(fn),
    'offline restore me mo\'attali check hona chahiye warna internet band kar ke bypass');
  assert.ok(/_dioPurgeOnSuspend/.test(fn), 'cached session saaf honi chahiye');
});

test('suspended par daakhla band, magar expired par view-only barqarar (4E)', () => {
  const s = read('subscription.js');
  assert.ok(/sub\.status === 'suspended'/.test(s), 'suspended par daakhla rukna chahiye');
  assert.ok(/showSubscriptionRequired\(sub\)/.test(s), 'tajdeed ka safha dikhna chahiye');
  // 4E ka faisla: expired par poora lock NA ho
  assert.ok(!/sub\.status === 'expired'[\s\S]{0,80}showSubscriptionRequired/.test(s),
    'expired par poora lock 4E ke faisle ke khilaf hai');
});

test('SQL write-gate mo\'attali aur manzoori dono dekhti hai', () => {
  const g = read('sql/50_suspend_hard_gate.sql');
  assert.ok(/is_suspended/.test(g), 'is_suspended check zaroori');
  assert.ok(/is_approved/.test(g), 'is_approved check zaroori');
  assert.ok(/role = 'superadmin'/.test(g), 'maalik mustasna rehna chahiye');
  // purana masla: admin ko poora mustasna kar dena
  assert.ok(!/role in \('superadmin', 'admin'\)/.test(g),
    'admin ko poora mustasna karna = mo\'attal admin likh sakega');
});

// ── Jaiza-2 me mile masail (regression guards) ──────────────────
test('IndexedDB: auth.js aur secure-storage.js alag DB — store takraao nahi', () => {
  const a = read('auth.js'), ss = read('secure-storage.js');
  const dbA = (a.match(/indexedDB\.open\('([^']+)'/) || [])[1];
  const dbS = (ss.match(/var DB = '([^']+)'/) || [])[1];
  assert.ok(dbA && dbS, 'dono DB naam milne chahiyen');
  assert.notStrictEqual(dbA, dbS,
    'aik hi DB + alag store = aik encryption layer khamoshi se mar jati hai');
});

test('token/PIN login bhi mo\'attali gate se guzarta hai', () => {
  const a = read('auth.js');
  const fn = a.slice(a.indexOf('async function _dioLoginWithToken'),
                     a.indexOf('async function _dioOfflineRestore'));
  assert.ok(/_dioIsSuspended/.test(fn), 'PIN/biometric raasta gate ke baghair tha');
  assert.ok(/_dioNotApproved/.test(fn), 'manzoori bhi yahin check honi chahiye');
});

test('offline restore officer snapshot na ho to andar na aane de', () => {
  const a = read('auth.js');
  const fn = a.slice(a.indexOf('async function _dioOfflineRestore'), a.indexOf('window._dioOfflineRestore'));
  assert.ok(/if \(!officer\)[\s\S]{0,120}return false/.test(fn),
    'officer cache mita kar bypass mumkin tha — fail-closed hona chahiye');
  assert.ok(!/role: 'officer' \}/.test(fn), 'saaf default officer banana bypass deta hai');
});

test('mo\'attal afsar par write-guard ka flag zabardasti lagta hai', () => {
  const s = read('subscription.js');
  assert.ok(/DIO\.sub\._blocked = true/.test(s),
    'sirf div badalna kaafi nahi tha — print/write khule reh jate the');
});

test('offline cache bina officer-binding ke qabool na ho', () => {
  const ctx = makeSandbox(false);
  const src = read('subscription.js');
  vm.runInContext(src.slice(src.indexOf('const _SUB_CACHE_KEY'),
                            src.indexOf('// ── SUBSCRIPTION CHECK ON LOGIN')), ctx);
  // `o` field hata kar har afsar par lagane ki koshish
  ctx.localStorage.setItem('dio_sub_cache', JSON.stringify({ s:'active', d:99999, p:'x', t:Date.now() }));
  const r = vm.runInContext('_dioReadSubCache("OFF-1")', ctx);
  assert.strictEqual(r, null, 'bina `o` wala cache qabool nahi hona chahiye');
});

test('ghari peeche karne se miyaad na baRhe', () => {
  const ctx = makeSandbox(false);
  const src = read('subscription.js');
  vm.runInContext(src.slice(src.indexOf('const _SUB_CACHE_KEY'),
                            src.indexOf('// ── SUBSCRIPTION CHECK ON LOGIN')), ctx);
  ctx.localStorage.setItem('dio_hw_clock', String(Date.now()));          // asli waqt yaad
  ctx.localStorage.setItem('dio_sub_cache', JSON.stringify(
    { s:'active', d:10, p:'x', o:'OFF-1', t: Date.now() - 5*86400000 }));
  const r = vm.runInContext('_dioReadSubCache("OFF-1")', ctx);
  assert.ok(r.daysLeft <= 5, 'cache 10 din, 5 guzre → 5 se zyada na mile, mila: ' + r.daysLeft);
});

test('admin panel durust column (is_suspended) dekhta hai', () => {
  const a = read('admin.js');
  assert.ok(!/[^_.]\bo\.suspended\b/.test(a.replace(/o\.is_suspended \|\| o\.suspended/g, '')),
    'admin.js me bhi wahi column bug tha — mo\'attal afsar nazar hi nahi aata tha');
});

test('mo\'attali ke columns client denylist me hain', () => {
  const d = read('data-api.js');
  for (const c of ['is_suspended', 'suspension_reason'])
    assert.ok(d.includes("'" + c + "'"), c + ' _OFFICER_PROTECTED me hona chahiye');
});

test('sanitizer https/mailto/blob nahi kaatta, javascript: kaatta hai', () => {
  const m = read('dio-html.js').match(/ALLOWED_URI_REGEXP: (\/.*\/i),/);
  assert.ok(m, 'regexp milna chahiye');
  const re = eval(m[1]);
  for (const u of ['https://x.co/a.png', 'http://x.co', 'mailto:a@b.c', 'blob:x', '/rel.png'])
    assert.ok(re.test(u), u + ' kaatna nahi chahiye (tasveerain/link tootte hain)');
  for (const u of ['javascript:alert(1)', 'vbscript:x'])
    assert.ok(!re.test(u), u + ' rukna chahiye');
});

test('zimni print picker button poora hataata hai (awara ▾ na aaye)', () => {
  const z = read('zimni.js');
  assert.ok(/_zimniSafePrint/.test(z), 'print helper hona chahiye');
  assert.ok(/<button\\b\[\^>\]\*>\[\\s\\S\]\*\?<\\\/button>/.test(z) || /button\\b/.test(z),
    'button poora (text samet) nikalna chahiye, warna adaalati kaghaz par ▾ chhapta hai');
});

test('error log nijji maloomat redact karta hai', () => {
  const src = read('error-handler.js');
  const ctx = makeSandbox();
  vm.runInContext(src.match(/function _redact\(t\) \{[\s\S]*?\n  \}/)[0], ctx);
  const out = vm.runInContext(
    '_redact("fail 35202-1234567-1 / 03001234567 / a@b.com / password: hunter2")', ctx);
  for (const bad of ['35202-1234567-1', '03001234567', 'a@b.com', 'hunter2'])
    assert.ok(!out.includes(bad), bad + ' log me nahi jana chahiye');
});

test('client_errors dusre afsar ke naam par darj na ho sake', () => {
  // Tabsare (-- ...) hata kar sirf ASAL SQL jaanchein — warna purane
  // code ka zikr karne wala comment hi test fail kar deta hai.
  const g = read('sql/30_client_errors_optional.sql')
    .split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  assert.ok(!/with check \(\s*true\s*\)/.test(g), 'with check(true) = kisi bhi officer_id par likh do');
  assert.ok(/auth\.uid\(\)/.test(g), 'officer_id auth.uid() se bandha hona chahiye');
});

test('debug banner innerHTML istemaal nahi karta', () => {
  assert.ok(!/b\.innerHTML \+=/.test(read('index.html')),
    'error banner me innerHTML = DOM XSS ka raasta');
});
