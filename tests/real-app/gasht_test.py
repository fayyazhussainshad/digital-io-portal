"""اصل ایپ میں «گشت لاگ» (v548) کی جانچ — Desktop + Mobile + پرنٹ (Ctrl+P = پرنٹ بٹن)۔

اصل index.html اور اصل scripts؛ صرف Supabase کی جگہ آزمائشی ڈیٹا (mock-supabase.js)۔
چلانا: README.md (اسی فولڈر میں) — `python3 gasht_test.py`
"""
import sys, json, subprocess, re
sys.path.insert(0, '.')
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra) if extra != '' else ''), flush=True)

TOAST_HOOK = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push([t || 'info', String(m)]); return o.apply(this, arguments); }; return 0; })()"""
def toasts(pg): return pg.evaluate("window.__toasts.splice(0)")
def has(ts, kind, *w): return any(t[0] == kind and all(x in t[1] for x in w) for t in ts)
def no_success(ts): return not any(t[0] == 'success' for t in ts)
def db(pg, t='gasht_logs'): return pg.evaluate(f"JSON.parse(JSON.stringify(window.__db[{json.dumps(t)}] || []))")
def server(pg, fail=(), silent=(), noTable=()):
    pg.evaluate(f"window.__opts.fail={json.dumps(list(fail))}; window.__opts.silent={json.dumps(list(silent))}; window.__opts.noTable={json.dumps(list(noTable))}; 0")
def cell(pg, k, html):
    pg.evaluate("""([k, h]) => { const el = document.querySelector('#gl-doc [data-k="' + k + '"]'); el.focus(); el.innerHTML = h;
      el.dispatchEvent(new Event('input', { bubbles: true })); el.blur(); }""", [k, html])
def ecell(pg, key, html):
    pg.evaluate("""([k, h]) => { const el = document.querySelector('#gl-doc [data-e="' + k + '"]'); el.focus(); el.innerHTML = h;
      el.dispatchEvent(new Event('input', { bubbles: true })); el.blur(); }""", [key, html])
def text(pg, sel): return pg.evaluate(f"(document.querySelector({json.dumps(sel)}) || {{}}).innerText || ''")

def add_entry(pg, kind, place, detail, person='', mobile='', edit_idx=None):
    pg.evaluate("_glEntryCard(%d)" % (-1 if edit_idx is None else edit_idx)); pg.wait_for_selector('#gle-kind')
    pg.wait_for_timeout(500)   # GPS خود
    if kind: pg.select_option('#gle-kind', kind)
    if place is not None: pg.fill('#gle-place', place)
    if person: pg.fill('#gle-person', person)
    if mobile: pg.fill('#gle-mobile', mobile)
    if detail is not None: pg.fill('#gle-detail', detail)
    card = pg.evaluate("""(() => ({ title: document.getElementById('modal-title').innerText, time: document.getElementById('gle-time').value,
      ll: document.getElementById('gle-ll').value, mob: (document.getElementById('gle-mobile') || {}).value,
      mic: !!document.querySelector('#modal-backdrop .dio-mic') }))()""")
    pg.click('#modal-backdrop .modal-card .btn-primary'); pg.wait_for_timeout(700)
    return card

def pdf_info(path):
    return subprocess.run(['pdfinfo', path], capture_output=True, text=True).stdout

def print_pdf(pg, name, how):
    if how == 'ctrlp': pg.keyboard.press('Control+p')
    else: pg.click('.gl-strip [data-dio-print]')
    pg.wait_for_timeout(300)
    st = pg.evaluate("({calls: window.__printCalls, inHost: !!document.querySelector('#dio-nprint-host #gl-doc')})")
    pg.pdf(path=f'{OUT}/{name}.pdf', prefer_css_page_size=True, print_background=True)
    pg.evaluate("window.dispatchEvent(new Event('afterprint'))"); pg.wait_for_timeout(200)
    subprocess.run(['pdftoppm', '-png', '-r', '80', f'{OUT}/{name}.pdf', f'{OUT}/{name}'])
    return st, pdf_info(f'{OUT}/{name}.pdf'), subprocess.run(['pdftotext', f'{OUT}/{name}.pdf', '-'], capture_output=True, text=True).stdout

STRIP_WORDS = ['محفوظ کریں', 'گشت ختم کریں', 'فہرست', 'ڈاؤن لوڈ', 'A4 منظر']

with sync_playwright() as p:
    b = p.chromium.launch()
    # ══════════════════════════ DESKTOP ══════════════════════════
    ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
    ctx.grant_permissions(['clipboard-read', 'clipboard-write', 'geolocation'], origin=BASE.rstrip('/'))
    pg.evaluate(TOAST_HOOK)
    pg.on('dialog', lambda d: d.accept())

    # ── A) Dashboard → گشت لاگ ──
    tile = pg.locator('.dio-tiles-more button[aria-label="گشت لاگ"]')
    check('dashboard: «گشت لاگ» tile present', tile.count() == 1)
    tile.click(); pg.wait_for_timeout(1500)
    check('gasht page opens with empty list + «نیا اندراج»', pg.locator('.gl-empty').count() >= 1 and 'گشت لاگ' in text(pg, '.page-title'), text(pg, '.page-title'))
    pg.screenshot(path=OUT + '/g_d01_list_empty.png')

    # ── B) نیا گشت — نظام سے ڈیٹا ──
    pg.click('.page-header .dio-add-btn'); pg.wait_for_selector('#gl-doc'); pg.wait_for_timeout(1200)
    info = pg.evaluate("""(() => { const q = s => (document.querySelector(s) || {}).innerText || '';
      const fs = s => getComputedStyle(document.querySelector(s)).fontSize;
      return { thana: q('#gl-doc [data-k="thana"]'), zila: q('#gl-doc [data-k="zila"]'), title: q('#gl-doc [data-k="title"]'),
        date: q('#gl-doc [data-k="date"]'), start: q('#gl-doc [data-k="start"]'), end: q('#gl-doc [data-k="end"]'), officer: q('#gl-doc [data-k="officer"]'),
        sign: q('#gl-doc [data-k="sign_line"]'), state: q('#gl-state'), chip: q('#gl-chip'),
        h1: fs('#gl-doc .gl-title'), h2: fs('#gl-doc .gl-h2'), body: fs('#gl-doc'), cell: fs('#gl-doc .gl-table td'),
        dir: getComputedStyle(document.getElementById('gl-doc')).direction, firstLine: q('#gl-doc .gl-title-row') }; })()""")
    today = pg.evaluate("(() => { const d = _glNowIso(); return d.slice(8,10) + '/' + d.slice(5,7) + '/' + d.slice(0,4); })()")
    check('doc line 1: تھانہ (right) · ضلع (left) from officer', 'تھانہ صدر ملتان' in info['firstLine'] and 'ضلع ملتان' in info['firstLine'], info['firstLine'])
    check('doc title «گشت رپورٹ» 20pt · sub-heading 16pt · text 14pt (system rule)', info['title'].strip() == 'گشت رپورٹ' and info['h1'] == '26.6667px' and info['h2'] == '21.3333px' and info['body'] == '18.6667px' and info['cell'] == '18.6667px', (info['h1'], info['h2'], info['body']))
    check('date DD/MM/YYYY + روانگی auto (now, time only — date above), واپسی empty', info['date'].strip() == today and re.search(r'\d{2}:\d{2}', info['start']) and 'بجے' in info['start'] and today not in info['start'] and info['end'].strip() == '', (info['date'], info['start']))
    check('گشت افسر + دستخط = logged-in IO line (name, ASI, تھانہ)', all(w in info['officer'] for w in ['فیاض حسین شاد', 'ASI', 'تھانہ صدر ملتان']) and info['sign'] == info['officer'], info['officer'])
    check('new gasht: RTL, «جاری», state «نیا — ابھی محفوظ نہیں»', info['dir'] == 'rtl' and info['chip'] == 'جاری' and 'ابھی محفوظ نہیں' in info['state'], (info['chip'], info['state']))
    check('no «Punjab Police / محکمہ پولیس پنجاب» heading anywhere', 'پنجاب' not in text(pg, '#gl-doc') and 'Punjab' not in text(pg, '#gl-doc'))

    cell(pg, 'area', 'وقاص ٹاؤن، گلگشت، چوک کمہاراں والا')
    cell(pg, 'vehicle', 'LEA-1234 — ڈرائیور کانسٹیبل اکرم')
    cell(pg, 'staff', 'HC محمد اسلم 1122، کانسٹیبل ساجد 3344')
    cell(pg, 'rapat', 'روانگی رپٹ 12 · واپسی رپٹ —')
    toasts(pg)

    # ── C) پہلا اندراج — کارڈ، وقت/GPS خود، موبائل 0000-0000000، خود محفوظ ──
    card = add_entry(pg, '15 کال', 'نیو وقاص ٹاؤن', 'ون فائیو کال پر موقع پر پہنچے، جھگڑا رفع دفع کرایا گیا۔', 'ملک زاہد اقبال ولد فیض احمد', '03032333981')
    t = toasts(pg)
    rows = db(pg)
    check('entry card: «نیا اندراج — گشت اندراج», time HH:MM, Lat/Long auto, mobile formatted, mic on desktop',
          card['title'].strip() == 'نیا اندراج — گشت اندراج' and re.match(r'^\d{2}:\d{2}$', card['time'] or '') and card['ll'] == '30.157458, 71.524918' and card['mob'] == '0303-2333981' and card['mic'], card)
    ok = len(rows) == 1 and rows[0]['status'] == 'jari' and len(rows[0]['data']['entries']) == 1
    e0 = rows[0]['data']['entries'][0] if ok else {}
    check('first entry auto-saved: one «jari» gasht on server with the entry (+lat/lng)', ok and e0.get('kind') == '15 کال' and e0.get('lat') == 30.157458 and e0.get('mobile') == '0303-2333981', e0)
    check('area / gasht_date / started_at columns filled for list & search', ok and rows[0]['area'].startswith('وقاص ٹاؤن') and rows[0]['gasht_date'] == pg.evaluate("_glNowIso().slice(0,10)") and rows[0]['started_at'].endswith('+05:00'), (rows[0].get('area'), rows[0].get('started_at')) if rows else '')
    check('success message only after real save', has(t, 'success', 'محفوظ ہو گیا'), t)

    # ── D) دوسرا اندراج + خلاصہ ──
    add_entry(pg, 'ناکہ بندی', 'چوک کمہاراں والا', 'ناکہ بندی کی، 14 موٹر سائیکل اور 6 گاڑیاں چیک کیں۔')
    summ = text(pg, '#gl-sum')
    check('summary counts by نوعیت', 'کل اندراجات 2' in summ.replace('⁦', '').replace('⁩', '') and '15 کال' in summ and 'ناکہ بندی' in summ, summ)

    # ── E) اندراج میں ترمیم (کارڈ) ──
    add_entry(pg, None, None, 'ون فائیو کال پر پہنچے، فریقین میں صلح کرا دی گئی۔', edit_idx=0)
    rows = db(pg)
    check('edit entry via card: same 2 entries, detail updated', len(rows[0]['data']['entries']) == 2 and 'صلح' in rows[0]['data']['entries'][0]['detail'], [e['detail'][:20] for e in rows[0]['data']['entries']])

    # ── F) براہِ راست ترمیم (خانے) + Ctrl+S ──
    ecell(pg, '1:place', 'چوک کمہاراں والا (بوسن روڈ)')
    cell(pg, 'remarks', 'علاقہ پُرامن رہا؛ رات کے وقت گشت مزید بڑھانے کی ضرورت ہے۔')
    pg.keyboard.press('Control+s'); pg.wait_for_timeout(700)
    rows = db(pg)
    check('inline edits + Ctrl+S saved (entry place, remarks)', rows[0]['data']['entries'][1]['place'] == 'چوک کمہاراں والا (بوسن روڈ)' and 'پُرامن' in json.dumps(rows[0]['data']['f'].get('remarks', ''), ensure_ascii=False), rows[0]['data']['entries'][1]['place'])
    pg.screenshot(path=OUT + '/g_d02_doc.png')

    # ── G) فہرست: جاری گشت نمایاں ──
    pg.evaluate("_glClose()"); pg.wait_for_timeout(500)
    ban = pg.evaluate("(() => { const b = document.querySelector('.gl-active'); return b ? { t: b.innerText, btns: [...b.querySelectorAll('button')].map(x => x.innerText.trim()) } : null; })()")
    check('list: «جاری گشت» banner with اندراج / کھولیں / گشت ختم کریں', ban and 'جاری گشت' in ban['t'] and ban['btns'] == ['اندراج', 'کھولیں', 'گشت ختم کریں'], ban)
    acts = [a.strip() for a in pg.locator('.gl-card .gl-act').all_inner_texts()]
    check('list card: badge جاری + 6 actions (same as واقعاتی رپورٹ)', 'جاری' in text(pg, '.gl-card .gl-badge') and acts == ['پرنٹ', 'ترمیم', 'شیئر', 'کاپی', 'نام بدلیں', 'حذف'], acts)
    pg.screenshot(path=OUT + '/g_d03_list_active.png')

    # ── H) Dashboard «نیا اندراج» → گشت = جاری گشت کا اندراج ──
    pg.evaluate("showPage('dashboard', null)"); pg.wait_for_timeout(900)
    pg.evaluate("DIOEntry.hub()"); pg.wait_for_timeout(300)
    hub = [x.strip() for x in pg.locator('.dio-hub button').all_inner_texts()]
    check('«نیا اندراج» hub includes «گشت»', 'گشت' in hub, hub)
    pg.locator('.dio-hub button', has_text='گشت').click(); pg.wait_for_timeout(1800)
    check('hub «گشت» → entry card of the active gasht directly', pg.locator('#gle-kind').count() == 1 and pg.locator('#gl-doc').count() == 1, text(pg, '#modal-title'))
    pg.select_option('#gle-kind', 'چیکنگ مشکوک افراد'); pg.fill('#gle-place', 'گلگشت مارکیٹ'); pg.fill('#gle-detail', 'تین مشکوک افراد کی چیکنگ کی، شناختی کارڈ درست پائے گئے۔')
    pg.click('#modal-backdrop .modal-card .btn-primary'); pg.wait_for_timeout(700)
    check('third entry saved into the same gasht', len(db(pg)) == 1 and len(db(pg)[0]['data']['entries']) == 3)

    # ── I) گشت ختم ──
    pg.click('#gl-endbtn'); pg.wait_for_timeout(700)
    rows = db(pg)
    st = pg.evaluate("({ chip: document.getElementById('gl-chip').innerText, endHidden: document.getElementById('gl-endbtn').hidden, end: document.querySelector('#gl-doc [data-k=end]').innerText, dur: document.querySelector('#gl-doc [data-k=duration]').innerText })")
    check('گشت ختم: واپسی now, دورانیہ auto, status «mukammal», chip «مکمل»', rows[0]['status'] == 'mukammal' and rows[0]['ended_at'] and st['chip'] == 'مکمل' and st['endHidden'] and 'بجے' in st['end'] and 'منٹ' in st['dur'], st)

    # ── J) پرنٹ: Ctrl+P = پرنٹ بٹن ──
    tgt = pg.evaluate("(() => { const f = window._dioPrintTarget && window._dioPrintTarget(); return f ? f.toString() : null; })()")
    check('Ctrl+P resolves to the document\'s own print button', bool(tgt) and 'click' in tgt, tgt)
    s1, i1, t1 = print_pdf(pg, 'g_d04_print_ctrlp', 'ctrlp')
    s2, i2, t2 = print_pdf(pg, 'g_d05_print_button', 'button')
    check('print: document isolated (only the paper)', s1['inHost'] and s2['inHost'], (s1, s2))
    check('print: A4 portrait', '(A4)' in i1 and '(A4)' in i2, re.findall(r'Page size:.*', i1))
    same = subprocess.run(['python3', '-c', f"""
from PIL import Image, ImageChops
import glob
a=sorted(glob.glob('{OUT}/g_d04_print_ctrlp*.png')); b=sorted(glob.glob('{OUT}/g_d05_print_button*.png'))
print(len(a)==len(b) and all(ImageChops.difference(Image.open(x).convert('RGB'),Image.open(y).convert('RGB')).getbbox() is None for x,y in zip(a,b)))"""], capture_output=True, text=True).stdout.strip()
    check('Ctrl+P page == print-button page (pixel identical)', same == 'True', same)
    check('printed paper has no buttons/toolbar', not any(w in t1 for w in STRIP_WORDS), [w for w in STRIP_WORDS if w in t1])
    check('printed paper carries the data (mobile no., coordinates, date)', '0303-2333981' in t1 and '30.157458' in t1 and today in t1, (('0303-2333981' in t1), ('30.157458' in t1), (today in t1)))

    # ── K) فہرست سے سیدھا پرنٹ ──
    pg.evaluate("_glClose(true)"); pg.wait_for_timeout(500)
    check('ended gasht: banner gone, badge «مکمل»', pg.locator('.gl-active').count() == 0 and 'مکمل' in text(pg, '.gl-card .gl-badge'))
    n0 = pg.evaluate('window.__printCalls')
    pg.click('.gl-card .gl-act:has-text("پرنٹ")'); pg.wait_for_timeout(400)
    q = pg.evaluate("({calls: window.__printCalls, inHost: !!document.querySelector('#dio-nprint-host #gl-doc'), quick: !!document.querySelector('#gl-view.gl-quick')})")
    pg.pdf(path=f'{OUT}/g_d06_list_print.pdf', prefer_css_page_size=True, print_background=True)
    pg.evaluate("window.dispatchEvent(new Event('afterprint'))"); pg.wait_for_timeout(300)
    check('list print: prints straight away, A4, back on the list', q['calls'] == n0 + 1 and q['inHost'] and q['quick'] and '(A4)' in pdf_info(f'{OUT}/g_d06_list_print.pdf') and pg.locator('#gl-view').count() == 0 and pg.locator('.gl-card').count() == 1, q)

    # ── L) تلاش ──
    pg.fill('#gl-list-q', 'LEA-1234'); pg.wait_for_timeout(200)
    c1 = pg.locator('.gl-card').count()
    pg.fill('#gl-list-q', 'مشکوک'); pg.wait_for_timeout(200)
    c2 = pg.locator('.gl-card').count()
    pg.fill('#gl-list-q', 'کوئی ایسا لفظ نہیں'); pg.wait_for_timeout(200)
    c3 = pg.locator('.gl-card').count()
    pg.fill('#gl-list-q', ''); pg.evaluate("_glListFilter('')")
    check('list search: vehicle / entry text / no-match', (c1, c2, c3) == (1, 1, 0), (c1, c2, c3))
    pg.evaluate("showPage('dashboard', null)"); pg.wait_for_timeout(900)
    pg.fill('#sr-query', '03032333981'); pg.wait_for_timeout(1500)
    srch = text(pg, '#sr-results')
    check('main search finds the gasht by mobile (without dash) — card «گشت»', 'گشت' in srch and 'وقاص ٹاؤن' in srch, srch[:120])
    pg.locator('#sr-results div[onclick^="openGashtLog"]').first.click(); pg.wait_for_timeout(1500)
    check('search result opens that gasht', pg.locator('#gl-doc').count() == 1 and 'وقاص ٹاؤن' in text(pg, '#gl-doc [data-k=area]'))
    pg.evaluate("_glClose(true)"); pg.wait_for_timeout(400)

    # ── M) کاپی (clipboard) ──
    pg.click('.gl-card .gl-act:has-text("کاپی")'); pg.wait_for_timeout(500)
    clip = pg.evaluate("""(async () => { const it = (await navigator.clipboard.read())[0];
      return { types: it.types, html: await (await it.getType('text/html')).text(), text: await (await it.getType('text/plain')).text() }; })()""")
    check('copy: formatted report (tables) + full text, no new record', '<table' in clip['html'] and 'dir="rtl"' in clip['html'] and 'گشت رپورٹ' in clip['text'] and '0303-2333981' in clip['text'] and len(db(pg)) == 1, clip['types'])

    # ── N) اندراج حذف ──
    pg.click('.gl-card .gl-act:has-text("ترمیم")'); pg.wait_for_selector('#gl-doc'); pg.wait_for_timeout(600)
    pg.evaluate("_glEntryDel(2)"); pg.wait_for_timeout(700)
    check('entry delete (confirmed): 2 entries left on server', len(db(pg)[0]['data']['entries']) == 2)

    # ── O) سرور کا رد / خاموش روک — «محفوظ» نہیں ──
    server(pg, silent=['gasht_logs:update']); toasts(pg)
    cell(pg, 'staff', 'HC محمد اسلم 1122')
    pg.evaluate("_glSave()"); pg.wait_for_timeout(600)
    t = toasts(pg)
    check('server silently blocks update (expired) → clear failure, no «محفوظ», stays unsaved', has(t, 'error', 'محفوظ نہیں ہوا') and no_success(t) and 'غیر محفوظ' in text(pg, '#gl-state') and 'ساجد' in db(pg)[0]['data']['f']['staff'], t)
    server(pg, fail=['gasht_logs:update']); toasts(pg)
    pg.evaluate("_glSave()"); pg.wait_for_timeout(600)
    t = toasts(pg)
    check('server refuses update (RLS) → clear failure', has(t, 'error', 'محفوظ نہیں ہوا') and no_success(t), t)
    server(pg); pg.evaluate("_glSave()"); pg.wait_for_timeout(600)
    check('after server OK → saved', 'ساجد' not in db(pg)[0]['data']['f']['staff'] and 'محفوظ' == text(pg, '#gl-state').strip(), text(pg, '#gl-state'))

    # ── P) حذف — «حذف شدہ مواد» میں نقل کے بغیر نہیں؛ بحالی ──
    gid = db(pg)[0]['id']
    pg.evaluate("_glClose(true)"); pg.wait_for_timeout(300)
    server(pg, fail=['recycle_bin:insert']); toasts(pg)
    pg.evaluate(f"_glDelete('{gid}')"); pg.wait_for_timeout(800)
    t = toasts(pg)
    check('delete: bin copy refused → gasht kept', len(db(pg)) == 1 and has(t, 'error', 'حذف نہیں ہوا'), t)
    server(pg); toasts(pg)
    pg.evaluate(f"_glDelete('{gid}')"); pg.wait_for_timeout(800)
    binr = db(pg, 'recycle_bin')
    check('delete: normal → gone, full copy in «حذف شدہ مواد» (type gasht)', not db(pg) and len(binr) == 1 and binr[0]['item_type'] == 'gasht' and len(binr[0]['item_data']['data']['entries']) == 2, [x['item_type'] for x in binr])
    pg.evaluate("showPage('bin', null)"); pg.wait_for_timeout(1500)
    bin_txt = text(pg, '#page-content')
    check('bin page lists it under «گشت لاگ»', 'گشت لاگ' in bin_txt and 'وقاص ٹاؤن' in bin_txt, bin_txt[:160])
    pg.evaluate(f"_binRestore('{binr[0]['id']}', 'gasht')"); pg.wait_for_timeout(800)
    check('bin restore → gasht back with its entries', len(db(pg)) == 1 and len(db(pg)[0]['data']['entries']) == 2 and not db(pg, 'recycle_bin'))

    # ── Q) sql/104 ابھی نہیں چلی (table نہیں) ──
    server(pg, noTable=['gasht_logs'])
    pg.evaluate("localStorage.removeItem(_glCacheKey()); 0")
    pg.evaluate("showPage('gasht', null)"); pg.wait_for_timeout(1500)
    check('table missing: page explains sql/104, nothing crashes', 'sql/104' in text(pg, '.gl-note'), text(pg, '.gl-note'))
    pg.evaluate("_glNew()"); pg.wait_for_selector('#gl-doc'); pg.wait_for_timeout(600)
    cell(pg, 'area', 'ممتاز آباد'); toasts(pg)
    pg.evaluate("_glSave()"); pg.wait_for_timeout(700)
    t = toasts(pg)
    loc = pg.evaluate("_glLocal().filter(x => x._pending).map(x => x.area)")
    check('table missing: saved on this device (pending), honest message', loc == ['ممتاز آباد'] and has(t, 'info', 'sql/104') and no_success(t), (loc, t))
    server(pg)
    pg.evaluate("_glClose(true)"); pg.wait_for_timeout(300)
    pg.evaluate("_glLoadList()"); pg.wait_for_timeout(1200)
    srv = [r['area'] for r in db(pg)]
    loc = pg.evaluate("_glLocal().filter(x => x._pending).length")
    check('after sql/104 runs: pending gasht goes to the server by itself', 'ممتاز آباد' in srv and loc == 0, (srv, loc))

    # ── R) آف لائن ──
    pg.evaluate("showPage('gasht', null)"); pg.wait_for_timeout(900)
    ctx.set_offline(True); pg.wait_for_timeout(200)
    pg.evaluate("_glNew()"); pg.wait_for_selector('#gl-doc'); pg.wait_for_timeout(500)
    cell(pg, 'area', 'شاہ رکن عالم کالونی'); toasts(pg)
    add_entry(pg, 'حساس مقامات کی چیکنگ', 'بینک اسکوائر', 'بینک اور پیٹرول پمپ چیک کیے۔')
    t = toasts(pg)
    check('offline: entry + gasht kept on this device, clear message', has(t, 'info', 'انٹرنیٹ نہیں') and pg.evaluate("_glLocal().some(x => x._pending && x.area === 'شاہ رکن عالم کالونی')"), t)
    ctx.set_offline(False); pg.wait_for_timeout(2600)
    check('internet back: offline gasht reaches the server automatically', any(r['area'] == 'شاہ رکن عالم کالونی' and len(r['data']['entries']) == 1 for r in db(pg)), [r['area'] for r in db(pg)])
    pg.evaluate("_glClose(true)"); pg.wait_for_timeout(300)

    # ── S) لمبی رپورٹ — اگلے صفحے پر، ہر صفحہ A4 ──
    pg.evaluate("_glNew()"); pg.wait_for_selector('#gl-doc'); pg.wait_for_timeout(500)
    pg.evaluate("""(() => { for (let i = 0; i < 28; i++) _glMeta.entries.push({ id: 'x' + i, t: '1' + (i % 10) + ':' + String(10 + i).padStart(2, '0'),
      kind: i % 2 ? 'ناکہ بندی' : '15 کال', place: 'مقام نمبر ' + (i + 1), detail: 'تفصیل و کارروائی — اندراج نمبر ' + (i + 1) + '، جانچ کے لیے لمبا متن تاکہ رپورٹ اگلے صفحے تک جائے۔' });
      _glRedrawEntries(); return 0; })()""")
    s3, i3, t3 = print_pdf(pg, 'g_d07_long', 'button')
    pages = int((re.findall(r'Pages:\s+(\d+)', i3) or ['0'])[0])
    check('long report: continues on next page(s), every page A4', pages >= 2 and '(A4)' in i3, re.findall(r'Pages:.*|Page size:.*', i3))
    pg.evaluate("_glClose(true)"); pg.wait_for_timeout(300)

    # ── T) میعاد ختم: نیا گشت نہیں کھلتا ──
    pg.evaluate("window.__g = DIO.sub.guard; DIO.sub.guard = () => false; _glNew(); DIO.sub.guard = window.__g; 0"); pg.wait_for_timeout(300)
    check('expired subscription: new gasht blocked (read/print stay open)', pg.locator('#gl-view').count() == 0)
    check('no JS errors (desktop)', not errs, errs[:4])
    ctx.close()

    # ══════════════════════════ MOBILE ══════════════════════════
    mctx, mp, merrs = open_app(b, viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    mctx.grant_permissions(['geolocation'], origin=BASE.rstrip('/'))
    mp.evaluate(TOAST_HOOK); mp.on('dialog', lambda d: d.accept())
    mp.evaluate("DIOEntry.hub()"); mp.wait_for_timeout(300)
    check('mobile: hub includes «گشت»', 'گشت' in [x.strip() for x in mp.locator('.dio-hub button').all_inner_texts()])
    mp.locator('.dio-hub button', has_text='گشت').click(); mp.wait_for_timeout(1800)
    check('mobile: hub «گشت» with no active gasht → new gasht document', mp.locator('#gl-doc').count() == 1)
    cell(mp, 'area', 'نیو ملتان')
    mc = add_entry(mp, '15 کال', 'نیو ملتان چوک', 'کال پر موقع پر پہنچے۔', mobile='03001234567')
    check('mobile: entry card — no mic (desktop-only rule), mobile formatted', not mc['mic'] and mc['mob'] == '0300-1234567', mc)
    g = mp.evaluate("""(() => { const d = document.getElementById('gl-doc').getBoundingClientRect(), s = document.getElementById('gl-scroll');
      const row = document.querySelector('#gl-doc .gl-erow'); const st = document.querySelector('.gl-strip').getBoundingClientRect();
      const vis = sel => { const r = document.querySelector(sel).getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; };
      return { docW: Math.round(d.width), scrW: s.clientWidth, hScroll: s.scrollWidth > s.clientWidth + 1, pageScroll: document.documentElement.scrollWidth > innerWidth + 1,
        rowDisplay: row ? getComputedStyle(row).display : null, fs: getComputedStyle(document.querySelector('#gl-doc [data-k=area]')).fontSize,
        addVis: vis('.gl-addbtn'), saveVis: vis('.gl-savebtn'), printVis: vis('.gl-strip [data-dio-print]'), gap: Math.round(d.top - st.bottom) }; })()""")
    check('mobile: full width, no sideways scroll, entries as cards, 14pt', g['docW'] == g['scrW'] and not g['hScroll'] and not g['pageScroll'] and g['rowDisplay'] == 'block' and g['fs'] == '18.6667px' and g['gap'] == 0, g)
    check('mobile: اندراج / محفوظ / پرنٹ buttons visible first', g['addVis'] and g['saveVis'] and g['printVis'], g)
    mp.screenshot(path=OUT + '/g_m01_doc.png')
    ms, mi, mt = print_pdf(mp, 'g_m02_print', 'button')
    check('mobile print: A4 paper (table, not cards), no buttons', ms['inHost'] and '(A4)' in mi and not any(w in mt for w in STRIP_WORDS) and '0300-1234567' in mt, re.findall(r'Page size:.*', mi))
    mp.evaluate("_glClose(true)"); mp.wait_for_timeout(500)
    ml = mp.evaluate("""(() => { const a = [...document.querySelectorAll('.gl-card .gl-act')]; const ban = document.querySelector('.gl-active');
      return { n: a.length, minH: Math.min(...a.map(x => x.getBoundingClientRect().height)), overflow: document.documentElement.scrollWidth > innerWidth + 1,
        banBtns: ban ? [...ban.querySelectorAll('button')].map(x => Math.round(x.getBoundingClientRect().height)) : [] }; })()""")
    check('mobile list: 6 touch-size actions, active banner buttons ≥44px, no overflow', ml['n'] == 6 and ml['minH'] >= 44 and not ml['overflow'] and ml['banBtns'] and min(ml['banBtns']) >= 44, ml)
    mp.screenshot(path=OUT + '/g_m03_list.png')
    check('no JS errors (mobile)', not merrs, merrs[:4])
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} passed')
json.dump(R, open(OUT + '/gasht_results.json', 'w'), ensure_ascii=False, indent=1)
sys.exit(1 if fails else 0)
