"""(v568) TASK 7-D — بیان 161 (اکیلا): پرانا بمقابلہ موجودہ — اسکرین + پرنٹ کی تصویر (صرف جانچ)
چلانا: DIO_BASE=http://localhost:8771/ DIO_ROOT=/path/to/worktree DIO_LABEL=v555 python3 v568_161_compare.py
"""
from v564_common import *

V = OUT + '/v568/compare/'
os.makedirs(V, exist_ok=True)
LABEL = os.environ.get('DIO_LABEL', 'now')
ROOT = os.environ.get('DIO_ROOT', os.path.join(HERE, '..', '..'))
WIT = """(() => { const d = window.__db;
  d.case_witnesses = [
    { id:'w1', case_id:'c1', full_name:'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض موضع سید پور تحصیل شجاع آباد ضلع ملتان', status:'fir_eye', witness_type:'fir', created_at:'2026-10-01' },
    { id:'w2', case_id:'c1', full_name:'احمد علی ولد بشیر احمد', status:'fir_eye', witness_type:'fir', created_at:'2026-10-02' } ];
  d.fir_matn = [{ id:'m1', case_id:'c1', type:'fir', matn:'میں مدعی مقدمہ ہوں۔ آج مورخہ 15/10/2026 کو بوقت 10:30 بجے میں اپنے موٹر سائیکل پر بازار جا رہا تھا کہ نامعلوم ملزمان نے موبائل فون اور نقدی چھین لی۔', created_at:'2026-10-01' }];
  return 0; })()"""
STMT = 'میں موقع پر موجود تھا اور ملزمان کو موٹر سائیکل پر فرار ہوتے دیکھا۔ ملزمان کو سامنے آنے پر شناخت کر سکتا ہوں۔ محمد اسلم ASI نے میرا بیان قلمبند کیا۔ '


def to_pdf(b, html, path):
    name = '_v568cmp_' + LABEL + '.html'
    fn = os.path.join(ROOT, name)
    open(fn, 'w', encoding='utf-8').write('<!DOCTYPE html>' + html)
    c = b.new_context(); c.route('**/*', route); q = c.new_page()
    q.goto(BASE + name); q.wait_for_timeout(1500); q.evaluate('document.fonts.ready')
    q.pdf(path=path, prefer_css_page_size=True, print_background=True)
    c.close(); os.remove(fn)


with sync_playwright() as p:
    b = p.chromium.launch()
    for desktop in (True, False):
        tag = 'desktop' if desktop else 'mobile'
        vp = {'width': 1366, 'height': 768} if desktop else {'width': 390, 'height': 844}
        extra = {} if desktop else {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
        ctx, pg, errs = open_app(b, viewport=vp, **extra)
        pg.evaluate("window.confirm = () => true; 0")
        if os.environ.get('DIO_KERN'):   # جانچ: v564 کا «kerning بند» قاعدہ ہٹا کر
            pg.evaluate("window.dioTextCSS = (s) => (s || 'body') + '{}'; const t = document.getElementById('dio-text-screen'); if (t) t.remove(); 0")
        pg.evaluate(SEED); pg.evaluate(WIT)
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
        pg.evaluate("_newZimniA(); 0"); pg.wait_for_timeout(1800)
        pg.evaluate("""async (s) => { await _zaInsertWitnessStatement({ id:'w1', full_name:'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض موضع سید پور تحصیل شجاع آباد ضلع ملتان', status:'fir_eye' });
            const st = document.querySelectorAll('#ch173-doc .zfa-wit-stmt'); st[st.length - 1].textContent = 'بیان کیا کہ ' + s.repeat(3);
            await _zaInsertWitnessStatement({ id:'w2', full_name:'احمد علی ولد بشیر احمد', status:'fir_eye' });
            const s2 = document.querySelectorAll('#ch173-doc .zfa-wit-stmt'); s2[s2.length - 1].textContent = 'بیان کیا کہ ' + s.repeat(2);
            try { _zaLayout(); } catch (_) {} return 0; }""", STMT)
        pg.wait_for_timeout(1500)
        pg.screenshot(path=V + f'{LABEL}_{tag}_editor.png')
        if desktop:
            pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = 'legal'; 0")
            pg.evaluate("_printZimniA(); 0")
            pick_paper(pg, 'legal')
            for _ in range(100):
                if pg.evaluate("window.__snaps.length"): break
                pg.wait_for_timeout(200)
            h = pg.evaluate("window.__snaps[0] || ''")
            print(LABEL, 'print html', len(h), flush=True)
            if h:
                to_pdf(b, h, V + f'{LABEL}_print.pdf')
                subprocess.run(['pdftoppm', '-png', '-r', '70', '-f', '1', '-l', '1', '-singlefile', V + f'{LABEL}_print.pdf', V + f'{LABEL}_print_p1'])
                print(LABEL, 'pages', pdf_info(V + f'{LABEL}_print.pdf'), flush=True)
        print(LABEL, tag, 'errors', errs[:4], flush=True)
        ctx.close()
    b.close()
