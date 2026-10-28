// ════════════════════════════════════════════════════════════════
//  DIGITAL IO — v562: ترتیبات کا sync (dio-sync.js) — اصل فائل، جعلی براؤزر میں
//  (اصل ایپ میں دو آلات کی جانچ: tests/real-app/v561_test.py — B2)
// ════════════════════════════════════════════════════════════════
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'dio-sync.js'), 'utf8');

// براؤزر کے Storage جیسا: setItem prototype پر (dio-sync اسی کو لپیٹتا ہے)
function makeStorage() {
  class Storage {
    constructor() { Object.defineProperty(this, '_m', { value: new Map() }); }
    get length() { return this._m.size; }
    key(i) { return Array.from(this._m.keys())[i] ?? null; }
    getItem(k) { return this._m.has(String(k)) ? this._m.get(String(k)) : null; }
    setItem(k, v) { this._m.set(String(k), String(v)); }
    removeItem(k) { this._m.delete(String(k)); }
  }
  return new Storage();
}

function load(officerId) {
  const ls = makeStorage();
  const el = () => ({ style: {}, appendChild() {}, addEventListener() {}, setAttribute() {}, querySelector() { return null; } });
  const doc = { readyState: 'loading', addEventListener() {}, createElement: el, getElementById: () => null, head: el(), documentElement: el(), activeElement: null };
  const win = { localStorage: ls, addEventListener() {}, dispatchEvent() {} };
  const ctx = {
    window: win, document: doc, navigator: { onLine: false, userAgent: 'node' }, localStorage: ls,
    setTimeout: () => 0, clearTimeout() {}, setInterval: () => 0, clearInterval() {}, console,
    CustomEvent: function () {}, currentOfficer: officerId ? { id: officerId } : null,
  };
  win.window = win;
  vm.createContext(ctx);
  vm.runInContext(SRC, ctx);
  return { DS: ctx.window.DIOSync, ls, ctx };
}
const outbox = (ls) => JSON.parse(ls.getItem('dio_ud_outbox') || '{}');

test('ترتیبات: کون سی چابیاں sync ہوتی ہیں — اور خفیہ / آلے کی اپنی کبھی نہیں', () => {
  const { DS } = load('o1');
  for (const k of ['digital_io_sho', 'digital_io_dsp', 'digital_io_sho_sign', 'digital_io_sarkari_gari', 'dio_ch173_medical_officer',
    'dio_wit_status_custom', 'dio_ch173_paper', 'dio_saza_paper', 'dio_dk_paper', 'dio_ch173_papers', 'dio_ch173_papers_challan',
    'dio_akhraj_col2_ikhraj', 'dio_acc_opts_qaum', 'dio_zimni_types_o1', 'suggest_thana']) assert.ok(DS.isSettingKey(k), 'sync ہونی چاہیے: ' + k);
  for (const k of ['dio_pin', 'digital_io_pin_hash', 'dio_pw_verifier', 'dio_biometric_cred', 'dio_biometric_email', 'dio_license',
    'sb-x-auth-token', 'dio_theme', 'dio_font_size', 'dio_challan_view', 'dio_doc_view', 'dio_zimni_681', 'dio_zimni_draft_681',
    'dio_ud_outbox', 'dio_setting_at', 'suggest_', 'dio_acc_opts_', 'dio_officer_cache', 'dio_sub_cache'])
    assert.ok(!DS.isSettingKey(k), 'کبھی sync نہیں: ' + k);
});

test('ترتیبات: آلے پر لکھتے ہی (کسی بھی ماڈیول سے) سرور کی قطار میں — خفیہ / رنگ نہیں، ہٹانا نہیں', () => {
  const { ls } = load('o1');
  ls.setItem('digital_io_sarkari_gari', JSON.stringify({ vehicle_number: 'MNA-1234' }));
  ls.setItem('suggest_thana', JSON.stringify(['تھانہ صدر']));
  ls.setItem('dio_theme', 'dark');
  ls.setItem('dio_pin', '1234');
  const ob = outbox(ls);
  assert.deepStrictEqual(Object.keys(ob).sort(), ['setting|digital_io_sarkari_gari', 'setting|suggest_thana']);
  assert.strictEqual(ob['setting|suggest_thana'].oid, 'o1', 'قطار پر افسر کی شناخت');
  assert.strictEqual(JSON.parse(ob['setting|digital_io_sarkari_gari'].data.value).vehicle_number, 'MNA-1234');
  ls.removeItem('digital_io_sarkari_gari');   // لاگ آؤٹ کی صفائی جیسا — دوسرے آلات سے نہیں مٹنا چاہیے
  assert.strictEqual(outbox(ls)['setting|digital_io_sarkari_gari'].data.value.includes('MNA-1234'), true, 'ہٹانا سرور تک نہیں');
});

test('پہلی بار ملاپ: فہرستیں / اقسام ملیں (کچھ نہ کھوئے)؛ سادہ قدر میں سرور والی', () => {
  const { DS } = load('o1');
  assert.deepStrictEqual(JSON.parse(DS.mergeSetting('["مقامی"]', '["سرور","مقامی"]')), ['سرور', 'مقامی']);
  assert.deepStrictEqual(JSON.parse(DS.mergeSetting('["الف","ب"]', '["ج"]')), ['ج', 'الف', 'ب']);
  assert.deepStrictEqual(JSON.parse(DS.mergeSetting('{"main":["میری"],"sub":{"x":["1"]}}', '{"main":["سرور"],"sub":{"x":["2"],"y":["3"]}}')),
    { main: ['سرور', 'میری'], sub: { x: ['2', '1'], y: ['3'] } });
  assert.strictEqual(DS.mergeSetting('{"name":"پرانا","rank":"SI/SHO"}', '{"name":"نیا","rank":"I/SHO"}'), '{"name":"نیا","rank":"I/SHO"}');
  assert.strictEqual(DS.mergeSetting('data:image/png;base64,AAA', 'data:image/png;base64,BBB'), 'data:image/png;base64,BBB');
});

test('ایک آلہ دو افسر: پہلے افسر کی بچی ترتیبات «اپنی نہیں»، اُس کی قطار نئے افسر کو نہ روکے', () => {
  const ls0 = makeStorage();
  ls0.setItem('dio_setting_at', JSON.stringify({ _oid: 'o2' }));
  const { DS, ls } = (() => { const r = load('o1'); for (const [k, v] of ls0._m) r.ls._m.set(k, v); return r; })();
  ls._m.set('suggest_other', '["دوسرے کی تجویز"]');
  ls._m.set('dio_ud_outbox', JSON.stringify({ 'setting|digital_io_dsp': { kind: 'setting', case_id: 'setting', at: 't', oid: 'o2', data: { value: '{"name":"X"}', saved_at: 't' } } }));
  // سرور سے اس افسر کی DSP آئی — دوسرے افسر کی قطار کے باوجود لگے
  const ch = DS.ud.applyRow({ kind: 'setting', doc_key: 'setting|digital_io_dsp', data: { value: '{"name":"رانا عمران","rank":"SDPO"}', saved_at: '2026-10-28T00:00:00Z' } });
  assert.strictEqual(ch, true);
  assert.strictEqual(JSON.parse(ls.getItem('digital_io_dsp')).name, 'رانا عمران');
  const at = JSON.parse(ls.getItem('dio_setting_at'));
  assert.strictEqual(at._oid, 'o1', 'نقشہ نئے افسر کا');
  assert.strictEqual(at.suggest_other, '0', 'پہلے افسر کی بچی تجویز «اپنی نہیں» — سرور پر نہیں جائے گی');
});
