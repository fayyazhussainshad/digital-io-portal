/* v579 (TASK 7-C11، افسر کی ہدایت 12 نومبر 2026): بیانات 161 کا متن پوری طرح justify — اسکرین، پرنٹ، PDF اور Word؛
   الفاظ جُڑے بغیر؛ صرف اکیلا بیان 161 (منسلک اندرونی شیٹ جوں کی توں) */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const Z = read('zimni.js');
const fn = (name) => {
  const i = Z.indexOf('function ' + name + '(');
  if (i < 0) return '';
  const j = Z.indexOf('\nwindow.' + name + ' = ', i);
  return Z.slice(i, j > i ? j : i + 20000);
};

test('v579: اکیلا بیان 161 — متن justify (اسکرین پر index.html کا «div → دائیں» نہیں)، kerning صرف متن پر بند، عنوان / دستخط خودکار', () => {
  // v580: یہ قاعدے اب مشترکہ _zfJustifyCSS() میں — اکیلا بیان 161 اور منسلک شیٹ دونوں ایک ہی
  assert.ok(/\$\{_zfJustifyCSS\(\)\}/.test(fn('_zaFormCSS')));
  const C = fn('_zfJustifyCSS');
  assert.ok(/#ch173-doc table\.zfa-tbl td\.zfa-c-body\{ text-align:right; text-align-last:auto; \}/.test(C), 'Word: خانے کے اندر سیدھ صاف');
  assert.ok(/#ch173-doc \.zfa-body\{ font-kerning:none; \}/.test(C), 'بیان کا متن: kerning بند');
  assert.ok(/#ch173-doc \.zfa-body div, #ch173-doc \.zfa-body p\{ text-align:inherit; text-align-last:inherit; \}/.test(C), 'ہر div / p والد کی سیدھ');
  assert.ok(/#ch173-doc \.zfa-wit-head, #ch173-doc \.zfa-wit-headrow, #ch173-doc \.zfa-wit-close,\n  #ch173-doc \.zfa-wit-sign\{ font-kerning:auto; \}/.test(C), 'عنوان / دستخط 27 اکتوبر جیسے');
  assert.ok(/#ch173-doc \.zfa-pgpre\{ display:block; text-align-last:justify; \}\n  #ch173-doc \.zfa-pgsp\{ white-space:normal; \}/.test(C), 'صفحے کے توڑ سے پہلے کی سطر (اور اس کے آخر کی خالی جگہ)');
  assert.ok(/html #ch173-doc\{ font-kerning:auto; \}/.test(fn('_zaFormCSS')), 'کاغذ کا باقی حصہ 27 اکتوبر جیسا');
});

test('v579→v580: منسلک اندرونی شیٹ — v580 میں افسر کے حکم سے وہی justify قاعدہ (پہلے جوں کی توں)؛ ضمنی کی چھپائی میں بیان 161 کا binder نہیں', () => {
  const A = fn('_zfAttFormCSS');
  assert.ok(A && /\$\{_zfJustifyCSS\(\)\}/.test(A) && !/html #ch173-doc\{ font-kerning/.test(A));
  assert.ok(!/_zaJustifyBeforeBreak/.test(fn('_zimniPrintHTML')) && !/_zaJustifyBeforeBreak/.test(fn('_zimniPaginate')));
});

test('v579: صفحے کا توڑ — صرف اکیلے بیان 161 کے binder میں، تیرتے خانے (عنوان / دستخط) پر نہیں؛ دوبارہ چلے تو پرانا خانہ کھل جائے', () => {
  const B = fn('_zaBinder');
  assert.ok(/if \(!fl\) \{ try \{ _zaJustifyBeforeBreak\(d, brk, body\); \}/.test(B));
  assert.ok(/doc\.querySelectorAll\('span\.zfa-pgpre, span\.zfa-pgsp'\)\.forEach\(w => \{ while \(w\.firstChild\)/.test(B));
  const J = fn('_zaJustifyBeforeBreak');
  assert.ok(/textAlign !== 'justify'\) return false;/.test(J), 'صرف justify پیراگراف');
  assert.ok(/\\n\[\\s\\u00A0\]\*\$\/\.test\(txt\)\) return false;/.test(J), 'سطر خود ختم (نئی سطر) — کچھ نہیں');
  assert.ok(/if \(!ls \|\| ls\.nodeType !== 3\) return false;/.test(J), '<br> سے پہلے — کچھ نہیں');
  assert.ok(/W\.className = 'zfa-pgpre';/.test(J) && /createElement\('span'\)/.test(J), 'span — Word میں ایک ہی پیراگراف');
  assert.ok(/g\.className = 'zfa-pgsp'; g\.textContent = m\[0\];\n    P\.insertBefore\(g, brk\.nextSibling\);/.test(J), 'آخر کی خالی جگہ توڑ کے بعد — Word میں الفاظ جُڑتے نہیں');
  assert.strictEqual((Z.match(/_zaJustifyBeforeBreak\(/g) || []).length, 2, 'تعریف + ایک ہی جگہ استعمال');
});

test('v579: سروس ورکر کا نیا نسخہ', () => {
  const m = /const CACHE_NAME = 'digital-io-v(\d+)';/.exec(read('sw.js'));
  assert.ok(m && Number(m[1]) >= 579);
  assert.ok(/ZIMNI_A_VER = 'zimni-androoni v\d+ — [^']*v579/.test(Z));
});
