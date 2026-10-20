"""(v552) اصل ایپ کی جانچ — Desktop + Mobile، سکرین + Ctrl+P / «پرنٹ» بٹن + براؤزر کی چھپائی

ضمنی: محفوظ (report_date YYYY-MM-DD — DD/MM والی تاریخ سرور رد کرتا تھا) · اصل وجہ کا پیغام
(«zimni_content» نہیں) · آف لائن پہلے، انٹرنیٹ آتے ہی خود sync (دوہرا نہیں) · خودکار مسودہ (صفحہ بند
ہو کر کھلے تو لکھا ہوا واپس) · ترمیم = وہی ضمنی (نئی نہیں)، «اپ ڈیٹ» · فہرست: نمبر، تاریخ، حالت،
ترمیم/پرنٹ/شیئر/PDF/نقل/حذف · سرخی = ذیلی ضمنی · نیچے کی تاریخ = کالم 1 کی تاریخ · Ctrl+P = «پرنٹ»
بٹن (ایک ہی پرنٹ، ضمنی کی CSS، کالم کی لکیریں) · براؤزر کی چھپائی میں بھی کالم کی لکیریں ·
چِپ پٹی کا «واپس» نظر آتا ہے · لینڈنگ بغیر scroll · لاگ اِن: سرور نہ ملے تو «غلط پاس ورڈ» نہیں ·
نیا مقدمہ: IMEI چوڑا، ماڈل لکھتے فارم بند نہیں، 356 پر موبائل، دوہرا مقدمہ نمبر نہیں · CDR «تاحال» +
فہرست میں پرنٹ · «متن میں ترمیم» درمیان · چالان کالم 6 میں عہدہ، کالم 2–4 چوڑے، لکیر کھینچنا ·
دایاں کلک: مقدمے کی تفصیل → کرسر کی جگہ۔

چلانا: README.md — `python3 v552_test.py`
"""
import sys, re, subprocess
sys.path.insert(0, '.')
from real import *
from PIL import Image

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra) if extra != '' else ''), flush=True)

TOASTS = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t, d) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"""
PRINTS = """(() => { window.__dp = []; window.dioPrint = function (h) { window.__dp.push(h); }; return 0; })()"""

def vlines_in(png, y0f, y1f, min_run=25, dark=110):
    """کالم کی عمودی لکیریں: کم از کم min_run px لمبی سیاہ لکیر (y0f–y1f کے بیچ)"""
    im = Image.open(png).convert('L'); w, h = im.size
    xs = []
    for x in range(w):
        run = best = 0
        for y in range(int(h * y0f), int(h * y1f)):
            if im.getpixel((x, y)) < dark: run += 1; best = max(best, run)
            else: run = 0
        if best >= min_run: xs.append(x)
    # پاس پاس کے x ایک لکیر
    out = []
    for x in xs:
        if not out or x - out[-1][-1] > 2: out.append([x])
        else: out[-1].append(x)
    return [g[0] for g in out]

def zimni_open(pg):
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1400)
    pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(900)

def type_body(pg, txt):
    pg.click('#ch173-doc .zf-body'); pg.keyboard.press('End'); pg.keyboard.type(txt); pg.wait_for_timeout(200)

def zrows(pg):
    return pg.evaluate("(window.__db.zimni_reports||[]).map(r => ({id:r.id, sn:r.serial_no, d:r.report_date, at:(r.content||{}).saved_at, head:(r.content||{}).head, body:(r.content||{}).bodyHtml||''}))")

def run(b, tag, vp, mobile=False):
    args = dict(viewport=vp)
    if mobile: args.update(is_mobile=True, has_touch=True, device_scale_factor=2)
    ctx, pg, errs = open_app(b, **args)
    pg.evaluate("window.__db.zimni_reports = []; 0")
    pg.evaluate(TOASTS)
    zimni_open(pg)
    # ── 1) نئی ضمنی: Ctrl+S — تاریخ 14/10/2026 (12 سے اوپر) — پہلے یہی رد ہوتی تھی ──
    pg.evaluate("_newZimni()"); pg.wait_for_timeout(1500)
    pg.evaluate("""(() => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = '14/10/2026'; a.dispatchEvent(new Event('input',{bubbles:true})); return 0; })()""")
    pg.wait_for_timeout(500)
    sign = pg.evaluate("(document.querySelector('#ch173-doc [data-k=\"io_date\"]')||{}).textContent")
    check(f'{tag}: نیچے کی تاریخ = کالم 1 کی تاریخ (14/10/2026)', sign == '14/10/2026', sign)
    type_body(pg, ' مقدمہ کی تفتیش جاری ہے۔')
    # ذیلی ضمنی → سرخی
    pg.select_option('#zf-main-type', 'متفرق'); pg.wait_for_timeout(200)
    pg.select_option('#zf-sub-type', 'متفرق ضمنی'); pg.wait_for_timeout(200)
    title = pg.evaluate("document.querySelector('#ch173-doc .zf-title').textContent")
    check(f'{tag}: سرخی = منتخب ذیلی ضمنی', title == 'متفرق ضمنی', title)
    pg.evaluate("document.querySelector('#ch173-doc .zf-body').focus()")
    pg.keyboard.press('Control+s'); pg.wait_for_timeout(1500)
    rows = zrows(pg)
    check(f'{tag}: Ctrl+S — سرور پر ایک ضمنی', len(rows) == 1, len(rows))
    check(f'{tag}: report_date ہمیشہ YYYY-MM-DD', bool(rows) and rows[0]['d'] == '2026-10-14', rows and rows[0]['d'])
    t = ' | '.join(pg.evaluate('window.__toasts'))
    check(f'{tag}: «zimni_content» والا غلط پیغام نہیں', 'zimni_content' not in t and 'سرور پر محفوظ' in t, t[-160:])
    check(f'{tag}: محفوظ کے بعد بٹن «اپ ڈیٹ»', 'اپ ڈیٹ' in pg.evaluate("document.getElementById('zf-save-btn').textContent"))
    # ── 2) ترمیم: Ctrl+S = وہی ضمنی (نئی قطار نہیں) ──
    type_body(pg, ' مزید کارروائی۔')
    pg.keyboard.press('Control+s'); pg.wait_for_timeout(1300)
    rows2 = zrows(pg)
    check(f'{tag}: ترمیم پر Ctrl+S — وہی ضمنی اپ ڈیٹ (ایک ہی قطار)', len(rows2) == 1 and rows2[0]['id'] == rows[0]['id'] and 'مزید کارروائی' in rows2[0]['body'], len(rows2))
    # ── 3) Ctrl+P = «پرنٹ» بٹن: ایک ہی پرنٹ، ضمنی کی CSS ──
    pg.evaluate(PRINTS)
    pg.keyboard.press('Control+p'); pg.wait_for_timeout(400)
    dp = pg.evaluate('window.__dp'); nat = pg.evaluate('window.__printCalls')
    check(f'{tag}: Ctrl+P — ایک ہی پرنٹ (دوسرا نہیں کھلتا)', len(dp) == 1 and nat == 0, f'{len(dp)} iframe / {nat} native')
    check(f'{tag}: Ctrl+P کے کاغذ میں ضمنی کی CSS (چالان والی شکل نہیں)', bool(dp) and '#ch173-doc table.zf-tbl td' in dp[0])
    pg.evaluate("window.__dp = []; 0")
    pg.click('button[data-dio-print]'); pg.wait_for_timeout(300)
    dp2 = pg.evaluate('window.__dp')
    same = bool(dp) and bool(dp2) and re.sub(r'\s+', ' ', dp[0]) == re.sub(r'\s+', ' ', dp2[0])
    check(f'{tag}: «پرنٹ» بٹن = Ctrl+P (بالکل وہی کاغذ)', same)
    if dp:
        p2 = ctx.new_page(); p2.set_content(dp[0]); p2.wait_for_timeout(1500)
        p2.pdf(path=f'{OUT}/v552_{tag}_zimni.pdf', prefer_css_page_size=True, print_background=True)
        p2.close()
        subprocess.run(['pdftoppm', '-png', '-r', '60', '-f', '1', '-l', '1', '-singlefile', f'{OUT}/v552_{tag}_zimni.pdf', f'{OUT}/v552_{tag}_zimni'])
        xs = vlines_in(f'{OUT}/v552_{tag}_zimni.png', 0.30, 0.55)
        check(f'{tag}: پرنٹ میں کالم کی عمودی لکیریں (کالم 1|2 اور 2|3)', len(xs) >= 2, xs)
        txt = subprocess.run(['pdftotext', f'{OUT}/v552_{tag}_zimni.pdf', '-'], capture_output=True, text=True).stdout
        check(f'{tag}: پرنٹ میں کالم 1 اور نیچے دونوں جگہ 14/10/2026', txt.count('14/10/2026') >= 2, txt.count('14/10/2026'))
    # ── 4) براؤزر کی اپنی چھپائی (مینیو) — کالم کی لکیریں غائب نہ ہوں ──
    pg.evaluate("window.dispatchEvent(new Event('beforeprint'))"); pg.wait_for_timeout(200)
    pg.pdf(path=f'{OUT}/v552_{tag}_native.pdf', print_background=True)
    pg.evaluate("window.dispatchEvent(new Event('afterprint'))"); pg.wait_for_timeout(200)
    subprocess.run(['pdftoppm', '-png', '-r', '60', '-f', '1', '-l', '1', '-singlefile', f'{OUT}/v552_{tag}_native.pdf', f'{OUT}/v552_{tag}_native'])
    # موبائل کی نقل میں page.pdf کاغذ کو چھوٹا کر کے بیچ میں رکھتا ہے — اسی لیے نیچے کی حد اور لمبائی کم
    xs = vlines_in(f'{OUT}/v552_{tag}_native.png', 0.12 if mobile else 0.30, 0.32 if mobile else 0.55, 20 if mobile else 25, 170 if mobile else 110)
    check(f'{tag}: براؤزر کی چھپائی میں بھی کالم کی لکیریں', len(xs) >= 2, xs)
    # ── 5) فہرست ──
    pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(900)
    lst = pg.evaluate("""(() => { const tr = document.querySelector('.zt tbody tr[data-zid]'); if (!tr) return null;
      return { cells: [...tr.children].map(td => td.innerText.trim()), btns: [...tr.querySelectorAll('button.zab')].map(b => b.title),
               hOverflow: document.querySelector('.zt-wrap').scrollWidth > document.querySelector('.zt-wrap').clientWidth + 1 }; })()""")
    check(f'{tag}: فہرست میں ضمنی — نمبر، تاریخ، حالت', bool(lst) and lst['cells'][0].endswith('1') and '14/10/2026' in lst['cells'][1] and 'سرور پر محفوظ' in lst['cells'][3], lst and lst['cells'][:4])
    check(f'{tag}: ہر سطر میں ترمیم/پرنٹ/شیئر/PDF/نقل/حذف', bool(lst) and lst['btns'] == ['ترمیم', 'پرنٹ', 'شیئر', 'PDF', 'نقل', 'حذف'], lst and lst['btns'])
    check(f'{tag}: فہرست میں افقی scroll نہیں', bool(lst) and not lst['hOverflow'])
    pg.screenshot(path=f'{OUT}/v552_{tag}_list.png')
    pg.evaluate(PRINTS)
    pg.evaluate(f"_printZimniById('{rows[0]['id']}')"); pg.wait_for_timeout(200)
    dpl = pg.evaluate('window.__dp')
    check(f'{tag}: فہرست کا «پرنٹ» — ضمنی کا کاغذ (سرخی اور تاریخ کا قاعدہ لاگو)', len(dpl) == 1 and 'متفرق ضمنی' in dpl[0] and dpl[0].count('14/10/2026') >= 2)
    # ── 6) آف لائن: آلے پر، پھر انٹرنیٹ آتے ہی خود sync (دوہرا نہیں) ──
    ctx.set_offline(True); pg.wait_for_timeout(200)
    pg.evaluate("_newZimni()"); pg.wait_for_timeout(1300)
    type_body(pg, ' آف لائن لکھی گئی ضمنی۔')
    pg.keyboard.press('Control+s'); pg.wait_for_timeout(900)
    loc = pg.evaluate("JSON.parse(localStorage.getItem('dio_zimni_c1')||'[]').filter(z => z._pending).length")
    check(f'{tag}: آف لائن Ctrl+S — اسی آلے پر محفوظ (sync باقی)', loc == 1 and len(zrows(pg)) == 1, loc)
    ctx.set_offline(False); pg.wait_for_timeout(4500)
    rows3 = zrows(pg)
    loc2 = pg.evaluate("JSON.parse(localStorage.getItem('dio_zimni_c1')||'[]').filter(z => z._pending).length")
    check(f'{tag}: انٹرنیٹ آتے ہی خود sync — سرور پر 2، دوہرا نہیں', len(rows3) == 2 and loc2 == 0, f'{len(rows3)} / pending {loc2}')
    pg.evaluate("_zimniSyncPending()"); pg.wait_for_timeout(1200)
    check(f'{tag}: دوبارہ sync پر بھی دوہرا نہیں', len(zrows(pg)) == 2)
    # ── 7) سرور کا رد: اصل وجہ، مقامی نقل محفوظ ──
    pg.evaluate("window.__opts.fail = ['zimni_reports:insert']; window.__toasts = []; 0")
    pg.evaluate("_newZimni()"); pg.wait_for_timeout(1300)
    type_body(pg, ' رد ہونے والی۔')
    pg.keyboard.press('Control+s'); pg.wait_for_timeout(1300)
    t = ' | '.join(pg.evaluate('window.__toasts'))
    check(f'{tag}: سرور کا رد — اصل وجہ (اجازت)، «zimni_content» نہیں', 'اجازت' in t and 'zimni_content' not in t, t[-200:])
    keep = pg.evaluate("JSON.parse(localStorage.getItem('dio_zimni_c1')||'[]').filter(z => z._pending && z._sync_err).length")
    check(f'{tag}: رد شدہ ضمنی آلے پر محفوظ + وجہ درج', keep == 1, keep)
    pg.evaluate("window.__opts.fail = []; 0")
    # ── 7b) سرور کی جدول میں متن کا کالم ہی نہ ہو — صاف وجہ، کام آلے پر محفوظ ──
    pg.evaluate("window.__opts.schema = { zimni_reports: ['id','case_id','serial_no','report_date','officer_id','created_at'] }; window.__toasts = []; 0")
    pg.evaluate("_newZimni()"); pg.wait_for_timeout(1300)
    type_body(pg, ' کالم کے بغیر۔')
    pg.keyboard.press('Control+s'); pg.wait_for_timeout(2500)
    t = ' | '.join(pg.evaluate('window.__toasts'))
    check(f'{tag}: متن کا کالم نہ ہو — صاف وجہ («کوئی کالم نہیں ملا»)، آلے پر محفوظ', 'کالم نہیں ملا' in t and 'اس آلے پر محفوظ' in t, t[-200:])
    pg.evaluate("window.__opts.schema = { zimni_reports: ['id','case_id','serial_no','report_date','officer_id','content','created_at','updated_at'] }; localStorage.removeItem('dio_zimni_col'); 0")
    # ── 8) خودکار مسودہ: لکھ کر (محفوظ کیے بغیر) صفحہ بند → دوبارہ کھولنے پر واپس ──
    pg.evaluate("_newZimni()"); pg.wait_for_timeout(1300)
    type_body(pg, ' مسودہ بغیر محفوظ کیے۔')
    pg.wait_for_timeout(2200)
    pg.reload(); pg.wait_for_timeout(2500)
    pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    pg.wait_for_timeout(2500); pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
    pg.evaluate("window.__db = window.__db || {}; 0")
    zimni_open(pg)
    dr = pg.evaluate("[...document.querySelectorAll('.zt tr.zt-draft')].length")
    check(f'{tag}: صفحہ بند ہو کر کھلا — غیر محفوظ مسودہ فہرست میں', dr == 1, dr)
    keys = pg.evaluate("Object.keys(JSON.parse(localStorage.getItem('dio_zimni_draft_c1')||'{}'))")
    check(f'{tag}: محفوظ شدہ ضمنیوں کا کوئی بچا ہوا مسودہ نہیں (صرف نیا)', len(keys) == 1 and keys[0].startswith('new:'), keys)
    pg.evaluate("_openZimniDraft(Object.keys(JSON.parse(localStorage.getItem('dio_zimni_draft_c1')||'{}')).find(k => k.startsWith('new:')))"); pg.wait_for_timeout(1300)
    has = pg.evaluate("document.querySelector('#ch173-doc').innerText.includes('مسودہ بغیر محفوظ کیے')")
    check(f'{tag}: مسودہ کھولنے پر لکھا ہوا متن واپس', has)
    ctx.close()
    return errs

def back_button(b, tag, vp, mobile=False):
    args = dict(viewport=vp)
    if mobile: args.update(is_mobile=True, has_touch=True)
    ctx, pg, errs = open_app(b, **args)
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
    r = pg.evaluate("""(() => { const b = document.querySelector('#misal-doc-bar .dio-backbtn'); const cs = getComputedStyle(b);
      const bar = getComputedStyle(document.getElementById('misal-doc-bar'));
      return { color: cs.color, bar: bar.backgroundColor, vis: b.getBoundingClientRect().width > 0 }; })()""")
    check(f'{tag}: چِپ پٹی کا «واپس» نظر آتا ہے (سفید پر سفید نہیں)', r['vis'] and r['color'] not in ('rgb(255, 255, 255)',), r)
    # دایاں کلک: مقدمے کی تفصیل → ملزمان → کرسر کی جگہ
    pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(900)
    pg.evaluate("_newZimni()"); pg.wait_for_timeout(1300)
    pg.click('#ch173-doc .zf-body'); pg.keyboard.press('End'); pg.keyboard.type(' ملزم ')
    box = pg.evaluate("(() => { const r = document.querySelector('#ch173-doc .zf-body').getBoundingClientRect(); return [r.x + r.width/2, r.y + r.height/2]; })()")
    if not mobile:
        pg.mouse.click(box[0], box[1], button='right'); pg.wait_for_timeout(900)
        heads = pg.evaluate("[...document.querySelectorAll('#dio-cctx .cc-i[data-g] .cc-l')].map(e => e.textContent)")
        check(f'{tag}: دایاں کلک — مقدمے کی تفصیل کی سرخیاں', all(h in heads for h in ['مقدمہ', 'مدعی', 'ملزمان', 'گواہان', 'ایف آئی آر', 'تفتیشی افسر']), heads)
        pg.evaluate("[...document.querySelectorAll('#dio-cctx .cc-i[data-g]')].find(e => e.textContent.includes('ملزمان')).click()"); pg.wait_for_timeout(300)
        items = pg.evaluate("[...document.querySelectorAll('#dio-cctx .cc-i[data-i] .cc-l')].map(e => e.textContent)")
        check(f'{tag}: ملزمان کی فہرست', any('نامعلوم ملزم' in i for i in items), items)
        pg.screenshot(path=f'{OUT}/v552_{tag}_ctx.png')
        pg.evaluate("[...document.querySelectorAll('#dio-cctx .cc-i[data-i]')].find(e => e.textContent.includes('نامعلوم ملزم')).click()"); pg.wait_for_timeout(300)
        txt = pg.evaluate("document.querySelector('#ch173-doc .zf-body').innerText")
        check(f'{tag}: کلک → کرسر کی جگہ لکھا گیا', 'ملزم نامعلوم ملزم' in txt.replace('\n', ' '), txt[-60:])
        pg.mouse.click(box[0], box[1], button='right'); pg.wait_for_timeout(700)
        pg.evaluate("[...document.querySelectorAll('#dio-cctx .cc-i[data-g]')].find(e => e.textContent.includes('مدعی')).click()"); pg.wait_for_timeout(200)
        mi = pg.evaluate("[...document.querySelectorAll('#dio-cctx .cc-i[data-i] .cc-l')].map(e => e.textContent)")
        check(f'{tag}: مدعی کی تفصیل', 'نام و پتہ' in mi, mi)
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        lvl = pg.evaluate("!!document.getElementById('dio-cctx') && !document.querySelector('#dio-cctx .cc-h button[data-act=back]')")
        pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
        check(f'{tag}: Esc — پہلے ایک سطح واپس، پھر بند', lvl and not pg.evaluate("!!document.getElementById('dio-cctx')"))
    else:
        vis = pg.evaluate("(() => { const b = document.getElementById('dio-cctx-btn'); return !!b && getComputedStyle(b).display !== 'none'; })()")
        check(f'{tag}: موبائل — «مقدمہ کی تفصیل» بٹن', vis)
        pg.tap('#dio-cctx-btn'); pg.wait_for_timeout(900)
        heads = pg.evaluate("[...document.querySelectorAll('#dio-cctx .cc-i[data-g] .cc-l')].map(e => e.textContent)")
        check(f'{tag}: موبائل — تفصیل کی فہرست (نیچے سے)', 'ملزمان' in heads, heads)
        pg.evaluate("[...document.querySelectorAll('#dio-cctx .cc-i[data-g]')].find(e => e.textContent.includes('ملزمان')).click()"); pg.wait_for_timeout(200)
        pg.evaluate("[...document.querySelectorAll('#dio-cctx .cc-i[data-i]')].find(e => e.textContent.includes('نامعلوم ملزم')).click()"); pg.wait_for_timeout(300)
        txt = pg.evaluate("document.querySelector('#ch173-doc .zf-body').innerText")
        check(f'{tag}: موبائل — کرسر کی جگہ لکھا گیا', 'نامعلوم ملزم' in txt, txt[-60:])
    ctx.close()
    return errs

def landing(b):
    for vp in [(1366, 625), (1280, 600), (1536, 730), (1920, 960), (1366, 768), (390, 844)]:
        ctx = b.new_context(service_workers='block', viewport={'width': vp[0], 'height': vp[1]})
        ctx.route('**/*', route)
        pg = ctx.new_page(); pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2600)
        pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(500)
        m = pg.evaluate("""(() => { const ls = document.getElementById('login-screen'); const land = ls.querySelector('.dio-land');
          const lb = ls.querySelector('.dio-legal-band').getBoundingClientRect(); const r = land.getBoundingClientRect();
          return { scroll: ls.scrollHeight - ls.clientHeight, bottom: Math.round(lb.bottom), ih: innerHeight, top: Math.round(r.top),
                   hx: document.documentElement.scrollWidth > innerWidth + 1, zoom: getComputedStyle(land).zoom }; })()""")
        if vp[0] >= 861:
            check(f'لینڈنگ {vp[0]}×{vp[1]}: بغیر scroll، قانونی اعلان سکرین میں', m['scroll'] <= 1 and m['bottom'] <= vp[1] and m['top'] >= 0, m)
        else:
            check(f'لینڈنگ {vp[0]}×{vp[1]} (موبائل): افقی scroll نہیں', not m['hx'], m)
        pg.screenshot(path=f'{OUT}/v552_land_{vp[0]}x{vp[1]}.png')
        ctx.close()

def login(b):
    ctx = b.new_context(service_workers='block', viewport={'width': 1366, 'height': 768})
    ctx.route('**/*', route)
    pg = ctx.new_page(); pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
    pg.evaluate(TOASTS)
    pg.evaluate("""async () => { localStorage.setItem('dio_officer_cache', JSON.stringify({ id:'o1', user_id:'u1', email:'io@test.pk', full_name:'فیاض حسین شاد',
        designation:'ASI', station:'صدر ملتان', district:'ملتان', role:'officer', is_approved:true, suspended:false }));
      await _dioSavePwVerifier('io@test.pk', 'Secret#123'); localStorage.removeItem('dio_login_lock'); return 0; }""")
    # سرور نہ ملے (نیٹ آتا جاتا) — درست پاس ورڈ: «غلط» نہیں، آف لائن داخلہ
    pg.evaluate("window.__opts.authFail = 'net'; 0")
    pg.fill('#login-email', 'io@test.pk'); pg.fill('#login-password', 'Secret#123')
    pg.evaluate("doLogin()"); pg.wait_for_timeout(2500)
    t = ' | '.join(pg.evaluate('window.__toasts'))
    inside = pg.evaluate("getComputedStyle(document.getElementById('main-app')).display !== 'none'")
    lock = pg.evaluate("JSON.parse(localStorage.getItem('dio_login_lock')||'{}').count || 0")
    check('لاگ اِن: سرور نہ ملے + درست پاس ورڈ → اندر (آف لائن)، «غلط» نہیں', inside and 'غلط' not in t, t[-180:])
    check('لاگ اِن: سرور نہ ملنا «غلط کوشش» میں نہیں گنا گیا', lock == 0, lock)
    ctx.close()
    ctx = b.new_context(service_workers='block', viewport={'width': 1366, 'height': 768})
    ctx.route('**/*', route)
    pg = ctx.new_page(); pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
    pg.evaluate(TOASTS)
    pg.evaluate("window.__opts.authFail = 'cred'; localStorage.removeItem('dio_login_lock'); 0")
    pg.fill('#login-email', 'io@test.pk'); pg.fill('#login-password', 'wrong-pass')
    pg.evaluate("doLogin()"); pg.wait_for_timeout(1500)
    t = ' | '.join(pg.evaluate('window.__toasts'))
    lock = pg.evaluate("JSON.parse(localStorage.getItem('dio_login_lock')||'{}').count || 0")
    check('لاگ اِن: اصل غلط پاس ورڈ → صاف اردو پیغام + گنتی', 'ای میل یا پاس ورڈ درست نہیں' in t and lock == 1, t[-120:])
    ctx.close()
    # PIN — سرور نہ ملے: محفوظ token نہ مٹے، اسی آلے کے سیشن سے اندر
    ctx = b.new_context(service_workers='block', viewport={'width': 1366, 'height': 768})
    ctx.route('**/*', route)
    pg = ctx.new_page(); pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
    pg.evaluate(TOASTS)
    pg.evaluate("""async () => { localStorage.setItem('dio_officer_cache', JSON.stringify({ id:'o1', user_id:'u1', email:'io@test.pk', full_name:'فیاض حسین شاد',
        designation:'ASI', station:'صدر ملتان', district:'ملتان', role:'officer', is_approved:true, suspended:false }));
      localStorage.setItem('dio_pin', await _dioHashPin('123456')); localStorage.setItem('dio_pin_email', 'io@test.pk');
      localStorage.setItem('dio_pin_rt', await _dioEnc('rt-abc')); window.__opts.authFail = 'net'; return 0; }""")
    pg.evaluate("_pinValue = '123456'; _verifyPin()"); pg.wait_for_timeout(2500)
    inside = pg.evaluate("getComputedStyle(document.getElementById('main-app')).display !== 'none'")
    kept = pg.evaluate("!!localStorage.getItem('dio_pin_rt')")
    t = ' | '.join(pg.evaluate('window.__toasts'))
    check('PIN: سرور نہ ملے → اندر (آف لائن)، محفوظ token برقرار، «سیشن ختم» نہیں', inside and kept and 'سیشن ختم' not in t, t[-160:])
    ctx.close()

def case_form(b, tag, vp, mobile=False):
    args = dict(viewport=vp)
    if mobile: args.update(is_mobile=True, has_touch=True)
    ctx, pg, errs = open_app(b, **args)
    pg.evaluate(TOASTS)
    pg.evaluate("openAddCaseModal()"); pg.wait_for_timeout(1500)
    pg.fill('#cf-section-search', '356'); pg.wait_for_timeout(400)
    vis = pg.evaluate("getComputedStyle(document.getElementById('cf-mobile-box')).display")
    check(f'{tag}: 356 لکھتے ہی «کیا موبائل فون چوری ہوا؟»', vis == 'block', vis)
    opts = pg.evaluate("[...document.querySelectorAll('#section-dropdown > div')].map(d => d.innerText.split('\\n')[0])")
    check(f'{tag}: دفعہ 356 فہرست میں', any('356' in o for o in opts), opts[:3])
    pg.click('#section-dropdown > div'); pg.wait_for_timeout(300)
    pg.check('#cf-mobile-theft-check'); pg.wait_for_timeout(300)
    pg.fill('#cf-mobile-imei-1-1', '358460123456789'); pg.wait_for_timeout(300)
    w = pg.evaluate("[document.getElementById('cf-mobile-imei-1-1').getBoundingClientRect().width, document.getElementById('cf-mobile-imei-1-2').getBoundingClientRect().width, document.getElementById('cf-mobile-brand-1').getBoundingClientRect().width]")
    if not mobile:
        check(f'{tag}: IMEI کے خانے بڑے، ماڈل کا چھوٹا', w[0] > w[2] and w[1] > w[2] and w[0] >= 200, w)
    else:
        check(f'{tag}: موبائل — IMEI کے خانے پورے نظر آتے ہیں', w[0] >= 140, w)
    br = pg.evaluate("(() => { const r = document.getElementById('cf-mobile-brand-1').getBoundingClientRect(); const c = document.querySelector('#modal-backdrop .modal-card').getBoundingClientRect(); return {b:[r.x,r.y,r.width,r.height], c:[c.x,c.y,c.width,c.height]}; })()")
    pg.click('#cf-mobile-brand-1'); pg.fill('#cf-mobile-brand-1', 'Samsung A15')
    x0 = br['b'][0] + br['b'][2] - 10; y0 = br['b'][1] + br['b'][3] / 2
    if not mobile:
        pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move(max(2, br['c'][0] - 40), y0, steps=8); pg.mouse.up(); pg.wait_for_timeout(300)
        openNow = pg.evaluate("getComputedStyle(document.getElementById('modal-backdrop')).display")
        check(f'{tag}: ماڈل لکھتے/منتخب کرتے فارم بند نہیں ہوتا', openNow == 'flex', openNow)
        pg.mouse.click(5, 5); pg.wait_for_timeout(300)
        check(f'{tag}: اندراج کا کارڈ باہر کلک سے بند نہیں (لکھا ضائع نہیں)', pg.evaluate("getComputedStyle(document.getElementById('modal-backdrop')).display") == 'flex')
    check(f'{tag}: افسر کا لکھا ماڈل برقرار', pg.evaluate("document.getElementById('cf-mobile-brand-1').value") == 'Samsung A15')
    # دوہرا مقدمہ نمبر (c1 = 1234/26) — «1234/2026» بھی وہی
    pg.fill('#cf-fir', '1234/2026'); pg.fill('#cf-date', '09/10/2026'); pg.fill('#cf-occurrence-date', '08/10/2026')
    pg.evaluate("document.getElementById('cf-complainant').value = 'محمد اسلم ولد محمد اکرم قوم آرائیں سکنہ ملتان'; 0")
    pg.evaluate("document.getElementById('cf-fir').dispatchEvent(new Event('blur')); 0"); pg.wait_for_timeout(700)
    hint = pg.evaluate("(document.getElementById('cf-fir-dup')||{}).innerText || ''")
    check(f'{tag}: مقدمہ نمبر لکھتے ہی «پہلے سے درج» (نمبر سے پہچان)', '1234/26' in hint, hint)
    msgs = []
    pg.once('dialog', lambda d: (msgs.append(d.message), d.dismiss()))
    n0 = pg.evaluate("window.__db.cases.length")
    pg.evaluate("saveNewCase()"); pg.wait_for_timeout(1500)
    n1 = pg.evaluate("window.__db.cases.length")
    check(f'{tag}: دوہرا مقدمہ نمبر درج نہیں ہوا', n1 == n0 and bool(msgs) and '1234/26' in msgs[0], msgs[:1])
    ctx.close()
    return errs

def cdr_fir_challan(b, tag, vp):
    ctx, pg, errs = open_app(b, viewport=vp)
    pg.evaluate("window.__db.cases[0].officer_id = 'o1'; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
    pg.evaluate("openCdrImei('c1')"); pg.wait_for_timeout(1200)
    pg.evaluate("_newCdr()"); pg.wait_for_timeout(1200)
    to = pg.evaluate("document.querySelector('#cdr-doc [data-k=\"date_to\"]').textContent.trim()")
    tak = pg.evaluate("getComputedStyle(document.getElementById('cdr-tak')).display")
    body = pg.evaluate("document.querySelector('#cdr-doc .cdr-body').innerText.replace(/\\s+/g,' ')")
    check(f'{tag}: CDR — دوسری تاریخ «تاحال» («تک» نہیں)', to == 'تاحال' and tak == 'none', body[:160])
    pg.evaluate("_saveCdr()"); pg.wait_for_timeout(1500)
    pg.evaluate("_cdrRenderList()"); pg.wait_for_timeout(400)
    btns = pg.evaluate("[...document.querySelectorAll('.cdr-li button')].map(b => b.textContent.trim())")
    check(f'{tag}: CDR فہرست — «کھولیں» کے ساتھ «پرنٹ»', any('پرنٹ' in x for x in btns), btns)
    rng = pg.evaluate("document.querySelector('.cdr-li').innerText")
    check(f'{tag}: CDR فہرست میں مدت «… سے تاحال»', 'سے تاحال' in rng, rng[-60:])
    pg.evaluate("window.__printCalls = 0; 0")
    pg.evaluate("[...document.querySelectorAll('.cdr-li button')].find(b => b.textContent.includes('پرنٹ')).click()"); pg.wait_for_timeout(1500)
    check(f'{tag}: CDR فہرست کا «پرنٹ» — ایک بار چھپائی', pg.evaluate('window.__printCalls') == 1, pg.evaluate('window.__printCalls'))
    # FIR متن — «متن میں ترمیم» درمیان
    pg.evaluate("window.__db.fir_matn = [{id:'m1', case_id:'c1', type:'fir', matn:'متن ایف آئی آر', created_at:'2026-10-08'}]; 0")
    pg.evaluate("openFirView && openFirView('c1','fir')"); pg.wait_for_timeout(1200)
    pg.evaluate("_openMatnModal('fir','m1')"); pg.wait_for_timeout(400)
    tc = pg.evaluate("(() => { const t = document.getElementById('modal-title'); const r = t.getBoundingClientRect(); const c = document.querySelector('#modal-backdrop .modal-card').getBoundingClientRect();"
                     " const rg = document.createRange(); rg.selectNodeContents(t); const tr = rg.getBoundingClientRect();"
                     " return { text: t.textContent, align: getComputedStyle(t).textAlign, off: Math.round((tr.left + tr.width/2) - (c.left + c.width/2)) }; })()")
    check(f'{tag}: «متن میں ترمیم» کی سرخی درمیان میں', tc['text'] == 'متن میں ترمیم' and tc['align'] == 'center' and abs(tc['off']) <= 6, tc)
    pg.evaluate("closeModal()"); pg.wait_for_timeout(200)
    check(f'{tag}: اگلے کارڈ میں درمیانی سرخی ساتھ نہیں جاتی', not pg.evaluate("document.getElementById('modal-title').classList.contains('dio-mt-center')"))
    # چالان: کالم 6 میں تفتیشی افسر عہدہ کے ساتھ؛ کالم 2–4 چوڑے؛ لکیر کھینچنا
    pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2600)
    sh = pg.evaluate("(document.querySelector('#ch173-doc [data-k=\"shahadat\"]')||{}).innerText || ''")
    check(f'{tag}: چالان کالم 6 — تفتیشی افسر کا عہدہ (ASI)', 'فیاض حسین شاد ASI' in sh, sh[-80:])
    check(f'{tag}: چالان کالم 6 — تفتیشی افسر ایک ہی بار', sh.count('فیاض حسین شاد') == 1, sh.count('فیاض حسین شاد'))
    ws = pg.evaluate("[...document.querySelectorAll('#ch173-table colgroup col')].map(c => Math.round(c.getBoundingClientRect().width))")
    check(f'{tag}: چالان کالم 2–4 کم از کم 45px (پہلے سے 50% زیادہ)', len(ws) == 7 and all(w >= 45 for w in ws[1:4]), ws)
    g = pg.evaluate("(() => { const th = document.querySelector('#ch173-table thead tr:first-child th:nth-child(2) .colgrip'); if (!th) return null; const r = th.getBoundingClientRect(); return [r.x + r.width/2, r.y + 10]; })()")
    if g:
        w0 = ws[1]
        pg.mouse.move(g[0], g[1]); pg.mouse.down(); pg.mouse.move(g[0] - 30, g[1], steps=6); pg.mouse.up(); pg.wait_for_timeout(500)
        ws2 = pg.evaluate("[...document.querySelectorAll('#ch173-table colgroup col')].map(c => Math.round(c.getBoundingClientRect().width))")
        man = pg.evaluate("document.getElementById('ch173-table').dataset.colsManual")
        check(f'{tag}: چالان — لکیر کھینچ کر کالم کی چوڑائی بدلتی ہے', abs(ws2[1] - w0) >= 15 and man == '1', f'{w0} → {ws2[1]}')
    else:
        check(f'{tag}: چالان — لکیر کھینچنے کا نشان', False, 'grip نہیں ملا')
    pg.screenshot(path=f'{OUT}/v552_{tag}_challan.png')
    ctx.close()
    return errs

with sync_playwright() as p:
    b = p.chromium.launch()
    errs = []
    errs += run(b, 'Desktop', {'width': 1366, 'height': 768})
    errs += run(b, 'Mobile', {'width': 390, 'height': 844}, mobile=True)
    errs += back_button(b, 'Desktop', {'width': 1366, 'height': 768})
    errs += back_button(b, 'Mobile', {'width': 390, 'height': 844}, mobile=True)
    landing(b)
    login(b)
    errs += case_form(b, 'Desktop', {'width': 1366, 'height': 768})
    errs += case_form(b, 'Mobile', {'width': 390, 'height': 844}, mobile=True)
    errs += cdr_fir_challan(b, 'Desktop', {'width': 1366, 'height': 768})
    check('کوئی JavaScript غلطی نہیں', not errs, errs[:5])
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
sys.exit(1 if fails else 0)
