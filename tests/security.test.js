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

// ── v529: SQL ke test ab unhi failon par jo ASAL DB par chali hain ──
// (sql/README.md: 20/21/30/41/50/60/70 waale masaude jaan boojh kar repo
//  mein NAHI — unka kaam 91–95 ne liya. Test ab inhi ko jaanchte hain.)
const sqlAmli = (f) => read(f).split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
const SQL_ADMIN_RPC = ['sql/94a_verify_rpc.sql', 'sql/94b_reject_rpc.sql', 'sql/94c_suspend_rpc.sql'];

test('SQL write-gate mo\'attali aur manzoori dono dekhti hai', () => {
  // likhne ki rok (92b): insert/update/delete — RESTRICTIVE, dio_has_active_sub() se
  const g = sqlAmli('sql/92b_add_write_gate.sql');
  for (const cmd of ['insert', 'update', 'delete'])
    assert.ok(new RegExp('as restrictive [\'\\s|]*for ' + cmd + ' to authenticated').test(g),
      cmd + ' par restrictive rok honi chahiye');
  assert.ok(/dio_has_active_sub\(\)/.test(g), 'rok ka faisla server ka function kare');
  // admin ke kaam: mo'attal ya ghair-manzoor admin bhi ruke
  for (const f of SQL_ADMIN_RPC) {
    const r = sqlAmli(f);
    assert.ok(/coalesce\(o\.suspended, false\) = false/.test(r), f + ': mo\'attali ki jaanch');
    assert.ok(/coalesce\(o\.is_approved, false\) = true/.test(r), f + ': manzoori ki jaanch');
    assert.ok(!/role in \('superadmin', 'admin'\)/.test(r),
      f + ': admin ko poora mustasna karna = mo\'attal admin likh sakega');
  }
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

test('client_errors: anon sirf likh sake, parh na sake — aur koi khuli policy nahi', () => {
  // client_errors ki apni policy DB mein pehle se hai (README: file 30 repo mein nahi).
  // Repo se jo jaancha ja sakta hai: anon ko sirf INSERT, aur kahin with check(true) nahi.
  const a = sqlAmli('sql/81_anon_lockdown.sql');
  assert.ok(/grant insert on public\.client_errors to anon/.test(a), 'login se pehle ki ghalti bhi darj ho');
  assert.ok(!/grant (select|update|delete|all)[^;]*client_errors[^;]*to anon/.test(a),
    'anon kisi aur ki ghaltiyan parh/badal na sake');
  // ROLLBACK failen jaan boojh kar purani halat lautati hain — wo mustasna
  for (const f of fs.readdirSync(path.join(ROOT, 'sql')).filter((x) => x.endsWith('.sql') && !/ROLLBACK/.test(x)))
    assert.ok(!/with check \(\s*true\s*\)/i.test(sqlAmli('sql/' + f)),
      f + ': with check(true) = kisi bhi officer_id par likh do');
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
  const g = sqlAmli('sql/95_subs_lockdown.sql');
  assert.ok(/drop policy if exists "Officers own subs"\s+on public\.subscriptions/.test(g),
    'afsar ki apni likhne wali ALL policy hatni chahiye (khud ko trial de leta tha)');
  assert.ok(!/create policy/.test(g), 'subscriptions par koi nayi likhne wali policy nahi');
  assert.ok(/raise exception 'RUKA/.test(g), 'parhne ka raasta na bache to ruk jaye');
  // chaaron raaste security definer RPC
  for (const [f, fn] of [['sql/94a_verify_rpc.sql', 'dio_verify_subscription'],
                         ['sql/94b_reject_rpc.sql', 'dio_reject_subscription'],
                         ['sql/94c_suspend_rpc.sql', 'dio_suspend_subscription'],
                         ['sql/94d_request_rpc_fix.sql', 'dio_request_subscription']]) {
    const r = sqlAmli(f);
    assert.ok(new RegExp('function public\\.' + fn + '\\(').test(r), f + ': ' + fn);
    assert.ok(/security definer/.test(r) && /set search_path = pg_catalog, public, pg_temp/.test(r),
      f + ': security definer + mehfooz search_path');
  }
});

test('officers: khatarnak masauda (auth.uid() is null = sab ijazat) kabhi wapas na aaye', () => {
  // README: 20/21 waale trigger anon ko bhi raasta de dete (anon ka uid bhi null).
  // DB ka mojooda dio_protect_officers() current_user = 'service_role' dekhta hai.
  for (const f of ['20_officers_protect_trigger.sql', '21_officers_protect_v2.sql'])
    assert.ok(!fs.existsSync(path.join(ROOT, 'sql', f)), f + ' repo mein na aaye (README: khatarnak)');
  for (const f of fs.readdirSync(path.join(ROOT, 'sql')).filter((x) => x.endsWith('.sql')))
    assert.ok(!/auth\.uid\(\)\s+is\s+null\s+then\s+return/i.test(sqlAmli('sql/' + f)),
      f + ': uid null ko server maan kar chhoot dena = anon ko poora raasta');
});

test('is_approved NULL par fail-CLOSED (har server function mein)', () => {
  for (const f of [...SQL_ADMIN_RPC, 'sql/94d_request_rpc_fix.sql', 'sql/91a_function.sql']) {
    const r = sqlAmli(f);
    assert.ok(/coalesce\((o|new)\.is_approved,\s*false\)/.test(r), f + ': NULL = ghair-manzoor');
    assert.ok(!/coalesce\([\w.]*is_approved,\s*true\)/.test(r),
      f + ': coalesce(..., true) = NULL wala afsar manzoor maan liya jata');
  }
});

test('active/trial ko server hamesha miyaad deta hai (NULL miyaad na bane)', () => {
  // purana masla: active + NULL expires_at par asli paying afsar block ho jata.
  // Ab dono raaste server par expires_at khud likhte hain.
  assert.ok(/'trial', now\(\), now\(\) \+ interval '30 days'/.test(sqlAmli('sql/91a_function.sql')),
    'manzoori par trial: 30 din ki miyaad ke sath');
  const v = sqlAmli('sql/94a_verify_rpc.sql');
  assert.ok(/status\s+= 'active'/.test(v) && /expires_at\s+= now\(\) \+ make_interval\(days => _days\)/.test(v),
    'manzoor sabscription: miyaad plan ke dinon se');
  assert.ok(/coalesce\(sp\.duration_days, 30\)/.test(v), 'plan ke din na hon to bhi 30 din');
});

test('93 rollback sirf unhi tables par chalta hai jin par 93b ne RLS lagai', () => {
  const list = (f, name) => {
    const m = new RegExp(name + ' text\\[\\] := array\\[([\\s\\S]*?)\\]').exec(read(f));
    assert.ok(m, f + ': fehrist milni chahiye');
    return [...m[1].matchAll(/'([a-z_0-9]+)'/g)].map((x) => x[1]).sort();
  };
  const on = list('sql/93b_enable_rls.sql', 'band');
  const off = list('sql/93_ROLLBACK.sql', 'band');
  assert.deepStrictEqual(off, on,
    'wapsi ki fehrist alag ho to pehle se mehfooz tables ki RLS bhi band ho jati');
  assert.ok(!/officers|subscriptions'/.test(off.join(',')), 'officers/subscriptions wapsi mein na hon');
});

test('93b: bina policy wali table par RLS on na kare, aur allow-all na lagaye', () => {
  const g = sqlAmli('sql/93b_enable_rls.sql');
  assert.ok(/pg_policy[\s\S]{0,200}polpermissive[\s\S]{0,120}raise warning/.test(g),
    'policy ke baghair RLS on = sab kuch band — aisi table chhoR kar khabar de');
  assert.ok(!/create policy/.test(g), 'yahan koi allow-all policy nahi banni chahiye');
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
  // v552: form mode ke tamam qaide SIRF screen par — chhapai par lagte hi nahi. Pehle print
  //   block `border: revert` se ضمنی ki کالم lakeeren mita deta tha (chhapai ke waqt safha
  //   ~816px hota hai, is liye `dio-mform` lag jata). `revert` mamnoo (v397).
  const printBlocks = c.split('@media print').slice(1).map(b => b.slice(0, b.indexOf('\n}') + 2));
  assert.ok(printBlocks.length >= 1, 'print block mojood');
  for (const b of printBlocks) {
    assert.ok(!/revert/.test(b), 'print me `revert` mamnoo');
    assert.ok(!/dio-mform/.test(b), 'print me form mode ka koi qaida nahi (kaghaz ki shakl ضمنی/چالان ki apni CSS)');
  }
  const printBlock = printBlocks.join('\n');
  assert.ok(/\.dio-mbar,\s*\.dio-addblk,\s*\.dio-thumbbar\s*\{\s*display:\s*none/.test(printBlock),
    'mobile ke button kaghaz par nahi aane chahiyen');
  // har `html.dio-mform` qaida kisi `@media screen` ke andar
  const noComments = c.replace(/\/\*[\s\S]*?\*\//g, '');
  const screenStart = noComments.indexOf('@media screen and (max-width: 900px) {');
  const firstMform = noComments.indexOf('html.dio-mform');
  assert.ok(screenStart !== -1 && firstMform > screenStart, 'form mode screen-only');
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
  // Block comment POORA nikalo — warna comment mein likhi wazahat
  // (jo khud is qaide ki yaad-dihani hai) test ko toR deti hai.
  const c = read('mobile.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const bad = c.split('\n').filter((l) => /#ch173-doc(?!\.zf-editor)/.test(l));
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

test('dashboard se sawal aur nukta hat gaye; Quran/Hadith SIRF landing par', () => {
  const d = read('dashboard.js');
  assert.ok(!/\$\{_dashKnowledgeCard\(\)\}/.test(d), 'sawal ka card hat jana chahiye');
  assert.ok(!/\$\{_dashTipOfDay\(\)\}/.test(d), 'nukta ka card hat jana chahiye');
  assert.ok(!/initQARotation\(\)/.test(d), 'uska timer bhi band hona chahiye');
  // Oct 2026 hidayat: islamic patti system ke andar se hata kar SIRF landing par
  assert.ok(!/_islamicBarHTML|initIslamicMessages|islamic-bar/.test(d), 'dashboard par islamic patti nahi');
  assert.ok(!/initIslamicMessages/.test(read('app-core.js')), 'app-core islamic timer nahi chalata');
  const h = read('index.html');
  const land = h.slice(h.indexOf('id="login-screen"'), h.indexOf('MAIN APP'));
  assert.ok(/id="dio-zikr"/.test(land), 'landing par Quran/Hadith ki jagah');
  const z = land.indexOf('id="dio-zikr"'), ul = land.indexOf('dio-land-feats'), lead = land.indexOf('dio-land-lead');
  assert.ok(z < ul && ul < lead, 'tarteeb: zikr → 4 card → taarufi satar');
  const js = read('islamic-landing.js');
  assert.ok(/HOLD_MS = 30000/.test(js), 'har ayat/hadith kam az kam 30 second');
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

/* ═══════════════════════════════════════════════════════════════
   ROUND 6 — Chip ki tanhai, murda code, rang ka waahid zaria
   ═══════════════════════════════════════════════════════════════ */

test('har chip ki APNI shart — koi chip doosri ko mitati nahi', () => {
  // MULZIMAAN
  const s = read('suspects.js');
  assert.ok(/const _suspFilter = \{ type: '', q: '' \}/.test(s),
    'is safhe ki apni halat ho \u2014 chip aur talaash ke ALAG khane');
  assert.ok(/function _suspVisible\(\)/.test(s), 'dono shartein AIK hi raaste se guzren');
  assert.ok(!/const people = window\._suspectsCache \|\| \[\];\n  q =/.test(s),
    'purana tareeqa: talaash poori fehrist se chhaanti thi aur chip ko mita deti thi');
  // chip sirf apna khana bhare
  assert.ok(/_suspFilter\.type = type \|\| '';\n  _suspRender\(\)/.test(s));
  assert.ok(/_suspFilter\.q = \(q \|\| ''\)\.toLowerCase\(\)\.trim\(\);\n  _suspRender\(\)/.test(s));

  // TEMPLATES
  const t = read('templates.js');
  assert.ok(/function _tplVisible\(\)/.test(t), 'aik hi chhaanne wala raasta');
  assert.ok(/let _tplQuery = ''/.test(t), 'talaash ka apna khana');
});

test('MASTER fehrist kabhi adal-badal na ho (sab se khatarnak amal)', () => {
  const t = read('templates.js');
  // asal code mein ye satr nahi honi chahiye (sirf comment mein wazahat)
  // block comment poora nikalo — warna comment mein likhi wazahat hi test toR deti hai
  const code = t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/const saved = _tplList; _tplList = list;/.test(code),
    'ASAL fehrist ko chand lamhon ke liye chhota kar dena \u2014 us darmiyan koi ' +
    'doosra kaam adhoori fehrist ko "sab kuch" samajh leta tha');
  assert.ok(/_tplList\.slice\(\)/.test(t), 'hamesha NAQAL par kaam ho');
});

test('talaash likhte waqt safha dobara na bane (5-C bhi)', () => {
  const f = read('fivec.js');
  assert.ok(!/oninput="clearTimeout\(window\._5cTmr\);window\._5cTmr=setTimeout\(\(\)=>renderFiveC/.test(f),
    'purana `oninput` poora safha dobara banata tha \u2014 cursor nikal jata tha');
  assert.ok(/oninput="_f5cOnSearch\(this\.value\)"/.test(f));
  assert.ok(/id="f5c-rows"/.test(f), 'sirf qatarein badlen');
  assert.ok(!/Search by complainant name/.test(f), 'safha Urdu mein ho');
});

test('koi bhi do failen aik hi naam top-level par na banayen', () => {
  // Classic <script> sab aik hi global scope mein chalti hain. Do files
  // ne aik hi naam banaya to wo aik doosre ka kaam kharab kar sakti hain.
  const fs = require('fs'), path = require('path');
  const dir = path.join(__dirname, '..');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'sw.js');
  const seen = new Map(); const clash = [];
  for (const f of files) {
    const lines = fs.readFileSync(path.join(dir, f), 'utf8').split('\n');
    let depth = 0, inBlock = false, inTpl = 0;
    for (const raw of lines) {
      let l = raw;
      if (inBlock) { const e = l.indexOf('*/'); if (e === -1) continue; l = l.slice(e + 2); inBlock = false; }
      const b = l.indexOf('/*');
      if (b !== -1 && l.indexOf('*/', b) === -1) { inBlock = true; l = l.slice(0, b); }
      l = l.replace(/\/\/.*$/, '');
      const bt = (l.match(/`/g) || []).length;
      if (inTpl) { inTpl = (inTpl + bt) % 2; continue; }
      if (bt % 2) inTpl = 1;
      if (depth === 0) {
        const m = /^(?:\s*)(?:async\s+)?(function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/.exec(l);
        if (m) {
          const n = m[2];
          if (seen.has(n) && seen.get(n) !== f) clash.push(n + ' (' + seen.get(n) + ' + ' + f + ')');
          else seen.set(n, f);
        }
      }
      for (const ch of l) { if (ch === '{') depth++; else if (ch === '}') depth = Math.max(0, depth - 1); }
    }
  }
  assert.strictEqual(clash.length, 0, 'takrao mile: ' + clash.slice(0, 6).join(', '));
});

test('rang ka WAAHID zaria — theme-pro app ki theme se chale', () => {
  const c = read('theme-pro.css');
  // apni alag fehrist nahi — app ke khanon se
  assert.ok(/--dio-surface:\s*var\(--bg-card/.test(c),
    'apni alag rangon ki fehrist rakhne se gyarah mein se das theme kharab thin: ' +
    'app ke khane tareek ho jate the magar ye file roshan reh jati thi');
  assert.ok(/--dio-ink:\s*var\(--text-primary/.test(c));
  assert.ok(/--dio-line:\s*var\(--border/.test(c));
  assert.ok(/--dio-canvas:\s*var\(--bg-primary/.test(c));
  const css = c.replace(/\/\*[\s\S]*?\*\//g, '');   // comment ki wazahat ginti mein na aaye
  assert.ok(!/@media \(prefers-color-scheme: dark\)/.test(css),
    'OS ki setting se nahi \u2014 app ki apni theme se rang aayen');
});

test('theme chunne ka khana — gyarah ki gyarah, Urdu mein', () => {
  const a = read('app-core.js');
  const h = read('index.html');
  const m = a.match(/const DIO_THEMES = \[[\s\S]*?\];/);
  assert.ok(m, 'theme ki fehrist mojood ho');
  const keys = [...m[0].matchAll(/k:\s*'([a-z]+)'/g)].map(x => x[1]);
  // index.html mein jitni theme hain, utni hi chunne ko milen
  const inCss = [...new Set([...h.matchAll(/html\[data-theme="([a-z]+)"\]/g)].map(x => x[1]))];
  const missing = inCss.filter(k => !keys.includes(k));
  assert.strictEqual(missing.length, 0,
    'CSS mein likhi hui magar afsar tak na pahunchne wali theme: ' + missing.join(', '));
  assert.ok(keys.includes('dark'), 'default (dark) bhi fehrist mein ho');
  assert.ok(!/[\u{1F300}-\u{1FAFF}]/u.test(m[0]), 'naam Urdu mein, emoji nahi');
});

test('koi murda function ya khana na bacha ho', () => {
  const fs = require('fs'), path = require('path');
  const dir = path.join(__dirname, '..');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') && f !== 'sw.js');
  const corpus = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n')
               + '\n' + read('index.html');
  const KEEP = new Set(['renderSettings','renderCases','renderSuspects','renderFiveC',
    'renderTemplates','renderCourt','renderReminders','renderEvidence','renderDashboard',
    'renderSearch','renderIncident','renderBackup','renderBin','renderPerformance']);
  const dead = [];
  for (const f of files) {
    fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((l, i) => {
      const m = /^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/.exec(l);
      if (!m || KEEP.has(m[1])) return;
      const re = new RegExp('(?<!function\\s)(?<![\\w$.])' + m[1].replace(/\$/g, '\\$') + '(?![\\w$])', 'g');
      if ((corpus.match(re) || []).length === 0) dead.push(f + ':' + (i + 1) + ' ' + m[1]);
    });
  }
  assert.strictEqual(dead.length, 0, 'murda function: ' + dead.slice(0, 8).join(', '));
});

test('SW version phir bump hua (v497)', () => {
  const sw = read('sw.js');
  const m = sw.match(/const CACHE_NAME = 'digital-io-v(\d+)'/);
  assert.ok(m && Number(m[1]) >= 501, 'v501 ya aage, mila: v' + (m ? m[1] : '?'));
  assert.ok(sw.includes('SERVICE WORKER v' + m[1]), 'header ka comment bhi wahi');
});

/* ═══════════════════════════════════════════════════════════════
   ROUND 7 — MOBILE par wahi sab
   ═══════════════════════════════════════════════════════════════ */

test('mobile: card apni chauRai se bahar na jaye', () => {
  const m = read('mobile.css');
  // cases.js ka jadwal `min-width:900px` ke sath aata hai; card-mode
  // mein wo bhi lagu rehta tha — 390px ki sakreen par 898px ka card.
  const rule = m.match(/table\.dio-cards \{[\s\S]*?\}/);
  assert.ok(rule, 'card-mode ke liye chauRai ka qaida ho');
  assert.ok(/min-width:\s*0\s*!important/.test(rule[0]),
    'desktop ka `min-width:900px` card-mode mein qeematein sakreen se bahar dhakel deta tha');
  assert.ok(/width:\s*100%\s*!important/.test(rule[0]));
});

test('mobile: card ka unwan apni satar par (Nastaleeq ko jagah chahiye)', () => {
  const m = read('mobile.css');
  const b = m.match(/table\.dio-cards td::before \{[\s\S]*?\}/);
  assert.ok(b, '::before ka qaida ho');
  assert.ok(/flex:\s*0 0 100%/.test(b[0]),
    'unwan aur qeemat aik hi satar par rakhne se Nastaleeq ke huroof ' +
    'aik doosre par chaRh jate the');
  // do khane — warna aik mocaddme ka card poori sakreen le leta hai
  assert.ok(/table\.dio-cards tr \{[\s\S]*?grid-template-columns: 1fr 1fr/.test(m),
    'chhote khane do-do kar ke — warna 7 mocaddmat = 5,562px ka safar');
});

test('mobile: grid ka khana apne mawad se phail kar bahar na jaye', () => {
  const m = read('mobile.css');
  assert.ok(/\.page-content \[style\*="display:grid"\] > \* \{ min-width: 0; \}/.test(m),
    '`1fr` ka matlab "kam se kam apne mawad jitna" hai — is se ' +
    'doosra khana nichuR kar sakreen se bahar chala jata tha');
});

test('mobile ke card-qaide ASAL jadwal ke qaidon se na takrayen', () => {
  const c = read('theme-pro.css');
  // desktop ke jadwal-qaide card-mode par na lagen
  for (const sel of ['thead th \\{\\n  position: sticky',
                     'tbody tr:nth-child\\(even\\) td',
                     'thead th:first-child',
                     'td:last-child \\{\\n  white-space: nowrap']) {
    const re = new RegExp('\\.page-content \\.data-table:not\\(\\.dio-cards\\)[^{]*' + sel);
    assert.ok(re.test(c) || new RegExp('\\.data-table:not\\(\\.dio-cards\\)').test(c),
      'jadwal ka qaida `:not(.dio-cards)` ke sath hona chahiye: ' + sel);
  }
  assert.ok(!/\.page-content \.data-table thead th \{\n  position: sticky/.test(c),
    'bina `:not(.dio-cards)` wala purana qaida na bache');
});

test('mobile: waqiati report A4 kaghaz — phone par zoom se poora (v535)', () => {
  const j = read('incident.js');
  assert.ok(/id="ir-doc"/.test(j) && /width:8\.27in/.test(j) && /min-height:11\.69in/.test(j), 'A4 kaghaz');
  assert.ok(/function _irFit\(\)[\s\S]{0,500}z\.style\.zoom/.test(j), 'phone par kaghaz zoom se fit');
  // purana jadwal tor-ne wala qaida ab nahi (kaghaz na bigRe)
  assert.ok(!/table\.inc-table td/.test(read('mobile.css')));
});

test('mobile ke naye qaide SIRF phone par lagen (desktop na bigRe)', () => {
  const m = read('mobile.css');
  // har naya qaida media query ke ANDAR ho
  const idx = m.indexOf('table.dio-cards tr {');
  assert.ok(idx > 0, 'card-grid ka qaida mojood ho');
  const before = m.slice(0, idx);
  const opens = (before.match(/@media[^{]*\{/g) || []).length;
  // us se pehle jitne @media khule, utne hi band na huay hon
  let depth = 0;
  for (const ch of before) { if (ch === '{') depth++; else if (ch === '}') depth--; }
  assert.ok(opens > 0 && depth > 0,
    'ye qaide media query ke ANDAR hone chahiye, warna desktop ka jadwal bhi card ban jata');
});

test('roka hua safha "khul raha hai" par atka na reh jaye', () => {
  const a = read('app-core.js');
  assert.ok(/DIO\.states\.permDenied\(\)/.test(a),
    'rasai na milne par sirf toast kaafi nahi — wajah safhe par bhi likhi jaye, ' +
    'warna boot.js ka "کھل رہا ہے…" hamesha ke liye laga reh jata hai');
  const b = read('boot.js');
  assert.ok(/data-dio-loading/.test(b), 'loading ka nishan lagaya jaye taake baad mein pehchana ja sake');
  assert.ok(/c\.removeAttribute\('data-dio-loading'\)/.test(b), 'aur hataya bhi jaye');
});

test('nishan har jagah SVG — safha-sazi mein emoji na bachen', () => {
  const fs = require('fs'), path = require('path');
  const dir = path.join(__dirname, '..');
  // Dastavez/print banane wali failen mustasna — wahan nishan toolbar ke hain
  const SKIP = new Set(['zimni.js','report173.js','toolbar.js','naqsha-mauqa.js',
    'editor-tools.js','saza-slip.js','misal-templates.js','darkhwastain.js','doc-viewer.js','sw.js']);
  const EMO = /[⌚-⏺☀-➿⬀-⯿\u{1F000}-\u{1FAFF}]/u;
  const bad = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js') && !SKIP.has(x))) {
    fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((l, i) => {
      const t = l.trim();
      if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;  // comment
      if (/\bicon\s*:\s*['"]/.test(l) && EMO.test(l)) bad.push(f + ':' + (i + 1));
    });
  }
  assert.strictEqual(bad.length, 0, 'nishan ke data mein emoji: ' + bad.slice(0, 6).join(', '));
});

/* ═══════════════════════════════════════════════════════════════
   ROUND 8 — Har safha AIK jaisa
   ═══════════════════════════════════════════════════════════════ */

test('har safha MAYARI sarnama istemal kare', () => {
  // `.page-header` + `.page-title` har safhe par — warna har safhe ka
  // unwan apni marzi ki jagah, apni marzi ke naap par hota hai.
  const PAGES = ['cases.js','suspects.js','court.js','reminders.js','evidence.js',
                 'templates.js','law-library.js','ahkamat.js','backup.js','bin.js',
                 'performance.js','settings.js','fivec.js','search.js'];
  const missing = [];
  for (const f of PAGES) {
    const s = read(f);
    if (!/class="page-header"/.test(s)) missing.push(f + ' (page-header)');
    else if (!/class="page-title"/.test(s)) missing.push(f + ' (page-title)');
  }
  assert.strictEqual(missing.length, 0, 'mayari sarnama nahi: ' + missing.join(', '));
});

test('"shamil karen" wala button har safhe par dio-add-btn ho', () => {
  // Sirf `.dio-add-btn` par hi wo qaida lagta hai jo use DAAIN sirey
  // par rakhta hai. Bina is class ke button apni marzi ki jagah chala jata hai.
  const WITH_ADD = ['cases.js','suspects.js','court.js','reminders.js','evidence.js',
                    'templates.js','law-library.js','backup.js','fivec.js'];
  const bad = [];
  for (const f of WITH_ADD) {
    const s = read(f);
    const hdr = s.slice(s.indexOf('class="page-header"'), s.indexOf('class="page-header"') + 900);
    if (!/dio-add-btn/.test(hdr)) bad.push(f);
  }
  assert.strictEqual(bad.length, 0, 'sarnama mein dio-add-btn nahi: ' + bad.join(', '));
});

test('safha-sazi ka matn Urdu mein (barand ke naam mustasna)', () => {
  const fs = require('fs'), path = require('path');
  const dir = path.join(__dirname, '..');
  // Sarkari/angrezi dastavez (RFA, CDR) aur dastavez-saaz failen mustasna
  const SKIP = new Set(['zimni.js','report173.js','toolbar.js','naqsha-mauqa.js','editor-tools.js',
    'saza-slip.js','misal-templates.js','darkhwastain.js','doc-viewer.js','sw.js','rfa-form.js',
    'cdr-imei.js','admin.js','staff-v2.js','sho-dsp.js','error-handler.js','license-token.js',
    'dio-html.js','dio-states.js','secure-storage.js','offline-store.js','boot.js','dio-custody.js',
    'subscription.js','auth.js','app-core.js','data-api.js','misal-docs.js','misal-fir.js',
    'case-sharing.js','saved-docs.js','cro-card.js','incident.js','help-guide.js','witnesses.js',
    'mulziman.js','fir.js','search.js','dashboard.js','case-form.js',
    'system-forms.js' /* خودکار بنی فائل — RFA جیسے سرکاری انگریزی فارم */]);
  // Barand / tikniki naam — inhen angrezi mein hi rehna chahiye
  // Barand aur tikniki naam — ye angrezi mein hi rehte hain (afsar bhi
  // inhen isi tarah pehchanta hai). Baqi sab Urdu.
  const OK = new Set(['Digital IO','PDF','Google Docs','Drive','OneDrive','Supabase',
    'CSV','JSON','CNIC','PIN','SOPs','IGP','RPO','DPO','PFSA','Generated by Digital IO','Word']);
  const PAT = /<(?:div|span|button|label|option|th|td|h[1-6])\b[^<>]*>\s*([A-Z][a-zA-Z]{2,}(?:\s+[A-Za-z]{2,}){0,4})\s*</g;
  const bad = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js') && !SKIP.has(x))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    let m;
    while ((m = PAT.exec(s)) !== null) {
      const t = m[1].trim();
      if (!OK.has(t)) bad.push(f + ': "' + t + '"');
    }
  }
  assert.strictEqual(bad.length, 0, 'angrezi matn: ' + [...new Set(bad)].slice(0, 8).join(', '));
});

test('backup ka size hisaab NaN na de', () => {
  // Comment poora nikalo — wahan purana (ghalat) code misal ke taur par
  // likha hua hai taake aane wala samjh sake ke masla kya tha.
  const b = read('backup.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/for \(let k in localStorage\)/.test(b),
    '`for...in` localStorage ki wirasati khoobiyan (length, getItem…) bhi ginta hai — ' +
    '`(12||\'\').length` = undefined, aur poora hisaab NaN ho jata tha ("NaN KB")');
  assert.ok(/localStorage\.key\(i\)/.test(b), 'sirf asal chaabiyan ginen');
  assert.ok(/String\(localStorage\.getItem\(k\) \|\| ''\)/.test(b), 'har qeemat String() se');
});

/* ═══════════════════════════════════════════════════════════════
   ROUND 9 — Miyaad khatam par DAAKHLA BAND · aaf-line · chip/button
   ═══════════════════════════════════════════════════════════════ */

test('miyaad khatam par daakhla BAND (sirf view-only nahi)', () => {
  const s = read('subscription.js');
  assert.ok(/var _noEntry = \(sub\.status === 'expired'/.test(s),
    'maalik ki hidayat: miyaad khatam hote hi afsar ander na aa sake');
  // shak ka faida ROKNE ko jaye, daakhle ko nahi
  for (const st of ["'expired'", "'suspended'", "'none'", "'unknown'"])
    assert.ok(new RegExp("sub\\.status === " + st).test(s), st + ' par bhi rukna chahiye');
  assert.ok(/_dioHardLock\(sub\)/.test(s), 'poora tala lagna chahiye');
});

test('tale ki halat bahar se (console se) nahi badli ja sakti', () => {
  const s = read('subscription.js');
  // HAMLA JO NAAPA GAYA: `window._dioLocked = false` likhte hi pehra
  // khud ko band kar leta tha aur likhai ka guard bhi khul jata tha.
  assert.ok(/var _dioLockState = \(function \(\) \{/.test(s),
    'halat closure ke andar honi chahiye, `window` par nahi');
  assert.ok(/if \(!_dioLockState\.is\(\)\) \{ clearInterval/.test(s),
    'pehra apni ANDRUNI halat dekhe — us nishan ko nahi jo hamla-aawar ulta sake');
  assert.ok(/_dioLockState\.off\(\);/.test(s), 'khulne ka aik hi raasta ho');
  // aur wo raasta ONLINE tasdeeq ke baghair na khule
  const fn = s.slice(s.indexOf('async function _dioUnlockIfRenewed'),
                     s.indexOf('window._dioUnlockIfRenewed'));
  assert.ok(/if \(!navigator\.onLine\)/.test(fn), 'aaf-line par tala na khule');
  assert.ok(/await checkSubscription\(\)/.test(fn), 'server se tasdeeq lazmi');
});

test('maalik (superadmin) kabhi band na ho', () => {
  const s = read('subscription.js');
  assert.ok(/currentOfficer\.role === 'superadmin'/.test(s), 'maalik mustasna ho');
  assert.ok(/if \(!_owner && \(_noEntry \|\| _suspOfficer\)\)/.test(s),
    'tala lagane se pehle maalik ki jaanch');
});

test('ASAL rok SERVER par hai — sirf LIKHNE par; parhna kabhi band nahi', () => {
  // Qaida: miyaad khatam = dekh sakte ho, badal nahi sakte (README + 92a).
  // 70_no_entry_on_expiry.sql MANSOOKH — parhna band karti thi.
  assert.ok(!fs.existsSync(path.join(ROOT, 'sql', '70_no_entry_on_expiry.sql')), '70 wapas na aaye');
  assert.ok(/drop policy if exists dio_sub_sel/.test(sqlAmli('sql/92a_drop_read_gate.sql')),
    'parhne ki purani rok hatni chahiye');
  const g = sqlAmli('sql/92b_add_write_gate.sql');
  assert.ok(/as restrictive/.test(g), 'restrictive ho, warna doosri policy se by-pass ho jayegi');
  assert.ok(!/for select/.test(g), 'parhne par rok nahi');
  const gated = g.slice(g.indexOf('gated text[]'), g.indexOf('begin'));
  for (const open of ['officers', 'subscriptions', 'subscription_plans', 'client_errors'])
    assert.ok(!new RegExp("'" + open + "'").test(gated), open + ' khuli rehni chahiye warna tajdeed hi mumkin na ho');
  // ROLLBACK ke siwa koi file parhne par sabscription ki rok na lagaye
  for (const f of fs.readdirSync(path.join(ROOT, 'sql')).filter((x) => x.endsWith('.sql') && !/ROLLBACK/.test(x)))
    assert.ok(!/for select to authenticated using \(public\.dio_has_active_sub\(\)\)/.test(sqlAmli('sql/' + f)),
      f + ': parhne par miyaad ki rok — qaide ke khilaf');
});

test('aaf-line par nishan SAHIH ho (shuru me bhi)', () => {
  const a = read('app-core.js');
  assert.ok(/function _dioInitConnectionStatus\(\)/.test(a),
    '`updateConnectionStatus` sirf EVENT par chalta tha; agar app pehle se ' +
    'aaf-line khuli to patti par "آن لائن" hi laga rehta tha');
  assert.ok(/updateConnectionStatus\(navigator\.onLine\)/.test(a), 'asal haalat se nishan lage');
  assert.ok(!/\U0001f517 Connected/.test(a), 'nishan ka matn Urdu mein ho');
});

test('chip har safhe par AIK hi shakl ki', () => {
  // Teen safhon par teen alag chip thin: ahkamat (18px apna rang),
  // templates (16px apna rang), mulzimaan (class wali).
  for (const f of ['ahkamat.js', 'templates.js']) {
    const s = read(f);
    assert.ok(/class="dio-chip/.test(s), f + ': mushtarik `dio-chip` class istemal kare');
    assert.ok(!/border-radius:1[68]px;cursor:pointer;font-size:13px/.test(s),
      f + ': apni alag chip-shakl na bache');
  }
  const c = read('theme-pro.css');
  assert.ok(/\.page-content \.suspect-filter,\n\.page-content \.dio-chip \{/.test(c) ||
            /\.dio-chip \{/.test(c), 'chip ki shakl aik hi jagah se aaye');
});

test('button ke rang theme se aayen, hardcode na hon', () => {
  const fs = require('fs'), path = require('path');
  const dir = path.join(__dirname, '..');
  // Dastavez/chhapai wali failen mustasna — wahan kaghaz ke rang hain
  const SKIP = new Set(['report173.js','zimni.js','saza-slip.js','naqsha-mauqa.js',
    'misal-templates.js','darkhwastain.js','toolbar.js','editor-tools.js','sw.js']);
  const BAD = /background:#(1a73e8|f1f3f4|e2e8f0)\b/;
  const bad = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js') && !SKIP.has(x))) {
    fs.readFileSync(path.join(dir, f), 'utf8').split('\n').forEach((l, i) => {
      if (BAD.test(l)) bad.push(f + ':' + (i + 1));
    });
  }
  assert.strictEqual(bad.length, 0,
    'hardcode rang tareek theme par safaid/neele dabbe bana dete hain: ' + bad.slice(0, 6).join(', '));
});

test('SW version phir bump hua (v501)', () => {
  const sw = read('sw.js');
  const m = sw.match(/const CACHE_NAME = 'digital-io-v(\d+)'/);
  assert.ok(m && Number(m[1]) >= 501, 'v501 ya aage, mila: v' + (m ? m[1] : '?'));
  assert.ok(sw.includes('SERVICE WORKER v' + m[1]));
});

/* ═══════════════════════════════════════════════════════════
   RAUND 10 — QANOONI LIBRARY: download, font, aur safha
   ═══════════════════════════════════════════════════════════ */

test('download: doosre origin par `download` attribute par bharosa na ho', () => {
  const s = read('law-library.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  // Purana tareeqa: a.href = file_url; a.download = ...; a.target='_blank'
  assert.ok(!/a\.href\s*=\s*l\.file_url/.test(s),
    'seedha file_url anchor par na lage — cross-origin par `download` nazar-andaaz hota hai');
  assert.ok(!/a\.target\s*=\s*'_blank'/.test(s), "`target='_blank'` download ko rok deta hai");
  assert.ok(/URL\.createObjectURL\(new Blob\(\[buf\]/.test(s), 'apne origin ka blob banaya jaye');
  assert.ok(/revokeObjectURL/.test(s), 'blob ka pata baad mein chhoRa jaye');
});

test('download: extension aur MIME ki zamanat', () => {
  const s = read('law-library.js');
  assert.ok(/const LAW_MIME = \{/.test(s), 'MIME ki fehrist mojood ho');
  for (const k of ['pdf:', 'docx:', 'doc:']) assert.ok(s.includes(k), 'MIME: ' + k);
  assert.ok(/function _lawExt\(/.test(s) && /function _lawFileName\(/.test(s),
    'extension aur naam banane wale function alag hon');
  // Naam mein extension lazmi joRi jaye
  assert.ok(/return base \+ '\.' \+ ext;/.test(s), 'naam ke aakhir mein sahi extension lage');
  // File-system ke mana karda huroof nikaale jayen
  assert.ok(s.includes('<>|#%'), 'naam se mana karda huroof nikaale jayen');
});

test('upload: `file.type` par bharosa na ho (khali aane par text/plain ban jata hai)', () => {
  const s = read('law-library.js');
  assert.ok(!/contentType:\s*file\.type\b/.test(s),
    'contentType extension se tay ho — warna Word/PDF kachre ki tarah khulti hai');
  assert.ok((s.match(/const ctype = LAW_MIME\[ext\] \|\| file\.type/g) || []).length >= 2,
    'nayi file aur badli hui file — dono jagah');
});

test('chhapai ka Urdu font: har print-safhe mein ELAAN ho', () => {
  const fs = require('fs'), path = require('path');
  const dir = path.join(__dirname, '..');
  const kami = [];
  for (const f of fs.readdirSync(dir).filter(x => x.endsWith('.js'))) {
    const s = fs.readFileSync(path.join(dir, f), 'utf8');
    let i = -1;
    while ((i = s.indexOf('<!DOCTYPE html>', i + 1)) !== -1) {
      const seg = s.slice(i, i + 3000);
      const end = seg.indexOf('</head>');
      const head = seg.slice(0, end > 0 ? end : 1200);
      const naam = head.includes('Jameel Noori') || head.includes('Nastaliq');
      const elaan = head.includes('@font-face') || head.includes('fonts.googleapis.com') || head.includes('dioFontHead');
      if (naam && !elaan) kami.push(f + ':' + (s.slice(0, i).split('\n').length));
    }
  }
  assert.strictEqual(kami.length, 0,
    'chhapai ka iframe sirf apne elaan wala font istemal karta hai — warna Naskh chhapta hai: ' + kami.join(', '));
});

test('`dioFontHead()` aik hi jagah, aur block par', () => {
  const a = read('app-core.js');
  assert.ok(/function dioFontHead\(\)/.test(a) && /window\.dioFontHead = dioFontHead;/.test(a));
  assert.ok(/font-display:block/.test(a), 'chhapai se pehle font aa jaye (swap nahi)');
  assert.ok(/jameel-noori-nastaleeq4\.woff2/.test(a) && /Noto\+Nastaliq\+Urdu/.test(a));
});

test('service worker: qanoon ki failen aur Urdu font offline bhi', () => {
  const sw = read('sw.js');
  assert.ok(/storage\/v1\/object\/public\/law-library\//.test(sw), 'qanoon ki failen cache hon');
  const lawAt = sw.indexOf('law-library/');
  const skipAt = sw.indexOf("url.hostname.includes('supabase')) return;");
  assert.ok(lawAt > 0 && skipAt > 0 && lawAt < skipAt,
    'qanoon wali shart Supabase ke `return` se PEHLE ho, warna chhoR di jayegi');
  assert.ok(/fonts\.googleapis\.com/.test(sw) && /fonts\.gstatic\.com/.test(sw), 'Urdu font bhi cache ho');
  assert.ok(/mode: 'cors'/.test(sw),
    "`no-cors` ka jawab opaque hota hai jise cache.put rakh nahi sakti — khud cors se laana zaroori");
});

test('qanooni safha: mushtarik jadwal, chip aur apni haalat', () => {
  const s = read('law-library.js');
  assert.ok(/<table class="data-table"/.test(s), 'mushtarik `data-table` — mobile par card isi se bante hain');
  assert.ok(/const _lawFilterState = \{ cat: '', q: '' \}/.test(s), 'safhe ki apni haalat apni file mein');
  assert.ok(/function _lawVisible\(\)/.test(s) && /function _lawRender\(\)/.test(s),
    'chip aur talash — dono aik hi raste se');
  assert.ok(/class="dio-chip/.test(s), 'chip ki shakl mushtarik class se');
  assert.ok(!/rgba\(56,189,248/.test(s), 'pakka rang na bache');
});

test('murda code aur purani khamiyan: law-library', () => {
  const s = read('law-library.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/law-card-/.test(s),
    '`law-card-<id>` purane design ka tha — hazf ke baad qatar isi wajah se nazar aati rehti thi');
  assert.ok(!/_renameLaw/.test(s), 'murda `_renameLaw` hataya jaye');
  assert.ok(!/law-pdf-viewer/.test(s), 'ab PDF canvas par banti hai — purana iframe id na dhoonda jaye');
  assert.ok(/law-pdf-pages/.test(s), 'PDF ki chhapai canvas/blob se ho');
  assert.ok(!/onclick="window\.open\('\$\{/.test(s), 'URL seedha onclick mein na rakha jaye');
});

test('SW version phir bump hua (v502)', () => {
  const sw = read('sw.js');
  const m = sw.match(/const CACHE_NAME = 'digital-io-v(\d+)'/);
  assert.ok(m && Number(m[1]) >= 502, 'v502 ya aage, mila: v' + (m ? m[1] : '?'));
  assert.ok(sw.includes('SERVICE WORKER v' + m[1]));
});

/* ═══════════════════════════════════════════════════════════
   RAUND 11 — رپورٹ 173 (چاروں اقسام)، عنوانات کا پیمانہ، فہرست
   ═══════════════════════════════════════════════════════════ */

test('r173: aik چالان ka data doosri qism mein na jaye', () => {
  const s = read('report173.js');
  assert.ok(/function _r173DocMatches\(/.test(s), 'khule record ki QISM bhi milni chahiye');
  assert.ok(/_r173DocMatches\(d\)\) return d\.form_data/.test(s),
    'sirf id par bharosa na ho — warna اخراج ka فارم چالان مکمل ke data se bhar jata hai');
  assert.ok(/function _r173SyncDocId\(/.test(s), 'qism badalte hi sahi satar chuni jaye');
  for (const f of ['_r173Pick', '_r173PickSub', '_ch173SetVersion'])
    assert.ok(new RegExp(f + '[\\s\\S]{0,600}_r173SyncDocId').test(s), f + ': satar dobara chuni jaye');
});

test('r173: chaabi AIK hi jagah se banti hai', () => {
  const s = read('report173.js');
  assert.ok(/function _r173Key\(type, subtype, version\)/.test(s));
  // purane teen alag tareeqe na bachen
  assert.ok(!/recKey = recKey \+ '::' \+ _ch173Version/.test(s), 'render apni alag chaabi na banaye');
  assert.ok(!/key = 'tatima_challan_' \+ \(r\.report_subtype \|\| 'aslha'\)/.test(s), 'load apni alag chaabi na banaye');
  assert.ok((s.match(/_r173Key\(/g) || []).length >= 4, 'load, render, save aur open — chaaron jagah wohi chaabi');
});

test('r173: محفوظ کرنے کی ناکامی چھپائی نہ جائے', () => {
  const s = read('report173.js');
  assert.ok(/const \{ data: ins, error: insErr \}/.test(s),
    'supabase-js nakami par exception nahi phenkta — `error` khud dekhna zaroori hai');
  assert.ok(/if \(insErr\) throw insErr;/.test(s));
  // v547: ترمیم کا نتیجہ dioWriteOk سے — غلطی اور 0 قطار (RLS/میعاد ختم) دونوں پر throw
  assert.ok(/dioWriteOk\(await supabaseClient\.from\('report_173'\)\.update\(rec\)\.eq\('id', _r173DocId\)\.select\('id'\), 'r173 update', true\)/.test(s));
  assert.ok(/let _r173Saving = false/.test(s), 'do dafa dabane par do satren na banen');
  assert.ok(/محفوظ نہیں ہوا/.test(s), 'nakami par saaf paigham');
  // "محفوظ فائلیں" mein darj — kamyabi ke BAAD
  const regIdx = s.indexOf('dioRegisterSaved');
  const insIdx = s.indexOf('const { data: ins, error: insErr }');
  assert.ok(regIdx > insIdx, 'nakaam save «محفوظ فائلیں» mein darj na ho');
});

test('r173: اخراج / عدم پتہ کا درست عنوان', () => {
  const s = read('report173.js');
  assert.ok(/فارم رپورٹ اختتامی بصیغہ اخراج زیر دفعہ 173 ض ف/.test(s));
  assert.ok(/فارم رپورٹ اختتامی بصیغہ عدم پتہ زیر دفعہ 173 ض ف/.test(s));
});

test('r173: کالم کی لکیر واقعی پکڑی جا سکے اور ناپ px میں ہو', () => {
  const s = read('report173.js');
  // grip ki unchai: offsetTop (ghalat ﺁba) ki bajaye rect se rect
  assert.ok(!/const top = cell \? cell\.offsetTop : 0;/.test(s),
    'offsetTop offsetParent se naapa jata hai — is se unchai 0 aati thi');
  assert.ok(/cr\.top - tr\.top/.test(s), 'naap table ke apne dabbe se');
  // ikai: px, فیصد nahi
  assert.ok(!/nA\.toFixed\(2\) \+ '%'/.test(s), 'px ko فیصد samajh kar wapas na likho');
  assert.ok(/Math\.round\(nA\) \+ 'px'/.test(s));
  assert.ok(/if \(moved\) \{ try \{ table\.dataset\.colsManual/.test(s), 'khali click par manual na lage');
});

test('r173: چھپائی کھڑکی کی چوڑائی پر منحصر نہ ہو', () => {
  const s = read('report173.js');
  assert.ok(/let _ch173PrintMeasuring = false/.test(s));
  assert.ok(/if \(_ch173PrintMeasuring\) \{ doc\.style\.transform = 'none'; return 1; \}/.test(s),
    'chapai ki naap ke dauran scale na lage');
  assert.ok(/_ch173PrintMeasuring = true;/.test(s) && /_ch173PrintMeasuring = false;/.test(s));
  assert.ok(/function _ch173Scale\(\)/.test(s), 'rect wali naap asal paimane par aaye');
  assert.ok(/r\.width \/ _sc/.test(s), 'khanon ki naap bhi scale se paak ho');
});

test('r173: افسر کی اپنی چوڑائی خودکار ناپ سے نہ مٹے', () => {
  const s = read('report173.js');
  assert.ok(/const manual = \(table\.dataset\.colsManual === '1'\);/.test(s));
  assert.ok(/if \(!manual\) cols\.forEach/.test(s));
});

test('r173: اخراج کی مقامی یادداشت محدود اور قسم کے مطابق', () => {
  const s = read('report173.js');
  assert.ok(!/'dio_akhraj_col2'/.test(s) || /_r173AkhColKey\(\)/.test(s), 'aik mushtarik chaabi na ho');
  assert.ok(/function _r173AkhColKey\(\)/.test(s) && /function _r173AkhHKey\(\)/.test(s));
  assert.ok(/R173_AKH_H_MIN/.test(s) && /R173_AKH_H_MAX/.test(s), 'naap ki hadd');
  assert.ok(/function _r173AkhColOk\(/.test(s), 'bay-maqool فیصد qabool na ho');
  assert.ok(/_ch173AkhrajResetH|_ch173AkhrajResetCol/.test(s), 'khud-kar par wapsi ka raasta');
});

test('r173: مردہ کوڈ باقی نہ رہے', () => {
  const s = read('report173.js').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.ok(!/document\.getElementById\('r173-doc'\)/.test(s), 'purana safha hata diya gaya');
  assert.ok(!/function _r173Qita/.test(s));
  assert.ok(!/data-pk/.test(s));
  assert.ok(/if \(!R173_TYPES\.some\(t => t\.id === _r173Type\)\) _r173Type = 'mukammal';/.test(s),
    'anjaan qism manzoor-shuda فارم par aaye');
});

test('عنوانات: تین درجے، ایک ہی جگہ سے', () => {
  const css = read('theme-pro.css'), html = read('index.html');
  for (const v of ['--dio-h1', '--dio-h2', '--dio-h3']) assert.ok(css.includes(v), 'paimana: ' + v);
  assert.ok(/clamp\(/.test(css), 'mobile aur desktop — aik hi qaida se');
  // index.html ka `revert` ab unwanon ko nigal na jaye
  // (qaida: font ka size hamesha pt mein — 20px=15pt, 17px=12.75pt, 15px=11.25pt)
  assert.ok(/font-size: var\(--dio-h1, 15pt\) !important/.test(html));
  assert.ok(/font-size: var\(--dio-h2, 12\.75pt\) !important/.test(html));
  assert.ok(/font-size: var\(--dio-h3, 11\.25pt\) !important/.test(html));
  assert.ok(!/var\(--dio-h[123], [\d.]+px\)/.test(html), 'unwan ka size px mein nahi — pt mein');
  // aam unwan kabhi aam matn (14px = 10.5pt) se chhota na ho
  const m = /--dio-h3: clamp\(([\d.]+)pt/.exec(css);
  assert.ok(m && parseFloat(m[1]) >= 10.5, 'aam unwan 10.5pt (14px) se chhota na ho, mila: ' + (m ? m[1] : '?'));
  // dastavez ka apna (point wala) paimana
  const r = read('report173.js');
  for (const v of ['--doc-h1: 20pt', '--doc-h2: 16pt', '--doc-h3: 14pt', '--doc-h4: 12pt'])
    assert.ok(r.includes(v), 'kaghaz ka paimana: ' + v);
});

test('فہرست کا نشان متن پر نہ چڑھے', () => {
  const r = read('report173.js'), css = read('theme-pro.css');
  assert.ok(/#ch173-doc ul, #ch173-doc ol\{[\s\S]{0,160}padding-inline-start: 1\.9em !important/.test(r),
    'dastavez mein nishan ki apni jagah (safhe par bhi, chhapai mein bhi)');
  assert.ok(/padding-inline-start: 1\.9em/.test(css), 'baqi safhon par bhi');
});

test('عنوان کی سطر میں ٹکراؤ نہ ہو', () => {
  const s = read('report173.js');
  assert.ok(!/#ch173-doc \.tt-mid, #ch173-doc \.form-no\{\s*position:absolute/.test(s),
    'absolute unwan apni satar se bahar nikal kar فارم نمبر par charh jata tha');
  assert.ok(/grid-template-columns:1fr auto 1fr/.test(s), 'teen barabar khane — unwan theek beech mein');
});

test('SW version phir bump hua (v503)', () => {
  const sw = read('sw.js');
  const m = sw.match(/const CACHE_NAME = 'digital-io-v(\d+)'/);
  assert.ok(m && Number(m[1]) >= 503, 'v503 ya aage, mila: v' + (m ? m[1] : '?'));
  assert.ok(sw.includes('SERVICE WORKER v' + m[1]));
});

// ════════════════════════════════════════════════════════════════
//  v507 — LICENSE KI NAKAMI AB KHAMOSH NAHI RAHEGI
//  Maidan se: 403 {"error":"no_officer"} aaya aur na client ne kuch
//  bataya, na server ne wajah alag ki. Char alag khrabiyan aik hi
//  paighaam ke peechay chhup rahi thin.
// ════════════════════════════════════════════════════════════════

test('ایج فنکشن: افسر کی کوئری کی خرابی نگلی نہ جائے', () => {
  const s = read('supabase/functions/dio-license/index.ts');
  // purana code: `const { data: officer } = await admin.from("officers")` — error gayab
  assert.ok(!/const \{ data: officer \} = await admin\.from\("officers"\)/.test(s),
    'officers ki query ka error nazarandaz ho raha tha');
  assert.ok(/error: offErr/.test(s) && /officer_lookup_failed/.test(s),
    'DB ki kharabi ab apne naam se wapas aaye');
  assert.ok(/sub_lookup_failed/.test(s),
    'subscriptions ki kharabi khamoshi se not_entitled na ban jaye');
  assert.ok(/server_misconfigured/.test(s) && /SUPABASE_SERVICE_ROLE_KEY/.test(s),
    'secrets ghaib hon to saaf batao');
});

test('ایج فنکشن: ایک ہی uid پر دو ریکارڈ ہوں تو تالا نہ لگے', () => {
  const s = read('supabase/functions/dio-license/index.ts');
  // maybeSingle() duplicate par error deta hai → purana code "no_officer" dikhata tha
  assert.ok(!/from\("officers"\)[\s\S]{0,220}maybeSingle\(\)/.test(s),
    'officers par maybeSingle duplicate ko no_officer bana deta tha');
  assert.ok(/offRows\.length > 1/.test(s) && /!afsarMoattal\(r\) && !afsarGhairManzoor\(r\)/.test(s),
    'duplicate me saaf-suthri row chuni jaye');
});

test('ایج فنکشن: عوامی کلید غلطی سے راز میں نہ لگ جائے', () => {
  const s = read('supabase/functions/dio-license/index.ts');
  assert.ok(/\.d === undefined/.test(s) && /PRIVATE_KEY_NOT_PUBLIC/.test(s),
    "'d' ke baghair JWK public hai — us se dastkhat mumkin nahi");
});

test('کلائنٹ: لائسنس نہ ملنے کی وجہ محفوظ ہو', async () => {
  const src = read('license-token.js');
  assert.ok(/dio_license_err/.test(src), 'aakhri wajah mehfooz ho');
  assert.ok(/window\.dioLicenseError/.test(src), 'tashkhees ke liye bahar bhi mile');
  assert.ok(/_licInFlight/.test(src), 'aik waqt me aik hi darkhwast (console me do-do 403 aa rahe the)');
  for (const k of ['no_officer', 'not_entitled', 'suspended', 'server_misconfigured'])
    assert.ok(src.includes(k + ':'), 'Urdu wajah: ' + k);
  // asli amal: 403 par false, wajah mehfooz, aur teen darkhwastein = aik fetch
  const store = new Map();
  let calls = 0;
  const ctx = {
    window: {}, console: { warn() {}, log() {}, error() {} },
    crypto: globalThis.crypto, atob: globalThis.atob, btoa: globalThis.btoa,
    TextDecoder, TextEncoder, Uint8Array, JSON, Date, Math, String, Number,
    localStorage: {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    },
    fetch: async () => { calls++; await new Promise(r => setTimeout(r, 10));
      return { ok: false, status: 403, json: async () => ({ error: 'no_officer' }) }; },
    supabaseClient: {
      functionsUrl: 'https://x.test/functions/v1',
      auth: { getSession: async () => ({ data: { session: { access_token: 'J' } } }) },
    },
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  const outs = await Promise.all([
    ctx.window.dioRefreshLicense(), ctx.window.dioRefreshLicense(), ctx.window.dioRefreshLicense(),
  ]);
  assert.deepStrictEqual(outs, [false, false, false], 'teenon nakaam');
  assert.strictEqual(calls, 1, 'sirf aik fetch, mila: ' + calls);
  assert.strictEqual(JSON.parse(store.get('dio_license_err')).code, 'no_officer');
});

test('تشخیصی SQL صرف پڑھے، کچھ بدلے نہیں', () => {
  const s = read('sql/71_license_diagnose.sql');
  assert.ok(!/\b(update|delete|insert|drop|alter|truncate|grant|revoke)\b/i
    .test(s.replace(/--[^\n]*/g, '')), 'koi tabdeeli wala hukm na ho');
  assert.ok(/from auth\.users u/.test(s) && /left join o on o\.user_id = u\.id/.test(s),
    'har user ka afsar record nazar aaye');
  assert.ok(/having count\(\*\) > 1/.test(s), 'duplicate pakdne wali query');
});

test('SW version phir bump hua (v509)', () => {
  const sw = read('sw.js');
  const m = sw.match(/const CACHE_NAME = 'digital-io-v(\d+)'/);
  assert.ok(m && Number(m[1]) >= 509, 'v509 ya aage, mila: v' + (m ? m[1] : '?'));
  assert.ok(sw.includes('SERVICE WORKER v' + m[1]));
});

// ════════════════════════════════════════════════════════════════
//  v508 — COLUMN KA ASAL NAAM: `suspended` (is_suspended NAHI)
//  11 Oct 2026, DB ne khud bataya:
//    ERROR 42703: column "is_suspended" does not exist
//    HINT: Perhaps you meant to reference the column "officers.suspended".
// ════════════════════════════════════════════════════════════════

test('ایج فنکشن: کالم کے نام پر بھروسہ نہ کرے', () => {
  const s = read('supabase/functions/dio-license/index.ts');
  assert.ok(/\.select\("\*"\)\s*\n\s*\.eq\("user_id", uid\)/.test(s),
    'officers ka poora record parha jaye — column ke naam par bharosa nahi');
  const amli = s.replace(/\/\*[\s\S]*?\*\//g, '')
                .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
  assert.ok(!/select\("id, role, is_suspended/.test(amli), 'purani (galat) column list na ho');
  assert.ok(/SACH\(o\.is_suspended\) \|\| SACH\(o\.suspended\)/.test(s),
    'donon naam parhe jayen');
});

test('ایج فنکشن: معطلی اور منظوری کا فیصلہ SQL جیسا ہو', () => {
  const src = read('supabase/functions/dio-license/index.ts');
  const a = src.indexOf('const SACH');
  const b = src.indexOf('\n};', src.indexOf('const afsarGhairManzoor')) + 3;
  const body = src.slice(a, b).replace(/: unknown/g, '').replace(/: OfficerRow/g, '');
  const f = new Function(body + '; return { afsarMoattal, afsarGhairManzoor };')();

  // wohi 8 soortein jo asal Postgres par dio_has_active_sub() se jaanchi gayin
  const soortein = [
    ['malik',        { role: 'superadmin', is_approved: true,  suspended: false }, false, false],
    ['admin',        { role: 'admin',      is_approved: true,  suspended: false }, false, false],
    ['faal afsar',   { role: 'officer',    is_approved: true,  suspended: false }, false, false],
    ['moattal',      { role: 'officer',    is_approved: true,  suspended: true  }, true,  false],
    ['moattal admin',{ role: 'admin',      is_approved: true,  suspended: true  }, true,  false],
    ['zer-e-iltawa', { role: 'officer',    is_approved: null,  suspended: false }, false, true ],
    ['ghair manzoor',{ role: 'officer',    is_approved: false, suspended: false }, false, true ],
    ['purana schema',{ role: 'officer',    is_approved: true,  is_suspended: true }, true, false],
  ];
  for (const [naam, o, moattal, ghairManzoor] of soortein) {
    assert.strictEqual(f.afsarMoattal(o), moattal, naam + ' — mo\'attali');
    assert.strictEqual(f.afsarGhairManzoor(o), ghairManzoor, naam + ' — manzoori');
  }
  // column hi na ho to shart lagni hi nahi chahiye (kisi ko tala na lage)
  assert.strictEqual(f.afsarGhairManzoor({ role: 'officer' }), false);
  assert.strictEqual(f.afsarMoattal({ role: 'officer' }), false);
});

test('SQL گیٹ اب صحیح کالم پر', () => {
  // DB ka kalam `suspended` hai (42703: Perhaps you meant officers.suspended)
  for (const f of fs.readdirSync(path.join(ROOT, 'sql')).filter((x) => x.endsWith('.sql')))
    assert.ok(!/is_suspended/.test(sqlAmli('sql/' + f)), f + ' me is_suspended hai (42703 se rad ho jayegi)');
  for (const f of [...SQL_ADMIN_RPC, 'sql/94d_request_rpc_fix.sql'])
    assert.ok(/o\.suspended/.test(sqlAmli(f)), f + ' me mo\'attali ki shart hi nahi rahi');
});

test('تشخیصی SQL کسی کالم پر بھروسہ نہ کرے', () => {
  const s = read('sql/71_license_diagnose.sql');
  const amli = s.split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  assert.ok(/to_jsonb\(/.test(amli), 'column mojood na ho to bhi query rad na ho');
  assert.ok(!/\bo\.is_suspended\b/.test(amli), 'seedha column reference na ho');
  assert.ok(!/\b(update|delete|insert|drop|alter|truncate|grant|revoke)\b/i.test(amli),
    'sirf parhne wali file');
});

test('افسر تلاش: غلط کالم کی وجہ سے خانہ خالی نہ رہے', () => {
  const s = read('case-sharing.js');
  assert.ok(!/select\('id,full_name,badge_number,designation,station,is_approved,is_suspended'\)/.test(s),
    'yahi query 42703 se rad hoti thi — fehrist hamesha khali');
  assert.ok(/42703/.test(s), 'dusre naam par dobara koshish');
  assert.ok(/o\.suspended !== true/.test(s) && /o\.is_suspended !== true/.test(s),
    'donon naam par chhantai');
});

test('ایج فنکشن: ?pubkey صرف عوامی حصہ دے، نجی کلید کبھی نہیں', () => {
  const src = read('supabase/functions/dio-license/index.ts');
  const a = src.indexOf('const pub = {');
  const b = src.indexOf('};', a) + 2;
  assert.ok(a > -1, '?pubkey shakh mojood ho');
  const tukra = src.slice(a, b).replace(/\(PRIV_JWK as Record<string, unknown>\)/g, 'PRIV_JWK');
  assert.ok(!/\bd\b\s*:/.test(tukra), 'object me `d` ka khana hi na ho');
  const PRIV = { kty:'EC', crv:'P-256', d:'RAAZ-NIJJI-KLEED', x:'XX', y:'YY', ext:true };
  const pub = new Function('PRIV_JWK', tukra + '; return pub;')(PRIV);
  assert.strictEqual(JSON.stringify(Object.keys(pub).sort()), '["crv","kty","x","y"]');
  assert.ok(JSON.stringify(pub).indexOf('RAAZ-NIJJI-KLEED') < 0, 'nijji kleed kisi soorat bahar na jaye');
  // ye shakh JWT se pehle hai, magar sirf GET + ?pubkey par
  assert.ok(/req\.method === "GET" && new URL\(req\.url\)\.searchParams\.has\("pubkey"\)/.test(src),
    'sirf GET ?pubkey par chale — POST wala license raasta na badle');
});

test('عوامی کلید اصلی P-256 نقطہ ہو (ٹائپنگ کی غلطی نہ رہ جائے)', () => {
  const src = read('license-token.js');
  const x = src.match(/"x":\s*"([^"]*)"/)[1];
  const y = src.match(/"y":\s*"([^"]*)"/)[1];
  assert.ok(!/REPLACE_WITH/.test(x + y), 'placeholder reh gaya');
  const b = (s) => Buffer.from(s.replace(/-/g,'+').replace(/_/g,'/'), 'base64');
  assert.strictEqual(b(x).length, 32, 'x 32 bytes ho');
  assert.strictEqual(b(y).length, 32, 'y 32 bytes ho');
  // y^2 = x^3 - 3x + b  (mod p) — aik harf bhi ghalat ho to ye shart toot jati hai
  const p  = 2n**256n - 2n**224n + 2n**192n + 2n**96n - 1n;
  const bb = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604bn;
  const X = BigInt('0x' + b(x).toString('hex'));
  const Y = BigInt('0x' + b(y).toString('hex'));
  const mod = (v) => ((v % p) + p) % p;
  assert.strictEqual(mod(Y*Y), mod(X*X*X - 3n*X + bb), 'kleed P-256 curve par nahi — naqal karte waqt harf badal gaya');
});

test('96_CHECK: sirf parhti hai, aur dono hisse jaanchti hai', () => {
  const s = sqlAmli('sql/96_CHECK.sql');
  assert.ok(!/\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|comment)\s/i.test(
    s.replace(/'[^']*'/g, "''")), 'jaanch kuch badle nahi — sirf select');
  assert.strictEqual((s.replace(/'[^']*'/g, "''").match(/;/g) || []).length, 1,
    'aik hi statement (editor natija zaroor dikhaye) — qoutes ke andar ka ; ginti mein nahi');
  assert.ok(/'1_client_errors'/.test(s) && /'2_officers_trigger'/.test(s));
  assert.ok(/service_role/.test(s) && /auth\\\.uid\\\(\\\)\\s\+is\\s\+null/.test(s),
    'server ki pehchan aur uid-null chhoot dono dekhe');
});

test('97: admin ka ikhtiyar sirf manzoor-shuda ko — aur NULL admin ho to ruk jaye', () => {
  const g = read('sql/97_officers_approved_fail_closed.sql');
  const amli = g.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n');
  assert.ok(/coalesce\(o\.is_approved,false\)\s+= true/.test(amli), 'NULL = ghair-manzoor (fail-closed)');
  assert.ok(!/coalesce\(o\.is_approved,\s*true\)/.test(amli), 'fail-open wapas na aaye');
  assert.ok(/o\.is_approved is null[\s\S]{0,200}raise exception 'RUKA/.test(amli),
    'NULL manzoori wala admin mojood ho to kuch na badle (warna wo foran ikhtiyar kho deta)');
  // baqi hifazat bilkul wahi
  assert.ok(/current_user = 'service_role'/.test(amli) && /if auth\.uid\(\) is null then\s+raise exception/.test(amli));
  assert.ok(/sirf apni profile tabdeel ki ja sakti hai/.test(amli) && /new\.role\s+:= 'officer'/.test(amli));
  const r = read('sql/97_ROLLBACK.sql');
  assert.ok(/coalesce\(o\.is_approved,true\)/.test(r), 'wapsi bilkul asal halat lautaye');
});

test('v530: log aut sirf IS aale ka — doosre aalon (phone) ka fingerprint/PIN zinda rahe', () => {
  const a = read('auth.js');
  const lo = a.slice(a.indexOf('async function doLogout'), a.indexOf('function showRegister'));
  assert.ok(/signOut\(\{ scope: 'local' \}\)/.test(lo),
    "supabase-js ka default 'global' afsar ke HAR aale ka session band kar deta hai");
  assert.ok(!/signOut\(\)\s*;/.test(lo), 'bina scope ke signOut log aut mein na ho');
  // quick login ke baad token ki khud-kar tajdeed dobara chalu
  const lw = a.slice(a.indexOf('async function _dioLoginWithToken'), a.indexOf('window._dioSaveAuthToken'));
  assert.ok(/startAutoRefresh\(\)/.test(lw), 'taala kholne ke baad auto-refresh chalu ho');
});

test('v530: fingerprint ki kaal se pehle koi await nahi (iPhone/Safari lams ki shart)', () => {
  const a = read('auth.js');
  for (const [fn, call] of [['async function doBiometric', 'navigator.credentials.get'],
                            ['async function enableBiometric', 'navigator.credentials.create']]) {
    // khud is kaal ka apna `await` (await navigator.credentials...) ginti mein nahi
    const body = a.slice(a.indexOf(fn), a.indexOf(call, a.indexOf(fn))).replace(/(const \w+ = )?await\s*$/, '');
    assert.ok(!/\bawait\b/.test(body), fn + ': ' + call + ' se pehle await — Safari lams ko radd kar deta hai');
  }
  assert.ok(/function _dioBioWhy/.test(a) && /isUserVerifyingPlatformAuthenticatorAvailable/.test(a),
    'nakami ki asal wajah aale se pooch kar batayi jaye');
  assert.ok(/m === 'biometric'[\s\S]{0,80}_dioBioPrecheck/.test(a), 'tab khulte hi aala jaancha jaye');
});

test('v530: mobile par login card hamesha poori screen — teeno tab barabar', () => {
  const c = read('ui-home.css');
  const m = c.slice(c.indexOf('موبائل (v530)'));
  assert.ok(/min-height: calc\(100dvh - 16px\)/.test(m), 'card dikhne wali poori unchai le');
  assert.ok(/grid-template-rows: auto auto 1fr auto/.test(m), 'safed hissa bachi jagah le');
  assert.ok(/#panel-biometric \{ margin-block: auto; \}|#panel-biometric[\s\S]{0,40}margin-block: auto/.test(m),
    'har tab ka mawad beech mein');
});

test('98_CHECK: safai se pehle ki jaanch — sirf parhti hai', () => {
  const s = sqlAmli('sql/98_CHECK.sql');
  const bina = s.replace(/'[^']*'/g, "''");
  assert.ok(!/\b(insert|update|delete|truncate|drop|alter|create|grant|revoke|comment)\s/i.test(bina),
    'jaanch kuch badle nahi — sirf select');
  assert.strictEqual((bina.match(/;/g) || []).length, 1, 'aik hi statement');
  assert.ok(/having count\(\*\) > 1/.test(s), 'hubahu doharavi policies');
  assert.ok(/audit_log'\), \('audit_logs'/.test(s), 'dono audit tables');
  assert.ok(/to_regclass/.test(s) && /case when tbl\.oid is null then null/.test(s),
    'table na ho to bhi query rad na ho');
});

test('99: audit_log na mitaya ja sake na badla (RESTRICTIVE) — aur khatre par ruk jaye', () => {
  const g = sqlAmli('sql/99_audit_log_immutable.sql');
  assert.ok(/"Nobody can delete audit log" on public\.audit_log\s+as restrictive for delete to authenticated using \(false\)/.test(g),
    'PERMISSIVE using(false) kuch nahi rokti — RESTRICTIVE chahiye');
  assert.ok(/"Nobody can update audit log" on public\.audit_log\s+as restrictive for update to authenticated using \(false\)/.test(g));
  assert.ok(!/for (insert|select)/.test(g), 'parhna aur likhna (DB triggers) na chhua jaye');
  assert.ok(/v_cnt <> 2[\s\S]{0,40}raise exception 'RUKA/.test(g), 'halat tawaqqo se mukhtalif ho to ruk jaye');
  assert.ok(/not p\.prosecdef[\s\S]{0,120}audit_log[\s\S]{0,200}raise exception 'RUKA/.test(g),
    'afsar ke ikhtiyar se chalne wala koi function audit_log badalta ho to ruk jaye');
  const r = sqlAmli('sql/99_ROLLBACK.sql');
  assert.ok(/as permissive for delete/.test(r) && /as permissive for update/.test(r), 'wapsi asal halat lautaye');
});

test('v538: kahin na bane functions/variables ki 7 asli ghaltiyan wapas na aayen', () => {
  const s = read('settings.js'), f = read('fivec.js'), e = read('evidence.js'),
        o = read('offline-store.js'), r = read('reminders.js'), b = read('bin.js'), d = read('data-api.js'), c = read('cases.js');
  assert.ok(!/_saveOfflineAuth\(/.test(s) && /_dioSavePwVerifier/.test(s), 'password badalne par ghalti ka jhoota paigham');
  assert.ok(/async function _dioSavePwVerifier/.test(read('auth.js')), 'offline record ka helper');
  assert.ok(!/_showSyncBar\(/.test(f) && /function _fcOfflineNote/.test(f), '5-C offline save ke baad ghalti');
  assert.ok(!/printContent\(/.test(e) && /dioPrint\(_html\)/.test(e), 'shahadat ki report chhapai');
  assert.ok(!/url\?\.publicUrl/.test(o), 'offline shahadat ka DB record');
  assert.ok(!/r\?\.text/.test(r) && /getReminders\(\)/.test(r.slice(r.indexOf('async function _deleteRem'))), 'yaaddehani recycle bin');
  assert.ok(!/\|\| container;/.test(b), 'bin.js');
  // CSP: connect-src mein data: nahi — is liye fetch('data:…') mana
  for (const [n, t] of [['data-api.js', d], ['offline-store.js', o], ['cases.js', c]])
    assert.ok(!/fetch\((fileInfo\.dataUrl|fileRec\.fileData|window\._wevDataUrl)\)/.test(t), n + ': fetch(data:) CSP se rukta hai');
  assert.ok(/function dioDataUrlToBlob/.test(o), 'data-URL → Blob bina fetch');
  assert.ok(/^var selectedSections = \[\];$/m.test(read('case-form.js')), 'implicit global ka saaf elaan');
});

test('v538: ESLint ka "not defined" sirf asli ghalti dikhaye (doosri file ke naam maloom)', () => {
  const cfg = read('eslint.config.mjs');
  assert.ok(/function appGlobals\(\)/.test(cfg) && /\.\.\.appGlobals\(\)/.test(cfg),
    '739 jhoote alarm asli ghaltiyon ko chhupa dete the');
});

test('v541: ادائیگی فارم میں بیکار «نوٹ» خانہ نہیں — اور ضمنی کا مردہ خودکار نمبرنگ کوڈ ہٹ چکا', () => {
  const s = read('subscription.js');
  assert.ok(!/id="pay-note"/.test(s), 'جو لکھا جائے وہ کہیں نہ جائے تو خانہ نہ ہو');
  const z = read('zimni.js');
  for (const fn of ['_zimniNumberAll', '_zimniAutoNumbers', '_zimniAlignSerial', '_zimniStartNumbers'])
    assert.ok(new RegExp('function ' + fn + '\\(').test(z), fn + ' کا نام برقرار رہے (بلانے والے موجود ہیں)');
  assert.ok(!/function _zimniParas\(/.test(z), 'خودکار نمبر شمار کا مردہ حصہ واپس نہ آئے');
  assert.ok(!/_zfNumIv\s*=\s*setInterval/.test(z) && !/_zfNumObs\s*=\s*new MutationObserver/.test(z),
    'کالم 2 مکمل دستی — کوئی خودکار ٹائمر/observer نہیں');
  assert.ok(!/files: \['zimni\.js'\][\s\S]{0,40}no-unreachable/.test(read('eslint.config.mjs')),
    'zimni.js کو no-unreachable کی چھوٹ کی اب ضرورت نہیں');
});

test('v542: مقدمہ کی ترمیم پر جرم کی قسم/SHO/SDPO/نوٹ نہ مٹیں', () => {
  const f = read('case-form.js');
  // محفوظ کرنے والا کوڈ ان خانوں کو پڑھتا ہے — خانہ نہ ہو تو '' لکھا جاتا تھا (ہر ترمیم پر ڈیٹا ضائع)
  for (const id of ['cf-offence', 'cf-sho', 'cf-sdpo', 'cf-notes', 'cf-position']) {
    if (new RegExp("getElementById\\('" + id + "'\\)").test(f))
      assert.ok(new RegExp("id=\"" + id + "\"").test(f), id + ' فارم میں موجود ہو (چھپا ہی سہی) — ورنہ ترمیم پر قدر مٹ جاتی ہے');
  }
});

test('v544: نئے مقدمے کے کارڈ میں «جرم» کا خانہ نہیں؛ ترمیم پرانی قدریں نہیں مٹاتی', () => {
  const f = read('case-form.js'), c = read('cases.js');
  for (const id of ['cf-offence', 'cf-sho', 'cf-sdpo', 'cf-notes'])
    assert.ok(!f.includes(id), id + ' فارم میں نہیں (افسر کا فیصلہ)');
  const edit = f.slice(f.indexOf('async function saveEditCase('));
  for (const k of ['offence_type', 'sho:', 'sdpo:', 'notes:'])
    assert.ok(!edit.slice(0, edit.indexOf('updateCase(') + 400).includes(k), k + ' ترمیم میں نہ بھیجا جائے — DB کی قدر نہ مٹے');
  const add = c.slice(c.indexOf('function addSection('), c.indexOf('function removeSection('));
  assert.ok(!/cf-offence/.test(add), 'دفعہ چننے پر جرم میں کچھ نہ لکھا جائے');
});

test('v544: «بجرم»/جرم کی جگہ پورے سسٹم میں صرف دفعات — جرم کی تفصیل (offence_type) نہیں چھپتی', () => {
  // ضمنی جیسا اصول: offence_type صرف تلاش کی query میں رہ سکتا ہے، کسی دستاویز/ڈسپلے میں نہیں
  const files = ['naqsha-mauqa.js', 'zimni.js', 'report173.js', 'dio-prev.js', 'saza-slip.js',
    'darkhwastain.js', 'misal-templates.js', 'incident.js', 'cases.js', 'search.js', 'cdr-imei.js'];
  for (const fn of files) {
    const lines = read(fn).split('\n').filter(l => /offence_type/.test(l) && !/\.select\(/.test(l));
    assert.deepEqual(lines, [], fn + ' میں جرم کی تفصیل نہ چھپے');
  }
});

test('103_CHECK: v542 کے اثر کی جانچ — صرف پڑھتی ہے', () => {
  const s = read('sql/103_CHECK.sql').split('\n').filter(l => !l.trim().startsWith('--')).join('\n');
  const bina = s.replace(/'[^']*'/g, "''");
  assert.ok(!/\b(insert|update|delete|truncate|drop|alter|create|grant|revoke)\s/i.test(bina), 'sirf select');
  assert.strictEqual((bina.match(/;/g) || []).length, 1, 'aik hi statement');
  assert.ok(/action = 'case\.updated'/.test(s) && /in \('sho', 'sdpo'\)/.test(s), 'sirf wahi jo audit mein darj hai');
});

test('v545: کوئی خالی catch باقی نہیں — اور نیا خالی catch build روکتا ہے', () => {
  const fs = require('fs'), path = require('path');
  const root = path.join(__dirname, '..');
  const files = fs.readdirSync(root).filter(f => f.endsWith('.js') && f !== 'sw.js');
  const bad = [];
  for (const f of files) {
    const t = fs.readFileSync(path.join(root, f), 'utf8');
    // اندر کی HTML/print اسکرپٹ بھی جانچی جاتی ہے؛ تبصرہ «C» بن جاتا ہے (یعنی وجہ لکھی ہے)،
    // اور promise کا .catch() الگ چیز ہے
    const m = t.replace(/\/\*[\s\S]*?\*\//g, 'C').replace(/\/\/[^\n]*/g, 'C')
      .replace(/\.catch\(/g, '.CATCH(').match(/catch\s*(\([^)]*\))?\s*\{\s*\}/g);
    if (m) bad.push(f + ': ' + m.length);
  }
  assert.deepEqual(bad, [], 'har catch میں یا غلطی درج ہو یا وجہ لکھی ہو');
  assert.ok(/'no-empty': \['error'/.test(read('eslint.config.mjs')), 'خالی catch اب error ہے، warning نہیں');
  // جہاں غلطی چھپنے سے ڈیٹا ضائع ہو سکتا تھا وہاں غلطی درج ہو
  for (const [f, label] of [['naqsha-mauqa.js', 'naqsha: server par save nakaam'], ['naqsha-mauqa.js', 'naqsha: local save nakaam'],
      ['zimni.js', 'zimni: local list save nakaam'], ['saza-slip.js', 'saza slip: local save nakaam'],
      ['offline-store.js', 'sync queue: item failed mark nakaam'], ['data-api.js', 'offline evidence: file local store nakaam']])
    assert.ok(read(f).includes("dioLogError('" + label + "'"), f + ' — ' + label);
});

test('v546: سرور کا نتیجہ دیکھے بغیر «محفوظ» نہیں — ناکامی پر صاف پیغام، آف لائن پر قطار', () => {
  const d = read('data-api.js');
  assert.ok(/async function dioSaveRow\(/.test(d) && /function dioSaveToast\(/.test(d), 'مرکزی helper موجود');
  assert.ok(/offlineStore\.enqueue\(table, op/.test(d), 'انٹرنیٹ نہ ہو تو قطار');
  const g = read('sho-dsp.js'), st = read('settings.js'), sd = read('saved-docs.js'), nq = read('naqsha-mauqa.js');
  assert.ok(!/showToast\('سرکاری گاڑی محفوظ'/.test(g) && /dioSaveRow\('sarkari_gari'/.test(g), 'گاڑی: نتیجہ دیکھ کر');
  assert.ok(!/تصویر اپ ڈیٹ ہو گئی/.test(st) && (st.match(/dioSaveRow\('officers'/g) || []).length === 2, 'تصویر: لگانا اور ہٹانا دونوں');
  assert.ok(/dioSaveRow\('case_documents', 'delete'/.test(sd) && !/showToast\('حذف ہو گئی'/.test(sd), 'دستاویز حذف: نتیجہ دیکھ کر');
  assert.ok(!/TOAST\('✅ نقشہ موقع محفوظ ہو گیا', 'success'\);\n/.test(nq) && /_isPending\(_naqCaseId\)/.test(nq), 'نقشہ: زیرِ التوا مقامی کاپی ترجیح پائے');
  assert.ok(/objectStoreNames\.contains\(table\+'_cache'\)/.test(read('offline-store.js')), 'قطار کا delete: cache store نہ ہو تو جھوٹی ناکامی نہیں');
  assert.ok(/drop\(\); reject\(new Error\('fabric net'\)\)/.test(nq), 'fabric لوڈ ناکام ہو تو دوسری بار نقشہ اٹکے نہیں');
});

// ═══ v547 ═══════════════════════════════════════════════════════════
// Supabase کا ہر write (insert/update/upsert/delete) — نتیجہ دیکھے بغیر کبھی نہیں۔
// AST سے پورے سسٹم کی جانچ: نتیجہ پھینک دیا گیا ہو (صرف `await …;`) یا {error}
// نکالے بغیر destructure کیا گیا ہو تو ناکام۔ مستثنیٰ صرف وہ جہاں ناکامی کا
// بتانا ممکن/مطلوب نہیں: error-handler (غلطی کا اپنا اندراج — خود پر لوٹ نہ آئے)۔
// `.then(r => … r.error …)` والی لکھائی بھی قبول (نتیجہ دیکھا جا رہا ہے)۔
test('v547: کوئی سرور لکھائی ایسی نہیں جس کا نتیجہ نہ دیکھا جائے', () => {
  const espree = require(path.join(ROOT, 'node_modules', 'espree'));
  const WRITE = new Set(['insert', 'update', 'upsert', 'delete']);
  const ALLOW = new Set(['error-handler.js:client_errors']);
  const bad = [];
  const files = fs.readdirSync(ROOT).filter((f) => f.endsWith('.js') && f !== 'sw.js');
  for (const f of files) {
    const src = read(f);
    const ast = espree.parse(src, { ecmaVersion: 2022, loc: true, range: true });
    const walk = (n, parent) => {
      if (!n || typeof n.type !== 'string') return;
      n._p = parent;
      for (const k of Object.keys(n)) {
        if (k === '_p') continue;
        const v = n[k];
        if (Array.isArray(v)) v.forEach((c) => walk(c, n)); else if (v && typeof v.type === 'string') walk(v, n);
      }
      if (n.type !== 'CallExpression' || n.callee.type !== 'MemberExpression') return;
      const p = n._p;
      if (p && p.type === 'MemberExpression' && p.object === n) return;        // زنجیر کا اندرونی حصہ
      const ops = []; let table = null; let c = n;
      while (c && c.type === 'CallExpression' && c.callee.type === 'MemberExpression') {
        const name = c.callee.property.name; ops.unshift(name);
        if (name === 'from' && c.arguments[0]) table = c.arguments[0].type === 'Literal' ? c.arguments[0].value : '(expr)';
        c = c.callee.object;
      }
      const fi = ops.indexOf('from');
      if (fi < 0 || !ops.slice(fi + 1).some((o) => WRITE.has(o)) || (c && c.type === 'MemberExpression' && c.property.name === 'storage')) return;
      if (ALLOW.has(f + ':' + table)) return;
      const text = src.slice(n.range[0], n.range[1]);
      if (ops.includes('then')) { if (!/\.error\b/.test(text.slice(text.lastIndexOf('.then')))) bad.push(f + ':' + n.loc.start.line + ' then بغیر error'); return; }
      let u = p; if (u && u.type === 'AwaitExpression') u = u._p;
      if (!u || u.type === 'ExpressionStatement') bad.push(f + ':' + n.loc.start.line + ' نتیجہ پھینکا');
      else if (u.type === 'VariableDeclarator' && u.id.type === 'ObjectPattern' && !u.id.properties.some((q) => q.key && q.key.name === 'error'))
        bad.push(f + ':' + n.loc.start.line + ' error نہیں نکالا');
    };
    walk(ast, null);
  }
  assert.deepEqual(bad, [], 'نتیجہ دیکھے بغیر لکھائی: ' + bad.join(' · '));
});

test('v547: dioWriteOk — غلطی اور RLS کی خاموش روک (0 قطار) دونوں پر throw', () => {
  const ctx = makeSandbox();
  const logs = [];
  ctx.dioLogError = (m) => logs.push(m);
  const d = read('data-api.js');
  const grab = (name) => { const i = d.indexOf('function ' + name + '('); let j = d.indexOf('\n}\n', i); return d.slice(i, j + 2); };
  vm.runInContext(grab('dioWriteOk'), ctx);
  assert.deepEqual(ctx.dioWriteOk({ data: [{ id: 1 }], error: null }, 'x', true), [{ id: 1 }]);
  assert.deepEqual(ctx.dioWriteOk({ data: { id: 2 }, error: null }, 'x', true), { id: 2 }, 'single() والا نتیجہ');
  assert.throws(() => ctx.dioWriteOk({ data: null, error: { message: 'rls', code: '42501' } }, 'x'), (e) => e.code === '42501', 'سرور کی اصل غلطی آگے جائے');
  assert.throws(() => ctx.dioWriteOk({ data: [], error: null }, 'x', true), (e) => e.code === 'DIO_NOROW');
  assert.throws(() => ctx.dioWriteOk({ data: null, error: null }, 'x', true), (e) => e.code === 'DIO_NOROW');
  assert.doesNotThrow(() => ctx.dioWriteOk({ data: null, error: null }, 'x'), 'needRow کے بغیر خالی نتیجہ ٹھیک');
  assert.equal(logs.length, 3, 'ہر ناکامی درج ہو');
});

test('v547: «حذف شدہ مواد» میں نقل کامیاب ہو تب ہی اصل حذف (یاددہانی، پیشی، مقدمہ، واقعاتی رپورٹ)', () => {
  const b = read('bin.js');
  assert.ok(/\.select\('id'\)\.single\(\);\s*\n\s*if \(error \|\| !data \|\| !data\.id\)/.test(b) && /return data\.id;/.test(b), 'softDelete: سرور کا رد → false');
  assert.ok(!/return true;\s*\n\s*\} catch\(_\) \{ return false; \}/.test(b), 'پرانا «ہمیشہ true» ختم');
  assert.ok(/async function softDeleteUndo\(binId\)/.test(b), 'اصل حذف ناکام → بن کی نقل واپس');
  assert.ok(/async function dioBinCopy\(/.test(read('data-api.js')) && /dioLoadScript\('bin\.js'\)/.test(read('data-api.js')), 'bin.js ابھی نہ آئی ہو تو پہلے لاؤ');
  const order = (f, copy, del) => { const s = read(f); const i = s.indexOf(copy), j = s.indexOf(del, i); return i > 0 && j > i && /if \(!binId\)/.test(s.slice(i, j)); };
  assert.ok(order('reminders.js', "dioBinCopy('reminder'", 'await deleteReminder(id)'), 'یاددہانی');
  assert.ok(order('court.js', 'dioBinCopy("court"', 'from("court_dates").delete()'), 'پیشی');
  assert.ok(order('cases.js', "dioBinCopy('case'", 'await deleteCase(id)'), 'مقدمہ');
  const ir = read('incident.js'); assert.ok(/if \(!binId\) throw new Error/.test(ir) && ir.indexOf("dioBinCopy('incident'") < ir.indexOf("from('incident_reports').delete().eq('id', id)"), 'واقعاتی رپورٹ');
  for (const f of ['reminders.js', 'court.js', 'cases.js', 'incident.js']) assert.ok(/softDeleteUndo\(binId\)/.test(read(f)), f + ': حذف ناکام → نقل واپس');
  assert.ok(!/_binRestore[\s\S]{0,900}await supabaseClient\.from\(table\)\.insert\(\{ \.\.\.restoreData, officer_id: oid \}\);/.test(b), 'بحالی ناکام → بن سے نہ ہٹے');
});

test('v547: سرکاری گاڑی — آف لائن دو بار محفوظ = قطار میں ایک ہی اندراج', () => {
  const o = read('offline-store.js'), g = read('sho-dsp.js'), d = read('data-api.js');
  assert.ok(/async enqueue\(table,op,data,tempId,key\)/.test(o) && /p\.key===key && p\.table===table && p\.op===op/.test(o), 'قطار: اسی چابی کا اندراج بدلے');
  assert.ok(/async function dioSaveRow\(table, op, rec, opts\)/.test(d) && /opts && opts\.queueKey/.test(d));
  assert.ok(/queueKey: 'sarkari_gari:' \+ cid/.test(g) && /from\('sarkari_gari'\)\.select\('id'\)\.eq\('officer_id', oid\)/.test(g), 'گاڑی: چابی + سرور پر پرانی قطار کی تلاش');
});

test('v547/v553: ملزم کا سابقہ ریکارڈ — FIR، بجرم دفعات اور تھانہ (اصل کالموں سے، dio-prev.js کی یکجا فہرست)', () => {
  const p = read('dio-prev.js'), m = read('mulziman.js');
  assert.ok(/select\('id,fir_number,fir_date,section_of_law,complainant,complainant_cnic,status,case_station,case_district'\)/.test(p), 'مقدمات: اصل کالم');
  assert.ok(/jurm: \(c\.section_of_law \|\| ''\)\.trim\(\), thana: c\.case_station \|\| ''/.test(p), 'بجرم = صرف دفعات، تھانہ = case_station');
  assert.ok(!/c\.u_s|c\.dafaat|c\.police_station/.test(p + m), 'غیر موجود کالم نہیں');
});

test('v547: 5-C — نمبر اور فائلیں: نتیجہ دیکھ کر؛ پہلے درخواست، پھر فائل', () => {
  const o = read('offline-store.js'), f = read('fivec.js');
  assert.ok(/_markQueueItem\(item\.qid,'pending',\{data:\{\.\.\.data,_mainId:rec\.id\}\}\)/.test(o) && /if\(_mainId\)\{ rec=\{\.\.\.main,id:_mainId\}; \}/.test(o), 'قطار: نمبر رہ جائیں تو دوبارہ کوشش دوہری درخواست نہ بنائے');
  assert.ok(f.indexOf("from('applications_5c').delete().eq('id',id).select('id')") < f.indexOf("storage.from('5c-attachments').remove(atts.map"), 'درخواست کا حذف پہلے، فائلیں بعد میں');
  assert.ok(/e\.code='DIO_5C_NUMBERS'/.test(f) && /e\.code==='DIO_5C_NUMBERS'\)\{closeModal\(\)/.test(f), 'نمبر رہ گئے: کارڈ بند (دوبارہ محفوظ = دوہری درخواست نہیں) اور صاف پیغام');
});

test('v547: تلاش اور سابقہ ریکارڈ پرانے «جرم کی قسم» کالم کو نہیں چھیڑتے', () => {
  for (const f of ['search.js', 'dio-prev.js']) assert.ok(!/offence_type/.test(read(f)), f);
});

test('v547: ریپو کی صفائی — پرانی zip اور backup فائلیں (ویب سائٹ پر کھلی) ہٹ چکیں', () => {
  for (const f of ['digital-io-v503.zip', 'dio-challan-form-v493.zip', 'backups/report173_BEFORE_A4FIX.js'])
    assert.ok(!fs.existsSync(path.join(ROOT, f)), f);
  assert.ok(!fs.readdirSync(ROOT).some((f) => /\.(zip|bak|tgz)$/i.test(f)), 'جڑ میں کوئی zip/backup نہیں');
});

// ═══ v548 — گشت لاگ ══════════════════════════════════════════════════
test('v548: گشت لاگ پورے سسٹم میں جڑا ہے (صفحہ، Dashboard، نیا اندراج، تلاش، حذف شدہ مواد، پرنٹ)', () => {
  const g = read('gasht.js');
  assert.ok(/registerPage\('gasht', renderGasht\)/.test(g), 'صفحہ');
  assert.ok(/gasht:\s+'gasht\.js'/.test(read('boot.js')) && /'incident\.js', 'gasht\.js'/.test(read('boot.js')), 'boot: مانگ پر + فرصت میں');
  const ac = read('app-core.js');
  assert.equal((ac.match(/'incident','gasht','reminders'/g) || []).length, 4, 'چاروں عہدوں کو رسائی');
  assert.ok(/gasht:'گشت لاگ'/.test(ac), 'عنوان');
  const ix = read('index.html');
  assert.ok(/'#gasht':\s+'gasht'/.test(ix), 'route');
  assert.ok(/'#gl-doc',\s+\/\/ گشت رپورٹ/.test(ix), 'Ctrl+P: صرف کھلی دستاویز چھپے');
  assert.ok(/\{ l:'گشت لاگ',\s+ic:'gasht',\s+go:"showPage\('gasht',null\)" \}/.test(read('dashboard.js')), 'Dashboard tile');
  const de = read('dio-entry.js');
  assert.ok(/\['gasht', 'گشت', SVG\(/.test(de) && /kind === 'gasht'[\s\S]{0,200}openGashtEntry\(\)/.test(de), 'نیا اندراج hub');
  const sr = read('search.js');
  assert.ok(/from\('gasht_logs'\)\.select\('\*'\)\.eq\('officer_id', oid\)/.test(sr) && /card\('گشت'/.test(sr), 'مرکزی تلاش');
  assert.ok(/gasht:\s+'gasht_logs'/.test(read('bin.js')) && /case 'gasht':/.test(read('bin.js')), 'حذف شدہ مواد: بحالی');
  assert.ok(/'\/gasht\.js'/.test(read('sw.js')), 'آف لائن (SW precache)');
  assert.ok(/from\('gasht_logs'\)/.test(read('backup.js')), 'بیک اپ');
});

test('v548: گشت لاگ — نظام کے اصول (pt، DD/MM/YYYY، کوئی محکمہ سرخی نہیں، Ctrl+P = بٹن، v547 لکھائی)', () => {
  const g = read('gasht.js');
  assert.ok(!/font-size\s*:\s*[\d.]+px/.test(g), 'font ہمیشہ pt');
  assert.ok(!/toLocaleDateString|toLocaleString\(/.test(g), 'تاریخ کبھی locale سے نہیں');
  assert.ok(!/پنجاب|Punjab/.test(g), 'کوئی «پنجاب پولیس» سرخی نہیں');
  assert.ok(/data-dio-print onclick="_glPrint\(\)"/.test(g) && /function _glPrint\(\)[\s\S]{0,200}window\.print\(\)/.test(g), 'پرنٹ بٹن = native چھپائی (Ctrl+P کا راستہ)');
  assert.ok(/dio-doc-h1/.test(g) && /dio-doc-h2/.test(g) && /font-size:20pt !important/.test(g) && /\.gl-h2\{ font-size:16pt/.test(g), 'عنوان 20pt / ذیلی 16pt');
  assert.ok(/@page\{ size:A4 portrait; margin:1cm 0\.5in 1cm 0\.4in; \}/.test(g), 'A4 + سرکاری مارجن ہر صفحے پر');
  assert.ok(/dioBinCopy\('gasht'/.test(g) && /softDeleteUndo\(binId\)/.test(g), 'حذف: پہلے نقل');
  assert.equal((g.match(/dioWriteOk\(await supabaseClient\.from\(GL_TABLE\)/g) || []).length, 3, 'insert/update/delete — نتیجہ دیکھ کر');
  assert.ok((g.match(/_glGuard\('/g) || []).length >= 6, 'میعاد ختم: لکھنا بند');
  assert.ok(!/_glGuard\('پرنٹ'/.test(g), 'پڑھنا/چھاپنا بند نہیں');
  assert.ok(/D\.open\('گشت اندراج'/.test(g) && /type: 'mob'/.test(g) && /type: 'time'/.test(g), 'مشترکہ «نیا اندراج» کارڈ، موبائل/وقت کا فارمیٹ');
});

test('v548: گشت — وقت کا 12 گھنٹے سے 24 گھنٹے میں درست الٹ (صبح/دوپہر/سہ پہر/شام/رات)', () => {
  const g = read('gasht.js');
  const grab = (name) => { const i = g.indexOf('function ' + name + '('); const j = g.indexOf('\n}\n', i); return g.slice(i, j + 2); };
  const ctx = makeSandbox();
  vm.runInContext(['_glPad', '_glPeriod', '_glTimeHtml', '_glFrom12', '_glIsoDate', '_glAddDays', '_glParseDtText'].map(grab).join('\n') +
    '\nvar _glMeta = { date_iso: "2026-10-14", start_iso: "2026-10-14T22:30" };', ctx);
  const plain = (h) => h.replace(/<[^>]+>/g, '').replace(/ /g, ' ');
  for (let h = 0; h < 24; h++) {
    const hm = String(h).padStart(2, '0') + ':07';
    const shown = plain(ctx._glTimeHtml(hm));
    const m = shown.match(/(\d{2}):(\d{2})/);
    assert.equal(String(ctx._glFrom12(+m[1], shown)).padStart(2, '0') + ':' + m[2], hm, hm + ' → «' + shown + '» → واپس');
  }
  assert.equal(ctx._glParseDtText('15/10/2026 بوقت 08:30 بجے صبح', false, 'start'), '2026-10-15T08:30');
  assert.equal(ctx._glParseDtText('01:15 بجے رات', false, 'end'), '2026-10-15T01:15', 'واپسی آدھی رات کے بعد = اگلا دن');
  assert.equal(ctx._glParseDtText('11:45 بجے رات', false, 'end'), '2026-10-14T23:45');
  assert.equal(ctx._glParseDtText('14/10/2026', true), '2026-10-14');
});

test('v548: گشت کا کاغذ — انگریزی/ہندسے پورے ٹکڑے میں LTR، دستخط مشاہدات کے ساتھ، لیبل ایک سطر میں ناپے', () => {
  const g = read('gasht.js');
  const line = g.split('\n').find((l) => l.startsWith('const GL_LATIN_RE ='));
  assert.ok(line, 'GL_LATIN_RE موجود');
  const re = vm.runInNewContext(line.replace('const GL_LATIN_RE =', '').replace(/;\s*$/, ''));
  const tok = (t) => t.match(re) || [];
  // ٹکڑا کبھی بیچ سے نہ ٹوٹے — ورنہ RTL سطر میں «LEA-1234» → «1234-LEA» ہو جاتا
  assert.deepEqual(tok('LEA-1234 — ڈرائیور'), ['LEA-1234']);
  assert.deepEqual(tok('HC محمد اسلم 1122، کانسٹیبل 3344'), ['HC', '1122', '3344']);
  assert.deepEqual(tok('متعلقہ شخص — 0303-2333981'), ['0303-2333981']);
  assert.deepEqual(tok('14/10/2026 بوقت 08:30 بجے'), ['14/10/2026', '08:30']);
  assert.deepEqual(tok('+92 300-1234567 · abc.def@x.pk · رپورٹ #12'), ['+92', '300-1234567', 'abc.def@x.pk', '#12']);
  assert.deepEqual(tok('فیاض حسین شاد تھانہ صدر ملتان'), [], 'صرف اردو — کچھ نہیں');
  assert.ok(/<div class="gl-final">[\s\S]{0,200}مشاہدات \/ ہدایات[\s\S]{0,200}'remarks'[\s\S]{0,300}'sign_line'/.test(g), 'مشاہدات + آخری سطر + دستخط ایک گروہ');
  assert.ok(/#gl-doc \.gl-final, #gl-doc \.gl-tail\{ break-inside:avoid;/.test(g), 'گروہ صفحے پر نہ ٹوٹے');
  assert.ok(/function _glFitLabels[\s\S]{0,900}white-space:nowrap[\s\S]{0,400}document\.body\.appendChild\(probe\)/.test(g), 'لیبل کا کالم: ایک سطر کی اصل چوڑائی، کاغذ سے باہر ناپ (zoom / موبائل منظر کا اثر نہیں)');
});

test('v548: sql/104 — گشت کی table: اپنا ریکارڈ، میعاد ختم = صرف پڑھنا، anon/TRUNCATE بند', () => {
  const s = read('sql/104_gasht_log.sql');
  assert.ok(/enable row level security/.test(s));
  for (const p of ['dio_gasht_sel', 'dio_gasht_ins', 'dio_gasht_upd', 'dio_gasht_del'])
    assert.ok(new RegExp('create policy ' + p + ' on public\\.gasht_logs[\\s\\S]{0,200}dio_my_officer_id\\(\\)').test(s), p);
  assert.ok(/dio_gasht_ins[\s\S]{0,140}with check \(officer_id = public\.dio_my_officer_id\(\)\)/.test(s), 'کسی اور کے نام پر اندراج نہیں');
  assert.equal((s.match(/as restrictive/g) || []).length, 3, 'لکھنے کی تین روکیں');
  assert.ok(/revoke all on public\.gasht_logs from anon;/.test(s) && /grant select, insert, update, delete on public\.gasht_logs to authenticated;/.test(s), 'anon بند؛ TRUNCATE نہیں');
  assert.ok(!/patrol_logs|patrol_shifts/.test(s.replace(/^\s*--.*$/gm, '')), 'پرانی patrol tables کو نہیں چھیڑا');
  const chk = read('sql/104_CHECK.sql').split('\n').filter(l => !l.trim().startsWith('--')).join('\n').replace(/'[^']*'/g, "''");
  assert.ok(!/\b(insert|update|delete|drop|alter|create|grant|revoke|truncate)\b/i.test(chk), '104_CHECK صرف پڑھتی ہے');
  assert.ok(/if n > 0 then\s+raise exception/.test(read('sql/104_ROLLBACK.sql')), 'واپسی: ریکارڈ ہوں تو کچھ نہیں مٹاتی');
});

// ═══ v551: سسٹم کے تمام فارم ٹمپلیٹس میں (خالی سانچے) ═══
test('v551: ہر چالان / تتمہ / درخواست کا فارم system-forms.js میں موجود (نیا فارم = فہرست میں)', () => {
  const sf = read('system-forms.js');
  const forms = JSON.parse(sf.slice(sf.indexOf('= [') + 2, sf.lastIndexOf(';')));
  const ids = new Set(forms.map(f => f.id));
  const r = read('report173.js'), d = read('darkhwastain.js');
  const block = (src, name) => src.slice(src.indexOf('const ' + name + ' = ['), src.indexOf('];', src.indexOf('const ' + name + ' = [')));
  const idsIn = (b) => [...b.matchAll(/id:'([a-z0-9_]+)'/g)].map(m => m[1]);
  const missing = [];
  idsIn(block(r, 'R173_TYPES')).forEach(t => {
    if (t === 'tatima_challan') idsIn(block(r, 'R173_TATIMA_SUBS')).forEach(s => { if (!ids.has('r173:tatima_challan:' + s)) missing.push('r173:tatima_challan:' + s); });
    else if (!ids.has('r173:' + t)) missing.push('r173:' + t);
  });
  idsIn(block(d, 'DK_TYPES')).forEach(t => { if (!ids.has('dk:' + t)) missing.push('dk:' + t); });
  ['index_naql', 'zamniyat', 'statements_161', 'saza_slip', 'crime_scene', 'cdr_imei', 'rfa_form', 'cro_card', 'incident', 'gasht']
    .forEach(x => { if (!ids.has(x)) missing.push(x); });
  assert.deepStrictEqual(missing, [], 'یہ فارم ٹمپلیٹس میں نہیں — tests/real-app/forms_build.py دوبارہ چلائیں: ' + missing.join(', '));
  forms.forEach(f => {
    assert.ok(f.name && f.html && f.html.length > 300, 'فارم خالی نہیں ہونا چاہیے: ' + f.id);
    assert.ok(!/<script|\son[a-z]+=/i.test(f.html), 'فارم میں اسکرپٹ/handler نہیں: ' + f.id);
    assert.ok(!/\b\d{1,2}\/\d{1,2}\/20\d{2}\b/.test(f.html), 'خالی فارم میں تاریخ نہیں: ' + f.id);
  });
});

test('v551: شیئر صرف متن نہیں — پوری فائل (PDF + Word)', () => {
  ['zimni.js', 'report173.js', 'misal-fir.js', 'gasht.js', 'saved-files.js', 'incident.js'].forEach(f => {
    const s = read(f);
    assert.ok(/dioShare(Doc|Print)\(/.test(s), f + ': شیئر بٹن پوری فائل (dioShareDoc / dioSharePrint) بھیجے');
  });
  const sh = read('dio-share.js');
  assert.ok(/application\/pdf/.test(sh) && /application\/msword/.test(sh), 'PDF اور Word دونوں');
});
