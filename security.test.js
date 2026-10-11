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

// ══ Round-3: nazam ki gehri khamiyan ═══════════════════════════
test('subscriptions client whitelist se nikali gayi (gate ki apni table)', () => {
  const s = read('subscription.js');
  const m = s.match(/_DIO_WRITE_WL = \{([^}]*)\}/);
  assert.ok(m, 'whitelist milni chahiye');
  assert.ok(!/\bsubscriptions\b/.test(m[1]),
    'gate ka faisla subscriptions se hota hai — wahi table khuli rakhna poora nafaz khatam kar deta hai');
});

test('subscriptions DB par bhi lock hai aur tajdeed RPC se hoti hai', () => {
  const g = read('sql/60_subscriptions_lockdown.sql');
  assert.ok(/alter table public\.subscriptions enable row level security/.test(g));
  assert.ok(/dio_request_subscription/.test(g), 'tajdeed ka mehfooz raasta hona chahiye');
  assert.ok(!/create policy[\s\S]{0,200}for (insert|update|delete) to authenticated/.test(g),
    'authenticated ke liye koi write policy nahi honi chahiye');
});

test('officers trigger INSERT + DELETE bhi cover karta hai', () => {
  const g = read('sql/21_officers_protect_v2.sql');
  assert.ok(/before insert or update or delete/.test(g),
    'sirf UPDATE par trigger = INSERT se superadmin ban jana mumkin');
  assert.ok(/officers_user_id_uidx/.test(g), 'har user ka aik hi record (exists-check ka tahaffuz)');
  assert.ok(/sirf apni profile/.test(g), 'dusre afsar ki row mehfooz honi chahiye');
});

test('50: is_approved NULL par fail-CLOSED', () => {
  const g = read('sql/50_suspend_hard_gate.sql');
  assert.ok(/coalesce\(o\.is_approved,\s*false\)/.test(g),
    'coalesce(..., true) = NULL wala afsar manzoor maan liya jata');
});

test('active + NULL miyaad par lockout na ho', () => {
  for (const f of ['sql/50_suspend_hard_gate.sql', 'sql/10_subscription_enforcement.sql'])
    assert.ok(/expires_at is null or s\.expires_at > now\(\)/.test(read(f)),
      f + ': NULL miyaad par asli paying afsar block ho jata tha');
});

test('41 rollback sirf apne enable kiye tables par chalta hai', () => {
  const g = read('sql/41_rls_enable_safe_ROLLBACK.sql');
  assert.ok(/dio_migration_state/.test(g),
    'bina record ke rollback un tables ki RLS bhi band kar deta jo pehle se mehfooz theen');
});

test('41 un tables ko chhoRta hai jin par pehle se policies hain', () => {
  const g = read('sql/41_rls_enable_safe.sql');
  assert.ok(/pg_policy[\s\S]{0,200}raise warning/.test(g),
    'dormant per-officer policies par allow-all lagana unhein hamesha be-asar kar deta');
});

test("status 'none' bhi block kare (fail-closed)", () => {
  const s = read('subscription.js');
  assert.ok(/status === 'none'/.test(s),
    "'none' par guard band ho jata tha — cache mita kar offline jana kaafi tha");
});

test('grace khud-tajdeed na ho (aik hi baar)', () => {
  const s = read('subscription.js');
  assert.ok(/dio_grace_start/.test(s), 'grace ka aaghaz mehfooz hona chahiye');
  assert.ok(/localStorage\.removeItem\('dio_grace_start'\)/.test(s),
    'kamyab online tasdeeq par grace reset hona chahiye');
});

test('license token officer se BANDHA ho (fail-closed)', () => {
  const s = read('subscription.js');
  assert.ok(/!\(oid && lic\.officerId && lic\.officerId === oid\)/.test(s),
    'short-circuit se dusre afsar ka token qabool ho jata tha');
});

test('storage aur rpc bhi write-guard me hain', () => {
  const s = read('subscription.js');
  assert.ok(/storage\.from = function/.test(s),
    'storage.from khula tha — mo\'attal afsar files upload karta rehta');
  assert.ok(/supabaseClient\.rpc = function/.test(s), 'rpc bhi guard me hona chahiye');
});

test('write-guard fauran lagta hai (3 second ka window nahi)', () => {
  const s = read('subscription.js');
  assert.ok(/try \{ _installDioWriteGuard\(\); \} catch/.test(s),
    'sirf setTimeout(...,3000) = shuru ke 3 second me har write bila rok');
});

test('SW navigate apni key par cache kare (poisoning nahi)', () => {
  const g = read('sw.js');
  assert.ok(/cache\.put\(event\.request, clone\)/.test(g),
    "har navigation ka jawab '/index.html' par likhna = app ka shell badal jata");
  assert.ok(/navUrl\.origin !== self\.location\.origin/.test(g), 'bahar ke safhe chhoRne chahiyen');
});

test('offline queue mustaqil ghalti par rukti hai aur ittila deti hai', () => {
  const g = read('offline-store.js');
  assert.ok(/status === 'failed'|'failed'/.test(g), 'mustaqil nakaami alag honi chahiye');
  assert.ok(/attempts >= 5/.test(g), 'koshishon ki hadd honi chahiye');
  assert.ok(/getFailed/.test(g), 'afsar ko rad-shuda andraaj dikhne chahiyen');
});

test('edge function mo\'attali/manzoori jaanchta hai aur admin bila-shart nahi', () => {
  const g = read('supabase/functions/dio-license/index.ts');
  assert.ok(/is_suspended, is_approved/.test(g), 'sirf id,role parhna = mo\'attal ko token mil jata');
  assert.ok(/error: "not_entitled"/.test(g), 'bila-haq par dastkhat nahi hona chahiye');
  assert.ok(/const isOwner\s*=\s*officer\.role === "superadmin"/.test(g),
    'admin ko superadmin ke sath mustasna karna wahi purani khami thi');
  assert.ok(!/String\(e && \(e as Error\)\.message/.test(g), 'andarooni ghalti bahar na jaye');
});

// ══ MOBILE + RAFTAAR (round-4) ═════════════════════════════════
test('mobile ki files jur gayi hain (html + service worker)', () => {
  const h = read('index.html');
  for (const f of ['mobile.css', 'mobile.js', 'boot.js'])
    assert.ok(h.includes(f), f + ' index.html me honi chahiye');
  const sw = read('sw.js');
  for (const f of ['mobile.css', 'mobile.js', 'boot.js'])
    assert.ok(sw.includes("'/" + f + "'"), f + ' sw precache me — warna offline par nahi milegi');
});

test('form mode kaghaz ki paki chauRai khatam karta hai', () => {
  const c = read('mobile.css');
  assert.ok(/html\.dio-mform #ch173-doc[\s\S]{0,200}width:\s*100%/.test(c),
    'A4 ki 8.5in chauRai fon par 2.18x overflow deti thi');
  assert.ok(/tr\.zf-blk/.test(c), 'har andraaj card banna chahiye');
});

test('CHHAPAI par mobile ka koi asar na ho (kaghaz A4/Legal rahe)', () => {
  const c = read('mobile.css');
  // Ab file me AIK se ZYADA @media print block hain (zimni + challan form).
  // `lastIndexOf` aakhri wala pakaR leta tha — is liye SAB print blocks jorte hain.
  const printBlock = c.split('@media print').slice(1).join('\n@media print');
  for (const [sel, val] of [['table\\.zf-tbl', 'display: table'],
                            ['tbody', 'display: table-row-group'],
                            ['tr', 'display: table-row'],
                            ['td', 'display: table-cell']])
    assert.ok(new RegExp(sel + '[\\s\\S]{0,160}' + val).test(printBlock),
      'print me ' + sel + ' wapas ' + val + ' hona chahiye');
  assert.ok(/td::before\s*\{\s*content:\s*none/.test(printBlock),
    'mobile ke unwan kaghaz par nahi chhapne chahiyen');
  assert.ok(/\.dio-mbar,\s*\.dio-addblk,\s*\.dio-thumbbar\s*\{\s*display:\s*none/.test(printBlock),
    'mobile ke button kaghaz par nahi aane chahiyen');
});

test('form mode me koi DOM node hilayi nahi jati (save/print mehfooz)', () => {
  const j = read('mobile.js');
  assert.ok(!/appendChild\(\s*(body|cell|td|tr)\b/.test(j),
    'dastavez ke node hilana save ke waqt content gum kar sakta hai');
  assert.ok(/classList\.toggle\('dio-mform'/.test(j), 'sirf class lagni chahiye');
});

test('boot.js window._pages par inhesar na kare', () => {
  // Tabsare hata kar sirf ASAL code jaancho — warna khami ka zikr
  // karne wala comment hi test fail kar deta hai.
  const j = read('boot.js')
    .split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/window\._pages/.test(j),
    'app-core me `const _pages` hai — window par aata hi nahi, is liye har safha lazy ban jata tha');
  assert.ok(/loadedAlready/.test(j), 'script mojood hai ya nahi — yahi mehfooz sawal hai');
});

test('bhaari module blocking list se nikal gaye', () => {
  const h = read('index.html');
  for (const f of ['zimni.js', 'report173.js', 'naqsha-mauqa.js', 'saza-slip.js', 'templates.js'])
    assert.ok(!new RegExp('<script defer src="' + f.replace('.', '\\.') + '"').test(h),
      f + ' abhi bhi DOMContentLoaded rok raha hai');
  const bt = read('boot.js');
  for (const f of ['zimni.js', 'report173.js'])
    assert.ok(bt.includes("'" + f + "'"), f + ' boot.js ki fursat-list me hona chahiye');
});

test('har lazy safhe ki file boot.js ke naqshe me hai', () => {
  const bt = read('boot.js');
  const map = bt.slice(bt.indexOf('var PAGE_SRC'), bt.indexOf('function ensurePage'));
  const files = [...map.matchAll(/'([a-z0-9-]+\.js)'/g)].map(m => m[1]);
  assert.ok(files.length >= 10, 'kam az kam 10 safhe lazy hone chahiyen, mile: ' + files.length);
  // NOTE: deliver kiya gaya ZIP me sirf BADLI hui files hoti hain, is liye
  // yahan wahi jaanchte hain jo mojood hain. Poore repo me (deploy ke baad)
  // ye check har file par lagta hai — lazy file ka 404 = safha hi na khule.
  let checked = 0;
  for (const f of files) {
    if (!fs.existsSync(path.join(ROOT, f))) continue;   // package me nahi — repo me hai
    checked++;
    assert.ok(fs.statSync(path.join(ROOT, f)).size > 0, f + ' khali hai');
  }
  assert.ok(checked >= 8, 'kam az kam 8 lazy files jaanchi jani chahiyen, jaanchi: ' + checked);
});

// ══ CHALLAN KA MOBILE FORM (round-5) ═══════════════════════════
test('zimni ka form-mode CSS SIRF .zf-editor par (challan mehfooz)', () => {
  const c = read('mobile.css');
  const bad = c.split('\n').filter((l) =>
    /#ch173-doc(?!\.zf-editor)/.test(l) && !l.trim().startsWith('/*') && !l.trim().startsWith('*'));
  assert.strictEqual(bad.length, 0,
    'zimni aur challan ka id AIK hi (ch173-doc) hai — bina .zf-editor ke qaida challan par bhi lagta hai, ' +
    'aur `width:100% !important` `_printR173` ki inline 8.5in naap ko HARA deta hai. Mile: ' + bad.join(' | '));
});

test('challan ke apne khane (amoodi likhayi) CSS se chhue na jayen', () => {
  const c = read('mobile.css');
  for (const sel of ['.rotinner', '.rotclip', '.cellbox', '.normwrap', '.ch173-table'])
    assert.ok(!new RegExp('\\' + sel + '\\s*[,{]').test(c),
      sel + ' ko mobile.css chhu rahi hai — challan ki px-naap toot sakti hai');
});

test('challan form kaghaz ko display:none se NAHI chhupata', () => {
  const j = read('challan-form.js');
  const fn = j.slice(j.indexOf('function show(formOn)'), j.indexOf('function restoreForPrint'));
  assert.ok(/style\.height = '0'/.test(fn), 'collapse height:0 se hona chahiye');
  assert.ok(!/style\.display\s*=\s*'none'/.test(fn),
    "display:none se element ki naap 0 ho jati hai — `_printR173` ki chhapai toot jati hai");
});

test('challan form asal [data-k] node me likhta hai (save/print wahi parhte hain)', () => {
  const j = read('challan-form.js');
  assert.ok(/node\.innerHTML = el\.innerHTML/.test(j),
    'form ko asal document ke khane me likhna chahiye, warna save me kuch na jata');
  assert.ok(!/appendChild\(node\)|insertBefore\(node/.test(j),
    'dastavez ke node hilana save ke waqt content gum kar sakta hai');
});

test('chhapai par kaghaz wapas khulta hai (hawale se, parent se nahi)', () => {
  const j = read('challan-form.js');
  assert.ok(/window\.addEventListener\('beforeprint'/.test(j), 'beforeprint par bahaal hona chahiye');
  const fn = j.slice(j.indexOf('function restoreForPrint'), j.indexOf("window.addEventListener('beforeprint'"));
  assert.ok(/_wrapEl/.test(fn) && !/doc\.parentElement/.test(fn),
    'beforeprint par app dastavez ko #dio-nprint-host me le jati hai — parentElement us waqt GHALAT dabba deta hai');
});

test('challan form ka intikhab yaad rehta hai', () => {
  const j = read('challan-form.js');
  assert.ok(/dio_challan_view/.test(j), 'afsar ka intikhab mehfooz hona chahiye');
  assert.ok(/show\(wantForm\(\)\)/.test(j),
    'refresh har baar zabardasti form na khole — warna "کاغذ" chunna bekaar ho jata hai');
});

test('challan-form.js jur gayi (html + sw)', () => {
  assert.ok(read('index.html').includes('challan-form.js'));
  assert.ok(read('sw.js').includes("'/challan-form.js'"), 'offline par bhi milni chahiye');
});

// ══ PESHA-WARANA SHAKL (round-6) ═══════════════════════════════
test('login ki hifazati satar ka BIDI masla band', () => {
  const h = read('index.html');
  const i = h.indexOf('256-bit AES Encrypted');
  assert.ok(i > -1, 'satar mojood honi chahiye');
  const around = h.slice(Math.max(0, i - 260), i);
  assert.ok(/dir="ltr"/.test(around) && /unicode-bidi:\s*isolate/.test(around),
    'RTL khane me angrezi satar toot kar "bit … -256" ban jati thi — dir=ltr + isolate lazmi');
});

test('login ke asal button me emoji nahi', () => {
  const h = read('index.html');
  const seg = h.slice(h.indexOf('id="login-submit-btn"'), h.indexOf('id="login-submit-btn"') + 300);
  assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(seg), 'CTA me emoji ghair-pesha-warana lagta hai');
  assert.ok(/محفوظ لاگ اِن/.test(seg), 'CTA Urdu me hona chahiye (app Urdu-first hai)');
});

test('dashboard se sawal aur nukta hat gaye, AYAT barqarar', () => {
  const d = read('dashboard.js');
  assert.ok(!/\$\{_dashKnowledgeCard\(\)\}/.test(d), 'sawal ka card hat jana chahiye');
  assert.ok(!/\$\{_dashTipOfDay\(\)\}/.test(d), 'nukta ka card hat jana chahiye');
  assert.ok(!/initQARotation\(\)/.test(d), 'uska timer bhi band hona chahiye');
  assert.ok(/_islamicBarHTML\(\)/.test(d), 'Qurani ayat BARQARAR rehni chahiye (afsar ki hidayat)');
});

test('dashboard par koi gehra gradient card nahi bacha', () => {
  const d = read('dashboard.js');
  const bad = (d.match(/background:\s*linear-gradient\(135deg,#[0-9a-f]{6},#[0-9a-f]{6}\)/gi) || []);
  assert.strictEqual(bad.length, 0,
    'aik hi sakreen par kai gehre gradient "sasta" tasur dete the. Mile: ' + bad.join(', '));
});

test('adad HERO hain — un ke element blanket font-size qaide se BAHAR', () => {
  const d = read('dashboard.js');
  // index.html ka qaida `:is(div,span,p,td,th,li,label,a)` par 14px !important
  // thonkta hai (10 `:not(#id)` ki wajah se us ko haraya nahi ja sakta).
  assert.ok(/<b class="dio-stat-num">/.test(d), 'stat ka adad <b> me hona chahiye, span me nahi');
  assert.ok(/<b class="dio-prio-num">/.test(d), 'tarjeeh ka adad <b> me hona chahiye');
  assert.ok(/<b class="dio-sec-h"[^>]*role="heading"/.test(d),
    'unwan <h2> par `font-size: revert` lag jata hai — <b role=heading> chahiye');
  const c = read('theme-pro.css');
  assert.ok(/b\.dio-stat-num\s*\{[^}]*font-size:\s*30px/.test(c), 'adad numayan (30px) hona chahiye');
});

test('theme-pro.css jur gayi (html + sw)', () => {
  assert.ok(read('index.html').includes('theme-pro.css'));
  assert.ok(read('sw.js').includes("'/theme-pro.css'"), 'offline par bhi milni chahiye');
});

/* ═══════════════════════════════════════════════════════════════
   ROUND 4 — Topbar aur baqi safhon ka peshawarana look
   ═══════════════════════════════════════════════════════════════ */

test('topbar me #topbar-title MOJOOD hai (do cheezen is par chalti hain)', () => {
  const h = read('index.html');
  assert.ok(/id="topbar-title"/.test(h),
    'app-core.js is me safhe ka naam likhta hai AUR setupRealtimeSync isi ke ' +
    'matn se faisla karta hai ke mocaddmat/yaad-dihaniyan khuli hain ya nahi. ' +
    'Ise hatane se afsar ko safhe ka naam nazar nahi aata aur live refresh band ho jata hai.');
  const a = read('app-core.js');
  assert.ok(/getElementById\('topbar-title'\)/.test(a), 'app-core isi id par likhta hai');
});

test('chhoti sakreen par safhe ka naam rehta hai, wordmark chhupta hai', () => {
  const c = read('theme-pro.css');
  const m = c.match(/@media \(max-width: 760px\) \{[\s\S]*?\n\}/);
  assert.ok(m, '760px ka media block mojood ho');
  assert.ok(/\.dio-tb-name\s*\{\s*display:\s*none/.test(m[0]),
    'tang jagah par wordmark chhupe — safhe ka naam zyada zaroori hai');
  assert.ok(!/\.dio-tb-sub\s*\{\s*display:\s*none/.test(m[0]),
    'safhe ka naam (#topbar-title) kabhi na chhupe');
});

test('.card-title Urdu ke liye parha ja sakta hai', () => {
  const c = read('theme-pro.css');
  const m = c.match(/\.card-title,\s*\.section-title\s*\{[\s\S]*?\}/);
  assert.ok(m, '.card-title ka qaida mojood ho');
  assert.ok(/text-transform:\s*none/.test(m[0]),
    'uppercase ne "OFFICER INFORMATION CONTACT ADMIN TO UPDATE" bana diya tha');
  assert.ok(/letter-spacing:\s*0/.test(m[0]), 'letter-spacing Urdu ke jurey huroof toRta hai');
  assert.ok(/font-size:\s*13px/.test(m[0]), '10px par Nastaleeq parhi nahi jati');
});

test('settings ka "تعیناتی محفوظ کریں" button toota hua nahi', () => {
  const s = read('settings.js');
  assert.ok(!/getElementById\('set-official-phone'\)\.value/.test(s),
    'ye khana markup me MOJOOD NAHI — seedha .value lene par TypeError aata tha ' +
    'aur poora save button kaam karna chhoR deta tha');
  assert.ok(/const _v = id =>/.test(s), 'mehfooz helper se padha jaye');
});

test('court aur reminders ke header ka <div> theek band hota hai', () => {
  for (const f of ['court.js', 'reminders.js']) {
    const s = read(f);
    assert.ok(!/direction:rtl;"><div style="display:flex;align-items:center;gap:10px;"/.test(s),
      f + ': do <div> khulte the magar aik band hota tha — poora safha header ki ' +
      'flex row me chala jata tha');
    assert.ok(/<div class="page-header"/.test(f === 'court.js' ? s : s), f + ': saaf header ho');
  }
});

test('safha-sazi me emoji nahi bache (dastavez wali files mustasna)', () => {
  const EMO = /[⌚-⏺☀-➿⬀-⯿\u{1F000}-\u{1FAFF}]/u;
  const pages = ['settings.js', 'court.js', 'reminders.js', 'suspects.js',
                 'cases.js', 'templates.js', 'law-library.js', 'bin.js'];
  const bad = [];
  for (const f of pages) {
    read(f).split('\n').forEach((l, i) => { if (EMO.test(l)) bad.push(f + ':' + (i + 1)); });
  }
  assert.strictEqual(bad.length, 0, 'emoji har device par alag dikhte hain. Mile: ' + bad.slice(0, 8).join(', '));
});

test('nishan wale button khali nahi — SVG + aria-label', () => {
  for (const f of ['cases.js', 'templates.js', 'law-library.js', 'fivec.js']) {
    const s = read(f);
    const empty = s.match(/<button\b(?:[^<>]|<(?!\/?button))*?>\s*<\/button>/g) || [];
    assert.strictEqual(empty.length, 0, f + ': khali button mila');
    assert.ok(/aria-label="/.test(s), f + ': nishan wale button par aria-label chahiye');
  }
});

test('dio-states ke nishan SVG hain aur icon bahar se nahi aata', () => {
  const s = read('dio-states.js');
  assert.ok(/var ICON_PATHS = \{/.test(s), 'nishan ka daftar mojood ho');
  assert.ok(!/\+ _esc\(icon\) \+/.test(s),
    'icon ab matn nahi — daftar se aata hai, is liye bahar ka HTML yahan nahi pahunchta');
  assert.ok(/_icon\(icon, 44\)/.test(s), 'empty() daftar hi se nishan le');
  assert.ok(/width:100%/.test(s), 'khali-halat ka dabba poori chauRai le — warna markaz me nahi aata');
});

test('SW ka version bump hua (qaida: har tabdeeli par lazmi)', () => {
  const sw = read('sw.js');
  const m = sw.match(/const CACHE_NAME = 'digital-io-v(\d+)'/);
  assert.ok(m, 'CACHE_NAME mojood ho');
  assert.ok(Number(m[1]) >= 495, 'v495 ya us se aage hona chahiye, mila: v' + m[1]);
  assert.ok(sw.includes('SERVICE WORKER v' + m[1]), 'header ka comment bhi wahi version dikhaye');
});

test('FIR/CNIC jaise angrezi adad LTR khane me hain (RTL me ulat jate the)', () => {
  const c = read('cases.js');
  assert.ok(/unicode-bidi:isolate/.test(c),
    'RTL me "205/2025" ulta "2025/205" parha jata tha — isolate zaroori hai');
});

/* ═══════════════════════════════════════════════════════════════
   ROUND 5 — Afsar ke bataye huay 5 nuqat
   ═══════════════════════════════════════════════════════════════ */

test('1) "واپس" har jagah AIK hi shakl aur AIK hi taraf', () => {
  const h = read('index.html');
  assert.ok(/id="dio-back-btn"[\s\S]{0,400}class="topnav-btn dio-backbtn"|class="topnav-btn dio-backbtn"[\s\S]{0,200}id="dio-back-btn"/.test(h)
            || /id="dio-back-btn" class="topnav-btn dio-backbtn"/.test(h),
    'topbar ka button `dio-backbtn` class istemal kare');
  assert.ok(!/margin-right:auto[^"]*"[^>]*id="dio-back-btn"|id="dio-back-btn"[^>]*margin-right:auto/.test(h),
    'purana `margin-right:auto` (baain kona) na bacha ho');
  assert.ok(/<span>واپس<\/span>/.test(h), 'sirf teer nahi — lafz "واپس" bhi ho');
  // dono overlay bhi wahi class istemal karen
  for (const f of ['doc-viewer.js', 'misal-docs.js']) {
    const s = read(f);
    assert.ok(/class="dio-backbtn"/.test(s), f + ': wahi class ho');
    assert.ok(!/font-size:18px;font-weight:900;line-height:1;direction:ltr;">←</.test(s),
      f + ': purana gol "←" wala button na bacha ho');
  }
  const c = read('theme-pro.css');
  assert.ok(/\.dio-backbtn\s*\{/.test(c), 'shakl aik hi jagah se aaye');
});

test('2) mic — desktop par sust hone ki teeno wajuhat khatam', () => {
  const m = read('global-mic.js');
  assert.ok(/recog\.interimResults = true/.test(m),
    'adhoora matn foran dikhe — warna afsar ko lagta hai mic chal hi nahi raha');
  assert.ok(/id="global-mic-live"|'global-mic-live'/.test(m), 'sunta hua matn dikhane wali patti ho');
  // onend par khud-ba-khud dobara chale
  assert.ok(/if \(!wantOn\) \{ setBtn\(false\); say\(''\); return; \}/.test(m),
    'sirf afsar ke band karne par ruke');
  assert.ok(/setTimeout\(function \(\) \{ if \(wantOn\) spin\(\); \}, 180\);/.test(m),
    'Chrome khud session band kare to chupke se dobara chale');
  // waqti ghalti par band na ho
  assert.ok(/code === 'not-allowed' \|\| code === 'service-not-allowed'/.test(m),
    'sirf ijazat waali ghalti par band ho, no-speech/network par nahi');
  assert.ok(/restarts > 5/.test(m), 'pe-dar-pe nakami par toofan se bachao ho');
  // PAKKA matn hi dastavez mein
  assert.ok(/if \(e\.results\[i\]\.isFinal\)/.test(m), 'aadha lafz zimni mein na jaye');
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(m), 'button par emoji nahi, SVG ho');
});

test('3) talaash likhte waqt cursor na jaye', () => {
  const c = read('cases.js');
  assert.ok(!/oninput="clearTimeout\(window\._csTmr\);window\._csTmr=setTimeout\(\(\)=>renderCases/.test(c),
    'purana `oninput` poora safha dobara banata tha — do-teen harf ke baad cursor nikal jata tha');
  assert.ok(/oninput="_csOnSearch\(this\.value\)"/.test(c), 'ab sirf qatarein badlen');
  assert.ok(/function _csRefreshRows\(\)/.test(c), 'qatarein alag se badalne wala function ho');
  assert.ok(/id="cs-rows"/.test(c), 'tbody ki apni id ho');

  const a = read('data-api.js');
  assert.ok(/document\.activeElement\.id === 'case-search'/.test(a),
    'afsar likh raha ho to background refresh kuch na chheRe');

  const s = read('search.js');
  assert.ok(/if \(q\.length < 3\)/.test(s), 'aik-do harf par server na chale');
  assert.ok(/_keepFocus/.test(s), 'natija aane par cursor khane hi mein rahe');
});

test('4) mocaddmat ka position filter apni jagah qaim rahe', () => {
  const a = read('data-api.js');
  // Ye asal kharabi thi: background refresh `renderCases(c)` bina daleel
  // bulata tha, jis se afsar ka chuna hua filter saaf ho jata tha.
  assert.ok(!/\n\s*renderCases\(c\);\n/.test(a) || /_csRefreshRows\(\);/.test(a),
    'background refresh filter na toRe');
  assert.ok(/typeof _csRefreshRows === 'function'/.test(a), 'sirf qatarein refresh hon');

  const c = read('cases.js');
  assert.ok(/window\._csFilter/.test(c), 'filter ki halat yaad rahe');
  assert.ok(/fStatus\s*=\s*\(fStatus\s*===\s*undefined/.test(c),
    'daleel na di jaye to PICHHLI halat chale, saaf na ho');
  assert.ok(/onchange="_csOnStatus\(this\.value\)"/.test(c), 'filter apne handler se chale');

  const ac = read('app-core.js');
  assert.ok(/if \(_busy\) return;/.test(ac), 'realtime sync likhte waqt safha dobara na banaye');
});

test('5) "+ نیا اندراج" har safhe par DAAIN taraf', () => {
  const css = read('theme-pro.css');
  const m = css.match(/\.dio-add-btn\s*\{[\s\S]*?\}/);
  assert.ok(m, '.dio-add-btn ka qaida mojood ho');
  assert.ok(/order:\s*-1\s*!important/.test(m[0]), 'RTL mein sab se pehle = daain sira');
  assert.ok(/margin-inline-end:\s*0\s*!important/.test(m[0]), 'koi auto margin ise baain na dhakele');

  // kisi safhe mein apna alag qaida na bacha ho
  for (const f of ['cases.js', 'suspects.js', 'admin.js', 'staff-v2.js', 'court.js', 'reminders.js']) {
    const s = read(f);
    const bad = (s.match(/class="[^"]*dio-add-btn[^"]*"\s+style="[^"]*(?:order|margin-left:auto)[^"]*"/g) || []);
    assert.strictEqual(bad.length, 0, f + ': apna alag qaida CSS se larta hai — ' + bad.join(', '));
  }
  // court/reminders ab poori chauRai len (warna button andar chala jata tha)
  assert.ok(!/id="court-root" style="max-width:900px/.test(read('court.js')),
    'court poori chauRai le — warna button 190px andar reh jata tha');
  assert.ok(!/max-width:800px;margin:0 auto;" id="rem-root"/.test(read('reminders.js')),
    'reminders poori chauRai le');
});

test('SW version phir bump hua', () => {
  const sw = read('sw.js');
  const m = sw.match(/const CACHE_NAME = 'digital-io-v(\d+)'/);
  assert.ok(m && Number(m[1]) >= 496, 'v496 ya aage, mila: v' + (m ? m[1] : '?'));
  assert.ok(sw.includes("'/global-mic.js'"), 'mic offline par bhi mile');
});
