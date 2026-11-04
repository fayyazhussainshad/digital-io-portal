"""(TASK 22) صفحات کھلے رہیں، Chrome جیسی ٹیبیں، «واپس» / «آگے»، X — اصل ایپ (Desktop 1366×768 + Mobile 390×844)
ہر ٹیب اصل Digital IO کی الگ نقل؛ صرف Supabase کی جگہ آزمائشی ڈیٹا (اوپر کی کھڑکی کا)۔
چلانا: `python3 t22_test.py` — ایک ہی: DIO_ONLY=desktop|mobile
"""
from t22_common import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/t22/test/'
os.makedirs(V, exist_ok=True)
MA = 'غیر محفوظ متن الف — مقدمہ 663/26 کی ضمنی'
MC = 'غیر محفوظ متن جیم — مقدمہ 701/26 کی ضمنی'
TOASTS = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"""


def shot(pg, name):
    pg.wait_for_timeout(300)
    pg.screenshot(path=V + name + '.png')


def back_btn(pg):
    pg.click('#dio-tabs-strip [data-act="back"]'); pg.wait_for_timeout(300); wait_active_ready(pg)


def fwd_btn(pg):
    pg.click('#dio-tabs-strip [data-act="fwd"]'); pg.wait_for_timeout(300); wait_active_ready(pg)


def tab_titles(pg):
    return [ (t['cur'] or '') + (' ' + t['num'] if t['num'] else '') for t in tabs(pg)]


def click_tab(pg, i):
    if pg.evaluate("matchMedia('(max-width: 768px)').matches"):
        pg.click('#dio-tabs-strip [data-act="sheet"]'); pg.wait_for_timeout(300)
        pg.click(f'#dio-tabs-sheet .card >> nth={i}'); pg.wait_for_timeout(300)
    else:
        pg.click(f'#dio-tabs-strip .dio-tab >> nth={i}'); pg.wait_for_timeout(300)
    wait_active_ready(pg)


def open_new_zimni(pg, f, cid):
    f.evaluate("(c) => openCaseWorkspace(c)", cid); pg.wait_for_timeout(300); wait_active_ready(pg)
    f = af(pg)
    f.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(300); wait_active_ready(pg)
    f = af(pg)
    f.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2300)
    return af(pg)


def run(desktop):
    tag = 'desktop' if desktop else 'mobile'
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx, pg, errs = open_tabs(b, desktop)
        pg.evaluate(TOASTS)
        me = pg.evaluate("currentOfficer.id")
        f0 = af(pg)
        check(f'{tag} setup: پہلی ٹیب = ڈیش بورڈ، اسی افسر کے نام (لاگ اِن دوبارہ نہیں)',
              f0.evaluate("window._activePage") == 'dashboard' and f0.evaluate("currentOfficer && currentOfficer.id") == me
              and f0.evaluate("getComputedStyle(document.getElementById('login-screen')).display") == 'none', [me])
        check(f'{tag} setup: ایک ہی سرور رابطہ (ٹیب = اوپر کی کھڑکی کا supabaseClient)',
              pg.evaluate("(() => { const S = DIOTabs._state(); const ws = Object.values(S.frames).filter(r => r.win); return ws.length > 0 && ws.every(r => r.win.supabaseClient.__dioTop === window.supabaseClient && r.win.supabaseClient.from !== window.supabaseClient.from); })()"))
        # فائل / تصویر اپلوڈ (شہادت، شناختی کارڈ) ٹیب سے: اوپر کی کھڑکی تک درست قسم میں پہنچے
        pg.evaluate("""(() => { const st = window.supabaseClient.storage; const of = st.from.bind(st); window.__up = [];
          st.from = (bk) => { const a = of(bk); const u = a.upload; a.upload = async (p, body, o) => { window.__up.push([body instanceof Blob, body instanceof File, body && body.type, body && body.size]); return u ? u.call(a, p, body, o) : { data: {}, error: null }; }; return a; }; return 0; })()""")
        upr = f0.evaluate("""async () => { const x = await supabaseClient.storage.from('evidence').upload('u1/663/1.jpg', new Blob(['تصویر'], { type: 'image/jpeg' }), { upsert: true });
           const y = await supabaseClient.storage.from('evidence').upload('u1/663/2.pdf', new File(['pdf'], 'cnic.pdf', { type: 'application/pdf' }), { upsert: true });
           return [!x.error, !y.error]; }""")
        got = pg.evaluate("window.__up")
        check(f'{tag} 17) ٹیب سے فائل اپلوڈ: اوپر کے رابطے تک درست قسم (تصویر / PDF)', upr == [True, True] and got == [[True, False, 'image/jpeg', 10], [True, True, 'application/pdf', 3]], got)
        n_back = pg.evaluate("[...document.querySelectorAll('[data-act=back]')].filter(e => e.getClientRects().length).length")
        n_old = f0.evaluate("[...document.querySelectorAll('#dio-back-btn, .dio-backbtn')].filter(e => e.getClientRects().length).length")
        check(f'{tag} 15) «واپس» ایک ہی (اوپر کی پٹی، دائیں کونے) — پرانے «واپس» نظر نہیں', n_back == 1 and n_old == 0, [n_back, n_old])
        bx = pg.evaluate("(() => { const r = document.querySelector('#dio-tabs-strip [data-act=back]').getBoundingClientRect(); return [r.left, r.right, innerWidth]; })()")
        check(f'{tag} 10) پیچھے / آگے دائیں کونے میں (RTL)', bx[1] > bx[2] - 140, bx)
        shot(pg, f'{tag}_01_dashboard_tab')

        # ═══ A) ضمنی لکھی (غیر محفوظ) → اسی ٹیب میں مقدمہ → ایف آئی آر → «واپس» → ضمنی وہیں ═══
        fz = open_new_zimni(pg, f0, 'c1')
        type_zimni(fz, MA); pg.wait_for_timeout(400)
        fz.evaluate("window.__alive = 'Z-A'; 0")
        fidZ = active_fid(pg)
        sc0 = fz.evaluate("(() => { const sc = [...document.querySelectorAll('#dio-dv-body, #dio-dv-body *')].find(e => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 10); if (!sc) return -1; sc.scrollTop = 150; return sc.scrollTop; })()")
        pg.wait_for_timeout(300)
        shot(pg, f'{tag}_02_zimni_typed')
        # دستاویز کی پٹی کا «مقدمہ 663/26» (اسی ٹیب میں مسل)
        fz.evaluate("document.getElementById('dio-dv-fir').click(); 0"); pg.wait_for_timeout(500); wait_active_ready(pg)
        fc = af(pg)
        check(f'{tag} A1) زندہ ضمنی سے ہٹنا = اسی ٹیب میں نیا صفحہ (ضمنی پیچھے)', active_fid(pg) != fidZ and fc.evaluate("!!document.getElementById('misal-doc-bar')"),
              tab_titles(pg))
        fc.click("#misal-doc-bar .mdoc-chip:has-text('ایف آئی آر')"); pg.wait_for_timeout(1800)
        check(f'{tag} A1) اسی ٹیب میں «ایف آئی آر» متن کھلا', fc.evaluate("!!document.getElementById('fir-page')"), tabs(pg)[0]['titles'])
        shot(pg, f'{tag}_03_fir_same_tab')
        back_btn(pg)       # → مقدمہ
        back_btn(pg)       # → ضمنی
        fz2 = af(pg)
        same = active_fid(pg) == fidZ and fz2.evaluate("window.__alive") == 'Z-A'
        txt = zimni_text(fz2) or ''
        sc1 = fz2.evaluate("(() => { const sc = [...document.querySelectorAll('#dio-dv-body, #dio-dv-body *')].find(e => /(auto|scroll)/.test(getComputedStyle(e).overflowY) && e.scrollHeight > e.clientHeight + 10); return sc ? sc.scrollTop : -1; })()")
        check(f'{tag} A2) «واپس» → وہی ضمنی، وہی صفحہ (دوبارہ نہیں بنی)، غیر محفوظ متن موجود', same and MA in txt, [same, txt[:60]])
        check(f'{tag} A2) scroll جہاں چھوڑا تھا', sc1 == sc0 and sc0 > 0, [sc0, sc1])
        pg.wait_for_timeout(300)
        cur_ok = fz2.evaluate("(() => { const a = document.activeElement; const s = getSelection(); return !!(a && a.closest && a.closest('.zf-body') && s.rangeCount && a.contains(s.getRangeAt(0).startContainer)); })()")
        check(f'{tag} A2) کرسر وہیں (ضمنی کے متن میں) — واپس آتے ہی لکھائی جاری', cur_ok)
        shot(pg, f'{tag}_04_back_to_zimni')

        # ═══ «نئی دستاویز» → نئی ٹیب؛ ضمنی کی ٹیب پر واپس → متن وہیں ═══
        n0 = len(tabs(pg))
        fz2.evaluate("_dioAddDocPicker(); 0"); pg.wait_for_timeout(300)
        fz2.click("#dio-dv-picker span:has-text('ایف آئی آر') >> nth=0"); pg.wait_for_timeout(400); wait_active_ready(pg)
        T = tabs(pg)
        check(f'{tag} C) «نئی دستاویز» → نئی ٹیب (پرانی بند نہیں)', len(T) == n0 + 1 and af(pg).evaluate("!!document.getElementById('fir-page')"), tab_titles(pg))
        click_tab(pg, 0)
        check(f'{tag} C) ضمنی کی ٹیب پر واپس → متن وہیں', active_fid(pg) == fidZ and MA in (zimni_text(af(pg)) or ''))

        # ═══ + نئی ٹیب، دوسرا مقدمہ (701/26)؛ تینوں میں لکھنا / بدلنا ═══
        strip_click(pg, '[data-act="new"]'); wait_active_ready(pg)
        fn = af(pg)
        check(f'{tag} C1) «+» → نئی ٹیب ڈیش بورڈ پر، وہی افسر', fn.evaluate("window._activePage") == 'dashboard' and fn.evaluate("currentOfficer.id") == me
              and fn.evaluate("getComputedStyle(document.getElementById('login-screen')).display") == 'none', tab_titles(pg))
        fc2 = open_new_zimni(pg, fn, 'c2')
        type_zimni(fc2, MC); pg.wait_for_timeout(400)
        fidC = active_fid(pg)
        shot(pg, f'{tag}_05_case2_zimni')
        click_tab(pg, 0)
        type_zimni(af(pg), ' — مزید'); pg.wait_for_timeout(400)
        click_tab(pg, 1)
        fir_ok = af(pg).evaluate("!!document.getElementById('fir-page')")
        click_tab(pg, 2)
        okC = MC in (zimni_text(af(pg)) or '') and active_fid(pg) == fidC
        click_tab(pg, 0)
        okA = (MA + ' — مزید') in (zimni_text(af(pg)) or '')
        check(f'{tag} C3) ایک مقدمے کی دو ٹیبیں + دوسرے مقدمے کی ایک: ہر ایک میں کام، بدلنا، کچھ ضائع نہیں', okA and okC and fir_ok, [okA, okC, fir_ok, tab_titles(pg)])
        check(f'{tag} C3) غیر محفوظ کا نشان (ٹیب پر نقطہ) ضمنی والی ٹیبوں پر', [t['dirty'] for t in tabs(pg)] == [True, False, True], [t['dirty'] for t in tabs(pg)])
        shot(pg, f'{tag}_06_three_tabs')

        # ═══ ہر ٹیب کی اپنی تاریخ: 5 قدم آگے، 4 پیچھے، 4 آگے ═══
        strip_click(pg, '[data-act="new"]'); wait_active_ready(pg)
        fh = af(pg)
        fh.evaluate("dioOpenCases(''); 0"); pg.wait_for_timeout(1500)
        af(pg).evaluate("openCaseWorkspace('c2'); 0"); pg.wait_for_timeout(1500); wait_active_ready(pg)
        af(pg).click("#misal-doc-bar .mdoc-chip:has-text('ضمنیات')"); pg.wait_for_timeout(2000); wait_active_ready(pg)
        af(pg).click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2300)
        type_zimni(af(pg), 'تاریخ کی جانچ'); pg.wait_for_timeout(500)
        hist = tabs(pg)[-1]['titles']
        check(f'{tag} C4) 5 جگہیں ایک ٹیب کی تاریخ میں', len(hist) == 5, hist)
        seen = [tabs(pg)[-1]['cur']]
        for _ in range(4):
            if desktop: pg.keyboard.press('Alt+ArrowLeft')
            else: back_btn(pg)
            pg.wait_for_timeout(500); wait_active_ready(pg); seen.append(tabs(pg)[-1]['cur'])
        exp_back = [hist[4].split(' 701')[0], 'ضمنیات', 'مقدمہ', 'میرے مقدمات', 'ڈیش بورڈ']
        check(f'{tag} C4) «واپس» ×4 (Alt+←) — ہر قدم درست', seen == exp_back, seen)
        seen2 = []
        for _ in range(4):
            if desktop: pg.keyboard.press('Alt+ArrowRight')
            else: fwd_btn(pg)
            pg.wait_for_timeout(500); wait_active_ready(pg); seen2.append(tabs(pg)[-1]['cur'])
        check(f'{tag} C4) «آگے» ×4 (Alt+→) — ہر قدم درست، آخر میں وہی غیر محفوظ ضمنی', seen2 == exp_back[::-1][1:] and 'تاریخ کی جانچ' in (zimni_text(af(pg)) or ''), seen2)
        check(f'{tag} C4) دوسری ٹیبوں کی تاریخ پر اثر نہیں', [len(t['titles']) for t in tabs(pg)][:3] == [len(x) for x in [tabs(pg)[0]['titles'], tabs(pg)[1]['titles'], tabs(pg)[2]['titles']]] and tabs(pg)[0]['cur'].startswith('ضمنی'))

        # ═══ Ctrl+Enter / Ctrl+click → نئی ٹیب؛ Enter → اسی ٹیب ═══
        click_tab(pg, 3)
        for _ in range(4): back_btn(pg)            # ڈیش بورڈ
        ft = af(pg)
        nT = len(tabs(pg))
        if desktop:
            ft.focus("button.dio-tile[onclick*=\"dioOpenCases\"]")
            pg.keyboard.press('Control+Enter'); pg.wait_for_timeout(600)
            for _ in range(60):
                if not any(t['loading'] for t in tabs(pg)): break
                pg.wait_for_timeout(200)
            T = tabs(pg)
            check(f'{tag} C2) Ctrl+Enter → نئی ٹیب (پیچھے)، موجودہ ٹیب وہیں', len(T) == nT + 1 and T[nT]['cur'] == 'میرے مقدمات' and af(pg).evaluate("window._activePage") == 'dashboard',
                  tab_titles(pg))
            ft.focus("button.dio-tile[onclick*=\"dioOpenCases\"]")
            t0 = pg.evaluate("window.__toasts.length")
            pg.keyboard.press('Enter'); pg.wait_for_timeout(1500)
            moved = pg.evaluate(f"window.__toasts.slice({t0})")
            # اس ٹیب کی «آگے» تاریخ میں غیر محفوظ ضمنی تھی — نئے صفحے پر وہ بند نہیں، اپنی الگ ٹیب میں (افسر کا فیصلہ 7)
            check(f'{tag} C2) Enter → اسی ٹیب میں؛ «آگے» والی غیر محفوظ ضمنی الگ ٹیب میں (بند نہیں)', af(pg).evaluate("window._activePage") == 'cases'
                  and len(tabs(pg)) == nT + 2 and any('الگ ٹیب' in m for m in moved) and any(t['dirty'] and t['num'] == '701/26' for t in tabs(pg)[nT:]), [tab_titles(pg), moved])
            nT = len(tabs(pg))
            af(pg).click("[onclick*=\"openCaseWorkspace('c1')\"] >> nth=0", modifiers=['Control']); pg.wait_for_timeout(600)
            for _ in range(60):
                if not any(t['loading'] for t in tabs(pg)): break
                pg.wait_for_timeout(200)
            check(f'{tag} C2) Ctrl+click → نئی ٹیب', len(tabs(pg)) == nT + 1 and any(t['cur'] == 'مقدمہ' and t['num'] == '663/26' for t in tabs(pg)) and af(pg).evaluate("window._activePage") == 'cases', tab_titles(pg))
            nT = len(tabs(pg))
            af(pg).click("[onclick*=\"openCaseWorkspace('c2')\"] >> nth=0", button='middle'); pg.wait_for_timeout(600)
            for _ in range(60):
                if not any(t['loading'] for t in tabs(pg)): break
                pg.wait_for_timeout(200)
            check(f'{tag} C2) درمیانی بٹن → نئی ٹیب', len(tabs(pg)) == nT + 1 and any(t['cur'] == 'مقدمہ' and t['num'] == '701/26' for t in tabs(pg)), tab_titles(pg))
            shot(pg, f'{tag}_07_ctrl_enter_tabs')
            # ── ساتھ ساتھ ──
            strip_click(pg, '[data-act="split"]'); pg.wait_for_timeout(1500)
            vis = pg.evaluate("[...document.querySelectorAll('#dio-tabs-stage iframe.on')].map(f => { const r = f.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.width)]; })")
            check(f'{tag} 13) ساتھ ساتھ: دو ٹیبیں برابر میں', len(vis) == 2 and all(w > 500 for _, w in vis) and abs(vis[0][0] - vis[1][0]) > 500, vis)
            shot(pg, f'{tag}_08_split_view')
            strip_click(pg, '[data-act="split"]')
            # ── کلیدیں ── (پہلے حد سے نیچے: آخری دو ٹیبیں بند)
            for _ in range(2): pg.click('#dio-tabs-strip .dio-tab >> nth=-1 >> .x'); pg.wait_for_timeout(500)
            nT = len(tabs(pg))
            af(pg).click('body', position={'x': 600, 'y': 500}); pg.keyboard.press('Alt+t'); pg.wait_for_timeout(500); wait_active_ready(pg)
            k1 = len(tabs(pg)) == nT + 1
            pg.keyboard.press('Control+1'); pg.wait_for_timeout(500); wait_active_ready(pg)
            k2 = tabs(pg)[0]['on']
            pg.keyboard.press('Alt+PageDown'); pg.wait_for_timeout(500); wait_active_ready(pg)
            k3 = tabs(pg)[1]['on']
            pg.keyboard.press('Control+9'); pg.wait_for_timeout(500); wait_active_ready(pg)
            k4 = tabs(pg)[-1]['on']
            pg.keyboard.press('Alt+w'); pg.wait_for_timeout(800)
            k5 = len(tabs(pg)) == nT
            check(f'{tag} 14) کلیدیں: Alt+T نئی، Ctrl+1 / Ctrl+9 / Alt+PageDown بدلنا، Alt+W بند', all([k1, k2, k3, k4, k5]), [k1, k2, k3, k4, k5])
        else:
            pg.click('#dio-tabs-strip [data-act="sheet"]'); pg.wait_for_timeout(500)
            cards = pg.evaluate("document.querySelectorAll('#dio-tabs-sheet .card').length")
            check(f'{tag} 13) موبائل: ٹیبوں کی فہرست (تعداد کے بٹن سے)', cards == len(tabs(pg)), cards)
            shot(pg, f'{tag}_08_tab_switcher')
            pg.click('#dio-tabs-sheet [data-act="hide"]'); pg.wait_for_timeout(300)

        # ═══ «بند» / ✕ ایپ کے اندر → ایک قدم پیچھے؛ Esc → ایک قدم ═══
        click_tab(pg, 1)                                  # ایف آئی آر (مقدمہ 663/26)
        steps0 = tabs(pg)[1]['n']
        af(pg).evaluate("_openMisalEditor('statements_161'); 0"); pg.wait_for_timeout(2000); wait_active_ready(pg)
        fs = af(pg)
        fs.click("button[onclick*='_newZimniA']"); pg.wait_for_timeout(2000)
        n1 = tabs(pg)[1]['n']
        fs.click("button[onclick*='_zaClose']"); pg.wait_for_timeout(1500); wait_active_ready(pg)
        T1 = tabs(pg)[1]
        check(f'{tag} 4) بیان 161 کا «✕ بند» → ایک قدم پیچھے (ایپ بند نہیں، ٹیب کھلی)', T1['n'] == n1 - 1 and len(tabs(pg)) >= 3, [steps0, n1, T1['titles']])
        if desktop:
            af(pg).click('#dio-dv-body', position={'x': 400, 'y': 300}) if af(pg).evaluate("!!document.getElementById('dio-dv-body')") else None
            nb = tabs(pg)[1]['idx']
            pg.keyboard.press('Escape'); pg.wait_for_timeout(1200); wait_active_ready(pg)
            check(f'{tag} 4) Esc دستاویز میں → ایک قدم پیچھے', tabs(pg)[1]['idx'] == nb - 1, tabs(pg)[1]['titles'])
        # موڈل (کارڈ) کا ✕ — صرف کارڈ بند، ٹیب وہیں
        af(pg).evaluate("openModal('آزمائشی کارڈ', '<div>کارڈ</div>', ''); 0"); pg.wait_for_timeout(300)
        i0 = tabs(pg)[1]['idx']
        back_btn(pg)
        check(f'{tag} 5) «واپس» پہلے کھلا کارڈ بند کرے (صفحہ نہیں)', af(pg).evaluate("getComputedStyle(document.getElementById('modal-backdrop')).display") == 'none' and tabs(pg)[1]['idx'] == i0)

        # ═══ براؤزر / Android «واپس» (تاریخ کا popstate) → ٹیب کا ایک قدم؛ ڈیش بورڈ پر → سوال ═══
        click_tab(pg, 0)
        i0 = tabs(pg)[0]['idx']
        hl0 = pg.evaluate("history.length")
        pg.evaluate("history.back(); 0"); pg.wait_for_timeout(900); wait_active_ready(pg)
        check(f'{tag} 5) براؤزر / Android «واپس» → اسی ٹیب کا ایک قدم پیچھے (ایپ سے باہر نہیں)', tabs(pg)[0]['idx'] == i0 - 1 and pg.evaluate("!!document.getElementById('dio-tabs-root')"),
              [i0, tabs(pg)[0]['idx'], hl0])
        while tabs(pg)[0]['idx'] > 0:
            back_btn(pg)
        if tabs(pg)[0]['cur'] != 'ڈیش بورڈ':
            back_btn(pg)
        pg.evaluate("history.back(); 0"); pg.wait_for_timeout(700)
        ex = pg.evaluate("(() => { const e = document.getElementById('dio-tabs-exit'); return e && e.classList.contains('on') ? e.innerText : ''; })()")
        check(f'{tag} 5) ڈیش بورڈ پر «واپس» → «کیا آپ بند کرنا چاہتے ہیں؟»', 'کیا آپ بند کرنا چاہتے ہیں؟' in ex, ex[:80])
        shot(pg, f'{tag}_09_exit_question')
        pg.click('#dio-tabs-exit .stay'); pg.wait_for_timeout(400)
        check(f'{tag} 5) «نہیں» → Digital IO کھلا، ٹیبیں وہیں', not pg.evaluate("document.getElementById('dio-tabs-exit').classList.contains('on')") and len(tabs(pg)) >= 3)
        pg.keyboard.press('Alt+ArrowLeft') if desktop else back_btn(pg)
        pg.wait_for_timeout(500)
        ex2 = pg.evaluate("document.getElementById('dio-tabs-exit').classList.contains('on')")
        check(f'{tag} 5) ڈیش بورڈ پر Alt+← / ٹیب کا «واپس» بھی وہی سوال', ex2)
        pg.click('#dio-tabs-exit .stay'); pg.wait_for_timeout(300)

        # ═══ حد: 8 ٹیبیں (موبائل 4) ═══
        lim = 8 if desktop else 4
        guard = 0
        while len(tabs(pg)) < lim and guard < 10:
            strip_click(pg, '[data-act="new"]'); wait_active_ready(pg); guard += 1
        n_before = len(tabs(pg)); t0 = pg.evaluate("window.__toasts.length")
        strip_click(pg, '[data-act="new"]'); pg.wait_for_timeout(400)
        msg = pg.evaluate(f"window.__toasts.slice({t0})")
        check(f'{tag} 6) حد: {lim} ٹیبیں — اس سے زیادہ نہیں، صاف پیغام', len(tabs(pg)) == n_before == lim and any(str(lim) in m for m in msg), [n_before, msg])

        # ═══ ٹیب کا ✕: غیر محفوظ ضمنی والی ٹیب بند = مسودہ محفوظ؛ آخری ٹیب بند → ایک ڈیش بورڈ ٹیب ═══
        while len(tabs(pg)) > 3:
            if desktop: pg.click('#dio-tabs-strip .dio-tab >> nth=-1 >> .x')
            else:
                pg.click('#dio-tabs-strip [data-act="sheet"]'); pg.wait_for_timeout(300); pg.click('#dio-tabs-sheet .card >> nth=-1 >> .cx')
                pg.click('#dio-tabs-sheet [data-act="hide"]') if pg.evaluate("document.getElementById('dio-tabs-sheet').classList.contains('on')") else None
            pg.wait_for_timeout(500)
        saved_titles = tab_titles(pg)
        check(f'{tag} 11) ✕ سے ٹیبیں بند — باقی وہیں', len(tabs(pg)) == 3, saved_titles)

        # ═══ reload → (لاگ اِن، جیسے آج) → ٹیبیں واپس، ڈیش بورڈ سامنے، غیر محفوظ ضمنی کا مسودہ اپنی ٹیب میں ═══
        dlg = []; dmode = {'v': 'accept'}
        def _dlg(d):
            dlg.append(d.type)
            try:
                if dmode['v'] == 'accept': d.accept()
                else: d.dismiss()
            except Exception: pass
        pg.on('dialog', _dlg)
        pg.reload(); pg.wait_for_timeout(2500)
        pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
        pg.wait_for_timeout(500); wait_active_ready(pg); pg.wait_for_timeout(800)
        T = tabs(pg)
        rest = [ (t['cur'] or '') + (' ' + t['num'] if t['num'] else '') for t in T]
        check(f'{tag} 12) reload → ٹیبیں واپس، ڈیش بورڈ سامنے', T[0]['on'] and T[0]['cur'] == 'ڈیش بورڈ' and all(any(s.split(' ')[0] in r for r in rest) for s in saved_titles if s),
              [saved_titles, rest])
        idxA = next((i for i, t in enumerate(T) if (t['cur'] or '').startswith('ضمنی') and t['num'] == '701/26'), None)
        if idxA is not None:
            click_tab(pg, idxA); pg.wait_for_timeout(1500)
            ta = zimni_text(af(pg)) or ''
            check(f'{tag} 12) بحال ٹیب: غیر محفوظ ضمنی کا خودکار مسودہ ایڈیٹر میں', MC in ta, ta[:80])
            shot(pg, f'{tag}_10_after_reload_restored')
        else:
            check(f'{tag} 12) بحال ٹیب: غیر محفوظ ضمنی کا خودکار مسودہ ایڈیٹر میں', False, rest)

        # ═══ کھڑکی کا X → براؤزر کی اپنی تصدیق (beforeunload) ═══
        check(f'{tag} 12) reload پر براؤزر کی تصدیق آئی (beforeunload)', 'beforeunload' in dlg, dlg)
        dlg.clear(); dmode['v'] = 'dismiss'
        af(pg).click('body', position={'x': 600 if desktop else 200, 'y': 400})
        try: pg.close(run_before_unload=True)
        except Exception: pass
        pg.wait_for_timeout(800)
        check(f'{tag} 6) کھڑکی کا X / بند → براؤزر کی تصدیق (beforeunload)، «Cancel» پر کھلا رہے', 'beforeunload' in dlg and not pg.is_closed(), dlg)
        e2 = [e for e in errs if 'ResizeObserver' not in e]
        check(f'{tag} کوئی JS خرابی نہیں (اوپر کی کھڑکی)', not e2, e2[:3])
        b.close()


if __name__ == '__main__':
    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'): run(True)
    if only in ('', 'mobile'): run(False)
    fails = [r for r in R if r[0] == 'FAIL']
    print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
    json.dump(R, open(V + 'results.json', 'w'), ensure_ascii=False, indent=1)
    sys.exit(1 if fails else 0)
