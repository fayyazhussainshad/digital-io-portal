/* ═══════════════════════════════════════════════════════════════
   واقعاتی رپورٹ (v535) — نئی ترتیب کے اصول
   چلانا: npm test
   ═══════════════════════════════════════════════════════════════ */
/* global require, __dirname */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = read('incident.js');

// incident.js کو بغیر براؤزر کے لوڈ کرو — صرف خالص فنکشن جانچنے کے لیے
function load() {
  const store = {};
  const ctx = {
    console, Intl, Date, Math, JSON, String, Number, Array, Object, RegExp, encodeURIComponent, parseInt, parseFloat, isFinite,
    registerPage() {}, window: { addEventListener() {} }, navigator: { onLine: true },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    document: { createElement: () => ({ set innerHTML(v) { this._t = String(v).replace(/<[^>]*>/g, ''); }, get textContent() { return this._t; } }) },
  };
  ctx.window.addEventListener = () => {};
  vm.createContext(ctx);
  vm.runInContext(J + '\n;this.__t={_irDtHtml,_irDmy,_irIsoDate,_irPeriod,_irParseLatLng,_irLatLngText,_irFieldsOf,IR_ROWS};', ctx);
  return ctx.__t;
}

test('اصل کاغذ کی تمام سطریں، اسی ترتیب میں', () => {
  const { IR_ROWS } = load();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(IR_ROWS.map(r => r.l))), [
    'نوعیت وقوعہ', 'تاریخ / وقت وقوعہ', 'تاریخ / وقت اطلاع کنٹرول روم', 'جائے وقوعہ',
    'اطلاع دہندہ', 'متاثرہ کا نام', 'وجہ عناد / حادثہ', 'ملزم / ملزمان کے نام / تعداد',
    'حلیہ جات ملزمان', 'وہیکل / قسم / رنگ', 'موقع وزٹ کرنے والے افسران', 'ریسپانڈنگ آفیسر', 'تعداد گرفتار ملزمان']);
  // آخر میں ایک ملا ہوا خانہ «جناب عالیٰ! مختصر حالات اس طرح پر ہیں کہ»
  assert.ok(/<tr class="ir-detail-row"><td colspan="2">/.test(J));
  assert.ok(/<b>جناب عالیٰ!<\/b> مختصر حالات اس طرح پر ہیں کہ/.test(J));
  assert.ok(/title: 'واقعاتی رپورٹ'/.test(J) && !/INCIDENT REPORT'/.test(J), 'عنوان اردو میں');
  assert.ok(/واقعاتی رپورٹ مرتب ہو کر ارسال ہے۔/.test(J));
  assert.ok(!/l: 'نوعیت جرم'/.test(J) && !/درخواست \/ اطلاع دہندہ/.test(J));
});

test('تھانہ/ضلع پہلی سطر میں (درخواستوں کا اصول)، SHO کی سطر میں نام نہیں', () => {
  const i = J.indexOf('<div class="ir-title-row">'), h = J.indexOf('<div class="ir-head">'), t = J.indexOf('<table class="ir-table"');
  assert.ok(i > 0 && i < h && h < t, 'سطر 1: تھانہ/ضلع، پھر عنوان، پھر جدول');
  assert.ok(/\.ir-tt-left\{[^}]*margin-left:1cm/.test(J));
  assert.ok(/sho_line: `<bdi dir="ltr">\$\{_irE\(shoRank\)\}<\/bdi> تھانہ \$\{_irE\(station\)\}`/.test(J), 'صرف عہدہ + تھانہ');
  assert.ok(!/getSHOSignLine\(/.test(J), 'نام والی سطر استعمال نہیں');
});

test('فہرست ملزمان/گواہان کی ترتیب میں + «نیا اندراج»', () => {
  assert.ok(/<div class="page-title">واقعاتی رپورٹس<\/div>/.test(J));
  assert.ok(/class="btn btn-primary dio-add-btn" onclick="_irNew\(\)">\+ نیا اندراج</.test(J));
  assert.ok(/class="form-input" id="ir-list-q"/.test(J) && /class="card ir-card"/.test(J));
});

test('«نیا اندراج» hub میں واقعاتی رپورٹ', () => {
  const d = read('dio-entry.js');
  assert.ok(/\['waqiati', 'واقعاتی رپورٹ'/.test(d));
  assert.ok(/kind === 'waqiati'[\s\S]{0,300}need\(\['incident\.js'\]\)[\s\S]{0,300}openIncidentNew/.test(d));
  assert.ok(/function openIncidentNew/.test(J));
});

test('SYSTEM RULE: Ctrl+P = سکرین کا پرنٹ بٹن (پورا سسٹم)', () => {
  const h = read('index.html');
  assert.ok(/function _pFindTarget\(\)/.test(h));
  assert.ok(/_printR173[\s\S]{0,400}dio-docview[\s\S]{0,300}_dioPrintCurrent/.test(h), 'چالان، پھر پورا صفحہ');
  assert.ok(/data-dio-print/.test(h) && /dio-modbtn/.test(h));
  // v552: stopImmediatePropagation — اسی document کے دوسرے Ctrl+P سننے والے دوبارہ نہ چلیں (دوہرا پرنٹ نہیں)
  assert.ok(/if \(fn\) \{ e\.preventDefault\(\); e\.stopImmediatePropagation\(\); fn\(\); \}/.test(h));
  // v552: ضمنی (#ch173-doc .zf-tbl) کا اپنا پرنٹ — چالان والے سے پہلے
  assert.ok(/#ch173-doc \.zf-tbl[\s\S]{0,200}_printZimniCurrent[\s\S]{0,300}#ch173-doc #ch173-table/.test(h), 'ضمنی پہلے، پھر چالان');
  // پٹی کا پرنٹ: دستاویز کا اپنا بٹن؛ نہ ہو تو خاموش نہیں بلکہ براؤزر کی چھپائی
  const dv = read('doc-viewer.js');
  assert.ok(/_dioModulePrintBtn\(document\.getElementById\('dio-dv-body'\)\)[\s\S]{0,400}window\.print\(\)/.test(dv));
  // واقعاتی رپورٹ کا بٹن واضح نشان کے ساتھ، اور وہی window.print جو Ctrl+P
  assert.ok(/data-dio-print onclick="_irPrint\(\)"/.test(J) && /function _irPrint[\s\S]{0,300}window\.print\(\)/.test(J));
});

test('موبائل منظر: پوری چوڑائی (خالی جگہ نہیں)، چھپائی پھر بھی A4', () => {
  assert.ok(/@media screen and \(max-width:760px\)\{[\s\S]*#ir-view:not\(\.ir-a4\) #ir-doc\{ width:100%/.test(J));
  assert.ok(/function _irBalance[\s\S]{0,700}classList\.add\('ir-a4'\)/.test(J), 'ناپ A4 پر');
});

test('تاریخ DD/MM/YYYY انگریزی ہندسوں میں، نمبر LTR', () => {
  const t = load();
  assert.strictEqual(t._irDmy('2026-10-08T05:15'), '08/10/2026');
  assert.strictEqual(t._irIsoDate('8/10/2026'), '2026-10-08');
  assert.strictEqual(t._irIsoDate('2026-10-08'), '2026-10-08');
  const h = t._irDtHtml('2026-10-08T05:15');
  assert.strictEqual(h, '<bdi dir="ltr">08/10/2026</bdi> بوقت <bdi dir="ltr">05:15</bdi> بجے صبح');
  assert.ok(/بجے رات$/.test(t._irDtHtml('2026-10-08T23:40')));
  assert.ok(/<bdi dir="ltr">12:05<\/bdi> بجے دوپہر$/.test(t._irDtHtml('2026-10-08T12:05')));
  assert.ok(/<bdi dir="ltr">12:30<\/bdi> بجے رات$/.test(t._irDtHtml('2026-10-08T00:30')));
});

test('Lat/Long — پڑھنا/لکھنا، غلط قیمت رد', () => {
  const t = load();
  assert.deepStrictEqual(JSON.parse(JSON.stringify(t._irParseLatLng('30.157458, 71.524918'))), { lat: 30.157458, lng: 71.524918 });
  assert.deepStrictEqual(JSON.parse(JSON.stringify(t._irParseLatLng('30.1،71.5'))), { lat: 30.1, lng: 71.5 });
  assert.strictEqual(t._irParseLatLng('abc'), null);
  assert.strictEqual(t._irParseLatLng('95.0, 71.5'), null);
  assert.strictEqual(t._irLatLngText(30.1574581, 71.5249183), '30.157458, 71.524918');
  assert.strictEqual(t._irLatLngText(undefined, undefined), '');
});

test('پرانی رپورٹس نئی ترتیب میں کھلیں — کچھ ضائع نہیں', () => {
  const t = load();
  const old = { incident_type: 'چوری', incident_date: '08/10/2026 05:15', address: 'وقاص ٹاؤن', narrative: 'سطر1\nسطر2',
    data: { caller_name: 'ملک زاہد', person_name: 'x', person_type: 'مضروب', officers: ['ندیم', 'علی'], accused: '1' } };
  const { f, meta } = t._irFieldsOf(old);
  assert.strictEqual(f.nature, 'چوری');
  assert.strictEqual(f.place, 'وقاص ٹاؤن');
  assert.strictEqual(f.caller, 'ملک زاہد');
  assert.strictEqual(f.visitors, 'ندیم، علی', 'پرانا «موقع وزٹ کرنے والے افسران» اپنی جگہ');
  assert.strictEqual(f.detail, 'سطر1<br>سطر2');
  assert.strictEqual(meta.person_type, 'مضروب');
  // نیا فارم ویسا ہی واپس
  const neu = { data: { _form: 'ir2', f: { nature: 'ڈکیتی' }, lat: 30.1 } };
  assert.strictEqual(t._irFieldsOf(neu).f.nature, 'ڈکیتی');
  assert.strictEqual(t._irFieldsOf(neu).meta.lat, 30.1);
});

test('سسٹم کے اصول: 14pt، Jameel Noori، pt (px نہیں)، A4، عنوان 20pt', () => {
  const css = J.slice(J.indexOf('function _irCSS'), J.indexOf('function _irFit'));
  assert.ok(/#ir-doc\{[^}]*font-family:'Jameel Noori Nastaleeq'[^}]*font-size:14pt/.test(css));
  assert.ok(/size:A4 portrait/.test(css));
  assert.ok(/padding:1cm 0\.5in 1cm 0\.4in/.test(css), 'مارجن: دائیں 0.5in (ASI)، بائیں 0.4in، اوپر/نیچے 1cm');
  assert.ok(/\.ir-title\{[^}]*font-size:20pt/.test(css));
  // کاغذ کے اندر کوئی px والا font نہیں
  const docRules = css.split('\n').filter(l => /#ir-doc/.test(l));
  docRules.forEach(l => assert.ok(!/font-size:\s*\d+(\.\d+)?px/.test(l), 'px font: ' + l.trim()));
});

test('چھپائی: صرف کاغذ — پٹی/بٹن نہیں، native print میں #ir-doc', () => {
  assert.ok(/'#ir-doc',/.test(read('index.html')));
  const css = J.slice(J.indexOf('function _irCSS'), J.indexOf('function _irFit'));
  assert.ok(/@media print\{[\s\S]*\.ir-strip, \.no-print, \.ir-pick, \.ir-signbtns/.test(css));
});

test('SHO دستخط — قانونی تنبیہ اور تصدیق کے بغیر نہیں لگتا', () => {
  assert.ok(/463 تا 471/.test(J));
  assert.ok(/function _irPadApply[\s\S]{0,700}ir-pad-ok[\s\S]{0,200}checked/.test(J));
  assert.ok(/function _irSignFile[\s\S]{0,400}_irSignWarnOk\(\)/.test(J));
});

test('مرکزی تلاش میں واقعاتی رپورٹس', () => {
  const s = read('search.js');
  assert.ok(/from\('incident_reports'\)[\s\S]{0,80}\.eq\('officer_id', oid\)/.test(s), 'صرف اپنی رپورٹس');
  assert.ok(/openIncidentReport\(/.test(s) && /function openIncidentReport/.test(J));
  assert.ok(/_srIncidents\(q/.test(s), 'آف لائن/مقامی بھی');
});

test('محفوظ کرنا: سبسکرپشن guard، آف لائن قطار، schema نہیں بدلا', () => {
  assert.ok(/async function _irSave[\s\S]{0,300}DIO\.sub\.guard/.test(J));
  assert.ok(/_pending: true/.test(J) && /function _irSyncPending/.test(J));
  assert.ok(!/alter table|create table/i.test(J));
});

test('SYSTEM RULE: موبائل/ٹیبلٹ کے قاعدے کاغذ پر نہیں (A4 = 794px، Legal = 816px)', () => {
  // پرنٹ کے وقت براؤزر @media (max-width) کو کاغذ کی چوڑائی پر جانچتا ہے — 900px والا
  // «table{display:block}» ہر جدول کو سکیڑ دیتا تھا (واقعاتی رپورٹ کا دوسرا کالم تنگ)۔
  const bad = [];
  for (const f of ['index.html', 'theme-pro.css', 'ui-home.css', 'mobile.css']) {
    const re = /@media([^{]*max-width:\s*(\d+)px[^{]*)\{/g; let m;
    const s = read(f);
    while ((m = re.exec(s))) {
      if (+m[2] >= 794 && !/screen/.test(m[1]) && !/print/.test(m[1])) bad.push(f + ': @media' + m[1].trim());
    }
  }
  assert.deepStrictEqual(bad, [], 'چوڑے @media قاعدے صرف screen پر');
});

test('واقعاتی رپورٹ: پہلا کالم سب سے لمبے لیبل جتنا، دوسرا بائیں حاشیے تک', () => {
  assert.ok(/#ir-doc \.ir-c1\{ width:var\(--ir-c1, 2\.6in\); \}/.test(J));
  assert.ok(/function _irFitLabels[\s\S]{0,400}\.ir-table th \.ir-lbl[\s\S]{0,200}--ir-c1/.test(J));
  assert.ok(/<th scope="row"><span class="ir-lbl">/.test(J));
  assert.ok(/#ir-doc \.ir-table\{ width:100%;/.test(J), 'جدول پوری چوڑائی');
  assert.ok(/function _irBalance[\s\S]{0,800}_irFitLabels\(doc\)/.test(J));
  assert.ok(/const pz = h > availH \?/.test(J), 'صرف اصل overflow پر چھوٹا');
});

test('واقعاتی رپورٹ: جدول کے نیچے والی سطر جدول کے درمیان؛ SHO کا خانہ اپنی جگہ', () => {
  assert.ok(/<div class="ir-closing-row">\$\{F\('closing', 'ir-closing'\)\}<\/div>/.test(J));
  assert.ok(/#ir-doc \.ir-closing-row\{ margin-top:0\.2in; text-align:center; \}/.test(J));
  const end = J.slice(J.indexOf('<div class="ir-end">'), J.indexOf('</div></div>', J.indexOf('<div class="ir-end">')));
  assert.ok(!/data-k="closing"|F\('closing'/.test(end) && /F\('sho_line', 'ir-sholine'\)/.test(end));
});

test('محفوظ رپورٹس: پرنٹ / ترمیم / شیئر / کاپی / نام بدلیں / حذف — رپورٹ کے سامنے', () => {
  const order = [['_irPrintRow', 'print', 'پرنٹ'], ['_irOpen', 'edit', 'ترمیم'], ['_irShareRow', 'share', 'شیئر'],
    ['_irCopyRow', 'copy', 'کاپی'], ['_irRename', 'tag', 'نام بدلیں'], ['_irDelete', 'del', 'حذف']];
  const acts = J.slice(J.indexOf('<div class="ir-acts"'), J.indexOf('</div>', J.indexOf('<div class="ir-acts"')));
  let last = -1;
  for (const [fn, ico, t] of order) {
    const i = acts.indexOf(`\${A('${fn}', '${ico}', '${t}'`);
    assert.ok(i > last, 'ترتیب/بٹن: ' + t); last = i;
  }
  assert.ok(/\.ir-card\{ display:grid; grid-template-columns:auto minmax\(0,1fr\) auto;/.test(J), 'بٹن تفصیل کے سامنے (ایک قطار)');
  assert.ok(/async function _irRename[\s\S]{0,300}DIO\.sub\.guard/.test(J));
  assert.ok(/name: String\(_irMeta\.name \|\| ''\)\.trim\(\)/.test(J), 'ترمیم پر نام برقرار');
});

test('کاپی = رپورٹ clipboard پر (نئی رپورٹ نہیں بنتی)', () => {
  const fn = J.slice(J.indexOf('async function _irCopyRow'), J.indexOf('window._irCopyRow'));
  assert.ok(/_irCopyText\(_irReportHTML\(f, meta\), _irTextReport\(f, meta\)\)/.test(fn));
  assert.ok(!/_irPush|_irWriteRow|insert/.test(fn), 'ڈیٹابیس میں کچھ نہیں لکھتا');
  assert.ok(/'text\/html': new Blob/.test(J) && /'text\/plain': new Blob/.test(J));
  assert.ok(!/function _irCopy\(/.test(J), 'پرانا «نقل بناؤ» ختم');
});

test('فہرست سے سیدھا پرنٹ — وہی _irPrint (Ctrl+P والا راستہ)، فہرست جوں کی توں', () => {
  const fn = J.slice(J.indexOf('function _irPrintRow'), J.indexOf('window._irPrintRow'));
  assert.ok(/classList\.add\('ir-quick'\)/.test(fn) && /_irPrint\(\);/.test(fn) && /'afterprint'/.test(fn));
  assert.ok(!/_irClose\(|_irRenderList\(/.test(fn), 'فہرست دوبارہ نہیں بنتی');
  assert.ok(/@media screen\{ #ir-view\.ir-quick\{ opacity:0; pointer-events:none; \} \}/.test(J));
});

test('فہرست فوراً (cache سے) — سرور کا انتظار نہیں', () => {
  const fn = J.slice(J.indexOf('async function renderIncident'), J.indexOf('window.renderIncident'));
  assert.ok(/const cached = _irLocal\(\);[\s\S]{0,200}_irRenderList\(container\);[\s\S]{0,40}_irLoadList\(\)\.then/.test(fn));
});

test('کارڈ پر: تاریخ/وقت، اطلاع دہندہ، متاثرہ، تھانہ — اور تلاش میں بھی', () => {
  assert.ok(/<b>اطلاع دہندہ:<\/b>/.test(J) && /\$\{_irE\(d\.person_type \|\| 'متاثرہ'\)\}:<\/b>/.test(J) && /<b>تھانہ:<\/b>/.test(J));
  assert.ok(/_irPlain\(f\.victim\), d\.person_name, _irListThana\(r\)/.test(J));
});

test('نوعیت: ASI کی ترتیب، پھر زیادہ وقوعہ والی اوپر؛ «دیگر» آخر', () => {
  const m = J.match(/const IR_NATURES = \[([\s\S]*?)\];/);
  const list = m[1].match(/'([^']+)'/g).map(x => x.slice(1, -1));
  assert.deepStrictEqual(list.slice(0, 10), ['جنسی زیادتی', 'قتل', 'نقب زنی', 'راہزنی', 'روڈ ایکسیڈنٹ', 'ڈکیتی', 'لاوارث نعش', 'خودکشی', 'آگ لگنا', 'ہوائی فائرنگ']);
  assert.strictEqual(list[list.length - 1], 'دیگر');
  assert.ok(/\.sort\(\(a, b\) => \(\(cnt\[b\] \|\| 0\) - \(cnt\[a\] \|\| 0\)\) \|\| \(idx\(a\) - idx\(b\)\)/.test(J));
  assert.ok(/_irNatureOptions\(\)\.map/.test(J));
});
