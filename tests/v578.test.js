/* v578: دستاویز ہمیشہ پورے صفحے اور «⋯» میں — doc-viewer.js مقدمہ کھلنے سے پہلے تیار؛ ناکام فائل دوبارہ لائی جا سکے */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('v578: مقدمہ کھلنے سے پہلے doc-viewer.js (پورا صفحہ + «⋯») بھی آ جائے', () => {
  const C = read('cases.js');
  assert.ok(/async function openCaseWorkspace\(id\) \{[\s\S]{0,700}await _dioNeed\(\['misal-docs\.js', 'case-docs\.js', 'case-form\.js', 'doc-viewer\.js'\]\);/.test(C));
});

test('v578: دستاویز کھولتے وقت doc-viewer.js نہ ہو تو پہلے لاؤ (ایک بار، اصل فنکشن سے — ٹیب کی تاریخ میں دوسرا قدم نہیں)', () => {
  const M = read('misal-docs.js');
  const a = M.indexOf('function _openMisalEditor(docId, _fromTab) {');
  const head = M.slice(a, a + 900);
  assert.ok(/typeof _dioOpenDocTab !== 'function' && typeof window\.dioLoadScript === 'function' && !_openMisalEditorReal\._dvTried/.test(head));
  assert.ok(/window\.dioLoadScript\('doc-viewer\.js'\)\)\.then\(again, again\);\n    return;/.test(head));
  assert.ok(/\n\}\nconst _openMisalEditorReal = _openMisalEditor;/.test(M));
});

test('v578: boot.js — ناکام <script> ہٹایا جائے تاکہ اگلی کوشش واقعی فائل لائے', () => {
  const B = read('boot.js');
  assert.ok(/s\.onerror = function \(\) \{ _loaded\[src\] = null; try \{ s\.remove\(\); \} catch \(_\) \{[^}]*\} res\(false\); \};/.test(B));
  const m = /const CACHE_NAME = 'digital-io-v(\d+)';/.exec(read('sw.js'));   // v579: نیا نسخہ — 578 یا بعد کا
  assert.ok(m && Number(m[1]) >= 578);
});

test('v578: Esc — کاغذ کے کونوں کی فہرستیں (بیان 161 / بیرونی ضمنی) صرف خود بند ہوں، دستاویز نہیں', () => {
  const DV = read('doc-viewer.js');
  assert.ok(/document\.querySelector\('#dio-dv-menu, #naq-acc-menu, #saza-acc-menu, #dk-acc-menu, #dio-dv-picker, #zfa-cp-menu, #zf-cp-menu, #zf-acc-menu'\)/.test(DV));
  const Z = read('zimni.js');
  assert.strictEqual((Z.match(/document\.addEventListener\('keydown', esc1, true\);   \/\/ v578/g) || []).length, 3, 'تینوں فہرستوں کا Esc فوراً');
  assert.ok(!/setTimeout\(\(\) => \{[^}]*addEventListener\('keydown', esc1/.test(Z), 'Esc اب ایک لمحے بعد نہیں');
});
