/* v577 (افسر کی ہدایات، 11 نومبر 2026):
   1) ضمنی اور بیان 161 — محفوظ ہونے کے بعد «اپ ڈیٹ» (پرانی کھولیں تو بھی)
   2) بیانات 161 ض ف — اوپر کی پٹی ختم (بیرونی ضمنی کی طرح)، گواہ کا «▾» کاغذ کے کونے میں، مدعی فہرست میں (سب سے پہلے)
   4) ایڈمن پینل کے پیغامات اردو میں */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Z = read('zimni.js');

function editorHtml() {
  const a = Z.indexOf('function _renderZimniAEditor() {');
  return Z.slice(a, Z.indexOf('// ═══ report173 + zimni.js (بیرونی) کے اصل functions', a));
}

test('v577: بیانات 161 — اوپر کی پٹی ختم؛ «بیان ازاں ▾» کاغذ کے دائیں کونے میں؛ چھپے خانے وہی (⋯ / Ctrl+S انہی کو)', () => {
  const ed = editorHtml();
  assert.ok(!/class="no-print zfa-bar"/.test(ed), 'اوپر کی پٹی نہیں');
  assert.ok(/<div id="zfa-state" class="no-print" hidden style="display:none;">/.test(ed), 'حالت چھپے خانے میں');
  for (const id of ['zfa-wit-sel', 'zfa-updated', 'zfa-autosave', 'zfa-save-btn', 'zfa-back-btn', 'zfa-close-btn']) {
    const at = ed.indexOf('id="' + id + '"');
    assert.ok(at > ed.indexOf('id="zfa-state"') && at < ed.indexOf('id="zfa-scroll"'), id + ' چھپے خانے میں');
  }
  assert.ok(/id="zfa-updated" data-dio-status><\/span><span id="zfa-autosave" data-dio-status>/.test(ed), 'محفوظ ہونے کا وقت «⋯» میں');
  assert.ok(/<button type="button" id="zfa-cp-wit" class="zfa-cpick no-print dio-pick" onclick="_zaWitMenu\(event\)"[^>]*title="بیان ازاں — گواہ منتخب کریں"/.test(ed), 'کونے کا ▾ (وہی چننے والا بٹن)');
  assert.ok(/\.zfa-cpick\{ position:absolute;/.test(Z) && /@media print\{ \.zfa-cpick\{ display:none !important; \} \}/.test(Z), 'چھپائی میں نہیں');
  assert.ok(/try \{ _zaCornerBind\(\); \}/.test(Z) && /function _zaCornerPos\(\)/.test(Z), 'کاغذ کے ساتھ جگہ');
  assert.ok(/function _zaWitPick\(v\)/.test(Z) && /_zaWitPick\(v\);\n  \}\);\n\}\nwindow\._zaWitMenu = _zaWitMenu;/.test(Z), 'فہرست سے چننا = پہلے والا کام');
});

test('v577: گواہ کی فہرست — مدعی ہمیشہ اور سب سے پہلے (گواہوں میں اسی نام سے درج ہو تب بھی «(مدعی)»)', async () => {
  const a = Z.indexOf('async function _zaLoadWitnesses()');
  const src = Z.slice(a, Z.indexOf('window._zaLoadWitnesses = _zaLoadWitnesses;', a));
  const tag = Z.slice(Z.indexOf('function _zaWitTag(w)'), Z.indexOf('// v577: کاغذ کے دائیں کونے کا «▾»'));
  const run = async (rows, cse) => {
    const ctx = vm.createContext({
      _zaCaseId: 'c1', _zaCase: cse, _zaWitnesses: null,
      supabaseClient: { from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: JSON.parse(JSON.stringify(rows)) }) }) }) }) },
    });
    vm.runInContext('var _zaWitnesses = null;' + src + '\n' + tag, ctx);
    const out = await vm.runInContext('_zaLoadWitnesses()', ctx);
    return out.filter(w => String(w.full_name || '').trim()).map(w => w.full_name + vm.runInContext('_zaWitTag', ctx)(w));   // خالی نام فہرست میں نہیں آتے (_zaFillWitSel)
  };
  const W = [{ id: 'w1', full_name: 'احمد علی', status: 'fir_eye' }, { id: 'w2', full_name: 'غلام رسول', status: 'fir_eye' }];
  assert.deepStrictEqual(await run(W, { complainant: 'محمد امجد', fir_writer: 'محمد اسلم ASI' }),
    ['محمد امجد (مدعی)', 'محمد اسلم ASI (محرر)', 'احمد علی', 'غلام رسول']);
  // مدعی گواہوں میں بھی درج (دوسری حیثیت سے) — ایک ہی سطر، «(مدعی)» کے ساتھ، سب سے پہلے
  assert.deepStrictEqual(await run(W.concat([{ id: 'w3', full_name: 'محمد  امجد', status: 'fir_eye' }]), { complainant: 'محمد امجد' }),
    ['محمد  امجد (مدعی)', 'احمد علی', 'غلام رسول']);
  // «مدعی» حیثیت والا اندراج خالی نام کا — مقدمے کا مدعی پھر بھی
  assert.deepStrictEqual(await run([{ id: 'w4', full_name: '', status: 'mudai' }].concat(W), { complainant_name: 'محمد امجد' }),
    ['محمد امجد (مدعی)', 'احمد علی', 'غلام رسول']);
  assert.ok(/const role       = witness\._role \|\| witness\.status;/.test(Z), 'گواہوں میں درج مدعی کے بیان میں بھی FIR کا متن نہیں');
});

test('v577: محفوظ ہونے کے بعد «اپ ڈیٹ» — ضمنی، بیان 161، اور «⋯» کی سطر', () => {
  assert.ok(/id="zfa-save-btn"[\s\S]{0,700}<span>\$\{z\.id \? 'اپ ڈیٹ' : 'محفوظ کریں'\}<\/span>/.test(editorHtml()), 'پرانا بیان کھلے تو «اپ ڈیٹ»');
  const DV = read('doc-viewer.js');
  assert.ok(/const saveLbl = \(own && \/اپ ڈیٹ\/\.test\(own\.textContent \|\| ''\)\) \? 'اپ ڈیٹ' : 'محفوظ کریں';/.test(DV) && /\['save', saveLbl, 'save'/.test(DV));
  assert.ok(!/«محفوظ کریں»', 'info', 6000/.test(Z) && (Z.match(/Ctrl\+S \/ «اپ ڈیٹ»'/g) || []).length === 2, 'بحال شدہ مسودے کا پیغام');
});

test('v577: ایڈمن پینل کے پیغامات اردو میں (نام / سرور کا پیغام <bdi> اور escape کے ساتھ)', () => {
  const A = read('admin.html');
  const msgs = [...A.matchAll(/showToast\((['`])((?:(?!\1).)*)\1/g)].map(m => m[2]).concat([...A.matchAll(/showErr\('([^']*)'/g)].map(m => m[1]));
  assert.ok(msgs.length >= 30, msgs.length);
  const eng = msgs.filter(m => /[A-Za-z]{3,}/.test(m.replace(/<bdi[^>]*>|<\/bdi>|\$\{[^}]*\}|CSV/g, '')));
  assert.deepStrictEqual(eng, []);
  assert.ok(!/showToast\([^)]*(✅|❌|⚠️|🚫|📧|🔄|📤)/.test(A), 'پرانے ایموجی نہیں');
  assert.ok(/function _ub\(v\)/.test(A) && /t\.dir = 'rtl';/.test(A) && /src: url\('fonts\/jameel-noori-nastaleeq\.woff2'\)/.test(A));
  assert.ok(!/showToast\(`[^`]*\$\{name\}/.test(A) && !/showToast\(`[^`]*\$\{officerName\}/.test(A), 'نام escape کے بغیر نہیں');
});
