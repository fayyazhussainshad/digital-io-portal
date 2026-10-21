"""(v554) اصل ایپ کی جانچ — Desktop + Mobile، سکرین + پرنٹ + PDF / Word فائلیں

افسر کی فہرست (v554):
  1) جس مقدمے میں کراس ورژن درج نہیں، اُس میں ایف آئی آر / ملزمان / گواہان کی چِپ پر ہر بار
     «FIR یا کراس ورژن» کا انتخاب نہیں — کراس ورژن صرف اُسی مقدمے میں جس میں درج ہو
     (وجہ: نئے مقدمے کا فارم اوپر والا نمبر/تاریخ چھپے کراس خانوں میں نقل کر کے محفوظ کرتا تھا)
  2) پورے مقدمے کا پرنٹ کارڈ صرف ضرورت جتنا چوڑا؛ فہرست میں ملزمان / گواہان (FIR، کراس ورژن)،
     ہمراہی ملازمان اور شہادتیں نہیں
  3) پورے مقدمے کی فائل (پرنٹ / PDF / Word) بالکل ویسی جیسی مقدمے کے اندر چِپ کھولنے پر — ہر
     فارم، ضمنی، چالان، سزا سلپ الگ ایک یا زیادہ صفحات پر؛ اسکرین کی شکل (فہرستیں، بٹن) کبھی نہیں
  4) میرے مقدمات: «مدعی»، «شناختی کارڈ»، «موبائل» کی سرخیاں کالم کے درمیان
  5) فہرست کے «پرنٹ»، «ڈاؤن لوڈ»، «شیئر» — تینوں کا اپنا اپنا کام

جانچ کا طریقہ (3): ہر دستاویز کا اپنا پرنٹ (وہی جو اُس کا «پرنٹ» بٹن دیتا ہے) اکیلا چھاپ کر
  اُس کے صفحات، اور پورے مقدمے کے ایک پرنٹ کے صفحات — گنتی، کاغذ کا سائز اور ہر صفحے کی تصویر
  (pixel) کا موازنہ۔ PDF اور Word (.docx) بھی اسی پرنٹ سے صفحہ بہ صفحہ۔

چلانا: README.md — `python3 v554_test.py` (poppler اور LibreOffice درکار: pdftoppm / pdfinfo / soffice)
"""
import sys, os, re, json, subprocess, zipfile, shutil, glob, time
sys.path.insert(0, '.')
from real import *
from PIL import Image, ImageChops, ImageFilter

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v554/'
os.makedirs(V, exist_ok=True)
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..')

SEED = """(() => { const d = window.__db;
  const c1 = d.cases.find(c => c.id === 'c1');
  // اصل مسئلہ والی صورت: کراس ورژن پر ✓ نہیں، مگر پرانے فارم نے اوپر والا نمبر/تاریخ کراس خانوں میں نقل کر دیا
  // تاریخیں اُسی شکل میں جیسے مقدمے کا فارم محفوظ کرتا ہے (DD/MM/YYYY)
  Object.assign(c1, { fir_number:'663/26', fir_date:'15/10/2026', occurrence_date:'22/09/2026', section_of_law:'379 ت پ',
    complainant:'محمد امجد حسین ولد عاشق حسین قوم آرائیں سکنہ بیرون دہلی گیٹ ملتان', complainant_cnic:'36302-1234567-1', complainant_cell:'0300-1234567',
    case_station:'صدر ملتان', case_district:'ملتان', is_cross_version:false, cross_fir_number:'663/26', cross_fir_date:'15/10/2026', cross_status:'under', cross_position:'pending' });
  d.cases.push({ id:'c2', officer_id:'o1', fir_number:'700/26', fir_date:'2026-10-16', section_of_law:'324 ت پ', status:'under', created_at:'2026-10-16',
    complainant:'رشید احمد ولد نذیر احمد', case_station:'صدر ملتان', case_district:'ملتان',
    is_cross_version:true, cross_fir_number:'701/26', cross_complainant:'اکرم ولد اللہ دتہ' });
  // پرانا ریکارڈ: ✓ کا خانہ ہی نہیں، مگر اصل کراس ڈیٹا موجود
  d.cases.push({ id:'c3', officer_id:'o1', fir_number:'710/26', fir_date:'17/10/2026', occurrence_date:'16/10/2026', section_of_law:'337 ت پ', status:'under', created_at:'2026-10-17',
    complainant:'ساجد ولد امین', case_station:'صدر ملتان', case_district:'ملتان', cross_complainant:'نعیم ولد بشیر', cross_fir_number:'710/26' });
  d.fir_matn = [{ id:'m1', case_id:'c1', type:'fir', matn:'سائل ایک شریف اور قانون پسند شہری ہے۔ مورخہ 22.09.26 کو نامعلوم چور نے میری بیوی کا پرس چوری کر لیا۔', created_at:'2026-10-15' },
    { id:'m2', case_id:'c2', type:'fir', matn:'بیان مدعی برائے مقدمہ 700۔', created_at:'2026-10-16' },
    { id:'m3', case_id:'c2', type:'cross_version', matn:'کراس ورژن کا بیان برائے مقدمہ 701۔', created_at:'2026-10-16' }];
  d.case_witnesses = [{ id:'w1', case_id:'c1', full_name:'شہزاد احمد ولد بشیر احمد', witness_type:'fir', status:'fir_eye', created_at:'2026-10-15' }];
  d.report_173 = [{ id:'r1', case_id:'c1', officer_id:'o1', report_type:'interim', report_subtype:'fir', form_data:{ head:'انٹیرم چالان', saved_at:'2026-10-20T10:00:00Z' }, created_at:'2026-10-20T10:00:00Z' }];
  d.case_documents = [{ id:'cd-brief', case_id:'c1', document_type:'brief', status:'complete', content:{ html:'<h2>بریف مقدمہ</h2><p>یہ بریف کا متن ہے۔ تفتیش جاری ہے۔</p>', date:'' }, created_at:'2026-10-16' }];
  return 0; })()"""

TOASTS = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"""
# ہر دستاویز کا اپنا پرنٹ HTML (جو مجموعے میں گیا) — صرف جانچ کے لیے ریکارڈ
RECORD = """(() => { window.__docs = []; const o = DIO.share.capturePrint;
  DIO.share.capturePrint = async function (run) { const r = await o(run); if (r && r.html) window.__docs.push(r.html); return r; };
  const e = DIO.share._elementToHtml; DIO.share._elementToHtml = function (el) { const h = e(el); window.__docs.push(h); return h; };
  window.__dp = []; window._dioDoPrint = function (h) { window.__dp.push(h); }; return 0; })()"""

def ws(pg, cid='c1'):
    pg.evaluate("try{_dioResetTabs&&_dioResetTabs()}catch(e){} try{_dioExitDocView()}catch(e){} 0")
    pg.evaluate(f"openCaseWorkspace('{cid}')"); pg.wait_for_timeout(1400)

def leave(pg):
    pg.evaluate("try{_dioResetTabs&&_dioResetTabs()}catch(e){} try{_dioExitDocView()}catch(e){} try{closeModal()}catch(e){} 0")
    pg.evaluate("showPage('cases', null)"); pg.wait_for_timeout(1300)

def type_zimni(pg, txt, date=None):
    pg.evaluate("_newZimni()"); pg.wait_for_timeout(1500)
    if date:   # v555: ایک تاریخ کی ایک ہی ضمنی — ہر ضمنی اپنی تاریخ پر
        pg.evaluate("""(d) => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = d; a.dispatchEvent(new Event('input',{bubbles:true})); return 0; }""", date)
        pg.wait_for_timeout(300)
    pg.evaluate("""(t) => { const b = document.querySelector('#ch173-doc .zf-body'); b.focus(); const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); return 0; }""", txt)
    pg.wait_for_timeout(300); pg.keyboard.press('Control+s'); pg.wait_for_timeout(1800)

def make_docs(pg):
    """اصل ایپ کے اپنے راستوں سے مقدمہ c1 کی دستاویزات محفوظ: 2 ضمنیاں، سزا سلپ، 2 درخواستیں،
       CRO کارڈ، RFA، 2 CDR درخواستیں، بیان 161"""
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
    ws(pg); pg.evaluate("openZimniEditor('c1')"); pg.wait_for_timeout(1200)
    type_zimni(pg, ' پہلی ضمنی — مقدمہ کی تفتیش جاری ہے۔', '19/10/2026')
    pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(900)
    type_zimni(pg, ' دوسری ضمنی — گواہان کے بیانات قلمبند کیے گئے۔', '20/10/2026')
    ws(pg); pg.evaluate("_openMisalEditor('saza_slip')"); pg.wait_for_timeout(3000); pg.evaluate("_sazaSave()"); pg.wait_for_timeout(1500)
    for i in range(2):
        ws(pg); pg.evaluate("_openMisalEditor('darkhwastain')"); pg.wait_for_timeout(2200)
        if i:
            pg.evaluate("_dkNewEntry()"); pg.wait_for_timeout(1500)
            pg.evaluate("DK_TYPES[3] && _dkSetType(DK_TYPES[3].id); 0"); pg.wait_for_timeout(600)
        pg.evaluate("_dkSave()"); pg.wait_for_timeout(1500)
    ws(pg); pg.evaluate("_openMisalEditor('cro_card')"); pg.wait_for_timeout(1800)
    pg.evaluate("_openCroForAccused('a1')"); pg.wait_for_timeout(1200); pg.evaluate("_saveCro()"); pg.wait_for_timeout(1500)
    ws(pg); pg.evaluate("_openMisalEditor('rfa_form')"); pg.wait_for_timeout(1800)
    pg.evaluate("_newRfa()"); pg.wait_for_timeout(1200); pg.evaluate("_saveRfa()"); pg.wait_for_timeout(1500)
    for i in range(2):
        ws(pg); pg.evaluate("_openMisalEditor('cdr_imei')"); pg.wait_for_timeout(1800)
        pg.evaluate("_newCdr()"); pg.wait_for_timeout(1200); pg.evaluate("_saveCdr()"); pg.wait_for_timeout(1500)
    ws(pg); pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
    pg.evaluate("_newZimniA()"); pg.wait_for_timeout(1500); pg.evaluate("_saveZimniA()"); pg.wait_for_timeout(1800)
    leave(pg)
    pg.evaluate("window.__dioPaperAuto = undefined; 0")
    return pg.evaluate("""(() => { const d = window.__db, c = (t, f) => (d[t] || []).filter(r => r.case_id === 'c1' && (!f || f(r))).length;
      return { zimni: c('zimni_reports'), za: c('zimni_androoni_reports'), saza: c('case_documents', r => r.document_type === 'saza_slip'),
               dk: c('case_documents', r => r.document_type === 'darkhwastain'), cro: c('cro_cards'), rfa: c('rfa_forms'), cdr: c('cdr_imei_requests') }; })()""")

# ── PDF / تصویر ───────────────────────────────────────────────────────────
def pdf_sizes(path):
    out = subprocess.run(['pdfinfo', '-f', '1', '-l', '999', path], capture_output=True, text=True).stdout
    return [tuple(round(float(x)) for x in m) for m in re.findall(r'Page\s+\d+ size:\s+([\d.]+) x ([\d.]+)', out)]

def page_imgs(path, tag, dpi=50):
    for f in glob.glob(V + tag + '-*.png'): os.remove(f)
    subprocess.run(['pdftoppm', '-gray', '-png', '-r', str(dpi), path, V + tag], check=True)
    fs = sorted(glob.glob(V + tag + '-*.png'), key=lambda f: int(re.search(r'-(\d+)\.png$', f).group(1)))
    return [Image.open(f).convert('L') for f in fs]

# افسر کے آلے پر «Jameel Noori Nastaleeq» موجود ہوتا ہے (ایپ اسی میں دکھاتی ہے) — چھپے کاغذ کی جانچ
#   بھی اسی حالت میں: ہر کاغذ کو یہ فونٹ ملے (جیسے کمپیوٹر پر انسٹال ہو)، چاہے اُس کے HTML میں اپنا نہ ہو
JAMEEL_LOCAL = ("<style>@font-face{font-family:'Jameel Noori Nastaleeq';"
                "src:url('https://cdn.jsdelivr.net/npm/jameel-noori/fonts/jameel-noori-nastaleeq4.woff2') format('woff2');}</style>")

def html_pdf(b, html, name):
    """چھپائی کا HTML → اصل Chromium کی PDF (وہی جو پرنٹ میں نکلتی)"""
    fn = '_t_v554_' + name + '.html'
    h = re.sub(r'(<head[^>]*>)', lambda m: m.group(1) + JAMEEL_LOCAL, html, count=1) if re.search(r'<head[^>]*>', html) else JAMEEL_LOCAL + html
    open(os.path.join(ROOT, fn), 'w', encoding='utf-8').write(h)
    ctx = b.new_context(); ctx.route('**/*', route); p = ctx.new_page()
    try:
        p.goto(BASE + fn); p.wait_for_timeout(1800); p.evaluate("document.fonts.ready"); p.wait_for_timeout(300)
        p.emulate_media(media='print'); vis = p.evaluate("document.body.innerText"); p.emulate_media(media='null')
        p.pdf(path=V + name + '.pdf', prefer_css_page_size=True, print_background=True)
    finally:
        ctx.close(); os.remove(os.path.join(ROOT, fn))
    VIS[name] = vis
    return V + name + '.pdf'
VIS = {}

def tile_diff(a, b, t=24, thr=60):
    """دو صفحوں کا فرق: سب سے زیادہ بدلے ہوئے چھوٹے خانے (24px) میں بدلے pixel کا تناسب"""
    if a.size != b.size: b = b.resize(a.size)
    a = a.filter(ImageFilter.GaussianBlur(1)); b = b.filter(ImageFilter.GaussianBlur(1))
    d = ImageChops.difference(a, b).point(lambda v: 255 if v > thr else 0)
    W, H = d.size; worst = 0.0
    for y in range(0, H, t):
        for x in range(0, W, t):
            h = d.crop((x, y, min(W, x + t), min(H, y + t))).histogram()
            worst = max(worst, h[255] / max(1, sum(h)))
    hh = d.histogram()
    return round(worst, 3), round(hh[255] / max(1, sum(hh)), 4)

def ink(im):
    h = im.histogram(); return sum(h[:128]) / max(1, sum(h))

def select(pg, names):
    pg.evaluate("""(want) => { document.querySelectorAll('#dcp-list .dcp-row').forEach(r => {
        r.querySelector('input').checked = want.includes(r.querySelector('.dcp-nm').textContent.trim()); }); return 0; }""", names)

def dialog(pg, cid, mode):
    pg.evaluate(f"openCasePrint('{cid}','{mode}')"); pg.wait_for_selector('#dcp-list .dcp-row', timeout=20000); pg.wait_for_timeout(400)

def item_names(pg):
    return pg.evaluate("[...document.querySelectorAll('#dcp-list .dcp-row .dcp-nm')].map(n => n.textContent.trim())")

def wait_for(pg, js, ms=240000):
    t0 = time.time()
    while time.time() - t0 < ms / 1000:
        if pg.evaluate(js): return True
        pg.wait_for_timeout(250)
    return False

UI_WORDS = ['▾', 'ایکشن', 'سرور پر محفوظ', 'ہیڈ (قسم)', 'ملزمان کی فہرست', 'RFA فارم — فہرست', 'درج کریں', 'CDR/IMEI درخواستیں']

# ═══════════════════════════════════════════════════════════════════════════
def run(b, tag, args, mobile):
    ctx, pg, errs = open_app(b, accept_downloads=True, **args)
    pg.evaluate(SEED); pg.evaluate(TOASTS)
    # getCase پہلے آلے کا cache دیتا ہے — آزمائشی ڈیٹا وہاں بھی (جیسے اصل میں سرور سے آ کر)
    pg.evaluate("Promise.all(window.__db.cases.map(c => offlineStore.cache('cases_cache', JSON.parse(JSON.stringify(c)))))")
    gc = pg.evaluate("(async () => { const c = await getCase('c1'); return [c.cross_fir_number, c.is_cross_version, c.occurrence_date]; })()")
    check(f'{tag}: (تیاری) مقدمہ 663/26 آلے پر اسی شکل میں — خودکار نقل والا کراس نمبر، ✓ نہیں', gc == ['663/26', False, '22/09/2026'], gc)
    sec = ''
    def section(n):
        nonlocal sec; sec = n; print('── ' + n, flush=True)

    # ── 1) کراس ورژن صرف اُسی مقدمے میں جس میں درج ہو ─────────────────────────
    try:
        section('کراس ورژن')
        hc = pg.evaluate("['c1','c2','c3'].map(id => caseHasCross(window.__db.cases.find(c => c.id === id)))")
        check(f'{tag}: کراس ورژن — 663/26 (✓ نہیں، صرف خودکار نقل) نہیں · ✓ والا ہاں · پرانا اصل کراس ڈیٹا ہاں', hc == [False, True, True], hc)
        ws(pg, 'c1')
        chips = pg.evaluate("[...document.querySelectorAll('#misal-doc-bar .mdoc-chip')].slice(0, 4).map(c => c.textContent.trim())")
        check(f'{tag}: کراس کے بغیر مقدمہ — ایف آئی آر / ملزمان / گواہان کی چِپ پر انتخاب (▾) نہیں', chips[1:4] == ['ایف آئی آر', 'ملزمان', 'گواہان'] and not any('▾' in c for c in chips), chips)
        pg.click("#misal-doc-bar .mdoc-chip:text-is('ایف آئی آر')"); pg.wait_for_timeout(1500)
        dd = pg.evaluate("(() => { const d = document.getElementById('fir-dd'); return d ? getComputedStyle(d).display : 'none'; })()")
        parts = pg.evaluate("[...document.querySelectorAll('#fir-page section.fir-part')].map(s => s.id)")
        check(f'{tag}: ایک ہی کلک — سیدھا ایف آئی آر کا صفحہ (کوئی انتخاب نہیں)، کراس ورژن کا حصہ نہیں', dd == 'none' and parts == ['fir-part-fir'], (dd, parts))
        ws(pg, 'c2')
        chips2 = pg.evaluate("[...document.querySelectorAll('#misal-doc-bar .mdoc-chip')].slice(1, 4).map(c => c.textContent.trim())")
        check(f'{tag}: کراس ورژن والے مقدمے میں انتخاب (▾) موجود', all('▾' in c for c in chips2), chips2)
        pg.evaluate("_ddPick('fir-dd','fir')"); pg.wait_for_selector('#fir-page'); pg.wait_for_timeout(800)
        parts2 = pg.evaluate("[...document.querySelectorAll('#fir-page section.fir-part')].map(s => s.id)")
        check(f'{tag}: کراس ورژن والے مقدمے میں دونوں حصے', parts2 == ['fir-part-fir', 'fir-part-cross_version'], parts2)
        leave(pg)
        # فارم: ✓ کے بغیر محفوظ → کراس کے تمام خانے خالی؛ ✓ کے ساتھ → لکھا ہوا محفوظ
        pg.evaluate("openEditCaseModal('c1')"); pg.wait_for_selector('#cf-cross-version', state='attached', timeout=15000); pg.wait_for_timeout(600)
        st = pg.evaluate("document.getElementById('cf-cross-version').checked")
        check(f'{tag}: ترمیم کا کارڈ (663/26) — کراس ورژن پر ✓ نہیں', st is False, st)
        pg.evaluate("saveEditCase('c1')"); pg.wait_for_timeout(2000)
        row = pg.evaluate("(() => { const c = window.__db.cases.find(x => x.id === 'c1'); return Object.fromEntries(Object.keys(c).filter(k => k.startsWith('cross_') || k === 'is_cross_version').map(k => [k, c[k]])); })()")
        check(f'{tag}: ✓ کے بغیر محفوظ — کراس کے تمام خانے خالی (خودکار نقل نہیں)', row.get('is_cross_version') is False and all(v is None for k, v in row.items() if k != 'is_cross_version'), row)
        pg.evaluate("openEditCaseModal('c3')"); pg.wait_for_selector('#cf-cross-version', state='attached', timeout=15000); pg.wait_for_timeout(600)
        st3 = pg.evaluate("[document.getElementById('cf-cross-version').checked, document.getElementById('cf-cross-complainant').value]")
        check(f'{tag}: پرانا ریکارڈ (اصل کراس ڈیٹا) — کارڈ ✓ کے ساتھ اور ڈیٹا سمیت کھلتا ہے', st3 == [True, 'نعیم ولد بشیر'], st3)
        pg.evaluate("saveEditCase('c3')"); pg.wait_for_timeout(2000)
        r3 = pg.evaluate("(() => { const c = window.__db.cases.find(x => x.id === 'c3'); return [c.is_cross_version, c.cross_complainant, c.cross_fir_number]; })()")
        check(f'{tag}: ✓ کے ساتھ محفوظ — کراس کا ڈیٹا برقرار', r3 == [True, 'نعیم ولد بشیر', '710/26'], r3)
        pg.evaluate("try{closeModal()}catch(e){} 0")
        leave(pg)
        badge = pg.evaluate("""(() => { const rows = [...document.querySelectorAll('#cs-rows tr')]; const f = n => { const r = rows.find(t => t.innerText.replace(/\\s+/g, '').includes(n)); return r ? r.innerText.includes('کراس ورژن') : null; };
            return [f('663/26'), f('700/26'), f('710/26')]; })()""")
        check(f'{tag}: فہرست میں «کراس ورژن» کا نشان صرف کراس والے مقدمات پر', badge == [False, True, True], badge)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 4) میرے مقدمات: سرخیاں درمیان میں ─────────────────────────────────────
    try:
        section('سرخیاں')
        leave(pg)
        hd = pg.evaluate("""(() => { const out = {}; [...document.querySelectorAll('#page-content thead th')].forEach(th => {
            const t = th.textContent.trim(); if (!['مدعی', 'شناختی کارڈ', 'موبائل'].includes(t)) return;
            const r = th.getBoundingClientRect(); const rg = document.createRange(); rg.selectNodeContents(th); const tr = rg.getBoundingClientRect();
            out[t] = { align: getComputedStyle(th).textAlign, off: Math.round(((tr.left + tr.right) / 2 - (r.left + r.right) / 2) * 10) / 10, vis: r.width > 0 }; }); return out; })()""")
        ok = len(hd) == 3 and all(v['align'] == 'center' and (abs(v['off']) <= 2 or not v['vis']) for v in hd.values())
        check(f'{tag}: «مدعی»، «شناختی کارڈ»، «موبائل» کی سرخیاں کالم کے بالکل درمیان', ok, hd)
        other = pg.evaluate("[...document.querySelectorAll('#page-content thead th')].filter(th => ['تاریخ اندراج', 'تھانہ'].includes(th.textContent.trim())).map(th => getComputedStyle(th).textAlign)")
        check(f'{tag}: باقی سرخیاں جوں کی توں', other and all(a != 'center' for a in other), other)
        pg.screenshot(path=f'{V}{tag}_cases.png')
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 2 + 5) کارڈ: چوڑائی، فہرست، تین بٹن تین کام ───────────────────────────
    try:
        section('کارڈ اور تین بٹن')
        acts = pg.evaluate("(() => { const tr = [...document.querySelectorAll('#cs-rows tr')].find(r => r.innerText.replace(/\\s+/g, '').includes('663/26')); return [...tr.querySelectorAll('button')].map(b => [b.getAttribute('aria-label'), b.getAttribute('onclick')]); })()")
        oc = {a: o for a, o in acts}
        check(f'{tag}: فہرست میں پرنٹ / ڈاؤن لوڈ / شیئر — تین الگ راستے', "openCasePrint('" in oc.get('پرنٹ', '') and "'download')" in oc.get('ڈاؤنلوڈ', '') and "'share')" in oc.get('شیئر', ''), acts)
        exp = {'print': ('پرنٹ —', ['print']), 'download': ('ڈاؤن لوڈ —', ['pdf', 'word']), 'share': ('شیئر —', ['pdf', 'word'])}
        for mode, (ttl, btns) in exp.items():
            dialog(pg, 'c1', mode)
            info = pg.evaluate("""(() => { const m = document.querySelector('#modal-backdrop .modal-card'), l = document.getElementById('dcp-list'), w = document.querySelector('.dcp-wrap');
                return { title: document.getElementById('modal-title').textContent.trim(), btns: [...document.querySelectorAll('#modal-footer [data-dcp]')].map(b => b.dataset.dcp),
                  labels: [...document.querySelectorAll('#modal-footer button')].map(b => b.textContent.trim()),
                  card: Math.round(m.getBoundingClientRect().width), list: Math.round(l.getBoundingClientRect().width), wrap: Math.round(w.getBoundingClientRect().width),
                  body: Math.round(document.getElementById('modal-body').getBoundingClientRect().width), vw: innerWidth, sw: document.documentElement.scrollWidth }; })()""")
            check(f'{tag}: «{mode}» — کارڈ کا عنوان اور صرف اپنا بٹن ({", ".join(btns)})', info['title'].startswith(ttl) and info['btns'] == btns, (info['title'], info['labels']))
            if mode == 'print':
                if mobile:
                    check(f'{tag}: کارڈ اسکرین میں پورا (افقی scroll نہیں)', info['card'] <= info['vw'] and info['sw'] <= info['vw'], info)
                else:
                    check(f'{tag}: کارڈ ضرورت جتنا چوڑا (≤ 540px؛ پہلے 980px)', info['card'] <= 540, info)
                check(f'{tag}: فہرست کارڈ کی پوری چوڑائی میں (آدھا خالی نہیں)', info['wrap'] >= info['body'] - 40 and info['list'] >= info['body'] - 44, info)
                pg.screenshot(path=f'{V}{tag}_dialog.png')
            pg.evaluate("closeModal()"); pg.wait_for_timeout(250)
        dialog(pg, 'c1', 'print'); n1 = item_names(pg); pg.evaluate("closeModal()")
        dialog(pg, 'c2', 'print'); n2 = item_names(pg); pg.evaluate("closeModal()")
        gone = ['ملزمان FIR', 'ملزمان کراس ورژن', 'گواہان FIR', 'گواہان کراس ورژن', 'ہمراہی ملازمان', 'شہادتیں']
        check(f'{tag}: فہرست میں ملزمان / گواہان (FIR، کراس)، ہمراہی ملازمان، شہادتیں نہیں', not any(g in n1 + n2 for g in gone), [g for g in gone if g in n1 + n2])
        check(f'{tag}: «کراس ورژن» صرف کراس والے مقدمے کی فہرست میں', 'کراس ورژن' not in n1 and 'کراس ورژن' in n2, (n1[:4], n2[:4]))
        check(f'{tag}: باقی دستاویزات فہرست میں (چِپس کی ترتیب)', all(x in n1 for x in ['انڈیکس نقل مسل', 'ایف آئی آر', 'ضمنیات (تمام)', 'سزا سلپ', 'بریف مقدمہ', 'RFA فارم (تمام)']), n1)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 3) پورا مقدمہ — ہر دستاویز اپنے صفحات پر، بالکل اپنے پرنٹ جیسی ──────────
    merged_pdf = None
    try:
        section('دستاویزات بنانا')
        cnt = make_docs(pg)
        check(f'{tag}: (تیاری) اصل ایپ سے دستاویزات محفوظ', cnt == {'zimni': 2, 'za': 1, 'saza': 1, 'dk': 2, 'cro': 1, 'rfa': 1, 'cdr': 2}, cnt)
        section('پورے مقدمے کا پرنٹ')
        pg.evaluate("dioLoadScript('dio-forms.js')"); pg.evaluate("dioLoadScript('dio-share.js')"); pg.wait_for_timeout(800)
        pg.evaluate(RECORD); pg.evaluate("window.__printCalls = 0; 0")
        got = []; pg.on('download', lambda d: got.append(d.suggested_filename))
        dialog(pg, 'c1', 'print')
        saved = pg.evaluate("[...document.querySelectorAll('#dcp-list .dcp-row')].filter(r => r.querySelector('input').checked).map(r => r.querySelector('.dcp-nm').textContent.trim())")
        want = ['ایف آئی آر', 'رپورٹ 173 — انٹیرم چالان — 20/10/2026', 'بیانات 161 ض ف (تمام)', 'ضمنیات (تمام)', 'CDR/IMEI (تمام درخواستیں)', 'CRO کارڈ (تمام)', 'درخواستیں (تمام)', 'بریف مقدمہ', 'سزا سلپ', 'RFA فارم (تمام)']
        check(f'{tag}: «صرف محفوظ» — ہر محفوظ دستاویز خود منتخب', sorted(saved) == sorted(want), saved)
        select(pg, want + ['میمورنڈم'])                      # میمورنڈم = وہی ضمنیاں — دوبارہ نہ آئیں
        pg.click("#modal-footer button[data-dcp='print']")
        pg.wait_for_selector('#dio-paper-ask', timeout=8000); pg.click("#dio-paper-ask button[data-v='legal']")
        ok = wait_for(pg, "(window.__dp || []).length > 0")
        pg.wait_for_timeout(6000)                               # کوئی دیر سے آنے والا (بِن مانگا) پرنٹ؟
        n = pg.evaluate("(window.__dp || []).length"); nat = pg.evaluate("window.__printCalls")
        check(f'{tag}: ایک ہی پرنٹ — کوئی اضافی پرنٹ کا ڈبہ نہیں (سزا سلپ / ضمنی کا دیر والا پرنٹ بھی نہیں)', ok and n == 1 and nat == 0 and not got, (n, nat, got))
        h = pg.evaluate("(window.__dp || [])[0] || ''")
        docs = pg.evaluate("window.__docs")
        parts = h.count('class="dpk dpk-')
        # FIR 1 + چالان 1 + بیان 161 1 + ضمنی 2 + CDR 2 + CRO 1 + درخواست 2 + بریف 1 + سزا 1 + RFA 1 = 13
        check(f'{tag}: 13 دستاویزات، ہر ایک الگ (ضمنیاں / CDR / درخواستیں ہر ریکارڈ الگ؛ میمورنڈم سے دہرائی نہیں)', parts == 13 and len(docs) == 13, (parts, len(docs)))
        check(f'{tag}: ہر دستاویز نئے صفحے سے، اپنے کاغذ (named page) کے ساتھ', len(re.findall(r'page:dpk\d+;break-before:page', h)) == 12 and len(re.findall(r'@page dpk\d+', h)) >= 13)
        open(V + tag + '_merged.html', 'w', encoding='utf-8').write(h)
        for i, dh in enumerate(docs): open(V + f'{tag}_doc{i}.html', 'w', encoding='utf-8').write(dh)
        merged_pdf = html_pdf(b, h, tag + '_print')
        vis = VIS.get(tag + '_print', '')
        bad = [w for w in UI_WORDS if w in vis]
        check(f'{tag}: چھپے کاغذ پر اسکرین کی کوئی چیز نہیں (فہرستیں، بٹن، ▾، «سرور پر محفوظ»…)', vis and not bad, bad)
        msz = pdf_sizes(merged_pdf); mim = page_imgs(merged_pdf, tag + '_m')
        # ہر دستاویز اکیلی — بالکل وہی جو اُس کا اپنا «پرنٹ» دیتا ہے (dioPrint: جفت صفحے پر مثل کی جگہ سمیت)
        alone_sz, alone_im = [], []
        for i in range(len(docs)):
            ah = pg.evaluate("async (i) => { const h = window.__docs[i]; return (typeof dioBindNeeded === 'function' && dioBindNeeded(h)) ? await dioBindHtml(h) : h; }", i)
            p1 = html_pdf(b, ah, f'{tag}_alone{i}')
            alone_sz += pdf_sizes(p1); alone_im += page_imgs(p1, f'{tag}_a{i}')
        check(f'{tag}: صفحات کی گنتی اور کاغذ کا سائز = ہر دستاویز اکیلی چھاپنے کا مجموعہ', msz == alone_sz, (len(msz), len(alone_sz), msz[:16]))
        diffs = [tile_diff(a, m) for a, m in zip(alone_im, mim)]
        worst = max([d[0] for d in diffs] or [1])
        check(f'{tag}: ہر صفحہ بالکل اکیلی دستاویز کے صفحے جیسا (pixel؛ بدترین خانہ ≤ 3%)', len(diffs) == len(alone_im) and worst <= 0.03, [d[0] for d in diffs])
        check(f'{tag}: کوئی صفحہ خالی نہیں', all(ink(m) > 0.0005 for m in mim), [round(ink(m), 4) for m in mim])
        leave(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── PDF / Word ڈاؤن لوڈ — پرنٹ کے صفحات جیسے ──────────────────────────────
    want_dl = ['ایف آئی آر', 'رپورٹ 173 — انٹیرم چالان — 20/10/2026', 'بیانات 161 ض ف (تمام)', 'ضمنیات (تمام)', 'CDR/IMEI (تمام درخواستیں)', 'CRO کارڈ (تمام)', 'درخواستیں (تمام)', 'بریف مقدمہ', 'سزا سلپ', 'RFA فارم (تمام)']
    pdfp = None
    try:
        section('PDF ڈاؤن لوڈ')
        pg.evaluate("window.__dp = []; 0")
        dialog(pg, 'c1', 'download'); select(pg, want_dl)
        with pg.expect_download(timeout=600000) as dl:
            pg.click("#modal-footer button[data-dcp='pdf']")
            pg.wait_for_selector('#dio-paper-ask', timeout=8000); pg.click("#dio-paper-ask button[data-v='legal']")
        d = dl.value; pdfp = V + tag + '_case.pdf'; d.save_as(pdfp)
        check(f'{tag}: ڈاؤن لوڈ → سیدھی PDF فائل (پرنٹ نہیں، شیئر کا ڈبہ نہیں)', d.suggested_filename.endswith('.pdf') and pg.evaluate("(window.__dp||[]).length") == 0 and not pg.evaluate("!!document.getElementById('dcp-ready')"), d.suggested_filename)
        if merged_pdf:
            psz = pdf_sizes(pdfp); pim = page_imgs(pdfp, tag + '_p')
            msz = pdf_sizes(merged_pdf); mim = page_imgs(merged_pdf, tag + '_m')
            check(f'{tag}: PDF — صفحات کی گنتی اور ہر صفحے کا کاغذ = پرنٹ', [(round(w), round(h)) for w, h in psz] == msz, (psz[:16], msz[:16]))
            dd = [tile_diff(m, p) for m, p in zip(mim, pim)]
            check(f'{tag}: PDF کا ہر صفحہ پرنٹ کے اسی صفحے جیسا (کل فرق ≤ 4%، بدترین خانہ ≤ 45%)', len(dd) == len(mim) and all(x[1] <= 0.04 and x[0] <= 0.45 for x in dd), dd)
        leave(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    try:
        section('Word ڈاؤن لوڈ')
        dialog(pg, 'c1', 'download'); select(pg, want_dl)
        with pg.expect_download(timeout=600000) as dl:
            pg.click("#modal-footer button[data-dcp='word']")
            pg.wait_for_selector('#dio-paper-ask', timeout=8000); pg.click("#dio-paper-ask button[data-v='legal']")
        d = dl.value; wp = V + tag + '_case.docx'; d.save_as(wp)
        z = zipfile.ZipFile(wp)
        xml = z.read('word/document.xml').decode('utf-8')
        media = [x for x in z.namelist() if x.startswith('word/media/')]
        secs = re.findall(r'<w:pgSz w:w="(\d+)" w:h="(\d+)"', xml)
        check(f'{tag}: Word = درست .docx (Word 2007 اور بعد کے)', d.suggested_filename.endswith('.docx') and z.testzip() is None and '[Content_Types].xml' in z.namelist(), d.suggested_filename)
        if pdfp:
            psz = pdf_sizes(pdfp)
            check(f'{tag}: Word — ہر صفحہ الگ (اپنا کاغذ)، گنتی = PDF', len(media) == len(psz) and [(round(int(w) / 20), round(int(h) / 20)) for w, h in secs] == [(round(w), round(h)) for w, h in psz], (len(media), len(psz), secs[:4]))
            lo = V + tag + '_lo/'; shutil.rmtree(lo, ignore_errors=True); os.makedirs(lo)
            shutil.copy(wp, lo + 'case.docx')
            subprocess.run(['soffice', '--headless', '--convert-to', 'pdf', '--outdir', lo, lo + 'case.docx'], capture_output=True, timeout=300)
            lpdf = lo + 'case.pdf'
            if os.path.exists(lpdf):
                lsz = pdf_sizes(lpdf); lim = page_imgs(lpdf, tag + '_w'); pim = page_imgs(pdfp, tag + '_p')
                check(f'{tag}: Word کھولنے پر (LibreOffice) — صفحات اور کاغذ = PDF', [(round(w), round(h)) for w, h in lsz] == [(round(w), round(h)) for w, h in psz], (lsz[:6], psz[:6]))
                wd = [tile_diff(p, w) for p, w in zip(pim, lim)]
                check(f'{tag}: Word کا ہر صفحہ PDF / پرنٹ جیسا (بدترین خانہ ≤ 5%)', len(wd) == len(pim) and all(x[0] <= 0.05 for x in wd), wd)
            else:
                check(f'{tag}: Word کھولنے پر (LibreOffice)', False, 'soffice نے PDF نہیں بنائی')
        leave(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 5) شیئر — فائل تیار → «شیئر کریں» (آلے کا شیئر) ─────────────────────
    try:
        section('شیئر')
        pg.evaluate("window.__dp = []; window.__shared = null; 0")
        got2 = []; h2 = lambda d: got2.append(d.suggested_filename); pg.on('download', h2)
        dialog(pg, 'c1', 'share'); select(pg, ['ایف آئی آر', 'سزا سلپ'])
        pg.click("#modal-footer button[data-dcp='pdf']")
        pg.wait_for_selector('#dio-paper-ask', timeout=8000); pg.click("#dio-paper-ask button[data-v='a4']")
        pg.wait_for_selector('#dcp-ready', timeout=240000); pg.wait_for_timeout(500)
        btns = pg.evaluate("[...document.querySelectorAll('#dcp-ready button')].map(b => b.dataset.k)")
        check(f'{tag}: شیئر → فائل تیار کا خانہ (شیئر کریں / ڈاؤن لوڈ) — خود بخود ڈاؤن لوڈ یا پرنٹ نہیں', btns == ['share', 'dl', 'x'] and not got2 and pg.evaluate("(window.__dp||[]).length") == 0, (btns, got2))
        # آلے کا شیئر (WhatsApp وغیرہ) — یہاں اس کی نقل
        pg.evaluate("""(() => { navigator.canShare = () => true; navigator.share = async (d) => { window.__shared = d.files.map(f => [f.name, f.type, f.size]); }; return 0; })()""")
        pg.click("#dcp-ready button[data-k='share']"); pg.wait_for_timeout(1200)
        sh = pg.evaluate("window.__shared")
        check(f'{tag}: «شیئر کریں» → آلے کا شیئر، پوری PDF فائل کے ساتھ', bool(sh) and sh[0][0].endswith('.pdf') and sh[0][1] == 'application/pdf' and sh[0][2] > 10000 and not pg.evaluate("!!document.getElementById('dcp-ready')"), sh)
        pg.remove_listener('download', h2)
        leave(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── اکیلی دستاویز کی PDF (شیئر) — FIR اور بریف نستعلیق میں (پہلے دوسرے فونٹ میں) ──
    try:
        section('اکیلی دستاویز کی PDF')
        r = pg.evaluate("""async () => { await dioLoadScript('fir.js'); const h = _firPaperHtml([{ type:'fir', matn:'سائل ایک شریف اور قانون پسند شہری ہے۔' }]);
            const bl = await DIO.share.pdf({ html: h }, 't'); const u = new Uint8Array(await bl.arrayBuffer()); let s = '';
            for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return { pdf: btoa(s), html: h }; }""")
        import base64
        open(V + tag + '_fir1.pdf', 'wb').write(base64.b64decode(r['pdf']))
        a = page_imgs(V + tag + '_fir1.pdf', tag + '_f1')
        bpr = page_imgs(html_pdf(b, r['html'], tag + '_fir1p'), tag + '_f2')
        dfir = tile_diff(bpr[0], a[0])
        check(f'{tag}: FIR کے متن کی PDF — ایک صفحہ، پرنٹ جیسا فونٹ (نستعلیق)', len(a) == 1 and dfir[0] <= 0.35 and dfir[1] <= 0.01, dfir)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:3])
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch()
    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'): run(b, 'desktop', dict(viewport={'width': 1366, 'height': 768}), False)
    if only in ('', 'mobile'): run(b, 'mobile', dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2), True)
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
