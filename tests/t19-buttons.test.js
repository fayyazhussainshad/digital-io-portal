/* TASK 19 (افسر کی ہدایت، 11 نومبر 2026) — ایک ہی کام کا بٹن ہر جگہ ایک جیسا:
   وہی شکل، ناپ، نشان، رنگ اور نام۔ معیار = مقدمہ کی فہرست کے ایکشن بٹن۔ تمام نشانات ایک ہی سیٹ (dio-icons.js) سے۔ */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SET = require('../dio-icons.js');
const ICONS = SET.DIO_ICONS;

const FILES = fs.readdirSync(ROOT).filter((f) => /\.(js|html)$/.test(f) && !/^(eslint|sw|system-forms|zimni-templates|dio-icons)\./.test(f));
const BTN = /<button\b((?:[^>"'`]|"[^"]*"|'[^']*')*)>([\s\S]{0,3000}?)<\/button>/g;
function buttons() {
  const out = [];
  for (const f of FILES) {
    const s = read(f);
    let m;
    BTN.lastIndex = 0;
    while ((m = BTN.exec(s))) out.push({ f, line: s.slice(0, m.index).split('\n').length, attrs: m[1], inner: m[2] });
  }
  return out;
}
const ALL = buttons();

test('T19: ایک ہی سیٹ میں 21 مطلوبہ نشان + مقدمہ کی فہرست کے نشان جوں کے توں', () => {
  for (const k of ['copy', 'cut', 'paste', 'print', 'download', 'share', 'duplicate', 'edit', 'delete', 'save', 'view', 'close', 'add',
    'search', 'back', 'forward', 'home', 'upload', 'camera', 'location', 'mic', 'reminder']) assert.ok(ICONS[k], 'نشان: ' + k);
  // معیار — مقدمہ کی فہرست کی اصل ڈرائنگ
  assert.strictEqual(ICONS.print, '<path d="M7 8V3.5h10V8"/><path d="M6 17.5H4.5V10a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7.5H18"/><path d="M7 14h10v6.5H7z"/>');
  assert.strictEqual(ICONS.share, '<path d="M12 15V3.5"/><path d="M7.5 8L12 3.5 16.5 8"/><path d="M4.5 13.5V20h15v-6.5"/>');
  assert.strictEqual(ICONS.delete, '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/>');
  // «واپس» = v570 ٹیبوں والا تیر (دائیں رُخ)، «آگے» = بائیں رُخ
  assert.strictEqual(ICONS.back, '<path d="M14 6l6 6-6 6"/><path d="M20 12H4"/>');
  assert.strictEqual(ICONS.forward, '<path d="M10 6l-6 6 6 6"/><path d="M4 12h16"/>');
  // ہر نشان کی اپنی ڈرائنگ (دو کام ایک نشان پر نہیں)
  const seen = {};
  for (const [k, v] of Object.entries(ICONS)) {
    if (['dropdown', 'down', 'rotate-left', 'restore'].includes(k)) continue;   // ▾ = نیچے، ⟲ = بحال: ایک ہی معنی
    assert.ok(!seen[v], k + ' اور ' + seen[v] + ' کی ایک ہی ڈرائنگ');
    seen[v] = k;
  }
});

test('T19: کوڈ میں ہر استعمال شدہ نشان سیٹ میں موجود ہو', () => {
  const bad = [];
  for (const f of FILES.concat(['dio-ui.css'])) {
    const s = read(f);
    for (const m of s.matchAll(/data-ico=\\?["']([\w-]+)\\?["']/g)) if (!ICONS[m[1]]) bad.push(f + ': ' + m[1]);
    for (const m of s.matchAll(/\b(?:dioIco|_irIco|ICO)\(\s*'([\w-]+)'/g)) if (!ICONS[m[1]]) bad.push(f + ': ' + m[1]);
    for (const m of s.matchAll(/\bdio(?:Btn|ActBtn)\(\s*'([\w-]+)'/g)) if (!ICONS[m[1]]) bad.push(f + ': ' + m[1]);
  }
  assert.deepStrictEqual(bad, []);
});

test('T19: کسی بٹن میں ایموجی / تیر / ✕ کا حرف نہیں — نشان صرف سیٹ سے (Windows اور Android پر ایک جیسا)', () => {
  const EMO = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}←→↑↓⬅➡⬆⬇✕✖×▾▼▲⋯↶↷↩↪⤓⇤⇥⇔⇅⇋⟲⟳]/u;
  const bad = ALL.filter((b) => EMO.test(b.inner.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]*>/g, ''))).map((b) => b.f + ':' + b.line);
  assert.deepStrictEqual(bad, []);
});

test('T19: بٹن کے اندر الگ SVG ڈرائنگ نہیں (صرف ڈیش بورڈ کی ٹائلیں اور لاگ اِن کا طریقہ — یہ ایکشن بٹن نہیں)', () => {
  const bad = ALL.filter((b) => /<svg/.test(b.inner) && !/dio-stat|dio-tile|login-method/.test(b.attrs)).map((b) => b.f + ':' + b.line);
  assert.deepStrictEqual(bad, []);
});

test('T19: ایک کام = ایک لفظ — پرنٹ / شیئر / ڈاؤن لوڈ … کے بٹن اور اشارے میں انگریزی یا دوسرا روپ نہیں', () => {
  const NO = /(^|[^\w])(Print|Paste|Cut|Copy|Undo|Redo|Find|Bold|Italic|Underline|Share|Download|Delete|Save|Cancel|Close|Edit|View)([^\w]|$)|پرنٹ کریں|چھپائی(?!ں)|چھاپیں|ڈاؤنلوڈ|شیئر کریں|کاپی کریں|محفوظ دستخط/;
  const bad = [];
  for (const b of ALL) {
    const t = ((b.attrs.match(/\btitle=\\?["']([^"']*)/) || [])[1] || '') + ' | ' + b.inner.replace(/<[^>]*>/g, ' ');
    if (/data-act=/.test(b.attrs) && NO.test(t)) bad.push(b.f + ':' + b.line + ' ' + t.slice(0, 60));
  }
  assert.deepStrictEqual(bad, []);
  // ہر ایکشن کا اشارہ اسی کام کا معیاری لفظ رکھے
  const STD = SET.DIO_ACT_LABEL;
  const wrong = [];
  for (const b of ALL) {
    const k = (b.attrs.match(/data-act=\\?["']([\w-]+)/) || [])[1];
    if (!k || !STD[k] || k === 'add') continue;
    const t = (b.attrs.match(/\btitle=\\?["']([^"']*)/) || [])[1];
    if (t == null || /\$\{|'\s*\+/.test(t)) continue;
    const ok = t.includes(STD[k]) || (k === 'back' && /فہرست|واپس/.test(t)) || (k === 'close' && /بند/.test(t)) || (k === 'edit' && t === 'ترمیم') || (k === 'view' && /دکھائیں/.test(t));
    if (!ok) wrong.push(b.f + ':' + b.line + ' ' + k + ' → ' + t);
  }
  assert.deepStrictEqual(wrong, []);
});

test('T19: ایک ہی بٹن — dio-ui.css (pt میں، مقدمہ کی فہرست کا ناپ؛ موبائل پر 44px انگلی کے لیے)', () => {
  const css = read('dio-ui.css');
  assert.ok(/html \.dio-btn\.dio-btn \{[\s\S]*?height: 24pt !important;[\s\S]*?border-radius: 6pt !important;/.test(css), '24pt = 32px، گولائی 6pt = 8px');
  assert.ok(/\.dio-btn\.dio-btn \.dio-i \{ width: 11\.25pt !important; height: 11\.25pt !important;/.test(css), 'نشان 11.25pt = 15px');
  assert.ok(/max-width: 768px\)[\s\S]*?html \.dio-btn\.dio-btn \{ height: 33pt !important;/.test(css), 'موبائل 33pt = 44px');
  assert.ok(!/font-size:\s*[\d.]+px/.test(css), 'حروف کا ناپ px میں نہیں');
  assert.ok(/\.dio-btn--del:hover \{ background: var\(--dio-alert/.test(css), 'حذف: ماؤس لانے پر سرخ (مقدمہ کی فہرست کی طرح)');
  assert.ok(!/html \.dio-btn\.dio-btn \{[^}]*display: inline-flex !important/.test(css), 'display پر !important نہیں — کوڈ کا style="display:none" چلتا رہے');
});

test('T19: سیٹ سب سے پہلے لوڈ؛ service worker میں؛ نیا نسخہ', () => {
  const H = read('index.html');
  const i = H.indexOf('<script src="dio-icons.js"></script>');
  assert.ok(i > 0 && i < H.indexOf('</head>'), 'head میں');
  assert.ok(H.indexOf('<link rel="stylesheet" href="dio-ui.css">') > H.indexOf('<link rel="stylesheet" href="ui-home.css">'), 'بٹن کا CSS باقی سب کے بعد');
  for (const f of ['admin.html', 'install.html', 'offline.html']) assert.ok(read(f).includes('dio-icons.js') && read(f).includes('dio-ui.css'), f);
  const W = read('sw.js');
  assert.ok(/'\/dio-ui\.css'/.test(W) && /'\/dio-icons\.js'/.test(W), 'آف لائن cache');
  const m = /const CACHE_NAME = 'digital-io-v(\d+)';/.exec(W);
  assert.ok(m && +m[1] >= 576, 'CACHE_NAME نیا');
});

test('T19: فہرستوں کے ایکشن بٹن (dioActBtn) اسی مشترکہ بٹن سے؛ مقدمہ کی فہرست بھی', () => {
  assert.ok(/function dioActBtn\(kind, js, title\) \{\n  return dioBtn\(kind, 'event\.stopPropagation\(\);' \+ js/.test(read('app-core.js')));
  const C = read('cases.js');
  for (const k of ['open', 'edit', 'print', 'download', 'share', 'delete']) assert.ok(new RegExp('data-act="' + k + '"><i class="dio-i" data-ico="' + k + '"').test(C), 'مقدمہ کی فہرست: ' + k);
  assert.ok(!/<svg/.test(C.slice(C.indexOf('function renderCaseRow'), C.indexOf('async function openCasePrint'))), 'مقدمہ کی فہرست میں اپنی SVG نہیں');
});

test('T19: dioBtn کی HTML — دو صورتیں (صرف نشان / نشان + نام)، رنگ کے دو استثنا', () => {
  const a = SET.dioBtn('print', 'x()');
  assert.ok(/class="dio-btn dio-btn--i"/.test(a) && /title="پرنٹ"/.test(a) && /data-ico="print"/.test(a) && !/<span>/.test(a));
  const b = SET.dioBtn('save', 'y()', { label: 'محفوظ کریں', tone: 'pri', key: 'Ctrl+S' });
  assert.ok(/class="dio-btn dio-btn--pri"/.test(b) && /title="محفوظ کریں \(Ctrl\+S\)"/.test(b) && /<span>محفوظ کریں<\/span>/.test(b));
  assert.ok(/dio-btn--del/.test(SET.dioBtn('delete', 'z()')));
});

test('T19: بٹن کا نام بدلتے وقت نشان قائم (dioBtnText) — پرانا 💾 / انگریزی نام واپس نہیں آتا', () => {
  assert.strictEqual(typeof SET.dioBtnText, 'function');
  const span = { tagName: 'SPAN', textContent: 'محفوظ کریں' };
  const b = { children: [{ tagName: 'I' }, span], textContent: 'x' };
  SET.dioBtnText(b, 'محفوظ ہو رہا ہے…');
  assert.strictEqual(span.textContent, 'محفوظ ہو رہا ہے…', 'نام والا حصہ بدلا، نشان وہیں');
  const plain = { children: [], textContent: 'x', querySelector: () => null };
  SET.dioBtnText(plain, 'لاگ ان');
  assert.strictEqual(plain.textContent, 'لاگ ان', 'بغیر نشان والا بٹن — سادہ متن');
  for (const f of FILES.concat(['admin.html'])) {
    const s = read(f);
    assert.ok(!/\.(?:textContent|innerHTML)\s*=\s*'[^']*(?:💾|🖨|📤|🔐|➕|⏳)/.test(s), f + ': بٹن پر پرانا نشان واپس');
    assert.ok(!/Access Admin Panel|Create Officer Account|Verifying\.\.\.|Creating\.\.\./.test(s), f + ': انگریزی نام');
  }
  for (const [f, v] of [['ahkamat.js', 'btn'], ['law-library.js', 'btn'], ['templates.js', 'btn'], ['report173.js', '_saveBtn']]) {
    const s = read(f);
    assert.ok(!new RegExp(v.replace('$', '\\$') + "\\.textContent\\s*=\\s*'محفوظ").test(s), f + ': محفوظ بٹن کا نام textContent سے (نشان مٹ جاتا)');
    assert.ok(new RegExp('dioBtnText\\(' + v + ", 'محفوظ کریں'\\)").test(s), f + ': واپسی «محفوظ کریں» نشان سمیت');
  }
  // افسر کا فیصلہ (11 نومبر 2026): محفوظ ہونے کے بعد ضمنی اور بیان 161 پر «اپ ڈیٹ» (نشان وہی)
  const zj = read('zimni.js');
  assert.strictEqual((zj.match(/sb\.innerHTML = dioIco\('save'\) \+ '<span>اپ ڈیٹ<\/span>'; sb\.title = 'اپ ڈیٹ \(Ctrl\+S\)'/g) || []).length, 2, 'ضمنی اور بیان: محفوظ کے بعد «اپ ڈیٹ»');
  assert.ok(/id="zf-save-btn"[^>]*>[\s\S]{0,120}<span>\$\{z\.id \? 'اپ ڈیٹ' : 'محفوظ کریں'\}<\/span>/.test(zj), 'پرانی ضمنی کھلے تو «اپ ڈیٹ»');
});

test('T19: انتخاب کے خانوں کا «شامل کریں» — نشان + نام، گہرا نیلا (آخری تصدیقی بٹن)', () => {
  const oks = ALL.filter((b) => /id="(?:naq-acc-ok|ch173-acc-ok|ch173-pp-ok|saza-acc-ok)"/.test(b.attrs));
  assert.strictEqual(oks.length, 4, oks.map((b) => b.f + ':' + b.line).join(' '));
  for (const b of oks) {
    assert.ok(/dio-btn--pri/.test(b.attrs) && !/dio-btn--i/.test(b.attrs) && /title="شامل کریں"/.test(b.attrs), b.f + ':' + b.line);
    assert.ok(/data-ico="check"[\s\S]*<span>شامل کریں<\/span>/.test(b.inner), b.f + ':' + b.line);
  }
});

test('T19: مدد کی «ٹول بار کے بٹن» فہرست انہی نشانات / ناموں سے (پرانے ایموجی نہیں)', () => {
  const s = read('help-guide.js');
  const blk = s.slice(s.indexOf('const HG_TOOLS'), s.indexOf('function _hgToolsHtml'));
  assert.ok(!/[💾🖨📤✏🗑⧉📋🖌🧹🔎🚔🅣✂⬆⬇↶↷⟲⟳⇋⇅↖╱➜▭◯⤓📜↺▾]/u.test(blk), 'پرانا نشان باقی');
  const used = [...blk.matchAll(/\{i:([\w-]+)\}/g)].map((m) => m[1]);
  assert.ok(used.length >= 50, used.length);
  for (const k of used) assert.ok(ICONS[k], 'نشان سیٹ میں نہیں: ' + k);
  assert.ok(/function _hgIco\(s, forPrint\)/.test(s) && /_hgIco\(r\[0\], forPrint\)/.test(s), 'اسکرین پر نشان، پرنٹ / Word میں نام');
  assert.ok(!/'واپس \/ دوبارہ'/.test(blk), 'Undo = «کالعدم» (افسر کی منظوری)');
});
