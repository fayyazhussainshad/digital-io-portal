// v568 — TASK 7: ضمنیات کی فہرست، «تمام ضمنیاں»، ڈپلیکیٹ ضمنی، بیان 161 کا محفوظ ہونا، منسلک اندرونی شیٹ الگ (افسر کی ہدایت، 4 نومبر 2026)
// اصل ایپ میں پوری جانچ: tests/real-app/v568_test.py + v568_sync_test.py (Desktop + Mobile، پرنٹ، دو آلات)
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const Z = read('zimni.js');
const fn = (name) => { const m = new RegExp('^(?:async )?function ' + name + '\\(.*?\\n\\}\\n', 'sm').exec(Z); return m ? m[0] : ''; };

test('v568: «تمام ضمنیاں» — ہر ضمنی کا اپنا تیار کاغذ (_zimniFinalize(_zimniDocHTML)) جوڑا جاتا ہے، ایک مشترک حساب نہیں', () => {
  const f = fn('_printAllZimniNow');
  assert.ok(/_zimniFinalize\(_zimniDocHTML\(z\)\)/.test(f), 'ہر ضمنی اپنے پرنٹ جیسی');
  assert.ok(!/_zimniPrintHTML\(body\)/.test(f), 'پرانا مشترک کاغذ نہیں');
  assert.ok(/data-dio-nobind/.test(f), 'مجموعے پر دوبارہ مثل کا حساب نہیں');
});

test('v568: سرور کا «دوہرا» (23505) رد کبھی جھوٹا «محفوظ» نہیں — بیرونی اور اندرونی ضمنی دونوں', () => {
  for (const name of ['_zimniWrite', '_zaWrite']) {
    const f = fn(name);
    assert.ok(/throw dupErr/.test(f), name + ': اپنی پچھلی کوشش نہ ہو تو اصل رد');
    assert.ok(/DIO_NOROW/.test(f) && /!id && Array\.isArray\(res\.data\) && !res\.data\.length/.test(f), name + ': قطار واپس نہ آئے تو محفوظ نہیں');
  }
  assert.ok(/_zaFreeSerial\(caseId, base\.serial_no\)/.test(fn('_zaSyncOne')), 'بیان: نمبر کے «دوہرا» پر اگلا خالی نمبر');
});

test('v568: Ctrl+S / اوپر کا «محفوظ» / چالان کا محفوظ — بیرونی ضمنی (.zf-tbl) پہلے، پھر اکیلا بیان 161', () => {
  const pairs = [
    [fn('_dioBindCtrlS'), "querySelector('.zf-tbl')) { _saveZimni", "querySelector('.zfa-tbl')) { _saveZimniA"],
    [read('dio-keys.js'), "querySelector('.zf-tbl') && typeof window._saveZimni ", "querySelector('.zfa-tbl') && typeof window._saveZimniA "],
    [read('doc-viewer.js'), "d0.querySelector('.zf-tbl') && typeof window._saveZimni ", "d0.querySelector('.zfa-tbl') && typeof window._saveZimniA "],
    [read('report173.js'), "d0.querySelector('.zf-tbl') && typeof window._saveZimni ", "d0.querySelector('.zfa-tbl') && typeof window._saveZimniA "],
  ];
  for (const [src, a, b] of pairs) {
    const i = src.indexOf(a), j = src.indexOf(b);
    assert.ok(i >= 0 && j >= 0 && i < j, a);
  }
  assert.ok(/function _zaIsSolo\(d\) \{ return !!\(d && d\.querySelector && d\.querySelector\('\.zfa-tbl'\) && !d\.querySelector\('\.zf-tbl'\)\); \}/.test(Z));
  assert.ok(/if \(!_zaIsSolo\(ed\)\) return false;/.test(fn('_saveZimniA')), 'بیان 161 کا محفوظ بیرونی ضمنی پر نہیں چلتا');
});

test('v568: منسلک اندرونی شیٹ (بیرونی ضمنی) اکیلے بیان 161 کے فنکشن نہیں لیتی — اپنی منجمد نقل', () => {
  for (const f of ['_zfAttFormCSS', '_zfAttDefaultBody', '_zfAttAutoNumbers', '_zfAttFitTable']) assert.ok(fn(f), f);
  const ed = fn('_renderZimniEditor'), pr = fn('_zimniPrintHTML'), sk = fn('_zimniZaSkel'), en = fn('_zimniEnsureAndrooni');
  assert.ok(/_zfAttFormCSS\(\)/.test(ed) && !/_zaFormCSS\(/.test(ed), 'ایڈیٹر');
  assert.ok(/_zfAttFormCSS\(\)/.test(pr) && !/_zaFormCSS\(/.test(pr), 'پرنٹ');
  assert.ok(/_zfAttDefaultBody/.test(sk) && !/_zaDefaultBody/.test(sk), 'پرنٹ کی شیٹ');
  assert.ok(/_zfAttDefaultBody/.test(en) && /_zfAttAutoNumbers/.test(en) && !/_zaDefaultBody\(|_zaAutoNumbers\(/.test(en), 'ایڈیٹر کی شیٹ');
  // نقل حرف بہ حرف (صرف نام بدلا): CSS میں صرف اکیلے بیان 161 کا «کاغذ پر kerning خودکار» (v568) الگ
  assert.ok(/html #ch173-doc\{ font-kerning:auto; \}/.test(fn('_zaFormCSS')), 'اکیلا بیان 161: 27 اکتوبر کی طرح کاغذ پر kerning خودکار');
  assert.ok(!/html #ch173-doc\{ font-kerning/.test(fn('_zfAttFormCSS')), 'منسلک شیٹ: کاغذ کا قاعدہ اپنی بیرونی ضمنی والا');
  // v580 (افسر کا حکم 12 نومبر 2026): منسلک شیٹ کا متن بھی بیان 161 کی طرح justify، الفاظ جُڑے بغیر — دونوں ایک ہی مشترکہ قاعدہ
  assert.ok(/\$\{_zfJustifyCSS\(\)\}/.test(fn('_zfAttFormCSS')) && /\$\{_zfJustifyCSS\(\)\}/.test(fn('_zaFormCSS')), 'دونوں میں _zfJustifyCSS');
  assert.strictEqual(fn('_zfAttFormCSS').replace('_zfAttFormCSS', 'X'),
    fn('_zaFormCSS').replace('_zaFormCSS', 'X').replace(/\n  \/\* v568 \(TASK 7-D[\s\S]*?\*\/\n  html #ch173-doc\{ font-kerning:auto; \}/, ''), 'باقی CSS ایک جیسی');
});

test('v568: فہرست — ترمیم / پرنٹ / شیئر / ڈپلیکیٹ / حذف (PDF / نقل نہیں)؛ بٹن مقدمہ کی فہرست جیسے', () => {
  const L = fn('_renderZimniList');
  assert.ok(/dioActBtn\('duplicate', `_dupZimni\(/.test(L), 'ڈپلیکیٹ');   // TASK 19: ڈپلیکیٹ کا اپنا نشان
  assert.ok(!/_pdfZimni|_copyZimni/.test(Z), 'PDF / نقل کے فنکشن نہیں');
  assert.ok(/function dioActBtn\(kind, js, title\) \{\n  return dioBtn\(/.test(read('app-core.js')) && /html \.dio-btn\.dio-btn \{/.test(read('dio-ui.css')), 'بٹن کی شکل (TASK 19: ایک ہی مشترکہ بٹن)');
});

test('v568: سروس ورکر کا نیا نسخہ', () => {
  const m = /const CACHE_NAME = 'digital-io-v(\d+)';/.exec(read('sw.js'));
  assert.ok(m && Number(m[1]) >= 568);
});
