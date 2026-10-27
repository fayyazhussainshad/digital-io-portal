// ════════════════════════════════════════════════════════════════
//  DIGITAL IO — v558: اندرونی ضمنی (بیانات 161) کا محفوظ کرنے کا نظام اور شکل
//  (اصل ایپ کی مکمل جانچ: tests/real-app/v558_test.py)
// ════════════════════════════════════════════════════════════════
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const Z = read('zimni.js');
const ed = Z.slice(Z.indexOf('function _renderZimniAEditor()'), Z.indexOf('window._renderZimniAEditor'));

test('اندرونی ضمنی: پرانی ٹول بار ختم — صرف گواہ کا ڈراپ ڈاؤن + محفوظ / واپس / بند', () => {
  assert.ok(ed.length > 500);
  for (const old of ["_zimniFmt('bold')", 'ch173-font-sel', 'ch173-brush-btn', '_printZimniA()', '_zaWitnessPickerOpen']) {
    assert.ok(!ed.includes(old), 'باقی: ' + old);
  }
  assert.ok(/id="zfa-wit-sel"/.test(ed) && /_saveZimniA\(false,true\)/.test(ed) && /_zaBackToList\(\)/.test(ed) && /_zaClose\(\)/.test(ed));
});

test('بیان: «بیان ازاں» + نام، «(زیردفعہ 161ض ف)» بائیں، IO + تاریخ بیرونی ضمنی کے اصول پر', () => {
  assert.ok(/'<div class="zfa-wit-head">بیان ازاں ' \+ E\(nmRaw\) \+ ' <span class="zfa-wit-ref161">\(زیردفعہ 161ض ف\)<\/span><\/div>'/.test(Z));
  assert.ok(/\.zfa-wit-ref161\{ float:left;/.test(Z));
  assert.ok(/zfa-wit-gap"><br><\/div><div class="zfa-wit-gap"><br><\/div>/.test(Z), 'دستخط کی جگہ: دو خالی سطریں');
  assert.ok(/const today = _zimniToday\(\);/.test(Z), 'تاریخ DD/MM/YYYY');
});

test('محفوظ: پہلے آلے پر، پھر سرور؛ «ٹوٹا» صرف ڈھانچے کی غلطی پر؛ مسودہ اور sync', () => {
  const save = Z.slice(Z.indexOf('async function _saveZimniA('), Z.indexOf('window._saveZimniA = _saveZimniA;'));
  assert.ok(save.indexOf('const okLocal = localSave(localObj)') < save.indexOf('_zaWrite(base'), 'آلے پر پہلے');
  const load = Z.slice(Z.indexOf('async function _loadZimniA()'), Z.indexOf('// ── SYNC: آلے پر محفوظ'));
  assert.ok(/PGRST204\|PGRST205\|42703\|42P01/.test(load) && /if \(schema\) \{ window\._zaDbBroken = true;/.test(load));
  assert.ok(!/window\._zaDbBroken = true;\s*try \{ console\.error\('\[zimni androoni load\] zimni_androoni_reports کا ڈھانچہ/.test(Z), 'پرانا «ہر غلطی پر ٹوٹا» نہیں');
  assert.ok(/function _zaWriteDraft\(\)/.test(Z) && /'dio_za_draft_' \+ caseId/.test(Z) && /window\.addEventListener\('pagehide', flush\)/.test(Z));
  assert.ok(/window\.addEventListener\('online', \(\) => \{ window\._zaDbBroken = false; setTimeout\(\(\) => \{ _zaSyncPending\(\); \}/.test(Z));
  const os = read('offline-store.js');
  assert.ok(/table==='zimni_androoni_reports'[\s\S]{0,300}_zaSyncPending/.test(os), 'پرانی قطار دوہرا نہ بھیجے');
});

test('Ctrl+S / Ctrl+P / پٹی کے بٹن — اندرونی ضمنی کبھی چالان کے راستے پر نہیں', () => {
  assert.ok(/d0\.querySelector\('\.zfa-tbl'\)[\s\S]{0,80}_saveZimniA/.test(read('report173.js')), '_saveR173 → بیان');
  assert.ok(/\.zfa-tbl'\)[\s\S]{0,80}_printZimniANow/.test(read('report173.js')));
  assert.ok(/\.zfa-tbl'\)[\s\S]{0,200}_printZimniA\(\)/.test(read('app-core.js')));
  assert.ok(/#ch173-doc \.zfa-tbl'\)[\s\S]{0,200}_printZimniA\(\)/.test(read('index.html')));
  const dv = read('doc-viewer.js');
  assert.ok(/function _dioSaveCurrent\(\)[\s\S]{0,900}\.zfa-tbl'\)[\s\S]{0,80}_saveZimniA\(false, true\)/.test(dv), 'پٹی کا «محفوظ»');
  assert.ok(!/showToast\('ℹ️ یہ صفحہ خودکار محفوظ ہوتا ہے'/.test(dv), 'غلط «خودکار محفوظ» پیغام نہیں');
  assert.ok(/if \(doc\.querySelector\('\.zfa-tbl'\)\) \{ _saveZimniA\(false, true\)/.test(Z), 'پرانا _dioBindCtrlS بھی');
});

test('بیرونی ضمنی: ایڈیٹر میں کھڑی لکیریں کاغذ کے نیچے تک، محفوظ مواد میں عارضی اونچائی نہیں', () => {
  assert.ok(/function _zimniFillScreen\(\)/.test(Z) && /tr\.zf-blk'\)\) \{ _zimniFillScreen\(\); return; \}/.test(Z));
  assert.ok(/tr\.zf-endrow > td'\)\.forEach\(td => \{ td\.style\.height = ''/.test(Z));
});

test('27 اکتوبر: اردو کی بورڈ پر بھی Ctrl+S / Ctrl+P (اصل کلید e.code سے) — سب سے پہلے، ایک ہی جگہ', () => {
  const h = read('index.html');
  const i = h.indexOf("Object.defineProperty(e, 'key'");
  assert.ok(i > 0 && i < h.indexOf('<script src='), 'سب سے پہلے والے اسکرپٹ میں');
  assert.ok(/\/\^Key\(\[A-Z\]\)\$\/\.exec\(String\(e\.code/.test(h));
});

test('27 اکتوبر: اختتامی سطر «۔» کے ساتھ، اوپر کی جگہ آدھی، «از۔» دُگنا، اکیلے نام پر «1» نہیں', () => {
  assert.ok(/>رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔<\/div>/.test(Z) && !/>رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے<\/div>/.test(Z));
  assert.ok(/\.zf-close\{ margin-top:0\.5em;/.test(Z) && /tr\.zf-endrow td\{ padding-top:0; \}/.test(Z));
  assert.ok(/<col style="width:67%"><col style="width:12%">/.test(Z));
  assert.ok(/\(\(n === 1\) \? '' : \(i \+ 1\) \+ '\\u06D4 '\)/.test(Z));
  const R = read('report173.js');
  assert.ok(!/return '1\\u06D4 ' \+ nm/.test(R), 'مدعی پر «1۔» نہیں');
});

test('27 اکتوبر: فہرست کے ایکشن بٹن ایک جیسے (dioActBtn)، ضمنی فہرست میں PDF / نقل نہیں', () => {
  assert.ok(/function dioActBtn\(kind, js, title\)/.test(read('app-core.js')));
  for (const f of ['_pdfZimni', '_copyZimni', '_pdfZimniA', '_copyZimniA']) assert.ok(!new RegExp('function ' + f + '\\(').test(Z), f);
  assert.ok(/dioActBtn\('print', `_printZimniById/.test(Z));
});
