/* v580 (افسر کا حکم 12 نومبر 2026):
   (7) موبائل / شناختی کارڈ جیسے ڈیش والے ہندسے الٹے (1234567-0300) — اب LTR خانے میں، صرف دکھانے کے لیے؛
   بیرونی ضمنی کے ساتھ لگی اندرونی ضمنی بھی justify؛ صفحہ 3، 5، 7 … پر اندرونی ضمنی کا فارم (سادہ کاغذ قانوناً منع)،
   بلاکس / سیریل قائم؛ بلاک سے بلاک کا فاصلہ تقریباً آدھا (≈10px)؛ نیچے کا حاشیہ 0.4cm */
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const Z = read('zimni.js');
const fn = (name) => {
  const i = Z.indexOf('function ' + name + '(');
  if (i < 0) return '';
  const j = Z.indexOf('\nwindow.' + name + ' = ', i);
  return Z.slice(i, j > i ? j : i + 30000);
};

test('v580 (7): ڈیش والے ہندسے — LTR خانہ (isolate، سطر نہیں ٹوٹتی)؛ فارم نمبر کی سطر اور پہلے سے LTR حصہ نہیں چھیڑا جاتا', () => {
  assert.ok(/^const ZF_LTRN_RE = \/\\\+\?\[0-9\\u06F0-\\u06F9\\u0660-\\u0669\]\+\(\?:\[-\\u2010-\\u2015\]\[0-9\\u06F0-\\u06F9\\u0660-\\u0669\]\+\)\+\/g;$/m.test(Z));
  const N = fn('_zfLtrNums');
  assert.ok(/closest\('\.dio-ltrn, \.ch173-ltr, bdi, script, style, \.zf-formno, \.zfa-formno'\)/.test(N), 'فارم نمبر 25—54(2) جوں کا توں');
  assert.ok(/sp\.className = 'dio-ltrn'; sp\.setAttribute\('dir', 'ltr'\);/.test(N));
  assert.ok(/if \(an === t\) skip\.add\(near\(ao\)\);/.test(N) && /sel\.setBaseAndExtent\(/.test(N), 'لکھا جا رہا ہندسہ نہیں چھیڑا جاتا، کرسر اپنی جگہ');
  const J = fn('_zfJustifyCSS');
  assert.ok(/#ch173-doc \.dio-ltrn\{ direction:ltr; unicode-bidi:isolate; white-space:nowrap; \}/.test(J));
  assert.ok(/#ch173-doc \.dio-ltrn\{ direction:ltr; unicode-bidi:isolate; white-space:nowrap; \}/.test(fn('_zimniFormCSS')));
});

test('v580 (7): محفوظ تحریر کبھی نہیں بدلتی — خانہ محفوظ / نقل سے پہلے کھلتا ہے؛ تلاش پورے متن میں', () => {
  const C = fn('_zimniCleanHTML');
  assert.ok(/\/zf-endrow\|zf-prerow\|dio-ltrn\/\.test\(s\)/.test(C) && /_zfLtrUnwrap\(t\.content\);/.test(C));
  assert.ok(/try \{ _zfLtrUnwrap\(doc\); \}/.test(fn('_zfrMatches')));
});

test('v580 (7): اسکرین (کھولتے وقت + لکھتے وقت رک کر) اور چھپائی — بیرونی ضمنی اور بیان 161 دونوں', () => {
  assert.strictEqual((Z.match(/ed\.addEventListener\('input', \(\) => _zfLtrSoon\(ed\)\);/g) || []).length, 2, '_zimniWatchEdits + _zaWatchEdits');
  assert.strictEqual((Z.match(/try \{ _zfLtrNums\(_zimniDoc\(\), true\); \}/g) || []).length, 2, 'دونوں editor');
  assert.ok(/inner = _zfLtrHTML\(inner\);/.test(fn('_zimniPrintHTML')), 'ضمنی کی چھپائی');
  assert.ok(/inner = _zfLtrHTML\(inner\);/.test(fn('_zaPrintHTML')), 'بیان 161 کی چھپائی');
  assert.ok(/setTimeout\(\(\) => \{ try \{ _zfLtrNums\(ed, true\); \}/.test(fn('_zfLtrSoon')));
});

test('v580: منسلک اندرونی شیٹ اور اکیلا بیان 161 — ایک ہی justify قاعدہ', () => {
  assert.ok(/\$\{_zfJustifyCSS\(\)\}/.test(fn('_zfAttFormCSS')));
  assert.ok(/\$\{_zfJustifyCSS\(\)\}/.test(fn('_zaFormCSS')));
  const J = fn('_zfJustifyCSS');
  assert.ok(/#ch173-doc \.zfa-body\{ font-kerning:none; \}/.test(J) && /#ch173-doc \.zfa-pgpre\{ display:block; text-align-last:justify; \}/.test(J));
});

test('v580: پوری بیرونی ضمنی justify — kerning صرف متن پر بند، Word کے لیے خانے میں صاف سیدھ، توڑ سے پہلے کی سطر بھی پوری', () => {
  const F = fn('_zimniFormCSS');
  assert.ok(/#ch173-doc \.zf-body\{ font-kerning:none; \}/.test(F));
  assert.ok(/#ch173-doc \.zf-body :where\(div:not\(\[class\]\), p:not\(\[class\]\)\)\{ text-align:inherit; text-align-last:inherit; \}/.test(F));
  assert.ok(/#ch173-doc table\.zf-tbl tbody tr\.zf-blk td\.zf-c-body\{ text-align:right; text-align-last:auto; \}/.test(F));
  assert.ok(/#ch173-doc \.zf-pgpre\{ display:block; text-align-last:justify; \}/.test(F) && /#ch173-doc \.zf-pgsp\{ white-space:normal; \}/.test(F));
  const P = fn('_zimniPaginate');
  assert.ok(/Wr\.className='zf-pgpre';/.test(P) && /g\.className='zf-pgsp';/.test(P));
  assert.ok(/justifyBefore\(brk, row\.querySelector\('td\.zf-c-body'\)\|\|bodyC\);/.test(P), 'صفحہ 2، 4، 6 … کے توڑ پر');
  assert.ok(/justifyBefore\(mk0, bodyTdO\);/.test(P), 'صفحہ 3، 5، 7 … کے توڑ پر');
});

test('v580: صفحے کا توڑ LTR خانے (یا کسی inline خانے) کے شروع پر ہو تو خانے سے پہلے — خانہ نہیں بٹتا، پچھلی سطر کی خالی جگہ نہیں لٹکتی', () => {
  const P = fn('_zimniPaginate');
  assert.ok(/var node=cut\(sp\);\n[\s\S]{0,400}var isFirst=function\(n\)\{/.test(P));
  assert.ok(/&& !flowBlock\(node\.parentNode\) && isFirst\(node\)\) node=node\.parentNode;/.test(P));
  assert.ok(/if\(c\.nodeType===1\)\{ var x=tail\(c\); if\(x\) return x; \}/.test(P), 'خالی خانہ چھوڑ کر آخری متن');
  const B = fn('_zaBinder');
  assert.ok(/let node = fl \|\| cut\(sp\);/.test(B) && /&& inl\(node\.parentNode\) && first\(node\)\) node = node\.parentNode;/.test(B), 'بیان 161 بھی');
  assert.ok(/if \(c\.nodeType === 1\) \{ const x = tail\(c\); if \(x\) return x; \}/.test(fn('_zaJustifyBeforeBreak')));
});

test('v580: بلاک سے بلاک کا فاصلہ ≈10px (پہلے 16px padding) ؛ نیچے کا حاشیہ 0.4cm', () => {
  const F = fn('_zimniFormCSS');
  assert.ok(/#ch173-doc table\.zf-tbl tbody tr\.zf-blk \+ tr\.zf-blk td\{ padding-top:5px; \}/.test(F));
  assert.ok(!/tr\.zf-blk \+ tr\.zf-blk td\{ padding-top:16px; \}/.test(F));
  assert.ok(/^const ZF_PAGE_BOT_CM = 0\.4;$/m.test(Z));
});

test('v580: صفحہ 3، 5، 7 … — اندرونی ضمنی (25—54(2)) کا سرنامہ، وہی جدول (بلاکس / سیریل) جاری؛ صفحہ 2، 4 … پہلے جیسے', () => {
  const P = fn('_zimniPaginate');
  assert.ok(/var AHEAD=\(opt && opt\.ahead\) \|\| '';/.test(P));
  assert.ok(/var odd=!!AHEAD && pNo>=3 && pNo%2===1;/.test(P));
  assert.ok(/tr\.className='zf-ahead';/.test(P) && /td\.setAttribute\('colspan', String\(Math\.max\(1, colsOf\(like\)\)\)\); td\.innerHTML=AHEAD;/.test(P));
  assert.ok(/\['fir','fdate','jurm','jurm_suf','thana'\]\.forEach/.test(P), 'مقدمہ نمبر / مورخہ / جرم / تھانہ اسی ضمنی سے');
  assert.ok(/B\.className='zf-blk zf-cont';/.test(P) && /rowsB\.splice\(ri\+1, 0, Bc\);/.test(P), 'ٹوٹا اندراج دو حصوں میں، جاری حصہ بھی جانچا جاتا ہے');
  assert.ok(/H\.style\.breakBefore='page';/.test(P) && /Hc\.style\.breakBefore='page';/.test(P));
  assert.ok(/&& !afterHead\(row\)\)\{/.test(P), 'سرنامے کے فوراً بعد والی قطار دوبارہ نہیں دھکیلی جاتی');
  // کئی بار چلنے پر ایک ہی نتیجہ (پرنٹ HTML میں binder اور load دونوں چلاتے ہیں)
  assert.ok(/if\(doc\.__zfOrig==null\) doc\.__zfOrig=doc\.innerHTML;\n\s+else if\(doc\.innerHTML!==doc\.__zfOrig\) doc\.innerHTML=doc\.__zfOrig;/.test(P));
  assert.ok(!/\bdocument\./.test(P), 'toString() سے چھپائی میں — خود کفیل');
  // پہلے سے بٹا ہوا کاغذ دوبارہ حساب میں آئے تو اپنی پچھلی تبدیلیاں پہلے واپس (سرنامے دُگنے نہیں، اندراج پھر ایک قطار)
  assert.ok(/if\(doc\.__zfOrig==null && doc\.querySelector\('tr\.zf-ahead, tr\.zf-cont, span\.zf-pgpre, span\.zf-pgsp'\)\)\{/.test(P));
  assert.ok(/doc\.querySelectorAll\('tr\.zf-cont'\)\)\.forEach\(function\(c\)\{/.test(P) && /if\(a && b\) mergeIn\(a, b\);/.test(P));
  const H = fn('_zimniAheadHTML');
  assert.ok(/_zfAttDefaultBody\(o \|\| \{\}, c \|\| \{\}\)/.test(H) && /querySelector\('\.zfa-head'\)/.test(H) && /querySelector\('\.zfa-meta'\)/.test(H));
  assert.ok(/window\.__ZA_HEAD=\$\{JSON\.stringify\(aHead\)\}/.test(fn('_zimniPrintHTML')));
  const F = fn('_zimniFormCSS');
  assert.ok(/tr\.zf-ahead td\{ height:auto !important; padding:0 0 4px !important; vertical-align:bottom;/.test(F));
});

test('v580: سروس ورکر کا نیا نسخہ؛ نسخوں کے نام', () => {
  const m = /const CACHE_NAME = 'digital-io-v(\d+)';/.exec(read('sw.js'));
  assert.ok(m && Number(m[1]) >= 580);
  assert.ok(/^const ZIMNI_VER = 'zimni v39 \(v580\)/m.test(Z));
  assert.ok(/^const ZIMNI_A_VER = 'zimni-androoni v27 — v580/m.test(Z));
});
