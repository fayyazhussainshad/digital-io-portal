"""(v568) بیرونی ضمنی (منسلک اندرونی شیٹ سمیت) کا موجودہ کاغذ محفوظ کرو — تبدیلی کے بعد بالکل یہی ہونا چاہیے"""
from v564_common import *
V = OUT + '/v568/base/'
os.makedirs(V, exist_ok=True)
TAG = os.environ.get('DIO_TAG', 'before')
OLD = open(HERE + '/v568_old_body.js', encoding='utf-8').read()
TXT = ' '.join(PARA)


def mk_old(pg, sid, sn, date, reps):
    pg.evaluate("""([sid, sn, date, txt, reps]) => { const o = currentOfficer || {}; const c = window.__db.cases.find(x => x.id === 'c1');
        _zimniActive = { serial_no: sn }; let h = window.__oldZimniBody(o, c);
        const t = document.createElement('template'); t.innerHTML = h;
        t.content.querySelector('.zf-actbody').textContent = date;
        t.content.querySelector('.zf-body').innerHTML = 'جناب عالیٰ! ' + Array.from({length: reps}, (_, i) => '<div>' + (i + 1) + '۔ ' + txt + '</div>').join('');
        t.content.querySelector('[data-k="io_date"]').textContent = date;
        window.__db.zimni_reports.push({ id: sid, case_id: 'c1', serial_no: sn, report_date: date.split('/').reverse().join('-'), officer_id: 'o1', rev: 1,
          content: { bodyHtml: t.innerHTML, head: 'رپورٹ ضمنی', serial_no: sn, saved_at: '2026-09-0' + sn + 'T10:00:00Z' }, created_at: '2026-09-0' + sn + 'T10:00:00Z' });
        _zimniActive = null; return 0; }""", [sid, sn, date, TXT, reps])


def grab(pg, fn, paper='legal'):
    pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
    pg.evaluate(fn + '; 0'); pick_paper(pg, paper)
    for _ in range(150):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    return pg.evaluate("window.__snaps[0] || ''")


if __name__ == '__main__':
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
        pg.evaluate("window.confirm = () => true; 0")
        pg.evaluate(SEED); pg.evaluate(OLD + '; 0')
        mk_old(pg, 'z1', 1, '05/09/2026', 14)
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800)
        for paper in ('legal', 'a4'):
            h = grab(pg, "_printZimniById('z1')", paper)
            open(V + f'{TAG}_old_{paper}.html', 'w', encoding='utf-8').write(h)
            html_pdf(b, h, V + f'{TAG}_old_{paper}.pdf'); print(TAG, paper, pdf_info(V + f'{TAG}_old_{paper}.pdf'), flush=True)
        # ایڈیٹر — منسلک اندرونی شیٹ
        pg.evaluate("_openZimni('z1'); 0"); pg.wait_for_timeout(3500)
        att = pg.evaluate("!!document.querySelector('#ch173-doc .zf-androoni .zfa-tbl')")
        el = pg.query_selector('#ch173-doc .zf-androoni')
        if el:
            el.scroll_into_view_if_needed(); pg.wait_for_timeout(500)
            el.screenshot(path=V + f'{TAG}_old_editor_attached.png')
        css = pg.evaluate("[...document.querySelectorAll('#workspace-editor-area style, #page-content style')].map(s => s.textContent).join('\\n')")
        open(V + f'{TAG}_editor_css.txt', 'w', encoding='utf-8').write(css)
        print(TAG, 'attached in editor', att, flush=True)
        # ضمنی (نیا خاکہ) — پرنٹ
        pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1200)
        pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2300)
        pg.evaluate(fill_js(12, 4))
        pg.evaluate("""() => { const a = _zimniDoc().querySelector('tr.zf-blk .zf-actbody'); a.focus(); const r = document.createRange(); r.selectNodeContents(a);
          const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, '16/10/2026'); return 0; }""")
        pg.wait_for_timeout(500)
        h = grab(pg, "_printZimniCurrent()")
        h = re.sub(r'saved_at[^,]*', '', h)
        open(V + f'{TAG}_block_legal.html', 'w', encoding='utf-8').write(h)
        print(TAG, 'errors', errs[:4])
        b.close()
