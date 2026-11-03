"""(v564) پہلے کی حالت (BEFORE) — افسر کی شکایات کی تصویری تصدیق، Desktop پرنٹ پیش منظر، 3 صفحات کی ضمنی۔
چلانا: python3 v564_repro.py   →  out/v564_before/
"""
from v564_common import *

D = OUT + '/' + os.environ.get('V564_DIR', 'v564_before') + '/'
os.makedirs(D, exist_ok=True)
log = {}


def main():
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
        pg.on('dialog', lambda d: d.accept())
        open_zimni(pg)
        n = pg.evaluate(fill_js()); pg.wait_for_timeout(1500)
        log['blocks'] = n
        pg.screenshot(path=D + '00_editor.png')
        # محفوظ (Ctrl+S) — «محفوظ کرنے کے بعد» والی حالت
        pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('Control+s'); pg.wait_for_timeout(2000)
        log['saved'] = pg.evaluate("(window.__db.zimni_reports||[]).length")

        for paper in ('legal', 'a4'):
            asked_b, hb = capture(pg, 'button', paper)
            asked_c, hc = capture(pg, 'ctrlp', paper)
            # «سسٹم کا پرنٹ بٹن» اوپر کی (مقدمے والی) پٹی پر بھی
            hb2 = ''
            if pg.evaluate("!!document.getElementById('dio-dv-print')"):
                pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; 0")
                pg.click('#dio-dv-print'); pick_paper(pg, paper)
                for _ in range(150):
                    if pg.evaluate("window.__snaps.length"): break
                    pg.wait_for_timeout(200)
                hb2 = pg.evaluate("window.__snaps[0] || ''")
            pb = html_pdf(b, hb, D + f'{paper}_button.pdf')
            pc = html_pdf(b, hc, D + f'{paper}_ctrlp.pdf')
            pm, native = menu_pdf(pg, paper, D + f'{paper}_menu.pdf')
            res = {}
            for k, f in (('button', pb), ('ctrlp', pc), ('menu', pm)):
                pngs = pages_png(f, D + f'{paper}_{k}')
                contact(pngs, D + f'{paper}_{k}_ALL.png')
                res[k] = {'pages': pdf_info(f)[0], 'size': pdf_info(f)[1], 'pngs': pngs}
            eq_bc = same_pages(res['button']['pngs'], res['ctrlp']['pngs'])
            eq_bm = same_pages(res['button']['pngs'], res['menu']['pngs'])
            log[paper] = {'asked_button': asked_b, 'asked_ctrlp': asked_c, 'html_equal': hb == hc, 'topbar_equal': (hb2 == hb) if hb2 else 'no top bar',
                          'pages': {k: (v['pages'], v['size']) for k, v in res.items()},
                          'button=ctrlp': eq_bc, 'button=menu': eq_bm, 'beforeprint_native': native}

        # ── 3) اختتامی سطر: متن اور اوپر کی جگہ (ایڈیٹر) ──
        log['close'] = pg.evaluate("""(() => { const d = _zimniDoc(); const tl = (el, last) => { const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, v = null;
              while ((n = tw.nextNode())) { if (!n.nodeValue.trim()) continue; const r = document.createRange(); r.selectNodeContents(n);
                for (const x of r.getClientRects()) { if (x.height < 2) continue; if (!last) return x; v = x; } } return v; };
            const k = d.getBoundingClientRect().height / d.offsetHeight;
            const bl = [...d.querySelectorAll('tr.zf-blk .zf-body')].pop();
            const b = tl(bl, true), c = tl(d.querySelector('.zf-close'), false);
            return { text: d.querySelector('.zf-close').textContent, gap_px: Math.round((c.top - b.bottom) / k) }; })()""")
        # ── 4) «از» کالم ──
        log['cols'] = pg.evaluate("""(() => { const t = _zimniDoc().querySelector('table.zf-tbl'); const W = t.getBoundingClientRect().width;
            return [...t.querySelectorAll('thead th')].map(th => ({ c: th.className, w: +(th.getBoundingClientRect().width / W * 100).toFixed(2) })); })()""")
        # ── 5) بندھے خانے: کالم 1 کی تاریخ ↔ دستخط کی تاریخ؛ IO کا نام ──
        def setText(sel, txt):
            pg.evaluate("""([s, t]) => { const el = _zimniDoc().querySelector(s); el.focus(); const r = document.createRange(); r.selectNodeContents(el);
                const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, t); return 0; }""", [sel, txt])
            pg.wait_for_timeout(900)
        rd = lambda: pg.evaluate("""(() => { const d = _zimniDoc(); return { c1: d.querySelector('tr.zf-blk .zf-actbody').textContent.trim(),
            sd: (d.querySelector('[data-k="io_date"]') || {}).textContent, mur: (d.querySelector('[data-k="murattib"]') || {}).textContent,
            sign: (d.querySelector('[data-k="io_sign"]') || {}).textContent }; })()""")
        log['bind0'] = rd()
        setText('tr.zf-blk .zf-actbody', '20/10/2026'); log['bind_c1_changed'] = rd()
        setText('[data-k="io_date"]', '21/10/2026'); log['bind_sd_changed'] = rd()
        # IO کا نام: «مرتبہ» میں صرف نام والا حصہ بدلو (افسر کی طرح)
        pg.evaluate("""() => { const el = _zimniDoc().querySelector('[data-k="murattib"]'); const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            const n = tw.nextNode(); const i = n.nodeValue.indexOf('فیاض حسین شاد'); const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 'فیاض حسین شاد'.length);
            el.focus(); const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, 'غلام عباس'); return 0; }""")
        pg.wait_for_timeout(900); log['bind_mur_changed'] = rd()
        # ── 6) دستخط کے نیچے تاریخ — نام کے درمیان؟ ──
        log['signdate'] = pg.evaluate("""(() => { const d = _zimniDoc(); const tw = (el) => { const r = document.createRange(); r.selectNodeContents(el); const xs = [...r.getClientRects()].filter(x => x.width > 1);
              return xs.length ? { l: Math.min(...xs.map(x => x.left)), r: Math.max(...xs.map(x => x.right)) } : null; };
            const a = tw(d.querySelector('[data-k="io_sign"]')), b = tw(d.querySelector('[data-k="io_date"]'));
            return { nameMid: Math.round((a.l + a.r) / 2), dateMid: Math.round((b.l + b.r) / 2), off: Math.round(((b.l + b.r) - (a.l + a.r)) / 2) }; })()""")
        pg.screenshot(path=D + '10_editor_after_edits.png')
        el = pg.query_selector('#ch173-doc tr.zf-endrow')
        if el: el.screenshot(path=D + '11_endrow.png')
        th = pg.query_selector('#ch173-doc table.zf-tbl thead')
        if th: th.screenshot(path=D + '12_thead.png')
        log['errors'] = errs[:10]
        b.close()
    print(json.dumps(log, ensure_ascii=False, indent=1, default=str))


if __name__ == '__main__':
    main()
