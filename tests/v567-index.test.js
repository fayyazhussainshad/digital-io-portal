// v567 — انڈیکس نقل مسل: «بنام» میں FIR اور کراس ورژن کے ملزمان الگ (افسر کا حکم، 4 نومبر 2026)
// اصل ایپ میں پوری جانچ: tests/real-app/v567_test.py (Desktop + Mobile، پرنٹ)
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('v567: FIR کے «بنام» میں صرف FIR کے ملزمان، کراس ورژن کے الگ حصے میں', () => {
  const M = read('misal-templates.js');
  assert.ok(/const fir = all\.filter\(a => \(a\.accused_type \|\| 'fir'\) !== 'cross_version'\);/.test(M));
  assert.ok(/const xv  = all\.filter\(a => a\.accused_type === 'cross_version'\);/.test(M));
  assert.ok(/put\('idxn-', fir\);/.test(M) && /put\('idxn-x-', xv\);/.test(M));
  assert.ok(!/\(acc \|\| \[\]\)\.slice\(0, 4\)\.forEach/.test(M), 'پرانا ملا جلا راستہ نہیں');
  assert.ok(/\(typeof caseHasCross === 'function'\) && caseHasCross\(c\)\) \? `\s*\$\{_idxCrossHTML\(c, 1\)\}/.test(M), 'کراس والے مقدمے کے سانچے میں کراس کا حصہ');
  assert.ok(/id="idxn-xv-head" style="text-align:center;font-size:14pt;font-weight:bold;/.test(M), 'سرخی 14pt');
  assert.ok(/#idxz-table\{break-inside:avoid;page-break-inside:avoid;\}/.test(read('misal-docs.js')), 'ضمنیات کی جدول کاغذ پر بیچ میں نہ ٹوٹے');
});

test('v567: سروس ورکر کا نیا نسخہ', () => {
  const m = /const CACHE_NAME = 'digital-io-v(\d+)';/.exec(read('sw.js'));
  assert.ok(m && Number(m[1]) >= 567);
});
