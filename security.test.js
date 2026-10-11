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
