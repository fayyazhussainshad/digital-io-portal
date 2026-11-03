"""(v564) پہلے کی حالت — بندھے خانے (اصل کی بورڈ سے لکھ کر) اور چالان کی چھپائی میں الفاظ کا جڑنا۔"""
from v564_common import *
D = OUT + '/' + os.environ.get('V564_DIR', 'v564_before') + '/'
os.makedirs(D, exist_ok=True)
SEL = """(s) => { const el = _zimniDoc().querySelector(s); const r = document.createRange(); r.selectNodeContents(el);
  el.closest('[contenteditable]').focus(); const g = getSelection(); g.removeAllRanges(); g.addRange(r); return 0; }"""
SELNAME = """(nm) => { const el = _zimniDoc().querySelector('[data-k="murattib"]'); const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) { const i = n.nodeValue.indexOf(nm); if (i >= 0) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + nm.length);
    _zimniDoc().focus(); const g = getSelection(); g.removeAllRanges(); g.addRange(r); return true; } } return false; }"""
RD = """(() => { const d = _zimniDoc(); return { c1: d.querySelector('tr.zf-blk .zf-actbody').textContent.trim(),
  sd: (d.querySelector('[data-k="io_date"]') || {}).textContent, mur: (d.querySelector('[data-k="murattib"]') || {}).textContent,
  sign: (d.querySelector('[data-k="io_sign"]') || {}).textContent }; })()"""
out = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
    open_zimni(pg)
    out['start'] = pg.evaluate(RD)
    pg.evaluate(SEL, 'tr.zf-blk .zf-actbody'); pg.keyboard.type('20/10/2026', delay=20); pg.wait_for_timeout(900)
    out['after_col1'] = pg.evaluate(RD)
    pg.evaluate(SELNAME, 'فیاض حسین شاد'); pg.keyboard.type('غلام عباس', delay=20); pg.wait_for_timeout(900)
    out['after_name'] = pg.evaluate(RD)
    pg.evaluate("document.querySelector('#ch173-doc tr.zf-endrow').scrollIntoView({block:'center'})"); pg.wait_for_timeout(300)
    pg.query_selector('#ch173-doc tr.zf-endrow').screenshot(path=D + 'B5_endrow_after_edits.png')
    pg.evaluate("document.querySelector('#ch173-doc tr.zf-prerow').scrollIntoView({block:'start'})"); pg.wait_for_timeout(300)
    box = pg.evaluate("(() => { const a = document.querySelector('#ch173-doc tr.zf-prerow').getBoundingClientRect(), b = document.querySelector('#ch173-doc tr.zf-blk').getBoundingClientRect(); return {x:a.left, y:a.top, w:a.width, h:b.bottom - a.top}; })()")
    pg.screenshot(path=D + 'B5_top_after_edits.png', clip={'x': box['x'], 'y': box['y'], 'width': box['w'], 'height': box['h']})
    # ── چالان: لکھ کر محفوظ، پھر پرنٹ (نیا صفحہ — جیسے افسر مقدمہ کھول کر چالان) ──
    ctx.close()
    ctx, pg, errs2 = open_app(b, viewport={'width': 1366, 'height': 768}); errs += errs2
    pg.evaluate(SEED); pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2600)
    pg.click('#ch173-doc .normwrap'); pg.keyboard.press('End')
    pg.keyboard.type(' بیان کیا کہ وہ اپنے موٹر سائیکل پر سوار ہو کر بازار سے واپس گھر آ رہا تھا کہ راستے میں نامعلوم ملزمان نے اسلحہ کے زور پر اس سے موبائل فون اور نقدی چھین لی اور موقع سے فرار ہو گئے۔', delay=3)
    pg.evaluate("_saveR173()"); pg.wait_for_timeout(1800)
    out['challan_saved'] = pg.evaluate("(window.__db.report_173||[]).length")
    # محفوظ شدہ چالان دوبارہ کھولو (فہرست سے) — «محفوظ کرنے کے بعد» کی حالت
    pg.evaluate("(async () => { openReport173WithType('list'); await new Promise(r => setTimeout(r, 2200)); const x = (window.__db.report_173 || []).slice(-1)[0]; if (x) await _r173OpenDoc(String(x.id)); return 0; })()")
    pg.wait_for_timeout(2600)
    pg.evaluate("(() => { window.__dp = []; window.__dioPaperAuto = 'legal'; window._dioDoPrint = function (h) { window.__dp.push(h); }; return 0; })()")
    pg.evaluate("_printR173()")
    for _ in range(150):
        if pg.evaluate("(window.__dp||[]).length"): break
        pg.wait_for_timeout(200)
    h = pg.evaluate("(window.__dp||[])[0] || ''")
    h = re.sub(r'^<!DOCTYPE html>', '', h, flags=re.I)
    out['challan_print_html'] = len(h)
    f = html_pdf(b, h, D + 'challan_legal.pdf')
    out['challan_pages'] = pdf_info(f)
    out['errors'] = errs[:8]
    b.close()
print(json.dumps(out, ensure_ascii=False, indent=1))
