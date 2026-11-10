"""(v564) بیرونی ضمنی — پرنٹ اور ترتیب: مشترکہ اوزار (repro + acceptance دونوں یہی لیتے ہیں)

اصل ایپ (index.html + تمام اصل scripts/CSS)؛ صرف Supabase کی جگہ آزمائشی ڈیٹا۔
تین راستے جن سے افسر چھاپتا ہے:
  • button — ضمنی کی پٹی کا «🖨️ پرنٹ» (کاغذ کا انتخاب کلک سے)
  • ctrlp  — کی بورڈ Ctrl+P (اصل کلید، کرسر ضمنی کے متن میں)
  • menu   — براؤزر کا اپنا مینو (Chrome ⋮ > Print): ایپ کا کوئی بٹن/کلید نہیں — براؤزر
             `beforeprint` بھیج کر سیدھا زندہ صفحہ چھاپتا ہے (یہاں page.pdf)
"""
import sys, os, re, json, subprocess, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import *
from PIL import Image, ImageChops

HERE = os.path.dirname(os.path.abspath(__file__))
INCH = 96

SEED = """(() => { const d = window.__db; const c1 = d.cases.find(c => c.id === 'c1');
  Object.assign(c1, { fir_number:'663/26', fir_date:'15/10/2026', section_of_law:'379 ت پ', case_station:'صدر ملتان',
    complainant:'محمد امجد حسین ولد عاشق حسین قوم آرائیں سکنہ بیرون دہلی گیٹ ملتان', fir_writer:'محمد اسلم ASI' });
  d.zimni_reports = []; d.zimni_androoni_reports = []; d.report_173 = [];
  window.__opts.fail = []; window.__opts.failSel = []; window.__opts.noTable = [];
  Object.keys(localStorage).filter(k => /^dio_za_|^dio_zimni_/.test(k)).forEach(k => localStorage.removeItem(k));
  return Promise.all(d.cases.map(c => offlineStore.cache('cases_cache', JSON.parse(JSON.stringify(c))))).then(() => 0); })()"""

# حقیقی تفتیشی تحریر — انگریزی عہدہ، تاریخ، موبائل نمبر سمیت (الفاظ کے درمیان عام خالی جگہ، جیسے افسر لکھتا ہے)
PARA = [
    'جناب عالیٰ! بحوالہ رپورٹ ضمنی سابقہ گزارش ہے کہ آج مورخہ 16/10/2026 کو مسل مقدمہ ہذا برائے تفتیش موصول ہوئی جس پر مسمی محمد اسلم ASI کے ہمراہ جائے وقوعہ پر پہنچ کر نقشہ موقع مرتب کیا گیا اور گواہان موقع کے بیانات زیر دفعہ 161 ض ف قلمبند کیے گئے۔ ',
    'مدعی مقدمہ نے بیان کیا کہ وہ اپنے موٹر سائیکل پر سوار ہو کر بازار سے واپس گھر آ رہا تھا کہ راستے میں نامعلوم ملزمان نے اسلحہ کے زور پر اس سے موبائل فون اور نقدی چھین لی اور موقع سے فرار ہو گئے۔ ',
    'دوران تفتیش موقع کے گرد و نواح میں لگے ہوئے کیمروں کی فوٹیج حاصل کی گئی اور متعلقہ دکانداروں سے بھی دریافت کیا گیا جنہوں نے ملزمان کے حلیہ کے بارے میں معلومات فراہم کیں جو ریکارڈ پر لائی گئیں۔ ',
    'مدعی مقدمہ کا موبائل نمبر 0300-1234567 حاصل کر کے اس کی CDR کے لیے درخواست مرتب کر کے جناب SP Investigation صاحب کی خدمت میں ارسال کی گئی تاکہ ملزمان کا سراغ لگایا جا سکے۔ ',
]
BLOCKS = 12         # 12 اندراج × 4 جملے ≈ لیگل پر تین صفحات (A4 پر چار)


def fill_js(blocks=BLOCKS, reps=4):
    return """async () => {
      const P = %s, N = %d, REPS = %d;
      const doc = _zimniDoc();
      // افسر کی طرح: خانے میں کرسر رکھ کر لکھنا (خالی خانہ — اس کا <br> بدل جاتا ہے)
      const typeInto = (el, txt) => { el.focus(); const r = document.createRange(); r.selectNodeContents(el);
        if ((el.textContent || '').trim()) r.collapse(false);
        const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, txt); };
      for (let i = 0; i < N; i++) {
        if (i > 0) _zimniAddBlock();
        const rows = doc.querySelectorAll('tr.zf-blk'); const row = rows[rows.length - 1];
        const body = row.querySelector('.zf-body');
        let t = ''; for (let k = 0; k < REPS; k++) t += P[(i + k) %% P.length];
        typeInto(body, t.trim());
        if (i > 0) typeInto(row.querySelector('.zf-actbody'), 'بوقت ' + (9 + i) + ':30');
        await new Promise(r => setTimeout(r, 30));
      }
      return doc.querySelectorAll('tr.zf-blk').length; }""" % (json.dumps(PARA, ensure_ascii=False), blocks, reps)


SNAP = """(() => { window.__snaps = [];
  if (window.__snapObs) return 0;
  window.__snapObs = new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.id === 'dio-print-frame') { const w = n.contentWindow; w.print = function () { window.__snaps.push(w.document.documentElement.outerHTML); }; }
  })));
  window.__snapObs.observe(document.body, { childList: true }); return 0; })()"""


def open_zimni(pg):
    """افسر کا اصل راستہ: مقدمہ → «ضمنیات» → «+ ضمنی درج کریں»"""
    pg.evaluate(SEED)
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1500)
    pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2300)


def pick_paper(pg, paper):
    """کاغذ کے انتخاب کا خانہ — افسر کی طرح کلک (A4 / لیگل)"""
    for _ in range(40):
        if pg.evaluate("!!document.getElementById('dio-paper-ask')"): break
        pg.wait_for_timeout(100)
    else:
        return False
    pg.click(f"#dio-paper-ask button[data-v='{paper}']")
    return True


def capture(pg, how, paper):
    """button / ctrlp — ایپ کا اپنا راستہ؛ اصل کاغذ (iframe) کا HTML واپس"""
    pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
    if how == 'button':
        pg.evaluate("(document.querySelector('#dio-dv-bar button[onclick=\"_dioPrintCurrent()\"]') || document.querySelector('[data-dio-print]')).click()")
    elif how == 'ctrlp':
        pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('End')
        pg.keyboard.press('Control+p')
    asked = pick_paper(pg, paper)
    for _ in range(150):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    return asked, pg.evaluate("window.__snaps[0] || ''")


def html_pdf(b, html, path):
    """اصل کاغذ (iframe کا HTML) — اسی طرح جیسے Chrome اس فریم کو چھاپتا ہے"""
    name = '_v564_' + os.path.basename(path).replace('.pdf', '') + '.html'
    fn = os.path.join(HERE, '..', '..', name)
    open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + html)
    c = b.new_context(); c.route('**/*', route); q = c.new_page()
    q.goto(BASE + name); q.wait_for_timeout(1500); q.evaluate('document.fonts.ready')
    q.pdf(path=path, prefer_css_page_size=True, print_background=True)
    c.close(); os.remove(fn)
    return path


PAPER = {'legal': ('8.5in', '13in'), 'a4': ('210mm', '297mm')}


def menu_pdf(pg, paper, path):
    """براؤزر کا مینو (⋮ > Print): کوئی ایپ بٹن نہیں — beforeprint، پھر زندہ صفحہ؛ کاغذ = Chrome کے
    خانے میں چنا ہوا، حاشیے «Default» (CSS @page ہو تو وہی)"""
    w, h = PAPER[paper]
    fired = pg.evaluate("""() => { window.__bp = 0; if (!window.__bpL) { window.__bpL = 1; window.addEventListener('beforeprint', () => { window.__bp++; }); } return 0; }""")
    pg.pdf(path=path, width=w, height=h, prefer_css_page_size=True, print_background=True,
           margin={'top': '0.4in', 'bottom': '0.4in', 'left': '0.4in', 'right': '0.4in'})
    native = pg.evaluate("window.__bp")
    if not native:   # یہ Chromium headless پرنٹ پر beforeprint نہیں بھیجتا — اصل Chrome بھیجتا ہے، اس لیے اسی طرح دوبارہ
        pg.evaluate("window.dispatchEvent(new Event('beforeprint')); 0")
        pg.pdf(path=path, width=w, height=h, prefer_css_page_size=True, print_background=True,
               margin={'top': '0.4in', 'bottom': '0.4in', 'left': '0.4in', 'right': '0.4in'})
    pg.evaluate("window.dispatchEvent(new Event('afterprint')); 0")
    return path, native


def pages_png(pdf, prefix, dpi=60):
    for f in glob.glob(prefix + '-*.png'): os.remove(f)
    subprocess.run(['pdftoppm', '-png', '-r', str(dpi), pdf, prefix], check=True)
    return sorted(glob.glob(prefix + '-*.png'), key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0]))


def pdf_info(pdf):
    t = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True).stdout
    n = int(re.search(r'Pages:\s+(\d+)', t).group(1))
    sz = re.search(r'Page size:\s+([\d.]+) x ([\d.]+)', t)
    return n, (float(sz.group(1)), float(sz.group(2))) if sz else None


def contact(pngs, out, label=None):
    """تمام صفحات ایک تصویر میں ساتھ ساتھ (سرخی اوپر)"""
    ims = [Image.open(p).convert('RGB') for p in pngs]
    if not ims: return None
    W = sum(i.width for i in ims) + 12 * (len(ims) + 1); H = max(i.height for i in ims) + 24
    sheet = Image.new('RGB', (W, H), (90, 90, 90)); x = 12
    for i in reversed(ims):          # RTL: صفحہ 1 دائیں
        sheet.paste(i, (x, 12)); x += i.width + 12
    sheet.save(out)
    return out


def same_pages(a_pngs, b_pngs):
    """دونوں PDF کے صفحات pixel تک برابر؟ (فرق والے pixel کی گنتی ہر صفحے پر)"""
    if len(a_pngs) != len(b_pngs): return False, ['pages %d vs %d' % (len(a_pngs), len(b_pngs))]
    diffs = []
    for a, b in zip(a_pngs, b_pngs):
        A = Image.open(a).convert('L'); B = Image.open(b).convert('L')
        if A.size != B.size: diffs.append('size'); continue
        d = ImageChops.difference(A, B).point(lambda v: 255 if v > 40 else 0)
        diffs.append(sum(1 for v in d.getdata() if v))
    return all(x == 0 for x in diffs), diffs
