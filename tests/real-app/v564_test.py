"""(v564) بیرونی ضمنی — پرنٹ اور ترتیب: اصل ایپ کی جانچ (Desktop 1366×768 + Mobile 390×844، لیگل + A4)

افسر کی ہدایت (28 اکتوبر 2026، TASK 4):
  1) Ctrl+P، «پرنٹ» بٹن اور براؤزر کے مینو کی چھپائی (Chrome ⋮ › Print) — تینوں کے صفحات pixel تک ایک؛ نیچے کچھ نہ کٹے
  2) مثل کی 2pt لکیر (صفحہ 2، 4 …): لکیر کے سامنے تحریر؛ لکیر کے دوران کالم 2 میں نیا نمبر آئے تو لکیر جاری، کوئی خالی خانہ نہیں
  3) اختتامی سطر «رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔» — اوپر کی جگہ آدھی یا کم
  4) «از» کا کالم بالکل دُگنا (جگہ سب سے چوڑے کالم سے)
  5) کالم 1 کی تاریخ ↔ دستخط کی تاریخ؛ تفتیشی افسر / SHO کا نام — ایک جگہ بدلو، ہر جگہ بدلے
  6) دستخط کے نیچے تاریخ نام کے بالکل درمیان (چھوٹا اور لمبا نام)
  7) محفوظ ضمنی اور محفوظ چالان کی چھپائی میں کچھ ضائع نہیں؛ kerning بند چالان پر اور (v580) ضمنی کے صرف متن پر — justify، الفاظ جُڑے نہیں
  + پرانی شکایات برقرار: ایک تاریخ کی ایک ضمنی، کالم 2 دستی نمبر، مثل کی لکیر صرف جفت صفحات پر

چلانا: README.md — `python3 v564_test.py` (poppler: pdftoppm / pdfinfo / pdftotext)؛ ایک ہی: DIO_ONLY=desktop|mobile
"""
from v564_common import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:500] if extra != '' else ''), flush=True)

V = OUT + '/v564/'
os.makedirs(V, exist_ok=True)
DPI = 72
TOASTS = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"""

# ── صفحے کی تصویر کا تجزیہ (72dpi) ──────────────────────────────────────────
def page_pngs(pdf, tag):
    for f in glob.glob(V + tag + '-*.png'): os.remove(f)
    subprocess.run(['pdftoppm', '-png', '-r', str(DPI), '-gray', pdf, V + tag], check=True)
    return sorted(glob.glob(V + tag + '-*.png'), key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0]))


def analyze(png, mb_cm=1.0):
    """کھڑی لکیریں (نچلا حصہ) + نیچے کے حاشیے سے فاصلہ؛ اوپر بائیں کونے کا وتر (c, لمبائی, اوپر کا سرا)"""
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
    gaps = []
    for x in lines:
        y = y1
        while y < H and (dark(x, y) or dark(x - 1, y) or dark(x + 1, y)): y += 1
        gaps.append(yb - y)
    Rr = int(3.2 * DPI); best = 0; bc = None; bx = None
    for c in range(40, 2 * Rr):
        run = 0
        for x in range(0, Rr):
            y = c - x
            if y < 0 or y >= Rr: run = 0; continue
            if dark(x, y) or dark(x, y - 1) or dark(x, y + 1): run += 1
            else: run = 0
            if run > best: best = run; bc = c; bx = x
    top = (bx, bc - bx) if bc is not None else None          # وتر کا اوپری (دائیں) سرا
    return {'lines': lines, 'gaps': gaps, 'diag': best, 'c': bc, 'top': top, 'W': W, 'H': H, 'px': px, 'dark': dark}


def zone_text(a):
    """جفت صفحے پر مثلث کا دائرہ: وتر کے دائیں (تحریر والی طرف) سطریں — لکیر سے کم از کم فاصلہ؛ مثلث کے اندر تحریر
       (لکیر پر چڑھنا)؛ دائرے میں سب سے بڑی خالی پٹی؛ کالم 2 (نمبر) میں دائرے کے اندر نمبر"""
    dark, c, top = a['dark'], a['c'], a['top']
    xs = sorted(a['lines'])                                   # کھڑی لکیریں (بائیں سے): کالم 2/3 کی حد، کالم 1/2 کی حد
    if len(xs) < 2 or not top: return None
    xb, xs2 = xs[-2], xs[-1]
    y_top, y_bot = top[1], c                                   # وتر: (tx, ty) سے (0, c)
    rows, intr = [], 0
    for y in range(y_top, y_bot + 1):
        xl = c - y
        if any(dark(x, y) for x in range(0, max(0, xl - 4))): intr += 1      # مثلث کے اندر سیاہی = تحریر لکیر پر
        ink = next((x for x in range(xl + 3, xb - 3) if dark(x, y)), None)
        rows.append((y, None if ink is None else ink - xl))
    bands, cur = [], None
    for y, d in rows:
        if d is None: continue
        if cur and y - cur['y1'] <= 1: cur['y1'] = y; cur['d'] = min(cur['d'], d)
        else: cur = {'y0': y, 'y1': y, 'd': d}; bands.append(cur)
    lines = [bd for bd in bands if bd['y1'] - bd['y0'] >= 5]
    gaps = [lines[i + 1]['y0'] - lines[i]['y1'] for i in range(len(lines) - 1)]
    serial = any(dark(x, y) for y in range(y_top, y_bot) for x in range(xb + 3, xs2 - 3))
    return {'lines': len(lines), 'gaps': gaps, 'lead': (lines[0]['y0'] - y_top) if lines else None,
            'dist': [bd['d'] for bd in lines], 'intrude': intr, 'serial_in_zone': serial, 'zone': (y_top, y_bot)}


# ── چھپائی کے تین راستے ─────────────────────────────────────────────────────
def snap_print(pg, fn, paper):
    pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
    fn()
    asked = pick_paper(pg, paper)
    for _ in range(150):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    return asked, pg.evaluate("window.__snaps[0] || ''")


def three_ways(b, pg, tag, paper, desktop):
    out = {}
    a, h = snap_print(pg, lambda: pg.evaluate("document.querySelector('[data-dio-print]').click()"), paper)
    out['button'] = {'asked': a, 'html': h, 'pdf': html_pdf(b, h, V + f'{tag}_{paper}_button.pdf')}
    if desktop:
        def ctrlp():
            pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('End'); pg.keyboard.press('Control+p')
        a, h = snap_print(pg, ctrlp, paper)
        out['ctrlp'] = {'asked': a, 'html': h, 'pdf': html_pdf(b, h, V + f'{tag}_{paper}_ctrlp.pdf')}
        URDU = """() => { const t = document.querySelector('#ch173-doc tr.zf-blk .zf-body');
            const e = new KeyboardEvent('keydown', { key: 'پ', code: 'KeyP', ctrlKey: true, bubbles: true, cancelable: true }); t.dispatchEvent(e); return e.defaultPrevented; }"""
        a, h = snap_print(pg, lambda: pg.evaluate(URDU), paper)
        out['ctrlp_urdu'] = {'asked': a, 'html': h}
    p, native = menu_pdf(pg, paper, V + f'{tag}_{paper}_menu.pdf')
    out['menu'] = {'pdf': p, 'native_bp': native}
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
    return out


def html_page(b, html, name):
    """تیار کاغذ کا HTML ایک صفحے میں «پرنٹ» کی شکل پر (DOM ناپ کے لیے)"""
    fn = os.path.join(HERE, '..', '..', '_v564m_' + name + '.html')
    open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + re.sub(r'^<!DOCTYPE html>', '', html, flags=re.I))
    c = b.new_context(viewport={'width': 1000, 'height': 1400}); c.route('**/*', route); q = c.new_page()
    q.emulate_media(media='print')
    q.goto(BASE + '_v564m_' + name + '.html'); q.wait_for_timeout(1200); q.evaluate('document.fonts.ready')
    return c, q, fn


MEASURE = """() => { const d = document.getElementById('ch173-doc');
  const rects = (el) => { const out = []; const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
      for (const x of r.getClientRects()) if (x.height > 2 && x.width > 0) out.push(x); } return out; };
  const blks = [...d.querySelectorAll('tr.zf-blk .zf-body')]; const last = rects(blks[blks.length - 1]);
  const lb = Math.max(...last.map(x => x.bottom)); const cl = rects(d.querySelector('.zf-close'));
  const nm = rects(d.querySelector('[data-k="io_sign"]')), dt = rects(d.querySelector('[data-k="io_date"]'));
  const mid = (a) => (Math.min(...a.map(x => x.left)) + Math.max(...a.map(x => x.right))) / 2;
  const t = d.querySelector('table.zf-tbl'), W = t.getBoundingClientRect().width;
  const cols = [...t.querySelectorAll('thead th')].map(th => +(th.getBoundingClientRect().width / W).toFixed(3));
  // ایک خالی جگہ (دو اردو الفاظ کے بیچ) کی اصل چوڑائی
  let sp = null; const tw = document.createTreeWalker(blks[0], NodeFilter.SHOW_TEXT); let n;
  while (!sp && (n = tw.nextNode())) { const v = n.nodeValue; for (let i = 1; i < v.length - 1; i++) {
      if (v[i] === ' ' && /[\\u0600-\\u06FF]/.test(v[i - 1]) && /[\\u0600-\\u06FF]/.test(v[i + 1])) {
        const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const w = r.getBoundingClientRect().width; if (w > 0) { sp = w; break; } } } }
  const fs = parseFloat(getComputedStyle(blks[0]).fontSize);
  // اختتامی سطر کے اوپر کی جگہ: آخری تحریر → اختتامی سطر۔ اختتام + دستخط کی قطار صفحے میں نہ سمائے تو پورا اگلے صفحے پر
  //   جاتی ہے (بیچ میں خالی «بھرائی» قطار، tr.zf-fill) — تب وہی جگہ قطاروں کی بناوٹ سے: آخری قطار کا نچلا حصہ + اختتامی قطار کا اوپر
  const cTop = Math.min(...cl.map(x => x.top)), er = d.querySelector('tr.zf-endrow'), pv = er && er.previousElementSibling;
  const brk = !!(pv && pv.classList.contains('zf-fill'));
  const lastBlk = d.querySelectorAll('tr.zf-blk'); const lbr = lastBlk[lastBlk.length - 1].getBoundingClientRect();
  const gap = brk ? (lbr.bottom - lb) + (cTop - er.getBoundingClientRect().top) : (cTop - lb);
  return { closeGap: Math.round(gap), closeOnNewPage: brk, close: d.querySelector('.zf-close').textContent.trim(),
           signOff: Math.round(mid(dt) - mid(nm)), cols, space: sp && +(sp / fs).toFixed(3), spacePx: sp && +sp.toFixed(2),
           ov: d.querySelectorAll('.zf-bind[data-ov]').length, sl: d.querySelectorAll('.zf-bindsl').length,
           serials: [...d.querySelectorAll('tr.zf-blk .zf-num')].map(x => x.textContent.trim()) }; }"""

SLICES = """() => { const d = document.getElementById('ch173-doc'); const out = [];
  const all = [...d.querySelectorAll('.zf-bind[data-ov], .zf-bindsl')];
  let cur = null;
  all.forEach(el => { if (el.matches('.zf-bind[data-ov]')) { cur = { rows: new Set(), bad: [] }; out.push(cur); return; }
    if (!cur) return; const tr = el.closest('tr'); cur.rows.add(tr);
    const td = el.closest('td'); const r = el.getBoundingClientRect(); let bot = -1;
    const tw = document.createTreeWalker(td, NodeFilter.SHOW_TEXT); let n;
    while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; const g = document.createRange(); g.selectNodeContents(n);
      for (const x of g.getClientRects()) if (x.height > 2) bot = Math.max(bot, x.bottom); }
    if (r.bottom > bot + 1.5) cur.bad.push([Math.round(r.bottom), Math.round(bot)]); });
  return out.map(u => ({ rows: u.rows.size, bad: u.bad })); }"""


# (2) DOM سے: مثل کی لکیر کے دائرے (2×2 انچ، وتر اوپر دائیں سے نیچے بائیں) میں ہر سطر — جو سطر اپنے اندراج کی آخری
#     نہیں وہ لکیر تک پہنچے (≤ 30px: 3mm حاشیہ + معمولی گنجائش)؛ کوئی سطر لکیر پار نہ کرے
ZONE_DOM = """() => { const d = document.getElementById('ch173-doc'); const ov = d.querySelector('.zf-bind[data-ov]'); if (!ov) return null;
  const o = ov.getBoundingClientRect(), S = 192, xh = (y) => o.left + S - (y - o.top);
  const out = { lines: 0, nonFinal: 0, maxReach: null, minDist: null, rows: 0 };
  d.querySelectorAll('tr.zf-blk .zf-body').forEach(b => {
    const rs = []; const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); let tn;      // صرف متن (لکیر کے ٹکڑے کا خانہ نہیں)
    while ((tn = tw.nextNode())) { if (!(tn.nodeValue || '').trim()) continue; const R = document.createRange(); R.selectNodeContents(tn);
      [...R.getClientRects()].forEach(r => { if (r.width > 1 && r.height > 4) rs.push(r); }); }
    const L = []; rs.forEach(r => { const l = L.find(x => Math.abs(x.top - r.top) < 3); if (l) l.left = Math.min(l.left, r.left); else L.push({ top: r.top, bottom: r.bottom, left: r.left }); });
    L.sort((a, b2) => a.top - b2.top);
    let inZone = false;
    L.forEach((l, i) => { const mid = (l.top + l.bottom) / 2; if (mid < o.top || mid > o.top + S) return; inZone = true;
      const dist = l.left - xh(l.top); out.lines++; out.minDist = out.minDist === null ? dist : Math.min(out.minDist, dist);
      if (i < L.length - 1) { out.nonFinal++; out.maxReach = out.maxReach === null ? dist : Math.max(out.maxReach, dist); } });
    if (inZone) out.rows++; });
  ['maxReach', 'minDist'].forEach(k => { if (out[k] !== null) out[k] = Math.round(out[k]); }); return out; }"""


def words(t):
    return re.sub(r'[\s ]+', ' ', t or '').strip()


# (7) ہر وہ خالی جگہ جو دو اردو حروف کے بیچ اور ایک ہی سطر پر ہو — سب سے تنگ کی چوڑائی (em)؛ فونٹ کی kerning
#     اسے 0.195em (فونٹ کی اپنی) سے صفر تک کھینچتی تھی (پہلے: 0.011em ناپی گئی)
SPACES = """(sel) => { const els = [...document.querySelectorAll(sel)]; if (!els.length) return null;
  const cs = getComputedStyle(els[0]), fs = parseFloat(cs.fontSize); let n = 0, min = null; const R = document.createRange();
  const dd = els[0].closest('#ch173-doc') || els[0], k = (dd.getBoundingClientRect().width / dd.offsetWidth) || 1;   // موبائل پر کاغذ چھوٹا کر کے دکھایا جاتا ہے
  const rc = (t, i) => { R.setStart(t, i); R.setEnd(t, i + 1); return R.getBoundingClientRect(); };
  for (const el of els) { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t;
    while ((t = tw.nextNode())) { const v = t.nodeValue || '';
      for (let i = 1; i < v.length - 1; i++) {
        if (v[i] !== ' ' || !/[\\u0600-\\u06FF]/.test(v[i - 1]) || !/[\\u0600-\\u06FF]/.test(v[i + 1])) continue;
        const a = rc(t, i), b = rc(t, i + 1), c = rc(t, i - 1);
        if (a.width <= 0 || Math.abs(a.top - b.top) > 2 || Math.abs(a.top - c.top) > 2) continue;   // سطر کے آخر کی جگہ
        n++; const w = a.width / k / fs; min = (min === null) ? w : Math.min(min, w); } } }
  return { n, min: min === null ? null : +min.toFixed(3), scale: +k.toFixed(3), kern: cs.fontKerning, wordSpacing: cs.wordSpacing, font: cs.fontFamily.slice(0, 40) }; }"""
# نظر نہ آنے والے نشان اور خالی جگہیں — ایڈیٹر، محفوظ، پرنٹ میں گنتی ایک
CHARS = """(sel) => { const t = [...document.querySelectorAll(sel)].map(x => x.textContent).join('\\n');
  const c = (re) => (t.match(re) || []).length;
  return { space: c(/ /g), nbsp: c(/\\u00A0/g), zwnj: c(/\\u200C/g), zwj: c(/\\u200D/g), zwsp: c(/\\u200B/g), letters: c(/[^\\s\\u00A0\\u200B-\\u200D]/g) }; }"""


def pdf_fonts(pdf):
    return subprocess.run(['pdffonts', pdf], capture_output=True, text=True).stdout


def run(b, tag, ctxargs, mobile):
    desktop = not mobile
    ctx, pg, errs = open_app(b, **ctxargs)
    pg.on('dialog', lambda d: d.accept())
    pg.evaluate(TOASTS)

    # ═══ 1) تین راستے — ایک ہی کاغذ (3 صفحات کی ضمنی، محفوظ کرنے کے بعد) ═══
    try:
        open_zimni(pg)
        if mobile:
            try: pg.evaluate("dioMobile.setMode('paper')"); pg.wait_for_timeout(800)
            except Exception: pass
        pg.evaluate(fill_js()); pg.wait_for_timeout(1500)
        # نظر نہ آنے والا نشان (ZWNJ) والا لفظ بھی — محفوظ / پرنٹ میں ضائع نہ ہو
        pg.evaluate("""(() => { const b = _zimniDoc().querySelector('tr.zf-blk .zf-body'); const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
            b.focus(); const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, ' نقشہ\\u200Cموقع اور ویڈیو\\u200Cفوٹیج'); return 0; })()""")
        pg.wait_for_timeout(300)
        BODY = '#ch173-doc tr.zf-blk .zf-body'
        ed_chars = pg.evaluate(CHARS, BODY)
        if desktop:
            pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('Control+s')
        else:
            pg.evaluate("document.getElementById('zf-save-btn').click()")
        pg.wait_for_timeout(2200)
        check(f'{tag}: ضمنی محفوظ (12 اندراج)', pg.evaluate("(window.__db.zimni_reports||[]).length") == 1)
        sv_chars = pg.evaluate("""(sel) => { const t = document.createElement('template'); t.innerHTML = window.__db.zimni_reports.slice(-1)[0].content.bodyHtml;
            const s = [...t.content.querySelectorAll(sel.replace('#ch173-doc ', ''))].map(x => x.textContent).join('\\n'); const c = (re) => (s.match(re) || []).length;
            return { space: c(/ /g), nbsp: c(/\\u00A0/g), zwnj: c(/\\u200C/g), zwj: c(/\\u200D/g), zwsp: c(/\\u200B/g), letters: c(/[^\\s\\u00A0\\u200B-\\u200D]/g) }; }""", BODY)
        check(f'{tag}: محفوظ کرنے میں کوئی خالی جگہ / نظر نہ آنے والا نشان / حرف ضائع نہیں (ایڈیٹر = محفوظ)', sv_chars == ed_chars and ed_chars['zwnj'] == 2, (ed_chars, sv_chars))
        ed_scr = pg.evaluate(SPACES, BODY)
        # اسکرین (موبائل پر کاغذ ~0.44× چھوٹا) کی ناپ device pixel پر گول ہوتی ہے — ±0.01em؛ فونٹ کی اپنی جگہ 0.195em، پہلے 0.011em
        # v569: ضمنی پر kerning خودکار تھی؛ v580 (افسر کا حکم 12 نومبر 2026: «پوری بیرونی ضمنی» justify): متن پر kerning
        #   بند — ورنہ justify میں Jameel Noori کی kerning خالی جگہ کھا جاتی (الفاظ جُڑتے)؛ سب سے تنگ خالی جگہ ≥ 0.19em
        check(f'{tag}: اسکرین پر متن کی kerning بند، کوئی لفظ جُڑا نہیں (v580: justify؛ سب سے تنگ خالی جگہ ≥ 0.185em، موبائل پر ±0.01)',
              ed_scr and ed_scr['kern'] == 'none' and ed_scr['n'] > 100 and (ed_scr['min'] or 0) >= 0.185, ed_scr)
        # ہر اندراج کا متن (چھپائی میں صفحہ 3، 5 … پر اندراج دو قطاروں میں ٹوٹتا ہے — zf-cont پچھلی قطار کا حصہ)
        WORDS = "[...document.querySelectorAll('#ch173-doc tr.zf-blk')].reduce((a, r) => { const t = [...r.querySelectorAll('.zf-body')].map(x => x.textContent).join(' '); if (r.classList.contains('zf-cont') && a.length) a[a.length - 1] += ' ' + t; else if (r.querySelector('.zf-body')) a.push(t); return a; }, [])"
        ed_words = pg.evaluate(WORDS)
        for paper in ('legal', 'a4'):
            w = three_ways(b, pg, tag, paper, desktop)
            pb = page_pngs(w['button']['pdf'], f'{tag}_{paper}_button')
            pm = page_pngs(w['menu']['pdf'], f'{tag}_{paper}_menu')
            nb = pdf_info(w['button']['pdf'])
            check(f'{tag} {paper}: «پرنٹ» بٹن — کاغذ کا انتخاب پوچھا، تیار کاغذ چھپا ({nb[0]} صفحات)', w['button']['asked'] and 'zf-tbl' in w['button']['html'] and nb[0] >= 3, nb)
            same_m = same_pages(pb, pm)
            check(f'{tag} {paper}: براؤزر کے مینو کی چھپائی (Chrome ⋮ › Print) = «پرنٹ» بٹن — ہر صفحہ pixel تک ایک', same_m[0], same_m[1])
            check(f'{tag} {paper}: مینو کی چھپائی — کاغذ کا سائز وہی (@page)', pdf_info(w['menu']['pdf']) == nb, (pdf_info(w['menu']['pdf']), nb))
            if desktop:
                pc = page_pngs(w['ctrlp']['pdf'], f'{tag}_{paper}_ctrlp')
                same_c = same_pages(pb, pc)
                check(f'{tag} {paper}: Ctrl+P = «پرنٹ» بٹن — وہی فنکشن، ہر صفحہ pixel تک ایک', w['ctrlp']['asked'] and same_c[0], same_c[1])
                check(f'{tag} {paper}: اردو کی بورڈ پر Ctrl+P («پ») — وہی کاغذ', w['ctrlp_urdu']['asked'] and 'zf-tbl' in w['ctrlp_urdu']['html'], len(w['ctrlp_urdu']['html']))
                check(f'{tag} {paper}: براؤزر کی اپنی چھپائی نہیں چلی (window.print نہیں)', pg.evaluate('window.__printCalls') == 0, pg.evaluate('window.__printCalls'))
            an = [analyze(p) for p in pb]
            bad = [(i + 1, a['gaps']) for i, a in enumerate(an) if len(a['lines']) < 2 or any(g > 8 for g in a['gaps'])]
            check(f'{tag} {paper}: نیچے کچھ نہیں کٹا — ہر صفحے پر کھڑی لکیریں نیچے کے حاشیے تک', not bad, bad or [a['gaps'] for a in an])
            txt = subprocess.run(['pdftotext', '-layout', w['button']['pdf'], '-'], capture_output=True, text=True).stdout
            last = txt.split('\f')[nb[0] - 1] if '\f' in txt else txt
            sd = pg.evaluate("document.querySelector('#ch173-doc [data-k=\"io_date\"]').textContent.trim()")
            check(f'{tag} {paper}: آخری صفحے پر دستخط کی تاریخ ({sd}) — کاغذ کا آخری حصہ چھپا', sd in last, last[-200:])
            ev = all(a['diag'] >= 100 for i, a in enumerate(an) if (i + 1) % 2 == 0)
            od = all(a['diag'] < 45 for i, a in enumerate(an) if (i + 1) % 2 == 1)
            check(f'{tag} {paper}: مثل کی 2pt لکیر صرف جفت صفحات (2، 4 …) پر', ev and od, [(i + 1, a['diag']) for i, a in enumerate(an)])
            # 7) الفاظ کا فاصلہ + کوئی حرف ضائع نہیں (محفوظ ضمنی کا پرنٹ)
            c2, q, fn = html_page(b, w['button']['html'], f'{tag}_{paper}')
            m = q.evaluate(MEASURE)
            sp = q.evaluate(SPACES, BODY)
            pr_chars = q.evaluate(CHARS, BODY)
            pr_words = q.evaluate(WORDS)
            c2.close(); os.remove(fn)
            check(f'{tag} {paper}: پرنٹ میں متن کی kerning بند، کوئی لفظ جُڑا نہیں (v580: justify؛ سب سے تنگ خالی جگہ ≥ 0.19em)',
                  sp and sp['kern'] == 'none' and sp['n'] > 100 and (sp['min'] or 0) >= 0.19, sp)
            check(f'{tag} {paper}: پرنٹ میں حالات کا ہر لفظ، ہر خالی جگہ اور نظر نہ آنے والا نشان وہی جو لکھا گیا (کچھ ضائع نہیں)',
                  [words(x) for x in pr_words] == [words(x) for x in ed_words] and pr_chars['zwnj'] == ed_chars['zwnj'] and pr_chars['letters'] == ed_chars['letters'] and pr_chars['nbsp'] == ed_chars['nbsp'],
                  (pr_chars, ed_chars))
            pf = pdf_fonts(w['button']['pdf'])
            check(f'{tag} {paper}: PDF میں اصل اردو فونٹ (Jameel Noori Nastaleeq) شامل — فونٹ پرنٹ سے پہلے لوڈ', 'Jameel' in pf, pf[-300:])
            if paper == 'legal':
                check(f'{tag}: پرنٹ — اختتامی سطر «۔» پر ختم', m['close'] == 'رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔', m['close'])
                if m['closeOnNewPage']:      # اختتام + دستخط کی قطار اگلے صفحے پر (ایک ساتھ رہتی ہے) — وہاں اوپر صرف مثل کی جگہ؛ ناپ نیچے مختصر ضمنی پر
                    print(f'NOTE {tag}: اختتامی قطار نئے صفحے پر گئی (صفحہ بندی)، اس لیے اوپر کی جگہ یہاں نہیں ناپی — ناپ حصہ 3 میں (ایک صفحہ)', flush=True)
                else:
                    check(f'{tag}: پرنٹ — اختتامی سطر کے اوپر جگہ پہلے (14px) کی آدھی یا کم', 0 <= m['closeGap'] <= 7, m['closeGap'])
                check(f'{tag}: پرنٹ — «از» کا کالم 24% (پہلے 12%)، کالم 3 = 55%', abs(m['cols'][3] - 0.24) <= 0.006 and abs(m['cols'][2] - 0.55) <= 0.006, m['cols'])
                check(f'{tag}: پرنٹ — دستخط کے نیچے تاریخ نام کے بالکل درمیان (±2px)', abs(m['signOff']) <= 2, m['signOff'])
            contact(pb, V + f'{tag}_{paper}_button_ALL.png'); contact(pm, V + f'{tag}_{paper}_menu_ALL.png')
    except Exception as e:
        check(f'{tag}: print paths section crashed', False, repr(e)[:400])

    # ═══ 2) مثل کی لکیر: لکیر کے سامنے تحریر، لکیر کے دوران نیا نمبر، کوئی خالی خانہ نہیں ═══
    try:
        open_zimni(pg)
        if mobile:
            try: pg.evaluate("dioMobile.setMode('paper')"); pg.wait_for_timeout(800)
            except Exception: pass
        pg.evaluate(fill_js(26, 1)); pg.wait_for_timeout(1500)         # چھوٹے اندراج — لکیر کے دائرے میں نیا نمبر ضرور
        for paper in ('legal', 'a4'):
            a, h = snap_print(pg, lambda: pg.evaluate("document.querySelector('[data-dio-print]').click()"), paper)
            pdf = html_pdf(b, h, V + f'{tag}_{paper}_zone.pdf')
            pngs = page_pngs(pdf, f'{tag}_{paper}_zone')
            c2, q, fn = html_page(b, h, f'{tag}_{paper}_zone')
            sl = q.evaluate(SLICES); m = q.evaluate(MEASURE); zd = q.evaluate(ZONE_DOM)
            c2.close(); os.remove(fn)
            n = len(pngs)
            check(f'{tag} {paper}: ہر جفت صفحے کی ایک لکیر ({n} صفحات → {n // 2})', m['ov'] == n // 2, (m['ov'], n))
            check(f'{tag} {paper}: لکیر کا ٹکڑا ہر قطار میں صرف اُس کی تحریر جتنا — کوئی قطار لکیر کی وجہ سے لمبی نہیں',
                  sl and all(not u['bad'] for u in sl), sl)
            check(f'{tag} {paper}: صفحہ 2 پر لکیر کے دوران نیا اندراج (نیا نمبر) — لکیر اس کی قطار میں بھی جاری', sl and sl[0]['rows'] >= 2, sl)
            z = zone_text(analyze(pngs[1]))
            ok = bool(z) and z['lines'] >= 5 and z['lead'] is not None and z['lead'] <= 22 and max(z['gaps'] or [0]) <= 32 and z['intrude'] == 0
            check(f'{tag} {paper}: صفحہ 2 (PDF کے pixel) — لکیر کے دائرے میں تحریر شروع سے، کوئی خالی پٹی نہیں، لکیر پر کوئی سیاہی نہیں', ok, z and {k: z[k] for k in ('lines', 'lead', 'gaps', 'dist', 'intrude', 'zone')})
            check(f'{tag} {paper}: صفحہ 2 (DOM) — اندراج کی ہر غیر آخری سطر لکیر تک (≤ 30px)، کوئی سطر لکیر پار نہیں، دائرے میں 2+ اندراج',
                  bool(zd) and zd['nonFinal'] >= 2 and zd['maxReach'] is not None and zd['maxReach'] <= 30 and zd['minDist'] >= -1 and zd['rows'] >= 2, zd)
            check(f'{tag} {paper}: صفحہ 2 — لکیر کے دائرے میں کالم 2 کا نیا نمبر', bool(z) and z['serial_in_zone'], z and z['zone'])
            im = Image.open(pngs[1]).convert('RGB'); im.crop((0, 0, im.width, int(im.height * 0.42))).save(V + f'{tag}_{paper}_zone_p2.png')
    except Exception as e:
        check(f'{tag}: binding zone section crashed', False, repr(e)[:400])

    # ═══ 3, 4, 6) ایڈیٹر: اختتامی سطر، «از»، دستخط کی تاریخ درمیان (چھوٹا / لمبا نام) ═══
    try:
        open_zimni(pg)
        g = pg.evaluate("""(() => { const d = _zimniDoc(); const tl = (el, last) => { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, v = null;
              while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
                for (const x of r.getClientRects()) { if (x.height < 2) continue; if (!last) return x; v = x; } } return v; };
            const k = d.getBoundingClientRect().height / d.offsetHeight;
            const b = tl(d.querySelector('tr.zf-blk .zf-body'), true), c = tl(d.querySelector('.zf-close'), false);
            const t = d.querySelector('table.zf-tbl'), W = t.getBoundingClientRect().width;
            return { close: d.querySelector('.zf-close').textContent.trim(), gap: Math.round((c.top - b.bottom) / k),
                     c4: +(d.querySelector('th.zf-c-from').getBoundingClientRect().width / W).toFixed(3),
                     c3: +(d.querySelector('th.zf-c-body').getBoundingClientRect().width / W).toFixed(3) }; })()""")
        check(f'{tag}: ایڈیٹر — اختتامی سطر «رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔»', g['close'] == 'رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔', g['close'])
        check(f'{tag}: ایڈیٹر — اختتامی سطر کے اوپر جگہ پہلے (14px) کی آدھی یا کم', 0 <= g['gap'] <= 7, g['gap'])
        check(f'{tag}: ایڈیٹر — «از» 24% (پہلے 12% کا دُگنا)، کالم 3 = 55% (67 − 12)، جدول حاشیوں میں', abs(g['c4'] - 0.24) <= 0.006 and abs(g['c3'] - 0.55) <= 0.006, g)
        SIGN = """(() => { const d = _zimniDoc(); const tw = (el) => { const r = document.createRange(); r.selectNodeContents(el); const xs = [...r.getClientRects()].filter(x => x.width > 1);
              return { l: Math.min(...xs.map(x => x.left)), r: Math.max(...xs.map(x => x.right)) }; };
            const a = tw(d.querySelector('[data-k="io_sign"]')), b = tw(d.querySelector('[data-k="io_date"]')), c = d.querySelector('td.zf-c-body').getBoundingClientRect();
            return { off: Math.round(((b.l + b.r) - (a.l + a.r)) / 2), nameW: Math.round(a.r - a.l), leftGap: Math.round(a.l - c.left) }; })()"""
        s1 = pg.evaluate(SIGN)
        check(f'{tag}: ایڈیٹر — تاریخ نام کے درمیان (±2px)، خانہ بائیں کنارے پر', abs(s1['off']) <= 2 and s1['leftGap'] <= 14, s1)
        for nm in ('علی رضا ASI', 'محمد فیاض حسین شاد قریشی ASI تھانہ صدر ملتان ضلع ملتان'):
            pg.evaluate("(t) => { const el = _zimniDoc().querySelector('[data-k=\"io_sign\"]'); el.textContent = t; return 0; }", nm)
            pg.wait_for_timeout(200)
            s2 = pg.evaluate(SIGN)
            check(f'{tag}: ایڈیٹر — نام «{nm[:14]}…» ({s2["nameW"]}px): تاریخ درمیان (±2px)', abs(s2['off']) <= 2, s2)
            a, h = snap_print(pg, lambda: pg.evaluate("document.querySelector('[data-dio-print]').click()"), 'legal')
            c2, q, fn = html_page(b, h, f'{tag}_sign')
            mm = q.evaluate(MEASURE); c2.close(); os.remove(fn)
            check(f'{tag}: پرنٹ — نام «{nm[:14]}…»: تاریخ درمیان (±2px)', abs(mm['signOff']) <= 2, mm['signOff'])
            check(f'{tag}: پرنٹ (ایک صفحہ) — اختتامی سطر کے اوپر جگہ پہلے (14px) کی آدھی یا کم، اسی صفحے پر', not mm['closeOnNewPage'] and 0 <= mm['closeGap'] <= 7, (mm['closeGap'], mm['closeOnNewPage']))
        # پرانی محفوظ ضمنی: «۔» نہیں، الفاظ کے بیچ no-break space، کالم پرانے ناپ پر — کھلے اور چھپے تو نیا اصول؛ افسر کا اپنا ناپ جوں کا توں
        pg.evaluate("_saveZimni(true, true)"); pg.wait_for_timeout(1500)
        pg.evaluate("""(() => { const r = window.__db.zimni_reports.slice(-1)[0]; let b = r.content.bodyHtml;
            b = b.replace('رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔', 'رپورٹ\\u00a0ضمنی مرتب ہو کر ارسال خدمت ہے')
                 .replace(/<col style="width:\\s*55%;?"><col style="width:\\s*24%;?">/, '<col style="width:67%"><col style="width:12%">')
                 .replace('class="zf-signblk"', 'class="zf-signblk" style="text-align:left !important;"');
            r.content = Object.assign({}, r.content, { bodyHtml: b, saved_at: '2026-10-01T00:00:00Z' });
            Object.keys(localStorage).filter(k => /^dio_zimni_/.test(k)).forEach(k => localStorage.removeItem(k)); return 0; })()""")
        pg.evaluate("_loadZimni().then(() => _renderZimniList())"); pg.wait_for_timeout(1200)
        a, h = snap_print(pg, lambda: pg.evaluate("(() => { _printZimniById(String(_zimniList[0].id)); return 0; })()"), 'legal')
        c2, q, fn = html_page(b, h, f'{tag}_old')
        mm = q.evaluate(MEASURE); c2.close(); os.remove(fn)
        check(f'{tag}: پرانی محفوظ ضمنی کا پرنٹ — الفاظ جوں کے توں + «۔»، «از» 24%، تاریخ درمیان',
              mm['close'] == 'رپورٹ ضمنی مرتب ہو کر ارسال خدمت ہے۔' and abs(mm['cols'][3] - 0.24) <= 0.006 and abs(mm['signOff']) <= 2, mm)
        pg.evaluate("""(() => { const r = window.__db.zimni_reports.slice(-1)[0]; r.content = Object.assign({}, r.content, {
            bodyHtml: r.content.bodyHtml.replace(/<col style="width:\\s*\\d+%;?"><col style="width:\\s*\\d+%;?"><col style="width:\\s*\\d+%;?"><col style="width:\\s*\\d+%;?">/,
              '<col style="width:16%"><col style="width:6%"><col style="width:60%"><col style="width:18%">'), saved_at: '2026-10-02T00:00:00Z' });
            Object.keys(localStorage).filter(k => /^dio_zimni_/.test(k)).forEach(k => localStorage.removeItem(k)); return 0; })()""")
        pg.evaluate("_loadZimni().then(() => _renderZimniList())"); pg.wait_for_timeout(1200)
        a, h = snap_print(pg, lambda: pg.evaluate("(() => { _printZimniById(String(_zimniList[0].id)); return 0; })()"), 'legal')
        check(f'{tag}: افسر کا اپنا کھینچا ہوا کالم ناپ (16/6/60/18) جوں کا توں', 'width:60%' in h and 'width:18%' in h and 'width:24%' not in h)
    except Exception as e:
        check(f'{tag}: editor layout section crashed', False, repr(e)[:400])

    # ═══ 5) بندھے خانے — اصل کی بورڈ سے (Desktop)؛ موبائل پر اسکرین کی بورڈ = وہی input واقعات ═══
    try:
        pg.evaluate(SEED); open_zimni(pg)
        RD = """(() => { const d = _zimniDoc(); const T = (s) => [...d.querySelectorAll(s)].map(x => x.textContent.replace(/\\s+/g, ' ').trim());
            return { c1: d.querySelector('tr.zf-blk .zf-actbody').textContent.trim(), sd: d.querySelector('[data-k="io_date"]').textContent.trim(),
              mur: T('[data-k="murattib"]')[0], sign: T('[data-k="io_sign"]')[0], io: T('[data-bind="io_name"]'), sho: T('[data-bind="sho_name"]') }; })()"""
        SELIN = """([sel, txt, nth]) => { const root = sel ? _zimniDoc().querySelector(sel) : _zimniDoc(); const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n, k = 0;
            while ((n = tw.nextNode())) { let i = -1; while ((i = n.nodeValue.indexOf(txt, i + 1)) >= 0) { if (k++ === nth) {
              const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + txt.length); _zimniDoc().focus();
              const g = getSelection(); g.removeAllRanges(); g.addRange(r); return true; } } } return false; }"""
        SELALL = """(s) => { const el = _zimniDoc().querySelector(s); const r = document.createRange(); r.selectNodeContents(el); _zimniDoc().focus();
            const g = getSelection(); g.removeAllRanges(); g.addRange(r); return 0; }"""
        END = """(s) => { const el = [..._zimniDoc().querySelectorAll(s)].pop(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); _zimniDoc().focus();
            const g = getSelection(); g.removeAllRanges(); g.addRange(r); return 0; }"""
        typ = lambda t: pg.keyboard.type(t, delay=15)
        pg.evaluate(SELALL, 'tr.zf-blk .zf-actbody'); typ('20/10/2026'); pg.wait_for_timeout(500)
        r1 = pg.evaluate(RD)
        check(f'{tag}: کالم 1 کی تاریخ لکھی (20/10/2026) → دستخط کی تاریخ خود وہی', r1['c1'] == '20/10/2026' and r1['sd'] == '20/10/2026', r1)
        pg.evaluate(END, 'tr.zf-blk .zf-actbody'); typ(' بوقت 10:00'); pg.wait_for_timeout(300)
        pg.evaluate(SELALL, '[data-k="io_date"]'); typ('21/10/2026'); pg.wait_for_timeout(500)
        r2 = pg.evaluate(RD)
        check(f'{tag}: دستخط کی تاریخ بدلی (21/10/2026) → کالم 1 کی تاریخ خود وہی (ساتھ لکھا وقت جوں کا توں)', r2['sd'] == '21/10/2026' and r2['c1'] == '21/10/2026 بوقت 10:00', r2)
        # متن میں SHO کا نام دو جگہ (افسر خود لکھتا ہے) + تفتیشی افسر کا نام بھی (سادہ متن — ربط نہیں)
        pg.evaluate(END, 'tr.zf-blk .zf-body'); typ(' مسمی فیاض حسین شاد ASI نے حسب ہدایت ندیم عباس شاد SI/SHO موقع پر کارروائی کی۔')
        pg.evaluate("_zimniAddBlock()"); pg.wait_for_timeout(200); typ('ندیم عباس شاد SI/SHO کو اطلاع دی گئی۔ ')
        pg.evaluate(END, 'tr.zf-blk .zf-actbody'); pg.wait_for_timeout(1800)        # کرسر کہیں اور — لکھا ہوا نام ربط میں
        r3 = pg.evaluate(RD)
        check(f'{tag}: متن میں لکھا SHO کا نام خود ربط میں (×2)؛ تفتیشی افسر کا نام ربط میں نہیں', r3['sho'] == ['ندیم عباس شاد', 'ندیم عباس شاد'] and r3['io'] == [], r3)
        pg.evaluate(SELIN, [None, 'ندیم عباس شاد', 1]); typ('ندیم احمد'); pg.wait_for_timeout(500)
        r6 = pg.evaluate(RD)
        check(f'{tag}: SHO کا نام ایک جگہ بدلا → دوسری جگہ بھی', r6['sho'] == ['ندیم احمد', 'ندیم احمد'], r6)
        # (کرسر نام سے باہر گیا، پھر واپس نام کے بالکل آخر میں) نیا لفظ — نام نہیں بدلتا
        pg.evaluate(END, 'tr.zf-blk .zf-actbody'); pg.wait_for_timeout(300)
        pg.evaluate(END, '[data-bind="sho_name"]'); typ(' صاحب'); pg.wait_for_timeout(500)
        r7 = pg.evaluate(RD)
        check(f'{tag}: نام کے بعد نیا لفظ («صاحب») — نام کا حصہ نہیں بنتا، دوسری جگہ جوں کی توں', r7['sho'] == ['ندیم احمد', 'ندیم احمد'], r7)

        # ── (3 نومبر 2026) تفتیشی افسر کا نام مقرر — ضمنی میں کہیں قابلِ ترمیم نہیں ──
        IO = 'فیاض حسین شاد'
        LOCK = """(() => { const d = _zimniDoc(); return [...d.querySelectorAll('[data-k="murattib"],[data-k="io_sign"]')].map(l => {
            const s = l.querySelector('.zf-ioname'); return { line: l.textContent.replace(/\\s+/g, ' ').trim(), name: s ? s.textContent : null,
              ce: s ? s.getAttribute('contenteditable') : null, editable: s ? s.isContentEditable : null }; }); })()"""
        lines_ok = lambda L, rank='ASI': len(L) == 2 and all(x['name'] == IO and x['ce'] == 'false' and x['editable'] is False and x['line'] == f'{IO} {rank} تھانہ صدر ملتان' for x in L)
        L0 = pg.evaluate(LOCK)
        check(f'{tag}: «مرتبہ» اور دستخط میں تفتیشی افسر کا نام = subscriber کا نام، مقفل (contenteditable=false)', lines_ok(L0), L0)
        said = lambda: sum('تفتیشی افسر کا نام مقرر' in m for m in pg.evaluate('window.__toasts'))
        pg.evaluate("window.__toasts = []; 0")
        # (الف) نام چن کر اوپر لکھنا — دونوں سطروں میں
        for line in ('[data-k="murattib"]', '[data-k="io_sign"]'):
            pg.evaluate(SELIN, [line, IO, 0]); typ('غلام عباس'); pg.wait_for_timeout(300)
        La = pg.evaluate(LOCK)
        check(f'{tag}: نام چن کر نیا نام لکھا («مرتبہ» + دستخط) — نام نہیں بدلا، پیغام آیا', lines_ok(La) and said() >= 1, (La, pg.evaluate('window.__toasts')))
        # (ب) نام کے بالکل بعد Backspace، نام سے بالکل پہلے Delete
        CARET = """([sel, after]) => { const s = _zimniDoc().querySelector(sel + ' .zf-ioname'); const r = document.createRange();
            if (after) r.setStartAfter(s); else r.setStartBefore(s); r.collapse(true); _zimniDoc().focus(); const g = getSelection(); g.removeAllRanges(); g.addRange(r); return 0; }"""
        for line in ('[data-k="murattib"]', '[data-k="io_sign"]'):
            pg.evaluate(CARET, [line, True]); [pg.keyboard.press('Backspace') for _ in range(3)]
            pg.evaluate(CARET, [line, False]); [pg.keyboard.press('Delete') for _ in range(3)]
        pg.wait_for_timeout(300)
        Lb = pg.evaluate(LOCK)
        check(f'{tag}: نام کے ساتھ Backspace / Delete (3 بار) — نام جوں کا توں', lines_ok(Lb), Lb)
        # (ج) Ctrl+Backspace (پورا لفظ پیچھے) نام کے بعد
        pg.evaluate(CARET, ['[data-k="io_sign"]', True]); pg.keyboard.press('Control+Backspace'); pg.wait_for_timeout(300)
        check(f'{tag}: نام کے بعد Ctrl+Backspace — نام جوں کا توں', lines_ok(pg.evaluate(LOCK)), pg.evaluate(LOCK))
        # (د) پوری دستاویز منتخب (Ctrl+A) کر کے Delete، پھر لکھنا
        pg.evaluate(END, 'tr.zf-blk .zf-body'); pg.keyboard.press('Control+a'); pg.keyboard.press('Delete'); pg.wait_for_timeout(300)
        Ld = pg.evaluate(LOCK); body_left = pg.evaluate("_zimniDoc().querySelectorAll('tr.zf-blk').length")
        pg.keyboard.press('Control+a'); typ('x'); pg.wait_for_timeout(300)
        Ld2 = pg.evaluate(LOCK)
        check(f'{tag}: Ctrl+A → Delete / لکھنا — نام (اور ضمنی) جوں کی توں', lines_ok(Ld) and lines_ok(Ld2) and body_left >= 2, (Ld2, body_left))
        # (ہ) نام چن کر چسپاں (Ctrl+V کا واقعہ) اور کاٹنا (Ctrl+X)
        PASTE = """(sel) => { const el = _zimniDoc().querySelector(sel); const dt = new DataTransfer(); dt.setData('text/plain', 'غلام عباس');
            const e = new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e.defaultPrevented; }"""
        pg.evaluate(SELIN, ['[data-k="murattib"]', IO, 0]); pg.evaluate(PASTE, '[data-k="murattib"]'); pg.wait_for_timeout(300)
        pg.evaluate(SELIN, ['[data-k="io_sign"]', IO, 0]); pg.keyboard.press('Control+x'); pg.wait_for_timeout(300)
        Le = pg.evaluate(LOCK)
        check(f'{tag}: نام پر چسپاں / Ctrl+X — نام جوں کا توں', lines_ok(Le), Le)
        # (و) ڈھونڈیں/بدلیں — «سب بدلیں»: متن میں لکھا نام بدلے، مقفل نام نہیں
        pg.evaluate(f"""(() => {{ dioFindReplace(''); document.getElementById('dio-fr-find').value = '{IO}';
            document.getElementById('dio-fr-repl').value = 'غلام عباس'; dioFRReplaceAll(); dioFRClose(); return 0; }})()""")
        pg.wait_for_timeout(400)
        Lf = pg.evaluate(LOCK); body_t = pg.evaluate("[..._zimniDoc().querySelectorAll('tr.zf-blk .zf-body')].map(x => x.textContent).join(' ')")
        check(f'{tag}: ڈھونڈیں/بدلیں «سب بدلیں» — مقفل نام نہیں بدلا (متن میں لکھا افسر کا اپنا متن بدلا)', lines_ok(Lf) and 'مسمی غلام عباس' in body_t, (Lf, body_t[:80]))
        # (ز) عہدہ / تھانہ پہلے کی طرح قابلِ ترمیم (صرف نام مقفل)
        pg.evaluate(SELIN, ['[data-k="murattib"]', 'ASI', 0]); typ('SI'); pg.wait_for_timeout(300)
        Lg = pg.evaluate(LOCK)
        check(f'{tag}: «مرتبہ» میں عہدہ ASI → SI لکھا جا سکا، نام مقفل ہی', Lg[0]['line'] == f'{IO} SI تھانہ صدر ملتان' and Lg[0]['name'] == IO and Lg[0]['ce'] == 'false', Lg)
        pg.evaluate(SELIN, ['[data-k="murattib"]', 'SI', 0]); typ('ASI'); pg.wait_for_timeout(300)
        # محفوظ → دوبارہ کھولو → نام مقفل ہی؛ تاریخ اور SHO کا ربط برقرار
        pg.evaluate("_saveZimni(true, true)"); pg.wait_for_timeout(1500)
        zid = pg.evaluate("String((window.__db.zimni_reports||[]).slice(-1)[0].id)")
        pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1000)
        pg.evaluate(f"_openZimni('{zid}')"); pg.wait_for_timeout(2200)
        pg.evaluate("window.__toasts = []; 0")
        pg.evaluate(SELIN, ['[data-k="io_sign"]', IO, 0]); typ('ساجد علی'); pg.wait_for_timeout(400)
        Lh = pg.evaluate(LOCK)
        check(f'{tag}: محفوظ کر کے دوبارہ کھولا — نام اب بھی مقفل (لکھنے پر نہیں بدلا، پیغام آیا)', lines_ok(Lh) and said() >= 1, Lh)
        pg.evaluate(SELIN, [None, 'ندیم احمد', 0]); typ('ساجد محمود'); pg.wait_for_timeout(500)
        pg.evaluate(SELALL, 'tr.zf-blk .zf-actbody'); typ('22/10/2026'); pg.wait_for_timeout(500)
        r9 = pg.evaluate(RD)
        check(f'{tag}: دوبارہ کھولنے کے بعد بھی SHO کا ربط (دونوں جگہ) اور تاریخ کا ربط', r9['sho'] == ['ساجد محمود', 'ساجد محمود'] and r9['sd'] == '22/10/2026', r9)
        a, h = snap_print(pg, lambda: pg.evaluate("document.querySelector('[data-dio-print]').click()"), 'legal')
        t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' ', h))
        check(f'{tag}: پرنٹ میں تفتیشی افسر کا وہی نام («مرتبہ» + دستخط)، SHO کا نیا نام، ایک ہی تاریخ (کالم 1 = دستخط)',
              t.count(f'{IO} ASI') >= 2 and 'ساجد محمود' in t and 'ندیم احمد' not in t and t.count('22/10/2026') >= 2, (t.count(f'{IO} ASI'), t.count('22/10/2026')))
        # (ح) اندرونی ضمنی (بیانات 161): ہر بیان کے دستخط میں نام مقفل
        pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(800)
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
        pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(1800)
        pg.evaluate("_zaInsertWitnessStatement({ id: 'w-io-test', full_name: 'محمد اکرم ولد اللہ دتہ', status: 'fir_eye' })"); pg.wait_for_timeout(1500)
        LA = """(() => [..._zimniDoc().querySelectorAll('.zfa-wit-io')].map(l => { const s = l.querySelector('.zf-ioname');
            return { line: l.textContent.trim(), name: s ? s.textContent : null, ce: s ? s.getAttribute('contenteditable') : null }; }))()"""
        A0 = pg.evaluate(LA)
        pg.evaluate("window.__toasts = []; 0")
        if A0:
            pg.evaluate("""(() => { const s = [..._zimniDoc().querySelectorAll('.zfa-wit-io .zf-ioname')].pop(); const r = document.createRange(); r.selectNodeContents(s.parentNode);
                _zimniDoc().focus(); const g = getSelection(); g.removeAllRanges(); g.addRange(r); return 0; })()""")
            typ('غلام عباس'); pg.wait_for_timeout(400)
        A1 = pg.evaluate(LA)
        check(f'{tag}: اندرونی ضمنی — بیان کے دستخط میں نام مقفل؛ پوری سطر چن کر لکھنے پر بھی نہیں بدلا',
              bool(A0) and all(x['name'] == IO and x['ce'] == 'false' for x in A1) and A1 == A0 and said() >= 1, (A0, A1))
    except Exception as e:
        check(f'{tag}: bound fields section crashed', False, repr(e)[:400])

    # ═══ پرانی شکایات (regression): ایک تاریخ کی ایک ضمنی؛ کالم 2 دستی نمبر ═══
    try:
        pg.evaluate(SEED); open_zimni(pg)
        pg.evaluate("_saveZimni(true, true)"); pg.wait_for_timeout(1500)
        pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(900)
        pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2000)
        pg.evaluate("window.__toasts = []; 0")
        pg.evaluate("_saveZimni(false, true)"); pg.wait_for_timeout(1500)
        t = re.sub('[\u2066-\u2069]', '', ' | '.join(pg.evaluate('window.__toasts')))   # v566: پیغام میں نمبر/تاریخ الگ تھلگ (FSI/PDI)
        # v566 (TASK 6): قاعدہ اب «ایک افسر ایک تاریخ» — اسی تفتیشی افسر کی دوسری ضمنی پر وہی روک، نیا پیغام
        check(f'{tag}: ایک تاریخ کی ایک ہی ضمنی (ایک افسر) — دوسری پر خبردار، محفوظ نہیں', 'ایک افسر ایک تاریخ' in t and pg.evaluate("window.__db.zimni_reports.length") == 1, t[:160])
        pg.evaluate("_zimniAddBlock()"); pg.wait_for_timeout(200)
        pg.evaluate("(() => { const n = [..._zimniDoc().querySelectorAll('tr.zf-blk .zf-num')]; n[1].textContent = '7'; n[0].textContent = '3'; return 0; })()")
        a, h = snap_print(pg, lambda: pg.evaluate("document.querySelector('[data-dio-print]').click()"), 'legal')
        c2, q, fn = html_page(b, h, f'{tag}_serial')
        mm = q.evaluate(MEASURE); c2.close(); os.remove(fn)
        check(f'{tag}: کالم 2 کا نمبر دستی — لکھا ہوا (3، 7) ہی چھپا', mm['serials'] == ['3', '7'], mm['serials'])
    except Exception as e:
        check(f'{tag}: regression section crashed', False, repr(e)[:400])

    check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:3])
    ctx.close()


def challan(b):
    """7) محفوظ چالان کی چھپائی — الفاظ نہ جُڑیں، کچھ ضائع نہیں"""
    try:
        ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
        pg.evaluate(SEED); pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2600)
        T = ' بیان کیا کہ وہ اپنے موٹر سائیکل پر سوار ہو کر بازار سے واپس گھر آ رہا تھا کہ راستے میں نامعلوم ملزمان نے اسلحہ کے زور پر موبائل فون چھین لیا۔'
        pg.click('#ch173-doc .normwrap'); pg.keyboard.press('End'); pg.keyboard.type(T, delay=3)
        typed = pg.evaluate("document.querySelector('#ch173-doc [data-k=\"halaat\"]').textContent")
        pg.evaluate("_saveR173()"); pg.wait_for_timeout(1800)
        pg.evaluate("(async () => { openReport173WithType('list'); await new Promise(r => setTimeout(r, 2200)); const x = (window.__db.report_173 || []).slice(-1)[0]; if (x) await _r173OpenDoc(String(x.id)); return 0; })()")
        pg.wait_for_timeout(2600)
        pg.evaluate("(() => { window.__dp = []; window.__dioPaperAuto = 'legal'; window._dioDoPrint = function (h) { window.__dp.push(h); }; return 0; })()")
        pg.evaluate("_printR173()")
        for _ in range(150):
            if pg.evaluate("(window.__dp||[]).length"): break
            pg.wait_for_timeout(200)
        h = pg.evaluate("(window.__dp||[])[0] || ''")
        c2, q, fn = html_page(b, h, 'challan')
        H_SEL = '#ch173-doc [data-k="halaat"]'
        r = q.evaluate(SPACES, H_SEL)
        txt = q.evaluate("(s) => document.querySelector(s).textContent", H_SEL)
        c2.close(); os.remove(fn)
        check('challan: محفوظ چالان کے پرنٹ میں فونٹ کی kerning بند؛ سب سے تنگ خالی جگہ ≥ 0.19em (پہلے 0.12em کا اضافہ بھی ناکافی تھا)',
              r and r['kern'] == 'none' and r['n'] >= 15 and (r['min'] or 0) >= 0.19, r)
        check('challan: محفوظ چالان کے پرنٹ میں حالات کا ہر لفظ وہی (کچھ ضائع نہیں)', words(txt) == words(typed), (len(words(txt)), len(words(typed))))
        f = html_pdf(b, h, V + 'challan_legal.pdf')
        pf = pdf_fonts(f)
        check('challan: PDF میں اصل اردو فونٹ (Jameel Noori Nastaleeq) شامل', 'Jameel' in pf, pf[-300:])
        ws = pg.evaluate("(s) => { const h = document.querySelector(s); return [getComputedStyle(h).fontKerning, getComputedStyle(h).wordSpacing]; }", H_SEL)
        check('challan: اسکرین پر بھی وہی قاعدہ (kerning بند) — اسکرین اور کاغذ کی سطریں ایک جگہ ٹوٹیں', ws[0] == 'none', ws)
        check('challan: کوئی JS غلطی نہیں', not errs, errs[:3])
        ctx.close()
    except Exception as e:
        check('challan section crashed', False, repr(e)[:400])


with sync_playwright() as p:
    b = p.chromium.launch()
    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'):
        run(b, 'desktop', dict(viewport={'width': 1366, 'height': 768}), False)
        challan(b)
    if only in ('', 'mobile'):
        run(b, 'mobile', dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2), True)
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
