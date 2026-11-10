"""(v572، TASK 9) اصل ایپ کی جانچ — نمبر شمار کا ایک قاعدہ + رپورٹ 173 کی سیدھ + «مختصر حالات» + جُڑے الفاظ

افسر کا حکم (4 نومبر 2026) اور جوابات (5 نومبر): پرانی دستاویز جوں کی توں (فہرست بدلنے پر قاعدہ) · کھڑا متن
نیچے سے، دائیں کنارے کے ساتھ (اسکرین = کاغذ) · «مختصر حالات» کا زائد متن پہلے کی طرح جدول کے نیچے · CSS کی اجازت۔

Desktop 1366×768 اور Mobile 390×844 (touch) — ہر ایک پر:
  A) نمبر شمار: ایک نام → «1» نہیں؛ دو → 1۔ 2۔؛ ایک مٹایا → نمبر غائب (زندہ) — چالان (مکمل، نامکمل، تتمہ، اخراج،
     عدم پتہ)، ضمنی «بنام»، درخواستیں، واقعاتی رپورٹ (+ «تعداد»)، CDR، نقشہ موقع، سزا سلپ، انڈیکس (بغیر نمبر، جوں کا توں)
     · Enter سے نئی سطر · پرانی محفوظ ضمنی کا «1۔» کھولنے پر جوں کا توں
  B) رپورٹ 173 کی سیدھ: ہر سرخی اپنے خانے کے اندر (کوئی لفظ نہیں ٹوٹتا) · اندرونی جگہ برابر (4px) · کھڑا متن نیچے سے،
     دائیں کنارے کے ساتھ — اسکرین اور کاغذ دونوں · کالموں کی چوڑائی اسکرین = کاغذ، موبائل = Desktop · CNIC 00000-0000000-0
     · اخراج: قطار 8 بھی 6px، کچھ نہیں کٹتا · «پرنٹ» بٹن = Ctrl+P
  C) «مختصر حالات»: 360 اور 1000 الفاظ — سطر صرف الفاظ کے بیچ ٹوٹتی ہے، ڈیش والا موبائل نمبر سیدھا (LTR)، کوئی لفظ
     ضائع نہیں، صفحہ 2 پر جاری، جدول کی لکیریں سلامت (لیگل + A4)
  D) جُڑے الفاظ: محفوظ → دوبارہ کھولو → 3 بار پرنٹ (لیگل/A4/لیگل) → دوبارہ محفوظ — ایک بھی فاصلہ گم نہیں؛ پرانے
     محفوظ چالان کی گمشدہ سرحدی جگہ بھی جُڑتی نہیں
چلانا: `python3 t9_test.py` (DIO_ONLY=desktop|mobile)
"""
from v564_common import *

V = OUT + '/t9/'
os.makedirs(V, exist_ok=True)
R = []


def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)


PEOPLE = """((n) => { const d = window.__db;
  d.case_accused = [
    { id:'a1', case_id:'c1', name:'محمد عرفان ولد محمد یوسف قوم آرائیں سکنہ بستی ملوک ملتان', cnic:'3630212345671', accused_type:'fir', created_at:'2026-10-08' },
    { id:'a2', case_id:'c1', name:'شاہد علی ولد غلام نبی قوم جٹ سکنہ چک 5 فیض ملتان', cnic:'3630276543211', accused_type:'fir', created_at:'2026-10-09' },
    { id:'a3', case_id:'c1', name:'عمران ولد بشیر احمد قوم بلوچ سکنہ شیر شاہ ملتان', cnic:'', accused_type:'fir', created_at:'2026-10-10' } ].slice(0, n);
  d.case_witnesses = [
    { id:'w1', case_id:'c1', full_name:'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض', cnic:'3630211111111', witness_type:'fir', created_at:'2026-10-01' },
    { id:'w2', case_id:'c1', full_name:'محمد ارشد ولد محمد صدیق قوم راجپوت سکنہ مظفر آباد ملتان', cnic:'3630222222222', witness_type:'fir', created_at:'2026-10-02' } ];
  return 0; })"""

HOOK_DP = """((paper) => { window.__dp = []; window.__dioPaperAuto = paper || 'keep';
  if (!window.__dpOrig) window.__dpOrig = window._dioDoPrint;
  window._dioDoPrint = function (h) { window.__dp.push(h); }; return 0; })"""
UNHOOK_DP = "(() => { if (window.__dpOrig) window._dioDoPrint = window.__dpOrig; window.__dioPaperAuto = undefined; return 0; })()"

WORDS = ((' '.join(PARA) + ' ') * 12).split()
BOILER = 'جناب عالیٰ! مختصر حالات مقدمہ اس طرح ہیں کہ جس پر مقدمہ عنوان بالا درج ہوا تفتیش مقدمہ عمل میں لائی گئی دورانِ تفتیش'.split()

TEXT = "(k) => { const e = document.querySelector('#ch173-doc [data-k=\"' + k + '\"]'); return e ? e.innerText.replace(/\\r/g, '').replace(/\\n+$/, '') : null; }"
BOTH = """() => { const g = k => { const e = document.querySelector('#ch173-doc [data-k="' + k + '"]'); return e ? e.textContent : ''; };
  return g('halaat') + '\\u2016' + g('cont_text'); }"""


def save(pg):
    """ضمنی کا «💾 محفوظ» (ضمنی کھلی رہتی ہے) — نتیجہ: محفوظ ہوئی؟"""
    pg.evaluate("window.__saveRes = undefined; _saveZimni(false, true).then(r => { window.__saveRes = r; }); 0")
    for _ in range(60):
        if pg.evaluate("window.__saveRes !== undefined"): break
        pg.wait_for_timeout(100)
    pg.wait_for_timeout(500)
    return pg.evaluate("window.__saveRes"), ''


def toks(s):
    return [t for t in re.split(r'[\s‖]+', s or '') if t]


def fused(s, words):
    voc = set(words) | set(BOILER)
    return [t for t in toks(s) if t not in voc]


def final_print(pg, fn, paper='legal'):
    pg.evaluate(HOOK_DP, paper)
    fn()
    for _ in range(150):
        if pg.evaluate("window.__dp.length"): break
        pg.wait_for_timeout(200)
    h = pg.evaluate("window.__dp[0] || ''")
    pg.evaluate(UNHOOK_DP)
    return h


def pick(pg, key, n):
    pg.evaluate("""([k]) => { document.querySelector('#ch173-table button.acc-pick[onclick*="' + k + '"]').click(); return 0; }""", [key])
    pg.wait_for_timeout(300)
    pg.evaluate("""(n) => { const box = document.getElementById('ch173-acc-menu'); [...box.querySelectorAll('input[type=checkbox]')].forEach((c, i) => c.checked = i < n);
        box.querySelector('#ch173-acc-ok').click(); return 0; }""", n)
    pg.wait_for_timeout(900)


def open_challan(pg, rtype='mukammal'):
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate(f"openReport173WithType('{rtype}')"); pg.wait_for_timeout(2800)
    try:   # موبائل: کاغذ کا منظر (فارم کارڈ الگ جانچے جاتے ہیں)
        pg.evaluate("document.querySelectorAll('#dio-chform [data-v=paper], .dio-mbar [data-m=paper]').forEach(b => b.click()); 0")
    except Exception:
        pass
    pg.wait_for_timeout(600)


def blur_click(pg):
    """افسر کہیں اور کلک کرے — کالم 7 کے خانے میں"""
    pg.evaluate("(() => { const h = document.querySelector('#ch173-doc [data-k=\"halaat\"]'); if (h) { h.focus(); } return 0; })()")
    pg.wait_for_timeout(900)


def type_in(pg, sel, txt):
    pg.evaluate("""([s, t]) => { const h = document.querySelector(s); h.focus(); const r = document.createRange(); r.selectNodeContents(h);
        r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, t); return 0; }""", [sel, txt])
    pg.wait_for_timeout(600)


# کاغذ (پرنٹ کا اصل HTML) کو چھپائی کے ناپ (801px، print media) پر کھول کر ناپو
MEASURE = """() => { const out = {}; const t = document.getElementById('ch173-table'); if (!t) return null; const tr = t.getBoundingClientRect();
  const R = (r) => ({x: r.left - tr.left, y: r.top - tr.top, w: r.width, h: r.height});
  out.cells = [...t.querySelectorAll('th,td')].map(c => { const cr = c.getBoundingClientRect(); const rg = document.createRange(); let u = null;
    const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { if (!n.nodeValue.trim()) continue; if (n.parentElement.closest('.no-print,.acc-pick,.akh-grip,.akh-hgrip,.colgrip')) continue;
      rg.selectNodeContents(n); for (const r of rg.getClientRects()) { if (r.width < .5 || r.height < .5) continue;
        u = u ? {l: Math.min(u.l, r.left), t: Math.min(u.t, r.top), r: Math.max(u.r, r.right), b: Math.max(u.b, r.bottom)} : {l: r.left, t: r.top, r: r.right, b: r.bottom}; } }
    return { tag: c.tagName, k: (c.querySelector('[data-k]') || {}).dataset ? (c.querySelector('[data-k]') || {dataset:{}}).dataset.k || '' : '', cell: R(cr),
             text: u ? {x: u.l - tr.left, y: u.t - tr.top, w: u.r - u.l, h: u.b - u.t} : null }; });
  out.table = {w: tr.width, h: tr.height, bottom: tr.bottom};
  // الفاظ جو دو سطروں میں بٹ گئے + ڈیش والے نمبر کا رخ
  const split = [], nums = [];
  for (const k of ['halaat', 'cont_text']) { const el = document.querySelector('[data-k="' + k + '"]'); if (!el) continue;
    const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; const r = document.createRange();
    while ((n = w.nextNode())) { const v = n.nodeValue; const re = /\\S+/g; let m;
      while ((m = re.exec(v))) { r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
        const tops = new Set([...r.getClientRects()].filter(x => x.width > 0.5).map(x => Math.round(x.top))); if (tops.size > 1) split.push(m[0]); }
      const re2 = /0300-1234567/g; let q;
      while ((q = re2.exec(v))) { const a = document.createRange(); a.setStart(n, q.index); a.setEnd(n, q.index + 4);
        const z = document.createRange(); z.setStart(n, q.index + 8); z.setEnd(n, q.index + 12);
        const ra = a.getClientRects()[0], rz = z.getClientRects()[0];
        nums.push(ra && rz && Math.round(ra.top) === Math.round(rz.top) ? (ra.left < rz.left ? 'ok' : 'REVERSED') : 'SPLIT'); } } }
  out.split = split; out.nums = nums;
  out.words = ['halaat', 'cont_text'].map(k => { const e = document.querySelector('[data-k="' + k + '"]'); return e ? e.textContent : ''; }).join('\\u2016');
  return out; }"""


class Paper:
    """پرنٹ کا اصل HTML ایک الگ صفحے پر (چھپائی کی چوڑائی 801px، print media) + PDF"""
    def __init__(self, b):
        self.c = b.new_context(viewport={'width': 801, 'height': 1248}, device_scale_factor=2); self.c.route('**/*', route)
        self.q = self.c.new_page(); self.q.emulate_media(media='print')

    def load(self, html, name):
        fn = os.path.join(HERE, '..', '..', '_t9_' + name + '.html')
        open(fn, 'w', encoding='utf-8').write(html if html.lstrip().lower().startswith('<!doctype') else '<!DOCTYPE html>' + html)
        self.q.goto(BASE + '_t9_' + name + '.html'); self.q.wait_for_timeout(1300); self.q.evaluate('document.fonts.ready'); self.q.wait_for_timeout(300)
        m = self.q.evaluate(MEASURE)
        try: self.q.query_selector('#ch173-table').screenshot(path=V + name + '_table.png')
        except Exception: pass
        self.q.pdf(path=V + name + '.pdf', prefer_css_page_size=True, print_background=True)
        os.remove(fn)
        return m


def gaps(c):
    t, cell = c['text'], c['cell']
    if not t: return None
    return dict(top=t['y'] - cell['y'], bot=cell['y'] + cell['h'] - t['y'] - t['h'], right=cell['x'] + cell['w'] - t['x'] - t['w'], left=t['x'] - cell['x'])


SCREEN_MEASURE = MEASURE
WIDTHS = {}


def run(b, tag, vp, extra):
    desktop = tag == 'desktop'
    ctx, pg, errs = open_app(b, viewport=vp, **extra)
    pg.evaluate("window.confirm = () => true; 0")
    paper = Paper(b)

    # ══════════ A) نمبر شمار ══════════
    pg.evaluate(SEED); pg.evaluate(PEOPLE, 3)
    open_challan(pg)
    t0 = pg.evaluate(TEXT, 'madai')
    check(f'{tag} A چالان کالم 1 (اکیلا مدعی): «1» نہیں', t0 and not re.match(r'^\s*1\s*۔', t0), t0)
    pick(pg, 'zer_hirasat', 1); t1 = pg.evaluate(TEXT, 'zer_hirasat')
    check(f'{tag} A چالان کالم 3: ایک ملزم → «1» نہیں', t1 and not re.match(r'^\s*\d+\s*۔', t1), t1)
    pick(pg, 'zer_hirasat', 2); t2 = pg.evaluate(TEXT, 'zer_hirasat')
    ln2 = [x for x in t2.split('\n') if not re.match(r'^\s*[\d-]+\s*$', x)]
    check(f'{tag} A چالان کالم 3: دو ملزم → 1۔ 2۔', len(ln2) == 2 and ln2[0].startswith('1۔') and ln2[1].startswith('2۔'), ln2)
    cn = re.findall(r'\d{5}-\d{7}-\d', t2)
    check(f'{tag} B③ کالم 3: CNIC کی شکل 00000-0000000-0 (پہلے 3630212345671)', len(cn) == 2 and '36302-7654321-1' in cn and not re.search(r'\d{13}', t2), cn)
    # ہاتھ سے دوسرا ملزم مٹایا (لپیٹ کھول کر پہلی سطر رکھو) → کہیں اور کلک → نمبر غائب
    pg.evaluate("""() => { const el = document.querySelector('#ch173-doc [data-k="zer_hirasat"]'); el.focus(); _ch173UnwrapCell(el);
        el.innerText = el.innerText.split('\\n')[0]; el.dispatchEvent(new InputEvent('input', {bubbles: true, inputType: 'deleteContentBackward'})); return 0; }""")
    blur_click(pg)
    t3 = pg.evaluate(TEXT, 'zer_hirasat')
    check(f'{tag} A چالان: ایک مٹایا → «1۔» خود ہٹ گیا (زندہ)', t3 and not re.match(r'^\s*\d+\s*۔', t3) and 'شاہد' not in t3, t3)
    # کالم 4: اصل کی بورڈ سے دو نام (Enter) — کرسر سے ہٹے بغیر، رکتے ہی نمبر؛ لکھنا جاری
    pg.click('#ch173-doc [data-k="bar_zamanat"]'); pg.keyboard.press('End')
    pg.keyboard.type('زاہد ولد نذیر', delay=8); pg.keyboard.press('Enter'); pg.keyboard.type('اکرم ولد بشیر', delay=8)
    pg.wait_for_timeout(1100)
    live = pg.evaluate(TEXT, 'bar_zamanat')
    still = pg.evaluate("document.activeElement && document.activeElement.dataset.k")
    pg.keyboard.type(' قوم جٹ', delay=8); pg.wait_for_timeout(900)
    cont_typ = pg.evaluate(TEXT, 'bar_zamanat')
    check(f'{tag} A چالان کالم 4: Enter = نئی سطر؛ دوسرا نام لکھتے ہی (کرسر وہیں) 1۔ 2۔',
          live == '1۔ زاہد ولد نذیر\n2۔ اکرم ولد بشیر' and still == 'bar_zamanat', [live, still])
    check(f'{tag} A چالان کالم 4: نمبر لگنے کے بعد لکھائی اسی جگہ جاری (کرسر نہیں ہلا)', cont_typ == '1۔ زاہد ولد نذیر\n2۔ اکرم ولد بشیر قوم جٹ', cont_typ)
    # دوسری سطر پوری مٹاؤ (اصل کی بورڈ) → ایک رہ گیا → نمبر غائب
    for _ in range(len('2۔ اکرم ولد بشیر قوم جٹ') + 1): pg.keyboard.press('Backspace')
    pg.wait_for_timeout(1100)
    one = pg.evaluate(TEXT, 'bar_zamanat')
    check(f'{tag} A چالان کالم 4: دوسرا نام مٹایا → «1۔» خود ہٹا', one == 'زاہد ولد نذیر', one)
    blur_click(pg)
    # کالم 6 گواہان: پہلے نمبر وار؛ ہاتھ سے ایک رہ گیا → نمبر غائب
    w0 = pg.evaluate(TEXT, 'shahadat')
    check(f'{tag} A چالان کالم 6: کئی گواہ → 1۔ 2۔ …', w0 and w0.startswith('1۔') and '2۔' in w0, w0[:80] if w0 else w0)
    pg.evaluate("""() => { const el = document.querySelector('#ch173-doc [data-k="shahadat"]'); el.focus(); el.innerText = el.innerText.split('\\n')[0];
        el.dispatchEvent(new InputEvent('input', {bubbles: true})); return 0; }""")
    blur_click(pg)
    w1 = pg.evaluate(TEXT, 'shahadat')
    check(f'{tag} A چالان کالم 6: ایک گواہ رہ گیا → نمبر نہیں', w1 and not re.match(r'^\s*\d+\s*۔', w1), w1)
    # کالم 5 (مال): دو چیزیں → نمبر؛ «1.5 کلو» جیسی چیز کا عدد نمبر نہ سمجھا جائے
    pg.click('#ch173-doc [data-k="mal_qabza"]')
    pg.keyboard.type('1.5 کلو چرس', delay=8); pg.keyboard.press('Enter'); pg.keyboard.type('موبائل فون', delay=8)
    blur_click(pg)
    m2 = pg.evaluate(TEXT, 'mal_qabza')
    check(f'{tag} A چالان کالم 5 (مال): دو چیزیں → 1۔ 2۔، «1.5 کلو» کا عدد سلامت', m2 == '1۔ 1.5 کلو چرس\n2۔ موبائل فون', m2)
    pg.screenshot(path=V + f'{tag}_A_challan.png')

    # دوسری اقسام: مدعی اکیلا → «1» نہیں؛ اخراج کی فہرست گواہان زندہ
    for rt in ('namukammal', 'tatima_challan', 'adampata'):
        open_challan(pg, rt)
        tm = pg.evaluate(TEXT, 'madai') if rt != 'adampata' else pg.evaluate(TEXT, 'madai_i')
        check(f'{tag} A {rt}: مدعی اکیلا → «1» نہیں', tm is not None and not re.match(r'^\s*1\s*۔', tm), tm)
    open_challan(pg, 'ikhraj')
    g0 = pg.evaluate("[...document.querySelectorAll('#ch173-doc [data-k=gawah_body] .gw-nm')].map(e => e.textContent.trim())")
    check(f'{tag} A اخراج فہرست گواہان: کئی → 1۔ 2۔', len(g0) >= 2 and g0[0].startswith('1۔') and g0[1].startswith('2۔'), g0)
    pg.evaluate("""() => { const b = document.querySelector('#ch173-doc [data-k="gawah_body"]'); b.focus(); const ls = b.querySelectorAll('.gw-ln');
        for (let i = 1; i < ls.length; i++) ls[i].remove(); const r = document.createRange(); r.selectNodeContents(b.querySelector('.gw-nm')); r.collapse(false);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.dispatchEvent(new InputEvent('input', {bubbles: true})); return 0; }""")
    pg.wait_for_timeout(1200)
    g1 = pg.evaluate("[...document.querySelectorAll('#ch173-doc [data-k=gawah_body] .gw-nm')].map(e => e.textContent.trim())")
    check(f'{tag} A اخراج فہرست گواہان: ایک رہ گیا → «1۔» خود ہٹا', len(g1) == 1 and not g1[0].startswith('1۔'), g1)
    pg.click('#ch173-doc [data-k="namzad_i"]')
    pg.evaluate("(() => { const e = document.querySelector('#ch173-doc [data-k=\"namzad_i\"]'); const r = document.createRange(); r.selectNodeContents(e); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()")
    pg.keyboard.type('ناصر ولد بشیر', delay=8)
    pg.keyboard.press('Enter'); pg.keyboard.type('طارق ولد نذیر', delay=8); blur_click(pg)
    nz = pg.evaluate(TEXT, 'namzad_i')
    check(f'{tag} A اخراج «ملزمان نامزد»: دو نام → 1۔ 2۔', nz == '1۔ ناصر ولد بشیر\n2۔ طارق ولد نذیر', nz)

    # ضمنی «بنام»
    pg.evaluate(SEED); pg.evaluate(PEOPLE, 3)
    open_zimni(pg)
    BAN = "() => [...(_zimniDoc().querySelectorAll('[data-k=banam] .zf-acc .nm'))].map(e => e.textContent.trim())"
    pg.click('#ch173-doc .zf-pick[data-which=fir]'); pg.wait_for_timeout(500)
    bx = pg.locator('#zf-acc-menu input[type=checkbox]')
    bx.nth(0).click(); pg.wait_for_timeout(300); z1 = pg.evaluate(BAN)
    bx.nth(1).click(); pg.wait_for_timeout(300); z2 = pg.evaluate(BAN)
    pg.click('#zf-acc-x'); pg.wait_for_timeout(300)
    check(f'{tag} A ضمنی «بنام»: ایک → «1» نہیں؛ دو → 1۔ 2۔', len(z1) == 1 and not z1[0].startswith('1۔') and len(z2) == 2 and z2[0].startswith('1۔') and z2[1].startswith('2۔'), [z1, z2])
    pg.evaluate("""() => { const c = _zimniDoc().querySelector('[data-k=banam]'); const a = c.querySelectorAll('.zf-acc'); a[1].remove();
        const r = document.createRange(); r.selectNodeContents(a[0].querySelector('.nm')); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        _zimniDoc().dispatchEvent(new InputEvent('input', {bubbles: true})); return 0; }""")
    pg.wait_for_timeout(1200)
    z3 = pg.evaluate(BAN)
    check(f'{tag} A ضمنی «بنام»: ہاتھ سے ایک مٹایا → «1۔» خود ہٹا', len(z3) == 1 and not z3[0].startswith('1۔'), z3)
    # پرانی محفوظ ضمنی (اکیلے ملزم پر «1۔») — کھولنے پر جوں کی توں (افسر کا فیصلہ، قاعدہ 15)
    pg.evaluate("(() => { const d = _zimniDoc(); const n = d.querySelector('[data-k=banam] .zf-acc .nm'); n.textContent = '1۔ نامعلوم ملزم'; return 0; })()")
    ok, _m = save(pg)
    zid = pg.evaluate("(window.__db.zimni_reports || []).slice(-1)[0] && window.__db.zimni_reports.slice(-1)[0].id")
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1200)
    pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(1200)
    pg.evaluate("(id) => { _openZimni(id); return 0; }", zid); pg.wait_for_timeout(2800)
    zo = pg.evaluate(BAN)
    check(f'{tag} A پرانی محفوظ ضمنی: «1۔ نامعلوم ملزم» کھولنے پر جوں کا توں (خود نہیں بدلا)', bool(ok) and zo == ['1۔ نامعلوم ملزم'], [ok, zo])

    # درخواستیں
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1200)
    pg.evaluate("_openMisalEditor('darkhwastain')"); pg.wait_for_timeout(2500)
    DK = "() => [...document.querySelectorAll('#dk-doc .dk-banam-list .dk-acc-nm')].map(e => e.textContent.trim())"
    pg.evaluate("_dkSetAccused([window.__db.case_accused[0].name]); 0"); pg.wait_for_timeout(300); d1 = pg.evaluate(DK)
    pg.evaluate("_dkSetAccused([window.__db.case_accused[0].name, window.__db.case_accused[1].name]); 0"); pg.wait_for_timeout(300); d2 = pg.evaluate(DK)
    check(f'{tag} A درخواستیں «بنام»: ایک → «1» نہیں؛ دو → 1۔ 2۔', len(d1) == 1 and not d1[0].startswith('1۔') and len(d2) == 2 and d2[0].startswith('1۔') and d2[1].startswith('2۔'), [d1, d2])
    pg.evaluate("""() => { const l = document.querySelector('#dk-doc .dk-banam-list'); l.focus(); const a = l.querySelectorAll('.dk-acc-line'); a[1].remove();
        const r = document.createRange(); r.selectNodeContents(a[0]); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        l.dispatchEvent(new InputEvent('input', {bubbles: true})); return 0; }""")
    pg.wait_for_timeout(1200); d3 = pg.evaluate(DK)
    check(f'{tag} A درخواستیں: ہاتھ سے ایک مٹایا → «1۔» خود ہٹا', len(d3) == 1 and not d3[0].startswith('1۔'), d3)

    # سزا سلپ، نقشہ موقع (3 ملزم → 1۔ 2۔ 3۔)
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1200)
    pg.evaluate("_openMisalEditor('saza_slip')"); pg.wait_for_timeout(2800)
    sz = pg.evaluate("[...document.querySelectorAll('#saza-doc .saza-acc-name')].map(e => e.textContent.trim().slice(0, 3))")
    check(f'{tag} A سزا سلپ: تین ملزم → 1۔ 2۔ 3۔', sz[:3] == ['1۔ ', '2۔ ', '3۔ '] or [x[:2] for x in sz[:3]] == ['1۔', '2۔', '3۔'], sz)
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1200)
    pg.evaluate("_openMisalEditor('crime_scene')"); pg.wait_for_timeout(1800)
    pg.evaluate("_naqNew()"); pg.wait_for_timeout(2500)
    nq = pg.evaluate("[...document.querySelectorAll('#naq-banam-list .naq-acc')].map(e => e.textContent.trim().slice(0, 3))")
    check(f'{tag} A نقشہ موقع «بنام»: تین → 1۔ 2۔ 3۔ (شکل «1۔»، پہلے «1.»)', [x[:2] for x in nq] == ['1۔', '2۔', '3۔'], nq)
    # ایک ملزم والا مقدمہ: سزا سلپ / نقشہ — نمبر نہیں
    pg.evaluate(PEOPLE, 1)
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1200)
    pg.evaluate("_openMisalEditor('saza_slip')"); pg.wait_for_timeout(2800)
    sz1 = pg.evaluate("[...document.querySelectorAll('#saza-doc .saza-acc-name')].map(e => e.textContent.trim())")
    check(f'{tag} A سزا سلپ: ایک ملزم → «1» نہیں', len(sz1) == 1 and not sz1[0].startswith('1۔'), sz1)
    # CDR / واقعاتی رپورٹ کا بنانے والا (اسی قاعدے سے)
    gen = pg.evaluate("""async () => { await dioLoadScript('cdr-imei.js'); await dioLoadScript('incident.js');
        return { cdr1: _cdrBanamHtml(['الف']), cdr2: _cdrBanamHtml(['الف', 'ب']) }; }""")
    check(f'{tag} A CDR «بنام»: ایک → سادہ نام؛ دو → <bdi>1۔</bdi> <bdi>2۔</bdi>', gen['cdr1'] == 'الف' and '<bdi>1۔</bdi> الف' in gen['cdr2'] and '<bdi>2۔</bdi> ب' in gen['cdr2'], gen)
    # واقعاتی رپورٹ: ملزمان کا خانہ — دو نام، ایک مٹاؤ → نمبر اور «تعداد» درست
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; showPage('incident', null); 0"); pg.wait_for_timeout(1500)
    pg.evaluate("_irNew(); 0"); pg.wait_for_timeout(1500)
    pg.evaluate("""() => { const el = document.querySelector('#ir-doc [data-k="accused"]'); el.innerHTML = '<bdi dir="ltr">1</bdi>۔ الف ولد ب<br><bdi dir="ltr">2</bdi>۔ ج ولد د<br>تعداد: <bdi dir="ltr">2</bdi>';
        el.focus(); el.querySelectorAll('br')[0].previousSibling; const k = [...el.childNodes]; const i = k.findIndex(n => n.nodeName === 'BR');
        // دوسری سطر (2۔ ج ولد د) مٹاؤ
        let n = k[i + 1]; while (n && n.nodeName !== 'BR') { const nx = n.nextSibling; n.remove(); n = nx; } if (n) n.remove();
        const r = document.createRange(); r.setStart(el.firstChild.nextSibling, 0); r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        el.dispatchEvent(new InputEvent('input', {bubbles: true})); return 0; }""")
    pg.wait_for_timeout(1300)
    ir = pg.evaluate("document.querySelector('#ir-doc [data-k=\"accused\"]').innerText")
    check(f'{tag} A واقعاتی رپورٹ: ایک نام رہ گیا → نمبر نہیں، «تعداد: 1»', not re.search(r'^\s*1\s*۔', ir) and 'تعداد: 1' in ir and 'الف ولد ب' in ir, ir)
    # انڈیکس: الگ «بنام» خانے، کوئی نمبر نہیں (جوں کا توں)
    pg.evaluate(PEOPLE, 2)
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1200)
    pg.evaluate("_openMisalEditor('index_naql')"); pg.wait_for_timeout(2500)
    ix = pg.evaluate("[...document.querySelectorAll('[id^=idxn-name-]')].map(e => e.textContent.trim()).filter(Boolean)")
    check(f'{tag} A انڈیکس: ہر ملزم اپنا «بنام» خانہ، «1۔» نہیں (ترتیب جوں کی توں)', len(ix) >= 1 and not any(re.match(r'^\s*\d+\s*۔', x) for x in ix), ix)

    # ══════════ B) رپورٹ 173 کی سیدھ (2 ملزم، کالم 6 گواہان) ══════════
    pg.evaluate(SEED); pg.evaluate(PEOPLE, 2)
    open_challan(pg)
    pick(pg, 'zer_hirasat', 2)
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(600)
    # اسکرین — پورا جدول نظر آئے (ناپ چوڑائی پر ہوتی ہے، اونچائی پر نہیں)
    h = pg.evaluate("() => Math.ceil(document.getElementById('ch173-table').getBoundingClientRect().bottom + 120)")
    pg.set_viewport_size({'width': vp['width'], 'height': max(vp['height'], h)}); pg.wait_for_timeout(900)
    scr = pg.evaluate(MEASURE)
    pg.query_selector('#ch173-doc').screenshot(path=V + f'{tag}_B_screen.png')
    pg.set_viewport_size(vp); pg.wait_for_timeout(600)
    hb = final_print(pg, lambda: pg.evaluate("_printR173(); 0"))
    pg.click('#ch173-doc [data-k="halaat"]'); pg.keyboard.press('End')
    hc = final_print(pg, lambda: pg.keyboard.press('Control+p'))
    norm = lambda x: re.sub(r'saved_at[^,]*', '', x)
    check(f'{tag} B «پرنٹ» بٹن = Ctrl+P (ایک ہی کاغذ)', hb and norm(hb) == norm(hc), (len(hb), len(hc)))
    prt = paper.load(hb, f'{tag}_B_print')
    sw = [round(c['cell']['w']) for c in scr['cells'] if c['tag'] == 'TD']
    pw = [round(c['cell']['w']) for c in prt['cells'] if c['tag'] == 'TD']
    sc = pg.evaluate("_ch173Scale()") or 1
    sw_unscaled = [round(x / sc) for x in sw]
    WIDTHS[tag] = pw
    check(f'{tag} B کالموں کی چوڑائی: اسکرین = کاغذ', all(abs(a - b) <= 2 for a, b in zip(sw_unscaled, pw)), [sw_unscaled, pw])
    for mode, M in (('اسکرین', scr), ('کاغذ', prt)):
        hs = [gaps(c) for c in M['cells'] if c['tag'] == 'TH']
        k = 1 if mode == 'اسکرین' else 1
        out = [g for g in hs if g and min(g['left'], g['right']) < -1 * (1 if mode == 'کاغذ' else sc)]
        check(f'{tag} B {mode}: ہر سرخی اپنے خانے کے اندر (کوئی لفظ لکیر سے باہر نہیں)', not out, [{kk: round(v, 1) for kk, v in g.items()} for g in out][:3])
        tds = [c for c in M['cells'] if c['tag'] == 'TD']
        vert = [gaps(c) for c in tds[:6] if c['text']]
        anch = [g['bot'] < g['top'] or abs(g['bot'] - g['top']) < 3 for g in vert]
        check(f'{tag} B {mode}: کھڑا متن نیچے سے شروع (کالم 1، 3، 6)', all(anch), [{kk: round(v, 1) for kk, v in g.items()} for g in vert])
        rgt = [round(g['right'] / (sc if mode == 'اسکرین' else 1), 1) for g in vert]
        check(f'{tag} B {mode}: سطریں دائیں کنارے کے ساتھ (ہر خانے میں دایاں فاصلہ برابر ≤ 2px)', all(-2 <= x <= 2 for x in rgt) and (max(rgt) - min(rgt)) <= 2, rgt)
    pads = pg.evaluate("""() => { const P = s => getComputedStyle(document.querySelector(s)).padding;
        return [P('#ch173-table tbody .rotinner'), P('#ch173-table .normwrap'), P('#ch173-table thead th'), P('#ch173-table thead tr:nth-child(2) th')]; }""")
    check(f'{tag} B⑥ اندرونی جگہ برابر: کھڑے خانے 4px، کالم 7 «4px 4px 0»، ہر سرخی 4px', pads == ['4px', '4px 4px 0px', '4px', '4px'], pads)
    fs = pg.evaluate("getComputedStyle(document.querySelector('#ch173-table tbody .rotinner')).fontSize")
    check(f'{tag} B⑧ خانوں کا متن 14pt (موبائل پر بھی — پہلے 12pt)', fs == '18.6667px', fs)
    paper.q.screenshot(path=V + f'{tag}_B_print_page.png', full_page=False)

    # اخراج کا جدول — قطار 8 بھی باقی جیسی، کچھ نہیں کٹتا
    open_challan(pg, 'ikhraj')
    ha = final_print(pg, lambda: pg.evaluate("_printR173(); 0"))
    pa = paper.load(ha, f'{tag}_B_ikhraj_print')
    r8 = [gaps(c) for c in pa['cells'][-3:]]
    check(f'{tag} B اخراج قطار 8: کوئی حرف لکیر سے باہر/کٹا نہیں (کاغذ)', all(g and min(g.values()) >= -1 for g in r8 if g), [{kk: round(v, 1) for kk, v in g.items()} for g in r8 if g])
    pd8 = pg.evaluate("""() => [...document.querySelectorAll('.ch173-akhraj-table tbody tr')].map(tr => getComputedStyle(tr.cells[1]).paddingTop)""")
    check(f'{tag} B اخراج: ہر قطار (1–8) کا عنوان 6px سے، اوپر سے', len(set(pd8)) == 1 and pd8[0] == '6px', pd8)

    # ══════════ C + D) «مختصر حالات» لمبا متن + جُڑے الفاظ ══════════
    for nwords in (360, 1000):
        pg.evaluate(SEED); pg.evaluate(PEOPLE, 1)
        open_challan(pg)
        txt = ' '.join(WORDS[:nwords])
        type_in(pg, '#ch173-doc [data-k="halaat"]', ' ' + txt)
        pg.wait_for_timeout(1200)
        exp = len(BOILER) + nwords
        live = pg.evaluate(BOTH)
        check(f'{tag} C {nwords} الفاظ: لکھنے کے بعد کوئی لفظ گم/جُڑا نہیں', len(toks(live)) == exp and not fused(live, WORDS[:nwords]), (len(toks(live)), exp, fused(live, WORDS[:nwords])[:3]))
        pg.evaluate("_saveR173()"); pg.wait_for_timeout(2000)
        sv = (pg.evaluate("(window.__db.report_173 || []).slice(-1)[0]") or {}).get('form_data', {})
        sv_t = re.sub('<[^>]+>', '', sv.get('halaat', '')) + '‖' + re.sub('<[^>]+>', '', sv.get('cont_text', ''))
        check(f'{tag} D {nwords}: محفوظ ڈیٹا — ہر لفظ الگ، LTR خانے محفوظ نہیں ہوئے (سادہ متن)', len(toks(sv_t)) == exp and 'ch173-ltr' not in sv.get('halaat', '') + sv.get('cont_text', ''), len(toks(sv_t)))
        rid = pg.evaluate("(window.__db.report_173 || []).slice(-1)[0].id")
        pg.evaluate("(async (id) => { openReport173WithType('list'); await new Promise(r => setTimeout(r, 2200)); await _r173OpenDoc(String(id)); return 0; })", rid)
        pg.wait_for_timeout(3000)
        ro = pg.evaluate(BOTH)
        check(f'{tag} D {nwords}: دوبارہ کھولا — کوئی فاصلہ گم نہیں (پہلے 7 الفاظ ایک ہو جاتے تھے)', len(toks(ro)) == exp and not fused(ro, WORDS[:nwords]), (len(toks(ro)), exp, fused(ro, WORDS[:nwords])[:2]))
        for i, pap in enumerate(('legal', 'a4', 'legal')):
            hp = final_print(pg, lambda: pg.evaluate("_printR173(); 0"), pap)
            pm = paper.load(hp, f'{tag}_C{nwords}_{pap}{i}')
            lv = pg.evaluate(BOTH)
            n_pages = pdf_info(V + f'{tag}_C{nwords}_{pap}{i}.pdf')[0]
            check(f'{tag} D {nwords} پرنٹ {i + 1} ({pap}): کاغذ اور اسکرین — ہر لفظ الگ (کوئی نہیں جُڑا)',
                  len(toks(pm['words'])) == exp and not fused(pm['words'], WORDS[:nwords]) and len(toks(lv)) == exp, (len(toks(pm['words'])), len(toks(lv)), exp, fused(pm['words'], WORDS[:nwords])[:2]))
            check(f'{tag} C {nwords} پرنٹ {i + 1} ({pap}): سطر صرف الفاظ کے بیچ ٹوٹی؛ موبائل نمبر سیدھا (LTR)، ڈیش پر نہیں ٹوٹا',
                  not pm['split'] and pm['nums'] and all(x == 'ok' for x in pm['nums']), (pm['split'][:3], pm['nums'][:6]))
            tb = pm['table']
            check(f'{tag} C {nwords} پرنٹ {i + 1} ({pap}): جدول ایک صفحے پر مکمل (لکیریں سلامت)؛ صفحات {n_pages}',
                  tb['h'] > 0 and tb['bottom'] < (1248 if pap == 'legal' else 1123) and (n_pages >= 2 if nwords == 1000 else n_pages >= 1), (round(tb['h']), round(tb['bottom']), n_pages))
        pg.evaluate("_saveR173()"); pg.wait_for_timeout(2000)
        sv = (pg.evaluate("(window.__db.report_173 || []).slice(-1)[0]") or {}).get('form_data', {})
        sv_t = re.sub('<[^>]+>', '', sv.get('halaat', '')) + '‖' + re.sub('<[^>]+>', '', sv.get('cont_text', ''))
        check(f'{tag} D {nwords}: 3 پرنٹ کے بعد دوبارہ محفوظ — ہر لفظ الگ (پہلے 16 فاصلے گم)', len(toks(sv_t)) == exp and not fused(sv_t, WORDS[:nwords]), (len(toks(sv_t)), exp))
        if nwords == 1000:
            pg.screenshot(path=V + f'{tag}_C_1000_screen.png')
            subprocess.run(['pdftoppm', '-png', '-r', '60', V + f'{tag}_C1000_legal0.pdf', V + f'{tag}_C1000_legal0'])

    # پرانا محفوظ چالان جس کی سرحد پر جگہ پہلے ہی گم تھی («…موصول» | «ہوئی جس…»)
    pg.evaluate(SEED); pg.evaluate(PEOPLE, 1)
    pg.evaluate("""() => { const d = window.__db; d.report_173 = [{ id: 'old1', case_id: 'c1', report_type: 'mukammal', report_subtype: 'fir',
        created_at: '2026-10-20T00:00:00Z', updated_at: '2026-10-20T00:00:00Z',
        form_data: { halaat: 'جناب عالیٰ! مختصر حالات مقدمہ اس طرح ہیں کہ مسل مقدمہ ہذا برائے تفتیش موصول', cont_text: 'ہوئی جس پر مسمی محمد اسلم ASI کے ہمراہ جائے وقوعہ پر پہنچ کر نقشہ موقع مرتب کیا گیا۔',
                     saved_at: '2026-10-20T00:00:00Z', fnorm: '553' } }]; return 0; }""")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1200)
    pg.evaluate("(async () => { openReport173WithType('list'); await new Promise(r => setTimeout(r, 2200)); await _r173OpenDoc('old1'); return 0; })()"); pg.wait_for_timeout(3000)
    hp = final_print(pg, lambda: pg.evaluate("_printR173(); 0"), 'a4')
    pm = paper.load(hp, f'{tag}_D_legacy')
    lt = toks(pm['words'])
    check(f'{tag} D پرانا چالان (سرحد کی جگہ پہلے سے گم): «موصول» اور «ہوئی» الگ — جُڑے نہیں', 'موصول' in lt and 'ہوئی' in lt and 'موصولہوئی' not in pm['words'].replace('‖', ''), [t for t in lt if 'موصول' in t])

    # موبائل کا فارم کارڈ: فہرست کے خانے بھی زندہ
    if not desktop:
        pg.evaluate(SEED); pg.evaluate(PEOPLE, 2)
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1200)
        pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2800)
        pg.evaluate("document.querySelectorAll('#dio-chform [data-v=form], .dio-mbar [data-m=form]').forEach(b => b.click()); 0"); pg.wait_for_timeout(800)
        card = '#dio-chform [data-bind="bar_zamanat"]'
        if pg.query_selector(card):
            pg.tap(card); pg.keyboard.type('زاہد ولد نذیر', delay=8); pg.keyboard.press('Enter'); pg.keyboard.type('اکرم ولد بشیر', delay=8)
            pg.wait_for_timeout(1500)
            ct = pg.evaluate("(s) => document.querySelector(s).innerText.replace(/\\n+$/, '')", card)
            ptxt = pg.evaluate(TEXT, 'bar_zamanat')
            check(f'{tag} A موبائل فارم کارڈ «برضمانت»: دو نام → 1۔ 2۔ (کارڈ اور کاغذ دونوں)', ct == '1۔ زاہد ولد نذیر\n2۔ اکرم ولد بشیر' and ptxt == ct, [ct, ptxt])
            pg.screenshot(path=V + f'{tag}_A_formcard.png')
        else:
            check(f'{tag} A موبائل فارم کارڈ موجود', False, 'no card')

    check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:3])
    paper.c.close(); ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch()
    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'):
        run(b, 'desktop', {'width': 1366, 'height': 768}, {})
    if only in ('', 'mobile'):
        run(b, 'mobile', {'width': 390, 'height': 844}, {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2})
    if 'desktop' in WIDTHS and 'mobile' in WIDTHS:
        check('B⑧ ایک ہی چالان: موبائل کا کاغذ = Desktop کا کاغذ (کالموں کی چوڑائی)', all(abs(a - c) <= 2 for a, c in zip(WIDTHS['desktop'], WIDTHS['mobile'])), [WIDTHS['desktop'], WIDTHS['mobile']])
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
for f in fails: print('  ✗', f[1], '—', str(f[2])[:300])
sys.exit(1 if fails else 0)
