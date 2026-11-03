// v564 — بیرونی ضمنی: پرنٹ اور ترتیب (افسر کی ہدایت، 28 اکتوبر 2026)۔ سورس کی سطح پر پکے اصول؛
// اصل ایپ میں پوری جانچ: tests/real-app/v564_test.py
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Z = read('zimni.js'), A = read('app-core.js'), K = read('dio-keys.js'), H = read('index.html'), R = read('report173.js');

test('v564: Ctrl+P → کھلی ضمنی کا وہی فنکشن جو «پرنٹ» بٹن (dio-keys سب سے پہلے _dioPrintTarget پوچھتا ہے)', () => {
  assert.ok(/window\._dioPrintTarget = function \(\)/.test(A));
  assert.ok(/ch\.querySelector\('\.zf-tbl'\) && typeof window\._printZimniCurrent === 'function'\) return \(\) => window\._printZimniCurrent\(\)/.test(A));
  assert.ok(/window\._dioPrintTarget\(\)/.test(K));
  assert.ok(/data-dio-print onclick="_printZimniCurrent\(\)"/.test(Z), 'بٹن بھی یہی فنکشن');
});

test('v564: براؤزر کی اپنی چھپائی = وہی تیار کاغذ (beforeprint پر dioNativePrint، پرانا «زندہ ایڈیٹر منتقل» نہیں)', () => {
  assert.ok(/window\.dioNativePrint = \(function \(\)/.test(A));
  const i = H.indexOf('function _setup()'), j = H.indexOf('var node = _findOpenDoc();');
  assert.ok(i > 0 && j > i && /dioNativePrint\.setup\(\)\) return;/.test(H.slice(i, j)), 'ضمنی کھلی ہو تو پرانا راستہ نہ چلے');
  assert.ok(/window\.dioNativePrint\.register\(\{/.test(Z) && /html: \(\) => _zimniCurrentPrintHTML\(\)/.test(Z));
  assert.ok(/_zimniPaginate\(root, win, \{ paper: paper, skel: _zimniZaSkel\(_o, _c\) \}\)\(\);/.test(Z), 'اسی لمحے وہی حساب');
  assert.ok(/_dioViewOnlyActive\(\)\) return false;/.test(A) && /html\.dio-viewonly #dio-pp-host\{display:none !important;\}/.test(A), 'میعاد ختم = پرنٹ بند');
});

test('v564: صفحات / مثل کی لکیر کا حساب ایک ہی فنکشن — پرنٹ HTML اسی کا متن لے جاتا ہے', () => {
  assert.ok(/^function _zimniPaginate\(R, W, opt\) \{/m.test(Z));
  assert.ok(/var go=\(\$\{_zimniPaginate\.toString\(\)\}\)\(document, window, \{ paper: window\.__PAPER, skel: window\.__ZA_SKEL \}\);/.test(Z));
  const f = Z.slice(Z.indexOf('function _zimniPaginate('), Z.indexOf('window._zimniPaginate = _zimniPaginate;'));
  assert.ok(!/<\/script/i.test(f), 'فنکشن کے متن میں </script> نہیں (پرنٹ HTML نہ ٹوٹے)');
  assert.ok(!/\bdocument\./.test(f.replace(/\/\/.*$/gm, '')), 'document براہِ راست نہیں — R / DOC (shadow root میں بھی چلے)');
  // اصل فنکشن کا متن parse ہو جائے (پرنٹ HTML کے اندر چلنے کے قابل)
  assert.doesNotThrow(() => new vm.Script('(' + f.trim() + ')'));
});

test('v564: 2pt لکیر overlay (جگہ نہیں گھیرتا) + ہر قطار کا اپنا ٹکڑا، صرف تحریر جتنا', () => {
  assert.ok(/tri\.className='zf-bind'; tri\.setAttribute\('data-ov', '1'\);/.test(Z));
  assert.ok(/var slice=function\(z0, par, before, cell\)/.test(Z) && /if\(tb-fTop < S-y0\) setSl\(f, S-y0, tb-fTop\);/.test(Z));
  assert.ok(/insB\(bodyC, bodyC\.firstChild, row\);/.test(Z) && /if\(pNo%2===0\) insB\(node\.parentNode, node, row\);/.test(Z));
  assert.ok(/#ch173-doc \.zf-bind\[data-ov\]\{ display:block !important; float:none !important; position:relative !important;/.test(Z));
  assert.ok(/#ch173-doc \.zf-bindsl\{ display:block !important; float:left !important; margin:0 3mm 0 0 !important;/.test(Z), 'ہر ٹکڑے کی اوپری سطر بھی لکیر سے 3mm دور');
  assert.ok(/\.zf-bind,\.zf-bindsl,\.dio-bindgap,\.dio-pgbrk,tr\.zf-fill/.test(Z), 'دوبارہ حساب سے پہلے پرانے ٹکڑے صاف');
});

test('v564: اختتامی سطر — الفاظ وہی، آخر میں «۔»؛ اوپر کی جگہ کم', () => {
  assert.ok(/>رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔<\/div>/.test(Z));
  assert.ok(/const KEY = 'رپورٹضمنیمرتبہوکرارسالخدمتہے';/.test(Z));
  assert.ok(/#ch173-doc \.zf-close\{ margin-top:0; font-size:14pt;/.test(Z));
});

test('v564: «از» کالم 12% → 24%، کالم 3 67% → 55%؛ پرانے طے شدہ ناپ نئے پر، افسر کا اپنا ناپ جوں کا توں', () => {
  const m = /const _ZF_OLD_COLS = (\/.*\/i);/.exec(Z);
  assert.ok(m);
  const re = vm.runInNewContext(m[1]);
  const C = (a, b, c, d) => `<col style="width:${a}%"><col style="width:${b}%"><col style="width:${c}%"><col style="width:${d}%">`;
  assert.ok(re.test(C(14, 7, 67, 12)) && re.test(C(14, 7, 73, 6)));
  assert.ok(!re.test(C(14, 7, 55, 24)) && !re.test(C(14, 7, 60, 19)));
  assert.ok(Z.includes("'<col style=\"width:14%\"><col style=\"width:7%\"><col style=\"width:55%\"><col style=\"width:24%\">'"));
});

test('v564: دستخط کے نیچے تاریخ نام کے درمیان (بیرونی)؛ اندرونی کا دستخط بائیں ہی', () => {
  assert.ok(/#ch173-doc \.zf-signblk\{ font-size:14pt; line-height:1\.5; display:table; margin:0 auto 0 0;/.test(Z));
  assert.ok(/#ch173-doc \.zf-signblk \[data-k="io_sign"\], #ch173-doc \.zf-signblk \[data-k="io_date"\]\{\s*text-align:center !important;/.test(Z));
  assert.ok(!/class="zf-signblk" style="text-align:left/.test(Z), 'نئی ضمنی میں inline «بائیں» نہیں');
  assert.ok(/#ch173-doc \.zfa-wit-sign, #ch173-doc \.zfa-wit-io, #ch173-doc \.zfa-wit-date\{\s*text-align:left !important;/.test(Z), 'اندرونی بائیں');
});

test('v564: بندھے خانے — کالم 1 ↔ دستخط کی تاریخ اور SHO کا نام؛ تفتیشی افسر کا نام ربط میں نہیں (3 نومبر)', () => {
  assert.ok(/function _zimniBindInit\(\)/.test(Z) && /window\.addEventListener\('input', _zimniBindOnInput, true\);/.test(Z));
  assert.ok(!/ev\.target\.closest\('td\.zf-c-action'\)/.test(Z), 'پرانا سننے والا (جو کبھی نہیں چلتا تھا) نہیں');
  assert.ok(/const _ZF_BIND = \{ sho: 'sho_name' \};/.test(Z), 'ربط صرف SHO کا');
  assert.ok(!/io_name/.test(Z) && !/_zimniSetLineName|_zimniIoLines/.test(Z), 'IO کے نام کا ربط / ترمیم کا کوڈ نہیں');
  // نام کا حصہ: عہدہ / تھانہ سے پہلے
  const f = Z.slice(Z.indexOf('function _zimniLineName('), Z.indexOf('window._zimniLineName = _zimniLineName;'));
  const ctx = { _ZF_SPC: /[\s\u00A0]+/g };
  vm.runInNewContext(f + '; this.LN = _zimniLineName;', ctx);
  assert.strictEqual(ctx.LN('فیاض حسین شاد ASI تھانہ صدر ملتان'), 'فیاض حسین شاد');
  assert.strictEqual(ctx.LN('ندیم عباس شاد SI/SHO تھانہ صدر ملتان'), 'ندیم عباس شاد');
  assert.strictEqual(ctx.LN('غلام عباس تھانہ کینٹ'), 'غلام عباس');
});

test('v564 (3 نومبر): تفتیشی افسر کا نام مقرر — ہر IO سطر میں span.zf-ioname[contenteditable=false]، ہر تبدیلی رکتی ہے', () => {
  assert.ok(/const _ZF_IO_LINES = '\[data-k="murattib"\],\[data-k="io_sign"\],\.zfa-wit-io';/.test(Z), 'بیرونی مرتبہ + دستخط، اندرونی ہر بیان');
  assert.ok(/sp\.className = 'zf-ioname'; sp\.setAttribute\('contenteditable', 'false'\);/.test(Z));
  assert.ok(/window\.addEventListener\('beforeinput', _zimniIoGuard, true\);/.test(Z), 'لکھنا / مٹانا');
  assert.ok(/\['paste', 'cut', 'dragstart'\]\.forEach\(t => window\.addEventListener\(t, _zimniIoClipGuard, true\)\);/.test(Z), 'چسپاں / کاٹنا / کھینچنا (ایپ کے execCommand سے پہلے)');
  assert.ok(/try \{ _zimniLockIO\(_zimniDoc\(\)\); \} catch \(_\) \{ \/\* v564: تفتیشی افسر کا نام مقرر \(3 نومبر 2026\)/.test(Z), 'بیرونی ایڈیٹر');
  assert.ok(/try \{ _zimniLockIO\(_zimniDoc\(\)\); \} catch \(_\) \{ \/\* v564: ہر بیان کے دستخط میں/.test(Z), 'اندرونی ایڈیٹر');
  assert.ok(/try \{ _zimniLockIO\(block\); \}/.test(Z), 'نیا بیان');
  // ڈھونڈیں/بدلیں صرف لکھنے والے متن میں (مقفل نام اس میں نہیں آتا)
  assert.ok(/if \(!p \|\| !p\.isContentEditable/.test(read('editor-tools.js')));
});

test('v564: الفاظ نہ جُڑیں — فونٹ کی kerning بند، ایک ہی قاعدہ: ہر پرنٹ میں اور ضمنی/چالان کی اسکرین پر بھی', () => {
  assert.ok(/return `\$\{S\}\{ font-kerning:none; \}`;/.test(A));
  assert.ok(/htmlContent = dioTextInject\(htmlContent\);/.test(A) && /html = dioTextInject\(html\);/.test(A), 'dioPrint اور dioBindHtml دونوں');
  assert.ok(/active = render\(dioTextInject\(html\)\);/.test(A), 'براؤزر کی اپنی چھپائی بھی');
  assert.ok(/dioTextCSS\('#ch173-doc'\)/.test(R), 'چالان / ضمنی کی اپنی CSS (اسکرین + کاغذ)');
  assert.ok(/#dio-nprint-host \{ font-kerning: none; \}/.test(H));
  assert.ok(!/word-spacing:0\.12em/.test(R) && !/word-spacing: 0\.12em/.test(H) && !/DIO_WORD_GAP/.test(A + R + H + Z), 'پرانے اضافی فاصلے نہیں');
  // انجیکشن: ایک بار، head میں
  const f = A.slice(A.indexOf('function dioTextCSS('), A.indexOf('window.dioTextCSS = dioTextCSS;'));
  const ctx = {}; vm.runInNewContext(f + '; this.I = dioTextInject;', ctx);
  const h = ctx.I('<!DOCTYPE html><html><head><title>x</title></head><body>a</body></html>');
  assert.ok(/<head><style id="dio-text-css">body\{ font-kerning:none; \}<\/style><title>/.test(h));
  assert.strictEqual(ctx.I(h), h, 'دوبارہ نہیں');
});

test('v564: سروس ورکر کا نیا نسخہ', () => {
  assert.ok(/const CACHE_NAME = 'digital-io-v564';/.test(read('sw.js')));
});
