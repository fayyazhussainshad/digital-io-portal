// TASK 9 (v572) — نمبر شمار کا ایک ہی قاعدہ (dio-serial.js) + رپورٹ 173 کی سیدھ / جُڑے الفاظ کے ذریعے
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

global.window = global.window || {};
require(path.join(ROOT, 'dio-serial.js'));
const S = global.window.DIOSerial;

test('DIOSerial: ایک نام → «1» نہیں؛ دو یا زیادہ → 1۔ 2۔ …', () => {
  assert.strictEqual(S.prefix(0, 1), '');
  assert.strictEqual(S.prefix(0, 2), '1۔ ');
  assert.strictEqual(S.prefix(2, 3), '3۔ ');
  assert.deepStrictEqual(S.list(['الف']), ['الف']);
  assert.deepStrictEqual(S.list(['1۔ الف']), ['الف'], 'پرانا اکیلا «1۔» ہٹ جائے');
  assert.deepStrictEqual(S.list(['الف', 'ب']), ['1۔ الف', '2۔ ب']);
});

test('DIOSerial.numberText: سطر = ایک نام؛ زندہ (لکھنا / مٹانا)', () => {
  assert.strictEqual(S.numberText('احمد'), 'احمد');
  assert.strictEqual(S.numberText('1۔ احمد'), 'احمد');
  assert.strictEqual(S.numberText('1۔ احمد\nزاہد'), '1۔ احمد\n2۔ زاہد');
  assert.strictEqual(S.numberText('احمد\nزاہد\n\nعمران'), '1۔ احمد\n2۔ زاہد\n\n3۔ عمران', 'خالی سطر نمبر نہیں لیتی');
  assert.strictEqual(S.numberText('1۔ احمد\n2۔ '), 'احمد\n', 'بچا ہوا اکیلا «2۔» بھی ہٹے');
  assert.strictEqual(S.numberText('1۔ الف\u20032۔ ب'), '1۔ الف\u20032۔ ب', 'ایک سطر میں دو چھوٹے نام (کالم 6) — دو الگ');
  assert.strictEqual(S.numberText('1.5 کلو چرس\nموبائل فون'), '1۔ 1.5 کلو چرس\n2۔ موبائل فون', '«1.5» کا عدد نمبر نہیں');
  assert.strictEqual(S.numberText('علی\nتعداد: 1', { skip: /^تعداد/ }), 'علی\nتعداد: 1');
  // کرسر کا نشان (\uE000) اپنی جگہ رہے
  assert.strictEqual(S.numberText('احمد\nزاہد\uE000'), '1۔ احمد\n2۔ زاہد\uE000');
  assert.strictEqual(S.numberText('1۔ \uE000احمد\nزاہد'), '1۔ \uE000احمد\n2۔ زاہد');
});

test('T9: نمبر شمار کی 9 الگ نقلیں اب ایک ہی مددگار سے', () => {
  const uses = {
    'report173.js': /_ch173Sn\(/, 'zimni.js': /DIOSerial\.prefix/, 'darkhwastain.js': /DIOSerial\.prefix/,
    'incident.js': /DIOSerial\.prefix/, 'cdr-imei.js': /DIOSerial\.prefix/, 'naqsha-mauqa.js': /DIOSerial\.prefix/,
    'saza-slip.js': /DIOSerial\.prefix/, 'dio-prev.js': /DIOSerial\.prefix/, 'case-context.js': /DIOSerial\.prefix/,
  };
  for (const [f, re] of Object.entries(uses)) assert.ok(re.test(read(f)), f + ' DIOSerial استعمال کرے');
  assert.ok(/function _ch173Sn\([^)]*\)\s*\{\s*if \(window\.DIOSerial\) return window\.DIOSerial\.prefix/.test(read('report173.js')));
  // زندہ فہرستیں
  assert.ok(/DIOSerial\.bind\(cell, \{\s*mode: 'items', item: '\.zf-acc'/.test(read('zimni.js')), 'ضمنی «بنام» زندہ');
  assert.ok(/DIOSerial\.auto\('#dk-doc \.dk-banam-list'/.test(read('darkhwastain.js')), 'درخواستیں زندہ');
  assert.ok(/DIOSerial\.auto\('#ir-doc \[data-k="accused"\]'/.test(read('incident.js')), 'واقعاتی رپورٹ زندہ');
  assert.ok(/DIOSerial\.auto\('#cdr-doc \[data-k="banam"\]'/.test(read('cdr-imei.js')), 'CDR زندہ');
  assert.ok(/_ch173BindSerials\(\)/.test(read('report173.js')), 'چالان کے خانے زندہ');
  // نقشہ موقع کی شکل «1۔» (پہلے «1.»)
  assert.ok(!/\$\{i \+ 1\}\.<\/span>/.test(read('naqsha-mauqa.js')), 'نقشہ موقع: «1.» نہیں');
  // ضمنی: پرانی محفوظ کا «1۔» کھولنے پر خود نہیں ہٹتا (افسر کا فیصلہ — قاعدہ 15)
  assert.ok(!/accs\.length === 1\) accs\[0\]\.textContent/.test(read('zimni.js')), 'ضمنی کھولتے وقت «1۔» نہ ہٹائے');
});

test('T9: dio-serial.js صفحے میں اور offline cache میں', () => {
  assert.ok(/<script defer src="dio-serial\.js"><\/script>/.test(read('index.html')));
  assert.ok(read('sw.js').includes("'/dio-serial.js'"));
  assert.ok(/const CACHE_NAME = 'digital-io-v57[2-9]'|const CACHE_NAME = 'digital-io-v5[89]\d'|const CACHE_NAME = 'digital-io-v[6-9]\d\d'/.test(read('sw.js')));
});

test('T9 D8: کالم 7 / تسلسل کی سرحد پر جگہ برقرار (الفاظ نہیں جُڑتے)', () => {
  const r = read('report173.js');
  assert.ok(/function _ch173KeepGap\(cell, cont\)/.test(r));
  const ov = r.slice(r.indexOf('function _ch173Overflow()'), r.indexOf('window._ch173Overflow = _ch173Overflow;'));
  assert.ok((ov.match(/_ch173KeepGap\(cell, cont\)/g) || []).length >= 2, 'شروع اور آخر — دونوں جگہ');
  assert.ok(/_ch173NeedGap\(cell, moved, cont\)/.test(ov), 'لفظ واپس لاتے وقت بیچ میں جگہ');
});

test('T9 B: پرنٹ میں کھڑے خانے اسکرین والی شکل پر (inline-block / height:auto نہیں)', () => {
  const r = read('report173.js');
  assert.ok(!/#ch173-doc \.rotinner\{ display:inline-block !important; \}/.test(r));
  assert.ok(/doc\.querySelectorAll\('\.ch173-table tbody \.rotcell'\)/.test(r), 'سرخی کی اونچائی پکی نہ کی جائے');
  assert.ok(/function _ch173HeadMins\(table\)/.test(r) && /_ch173HeadMins\(table\)/.test(r.slice(r.indexOf('function _ch173AutoSize()'))));
  assert.ok(/justify-content:flex-start; align-items:stretch; \}/.test(r), 'سطریں دائیں کنارے کے ساتھ');
  assert.ok(/padding:4px;   \/\* T9\/B ⑥/.test(r));
  // موبائل: چالان کا کاغذ 12pt قاعدے سے باہر
  assert.ok(/:not\([^)]*\.ch173-challan \*\)\) \{ font-size: 12pt !important; \}/.test(read('mobile.css')));
  assert.ok(/<div id="ch173-doc" class="ch173-challan"/.test(r));
});
