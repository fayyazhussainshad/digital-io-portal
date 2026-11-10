"""(v574) بیرونی ضمنی — MW کا انداز: اصل ایپ کی جانچ (Desktop 1366×768 + Mobile 390×844)

افسر کی ہدایت (10 نومبر 2026، «بسم اللہ کریں»):
  1) ضمنی کے اوپر والی پٹی ہٹے؛ MW کی طرح بائیں کونے میں «ضمنی» (SHO کی ضمنی، DSP کی ضمنی، پہلی ضمنی …)،
     دائیں کونے میں «نوعیت» (گرفتاری ملزمان، برآمدگی …) — موبائل پر ضمنی کو پوری جگہ
  2) نوعیت چنتے ہی MW کا پورا متن مقدمے کے ڈیٹا سے؛ جو خانے Digital IO میں نہیں تھے (کوائف موقع و مال) — نئے خانے
  3) بلاک نظام اور مثل کی لکیر قائم؛ نیچے کا حاشیہ کم (1cm → 0.6cm)
  4) فونٹ سائز، سطروں اور الفاظ کا فاصلہ Digital IO والا؛ MS Word کی شارٹ کٹس قائم
  5) Digital IO کے تمام اصول (ایک تاریخ ایک ضمنی، محفوظ → reload، چھپائی کے راستے)
چلانا: `python3 v574_test.py` (سرور: repo کی جڑ میں `python3 -m http.server 8770`)؛ ایک ہی: DIO_ONLY=desktop|mobile
"""
from v564_common import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v574/'
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
  Object.keys(localStorage).filter(k => /^dio_case_kawaif_/.test(k)).forEach(k => localStorage.removeItem(k));
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
    pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2500)


def print_snap(pg, how, paper='legal'):
    """how: bar = دستاویز کی پٹی کا «پرنٹ»؛ ctrlp = کرسر متن میں + Ctrl+P"""
    pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
    if how == 'bar':
        pg.evaluate("document.querySelector('#dio-dv-bar button[onclick=\"_dioPrintCurrent()\"]').click()")
    else:
        pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('End'); pg.keyboard.press('Control+p')
    asked = pick_paper(pg, paper)
    for _ in range(150):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    return asked, pg.evaluate("window.__snaps[0] || ''")


GEO = """() => { const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect();
    return { l: Math.round(r.left), r: Math.round(r.right), t: Math.round(r.top), b: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
  const t = document.getElementById('zf-tools'), m = document.getElementById('zf-main-type');
  const body = document.getElementById('dio-dv-body'), doc = document.getElementById('ch173-doc');
  return { docview: !!document.getElementById('dio-docview'), toolsDisp: t ? getComputedStyle(t).display : 'none', main: g('#zf-main-type'), sub: g('#zf-sub-type'),
    corners: g('#zf-corners'), doc: g('#ch173-doc'), body: g('#dio-dv-body'), vw: innerWidth, vh: innerHeight,
    mains: m ? [...m.options].map(o => o.value).filter(v => v && v !== '__add__') : [],
    docTopInBody: (body && doc) ? Math.round(doc.getBoundingClientRect().top - body.getBoundingClientRect().top) : null,
    scale: doc ? +(doc.getBoundingClientRect().width / doc.offsetWidth).toFixed(3) : null }; }"""

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

    # ═══ 1) کھولنا: پٹی غائب، کونوں میں دو فہرستیں ═══
    new_zimni(pg)
    g = pg.evaluate(GEO)
    pg.screenshot(path=V + f'{name}_01_open.png')
    check(f'{name}: ضمنی کے اوپر کی پرانی پٹی نظر نہیں آتی (دستاویز کی پٹی موجود)', g['docview'] and g['toolsDisp'] == 'none', g['toolsDisp'])
    same_row = g['main'] and g['sub'] and abs(g['main']['t'] - g['sub']['t']) <= 4
    check(f'{name}: MW انداز — «ضمنی» بائیں کونے، «نوعیت» دائیں کونے، ایک ہی سطر میں، کاغذ کے اوپر',
          same_row and g['main']['l'] < g['sub']['l'] and g['main']['l'] <= g['corners']['l'] + 4 and g['sub']['r'] >= g['corners']['r'] - 4
          and g['corners']['b'] <= g['doc']['t'] + 1, {k: g[k] for k in ('main', 'sub', 'corners', 'doc')})
    check(f'{name}: کاغذ اوپر سے پوری جگہ پر (اوپر کی کل جگہ ≤ 50px)', g['docTopInBody'] is not None and g['docTopInBody'] <= 50, g['docTopInBody'])
    EXP = ['پہلی ضمنی', 'گرفتاری', 'عدالت', 'درخواستیں', 'بیانات', 'متفرق', 'SHO کی ضمنی', 'DSP کی ضمنی']
    check(f'{name}: «ضمنی» کی فہرست — MW کی 8 اقسام ترتیب سے', g['mains'][:8] == EXP, g['mains'])

    # ═══ 2) نوعیت → کوائف کا خانہ → پورا متن ═══
    pg.select_option('#zf-main-type', label='پہلی ضمنی'); pg.wait_for_timeout(400)
    subs = pg.evaluate("[...document.getElementById('zf-sub-type').options].map(o => o.textContent)")
    check(f'{name}: «پہلی ضمنی» کی نوعیتیں (MW کے 35 نمونے + پرانی «اول ضمنی»)', len([s for s in subs if s and not s.startswith('—') and '+' not in s]) >= 36 and 'نامعلوم ملزم' in subs, len(subs))
    pg.select_option('#zf-sub-type', label='نامعلوم ملزم'); pg.wait_for_timeout(1300)
    card = pg.evaluate("[...document.querySelectorAll('#modal-body [id^=zf-kw-]')].map(e => e.id)")
    pg.screenshot(path=V + f'{name}_02_kawaif.png')
    check(f'{name}: نیا خانہ «کوائف موقع و مال» — اس نمونے کے صرف ضروری خانے (شمال، مشرق، جنوب، مغرب)', card == ['zf-kw-north', 'zf-kw-east', 'zf-kw-south', 'zf-kw-west'], card)
    pg.fill('#zf-kw-north', 'مکان اللہ دتہ'); pg.fill('#zf-kw-east', 'گلی عام')
    pg.click("#modal-footer button:has-text('ضمنی میں لگائیں')"); pg.wait_for_timeout(2200)
    pg.screenshot(path=V + f'{name}_03_applied.png')
    a = pg.evaluate("""() => { const d = _zimniDoc(); return { blocks: d.querySelectorAll('tr.zf-blk').length, tv: [...d.querySelectorAll('.zf-tv')].map(x => x.textContent),
        title: (d.querySelector('.zf-title') || {}).textContent || '', kh: document.getElementById('zf-khulasa').value,
        c1: d.querySelector('tr.zf-blk .zf-actbody').innerText, raw: (d.innerText.match(/\\([A-Za-z_]+[0-9]*\\)|\\[\\[[^\\]]*\\]\\]/g) || []),
        text: d.innerText, nums: [...d.querySelectorAll('tr.zf-blk .zf-num')].map(x => x.textContent.trim()),
        close: (d.querySelector('.zf-close') || {}).textContent || '', bind: !!d.querySelector('tr.zf-endrow'),
        kw: JSON.parse(localStorage.getItem('dio_case_kawaif_c1') || '{}') }; }""")
    today = pg.evaluate("(() => { const d = new Date(); const p = n => String(n).padStart(2, '0'); return p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear(); })()")
    check(f'{name}: نمونہ لگا — بلاک نظام (کالم 1/2/3)، نمبر ترتیب سے، اختتامی سطر Digital IO والی',
          a['blocks'] >= 3 and a['nums'] == [str(i + 1) for i in range(a['blocks'])] and 'رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے' in a['close'], (a['blocks'], a['nums'], a['close']))
    check(f'{name}: مقدمے کا ڈیٹا خود بھرا (مدعی، جائے وقوعہ، گواہ، ہمراہی، شمال/مشرق) — کوئی (xxx) یا [[..]] باقی نہیں',
          not a['raw'] and 'محمد امجد حسین' in a['text'] and 'مکان اللہ دتہ' in a['text'] and 'گلی عام' in a['text'] and ('محمد یونس' in a['text'] or 'محمد اکرم' in a['text']), a['raw'])
    check(f'{name}: جو نہیں ملا — پیلا خالی خانہ (جنوب، مغرب)', a['tv'] == ['جنوب', 'مغرب'], a['tv'])
    check(f'{name}: کالم 1 = تاریخ (بلاک 1) + عنوان؛ سرخی اور خلاصہ نمونے سے', a['c1'].startswith(today) and len(a['c1'].split('\n')) >= 2 and 'نامعلوم ملزم' in a['title'] and len(a['kh']) > 5,
          (a['c1'][:40], a['title'], a['kh']))
    check(f'{name}: کوائف اسی مقدمے کے ساتھ محفوظ (اگلے نمونے میں دوبارہ)', (a['kw'].get('fields') or {}).get('north') == 'مکان اللہ دتہ', a['kw'])

    # ═══ 3) پیلا خانہ: دبانے پر چنا جائے، لکھتے ہی عام متن ═══
    pg.click('#ch173-doc .zf-tv[data-tv="جنوب"]'); pg.wait_for_timeout(200)
    selt = pg.evaluate("getSelection().toString()")
    pg.keyboard.type('کھیت'); pg.wait_for_timeout(300)
    t3 = pg.evaluate("() => { const d = _zimniDoc(); return { tv: [...d.querySelectorAll('.zf-tv')].map(x => x.textContent), has: d.innerText.includes('کھیت'), lbl: d.innerText.includes('جنوب') }; }")
    check(f'{name}: پیلے خانے پر دبانے سے وہ چنا گیا، لکھا ہوا متن اس کی جگہ (پیلا رنگ ختم)', selt == 'جنوب' and t3['tv'] == ['مغرب'] and t3['has'], (selt, t3))

    # ═══ 4) فونٹ، سطر اور الفاظ کا فاصلہ — Digital IO والا ═══
    pg.evaluate("""() => { _zimniAddBlock(); const rows = _zimniDoc().querySelectorAll('tr.zf-blk'); const b = rows[rows.length - 1].querySelector('.zf-body');
        b.focus(); const r = document.createRange(); r.selectNodeContents(b); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        document.execCommand('insertText', false, 'افسر کا اپنا لکھا ہوا عام متن تاکہ موازنہ ہو سکے'); }""")
    pg.wait_for_timeout(300)
    mt = pg.evaluate(METRICS, '#ch173-doc tr.zf-blk .zf-body')
    mo = pg.evaluate(METRICS.replace("document.querySelector(sel)", "[...document.querySelectorAll(sel)].pop()"), '#ch173-doc tr.zf-blk .zf-body')
    m1 = pg.evaluate(METRICS, '#ch173-doc tr.zf-blk .zf-actbody')
    inner = pg.evaluate("() => { const b = _zimniDoc().querySelector('tr.zf-blk .zf-body'); return [...b.querySelectorAll('*')].filter(e => e.getAttribute('style') && /font-size|line-height|word-spacing/.test(e.getAttribute('style'))).length; }")
    check(f'{name}: نمونے کا متن اور افسر کا لکھا متن — ایک ہی فونٹ/سائز/سطر/الفاظ کا فاصلہ (کوئی اپنا انداز نہیں)', mt == mo and inner == 0 and mt['ff'].startswith('Jameel'), (mt, mo, inner))
    METR[name] = {'body': mt, 'col1': m1}

    # ═══ 5) MS Word کی شارٹ کٹس ═══
    if desk:
        sel_js = """() => { const b = [..._zimniDoc().querySelectorAll('tr.zf-blk .zf-body')].pop(); const tw = document.createTreeWalker(b, NodeFilter.SHOW_TEXT); const n = tw.nextNode();
            const r = document.createRange(); r.setStart(n, 0); r.setEnd(n, 4); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.focus && 0; return s.toString(); }"""
        pg.locator('#ch173-doc tr.zf-blk .zf-body').last.click(); pg.evaluate(sel_js)
        pg.keyboard.press('Control+b'); pg.wait_for_timeout(200)
        on = pg.evaluate("document.queryCommandState('bold')")
        pg.keyboard.press('Control+b'); pg.wait_for_timeout(200)
        off = pg.evaluate("document.queryCommandState('bold')")
        pg.keyboard.press('Control+i'); pg.wait_for_timeout(200)
        it = pg.evaluate("document.queryCommandState('italic')")
        pg.keyboard.press('Control+z'); pg.wait_for_timeout(200)
        un = pg.evaluate("document.queryCommandState('italic')")
        check(f'{name}: MS Word شارٹ کٹس قائم — Ctrl+B (موٹا/واپس)، Ctrl+I، Ctrl+Z', on and not off and it and not un, (on, off, it, un))
        pg.keyboard.press('Control+e'); pg.wait_for_timeout(200)
        ce = pg.evaluate("document.queryCommandState('justifyCenter')")
        pg.keyboard.press('Control+r'); pg.wait_for_timeout(200)
        check(f'{name}: Ctrl+E (درمیان) چلتی ہے', ce, ce)

    # ═══ 6) نمونہ بدلنے سے پہلے پوچھا جائے (انکار = کچھ نہیں بدلا) ═══
    before = pg.evaluate("_zimniDoc().innerHTML")
    other = [s for s in subs if s not in ('نامعلوم ملزم',) and s and not s.startswith('—') and '+' not in s and s != 'اول ضمنی'][0]
    ACCEPT[0] = False; n0 = len(dialogs)
    pg.select_option('#zf-sub-type', label=other); pg.wait_for_timeout(1200)
    after = pg.evaluate("_zimniDoc().innerHTML"); sv = pg.evaluate("document.getElementById('zf-sub-type').value")
    check(f'{name}: لکھی ہوئی ضمنی پر دوسرا نمونہ — پہلے پوچھا؛ «منسوخ» پر تحریر اور نوعیت جوں کی توں',
          len(dialogs) == n0 + 1 and 'بدل جائے گا' in dialogs[-1] and after == before and sv == 'نامعلوم ملزم', (dialogs[-1:] , sv))

    # ═══ 7) خلاصہ (موبائل: ⋯) ═══
    if not desk:
        vis0 = pg.evaluate("document.getElementById('zf-khulasa').getBoundingClientRect().width")
        pg.click('#zf-corners .zf-morebtn'); pg.wait_for_timeout(300)
        vis1 = pg.evaluate("document.getElementById('zf-khulasa').getBoundingClientRect().width")
        pg.screenshot(path=V + f'{name}_04_more.png')
        check(f'{name}: موبائل — خلاصہ/لکھنے والا افسر/کوائف «⋯» کے پیچھے (کاغذ کی جگہ نہیں گھیرتے)', vis0 == 0 and vis1 > 100, (vis0, vis1))
    KH = 'نامعلوم ملزم کی تلاش — موقع ملاحظہ اور نقشہ موقع'
    pg.fill('#zf-khulasa', KH); pg.wait_for_timeout(300)

    # ═══ 8) محفوظ — دستاویز کی پٹی کا «محفوظ» (اور Ctrl+S) ═══
    pg.evaluate("document.getElementById('dio-dv-save').click()"); pg.wait_for_timeout(2500)
    rows = pg.evaluate("window.__db.zimni_reports.map(r => ({ id: r.id, c: r.content, d: r.report_date }))")
    c = rows[0]['c'] if rows else {}
    check(f'{name}: «محفوظ» (دستاویز کی پٹی) — ریکارڈ سرور پر: ضمنی، نوعیت، خلاصہ، متن',
          len(rows) == 1 and c.get('main_type') == 'پہلی ضمنی' and c.get('sub_type') == 'نامعلوم ملزم' and c.get('khulasa') == KH and 'کھیت' in (c.get('bodyHtml') or ''),
          [(r['d'], (r['c'] or {}).get('main_type'), (r['c'] or {}).get('sub_type'), (r['c'] or {}).get('khulasa')) for r in rows])
    if desk:
        pg.evaluate("""() => { const b = [..._zimniDoc().querySelectorAll('tr.zf-blk .zf-body')].pop(); b.focus(); const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
            const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, ' مزید تحریر Ctrl+S'); }""")
        pg.keyboard.press('Control+s'); pg.wait_for_timeout(2500)
        c2 = pg.evaluate("window.__db.zimni_reports[0].content")
        check(f'{name}: Ctrl+S سے محفوظ (اسی ضمنی میں، نئی نہیں بنی)', 'مزید تحریر' in (c2.get('bodyHtml') or '') and pg.evaluate("window.__db.zimni_reports.length") == 1)
    saved_blocks = pg.evaluate("[..._zimniDoc().querySelectorAll('tr.zf-blk')].map(r => [r.querySelector('.zf-actbody').innerText.trim(), r.querySelector('.zf-body').innerText.trim()])")

    # ═══ 9) چھپائی — دستاویز کی پٹی «پرنٹ» + Ctrl+P ═══
    asked, h = print_snap(pg, 'bar')
    body_h = h.split('<body', 1)[-1] if h else ''
    check(f'{name}: «پرنٹ» (دستاویز کی پٹی) — کاغذ پوچھا، @page اوپر 1cm، نیچے 0.6cm',
          asked and bool(re.search(r'@page\{\s*size:8\.5in 13in;\s*margin:1cm 0 0\.6cm 0;', h)), re.findall(r'@page\{[^}]*\}', h)[:2])
    check(f'{name}: چھپائی میں پیلا خانہ نہیں — خالی خانہ «۔۔۔۔۔۔۔۔»، بھرا ہوا عام متن', body_h.count('۔۔۔۔۔۔۔۔') >= 1 and 'class="zf-tv"' not in body_h and 'data-tv="مغرب">مغرب' not in body_h
          and 'کھیت' in body_h, body_h.count('۔۔۔۔۔۔۔۔'))
    pdfb = html_pdf(b, h, V + f'{name}_bar.pdf') if h else None
    if desk:
        asked2, h2 = print_snap(pg, 'ctrlp')
        pdfc = html_pdf(b, h2, V + f'{name}_ctrlp.pdf') if h2 else None
        ok, d = same_pages(page_pngs(pdfb, name + '_bar'), page_pngs(pdfc, name + '_ctrlp')) if (pdfb and pdfc) else (False, ['no pdf'])
        check(f'{name}: Ctrl+P اور «پرنٹ» — صفحات pixel تک ایک', asked2 and ok, d)
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")

    # ═══ 10) reload → فہرست میں خلاصہ؛ کھولنے پر سب جوں کا توں ═══
    pg.evaluate("""() => { const r = window.__db.zimni_reports[0]; const o = JSON.parse(JSON.stringify(r));
        Object.assign(o, { id: 'old1', serial_no: 0, report_date: '2026-11-01', created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-01T10:00:00Z' });
        o.content = Object.assign({}, o.content, { main_type: 'SHO ضمنی', sub_type: 'معائنہ مسل', khulasa: '' }); delete o.content.zno;
        window.__db.zimni_reports.push(o); sessionStorage.setItem('__v574db', JSON.stringify(window.__db)); return 0; }""")
    _r173 = pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); 0")
    pg.reload(); relogin(pg); pg.evaluate(HOOK_TOAST)
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800)
    lst = pg.evaluate("[...document.querySelectorAll('.zt .zt-kh')].map(e => e.textContent.trim())")
    pg.screenshot(path=V + f'{name}_05_list.png')
    check(f'{name}: reload کے بعد ضمنیات کی فہرست میں خلاصہ (ایک سطر)؛ پرانی ضمنی بغیر خلاصے کے (کچھ نہیں بدلا)', KH in lst and len(lst) == 1, lst)
    zid = rows[0]['id'] if rows else ''
    pg.evaluate(f"_openZimni('{zid}')"); pg.wait_for_timeout(2500)
    o = pg.evaluate("""() => ({ m: document.getElementById('zf-main-type').value, s: document.getElementById('zf-sub-type').value, kh: document.getElementById('zf-khulasa').value,
        blocks: [..._zimniDoc().querySelectorAll('tr.zf-blk')].map(r => [r.querySelector('.zf-actbody').innerText.trim(), r.querySelector('.zf-body').innerText.trim()]),
        tv: [..._zimniDoc().querySelectorAll('.zf-tv')].map(x => x.textContent) })""")
    check(f'{name}: reload → محفوظ ضمنی کھولی: ضمنی/نوعیت/خلاصہ/تمام بلاک جوں کے توں (پیلا خانہ بھی)',
          o['m'] == 'پہلی ضمنی' and o['s'] == 'نامعلوم ملزم' and o['kh'] == KH and o['blocks'] == saved_blocks and o['tv'] == ['مغرب'], {k: o[k] for k in ('m', 's', 'kh', 'tv')})

    # ═══ 11) پرانی ضمنی (v574 سے پہلے کی، پرانا نام «SHO ضمنی») — جوں کی توں ═══
    pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1500)
    pg.evaluate(f"_openZimni('old1')"); pg.wait_for_timeout(2500)
    nd = len(dialogs)
    od = pg.evaluate("""() => ({ m: document.getElementById('zf-main-type').value, s: document.getElementById('zf-sub-type').value,
        blocks: [..._zimniDoc().querySelectorAll('tr.zf-blk')].map(r => [r.querySelector('.zf-actbody').innerText.trim(), r.querySelector('.zf-body').innerText.trim()]) })""")
    check(f'{name}: پرانی ضمنی («SHO ضمنی») کھولی — «SHO کی ضمنی» دکھائی، نوعیت اور تحریر جوں کی توں، کچھ نہیں پوچھا',
          od['m'] == 'SHO کی ضمنی' and od['s'] == 'معائنہ مسل' and od['blocks'] == saved_blocks and len(dialogs) == nd, (od['m'], od['s']))
    pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); 0")

    # ═══ 12) ایک تاریخ = ایک ضمنی (موجودہ اصول) ═══
    pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1200)
    new_zimni(pg, seed=False)
    pg.select_option('#zf-main-type', label='گرفتاری'); pg.wait_for_timeout(300)
    s2 = pg.evaluate("[...document.getElementById('zf-sub-type').options].map(o => o.textContent).filter(t => t && !t.startsWith('—') && !t.includes('+'))")
    ACCEPT[0] = True
    pg.select_option('#zf-sub-type', label=s2[0]); pg.wait_for_timeout(1500)
    if pg.evaluate("!!document.querySelector('#modal-footer button')"):
        pg.click("#modal-footer button:has-text('ضمنی میں لگائیں')"); pg.wait_for_timeout(1800)
    pg.evaluate("window.__TOAST = []; document.getElementById('dio-dv-save').click()"); pg.wait_for_timeout(2500)
    n = pg.evaluate("window.__db.zimni_reports.length"); toasts = pg.evaluate("window.__TOAST")
    check(f'{name}: اسی تاریخ پر تفتیشی افسر کی دوسری ضمنی — محفوظ نہیں، انتباہ «ایک تاریخ … ایک ہی ضمنی»', n == 2 and any('ایک ہی ضمنی' in t for t in toasts), (n, toasts[-1:]))

    # ═══ 13) «SHO کی ضمنی» — لکھنے والا افسر SHO ═══
    pg.select_option('#zf-main-type', label='SHO کی ضمنی'); pg.wait_for_timeout(500)
    au = pg.evaluate("(document.getElementById('zf-author') || {}).value")
    s3 = pg.evaluate("[...document.getElementById('zf-sub-type').options].map(o => o.textContent).filter(t => t && !t.startsWith('—') && !t.includes('+'))")
    check(f'{name}: «SHO کی ضمنی» چنی — لکھنے والا افسر SHO، اس کی MW نوعیتیں (23 نمونے)', au == 'sho' and len(s3) >= 23, (au, len(s3)))
    ACCEPT[0] = False
    pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); 0")

    # ═══ 14) لمبی ضمنی — صفحات، نیچے 0.6cm، مثل کی لکیر صفحہ 2 پر ═══
    new_zimni(pg)
    pg.evaluate(fill_js()); pg.wait_for_timeout(800)
    asked, h = print_snap(pg, 'bar')
    p3 = html_pdf(b, h, V + f'{name}_long.pdf')
    npg, _sz = pdf_info(p3)
    an = [analyze(p, 0.6) for p in page_pngs(p3, name + '_long')]
    full = an[:-1]
    check(f'{name}: لمبی ضمنی — {npg} صفحات؛ ہر پورے صفحے پر کھڑی لکیریں نیچے کے حاشیے (0.6cm، پہلے 1cm) تک — v564 کی حد: 8px',
          npg >= 2 and all(a_['lines'] >= 2 and all(0.5 <= e <= 0.88 for e in a_['line_end_cm']) for a_ in full), [(a_['lines'], a_['line_end_cm']) for a_ in an])
    check(f'{name}: کسی صفحے پر سیاہی نیچے کے 0.5cm میں نہیں (پرنٹر میں آخری سطر نہیں کٹتی)', all(a_['low_cm'] >= 0.5 for a_ in an), [a_['low_cm'] for a_ in an])
    ev = all(a_['diag'] >= 100 for i, a_ in enumerate(an) if (i + 1) % 2 == 0)
    od_ = all(a_['diag'] < 45 for i, a_ in enumerate(an) if (i + 1) % 2 == 1)
    check(f'{name}: مثل کی 2pt لکیر — صرف جفت صفحات (2، 4 …) پر', ev and od_, [(i + 1, a_['diag']) for i, a_ in enumerate(an)])
    contact(page_pngs(p3, name + '_long'), V + f'{name}_06_long_pages.png')
    nblk = pg.evaluate("_zimniDoc().querySelectorAll('tr.zf-blk').length")
    miss = [i for i in range(1, BLOCKS) if ('بوقت %d:30' % (9 + i)) not in h]
    check(f'{name}: تمام {nblk} بلاک کاغذ میں، اختتامی سطر ایک بار', nblk == BLOCKS and not miss and h.count('رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے') == 1, (nblk, miss))
    pg.evaluate("typeof _r173Dirty !== 'undefined' && (_r173Dirty = false); 0")

    # ═══ 15) کوائف — سرور (dio_user_data) پر بھی ═══
    pg.evaluate("DIOSync && DIOSync.ud && DIOSync.ud.flush && DIOSync.ud.flush()"); pg.wait_for_timeout(2500)
    ud = pg.evaluate("(window.__db.dio_user_data || []).filter(r => r.kind === 'case_kawaif').map(r => ({ k: r.doc_key, n: (r.data || {}).north, o: r.officer_id }))")
    check(f'{name}: کوائف سرور پر (dio_user_data، اپنے افسر کے نام، دوسرے آلے پر بھی)', any(r['k'] == 'c1|fields' and r['n'] == 'مکان اللہ دتہ' and r['o'] == 'o1' for r in ud), ud)

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
    s = pg.evaluate("() => ({ m: [...document.getElementById('zf-main-type').options].map(o => o.value).filter(Boolean).length, tpl: !!window.DIO_ZIMNI_TPL, doc: !!_zimniDoc() })")
    pg.select_option('#zf-main-type', label='SHO کی ضمنی'); pg.wait_for_timeout(300)
    subs = pg.evaluate("[...document.getElementById('zf-sub-type').options].map(o => o.textContent).filter(t => t && !t.startsWith('—') && !t.includes('+'))")
    pg.select_option('#zf-sub-type', label=subs[0]); pg.wait_for_timeout(800)
    t = pg.evaluate("(_zimniDoc().querySelector('.zf-title') || {}).textContent || ''")
    check('offline: نمونوں کی فائل نہ آئے — ضمنی کھلتی ہے، 8 اقسام، پرانی نوعیتیں (صرف سرخی)، کوئی غلطی نہیں',
          s['doc'] and not s['tpl'] and s['m'] >= 8 and len(subs) >= 1 and subs[0] in t and not errs, (s, subs[:3], t, errs[:3]))
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
