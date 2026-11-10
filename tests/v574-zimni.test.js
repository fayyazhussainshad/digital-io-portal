// v574 — بیرونی ضمنی MW کے انداز میں: نمونوں کی فائل (zimni-templates.js) اور سورس کی جانچ؛
// اصل ایپ میں پوری جانچ: tests/real-app/v574_test.py (Desktop + Mobile، پرنٹ، reload)
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Z = read('zimni.js');

function tpl() {
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(read('zimni-templates.js'), c);
  return c.window.DIO_ZIMNI_TPL;
}
// zimni.js سے ایک فنکشن / const کا متن نکالو (اگلے top-level اعلان تک)
function grab(name) {
  const re = new RegExp('^(?:async function|function|const) ' + name.replace(/\$/g, '\\$') + '\\b', 'm');
  const m = re.exec(Z);
  assert.ok(m, name + ' موجود');
  const rest = Z.slice(m.index + 1);
  const n = /^(?:async function|function|const|let|window\.|\/\/ ═|if \(|try \{|setInterval|document\.)/m.exec(rest);
  return Z.slice(m.index, m.index + 1 + (n ? n.index : rest.length));
}

test('v574: MW کی 8 اقسام ترتیب سے، 151 نمونے، ہر نمونہ بلاک (کالم 1، 2، 3) میں', () => {
  const T = tpl();
  assert.strictEqual(T.ver, 1);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(T.cats.map(c => c.n))), ['پہلی ضمنی', 'گرفتاری', 'عدالت', 'درخواستیں', 'بیانات', 'متفرق', 'SHO کی ضمنی', 'DSP کی ضمنی']);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(T.cats.filter(c => c.role && c.role !== 'io').map(c => [c.n, c.role]))), [['SHO کی ضمنی', 'sho'], ['DSP کی ضمنی', 'dsp']]);
  assert.strictEqual(T.list.length, 151);
  const keys = new Set(T.cats.map(c => c.k));
  const names = new Set();
  T.list.forEach(t => {
    assert.ok(keys.has(t.k), t.n + ': قسم');
    assert.ok(t.n && !names.has(t.k + '|' + t.n), t.n + ': نام ایک بار');
    names.add(t.k + '|' + t.n);
    assert.ok(Array.isArray(t.b) && t.b.length >= 1, t.n + ': بلاک');
    t.b.forEach(r => assert.ok(Array.isArray(r) && r.length === 3 && r.every(x => typeof x === 'string'), t.n + ': [کالم 1، 2، 3]'));
  });
});

test('v574: نمونوں میں پرانے مقدمات کا ڈیٹا نہیں — افسر کا نام، موبائل، شناختی کارڈ، تاریخ؛ اختتامی سطر / دستخط نہیں', () => {
  const T = tpl();
  T.list.forEach(t => {
    assert.ok(!/(?<!ت)صدیق/.test(t.n), t.n + ': نمونے کے نام میں افسر کا نام نہیں («تصدیق» لفظ ہے، نام نہیں)');
    const all = t.n + '\n' + t.kh + '\n' + t.b.map(r => r.join('\n')).join('\n');
    assert.ok(!/0\d{3}[-\s]?\d{7}/.test(all), t.n + ': موبائل نمبر نہیں');
    assert.ok(!/\d{5}-\d{7}-\d/.test(all), t.n + ': شناختی کارڈ نہیں');
    assert.ok(!/\b\d{1,2}([/.-])\d{1,2}\1\d{2,4}\b/.test(all), t.n + ': پرانی تاریخ نہیں (مراسلہ نمبر جیسے F.2-3/99 تاریخ نہیں)');
    assert.ok(!/ارسال خدمت ہے/.test(all), t.n + ': اختتامی سطر Digital IO والی (نمونے میں نہیں)');
  });
});

test('v574: نمونوں کا ہر خانہ پہچانا ہوا — مقدمے کا ڈیٹا، کوائف موقع و مال، یا پیلا خالی خانہ [[…]]', () => {
  const T = tpl();
  const c = { window: {} };
  vm.createContext(c);
  ['_ZF_KW', '_ZF_TV_LBL', '_ZF_TV_LIT'].forEach(n => vm.runInContext(grab(n), c));
  const lbl = vm.runInContext('_ZF_TV_LBL', c), lit = vm.runInContext('_ZF_TV_LIT', c);
  const known = (k) => !!lbl[k] || !!lit[k] || /^(accused|gawah|hamrahi)\d+$/.test(k) || /^inksha{1,2}f\d*$/.test(k);
  const bad = new Set();
  T.list.forEach(t => t.b.forEach(r => r.forEach(x => {
    (x.match(/\(([A-Za-z][A-Za-z0-9_]*)\)/g) || []).forEach(m => { const k = m.slice(1, -1); if (!known(k)) bad.add(t.n + ': ' + m); });
    (x.match(/\[\[([^\]\n]*)\]\]/g) || []).forEach(m => { if (m.length < 5 || m.length > 44) bad.add(t.n + ': ' + m); });
  })));
  assert.deepStrictEqual([...bad], []);
});

test('v574: پرانی محفوظ ضمنیوں کے نام نئی اقسام پر — کچھ نہیں بدلتا، صرف دکھانے میں', () => {
  const c = { window: {} };
  vm.createContext(c);
  ['_ZIMNI_TYPES', '_ZF_MAIN_OLD', '_zimniMainNorm'].forEach(n => vm.runInContext(grab(n), c));
  const N = (m, s) => vm.runInContext('_zimniMainNorm(' + JSON.stringify(m) + ',' + JSON.stringify(s || '') + ')', c);
  assert.strictEqual(N('اول ضمنی'), 'پہلی ضمنی');
  assert.strictEqual(N('SHO ضمنی', 'معائنہ مسل'), 'SHO کی ضمنی');
  assert.strictEqual(N('DSP / SDPO ضمنی'), 'DSP کی ضمنی');
  assert.strictEqual(N('عدالتی درخواستیں', 'ریمانڈ جسمانی'), 'عدالت');
  assert.strictEqual(N('عدالتی درخواستیں', 'CDR / کال ریکارڈ'), 'درخواستیں');
  assert.strictEqual(N('میری اپنی قسم'), 'میری اپنی قسم', 'افسر کی اپنی قسم جوں کی توں');
});

test('v574: اوپر کی پٹی چھپی (دستاویز کی پٹی کے بٹن انہی کو دباتے ہیں)، کونوں میں ضمنی / نوعیت، نیچے 0.6cm', () => {
  assert.ok(/<div id="zf-tools" class="no-print zf-tools\$\{inDocView \? '' : ' zf-tools-show'\}">/.test(Z), 'پرانی پٹی صرف دستاویز کی پٹی نہ ہو تو');
  assert.ok(/id="zf-save-btn" class="btn btn-primary btn-sm dio-modbtn"/.test(Z) && /data-dio-print onclick="_printZimniCurrent\(\)"/.test(Z), 'محفوظ / پرنٹ کے بٹن DOM میں (چھپے)');
  assert.ok(/<span class="zf-cr zf-cr-r"><span id="zf-sub-wrap">/.test(Z) && /<span class="zf-cr zf-cr-l">\$\{_zimniMainSelectHTML\(mainShown\)\}<\/span>/.test(Z), 'دائیں نوعیت، بائیں ضمنی');
  assert.ok(/^const ZF_PAGE_BOT_CM = 0\.6;$/m.test(Z));
  assert.ok(/padding:1cm \$\{side\} \$\{ZF_PAGE_BOT_CM\}cm \$\{side\}/.test(Z), 'اسکرین کا کاغذ = چھپائی');
  assert.ok(/var contentH=\(isA4\?11\.69:13\)\*96 - CM - BOT;/.test(Z), 'صفحے کی اونچائی اسی حاشیے سے');
});

test('v574: کوائف موقع و مال — مقدمے کے ساتھ (آلہ + سرور، اپنا افسر)، لاگ آؤٹ پر صاف؛ نمونوں کی فائل آف لائن cache میں', () => {
  const S = read('dio-sync.js'), A = read('auth.js'), W = read('sw.js');
  assert.ok(/var UD_KIND = \{ zimni_draft: 'dio_zimni_draft_', za_draft: 'dio_za_draft_', case_kawaif: 'dio_case_kawaif_' \};/.test(S));
  assert.ok(/DIOSync\.ud\.queue\('case_kawaif', cid, 'fields', rec\)/.test(Z) && /localStorage\.setItem\(_ZF_KW_LS \+ cid, JSON\.stringify\(\{ fields: rec \}\)\)/.test(Z));
  assert.ok(/'dio_case_kawaif_', 'dio_cctx_'/.test(A), 'لاگ آؤٹ پر صاف');
  assert.ok(/'\/zimni\.js',\s*'\/zimni-templates\.js'/.test(W), 'service worker کی فہرست میں');
  assert.ok(/^const CACHE_NAME = 'digital-io-v574';/m.test(W));
});

test('v574: قطار صفحے پر ٹوٹے تو خانے کی نچلی padding کی جگہ پہلے ہی چھوڑی جائے (A4 پر بیچ میں خالی صفحہ نہیں)', () => {
  const f = Z.slice(Z.indexOf('function _zimniPaginate('), Z.indexOf('window._zimniPaginate = _zimniPaginate;'));
  assert.ok(/padB=Math\.max\(padB, \(parseFloat\(cs\.paddingBottom\)\|\|0\)\+\(parseFloat\(cs\.borderBottomWidth\)\|\|0\)\);/.test(f));
  assert.ok(/sp=lineFind\(bodyC, pTop\+contentH-EPS-padB\);/.test(f));
  assert.ok(!/\bdocument\./.test(f.replace(/\/\/.*$/gm, '')), 'document براہِ راست نہیں (DOC.defaultView)');
});

test('v574: کونوں کی قطار کی اونچائی مقرر — «خودکار محفوظ» کا نشان کاغذ کو نہیں کھسکاتا', () => {
  assert.ok(/\.zf-cr-m\{ flex:1 1 0; justify-content:center; flex-wrap:wrap; \}/.test(Z), 'بیچ کا حصہ بنیاد 0');
  assert.ok(/\.zf-stamps\{ display:inline-flex; flex-direction:column; justify-content:center; flex:0 1 16em; min-width:0; max-width:16em;\s*height:30px; overflow:hidden;/.test(Z), 'نشان مقررہ اونچائی');
  assert.ok(/\.zf-stamps > span\{ display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; \}/.test(Z));
});
