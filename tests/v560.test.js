// ════════════════════════════════════════════════════════════════
//  DIGITAL IO — v560 کے قواعد کی جانچ
//   • اردو فونٹ: صرف Jameel Noori Nastaleeq، اسی سائٹ پر (fonts/)، sw.js میں پہلے سے cache،
//     کوئی متبادل (Noto / CDN / local) نہیں
//   • فونٹ کا ہر سائز pt میں — px کہیں نہیں
//  Chalayein:  npm test      (node --test, koi bahri library nahi)
// ════════════════════════════════════════════════════════════════
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
// ایپ کی اپنی فائلیں (جڑ میں) — جانچ، vendor، sql، supabase کے بغیر
const APP = fs.readdirSync(ROOT).filter((f) => /\.(js|css|html)$/.test(f) && f !== 'eslint.config.mjs');

const FONT = 'fonts/jameel-noori-nastaleeq.woff2';
const FONT_SHA256 = '25baf71098bd6f026261aea17fa799a928798126565060927c90dde390287024';

test('v560 font: the self-hosted file exists and is the unmodified Jameel Noori 4.00', () => {
  const buf = fs.readFileSync(path.join(ROOT, FONT));
  assert.strictEqual(crypto.createHash('sha256').update(buf).digest('hex'), FONT_SHA256);
  assert.ok(fs.existsSync(path.join(ROOT, 'fonts/JAMEEL-NOORI-NOTICE.txt')), 'notice file next to the font');
});

test('v560 font: index.html declares only the self-hosted file, block, and preloads it', () => {
  const h = read('index.html');
  const face = /@font-face\s*\{[^}]*Jameel Noori Nastaleeq[^}]*\}/.exec(h);
  assert.ok(face, '@font-face for Jameel');
  assert.ok(/src:\s*url\('fonts\/jameel-noori-nastaleeq\.woff2'\) format\('woff2'\);/.test(face[0]));
  assert.ok(!/local\(/.test(face[0]), 'no local() — every device uses the same file');
  assert.ok(/font-display:\s*block/.test(face[0]));
  assert.ok(/<link rel="preload" href="fonts\/jameel-noori-nastaleeq\.woff2" as="font" type="font\/woff2" crossorigin>/.test(h));
});

test('v560 font: no fallback Urdu font, Google Fonts or CDN font anywhere in the app', () => {
  const bad = [];
  APP.forEach((f) => {
    if (f === 'sw.js' || f === 'system-forms.js') return;   // sw.js: purana tabsara; system-forms: alag jaanch neeche
    const s = read(f);
    if (/Noto Nastaliq|Noto\+Nastaliq/.test(s)) bad.push(f + ': Noto');
    if (/fonts\.googleapis\.com\/css2/.test(s)) bad.push(f + ': Google Fonts link');
    if (/(cdn\.jsdelivr\.net|unpkg\.com)\/(npm\/)?jameel-noori/.test(s)) bad.push(f + ': CDN Jameel');
    if (/local\('Jameel/.test(s)) bad.push(f + ': local() Jameel');
  });
  assert.deepStrictEqual(bad, []);
  assert.ok(!/Noto Nastaliq/.test(read('system-forms.js')), 'generated forms rebuilt without Noto');
});

test('v560 font: every font stack that names Jameel ends with Jameel (nothing after it)', () => {
  const bad = [];
  APP.forEach((f) => {
    const s = read(f).replace(/\\'/g, "'").replace(/&quot;/g, '"');
    const rx = /(?:font-family\s*:|--font-main\s*:|fontFamily\s*[:=]\s*['"])\s*([^;}\n]*Jameel Noori Nastaleeq[^;}\n]*)/g;
    let m;
    while ((m = rx.exec(s))) {
      const after = m[1].split(/Jameel Noori Nastaleeq['"]?/)[1] || '';
      if (/^\s*,/.test(after)) bad.push(f + ': ' + m[1].slice(0, 80));
    }
  });
  assert.deepStrictEqual(bad, []);
});

test('v560 font: print helper, form print, PDF and service worker use the self-hosted file', () => {
  assert.ok(/new URL\('fonts\/jameel-noori-nastaleeq\.woff2', document\.baseURI\)/.test(read('app-core.js')), 'dioFontUrl absolute');
  assert.ok(/base \+ "fonts\/jameel-noori-nastaleeq\.woff2'\)/.test(read('templates-forms.js')));
  const sh = read('dio-share.js');
  assert.ok(/'Jameel Noori Nastaleeq': 'fonts\/jameel-noori-nastaleeq\.woff2'/.test(sh), 'PDF embeds the same file');
  assert.ok(/throw new Error\('اردو فونٹ \(Jameel Noori Nastaleeq\) لوڈ نہیں ہو سکا/.test(sh), 'PDF never falls back to another font');
  assert.ok(/'\/fonts\/jameel-noori-nastaleeq\.woff2'/.test(read('sw.js')), 'precached for offline');
  const v = JSON.parse(read('vercel.json'));
  const fh = v.headers.find((h) => h.source === '/fonts/(.*)');
  assert.ok(fh && fh.headers.some((x) => x.key === 'Access-Control-Allow-Origin'), 'downloaded HTML files can load the font');
  // ہر پرنٹ HTML جو اپنا <head> بناتا ہے، فونٹ dioFontHead() سے لیتا ہے
  ['backup.js', 'darkhwastain.js', 'fivec.js', 'misal-docs.js', 'misal-fir.js', 'performance.js', 'rfa-form.js', 'report173.js', 'saza-slip.js', 'zimni.js']
    .forEach((f) => assert.ok(/dioFontHead\(\)/.test(read(f)), f + ' prints with the self-hosted font'));
});

test('v560 pt: no font size in px anywhere in the app (CSS, HTML, JS strings, generated forms)', () => {
  const bad = [];
  APP.forEach((f) => {
    const s = read(f);
    const rxs = [
      /font-size\s*:\s*[\d.]+px/g,                       // CSS / inline style
      /font\s*:\s*[^;"'}\n]*?\b[\d.]+px(?:\/[\d.]+)?\s+[^;"'}\n]*/g,  // font shorthand
      /fontSize\s*[:=]\s*['"`][\d.]+px/g,                  // JS
      /font-size:\s*\$\{[^}]*'[\d.]+px'/g,                 // template with px literal
      /font-size=\\?"[\d.]+(?:px)?\\?"/g,                 // SVG attribute (unitless = px)
    ];
    rxs.forEach((rx) => { const m = s.match(rx); if (m) bad.push(f + ': ' + m.slice(0, 3).join(' | ')); });
  });
  assert.deepStrictEqual(bad, []);
});

test('v560 pt: runtime copies of computed sizes are written back in pt', () => {
  assert.ok(/decl\.push\(p \+ ':' \+ \(p === 'font-size' \? ptOf\(v\) : v\)\)/.test(read('dio-forms.js')), 'form capture (Word, templates)');
  const sh = read('dio-share.js');
  assert.ok(/font-size:' \+ \(parseFloat\(cs\.fontSize\) \* 0\.75\) \+ 'pt'/.test(sh), 'PDF rotated text');
  assert.ok(/k === 'font-size' && \/px\$\/\.test\(v\)/.test(sh), 'PDF page body');
  assert.ok(/probe\.style\.fontSize\s+= \(parseFloat\(cs\.fontSize\) \* 0\.75\) \+ 'pt'/.test(read('report173.js')));
  assert.ok(/el\.style\.fontSize = fs \+ 'pt'/.test(read('misal-templates.js')) && !/fs \+ unit/.test(read('misal-templates.js')));
  assert.ok(/medium: '12pt'/.test(read('app-core.js')), 'root size 12pt (= 16px)');
});
