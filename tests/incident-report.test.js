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
    'نوعیت جرم', 'تاریخ / وقت وقوعہ', 'تاریخ / وقت اطلاع کنٹرول روم', 'جائے وقوعہ',
    'درخواست / اطلاع دہندہ', 'متاثرہ کا نام', 'وجہ عناد / حادثہ', 'ملزم / ملزمان کے نام / تعداد',
    'حلیہ جات ملزمان', 'وہیکل / قسم / رنگ', 'ریسپانڈنگ آفیسر', 'تعداد گرفتار ملزمان']);
  assert.ok(/<th scope="row">تفصیل<\/th>/.test(J), 'تفصیل کی سطر');
  assert.ok(/'INCIDENT REPORT'/.test(J) && /واقعاتی رپورٹ مرتب ہو کر ارسال ہے۔/.test(J));
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
  assert.strictEqual(f.responder, 'ندیم، علی');
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
  assert.ok(/padding:1cm 1in 1cm 0\.4in/.test(css), 'سسٹم کا طے شدہ مارجن');
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
