"""(v555) اصل ایپ کی جانچ — Desktop + Mobile، اسکرین + پرنٹ (لیگل اور A4)

افسر کی فہرست (v555، 21 اکتوبر 2026):
  1) RFA فارم کا دوسرا صفحہ (Annex-C — Feedback Form) ختم — RFA ایک صفحہ
  2) سزا سلپ اور ضمنی: ٹیبل کی کھڑی لکیریں آخری اندراج پر نہ رکیں — حاشیے کے اصول کے مطابق
     ہر صفحے کے نیچے تک
  3) ضمنی بیرونی، کالم 3: «مرتبہ» (IO کا نام) والی سطر کے نیچے صرف معمولی جگہ؛ کالم 1 (تاریخ)
     اور کالم 2 (نمبر) «جناب عالیٰ» کی سیدھ میں
  4) ضمنی، قطار 1: کالم 4 («از۔») صرف ضرورت جتنا — بچی جگہ کالم 3 کو
  5) ضمنی ایک صفحے سے زیادہ: مثل باندھنے کی 2pt لکیر صرف صفحہ 2، 4، 6 … کے اوپر بائیں کونے
     میں — پہلے صفحے کے بیچ میں کبھی نہیں؛ لیگل اور A4 دونوں پر
  6) ضمنی نمبر: خانے میں جو لکھا ہے (بدلا ہو یا نہیں) اسی نمبر پر محفوظ؛ نئی ضمنی کا نمبر
     = محفوظ شدہ میں سب سے بڑا + 1 (چھوڑے ہوئے مسودے نہیں گنے جاتے)
  7) ایک تاریخ کی ایک ضمنی / ایک نمبر کی ایک ضمنی — پہلے سے محفوظ ہو تو خبردار، محفوظ نہیں،
     اور درستی کا خانہ نمایاں؛ درست کرنے پر محفوظ
  8) IO کے نام/عہدہ/تھانہ والی سطر سے اوپر کا پیراگراف انگریزی عہدے (ASI) سے شروع ہو تو بھی
     اردو اپنی جگہ (RTL) — عہدہ دائیں، بعد کی اردو اُس کے بائیں

جانچ کا طریقہ: ہر پرنٹ اصل ایپ کے اپنے بٹن والے راستے سے (کاغذ کا انتخاب → تیاری → چھپائی
  کا خانہ) — print() کے لمحے کا کاغذ اٹھا کر PDF؛ ہر صفحے کی تصویر میں (72dpi) کھڑی لکیروں کا
  نچلا سرا اور اوپر بائیں کونے کا وتر (مثل کی جگہ) ناپا جاتا ہے۔

چلانا: README.md — `python3 v555_test.py` (poppler درکار: pdftoppm / pdfinfo)
"""
import sys, os, re, json, subprocess, glob
sys.path.insert(0, '.')
from real import *
from PIL import Image

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v555/'
os.makedirs(V, exist_ok=True)
DPI = 72

SEED = """((n) => { const d = window.__db;
  const c1 = d.cases.find(c => c.id === 'c1');
  Object.assign(c1, { fir_number:'663/26', fir_date:'15/10/2026', occurrence_date:'22/09/2026', section_of_law:'379 ت پ',
    complainant:'محمد امجد حسین ولد عاشق حسین قوم آرائیں سکنہ بیرون دہلی گیٹ ملتان', case_station:'صدر ملتان', case_district:'ملتان' });
  d.case_accused = [];
  for (let i = 0; i < n; i++) d.case_accused.push({ id:'a'+(i+1), case_id:'c1', name:'ملزم نمبر '+(i+1)+' ولد فلاں قوم آرائیں سکنہ بیرون دہلی گیٹ ملتان',
    pesha:'مزدوری', arrest_date:'2026-10-1'+(i%9), accused_type:'fir', created_at:'2026-10-0'+(1+i%9) });
  d.zimni_reports = [];
  ['dio_zimni_c1', 'dio_zimni_draft_c1', 'dio_saza_c1'].forEach(k => localStorage.removeItem(k));
  return Promise.all(d.cases.map(c => offlineStore.cache('cases_cache', JSON.parse(JSON.stringify(c))))).then(() => 0); })"""

# print() کے لمحے کا کاغذ (اصل چھپائی کا خانہ #dio-print-frame)
HOOK = """(() => { window.__snaps = [];
  if (window.__snapObs) return 0;
  window.__snapObs = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.id === 'dio-print-frame') { const w = n.contentWindow; w.print = function () { window.__snaps.push(w.document.documentElement.outerHTML); }; }
  })));
  window.__snapObs.observe(document.body, { childList: true }); return 0; })()"""
TOASTS = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"""
PARA = 'دوران تفتیش موقع پر پہنچ کر گواہان کے بیانات قلمبند کیے گئے اور نقشہ موقع مرتب کیا گیا۔ ملزمان کی تلاش جاری ہے اور مخبر خاص کو اطلاع دی گئی۔ '


def printed(pg, js, paper):
    pg.evaluate(HOOK)
    pg.evaluate("window.__snaps = []; 0")
    pg.evaluate(f"window.__dioPaperAuto = '{paper}'; 0")
    pg.evaluate(js)
    for _ in range(100):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
    return pg.evaluate("window.__snaps[0] || ''")


def to_pdf(b, html, name):
    fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_v555_' + name + '.html')
    open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + html)
    c = b.new_context(); c.route('**/*', route); q = c.new_page()
    q.goto(BASE + '_v555_' + name + '.html'); q.wait_for_timeout(1200); q.evaluate('document.fonts.ready')
    q.pdf(path=V + name + '.pdf', prefer_css_page_size=True, print_background=True)
    c.close(); os.remove(fn)
    return V + name + '.pdf'


def pdf_pages(pdf):
    return int(subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout.split('Pages:')[1].split()[0])


def page_pngs(pdf, tag):
    for f in glob.glob(V + tag + '-*.png'): os.remove(f)
    subprocess.run(['pdftoppm', '-png', '-r', str(DPI), '-gray', pdf, V + tag], check=True)
    return sorted(glob.glob(V + tag + '-*.png'), key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0]))


def analyze(png, margin_bottom_cm):
    """کھڑی لکیریں (صفحے کے نچلے حصے میں) — ہر ایک کا نچلا سرا صفحے کے نیچے کے حاشیے سے کتنا اوپر؛
       اوپر بائیں کونے (3.2in) میں بائیں-نیچے سے دائیں-اوپر وتر کی سب سے لمبی مسلسل لکیر"""
    im = Image.open(png).convert('L'); W, H = im.size; px = im.load()
    dark = lambda x, y: 0 <= x < W and 0 <= y < H and px[x, y] < 140
    yb = H - int(round(margin_bottom_cm / 2.54 * DPI))
    y0, y1 = int(H * 0.55), yb - 10
    xs = [x for x in range(W) if sum(1 for y in range(y0, y1) if dark(x, y)) >= 0.97 * (y1 - y0)]
    groups = []
    for x in xs:
        if groups and x - groups[-1][-1] <= 2: groups[-1].append(x)
        else: groups.append([x])
    lines = [g[len(g) // 2] for g in groups]
    gaps = []
    for x in lines:
        y = y1
        while y < H and (dark(x, y) or dark(x - 1, y) or dark(x + 1, y)): y += 1
        gaps.append(yb - y)
    Rr = int(3.2 * DPI); best = 0; best_top = None
    for c in range(40, 2 * Rr):
        run = mx = 0; top = None
        for x in range(0, Rr):
            y = c - x
            if y < 0 or y >= Rr: run = 0; continue
            if dark(x, y) or dark(x, y - 1) or dark(x, y + 1): run += 1
            else: run = 0
            if run > mx: mx = run; top = y
        if mx > best: best = mx; best_top = top
    return {'lines': lines, 'gaps': gaps, 'diag': best, 'diag_top_in': round((best_top or 0) / DPI, 2)}


def page_checks(tag, what, pdf, mb_cm, min_lines, expect_pages=None):
    n = pdf_pages(pdf)
    if expect_pages is not None:
        check(f'{tag}: {what} — صفحات {expect_pages} (ہر صفحے کا توڑ حساب کے عین مطابق، فالتو صفحہ نہیں)', n == expect_pages, f'{n} / {expect_pages}')
    res = [analyze(p, mb_cm) for p in page_pngs(pdf, os.path.basename(pdf)[:-4])]
    bad_lines = [(i + 1, r['lines'], r['gaps']) for i, r in enumerate(res) if len(r['lines']) < min_lines or any(g > 8 for g in r['gaps'])]
    check(f'{tag}: {what} — ہر صفحے پر کھڑی لکیریں صفحے کے نیچے (حاشیے) تک', not bad_lines, bad_lines or [r['gaps'] for r in res])
    even_ok = all(r['diag'] >= 100 and r['diag_top_in'] <= 1.6 for i, r in enumerate(res) if (i + 1) % 2 == 0)
    odd_ok = all(r['diag'] < 45 for i, r in enumerate(res) if (i + 1) % 2 == 1)
    check(f'{tag}: {what} — مثل کی 2pt لکیر صرف جفت صفحات (2، 4 …) کے اوپر بائیں کونے میں؛ صفحہ 1 اور طاق صفحات پر نہیں',
          even_ok and odd_ok, [(i + 1, r['diag'], r['diag_top_in']) for i, r in enumerate(res)])
    return n, res


def ws(pg):
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)


def zimni_new(pg, date=None, blocks=None, extra=None):
    pg.evaluate("_newZimni()"); pg.wait_for_timeout(1300)
    if date:
        pg.evaluate("""(d) => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = d; a.dispatchEvent(new Event('input',{bubbles:true})); return 0; }""", date)
    if blocks:
        pg.evaluate("""([spec, para]) => { const doc = _zimniDoc();
          for (let i = 1; i < spec.length; i++) _zimniAddBlock();
          const bodies = doc.querySelectorAll('tr.zf-blk .zf-body');
          spec.forEach((n, i) => { bodies[i].textContent = (i === 0 ? 'جناب عالیٰ! بحوالہ رپورٹ ' : '') + Array.from({length: n}, () => para.repeat(4)).join('\\n'); });
          _zimniDirty = true; return 0; }""", [blocks, PARA])
    if extra:
        pg.evaluate("""(t) => { const b = document.querySelector('#ch173-doc .zf-body'); b.focus(); const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
            const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); return 0; }""", extra)
    pg.wait_for_timeout(300)


def save(pg):
    pg.evaluate("window.__toasts = []; 0")
    pg.evaluate("_saveZimni(false, true)"); pg.wait_for_timeout(1500)


def zrows(pg):
    return pg.evaluate("(window.__db.zimni_reports||[]).map(r => ({id:r.id, sn:r.serial_no, d:r.report_date}))")


def run(b, tag, ctxargs, mobile):
    ctx, pg, errs = open_app(b, **ctxargs)
    pg.evaluate(TOASTS)
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")

    # ═══ 1) RFA — ایک ہی صفحہ ═══
    try:
        pg.evaluate(SEED + "(1)"); ws(pg)
        pg.evaluate("_openMisalEditor('rfa_form')"); pg.wait_for_timeout(1800)
        pg.evaluate("_newRfa()"); pg.wait_for_timeout(1200)
        r = pg.evaluate("""(() => { const d = document.getElementById('rfa-doc'); return { pages: d.querySelectorAll('.rfa-page').length,
            c: /Annex-C|Feedback Form/.test(d.innerText), ab: /Annex-A/.test(d.innerText) && /Annex-B/.test(d.innerText) }; })()""")
        check(f'{tag}: RFA — ایک ہی صفحہ (Annex-A + Annex-B)، Annex-C / Feedback Form نہیں', r['pages'] == 1 and not r['c'] and r['ab'], r)
        h = printed(pg, "_printRfa()", 'keep')
        pdf = to_pdf(b, h, tag + '_rfa')
        txt = subprocess.run(['pdftotext', pdf, '-'], capture_output=True, text=True).stdout
        check(f'{tag}: RFA کا پرنٹ — ایک صفحہ، Annex-C / Feedback Form نہیں', pdf_pages(pdf) == 1 and 'Feedback' not in txt and 'Annex-C' not in txt and 'Annex-B' in txt, (pdf_pages(pdf), txt[:80]))
    except Exception as e:
        check(f'{tag}: RFA section crashed', False, repr(e)[:300])

    # ═══ 2) سزا سلپ — کھڑی لکیریں صفحے کے نیچے تک (لیگل/A4، ایک اور کئی صفحات) ═══
    for n_acc, paper in [(1, 'legal'), (22, 'legal'), (22, 'a4'), (34, 'a4')]:
        try:
            pg.evaluate(SEED + f"({n_acc})"); ws(pg)
            pg.evaluate("_openMisalEditor('saza_slip')"); pg.wait_for_timeout(2800)
            h = printed(pg, "_sazaPrint()", paper)
            name = f'{tag}_saza_{n_acc}_{paper}'
            fills = re.findall(r'<tr class="saza-fill">', h)
            mid = len(re.findall(r'<tr class="saza-fill">[\s\S]*?</tr>\s*<tr', h))       # بیچ کے (اگلے صفحے کی قطار سے پہلے)
            pdf = to_pdf(b, h, name)
            n, res = page_checks(tag, f'سزا سلپ {n_acc} ملزم ({paper})', pdf, 0.6, 3, expect_pages=mid + 1)
            check(f'{tag}: سزا سلپ {n_acc} ملزم ({paper}) — آخری صفحے پر SHO کے بعد خالی قطار (لکیریں نیچے تک)', len(fills) >= 1, len(fills))
            if n_acc > 1:
                rs = [int(x) for x in re.findall(r'rowspan="(\d+)"', h)]
                check(f'{tag}: سزا سلپ {n_acc} ملزم ({paper}) — تاریخ/جرم کے کھڑے خانے تمام ملزمان (اور بیچ کی خالی قطاروں) پر', rs and all(x == n_acc + mid for x in rs), (rs, mid))
        except Exception as e:
            check(f'{tag}: saza {n_acc} {paper} crashed', False, repr(e)[:300])

    # ═══ 3) ضمنی — شکل (کالم 4، «مرتبہ» کے نیچے جگہ، سیدھ) + انگریزی عہدے والا پیراگراف ═══
    try:
        pg.evaluate(SEED + "(1)"); ws(pg)
        pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(1200)
        zimni_new(pg, '19/10/2026', extra='موقع پر کارروائی کی گئی۔')
        # نیا پیراگراف انگریزی عہدے سے — ٹائپ کر کے (افسر کی طرح)
        pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('End'); pg.wait_for_timeout(200)
        pg.keyboard.press('Enter'); pg.keyboard.type('ASI '); pg.keyboard.type('فیاض حسین شاد تھانہ صدر ملتان نے رپورٹ مرتب کی۔'); pg.wait_for_timeout(400)
        BIDI = """() => { let asi = null, ur = null;
            const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
            while ((n = tw.nextNode())) { const v = n.nodeValue; const mm = /ASI[\\s\\u00a0]فیاض/.exec(v); if (!mm) continue; const i = mm.index;
              const r1 = document.createRange(); r1.setStart(n, i); r1.setEnd(n, i + 3); asi = r1.getBoundingClientRect();
              const r2 = document.createRange(); r2.setStart(n, i + 4); r2.setEnd(n, i + 8); ur = r2.getBoundingClientRect(); break; }
            return asi && ur ? { asi: Math.round(asi.left), ur: Math.round(ur.left), same: Math.abs(asi.top - ur.top) < 8 } : null; }"""
        bi = pg.evaluate(BIDI)
        check(f'{tag}: انگریزی عہدے (ASI) سے شروع پیراگراف — عہدہ دائیں، بعد کی اردو اُس کے بائیں (RTL) — ایڈیٹر', bool(bi) and bi['same'] and bi['asi'] > bi['ur'], bi)
        save(pg)
        h = printed(pg, "_printZimniCurrent()", 'legal')
        check(f'{tag}: ضمنی کا پرنٹ — تیار سادہ کاغذ (کوئی اسکرپٹ نہیں)', bool(h) and '<script' not in h, len(h))
        c2 = b.new_context(viewport={'width': 816, 'height': 1100}); c2.route('**/*', route); q = c2.new_page()
        fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_v555_m.html'); open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + h)
        q.goto(BASE + '_v555_m.html'); q.emulate_media(media='print'); q.wait_for_timeout(1200); q.evaluate('document.fonts.ready')
        m = q.evaluate("""(() => { const d = document.getElementById('ch173-doc');
          const tl = (el, last) => { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, v = null;
            while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
              for (const x of r.getClientRects()) { if (x.height < 2) continue; if (!last) return x; v = x; } } return v; };
          const tbl = d.querySelector('table.zf-tbl').getBoundingClientRect().width;
          const c4 = d.querySelector('th.zf-c-from').getBoundingClientRect().width, c3 = d.querySelector('th.zf-c-body').getBoundingClientRect().width;
          const mor = tl(d.querySelector('.zf-bl-mor'), true), body = tl(d.querySelector('tr.zf-blk .zf-body'), false);
          const act = tl(d.querySelector('tr.zf-blk .zf-actbody'), false), num = tl(d.querySelector('tr.zf-blk .zf-num'), false);
          const mid = (r) => (r.top + r.bottom) / 2;
          return { c4: +(c4 / tbl).toFixed(3), c3: +(c3 / tbl).toFixed(3), gap: Math.round(body.top - mor.bottom),
                   act: Math.round(mid(act) - mid(body)), num: Math.round(mid(num) - mid(body)) }; })()""")
        bi2 = q.evaluate(BIDI)
        c2.close(); os.remove(fn)
        check(f'{tag}: قطار 1 کا کالم 4 («از۔») صرف ضرورت جتنا (≤ 7%)، کالم 3 کھلا (≥ 70%)', m['c4'] <= 0.07 and m['c3'] >= 0.70, m)
        check(f'{tag}: «مرتبہ» (IO) کی سطر کے نیچے معمولی جگہ (≤ 12px، پہلے ~30px)', 0 <= m['gap'] <= 12, m['gap'])
        check(f'{tag}: کالم 1 (تاریخ) اور کالم 2 (نمبر) «جناب عالیٰ» کی پہلی سطر کی سیدھ میں (±4px)', abs(m['act']) <= 4 and abs(m['num']) <= 4, m)
        check(f'{tag}: انگریزی عہدے والا پیراگراف — پرنٹ میں بھی عہدہ دائیں، اردو بائیں (RTL)', bool(bi2) and bi2['same'] and bi2['asi'] > bi2['ur'], bi2)
    except Exception as e:
        check(f'{tag}: zimni layout section crashed', False, repr(e)[:300])

    # ═══ 4) ضمنی کئی صفحات — مثل کی لکیر صفحہ 2، 4 … پر؛ لکیریں نیچے تک (لیگل + A4) ═══
    for spec, paper in [([1], 'legal'), ([1], 'a4'), ([6], 'legal'), ([6], 'a4'), ([3, 4, 2, 5], 'legal'), ([3, 4, 2, 5], 'a4'), ([14, 6], 'legal'), ([14, 6], 'a4')]:
        try:
            pg.evaluate(SEED + "(1)"); ws(pg)
            pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(1200)
            zimni_new(pg, '19/10/2026', blocks=spec)
            save(pg)
            h = printed(pg, "_printZimniCurrent()", paper)
            brk = len(re.findall(r'class="dio-pgbrk"', h)); trb = len(re.findall(r'break-before: page', h))
            name = f'{tag}_zimni_{"-".join(map(str, spec))}_{paper}'
            pdf = to_pdf(b, h, name)
            n, res = page_checks(tag, f'ضمنی {spec} ({paper})', pdf, 1.0, 2, expect_pages=brk + trb + 1)
            check(f'{tag}: ضمنی {spec} ({paper}) — مثلث کی گنتی = جفت صفحات کی گنتی', len(re.findall(r'class="zf-bind"', h)) == n // 2, (n, len(re.findall(r'class="zf-bind"', h))))
        except Exception as e:
            check(f'{tag}: zimni {spec} {paper} crashed', False, repr(e)[:300])
    # فہرست کا «پرنٹ» اور «شیئر» بھی یہی تیار کاغذ
    try:
        zid = pg.evaluate("String((_zimniList[0]||{}).id||'')")
        h2 = printed(pg, f"_printZimniById('{zid}')", 'a4')
        check(f'{tag}: فہرست کا «پرنٹ» — وہی تیار کاغذ (اسکرپٹ نہیں، مثل کی جگہ لگی)', '<script' not in h2 and 'class="zf-bind"' in h2 and 'class="zf-fill"' in h2)
        sh = pg.evaluate("""async () => { await dioLoadScript('dio-forms.js'); await dioLoadScript('dio-share.js');
            const r = await DIO.share.capturePrint(() => _printZimniCurrent()); return r && r.html || ''; }""")
        check(f'{tag}: شیئر (PDF / Word) — پرنٹ والا تیار کاغذ', bool(sh) and '<script' not in sh and 'class="zf-bind"' in sh and 'class="zf-fill"' in sh)
    except Exception as e:
        check(f'{tag}: zimni list/share crashed', False, repr(e)[:300])

    # ═══ 4b) اندرونی ضمنی (بیانات 161) — 2pt لکیر صفحہ 2، 4 … پر، لکیریں نیچے تک، نمبر اپنے پیراگراف کی سیدھ میں ═══
    for mode, n_par, paper in [('auto', 14, 'legal'), ('auto', 14, 'a4'), ('auto', 30, 'legal'), ('auto', 30, 'a4'), ('wit', 3, 'legal'), ('wit', 4, 'a4')]:
        try:
            pg.evaluate(SEED + "(1)"); ws(pg)
            pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
            pg.evaluate("_newZimniA()"); pg.wait_for_timeout(1500)
            if mode == 'auto':   # پیراگراف + (پرانا) خودکار نمبر شمار
                pg.evaluate("""([n, para]) => { const b = document.querySelector('#ch173-doc .zfa-body');
                  b.innerHTML = Array.from({length: n}, (_, i) => '<div>' + (i+1) + '۔ ' + para.repeat(1 + (i % 3)) + '</div>').join('');
                  _zaAutoNumbers(); return 0; }""", [n_par, PARA])
            else:                # گواہان کے بیانات (اصل ایپ کا «بیان» بٹن) — لمبے بیان، نمبر شمار خالی
                pg.evaluate("""async ([n, para]) => { for (let i = 0; i < n; i++) {
                    await _zaInsertWitnessStatement({ id: 'w' + i, full_name: 'گواہ نمبر ' + (i + 1) + ' ولد فلاں سکنہ ملتان', status: 'fir_eye' }); }
                  document.querySelectorAll('#ch173-doc .zfa-wit-stmt').forEach(st => { st.textContent = 'بیان کیا کہ ' + para.repeat(14); });
                  return 0; }""", [n_par, PARA])
            pg.wait_for_timeout(400)
            pg.evaluate("_saveZimniA(true, true)"); pg.wait_for_timeout(1500)
            for how, js in [('ایڈیٹر', "_printZimniA()"), ('فہرست', "_printZimniAById(String(_zaActive.id))")]:
                h = printed(pg, js, paper)
                bi = h.find('class="zfa-c-body"')
                brk = len(re.findall(r'class="dio-pgbrk"', h[bi:])) if bi > 0 else -1
                what = (f'{n_par} پیراگراف' if mode == 'auto' else f'{n_par} گواہان کے بیان')
                name = f'{tag}_za_{mode}{n_par}_{paper}_{"ed" if how == "ایڈیٹر" else "list"}'
                pdf = to_pdf(b, h, name)
                n, res = page_checks(tag, f'اندرونی ضمنی {what} ({paper}، {how} سے پرنٹ)', pdf, 1.0, 2, expect_pages=brk + 1)
                if mode != 'auto':
                    check(f'{tag}: اندرونی ضمنی {what} ({paper}) — کئی صفحات (جانچ کی شرط)', n >= 2, n)
                    continue
                # نمبر شمار (دائیں کالم) اور پیراگراف کا نمبر (حالات کے کالم میں) — ہر صفحے پر ایک ہی اونچائی
                bb = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True).stdout
                bad, seen = [], 0
                for pi, page in enumerate(bb.split('<page')[1:]):
                    W = float(re.search(r'width="([\d.]+)"', page).group(1))
                    ser, par = {}, {}
                    for x0, y0, txt in re.findall(r'xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">([^<]*)<', page):
                        dg = re.sub(r'\D', '', txt)
                        if not dg: continue
                        if float(x0) > 0.92 * W: ser[dg] = float(y0)
                        elif 0.70 * W < float(x0) < 0.86 * W and dg not in par: par[dg] = float(y0)
                    for k, y in ser.items():
                        seen += 1
                        if k not in par or abs(par[k] - y) > 3: bad.append((pi + 1, k, y, par.get(k)))
                check(f'{tag}: اندرونی ضمنی {what} ({paper}، {how} سے پرنٹ) — ہر نمبر اپنے پیراگراف کی سیدھ میں (ہر صفحے پر، ±3pt)',
                      seen >= n_par and not bad, (seen, bad[:4]))
        except Exception as e:
            check(f'{tag}: androoni {mode} {n_par} {paper} crashed', False, repr(e)[:300])

    # ═══ 5) ضمنی نمبر اور تاریخ — ایک تاریخ/ایک نمبر کی ایک ضمنی ═══
    try:
        pg.evaluate(SEED + "(1)"); ws(pg)
        pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(1200)
        zimni_new(pg, '10/10/2026', extra=' پہلی ضمنی۔'); save(pg)
        zimni_new(pg, '11/10/2026', extra=' دوسری ضمنی۔'); save(pg)
        rows = zrows(pg)
        check(f'{tag}: (تیاری) دو ضمنیاں نمبر 1 اور 2', sorted(r['sn'] for r in rows) == [1, 2], rows)
        # چھوڑا ہوا مسودہ (نمبر 3) — اگلی نئی ضمنی پھر بھی 3 (مسودہ نمبر آگے نہ بڑھائے)
        zimni_new(pg, '12/10/2026', extra=' چھوڑا ہوا مسودہ۔'); pg.evaluate("_zimniWriteDraft()"); pg.evaluate("_zimniDirty = false; 0")
        pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(900)
        pg.evaluate("_newZimni()"); pg.wait_for_timeout(1300)
        zno = pg.evaluate("document.querySelector('#ch173-doc [data-k=\"zno\"]').textContent.trim()")
        check(f'{tag}: نئی ضمنی کا نمبر = محفوظ شدہ میں سب سے بڑا + 1 (چھوڑا ہوا مسودہ نہیں گنا)', zno == '3', zno)
        # بغیر بدلے — جو لکھا (3) وہی
        pg.evaluate("""(() => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = '13/10/2026'; a.dispatchEvent(new Event('input',{bubbles:true})); return 0; })()""")
        save(pg)
        check(f'{tag}: نمبر نہ بدلا — جو لکھا (3) اسی پر محفوظ', 3 in [r['sn'] for r in zrows(pg)], zrows(pg))
        # بدل کر (7) — اسی پر
        zimni_new(pg, '14/10/2026', extra=' بدلے نمبر والی۔')
        pg.evaluate("""(() => { const z = document.querySelector('#ch173-doc [data-k="zno"]'); z.textContent = '7'; z.dispatchEvent(new Event('input',{bubbles:true})); return 0; })()""")
        save(pg)
        check(f'{tag}: نمبر بدل کر 7 لکھا — 7 پر محفوظ', 7 in [r['sn'] for r in zrows(pg)], zrows(pg))
        n0 = len(zrows(pg))
        # ایک ہی تاریخ (11/10/2026) — خبردار، محفوظ نہیں، تاریخ کا خانہ نمایاں
        zimni_new(pg, '11/10/2026', extra=' اسی تاریخ کی دوسری۔')
        save(pg)
        t = ' | '.join(pg.evaluate('window.__toasts'))
        mark = pg.evaluate("!!document.querySelector('#ch173-doc tr.zf-blk .zf-actbody.zf-dupmark')")
        check(f'{tag}: اسی تاریخ کی ضمنی پہلے سے — خبردار («پہلے سے محفوظ» + تاریخ)، محفوظ نہیں، تاریخ کا خانہ نمایاں',
              len(zrows(pg)) == n0 and '11/10/2026' in t and 'پہلے سے محفوظ' in t and mark, (len(zrows(pg)), t[-160:], mark))
        pg.evaluate("""(() => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = '15/10/2026'; a.dispatchEvent(new Event('input',{bubbles:true})); return 0; })()""")
        save(pg)
        check(f'{tag}: تاریخ درست کرنے پر محفوظ', len(zrows(pg)) == n0 + 1, len(zrows(pg)))
        n1 = len(zrows(pg))
        # ایک ہی نمبر (2) — خبردار، محفوظ نہیں، نمبر کا خانہ نمایاں
        zimni_new(pg, '16/10/2026', extra=' اسی نمبر کی۔')
        pg.evaluate("""(() => { const z = document.querySelector('#ch173-doc [data-k="zno"]'); z.textContent = '2'; return 0; })()""")
        save(pg)
        t = ' | '.join(pg.evaluate('window.__toasts'))
        mark = pg.evaluate("!!document.querySelector('#ch173-doc [data-k=\"zno\"].zf-dupmark')")
        check(f'{tag}: یہی ضمنی نمبر پہلے سے — خبردار، محفوظ نہیں، نمبر کا خانہ نمایاں', len(zrows(pg)) == n1 and 'ضمنی نمبر 2 پہلے سے محفوظ' in t and mark, (len(zrows(pg)), t[-160:], mark))
        pg.evaluate("""(() => { const z = document.querySelector('#ch173-doc [data-k="zno"]'); z.textContent = '9'; return 0; })()""")
        save(pg)
        check(f'{tag}: نمبر درست کرنے پر محفوظ (9)', 9 in [r['sn'] for r in zrows(pg)] and len(zrows(pg)) == n1 + 1, zrows(pg))
        # پہلے سے محفوظ ضمنی کی ترمیم — اپنی ہی تاریخ/نمبر پر کوئی غلط تنبیہ نہیں
        pg.evaluate("window.__toasts = []; 0")
        pg.evaluate("document.querySelector('#ch173-doc .zf-body').focus(); document.execCommand('insertText', false, ' مزید۔'); 0")
        save(pg)
        t = ' | '.join(pg.evaluate('window.__toasts'))
        check(f'{tag}: اپنی ہی ضمنی کی ترمیم (اپ ڈیٹ) — کوئی غلط تنبیہ نہیں', 'پہلے سے محفوظ' not in t and len(zrows(pg)) == n1 + 1, t[-120:])
        # فہرست سے نمبر بدلنا — موجود نمبر پر نہیں
        pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(900)
        pg.evaluate("window.__toasts = []; window.__pr = window.prompt; window.prompt = () => '1'; 0")
        zid = pg.evaluate("String(_zimniList.find(z => z.serial_no == 9).id)")
        pg.evaluate(f"_moveZimni('{zid}')"); pg.wait_for_timeout(600)
        t = ' | '.join(pg.evaluate('window.__toasts'))
        check(f'{tag}: فہرست سے نمبر بدلنا — موجود نمبر (1) پر نہیں', 'پہلے سے محفوظ' in t and 9 in [r['sn'] for r in zrows(pg)], t[-120:])
        pg.evaluate("window.prompt = () => '11'; 0")
        pg.evaluate(f"_moveZimni('{zid}')"); pg.wait_for_timeout(800)
        z = pg.evaluate("""(zid) => { const r = window.__db.zimni_reports.find(x => String(x.id) === zid); const c = r.content || {};
            const t = document.createElement('template'); t.innerHTML = c.bodyHtml || ''; const f = t.content.querySelector('[data-k="zno"]');
            return { sn: r.serial_no, csn: c.serial_no, head: f ? f.textContent.trim() : null }; }""", zid)
        pg.evaluate("window.prompt = window.__pr; 0")
        check(f'{tag}: فہرست سے نمبر 11 — سرور پر بھی اور کاغذ کی سرخی («ضمنی نمبر») میں بھی 11', z == {'sn': 11, 'csn': 11, 'head': '11'}, z)
    except Exception as e:
        check(f'{tag}: zimni number section crashed', False, repr(e)[:300])

    check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:3])
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch()
    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'): run(b, 'desktop', dict(viewport={'width': 1366, 'height': 768}), False)
    if only in ('', 'mobile'): run(b, 'mobile', dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2), True)
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
