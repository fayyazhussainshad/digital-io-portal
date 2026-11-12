"""(v581) اصل ایپ کی جانچ — افسر کا حکم 12 نومبر 2026:
  (1) فہرستوں (مقدمات، بیرونی ضمنیات، بیانات 161) میں تیر کی کلید سے انتخاب — ↓ / ↑ / Home / End / Esc؛
      Enter = اسی ٹیب میں کھولیں، Ctrl+Enter = نئی ٹیب (پیچھے)، Ctrl+Shift+Enter = نئی ٹیب سامنے؛
      تلاش کے خانے سے ↓ فہرست میں، پہلی قطار سے ↑ واپس تلاش میں؛ فہرست پیچھے سے تازہ ہو تو انتخاب وہیں؛
      لکھنے کے خانے میں تیر اپنا عام کام؛ موبائل پر انگلی سے دبانا پہلے جیسا
  (2) پولیس فارم نمبر «25—54(1)» / «25—54(2)» بائیں سے دائیں (پہلے «(2)54—25») — اسکرین، پرنٹ، صفحہ 3 کا سرنامہ،
      بیان 161؛ محفوظ تحریر میں کوئی نشان نہیں
Desktop 1366×768 + Mobile 390×844؛ نئی ٹیب کی جانچ اصل ٹیبوں میں (TASK 22 والا طریقہ)۔
چلانا: `python3 v581_test.py` — ایک ہی: DIO_ONLY=desktop|mobile
"""
from t22_common import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v581/'
os.makedirs(V, exist_ok=True)
_ns = dict(globals()); _src = open(HERE + '/v558_test.py', encoding='utf-8').read()
LONG = 'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض موضع سید پور تحصیل شجاع آباد ضلع ملتان'
_ns['LONG'] = LONG
exec(_src[_src.index('SEED = """'):_src.index('HOOK = """')], _ns)
SEED161 = _ns['SEED']

# تین محفوظ بیرونی ضمنیاں اور دو بیانات 161 (مقدمہ c1)
ZSEED = """(() => { const d = window.__db;
  d.zimni_reports = [1, 2, 3].map(i => ({ id: 'zk' + i, case_id: 'c1', serial_no: i, report_date: '2026-10-1' + i, officer_id: 'o1', created_at: '2026-10-1' + i + 'T10:00:00Z',
    content: { zno: String(i), col1_date: '1' + i + '/10/2026', main_type: 'اوّل', bodyHtml: '<table class="zf-tbl"><tbody><tr class="zf-blk"><td class="zf-c-action">بوقت 10:00</td><td class="zf-c-serial">' + i + '</td><td class="zf-c-body"><div class="zf-body">ضمنی نمبر ' + i + ' کا متن</div></td></tr></tbody></table>' } }));
  d.zimni_androoni_reports = [1, 2].map(i => ({ id: 'zak' + i, case_id: 'c1', serial_no: i, report_date: '2026-10-1' + i, officer_id: 'o1', created_at: '2026-10-1' + i + 'T10:00:00Z',
    title: 'گواہ ' + i, content: { witnesses: ['گواہ ' + i], col1_date: '1' + i + '/10/2026', bodyHtml: '<div class="zfa-body">بیان نمبر ' + i + '</div>' } }));
  try { localStorage.removeItem('dio_zimni_c1'); localStorage.removeItem('dio_zimni_a_c1'); } catch (_) {}
  return 0; })()"""

ROWSTATE = """(sel) => { const r = [...document.querySelectorAll(sel)]; const ae = document.activeElement;
  return { n: r.length, sel: r.findIndex(x => x.classList.contains('dio-ln-sel')), foc: r.findIndex(x => x.contains(ae)),
    ae: ae ? (ae.id || ae.getAttribute('data-act') || ae.tagName) : null, aria: r.filter(x => x.getAttribute('aria-selected') === 'true').length,
    oc: (ae && ae.getAttribute && ae.getAttribute('onclick')) || '' }; }"""
CS = '#cs-rows > tr'
ZT = '.zt-wrap table.zt > tbody > tr'
ZA = '.zat-wrap table.zt > tbody > tr'
HL = """(sel) => { const r = document.querySelector(sel + '.dio-ln-sel'); if (!r) return null; const td = r.querySelector('td'); const cs = getComputedStyle(r), ct = getComputedStyle(td);
  return { outline: cs.outlineStyle + ' ' + cs.outlineWidth, bg: ct.backgroundColor }; }"""

ORDER = r"""(num) => { const out = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = tw.nextNode())) { const v = n.nodeValue || ''; let i = v.indexOf(num); while (i >= 0) {
    const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1); const a = r.getBoundingClientRect();
    r.setStart(n, i + num.length - 1); r.setEnd(n, i + num.length); const z = r.getBoundingClientRect();
    if (a.height > 2 && z.height > 2 && Math.abs(a.top - z.top) < 6) out.push({ ltr: a.left < z.left, span: !!(n.parentNode.closest && n.parentNode.closest('.dio-ltrn')),
      where: (n.parentNode.closest('.zf-formno') ? 'zf' : n.parentNode.closest('.zfa-formno') ? 'zfa' : 'other') });
    i = v.indexOf(num, i + 1); } }
  return out; }"""


def shot(pg, name):
    pg.wait_for_timeout(300)
    pg.screenshot(path=V + name + '.png')


def tab_titles(pg):
    return [(t['cur'] or '') + (' ' + t['num'] if t['num'] else '') for t in tabs(pg)]


def click_tab(pg, i):
    pg.click(f'#dio-tabs-strip .dio-tab >> nth={i}'); pg.wait_for_timeout(300)
    wait_active_ready(pg)


def keys(pg, seq, sel, wait=150):
    out = []
    for k in seq:
        pg.keyboard.press(k); pg.wait_for_timeout(wait)
        out.append((k, pg.evaluate(ROWSTATE, sel)))
    return out


def paper_page(b, html, cw, name):
    fn = os.path.join(HERE, '..', '..', '_v581_' + name + '.html')
    open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + html)
    c = b.new_context(viewport={'width': int(cw), 'height': 1200}); c.route('**/*', route); q = c.new_page()
    q.goto(BASE + '_v581_' + name + '.html'); q.wait_for_timeout(1200); q.evaluate('document.fonts.ready')
    q.emulate_media(media='print'); q.wait_for_timeout(400)
    return c, q, fn


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
        vp = DESK if desktop else MOB
        extra = {} if desktop else MOBX
        ctx, pg, errs = open_app(b, viewport=vp, **extra)
        pg.evaluate(SEED2); pg.evaluate(ZSEED)
        pg.evaluate("window.confirm = () => true; 0")

        # ═══ 1) مقدمات کی فہرست ═══
        pg.evaluate("dioOpenCases()"); pg.wait_for_timeout(2500)
        st0 = pg.evaluate(ROWSTATE, CS)
        if desktop:
            seq = keys(pg, ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp', 'ArrowUp', 'ArrowDown', 'End', 'Home'], CS)
            s = [x[1] for x in seq]
            check(f'{tag} مقدمات: ↓ پہلی قطار، ↓ دوسری، آخری پر ↓ وہیں؛ ↑ اوپر، پہلی سے ↑ تلاش کے خانے میں؛ تلاش سے ↓ پہلی؛ End آخری، Home پہلی',
                  st0['n'] == 2 and st0['sel'] == -1 and [x['sel'] for x in s] == [0, 1, 1, 0, -1, 0, 1, 0] and s[4]['ae'] == 'case-search'
                  and all(x['foc'] == x['sel'] and x['ae'] == 'open' for x in s if x['sel'] >= 0) and all(x['aria'] == (1 if x['sel'] >= 0 else 0) for x in s), [(k, x['sel'], x['ae']) for k, x in seq])
            hl = pg.evaluate(HL, CS)
            pg.screenshot(path=V + f'{tag}_01_cases_selected.png')
            check(f'{tag} مقدمات: منتخب قطار نمایاں (کنارہ + ہلکا رنگ)، «کھولیں» بٹن پر focus', hl and hl['outline'].startswith('solid 2px') and hl['bg'] not in ('rgba(0, 0, 0, 0)', ''), hl)
            # پیچھے سے فہرست تازہ (سرور / سنک) — انتخاب وہیں
            pg.keyboard.press('ArrowDown'); pg.wait_for_timeout(150)
            before = pg.evaluate(ROWSTATE, CS)
            pg.evaluate("renderCases(document.getElementById('page-content')); 0"); pg.wait_for_timeout(900)
            after = pg.evaluate(ROWSTATE, CS)
            check(f'{tag} مقدمات: فہرست پیچھے سے تازہ ہوئی تو وہی قطار منتخب رہی', before['sel'] == 1 and after['sel'] == 1 and after['foc'] == 1 and after['oc'] == before['oc'], (before, after))
            seq = keys(pg, ['Escape'], CS)
            check(f'{tag} مقدمات: Esc — انتخاب ختم', seq[0][1]['sel'] == -1 and seq[0][1]['aria'] == 0, seq)
            # Enter → اسی ٹیب میں منتخب مقدمہ
            pg.keyboard.press('ArrowDown'); pg.keyboard.press('ArrowDown'); pg.wait_for_timeout(150)
            want = pg.evaluate(ROWSTATE, CS)['oc']
            pg.keyboard.press('Enter'); pg.wait_for_timeout(1800)
            cid = pg.evaluate("typeof _misalCaseId !== 'undefined' ? _misalCaseId : null")
            check(f'{tag} مقدمات: Enter — منتخب (دوسری) قطار کا مقدمہ کھلا', want and ("'" + str(cid) + "'") in want and not pg.evaluate("!!document.getElementById('cs-rows') && !!document.getElementById('cs-rows').offsetParent"), (want, cid))
            # تلاش لکھ کر ↓ → Enter
            pg.evaluate("dioOpenCases()"); pg.wait_for_timeout(1800)
            pg.click('#case-search'); pg.keyboard.type('701'); pg.wait_for_timeout(900)
            seq = keys(pg, ['ArrowUp'], CS)
            up_in_search = seq[0][1]['ae'] == 'case-search' and seq[0][1]['sel'] == -1
            seq = keys(pg, ['ArrowDown'], CS)
            pg.keyboard.press('Enter'); pg.wait_for_timeout(1800)
            cid2 = pg.evaluate("typeof _misalCaseId !== 'undefined' ? _misalCaseId : null")
            check(f'{tag} مقدمات: تلاش میں «701» لکھا — ↑ تلاش ہی میں (لکھنے کا عام کام)؛ ↓ پہلی ملی قطار؛ Enter → 701/26 کھلا', up_in_search and seq[0][1]['n'] == 1 and seq[0][1]['sel'] == 0 and cid2 == 'c2', (seq, cid2))
        else:
            # موبائل: انگلی سے «کھولیں» — پہلے جیسا، کوئی نشان نہیں
            tw = pg.evaluate("document.querySelectorAll('#cs-rows > tr')[1].querySelector('button[data-act=\"open\"]').getAttribute('onclick')")
            pg.tap('#cs-rows > tr >> nth=1 >> button[data-act="open"]'); pg.wait_for_timeout(1800)
            cid = pg.evaluate("typeof _misalCaseId !== 'undefined' ? _misalCaseId : null")
            check(f'{tag} مقدمات: انگلی سے «کھولیں» — وہی مقدمہ کھلا، انتخاب کا کوئی نشان نہیں رہا', cid and ("'" + cid + "'") in tw and not pg.evaluate("document.querySelectorAll('tr.dio-ln-sel').length"), (tw, cid))
            pg.evaluate("dioOpenCases()"); pg.wait_for_timeout(1800)
            seq = keys(pg, ['ArrowDown', 'ArrowDown'], CS)
            pg.screenshot(path=V + f'{tag}_01_cases_selected.png')
            want = seq[-1][1]['oc']
            pg.keyboard.press('Enter'); pg.wait_for_timeout(1800)
            cid = pg.evaluate("typeof _misalCaseId !== 'undefined' ? _misalCaseId : null")
            check(f'{tag} مقدمات: کی بورڈ لگا ہو تو ↓ ↓ Enter — دوسری قطار کا مقدمہ کھلا', [x[1]['sel'] for x in seq] == [0, 1] and cid and ("'" + cid + "'") in want, (seq, cid))

        # ═══ 2) بیرونی ضمنیات کی فہرست ═══
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(2200)
        pg.evaluate("document.activeElement && document.activeElement.blur && document.activeElement.blur(); 0")
        st0 = pg.evaluate(ROWSTATE, ZT)
        seq = keys(pg, ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowUp'], ZT)
        pg.screenshot(path=V + f'{tag}_02_zimni_list_selected.png')
        check(f'{tag} ضمنیات: {st0["n"]} محفوظ ضمنیاں — ↓ ↓ ↓ ↓ ↑ = 1، 2، 3، 3، 2؛ «ترمیم» بٹن پر focus',
              st0['n'] == 3 and [x[1]['sel'] for x in seq] == [0, 1, 2, 2, 1] and all(x[1]['ae'] == 'edit' for x in seq), [(k, x['sel'], x['ae']) for k, x in seq])
        want = pg.evaluate(ROWSTATE, ZT)['oc']
        pg.keyboard.press('Enter'); pg.wait_for_timeout(2500)
        za = pg.evaluate("(_zimniActive || {}).id || null")
        check(f'{tag} ضمنیات: Enter — منتخب ضمنی (نمبر 2) لکھنے کے لیے کھلی', za == 'zk2' and 'zk2' in want and pg.evaluate("!!document.querySelector('#ch173-doc table.zf-tbl')"), (want, za))
        # ضمنی کے اندر لکھتے ہوئے تیر — فہرست نہیں، کرسر اپنا کام
        pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('End'); pg.keyboard.press('ArrowUp'); pg.wait_for_timeout(200)
        check(f'{tag} ضمنی کے اندر: تیر کی کلید سے کچھ منتخب نہیں ہوتا (لکھنے کا عام کام)', not pg.evaluate("document.querySelectorAll('tr.dio-ln-sel').length") and pg.evaluate("(_zimniActive || {}).id || null") == 'zk2')

        # ═══ 3) بیانات 161 کی فہرست ═══
        pg.evaluate("typeof _zimniDirty !== 'undefined' && (_zimniDirty = false); try{_dioResetTabs();_dioExitDocView()}catch(e){}; openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
        pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(2200)
        pg.evaluate("document.activeElement && document.activeElement.blur && document.activeElement.blur(); 0")
        st0 = pg.evaluate(ROWSTATE, ZA)
        seq = keys(pg, ['ArrowUp', 'Home', 'End', 'ArrowUp'], ZA)
        want = pg.evaluate(ROWSTATE, ZA)['oc']
        pg.keyboard.press('Enter'); pg.wait_for_timeout(2500)
        zaa = pg.evaluate("(_zaActive || {}).id || null")
        check(f'{tag} بیانات 161: ↑ (کچھ منتخب نہیں) = آخری قطار، Home پہلی، End آخری، ↑ پہلی؛ Enter — وہی بیان کھلا',
              st0['n'] == 2 and [x[1]['sel'] for x in seq] == [1, 0, 1, 0] and zaa and zaa in want, ([(k, x['sel']) for k, x in seq], want, zaa))

        # ═══ 4) فارم نمبر 25—54(1) / 25—54(2) — اسکرین، پرنٹ ═══
        pg.evaluate("typeof _zaDirty !== 'undefined' && (_zaDirty = false); try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
        open_zimni(pg)
        pg.evaluate(fill_js(22, 3)); pg.wait_for_timeout(1800)
        o1 = pg.evaluate(ORDER, '25—54(1)')
        pg.evaluate("document.querySelector('#ch173-doc .zf-formno') && document.querySelector('#ch173-doc .zf-formno').scrollIntoView({block:'center'}); 0"); pg.wait_for_timeout(300)
        pg.screenshot(path=V + f'{tag}_03_zimni_formno.png')
        check(f'{tag} بیرونی ضمنی (اسکرین): «پولیس فارم نمبر 25—54(1)» بائیں سے دائیں', len(o1) == 1 and o1[0]['ltr'] and o1[0]['span'] and o1[0]['where'] == 'zf', o1)
        if desktop:
            pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('Control+s')
        else:
            pg.evaluate("document.getElementById('zf-save-btn').click()")
        pg.wait_for_timeout(2500)
        sh = pg.evaluate("(window.__db.zimni_reports || []).filter(r => !/^zk/.test(r.id)).map(r => (r.content || {}).bodyHtml || '').join('')")
        check(f'{tag} بیرونی ضمنی محفوظ: فارم نمبر جوں کا توں لکھا ہوا، کوئی نیا نشان نہیں', bool(sh) and 'dio-ltrn' not in sh and '25—54(1)' in sh, len(sh))
        asked, h = capture(pg, 'button', paper)
        cw = pg.evaluate("(h) => _dioPageGeo(h).cw", h)
        pdfp = html_pdf(b, h, V + f'{tag}_zimni.pdf'); npg = pdf_info(pdfp)[0]
        c2, q, fn = paper_page(b, h, cw, tag)
        try:
            op1 = q.evaluate(ORDER, '25—54(1)'); op2 = q.evaluate(ORDER, '25—54(2)')
            heads = q.evaluate("document.querySelectorAll('#ch173-doc tr.zf-ahead').length")
        finally:
            c2.close(); os.remove(fn)
        subprocess.run(['pdftoppm', '-png', '-r', '72', '-f', '1', '-l', '3', pdfp, V + f'{tag}_zp'], check=True)
        check(f'{tag} بیرونی ضمنی (پرنٹ، {npg} صفحات): صفحہ 1 پر 25—54(1)، صفحہ 3 کے سرنامے پر 25—54(2) — دونوں بائیں سے دائیں',
              npg >= 3 and heads >= 1 and len(op1) == 1 and op1[0]['ltr'] and len(op2) == heads and all(x['ltr'] and x['where'] == 'zfa' for x in op2), (npg, heads, op1, op2))
        # بیان 161 (اکیلا)
        pg.evaluate("typeof _zimniDirty !== 'undefined' && (_zimniDirty = false); try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
        pg.evaluate(SEED161)
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
        pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(1800)
        o3 = pg.evaluate(ORDER, '25—54(2)')
        pg.screenshot(path=V + f'{tag}_04_161_formno.png')
        h161 = grab(pg, '_printZimniA()', paper)
        c3, q3, fn3 = paper_page(b, h161, pg.evaluate("(h) => _dioPageGeo(h).cw", h161), tag + '_161')
        try:
            o4 = q3.evaluate(ORDER, '25—54(2)')
        finally:
            c3.close(); os.remove(fn3)
        check(f'{tag} بیان 161: «پولیس فارم نمبر 25—54(2)» اسکرین اور پرنٹ دونوں پر بائیں سے دائیں', len(o3) == 1 and o3[0]['ltr'] and len(o4) == 1 and o4[0]['ltr'], (o3, o4))

        check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:4])
        b.close()


def run_tabs():
    """اصل ٹیبوں میں: Ctrl+Enter = نئی ٹیب (پیچھے)، Ctrl+Shift+Enter = نئی ٹیب سامنے، Enter = اسی ٹیب"""
    tag = 'desktop (ٹیبیں)'
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx, pg, errs = open_tabs(b, desktop=True)
        f = af(pg)
        f.evaluate("dioOpenCases()"); pg.wait_for_timeout(2000)
        f.focus('#case-search')
        n0 = len(tabs(pg))
        pg.keyboard.press('ArrowDown'); pg.keyboard.press('ArrowDown'); pg.wait_for_timeout(200)
        st = f.evaluate(ROWSTATE, CS)
        pg.keyboard.press('Control+Enter'); pg.wait_for_timeout(700)
        for _ in range(60):
            if not any(t['loading'] for t in tabs(pg)): break
            pg.wait_for_timeout(200)
        T = tabs(pg)
        want = '663/26' if "'c1'" in st['oc'] else '701/26'
        check(f'{tag}: ↓ ↓ پھر Ctrl+Enter — منتخب مقدمہ نئی ٹیب میں (پیچھے)، یہ ٹیب فہرست پر ہی',
              st['sel'] == 1 and len(T) == n0 + 1 and T[0]['on'] and any(t['num'] == want and not t['on'] for t in T) and af(pg).evaluate("!!document.getElementById('cs-rows')"), (st, tab_titles(pg)))
        f = af(pg)
        sel_after = f.evaluate(ROWSTATE, CS)
        pg.keyboard.press('ArrowUp'); pg.wait_for_timeout(200)
        st2 = f.evaluate(ROWSTATE, CS)
        pg.keyboard.press('Control+Shift+Enter'); pg.wait_for_timeout(700)
        for _ in range(60):
            if not any(t['loading'] for t in tabs(pg)): break
            pg.wait_for_timeout(200)
        wait_active_ready(pg)
        T = tabs(pg)
        want2 = '663/26' if "'c1'" in st2['oc'] else '701/26'
        check(f'{tag}: فہرست میں انتخاب برقرار؛ ↑ پھر Ctrl+Shift+Enter — نئی ٹیب سامنے، اسی مقدمے کی', sel_after['sel'] == 1 and st2['sel'] == 0 and len(T) == n0 + 2 and any(t['on'] and t['num'] == want2 for t in T) and not T[0]['on'], (sel_after, st2, tab_titles(pg)))
        shot(pg, 'v581_tabs_ctrl_enter')
        # پہلی ٹیب (فہرست) پر واپس — Enter اسی ٹیب میں
        click_tab(pg, 0); wait_active_ready(pg)
        f = af(pg)
        f.evaluate("dioOpenCases()"); pg.wait_for_timeout(1500)
        f.focus('#case-search'); pg.keyboard.press('ArrowDown'); pg.wait_for_timeout(200)
        st3 = f.evaluate(ROWSTATE, CS)
        n1 = len(tabs(pg))
        pg.keyboard.press('Enter'); pg.wait_for_timeout(1800)
        for _ in range(40):
            if not any(t['loading'] for t in tabs(pg)): break
            pg.wait_for_timeout(200)
        T = tabs(pg)
        want3 = '663/26' if "'c1'" in st3['oc'] else '701/26'
        check(f'{tag}: Enter — اسی ٹیب میں منتخب مقدمہ (نئی ٹیب نہیں)', len(T) == n1 and T[0]['on'] and T[0]['cur'] == 'مقدمہ' and T[0]['num'] == want3, tab_titles(pg))
        check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:4])
        b.close()


only = os.environ.get('DIO_ONLY')
if only != 'mobile':
    run(True)
    run_tabs()
if only != 'desktop': run(False)
f = [r for r in R if r[0] == 'FAIL']
print(f'\nRESULT: {len(R) - len(f)} PASS, {len(f)} FAIL')
sys.exit(1 if f else 0)
