"""(v580) اصل ایپ کی جانچ — افسر کا حکم 12 نومبر 2026:
  (7) موبائل / شناختی کارڈ جیسے ڈیش والے ہندسے الٹے نہیں (0300-1234567، پہلے 1234567-0300 دکھتا) — اسکرین (کھولتے وقت،
      لکھتے وقت رک کر، کرسر اپنی جگہ)، پرنٹ؛ محفوظ تحریر میں کوئی نیا نشان نہیں (reload کے بعد بھی سیدھا) — بیرونی ضمنی + بیان 161
  • پوری بیرونی ضمنی justify (آخری سطر دائیں)، الفاظ جُڑے نہیں (ہر خالی جگہ ≥ 0.19em) — اسکرین، پرنٹ، صفحے کے توڑ سے پہلے کی سطر
  • صفحہ 3، 5، 7 … پر اندرونی ضمنی (پولیس فارم 25—54(2)) کا سرنامہ — سادہ کاغذ نہیں؛ بلاکس اور سیریل نمبر قائم؛ صفحہ 2، 4 … پہلے جیسے
  • بلاک سے بلاک کا فاصلہ تقریباً آدھا (≈10px، پہلے 21px)؛ نیچے کا حاشیہ 0.4cm (پہلے 0.6cm)
  • شیئر PDF (صفحات = پرنٹ) اور Word (خانے کے اندر سیدھ لکھی ہوئی، LibreOffice سے کھلتی ہے)
Desktop 1366×768 (لیگل، Ctrl+S / Ctrl+P) + Mobile 390×844 (A4، بٹن)۔
چلانا: `python3 v580_test.py` — ایک ہی: DIO_ONLY=desktop|mobile
"""
from v564_common import *
import base64
from PIL import ImageOps

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v580/'
os.makedirs(V, exist_ok=True)
DPI = 72
NB = 30            # 30 اندراج × 3 جملے ≈ لیگل پر 6، A4 پر 7 صفحات — صفحہ 3 اور 5 (اور 7) دونوں آزمائے جائیں
LONG = 'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض موضع سید پور تحصیل شجاع آباد ضلع ملتان'
_ns = dict(globals()); _src = open(HERE + '/v558_test.py', encoding='utf-8').read()
exec(_src[_src.index('SEED = """'):_src.index('HOOK = """')], _ns)
SEED161 = _ns['SEED']              # وہی آزمائشی مقدمہ (مدعی، محرر، دو گواہ) — بیان 161 کے لیے
KEEP_DB = "try { const s = sessionStorage.getItem('__v580db'); if (s) window.__db = JSON.parse(s); } catch (e) {}"
BODY = '#ch173-doc tr.zf-blk .zf-body'

# ہر متن کی سطریں: بایاں سرا (RTL میں سطر کا آخر) اور خالی جگہوں کی چوڑائی (em) — موبائل پر کاغذ کی اصل اکائی میں (v579 والا)
LINES = r"""(sel) => { const out = [];
  const D = document.getElementById('ch173-doc'), k = (D && D.offsetWidth) ? D.getBoundingClientRect().width / D.offsetWidth : 1;
  const tris = [...document.querySelectorAll('#ch173-doc .zf-bind, #ch173-doc .zf-bindsl')].map(t => t.getBoundingClientRect()).filter(r => r.height);
  document.querySelectorAll(sel).forEach((el, pi) => {
    const cs = getComputedStyle(el), fs = parseFloat(cs.fontSize) * k, R = el.getBoundingClientRect();
    const L = R.left + parseFloat(cs.paddingLeft) * k;
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n; const ch = [];
    while ((n = tw.nextNode())) for (let i = 0; i < n.nodeValue.length; i++) {
      const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const b = r.getBoundingClientRect();
      if (b.height > 2) ch.push({ c: n.nodeValue[i], l: b.left, w: b.width, y: (b.top + b.bottom) / 2 }); }
    const lines = []; ch.forEach(c => { let ln = lines.find(x => Math.abs(x.y - c.y) < fs * 0.6); if (!ln) { ln = { y: c.y, cs: [] }; lines.push(ln); } ln.cs.push(c); });
    lines.sort((a, b) => a.y - b.y);
    lines.forEach((ln, i) => {
      const ink = ln.cs.filter(c => c.c.trim()); if (!ink.length) return;
      const sp = ln.cs.filter(c => c.c === ' ' || c.c === ' ').slice(0, -1).map(c => c.w / fs);
      out.push({ p: pi, i, last: i === lines.length - 1, gapL: +((Math.min(...ink.map(c => c.l)) - L) / k).toFixed(1),
        tri: tris.some(t => ln.y >= t.top - fs && ln.y <= t.bottom + fs), sp: sp.length ? +Math.min(...sp).toFixed(3) : null });
    });
  }); return out; }"""
STYLE = r"""(sel) => [...document.querySelectorAll(sel)].map(e => { const s = getComputedStyle(e); return [s.textAlign, s.textAlignLast, s.fontKerning]; })"""


def judge(lines, pre=False):
    """justify: ہر غیر آخری سطر بائیں کنارے تک (≤ 3px)؛ خالی جگہ ≥ 0.19em؛ مثل کی لکیر کے ساتھ والی سطریں الگ"""
    body = [x for x in lines if (pre or not x['last']) and not x['tri']]
    bad = [x for x in body if x['gapL'] > 3]
    sp = [x['sp'] for x in lines if x['sp'] is not None]
    return {'lines': len(lines), 'full': len(body) - len(bad), 'notFull': [(x['p'], x['i'], x['gapL']) for x in bad][:6],
            'minSpaceEm': min(sp) if sp else None, 'lastRight': len([x for x in lines if x['last'] and x['gapL'] > 3])}


# بلاک سے بلاک کا فاصلہ: پچھلے اندراج کی آخری سطر کے نیچے سے اگلے کی پہلی سطر کے اوپر تک (کاغذ کی اکائی، px)
GAPS = r"""() => { const D = document.getElementById('ch173-doc'), k = (D && D.offsetWidth) ? D.getBoundingClientRect().width / D.offsetWidth : 1;
  const tb = (el, last) => { const rg = document.createRange(); rg.selectNodeContents(el); const rs = [...rg.getClientRects()].filter(x => x.height > 2);
    if (!rs.length) return null; return last ? Math.max(...rs.map(x => x.bottom)) : Math.min(...rs.map(x => x.top)); };
  const out = []; const rows = [...document.querySelectorAll('#ch173-doc table.zf-tbl tbody > tr')];
  for (let i = 1; i < rows.length; i++) { const a = rows[i - 1], b = rows[i];
    if (!a.classList.contains('zf-blk') || !b.classList.contains('zf-blk') || b.classList.contains('zf-cont')) continue;
    if (getComputedStyle(b).breakBefore === 'page' || b.querySelector('.dio-pgbrk') || a.querySelector('.dio-pgbrk')) continue;
    const x = tb(a.querySelector('td.zf-c-body'), true), y = tb(b.querySelector('td.zf-c-body'), false);
    if (x !== null && y !== null && y > x) out.push(+((y - x) / k).toFixed(1)); }
  return out; }"""

# ڈیش والے ہندسے: پہلا ہندسہ بائیں، آخری دائیں (LTR) — پہلے 1234567-0300 دکھتا تھا
ORDER = r"""(num) => { const out = []; const tw = document.createTreeWalker(document.getElementById('ch173-doc'), NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) { const v = n.nodeValue || ''; let i = v.indexOf(num); while (i >= 0) {
    const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const a = r.getBoundingClientRect();
    r.setStart(n, i + num.length - 1); r.setEnd(n, i + num.length); const z = r.getBoundingClientRect();
    if (a.height > 2 && z.height > 2 && Math.abs(a.top - z.top) < 4) out.push({ ltr: a.left < z.left, span: !!(n.parentNode.closest && n.parentNode.closest('.dio-ltrn')) });
    i = v.indexOf(num, i + 1); } }
  return out; }"""

# صفحات کی ترتیب (کاغذ میں): ہر «نئے صفحے» کا نشان — صفحہ n کا آغاز = (n−1) واں نشان
MARKS = r"""() => { const d = document.getElementById('ch173-doc');
  return [...d.querySelectorAll('*')].filter(e => { const s = getComputedStyle(e); return s.breakBefore === 'page' || s.pageBreakBefore === 'always'; })
    .map(e => e.tagName === 'TR' ? 'tr.' + e.className.trim() : (e.className || e.tagName)); }"""

# اندراج: کالم 1 (وقت) + کالم 2 (سیریل) + متن — zf-cont (سرنامے کے نیچے جاری حصہ) پچھلی قطار کا حصہ
ROWS = r"""() => [...document.querySelectorAll('#ch173-doc table.zf-tbl tbody > tr.zf-blk')].reduce((a, r) => {
    const t = [...r.querySelectorAll('.zf-body')].map(x => x.textContent).join(' ').replace(/[\s ]+/g, ' ').trim();
    const g = (s) => { const e = r.querySelector(s); return e ? e.textContent.replace(/[\s ]+/g, ' ').trim() : ''; };
    if (r.classList.contains('zf-cont') && a.length) { a[a.length - 1].b += ' ' + t; a[a.length - 1].contEmpty = a[a.length - 1].contEmpty && !g('td.zf-c-serial') && !g('td.zf-c-action'); a[a.length - 1].parts++; }
    else a.push({ act: g('td.zf-c-action'), sn: g('td.zf-c-serial'), b: t, parts: 1, contEmpty: true });
    return a; }, []).map(x => Object.assign(x, { b: x.b.replace(/ +/g, ' ') }))"""

# صفحہ 3، 5 … کے سرنامے کا متن اور اس کے نیچے کا جدول
AHEAD = r"""() => [...document.querySelectorAll('#ch173-doc tr.zf-ahead')].map(h => { const nx = h.nextElementSibling, td = h.querySelector('td');
  const blk = [...document.querySelectorAll('#ch173-doc tr.zf-blk')].find(r => !r.classList.contains('zf-cont'));
  return { form: (h.querySelector('.zfa-formno') || {}).textContent || '', title: (h.querySelector('.zfa-title') || {}).textContent || '',
    fir: (h.querySelector('[data-k="fir"]') || {}).textContent || '', fdate: (h.querySelector('[data-k="fdate"]') || {}).textContent || '',
    thana: (h.querySelector('[data-k="thana"]') || {}).textContent || '', colspan: td ? +td.getAttribute('colspan') : 0,
    next: nx ? nx.className : '', nextTds: nx ? nx.children.length : 0, blkTds: blk ? blk.children.length : 0 }; })"""

PRE = r"""() => ({ pre: [...document.querySelectorAll('#ch173-doc .zf-pgpre')].map(e => [getComputedStyle(e).textAlignLast, getComputedStyle(e).display]),
  sp: [...document.querySelectorAll('#ch173-doc .zf-pgsp')].map(g => { const r = document.createRange(); r.selectNodeContents(g); return +[...r.getClientRects()].reduce((a, x) => a + x.width, 0).toFixed(1); }) })"""


def analyze(png, mb_cm):
    """کھڑی لکیریں (نچلا حصہ) + نیچے کے حاشیے سے فاصلہ؛ سب سے نچلی سیاہی؛ اوپر کے 4cm میں سیاہی (سرنامہ) — v575 والا"""
    im = Image.open(png).convert('L'); W, H = im.size; px = im.load()
    dark = lambda x, y: 0 <= x < W and 0 <= y < H and px[x, y] < 140
    yb = H - int(round(mb_cm / 2.54 * DPI))
    y0, y1 = int(H * 0.55), yb - 10
    xs = [x for x in range(W) if sum(1 for y in range(y0, y1) if dark(x, y)) >= 0.97 * (y1 - y0)]
    groups = []
    for x in xs:
        if groups and x - groups[-1][-1] <= 2: groups[-1].append(x)
        else: groups.append([x])
    lines = [g[len(g) // 2] for g in groups]
    ends = []
    for x in lines:
        y = y1
        while y < H and (dark(x, y) or dark(x - 1, y) or dark(x + 1, y)): y += 1
        ends.append(y)
    low = max((y for y in range(H) for x in range(0, W, 2) if px[x, y] < 140), default=0)
    cm = lambda v: round(v / DPI * 2.54, 2)
    return {'lines': len(lines), 'line_end_cm': [cm(H - y) for y in ends], 'low_cm': cm(H - 1 - low)}


def page_pngs(pdf, tag):
    for f in glob.glob(V + tag + '-*.png'): os.remove(f)
    subprocess.run(['pdftoppm', '-png', '-r', str(DPI), '-gray', pdf, V + tag], check=True)
    return sorted(glob.glob(V + tag + '-*.png'), key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0]))


def form2_pages(pdf, n):
    """ہر صفحے کا متن — اندرونی ضمنی کا فارم نمبر 25—54(2) (pdftotext اردو الٹی ترتیب میں نکالتا ہے: «)2(54—25»)"""
    out = []
    for i in range(1, n + 1):
        t = subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), pdf, '-'], capture_output=True, text=True).stdout
        t = re.sub('[\u200e\u200f\u202a-\u202e\u2066-\u2069]', '', t)   # v581: فارم نمبر LTR خانے میں — pdftotext سمت کے نشان ڈالتا ہے
        if re.search(r'[()]2[()]\s*54|54\s*[()]\s*2(?![0-9])', t): out.append(i)
    return out


def paper_page(b, html, cw, name):
    """کاغذ (چھپائی کا HTML) — اسی چوڑائی پر جو چھپائی میں، چھپائی کے قاعدے لاگو"""
    fn = os.path.join(HERE, '..', '..', '_v580_' + name + '.html')
    open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + html)
    c = b.new_context(viewport={'width': int(cw), 'height': 1200}); c.route('**/*', route); q = c.new_page()
    q.goto(BASE + '_v580_' + name + '.html'); q.wait_for_timeout(1200); q.evaluate('document.fonts.ready')
    q.emulate_media(media='print'); q.wait_for_timeout(400)
    return c, q, fn


def relogin(pg):
    pg.wait_for_timeout(2500)
    pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    pg.wait_for_timeout(2500)
    pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
    pg.wait_for_timeout(300)


# شیئر کا اصل راستہ: DIO.share.capturePrint (کھلی دستاویز کا اپنا پرنٹ) → PDF / Word
SHARE = """async ([k, call]) => { await dioLoadScript('dio-forms.js'); await dioLoadScript('dio-share.js');
  window.__dioPaperAuto = 'keep'; const html = (await DIO.share.capturePrint(() => { (0, eval)(call); })).html; window.__dioPaperAuto = undefined;
  const blob = k === 'pdf' ? await DIO.share.pdf({ html }, 'v580') : await DIO.share.word({ html }, 'v580');
  const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return btoa(s); }"""


def grab(pg, call, paper):
    pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
    pg.evaluate("(c) => { (0, eval)(c); return 0; }", call)
    pick_paper(pg, paper)
    for _ in range(200):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    return pg.evaluate("window.__snaps[0] || ''")


def run(desktop):
    tag = 'desktop' if desktop else 'mobile'
    paper = 'legal' if desktop else 'a4'
    with sync_playwright() as p:
        b = p.chromium.launch()
        vp = {'width': 1366, 'height': 768} if desktop else {'width': 390, 'height': 844}
        extra = {} if desktop else {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
        ctx, pg, errs = open_app(b, viewport=vp, **extra)
        ctx.add_init_script(KEEP_DB)
        pg.evaluate("window.confirm = () => true; 0")

        # ═══ 1) بیرونی ضمنی — اسکرین ═══
        open_zimni(pg)
        nb = pg.evaluate(fill_js(NB, 3)); pg.wait_for_timeout(1800)
        st = pg.evaluate(STYLE, BODY)
        js = judge(pg.evaluate(LINES, BODY))
        check(f'{tag} اسکرین: بیرونی ضمنی کا ہر اندراج justify، آخری سطر دائیں، متن پر kerning بند ({nb} اندراج)',
              nb == NB and st and all(x == ['justify', 'right', 'none'] for x in st), st[:3])
        check(f'{tag} اسکرین: ہر سطر دونوں کناروں تک ({js["full"]} سطریں)، کوئی لفظ جُڑا نہیں (خالی جگہ ≥ 0.185em، موبائل پر ±0.01)',
              not js['notFull'] and js['full'] >= 60 and js['minSpaceEm'] is not None and js['minSpaceEm'] >= 0.185, js)
        gs = pg.evaluate(GAPS)
        check(f'{tag} اسکرین: بلاک سے بلاک کا فاصلہ ≈10px (پہلے 21px) — {sorted(set(gs))[:6]}', len(gs) >= 10 and all(8 <= g <= 13 for g in gs), gs[:12])
        o1 = pg.evaluate(ORDER, '0300-1234567')
        check(f'{tag} اسکرین (7): موبائل نمبر 0300-1234567 سیدھا (بائیں سے دائیں)، الٹا نہیں — کھولتے / لکھتے ہی',
              len(o1) >= 10 and all(x['ltr'] and x['span'] for x in o1), o1[:4])
        # افسر کی طرح اصل کی بورڈ سے لکھنا: نمبر لکھ کر رکنا، پھر لکھنا جاری — کرسر اپنی جگہ، کوئی حرف ادھر ادھر نہیں
        pg.evaluate("""(() => { const e = [...document.querySelectorAll('#ch173-doc tr.zf-blk .zf-body')].pop(); e.scrollIntoView({ block: 'center' }); e.focus();
            const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()""")
        pg.keyboard.type(' شناختی کارڈ 36302-1234567-1'); pg.wait_for_timeout(1500)
        pg.keyboard.type(' اور فون 0321-7654321'); pg.wait_for_timeout(1500)
        pg.keyboard.type(' سے رابطہ کیا گیا۔'); pg.wait_for_timeout(1500)
        seq = pg.evaluate("document.getElementById('ch173-doc').textContent.indexOf('شناختی کارڈ 36302-1234567-1 اور فون 0321-7654321 سے رابطہ کیا گیا۔')")
        o2 = pg.evaluate(ORDER, '0321-7654321') + pg.evaluate(ORDER, '36302-1234567-1')
        pg.evaluate("[...document.querySelectorAll('#ch173-doc tr.zf-blk')].pop().scrollIntoView({ block: 'center' }); 0"); pg.wait_for_timeout(300)
        pg.screenshot(path=V + f'{tag}_01_screen_numbers.png')
        check(f'{tag} اسکرین (7): لکھتے وقت شناختی کارڈ اور فون نمبر سیدھے؛ لکھنا جاری رہا تو تحریر اسی ترتیب میں (کرسر اپنی جگہ)',
              seq >= 0 and len(o2) == 2 and all(x['ltr'] and x['span'] for x in o2), (seq, o2))

        # ═══ 2) محفوظ → reload ═══
        if desktop:
            pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('Control+s')
        else:
            pg.evaluate("document.getElementById('zf-save-btn').click()")
        pg.wait_for_timeout(2500)
        sv = pg.evaluate("(window.__db.zimni_reports || []).slice(-1).map(r => ({ id: r.id, h: (r.content || {}).bodyHtml || '' }))")
        sh = sv[0]['h'] if sv else ''
        check(f'{tag} محفوظ (7): محفوظ تحریر میں کوئی نیا نشان نہیں (dio-ltrn نہیں) — نمبر جوں کے توں لکھے ہوئے',
              bool(sv) and 'dio-ltrn' not in sh and '0300-1234567' in sh and '0321-7654321' in sh and '36302-1234567-1' in sh, len(sh))
        ed_rows = pg.evaluate(ROWS)
        pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); sessionStorage.setItem('__v580db', JSON.stringify(window.__db)); 0")
        pg.reload(); relogin(pg); pg.evaluate("window.confirm = () => true; 0")
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800)
        pg.evaluate("(id) => { _openZimni(id); return 0; }", sv[0]['id'] if sv else ''); pg.wait_for_timeout(3500)
        rr = pg.evaluate(ROWS)
        o3 = pg.evaluate(ORDER, '0321-7654321') + pg.evaluate(ORDER, '0300-1234567')
        check(f'{tag} reload → محفوظ ضمنی کھولی: ہر اندراج (وقت، سیریل، متن) وہی؛ نمبر پھر بھی سیدھے',
              len(rr) == NB and [(x['act'], x['sn'], x['b']) for x in rr] == [(x['act'], x['sn'], x['b']) for x in ed_rows] and len(o3) >= 10 and all(x['ltr'] for x in o3),
              (len(rr), o3[:3]))

        # ═══ 3) پرنٹ ═══
        asked, h = capture(pg, 'button', paper)
        open(V + f'{tag}_print.html', 'w', encoding='utf-8').write(h)
        check(f'{tag} پرنٹ: کاغذ پوچھا ({paper})، @page اوپر 1cm، نیچے 0.4cm (پہلے 0.6cm)',
              asked and bool(re.search(r'@page\{\s*size:[^;]+;\s*margin:1cm 0 0\.4cm 0;', h)), re.findall(r'@page\{[^}]*\}', h)[:2])
        if desktop:
            ok2, h2 = capture(pg, 'ctrlp', paper)
            check(f'{tag} پرنٹ: Ctrl+P = «پرنٹ» بٹن (ایک ہی کاغذ)', ok2 and h2 == h, (len(h), len(h2)))
        cw = pg.evaluate("(h) => _dioPageGeo(h).cw", h)
        pdfp = html_pdf(b, h, V + f'{tag}_print.pdf'); npg = pdf_info(pdfp)[0]
        P = page_pngs(pdfp, f'{tag}_p'); contact(P, V + f'{tag}_02_print_pages.png')
        c2, q, fn = paper_page(b, h, cw, tag)
        try:
            marks = q.evaluate(MARKS); heads = q.evaluate(AHEAD); prow = q.evaluate(ROWS)
            jp = judge(q.evaluate(LINES, BODY)); pst = q.evaluate(STYLE, BODY)
            pre = q.evaluate(PRE); jpre = judge(q.evaluate(LINES, '#ch173-doc .zf-pgpre'), pre=True)
            gp = q.evaluate(GAPS); op = q.evaluate(ORDER, '0300-1234567') + q.evaluate(ORDER, '0321-7654321') + q.evaluate(ORDER, '36302-1234567-1')
        finally:
            c2.close(); os.remove(fn)
        # صفحہ n کا آغاز = marks[n−2]؛ سرنامہ والے صفحات
        hp = [i + 2 for i, m in enumerate(marks) if m == 'tr.zf-ahead']
        want = [n for n in range(3, npg + 1, 2)]
        check(f'{tag} پرنٹ ({paper}، {npg} صفحات): صفحہ {", ".join(map(str, want))} پر اندرونی ضمنی کا سرنامہ — صرف طاق صفحات (3 سے)، صفحہ 1، 2، 4 … پہلے جیسے',
              npg >= 5 and len(marks) + 1 == npg and hp == want, (npg, marks))
        f2 = form2_pages(pdfp, npg)
        check(f'{tag} پرنٹ (PDF کا متن): فارم نمبر 25—54(2) صفحہ {f2} پر — سادہ کاغذ کوئی نہیں', f2 == want, f2)
        check(f'{tag} پرنٹ: سرنامہ = پولیس فارم نمبر 25—54(2)، «اندرونی ضمنی»، مقدمہ نمبر / مورخہ / تھانہ اسی ضمنی کے؛ پورا جدول چوڑا',
              len(heads) == len(want) and all('25—54(2)' in x['form'] and x['title'].strip() == 'اندرونی ضمنی' and x['fir'] == '663/26' and x['fdate'] == '15/10/2026'
                                                and 'صدر ملتان' in x['thana'] and x['colspan'] == 4 for x in heads), heads[:1])
        check(f'{tag} پرنٹ: سرنامے کے نیچے وہی بیرونی جدول جاری (بلاک کی قطار، اتنے ہی خانے)',
              heads and all(x['next'].startswith('zf-blk') and x['nextTds'] == x['blkTds'] == 3 for x in heads), [(x['next'], x['nextTds'], x['blkTds']) for x in heads])
        check(f'{tag} پرنٹ: تمام {NB} اندراج — وقت، سیریل نمبر اور ہر لفظ وہی (ٹوٹا اندراج سرنامے کے نیچے جاری، سیریل دوبارہ نہیں)',
              [(x['act'], x['sn'], x['b']) for x in prow] == [(x['act'], x['sn'], x['b']) for x in rr] and all(x['contEmpty'] for x in prow),
              [(i, x['parts']) for i, x in enumerate(prow) if x['parts'] > 1])
        check(f'{tag} پرنٹ: متن justify، آخری سطر دائیں، kerning بند؛ ہر سطر دونوں کناروں تک ({jp["full"]})، خالی جگہ ≥ 0.19em',
              pst and all(x == ['justify', 'right', 'none'] for x in pst) and not jp['notFull'] and jp['full'] >= 60 and (jp['minSpaceEm'] or 0) >= 0.19, jp)
        check(f'{tag} پرنٹ: صفحے کے توڑ سے پہلے کی سطر (اندراج اگلے صفحے پر جاری) بھی پوری — {len(pre["pre"])} جگہ',
              len(pre['pre']) >= 2 and all(x == ['justify', 'block'] for x in pre['pre']) and not jpre['notFull'] and all(w == 0 for w in pre['sp']), (pre, jpre))
        check(f'{tag} پرنٹ: بلاک سے بلاک کا فاصلہ ≈10px (پہلے 21px) — {sorted(set(gp))[:6]}', len(gp) >= 10 and all(8 <= g <= 13 for g in gp), gp[:12])
        check(f'{tag} پرنٹ (7): موبائل / شناختی کارڈ نمبر کاغذ پر سیدھے', len(op) >= 12 and all(x['ltr'] for x in op), op[:3])
        an = [analyze(x, 0.4) for x in P]
        check(f'{tag} پرنٹ: کھڑی لکیریں ہر صفحے پر نیچے کے حاشیے (0.4cm) تک', all(a['lines'] >= 2 and all(0.3 <= e <= 0.68 for e in a['line_end_cm']) for a in an[:-1]),
              [(a['lines'], a['line_end_cm']) for a in an])
        check(f'{tag} پرنٹ: کسی صفحے پر سیاہی 0.4cm کے حاشیے کے اندر نہیں (پرنٹر میں آخری سطر نہیں کٹتی)', all(a['low_cm'] >= 0.35 for a in an), [a['low_cm'] for a in an])
        ink = [ImageOps.invert(Image.open(x).convert('L')).point(lambda v: 255 if v > 60 else 0).getbbox() for x in P]
        check(f'{tag} پرنٹ: کوئی خالی صفحہ نہیں', all(ink), ink)

        # ═══ 4) شیئر: PDF اور Word ═══
        try:
            pdfb = base64.b64decode(pg.evaluate(SHARE, ['pdf', '_dioPrintCurrent()']))
            open(V + f'{tag}_share.pdf', 'wb').write(pdfb)
            S = page_pngs(V + f'{tag}_share.pdf', f'{tag}_s'); contact(S, V + f'{tag}_03_share_pdf.png')
            check(f'{tag} شیئر PDF: وہی کاغذ — صفحات اتنے ہی ({len(S)} = {npg})', len(S) == npg, (len(S), npg))
        except Exception as e:
            check(f'{tag} شیئر PDF', False, repr(e)[:300])
        try:
            wd = base64.b64decode(pg.evaluate(SHARE, ['word', '_dioPrintCurrent()'])).decode('utf-8', 'ignore')
            open(V + f'{tag}_share.doc', 'w', encoding='utf-8').write(wd)
            tds = re.findall(r'<td[^>]*style="(text-align:right;[^"]*)"[^>]*>\s*<div[^>]*style="([^"]*)"', wd)
            jt = [t for t in tds if 'text-align:justify' in t[1] and 'text-align-last:right' in t[1]]
            check(f'{tag} Word: ہر اندراج کے خانے کے اندر سیدھ لکھی ہوئی (justify، آخری سطر دائیں) — {len(jt)} خانے', len(jt) >= NB, tds[:2])
            check(f'{tag} Word (7): نمبر سیدھے — LTR خانہ لکھا ہوا', 'dir="ltr"' in wd and '0300-1234567' in wd, wd.count('dir="ltr"'))
            lo = V + 'lo/'; os.makedirs(lo, exist_ok=True)
            subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', lo, V + f'{tag}_share.doc'], capture_output=True, timeout=300)
            ok = os.path.exists(lo + f'{tag}_share.pdf')
            if ok:
                Wp = page_pngs(lo + f'{tag}_share.pdf', f'{tag}_w'); contact(Wp[:4], V + f'{tag}_04_word.png')
            check(f'{tag} Word فائل کھلتی ہے (LibreOffice)', ok)
        except Exception as e:
            check(f'{tag} Word', False, repr(e)[:300])

        # ═══ 5) بیان 161 — ڈیش والے ہندسے ═══
        try:
            pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
            pg.evaluate(SEED161)
            pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
            pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
            pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(1800)
            za_pick(pg, 'غلام رسول', 1400)
            pg.evaluate("""(() => { const e = [...document.querySelectorAll('#ch173-doc .zfa-wit-stmt')].pop(); e.scrollIntoView({ block: 'center' }); e.focus();
              const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()""")
            pg.keyboard.type(' میرا موبائل نمبر 0300-1234567 اور شناختی کارڈ نمبر 36302-1234567-1 ہے'); pg.wait_for_timeout(1500)
            pg.keyboard.type('، میں موقع پر موجود تھا۔'); pg.wait_for_timeout(1500)
            s1 = pg.evaluate(ORDER, '0300-1234567') + pg.evaluate(ORDER, '36302-1234567-1')
            sq = pg.evaluate("document.getElementById('ch173-doc').textContent.indexOf('0300-1234567 اور شناختی کارڈ نمبر 36302-1234567-1 ہے، میں موقع پر موجود تھا۔')")
            pg.screenshot(path=V + f'{tag}_05_161_numbers.png')
            check(f'{tag} بیان 161 اسکرین (7): موبائل اور شناختی کارڈ نمبر سیدھے، لکھنا جاری رہا تو تحریر اسی ترتیب میں', len(s1) == 2 and all(x['ltr'] and x['span'] for x in s1) and sq >= 0, (s1, sq))
            if desktop:
                pg.keyboard.press('Control+s')
            else:
                za_save(pg)
            pg.wait_for_timeout(2500)
            zh = pg.evaluate("(window.__db.zimni_androoni_reports || []).filter(r => !r.deleted_at).map(r => (r.content || {}).bodyHtml || '').join('')")
            check(f'{tag} بیان 161 محفوظ (7): تحریر میں کوئی نیا نشان نہیں، نمبر جوں کے توں', bool(zh) and 'dio-ltrn' not in zh and '0300-1234567' in zh and '36302-1234567-1' in zh, len(zh))
            h161 = grab(pg, '_printZimniA()', paper)
            cw2 = pg.evaluate("(h) => _dioPageGeo(h).cw", h161)
            c3, q3, fn3 = paper_page(b, h161, cw2, tag + '_161')
            try:
                s2 = q3.evaluate(ORDER, '0300-1234567') + q3.evaluate(ORDER, '36302-1234567-1')
            finally:
                c3.close(); os.remove(fn3)
            check(f'{tag} بیان 161 پرنٹ (7): نمبر کاغذ پر سیدھے', len(s2) == 2 and all(x['ltr'] for x in s2), s2)
        except Exception as e:
            check(f'{tag} بیان 161: حصہ رک گیا', False, repr(e)[:400])

        check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:4])
        b.close()


only = os.environ.get('DIO_ONLY')
if only != 'mobile': run(True)
if only != 'desktop': run(False)
f = [r for r in R if r[0] == 'FAIL']
print(f'\nRESULT: {len(R) - len(f)} PASS, {len(f)} FAIL')
sys.exit(1 if f else 0)
