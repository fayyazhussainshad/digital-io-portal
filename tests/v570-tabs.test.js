// v570 (TASK 22) — صفحات کھلے رہیں، Chrome جیسی ٹیبیں، «واپس» / «آگے»، کھڑکی کا X
//   افسر کی منظوری (4 نومبر 2026): پیچھے / آگے دائیں کونے میں؛ ایک ہی «واپس»؛ دستاویز کی اندرونی ٹیبیں ایک ہی پٹی میں؛
//   لاگ اِن کے بعد ڈیش بورڈ سامنے؛ 8 ٹیبیں (موبائل 4)، 10 قدم؛ Alt+T / Alt+W / Alt+PgUp / Alt+PgDn / Ctrl+1–9 / Alt+← →
// اصل ایپ میں پوری جانچ: tests/real-app/t22_test.py، t22_print_test.py، t22_sync_test.py، t22_misc_test.py
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const T = read('dio-tabs.js'), H = read('index.html'), SW = read('sw.js'), A = read('app-core.js'), AU = read('auth.js'), DS = read('dio-sync.js');

function fnSrc(name) {
  const i = T.indexOf('function ' + name + '(');
  assert.ok(i >= 0, name);
  let d = 0, j = T.indexOf('{', i);
  for (let k = j; k < T.length; k++) { if (T[k] === '{') d++; else if (T[k] === '}') { d--; if (!d) return T.slice(i, k + 1); } }
  return '';
}
const keyAction = (() => { const c = {}; vm.runInNewContext(fnSrc('keyAction') + '; this.f = keyAction;', c); return c.f; })();
const ev = (o) => Object.assign({ key: '', code: '', ctrlKey: false, metaKey: false, altKey: false, shiftKey: false, isComposing: false }, o);

test('v570: ٹیب کی کلیدیں (منظور شدہ) — AltGr (Ctrl+Alt) کبھی نہیں روکی جاتی', () => {
  assert.strictEqual(keyAction(ev({ altKey: true, key: 'ArrowLeft' })), 'back');
  assert.strictEqual(keyAction(ev({ altKey: true, key: 'ArrowRight' })), 'fwd');
  assert.strictEqual(keyAction(ev({ altKey: true, code: 'KeyT', key: 'ت' })), 'new');          // اردو کی بورڈ پر بھی
  assert.strictEqual(keyAction(ev({ altKey: true, code: 'KeyW', key: 'و' })), 'close');
  assert.strictEqual(keyAction(ev({ altKey: true, key: 'PageDown' })), 'next');
  assert.strictEqual(keyAction(ev({ altKey: true, key: 'PageUp' })), 'prev');
  assert.strictEqual(keyAction(ev({ ctrlKey: true, code: 'Digit3', key: '3' })), 'tab3');
  assert.strictEqual(keyAction(ev({ ctrlKey: true, code: 'Digit9', key: '9' })), 'tab9');
  assert.strictEqual(keyAction(ev({ ctrlKey: true, key: 'Tab' })), 'next');
  assert.strictEqual(keyAction(ev({ ctrlKey: true, shiftKey: true, key: 'Tab' })), 'prev');
  assert.strictEqual(keyAction(ev({ ctrlKey: true, code: 'KeyT' })), 'new');                   // انسٹال شدہ ایپ
  assert.strictEqual(keyAction(ev({ ctrlKey: true, key: 'Enter' })), 'opennew');
  assert.strictEqual(keyAction(ev({ ctrlKey: true, altKey: true, code: 'KeyT' })), null, 'AltGr = اردو حرف');
  assert.strictEqual(keyAction(ev({ ctrlKey: true, code: 'KeyS' })), null, 'Ctrl+S وغیرہ MS Word والی کلیدیں جوں کی توں');
  assert.strictEqual(keyAction(ev({ ctrlKey: true, code: 'KeyP' })), null);
  assert.strictEqual(keyAction(ev({ key: 'Enter' })), null, 'سادہ Enter = اسی ٹیب میں (براؤزر کا اپنا)');
});

test('v570: حدیں — 8 ٹیبیں (موبائل 4)، ہر ٹیب میں 10 قدم', () => {
  assert.ok(/function maxTabs\(\) \{ return mobile\(\) \? 4 : 8; \}/.test(T));
  assert.ok(/var MAX_STEPS = 10;/.test(T));
});

test('v570: ایک صفحہ دو حالتیں — اوپر کی کھڑکی (host) اور ٹیب (child)، پہچان سب سے پہلے', () => {
  const head = H.slice(0, H.indexOf('</head>'));
  assert.ok(head.indexOf('__dioTabChild') > 0 && head.indexOf('__dioTabChild') < head.indexOf('<script src='), 'پہچان ہر اسکرپٹ سے پہلے');
  assert.ok(/window\.top\.location\.origin === location\.origin && window\.top\.__dioTabsHost/.test(head), 'صرف اپنی ہی ویب سائٹ کی Digital IO کھڑکی کے اندر');
  assert.ok(/html\.dio-child #login-screen/.test(head), 'ٹیب میں لاگ اِن صفحہ نہیں');
  assert.ok(/<script defer src="dio-tabs\.js"><\/script>/.test(H));
});

test('v570: ٹیبیں ایک ہی سرور رابطہ استعمال کرتی ہیں؛ پس منظر کے کام صرف اوپر کی کھڑکی میں', () => {
  assert.ok(/window\.__dioTabChild && window\.top\.supabaseClient\) \? _dioChildClient\(window\.top\.supabaseClient\)/.test(A));
  assert.ok(/if \(p === 'onAuthStateChange'\) return function/.test(A), 'لاگ اِن کی خبریں صرف اوپر کی کھڑکی سنے');
  assert.ok(/set\(o, p, v\) \{ local\[p\] = v; return true; \}/.test(A), 'ٹیب کی تبدیلیاں اوپر کے رابطے پر نہیں چڑھتیں');
  assert.ok(/if \(window\.__dioTabChild\) \{ window\.__dioOnTable = cb; return; \}/.test(A), 'realtime: ٹیب میں الگ نہیں');
  assert.ok(/if \(!_dioChild\) \{\s*setTimeout\(function\(\)\{ try \{ if \(typeof triggerBackup/.test(A), 'بیک اپ / یاددہانیاں صرف اوپر');
  assert.ok(/if \(CHILD\) return;\s*var c = sb\(\);/.test(DS), 'dio-sync realtime ٹیب میں نہیں');
  assert.ok(/if \(window\.__dioTabChild\) return;/.test(read('auto-interim.js')), 'خودکار انٹیرم چالان دوہرا نہیں');
});

test('v570: لاگ اِن / تالا / لاگ آؤٹ — ایک ہی افسر، ایک ہی تالا', () => {
  assert.ok(/if \(window\.DIOTabs && DIOTabs\.isHost\) DIOTabs\.start\(\);/.test(AU));
  assert.ok(/window\._dioChildLogin = async function/.test(AU));
  assert.ok(/function lockApp\(\) \{[\s\S]{0,200}if \(window\.__dioTabChild\) return;/.test(AU));
  assert.ok(/'dio_tabs_v1_'/.test(AU), 'لاگ آؤٹ پر کھلی ٹیبوں کی فہرست مٹے (مشترکہ آلہ)');
  assert.ok(/D\.who = function \(\) \{ return \{ u: currentUser, o: currentOfficer \}; \};/.test(T), 'ٹیب اوپر کی کھڑکی کا وہی افسر لیتی ہے');
});

test('v570: سروس ورکر — نیا نسخہ، ٹیبوں کی فائل پہلے سے محفوظ، ہر ٹیب کی الگ نقل نہیں', () => {
  assert.ok(/const CACHE_NAME = 'digital-io-v570';/.test(SW));
  assert.ok(/'\/dio-tabs\.js',/.test(SW));
  assert.ok(/searchParams\.has\('dtab'\) \? '\/index\.html'/.test(SW));
});

test('v570: کھڑکی کا X — براؤزر کی اپنی تصدیق (عبارت براؤزر کی) + خودکار مسودے', () => {
  const bu = T.slice(T.indexOf("window.addEventListener('beforeunload'"), T.indexOf("window.addEventListener('pagehide'"));
  assert.ok(/flushAll\(\); saveNow\(\);/.test(bu) && /e\.preventDefault\(\); e\.returnValue = '';/.test(bu));
  assert.ok(/کیا آپ بند کرنا چاہتے ہیں؟/.test(T), 'ڈیش بورڈ پر «واپس» کا سوال');
});

test('v570: انٹرنیٹ کے بغیر — فالتو نقل نہیں، ناکام نقل پر صاف پیغام اور انٹرنیٹ آتے ہی دوبارہ؛ ٹیب کو CDN کی ضرورت نہیں', () => {
  assert.ok(/function canLoad\(\) \{ return navigator\.onLine !== false \|\| !!\(navigator\.serviceWorker && navigator\.serviceWorker\.controller\); \}/.test(T));
  assert.ok(/if \(!canLoad\(\)\) \{ whenOnline\(function \(\) \{ spareArm\(1500\); \}\); return; \}/.test(fnSrc('spareArm')), 'آف لائن فالتو نقل نہیں');
  const fl = fnSrc('frameLoaded');
  assert.ok(/if \(S\.spare === rec\) \{ destroy\(rec, true\);/.test(fl) && /whenOnline\(retry\)/.test(fl) && /rec\.tries > 6/.test(fl));
  assert.ok(/انٹرنیٹ نہیں — یہ ٹیب انٹرنیٹ آتے ہی خود کھل جائے گی/.test(T));
  assert.ok(/if \(window\.__dioTabChild && \(!window\.supabase \|\| !window\.supabase\.createClient\)\) \{\s*try \{ if \(window\.top\.supabase && window\.top\.supabase\.createClient\) window\.supabase = window\.top\.supabase;/.test(A),
    'ٹیب اوپر کی کھڑکی کی لائبریری لے — «کنکشن کا مسئلہ» نہیں');
});

test('v570: موبائل — اوپر کی کھڑکی کی نیچے والی پٹی ٹیب پر نہیں چڑھتی (ٹیب کی اپنی پٹی دبتی ہے)', () => {
  assert.ok(/body\.dio-tabs-on > \.dio-thumbbar,body\.dio-tabs-on > \.dio-mbar,body\.dio-tabs-on > \.dio-addblk\{display:none !important;\}/.test(T));
});
