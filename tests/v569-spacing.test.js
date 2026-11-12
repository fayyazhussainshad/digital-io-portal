// v569 — الفاظ کا فاصلہ: 3 نومبر (v564) کا «فونٹ kerning بند» قاعدہ صرف چالان (رپورٹ 173) پر؛ باقی ہر دستاویز
//   3 نومبر سے پہلے (v563) جیسی — افسر کا حکم (4 نومبر 2026): «Fix Current line and word to word spacing for report
//   173 only and not for other documents, restore previous except reports 173» + «Restore ضمنی too» + منسلک اندرونی
//   شیٹ «Follow its بیرونی ضمنی»
// اصل ایپ میں پوری جانچ: tests/real-app/v569_test.py (Desktop + Mobile، پرنٹ بٹن / Ctrl+P / براؤزر مینو، شیئر PDF، پورا مقدمہ)
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const A = read('app-core.js'), R = read('report173.js'), Z = read('zimni.js'), H = read('index.html'), S = read('dio-share.js');
const fnOf = (src, name) => { const m = new RegExp('^(?:async )?function ' + name + '\\(.*?\\n\\}\\n', 'sm').exec(src); return m ? m[0] : ''; };
const RULE_SRC = A.slice(A.indexOf('function dioTextCSS('), A.indexOf('window.dioTextCSS = dioTextCSS;'));

function ch173CSS() {
  const ctx = {};
  vm.runInNewContext(RULE_SRC + '\n' + fnOf(R, '_ch173CSS') + '; this.f = _ch173CSS;', ctx);
  return ctx.f;
}

test('v569: قاعدے کا متن وہی (فونٹ کی kerning بند)، مگر کسی دستاویز میں خودکار شمولیت نہیں', () => {
  const ctx = {}; vm.runInNewContext(RULE_SRC + '; this.c = dioTextCSS;', ctx);
  assert.strictEqual(ctx.c('#ch173-doc'), '#ch173-doc{ font-kerning:none; }');
  assert.strictEqual(ctx.c(), 'body{ font-kerning:none; }');
  assert.ok(!/dioTextInject/.test(A + S + R + Z), 'dioPrint / dioBindHtml / براؤزر کی چھپائی / شیئر — کہیں خودکار نہیں');
  assert.ok(!/DIO_DOC_ROOTS|dio-text-screen/.test(A), 'اسکرین پر ہر دستاویز والا قاعدہ نہیں');
  assert.ok(fnOf(A, 'dioPrint') && fnOf(A, 'dioBindHtml'));
  assert.ok(!/font-kerning/.test(fnOf(A, 'dioPrint') + fnOf(A, 'dioBindHtml')), 'چھپائی کا مشترکہ راستہ فاصلہ نہیں بدلتا');
});

test('v569: چالان کی CSS حرف بحرف وہی (textRule)، ضمنی / بیان 161 کی CSS میں یہ قاعدہ نہیں', () => {
  const f = ch173CSS();
  const on = f(true), off = f();
  assert.ok(on.includes('#ch173-doc{ font-kerning:none; }'), 'چالان: kerning بند');
  assert.ok(!/font-kerning/.test(off), 'ضمنی / بیان 161: کوئی kerning قاعدہ نہیں');
  // فرق صرف یہی ایک تبصرہ + قاعدہ — باقی سب ایک جیسا
  const block = /\/\* v564: الفاظ نہ جُڑیں[\s\S]*?\*\/\n {6}#ch173-doc\{ font-kerning:none; \}/;
  assert.ok(block.test(on));
  assert.strictEqual(on.replace(block, ''), off);
  // کون مانگتا ہے: صرف چالان کا ایڈیٹر اور چالان کا پرنٹ
  assert.strictEqual((R.match(/_ch173CSS\(true\)/g) || []).length, 2, 'report173.js: ایڈیٹر + پرنٹ');
  assert.ok(/<style>\$\{_ch173CSS\(true\)\}<\/style>\n {4}<div style="display:flex;flex-direction:column;height:100%;direction:rtl;">/.test(R), 'چالان کا ایڈیٹر');
  assert.ok(/\/\* ═══ WAHI CSS jo screen par hai — koi alag nakal nahi ═══ \*\/\n {8}\$\{_ch173CSS\(true\)\}/.test(R), 'چالان کا پرنٹ');
  assert.ok(!/_ch173CSS\(true\)/.test(Z), 'ضمنی / بیان 161 کبھی نہیں');
  assert.strictEqual((Z.match(/_ch173CSS\(\)/g) || []).length, 4, 'zimni.js کی چاروں جگہیں بغیر قاعدے کے');
});

test('v569: چالان کا کاغذ — قاعدہ <head> کے شروع میں (وہیں جہاں v564 کا dioPrint لگاتا تھا)', () => {
  assert.ok(/const chHtml = `<!DOCTYPE html><html dir="rtl"><head>\$\{typeof dioTextCSS === 'function' \? '<style id="dio-text-css">' \+ dioTextCSS\('body'\) \+ '<\/style>' : ''\}<meta charset="UTF-8"><title> <\/title>/.test(R));
  // چالان کی اپنی چھپائی کے اصول (justify + word-spacing عام + kerning بند) جوں کے توں
  assert.ok(/text-justify:inter-word !important; word-spacing:normal !important; font-kerning:none !important; \}/.test(R));
});

test('v569: ضمنی (منسلک اندرونی شیٹ سمیت) کا کاغذ — پورے کاغذ پر kerning کا کوئی قاعدہ نہیں (v580: صرف متن پر بند، تاکہ justify میں الفاظ نہ جُڑیں)', () => {
  const p = fnOf(Z, '_zimniPrintHTML');
  assert.ok(p, '_zimniPrintHTML');
  assert.ok(!/dio-text-css|dioTextCSS|font-kerning/.test(p));
  assert.ok(/<head><meta charset="UTF-8"><title> <\/title>\n {4}\$\{\(typeof dioFontHead === 'function'\) \? dioFontHead\(\) : ''\}/.test(p), 'v563 کی ترتیب: عنوان کے فوراً بعد فونٹ');
  // v580 (افسر کا حکم 12 نومبر 2026، «پوری بیرونی ضمنی» justify): kerning صرف متن کے خانے پر بند — کاغذ / عنوان / سرنامہ پر نہیں
  const zf = fnOf(Z, '_zimniFormCSS'), za = fnOf(Z, '_zfAttFormCSS');
  assert.deepStrictEqual(zf.match(/[^\n]*font-kerning[^\n]*/g), ['  #ch173-doc .zf-body{ font-kerning:none; }'], 'ضمنی: صرف .zf-body');
  assert.ok(!/font-kerning/.test(za.replace('${_zfJustifyCSS()}', '')), 'منسلک شیٹ: صرف مشترکہ justify قاعدہ');
  assert.ok(!/html #ch173-doc\{ font-kerning/.test(zf + za), 'پورے کاغذ پر نہیں');
  // اکیلا بیان 161 — v568 والا (27 اکتوبر) جوں کا توں
  assert.ok(/html #ch173-doc\{ font-kerning:auto; \}/.test(fnOf(Z, '_zaFormCSS')));
});

test('v569: براؤزر کی اپنی چھپائی — ہر دستاویز پر kerning بند نہیں؛ word-spacing «normal» (تینوں راستے ایک)', () => {
  assert.ok(!/#dio-nprint-host\s*\{\s*font-kerning/.test(H));
  assert.ok(/text-justify: inter-word !important; word-spacing: normal !important;/.test(H));
  assert.ok(/active = render\(html\);/.test(A));
});

test('v569: شیئر PDF — ہر دستاویز اپنے پرنٹ جیسی؛ kerning بند صرف وہاں جہاں دستاویز خود مانگے (چالان)', () => {
  const fr = fnOf(S.replace(/^ {2}/gm, ''), 'frameFor');
  assert.ok(fr && !/dioTextInject|font-kerning/.test(fr), 'frameFor');
  assert.ok(/var kernOff = false;\n {4}try \{ kernOff = d\.defaultView\.getComputedStyle\(d\.body\)\.fontKerning === 'none'; \}/.test(S));
  assert.ok(/'px;background:#fff;' \+ \(kernOff \? 'font-kerning:none;' : ''\) \+ '">'/.test(S));
  const nk = fnOf(S.replace(/^ {2}/gm, ''), 'noKern');
  assert.ok(/async function noKern\(fn, el\)/.test(nk) && /getComputedStyle\(el\)\.fontKerning === 'none'/.test(nk) && /if \(!off\) return fn\(\);/.test(nk));
  assert.ok(/\}\); \}, el\);\n {6}await paintRotated\(el, canvas, rots\);/.test(S), 'پوری تصویر: اپنی دستاویز کے مطابق');
  assert.ok(/backgroundColor: null, logging: false \}\); \}, n\);/.test(S), 'کھڑے خانے: اپنے خانے کے مطابق');
});

test('v569: سروس ورکر کا نیا نسخہ', () => {
  const m = /const CACHE_NAME = 'digital-io-v(\d+)';/.exec(read('sw.js'));
  assert.ok(m && Number(m[1]) >= 569);
});
