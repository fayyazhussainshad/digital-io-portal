"""(v553) اصل ایپ کی جانچ — Desktop + Mobile، سکرین + پرنٹ (کاغذ پرنٹ کے وقت) + PDF / Word فائلیں

افسر کی فہرست (v553) کے تمام نکات:
  • «منظوری» کا بٹن پورے سسٹم سے ختم · نئے اندراج کا ایک نمونہ «+ … درج کریں»
  • مقدمات کی فہرست: شناختی کارڈ اور موبائل الگ کالم · پرنٹ / ڈاؤن لوڈ / شیئر → دستاویزات کی فہرست،
    جو منتخب ہوں صرف وہی ایک ہی پرنٹ میں
  • ملزمان / گواہان: دو حصے (FIR / کراس ورژن)، «سابقہ ریکارڈ» = سسٹم + درج شدہ یکجا، بغیر دہرائے
  • نقشہ موقع: محفوظ نقشوں کی فہرست (قسم/ملزم/تاریخ/وقت)، اوپر دائیں «+ نقشہ موقع درج کریں»، ہر سطر کے
    اقدامات ایک ہی سطر میں (ترمیم/پرنٹ/ڈاؤن لوڈ/کاپی/حذف)، پرنٹ سیدھا · Ctrl دبا کر سیدھی لکیر (موبائل: 📏)
    · نقشے کی جگہ (انچ) + پیمانہ + «صفحہ 1 میں باقی» · ⤓ صفحہ
  • چالان / ضمنی / سزا سلپ / درخواستیں: اوپر کی پٹی میں لیگل/A4 نہیں — پرنٹ کے وقت پوچھا جاتا ہے، اور
    Ctrl+P = «پرنٹ» بٹن (وہی سوال، وہی کاغذ)
  • مثل باندھنے کی جگہ: صرف جفت صفحات (کاغذ کی پچھلی طرف) پر اوپر بائیں 2pt کی ترچھی لکیر؛ طاق پر نہیں
    (چھپی PDF کے pixel سے، لیگل اور A4 دونوں)
  • MS Word کی چھپی کلیدیں: Ctrl+B / U، Ctrl + =، Tab، Ctrl+H، Ctrl+S
  • معیاری فونٹ 14pt + سطری فاصلہ 1.9؛ پرانا مواد 14pt پر، سرخیاں جوں کی توں
  • موبائل پر مقدمے کے ساتھ لگی FIR (PDF) نظر آتی اور چھپتی ہے
  • کوئی بھی فائل / ڈیٹا PDF / Word میں (پوری فائل، حروف سمیت) — شیئر کے بٹن ہر جگہ
  • ٹول بار کے تمام بٹنوں کی فہرست (مدد) + پرنٹ / شیئر

چلانا: README.md — `python3 v553_test.py`
"""
import sys, os, re, json, base64, shutil, subprocess
sys.path.insert(0, '.')
from real import *
from PIL import Image

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:300] if extra != '' else ''), flush=True)

DL = OUT + '/v553_dl/'
os.makedirs(DL, exist_ok=True)

CAPTURE = """(() => { window.__dp = []; window._dioDoPrint = function (h) { window.__dp.push(h); }; return 0; })()"""
TOASTS = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"""

SEED = """(() => { const d = window.__db;
  const c1 = d.cases.find(c => c.id === 'c1');
  c1.complainant_cnic = '36302-1234567-1'; c1.complainant_cell = '0300-1234567'; c1.is_cross_version = true; c1.case_station = 'صدر ملتان'; c1.case_district = 'ملتان';
  d.cases.push({ id:'c2', officer_id:'o1', fir_number:'55/24', fir_date:'2024-02-01', section_of_law:'379 ت پ', case_station:'صدر ملتان', case_district:'ملتان', status:'complete', created_at:'2024-02-01' });
  d.cases.push({ id:'c3', officer_id:'o1', fir_number:'77/25', fir_date:'2025-05-09', section_of_law:'392 ت پ', case_station:'صدر ملتان', case_district:'ملتان', status:'under', created_at:'2025-05-09' });
  d.case_accused.push({ id:'a2', case_id:'c1', name:'زاہد ولد بشیر قوم جٹ سکنہ ملتان', cnic:'36302-1234567-1', accused_type:'fir', created_at:'2026-10-09',
     prev_records:[{fir:'55/2024', date:'01/02/2024', jurm:'379 ت پ', thana:'صدر ملتان', zila:'ملتان', haisiyat:'ملزم', faisla:'چالان'},
                   {fir:'12/23', date:'05/03/2023', jurm:'411 ت پ', thana:'کینٹ', zila:'ملتان', haisiyat:'ملزم', faisla:'بری'}] });
  d.case_accused.push({ id:'a3', case_id:'c2', name:'زاہد ولد بشیر', cnic:'36302-1234567-1', accused_type:'fir', created_at:'2024-02-01' });
  d.case_accused.push({ id:'a4', case_id:'c3', name:'زاہد ولد بشیر', cnic:'36302-1234567-1', accused_type:'fir', created_at:'2025-05-09' });
  d.case_accused.push({ id:'a5', case_id:'c1', name:'عمران ولد اکرم', accused_type:'cross_version', created_at:'2026-10-10' });
  d.case_witnesses = [{ id:'w1', case_id:'c1', full_name:'اکرم ولد نذیر', cnic:'36302-7654321-3', witness_type:'fir', status:'fir_eye', created_at:'2026-10-09' },
     { id:'w2', case_id:'c2', full_name:'اکرم ولد نذیر', cnic:'36302-7654321-3', witness_type:'fir', status:'fard', created_at:'2024-02-01' },
     { id:'w3', case_id:'c1', full_name:'ساجد ولد امین', witness_type:'cross_version', status:'fir_eye', created_at:'2026-10-11' }];
  d.fir_matn = [{ id:'m1', case_id:'c1', type:'fir', matn:'متن ایف آئی آر — مدعی نے بیان کیا کہ رات کے وقت نامعلوم افراد گھر میں داخل ہوئے۔', created_at:'2026-10-08' }];
  d.ahkamat = [{ id:'h1', officer_id:'o1', title:'حکم امتناعی برائے ٹریفک', body_text:'یہ حکم تمام تھانوں کو بھیجا جاتا ہے۔', category:'عام', created_at:'2026-10-01' }];
  return 0; })()"""

LONG = ' دوران تفتیش موقع پر پہنچ کر گواہان کے بیانات قلمبند کیے گئے اور نقشہ موقع مرتب کیا گیا۔'

def ensure_auto(pg, v):
    pg.evaluate("(v) => { window.__dioPaperAuto = v; return 0; }", v)

def wait_dp(pg, n=1, tries=60):
    for _ in range(tries):
        if pg.evaluate("(window.__dp || []).length") >= n: return True
        pg.wait_for_timeout(250)
    return False

def page_size(h):
    m = re.search(r'@page\s*\{\s*size:\s*([^;]+);', h or '')
    return m.group(1).strip() if m else None

def to_pdf(b, html, name):
    """چھپائی کا HTML → اصل Chromium کی PDF (وہی جو پرنٹ میں نکلتی) → صفحات کی تصویریں"""
    dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '_t_v553_' + name + '.html')
    open(dst, 'w', encoding='utf-8').write(html)
    ctx = b.new_context(); ctx.route('**/*', route); p = ctx.new_page()
    try:
        p.goto(BASE + '_t_v553_' + name + '.html'); p.wait_for_timeout(1500)
        p.evaluate("document.fonts.ready")
        pdfp = OUT + '/v553_' + name + '.pdf'
        p.pdf(path=pdfp, prefer_css_page_size=True, print_background=True)
    finally:
        ctx.close(); os.remove(dst)
    for f in os.listdir(OUT):
        if f.startswith('v553_' + name + '-') and f.endswith('.png'): os.remove(OUT + '/' + f)
    subprocess.run(['pdftoppm', '-png', '-r', '72', pdfp, OUT + '/v553_' + name], check=True)
    pages = sorted([f for f in os.listdir(OUT) if f.startswith('v553_' + name + '-') and f.endswith('.png')],
                   key=lambda f: int(re.search(r'-(\d+)\.png$', f).group(1)))
    return [OUT + '/' + f for f in pages]

def diag_score(png, dpi=72, thr=160):
    """اوپر بائیں کونے میں 2in کی ترچھی (نیچے بائیں → اوپر دائیں) سیاہ لکیر — مسلسل ہو تو 1.0"""
    im = Image.open(png).convert('L'); px = im.load(); W, H = im.size
    L = int(2 * dpi); best = 0.0
    def dark(x, y):
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                xx, yy = x + dx, y + dy
                if 0 <= xx < W and 0 <= yy < H and px[xx, yy] < thr: return True
        return False
    for x0 in range(0, int(1.3 * dpi), 2):
        for y0 in range(0, int(2.2 * dpi), 2):
            if y0 + L >= H or x0 + L >= W: continue
            hits = 0
            for k in range(48):
                t = (k + 0.5) / 48
                if dark(int(x0 + L * t), int(y0 + L * (1 - t))): hits += 1
            best = max(best, hits / 48)
            if best >= 0.99: return best
    return best

def bind_ok(b, html, name, tag):
    pages = to_pdf(b, html, name)
    sc = [round(diag_score(p), 2) for p in pages]
    even = [s for i, s in enumerate(sc) if (i + 1) % 2 == 0]
    odd = [s for i, s in enumerate(sc) if (i + 1) % 2 == 1]
    check(f'{tag}: {name} — کم از کم 2 صفحات', len(pages) >= 2, len(pages))
    check(f'{tag}: {name} — ہر جفت صفحے پر اوپر بائیں 2pt کی ترچھی لکیر (مثلث کا وتر)', bool(even) and all(s >= 0.9 for s in even), sc)
    check(f'{tag}: {name} — طاق صفحات پر کوئی لکیر نہیں', all(s < 0.7 for s in odd), sc)
    return sc

def dv_bar_btns(pg):
    return pg.evaluate("[...document.querySelectorAll('#dio-dv-bar button')].map(b => (b.textContent || '').trim())")

def exit_dv(pg):
    pg.evaluate("try { _dioResetTabs && _dioResetTabs(); } catch (e) {} try { _dioExitDocView(); } catch (e) {} 0")
    pg.wait_for_timeout(300)

def open_case(pg):
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)

# ═══════════════════════════════════════════════════════════════════════════
def run(b, tag, args, mobile):
    ctx, pg, errs = open_app(b, accept_downloads=True, **args)
    pg.evaluate(SEED); pg.evaluate(TOASTS)
    sec = ''
    def section(n):
        nonlocal sec; sec = n; print('── ' + n, flush=True)

    # ── 1) «منظوری» کہیں نہیں · «+ … درج کریں» ──────────────────────────────
    try:
        section('منظوری / نئے اندراج کے بٹن')
        open_case(pg)
        pg.evaluate("_openMisalEditor('brief')"); pg.wait_for_timeout(1500)
        allb = pg.evaluate("[...document.querySelectorAll('button')].map(b => (b.textContent || '') + ' ' + (b.title || ''))")
        check(f'{tag}: دستاویز کی پٹی میں «منظوری» نہیں (پورے صفحے پر کوئی بٹن نہیں)', not any('منظوری' in t for t in allb), [t for t in allb if 'منظوری' in t][:2])
        check(f'{tag}: پٹی میں واپس / نئی دستاویز / محفوظ / پرنٹ / شیئر', all(any(x in t for t in dv_bar_btns(pg)) for x in ['واپس', 'نئی دستاویز', 'محفوظ', 'پرنٹ', 'شیئر']), dv_bar_btns(pg))
        exit_dv(pg)
        bad = []
        for page in ['cases', 'incident', 'gasht', 'reminders', 'court', 'evidence', 'templates', 'ahkamat', 'law']:
            pg.evaluate(f"showPage('{page}', null)"); pg.wait_for_timeout(1300)
            t = pg.evaluate("[...document.querySelectorAll('#page-content .dio-add-btn')].filter(b => b.getClientRects().length).map(b => b.textContent.trim().replace(/\\s+/g, ' '))")
            # احکامات: «+ حکم درج کریں» صرف انتظامی اختیار والے افسر کو (یہاں عام افسر)
            if (not t and page != 'ahkamat') or not all(re.match(r'^\+ .+ درج کریں$', x) for x in t): bad.append((page, t))
        check(f'{tag}: ہر صفحے کا نیا اندراج «+ … درج کریں»', not bad, bad)
        txt = pg.evaluate("document.body.innerText")
        check(f'{tag}: «+ نیا اندراج» کہیں نہیں', '+ نیا اندراج' not in txt)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 2) مقدمات کی فہرست: الگ کالم · پرنٹ / ڈاؤن لوڈ / شیئر ───────────────
    try:
        section('مقدمات کی فہرست')
        exit_dv(pg)
        pg.evaluate("showPage('cases', null)"); pg.wait_for_timeout(1500)
        ths = pg.evaluate("[...document.querySelectorAll('#page-content thead th')].map(t => t.textContent.trim())")
        check(f'{tag}: «شناختی کارڈ» اور «موبائل» دو الگ کالم', 'شناختی کارڈ' in ths and 'موبائل' in ths and ths.index('موبائل') == ths.index('شناختی کارڈ') + 1, ths)
        row = pg.evaluate("""(() => { const ths = [...document.querySelectorAll('#page-content thead th')].map(t => t.textContent.trim());
            const tr = [...document.querySelectorAll('#cs-rows tr')].find(r => r.innerText.replace(/\\s+/g, '').includes('1234/26')); if (!tr) return null;
            const td = tr.querySelectorAll(':scope > td'); return { cnic: (td[ths.indexOf('شناختی کارڈ')] || {}).innerText, cell: (td[ths.indexOf('موبائل')] || {}).innerText }; })()""")
        check(f'{tag}: شناختی کارڈ اپنے کالم میں، موبائل اپنے', row and row['cnic'].strip() == '36302-1234567-1' and row['cell'].strip() == '0300-1234567', row)
        acts = pg.evaluate("(() => { const tr = [...document.querySelectorAll('#cs-rows tr')].find(r => r.innerText.replace(/\\s+/g, '').includes('1234/26')); return tr ? [...tr.querySelectorAll('button')].map(b => b.getAttribute('aria-label')) : null; })()")
        check(f'{tag}: اقدامات میں پرنٹ / ڈاؤنلوڈ / شیئر', all(x in acts for x in ['پرنٹ', 'ڈاؤنلوڈ', 'شیئر']), acts)
        pg.evaluate(CAPTURE); ensure_auto(pg, None)
        pg.evaluate("openCasePrint('c1')"); pg.wait_for_selector('#dcp-list .dcp-row', timeout=15000)
        names = pg.evaluate("[...document.querySelectorAll('#dcp-list .dcp-row .dcp-nm')].map(n => n.textContent.trim())")
        # v554: ملزمان / گواہان (FIR، کراس ورژن)، ہمراہی ملازمان اور شہادتیں فہرست میں نہیں (v554_test.py مفصل جانچتی ہے)
        check(f'{tag}: پرنٹ → اس مقدمے کی دستاویزات کی فہرست (چِپس کی طرح)', all(x in names for x in ['انڈیکس نقل مسل', 'ایف آئی آر']) and not any(x in names for x in ['ملزمان FIR', 'گواہان FIR']) and len(names) >= 10, names[:14])
        pg.evaluate("""(() => { document.querySelectorAll('#dcp-list .dcp-row').forEach(r => { const n = r.querySelector('.dcp-nm').textContent.trim(); r.querySelector('input').checked = (n === 'ایف آئی آر' || n === 'انڈیکس نقل مسل'); }); return 0; })()""")
        pg.click("#modal-footer button[data-dcp='print']")
        pg.wait_for_selector('#dio-paper-ask', timeout=8000)
        check(f'{tag}: منتخب پرنٹ → پہلے کاغذ (لیگل / A4) پوچھا', True)
        pg.click("#dio-paper-ask button[data-v='legal']")
        ok = wait_dp(pg, 1, 120)
        pg.wait_for_timeout(800)
        h = pg.evaluate("(window.__dp || [])[0] || ''")
        n = pg.evaluate("(window.__dp || []).length")
        check(f'{tag}: صرف منتخب دستاویزات، ایک ہی پرنٹ', ok and n == 1 and 'نامعلوم افراد گھر میں داخل' in h and 'نقل مسل' in h and h.count('class="dpk dpk-') == 2, (n, len(h), h.count('class="dpk dpk-')))
        # شیئر (v554: Word = .docx، ہر صفحہ پرنٹ جیسا)
        exit_dv(pg); pg.evaluate("showPage('cases', null)"); pg.wait_for_timeout(1200)
        pg.evaluate("openCasePrint('c1','share')"); pg.wait_for_selector('#dcp-list .dcp-row', timeout=15000)
        pg.evaluate("""(() => { document.querySelectorAll('#dcp-list .dcp-row').forEach(r => { r.querySelector('input').checked = r.querySelector('.dcp-nm').textContent.trim() === 'ایف آئی آر'; }); return 0; })()""")
        pg.click("#modal-footer button[data-dcp='word']")
        pg.wait_for_selector('#dio-paper-ask', timeout=8000); pg.click("#dio-paper-ask button[data-v='a4']")
        pg.wait_for_selector('#dcp-ready', timeout=120000)
        with pg.expect_download(timeout=60000) as dl:
            pg.click("#dcp-ready button[data-k='dl']")
        d = dl.value; pth = DL + tag + '_case_' + d.suggested_filename; d.save_as(pth)
        import zipfile
        zf = zipfile.ZipFile(pth); media = [x for x in zf.namelist() if x.startswith('word/media/')]
        check(f'{tag}: مقدمے کی دستاویزات → Word فائل (.docx، ہر صفحہ پرنٹ جیسا)', d.suggested_filename.endswith('.docx') and zf.testzip() is None and len(media) >= 1, (d.suggested_filename, len(media)))
        pg.evaluate("document.getElementById('dcp-ready') && document.getElementById('dcp-ready').remove(); 0")
        exit_dv(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 3) ملزمان / گواہان: دو حصے · یکجا سابقہ ریکارڈ ──────────────────────
    try:
        section('ملزمان / گواہان')
        open_case(pg)
        pg.evaluate("_ddPick('acc-dd','named_accused')"); pg.wait_for_timeout(1800)
        parts = pg.evaluate("[...document.querySelectorAll('#acc-page .dio-2p-part')].map(s => [s.dataset.type, s.querySelector('.dio-2p-title').textContent.trim(), s.querySelector('.dio-2p-btn .btn').textContent.trim(), s.innerText.includes('زاہد'), s.innerText.includes('عمران')])")
        check(f'{tag}: ملزمان — دو حصے: «ملزمان FIR» / «ملزمان کراس ورژن»، بٹن «+ ملزم درج کریں»',
              len(parts) == 2 and parts[0][:3] == ['fir', 'ملزمان FIR', '+ ملزم درج کریں'] and parts[1][:3] == ['cross_version', 'ملزمان کراس ورژن', '+ ملزم درج کریں'], parts)
        check(f'{tag}: ملزم اپنے حصے میں (FIR میں زاہد، کراس میں عمران)', len(parts) == 2 and parts[0][3] and not parts[0][4] and parts[1][4] and not parts[1][3], parts)
        geo = pg.evaluate("""(() => { const s = document.querySelector('#acc-page .dio-2p-part'); const b = s.querySelector('.dio-2p-btn .btn').getBoundingClientRect(), t = s.querySelector('.dio-2p-title').getBoundingClientRect(), r = s.getBoundingClientRect();
            return { btnRight: Math.round(r.right - b.right), titleOff: Math.round((t.left + t.right) / 2 - (r.left + r.right) / 2), same: Math.abs((b.top + b.bottom) / 2 - (t.top + t.bottom) / 2) < 14 }; })()""")
        check(f'{tag}: بٹن دائیں کنارے کے ساتھ، سرخی درمیان، ایک سطر', geo['btnRight'] <= 16 and abs(geo['titleOff']) <= 3 and geo['same'], geo)
        pg.evaluate("_accPrevRecord('a2')"); pg.wait_for_timeout(1500)
        recs = pg.evaluate("[...document.querySelectorAll('#modal-body .dio-rec')].map(r => r.innerText.replace(/\\s+/g, ' '))")
        f55 = [r for r in recs if '55/2' in r]
        check(f'{tag}: سابقہ ریکارڈ — سسٹم + درج شدہ یکجا (55/24 ایک ہی بار)', len(recs) == 3 and len(f55) == 1 and 'سسٹم + درج شدہ' in f55[0], recs)
        check(f'{tag}: سابقہ ریکارڈ — صرف سسٹم والا (77/25) اور صرف درج شدہ (12/23) بھی', any('77/25' in r and 'سسٹم' in r for r in recs) and any('12/23' in r and 'درج شدہ' in r for r in recs), recs)
        pg.evaluate("closeModal()"); pg.wait_for_timeout(300)
        pg.evaluate("_ddPick('wit-dd','witnesses_fir')"); pg.wait_for_timeout(1800)
        wparts = pg.evaluate("[...document.querySelectorAll('#wit-area .dio-2p-part')].map(s => [s.dataset.type, s.querySelector('.dio-2p-title').textContent.trim(), s.querySelector('.dio-2p-btn .btn').textContent.trim()])")
        check(f'{tag}: گواہان — دو حصے، «+ گواہ درج کریں»', wparts == [['fir', 'گواہان FIR', '+ گواہ درج کریں'], ['cross_version', 'گواہان کراس ورژن', '+ گواہ درج کریں']], wparts)
        has_btn = pg.evaluate("!!document.getElementById('wit-prev-btn-w1')")
        check(f'{tag}: گواہ کے اقدامات میں «سابقہ ریکارڈ»', has_btn)
        pg.evaluate("_witPrevRecord('w1')"); pg.wait_for_timeout(1500)
        wr = pg.evaluate("[...document.querySelectorAll('#modal-body .dio-rec')].map(r => r.innerText.replace(/\\s+/g, ' '))")
        check(f'{tag}: گواہ کا سابقہ ریکارڈ سسٹم سے (55/24، گواہ)', len(wr) == 1 and '55/24' in wr[0] and 'گواہ' in wr[0], wr)
        pg.evaluate("closeModal()"); exit_dv(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 4) نقشہ موقع ───────────────────────────────────────────────────────
    try:
        section('نقشہ موقع')
        open_case(pg)
        pg.evaluate("_openMisalEditor('crime_scene')"); pg.wait_for_timeout(1800)
        g = pg.evaluate("""(() => { const b = document.querySelector('.naq-list .dio-add-btn'); const h = document.querySelector('.naq-list .naq-lhead'); if (!b || !h) return null;
            const rb = b.getBoundingClientRect(), rh = h.getBoundingClientRect(); return { txt: b.textContent.trim(), rightGap: Math.round(rh.right - rb.right), top: Math.round(rb.top - rh.top),
              cols: [...document.querySelectorAll('.naq-ltable thead th')].map(t => t.textContent.trim()) }; })()""")
        check(f'{tag}: نقشہ چِپ → محفوظ نقشوں کی فہرست، اوپر دائیں «+ نقشہ موقع درج کریں»', g and g['txt'] == '+ نقشہ موقع درج کریں' and g['rightGap'] <= 24 and g['top'] <= 24, g)
        check(f'{tag}: فہرست کے کالم: قسم / ملزم / تاریخ / وقت / اقدامات', g and all(x in g['cols'] for x in ['قسم', 'ملزم (بنام)', 'تاریخ', 'وقت', 'اقدامات']), g and g['cols'])
        pg.evaluate("_naqNew()"); pg.wait_for_timeout(2500)
        # سیدھی لکیر
        if not mobile:
            pg.evaluate("_naqPickTool('line')")
            box = pg.locator('#naq-map .upper-canvas').bounding_box()
            x0, y0 = box['x'] + 100, box['y'] + 100
            pg.keyboard.down('Control'); pg.mouse.move(x0, y0); pg.mouse.down(); pg.mouse.move(x0 + 150, y0 + 14, steps=6); pg.mouse.up(); pg.keyboard.up('Control')
            pg.wait_for_timeout(300)
            ln = pg.evaluate("(() => { const o = _naqGetCanvas().getObjects().filter(x => x.type === 'line').pop(); return o ? [o.x1, o.y1, o.x2, o.y2] : null; })()")
            check(f'{tag}: Ctrl دبا کر کھینچی لکیر سیدھی (افقی)', ln and abs(ln[1] - ln[3]) < 0.5 and abs(ln[0] - ln[2]) > 100, ln)
            pg.mouse.move(x0, y0 + 60); pg.mouse.down(); pg.mouse.move(x0 + 150, y0 + 74, steps=6); pg.mouse.up(); pg.wait_for_timeout(200)
            ln2 = pg.evaluate("(() => { const o = _naqGetCanvas().getObjects().filter(x => x.type === 'line').pop(); return o ? [o.x1, o.y1, o.x2, o.y2] : null; })()")
            check(f'{tag}: Ctrl کے بغیر لکیر آزاد (ترچھی)', ln2 and abs(ln2[1] - ln2[3]) > 5, ln2)
        else:
            pg.evaluate("_naqToggleStraight()"); pg.wait_for_timeout(200)
            on = pg.evaluate("document.getElementById('naq-straight').classList.contains('on')")
            check(f'{tag}: 📏 سیدھی لکیر کا بٹن چالو', on)
            pg.evaluate("_naqPickTool('line')")
            pg.evaluate("document.getElementById('naq-map').scrollIntoView({block: 'center', inline: 'nearest'})"); pg.wait_for_timeout(300)
            box = pg.locator('#naq-map .upper-canvas').bounding_box()
            # کاغذ (8.5in) سکرین سے چوڑا ہے — صرف نظر آنے والے حصے پر کھینچیں
            x0 = max(box['x'], 0) + 30; y0 = max(box['y'], 0) + 60
            # اصل انگلی (touch) سے کھینچنا — CDP
            cdp = ctx.new_cdp_session(pg)
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchStart', 'touchPoints': [{'x': x0, 'y': y0}]})
            for k in range(1, 7):
                cdp.send('Input.dispatchTouchEvent', {'type': 'touchMove', 'touchPoints': [{'x': x0 + 140 * k / 6, 'y': y0 + 16 * k / 6}]})
                pg.wait_for_timeout(30)
            cdp.send('Input.dispatchTouchEvent', {'type': 'touchEnd', 'touchPoints': []})
            pg.wait_for_timeout(300)
            ln = pg.evaluate("(() => { const o = _naqGetCanvas().getObjects().filter(x => x.type === 'line').pop(); return o ? [o.x1, o.y1, o.x2, o.y2] : null; })()")
            check(f'{tag}: 📏 کے ساتھ کھینچی لکیر سیدھی', ln and abs(ln[1] - ln[3]) < 0.5 and abs(ln[0] - ln[2]) > 80, ln)
            pg.evaluate("_naqToggleStraight()")
        # نقشے کی جگہ + پیمانہ
        pg.fill('#naq-maph', '4'); pg.dispatch_event('#naq-maph', 'change'); pg.wait_for_timeout(500)
        mh = pg.evaluate("(() => { const m = document.getElementById('naq-map'); const r = document.getElementById('naq-ruler'); return { h: Math.round(m.getBoundingClientRect().height / (m.getBoundingClientRect().width / m.offsetWidth || 1)), oh: m.offsetHeight, remain: document.getElementById('naq-remain').textContent.trim(), ruler: !!r && r.children.length > 0 }; })()")
        check(f'{tag}: نقشے کی جگہ 4 انچ (384px) + پیمانہ + «باقی» جگہ', abs(mh['oh'] - 384) <= 6 and mh['ruler'] and bool(mh['remain']), mh)
        pg.click("button[title^='نقشے کی جگہ کو صفحے کے مطابق']"); pg.wait_for_timeout(500)
        fit = pg.evaluate("(() => { const d = document.getElementById('dio-naqsha-doc'); return { dh: d.offsetHeight, remain: document.getElementById('naq-remain').textContent.trim(), maph: document.getElementById('naq-maph').value }; })()")
        check(f'{tag}: ⤓ صفحہ → نقشہ پورا صفحہ (لیگل 13in = 1248px سے زیادہ نہیں)', fit['dh'] <= 1250 and fit['dh'] >= 1150 and float(fit['maph']) > 4, fit)
        pg.evaluate("naqSaveNow()"); pg.wait_for_timeout(800)
        pg.evaluate("_naqBackToList()"); pg.wait_for_timeout(800)
        lr = pg.evaluate("""[...document.querySelectorAll('#naq-lrows tr[data-naq]')].map(tr => ({ cells: [...tr.children].map(td => td.innerText.trim()),
            btns: [...tr.querySelectorAll('.naq-lacts button')].map(b => b.title), tops: [...tr.querySelectorAll('.naq-lacts button')].map(b => Math.round(b.getBoundingClientRect().top)) }))""")
        check(f'{tag}: محفوظ نقشہ فہرست میں (تاریخ DD/MM/YYYY، وقت)', len(lr) == 1 and re.match(r'^\d{2}/\d{2}/\d{4}$', lr[0]['cells'][3]) and re.search(r'\d{1,2}:\d{2}', lr[0]['cells'][4]), lr)
        check(f'{tag}: اقدامات ایک ہی سطر میں: ترمیم / پرنٹ / ڈاؤن لوڈ / کاپی / حذف', lr and lr[0]['btns'] == ['ترمیم', 'پرنٹ', 'ڈاؤن لوڈ', 'کاپی', 'حذف'] and max(lr[0]['tops']) - min(lr[0]['tops']) <= 2, lr and (lr[0]['btns'], lr[0]['tops']))
        pg.evaluate(CAPTURE); ensure_auto(pg, None)
        pg.click("#naq-lrows button[title='پرنٹ']")
        pg.wait_for_selector('#dio-paper-ask', timeout=8000); pg.click("#dio-paper-ask button[data-v='legal']")
        ok = wait_dp(pg, 1, 60)
        h = pg.evaluate("(window.__dp || [])[0] || ''")
        check(f'{tag}: فہرست کا «پرنٹ» سیدھا پرنٹ (کاغذ پوچھ کر، لیگل 8.5×13)', ok and page_size(h) == '8.5in 13in' and 'naq' in h, page_size(h))
        with pg.expect_download(timeout=60000) as dl:
            pg.click("#naq-lrows button[title='ڈاؤن لوڈ']")
        d = dl.value; check(f'{tag}: «ڈاؤن لوڈ» → PDF', d.suggested_filename.endswith('.pdf'), d.suggested_filename)
        pg.click("#naq-lrows button[title='کاپی']"); pg.wait_for_timeout(600)
        n2 = pg.evaluate("document.querySelectorAll('#naq-lrows tr[data-naq]').length")
        check(f'{tag}: «کاپی» → دوسرا نقشہ', n2 == 2, n2)
        pg.once('dialog', lambda dg: dg.accept())
        pg.click("#naq-lrows button[title='حذف'] >> nth=0"); pg.wait_for_timeout(600)
        n3 = pg.evaluate("document.querySelectorAll('#naq-lrows tr[data-naq]').length")
        check(f'{tag}: «حذف» (تصدیق کے بعد)', n3 == 1, n3)
        exit_dv(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 5) کاغذ پرنٹ کے وقت (پٹی میں لیگل/A4 نہیں) · Ctrl+P = پرنٹ ──────────
    try:
        section('کاغذ پرنٹ کے وقت')
        PAPER_SEL = "[...document.querySelectorAll('select')].filter(s => s.getClientRects().length && [...s.options].some(o => /A4|لیگل|Legal/i.test(o.textContent))).length"
        open_case(pg)
        for name, js in [('چالان', "openReport173WithType('mukammal')"), ('ضمنی', "openZimniEditor('c1'); setTimeout(() => _newZimni(), 900)"),
                         ('سزا سلپ', "_openMisalEditor('saza_slip')"), ('درخواستیں', "_openMisalEditor('darkhwastain')")]:
            pg.evaluate(js); pg.wait_for_timeout(3000)
            check(f'{tag}: {name} — اوپر کی پٹی میں لیگل / A4 کا انتخاب نہیں', pg.evaluate(PAPER_SEL) == 0)
            exit_dv(pg); open_case(pg)
        pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2800)
        pg.evaluate(CAPTURE); ensure_auto(pg, None)
        pg.evaluate("setTimeout(() => _dioPrintCurrent(), 0); 0")
        pg.wait_for_selector('#dio-paper-ask', timeout=8000)
        pg.click("#dio-paper-ask button[data-v='a4']")
        wait_dp(pg, 1, 80); h1 = pg.evaluate("(window.__dp || [])[0] || ''")
        check(f'{tag}: چالان «پرنٹ» → کاغذ پوچھا → A4', page_size(h1) == 'A4 portrait', page_size(h1))
        pg.evaluate(CAPTURE)
        pg.click('#ch173-doc [data-k="halaat"]') if pg.locator('#ch173-doc [data-k="halaat"]').count() else None
        pg.keyboard.press('Control+p')
        pg.wait_for_selector('#dio-paper-ask', timeout=8000)
        cur = pg.evaluate("(document.querySelector('#dio-paper-ask .is-cur') || {}).dataset.v")
        check(f'{tag}: Ctrl+P → وہی سوال، پچھلا انتخاب (A4) نمایاں', cur == 'a4', cur)
        pg.click("#dio-paper-ask button[data-v='legal']")
        wait_dp(pg, 1, 80); h2 = pg.evaluate("(window.__dp || [])[0] || ''")
        n = pg.evaluate("(window.__dp || []).length")
        check(f'{tag}: Ctrl+P → لیگل (8.5×13)، ایک ہی پرنٹ', page_size(h2) == '8.5in 13in' and n == 1, (page_size(h2), n))
        w = pg.evaluate("document.getElementById('ch173-doc').style.width")
        check(f'{tag}: سکرین پر چالان بھی منتخب کاغذ کے مطابق (8.5in = 816px)', w in ('8.5in', '816px'), w)
        pg.evaluate(CAPTURE)
        pg.evaluate("setTimeout(() => _dioPrintCurrent(), 0); 0")
        pg.wait_for_selector('#dio-paper-ask', timeout=8000); pg.keyboard.press('Escape'); pg.wait_for_timeout(800)
        check(f'{tag}: Esc = منسوخ (کچھ نہیں چھپتا)', pg.evaluate("(window.__dp || []).length") == 0)
        exit_dv(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 6) مثل باندھنے کی جگہ: صرف جفت صفحات (اصل PDF کے pixel سے) ───────────
    try:
        section('مثل باندھنے کی جگہ')
        if not mobile:          # کاغذ اور چھپائی آلے پر ایک جیسی — ایک بار کافی (موبائل پر بھی وہی HTML)
            for paper in ['legal', 'a4']:
                open_case(pg)
                pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2800)
                ensure_auto(pg, paper)
                pg.evaluate("(t) => { const h = document.querySelector('#ch173-doc [data-k=\"halaat\"]'); h.textContent = h.textContent + t; h.dispatchEvent(new Event('input', {bubbles: true})); return 0; }", LONG * 90)
                pg.wait_for_timeout(2500)
                pg.evaluate(CAPTURE); pg.evaluate("_printR173()")
                wait_dp(pg, 1, 120); h = pg.evaluate("(window.__dp || [])[0] || ''")
                bind_ok(b, h, 'challan_' + paper, tag)
                ensure_auto(pg, None); exit_dv(pg)
            # FIR کا لمبا متن (باقی تمام دستاویزات والا عمومی راستہ)
            pg.evaluate("(t) => { window.__db.fir_matn[0].matn = t; return 0; }", LONG * 70)
            open_case(pg)
            pg.evaluate("_ddPick('fir-dd','fir')"); pg.wait_for_timeout(1500)
            pg.evaluate(CAPTURE); pg.evaluate("_printMatn('m1')")
            wait_dp(pg, 1, 120); h = pg.evaluate("(window.__dp || [])[0] || ''")
            bind_ok(b, h, 'fir_matn', tag)
            exit_dv(pg)
        else:
            check(f'{tag}: (مثل کی جگہ Desktop پر اصل PDF سے جانچی گئی — چھپائی کا HTML آلے سے آزاد)', True)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 7) MS Word کی چھپی کلیدیں · 8) فونٹ 14pt ─────────────────────────────
    try:
        section('MS Word کلیدیں + فونٹ')
        pg.evaluate("""(() => { window.__db.case_documents = (window.__db.case_documents || []).filter(d => d.document_type !== 'brief');
            window.__db.case_documents.push({ id:'cd-brief', case_id:'c1', document_type:'brief', status:'draft',
              content:{ html:'<h2 style="font-size:20pt">بریف کی سرخی</h2><p><span style="font-size:10pt">پرانا متن چھوٹے فونٹ میں</span></p><p>دوسرا پیرا</p>', date:'' }, created_at:'2026-10-01' }); return 0; })()""")
        open_case(pg)
        pg.evaluate("_openMisalEditor('brief')"); pg.wait_for_timeout(1800)
        fz = pg.evaluate("""(() => { const ed = document.getElementById('misal-editor'); const sp = [...ed.querySelectorAll('span, p')].find(e => e.textContent.trim() === 'پرانا متن چھوٹے فونٹ میں');
            const h2 = ed.querySelector('h2'); return { ed: getComputedStyle(ed).fontSize, lh: getComputedStyle(ed).lineHeight, old: getComputedStyle(sp).fontSize, h2: getComputedStyle(h2).fontSize }; })()""")
        check(f'{tag}: دستاویز کا معیاری فونٹ 14pt، سطری فاصلہ 1.9', abs(float(fz['ed'][:-2]) - 18.67) < 0.1 and abs(float(fz['lh'][:-2]) / float(fz['ed'][:-2]) - 1.9) < 0.02, fz)
        check(f'{tag}: پرانا 10pt متن → 14pt، سرخی (20pt) جوں کی توں', abs(float(fz['old'][:-2]) - 18.67) < 0.1 and abs(float(fz['h2'][:-2]) - 26.67) < 0.1, fz)
        pg.evaluate("""(() => { const ed = document.getElementById('misal-editor'); const p = [...ed.querySelectorAll('p')].pop(); ed.focus();
            const t = p.firstChild; const r = document.createRange(); r.setStart(t, 0); r.setEnd(t, 5); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()""")
        pg.keyboard.press('Control+b'); pg.wait_for_timeout(150)
        pg.keyboard.press('Control+u'); pg.wait_for_timeout(150)
        last = pg.evaluate("[...document.querySelectorAll('#misal-editor p')].pop().innerHTML")
        check(f'{tag}: Ctrl+B / Ctrl+U منتخب متن پر', re.search(r'<(b|strong)\b', last) is not None and '<u>' in last, last[:160])
        pg.keyboard.press('Control+Equal'); pg.wait_for_timeout(250)
        last2 = pg.evaluate("[...document.querySelectorAll('#misal-editor p')].pop().innerHTML")
        check(f'{tag}: Ctrl + = → منتخب متن کا فونٹ 15pt', 'font-size: 15pt' in last2 or 'font-size:15pt' in last2, last2[:200])
        pg.evaluate("""(() => { const ed = document.getElementById('misal-editor'); const p = [...ed.querySelectorAll('p')].pop(); const r = document.createRange(); r.selectNodeContents(p); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); ed.focus(); return 0; })()""")
        before = pg.evaluate("document.getElementById('misal-editor').innerText.length")
        pg.keyboard.press('Tab'); pg.wait_for_timeout(150)
        after = pg.evaluate("document.getElementById('misal-editor').innerText.length")
        foc = pg.evaluate("document.activeElement && document.activeElement.id")
        check(f'{tag}: Tab → تحریر میں خالی جگہ (توجہ اگلے خانے پر نہیں)', after - before >= 4 and foc == 'misal-editor', (before, after, foc))
        pg.keyboard.type('نیا لفظ')
        pg.keyboard.press('Control+h'); pg.wait_for_timeout(700)
        check(f'{tag}: Ctrl+H → ڈھونڈیں اور بدلیں', pg.evaluate("!!document.getElementById('dio-fr-panel') && document.getElementById('dio-fr-panel').getClientRects().length > 0"))
        pg.keyboard.press('Escape'); pg.evaluate("document.getElementById('dio-fr-panel') && document.getElementById('dio-fr-panel').remove(); document.getElementById('misal-editor').focus(); 0")
        pg.keyboard.press('Control+s'); pg.wait_for_timeout(1500)
        saved = pg.evaluate("JSON.stringify(((window.__db.case_documents || []).find(d => d.document_type === 'brief') || {}).content || {})")
        check(f'{tag}: Ctrl+S → دستاویز ترمیم سمیت محفوظ (بولڈ + نیا لفظ + 14pt)', 'نیا لفظ' in saved and ('<b>' in saved or '<strong>' in saved) and 'font-size:10pt' not in saved.replace(' ', ''), saved[:200])
        exit_dv(pg)
        open_case(pg)
        pg.evaluate("_openMisalEditor('darkhwastain')"); pg.wait_for_timeout(2500)
        dk = pg.evaluate("(() => { const b = document.querySelector('#dk-doc .dk-body'); if (!b) return null; const cs = getComputedStyle(b); return [cs.fontSize, cs.lineHeight]; })()")
        check(f'{tag}: درخواست کا متن 14pt، سطری فاصلہ 1.9', dk and abs(float(dk[0][:-2]) - 18.67) < 0.1 and abs(float(dk[1][:-2]) / float(dk[0][:-2]) - 1.9) < 0.02, dk)
        exit_dv(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 9) لگی ہوئی FIR (PDF) — موبائل پر نظر آئے اور چھپے ───────────────────
    try:
        section('FIR کی فائل')
        t = b.new_page(); t.set_content('<h1 style="font-size:60px">FIRCOPY page 1</h1><div style="break-before:page;font-size:60px">Page 2</div>')
        pdfb = t.pdf(format='A4'); t.close()
        url = 'data:application/pdf;base64,' + base64.b64encode(pdfb).decode()
        pg.evaluate("(u) => { window.__db.fir_copies = [{ id:'fc1', case_id:'c1', type:'fir', file_url:u, file_name:'fir-copy.pdf', display_name:'fir-copy.pdf', created_at:'2026-10-10' }]; return 0; }", url)
        open_case(pg)
        pg.evaluate("_ddPick('fir-dd','fir')"); pg.wait_for_timeout(1500)
        pg.click('#fir-page button[title="دیکھیں"] >> nth=-1'); pg.wait_for_timeout(4000)
        info = pg.evaluate("(() => { const ov = document.getElementById('dio-file-view'); if (!ov) return null; const c = ov.querySelectorAll('canvas'); return { canv: c.length, frame: !!document.getElementById('dio-fv-frame'), top: c.length ? Math.round(c[0].getBoundingClientRect().top) : null, w: c.length ? Math.round(c[0].getBoundingClientRect().width) : 0 }; })()")
        if mobile:
            check(f'{tag}: موبائل — FIR کی PDF دونوں صفحے نظر آتے ہیں (پہلا صفحہ اوپر سے پورا)', info and info['canv'] == 2 and info['top'] is not None and info['top'] >= 40 and info['w'] >= 300, info)
            pg.screenshot(path=OUT + f'/{tag}_v553_firpdf.png')
            pg.evaluate(CAPTURE); pg.evaluate("_dioPrintFileView()"); pg.wait_for_timeout(600)
            h = pg.evaluate("(window.__dp || [])[0] || ''")
            check(f'{tag}: موبائل — FIR کی PDF کا پرنٹ (ہر صفحہ)', h.count('<img ') == 2, h.count('<img '))
        else:
            check(f'{tag}: Desktop — FIR کی فائل ایپ کے اندر کھلتی ہے', info is not None and (info['frame'] or info['canv'] == 2), info)
        with pg.expect_download(timeout=30000) as dl:
            pg.click("#dio-file-view button:has-text('شیئر')")
        d = dl.value; pth = DL + tag + '_' + d.suggested_filename; d.save_as(pth)
        txt = subprocess.run(['pdftotext', pth, '-'], capture_output=True, text=True).stdout
        check(f'{tag}: لگی ہوئی فائل کا «شیئر» → اصل PDF', d.suggested_filename == 'fir-copy.pdf' and 'FIRCOPY' in txt, d.suggested_filename)
        pg.evaluate("_dioCloseFileView()"); exit_dv(pg)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 10) ہر جگہ شیئر: PDF / Word (پوری فائل) ───────────────────────────────
    try:
        section('شیئر — PDF / Word')
        def word_of(click, name, expect):
            click(); pg.wait_for_selector('#dio-share-box', timeout=20000)
            with pg.expect_download(timeout=60000) as dl:
                pg.click("#dio-share-box button[data-k='word']")
            d = dl.value; pth = DL + tag + '_' + name + '.doc'; d.save_as(pth)
            ok = expect in open(pth, encoding='utf-8', errors='ignore').read()
            pg.wait_for_timeout(300)
            pg.evaluate("document.getElementById('dio-share-box') && document.getElementById('dio-share-box').remove(); 0")
            return ok, d.suggested_filename
        pg.evaluate("window.__realPrint = 0; window._dioDoPrint = function () { window.__realPrint++; }; 0")
        pg.evaluate("window.__db.fir_matn[0].matn = 'دوران تفتیش گواہان کے بیانات قلمبند کیے گئے۔'; 0")
        open_case(pg)
        pg.evaluate("_ddPick('fir-dd','fir')"); pg.wait_for_timeout(1500)
        r1 = word_of(lambda: pg.click("#fir-page button[aria-label='شیئر'] >> nth=0"), 'firrow', 'دوران تفتیش')
        check(f'{tag}: متن ایف آئی آر کی سطر → Word', r1[0], r1[1])
        r2 = word_of(lambda: pg.evaluate("_dioShareCurrent()"), 'firpage', 'دوران تفتیش')
        check(f'{tag}: پوری دستاویز (اوپر کی پٹی کا شیئر) → Word', r2[0], r2[1])
        exit_dv(pg)
        pg.evaluate("showPage('ahkamat', null)"); pg.wait_for_timeout(1500)
        r3 = word_of(lambda: pg.click("button[title='فہرست شیئر — PDF / Word']"), 'ahk', 'حکم امتناعی')
        check(f'{tag}: احکامات کی فہرست → Word', r3[0], r3[1])
        pg.evaluate("showPage('performance', null)"); pg.wait_for_timeout(1800)
        r4 = word_of(lambda: pg.click("#page-content button[title='شیئر — PDF / Word']"), 'perf', 'کارکردگی')
        check(f'{tag}: کارکردگی رپورٹ → Word', r4[0], r4[1])
        check(f'{tag}: شیئر کرتے ہوئے پرنٹ نہیں کھلتا', pg.evaluate("window.__realPrint") == 0, pg.evaluate("window.__realPrint"))
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    # ── 11) ٹول بار کے بٹنوں کی فہرست ─────────────────────────────────────────
    try:
        section('ٹول بار کی فہرست')
        pg.evaluate("showPage('help', null)"); pg.wait_for_timeout(1500)
        hg = pg.evaluate("({ groups: [...document.querySelectorAll('.hg-tools details > summary')].map(s => s.textContent.trim()), rows: document.querySelectorAll('.hg-tools tbody tr').length, sw: document.documentElement.scrollWidth, vw: innerWidth })")
        check(f'{tag}: مدد میں ٹول بار کے تمام بٹن (5 حصے، 60+ بٹن)', len(hg['groups']) == 5 and hg['rows'] >= 60, hg)
        check(f'{tag}: فہرست سکرین سے باہر نہیں جاتی (افقی scroll نہیں)', hg['sw'] <= hg['vw'] + 1, hg)
        pg.evaluate(CAPTURE); pg.evaluate("_hgPrintTools()"); wait_dp(pg, 1, 40)
        h = pg.evaluate("(window.__dp || [])[0] || ''")
        check(f'{tag}: فہرست کا پرنٹ (14pt، A4، ہر بٹن)', 'font-size:14pt' in h and 'size:A4' in h and h.count('<tr>') >= 65, h.count('<tr>'))
        r5 = None
        pg.click(".hg-tools button:has-text('شیئر')"); pg.wait_for_selector('#dio-share-box', timeout=20000)
        with pg.expect_download(timeout=60000) as dl:
            pg.click("#dio-share-box button[data-k='word']")
        d = dl.value; pth = DL + tag + '_tools.doc'; d.save_as(pth)
        check(f'{tag}: فہرست → Word فائل', 'فارمیٹ پینٹر' in open(pth, encoding='utf-8', errors='ignore').read(), d.suggested_filename)
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    real_errs = [e for e in errs if 'ResizeObserver' not in e]
    check(f'{tag}: کوئی JavaScript خرابی نہیں', not real_errs, real_errs[:3])
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch()
    run(b, 'Desktop', dict(viewport={'width': 1366, 'height': 800}), False)
    run(b, 'Mobile', dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2), True)
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
for f in fails: print('  ✗', f[1], '—', str(f[2])[:200])
sys.exit(1 if fails else 0)
