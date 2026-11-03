// v566 — TASK 6 (بیرونی ضمنی): نمبر جیسا لکھا، کالم 1 کی تاریخ، ایک افسر ایک تاریخ، سینئر افسر کی ضمنی،
// ملزمان ▾، 161 کا نمبر، کراس ورژن۔ سورس اور خالص فنکشنز کی جانچ؛ اصل ایپ میں پوری جانچ:
// tests/real-app/v566_test.py (Desktop + Mobile، پرنٹ) اور tests/real-app/v566_sync_test.py (دو آلات، reload)
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Z = read('zimni.js');

// zimni.js سے ایک فنکشن / const کا متن نکالو (اگلے top-level اعلان تک)
function grab(name) {
  const re = new RegExp('^(?:async function|function|const) ' + name.replace(/\$/g, '\\$') + '\\b', 'm');
  const m = re.exec(Z);
  assert.ok(m, name + ' موجود');
  const rest = Z.slice(m.index + 1);
  const n = /^(?:async function|function|const|let|window\.|\/\/ ═|if \(|try \{|setInterval|document\.)/m.exec(rest);
  return Z.slice(m.index, m.index + 1 + (n ? n.index : rest.length));
}
function ctx() {
  const c = { window: {}, console };
  vm.createContext(c);
  ['_zimniDigits', '_zimniFindDate', 'ZF_SUFFIXES', '_ZF_SUF_ALIAS', '_zimniZnoParse', '_zimniSameNo'].forEach(n => vm.runInContext(grab(n), c));
  return c;
}

test('v566 A: ضمنی نمبر — 1، 01، 001، 1-الف، 02-ب، 03-ج جیسے لکھے؛ «2 الف» → «2-الف»؛ غلط رد', () => {
  const c = ctx();
  const P = (t) => vm.runInContext('_zimniZnoParse(' + JSON.stringify(t) + ')', c);
  assert.deepStrictEqual([P('1').label, P('01').label, P('001').label], ['1', '01', '001']);
  assert.deepStrictEqual([P('1').base, P('01').base, P('001').base], [1, 1, 1]);
  assert.strictEqual(P('1-الف').label, '1-الف');
  assert.strictEqual(P('02-ب').label, '02-ب');
  assert.strictEqual(P('03-ج').label, '03-ج');
  assert.strictEqual(P('2 الف').label, '2-الف');
  assert.strictEqual(P('2الف').label, '2-الف');
  assert.strictEqual(P('۲-ا').label, '2-الف', 'اردو ہندسے اور اکیلا الف');
  assert.strictEqual(P('3-د').sIdx, 4, 'ابجد کی ترتیب: الف ب ج د');
  assert.ok(P('').empty);
  ['1234', '0', '2x', '2-ث', 'abc', '2--'].forEach(t => assert.ok(P(t).bad, t + ' رد'));
  // ایک ہی نمبر؟ 01 = 1؛ 2-الف ≠ 2
  assert.strictEqual(vm.runInContext("_zimniSameNo(_zimniZnoParse('01'), _zimniZnoParse('1'))", c), true);
  assert.strictEqual(vm.runInContext("_zimniSameNo(_zimniZnoParse('2-الف'), _zimniZnoParse('2'))", c), false);
});

test('v566 A: نمبر ہر جگہ — فہرست، انڈیکس، تلاش، پورے مقدمے کی چھپائی، شیئر، «تمام ضمنیاں» ایک ہی لیبل/ترتیب سے', () => {
  assert.ok(/<td class="num"><bdi>\$\{esc\(_zimniLabel\(z\)\)\}<\/bdi><\/td>/.test(Z), 'فہرست');
  const M = read('misal-templates.js');
  assert.ok(/select\('id,serial_no,report_date,officer_id,content'\)/.test(M) && /_zimniLabel\(z\)/.test(M) && /_zimniRecDate\(z\)/.test(M), 'انڈیکس');
  const S = read('search.js');
  assert.ok(/function _srZimni\(z\)/.test(S) && /ضمنی نمبر \\u2068\$\{z\._label\}\\u2069/.test(S), 'تلاش');
  assert.ok(/window\._zimniOrdKey\(z\)/.test(read('case-print.js')) && /sort\(byZimni\)/.test(read('case-print.js')), 'پورا مقدمہ');
  assert.ok(/const subj = `ضمنی نمبر \$\{_zimniLabel\(z\) \|\| ''\}/.test(Z), 'شیئر');
  assert.ok(/_zimniOrdKey\(a\) - _zimniOrdKey\(b\)/.test(Z), 'تمام ضمنیاں 1، 2، 2-الف …');
  assert.ok(/content: \{ bodyHtml, head, serial_no: serialNo, zno: zp\.label, zno_suffix:/.test(Z), 'محفوظ: بنیادی نمبر + پورا لکھا نمبر');
  assert.ok(/#ch173-doc \.zf-fld \.zf-ln\[data-k="zno"\]\{ min-width:4\.6em;/.test(Z), 'خانہ 003-الف جتنا');
  assert.ok(/#ch173-doc\.zf-editor \.zf-fld \.zf-ln\[data-k="zno"\]/.test(Z), 'فریم صرف ایڈیٹر میں (کاغذ پر نہیں)');
});

test('v566 B: تاریخ = کالم 1 — آلے کی آج کی تاریخ پر محفوظ نہیں ہوتی، فہرست میں محفوظ کرنے کا وقت نہیں', () => {
  const save = Z.slice(Z.indexOf('async function _saveZimni(silent, keepOpen) {'), Z.indexOf('window._saveZimni = _saveZimni;'));
  assert.ok(/if \(!fd\) return stop\('کالم 1 \(پہلے اندراج\) میں ضمنی کی تاریخ/.test(save));
  assert.ok(/report_date: fd\.iso,/.test(save) && !/report_date: fd \? fd\.iso : _zimniTodayIso\(\)/.test(save));
  const list = Z.slice(Z.indexOf('function _renderZimniList() {'), Z.indexOf('// ── فہرست کے ایکشن'));
  assert.ok(!/wq\(/.test(list) && !/_zimniFmtStamp\(d\.saved_at\)/.test(list), 'فہرست میں آلے کا وقت/تاریخ نہیں');
  assert.ok(/<th class="dtc">تاریخ<\/th>/.test(list));
  // پرانی ضمنی: کالم 1 → دستخط کی تاریخ → محفوظ report_date
  const c = ctx(); vm.runInContext(grab('_zimniRecDate'), c);
  assert.strictEqual(vm.runInContext("_zimniRecDate({ report_date: '2026-11-04', content: { col1_date: '29/10/2026 بوقت 10:00' } }).dmy", c), '29/10/2026');
  assert.strictEqual(vm.runInContext("_zimniRecDate({ report_date: '2026-11-04', content: { bodyHtml: '<div data-k=\"io_date\">20/10/2026</div>' } }).dmy", c), '20/10/2026');
  assert.strictEqual(vm.runInContext("_zimniRecDate({ report_date: '2026-11-04', content: {} }).dmy", c), '04/11/2026');
});

test('v566 C: ایک افسر ایک تاریخ — تفتیشی افسر الگ، ہر سینئر افسر الگ؛ سینئر کا نمبر الف/ب، ورنہ اگلا سادہ نمبر', () => {
  assert.ok(/byDate: iso \? \(others\.find\(x => _zimniRecIso\(x\) === iso && _zimniAuthorKey\(_zimniAuthorOf\(x\)\) === ak\)/.test(Z));
  const c = ctx();
  vm.runInContext(grab('_zimniAuthorKey'), c);
  assert.strictEqual(vm.runInContext("_zimniAuthorKey({ role: 'io', name: 'x' })", c), 'io');
  assert.strictEqual(vm.runInContext("_zimniAuthorKey({ role: 'sho', name: ' ندیم  عباس ' })", c), 'sho|ندیم عباس');
  assert.ok(/if \(io\) \{\s*const b = _zimniRecZno\(io\);/.test(Z) && /const suf = ZF_SUFFIXES\.find\(sx => !used\.has\(sx\)\);/.test(Z), '3 → 3-الف → 3-ب');
  assert.ok(/return _zimniZnoParse\(String\(m \+ 1\)\);/.test(Z), '3a: تفتیشی افسر کی ضمنی نہ ہو تو اگلا سادہ نمبر');
  assert.ok(/'<option value="sho"' \+ \(role === 'sho' \? ' selected' : ''\) \+ '>لکھنے والا: SHO<\/option>'/.test(Z), '1a: «لکھنے والا» کا انتخاب');
  assert.ok(/sel\.value === 'SHO ضمنی' \? 'sho' : \(sel\.value === 'DSP \/ SDPO ضمنی' \? 'dsp' : ''\)/.test(Z), '«SHO ضمنی» چننے پر SHO');
  assert.ok(/doc\.querySelectorAll\('\[data-k="murattib"\],\[data-k="io_sign"\]'\)/.test(Z) && /line\.appendChild\(_zimniIoSpan\(name\)\);/.test(Z), '2a: مرتبہ + دستخط، نام مقرر');
  assert.ok(!/digital_io_sho_sign/.test(Z), 'کوئی محفوظ دستخط (تصویر) ضمنی میں نہیں');
});

test('v566 D: ملزمان ▾ — کبھی خود نہیں لگتے، بٹن دستاویز میں محفوظ نہیں، ہر نشان فوراً، FIR / کراس الگ', () => {
  assert.ok(/async function _zimniFillBanam\(\) \{ return 0; \}/.test(Z), 'خود نہیں لگتا');
  const code = Z.split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n');
  assert.ok(!/_zimniFillBanam\(false\)/.test(code), 'کھلنے پر نہیں بلایا جاتا');
  assert.ok(!/onclick="_zimniAccPicker\(event\)"/.test(Z), 'نئے سانچے میں بٹن نہیں');
  assert.ok(/sanitizeHtml\(_zimniStripPick\(saved\.bodyHtml\)\)/.test(Z), 'کھولنے پر پرانا بٹن (▾ سمیت) پہلے نکالو');
  assert.ok(/s = _zimniStripPick\(s\);/.test(Z), 'محفوظ HTML میں نہیں');
  assert.ok(/box\.addEventListener\('change', \(\) => \{/.test(Z), 'ہر نشان پر فوراً');
  const c = { window: {} }; vm.createContext(c);
  vm.runInContext(grab('_zimniAccOf') + grab('_zimniStripPick'), c);
  const L = JSON.stringify([{ id: 1, name: 'الف', accused_type: 'fir' }, { id: 2, name: 'ب' }, { id: 3, name: 'ج', accused_type: 'cross_version' }, { id: 4, name: ' ' }]);
  assert.deepStrictEqual(JSON.parse(vm.runInContext('JSON.stringify(_zimniAccOf("fir", ' + L + ').map(a => a.id))', c)), [1, 2]);
  assert.deepStrictEqual(JSON.parse(vm.runInContext('JSON.stringify(_zimniAccOf("cross", ' + L + ').map(a => a.id))', c)), [3]);
  assert.strictEqual(vm.runInContext('_zimniStripPick(\'<td><button class="zf-pick no-print" onclick="x()">&#9662;</button></td>\')', c), '<td></td>');
});

test('v566 E: 161 ض ف — شناخت، ترتیب، پکا نمبر، کاغذ پر', () => {
  const c = { window: {} }; vm.createContext(c);
  vm.runInContext(grab('ZF_161_RE'), c);
  const n = (t) => vm.runInContext('(' + JSON.stringify(t) + '.match(new RegExp(ZF_161_RE.source, "g")) || []).length', c);
  assert.strictEqual(n('بیان 161 ض ف'), 1);
  assert.strictEqual(n('161ض ف'), 1);
  assert.strictEqual(n('161 ض۔ف'), 1);
  assert.strictEqual(n('۱۶۱ ض ف'), 1);
  assert.strictEqual(n('161 ض ف اور 161 ض ف'), 2);
  assert.strictEqual(n('1610 ت پ'), 0);
  assert.ok(/if \(mk && mk\.getAttribute\('data-fixed'\) === '1'/.test(Z), '4a: پکا نمبر نہیں بدلتا');
  assert.ok(/try \{ s161 = _zimni161Mark\(true\); \}/.test(Z), 'محفوظ پر پکا');
  assert.ok(/#ch173-doc \.zf-161n\{ display:block;/.test(Z) && !/@media print\{[^}]*zf-161n[^}]*display:none/.test(Z), '5a: کاغذ پر بھی');
  assert.ok(/if \(d0\._zfCol1\) \{/.test(Z), 'صرف کالم 1 میں لکھائی پر — کھولنے پر نہیں');
});

test('v566 F: کراس ورژن — صرف کراس والے مقدمے میں، ترتیب سرکار/بنام/«کراس ورژن»/سرکار/بنام', () => {
  const body = grab('_zimniDefaultBody');
  assert.ok(/const cross    = \(typeof caseHasCross === 'function'\) && caseHasCross\(c\);/.test(body));
  const i = ['data-k="sarkar"', 'data-k="banam"', 'data-k="xv_head"', 'data-k="sarkar_x"', 'data-k="banam_x"', 'data-k="murattib"'].map(k => body.indexOf(k));
  assert.ok(i.every(x => x > 0) && i.every((x, j) => j === 0 || x > i[j - 1]), i.join(','));
  assert.ok(/\$\{cross \? `/.test(body), 'کراس کے بغیر مقدمہ — پہلے جیسا');
  assert.ok(/#ch173-doc \.zf-xv-head\{[^}]*font-size:14pt;/.test(Z), 'تیسرے درجے کی سرخی 14pt');
});

test('v566: سروس ورکر کا نیا نسخہ', () => {
  const m = /const CACHE_NAME = 'digital-io-v(\d+)';/.exec(read('sw.js'));
  assert.ok(m && Number(m[1]) >= 566);
});
