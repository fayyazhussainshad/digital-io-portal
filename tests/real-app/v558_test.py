"""(v558) اصل ایپ کی جانچ — Desktop + Mobile، اسکرین + پرنٹ

افسر کی شکایت اور ہدایات (22 اکتوبر 2026):
  «اندرونی ضمنی پر بیان لکھنے کے بعد محفوظ کرنے کے باوجود بیان کہیں محفوظ نہیں … ضمنیات/بیانات/
  نقشے/چالان کا محفوظ کرنے کا نظام ہر جگہ مختلف ہے — پورے سسٹم میں ٹھیک کریں»
  1) اندرونی ضمنی کی اوپر والی ٹول بار مکمل ختم — صرف محفوظ/اپ ڈیٹ (Ctrl+S بھی)، واپس، بند
  2) دائیں کونے / اوپر کی پٹی میں ڈراپ ڈاؤن: سسٹم میں درج تمام گواہان (محرر خود شامل) — نام چننے
     پر اُس کا بیان اندرونی ضمنی پر
  3) بیان کی جگہ پہلے «بیان ازاں» پھر گواہ کا نام
  4) گواہ کے مکمل نام و پتہ کے سامنے بائیں کنارے کے ساتھ «(زیردفعہ 161ض ف)» — جگہ نہ ہو تو اگلی
     سطر میں، جگہ وہی (بائیں کنارہ، حاشیے کے اصول)
  5) ہر بیان کے آخر میں بائیں جانب تفتیشی افسر کا نام اور تاریخ — بیرونی ضمنی کا دستخط والا اصول
  6) بیرونی ضمنی: کالم 2 کی لکیریں کاغذ کے نیچے تک (آخری تحریر / تفتیشی افسر کے خانے پر نہ رکیں)
  7) بیانات تاریخ اور گواہان کے ناموں کے ساتھ محفوظ ہوتے جائیں اور فہرست بنتی جائے
  + محفوظ کرنے کا نظام بیرونی ضمنی (v552) جیسا: پہلے آلے پر، پھر سرور؛ خودکار مسودہ؛ انٹرنیٹ آتے ہی
    خود سرور پر؛ عارضی خرابی پر «ٹوٹا» نہیں؛ Ctrl+S / Ctrl+P کبھی چالان کے راستے پر نہیں

چلانا: README.md — `python3 v558_test.py` (poppler درکار: pdftoppm / pdfinfo)
"""
import sys, os, re, json, subprocess, glob
sys.path.insert(0, '.')
from real import *
from PIL import Image

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v558/'
os.makedirs(V, exist_ok=True)
DPI = 72
LONG = 'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض موضع سید پور تحصیل شجاع آباد ضلع ملتان'

SEED = """(() => { const d = window.__db; const c1 = d.cases.find(c => c.id === 'c1');
  Object.assign(c1, { fir_number:'663/26', fir_date:'15/10/2026', section_of_law:'379 ت پ', case_station:'صدر ملتان',
    complainant:'محمد امجد حسین ولد عاشق حسین قوم آرائیں سکنہ بیرون دہلی گیٹ ملتان', fir_writer:'محمد اسلم ASI' });
  d.case_witnesses = [
    { id:'w1', case_id:'c1', full_name:'%s', status:'fir_eye', witness_type:'fir', created_at:'2026-10-01' },
    { id:'w2', case_id:'c1', full_name:'احمد علی ولد بشیر احمد', status:'fir_eye', witness_type:'fir', created_at:'2026-10-02' } ];
  d.fir_matn = [{ id:'m1', case_id:'c1', type:'fir', matn:'میں مدعی مقدمہ ہوں۔ آج مورخہ کو …', created_at:'2026-10-01' }];
  d.zimni_androoni_reports = []; d.report_173 = []; d.zimni_reports = [];
  window.__opts.fail = []; window.__opts.failSel = []; window.__opts.noTable = [];
  window._zaDbBroken = false; window._zaDbWarned = false;
  Object.keys(localStorage).filter(k => /^dio_za_|^dio_zimni_/.test(k)).forEach(k => localStorage.removeItem(k));
  return Promise.all(d.cases.map(c => offlineStore.cache('cases_cache', JSON.parse(JSON.stringify(c))))).then(() => 0); })()""" % LONG

HOOK = """(() => { window.__snaps = [];
  if (window.__snapObs) return 0;
  window.__snapObs = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.id === 'dio-print-frame') { const w = n.contentWindow; w.print = function () { window.__snaps.push(w.document.documentElement.outerHTML); }; }
  })));
  window.__snapObs.observe(document.body, { childList: true }); return 0; })()"""
TOASTS = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"""


def printed(pg, fn, paper):
    pg.evaluate(HOOK); pg.evaluate("window.__snaps = []; 0")
    pg.evaluate(f"window.__dioPaperAuto = '{paper}'; 0")
    fn()
    for _ in range(100):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
    return pg.evaluate("window.__snaps[0] || ''")


def to_pdf(b, html, name):
    fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_v558_' + name + '.html')
    open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + html)
    c = b.new_context(); c.route('**/*', route); q = c.new_page()
    q.goto(BASE + '_v558_' + name + '.html'); q.wait_for_timeout(1200); q.evaluate('document.fonts.ready')
    q.pdf(path=V + name + '.pdf', prefer_css_page_size=True, print_background=True)
    c.close(); os.remove(fn)
    return V + name + '.pdf'


def pdf_pages(pdf):
    return int(subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout.split('Pages:')[1].split()[0])


def line_gaps(pdf, tag, mb_cm=1.0):
    """ہر صفحے پر کھڑی لکیریں (صفحے کے نچلے نصف میں) — نچلا سرا نیچے کے حاشیے سے کتنا اوپر (px @72dpi)"""
    for f in glob.glob(V + tag + '-*.png'): os.remove(f)
    subprocess.run(['pdftoppm', '-png', '-r', str(DPI), '-gray', pdf, V + tag], check=True)
    out = []
    for png in sorted(glob.glob(V + tag + '-*.png'), key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0])):
        im = Image.open(png).convert('L'); W, H = im.size; px = im.load()
        dark = lambda x, y: 0 <= x < W and 0 <= y < H and px[x, y] < 140
        yb = H - int(round(mb_cm / 2.54 * DPI)); y0, y1 = int(H * 0.55), yb - 10
        xs = [x for x in range(W) if sum(1 for y in range(y0, y1) if dark(x, y)) >= 0.97 * (y1 - y0)]
        groups = []
        for x in xs:
            if groups and x - groups[-1][-1] <= 2: groups[-1].append(x)
            else: groups.append([x])
        gaps = []
        for g in groups:
            x = g[len(g) // 2]; y = y1
            while y < H and (dark(x, y) or dark(x - 1, y) or dark(x + 1, y)): y += 1
            gaps.append(yb - y)
        out.append(gaps)
    return out


def ws(pg):
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)


def open_za(pg):
    ws(pg); pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)


def new_za(pg):
    pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(1800)


def pick(pg, label_re):
    """ڈراپ ڈاؤن میں نام چنو (جیسے افسر چنتا ہے)"""
    v = pg.evaluate("""(re) => { const o = [...document.querySelectorAll('#zfa-wit-sel option')].find(o => new RegExp(re).test(o.textContent)); return o ? o.value : null; }""", label_re)
    if v is None: return False
    pg.select_option('#zfa-wit-sel', v); pg.wait_for_timeout(1200)
    return True


def za_rows(pg):
    return pg.evaluate("(window.__db.zimni_androoni_reports||[]).filter(r => r.case_id === 'c1').map(r => ({id:r.id, sn:r.serial_no, d:r.report_date, w:(r.content||{}).witnesses||[], h:((r.content||{}).bodyHtml||'').length}))")


GEO = """() => [...document.querySelectorAll('#ch173-doc .zfa-wit-block')].map(b => {
  const h = b.querySelector('.zfa-wit-head'), ref = h && h.querySelector('.zfa-wit-ref161');
  const body = b.closest('.zfa-body'); const bl = body.getBoundingClientRect();
  const rr = ref ? ref.getBoundingClientRect() : null;
  const rects = []; h.childNodes.forEach(n => { if (n.nodeType === 3 && n.nodeValue.trim()) { const r = document.createRange(); r.selectNodeContents(n);
    [...r.getClientRects()].forEach(x => { if (x.height > 2 && x.width > 1) rects.push(x); }); } });
  const last = rects.reduce((m, x) => (!m || x.top > m.top + 2) ? x : m, null);
  const lines = new Set(rects.map(x => Math.round(x.top / 4))).size;
  const ov = rr && rects.some(x => !(x.right <= rr.left + 1 || x.left >= rr.right - 1) && !(x.bottom <= rr.top + 1 || x.top >= rr.bottom - 1));
  const io = b.querySelector('.zfa-wit-io'), dt = b.querySelector('.zfa-wit-date');
  const ir = io.getBoundingClientRect(), dr = dt.getBoundingClientRect();
  const tl = (el) => { const r = document.createRange(); r.selectNodeContents(el); const xs = [...r.getClientRects()].filter(x => x.width > 1); return xs.length ? Math.min(...xs.map(x => x.left)) : 1e9; };
  return { name: b.getAttribute('data-witness-name'), head: h.textContent.replace(/\\s+/g, ' ').trim(), ref: ref ? ref.textContent : null,
    refLeft: rr ? Math.round(rr.left - bl.left) : null, same: !!(rr && last && Math.abs(rr.top - last.top) < 8), below: !!(rr && last && rr.top >= last.bottom - 6),
    lines, ov: !!ov, ioLeft: Math.round(tl(io) - bl.left), dtLeft: Math.round(tl(dt) - bl.left), dateBelow: dr.top >= ir.bottom - 2,
    ioBold: parseInt(getComputedStyle(io).fontWeight, 10), date: dt.textContent.trim(), gaps: b.querySelectorAll('.zfa-wit-sign .zfa-wit-gap').length,
    stmt: (b.querySelector('.zfa-wit-stmt') || {}).textContent || '', close: (b.querySelector('.zfa-wit-close') || {}).textContent || '' };
})"""


def run(b, tag, ctxargs, mobile):
    ctx, pg, errs = open_app(b, **ctxargs)
    pg.on('dialog', lambda d: d.accept())
    pg.evaluate(TOASTS)
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")

    # ═══ 1) ٹول بار ختم — صرف ڈراپ ڈاؤن + محفوظ / واپس / بند ═══
    try:
        pg.evaluate(SEED); open_za(pg); new_za(pg)
        bar = pg.evaluate("""(() => { const a = document.getElementById('workspace-editor-area'); const bar = a.querySelector('.zfa-bar');
            return { bar: !!bar, btns: bar ? [...bar.querySelectorAll('button')].map(x => x.textContent.replace(/\\s+/g, ' ').trim()) : [],
              sel: !!a.querySelector('#zfa-wit-sel'), old: ['#zf-btn-b', '#zf-btn-i', '#ch173-font-sel', '#ch173-brush-btn'].filter(s => a.querySelector(s)),
              anyOther: a.querySelectorAll('button').length - a.querySelectorAll('.zfa-bar button').length - a.querySelectorAll('#ch173-doc button').length }; })()""")
        check(f'{tag}: اوپر کی پرانی ٹول بار ختم (B/I/U، فونٹ، برش وغیرہ نہیں)', bar['bar'] and not bar['old'] and bar['anyOther'] == 0, bar)
        check(f'{tag}: پٹی میں صرف «محفوظ»، «واپس»، «بند» + گواہ کا ڈراپ ڈاؤن', bar['sel'] and len(bar['btns']) == 3
              and 'محفوظ' in bar['btns'][0] and 'واپس' in bar['btns'][1] and 'بند' in bar['btns'][2], bar['btns'])
        pos = pg.evaluate("""(() => { const s = document.getElementById('zfa-wit-sel').getBoundingClientRect(), bar = document.querySelector('.zfa-bar').getBoundingClientRect();
            return { right: Math.round(bar.right - s.right), top: Math.round(s.top - bar.top) }; })()""")
        check(f'{tag}: ڈراپ ڈاؤن دائیں کونے میں (اوپر کی پٹی)', pos['right'] <= 90 and pos['top'] <= 12, pos)
        opts = pg.evaluate("[...document.querySelectorAll('#zfa-wit-sel option')].map(o => o.textContent)")
        check(f'{tag}: ڈراپ ڈاؤن — مقدمے کے تمام گواہان + مدعی + محرر (خود) + «نیا گواہ»',
              any('(مدعی)' in o for o in opts) and any('محمد اسلم' in o and '(محرر)' in o for o in opts)
              and any(LONG in o for o in opts) and any('احمد علی' in o for o in opts) and any('نیا گواہ' in o for o in opts), opts)
    except Exception as e:
        check(f'{tag}: toolbar section crashed', False, repr(e)[:300])

    # ═══ 2) گواہ چننے پر بیان — «بیان ازاں» + نام، (زیردفعہ 161ض ف) بائیں کنارے پر، IO + تاریخ ═══
    try:
        pick(pg, 'احمد علی'); pick(pg, re.escape(LONG)); pick(pg, r'\(محرر\)'); pick(pg, r'\(مدعی\)')
        g = pg.evaluate(GEO)
        check(f'{tag}: چار بیان شامل (چنے ہوئے گواہان کی ترتیب سے)', len(g) == 4 and 'احمد علی' in g[0]['name'] and LONG in g[1]['name'], [x['name'] for x in g])
        check(f'{tag}: ہر بیان «بیان ازاں» سے شروع، پھر گواہ کا مکمل نام و پتہ', all(x['head'].startswith('بیان ازاں ' + x['name']) for x in g), [x['head'][:60] for x in g])
        check(f'{tag}: حوالہ ٹھیک «(زیردفعہ 161ض ف)»', all(x['ref'] == '(زیردفعہ 161ض ف)' for x in g), [x['ref'] for x in g])
        check(f'{tag}: حوالہ بائیں کنارے (حاشیے) کے ساتھ — ہر بیان میں (±2px)', all(x['refLeft'] is not None and -1 <= x['refLeft'] <= 2 for x in g), [x['refLeft'] for x in g])
        check(f'{tag}: حوالہ نام کے کسی حصے پر نہیں چڑھتا', not any(x['ov'] for x in g), [x['ov'] for x in g])
        check(f'{tag}: چھوٹا نام — حوالہ اسی سطر میں (نام کے سامنے)', g[0]['same'], g[0])
        sig = [(x['ioLeft'], x['dtLeft'], x['dateBelow'], x['ioBold'], x['date'], x['gaps']) for x in g]
        check(f'{tag}: ہر بیان کے آخر میں بائیں جانب تفتیشی افسر کا نام (بولڈ) اور نیچے تاریخ DD/MM/YYYY — بیرونی ضمنی کا اصول (دو خالی سطریں)',
              all(-1 <= a <= 3 and -1 <= d <= 3 and bl and w >= 700 and re.fullmatch(r'\d{2}/\d{2}/\d{4}', dt) and gp == 2 for a, d, bl, w, dt, gp in sig), sig)
        m = g[2]
        check(f'{tag}: محرر — نام کے ساتھ «محرر» اور تھانہ، FIR کا متن نہیں', 'محرر' in m['name'] and 'صدر ملتان' in m['name'] and 'مدعی مقدمہ' not in m['stmt'], (m['name'], m['stmt'][:40]))
        check(f'{tag}: عام گواہ — «بیان کیا کہ» + FIR کا متن؛ آخر میں «بیان سن لیا ہے درست ہے»', 'بیان کیا کہ' in g[0]['stmt'] and 'مدعی مقدمہ' in g[0]['stmt'] and 'درست ہے' in g[0]['close'], g[0]['stmt'][:50])
        marks = pg.evaluate("[...document.querySelectorAll('#zfa-wit-sel option')].filter(o => o.textContent.startsWith('✓ ')).length")
        check(f'{tag}: جن کا بیان صفحے پر آ گیا اُن کے آگے ✓', marks == 4, marks)
        # لمبا نام: حوالہ آخری سطر میں جگہ نہ ہو تو اگلی سطر — جگہ وہی (بائیں کنارہ)
        res = pg.evaluate("""async (base) => { const out = []; const doc = _zimniDoc(); const body = doc.querySelector('.zfa-body');
            const words = ' موضع سید پور بستی دھپ سڑی نزد جامع مسجد'.split(' ').filter(Boolean);
            for (let i = 0; i < 40; i++) {
              const nm = base + ' ' + Array.from({length: i}, (_, k) => words[k % words.length]).join(' ');
              await _zaInsertWitnessStatement({ id: 'L' + i, full_name: nm.trim(), status: 'fir_eye' });
              const b = body.lastElementChild, h = b.querySelector('.zfa-wit-head'), ref = h.querySelector('.zfa-wit-ref161');
              const rr = ref.getBoundingClientRect(), bl = body.getBoundingClientRect();
              const rects = []; h.childNodes.forEach(n => { if (n.nodeType === 3 && n.nodeValue.trim()) { const r = document.createRange(); r.selectNodeContents(n); [...r.getClientRects()].forEach(x => { if (x.height > 2 && x.width > 1) rects.push(x); }); } });
              const last = rects.reduce((m, x) => (!m || x.top > m.top + 2) ? x : m, null);
              const ov = rects.some(x => !(x.right <= rr.left + 1 || x.left >= rr.right - 1) && !(x.bottom <= rr.top + 1 || x.top >= rr.bottom - 1));
              const st = { i, same: Math.abs(rr.top - last.top) < 8, below: rr.top >= last.bottom - 6, left: Math.round(rr.left - bl.left), ov };
              b.remove();
              if (st.below) { out.push(st); break; }
              out.push(st);
            } return out; }""", LONG)
        nxt = [r for r in res if r['below']]
        check(f'{tag}: لمبا نام (آخری سطر میں جگہ نہیں) — حوالہ اگلی سطر میں، بائیں کنارے پر، نام پر نہیں چڑھتا',
              bool(nxt) and -1 <= nxt[0]['left'] <= 2 and not nxt[0]['ov'] and all(not r['ov'] and -1 <= r['left'] <= 2 for r in res), res[-3:])
        check(f'{tag}: (اسی جانچ میں) جب تک جگہ ہو حوالہ نام کی آخری سطر ہی میں', all(r['same'] for r in res if not r['below']), [r for r in res if not r['below'] and not r['same']][:3])
    except Exception as e:
        check(f'{tag}: witness section crashed', False, repr(e)[:300])

    # ═══ 3) محفوظ — Ctrl+S / «محفوظ» → سرور؛ پھر «اپ ڈیٹ» اسی ریکارڈ میں ═══
    try:
        pg.evaluate("window.__toasts = []; 0")
        if mobile: pg.click('#zfa-save-btn')
        else:
            pg.click('#ch173-doc .zfa-wit-stmt'); pg.keyboard.press('End'); pg.keyboard.type(' میں موقع پر موجود تھا۔')
            pg.keyboard.press('Control+s')
        pg.wait_for_timeout(1800)
        rows = za_rows(pg)
        t = ' | '.join(pg.evaluate('window.__toasts'))
        check(f'{tag}: {"«محفوظ» بٹن" if mobile else "Ctrl+S"} — بیان سرور پر محفوظ (ایک ریکارڈ، تاریخ YYYY-MM-DD، گواہان کے نام)',
              len(rows) == 1 and re.fullmatch(r'\d{4}-\d{2}-\d{2}', rows[0]['d'] or '') and len(rows[0]['w']) == 4, rows)
        check(f'{tag}: صاف پیغام «سرور پر محفوظ ہو گئی»', 'سرور پر محفوظ' in t, t)
        check(f'{tag}: کوئی بیان «چالان» (report_173) کی جدول میں نہیں گیا', pg.evaluate("(window.__db.report_173||[]).length") == 0)
        btn = pg.evaluate("document.getElementById('zfa-save-btn').textContent.trim()")
        check(f'{tag}: محفوظ کے بعد بٹن «اپ ڈیٹ»', 'اپ ڈیٹ' in btn, btn)
        pg.evaluate("""(() => { const s = document.querySelector('#ch173-doc .zfa-wit-stmt'); s.focus(); const r = document.createRange(); r.selectNodeContents(s); r.collapse(false);
            const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, ' ترمیم شدہ جملہ۔'); return 0; })()""")
        pg.wait_for_timeout(300)
        pg.click('#zfa-save-btn'); pg.wait_for_timeout(1800)
        rows2 = za_rows(pg)
        body = pg.evaluate("((window.__db.zimni_androoni_reports||[])[0]||{}).content ? window.__db.zimni_androoni_reports[0].content.bodyHtml : ''")
        check(f'{tag}: «اپ ڈیٹ» — اسی ریکارڈ میں ترمیم (دوسرا ریکارڈ نہیں)', len(rows2) == 1 and rows2[0]['id'] == rows[0]['id'] and 'ترمیم شدہ جملہ' in body, rows2)
        check(f'{tag}: محفوظ مواد میں جدول کی کھینچنے والی گرفتیں (grips) نہیں', 'zfa-colgrip' not in body and 'zfa-rowgrip' not in body)
        # دستاویز کی اوپر والی پٹی (مقدمہ / ٹیب) کا «محفوظ» — پہلے یہاں «یہ صفحہ خودکار محفوظ ہوتا ہے» آتا اور بیان محفوظ نہیں ہوتا تھا
        pg.evaluate("""(() => { const s = document.querySelector('#ch173-doc .zfa-wit-stmt'); document.getElementById('ch173-doc').focus(); const r = document.createRange(); r.selectNodeContents(s); r.collapse(false);
            const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, ' پٹی والا محفوظ۔'); window.__toasts = []; return 0; })()""")
        pg.evaluate("document.getElementById('dio-dv-save').click()"); pg.wait_for_timeout(1500)
        body = pg.evaluate("window.__db.zimni_androoni_reports[0].content.bodyHtml")
        t = ' | '.join(pg.evaluate('window.__toasts'))
        check(f'{tag}: اوپر کی (مقدمے والی) پٹی کا «محفوظ» — بیان واقعی محفوظ (اب «خودکار محفوظ» کا غلط پیغام نہیں)',
              'پٹی والا محفوظ' in body and len(za_rows(pg)) == 1 and 'خودکار' not in t and 'سرور پر محفوظ' in t, t)
        h = printed(pg, lambda: pg.evaluate("document.getElementById('dio-dv-print') ? document.getElementById('dio-dv-print').click() : _dioPrintCurrent()"), 'legal')
        check(f'{tag}: اوپر کی پٹی کا «پرنٹ» — اندرونی ضمنی کا اپنا کاغذ', 'zfa-tbl' in h and 'zfa-wit-ref161' in h, len(h))
        if not mobile:
            pg.evaluate("""(() => { const s = document.querySelector('#ch173-doc .zfa-wit-stmt'); document.getElementById('ch173-doc').focus(); const r = document.createRange(); r.selectNodeContents(s); r.collapse(false);
                const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, ' Ctrl+S والی ترمیم۔'); return 0; })()""")
            pg.keyboard.press('Control+s'); pg.wait_for_timeout(1500)
            body = pg.evaluate("window.__db.zimni_androoni_reports[0].content.bodyHtml")
            check(f'{tag}: Ctrl+S سے بھی اپ ڈیٹ (اسی ریکارڈ میں)', len(za_rows(pg)) == 1 and 'Ctrl+S والی ترمیم' in body)
            # چالان کا محفوظ کرنے والا غلطی سے بلایا جائے تب بھی بیان اپنی جگہ
            pg.evaluate("_saveR173()"); pg.wait_for_timeout(1500)
            check(f'{tag}: چالان کا «محفوظ» (_saveR173) اندرونی ضمنی کھلی ہو تو بیان ہی محفوظ کرتا ہے — چالان کی جدول خالی',
                  pg.evaluate("(window.__db.report_173||[]).length") == 0 and len(za_rows(pg)) == 1)
    except Exception as e:
        check(f'{tag}: save section crashed', False, repr(e)[:300])

    # ═══ 4) Ctrl+P / پرنٹ — اندرونی ضمنی کا اپنا کاغذ (چالان نہیں)؛ لکیریں نیچے تک ═══
    try:
        if not mobile:
            h = printed(pg, lambda: pg.keyboard.press('Control+p'), 'legal')
            check(f'{tag}: Ctrl+P — اندرونی ضمنی کا اپنا پرنٹ (zfa-tbl، چالان کی شکل نہیں)', 'zfa-tbl' in h and 'zfa-wit-ref161' in h, len(h))
        for paper in ['legal', 'a4']:
            h = printed(pg, lambda: pg.evaluate("_printZimniA()"), paper)
            ok = ('(زیردفعہ 161ض ف)' in h) and ('zfa-wit-io' in h) and '<script' not in h
            check(f'{tag}: پرنٹ ({paper}) — بیان، حوالہ اور IO کا نام کاغذ پر', ok, len(h))
            pdf = to_pdf(b, h, f'{tag}_za_{paper}')
            gaps = line_gaps(pdf, f'{tag}_za_{paper}')
            check(f'{tag}: پرنٹ ({paper}) — ہر صفحے پر کھڑی لکیریں صفحے کے نیچے (حاشیے) تک', all(len(gp) >= 2 and all(x <= 8 for x in gp) for gp in gaps), gaps)
    except Exception as e:
        check(f'{tag}: print section crashed', False, repr(e)[:300])

    # ═══ 5) فہرست — تاریخ + گواہان کے نام + حالت؛ واپس / بند ═══
    try:
        pg.click("button:has-text('← واپس')"); pg.wait_for_timeout(1500)
        L = pg.evaluate("""(() => { const rows = [...document.querySelectorAll('.zat-wrap tbody tr')];
            return rows.map(r => ({ d: (r.querySelector('.dtc')||{}).textContent || '', w: (r.querySelector('.wit')||{}).textContent || '', st: r.textContent.includes('سرور پر محفوظ') })); })()""")
        check(f'{tag}: فہرست — تاریخ (DD/MM/YYYY)، گواہان کے نام، «سرور پر محفوظ»', len(L) == 1 and re.search(r'\d{2}/\d{2}/\d{4}', L[0]['d'])
              and 'احمد علی' in L[0]['w'] and 'غلام رسول' in L[0]['w'] and L[0]['st'], L)
        # دوسرا بیان (اگلا نمبر) — فہرست بنتی جائے
        new_za(pg); pick(pg, 'احمد علی'); pg.click('#zfa-save-btn'); pg.wait_for_timeout(1500)
        pg.click("button:has-text('← واپس')"); pg.wait_for_timeout(1300)
        rows = za_rows(pg)
        n = pg.evaluate("document.querySelectorAll('.zat-wrap tbody tr').length")
        check(f'{tag}: دوسرا بیان — نمبر 2، فہرست میں دو قطاریں', sorted(r['sn'] for r in rows) == [1, 2] and n == 2, (rows, n))
        # بند — بیانات کا صفحہ بند
        pg.evaluate("_openZimniA(String(_zaList[0].id))"); pg.wait_for_timeout(1500)
        pg.click("button:has-text('✕ بند')"); pg.wait_for_timeout(1300)
        st = pg.evaluate("({ tab: (typeof _dioActiveTab !== 'undefined' ? _dioActiveTab : null), doc: !!document.querySelector('#ch173-doc .zfa-tbl') })")
        check(f'{tag}: «✕ بند» — بیانات کا صفحہ بند (ٹیب بند، ایڈیٹر نہیں)', st['tab'] != 'statements_161' and not st['doc'], st)
    except Exception as e:
        check(f'{tag}: list section crashed', False, repr(e)[:300])

    # ═══ 6) خودکار مسودہ — محفوظ کیے بغیر دوسرا صفحہ / ایپ بند: لکھا ضائع نہیں ═══
    try:
        pg.evaluate(SEED); open_za(pg); new_za(pg); pick(pg, 'احمد علی')
        pg.evaluate("""(() => { const s = document.querySelector('#ch173-doc .zfa-wit-stmt'); s.focus(); const r = document.createRange(); r.selectNodeContents(s); r.collapse(false);
            const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, ' مسودے والا جملہ۔'); return 0; })()""")
        pg.wait_for_timeout(2200)
        dr = pg.evaluate("Object.values(JSON.parse(localStorage.getItem('dio_za_draft_c1') || '{}')).map(d => d.bodyHtml.includes('مسودے والا جملہ'))")
        check(f'{tag}: لکھتے ہی (1.5 سیکنڈ) خودکار مسودہ اسی آلے پر', dr == [True], dr)
        pg.evaluate("""(() => { const s = document.querySelector('#ch173-doc .zfa-wit-stmt'); s.focus(); document.execCommand('insertText', false, ' فوری جملہ۔'); window.dispatchEvent(new Event('pagehide')); return 0; })()""")
        dr2 = pg.evaluate("Object.values(JSON.parse(localStorage.getItem('dio_za_draft_c1') || '{}')).some(d => d.bodyHtml.includes('فوری جملہ'))")
        check(f'{tag}: صفحہ بند / ایپ پس منظر میں (pagehide) — اسی لمحے مسودہ', dr2)
        ws(pg)                                     # محفوظ کیے بغیر دوسرا صفحہ
        pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
        dl = pg.evaluate("[...document.querySelectorAll('.zat-wrap tr.zt-draft')].map(r => r.textContent.replace(/\\s+/g, ' '))")
        check(f'{tag}: فہرست میں «مسودہ — ابھی محفوظ نہیں کیا گیا» (گواہ کے نام کے ساتھ)', len(dl) == 1 and 'مسودہ' in dl[0] and 'احمد علی' in dl[0], dl)
        pg.click(".zat-wrap tr.zt-draft button[title='جاری رکھیں']"); pg.wait_for_timeout(1600)
        back = pg.evaluate("document.querySelector('#ch173-doc .zfa-body').textContent")
        check(f'{tag}: «جاری رکھیں» — لکھا ہوا جوں کا توں واپس', 'مسودے والا جملہ' in back and 'فوری جملہ' in back)
        pg.click('#zfa-save-btn'); pg.wait_for_timeout(1500)
        check(f'{tag}: مسودہ محفوظ کرنے پر سرور پر، مسودہ ختم', len(za_rows(pg)) == 1 and pg.evaluate("localStorage.getItem('dio_za_draft_c1')") is None, za_rows(pg))
        # واپس — غیر محفوظ ترمیم ہو تو پوچھے (OK = محفوظ)
        pg.evaluate("""(() => { const s = document.querySelector('#ch173-doc .zfa-wit-stmt'); document.getElementById('ch173-doc').focus(); const r = document.createRange(); r.selectNodeContents(s); r.collapse(false);
            const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, ' واپسی سے پہلے۔'); return 0; })()""")
        pg.wait_for_timeout(300)
        pg.click("button:has-text('← واپس')"); pg.wait_for_timeout(2000)
        body = pg.evaluate("window.__db.zimni_androoni_reports[0].content.bodyHtml")
        check(f'{tag}: «واپس» پر غیر محفوظ ترمیم — پوچھ کر محفوظ', 'واپسی سے پہلے' in body and len(za_rows(pg)) == 1)
    except Exception as e:
        check(f'{tag}: draft section crashed', False, repr(e)[:300])

    # ═══ 7) انٹرنیٹ نہیں / سرور کا رد / عارضی خرابی — کچھ ضائع نہیں، بعد میں خود سرور پر ═══
    try:
        pg.evaluate(SEED); open_za(pg)
        # عارضی خرابی (سرور کا وقت ختم) — پرانے نظام میں پورا سیشن «ٹوٹا» ہو جاتا تھا
        pg.evaluate("window.__opts.failSel = ['zimni_androoni_reports:select']; 0")
        pg.evaluate("_loadZimniA().then(() => 0)"); pg.wait_for_timeout(500)
        broken = pg.evaluate("!!window._zaDbBroken")
        pg.evaluate("window.__opts.failSel = []; 0")
        check(f'{tag}: پڑھنے میں عارضی خرابی — «ڈیٹابیس ٹوٹا» نہیں مانا گیا', not broken)
        pg.evaluate("_renderZimniAList()"); new_za(pg); pick(pg, 'احمد علی')
        pg.click('#zfa-save-btn'); pg.wait_for_timeout(1500)
        check(f'{tag}: (عارضی خرابی کے بعد) بیان سیدھا سرور پر', len(za_rows(pg)) == 1, za_rows(pg))
        # انٹرنیٹ بند
        ctx.set_offline(True); pg.wait_for_timeout(300)
        pg.click("button:has-text('← واپس')"); pg.wait_for_timeout(1200)
        new_za(pg); pg.wait_for_timeout(500)
        pg.evaluate("""(() => { const b = document.querySelector('#ch173-doc .zfa-body'); b.focus(); document.execCommand('insertText', false, 'آف لائن لکھا گیا بیان۔'); return 0; })()""")
        pg.evaluate("window.__toasts = []; 0")
        pg.click('#zfa-save-btn'); pg.wait_for_timeout(1200)
        t = ' | '.join(pg.evaluate('window.__toasts'))
        loc = pg.evaluate("_zaLocalGet('c1').filter(z => _zimniIsPending(z)).length")
        check(f'{tag}: انٹرنیٹ نہیں — بیان اسی آلے پر محفوظ («انٹرنیٹ آنے پر خود سرور پر»)', loc == 1 and 'اس آلے پر محفوظ' in t and len(za_rows(pg)) == 1, (loc, t))
        pg.click("button:has-text('← واپس')"); pg.wait_for_timeout(1200)
        stt = pg.evaluate("[...document.querySelectorAll('.zat-wrap tbody tr')].map(r => r.textContent.includes('سرور پر بھیجنا باقی'))")
        check(f'{tag}: فہرست میں حالت «اس آلے پر محفوظ — سرور پر بھیجنا باقی»', stt.count(True) == 1, stt)
        ctx.set_offline(False); pg.wait_for_timeout(5500)       # 'online' → خود sync
        rows = za_rows(pg)
        check(f'{tag}: انٹرنیٹ آتے ہی خود سرور پر (دوہرا اندراج نہیں)', len(rows) == 2 and sorted(r['sn'] for r in rows) == [1, 2], rows)
        pg.evaluate("_zaSyncPending().then(() => 0)"); pg.wait_for_timeout(800)
        check(f'{tag}: دوبارہ sync — پھر بھی دو ہی (دوہرا نہیں)', len(za_rows(pg)) == 2)
        # سرور کا رد (اجازت نہیں) — اصل وجہ، بیان آلے پر، بعد میں بھیجنے پر سرور پر
        pg.evaluate("window.__opts.fail = ['zimni_androoni_reports:insert']; window.__toasts = []; 0")
        new_za(pg); pick(pg, 'احمد علی'); pg.click('#zfa-save-btn'); pg.wait_for_timeout(1500)
        t = ' | '.join(pg.evaluate('window.__toasts'))
        check(f'{tag}: سرور کا رد — اصل وجہ صاف لفظوں میں، «اس آلے پر محفوظ ہے، کچھ ضائع نہیں»', 'اجازت نہیں' in t and 'ضائع نہیں' in t and len(za_rows(pg)) == 2, t[-200:])
        pg.click("button:has-text('← واپس')"); pg.wait_for_timeout(2500)   # سرور ابھی بھی رد کر رہا ہے
        why = pg.evaluate("[...document.querySelectorAll('.zat-wrap .zst-why')].map(x => x.textContent)")
        check(f'{tag}: فہرست میں وجہ بھی', bool(why) and 'اجازت' in why[0], why)
        pg.evaluate("window.__opts.fail = []; window.__toasts = []; 0")
        pg.click("button:has-text('سرور پر بھیجیں')"); pg.wait_for_timeout(2000)
        check(f'{tag}: «⟳ سرور پر بھیجیں» — اب سرور پر', len(za_rows(pg)) == 3, za_rows(pg))
        # v558 (افسر: «لیپ ٹاپ کی ضمنیاں موبائل پر نہیں») — انٹرنیٹ مسلسل چلتا رہے تب بھی باقی بیان
        #   خود سرور پر (پہلے صرف انٹرنیٹ ٹوٹ کر واپس آنے پر)؛ یہاں ہر منٹ والی کوشش سیدھی بلائی گئی
        pg.evaluate("window.__opts.fail = ['zimni_androoni_reports:insert']; 0")
        new_za(pg); pick(pg, 'احمد علی'); pg.click('#zfa-save-btn'); pg.wait_for_timeout(1500)
        pg.evaluate("window.__opts.fail = []; window._zaLastTry = 0; _zaSyncSoon(); 0"); pg.wait_for_timeout(2500)
        check(f'{tag}: انٹرنیٹ چلتا رہے — باقی بیان خود (ہر منٹ والی کوشش) سرور پر', len(za_rows(pg)) == 4, za_rows(pg))
    except Exception as e:
        check(f'{tag}: offline section crashed', False, repr(e)[:300])
        try: ctx.set_offline(False)
        except Exception: pass

    # ═══ 8) پرانا محفوظ بیان (v557 تک کی شکل) — کھلے، حذف/اپ ڈیٹ ٹھیک ═══
    try:
        pg.evaluate(SEED)
        pg.evaluate("""(() => { const old = '<div class="zfa-head"><div class="zfa-title">اندرونی ضمنی</div></div><table class="zfa-tbl"><colgroup><col style="width:12%"><col style="width:5%"><col style="width:83%"></colgroup><tbody><tr><td class="zfa-c-serial"><div class="zfa-nums"></div></td><td class="zfa-c-gutter"><br></td><td class="zfa-c-body"><div class="zfa-body"><div class="zfa-wit-block" data-witness-id="w2" data-witness-name="احمد علی ولد بشیر احمد"><div class="zfa-wit-headrow"><div class="zfa-wit-ref">(بحوالہ ضمنی نمبر 1 فقرہ نمبر زیردفعہ 161 ض ف)</div><div class="zfa-wit-head">بیان ازاں احمد علی ولد بشیر احمد</div></div><div class="zfa-wit-stmt">بیان کیا کہ پرانا بیان</div><div class="zfa-wit-close">بیان سن لیا ہے درست ہے</div><div class="zfa-wit-sign"><div class="zfa-wit-io">فیاض حسین شاد</div><div class="zfa-wit-date">10/10/2026</div></div></div></div></td></tr></tbody></table>';
            window.__db.zimni_androoni_reports.push({ id:'old1', case_id:'c1', serial_no:1, report_date:'2026-10-10', content:{ bodyHtml: old, serial_no:1, saved_at:'2026-10-10T05:00:00Z', witnesses:['احمد علی ولد بشیر احمد'] } }); return 0; })()""")
        open_za(pg)
        L = pg.evaluate("[...document.querySelectorAll('.zat-wrap tbody tr')].map(r => r.textContent.replace(/\\s+/g, ' '))")
        check(f'{tag}: پرانا بیان فہرست میں (10/10/2026، احمد علی، سرور پر محفوظ)', len(L) == 1 and '10/10/2026' in L[0] and 'احمد علی' in L[0] and 'سرور پر محفوظ' in L[0], L)
        pg.click(".zat-wrap button[title='ترمیم']"); pg.wait_for_timeout(1500)
        o = pg.evaluate("""(() => { const io = document.querySelector('#ch173-doc .zfa-wit-io'), b = document.querySelector('#ch173-doc .zfa-body');
            const r = document.createRange(); r.selectNodeContents(io); const x = [...r.getClientRects()][0];
            return { ref: !!document.querySelector('#ch173-doc .zfa-wit-ref'), left: Math.round(x.left - b.getBoundingClientRect().left) }; })()""")
        check(f'{tag}: پرانا بیان کھلے — حوالہ موجود، IO کا نام بائیں (نئے اصول کے مطابق)', o['ref'] and -1 <= o['left'] <= 3, o)
        pg.click('#zfa-save-btn'); pg.wait_for_timeout(1500)
        check(f'{tag}: پرانے بیان کی «اپ ڈیٹ» — اسی ریکارڈ میں', [r['id'] for r in za_rows(pg)] == ['old1'], za_rows(pg))
    except Exception as e:
        check(f'{tag}: old record section crashed', False, repr(e)[:300])

    # ═══ 9) بیرونی ضمنی — ایڈیٹر میں بھی کالم کی لکیریں کاغذ کے نیچے تک؛ محفوظ مواد صاف ═══
    try:
        pg.evaluate(SEED); ws(pg)
        pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(1200)
        pg.evaluate("_newZimni()"); pg.wait_for_timeout(2200)
        if mobile:   # موبائل: «کاغذ» منظر (فارم/کارڈ منظر میں لکیریں ہوتی ہی نہیں)
            pg.evaluate("dioMobile.setMode('paper')"); pg.wait_for_timeout(900)
        FILL = """(() => { const d = _zimniDoc(), t = d.querySelector('table.zf-tbl'), dr = d.getBoundingClientRect();
            const sc = dr.height / d.offsetHeight, pb = parseFloat(getComputedStyle(d).paddingBottom) || 0;
            const ser = t.querySelector('tr.zf-endrow td.zf-c-serial').getBoundingClientRect();
            return { gap: Math.round((d.offsetHeight - pb) - (t.getBoundingClientRect().bottom - dr.top) / sc),
                     col2: Math.round((d.offsetHeight - pb) - (ser.bottom - dr.top) / sc),
                     bl: getComputedStyle(t.querySelector('tr.zf-endrow td.zf-c-serial')).borderLeftStyle }; })()"""
        f = pg.evaluate(FILL)
        check(f'{tag}: بیرونی ضمنی (ایڈیٹر) — کالم 2 کی لکیریں IO کے خانے پر نہیں رکتیں، کاغذ کے نیچے (حاشیے) تک (±3px)', abs(f['gap']) <= 3 and abs(f['col2']) <= 3 and f['bl'] == 'solid', f)
        pg.evaluate("""(() => { const b = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); b.focus(); const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
            const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, ' ' + 'دوران تفتیش موقع پر پہنچ کر گواہان کے بیانات قلمبند کیے گئے۔ '.repeat(12)); return 0; })()""")
        pg.wait_for_timeout(900)
        f2 = pg.evaluate(FILL)
        check(f'{tag}: بیرونی ضمنی — متن بڑھنے پر بھی لکیریں نیچے تک (خود دوبارہ ناپ)', abs(f2['gap']) <= 3, f2)
        pg.evaluate("_saveZimni(true, true)"); pg.wait_for_timeout(1500)
        bh = pg.evaluate("((window.__db.zimni_reports||[])[0]||{content:{}}).content.bodyHtml || ''")
        er = re.search(r'<tr class="zf-endrow">[\s\S]*?</tr>', bh)
        check(f'{tag}: بیرونی ضمنی — اسکرین کی عارضی اونچائی محفوظ مواد میں نہیں', bool(er) and 'height' not in er.group(0), er.group(0)[:200] if er else bh[:100])
        h = printed(pg, lambda: pg.evaluate("_printZimniCurrent()"), 'legal')
        pdf = to_pdf(b, h, f'{tag}_zimni_legal')
        gaps = line_gaps(pdf, f'{tag}_zimni_legal')
        check(f'{tag}: بیرونی ضمنی پرنٹ — لکیریں (کالم 2 سمیت) صفحے کے نیچے تک', all(len(gp) >= 2 and all(x <= 8 for x in gp) for gp in gaps), gaps)
    except Exception as e:
        check(f'{tag}: bairooni fill section crashed', False, repr(e)[:300])

    # ═══ 10) (27 اکتوبر 2026 کے نکات) اردو کی بورڈ پر Ctrl+S / Ctrl+P، اختتامی سطر، «از۔»، فہرست کے بٹن،
    #        اکیلے ملزم پر نمبر نہیں، ضمنی خود سرور پر، صفحہ 2 پر لکیر کے سامنے تحریر ═══
    URDU = """(k) => { const t = document.querySelector('#ch173-doc') || document.body;
        const e = new KeyboardEvent('keydown', { key: k === 's' ? 'س' : 'پ', code: k === 's' ? 'KeyS' : 'KeyP', ctrlKey: true, bubbles: true, cancelable: true });
        t.dispatchEvent(e); return e.defaultPrevented; }"""
    zr = lambda: pg.evaluate("(window.__db.zimni_reports||[]).filter(r => r.case_id === 'c1').map(r => ({id:r.id, sn:r.serial_no, b:(r.content||{}).bodyHtml||''}))")
    try:
        pg.evaluate(SEED); ws(pg)
        pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(1200)
        pg.evaluate("_newZimni()"); pg.wait_for_timeout(2000)
        prev = pg.evaluate(URDU, 's'); pg.wait_for_timeout(1800)
        check(f'{tag}: کی بورڈ اردو پر Ctrl+S («س») — ضمنی محفوظ، براؤزر کی HTML فائل نہیں', prev and len(zr()) == 1, (prev, len(zr())))
        h = printed(pg, lambda: pg.evaluate(URDU, 'p'), 'legal')
        check(f'{tag}: کی بورڈ اردو پر Ctrl+P («پ») — سسٹم کا اپنا ضمنی کا کاغذ (براؤزر کی سادہ چھپائی نہیں)', 'zf-tbl' in h and pg.evaluate('window.__printCalls') == 0, (len(h), pg.evaluate('window.__printCalls')))
        g = pg.evaluate("""(() => { const d = _zimniDoc(); const tl = (el, last) => { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, v = null;
              while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
                for (const x of r.getClientRects()) { if (x.height < 2) continue; if (!last) return x; v = x; } } return v; };
            const k = d.getBoundingClientRect().height / d.offsetHeight;
            const b = tl(d.querySelector('tr.zf-blk .zf-body'), true), c = tl(d.querySelector('.zf-close'), false);
            const t = d.querySelector('table.zf-tbl'), c4 = d.querySelector('th.zf-c-from');
            return { close: d.querySelector('.zf-close').textContent.trim(), gap: Math.round((c.top - b.bottom) / k), c4: +(c4.getBoundingClientRect().width / t.getBoundingClientRect().width).toFixed(3),
                     banam: d.querySelector('[data-k="banam"]').innerText.trim() }; })()""")
        check(f'{tag}: اختتامی سطر «رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔» (۔ کے ساتھ)', g['close'] == 'رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے۔', g['close'])
        check(f'{tag}: اختتامی سطر کے اوپر کی جگہ پہلے (34px) کی آدھی یا کم', 0 < g['gap'] <= 17, g['gap'])
        check(f'{tag}: «از۔» کا کالم پہلے (6%) سے دُگنا (12%)', 0.11 <= g['c4'] <= 0.13, g['c4'])
        check(f'{tag}: «بنام» میں صرف ایک ملزم — نمبر «1۔» نہیں', g['banam'] and not re.match(r'^\s*1\s*۔', g['banam']), g['banam'])
        # دو ملزم — نمبر 1، 2
        pg.evaluate("window.__db.case_accused.push({ id:'a2', case_id:'c1', name:'دوسرا ملزم', accused_type:'fir', created_at:'2026-10-09' }); 0")
        pg.evaluate("_zimniLoadAccused().then(() => _zimniFillBanam(true))"); pg.wait_for_timeout(800)
        b2 = pg.evaluate("document.querySelector('#ch173-doc [data-k=\"banam\"]').innerText.trim()")
        check(f'{tag}: «بنام» میں دو ملزم — نمبر 1۔ 2۔', re.search(r'1\s*۔', b2) and re.search(r'2\s*۔', b2), b2)
        # پرانی محفوظ ضمنی («1۔ نامعلوم ملزم»، اختتامی سطر بغیر ۔) — کھولنے اور چھاپنے پر نیا اصول
        pg.evaluate("_saveZimni(true, true)"); pg.wait_for_timeout(1200)
        old = pg.evaluate("""(() => { const r = window.__db.zimni_reports[0]; let b = r.content.bodyHtml;
            b = b.replace(/<span class="nm">[^<]*<[/]span><[/]div><div class="zf-acc"><span class="nm">[^<]*<[/]span>/, '<span class="nm">1۔ نامعلوم ملزم</span>').replace('ارسال خدمت ہے۔', 'ارسال خدمت ہے');
            r.content = Object.assign({}, r.content, { bodyHtml: b, saved_at: '2026-10-01T00:00:00Z' }); localStorage.removeItem('dio_zimni_c1'); localStorage.removeItem('dio_zimni_draft_c1'); return b.includes('1۔ نامعلوم'); })()""")
        pg.evaluate("_loadZimni().then(() => _renderZimniList())"); pg.wait_for_timeout(1200)
        h = printed(pg, lambda: pg.evaluate("_printZimniById(String(_zimniList[0].id))"), 'legal')
        check(f'{tag}: پرانی محفوظ ضمنی کا پرنٹ — اکیلے ملزم پر «1۔» نہیں، اختتامی سطر «۔» کے ساتھ', old and '1۔ نامعلوم' not in h and 'ارسال خدمت ہے۔' in h, (old, '1۔ نامعلوم' in h))
        # فہرست کے بٹن — مقدمہ کی فہرست والے، PDF / نقل نہیں؛ پرنٹ کھولے بغیر
        L = pg.evaluate("""(() => { const tr = document.querySelector('.zt tbody tr[data-zid]');
            return { t: [...tr.querySelectorAll('button')].map(b => b.title.split(' — ')[0]), cls: [...tr.querySelectorAll('button')].every(b => b.classList.contains('dio-act') && b.classList.contains('btn-sm')),
                     same: (() => { const c = document.createElement('div'); c.innerHTML = dioActBtn('print', 'x()', 'پرنٹ'); return c.firstChild.className; })() }; })()""")
        check(f'{tag}: محفوظ ضمنیوں کے ایکشن بٹن: ترمیم / پرنٹ / شیئر / حذف — PDF اور نقل نہیں؛ مقدمہ کی فہرست والی شکل', L['t'] == ['ترمیم', 'پرنٹ', 'شیئر', 'حذف'] and L['cls'], L)
        h = printed(pg, lambda: pg.click(".zt tbody tr[data-zid] button[title^='پرنٹ']"), 'legal')
        check(f'{tag}: فہرست کا «پرنٹ» — ضمنی کھولے بغیر سیدھا کاغذ', 'zf-tbl' in h and pg.evaluate("!document.querySelector('#ch173-doc')"), len(h))
        # دوسری ضمنی + «تمام ضمنیاں» — ترتیب 1، 2
        pg.evaluate("_newZimni()"); pg.wait_for_timeout(1600)
        pg.evaluate("""(() => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = '20/10/2026'; return 0; })()""")
        pg.evaluate("_saveZimni(true, true)"); pg.wait_for_timeout(1300); pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1200)
        h = printed(pg, lambda: pg.click("button:has-text('تمام ضمنیاں')"), 'legal')
        zn = re.findall(r'data-k="zno"[^>]*>\s*(\d+)', h)
        check(f'{tag}: «🖨️ تمام ضمنیاں» — دونوں ضمنیاں، ترتیب 1 پھر 2', zn[:2] == ['1', '2'], zn)
        # ضمنی خود سرور پر — انٹرنیٹ مسلسل چلتا رہے (پہلے صرف انٹرنیٹ ٹوٹ کر واپس آنے پر)
        pg.evaluate("window.__opts.fail = ['zimni_reports:insert']; 0")
        pg.evaluate("_newZimni()"); pg.wait_for_timeout(1600)
        pg.evaluate("""(() => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = '21/10/2026'; return 0; })()""")
        pg.evaluate("_saveZimni(true, true)"); pg.wait_for_timeout(1300)
        n0 = len(zr())
        pg.evaluate("window.__opts.fail = []; window._zimniLastTry = 0; _zimniSyncSoon(); 0"); pg.wait_for_timeout(2500)
        check(f'{tag}: لیپ ٹاپ پر «سرور پر بھیجنا باقی» ضمنی — انٹرنیٹ چلتا رہے تب بھی خود سرور پر (دوسرے آلے پر نظر آئے)', n0 == 2 and len(zr()) == 3, (n0, len(zr())))
        # کسی صفحے پر محفوظ کرنے کو کچھ نہ ہو — تب بھی Ctrl+S پر براؤزر کی HTML فائل نہیں
        pg.evaluate("showPage('dashboard', null)"); pg.wait_for_timeout(1200)
        check(f'{tag}: ڈیش بورڈ پر Ctrl+S («س») — براؤزر کا «صفحہ محفوظ کریں» نہیں', pg.evaluate(URDU, 's'))
    except Exception as e:
        check(f'{tag}: 27-Oct items section crashed', False, repr(e)[:300])

    # ═══ 11) صفحہ 2 پر مثل کی 2pt لکیر کے سامنے بھی تحریر (اندرونی ضمنی کے لمبے بیانات) ═══
    try:
        pg.evaluate(SEED); open_za(pg); new_za(pg)
        pg.evaluate("""async (para) => { for (let i = 0; i < 3; i++) await _zaInsertWitnessStatement({ id: 'w' + i, full_name: 'گواہ نمبر ' + (i + 1) + ' ولد فلاں سکنہ ملتان', status: 'fir_eye' });
            document.querySelectorAll('#ch173-doc .zfa-wit-stmt').forEach(st => { st.textContent = 'بیان کیا کہ ' + para.repeat(14); }); return 0; }""",
            'دوران تفتیش موقع پر پہنچ کر گواہان کے بیانات قلمبند کیے گئے اور نقشہ موقع مرتب کیا گیا۔ ملزمان کی تلاش جاری ہے۔ ')
        pg.wait_for_timeout(400)
        h = printed(pg, lambda: pg.evaluate("_printZimniA()"), 'legal')
        c2 = b.new_context(viewport={'width': 816, 'height': 1248}); c2.route('**/*', route); q = c2.new_page()
        fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_v558_bind.html'); open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + h)
        q.goto(BASE + '_v558_bind.html'); q.emulate_media(media='print'); q.wait_for_timeout(1300); q.evaluate('document.fonts.ready')
        r = q.evaluate("""(() => { const m = document.querySelector('.zfa-bindmark'); if (!m) return null; const mr = m.getBoundingClientRect();
            let inside = 0; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
            while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; const rg = document.createRange(); rg.selectNodeContents(n);
              for (const x of rg.getClientRects()) { if (x.height < 4) continue; const mid = (x.top + x.bottom) / 2;
                if (mid > mr.top + 0.25 * mr.height && mid < mr.bottom - 4 && x.left < mr.right - 24) inside++; } }
            return { inside, w: Math.round(mr.width) }; })()""")
        c2.close(); os.remove(fn)
        check(f'{tag}: صفحہ 2 پر مثل کی 2pt لکیر کے سامنے بھی تحریر (مربع خالی نہیں — تحریر لکیر کے ساتھ ساتھ)', bool(r) and r['inside'] >= 3, r)
        pdf = to_pdf(b, h, f'{tag}_za_bind')
        check(f'{tag}: (اسی پرنٹ میں) کئی صفحات', pdf_pages(pdf) >= 2, pdf_pages(pdf))
    except Exception as e:
        check(f'{tag}: binding text section crashed', False, repr(e)[:300])

    if mobile:
        try:
            pg.evaluate(SEED); open_za(pg); new_za(pg); pg.wait_for_timeout(1200)
            r = pg.evaluate("(() => { const d = _zimniDoc().getBoundingClientRect(); return [Math.round(d.left), Math.round(d.right), innerWidth]; })()")
            check(f'{tag}: موبائل — کاغذ اسکرین کے بیچ میں (پہلے آدھا بائیں باہر نکل جاتا تھا)', r[0] >= 0 and r[1] <= r[2] and abs(r[0] - (r[2] - r[1])) <= 4, r)
        except Exception as e:
            check(f'{tag}: mobile paper section crashed', False, repr(e)[:300])

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
