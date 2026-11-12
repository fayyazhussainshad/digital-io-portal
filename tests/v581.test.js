/* v581 (افسر کا حکم 12 نومبر 2026):
   (1) فہرستوں (مقدمات، ضمنیات) میں تیر کی کلید سے انتخاب — Enter اسی ٹیب، Ctrl+Enter نئی ٹیب (4 نومبر سے باقی کام)
   (2) پولیس فارم نمبر «25—54(2)» بھی بائیں سے دائیں (پہلے «(2)54—25» دکھتا) */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const L = read('dio-listnav.js'), Z = read('zimni.js'), H = read('index.html'), SW = read('sw.js'), K = read('dio-keys.js'), T = read('dio-tabs.js');
const zfn = (name) => {
  const i = Z.indexOf('function ' + name + '(');
  if (i < 0) return '';
  const j = Z.indexOf('\nwindow.' + name + ' = ', i);
  return Z.slice(i, j > i ? j : i + 30000);
};

test('v581: فہرست کی کلیدیں — ہر صفحے پر لوڈ (dio-tabs کے بعد)، آف لائن کے لیے سروس ورکر میں', () => {
  const a = H.indexOf('<script defer src="dio-tabs.js"></script>'), b = H.indexOf('<script defer src="dio-listnav.js"></script>');
  assert.ok(a > 0 && b > a);
  assert.ok(/'\/dio-listnav\.js',/.test(SW));
  const m = /const CACHE_NAME = 'digital-io-v(\d+)';/.exec(SW);
  assert.ok(m && Number(m[1]) >= 581);
});

test('v581: کون سی فہرستیں — مقدمات (کھولیں)، بیرونی ضمنیات اور بیانات 161 (ترمیم = کھولیں)', () => {
  assert.ok(/\{ rows: '#cs-rows > tr', open: 'button\[data-act="open"\]', search: '#case-search' \}/.test(L));
  assert.ok(/\{ rows: '\.zt-wrap table\.zt > tbody > tr, \.zat-wrap table\.zt > tbody > tr', open: 'button\[data-act="edit"\]' \}/.test(L));
  // انہی بٹنوں کا کام وہی ہے جو Task 22 کی «نئی ٹیب» پہچانتی ہے
  for (const f of ['openCaseWorkspace', '_openZimni', '_openZimniDraft', '_openZimniA', '_openZimniADraft']) assert.ok(new RegExp('\\b' + f + '\\|').test(T) || new RegExp('\\|' + f + '\\|').test(T) || new RegExp('\\|' + f + '\\)').test(T), f);
});

test('v581: ↓ / ↑ / Home / End / Esc — لکھتے وقت نہیں؛ Ctrl / Alt والی کلیدیں dio-tabs / dio-keys کی', () => {
  assert.ok(/e\.altKey \|\| e\.ctrlKey \|\| e\.metaKey\) return;/.test(L), 'Ctrl+Enter → dio-tabs.js، Alt+← → ٹیب کی تاریخ');
  assert.ok(/if \(i < 0 && !inSearch && editable\(ae\)\) return;/.test(L), 'لکھنے کے خانے میں تیر اپنا عام کام');
  assert.ok(/if \(k === 'ArrowDown'\) to = \(i < 0\) \? 0 : Math\.min\(i \+ 1, n - 1\);/.test(L));
  assert.ok(/to = \(i < 0\) \? n - 1 : Math\.max\(i - 1, 0\);/.test(L));
  assert.ok(/if \(\(k === 'Home' \|\| k === 'End'\) && i < 0\) return;/.test(L));
  assert.ok(/if \(overlayOpen\(\)\) return null;/.test(L), 'کھڑکی / تلاش کھلی ہو تو نہیں');
  // انتخاب = قطار کے کھولنے والے بٹن پر focus — Enter وہی کام، Ctrl+Enter وہی (dio-tabs: activeElement)
  assert.ok(/var b = r\.querySelector\(A\.L\.open\);\n\s+try \{ b\.focus\(\{ preventScroll: true \}\); \}/.test(L));
  assert.ok(/var el = document\.activeElement;\n\s+if \(typingIn\(el\)\) return;/.test(T));
  assert.ok(/window\.addEventListener\('keydown', onKey, false\);/.test(L));
});

test('v581: کلیدوں کی مدد میں فہرست کی کلیدیں', () => {
  assert.ok(/'↓ \/ ↑ · Home \/ End · Esc'\]/.test(K) && /'Enter · Ctrl\+Enter'\]/.test(K));
});

test('v581: فارم نمبر 25—54(1) / 25—54(2) بھی LTR خانے میں — اسکرین، پرنٹ، صفحہ 3، 5 … کا سرنامہ، منسلک شیٹ', () => {
  assert.ok(/\(\?:\\\(\[0-9\\u06F0-\\u06F9\\u0660-\\u0669\]\+\\\)\)\*\/g;$/m.test(Z), 'قوسین والا آخری نمبر اسی خانے میں');
  assert.ok(!/\.zf-formno, \.zfa-formno'\)\)\) return;/.test(Z), 'فارم نمبر اب نہیں چھوڑا جاتا');
  assert.ok(/return _zfLtrHTML\(\(h \? h\.outerHTML : ''\) \+ \(m \? m\.outerHTML : ''\)\);/.test(zfn('_zimniAheadHTML')));
  assert.ok(/return _zfLtrHTML\('<div class="zf-androoni">'/.test(zfn('_zimniZaSkel')));
  // صرف دکھانے کے لیے — محفوظ تحریر میں کوئی نشان نہیں
  assert.ok(/_zfLtrUnwrap\(t\.content\);/.test(zfn('_zimniCleanHTML')));
  // regex: فارم نمبر پورا، موبائل / شناختی کارڈ پہلے جیسا
  const m = /^const ZF_LTRN_RE = (\/.*\/g);$/m.exec(Z);
  const re = eval(m[1]);
  const all = (s) => (s.match(re) || []);
  assert.deepStrictEqual(all('پولیس فارم نمبر 25—54(2)'), ['25—54(2)']);
  assert.deepStrictEqual(all('پولیس فارم نمبر 25—54(1)'), ['25—54(1)']);
  assert.deepStrictEqual(all('موبائل 0300-1234567 اور شناختی کارڈ 36302-1234567-1 ہے'), ['0300-1234567', '36302-1234567-1']);
  assert.deepStrictEqual(all('مورخہ 15/10/2026 زیر دفعہ 379 ت پ'), []);
});

test('v581: نسخوں کے نام', () => {
  assert.ok(/^const ZIMNI_VER = 'zimni v40 \(v581\)/m.test(Z));
  assert.ok(/^const ZIMNI_A_VER = 'zimni-androoni v28 — v581/m.test(Z));
});
