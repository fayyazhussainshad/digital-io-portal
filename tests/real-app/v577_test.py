"""(v577) افسر کی ہدایات (11 نومبر 2026) — اصل ایپ (Desktop 1366×768 + Mobile 390×844):
  1) ضمنی اور بیان 161 — محفوظ ہونے کے بعد «اپ ڈیٹ» (دستاویز کا بٹن اور «⋯» کی سطر؛ پرانی کھولیں تو بھی)
  2) بیانات 161 ض ف — اوپر کی پٹی ختم (بیرونی ضمنی کی طرح)؛ گواہ کا «▾» کاغذ کے دائیں کونے میں؛ مدعی فہرست میں (سب سے پہلے)؛
     «⋯» سے محفوظ / پرنٹ (= Ctrl+P)؛ reload کے بعد بیان وہی؛ ٹیبوں میں «⋯ → واپس» = بیانات کی فہرست
  4) ایڈمن پینل کے پیغامات اردو میں (دائیں سے بائیں، Jameel Noori، نام escape)
چلانا: `python3 v577_test.py` (سرور: repo کی جڑ میں `python3 -m http.server 8770`)
"""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from t22_common import *
import real

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v577/'
os.makedirs(V, exist_ok=True)
SRC = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'v558_test.py'), encoding='utf-8').read()
LONG = 'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض موضع سید پور تحصیل شجاع آباد ضلع ملتان'
exec(SRC[SRC.index('SEED = """'):SRC.index('HOOK = """')])          # وہی آزمائشی مقدمہ (مدعی، محرر، دو گواہ)
ZA = "(window.__db.zimni_androoni_reports||[]).filter(r => r.case_id === 'c1').map(r => ({id: r.id, w: (r.content||{}).witnesses||[], b: ((r.content||{}).bodyHtml||'')}))"
CAP = """(() => { window.__dp = []; const o = window.dioPrint; window.dioPrint = function (h) { window.__dp.push(String(h)); };
  window._dioDoPrint = function (h) { window.__dp.push(String(h)); }; return 0; })()"""


def fab(pg, act):
    pg.click('#dio-dv-fab'); pg.wait_for_selector('#dio-dv-menu', timeout=5000)
    if act is None:
        r = pg.evaluate("[...document.querySelectorAll('#dio-dv-menu .dvm-i, #dio-dv-menu .dvm-st')].map(b => b.textContent.trim())")
        pg.evaluate("_dioMenuClose(); 0")
        return r
    pg.click(f"#dio-dv-menu button[data-act='{act}']")


def menu_rows(pg):
    pg.click('#zfa-cp-wit'); pg.wait_for_selector('#zfa-cp-menu', timeout=5000)
    r = pg.evaluate("[...document.querySelectorAll('#zfa-cp-menu button[data-v]')].map(b => [b.textContent.trim(), !!b.querySelector('.dio-i[data-ico=check]')])")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    return r


def open_za(pg):
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)


def run(b, tag, desktop):
    vp = DESK if desktop else MOB
    extra = {} if desktop else MOBX
    ctx, pg, errs = open_app(b, viewport=vp, **extra)
    pg.on('dialog', lambda d: d.accept())
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
    pg.evaluate(SEED)

    # ═══ 2) بیانات 161 — اوپر کی پٹی ختم، کونے کا «▾» ═══
    try:
        open_za(pg)
        pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(2000)
        g = pg.evaluate("""(() => { const a = document.getElementById('workspace-editor-area'), sc = document.getElementById('zfa-scroll');
            const b = document.getElementById('zfa-cp-wit').getBoundingClientRect(), d = document.getElementById('ch173-doc').getBoundingClientRect();
            const vis = [...a.querySelectorAll('button,select')].filter(x => x.getClientRects().length && !x.closest('#ch173-doc')).map(x => x.id || x.tagName);
            return { vis, bar: !!a.querySelector('.zfa-bar'), scTop: Math.round(sc.getBoundingClientRect().top - a.getBoundingClientRect().top),
              right: Math.round(d.right - b.right), top: Math.round(b.top - d.top), w: Math.round(b.width), h: Math.round(b.height),
              look: (() => { const c = getComputedStyle(document.getElementById('zfa-cp-wit')); return [c.backgroundColor, c.color, c.borderTopColor]; })(),
              pick: (() => { const p = document.querySelector('.dio-pick'); return p ? null : null; })() }; })()""")
        pg.screenshot(path=V + f'{tag}_01_editor.png')
        check(f'{tag}: بیانات 161 — اوپر کی پٹی ختم (کاغذ سے اوپر کوئی بٹن / ڈراپ ڈاؤن نہیں، صرف کونے کا «▾»)',
              not g['bar'] and g['vis'] == ['zfa-cp-wit'] and g['scTop'] == 0, g)
        check(f'{tag}: «▾» کاغذ کے دائیں کونے میں (اندر، اوپر)؛ وہی چننے والا بٹن (ملزمان / ضمنی کے کونوں والا)',
              0 <= g['right'] <= 12 and 0 <= g['top'] <= 12 and g['w'] == g['h'] and g['w'] == (20 if desktop else 30)
              and g['look'] == ['rgb(238, 246, 255)', 'rgb(3, 105, 161)', 'rgb(3, 105, 161)'], g)
        rows = menu_rows(pg)
        check(f'{tag}: «▾» کی فہرست — مدعی سب سے پہلے «(مدعی)»، پھر محرر، پھر گواہان، آخر میں «نیا گواہ شامل کریں»',
              len(rows) == 5 and rows[0][0].endswith('(مدعی)') and 'محمد امجد حسین' in rows[0][0] and rows[1][0].endswith('(محرر)')
              and 'احمد علی' in rows[2][0] and LONG in rows[3][0] and rows[4][0] == 'نیا گواہ شامل کریں', rows)
        pg.click('#zfa-cp-wit'); pg.wait_for_selector('#zfa-cp-menu'); pg.screenshot(path=V + f'{tag}_02_menu.png')
        pg.locator('#zfa-cp-menu button[data-v]').nth(0).click(); pg.wait_for_timeout(1400)
        za_pick(pg, 'احمد علی', 1400)
        blocks = pg.evaluate("[...document.querySelectorAll('#ch173-doc .zfa-wit-block')].map(b => [b.getAttribute('data-witness-name'), b.querySelector('.zfa-wit-stmt').textContent])")
        check(f'{tag}: «▾» سے چننا — مدعی کا بیان (FIR کا متن نہیں) اور گواہ کا بیان (FIR کے متن سمیت) صفحے پر',
              len(blocks) == 2 and 'محمد امجد حسین' in blocks[0][0] and 'مدعی مقدمہ' not in blocks[0][1] and 'احمد علی' in blocks[1][0] and 'مدعی مقدمہ' in blocks[1][1], blocks)
        marks = [r[1] for r in menu_rows(pg)]
        check(f'{tag}: جن کا بیان صفحے پر آ گیا اُن کے آگے نشان (✓)', marks == [True, False, True, False, False], marks)
        m0 = fab(pg, None)
        check(f'{tag}: نیا بیان — «⋯» میں «محفوظ کریں»، پرنٹ، شیئر، واپس', 'محفوظ کریں' in m0 and all(x in m0 for x in ('پرنٹ', 'شیئر', 'واپس')), m0)
        pg.evaluate("window.__toasts = []; const o = window.showToast; window.showToast = function (m) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; 0")
        fab(pg, 'save'); pg.wait_for_timeout(2000)
        za = pg.evaluate(ZA); m1 = fab(pg, None)
        lab = pg.evaluate("document.getElementById('zfa-save-btn').textContent.trim()")
        check(f'{tag}: «⋯ → محفوظ کریں» — بیان سرور پر (ایک ریکارڈ، دونوں نام)', len(za) == 1 and len(za[0]['w']) == 2, za)
        check(f'{tag}: محفوظ کے بعد «اپ ڈیٹ» — «⋯» کی سطر اور دستاویز کا بٹن؛ «آخری اپ ڈیٹ» کا وقت «⋯» میں', 'اپ ڈیٹ' in m1 and 'محفوظ کریں' not in m1 and lab == 'اپ ڈیٹ'
              and any(x.startswith('آخری اپ ڈیٹ:') for x in m1), (m1, lab))
        pg.evaluate("""(() => { const s = document.querySelectorAll('#ch173-doc .zfa-wit-stmt')[1]; s.focus(); const r = document.createRange(); r.selectNodeContents(s); r.collapse(false);
            const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, ' ترمیم v577۔'); return 0; })()""")
        pg.keyboard.press('Control+s'); pg.wait_for_timeout(1800)
        za2 = pg.evaluate(ZA)
        check(f'{tag}: «اپ ڈیٹ» (Ctrl+S) — وہی ریکارڈ، نیا نہیں', len(za2) == 1 and za2[0]['id'] == za[0]['id'] and 'ترمیم v577' in za2[0]['b'], [(z['id'], len(z['b'])) for z in za2])
        # پرنٹ: «⋯ → پرنٹ» = Ctrl+P (ایک ہی کاغذ)
        pg.evaluate(CAP); fab(pg, 'print'); pg.wait_for_timeout(2500)
        h1 = pg.evaluate("window.__dp[0] || ''")
        pg.evaluate(CAP); pg.click('#ch173-doc .zfa-wit-stmt'); pg.keyboard.press('Control+p'); pg.wait_for_timeout(2500)
        h2 = pg.evaluate("window.__dp[0] || ''")
        check(f'{tag}: «⋯ → پرنٹ» = Ctrl+P (وہی بیان، ایک ہی کاغذ؛ «▾» چھپائی میں نہیں)', bool(h1) and h1 == h2 and 'zfa-tbl' in h1 and 'ترمیم v577' in h1 and 'zfa-cp-wit' not in h1, (len(h1), len(h2)))
    except Exception as e:
        check(f'{tag}: statements section crashed', False, repr(e)[:300])

    # ═══ پرانا (محفوظ) بیان فہرست سے کھولیں: «اپ ڈیٹ» شروع سے (reload + دوسرا آلہ: v568_sync_test.py) ═══
    try:
        pg.evaluate("document.getElementById('zfa-back-btn').click()"); pg.wait_for_timeout(1500)   # ٹیبوں میں «⋯ → واپس» یہی (نیچے tabs_back)
        pg.click(".zat-wrap tbody tr[data-zaid] button[data-act='edit']"); pg.wait_for_timeout(2000)
        txt = pg.evaluate("(document.getElementById('ch173-doc') || {}).textContent || ''")
        m2 = fab(pg, None)
        lab = pg.evaluate("document.getElementById('zfa-save-btn').textContent.trim()")
        check(f'{tag}: محفوظ بیان فہرست سے دوبارہ کھولا — وہی متن (ترمیم سمیت)، کھولتے ہی «اپ ڈیٹ»', 'ترمیم v577' in txt and 'اپ ڈیٹ' in m2 and lab == 'اپ ڈیٹ', (m2, lab))
        check(f'{tag}: کھلے بیان پر بھی اوپر کی پٹی نہیں، کونے کا «▾» موجود',
              pg.evaluate("!document.querySelector('.zfa-bar') && !!document.getElementById('zfa-cp-wit').getClientRects().length"))
    except Exception as e:
        check(f'{tag}: reload section crashed', False, repr(e)[:300])

    # ═══ 1) بیرونی ضمنی — نئی «محفوظ کریں»، محفوظ کے بعد / پرانی کھولنے پر «اپ ڈیٹ» ═══
    try:
        pg.evaluate("window.__db.zimni_reports = []; 0")
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(900)
        pg.evaluate("_newZimni()"); pg.wait_for_timeout(1500)
        pg.evaluate("""(() => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = '14/10/2026'; a.dispatchEvent(new Event('input',{bubbles:true})); return 0; })()""")
        pg.click('#ch173-doc .zf-body'); pg.keyboard.press('End'); pg.keyboard.type(' مقدمہ کی تفتیش جاری ہے۔'); pg.wait_for_timeout(300)
        n0 = fab(pg, None); lab0 = pg.evaluate("document.getElementById('zf-save-btn').textContent.trim()")
        fab(pg, 'save'); pg.wait_for_timeout(2000)
        n1 = fab(pg, None); lab1 = pg.evaluate("document.getElementById('zf-save-btn').textContent.trim()")
        rows = pg.evaluate("(window.__db.zimni_reports||[]).length")
        check(f'{tag}: بیرونی ضمنی — نئی پر «محفوظ کریں»، «⋯ → محفوظ کریں» کے بعد «اپ ڈیٹ» (بٹن اور «⋯»)',
              'محفوظ کریں' in n0 and lab0 == 'محفوظ کریں' and rows == 1 and 'اپ ڈیٹ' in n1 and lab1 == 'اپ ڈیٹ', (lab0, lab1, rows))
        pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1500)
        pg.click("tr[data-zid] button[data-act='edit'], .zt-wrap tbody tr button[data-act='edit']"); pg.wait_for_timeout(2000)
        n2 = fab(pg, None); lab2 = pg.evaluate("document.getElementById('zf-save-btn').textContent.trim()")
        check(f'{tag}: پرانی ضمنی کھولتے ہی «اپ ڈیٹ» (بٹن اور «⋯»)', 'اپ ڈیٹ' in n2 and lab2 == 'اپ ڈیٹ', (n2, lab2))
    except Exception as e:
        check(f'{tag}: bairooni section crashed', False, repr(e)[:300])

    real_errs = [e for e in errs if 'ResizeObserver' not in e]
    check(f'{tag}: کوئی JavaScript خرابی نہیں', not real_errs, real_errs[:3])
    ctx.close()


def mudai_dup(b):
    """مدعی گواہوں میں بھی درج (کسی اور حیثیت سے) — ایک ہی سطر، «(مدعی)»، سب سے پہلے؛ بیان میں FIR کا متن نہیں"""
    ctx, pg, errs = open_app(b, viewport=DESK)
    pg.evaluate(SEED)
    pg.evaluate("""(() => { window.__db.case_witnesses.push({ id:'w9', case_id:'c1', full_name:'محمد امجد حسین ولد عاشق حسین قوم آرائیں سکنہ بیرون دہلی گیٹ ملتان', status:'fir_eye', witness_type:'fir', created_at:'2026-10-05' }); return 0; })()""")
    open_za(pg); pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(2000)
    rows = menu_rows(pg)
    n = sum(1 for r in rows if 'محمد امجد حسین' in r[0])
    check('مدعی گواہوں میں بھی درج ہو تو — فہرست میں ایک ہی بار، «(مدعی)» اور سب سے پہلے', n == 1 and rows[0][0].endswith('(مدعی)') and 'محمد امجد حسین' in rows[0][0], rows)
    za_pick(pg, 'مدعی', 1400)
    st = pg.evaluate("(document.querySelector('#ch173-doc .zfa-wit-stmt') || {}).textContent || ''")
    check('اس مدعی کے بیان میں FIR کا متن خود نہیں آتا (مدعی کا اصول)', 'مدعی مقدمہ' not in st, st[:60])
    ctx.close()


def tabs_back(b, desktop):
    """ٹیبوں والی اصل ایپ: بیانات کی فہرست → نیا بیان → «▾» → «⋯ → محفوظ کریں» → «⋯ → واپس» = فہرست (ایک قدم)"""
    tag = 'Desktop' if desktop else 'Mobile'
    ctx, pg, errs = open_tabs(b, desktop=desktop)
    pg.evaluate("DIOTabs.open({ k: 'case', cid: 'c1' }); 0") if pg.evaluate("typeof DIOTabs.open === 'function'") else None
    wait_active_ready(pg)
    f = af(pg)
    f.evaluate("openCaseWorkspace('c1'); 0"); pg.wait_for_timeout(1500); wait_active_ready(pg); f = af(pg)
    f.evaluate("_openMisalEditor('statements_161'); 0"); pg.wait_for_timeout(2000); wait_active_ready(pg); f = af(pg)
    f.click("button[onclick*='_newZimniA']"); pg.wait_for_timeout(2000); f = af(pg)
    i1 = tabs(pg)[[t['on'] for t in tabs(pg)].index(True)]['idx']
    f.click('#zfa-cp-wit'); f.wait_for_selector('#zfa-cp-menu', timeout=5000)
    f.locator('#zfa-cp-menu button[data-v]').nth(0).click(); pg.wait_for_timeout(1400)
    f.click('#dio-dv-fab'); f.wait_for_selector('#dio-dv-menu', timeout=5000); f.click("#dio-dv-menu button[data-act='save']"); pg.wait_for_timeout(2200)
    saved = pg.evaluate("(window.__db.zimni_androoni_reports||[]).filter(r => r.case_id === 'c1').length")
    f.click('#dio-dv-fab'); f.wait_for_selector('#dio-dv-menu', timeout=5000); f.click("#dio-dv-menu button[data-act='back']"); pg.wait_for_timeout(1800); wait_active_ready(pg)
    T = tabs(pg)[[t['on'] for t in tabs(pg)].index(True)]
    lst = af(pg).evaluate("!!document.querySelector('.zat-wrap') && document.querySelectorAll('.zat-wrap tbody tr[data-zaid]').length")
    check(f'{tag} (ٹیبیں): «▾» سے مدعی، «⋯ → محفوظ کریں» سرور پر؛ «⋯ → واپس» = ایک قدم پیچھے، بیانات کی فہرست (محفوظ بیان سمیت)',
          saved == 1 and T['idx'] == i1 - 1 and lst == 1, (saved, i1, T['idx'], T['titles'], lst))
    real_errs = [e for e in errs if 'ResizeObserver' not in e]
    check(f'{tag} (ٹیبیں): کوئی JavaScript خرابی نہیں', not real_errs, real_errs[:3])
    ctx.close()


def admin(b, desktop):
    tag = 'Desktop' if desktop else 'Mobile'
    vp = DESK if desktop else MOB
    ctx = b.new_context(service_workers='block', viewport=vp, **({} if desktop else MOBX))
    def rt(r):
        u = r.request.url
        if 'supabase-js' in u: return r.fulfill(path=real.HERE + '/mock-supabase.js', content_type='application/javascript')
        return real.route(r)
    ctx.route('**/*', rt)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + 'admin.html'); pg.wait_for_timeout(2000)
    pg.evaluate("document.getElementById('adm-email').value = ''; document.getElementById('adm-pass').value = ''; doAdminLogin(); 0"); pg.wait_for_timeout(500)
    e = pg.evaluate("(() => { const el = document.getElementById('login-err'); const c = getComputedStyle(el); return [el.textContent, el.dir, c.fontFamily, c.display]; })()")
    check(f'{tag} ایڈمن: لاگ اِن کا پیغام اردو میں، دائیں سے بائیں، Jameel Noori', e[0] == 'ای میل اور پاس ورڈ لکھیں۔' and e[1] == 'rtl' and 'Jameel' in e[2] and e[3] != 'none', e)
    pg.evaluate("showToast(`افسر ${_ub('<img src=x onerror=window.__xss=1> Ali Khan')} کی درخواست مسترد کر دی گئی`, 'info', 60000); showToast('خرابی: ' + _ub('Invalid login credentials'), 'error', 60000); 0")
    pg.wait_for_timeout(600)
    t = pg.evaluate("""[...document.querySelectorAll('#toast-root .toast')].map(x => { const c = getComputedStyle(x); return [x.textContent, x.dir, c.fontFamily, !!x.querySelector('img'), x.querySelectorAll('bdi').length]; })""")
    fonts = pg.evaluate("document.fonts.check(\"12pt 'Jameel Noori Nastaleeq'\", 'اردو')")
    pg.screenshot(path=V + f'admin_{tag}.png')
    check(f'{tag} ایڈمن: پیغام اردو، دائیں سے بائیں، Jameel (فونٹ لوڈ)، نام / سرور کا پیغام <bdi> میں اور HTML نہیں چلتا',
          len(t) == 2 and all(x[1] == 'rtl' and 'Jameel' in x[2] and not x[3] and x[4] == 1 for x in t) and fonts and pg.evaluate("!window.__xss")
          and 'Ali Khan' in t[0][0] and t[1][0] == 'خرابی: Invalid login credentials', (t, fonts))
    check(f'{tag} ایڈمن: کوئی JavaScript خرابی نہیں', not errs, errs[:3])
    ctx.close()


with sync_playwright() as p:
    b = p.chromium.launch()
    only = os.environ.get('DIO_ONLY', '')
    for d in (True, False):
        tag = 'Desktop' if d else 'Mobile'
        if only and only.lower() != tag.lower(): continue
        run(b, tag, d)
        tabs_back(b, d)
        admin(b, d)
    if not only: mudai_dup(b)
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
