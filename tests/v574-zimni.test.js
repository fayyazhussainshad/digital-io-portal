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

test('v575: ضمنی کی پٹی چھپی؛ کاغذ کے کونوں میں ▾ (دائیں = ضمنی کی قسم، بائیں = نوعیت)؛ نیچے 0.6cm', () => {
  assert.ok(/<div id="zf-tools" class="no-print zf-tools\$\{inDocView \? '' : ' zf-tools-show'\}">/.test(Z), 'پرانی پٹی صرف دستاویز کی پٹی نہ ہو تو');
  assert.ok(/id="zf-save-btn" class="btn btn-primary btn-sm dio-modbtn[^"]*"/.test(Z) && /data-dio-print onclick="_printZimniCurrent\(\)"/.test(Z), 'محفوظ / پرنٹ کے بٹن DOM میں (چھپے)');
  assert.ok(!/id="zf-corners"/.test(Z) && !/id="zf-khulasa"/.test(Z), 'کاغذ کے اوپر کوئی قطار / خلاصے کا خانہ نہیں');
  assert.ok(/id="zf-cp-main" class="zf-cpick no-print[^"]*" onclick="_zimniCornerMenu\(event,'main'\)"/.test(Z) && /id="zf-cp-sub" class="zf-cpick no-print[^"]*" onclick="_zimniCornerMenu\(event,'sub'\)"/.test(Z));
  assert.ok(/if \(m\) \{ m\.style\.top = top \+ 'px'; m\.style\.left = \(left \+ r\.width - 4 - m\.offsetWidth\) \+ 'px'; \}   \/\/ دائیں کونا/.test(Z), 'ضمنی کی قسم = دائیں کونا');
  assert.ok(/if \(u\) \{ u\.style\.top = top \+ 'px'; u\.style\.left = \(left \+ 4\) \+ 'px'; \}/.test(Z), 'نوعیت = بائیں کونا');
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
  assert.ok(/^const CACHE_NAME = 'digital-io-v(\d+)';/m.test(W) && +/digital-io-v(\d+)/.exec(W)[1] >= 575);   // TASK 19: ہر deploy پر نیا نسخہ
});

test('v574: قطار صفحے پر ٹوٹے تو خانے کی نچلی padding کی جگہ پہلے ہی چھوڑی جائے (A4 پر بیچ میں خالی صفحہ نہیں)', () => {
  const f = Z.slice(Z.indexOf('function _zimniPaginate('), Z.indexOf('window._zimniPaginate = _zimniPaginate;'));
  assert.ok(/padB=Math\.max\(padB, \(parseFloat\(cs\.paddingBottom\)\|\|0\)\+\(parseFloat\(cs\.borderBottomWidth\)\|\|0\)\);/.test(f));
  assert.ok(/sp=lineFind\(bodyC, pTop\+contentH-EPS-padB\);/.test(f));
  assert.ok(!/\bdocument\./.test(f.replace(/\/\/.*$/gm, '')), 'document براہِ راست نہیں (DOC.defaultView)');
});

test('v575: سرخی «رپورٹ ضمنی بیرونی» ہمیشہ؛ نوعیت کا نام کاغذ پر نہیں؛ خلاصہ کالم 4 میں «از» کی جگہ', () => {
  assert.ok(/const ZIMNI_DEFAULT_TITLE = 'رپورٹ ضمنی بیرونی';/.test(Z));
  assert.ok(!/_zimniApplyTitle\(tpl\.n\)/.test(Z) && !/_zimniApplyTitle\(sel\.value\)/.test(Z) && !/t\.textContent = subType/.test(Z), 'نوعیت / نمونہ سرخی نہیں بدلتا');
  assert.ok(/void subType;\s*try \{ _zimniGuardTitle\(box\); \}/.test(Z), 'چھپائی میں بھی وہی سرخی (پرانی ضمنیاں بھی)');
  assert.ok(/const _ZF_KH_SEL = 'table\.zf-tbl th\.zf-c-from';/.test(Z) && /try \{ _zimniKhSet\(tpl\.kh \|\| '', doc\); \}/.test(Z), 'نمونے کا خلاصہ کالم 4 کی سرخی میں');
  assert.ok(/if \(old && !\/\^از\[۔\.\]\?\$\/\.test\(old\)\) c\.textContent = old;/.test(Z), '«از۔» ہٹ جاتا ہے');
});

test('v575: اوپر سے گرنے والی دستاویز کی پٹی پورے نظام سے ہٹی — نیچے کونے میں «⋯» (وہی کام)', () => {
  const DV = read('doc-viewer.js');
  assert.ok(/'#dio-dv-bar\{display:none !important;\}'/.test(DV), 'پٹی کبھی نظر نہیں آتی');
  assert.ok(!/try \{ _dioBarPeekInit\(ov\); \}/.test(DV), 'scroll / ماؤس پر نہیں آتی');
  assert.ok(/<button id="dio-dv-fab" class="no-print" type="button" onclick="_dioMenuToggle\(event\)"/.test(DV));
  ['new', 'save', 'print', 'share', 'keys', 'back'].forEach(k => assert.ok(new RegExp("\\['" + k + "', '").test(DV), k));
  assert.ok(/const map = \{ fir: '#dio-dv-fir', new: 'button\[onclick\^="_dioAddDocPicker"\]', save: '#dio-dv-save', print: 'button\[onclick\^="_dioPrintCurrent"\]',/.test(DV), 'وہی چھپے بٹن');
});

test('v575: کوائف «وقوعہ جات» میں؛ نقشہ موقع کے امتیازی نشانات سمتوں کے بعد؛ DSP: نام، رینک، پوسٹ، سرکل', () => {
  const MD = read('misal-docs.js'), SD = read('sho-dsp.js');
  assert.ok(/if \(docId === 'incidents'\) \{\s*_openDocId = docId;/.test(MD) && /window\.dioRenderKawaifPage\(_misalCaseId\)/.test(MD));
  assert.ok(/async function dioRenderKawaifPage\(cid\)/.test(Z) && !/await _zimniKwCard\(need/.test(Z), 'ضمنی کوائف نہیں پوچھتی');
  const c = { window: {} };
  vm.createContext(c);
  vm.runInContext(grab('_zimniTplWithMarks'), c);
  const W = (t) => vm.runInContext('_zimniTplWithMarks(' + JSON.stringify(t) + ')', c);
  assert.strictEqual(W('جس کے جانب شمال (north) اور جانب مغرب (west) واقع ہے۔نقشہ میں'), 'جس کے جانب شمال (north) اور جانب مغرب (west) واقع ہے۔ (naqshaMarks) نقشہ میں');
  assert.strictEqual(W('جانب مشرق (east1) واقع ہے۔'), 'جانب مشرق (east1) واقع ہے۔', 'جائے برآمدگی کی سمتیں نہیں');
  assert.strictEqual(W('شمال (north) تک'), 'شمال (north) تک (naqshaMarks)');
  vm.runInContext(grab('_zimniSeniorText'), c);
  assert.strictEqual(vm.runInContext("_zimniSeniorText({ role: 'dsp', name: 'ملک اسلم', rank: 'DSP', post: 'SDPO', circle: 'سرکل صدر' })", c), 'ملک اسلم DSP SDPO سرکل صدر');
  assert.strictEqual(vm.runInContext("_zimniSeniorText({ role: 'sho', name: 'ندیم', rank: 'SI/SHO' })", c), 'ندیم SI/SHO');
  assert.ok(/rec\.post = String\(\(document\.getElementById\('shodsp-post'\)\|\|\{\}\)\.value \|\| ''\)\.trim\(\);/.test(SD) && /rec\.circle = /.test(SD));
});
