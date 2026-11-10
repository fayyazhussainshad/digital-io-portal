"""(TASK 22) ٹیب کے اندر چھپائی — «پرنٹ» بٹن = Ctrl+P = براؤزر کے مینو کی چھپائی (⋮ › Print)، اور ٹیبوں سے پہلے جیسی
ضمنی (کئی صفحات) اور ایف آئی آر متن؛ Desktop (لیگل) + Mobile (A4)۔ ہر صفحہ pixel تک موازنہ۔
چلانا: `python3 t22_print_test.py` — ایک ہی: DIO_ONLY=desktop|mobile
"""
from t22_common import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/t22/print/'
os.makedirs(V, exist_ok=True)


def pages(b, html, prefix):
    p = prefix + '.pdf'
    html_pdf(b, html, p)
    return pages_png(p, prefix)


def frame_capture(pg, f, how, paper):
    """ٹیب کے اندر: «پرنٹ» بٹن یا Ctrl+P — اصل کاغذ (چھپائی کا iframe) کا HTML"""
    f.evaluate(SNAP); f.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
    if how == 'button':
        f.evaluate("(document.querySelector('#dio-dv-bar button[onclick=\"_dioPrintCurrent()\"]') || document.querySelector('[data-dio-print]')).click()")
    else:
        f.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('End'); pg.keyboard.press('Control+p')
    asked = pick_paper(f, paper)
    for _ in range(150):
        if f.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    return asked, f.evaluate("window.__snaps[0] || ''")


def fill(pg, f, blocks):
    f.evaluate(fill_js(blocks, 3)); pg.wait_for_timeout(600)
    f.evaluate("(() => { const a = _zimniDoc().querySelector('tr.zf-blk .zf-actbody'); a.focus(); const r = document.createRange(); r.selectNodeContents(a); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, '16/10/2026'); return 0; })()")
    pg.wait_for_timeout(500)


def legacy(b, desktop, blocks, paper, name):
    """ٹیبوں کے بغیر (پرانا ایک ہی کھڑکی والا راستہ) — اسی مواد کا مینو پرنٹ، موازنے کے لیے"""
    vp = DESK if desktop else MOB
    extra = {} if desktop else MOBX
    ctx = b.new_context(service_workers='block', timezone_id='Asia/Karachi', viewport=vp, **extra)
    ctx.route('**/*', route)
    ctx.add_init_script(PRINT_HOOK + "\nlocalStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));")
    pg = ctx.new_page(); pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
    pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    pg.wait_for_timeout(2500); pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}"); pg.wait_for_timeout(300)
    tabs_off = pg.evaluate("!document.getElementById('dio-tabs-root') || !document.body.classList.contains('dio-tabs-on')")
    out = {}
    pg.evaluate(SEED); pg.evaluate(SEED2)
    if blocks:
        open_zimni(pg)
        fill(pg, pg, blocks)
        capture(pg, 'button', paper)        # افسر کی طرح: پہلے «پرنٹ» میں کاغذ چنا (مینو کی چھپائی وہی کاغذ لیتی ہے)
        out['zimni'] = pages_png(menu_pdf(pg, paper, V + name + '_zimni_legacy_menu.pdf')[0], V + name + '_zimni_legacy_menu')
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("_dioOpenDocTab('fir'); _dioRenderTabContent('fir'); 0"); pg.wait_for_timeout(1800)
    out['fir'] = pages_png(menu_pdf(pg, paper, V + name + '_fir_legacy_menu.pdf')[0], V + name + '_fir_legacy_menu')
    ctx.close()
    return out, tabs_off


def run(desktop):
    tag = 'desktop' if desktop else 'mobile'
    paper = 'legal' if desktop else 'a4'
    blocks = 7
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx, pg, errs = open_tabs(b, desktop)
        f0 = af(pg)
        f0.evaluate("openCaseWorkspace('c1'); 0"); pg.wait_for_timeout(1500); wait_active_ready(pg)
        af(pg).evaluate("_openMisalEditor('zamniyat'); 0"); pg.wait_for_timeout(1800); wait_active_ready(pg)
        f = af(pg)
        f.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2300)
        f = af(pg)
        fill(pg, f, blocks)
        pg.screenshot(path=V + tag + '_zimni_in_tab.png')
        a1, h_btn = frame_capture(pg, f, 'button', paper)
        a2, h_cp = frame_capture(pg, f, 'ctrlp', paper)
        calls = f.evaluate("window.__printCalls")
        check(f'{tag} ٹیب کے اندر «پرنٹ» بٹن اور Ctrl+P دونوں کاغذ بناتے ہیں (کاغذ کا سوال: {paper})', bool(h_btn) and bool(h_cp) and a1 and a2, [len(h_btn), len(h_cp), a1, a2])
        P_btn = pages(b, h_btn, V + tag + '_zimni_button')
        P_cp = pages(b, h_cp, V + tag + '_zimni_ctrlp')
        same1, d1 = same_pages(P_btn, P_cp)
        check(f'{tag} ضمنی: «پرنٹ» بٹن = Ctrl+P (ہر صفحہ pixel تک)', same1 and len(P_btn) >= 2, [len(P_btn), d1])
        # براؤزر کا مینو: اوپر کی Digital IO کھڑکی چھاپتی ہے — کھلی ٹیب کا وہی کاغذ
        pg.evaluate("(() => { const S = DIOTabs._state(); const t = S.tabs.find(x => x.id === S.active); const r = S.frames[t.entries[t.idx].fid]; r.win.dispatchEvent(new Event('beforeprint')); return 0; })()")
        mp, native = menu_pdf(pg, paper, V + tag + '_zimni_tab_menu.pdf')
        pg.evaluate("(() => { const S = DIOTabs._state(); const t = S.tabs.find(x => x.id === S.active); const r = S.frames[t.entries[t.idx].fid]; r.win.dispatchEvent(new Event('afterprint')); return 0; })()")
        P_menu = pages_png(mp, V + tag + '_zimni_tab_menu')
        same2, d2 = same_pages(P_btn, P_menu)
        check(f'{tag} ضمنی: براؤزر کے مینو کی چھپائی = «پرنٹ» بٹن (صرف کھلی دستاویز، ٹیبوں کی پٹی نہیں)', same2, [len(P_btn), len(P_menu), d2])
        contact(P_menu, V + tag + '_zimni_tab_menu_sheet.png')
        left = pg.evaluate("[!!document.getElementById('dio-pp-host'), !!document.getElementById('dio-nprint-host'), document.body.classList.contains('dio-nprint')]")
        check(f'{tag} چھپائی کے بعد اوپر کی کھڑکی صاف (کوئی نقل باقی نہیں)', left == [False, False, False], left)
        # ایف آئی آر متن (دوسرا راستہ: کھلی دستاویز کی نقل)
        f.evaluate("document.getElementById('dio-dv-fir').click(); 0"); pg.wait_for_timeout(600); wait_active_ready(pg)
        fc = af(pg)
        fc.click("#misal-doc-bar .mdoc-chip:has-text('ایف آئی آر')"); pg.wait_for_timeout(1800)
        mp2, _n = menu_pdf(pg, paper, V + tag + '_fir_tab_menu.pdf')
        F_menu = pages_png(mp2, V + tag + '_fir_tab_menu')
        # ٹیبوں سے پہلے جیسا؟ (پرانا ایک کھڑکی والا راستہ، وہی مواد)
        base, tabs_off = legacy(b, desktop, blocks, paper, tag)
        same3, d3 = same_pages(base['zimni'], P_menu)
        check(f'{tag} ضمنی: ٹیب کی مینو چھپائی = ٹیبوں سے پہلے والی (pixel تک، نیچے کچھ نہیں کٹا)', same3 and tabs_off, [len(base['zimni']), len(P_menu), d3])
        same4, d4 = same_pages(base['fir'], F_menu)
        check(f'{tag} ایف آئی آر متن: ٹیب کی مینو چھپائی = ٹیبوں سے پہلے والی', same4, [len(base['fir']), len(F_menu), d4])
        contact(F_menu, V + tag + '_fir_tab_menu_sheet.png')
        e2 = [e for e in errs if 'ResizeObserver' not in e]
        check(f'{tag} کوئی JS خرابی نہیں', not e2, e2[:3])
        b.close()


if __name__ == '__main__':
    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'): run(True)
    if only in ('', 'mobile'): run(False)
    fails = [r for r in R if r[0] == 'FAIL']
    print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
    json.dump(R, open(V + 'results.json', 'w'), ensure_ascii=False, indent=1)
    sys.exit(1 if fails else 0)
