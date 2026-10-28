"""(v563) اصل ایپ کی جانچ — MS Word کی کلیدیں، پورے سسٹم کا ایک ہی سننے والا (Desktop + Mobile)

افسر کا حکم (Task 3، 28 اکتوبر 2026):
  • Ctrl+S کیس کے اندر براؤزر کی HTML فائل نہیں — کام محفوظ + «محفوظ ہو گیا»
  • MS Word کی تمام عام کلیدیں ہر دستاویز میں: X/C/V، کھینچ کر منتقل، F (مرکزی تلاش)، H، B/I/U، Z/Y
    (اپنی تاریخ، کم از کم 20 قدم)، J/R/L/E، [ / ]، A (صرف دستاویز)، P (= پرنٹ بٹن)
  • Tab = 0.5 انچ (1.27 سینٹی میٹر)، Shift+Tab واپس؛ جدول کے خانے میں اگلا / پچھلا خانہ
    (افسر کا فیصلہ: ضمنی، بیان 161، مختصر حالات، سزا اور تفصیل کے لکھنے والے خانوں میں Tab = آگے)
  • اردو کی بورڈ پر بھی (event.code) · فارمیٹنگ محفوظ → دوبارہ کھولنے (صفحہ reload) → پرنٹ → PDF → Word تک
  • براؤزر کی مخصوص کلیدیں · «شارٹ کٹس» کی فہرست اوپر کی پٹی سے (صرف کمپیوٹر)
  • Regression: مائیک (Desktop) لکھے، کوئی تیرتی پٹی نہیں

چلانا: README.md — `python3 v563_test.py` (poppler: pdftoppm / pdftotext · LibreOffice: soffice)
"""
import sys, os, re, json, subprocess, glob, shutil
sys.path.insert(0, '.')
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v563/'
os.makedirs(V, exist_ok=True)
TAB_PX = 48.0          # 1.27 cm = 0.5 in = 48 CSS px
TAB_PT = 36.0          # 0.5 in = 36 pt (PDF)

SEED = """(() => { const d = window.__db;
  d.case_witnesses = [{ id:'w1', case_id:'c1', full_name:'اکرم ولد نذیر قوم جٹ سکنہ ملتان', status:'fir_eye', witness_type:'fir', created_at:'2026-10-01' }];
  d.applications_5c = d.applications_5c || [];
  if (!d.applications_5c.some(a => a.id === 'ap1')) d.applications_5c.push({ id:'ap1', officer_id:'o1', serial_number: 1, complainant_name:'درخواست گزار', status:'pending', created_at:'2026-10-10T00:00:00Z' });
  return 0; })()"""

# پہلا سننے والا (کچھ بھی صفحے سے پہلے): ہر keydown کا انجام — براؤزر کو جانے دیا گیا یا روکا گیا
KEYLOG = """window.__kl = [];
window.addEventListener('keydown', function (e) { var r = { k: e.key, c: e.code, ctrl: e.ctrlKey, sh: e.shiftKey }; window.__kl.push(r);
  setTimeout(function () { r.dp = e.defaultPrevented; }, 0); }, true);
try { var s = sessionStorage.getItem('__dbsnap'); if (s) window.__db = JSON.parse(s); } catch (e) {}"""

HELP_JS = """
window.__hostOf = function (n) { if (n && n.nodeType !== 1) n = n.parentElement; if (!n || !n.isContentEditable) return null;
  while (n.parentElement && n.parentElement.isContentEditable) n = n.parentElement; return n; };
window.__find = function (word, rootSel) { const root = document.querySelector(rootSel) || document.body;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t;
  while ((t = w.nextNode())) { const i = t.nodeValue.indexOf(word); if (i >= 0 && t.parentElement && t.parentElement.isContentEditable) return { t: t, i: i }; } return null; };
window.__sel = function (word, rootSel, mode) { const f = __find(word, rootSel); if (!f) return false;
  const r = document.createRange();
  if (mode === 'after') { r.setStart(f.t, f.i + word.length); r.collapse(true); }
  else if (mode === 'before') { r.setStart(f.t, f.i); r.collapse(true); }
  else if (mode === 'in') { r.setStart(f.t, f.i + 1); r.collapse(true); }
  else { r.setStart(f.t, f.i); r.setEnd(f.t, f.i + word.length); }
  const h = __hostOf(f.t); try { h.focus({ preventScroll: true }); } catch (e) {}
  const s = getSelection(); s.removeAllRanges(); s.addRange(r);
  try { f.t.parentElement.scrollIntoView({ block: 'center' }); } catch (e) {} return true; };
window.__rect = function (word, rootSel) { const f = __find(word, rootSel); if (!f) return null; const r = document.createRange();
  r.setStart(f.t, f.i); r.setEnd(f.t, f.i + word.length); const b = r.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, w: b.width }; };
window.__blk = function (word, rootSel) { const f = __find(word, rootSel); if (!f) return null; let el = f.t.parentElement;
  while (el && /^inline/.test(getComputedStyle(el).display)) el = el.parentElement;
  const cs = getComputedStyle(el), ps = getComputedStyle(f.t.parentElement);
  const b = el.getBoundingClientRect(), rr = window.__rect(word, rootSel);
  let ul = '';   // text-decoration وراثتی نہیں — والدین تک دیکھو (یہی نظر آتا ہے)
  for (let x = f.t.parentElement; x; x = x.parentElement) { const d = getComputedStyle(x).textDecorationLine; if (d && d !== 'none') ul += d + ' '; if (x.isContentEditable && !(x.parentElement && x.parentElement.isContentEditable)) break; }
  return { ta: cs.textAlign, tal: cs.textAlignLast, fs: ps.fontSize, fw: ps.fontWeight, fst: ps.fontStyle,
           td: ul, bl: b.left + parseFloat(cs.paddingLeft), br: b.right - parseFloat(cs.paddingRight), wl: rr && rr.l, wr: rr && rr.r }; };
window.__wrapCheck = function (word, rootSel) { const f = __find(word, rootSel); if (!f) return null; const tags = [];
  for (let n = f.t.parentElement; n && !n.matches('[contenteditable="true"]'); n = n.parentElement) tags.push(n.tagName); return tags.join('>'); };
window.__text = function (sel) { const el = document.querySelector(sel); return el ? el.innerText : null; };
// Tab کے نشان: سطر کے بیچ کا Tab = .dio-tab؛ پیراگراف کے شروع کا Tab = پہلی سطر کا حاشیہ (text-indent: N × 1.27cm)
window.__tabn = function (rootSel) { const root = document.querySelector(rootSel); if (!root) return -1;
  let n = root.querySelectorAll('.dio-tab').length;
  root.querySelectorAll('[style*="text-indent"]').forEach(el => { const m = /^([\\d.]+)cm$/.exec(String(el.style.textIndent).trim()); if (m) n += Math.round(parseFloat(m[1]) / 1.27); });
  return n; };
// لفظ اپنی سطر کے شروع (RTL میں دایاں کنارہ) سے کتنا اندر ہے (px)
window.__indentPx = function (word, rootSel) { const f = __find(word, rootSel); if (!f) return null; let el = f.t.parentElement;
  while (el && /^inline/.test(getComputedStyle(el).display)) el = el.parentElement;
  const cs = getComputedStyle(el), b = el.getBoundingClientRect(), rr = window.__rect(word, rootSel);
  return b.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth) - rr.r; };
"""

def open2(b, mobile=False):
    vp = {'width': 390, 'height': 844} if mobile else {'width': 1366, 'height': 768}
    args = dict(viewport=vp, accept_downloads=True)
    if mobile: args.update(has_touch=True, is_mobile=True)
    ctx = b.new_context(service_workers='block', timezone_id='Asia/Karachi',
                        geolocation={'latitude': 30.157458, 'longitude': 71.524918},
                        permissions=['geolocation', 'clipboard-read', 'clipboard-write'], **args)
    ctx.route('**/*', route)
    ctx.add_init_script(PRINT_HOOK + "\nlocalStorage.setItem('digital_io_sho', JSON.stringify({name:'ندیم عباس شاد', rank:'SI/SHO'}));\n" + KEYLOG + HELP_JS)
    pg = ctx.new_page()
    errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.on('dialog', lambda d: d.accept())
    login(pg)
    return ctx, pg, errs

def login(pg):
    pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
    pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    pg.wait_for_timeout(2500)
    pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}")
    pg.wait_for_timeout(300)
    pg.evaluate("document.fonts.ready")
    pg.evaluate(SEED)
    pg.evaluate("""(() => { window.__toasts = []; const o = window.showToast;
      window.showToast = function (m, t) { window.__toasts.push([t || 'info', String(m)]); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()""")

def reload_keep_db(pg):
    """«محفوظ → reload»: سرور کا ڈیٹا (آزمائشی) برقرار، آلے کا ذخیرہ برقرار — پورا صفحہ نئے سرے سے"""
    pg.evaluate("sessionStorage.setItem('__dbsnap', JSON.stringify(window.__db)); 0")
    login(pg)
    pg.evaluate("sessionStorage.removeItem('__dbsnap'); 0")

def klog(pg): return pg.evaluate("window.__kl.splice(0)")
def toasts(pg): return pg.evaluate("window.__toasts.splice(0)")
def prevented(log, code):
    r = [x for x in log if x.get('c') == code and x.get('ctrl')]
    return bool(r) and all(x.get('dp') for x in r)

def cdp_key(pg, cdp, code, key, vk, mods=2):
    """کی بورڈ اردو پر: Ctrl + اصل کلید، مگر key اردو حرف (جیسا Windows کا اردو کی بورڈ بھیجتا ہے)"""
    for t in ('rawKeyDown', 'keyUp'):
        cdp.send('Input.dispatchKeyEvent', {'type': t, 'modifiers': mods, 'key': key, 'code': code, 'windowsVirtualKeyCode': vk})
    pg.wait_for_timeout(250)

def capture_print(pg):
    """چھپائی کا HTML (پرنٹ فریم) — اصل پرنٹ کی جگہ"""
    pg.evaluate("""(() => { window.__snaps = []; if (window.__snapObs) return 0;
      window.__snapObs = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.id === 'dio-print-frame') { const w = n.contentWindow; w.print = function () { window.__snaps.push(w.document.documentElement.outerHTML); }; }
      }))); window.__snapObs.observe(document.body, { childList: true }); return 0; })()""")
    pg.evaluate("window.__snaps = []; window.__dioPaperAuto = 'legal'; 0")

def wait_snap(pg, n=1, tries=80):
    for _ in range(tries):
        if pg.evaluate("(window.__snaps || []).length") >= n: break
        pg.wait_for_timeout(200)
    return pg.evaluate("window.__snaps.slice()")

def html_to_pdf(b, html, name):
    fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_v563_' + name + '.html')
    open(fn, 'w', encoding='utf-8').write(html if html.lstrip().lower().startswith('<!doctype') else '<!DOCTYPE html>' + html)
    c = b.new_context(); c.route('**/*', route); q = c.new_page()
    try:
        q.goto(BASE + '_v563_' + name + '.html'); q.wait_for_timeout(1500); q.evaluate('document.fonts.ready')
        q.pdf(path=V + name + '.pdf', prefer_css_page_size=True, print_background=True)
    finally:
        c.close(); os.remove(fn)
    subprocess.run(['pdftoppm', '-png', '-r', '60', '-f', '1', '-l', '1', V + name + '.pdf', V + name], check=False)
    return V + name + '.pdf'

def pdf_words(pdf, words):
    """pdftotext -bbox: انگریزی نشان (REFX / TABX) کی جگہ (pt)"""
    out = subprocess.run(['pdftotext', '-bbox', pdf, '-'], capture_output=True, text=True).stdout
    found = {}
    for m in re.finditer(r'<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="([\d.]+)" yMax="([\d.]+)">([^<]*)</word>', out):
        w = m.group(5)
        for k in words:
            if k in w and k not in found: found[k] = (float(m.group(1)), float(m.group(2)), float(m.group(3)), float(m.group(4)))
    return found

def share_download(pg, opener_js, kind, path):
    pg.evaluate("document.getElementById('dio-share-box') && document.getElementById('dio-share-box').remove()")
    pg.evaluate(opener_js)
    pg.wait_for_selector('#dio-share-box', timeout=20000)
    with pg.expect_download(timeout=90000) as d:
        pg.click(f'#dio-share-box button[data-k="{kind}"]')
    d.value.save_as(path)
    pg.wait_for_timeout(300)
    return path

def soffice_pdf(src):
    d = V + 'lo/'; os.makedirs(d, exist_ok=True)
    subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', d, src], capture_output=True, timeout=180)
    out = d + os.path.splitext(os.path.basename(src))[0] + '.pdf'
    return out if os.path.exists(out) else None

def press(pg, k, wait=120):
    pg.keyboard.press(k); pg.wait_for_timeout(wait)

# ═══ دستاویزات (افسر کی فہرست، قاعدہ 1) ═════════════════════════════════
#  root: دستاویز کی جڑ · prose: لکھنے والا خانہ · enter: کیا Enter سے نئی سطر بنتی ہے
#  cell: جدول کا (غیر تحریری) خانہ — Tab سے اگلا خانہ · save: محفوظ کا ثبوت (سرور کی جدول)
#  reopen: reload کے بعد محفوظ دستاویز دوبارہ کھولنا · print: «پرنٹ» بٹن کا اپنا کام
WS = "openCaseWorkspace('c1'); await new Promise(r => setTimeout(r, 1400));"
EDITORS = [
  # mode: lines = Enter سے الگ سطریں · start = خانے کے شروع میں Tab (چالان کا کالم 7: Enter نئی سطر نہیں بناتا)
  #       inline = ایک سطر کا خانہ (نقشے کا نشان) · cells = صرف جدول کے خانے (RFA)
  dict(key='zimni', name='ضمنی (بیرونی)', root='#ch173-doc', mode='lines',
       open=WS + "_openMisalEditor('zamniyat'); await new Promise(r => setTimeout(r, 1600)); _newZimni();",
       prose='#ch173-doc .zf-body', cell='#ch173-doc td.zf-c-action [contenteditable="true"], #ch173-doc td.zf-c-action', table='zimni_reports',
       reopen=WS + "_openMisalEditor('zamniyat'); await new Promise(r => setTimeout(r, 2000)); const z = (window.__db.zimni_reports || []).slice(-1)[0]; if (z) _openZimni(String(z.id));",
       print="_printZimniCurrent()", share="_dioShareCurrent()"),
  dict(key='androoni', name='بیان 161 (اندرونی ضمنی)', root='#ch173-doc', mode='lines',
       open=WS + "_openMisalEditor('statements_161'); await new Promise(r => setTimeout(r, 1600)); _newZimniA(); await new Promise(r => setTimeout(r, 1500));"
            "const o = [...document.querySelectorAll('#zfa-wit-sel option')].find(o => /اکرم/.test(o.textContent)); if (o) { const s = document.getElementById('zfa-wit-sel'); s.value = o.value; s.dispatchEvent(new Event('change', {bubbles:true})); }",
       prose='#ch173-doc .zfa-wit-stmt', cell=None, table='zimni_androoni_reports',
       reopen=WS + "_openMisalEditor('statements_161'); await new Promise(r => setTimeout(r, 2000)); const z = (window.__db.zimni_androoni_reports || []).slice(-1)[0]; if (z) _openZimniA(String(z.id));",
       print="_printZimniA()", share="_dioShareCurrent()"),
  dict(key='challan', name='چالان / رپورٹ 173', root='#ch173-doc', mode='start', paste_plain=True,
       open=WS + "openReport173WithType('mukammal');",
       prose='#ch173-doc .normwrap', cell='#ch173-doc .ch173-table td .rotinner', table='report_173',
       reopen=WS + "openReport173WithType('list'); await new Promise(r => setTimeout(r, 2200)); const x = (window.__db.report_173 || []).slice(-1)[0]; if (x) await _r173OpenDoc(String(x.id));",
       print="_printR173()", share="_dioShareCurrent()"),
  dict(key='darkhwast', name='درخواستیں', root='#dk-doc', mode='lines',
       open=WS + "_openMisalEditor('darkhwastain');",
       prose='#dk-doc .dk-body', cell=None, table=None,
       # محفوظ کرنے پر ماڈیول اپنی فہرست دکھاتا ہے — وہی محفوظ درخواست دوبارہ کھولو
       after_save="const es = await dioLoadDocEntries('darkhwastain', 'c1'); if (es.length) await _dkOpenEntry(es[es.length - 1]); await new Promise(r => setTimeout(r, 1200));",
       reopen=None, print="_dkPrint()", share="_dioShareCurrent()"),
  dict(key='incident', name='واقعاتی رپورٹ', root='#ir-doc', mode='lines', native_print=True,
       open="showPage('incident', null); await new Promise(r => setTimeout(r, 1300)); _irNew();",
       prose='#ir-doc .ir-detail', cell='#ir-doc td .ir-f[data-k="place"]', table='incident_reports',
       reopen="showPage('incident', null); await new Promise(r => setTimeout(r, 1500)); const x = (window.__db.incident_reports || []).slice(-1)[0]; if (x) _irOpen(String(x.id));",
       print="_irPrint()", share="_irShare()"),
  dict(key='naqsha', name='نقشہ موقع (متن)', root='#dio-naqsha-doc', mode='inline',
       open=WS + "_openMisalEditor('crime_scene'); await new Promise(r => setTimeout(r, 1600)); try { _naqNew(); } catch (e) {}",
       prose='#naq-marks .naq-mtext', cell=None, table=None, reopen=None, print=None, share=None),
  dict(key='rfa', name='RFA', root='#rfa-doc', mode='cells',
       open=WS + "_openMisalEditor('rfa_form'); await new Promise(r => setTimeout(r, 1600)); try { _newRfa(); } catch (e) {}",
       prose=None, cell='#rfa-doc td[contenteditable="true"]', table=None, reopen=None, print=None, share=None),
  dict(key='fivec', name='5-C (جواب)', root='#a4-paper', mode='lines',
       open="showPage('fivec', null); await new Promise(r => setTimeout(r, 1500)); open5CResponse('ap1');",
       # لکھائی جواب کے متن والی جگہ (جنابِ عالیٰ! کے بعد کی خالی سطر) — دستخط کے خانے میں نہیں
       prose='#a4-paper', caret='#a4-paper > div[dir="rtl"]:empty', cell=None, table=None, reopen=None, print=None, share=None),
  dict(key='brief', name='مسل دستاویز (بریف)', root='#misal-editor', mode='lines',
       open=WS + "_openMisalEditor('brief');",
       prose='#misal-editor', cell=None, table='case_documents',
       reopen=WS + "_openMisalEditor('brief');", print="_dioPrintCurrent()", share="_dioShareCurrent()"),
  dict(key='saza', name='سزا سلپ', root='#saza-doc', mode='lines',
       open=WS + "_openMisalEditor('saza_slip');",
       prose='#saza-doc .saza-c4-body', cell='#saza-doc .saza-c1-body', table=None, reopen=None, print=None, share=None),
  dict(key='templates', name='ٹیمپلیٹس (سسٹم کا فارم)', root='#dio-fv-paper', mode='start',
       open="showPage('templates', null); await new Promise(r => setTimeout(r, 1800)); DIOFormsUI.open('r173:mukammal');",
       # سسٹم کے فارم میں ماڈیول کی class نہیں رہتیں — جانچ کے لیے خانوں پر نشان: «مختصر حالات» والا لکھنے کا خانہ اور
       # اسی سطر کا تنگ خانہ (تفصیل شہادت)
       mark="""(() => { const p = document.getElementById('dio-fv-paper'); const w = document.createTreeWalker(p, NodeFilter.SHOW_TEXT); let t;
            while ((t = w.nextNode())) if (/جناب عالی/.test(t.nodeValue)) break; if (!t) return 0;
            let b = t.parentElement; while (b && /^inline/.test(getComputedStyle(b).display)) b = b.parentElement; b.setAttribute('data-t563', 'prose');
            const td = b.closest('td'); const tr = td && td.parentElement; const nx = tr && [...tr.cells].find(c => c !== td && c.getBoundingClientRect().width < 80);
            if (nx) nx.setAttribute('data-t563', 'cell'); return 1; })()""",
       prose='#dio-fv-paper [data-t563="prose"]', cell='#dio-fv-paper td[data-t563="cell"]', table='templates', reopen=None, print=None, share=None),
]
ONLY = [a for a in sys.argv[1:] if not a.startswith('-')]

def openE(pg, e):
    pg.evaluate("async () => { " + e['open'] + " }"); pg.wait_for_timeout(3800)
    if e.get('mark'): pg.evaluate(e['mark'])

def noj(pg, root, on):
    """ناپ کے لیے عارضی: اس دستاویز میں justify کا پھیلاؤ بند (دائیں سیدھ) — text-indent / Tab وہی"""
    pg.evaluate("""([r, on]) => { const o = document.getElementById('t563-noj'); if (o) o.remove();
       if (on) { const st = document.createElement('style'); st.id = 't563-noj'; st.textContent = r + ', ' + r + ' * { text-align: right !important; text-align-last: right !important; }'; document.head.appendChild(st); }
       return 0; }""", [root, on])
    pg.wait_for_timeout(60)

def caret_end(pg, sel):
    return pg.evaluate("""(sel) => { const el = document.querySelector(sel); if (!el) return false; el.scrollIntoView({block:'center'});
      const h = __hostOf(el) || el; try { h.focus({preventScroll:true}); } catch (e) {}
      const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return true; }""", sel)

# ═══════════════════════════════════════════════════════════════════════
def text_of(pg, root): return pg.evaluate("(r) => (document.querySelector(r) || {}).innerText || ''", root)

def print_tab_widths(b, html, name):
    """چھپائی کا اصل HTML، پرنٹ کی حالت (media print) میں — سطر کے شروع والے ہر Tab کی چوڑائی (px)"""
    fn = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_v563m_' + name + '.html')
    open(fn, 'w', encoding='utf-8').write(html if html.lstrip().lower().startswith('<!doctype') else '<!DOCTYPE html>' + html)
    c = b.new_context(); c.route('**/*', route); q = c.new_page()
    try:
        q.goto(BASE + '_v563m_' + name + '.html'); q.emulate_media(media='print'); q.wait_for_timeout(1200); q.evaluate('document.fonts.ready')
        # پیراگراف کے شروع کا Tab (حاشیہ): پہلے لفظ کا سطر کے شروع سے اصل فاصلہ ÷ Tab کی تعداد؛ پھر سطر کے بیچ والے Tab کی چوڑائی
        return q.evaluate("""() => { const out = [];
          document.querySelectorAll('[style*="text-indent"]').forEach(el => {
            const m = /^([\\d.]+)(cm|px)$/.exec(String(el.style.textIndent).trim()); if (!m) return;
            const n = Math.round(parseFloat(m[1]) / (m[2] === 'cm' ? 1.27 : 48)); if (n < 1) return;
            const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t;
            while ((t = w.nextNode()) && !/[^\\s\\u200B]/.test(t.nodeValue)) {}
            if (!t) return;
            const i = t.nodeValue.search(/[^\\s\\u200B]/); let j = i; while (j < t.nodeValue.length && !/\\s/.test(t.nodeValue[j])) j++;
            const r = document.createRange(); r.setStart(t, i); r.setEnd(t, j);
            const cs = getComputedStyle(el), b = el.getBoundingClientRect();
            out.push(Math.round((b.right - parseFloat(cs.paddingRight) - parseFloat(cs.borderRightWidth) - r.getBoundingClientRect().right) / n * 100) / 100); });
          document.querySelectorAll('.dio-tab').forEach(t => out.push(Math.round(t.getBoundingClientRect().width * 100) / 100));
          return out; }""")
    finally:
        c.close(); os.remove(fn)

def editor_suite(b, e):
    tag = 'Desktop ' + e['name']
    mode = e['mode']
    ctx, pg, errs = open2(b)
    sec = ''
    try:
        sec = 'کھولنا'
        openE(pg, e)
        ok = pg.evaluate("(s) => !!document.querySelector(s)", e['root'])
        check(f'{tag}: دستاویز کھلی', ok, e['root'])
        if not ok: return
        root = e['root']
        cdp = ctx.new_cdp_session(pg)

        if e['prose']:
            # ── 1) لکھائی + Tab ──
            sec = 'لکھائی'
            klog(pg)
            if mode == 'lines':
                caret_end(pg, e.get('caret') or e['prose'])
                press(pg, 'Enter')
                # ایک ہی اردو لفظ سے شروع دو سطریں: «لفظ REFX» اور «Tab لفظ TABX» — انگریزی نشان کا دایاں کنارہ
                # اسی لفظ کے ساتھ لگا ہے، اس لیے دونوں کا فرق = Tab کی چوڑائی (RTL میں دائیں سے)
                pg.keyboard.type('لفظ REFX ریفرنس FMTX'); pg.wait_for_timeout(150)
                press(pg, 'Enter'); press(pg, 'Tab'); pg.keyboard.type('لفظ TABX ٹیب'); pg.wait_for_timeout(150)
                press(pg, 'Enter'); pg.keyboard.type('CENX مرکز'); pg.wait_for_timeout(150)
            elif mode == 'start':
                pg.evaluate("""(s) => { const el = document.querySelector(s); el.scrollIntoView({block:'center'}); const h = __hostOf(el) || el; h.focus();
                   const r = document.createRange(); r.selectNodeContents(el); r.collapse(true); const g = getSelection(); g.removeAllRanges(); g.addRange(r); return 0; }""", e['prose'])
                # «دونوں طرف برابر» (justify) میں Chrome، Jameel Noori Nastaleeq کے ساتھ، کچھ سطروں کے شروع میں خود
                # ایک چھوٹا خلا (0–7px) چھوڑتا ہے — Tab ہو یا نہ ہو، کسی بھی سطر پر (serif فونٹ میں نہیں)۔ اس لیے Tab کا اپنا
                # ناپ اسی پیراگراف کو عارضی طور پر دائیں سیدھ کر کے (justify کا پھیلاؤ ہٹا کر)؛ justify والا ناپ الگ لکھا جاتا ہے
                pg.keyboard.type('لفظ پہلا دوسرا تیسرا چوتھا پانچواں چھٹا ساتواں آٹھواں نواں دسواں گیارہواں بارہواں تیرہواں چودہواں پندرہواں سولہواں سترہواں اٹھارہواں '
                                 'TABX REFX FMTX CENX ایک دو تین چار پانچ '); pg.wait_for_timeout(150)
                fl = pg.evaluate("""(r) => { const a = __rect('لفظ', r), b = __rect('TABX', r); return a && b ? Math.abs(a.t - b.t) > 5 : null; }""", root)
                check(f'{tag}: (جانچ کی ترتیب) پہلی سطر خالص اردو — انگریزی نشان اگلی سطر پر', fl is True, fl)
                # پہلا لفظ سطر کے شروع (دائیں کنارے) پر — Tab کے بعد ٹھیک 1.27 سینٹی میٹر بائیں
                r0j = pg.evaluate("(r) => __rect('لفظ', r)", root)
                noj(pg, root, True); r0 = pg.evaluate("(r) => __rect('لفظ', r)", root); noj(pg, root, False)
                pg.evaluate("(r) => __sel('لفظ', r, 'before')", root)
                press(pg, 'Tab')
                r1j = pg.evaluate("(r) => __rect('لفظ', r)", root)
                noj(pg, root, True); r1 = pg.evaluate("(r) => __rect('لفظ', r)", root); noj(pg, root, False)
                dj = round(r0j['r'] - r1j['r'], 2) if (r0j and r1j) else None
                print(f'INFO {tag}: justify کی حالت میں پہلے لفظ کا کھسکنا = {dj}px (Tab 48px + Chrome / فونٹ کا سطر کے شروع والا خلا)', flush=True)
            else:
                caret_end(pg, e['prose'])
                pg.keyboard.type('REFX FMTX'); press(pg, 'Tab'); pg.keyboard.type('TABX'); pg.wait_for_timeout(150)
            log = klog(pg)
            tabs = [x for x in log if x.get('k') == 'Tab']
            check(f'{tag}: Tab — براؤزر کا «اگلے خانے پر توجہ» نہیں (روکا گیا)', bool(tabs) and all(x.get('dp') for x in tabs), tabs)
            n_tab = pg.evaluate("(s) => __tabn(s)", root)
            check(f'{tag}: Tab سے ایک Tab stop (1.27 سینٹی میٹر کا نشان)', n_tab >= 1, n_tab)
            if mode == 'lines':
                a = pg.evaluate("(r) => [__rect('REFX', r), __rect('TABX', r)]", root)
                d = (a[0]['r'] - a[1]['r']) if (a[0] and a[1]) else None
                check(f'{tag}: سطر کے شروع میں Tab = 1.27 سینٹی میٹر (48px، RTL میں دائیں سے)', d is not None and abs(d - TAB_PX) <= 1.5, d)
            elif mode == 'start':
                d = (r0['r'] - r1['r']) if (r0 and r1) else None
                check(f'{tag}: خانے کے شروع میں Tab = 1.27 سینٹی میٹر (48px، RTL میں دائیں سے؛ justify کا پھیلاؤ ہٹا کر ناپا)', d is not None and abs(d - TAB_PX) <= 1.5, (d, r0, r1))

            # ── 2) Ctrl+B / I / U ──
            sec = 'B/I/U'
            pg.evaluate("(r) => __sel('FMTX', r)", root)
            klog(pg)
            for k in ('b', 'i', 'u'): press(pg, 'Control+' + k)
            log = klog(pg)
            st = pg.evaluate("(r) => __blk('FMTX', r)", root)
            check(f'{tag}: Ctrl+B / I / U — بولڈ، ترچھا، انڈر لائن', st and int(st['fw']) >= 600 and st['fst'] == 'italic' and 'underline' in st['td'], st)
            check(f'{tag}: Ctrl+B/I/U براؤزر تک نہیں گئیں (Ctrl+U = صفحے کا ماخذ نہیں)', all(prevented(log, c) for c in ('KeyB', 'KeyI', 'KeyU')), log)

            # ── 3) Ctrl+] / Ctrl+[ — 1pt ──
            sec = 'فونٹ'
            pg.evaluate("(r) => __sel('FMTX', r)", root)
            f0 = float(pg.evaluate("(r) => __blk('FMTX', r).fs", root)[:-2]) * 0.75
            press(pg, 'Control+]'); press(pg, 'Control+]')
            f2 = float(pg.evaluate("(r) => __blk('FMTX', r).fs", root)[:-2]) * 0.75
            press(pg, 'Control+[')
            f1 = float(pg.evaluate("(r) => __blk('FMTX', r).fs", root)[:-2]) * 0.75
            check(f'{tag}: Ctrl+] دو بار = +2pt، Ctrl+[ = −1pt', abs((f2 - f0) - 2) < 0.3 and abs((f2 - f1) - 1) < 0.3, (round(f0, 2), round(f2, 2), round(f1, 2)))
            cdp_key(pg, cdp, 'BracketRight', 'چ', 221)
            fu = float(pg.evaluate("(r) => __blk('FMTX', r).fs", root)[:-2]) * 0.75
            check(f'{tag}: اردو کی بورڈ پر Ctrl+] بھی', abs((fu - f1) - 1) < 0.3, (round(f1, 2), round(fu, 2)))
            cdp_key(pg, cdp, 'BracketLeft', 'ج', 219)

            # ── 4) Ctrl+E / R / L / J ──
            sec = 'سیدھ'
            if mode in ('lines', 'start'):
                al = {}
                order = (('r', 'right'), ('l', 'left'), ('j', 'justify'), ('e', 'center')) if mode == 'lines' else (('l', 'left'), ('j', 'justify'), ('e', 'center'), ('r', 'right'))
                for k, v in order:
                    pg.evaluate("(r) => __sel('CENX', r, 'in')", root)
                    press(pg, 'Control+' + k)
                    bl = pg.evaluate("(r) => __blk('CENX', r)", root)
                    al[k] = (bl['ta'], bl['tal'])
                check(f'{tag}: Ctrl+R / L / J / E — دائیں / بائیں / دونوں طرف / درمیان', al['r'][0] == 'right' and al['l'][0] == 'left' and al['j'][0] == 'justify' and al['e'][0] == 'center', al)
                if mode == 'lines':
                    bl = pg.evaluate("(r) => __blk('CENX', r)", root)
                    ref = pg.evaluate("(r) => __blk('REFX', r)", root)
                    lf = pg.evaluate("(r) => __rect('لفظ', r)", root)
                    check(f'{tag}: صرف «CENX» والا پیراگراف درمیان میں — «لفظ REFX» والا جوں کا توں (دائیں سے شروع)', ref['ta'] != 'center' and lf and abs((ref['br'] or 0) - lf['r']) < 3, (ref['ta'], ref['br'], lf))
                    check(f'{tag}: درمیان کی سیدھ نظر بھی آئے (سطر درمیان کی طرف)', bl['wl'] and bl['br'] - bl['wr'] > 20 and bl['wl'] - bl['bl'] > 20, (bl['bl'], bl['wl'], bl['wr'], bl['br']))

            # ── 5) Ctrl+A — صرف یہی دستاویز ──
            sec = 'Ctrl+A'
            pg.evaluate("(r) => __sel('FMTX', r, 'after')", root)
            press(pg, 'Control+a')
            sa = pg.evaluate("""(r) => { const s = getSelection(); const root = document.querySelector(r); const all = root.classList.contains('dio-allsel');
               const g = s.rangeCount ? s.getRangeAt(0) : null;
               return { all: all, inside: all || (!!g && (root.contains(g.commonAncestorContainer) || g.commonAncestorContainer === root)),
                        hasRef: all || String(s).indexOf('REFX') >= 0, out: String(s).indexOf('شارٹ کٹس') >= 0 || String(s).indexOf('Digital IO') >= 0,
                        fields: root.querySelectorAll('[contenteditable="true"]').length }; }""", root)
            check(f'{tag}: Ctrl+A — پوری دستاویز منتخب (کئی خانوں والی دستاویز میں تمام خانے نمایاں)، باہر کا کچھ نہیں', sa and sa['inside'] and sa['hasRef'] and not sa['out'], sa)
            press(pg, 'Control+c')
            clip = pg.evaluate("navigator.clipboard.readText()")
            check(f'{tag}: Ctrl+A پھر Ctrl+C — پوری دستاویز نقل', 'REFX' in clip and 'FMTX' in clip and 'TABX' in clip, len(clip))
            if sa['all']:
                # کئی خانے: B سب پر، پھر ایک Ctrl+Z سے سب واپس
                h0 = pg.evaluate("(r) => document.querySelector(r).innerHTML", root)
                press(pg, 'Control+b', 250)
                nb = pg.evaluate("""(r) => { const root = document.querySelector(r); const hs = [...root.querySelectorAll('[contenteditable="true"]')].filter(h => /\\S/.test(h.textContent) && h.getClientRects().length);
                    return [hs.length, hs.filter(h => { const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT); let t; while ((t = w.nextNode())) { if (/\\S/.test(t.nodeValue) && parseInt(getComputedStyle(t.parentElement).fontWeight) < 600) return false; } return true; }).length]; }""", root)
                press(pg, 'Escape', 150)
                pg.evaluate("(r) => __sel('FMTX', r, 'after')", root)
                press(pg, 'Control+z', 300)
                h1 = pg.evaluate("(r) => document.querySelector(r).innerHTML", root)
                check(f'{tag}: پوری دستاویز منتخب → Ctrl+B تمام خانوں پر، ایک Ctrl+Z سے سب واپس', nb[0] >= 2 and nb[1] == nb[0] and re.sub(r'\s+', ' ', h1) == re.sub(r'\s+', ' ', h0), nb)

            # ── 6) Ctrl+F — مرکزی تلاش ──
            sec = 'Ctrl+F'
            pg.evaluate("(r) => __sel('FMTX', r)", root)
            klog(pg); press(pg, 'Control+f', 400)
            ms = pg.evaluate("""() => { const o = document.getElementById('dio-msearch'); const q = document.getElementById('sr-query');
               return { open: !!o && o.getClientRects().length > 0, q: q && q.value, inOv: !!(q && q.closest('#dio-msearch')), focus: document.activeElement === q,
                        parked: document.querySelectorAll('[data-dio-parked]').length }; }""")
            lf = klog(pg)
            check(f'{tag}: Ctrl+F — مرکزی تلاش کھلی، «FMTX» پہلے سے لکھا، دستاویز پیچھے کھلی', ms['open'] and ms['q'] == 'FMTX' and ms['inOv'] and ms['focus'] and pg.evaluate("(r) => !!document.querySelector(r)", root), ms)
            check(f'{tag}: Ctrl+F براؤزر کی اپنی تلاش نہیں', prevented(lf, 'KeyF'), lf)
            press(pg, 'Escape', 300)
            back = pg.evaluate("(r) => { const d = document.querySelector(r); return { open: !!document.getElementById('dio-msearch'), parked: document.querySelectorAll('[data-dio-parked]').length, doc: !!d && d.getClientRects().length > 0 }; }", root)
            check(f'{tag}: Esc سے تلاش بند، دستاویز جوں کی توں (کھلی رہی)', not back['open'] and back['parked'] == 0 and back['doc'], back)

            # ── 7) Ctrl+H — ڈھونڈیں اور بدلیں ──
            sec = 'Ctrl+H'
            word = 'CENX' if mode in ('lines', 'start') else 'TABX'
            pg.evaluate("(w) => __sel(w, %s)" % json.dumps(root), word)
            press(pg, 'Control+h', 600)
            fr = pg.evaluate("() => { const p = document.getElementById('dio-fr-panel'); const f = document.getElementById('dio-fr-find'); return { open: !!p && p.style.display !== 'none' && p.getClientRects().length > 0, q: f && f.value }; }")
            check(f'{tag}: Ctrl+H — ڈھونڈیں اور بدلیں کھلا، منتخب لفظ پہلے سے', fr['open'] and fr['q'] == word, fr)
            pg.fill('#dio-fr-repl', word[:3] + 'Y')
            pg.evaluate("dioFRReplaceAll(); 0"); pg.wait_for_timeout(200)
            rep = text_of(pg, root)
            pg.evaluate("dioFRClose(); 0")
            check(f'{tag}: «سب بدلیں» دستاویز میں', (word[:3] + 'Y') in rep and word not in rep, rep[-120:])
            pg.evaluate("(w) => __sel(w, %s, 'after')" % json.dumps(root), word[:3] + 'Y')
            press(pg, 'Control+z', 250)
            rep2 = text_of(pg, root)
            check(f'{tag}: بدلنا بھی Ctrl+Z سے واپس (ایک قدم)', word in rep2 and (word[:3] + 'Y') not in rep2, rep2[-120:])

            # ── 8) نقل / کاٹنا / چسپاں ──
            sec = 'X/C/V'
            END_W = 'مرکز' if mode == 'lines' else ('CENX' if mode == 'start' else 'TABX')
            pg.evaluate("(r) => __sel('FMTX', r)", root)
            press(pg, 'Control+c')
            pg.evaluate("([w, r]) => __sel(w, r, 'after')", [END_W, root])
            press(pg, 'Control+v', 400)
            cnt = text_of(pg, root).count('FMTX')
            fm = pg.evaluate("""(r) => { const root = document.querySelector(r); const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let t, n = 0;
                while ((t = w.nextNode())) { if (t.nodeValue.indexOf('FMTX') >= 0 && ++n === 2) {
                  let st = '', ul = false, own = '';
                  for (let x = t.parentElement; x && x !== root; x = x.parentElement) { if (/underline/.test(getComputedStyle(x).textDecorationLine)) ul = true;
                    if (x.textContent.trim() === 'FMTX') own += x.tagName + '[' + (x.getAttribute('style') || '') + ']'; }
                  const ps = getComputedStyle(t.parentElement); return { fw: ps.fontWeight, fst: ps.fontStyle, ul: ul, own: own, ff: ps.fontFamily }; } } return null; }""", root)
            if e.get('paste_plain'):
                check(f'{tag}: Ctrl+C → Ctrl+V — متن آیا، فونٹ دستاویز کا (اس خانے کا اپنا قاعدہ: ہمیشہ سادہ متن)', cnt >= 2 and fm and 'Jameel' in fm['ff'] and 'px' not in fm['own'], (cnt, fm))
            else:
                check(f'{tag}: Ctrl+C → Ctrl+V (سسٹم کے اندر) — بولڈ/ترچھا/انڈر لائن ساتھ، فونٹ دستاویز کا (font-family / px نہیں)',
                      cnt >= 2 and fm and int(fm['fw']) >= 600 and fm['fst'] == 'italic' and fm['ul'] and 'font-family' not in fm['own'] and 'px' not in fm['own'] and 'Jameel' in fm['ff'], (cnt, fm))
            pg.evaluate("([w, r]) => __sel(w, r, 'after')", [END_W, root])
            pg.evaluate("""() => { const dt = new DataTransfer(); dt.setData('text/html', '<span style="font-family:Arial;color:red;font-size:30px"><b>EXTX</b></span>'); dt.setData('text/plain', 'EXTX');
               document.activeElement.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); return 0; }""")
            pg.wait_for_timeout(250)
            ex = pg.evaluate("""(r) => { const f = __find('EXTX', r); if (!f) return null; let s = ''; const ps = getComputedStyle(f.t.parentElement);
               for (let x = f.t.parentElement; x && x.textContent.trim() === 'EXTX'; x = x.parentElement) s += x.tagName + '[' + (x.getAttribute('style') || '') + ']';
               return { own: s, fw: ps.fontWeight, ff: ps.fontFamily }; }""", root)
            check(f'{tag}: باہر سے چسپاں = سادہ متن (Arial / سرخ / 30px / بولڈ ساتھ نہیں، فونٹ دستاویز کا)', ex is not None and 'Arial' not in ex['own'] and 'red' not in ex['own'] and '30px' not in ex['own'] and 'B[' not in ex['own'] and 'Jameel' in ex['ff'], ex)
            pg.evaluate("(r) => __sel('EXTX', r)", root)
            press(pg, 'Control+x', 200)
            gone = 'EXTX' not in text_of(pg, root)
            pg.evaluate("([w, r]) => __sel(w, r, 'after')", [END_W, root])
            press(pg, 'Control+v', 300)
            check(f'{tag}: Ctrl+X کاٹے، Ctrl+V نئی جگہ واپس', gone and 'EXTX' in text_of(pg, root), gone)

            # ── 9) منتقل ──
            sec = 'منتقل'
            pg.evaluate("(r) => __sel('EXTX', r)", root)
            src = pg.evaluate("() => { const r = getSelection().getRangeAt(0).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }")
            dst = pg.evaluate("(r) => { const b = __rect('REFX', r); return b ? [b.l - 2, b.t + 8] : null; }", root)
            if dst:
                t_before = text_of(pg, root)
                pg.mouse.move(*src); pg.mouse.down(); pg.mouse.move(src[0] + 4, src[1] + 4); pg.mouse.move(*dst, steps=12); pg.mouse.up(); pg.wait_for_timeout(400)
                tx = text_of(pg, root)
                check(f'{tag}: منتخب متن کھینچ کر منتقل (پرانی جگہ سے ہٹا، نئی جگہ آیا، ایک ہی بار)', tx.count('EXTX') == 1 and tx.find('EXTX') != t_before.find('EXTX') and tx.find('EXTX') < tx.find('FMTX'), (tx.find('EXTX'), t_before.find('EXTX')))
                press(pg, 'Control+z', 250)
                check(f'{tag}: منتقل کرنا ایک ہی Ctrl+Z سے واپس', text_of(pg, root) == t_before, '')

            # ── 10) Ctrl+Z / Ctrl+Y ──
            sec = 'Undo'
            if mode == 'inline':
                # ایک سطر کے خانے میں اب تک کم قدم ہوئے — 20 سے زیادہ قدم کی جانچ کے لیے مزید 22 الگ لفظ (ہر لفظ = ایک قدم)
                pg.evaluate("(r) => __sel('TABX', r, 'after')", root)
                pg.keyboard.type(' ' + ' '.join('W%d' % i for i in range(1, 23))); pg.wait_for_timeout(200)
            final = pg.evaluate("(r) => document.querySelector(r).innerHTML", root)
            pg.evaluate("(r) => __sel('FMTX', r, 'after')", root)
            n = 0
            for i in range(90):
                t = text_of(pg, root)
                if 'REFX' not in t and 'FMTX' not in t: break
                press(pg, 'Control+z', 60); n += 1
            t0 = text_of(pg, root)
            check(f'{tag}: Ctrl+Z — ہر قدم واپس (کم از کم 20 قدم، آخر میں لکھائی سے پہلے کی حالت)', n >= 20 and 'REFX' not in t0 and 'FMTX' not in t0, (n, t0[-80:]))
            for i in range(n): press(pg, 'Control+y', 60)
            again = pg.evaluate("(r) => document.querySelector(r).innerHTML", root)
            norm = lambda h: re.sub(r'\s+', ' ', h)
            check(f'{tag}: Ctrl+Y — اتنے ہی قدم دوبارہ، دستاویز بالکل پہلے جیسی', norm(again) == norm(final), (len(again), len(final)))

            # ── 11) Shift+Tab ──
            if mode in ('lines', 'start'):
                pg.evaluate("(r) => __sel('TABX', r, 'before')", root)
                if mode == 'lines': press(pg, 'Home')
                else: pg.evaluate("(r) => __sel('لفظ', r, 'before')", root)
                n0 = pg.evaluate("(r) => __tabn(r)", root)
                press(pg, 'Shift+Tab')
                n1 = pg.evaluate("(r) => __tabn(r)", root)
                check(f'{tag}: Shift+Tab — Tab واپس', n1 == n0 - 1, (n0, n1))
                press(pg, 'Tab')
                n2 = pg.evaluate("(r) => __tabn(r)", root)
                check(f'{tag}: پھر Tab — واپس اسی جگہ', n2 == n0, (n0, n2))
                # Backspace سطر کے شروع پر: پہلے Tab (حاشیہ) ہٹے، سطر نہ جڑے — MS Word کی طرح
                txt0 = text_of(pg, root)
                press(pg, 'Backspace')
                n3 = pg.evaluate("(r) => __tabn(r)", root)
                check(f'{tag}: سطر کے شروع پر Backspace — پہلے Tab ہٹا، متن وہی (سطر نہیں جڑی)', n3 == n0 - 1 and text_of(pg, root) == txt0, (n0, n3))
                press(pg, 'Control+z')
                n4 = pg.evaluate("(r) => __tabn(r)", root)
                check(f'{tag}: Ctrl+Z — Tab واپس', n4 == n0, (n0, n4))

        # ── 12) جدول کا خانہ ──
        if e['cell']:
            sec = 'خانے'
            ok0 = caret_end(pg, e['cell'])
            pos = pg.evaluate("""() => { const s = getSelection(); const a = s.anchorNode;
                 const cell = a && (a.nodeType === 1 ? a : a.parentElement).closest('td,th'); const tb = cell && cell.closest('table');
                 return { i: tb ? [...tb.querySelectorAll('td,th')].indexOf(cell) : -1 }; }""")
            klog(pg); press(pg, 'Tab', 200)
            p1 = pg.evaluate("""() => { const a = getSelection().anchorNode; const cell = a && (a.nodeType === 1 ? a : a.parentElement).closest('td,th'); const tb = cell && cell.closest('table');
                 return { i: tb ? [...tb.querySelectorAll('td,th')].indexOf(cell) : -1, tabs: cell ? cell.querySelectorAll('.dio-tab').length : -1 }; }""")
            press(pg, 'Shift+Tab', 200)
            p2 = pg.evaluate("""() => { const a = getSelection().anchorNode; const cell = a && (a.nodeType === 1 ? a : a.parentElement).closest('td,th'); const tb = cell && cell.closest('table');
                 return { i: tb ? [...tb.querySelectorAll('td,th')].indexOf(cell) : -1 }; }""")
            log = klog(pg)
            check(f'{tag}: جدول کے خانے میں Tab = اگلا خانہ (MS Word)، Shift+Tab = پچھلا؛ خانے میں Tab کا نشان نہیں',
                  ok0 and pos['i'] >= 0 and p1['i'] > pos['i'] and p1['tabs'] == 0 and p2['i'] == pos['i'] and all(x.get('dp') for x in log if x.get('k') == 'Tab'), (pos, p1, p2))
            if not e['prose']:
                # فارمیٹنگ / واپسی صرف خانوں والے فارم میں بھی
                pg.evaluate("""(s) => { const el = document.querySelector(s); const h = __hostOf(el) || el; h.focus(); const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r); return 0; }""", e['cell'])
                pg.keyboard.type(' CELLX'); pg.evaluate("(r) => __sel('CELLX', r)", root)
                press(pg, 'Control+u'); press(pg, 'Control+]')
                st = pg.evaluate("(r) => __blk('CELLX', r)", root)
                check(f'{tag}: خانے میں Ctrl+U / Ctrl+]', st and 'underline' in st['td'] and abs(float(st['fs'][:-2]) * 0.75 - float(pg.evaluate("(r) => getComputedStyle(__find('CELLX', r).t.parentElement.parentElement).fontSize", root)[:-2]) * 0.75 - 1) < 0.3, st)
                for i in range(4): press(pg, 'Control+z', 80)
                check(f'{tag}: خانے میں Ctrl+Z', 'CELLX' not in text_of(pg, root))
                # کم از کم 20 قدم: پہلا خالی وقفہ + 22 الگ لفظ = 23 قدم (MS Word کی طرح ہر نیا لفظ ایک قدم) —
                # 23 بار Ctrl+Z سب واپس، 23 بار Ctrl+Y سب دوبارہ
                caret_end(pg, e['cell'])
                h_before = pg.evaluate("(r) => document.querySelector(r).innerHTML", root)
                pg.keyboard.type(' ' + ' '.join('W%d' % i for i in range(1, 23))); pg.wait_for_timeout(200)
                h_typed = pg.evaluate("(r) => document.querySelector(r).innerHTML", root)
                steps = []
                for i in range(23):
                    press(pg, 'Control+z', 60); tx_ = text_of(pg, root); steps.append(sum(1 for k in range(1, 23) if re.search(r'\bW%d\b' % k, tx_)))
                h_undone = pg.evaluate("(r) => document.querySelector(r).innerHTML", root)
                for i in range(23): press(pg, 'Control+y', 60)
                h_redone = pg.evaluate("(r) => document.querySelector(r).innerHTML", root)
                nrm = lambda h: re.sub(r'\s+', ' ', h)
                check(f'{tag}: خانے میں 23 قدم Ctrl+Z (ہر قدم ایک لفظ) اور 23 قدم Ctrl+Y — بالکل پہلے جیسا',
                      steps == list(range(21, -1, -1)) + [0] and nrm(h_undone) == nrm(h_before) and nrm(h_redone) == nrm(h_typed),
                      (steps, nrm(h_undone) == nrm(h_before), nrm(h_redone) == nrm(h_typed)))

        # ── 13) Ctrl+P = «پرنٹ» بٹن ──
        if e['print']:
            sec = 'Ctrl+P'
            capture_print(pg)
            pg.evaluate("window.__printCalls = 0; 0")
            pg.evaluate("(r) => { const h = __hostOf(document.querySelector(r).querySelector('[contenteditable=\"true\"]') || document.querySelector(r)); if (h) h.focus(); return 0; }", root)
            klog(pg); press(pg, 'Control+p', 500)
            s1 = wait_snap(pg, 1, 25) if not e.get('native_print') else []
            c1 = pg.evaluate("window.__printCalls")
            lp = klog(pg)
            pg.evaluate("window.__snaps = []; window.__printCalls = 0; 0")
            pg.evaluate("() => { " + e['print'] + "; return 0; }")
            s2 = wait_snap(pg, 1, 25) if not e.get('native_print') else []
            c2 = pg.evaluate("window.__printCalls")
            strip = lambda h: re.sub(r'\d{2}:\d{2}(:\d{2})?', '', h or '')
            if e.get('native_print'):
                check(f'{tag}: Ctrl+P = «پرنٹ» بٹن (وہی اپنا پرنٹ، ایک بار)', c1 == 1 and c2 == 1 and prevented(lp, 'KeyP'), (c1, c2))
            else:
                check(f'{tag}: Ctrl+P = «پرنٹ» بٹن (ایک ہی پرنٹ، ایک ہی کاغذ)', len(s1) == 1 and len(s2) == 1 and strip(s1[0]) == strip(s2[0]) and prevented(lp, 'KeyP'), (len(s1), len(s2)))
            pg.evaluate("window.__dioPaperAuto = 'keep'; 0")

        # ── 14) Ctrl+S ──
        sec = 'Ctrl+S'
        tgt = e['prose'] or e['cell']
        caret_end(pg, tgt)
        before_n = pg.evaluate("(t) => (window.__db[t] || []).length", e['table']) if e['table'] else None
        toasts(pg); klog(pg)
        press(pg, 'Control+s', 2200)
        log, ts = klog(pg), toasts(pg)
        check(f'{tag}: Ctrl+S — براؤزر کا «Save as» نہیں (روکا گیا)', prevented(log, 'KeyS'), log)
        check(f'{tag}: Ctrl+S — محفوظ + «محفوظ ہو گیا»', any(m.startswith('محفوظ ہو گیا') for t, m in ts), ts)
        if e['table']:
            after_n = pg.evaluate("(t) => (window.__db[t] || []).length", e['table'])
            check(f'{tag}: Ctrl+S — سرور پر ریکارڈ ({e["table"]})', after_n >= max(1, before_n), (before_n, after_n))
        if not pg.evaluate("(r) => { const el = document.querySelector(r); return !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'; }", root):
            # ماڈیول محفوظ کرنے پر فہرست پر لوٹ آیا — وہی محفوظ دستاویز دوبارہ کھولو
            if e.get('after_save'): pg.evaluate("async () => { " + e['after_save'] + " }")
            else: openE(pg, e)
        check(f'{tag}: (جانچ کی ترتیب) دوسرے Ctrl+S سے پہلے دستاویز کھلی', bool(caret_end(pg, tgt)), tgt)
        caret_end(pg, tgt)
        cdp_key(pg, cdp, 'KeyS', 'س', 83); pg.wait_for_timeout(2200)
        log, ts = klog(pg), toasts(pg)
        check(f'{tag}: اردو کی بورڈ پر Ctrl+S (key «س») — وہی محفوظ، براؤزر کی HTML فائل نہیں', prevented(log, 'KeyS') and any(m.startswith('محفوظ ہو گیا') for t, m in ts), (log, ts))
        check(f'{tag}: کوئی تیرتی ٹول بار نہیں', pg.evaluate("!document.getElementById('dio-float-bar')"))
        pg.screenshot(path=V + 'desk_' + e['key'] + '.png')

        # ── 15) محفوظ → reload → دوبارہ کھولنا → پرنٹ → PDF → Word ──
        if e['reopen'] and e['prose'] and mode in ('lines', 'start'):
            sec = 'reload'
            FIN = 'center' if mode == 'lines' else 'right'
            def align_before(h, word='CENX'):
                k = h.find(word); a = h.rfind('text-align:', 0, k) if k > 0 else -1
                return re.match(r'\s*([a-z-]+)', h[a + 11:]).group(1) if a > 0 else None
            reload_keep_db(pg)
            pg.evaluate("async () => { " + e['reopen'] + " }"); pg.wait_for_timeout(4500)
            got = pg.evaluate("""([r, fin]) => { const root = document.querySelector(r); if (!root) return null; const h = root.innerHTML; const k = h.indexOf('CENX'), a = h.lastIndexOf('text-align:', k);
                 return { b: /<(b|strong)\\b/.test(h), i: /<(i|em)\\b/.test(h), u: /<u\\b/.test(h), center: k > 0 && a > 0 && (/^\\s*([a-z-]+)/.exec(h.slice(a + 11)) || [])[1] === fin && (__blk('CENX', r) || {}).ta === fin, tab: __tabn(r),
                          fs: /font-size:\\s*15pt/.test(h), txt: root.innerText.indexOf('REFX') >= 0 && root.innerText.indexOf('TABX') >= 0 }; }""", [root, FIN])
            check(f'{tag}: reload کے بعد: بولڈ/ترچھا/انڈر لائن، سیدھ ({FIN})، Tab، 15pt — سب محفوظ', got and all(got[k] for k in ('b', 'i', 'u', 'center', 'txt', 'fs')) and got['tab'] >= 1, got)
            tw = pg.evaluate("(r) => __indentPx('لفظ', r)", root)
            if mode == 'lines':
                a = pg.evaluate("(r) => [__rect('REFX', r), __rect('TABX', r)]", root)
                d = (a[0]['r'] - a[1]['r']) if (a and a[0] and a[1]) else None
                check(f'{tag}: reload کے بعد Tab اب بھی 1.27 سینٹی میٹر', d is not None and abs(d - TAB_PX) <= 1.5, (d, pg.evaluate("(r) => document.querySelector(r).innerHTML.slice(-700)", root) if d is None or abs(d - TAB_PX) > 1.5 else ''))
            else:
                check(f'{tag}: reload کے بعد Tab اب بھی 1.27 سینٹی میٹر', tw is not None and abs(tw - TAB_PX) <= 1.5, tw)
            if e['print']:
                if e.get('native_print'):
                    # اپنا پرنٹ = براؤزر کی چھپائی (اسی صفحے کی پرنٹ CSS) — وہی کاغذ جو پرنٹ میں
                    pg.emulate_media(media='print'); pg.wait_for_timeout(500)
                    vis_fmt = pg.evaluate("(r) => { const a = __rect('REFX', r), t = __rect('TABX', r); return { tab: (a && t) ? a.r - t.r : null, cen: __blk('CENX', r).ta, fw: __blk('FMTX', r).fw }; }", root)
                    pdf = V + 'print_' + e['key'] + '.pdf'
                    pg.pdf(path=pdf, prefer_css_page_size=True, print_background=True)
                    pg.emulate_media(media='screen')
                    check(f'{tag}: پرنٹ میں بولڈ / درمیان / Tab', vis_fmt['tab'] and abs(vis_fmt['tab'] - TAB_PX) <= 1.5 and vis_fmt['cen'] == 'center' and int(vis_fmt['fw']) >= 600, vis_fmt)
                    subprocess.run(['pdftoppm', '-png', '-r', '60', '-f', '1', '-l', '1', pdf, V + 'print_' + e['key']], check=False)
                    wd = pdf_words(pdf, ['REFX', 'TABX'])
                    dd = (wd['REFX'][2] - wd['TABX'][2]) if ('REFX' in wd and 'TABX' in wd) else None
                    check(f'{tag}: پرنٹ (PDF) میں ناپ: Tab = 1.27 سینٹی میٹر (36pt ±0.8)', dd is not None and abs(dd - TAB_PT) <= 0.8, (dd, wd))
                else:
                    capture_print(pg)
                    pg.evaluate("(r) => { const h = __hostOf(document.querySelector(r).querySelector('[contenteditable=\"true\"]') || document.querySelector(r)); if (h) h.focus(); return 0; }", root)
                    press(pg, 'Control+p', 400)
                    sn = wait_snap(pg, 1)
                    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
                    ph = sn[0] if sn else ''
                    fmt = {k: bool(re.search(p, ph)) for k, p in (('b', r'<(b|strong)\b'), ('i', r'<(i|em)\b'), ('u', r'<u\b'), ('tab', r'dio-tab|text-indent:\s*(1\.27cm|48px)'), ('pt15', r'font-size:\s*15pt'))}
                    fmt['align'] = align_before(ph or '') == FIN
                    check(f'{tag}: پرنٹ میں بولڈ/ترچھا/انڈر لائن/سیدھ ({FIN})/Tab/15pt', ph and all(fmt.values()), fmt)
                    if ph:
                        tws = print_tab_widths(b, ph, e['key'])
                        check(f'{tag}: پرنٹ کی حالت میں (print preview) سطر کے شروع والا Tab = 1.27 سینٹی میٹر', bool(tws) and abs(tws[0] - TAB_PX) <= 1.5, tws)
                        pdf = html_to_pdf(b, ph, 'print_' + e['key'])
                        if mode == 'lines':
                            wd = pdf_words(pdf, ['REFX', 'TABX', 'CENX'])
                            dd = (wd['REFX'][2] - wd['TABX'][2]) if ('REFX' in wd and 'TABX' in wd) else None
                            check(f'{tag}: پرنٹ (PDF) میں ناپ: Tab = 1.27 سینٹی میٹر (36pt ±0.8)', dd is not None and abs(dd - TAB_PT) <= 0.8, (dd, wd))
            if e['share']:
                try:
                    pg.evaluate("window.__dioPaperAuto = 'legal'; 0")
                    wfile = share_download(pg, e['share'], 'word', V + 'share_' + e['key'] + '.doc')
                    w = open(wfile, encoding='utf-8-sig', errors='replace').read()
                    wf = {k: bool(re.search(p, w)) for k, p in (('b', r'<(b|strong)\b|font-weight:\s*(bold|700)'), ('i', r'<(i|em)\b|font-style:\s*italic'),
                          ('u', r'<u\b|text-decoration[^;"]*underline'), ('tab', "mso-tab-count:1"))}
                    wf['align'] = align_before(w) == FIN
                    check(f'{tag}: Word فائل میں بولڈ/ترچھا/انڈر لائن/سیدھ ({FIN})/Tab', all(wf.values()), wf)
                    i_t, i_m = w.find('TABX'), w.find("mso-tab-count:1")
                    check(f'{tag}: Word فائل میں Tab = Word کا اپنا Tab (mso-tab-count، پہلے سے طے Tab stop = 0.5 انچ) — «TABX» سے پہلے', 0 <= i_m < i_t, (i_m, i_t))
                    lo = soffice_pdf(wfile)
                    lp = subprocess.run(['pdfinfo', lo], capture_output=True, text=True).stdout if lo else ''
                    check(f'{tag}: Word فائل کھلتی ہے (LibreOffice سے صفحات بنے)', 'Pages:' in lp, lp[:80])
                    pfile = share_download(pg, e['share'], 'pdf', V + 'share_' + e['key'] + '.pdf')
                    pages = subprocess.run(['pdfinfo', pfile], capture_output=True, text=True).stdout
                    subprocess.run(['pdftoppm', '-png', '-r', '60', '-f', '1', '-l', '1', pfile, V + 'sharepdf_' + e['key']], check=False)
                    check(f'{tag}: شیئر PDF بنی (اسی پرنٹ والے کاغذ سے)', 'Pages:' in pages, pages.split('Pages:')[1].split()[0] if 'Pages:' in pages else '')
                except Exception as ex:
                    check(f'{tag}: share crashed', False, repr(ex)[:300])
                finally:
                    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
        check(f'{tag}: کوئی JS خرابی نہیں', not errs, errs[:3])
    except Exception as ex:
        check(f'{tag}: section crashed: {sec}', False, repr(ex)[:400])
        try: pg.screenshot(path=V + 'crash_' + e['key'] + '.png')
        except Exception: pass
    finally:
        ctx.close()

# ═══════════════════════════════════════════════════════════════════════
def global_suite(b):
    tag = 'Desktop'
    ctx, pg, errs = open2(b)
    try:
        cdp = ctx.new_cdp_session(pg)
        # ── A) دستاویز کے بغیر (ڈیش بورڈ): براؤزر کے کام نہ ہوں ──
        pg.evaluate("showPage('dashboard', null)"); pg.wait_for_timeout(1200)
        klog(pg)
        for k in ('r', 'j', 'l', 'e', 'u', 'h', 's'):
            press(pg, 'Control+' + k, 150)
        log = klog(pg)
        check(f'{tag}: ڈیش بورڈ پر Ctrl+R (صفحہ تازہ) / J (ڈاؤن لوڈ) / L، E (پتے کی پٹی) / U (ماخذ) / H (تاریخ) / S — براؤزر تک نہیں', all(prevented(log, 'Key' + k.upper()) for k in 'RJLEUHS'), log)
        press(pg, 'Escape', 200)
        # Ctrl+F ڈیش بورڈ پر = ڈیش بورڈ کا اپنا خانہ
        klog(pg); press(pg, 'Control+f', 300)
        dq = pg.evaluate("() => ({ ae: document.activeElement && document.activeElement.id, dash: !!(document.activeElement && document.activeElement.closest('#dash-search')), ov: !!document.getElementById('dio-msearch') })")
        check(f'{tag}: ڈیش بورڈ پر Ctrl+F = مرکزی تلاش کا خانہ (وہی، الگ پٹی نہیں)', dq['ae'] == 'sr-query' and dq['dash'] and not dq['ov'], dq)
        # اردو کی بورڈ: ہر کلید
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
        pg.evaluate("_openMisalEditor('brief')"); pg.wait_for_timeout(2500)
        caret_end(pg, '#misal-editor')
        pg.keyboard.type(' URDU کلید'); pg.evaluate("__sel('URDU', '#misal-editor')")
        klog(pg)
        for code, key, vk in (('KeyB', 'ب', 66), ('KeyI', 'ی', 73), ('KeyU', 'ء', 85)):
            cdp_key(pg, cdp, code, key, vk)
        st = pg.evaluate("__blk('URDU', '#misal-editor')")
        log = klog(pg)
        check(f'{tag}: اردو کی بورڈ (key = ب / ی / ء) پر Ctrl+B / I / U', int(st['fw']) >= 600 and st['fst'] == 'italic' and 'underline' in st['td'] and all(prevented(log, c) for c in ('KeyB', 'KeyI', 'KeyU')), (st, log))
        # IME («Process») پر بھی
        pg.evaluate("__sel('URDU', '#misal-editor', 'in')")
        cdp_key(pg, cdp, 'KeyE', 'Process', 229)
        st = pg.evaluate("__blk('URDU', '#misal-editor')")
        check(f'{tag}: اردو فونیٹک / IME (key = «Process») پر بھی Ctrl+E', st['ta'] == 'center', st)
        cdp_key(pg, cdp, 'KeyZ', 'ظ', 90)
        st = pg.evaluate("__blk('URDU', '#misal-editor')")
        check(f'{tag}: اردو کی بورڈ پر Ctrl+Z (key «ظ»)', st['ta'] != 'center', st)

        # ── B) پرنٹ کے بعد کرسر چھپے فریم میں نہ رہے — Ctrl+S پھر بھی سسٹم کا ──
        capture_print(pg)
        caret_end(pg, '#misal-editor')
        press(pg, 'Control+p', 200)
        res = []
        for i in range(10):
            fr = pg.evaluate("() => ({ frame: !!document.getElementById('dio-print-frame'), ae: document.activeElement && document.activeElement.id })")
            klog(pg); toasts(pg)
            press(pg, 'Control+s', 250)
            log = klog(pg)
            res.append((fr['frame'], fr['ae'], prevented(log, 'KeyS')))
            pg.wait_for_timeout(250)
        check(f'{tag}: پرنٹ کے دوران / بعد ہر Ctrl+S سسٹم تک پہنچا (چھپے فریم کی HTML فائل نہیں)', all(r[2] for r in res), res)
        check(f'{tag}: پرنٹ کے بعد کرسر واپس دستاویز میں', res[-1][1] == 'misal-editor', res[-1])
        pg.evaluate("window.__dioPaperAuto = 'keep'; 0")

        # ── C) «شارٹ کٹس» — اوپر کی پٹی + دستاویز کی پٹی ──
        btn = pg.evaluate("() => { const b = document.getElementById('dio-dv-keys'); return !!b; }")
        check(f'{tag}: دستاویز کی پٹی میں «شارٹ کٹس»', btn)
        pg.evaluate("try { _dioResetTabs(); _dioExitDocView(); } catch (e) {} showPage('dashboard', null); 0"); pg.wait_for_timeout(1200)
        vis = pg.evaluate("() => { const b = document.getElementById('dio-keys-btn'); return !!b && b.getClientRects().length > 0 && getComputedStyle(b).display !== 'none'; }")
        check(f'{tag}: اوپر کی پٹی میں «شارٹ کٹس» بٹن', vis)
        pg.click('#dio-keys-btn'); pg.wait_for_timeout(400)
        hp = pg.evaluate("""() => { const o = document.getElementById('dio-keys-help'); if (!o) return null; const t = o.innerText;
            return { rows: o.querySelectorAll('tbody tr').length, keys: ['Ctrl+S','Ctrl+X','Ctrl+C','Ctrl+V','Ctrl+F','Ctrl+H','Ctrl+B','Ctrl+I','Ctrl+U','Ctrl+Z','Ctrl+Y','Ctrl+J','Ctrl+R','Ctrl+L','Ctrl+E','Ctrl+[','Ctrl+]','Ctrl+A','Ctrl+P','Shift+Tab','Ctrl+N','Ctrl+T','Ctrl+W'].filter(k => t.indexOf(k) < 0),
                     dir: getComputedStyle(o.querySelector('.dkh-card')).direction, kbd: getComputedStyle(o.querySelector('kbd')).direction, h: getComputedStyle(o.querySelector('h2')).fontSize }; }""")
        check(f'{tag}: «شارٹ کٹس» فہرست — ہر کلید درج، اردو RTL، کلیدیں LTR، سرخی 16pt، براؤزر کی مخصوص کلیدیں بھی', hp and hp['rows'] >= 13 and not hp['keys'] and hp['dir'] == 'rtl' and hp['kbd'] == 'ltr' and abs(float(hp['h'][:-2]) - 21.33) < 0.1, hp)
        pg.screenshot(path=V + 'desk_help.png')
        press(pg, 'Escape', 300)
        check(f'{tag}: Esc سے فہرست بند', pg.evaluate("!document.getElementById('dio-keys-help')"))

        # ── D) مرکزی تلاش کا پٹی: نتیجہ کھولنے پر دستاویز بند ہو کر نتیجہ ──
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
        pg.evaluate("_openMisalEditor('brief')"); pg.wait_for_timeout(2500)
        caret_end(pg, '#misal-editor')
        pg.keyboard.type(' 1234/26')
        pg.evaluate("__sel('1234/26', '#misal-editor')")
        press(pg, 'Control+f', 2500)
        res = pg.evaluate("() => ({ n: document.querySelectorAll('#dio-msearch #sr-results [onclick]').length, q: (document.getElementById('sr-query') || {}).value })")
        check(f'{tag}: Ctrl+F کی پٹی میں مرکزی تلاش کے نتیجے (منتخب «1234/26»)', res['n'] >= 1 and res['q'] == '1234/26', res)
        pg.screenshot(path=V + 'desk_msearch.png')
        if res['n']:
            pg.click('#dio-msearch #sr-results [onclick*="openCaseWorkspace"]'); pg.wait_for_timeout(2500)
            st = pg.evaluate("() => ({ ov: !!document.getElementById('dio-msearch'), dv: !!document.getElementById('dio-docview'), ws: !!document.querySelector('.case-tab, #workspace-tab-content') })")
            check(f'{tag}: نتیجہ کھولا — تلاش بند، دستاویز بند، مقدمہ سامنے', not st['ov'] and not st['dv'] and st['ws'], st)

        # ── E) Regression: مائیک (Desktop) کرسر والی جگہ پر لکھے ──
        pg.evaluate("""(() => { window.webkitSpeechRecognition = function () { const me = this;
            me.start = function () { setTimeout(function () { me.onresult && me.onresult({ resultIndex: 0, results: [Object.assign([{ transcript: 'مائیک کا متن' }], { isFinal: true })] }); }, 50); };
            me.stop = function () {}; }; window.SpeechRecognition = window.webkitSpeechRecognition; return 0; })()""")
        pg.evaluate("_openMisalEditor('brief')"); pg.wait_for_timeout(2500)
        caret_end(pg, '#misal-editor'); pg.wait_for_timeout(300)
        mv = pg.evaluate("() => { const b = document.getElementById('global-mic-btn'); return !!b && b.style.display !== 'none' && b.getClientRects().length > 0; }")
        check(f'{tag}: (regression) تیرتا مائیک لکھنے کی جگہ پر نظر آتا ہے', mv)
        if mv:
            pg.click('#global-mic-btn'); pg.wait_for_timeout(700); pg.click('#global-mic-btn'); pg.wait_for_timeout(200)
            t = pg.evaluate("document.getElementById('misal-editor').innerText")
            check(f'{tag}: (regression) مائیک کا متن اسی دستاویز میں', 'مائیک کا متن' in t, t[-60:])
            press(pg, 'Control+z', 300)
            t2 = pg.evaluate("document.getElementById('misal-editor').innerText")
            check(f'{tag}: مائیک کا متن بھی Ctrl+Z سے واپس', 'مائیک کا متن' not in t2, t2[-60:])
        check(f'{tag}: (regression) کوئی تیرتی ٹول بار نہیں', pg.evaluate("!document.getElementById('dio-float-bar')"))

        # ── F) میعاد ختم (صرف دیکھنا): Ctrl+S / Ctrl+B کچھ نہ بدلیں، Ctrl+F تلاش کھلی ──
        pg.evaluate("try { _dioResetTabs(); _dioExitDocView(); } catch (e) {} 0")
        pg.evaluate("_dioEnterViewOnly()"); pg.wait_for_timeout(400)
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
        pg.evaluate("_openMisalEditor('brief')"); pg.wait_for_timeout(2500)
        h0 = pg.evaluate("document.getElementById('misal-editor').innerHTML")
        n0 = len(pg.evaluate("window.__db.case_documents || []"))
        pg.evaluate("__sel('URDU', '#misal-editor')")
        klog(pg); toasts(pg)
        for k in ('b', 'e', 's', 'z'):
            press(pg, 'Control+' + k, 250)
        h1 = pg.evaluate("document.getElementById('misal-editor').innerHTML")
        log, ts = klog(pg), toasts(pg)
        check(f'{tag}: صرف دیکھنا: Ctrl+B / E / S / Z سے کچھ نہیں بدلا، سرور پر کچھ نہیں لکھا', h1 == h0 and len(pg.evaluate("window.__db.case_documents || []")) == n0, ts)
        check(f'{tag}: صرف دیکھنا: Ctrl+S پر بھی براؤزر کا «Save as» نہیں', prevented(log, 'KeyS'), log)
        press(pg, 'Control+f', 400)
        check(f'{tag}: صرف دیکھنا: Ctrl+F تلاش پھر بھی کھلتی ہے', pg.evaluate("!!document.getElementById('dio-msearch')"))
        check(f'{tag}: کوئی JS خرابی نہیں', not errs, errs[:3])
    except Exception as ex:
        check(f'{tag}: global section crashed', False, repr(ex)[:400])
        try: pg.screenshot(path=V + 'crash_global.png')
        except Exception: pass
    finally:
        ctx.close()

def mobile_suite(b):
    tag = 'Mobile'
    ctx, pg, errs = open2(b, mobile=True)
    try:
        pg.evaluate("showPage('dashboard', null)"); pg.wait_for_timeout(1200)
        hid = pg.evaluate("() => { const b = document.getElementById('dio-keys-btn'); return !!b && getComputedStyle(b).display === 'none'; }")
        check(f'{tag}: (فیصلہ) «شارٹ کٹس» بٹن موبائل کی پٹی میں نہیں', hid)
        tb = pg.evaluate("() => { const t = document.querySelector('.topbar'); return t ? t.scrollWidth <= t.clientWidth + 1 : null; }")
        check(f'{tag}: اوپر کی پٹی پہلے جیسی (افقی scroll نہیں)', tb)
        pg.screenshot(path=V + 'mob_dashboard.png')
        # دستاویز: لکھائی، محفوظ بٹن (موبائل پر کی بورڈ کی کلیدیں نہیں — بٹن ہی راستہ)
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800); pg.evaluate("_newZimni()"); pg.wait_for_timeout(2500)
        caret_end(pg, '#ch173-doc .zf-body')
        pg.keyboard.type(' موبائل کی لکھائی')
        # ٹیبلٹ / موبائل کے ساتھ جڑا کی بورڈ: Tab وہی 1.27 سینٹی میٹر (کاغذ اسکرین پر چھوٹا دکھے تو اسی تناسب سے)
        press(pg, 'Enter'); pg.keyboard.type('لفظ MREF'); press(pg, 'Enter'); press(pg, 'Tab'); pg.keyboard.type('لفظ MTAB'); pg.wait_for_timeout(200)
        MTAB = """() => { const a = __rect('MREF', '#ch173-doc'), t = __rect('MTAB', '#ch173-doc'), d = document.getElementById('ch173-doc');
            const k = d.getBoundingClientRect().width / d.offsetWidth; return (a && t) ? { css: Math.round((a.r - t.r) / k * 100) / 100, k: Math.round(k * 1000) / 1000 } : null; }"""
        mt = pg.evaluate(MTAB)
        check(f'{tag}: (جڑا کی بورڈ) سطر کے شروع میں Tab = 1.27 سینٹی میٹر (48px کاغذ پر)', mt and abs(mt['css'] - TAB_PX) <= 1.5, mt)
        n0 = len(pg.evaluate("window.__db.zimni_reports || []"))
        pg.evaluate("document.getElementById('zf-save-btn') && document.getElementById('zf-save-btn').click(); 0"); pg.wait_for_timeout(2200)
        n1 = len(pg.evaluate("window.__db.zimni_reports || []"))
        check(f'{tag}: ضمنی لکھی اور «محفوظ» بٹن سے سرور پر', n1 == n0 + 1, (n0, n1))
        # محفوظ → صفحہ reload → دوبارہ کھولی: Tab (حاشیہ) موبائل پر بھی وہی
        reload_keep_db(pg)
        pg.evaluate("async () => { " + EDITORS[0]['reopen'] + " }"); pg.wait_for_timeout(4500)
        mt2 = pg.evaluate(MTAB)
        check(f'{tag}: reload کے بعد موبائل پر بھی Tab = 1.27 سینٹی میٹر', mt2 and abs(mt2['css'] - TAB_PX) <= 1.5, mt2)
        dvk = pg.evaluate("() => { const b = document.getElementById('dio-dv-keys'); return !b || getComputedStyle(b).display === 'none'; }")
        check(f'{tag}: دستاویز کی پٹی میں بھی «شارٹ کٹس» نہیں', dvk)
        mic = pg.evaluate("() => { const b = document.getElementById('global-mic-btn'); return !b || b.style.display === 'none' || !b.getClientRects().length; }")
        check(f'{tag}: (regression) موبائل پر تیرتا مائیک نہیں', mic)
        check(f'{tag}: کوئی تیرتی ٹول بار نہیں', pg.evaluate("!document.getElementById('dio-float-bar')"))
        pg.screenshot(path=V + 'mob_zimni.png')
        check(f'{tag}: کوئی JS خرابی نہیں', not errs, errs[:3])
    except Exception as ex:
        check(f'{tag}: section crashed', False, repr(ex)[:400])
    finally:
        ctx.close()

if __name__ == '__main__':
    with sync_playwright() as p:
        b = p.chromium.launch()
        for e in EDITORS:
            if ONLY and e['key'] not in ONLY: continue
            editor_suite(b, e)
        if not ONLY or 'global' in ONLY: global_suite(b)
        if not ONLY or 'mobile' in ONLY: mobile_suite(b)
        b.close()
    fails = [r for r in R if r[0] == 'FAIL']
    print('\n%d PASS, %d FAIL' % (len(R) - len(fails), len(fails)))
    for f in fails: print('FAIL', f[1], '—', str(f[2])[:300])
    sys.exit(1 if fails else 0)
