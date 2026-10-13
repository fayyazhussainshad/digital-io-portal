// ════════════════════════════════════════════════════════════════
//  DIGITAL IO — «نیا اندراج» (اکتوبر 2026) کے قواعد کی جانچ
//  Chalayein:  npm test      (node --test, koi bahri library nahi)
// ════════════════════════════════════════════════════════════════
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');

function load(phone) {
  const noop = () => {};
  const el = () => ({ appendChild: noop, setAttribute: noop, style: {}, textContent: '' });
  const ctx = {
    console, Math, JSON, String, Number, Array, Object, Date, Promise, RegExp, Error, Event: function () {},
    setTimeout, clearTimeout,
    document: { getElementById: () => null, createElement: el, head: el(), documentElement: el(), addEventListener: noop, querySelector: () => null },
    navigator: { onLine: true },
    matchMedia: () => ({ matches: !!phone, addEventListener: noop }),
  };
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(read('dio-card.js'), ctx);
  vm.runInContext(read('dio-prev.js'), ctx);
  return ctx;
}

test('شناختی کارڈ / موبائل / تاریخ — ایک ہی format', () => {
  const D = load().DIOCard;
  assert.strictEqual(D.fmtCnic('3630212345671'), '36302-1234567-1');
  assert.strictEqual(D.fmtCnic('36302-1234567-1'), '36302-1234567-1');
  assert.strictEqual(D.fmtMob('03001234567'), '0300-1234567');
  assert.strictEqual(D.fmtDate('11102026'), '11/10/2026');
  assert.strictEqual(D.dmyToIso('11/10/2026'), '2026-10-11');
  assert.strictEqual(D.dmyToIso('31/02/2026'), '', 'غلط تاریخ قبول نہ ہو');
  assert.strictEqual(D.isoToDmy('2026-10-11'), '11/10/2026');
  assert.strictEqual(D.isoToDmy('09-10-2026'), '09/10/2026', 'پرانی DD-MM-YYYY بھی');
});

test('نام و پتہ: desktop کی ایک سطر ↔ mobile کی چار سطریں', () => {
  const D = load().DIOCard;
  const line = 'محمد اکرم ولد محمد شفیع قوم ناہلیہ سکنہ بستی دھپ سڑی موضع سید پور تحصیل شجاع آباد ضلع ملتان';
  const p = D.splitName(line);
  assert.strictEqual(p.n, 'محمد اکرم');
  assert.strictEqual(p.w, 'محمد شفیع');
  assert.strictEqual(p.q, 'ناہلیہ');
  assert.strictEqual(p.p, 'بستی دھپ سڑی موضع سید پور تحصیل شجاع آباد ضلع ملتان');
  assert.strictEqual(D.joinName(p), line, 'واپس جوڑنے پر بالکل وہی سطر');
  assert.strictEqual(D.coreName(line), 'محمد اکرم');
  assert.strictEqual(D.splitName('صرف نام').n, 'صرف نام', 'پرانا ڈیٹا (بغیر ولد) پورا نام میں');
});

test('سابقہ ریکارڈ: کاپی کیا ہوا متن چسپاں کرنے پر خانے بھر جائیں', () => {
  const P = load().DIOPrev;
  const r = { fir: '211/2024', date: '14/05/2024', jurm: '379 ت پ', thana: 'ممتاز آباد', zila: 'ملتان', haisiyat: 'ملزم', faisla: 'سزا' };
  const back = P.parse(P.toText(r));
  for (const k of Object.keys(r)) assert.strictEqual(back[k], r[k], k);
});

test('«نیا اندراج» کارڈ: عنوان، mic صرف desktop', () => {
  const D = load(false).DIOCard;
  assert.strictEqual(D.title('ملزم', false), 'نیا اندراج — ملزم');
  assert.strictEqual(D.title('گواہ', true), 'ترمیم — گواہ');
  assert.ok(/dio-mic/.test(D.footer('x()')), 'desktop پر mic');
  assert.ok(!/dio-mic/.test(load(true).DIOCard.footer('x()')), 'mobile پر mic نہیں');
});

test('ہر خانے کا نام خانے کے کنارے پر (اوپر الگ سطر نہیں)', () => {
  const D = load().DIOCard;
  const h = D.fld({ id: 'a', label: 'شناختی کارڈ', type: 'cnic' });
  assert.ok(/class="dio-l"/.test(h) && /placeholder="00000-0000000-0"/.test(h) && /data-fmt="cnic"/.test(h));
  assert.ok(/position:absolute;top:-0\.8em/.test(read('dio-card.js')));
  assert.ok(/font-size:14pt/.test(read('dio-card.js')), 'اندراج کا font 14pt');
});

test('پرانے ہر-خانے والے mic بٹن ختم، اور غلط placeholders نہیں', () => {
  for (const f of ['case-form.js', 'incident.js']) {
    assert.ok(!/voiceType\(|_incVoice\(/.test(read(f)), f + ' میں الگ mic باقی ہے');
  }
  assert.ok(!/XXXXX-XXXXXXX-X|0XXX-XXXXXXX/.test(read('case-form.js')));
});

test('کارڈ کا سائز اگلے کارڈ میں منتقل نہ ہو', () => {
  const a = read('app-core.js');
  assert.ok(/function openModal[\s\S]{0,300}_dioResetModalCard\(\)/.test(a));
  assert.ok(/function _dioResetModalCard[\s\S]{0,300}minHeight = ''/.test(a));
});
