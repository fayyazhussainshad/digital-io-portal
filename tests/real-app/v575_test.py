"""(v575) بیرونی ضمنی + پورا نظام — افسر کی ہدایات (11 نومبر 2026): اصل ایپ کی جانچ (Desktop 1366×768 + Mobile 390×844)

  1) ضمنی کی قسم (8 اقسام) کا «▾» کاغذ کے دائیں کونے میں، نوعیت کا «▾» بائیں کونے میں (ملزمان والے ▾ کی طرح)؛ اوپر کی قطار ختم
  2) «لکھنے والا» کا خانہ ختم — ہمیشہ تفتیشی افسر، «SHO کی ضمنی» / «DSP کی ضمنی» چننے پر وہی افسر
  3) اوپر سے گرنے والی پٹی (محفوظ، پرنٹ، شیئر، نئی دستاویز، شارٹ کٹس) پورے نظام سے ختم — نیچے کونے میں «⋯»
  4) Ctrl+R / Ctrl+L / Ctrl+E — کسی بھی متن کی سیدھ (پورا نظام)
  5) سرخی «رپورٹ ضمنی بیرونی» کبھی نہیں ہٹتی (فونٹ / سائز بدل سکتا ہے)؛ نوعیت کا نام کہیں نہیں
  6) نوعیت کی ذیلی سرخی (خلاصہ) کالم 4 میں «از» کی جگہ
  7) کوائف مقدمے کی chip «وقوعہ جات» میں — ضمنی اب نہیں پوچھتی؛ جو نہ ہو وہ پیلا، کچھ نہیں رکتا
  8) نقشہ موقع کے «امتیازی نشانات» ضمنی میں چاروں سمتوں کے بعد خود؛ خالی ہوں تو پیلا خانہ
  9) DSP کی ضمنی: «مرتبہ» = نام، رینک، پوسٹ، سرکل (آخر میں دوبارہ DSP نہیں)
  اور v574 کی سب جانچیں: MW کے 151 نمونے، بلاک نظام، مثل کی لکیر، نیچے 0.6cm (v580: 0.4cm)، Ctrl+S / Ctrl+P، reload، ایک تاریخ ایک ضمنی
چلانا: `python3 v575_test.py` (سرور: repo کی جڑ میں `python3 -m http.server 8770`)؛ ایک ہی: DIO_ONLY=desktop|mobile
"""
from v564_common import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v575/'
os.makedirs(V, exist_ok=True)
DPI = 72
SEED2 = """(() => { const d = window.__db;
  d.case_accused = [{ id:'a1', case_id:'c1', name:'نامعلوم ملزم', accused_type:'fir', created_at:'2026-10-08' }];
  d.case_witnesses = [{ id:'w1', case_id:'c1', full_name:'محمد اکرم ولد اللہ دتہ قوم جٹ سکنہ ملتان', witness_type:'fir', created_at:'2026-10-09' },
                      { id:'w2', case_id:'c1', full_name:'غلام رسول ولد نور محمد قوم آرائیں سکنہ ملتان', witness_type:'fir', created_at:'2026-10-10' }];
  d.hamrahi_mulazman = [{ id:'h1', case_id:'c1', name:'محمد یونس', rank:'HC', service_number:'1122', created_at:'2026-10-09' }];
  d.fir_matn = [{ id:'m1', case_id:'c1', type:'fir', matn:'بخدمت جناب SHO صاحب گزارش ہے کہ میں رات سو رہا تھا کہ نامعلوم چور گھر سے سامان لے گئے۔', created_at:'2026-10-08' }];
  d.dio_user_data = d.dio_user_data || [];
  const c1 = d.cases.find(c => c.id === 'c1'); c1.place_of_occurrence = 'مکان مدعی واقع وقاص ٹاؤن';
  d.case_documents = (d.case_documents || []).filter(x => !(x.case_id === 'c1' && x.document_type === 'incidents'));
  d.case_documents.push({ id: 'cdinc', case_id: 'c1', officer_id: 'o1', document_type: 'incidents', status: 'draft', created_at: '2026-10-08',
    content: { html: '<p>پرانی تحریر وقوعہ جات — اسی علاقے میں پہلے بھی واردات</p>', date: '' } });
  Object.keys(localStorage).filter(k => /^dio_case_kawaif_|^dio_naqsha_/.test(k)).forEach(k => localStorage.removeItem(k));
  localStorage.setItem('dio_naqsha_c1', JSON.stringify({ activeId: 's1', sketches: [
    { id: 's1', type: 'wuqua', marks: [{ id: 'm1', t: 'جہاں مدعی سو رہا تھا' }, 'جہاں سے ملزمان داخل ہوئے'] },
    { id: 's2', type: 'baramad', marks: ['جہاں سے مال برآمد ہوا'] }] }));
  localStorage.setItem('digital_io_dsp', JSON.stringify({ name: 'ملک اسلم', rank: 'DSP', post: 'SDPO', circle: 'سرکل صدر' }));
  return 0; })()"""
HOOK_TOAST = "(() => { window.__TOAST = []; if (window.__toastHooked) return 0; window.__toastHooked = 1; const o = window.showToast; window.showToast = function (m) { window.__TOAST.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"
KEEP_DB = "try { const s = sessionStorage.getItem('__v574db'); if (s) window.__db = JSON.parse(s); } catch (e) {}"


def analyze(png, mb_cm):
    """کھڑی لکیریں (نچلا حصہ) + نیچے کے حاشیے سے فاصلہ؛ اوپر بائیں کونے کا وتر (مثل کی لکیر)؛ سب سے نچلی سیاہی"""
    im = Image.open(png).convert('L'); W, H = im.size; px = im.load()
    dark = lambda x, y: 0 <= x < W and 0 <= y < H and px[x, y] < 140
    yb = H - int(round(mb_cm / 2.54 * DPI))
    y0, y1 = int(H * 0.55), yb - 10
    xs = [x for x in range(W) if sum(1 for y in range(y0, y1) if dark(x, y)) >= 0.97 * (y1 - y0)]
    groups = []
    for x in xs:
        if groups and x - groups[-1][-1] <= 2: groups[-1].append(x)
        else: groups.append([x])
    lines = [g[len(g) // 2] for g in groups]
    ends = []
    for x in lines:
        y = y1
        while y < H and (dark(x, y) or dark(x - 1, y) or dark(x + 1, y)): y += 1
        ends.append(y)
    low = max((y for y in range(H) for x in range(0, W, 2) if px[x, y] < 140), default=0)
    Rr = int(3.2 * DPI); best = 0
    for c in range(40, 2 * Rr):
        run = 0
        for x in range(0, Rr):
            y = c - x
            if y < 0 or y >= Rr: run = 0; continue
            if dark(x, y) or dark(x, y - 1) or dark(x, y + 1): run += 1
            else: run = 0
            best = max(best, run)
    cm = lambda v: round(v / DPI * 2.54, 2)
    return {'lines': len(lines), 'line_end_cm': [cm(H - y) for y in ends], 'low_cm': cm(H - 1 - low), 'diag': best}


def page_pngs(pdf, tag):
    for f in glob.glob(V + tag + '-*.png'): os.remove(f)
    subprocess.run(['pdftoppm', '-png', '-r', str(DPI), '-gray', pdf, V + tag], check=True)
    return sorted(glob.glob(V + tag + '-*.png'), key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0]))


def relogin(pg):
    pg.wait_for_timeout(2500)
    pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    pg.wait_for_timeout(2500)
    pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
    pg.wait_for_timeout(300); pg.evaluate("document.fonts.ready")


def new_zimni(pg, seed=True):
    if seed: pg.evaluate(SEED); pg.evaluate(SEED2)
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1500)
    # ماؤس کاغذ / فہرست کے بیچ میں (افسر کی طرح) — اوپر رکا ہوا ماؤس دستاویز کی پٹی کھول کر بٹن ڈھانپ دیتا ہے (پرانا رویہ، HEAD میں بھی)
    vs = pg.viewport_size or {'width': 1366, 'height': 768}
    pg.mouse.move(vs['width'] // 2, vs['height'] * 2 // 3); pg.wait_for_timeout(600)
    pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2500)


def menu_act(pg, act):
    """v575: نیچے کونے کا «⋯» → فہرست کا کام (محفوظ، پرنٹ، شیئر، نئی دستاویز، شارٹ کٹس، واپس)"""
    pg.click('#dio-dv-fab'); pg.wait_for_timeout(300)
    pg.click('#dio-dv-menu button[data-act="' + act + '"]'); pg.wait_for_timeout(300)


def pick(pg, which, value):
    """v575: کاغذ کے کونے کا «▾» — دائیں = ضمنی کی قسم، بائیں = نوعیت"""
    pg.click('#zf-cp-main' if which == 'main' else '#zf-cp-sub'); pg.wait_for_timeout(350)
    pg.click("#zf-cp-menu button[data-v='" + value + "']"); pg.wait_for_timeout(700)


def menu_items(pg, which):
    pg.click('#zf-cp-main' if which == 'main' else '#zf-cp-sub'); pg.wait_for_timeout(350)
    it = pg.evaluate("[...document.querySelectorAll('#zf-cp-menu button[data-v]')].map(b => b.getAttribute('data-v')).filter(v => v !== '__add__')")
    pg.keyboard.press('Escape'); pg.wait_for_timeout(200)
    return it


def print_snap(pg, how, paper='legal'):
    """how: menu = نیچے کونے کا «⋯» → «پرنٹ»؛ ctrlp = کرسر متن میں + Ctrl+P"""
    pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
    if how == 'menu':
        menu_act(pg, 'print')
    else:
        pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('End'); pg.keyboard.press('Control+p')
    asked = pick_paper(pg, paper)
    for _ in range(150):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    return asked, pg.evaluate("window.__snaps[0] || ''")


GEO = """() => { const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
  const t = document.getElementById('zf-tools'), bar = document.getElementById('dio-dv-bar');
  const body = document.getElementById('dio-dv-body'), doc = document.getElementById('ch173-doc');
  return { docview: !!document.getElementById('dio-docview'), toolsDisp: t ? getComputedStyle(t).display : 'none', barDisp: bar ? getComputedStyle(bar).display : 'none',
    cpMain: g('#zf-cp-main'), cpSub: g('#zf-cp-sub'), fab: g('#dio-dv-fab'), doc: g('#ch173-doc'), body: g('#dio-dv-body'), vw: innerWidth, vh: innerHeight,
    oldRow: !!document.getElementById('zf-corners'), author: !!document.getElementById('zf-author'), khInput: !!document.getElementById('zf-khulasa'),
    docTopInBody: (body && doc) ? Math.round(doc.getBoundingClientRect().top - body.getBoundingClientRect().top) : null,
    title: (doc && doc.querySelector('.zf-title') || {}).textContent || '', th4: (doc && doc.querySelector('th.zf-c-from') || {}).textContent || '' }; }"""

METRICS = """(sel) => { const e = document.querySelector(sel); if (!e) return null; const cs = getComputedStyle(e);
  return { fs: cs.fontSize, lh: cs.lineHeight, ws: cs.wordSpacing, ls: cs.letterSpacing, ff: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim() }; }"""


def run(b, name, kw):
    desk = name == 'desktop'
    ctx, pg, errs = open_app(b, **kw)
    ctx.add_init_script(KEEP_DB)
    dialogs = []
    def on_dialog(d):
        dialogs.append(d.message)
        (d.accept() if ACCEPT[0] else d.dismiss())
    ACCEPT = [False]
    pg.on('dialog', on_dialog)
    pg.evaluate(HOOK_TOAST)
    pg.evaluate(SEED); pg.evaluate(SEED2)
    vs = pg.viewport_size or {'width': 1366, 'height': 768}

    # ═══ 0) «وقوعہ جات» — کوائف یہاں (تمام سمتیں)، پرانی تحریر جوں کی توں، امتیازی نشانات نظر میں ═══
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
    chip = pg.locator("#misal-doc-bar .mdoc-chip:has-text('وقوعہ جات')").first
    if chip.count() and chip.is_visible(): chip.click()
    else: pg.evaluate("_openMisalEditor('incidents')")
    pg.wait_for_timeout(1800)
    k0 = pg.evaluate("""() => ({ ids: [...document.querySelectorAll('#zkw-page [id^=zkw-]')].map(e => e.id).filter(i => i !== 'zkw-page' && i !== 'zkw-status'),
        old: (document.querySelector('#zkw-page .zkw-old') || {}).textContent || '', marks: (document.querySelector('#zkw-page .zkw-marks') || {}).textContent || '',
        dv: !!document.getElementById('dio-docview'), h1: (document.querySelector('#zkw-page h1') || {}).textContent || '' })""")
    pg.screenshot(path=V + f'{name}_00_waqoojat.png')
    need = ['zkw-north', 'zkw-east', 'zkw-south', 'zkw-west', 'zkw-jaeBaramdgi', 'zkw-north1', 'zkw-east1', 'zkw-south1', 'zkw-west1', 'zkw-property', 'zkw-baramdgi', 'zkw-imei', 'zkw-mobile', 'zkw-inkshaaf']
    check(f'{name}: chip «وقوعہ جات» — پورے صفحے پر کوائف (تمام سمتیں، جائے برآمدگی، مال، IMEI، موبائل، انکشافات)', k0['dv'] and k0['ids'] == need and 'وقوعہ جات' in k0['h1'], k0['ids'])
    check(f'{name}: وقوعہ جات کی پرانی تحریر جوں کی توں نیچے (کچھ ضائع نہیں)', 'پرانی تحریر وقوعہ جات' in k0['old'], k0['old'][:80])
    check(f'{name}: نقشہ موقع کے امتیازی نشانات یہاں بھی نظر میں (جائے وقوعہ کا نقشہ؛ برآمدگی کا نہیں)',
          'نمبر1 سے مراد وہ مقام جہاں مدعی سو رہا تھا' in k0['marks'] and 'مال برآمد' not in k0['marks'], k0['marks'][:160])
    pg.fill('#zkw-north', 'مکان اللہ دتہ'); pg.fill('#zkw-east', 'گلی عام'); pg.wait_for_timeout(1600)
    kw = pg.evaluate("JSON.parse(localStorage.getItem('dio_case_kawaif_c1') || '{}').fields || {}")
    st = pg.evaluate("(document.getElementById('zkw-status') || {}).textContent || ''")
    check(f'{name}: لکھتے ہی خود محفوظ (اسی مقدمے میں)', kw.get('north') == 'مکان اللہ دتہ' and kw.get('east') == 'گلی عام' and 'محفوظ' in st, (kw, st))
    pg.evaluate("window.__TOAST = []; 0")
    menu_act(pg, 'save'); pg.wait_for_timeout(600)
    check(f'{name}: «⋯» → «محفوظ» وقوعہ جات پر بھی', any('وقوعہ جات' in t for t in pg.evaluate("window.__TOAST")), pg.evaluate("window.__TOAST"))
    menu_act(pg, 'back'); pg.wait_for_timeout(1200)

    # ═══ 1) کھولنا: اوپر کچھ نہیں، کاغذ کے کونوں میں ▾ ═══
    pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1500)
    pg.mouse.move(vs['width'] // 2, vs['height'] * 2 // 3); pg.wait_for_timeout(600)
    pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2500)
    g = pg.evaluate(GEO)
    pg.screenshot(path=V + f'{name}_01_open.png')
    check(f'{name}: کاغذ کے اوپر کچھ نہیں — ضمنی کی پٹی، اوپر کی قطار، «لکھنے والا»، خلاصے کا خانہ سب ختم',
          g['docview'] and g['toolsDisp'] == 'none' and not g['oldRow'] and not g['author'] and not g['khInput'], g)
    check(f'{name}: اوپر سے گرنے والی پٹی نظر نہیں آتی؛ نیچے بائیں کونے میں «⋯»',
          g['barDisp'] == 'none' and g['fab'] and g['fab']['l'] <= 20 and g['fab']['b'] >= g['vh'] - 30, (g['barDisp'], g['fab']))
    d_, m_, u_ = g['doc'], g['cpMain'], g['cpSub']
    check(f'{name}: «▾» ضمنی کی قسم = کاغذ کا دایاں کونا، «▾» نوعیت = بایاں کونا (کاغذ کے اندر، اوپر)',
          m_ and u_ and m_['r'] <= d_['r'] and m_['r'] >= d_['r'] - 12 and u_['l'] >= d_['l'] and u_['l'] <= d_['l'] + 12
          # TASK 19 (11 نومبر 2026): کونوں کے ▾ اب وہی ایک چننے والا بٹن (.dio-pick) جو «ملزمان ▾» کا ہے — 15pt (20px)، موبائل 22.5pt
          and abs(m_['t'] - d_['t'] - 4) <= 2 and abs(u_['t'] - d_['t'] - 4) <= 2 and m_['w'] >= 20 and m_['w'] == u_['w'], (d_, m_, u_))
    check(f'{name}: کاغذ اوپر سے پوری جگہ پر (اوپر کی جگہ ≤ 20px)', g['docTopInBody'] is not None and g['docTopInBody'] <= 20, g['docTopInBody'])
    check(f'{name}: سرخی «رپورٹ ضمنی بیرونی»؛ کالم 4 میں «از» نہیں', g['title'] == 'رپورٹ ضمنی بیرونی' and 'از' not in g['th4'], (g['title'], g['th4']))
    # پٹی کبھی نہ آئے — اوپر scroll، ماؤس اوپر کنارے پر
    pg.evaluate("(() => { const s = document.getElementById('zf-scroll'); s.scrollTop = 400; return 0; })()"); pg.wait_for_timeout(300)
    pg.evaluate("(() => { const s = document.getElementById('zf-scroll'); s.scrollTop = 0; return 0; })()"); pg.wait_for_timeout(300)
    pg.mouse.move(vs['width'] // 2, 3); pg.wait_for_timeout(500)
    bar = pg.evaluate("(() => { const b = document.getElementById('dio-dv-bar'); const r = b.getBoundingClientRect(); return [getComputedStyle(b).display, Math.round(r.height)]; })()")
    pg.mouse.move(vs['width'] // 2, vs['height'] * 2 // 3); pg.wait_for_timeout(300)
    check(f'{name}: اوپر scroll کرنے یا ماؤس اوپر لے جانے پر بھی پٹی نہیں آتی', bar == ['none', 0], bar)
    EXP = ['پہلی ضمنی', 'گرفتاری', 'عدالت', 'درخواستیں', 'بیانات', 'متفرق', 'SHO کی ضمنی', 'DSP کی ضمنی']
    mains = menu_items(pg, 'main')
    check(f'{name}: دائیں «▾» — MW کی 8 اقسام ترتیب سے', mains[:8] == EXP, mains)

    # ═══ 2) قسم + نوعیت → پورا متن (کچھ نہیں پوچھا، کچھ نہیں رکا) ═══
    pick(pg, 'main', 'پہلی ضمنی')
    subs = menu_items(pg, 'sub')
    check(f'{name}: بائیں «▾» — «پہلی ضمنی» کی نوعیتیں (MW کے 35 + پرانی «اول ضمنی»)', len(subs) >= 36 and 'نامعلوم ملزم' in subs, len(subs))
    pick(pg, 'sub', 'نامعلوم ملزم'); pg.wait_for_timeout(1500)
    pg.screenshot(path=V + f'{name}_02_applied.png')
    a = pg.evaluate("""() => { const d = _zimniDoc(); return { blocks: d.querySelectorAll('tr.zf-blk').length, tv: [...d.querySelectorAll('.zf-tv')].map(x => x.textContent),
        title: (d.querySelector('.zf-title') || {}).textContent || '', kh: _zimniKhulasaNow(), th4: d.querySelector('th.zf-c-from').textContent.trim(),
        c1: d.querySelector('tr.zf-blk .zf-actbody').innerText, raw: (d.innerText.match(/\\([A-Za-z_]+[0-9]*\\)|\\[\\[[^\\]]*\\]\\]/g) || []),
        text: d.innerText, nums: [...d.querySelectorAll('tr.zf-blk .zf-num')].map(x => x.textContent.trim()),
        close: (d.querySelector('.zf-close') || {}).textContent || '', modal: (() => { const m = document.getElementById('modal-backdrop'); return !!m && getComputedStyle(m).display !== 'none'; })() }; }""")
    today = pg.evaluate("(() => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); })()")
    check(f'{name}: نوعیت چنتے ہی نمونہ لگا — کوئی خانہ نہیں پوچھا، کچھ نہیں رکا', not a['modal'] and a['blocks'] >= 3, (a['modal'], a['blocks']))
    check(f'{name}: بلاک نظام (کالم 1/2/3)، نمبر ترتیب سے، اختتامی سطر Digital IO والی',
          a['nums'] == [str(i + 1) for i in range(a['blocks'])] and 'رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے' in a['close'], (a['nums'], a['close']))
    check(f'{name}: مقدمے کا ڈیٹا + وقوعہ جات کے کوائف (شمال، مشرق) خود — کوئی (xxx) یا [[..]] باقی نہیں',
          not a['raw'] and 'محمد امجد حسین' in a['text'] and 'مکان اللہ دتہ' in a['text'] and 'گلی عام' in a['text'] and ('محمد یونس' in a['text'] or 'محمد اکرم' in a['text']), a['raw'])
    check(f'{name}: نقشہ موقع کے امتیازی نشانات — چاروں سمتوں والے جملے کے فوراً بعد',
          bool(re.search(r'مغرب[^۔]*واقع ہے۔\s*امتیازی نشانات: نمبر1 سے مراد وہ مقام جہاں مدعی سو رہا تھا، نمبر2 سے مراد وہ مقام جہاں سے ملزمان داخل ہوئے۔', a['text'])),
          a['text'][a['text'].find('مغرب') - 20: a['text'].find('مغرب') + 200] if 'مغرب' in a['text'] else '')
    check(f'{name}: وقوعہ جات میں جو نہیں لکھا — پیلا خالی خانہ (جنوب، مغرب)', a['tv'] == ['جنوب', 'مغرب'], a['tv'])
    check(f'{name}: سرخی «رپورٹ ضمنی بیرونی» ہی رہی — نوعیت کا نام کہیں نہیں', a['title'] == 'رپورٹ ضمنی بیرونی' and 'نامعلوم ملزم' not in a['title'], a['title'])
    check(f'{name}: نوعیت کی ذیلی سرخی (خلاصہ) کالم 4 میں «از» کی جگہ', a['th4'] == a['kh'] and a['kh'].startswith('مختصر حالات') and 'از۔' not in a['th4'], (a['th4'], a['kh']))
    check(f'{name}: کالم 1 = تاریخ (بلاک 1) + عنوان', a['c1'].startswith(today) and len(a['c1'].split('\n')) >= 2, a['c1'][:40])

    # ═══ 3) پیلا خانہ ═══
    pg.click('#ch173-doc .zf-tv[data-tv="جنوب"]'); pg.wait_for_timeout(200)
    selt = pg.evaluate("getSelection().toString()")
    pg.keyboard.type('کھیت'); pg.wait_for_timeout(300)
    t3 = pg.evaluate("() => { const d = _zimniDoc(); return { tv: [...d.querySelectorAll('.zf-tv')].map(x => x.textContent), has: d.innerText.includes('کھیت') }; }")
    check(f'{name}: پیلے خانے پر دبانے سے وہ چنا گیا، لکھا ہوا متن اس کی جگہ', selt == 'جنوب' and t3['tv'] == ['مغرب'] and t3['has'], (selt, t3))

    # ═══ 4) سرخی ہٹائی نہیں جا سکتی؛ فونٹ / سائز بدل سکتا ہے ═══
    pg.evaluate("""() => { const t = _zimniDoc().querySelector('.zf-title'); const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); t.closest('#ch173-doc').focus(); return 0; }""")
    pg.keyboard.press('Delete'); pg.wait_for_timeout(500)
    t4 = pg.evaluate("(() => { const t = _zimniDoc().querySelector('.zf-title'); return t ? t.textContent : null; })()")
    check(f'{name}: سرخی مٹانے کی کوشش — «رپورٹ ضمنی بیرونی» فوراً واپس', t4 == 'رپورٹ ضمنی بیرونی', t4)
    if desk:
        fs0 = pg.evaluate("parseFloat(getComputedStyle(_zimniDoc().querySelector('.zf-title')).fontSize)")
        pg.evaluate("""() => { const t = _zimniDoc().querySelector('.zf-title'); const r = document.createRange(); r.selectNodeContents(t); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; }""")
        pg.keyboard.press('Control+]'); pg.wait_for_timeout(400)
        fs1 = pg.evaluate("(() => { const t = _zimniDoc().querySelector('.zf-title'); const e = t.querySelector('[style*=font-size]') || t; return parseFloat(getComputedStyle(e).fontSize); })()")
        t5 = pg.evaluate("_zimniDoc().querySelector('.zf-title').textContent")
        check(f'{name}: سرخی کا فونٹ سائز بدلا جا سکتا ہے (Ctrl+]) — متن وہی', fs1 > fs0 and t5 == 'رپورٹ ضمنی بیرونی', (fs0, fs1, t5))
        pg.keyboard.press('Control+z'); pg.wait_for_timeout(300)

    # ═══ 5) فونٹ، سطر اور الفاظ کا فاصلہ — Digital IO والا ═══
    pg.evaluate("""() => { _zimniAddBlock(); const rows = _zimniDoc().querySelectorAll('tr.zf-blk'); const b = rows[rows.length - 1].querySelector('.zf-body');
        b.focus(); const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        document.execCommand('insertText', false, 'افسر کا اپنا لکھا ہوا عام متن تاکہ موازنہ ہو سکے'); }""")
    pg.wait_for_timeout(300)
    mt = pg.evaluate(METRICS, '#ch173-doc tr.zf-blk .zf-body')
    mo = pg.evaluate(METRICS.replace("document.querySelector(sel)", "[...document.querySelectorAll(sel)].pop()"), '#ch173-doc tr.zf-blk .zf-body')
    inner = pg.evaluate("() => { const b = _zimniDoc().querySelector('tr.zf-blk .zf-body'); return [...b.querySelectorAll('*')].filter(e => e.getAttribute('style') && /font-size|line-height|word-spacing/.test(e.getAttribute('style'))).length; }")
    check(f'{name}: نمونے کا متن اور افسر کا لکھا متن — ایک ہی فونٹ/سائز/سطر/الفاظ کا فاصلہ', mt == mo and inner == 0 and mt['ff'].startswith('Jameel'), (mt, mo, inner))
    METR[name] = {'body': mt}

    # ═══ 6) MS Word کی شارٹ کٹس + Ctrl+R / Ctrl+L / Ctrl+E (پورا نظام) ═══
    if desk:
        sel_js = """() => { const b = [..._zimniDoc().querySelectorAll('tr.zf-blk .zf-body')].pop(); const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); const n = tw.nextNode();
            const r = document.createRange(); r.setStart(n, 0); r.setEnd(n, 4); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return s.toString(); }"""
        pg.locator('#ch173-doc tr.zf-blk .zf-body').last.click(); pg.evaluate(sel_js)
        pg.keyboard.press('Control+b'); pg.wait_for_timeout(200); on = pg.evaluate("document.queryCommandState('bold')")
        pg.keyboard.press('Control+b'); pg.wait_for_timeout(200); off = pg.evaluate("document.queryCommandState('bold')")
        pg.keyboard.press('Control+i'); pg.wait_for_timeout(200); it = pg.evaluate("document.queryCommandState('italic')")
        pg.keyboard.press('Control+z'); pg.wait_for_timeout(200); un = pg.evaluate("document.queryCommandState('italic')")
        check(f'{name}: MS Word شارٹ کٹس قائم — Ctrl+B (موٹا/واپس)، Ctrl+I، Ctrl+Z', on and not off and it and not un, (on, off, it, un))
        # سیدھ اسی بلاک پر، اور انتخاب اسی بلاک میں رہے (پچھلے خانے — کالم 2 — تک نہ پھیلے)
        AL = """() => { const b = [..._zimniDoc().querySelectorAll('tr.zf-blk .zf-body')].pop(); const s = getSelection(); let n = s.anchorNode; n = n && (n.nodeType === 1 ? n : n.parentElement);
            return getComputedStyle(b).textAlign + (n && b.contains(n) && s.toString() === b.textContent.slice(0, 4) ? '' : '/sel-moved'); }"""
        res = {}
        for k, want in (('r', 'right'), ('l', 'left'), ('e', 'center')):
            pg.evaluate(sel_js); pg.keyboard.press('Control+' + k); pg.wait_for_timeout(250)
            res[k] = pg.evaluate(AL)
        pg.keyboard.press('Control+j'); pg.wait_for_timeout(200)
        check(f'{name}: ضمنی میں Ctrl+R دائیں، Ctrl+L بائیں، Ctrl+E درمیان (صفحہ تازہ نہیں ہوا)', res == {'r': 'right', 'l': 'left', 'e': 'center'} and pg.evaluate("!!_zimniDoc()"), res)

    # ═══ 7) نوعیت بدلنے سے پہلے پوچھا جائے ═══
    before = pg.evaluate("_zimniDoc().innerHTML")
    other = [x for x in subs if x not in ('نامعلوم ملزم', 'اول ضمنی')][0]
    ACCEPT[0] = False; n0 = len(dialogs)
    pick(pg, 'sub', other); pg.wait_for_timeout(800)
    after = pg.evaluate("_zimniDoc().innerHTML"); sv = pg.evaluate("document.getElementById('zf-sub-type').value")
    check(f'{name}: لکھی ہوئی ضمنی پر دوسری نوعیت — پہلے پوچھا؛ «منسوخ» پر تحریر اور نوعیت جوں کی توں',
          len(dialogs) == n0 + 1 and 'بدل جائے گا' in dialogs[-1] and after == before and sv == 'نامعلوم ملزم', (dialogs[-1:], sv))

    # ═══ 8) خلاصہ کالم 4 میں سیدھا لکھا جائے ═══
    KH = 'نامعلوم ملزم کی تلاش — موقع ملاحظہ اور نقشہ موقع'
    pg.evaluate("""(t) => { const c = _zimniDoc().querySelector('th.zf-c-from [data-k=khulasa]'); c.focus && c.focus(); const r = document.createRange(); r.selectNodeContents(c);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); return 0; }""", KH)
    pg.wait_for_timeout(400)
    check(f'{name}: خلاصہ کالم 4 کی سرخی میں ہی بدلا جا سکتا ہے', pg.evaluate("_zimniKhulasaNow()") == KH, pg.evaluate("_zimniKhulasaNow()"))

    # ═══ 9) «⋯» → «محفوظ» (اور Ctrl+S) ═══
    menu_act(pg, 'save'); pg.wait_for_timeout(2500)
    rows = pg.evaluate("window.__db.zimni_reports.map(r => ({ id: r.id, c: r.content, d: r.report_date }))")
    c = rows[0]['c'] if rows else {}
    check(f'{name}: «⋯» → «محفوظ» — ریکارڈ سرور پر: ضمنی، نوعیت، خلاصہ، متن (تفتیشی افسر لکھنے والا)',
          len(rows) == 1 and c.get('main_type') == 'پہلی ضمنی' and c.get('sub_type') == 'نامعلوم ملزم' and c.get('khulasa') == KH
          and 'کھیت' in (c.get('bodyHtml') or '') and (c.get('author') or {}).get('role') == 'io',
          [(r['d'], (r['c'] or {}).get('main_type'), (r['c'] or {}).get('khulasa'), (r['c'] or {}).get('author')) for r in rows])
    if desk:
        pg.evaluate("""() => { const b = [..._zimniDoc().querySelectorAll('tr.zf-blk .zf-body')].pop(); b.focus(); const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
            const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, ' مزید تحریر Ctrl+S'); }""")
        pg.keyboard.press('Control+s'); pg.wait_for_timeout(2500)
        c2 = pg.evaluate("window.__db.zimni_reports[0].content")
        check(f'{name}: Ctrl+S سے محفوظ (اسی ضمنی میں)', 'مزید تحریر' in (c2.get('bodyHtml') or '') and pg.evaluate("window.__db.zimni_reports.length") == 1)
    saved_blocks = pg.evaluate("[..._zimniDoc().querySelectorAll('tr.zf-blk')].map(r => [r.querySelector('.zf-actbody').innerText.trim(), r.querySelector('.zf-body').innerText.trim()])")

    # ═══ 10) چھپائی — «⋯» → «پرنٹ» اور Ctrl+P ═══
    asked, h = print_snap(pg, 'menu')
    body_h = h.split('<body', 1)[-1] if h else ''
    check(f'{name}: «⋯» → «پرنٹ» — کاغذ پوچھا، @page اوپر 1cm، نیچے 0.4cm (v580، افسر کا انتخاب)',
          asked and bool(re.search(r'@page\{\s*size:8\.5in 13in;\s*margin:1cm 0 0\.4cm 0;', h)), re.findall(r'@page\{[^}]*\}', h)[:2])
    check(f'{name}: چھپائی — سرخی «رپورٹ ضمنی بیرونی»، کالم 4 میں خلاصہ («از» نہیں)، ▾ نہیں',
          'رپورٹ ضمنی بیرونی' in body_h and KH in body_h and '>از۔<' not in body_h and 'zf-cpick' not in body_h and 'نامعلوم ملزم</span>' not in body_h, body_h.count('رپورٹ ضمنی بیرونی'))
    check(f'{name}: چھپائی میں پیلا خانہ نہیں — خالی خانہ «۔۔۔۔۔۔۔۔»', body_h.count('۔۔۔۔۔۔۔۔') >= 1 and 'class="zf-tv"' not in body_h and 'کھیت' in body_h, body_h.count('۔۔۔۔۔۔۔۔'))
    pdfb = html_pdf(b, h, V + f'{name}_menu.pdf') if h else None
    if desk:
        asked2, h2 = print_snap(pg, 'ctrlp')
        pdfc = html_pdf(b, h2, V + f'{name}_ctrlp.pdf') if h2 else None
        ok, d = same_pages(page_pngs(pdfb, name + '_menu'), page_pngs(pdfc, name + '_ctrlp')) if (pdfb and pdfc) else (False, ['no pdf'])
        check(f'{name}: Ctrl+P اور «⋯» → «پرنٹ» — صفحات pixel تک ایک', asked2 and ok, d)
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")

    # ═══ 11) reload → فہرست (قسم + خلاصہ، نوعیت کا نام نہیں)؛ کھولنے پر سب جوں کا توں ═══
    pg.evaluate("""() => { const r = window.__db.zimni_reports[0]; const o = JSON.parse(JSON.stringify(r));
        Object.assign(o, { id: 'old1', serial_no: 0, report_date: '2026-11-01', created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-01T10:00:00Z' });
        // اکتوبر کے اصول والی پرانی ضمنی: سرخی = ذیلی ضمنی کا نام، کالم 4 = «از۔»، قسم کا پرانا نام
        o.content = Object.assign({}, o.content, { main_type: 'SHO ضمنی', sub_type: 'معائنہ مسل', khulasa: '', head: 'معائنہ مسل',
          bodyHtml: o.content.bodyHtml.replace(/<span class="zf-title">[^<]*<\\/span>/, '<span class="zf-title">معائنہ مسل</span>')
            .replace(/<th class="zf-c-from">[\\s\\S]*?<\\/th>/, '<th class="zf-c-from">از۔</th>') });
        delete o.content.zno; window.__db.zimni_reports.push(o); sessionStorage.setItem('__v574db', JSON.stringify(window.__db)); return 0; }""")
    pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); 0")
    pg.reload(); relogin(pg); pg.evaluate(HOOK_TOAST)
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800)
    lst = pg.evaluate("[...document.querySelectorAll('.zt tbody tr')].map(r => (r.children[2] || r).innerText.trim())")
    pg.screenshot(path=V + f'{name}_05_list.png')
    check(f'{name}: reload کے بعد فہرست — ضمنی کی قسم + خلاصہ؛ نوعیت کا نام نہیں',
          any(x.startswith('پہلی ضمنی') and KH in x for x in lst) and not any('نامعلوم ملزم\n' in x or x.startswith('نامعلوم ملزم') for x in lst), lst)
    zid = rows[0]['id'] if rows else ''
    pg.evaluate(f"_openZimni('{zid}')"); pg.wait_for_timeout(2500)
    o = pg.evaluate("""() => ({ m: document.getElementById('zf-main-type').value, s: document.getElementById('zf-sub-type').value, kh: _zimniKhulasaNow(),
        title: _zimniDoc().querySelector('.zf-title').textContent,
        blocks: [..._zimniDoc().querySelectorAll('tr.zf-blk')].map(r => [r.querySelector('.zf-actbody').innerText.trim(), r.querySelector('.zf-body').innerText.trim()]),
        tv: [..._zimniDoc().querySelectorAll('.zf-tv')].map(x => x.textContent) })""")
    check(f'{name}: reload → محفوظ ضمنی کھولی: قسم/نوعیت/خلاصہ/سرخی/تمام بلاک جوں کے توں (پیلا خانہ بھی)',
          o['m'] == 'پہلی ضمنی' and o['s'] == 'نامعلوم ملزم' and o['kh'] == KH and o['title'] == 'رپورٹ ضمنی بیرونی' and o['blocks'] == saved_blocks and o['tv'] == ['مغرب'],
          {k: o[k] for k in ('m', 's', 'kh', 'title', 'tv')})

    # ═══ 12) پرانی ضمنی (اکتوبر کے اصول والی) — سرخی واپس «رپورٹ ضمنی بیرونی»، «از» نہیں، تحریر جوں کی توں ═══
    pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1500)
    pg.evaluate("_openZimni('old1')"); pg.wait_for_timeout(2500)
    nd = len(dialogs)
    od = pg.evaluate("""() => ({ m: document.getElementById('zf-main-type').value, s: document.getElementById('zf-sub-type').value,
        title: _zimniDoc().querySelector('.zf-title').textContent, th4: _zimniDoc().querySelector('th.zf-c-from').textContent.trim(),
        blocks: [..._zimniDoc().querySelectorAll('tr.zf-blk')].map(r => [r.querySelector('.zf-actbody').innerText.trim(), r.querySelector('.zf-body').innerText.trim()]) })""")
    oldp = pg.evaluate("(() => { const c = window.__db.zimni_reports.find(x => x.id === 'old1').content; const h = _zimniPrepBody(c.bodyHtml, c.sub_type); return [/رپورٹ ضمنی بیرونی/.test(h), /معائنہ مسل/.test(h), />از۔</.test(h)]; })()")
    check(f'{name}: پرانی ضمنی کھولی — سرخی «رپورٹ ضمنی بیرونی» (نوعیت کا نام نہیں)، «از» نہیں، قسم «SHO کی ضمنی»، تحریر جوں کی توں، کچھ نہیں پوچھا',
          od['title'] == 'رپورٹ ضمنی بیرونی' and od['th4'] == '' and od['m'] == 'SHO کی ضمنی' and od['s'] == 'معائنہ مسل' and od['blocks'] == saved_blocks and len(dialogs) == nd,
          (od['title'], od['th4'], od['m'], od['s']))
    check(f'{name}: پرانی ضمنی کی چھپائی — سرخی «رپورٹ ضمنی بیرونی»، «از» نہیں', oldp == [True, False, False], oldp)
    pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); 0")

    # ═══ 13) ایک تاریخ = ایک ضمنی؛ امتیازی نشانات نہ ہوں تو پیلا خانہ ═══
    pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1200)
    pg.evaluate("localStorage.removeItem('dio_naqsha_c1'); 0")
    pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1200)
    pg.mouse.move(vs['width'] // 2, vs['height'] * 2 // 3); pg.wait_for_timeout(500)
    pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2500)
    pick(pg, 'main', 'پہلی ضمنی'); pick(pg, 'sub', 'نامعلوم ملزمان'); pg.wait_for_timeout(1500)
    tv2 = pg.evaluate("[..._zimniDoc().querySelectorAll('.zf-tv')].map(x => x.textContent)")
    check(f'{name}: نقشہ موقع میں امتیازی نشانات نہ ہوں — سمتوں کے بعد پیلا خانہ «امتیازی نشانات» (کچھ نہیں رکا)', 'امتیازی نشانات' in tv2, tv2)
    pg.evaluate("window.__TOAST = []; 0")
    menu_act(pg, 'save'); pg.wait_for_timeout(2500)
    n = pg.evaluate("window.__db.zimni_reports.length"); toasts = pg.evaluate("window.__TOAST")
    check(f'{name}: اسی تاریخ پر تفتیشی افسر کی دوسری ضمنی — محفوظ نہیں، انتباہ «ایک تاریخ … ایک ہی ضمنی»', n == 2 and any('ایک ہی ضمنی' in t for t in toasts), (n, toasts[-1:]))

    # ═══ 14) لکھنے والا: SHO / DSP قسم سے؛ DSP = نام، رینک، پوسٹ، سرکل ═══
    ML = "[...(_zimniDoc().querySelectorAll('[data-k=murattib],[data-k=io_sign]'))].map(x => x.textContent.trim())"
    io_line = pg.evaluate(ML)
    pick(pg, 'main', 'SHO کی ضمنی')
    au = pg.evaluate("_zimniAuthorNow().role"); s3 = menu_items(pg, 'sub')
    check(f'{name}: «SHO کی ضمنی» چنی — لکھنے والا SHO (اپنا خانہ نہیں)، MW کی SHO نوعیتیں', au == 'sho' and len(s3) >= 23, (au, len(s3)))
    pick(pg, 'main', 'DSP کی ضمنی')
    dl = pg.evaluate(ML)
    check(f'{name}: «DSP کی ضمنی» — «مرتبہ» اور دستخط: نام، رینک، پوسٹ، سرکل (آخر میں DSP نہیں)', dl == ['ملک اسلم DSP SDPO سرکل صدر'] * 2, dl)
    pick(pg, 'main', 'پہلی ضمنی')
    check(f'{name}: دوسری قسم چنی — لکھنے والا واپس تفتیشی افسر', pg.evaluate("_zimniAuthorNow().role") == 'io' and pg.evaluate(ML) == io_line, pg.evaluate(ML))
    ACCEPT[0] = False
    pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); 0")

    # ═══ 15) لمبی ضمنی — صفحات، نیچے 0.4cm (v580)، مثل کی لکیر صفحہ 2 پر ═══
    new_zimni(pg)
    pg.evaluate(fill_js()); pg.wait_for_timeout(800)
    asked, h = print_snap(pg, 'menu')
    p3 = html_pdf(b, h, V + f'{name}_long.pdf')
    npg, _sz = pdf_info(p3)
    an = [analyze(p, 0.4) for p in page_pngs(p3, name + '_long')]
    full = an[:-1]
    check(f'{name}: لمبی ضمنی — {npg} صفحات؛ کھڑی لکیریں نیچے کے حاشیے (0.4cm) تک — v564 کی حد: 8px',
          npg >= 2 and all(a_['lines'] >= 2 and all(0.3 <= e <= 0.68 for e in a_['line_end_cm']) for a_ in full), [(a_['lines'], a_['line_end_cm']) for a_ in an])
    check(f'{name}: کسی صفحے پر سیاہی نیچے کے حاشیے (0.4cm) کے اندر نہیں (پرنٹر میں آخری سطر نہیں کٹتی)', all(a_['low_cm'] >= 0.35 for a_ in an), [a_['low_cm'] for a_ in an])
    ev = all(a_['diag'] >= 100 for i, a_ in enumerate(an) if (i + 1) % 2 == 0)
    od_ = all(a_['diag'] < 45 for i, a_ in enumerate(an) if (i + 1) % 2 == 1)
    check(f'{name}: مثل کی 2pt لکیر — صرف جفت صفحات (2، 4 …) پر', ev and od_, [(i + 1, a_['diag']) for i, a_ in enumerate(an)])
    contact(page_pngs(p3, name + '_long'), V + f'{name}_06_long_pages.png')
    nblk = pg.evaluate("_zimniDoc().querySelectorAll('tr.zf-blk').length")
    miss = [i for i in range(1, BLOCKS) if ('بوقت %d:30' % (9 + i)) not in h]
    check(f'{name}: تمام {nblk} بلاک کاغذ میں، اختتامی سطر ایک بار', nblk == BLOCKS and not miss and h.count('رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے') == 1, (nblk, miss))
    pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); 0")

    # ═══ 16) Ctrl+R / L / E دوسری دستاویزات میں بھی (پورا نظام) ═══
    if desk:
        pg.evaluate("_openMisalEditor('fardat')"); pg.wait_for_timeout(1800)
        ok_ed = pg.evaluate("!!document.getElementById('misal-editor')")
        pg.evaluate("""() => { const e = document.getElementById('misal-editor'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false);
            const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, 'فرد کی ایک سطر'); return 0; }""")
        AL2 = """() => { const s = getSelection(); let n = s.anchorNode; n = n && (n.nodeType === 1 ? n : n.parentElement); const blk = n && n.closest('p,div,li,td,th'); return blk ? getComputedStyle(blk).textAlign : null; }"""
        r2 = {}
        for k in ('r', 'l', 'e'):
            pg.keyboard.press('Control+' + k); pg.wait_for_timeout(250); r2[k] = pg.evaluate(AL2)
        check(f'{name}: دوسری دستاویز (فردات) میں بھی Ctrl+R / Ctrl+L / Ctrl+E', ok_ed and r2 == {'r': 'right', 'l': 'left', 'e': 'center'}, (ok_ed, r2))
        pg.evaluate("typeof _misalDirty !== 'undefined' && (_misalDirty = false); 0")

    # ═══ 17) کوائف — سرور (dio_user_data) پر بھی ═══
    pg.evaluate("DIOSync && DIOSync.ud && DIOSync.ud.flush && DIOSync.ud.flush()"); pg.wait_for_timeout(2500)
    ud = pg.evaluate("(window.__db.dio_user_data || []).filter(r => r.kind === 'case_kawaif').map(r => ({ k: r.doc_key, n: (r.data || {}).north, o: r.officer_id }))")
    check(f'{name}: وقوعہ جات کے کوائف سرور پر (dio_user_data، اپنے افسر کے نام، دوسرے آلے پر بھی)', any(r['k'] == 'c1|fields' and r['n'] == 'مکان اللہ دتہ' and r['o'] == 'o1' for r in ud), ud)

    pg.screenshot(path=V + f'{name}_07_end.png')
    real_errs = [e for e in errs if 'favicon' not in e]
    check(f'{name}: کوئی JavaScript غلطی نہیں', not real_errs, real_errs[:4])
    ctx.close()


def run_offline(b):
    """نمونوں کی فائل نہ آئے (پرانا cache / نیٹ بند) — ضمنی پھر بھی کھلے، پرانی فہرستیں چلیں"""
    ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
    ctx.route('**/zimni-templates.js*', lambda r: r.abort())
    pg.evaluate("delete window.DIO_ZIMNI_TPL; 0")
    new_zimni(pg)
    s = pg.evaluate("() => ({ tpl: !!window.DIO_ZIMNI_TPL, doc: !!_zimniDoc() })")
    mains = menu_items(pg, 'main')
    pick(pg, 'main', 'SHO کی ضمنی')
    subs = menu_items(pg, 'sub')
    pick(pg, 'sub', subs[0]); pg.wait_for_timeout(800)
    t = pg.evaluate("(_zimniDoc().querySelector('.zf-title') || {}).textContent || ''")
    sv = pg.evaluate("document.getElementById('zf-sub-type').value")
    check('offline: نمونوں کی فائل نہ آئے — ضمنی کھلتی ہے، 8 اقسام، پرانی نوعیتیں (چنی جاتی ہیں، سرخی وہی)، کوئی غلطی نہیں',
          s['doc'] and not s['tpl'] and len(mains) >= 8 and len(subs) >= 1 and sv == subs[0] and t == 'رپورٹ ضمنی بیرونی' and not errs, (s, mains[:3], subs[:3], t, errs[:3]))
    ctx.close()


def run_logout(b):
    ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
    pg.evaluate("localStorage.setItem('dio_case_kawaif_c1', JSON.stringify({ fields: { north: 'x' } })); localStorage.setItem('dio_cctx_acc_c1', '[]'); 0")
    pg.evaluate("async () => { try { await doLogout(); } catch (e) { window.__lerr = String(e); } return 0; }"); pg.wait_for_timeout(2500)
    left = pg.evaluate("Object.keys(localStorage).filter(k => /^dio_case_kawaif_|^dio_cctx_/.test(k))")
    check('لاگ آؤٹ: کوائف اور مقدمے کے سیاق کی مقامی نقل صاف (اسی آلے پر دوسرا افسر نہ دیکھے)', not left, (left, pg.evaluate("window.__lerr || ''")))
    ctx.close()


METR = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    only = os.environ.get('DIO_ONLY', '')
    for name, kw in [('desktop', dict(viewport={'width': 1366, 'height': 768})),
                     ('mobile', dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2))]:
        if only and only != name: continue
        try: run(b, name, kw)
        except Exception as e:
            import traceback; traceback.print_exc(); check(f'{name}: جانچ مکمل چلی', False, repr(e)[:300])
    if not only:
        for fn in (run_offline, run_logout):
            try: fn(b)
            except Exception as e:
                import traceback; traceback.print_exc(); check(fn.__name__ + ': جانچ مکمل چلی', False, repr(e)[:300])
    b.close()

json.dump({'results': R, 'metrics': METR}, open(V + 'results.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('\n%d PASS / %d FAIL' % (sum(1 for r in R if r[0] == 'PASS'), sum(1 for r in R if r[0] == 'FAIL')))
sys.exit(1 if any(r[0] == 'FAIL' for r in R) else 0)
