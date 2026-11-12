"""(v579) TASK 7-C11 — بیانات 161 ض ف کا متن پوری طرح justify (اردو دائیں سے، ہر پیراگراف کی آخری سطر دائیں) — اسکرین، پرنٹ،
PDF اور Word — الفاظ جُڑے بغیر؛ بیرونی ضمنی کی منسلک اندرونی شیٹ جوں کی توں۔ اصل ایپ (Desktop 1366×768 لیگل + Mobile 390×844 A4)،
صرف Supabase کی جگہ آزمائشی ڈیٹا۔

افسر کی ہدایت (12 نومبر 2026):
  11) «The text of بیانات 161 is not properly justified. Make it fully justified (Urdu RTL, last line of each paragraph aligned
      right) on screen, print, PDF and Word — without making words join.»
  10) منسلک اندرونی شیٹ (بیرونی ضمنی) بالکل ویسی — الگ کوڈ / CSS
ناپ: ہر سطر کا بایاں سرا (RTL میں سطر کا آخر) کاغذ کے بائیں کنارے تک (justify) — آخری سطر نہیں؛ الفاظ کے بیچ کی ہر خالی جگہ
     ≥ 0.19em (جُڑے الفاظ نہیں)؛ صفحے کے توڑ سے پہلے کی سطر بھی پوری؛ Word میں خانے کے اندر سیدھ لکھی ہوئی، LibreOffice سے کھول کر۔
چلانا: `python3 v579_test.py` — ایک ہی: DIO_ONLY=desktop|mobile
"""
from v564_common import *
import base64
from PIL import ImageOps

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v579/'
os.makedirs(V, exist_ok=True)
SRC = open(HERE + '/v558_test.py', encoding='utf-8').read()
LONG = 'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض موضع سید پور تحصیل شجاع آباد ضلع ملتان'
exec(SRC[SRC.index('SEED = """'):SRC.index('HOOK = """')])          # وہی آزمائشی مقدمہ (مدعی، محرر، دو گواہ)
OLD = open(HERE + '/v568_old_body.js', encoding='utf-8').read()
STMT = ('میں موقع پر موجود تھا اور ملزمان کو موٹر سائیکل پر فرار ہوتے دیکھا۔ ملزمان کو سامنے آنے پر شناخت کر سکتا ہوں۔ '
        'محمد اسلم ASI نے میرا بیان قلمبند کیا اور مورخہ 15/10/2026 کو میرے سامنے نقشہ موقع بھی تیار کیا۔ ')

# ہر بیان کے پیراگراف کی سطریں: بایاں سرا (RTL میں سطر کا آخر)، اور خالی جگہوں کی چوڑائی (em)؛ مثل کی مثلث کے ساتھ والی سطریں الگ
LINES = r"""(sel) => { const out = [];
  const tris = [...document.querySelectorAll('#ch173-doc .zfa-bindmark')].map(t => t.getBoundingClientRect()).filter(r => r.height);
  // موبائل پر کاغذ چھوٹا کر کے دکھایا جاتا ہے (transform) — ہر ناپ کاغذ کی اصل اکائی میں
  const D = document.getElementById('ch173-doc'), k = (D && D.offsetWidth) ? D.getBoundingClientRect().width / D.offsetWidth : 1;
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
      const sp = ln.cs.filter(c => c.c === ' ' || c.c === ' ').slice(0, -1).map(c => c.w / fs);   // سطر کے آخر کی لٹکی جگہ نہیں
      out.push({ p: pi, i, last: i === lines.length - 1, gapL: +((Math.min(...ink.map(c => c.l)) - L) / k).toFixed(1),
        tri: tris.some(t => ln.y >= t.top - fs && ln.y <= t.bottom + fs), sp: sp.length ? +Math.min(...sp).toFixed(3) : null });
    });
  }); return out; }"""
STYLE = r"""(sel) => [...document.querySelectorAll(sel)].map(e => { const s = getComputedStyle(e); return [s.textAlign, s.textAlignLast, s.fontKerning]; })"""


def judge(lines):
    """justify: ہر غیر آخری سطر بائیں کنارے تک (≤ 3px)؛ آخری سطریں دائیں سیدھ؛ خالی جگہ ≥ 0.19em"""
    body = [x for x in lines if not x['last'] and not x['tri']]
    bad = [x for x in body if x['gapL'] > 3]
    sp = [x['sp'] for x in lines if x['sp'] is not None]
    lastR = [x for x in lines if x['last'] and x['gapL'] > 3]
    return {'lines': len(lines), 'full': len(body) - len(bad), 'notFull': [(x['p'], x['i'], x['gapL']) for x in bad][:6],
            'minSpaceEm': min(sp) if sp else None, 'lastShortRight': len(lastR)}


def stmt_type(pg, txt):
    """بیان کے خانے کے آخر میں لکھو — پہلا حصہ اصل کی بورڈ سے، باقی (لمبا) insertText سے (وہی جو کی بورڈ کرتا ہے)"""
    pg.evaluate("""(() => { const e = [...document.querySelectorAll('#ch173-doc .zfa-wit-stmt')].pop(); e.scrollIntoView({ block: 'center' }); e.focus();
      const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()""")
    pg.keyboard.type(' ' + STMT[:60])
    pg.evaluate("(t) => { document.execCommand('insertText', false, t); return 0; }", STMT[60:] + txt)
    pg.wait_for_timeout(600)


def paper_page(b, html, cw, name):
    """کاغذ (چھپائی کا HTML) — اسی چوڑائی پر جو چھپائی میں (geo.cw)، چھپائی کے قاعدے لاگو"""
    fn = os.path.join(HERE, '..', '..', '_v579_' + name + '.html')
    open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + html)
    c = b.new_context(viewport={'width': int(cw), 'height': 1200}); c.route('**/*', route); q = c.new_page()
    q.goto(BASE + '_v579_' + name + '.html'); q.wait_for_timeout(1200); q.evaluate('document.fonts.ready')
    q.emulate_media(media='print'); q.wait_for_timeout(400)
    return c, q, fn


def grab_print(pg, paper):
    pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
    pg.evaluate("_printZimniA(); 0")
    pick_paper(pg, paper)
    for _ in range(200):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    return pg.evaluate("window.__snaps[0] || ''")


# شیئر کا اصل راستہ: «⋯ → شیئر» / فہرست کا «شیئر» = DIO.share.fromPrint → capturePrint (بیان کا اپنا پرنٹ) → PDF / Word
SHARE = """async ([k]) => { await dioLoadScript('dio-forms.js'); await dioLoadScript('dio-share.js');
  window.__dioPaperAuto = 'keep'; const html = (await DIO.share.capturePrint(() => _printZimniA())).html; window.__dioPaperAuto = undefined;
  const blob = k === 'pdf' ? await DIO.share.pdf({ html }, 'بیان 161') : await DIO.share.word({ html }, 'بیان 161');
  const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 32768) s += String.fromCharCode.apply(null, buf.subarray(i, i + 32768)); return btoa(s); }"""


def run(desktop):
    tag = 'desktop' if desktop else 'mobile'
    paper = 'legal' if desktop else 'a4'
    with sync_playwright() as p:
        b = p.chromium.launch()
        vp = {'width': 1366, 'height': 768} if desktop else {'width': 390, 'height': 844}
        extra = {} if desktop else {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
        ctx, pg, errs = open_app(b, viewport=vp, **extra)
        pg.evaluate("window.confirm = () => true; 0")
        pg.evaluate(SEED)

        # ═══ اسکرین ═══
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
        pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(1800)
        za_pick(pg, 'احمد علی', 1400)
        stmt_type(pg, STMT * (22 if desktop else 26))
        pg.keyboard.press('Enter'); pg.keyboard.type('دوسرا پیراگراف: ' + STMT[:90]); pg.wait_for_timeout(400)
        pg.evaluate("(t) => { document.execCommand('insertText', false, t); return 0; }", STMT[90:] + STMT * 2); pg.wait_for_timeout(900)
        za_pick(pg, 'غلام رسول', 1400)
        stmt_type(pg, STMT * 3)
        pg.wait_for_timeout(900)
        st = pg.evaluate(STYLE, '#ch173-doc .zfa-wit-stmt')
        hd = pg.evaluate(STYLE, '#ch173-doc .zfa-wit-head, #ch173-doc .zfa-wit-sign, #ch173-doc .zfa-wit-close')
        js = judge(pg.evaluate(LINES, '#ch173-doc .zfa-wit-stmt'))
        pg.evaluate("document.querySelector('#ch173-doc .zfa-wit-stmt').scrollIntoView({block:'start'}); 0"); pg.wait_for_timeout(300)
        pg.screenshot(path=V + f'{tag}_01_screen.png')
        check(f'{tag} 11 اسکرین: بیان کا متن justify، آخری سطر دائیں (پہلے index.html کا «div → دائیں» لگتا تھا)؛ متن پر kerning بند',
              st and all(x == ['justify', 'right', 'none'] for x in st), st)
        check(f'{tag} 11 اسکرین: ہر سطر دونوں کناروں تک ({js["full"]} سطریں)، ہر پیراگراف کی آخری سطر دائیں، کوئی لفظ جُڑا نہیں (خالی جگہ ≥ 0.19em)',
              not js['notFull'] and js['full'] >= 20 and js['lastShortRight'] >= 3 and js['minSpaceEm'] is not None and js['minSpaceEm'] >= 0.19, js)
        check(f'{tag} 10/11 عنوان، دستخط، «بیان سن لیا…» — اپنی سیدھ اور 27 اکتوبر والی kerning (خودکار)',
              hd and all(x[2] == 'auto' for x in hd) and {x[0] for x in hd} >= {'right', 'left', 'center'}, hd)

        # ═══ پرنٹ (افسر کا راستہ: «⋯ → پرنٹ» = Ctrl+P، کاغذ کے انتخاب سمیت) ═══
        h = grab_print(pg, paper)
        cw = pg.evaluate("(h) => _dioPageGeo(h).cw", h)
        open(V + f'{tag}_print.html', 'w', encoding='utf-8').write(h)
        pdfp = html_pdf(b, h, V + f'{tag}_print.pdf'); P = pages_png(pdfp, V + f'{tag}_print', 70)
        c2, q, fn = paper_page(b, h, cw, tag)
        try:
            jp = judge(q.evaluate(LINES, '#ch173-doc .zfa-wit-stmt'))
            pre = q.evaluate("[...document.querySelectorAll('#ch173-doc .zfa-pgpre')].map(e => [getComputedStyle(e).textAlignLast, getComputedStyle(e).display])")
            jpre = judge(q.evaluate(LINES, '#ch173-doc .zfa-pgpre'))
            # توڑ سے پہلے کی آخری سطر — کاغذ کے بائیں کنارے تک
            preLast = [x for x in q.evaluate(LINES, '#ch173-doc .zfa-pgpre') if x['last']]
            # توڑ سے پہلے کی آخری خالی جگہ اگلے صفحے کی پہلی سطر کے شروع میں — وہاں کوئی جگہ نہیں لیتی (سطر دائیں کنارے سے شروع)
            gsp = q.evaluate("[...document.querySelectorAll('#ch173-doc .zfa-pgsp')].map(g => { const r = document.createRange(); r.selectNodeContents(g); return +[...r.getClientRects()].reduce((a, x) => a + x.width, 0).toFixed(1); })")
            pst = q.evaluate(STYLE, '#ch173-doc .zfa-wit-stmt')
        finally:
            c2.close(); os.remove(fn)
        contact(P, V + f'{tag}_print_sheet.png')
        check(f'{tag} 11 پرنٹ ({paper}، {len(P)} صفحے): justify، آخری سطر دائیں، kerning بند؛ ہر سطر دونوں کناروں تک ({jp["full"]})، خالی جگہ ≥ 0.19em',
              len(P) >= 2 and pst and all(x == ['justify', 'right', 'none'] for x in pst) and not jp['notFull'] and jp['full'] >= 20
              and jp['minSpaceEm'] >= 0.19 and jp['lastShortRight'] >= 3, (len(P), jp))
        check(f'{tag} 11 پرنٹ: صفحے کے توڑ سے پہلے کی سطر (پیراگراف اگلے صفحے پر جاری) بھی پوری — دائیں سیدھ میں ادھوری نہیں',
              len(pre) >= 1 and all(x == ['justify', 'block'] for x in pre) and preLast and all(x['gapL'] <= 3 for x in preLast)
              and all(w == 0 for w in gsp), (pre, preLast[:3], gsp))
        # Ctrl+P = وہی کاغذ
        pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
        pg.click('#ch173-doc .zfa-wit-stmt'); pg.keyboard.press('End'); pg.keyboard.press('Control+p'); pick_paper(pg, paper)
        for _ in range(200):
            if pg.evaluate("window.__snaps.length"): break
            pg.wait_for_timeout(200)
        h2 = pg.evaluate("window.__snaps[0] || ''")
        check(f'{tag} پرنٹ: Ctrl+P = «⋯ → پرنٹ» (ایک ہی کاغذ)', bool(h2) and h2 == h, (len(h), len(h2)))

        # ═══ شیئر: PDF اور Word (وہی کاغذ جو پرنٹ) — دونوں آلات ═══
        if True:
            try:
                pdfb = base64.b64decode(pg.evaluate(SHARE, ['pdf']))
                open(V + f'{tag}_share.pdf', 'wb').write(pdfb)
                S = pages_png(V + f'{tag}_share.pdf', V + f'{tag}_share', 70)
                # شیئر کی PDF اسی پرنٹ HTML کی تصویر ہے (وہی سطریں) — صفحات اتنے ہی، ہر صفحے پر متن؛ صفحے کے کنارے / حاشیے
                #   شیئر کے اپنے (پہلے سے ایسے) — اس لیے pixel موازنہ نہیں، تصاویر ساتھ ساتھ محفوظ
                ink = [ImageOps.invert(Image.open(c).convert('L')).point(lambda v: 255 if v > 60 else 0).getbbox() for c in S]
                contact(S, V + f'{tag}_share_pdf_sheet.png')
                check(f'{tag} 11 PDF (شیئر): پرنٹ والا کاغذ — صفحات اتنے ہی ({len(S)} = {len(P)})، ہر صفحے پر متن', len(S) == len(P) and all(ink), (len(S), len(P), ink))
            except Exception as e:
                check(f'{tag} 11 PDF (شیئر)', False, repr(e)[:300])
            try:
                wd = base64.b64decode(pg.evaluate(SHARE, ['word'])).decode('utf-8', 'ignore')
                open(V + f'{tag}_share.doc', 'w', encoding='utf-8').write(wd)
                i = wd.find('<table'); seg = wd[i:]
                td = re.search(r'<td style="text-align:right;[^"]*">\s*<div style="text-align:justify;[^"]*text-align-last:right', seg)
                check(f'{tag} 11 Word: جدول کے خانے کے اندر بیان کی سیدھ صاف لکھی ہوئی (justify، آخری سطر دائیں) — پہلے صرف سب سے باہر تھی',
                      bool(td), seg[:300] if not td else '')
                lo = V + 'lo/'; os.makedirs(lo, exist_ok=True)
                subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', lo, V + f'{tag}_share.doc'], capture_output=True, timeout=300)
                ok = os.path.exists(lo + f'{tag}_share.pdf')
                if ok:
                    Wp = pages_png(lo + f'{tag}_share.pdf', V + f'{tag}_word', 70); contact(Wp, V + f'{tag}_word_sheet.png')
                check(f'{tag} 11 Word فائل کھلتی ہے (LibreOffice)', ok)
            except Exception as e:
                check(f'{tag} 11 Word', False, repr(e)[:300])

        # ═══ 10) بیرونی ضمنی کی منسلک اندرونی شیٹ — جوں کی توں ═══
        try:
            pg.evaluate(OLD + '; 0')
            pg.evaluate("""([txt]) => { const o = currentOfficer || {}; const c = window.__db.cases.find(x => x.id === 'c1');
                _zimniActive = { serial_no: 1 }; let h = window.__oldZimniBody(o, c);
                const t = document.createElement('template'); t.innerHTML = h;
                t.content.querySelector('.zf-actbody').textContent = '05/09/2026';
                t.content.querySelector('.zf-body').innerHTML = 'جناب عالیٰ! ' + Array.from({length: 14}, (_, i) => '<div>' + (i + 1) + '۔ ' + txt + '</div>').join('');
                t.content.querySelector('[data-k="io_date"]').textContent = '05/09/2026';
                window.__db.zimni_reports.push({ id: 'z1', case_id: 'c1', serial_no: 1, report_date: '2026-09-05', officer_id: 'o1', rev: 1,
                  content: { bodyHtml: t.innerHTML, head: 'رپورٹ ضمنی', serial_no: 1, saved_at: '2026-09-01T10:00:00Z' }, created_at: '2026-09-01T10:00:00Z' });
                _zimniActive = null; return 0; }""", [' '.join(PARA)])
            pg.evaluate("_zaClose()"); pg.wait_for_timeout(1200)
            pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800)
            pg.evaluate("_openZimni('z1'); 0"); pg.wait_for_timeout(3500)
            att = pg.evaluate("""(() => { const b = document.querySelector('#ch173-doc .zf-androoni .zfa-body'); if (!b) return null; const s = getComputedStyle(b);
                const st = document.querySelector('#ch173-doc .zf-androoni .zfa-wit-stmt, #ch173-doc .zf-androoni .zfa-body > div');
                return { kern: s.fontKerning, ta: s.textAlign, css: [...document.querySelectorAll('style')].some(x => /zfa-pgpre|v579/.test(x.textContent)) }; })()""")
            pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
            pg.evaluate("_dioPrintCurrent(); 0"); pick_paper(pg, paper)
            for _ in range(200):
                if pg.evaluate("window.__snaps.length"): break
                pg.wait_for_timeout(200)
            hz = pg.evaluate("window.__snaps[0] || ''")
            check(f'{tag} 10: بیرونی ضمنی کی منسلک اندرونی شیٹ — کوئی نیا قاعدہ نہیں (kerning خودکار، justify / v579 کی CSS نہیں، کاغذ پر zfa-pgpre نہیں)',
                  att and att['kern'] == 'auto' and not att['css'] and 'zf-androoni' in hz and 'zfa-pgpre' not in hz and 'font-kerning:none' not in hz, att)
        except Exception as e:
            check(f'{tag} 10: منسلک اندرونی شیٹ', False, repr(e)[:300])
        check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:4])
        b.close()


only = os.environ.get('DIO_ONLY')
if only != 'mobile': run(True)
if only != 'desktop': run(False)
f = [r for r in R if r[0] == 'FAIL']
print(f'\nRESULT: {len(R) - len(f)} PASS, {len(f)} FAIL')
sys.exit(1 if f else 0)
