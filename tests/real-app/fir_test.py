"""متن ایف آئی آر / کراس ورژن — اصل ایپ کی جانچ (Desktop + Mobile)۔

جانچ: پورے نظام میں «الف آئی آر» کہیں نہیں، «ایف آئی آر» ہے · متن والا صفحہ دو حصوں میں:
(1) متن ایف آئی آر + فوٹو کاپی ایف آئی آر، (2) متن کراس ورژن + فوٹو کاپی کراس ورژن ·
«متن درج کریں» / «فوٹو کاپی اپلوڈ کریں» بٹن دائیں کنارے کے ساتھ، سرخی صفحے کے بالکل درمیان ·
کراس ورژن کا حصہ صرف اُس مقدمہ میں جس میں کراس ورژن ہو · کراس ورژن کھولنے پر وہی حصہ سامنے ·
متن درج / فوٹو کاپی اپلوڈ درست حصے میں جائے · کوئی افقی scroll نہیں · کوئی JS غلطی نہیں۔

چلانا: README.md (اسی فولڈر میں) — `python3 fir_test.py`
"""
import sys, json, subprocess
sys.path.insert(0, '.')
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra) if extra != '' else ''), flush=True)

SEED = """(() => {
  const d = window.__db;
  const c = d.cases.find(x => x.id === 'c1');
  c.cross_complainant = 'محمد اکرم ولد اللہ دتہ'; c.cross_fir_number = '1234/26';
  d.cases.push({ id: 'c3', officer_id: 'o1', fir_number: '55/26', section_of_law: '379 ت پ', status: 'under',
    complainant: 'احمد علی', created_at: '2026-10-01T00:00:00Z' });
  d.fir_matn = [
    { id: 'm1', case_id: 'c1', type: 'fir', matn: 'بیان مدعی: میں ملک زاہد اقبال ولد فیض احمد ہوں۔', created_at: '2026-10-08T01:00:00Z' },
    { id: 'm2', case_id: 'c1', type: 'cross_version', matn: 'کراس ورژن کا بیان: محمد اکرم ولد اللہ دتہ۔', created_at: '2026-10-08T02:00:00Z' },
  ];
  d.fir_copies = [];
  return 0; })()"""

MEASURE = """(() => {
  const page = document.getElementById('fir-page'); if (!page) return null;
  const parts = [...page.querySelectorAll('section.fir-part')];
  const pr = page.getBoundingClientRect();
  const partInfo = parts.map(s => {
    const sr = s.getBoundingClientRect();
    const rows = [...s.querySelectorAll('.fir-headrow')].map(h => {
      const hr = h.getBoundingClientRect();
      const t = h.querySelector('.fir-headrow-title').getBoundingClientRect();
      const btn = h.querySelector('.fir-headrow-btn .btn').getBoundingClientRect();
      return { title: h.querySelector('.fir-headrow-title').textContent.trim(),
        btnText: h.querySelector('.fir-headrow-btn .btn').textContent.trim(),
        titleCenterOff: Math.round(((t.left + t.right) / 2 - (hr.left + hr.right) / 2) * 10) / 10,
        btnRightGap: Math.round((hr.right - btn.right) * 10) / 10,
        titleClipped: h.querySelector('.fir-headrow-title').scrollWidth > h.querySelector('.fir-headrow-title').clientWidth + 1,
        overlap: !(btn.right <= t.left || btn.left >= t.right) && !(btn.bottom <= t.top || btn.top >= t.bottom),
        sameLine: Math.abs((btn.top + btn.bottom) / 2 - (t.top + t.bottom) / 2) < 6,
        fontPt: Math.round(parseFloat(getComputedStyle(h.querySelector('.fir-headrow-title')).fontSize) * 0.75 * 10) / 10 };
    });
    return { id: s.id, top: Math.round(sr.top - pr.top + page.scrollTop), rows,
      matnText: [...s.querySelectorAll('table:first-of-type td')].map(td => td.textContent.trim()).join(' | '),
      tables: s.querySelectorAll('table').length, copyImgs: s.querySelectorAll('img').length };
  });
  return { parts: partInfo, scrollTop: Math.round(page.scrollTop),
    hOverflow: page.scrollWidth > page.clientWidth + 1 || document.documentElement.scrollWidth > window.innerWidth + 1 };
})()"""

PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='


PRINT_SPY = """(() => { if (window.__firSpy) return 0; window.__firSpy = 1; window.__printed = [];
  const o = window.dioPrint; window.dioPrint = function (h) { window.__printed.push(String(h)); return o.apply(this, arguments); }; return 0; })()"""

def printed(pg):
    return pg.evaluate("window.__printed.splice(0)")

def paper(ctx, html, name):
    """کاغذ کو اصل A4 پر چھاپ کر ناپو (صفحات، سرخی/متن کا pt سائز)۔"""
    q = ctx.new_page(); q.set_content(html); q.wait_for_timeout(600); q.evaluate("document.fonts.ready"); q.wait_for_timeout(200)
    info = q.evaluate("""(() => ({ h1: [...document.querySelectorAll('h1')].map(h => [h.textContent.trim(), getComputedStyle(h).fontSize]),
      matn: [...document.querySelectorAll('.matn')].map(m => getComputedStyle(m).fontSize),
      buttons: document.querySelectorAll('button,input,select').length, dir: document.documentElement.dir }))()""")
    q.pdf(path=f'{OUT}/{name}.pdf', prefer_css_page_size=True, print_background=True)
    pi = subprocess.run(['pdfinfo', f'{OUT}/{name}.pdf'], capture_output=True, text=True).stdout
    info['pages'] = int([l for l in pi.splitlines() if l.startswith('Pages:')][0].split()[-1])
    subprocess.run(['pdftoppm', '-png', '-r', '60', f'{OUT}/{name}.pdf', f'{OUT}/{name}'])
    q.close()
    return info

def open_fir(pg, case_id, doc):
    pg.evaluate(f"openCaseWorkspace('{case_id}')"); pg.wait_for_timeout(1500)
    pg.evaluate(f"_ddPick('fir-dd', '{doc}')"); pg.wait_for_selector('#fir-page'); pg.wait_for_timeout(800)
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(200)

def run(pg, tag, errs, ctx):
    pg.evaluate(SEED)

    # ── 1) «الف آئی آر» کہیں نہیں ──
    open_fir(pg, 'c1', 'fir')
    html = pg.evaluate("document.documentElement.outerHTML")
    check(f'{tag}: صفحے پر «الف آئی آر» کہیں نہیں', 'الف آئی آر' not in html)
    dd = pg.evaluate("[...document.querySelectorAll('#fir-dd *, [onclick*=\"fir-dd\"]')].map(e => e.textContent.trim()).join(' ')")
    check(f'{tag}: ڈراپ ڈاؤن پر «ایف آئی آر»', 'ایف آئی آر' in dd and 'الف' not in dd, dd[:60])
    tabname = pg.evaluate("_dioDocName('fir')")
    check(f'{tag}: ٹیب کا نام «ایف آئی آر»', tabname == 'ایف آئی آر', tabname)

    # ── 2) دو حصے، درست ترتیب، درست سرخیاں ──
    m = pg.evaluate(MEASURE)
    ids = [p['id'] for p in m['parts']]
    check(f'{tag}: دو حصے — پہلا ایف آئی آر، دوسرا کراس ورژن', ids == ['fir-part-fir', 'fir-part-cross_version'], ids)
    titles = [[r['title'] for r in p['rows']] for p in m['parts']]
    check(f'{tag}: پہلے حصے میں متن ایف آئی آر + فوٹو کاپی ایف آئی آر', titles[0] == ['متن ایف آئی آر', 'فوٹو کاپی ایف آئی آر'], titles[0])
    check(f'{tag}: دوسرے حصے میں متن کراس ورژن + فوٹو کاپی کراس ورژن', len(titles) > 1 and titles[1] == ['متن کراس ورژن', 'فوٹو کاپی کراس ورژن'], titles[1:] )
    check(f'{tag}: کراس ورژن کا حصہ ایف آئی آر کے نیچے', len(m['parts']) > 1 and m['parts'][1]['top'] > m['parts'][0]['top'])
    check(f'{tag}: ہر حصے میں صرف اپنا متن', 'ملک زاہد' in m['parts'][0]['matnText'] and 'اکرم' not in m['parts'][0]['matnText']
          and 'اکرم' in m['parts'][1]['matnText'] and 'زاہد' not in m['parts'][1]['matnText'])

    # ── 3) بٹن دائیں کنارے کے ساتھ، سرخی درمیان میں ──
    rows = [r for p in m['parts'] for r in p['rows']]
    check(f'{tag}: سرخی صفحے کے درمیان (±2px)', all(abs(r['titleCenterOff']) <= 2 for r in rows), [r['titleCenterOff'] for r in rows])
    check(f'{tag}: بٹن دائیں کنارے کے ساتھ (فاصلہ ≤1px)', all(0 <= r['btnRightGap'] <= 1 for r in rows), [r['btnRightGap'] for r in rows])
    check(f'{tag}: بٹن اور سرخی ایک دوسرے پر نہیں چڑھتے، سرخی نہیں کٹتی', all(not r['overlap'] and not r['titleClipped'] for r in rows))
    check(f'{tag}: بٹن اور سرخی ایک ہی سطر میں', all(r['sameLine'] for r in rows), [r['sameLine'] for r in rows])
    check(f'{tag}: بٹنوں کے نام', [r['btnText'] for r in rows] == ['متن درج کریں', 'فوٹو کاپی اپلوڈ کریں'] * 2)
    check(f'{tag}: سب سرخیاں ایک ہی سائز (pt)', len({r['fontPt'] for r in rows}) == 1, sorted({r['fontPt'] for r in rows}))
    check(f'{tag}: کوئی افقی scroll نہیں', not m['hOverflow'])
    pg.screenshot(path=f'{OUT}/fir_{tag}_1_page.png')

    # ── 4) کراس ورژن کھولنے پر وہی حصہ سامنے ──
    pg.evaluate("_ddPick('fir-dd', 'cross_version')"); pg.wait_for_timeout(700)
    vis = pg.evaluate("""(() => { const w = document.getElementById('fir-page'), s = document.getElementById('fir-part-cross_version');
      const a = w.getBoundingClientRect(), b = s.getBoundingClientRect(); return { top: Math.round(b.top - a.top), h: Math.round(a.height) }; })()""")
    check(f'{tag}: کراس ورژن کھولنے پر کراس حصہ نظر میں', 0 <= vis['top'] < vis['h'] - 40, vis)
    pg.screenshot(path=f'{OUT}/fir_{tag}_2_cross.png')

    # ── 5) کراس ورژن میں متن درج کریں → صرف کراس حصے میں ──
    before = pg.evaluate("document.getElementById('fir-page').scrollTop")
    pg.click('#fir-part-cross_version .fir-headrow-btn .btn-primary'); pg.wait_for_selector('#fir-matn-text')
    pg.fill('#fir-matn-text', 'نیا کراس متن جانچ ' + tag)
    pg.evaluate("_saveMatn('cross_version','')"); pg.wait_for_timeout(700)
    row = pg.evaluate("window.__db.fir_matn.filter(x => (x.matn||'').includes('نیا کراس متن جانچ'))")
    check(f'{tag}: نیا متن cross_version کے طور پر محفوظ', len(row) == 1 and row[0]['type'] == 'cross_version' and row[0]['case_id'] == 'c1', row)
    m2 = pg.evaluate(MEASURE)
    check(f'{tag}: نیا متن کراس حصے میں دکھا، ایف آئی آر میں نہیں',
          'نیا کراس متن' in m2['parts'][1]['matnText'] and 'نیا کراس متن' not in m2['parts'][0]['matnText'])
    check(f'{tag}: محفوظ کے بعد صفحہ اپنی جگہ پر رہا (اوپر نہیں کودا)', abs(m2['scrollTop'] - before) <= 1, [before, m2['scrollTop']])

    # ── 6) فوٹو کاپی: ایف آئی آر اور کراس دونوں کے الگ اپلوڈ ──
    import base64
    png = base64.b64decode(PNG)
    pg.set_input_files('#fir-copy-input-fir', files=[{'name': 'fir-copy.png', 'mimeType': 'image/png', 'buffer': png}]); pg.wait_for_timeout(1200)
    pg.set_input_files('#fir-copy-input-cross_version', files=[{'name': 'cross-copy.png', 'mimeType': 'image/png', 'buffer': png}]); pg.wait_for_timeout(1200)
    cp = pg.evaluate("window.__db.fir_copies.map(x => [x.type, x.display_name])")
    check(f'{tag}: فوٹو کاپیاں اپنی اپنی قسم میں محفوظ', sorted(cp) == [['cross_version', 'cross-copy.png'], ['fir', 'fir-copy.png']], cp)
    m3 = pg.evaluate(MEASURE)
    check(f'{tag}: ہر حصے میں اپنی فوٹو کاپی', m3['parts'][0]['copyImgs'] == 1 and m3['parts'][1]['copyImgs'] == 1,
          [p['copyImgs'] for p in m3['parts']])
    pg.screenshot(path=f'{OUT}/fir_{tag}_3_after.png', full_page=False)
    pg.evaluate("document.getElementById('fir-page').scrollTop = 0"); pg.wait_for_timeout(100)
    pg.screenshot(path=f'{OUT}/fir_{tag}_4_top.png')

    # ── 7) پرنٹ: Ctrl+P = اوپر کی پٹی کا «پرنٹ» — ایک ہی کاغذ؛ سطر کا «پرنٹ» صرف وہی متن ──
    pg.evaluate(PRINT_SPY)
    pg.evaluate("document.activeElement && document.activeElement.blur()")
    pg.keyboard.press('Control+p'); pg.wait_for_timeout(400)
    a = printed(pg)
    pg.evaluate("_dioPrintCurrent()"); pg.wait_for_timeout(400)   # اوپر کی پٹی کے «پرنٹ» بٹن کا onclick
    b2 = printed(pg)
    check(f'{tag}: Ctrl+P سے ایک بار چھپائی', len(a) == 1, len(a))
    check(f'{tag}: Ctrl+P = اوپر کی پٹی کا «پرنٹ» (بالکل ایک ہی کاغذ)', len(b2) == 1 and a and a[0] == b2[0])
    check(f'{tag}: براؤزر کی پوری سکرین والی چھپائی نہیں چلی', pg.evaluate("window.__printCalls") == 0, pg.evaluate("window.__printCalls"))
    info = paper(ctx, a[0], f'fir_{tag}_5_print')
    check(f'{tag}: کاغذ پر دونوں حصوں کا متن، ترتیب سے', [h[0] for h in info['h1']] == ['متن ایف آئی آر', 'متن کراس ورژن'], info['h1'])
    check(f'{tag}: کاغذ پر صرف متن — کوئی بٹن نہیں، RTL', info['buttons'] == 0 and info['dir'] == 'rtl')
    check(f'{tag}: سرخی 20pt، متن 14pt', all(h[1] == '26.6667px' for h in info['h1']) and set(info['matn']) == {'18.6667px'},
          [info['h1'], sorted(set(info['matn']))])
    check(f'{tag}: کراس ورژن نئے صفحے پر (A4، 2 صفحات)', info['pages'] == 2, info['pages'])
    check(f'{tag}: کاغذ پر سارا متن', all(w in a[0] for w in ['ملک زاہد اقبال', 'محمد اکرم', 'نیا کراس متن جانچ']))
    pg.click('#fir-part-cross_version table:first-of-type button[title="پرنٹ"] >> nth=0'); pg.wait_for_timeout(400)
    one = printed(pg)
    check(f'{tag}: سطر کا «پرنٹ» — صرف وہی ایک متن، اسی شکل میں',
          len(one) == 1 and 'متن کراس ورژن' in one[0] and 'متن ایف آئی آر' not in one[0] and 'کراس ورژن کا بیان' in one[0]
          and 'font-size:20pt' in one[0] and 'font-size:14pt' in one[0])

    # ── 8) کراس ورژن کے بغیر مقدمہ → صرف ایف آئی آر حصہ ──
    open_fir(pg, 'c3', 'fir')
    m4 = pg.evaluate(MEASURE)
    check(f'{tag}: کراس ورژن کے بغیر مقدمہ میں صرف ایف آئی آر کا حصہ', [p['id'] for p in m4['parts']] == ['fir-part-fir'], [p['id'] for p in m4['parts']])
    # بغیر متن کے: Ctrl+P پر کچھ نہ چھپے، صاف پیغام
    pg.evaluate("window.__toasts = []; const _o = window.showToast; window.showToast = function (m, t) { window.__toasts.push([t || 'info', String(m)]); return _o.apply(this, arguments); }; 0")
    pg.keyboard.press('Control+p'); pg.wait_for_timeout(400)
    empty = printed(pg); ts = pg.evaluate("window.__toasts")
    check(f'{tag}: متن نہ ہو تو Ctrl+P پر خالی کاغذ نہیں، پیغام آتا ہے', not empty and pg.evaluate("window.__printCalls") == 0
          and any('کوئی متن درج نہیں' in t[1] for t in ts), ts)

    check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:3])


with sync_playwright() as p:
    b = p.chromium.launch()
    for tag, args in [('desktop', dict(viewport={'width': 1366, 'height': 768})),
                      ('mobile', dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)),
                      ('mobile360', dict(viewport={'width': 360, 'height': 740}, device_scale_factor=2, is_mobile=True, has_touch=True))]:
        ctx, pg, errs = open_app(b, **args)
        run(pg, tag, errs, ctx)
        ctx.close()
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f"\n{len(R) - len(fails)}/{len(R)} PASS")
sys.exit(1 if fails else 0)
