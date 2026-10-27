"""(v560) اصل ایپ کی جانچ — Desktop 1366x768 + Mobile 390x844

افسر کی ہدایات (27 اکتوبر 2026):
  • اردو فونٹ: صرف Jameel Noori Nastaleeq — اسی سائٹ پر (fonts/)، sw.js میں پہلے سے cache، آف لائن بھی؛
    کوئی متبادل فونٹ نہیں (Noto / CDN / local نہیں)؛ پرنٹ اور PDF بھی اسی فونٹ میں
  • فونٹ کے سائز صرف pt میں — px کہیں نہیں (اسکرین، پرنٹ، شیئر)
  • محفوظ → صفحہ دوبارہ کھولیں → ڈیٹا موجود

چلانا: README.md — `python3 v560_test.py` (poppler درکار: pdffonts / pdfinfo)
"""
import sys, os, json, subprocess, threading, http.server, functools
sys.path.insert(0, '.')
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v560/'
os.makedirs(V, exist_ok=True)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
FONT_URL = 'fonts/jameel-noori-nastaleeq.woff2'
FONT_BYTES = os.path.getsize(os.path.join(ROOT, FONT_URL))

# ── رن ٹائم پر px والے فونٹ سائز (stylesheets کی لکھی قدریں + inline style) ──
PX_SCAN = """(root) => {
  const bad = [];
  const doc = root || document;
  for (const sh of doc.styleSheets) {
    let rules; try { rules = sh.cssRules; } catch (e) { continue; }
    const walk = (rs) => { for (const r of rs) {
      if (r.cssRules) walk(r.cssRules);
      if (r.style) { const v = r.style.getPropertyValue('font-size'); if (/px$/.test(v)) bad.push((r.selectorText || '@') .slice(0, 60) + ' {' + v + '}');
        const f = r.style.getPropertyValue('font'); if (/\\dpx/.test(f)) bad.push((r.selectorText || '@').slice(0, 60) + ' {font:' + f + '}'); }
    } };
    walk(rules);
  }
  doc.querySelectorAll('[style*="font"]').forEach(el => {
    const v = el.style.fontSize; if (/px$/.test(v)) bad.push('<' + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' style font-size:' + v + '>');
  });
  return bad.slice(0, 12);
}"""

FONT_STATE = """() => {
  const faces = [...document.fonts].filter(f => /Jameel/.test(f.family));
  const res = performance.getEntriesByType('resource').map(e => e.name);
  const body = getComputedStyle(document.body).fontFamily;
  return { faces: faces.map(f => f.status), check: document.fonts.check('14pt "Jameel Noori Nastaleeq"', 'ابج'),
           selfHosted: res.filter(u => u.includes('/fonts/jameel-noori-nastaleeq.woff2')).length,
           foreign: res.filter(u => /fonts\\.(googleapis|gstatic)\\.com|jsdelivr\\.net\\/npm\\/jameel|unpkg\\.com\\/jameel/.test(u)),
           body };
}"""

# print() کے لمحے کا کاغذ (اصل چھپائی کا خانہ #dio-print-frame) — v555 والا طریقہ
HOOK = """(() => { window.__snaps = [];
  if (window.__snapObs) return 0;
  window.__snapObs = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.id === 'dio-print-frame') { const w = n.contentWindow; w.print = function () { window.__snaps.push(w.document.documentElement.outerHTML); }; }
  })));
  window.__snapObs.observe(document.body, { childList: true }); return 0; })()"""

def ctrl_p_html(pg):
    pg.evaluate(HOOK); pg.evaluate("window.__snaps = []; window.__printCalls = 0; window.__dioPaperAuto = 'keep'; 0")
    pg.keyboard.press('Control+p')
    for _ in range(150):
        if pg.evaluate("window.__snaps.length") or pg.evaluate("window.__printCalls"): break
        pg.wait_for_timeout(200)
    h = pg.evaluate("window.__snaps[0] || ''")
    pg.evaluate("document.getElementById('dio-print-frame') && document.getElementById('dio-print-frame').remove(); window.__dioPaperAuto = undefined; 0")
    return h

def html_pdf(b, html, name):
    fn = os.path.join(ROOT, '_v560_' + name + '.html')
    open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + html)
    c = b.new_context(); c.route('**/*', route); q = c.new_page()
    q.goto(BASE + '_v560_' + name + '.html'); q.wait_for_timeout(1500); q.evaluate('document.fonts.ready'); q.wait_for_timeout(300)
    q.pdf(path=V + name + '.pdf', prefer_css_page_size=True, print_background=True)
    c.close(); os.remove(fn)
    subprocess.run(['pdftoppm', '-png', '-r', '60', '-singlefile', V + name + '.pdf', V + name])
    return subprocess.run(['pdffonts', V + name + '.pdf'], capture_output=True, text=True).stdout.splitlines()[2:]

# ── اسکرین پر ہر نظر آنے والا اردو متن (اور ::before/::after) Jameel میں ہو — کوئی متبادل فونٹ نہیں ──
URDU_SCAN = r"""() => {
  const out = [], ok = ff => /Jameel Noori Nastaleeq|Amiri/.test(ff);   // Amiri: قرآن/عربی (لینڈنگ)
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) {
    if (!/[؀-ۿ]/.test(n.nodeValue)) continue;
    const el = n.parentElement; if (!el) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
    if (!ok(cs.fontFamily)) out.push(el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + ' «' + n.nodeValue.trim().slice(0, 20) + '» ' + cs.fontFamily.slice(0, 40));
  }
  document.querySelectorAll('*').forEach(el => ['::before', '::after'].forEach(ps => {
    const c = getComputedStyle(el, ps), t = c.content || '';
    const txt = t.startsWith('attr(') ? (el.getAttribute(t.slice(5, -1)) || '') : t;
    if (/[؀-ۿ]/.test(txt) && !ok(c.fontFamily)) out.push(el.tagName.toLowerCase() + ps + ' «' + txt.slice(0, 20) + '» ' + c.fontFamily.slice(0, 40));
  }));
  return out.slice(0, 10);
}"""

def seed_case(pg):
    pg.evaluate("""(() => { const c = window.__db.cases.find(c => c.id === 'c1');
      Object.assign(c, { fir_number:'663/26', fir_date:'15/10/2026', section_of_law:'379 ت پ', case_station:'صدر ملتان',
        complainant:'محمد امجد حسین ولد عاشق حسین قوم آرائیں سکنہ بیرون دہلی گیٹ ملتان' }); })()""")

def font_and_pt(b, tag, vp, mobile=False):
    args = dict(viewport=vp)
    if mobile: args.update(is_mobile=True, has_touch=True)
    ctx, pg, errs = open_app(b, **args)
    seed_case(pg)
    st = pg.evaluate(FONT_STATE)
    check(f'{tag}: اردو فونٹ Jameel اسی سائٹ سے لوڈ (fonts/jameel-noori-nastaleeq.woff2)', st['selfHosted'] >= 1 and 'loaded' in st['faces'] and st['check'], st)
    check(f'{tag}: Google / jsdelivr / unpkg سے کوئی فونٹ نہیں', not st['foreign'], st['foreign'])
    check(f'{tag}: پورے نظام کا فونٹ صرف Jameel — کوئی متبادل نہیں', st['body'].replace('"', "'") == "'Jameel Noori Nastaleeq'", st['body'])
    # ── ہر صفحہ: px والا کوئی فونٹ سائز نہیں ──
    pages = ['dashboard', 'cases', 'reminders', 'incident', 'suspects', 'templates', 'search', 'law', 'fivec', 'bin', 'backup', 'ahkamat', 'court', 'settings', 'help']
    bad, ubad = {}, {}
    for p in pages:
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; try{closeModal()}catch(e){}")
        pg.evaluate(f"showPage('{p}', null)"); pg.wait_for_timeout(900)
        x = pg.evaluate(PX_SCAN)
        if x: bad[p] = x
        u = pg.evaluate(URDU_SCAN)
        if u: ubad[p] = u
    check(f'{tag}: {len(pages)} صفحات — کسی stylesheet یا inline انداز میں px فونٹ سائز نہیں', not bad, bad)
    check(f'{tag}: {len(pages)} صفحات — ہر اردو متن (سرخیاں، کارڈ کے عنوان سمیت) صرف Jameel میں', not ubad, ubad)
    pg.evaluate("showPage('cases', null)"); pg.wait_for_timeout(700)
    pg.evaluate("openAddCaseModal()"); pg.wait_for_selector('#cf-fir'); pg.wait_for_timeout(600)
    x = pg.evaluate(PX_SCAN)
    check(f'{tag}: نیا اندراج کارڈ — px فونٹ سائز نہیں', not x, x)
    u = pg.evaluate(URDU_SCAN)
    check(f'{tag}: نیا اندراج کارڈ — اردو صرف Jameel میں', not u, u)
    pg.screenshot(path=f'{V}{tag}_new_case_card.png')
    pg.evaluate("closeModal()"); pg.wait_for_timeout(300)
    # ── دستاویزات: اسکرین پر px نہیں؛ پرنٹ (Ctrl+P) کی PDF میں فونٹ صرف Jameel، embedded ──
    docs = [('zimni', "_openMisalEditor('zamniyat')", ['_newZimni()']), ('challan', "openReport173WithType('challan_mukammal')", []),
            ('saza_slip', "_openMisalEditor('saza_slip')", []), ('rfa', "_openMisalEditor('rfa_form')", ['_newRfa()']),
            ('index_naql', "_openMisalEditor('index_naql')", []), ('darkhwast', "_openMisalEditor('darkhwastain')", [])]
    last = ['']
    for name, opener, steps in docs:
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; try{closeModal()}catch(e){}")
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate(opener); pg.wait_for_timeout(1800)
        for s in steps:
            pg.evaluate(s); pg.wait_for_timeout(1200)
        pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)
        x = pg.evaluate(PX_SCAN)
        check(f'{tag} {name}: اسکرین پر px فونٹ سائز نہیں', not x, x)
        u = pg.evaluate(URDU_SCAN)
        check(f'{tag} {name}: اسکرین (کاغذ + اوپر کی پٹی) پر اردو صرف Jameel میں', not u, u)
        ff = pg.evaluate("(() => { const d = DIO.forms && DIO.forms.findPaper(); return d ? getComputedStyle(d).fontFamily : null; })()")
        okff = ff is not None and 'Noto' not in ff and (ff.replace('"', "'") == "'Jameel Noori Nastaleeq'" or (name == 'rfa' and ff.startswith('Arial')))
        check(f'{tag} {name}: کاغذ کا فونٹ صرف Jameel (RFA انگریزی فارم: Arial، اردو Jameel) — کوئی متبادل نہیں', okff, ff)
        html = ctrl_p_html(pg)
        check(f'{tag} {name}: Ctrl+P سے اپنا پرنٹ (کاغذ کا HTML ملا)', len(html) > 1000, len(html))
        if html:
            fonts = html_pdf(pg.context.browser, html, f'{tag}_{name}')
            names = sorted({l.split()[0] for l in fonts if l.strip()})
            jam = [l for l in fonts if 'Jameel' in l]
            import re as _re0
            urdu = bool(_re0.search(r'[\u0600-\u06FF]', _re0.sub(r'<[^>]+>', ' ', _re0.sub(r'<(style|script|title)[\s\S]*?</\1>', ' ', html))))
            check(f'{tag} {name}: چھپے کاغذ (PDF) میں اردو صرف Jameel (embedded)، Noto نہیں' + ('' if urdu else ' — اس خالی فارم میں اردو متن نہیں'),
                  (bool(jam) and all(' yes ' in l for l in jam) if urdu else True) and not any('Noto' in n for n in names), names)
            import re as _re
            pxs = _re.findall(r'font-size\s*:\s*[\d.]+px', html)
            check(f'{tag} {name}: پرنٹ HTML میں px فونٹ سائز نہیں، فونٹ اسی سائٹ کا، Google/CDN نہیں',
                  not pxs and 'fonts.googleapis' not in html and 'jsdelivr.net/npm/jameel' not in html and FONT_URL in html, pxs[:4])
            last[0] = html
    # ── PDF شیئر (چھپے کاغذ سے) Jameel کے ساتھ ──
    ok = pg.evaluate("""async (h) => { try { const b = await DIO.share.pdf({ html: h }, 'v560'); return b && b.size > 20000 ? 'ok:' + b.size : 'small:' + (b && b.size); } catch (e) { return 'ERR ' + e.message; } }""", last[0])
    check(f'{tag}: PDF شیئر Jameel کے ساتھ بنتی ہے', str(ok).startswith('ok:'), ok)
    check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:4])
    ctx.close()

def no_font(b, tag, vp, mobile=False):
    """فونٹ کی فائل بالکل نہ ملے (مثلاً پہلی بار بغیر انٹرنیٹ): نہ پرنٹ نہ PDF کسی دوسرے فونٹ میں — صاف پیغام"""
    args = dict(viewport=vp)
    if mobile: args.update(is_mobile=True, has_touch=True)
    ctx = b.new_context(service_workers='block', timezone_id='Asia/Karachi', **args)
    def rt(r):
        if 'jameel-noori-nastaleeq' in r.request.url: return r.abort()
        return route(r)
    ctx.route('**/*', rt)
    ctx.add_init_script(PRINT_HOOK + "\nlocalStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));")
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
    pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    pg.wait_for_timeout(2500); pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
    pg.evaluate("window.__toasts = []; const o = window.showToast; window.showToast = function (m) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1500); pg.evaluate("_newZimni()"); pg.wait_for_timeout(1300)
    pg.evaluate(HOOK); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = 'keep'; 0")
    pg.keyboard.press('Control+p')
    for _ in range(200):
        if pg.evaluate("window.__snaps.length") or any('اردو فونٹ' in t for t in pg.evaluate('window.__toasts')): break
        pg.wait_for_timeout(250)
    snaps, toasts = pg.evaluate("window.__snaps.length"), pg.evaluate('window.__toasts')
    check(f'{tag}: فونٹ نہ ملے تو Ctrl+P دوسرے فونٹ میں نہیں چھاپتا — صاف پیغام', snaps == 0 and any('اردو فونٹ' in t for t in toasts), (snaps, toasts[-2:]))
    err = pg.evaluate("""async () => { try { const b = await DIO.share.pdf(DIO.forms.findPaper(), 'v560'); return 'made:' + b.size; } catch (e) { return 'ERR ' + e.message; } }""")
    check(f'{tag}: فونٹ نہ ملے تو PDF بھی دوسرے فونٹ میں نہیں بنتی — صاف پیغام', 'اردو فونٹ' in str(err), err)
    check(f'{tag}: کوئی JS غلطی نہیں (فونٹ کے بغیر)', not errs, errs[:4])
    ctx.close()

def save_reload(b, tag, vp, mobile=False):
    """محفوظ → صفحہ دوبارہ کھولیں → ڈیٹا موجود (آزمائشی سرور: __db کو reload کے پار رکھا جاتا ہے)"""
    args = dict(viewport=vp)
    if mobile: args.update(is_mobile=True, has_touch=True)
    ctx = b.new_context(service_workers='block', timezone_id='Asia/Karachi', **args)
    ctx.route('**/*', route)
    ctx.add_init_script(PRINT_HOOK + """
      localStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));
      try { const s = sessionStorage.getItem('__db_keep'); if (s) window.__db = JSON.parse(s); } catch (e) {}
      window.addEventListener('beforeunload', () => { try { sessionStorage.setItem('__db_keep', JSON.stringify(window.__db)); } catch (e) {} });""")
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    def login():
        pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
        pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
        pg.wait_for_timeout(2500); pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
    login()
    pg.evaluate("showPage('cases', null)"); pg.wait_for_timeout(800)
    pg.evaluate("openAddCaseModal()"); pg.wait_for_selector('#cf-fir'); pg.wait_for_timeout(400)
    pg.evaluate("""() => { const v = (id, x) => { const el = document.getElementById(id); el.value = x; };
      v('cf-fir', '777/26'); v('cf-date', '20/10/2026'); v('cf-occurrence-date', '19/10/2026');
      v('cf-section-search', '411 ت پ'); v('cf-occurrence-place', 'حسین آگاہی ملتان');
      v('cf-complainant', 'محمد عارف ولد محمد یوسف قوم انصاری سکنہ حسین آگاہی ملتان'); }""")
    pg.evaluate("saveNewCase()"); pg.wait_for_timeout(1200)
    n0 = pg.evaluate("window.__db.cases.filter(c => c.fir_number === '777/26').length")
    check(f'{tag}: نیا مقدمہ محفوظ', n0 == 1, n0)
    pg.reload(); pg.wait_for_timeout(1000); login()
    pg.evaluate("showPage('cases', null)"); pg.wait_for_timeout(1200)
    n1 = pg.evaluate("window.__db.cases.filter(c => c.fir_number === '777/26').length")
    txt = pg.evaluate("document.querySelector('.page-content') ? document.querySelector('.page-content').innerText.replace(/\\s+/g, '') : ''")
    check(f'{tag}: صفحہ دوبارہ کھولنے کے بعد مقدمہ 777/26 سرور پر بھی اور فہرست میں بھی', n1 == 1 and '777/26' in txt, (n1, txt[:120]))
    pg.screenshot(path=f'{V}{tag}_after_reload_cases.png')
    check(f'{tag}: کوئی JS غلطی نہیں (محفوظ/reload)', not errs, errs[:4])
    ctx.close()

def offline_font(b):
    """service worker کے ساتھ: فونٹ پہلے سے cache، پھر بغیر انٹرنیٹ صفحہ کھولنے پر بھی Jameel"""
    port = 8790
    class Q(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
        def log_message(self, *a): pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', port), Q)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    base = f'http://localhost:{port}/'
    def rt(r):
        u = r.request.url
        if u.startswith(base): return r.continue_()
        return route(r)
    ctx = b.new_context(service_workers='allow', viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
    ctx.route('**/*', rt)
    pg = ctx.new_page()
    pg.goto(base + 'index.html'); pg.wait_for_timeout(1500)
    pg.evaluate("navigator.serviceWorker.ready.then(() => 1)")
    have = 0
    for _ in range(40):
        have = pg.evaluate(f"""async () => {{ const c = await caches.open('digital-io-v560'); const r = await c.match('/{FONT_URL}');
                                              return r ? (await r.arrayBuffer()).byteLength : 0; }}""")
        if have: break
        pg.wait_for_timeout(500)
    check('service worker: فونٹ (9.8MB) پہلے سے cache میں — پوری فائل', have == FONT_BYTES, f'{have} / {FONT_BYTES}')
    pg.reload(); pg.wait_for_timeout(2000)     # اب SW اس صفحے کو کنٹرول کرتا ہے
    ctx.set_offline(True)
    pg.reload(); pg.wait_for_timeout(3500)
    st = pg.evaluate(FONT_STATE)
    online = pg.evaluate("navigator.onLine")
    w = pg.evaluate("""() => { const s = document.createElement('span'); s.style.cssText = 'font-family:"Jameel Noori Nastaleeq";font-size:20pt;position:absolute;';
                               s.textContent = 'تفتیشی افسر کا چھوٹو'; document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove(); return w; }""")
    check('بغیر انٹرنیٹ: صفحہ کھلا اور Jameel cache سے لوڈ (کوئی دوسرا فونٹ نہیں)', (not online) and 'loaded' in st['faces'] and st['check'], dict(st, online=online, width=round(w, 1)))
    pg.screenshot(path=f'{V}offline_mobile_landing.png')
    ctx.close(); srv.shutdown()

with sync_playwright() as p:
    b = p.chromium.launch()
    font_and_pt(b, 'desktop', {'width': 1366, 'height': 768})
    font_and_pt(b, 'mobile', {'width': 390, 'height': 844}, mobile=True)
    no_font(b, 'desktop', {'width': 1366, 'height': 768})
    no_font(b, 'mobile', {'width': 390, 'height': 844}, mobile=True)
    save_reload(b, 'desktop', {'width': 1366, 'height': 768})
    save_reload(b, 'mobile', {'width': 390, 'height': 844}, mobile=True)
    offline_font(b)
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} PASS')
sys.exit(1 if fails else 0)
