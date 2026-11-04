"""(TASK 22) repro — کوئی تبدیلی نہیں، صرف موجودہ رویہ ناپنا (اصل ایپ، Desktop + Mobile)
  1) مقدمہ → ضمنیات → «+ ضمنی درج کریں» → متن لکھا (محفوظ نہیں) → «نئی دستاویز» → ایف آئی آر → ضمنیات کی ٹیب پر واپس
  2) وہی، مگر ایف آئی آر سے «واپس»
  3) براؤزر کی تاریخ (history) — ہر صفحہ بدلنے پر کتنی entries
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v564_common import *

V = OUT + '/t22/repro/'
os.makedirs(V, exist_ok=True)
MARK = 'آزمائشی غیر محفوظ متن ٹاسک بائیس'

STATE = """() => ({
  docview: !!document.getElementById('dio-docview'),
  tabs: (typeof _dioTabs !== 'undefined') ? _dioTabs.map(t => t.id) : null,
  active: (typeof _dioActiveTab !== 'undefined') ? _dioActiveTab : null,
  zimniEditor: !!document.querySelector('#ch173-doc tr.zf-blk'),
  zimniList: !!document.querySelector('.zt'),
  firPage: !!document.getElementById('fir-page'),
  markOnScreen: (document.body.innerText || '').includes(%s),
  hist: history.length, hash: location.hash
})""" % json.dumps(MARK, ensure_ascii=False)


def run(desktop):
    tag = 'desktop' if desktop else 'mobile'
    out = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        vp = {'width': 1366, 'height': 768} if desktop else {'width': 390, 'height': 844}
        extra = {} if desktop else {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
        ctx, pg, errs = open_app(b, viewport=vp, **extra)
        pg.evaluate("window.confirm = () => true; 0")
        out['hist_after_login'] = pg.evaluate("history.length")
        # ── 1) ضمنی میں لکھا، پھر دوسری دستاویز ──
        open_zimni(pg)
        pg.evaluate("""(t) => { const e = _zimniDoc().querySelector('tr.zf-blk .zf-body'); e.focus();
          const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
          document.execCommand('insertText', false, t); return 0; }""", MARK)
        pg.wait_for_timeout(600)
        out['1a_zimni_typed'] = pg.evaluate(STATE)
        pg.screenshot(path=V + f'{tag}_1a_zimni_typed.png')
        # افسر کا راستہ: پورے صفحے کی پٹی → «نئی دستاویز» → ایف آئی آر
        pg.evaluate("_dioAddDocPicker()"); pg.wait_for_timeout(300)
        pg.screenshot(path=V + f'{tag}_1b_picker.png')
        pg.evaluate("_dioPickDoc('fir')"); pg.wait_for_timeout(1500)
        out['1b_fir_open'] = pg.evaluate(STATE)
        pg.screenshot(path=V + f'{tag}_1c_fir.png')
        # ضمنیات کی ٹیب پر واپس
        pg.evaluate("_dioSwitchTab('zamniyat')"); pg.wait_for_timeout(1800)
        out['1c_back_to_zimni_tab'] = pg.evaluate(STATE)
        pg.screenshot(path=V + f'{tag}_1d_back_zimni_tab.png')
        out['1c_draft_saved'] = pg.evaluate("""(t) => Object.keys(localStorage).filter(k => /^dio_zimni_draft_/.test(k)).some(k => (localStorage.getItem(k) || '').includes(t))""", MARK)
        # ── 2) ایف آئی آر سے «واپس» ──
        pg.evaluate("_dioPickDoc('fir')"); pg.wait_for_timeout(1500)
        pg.evaluate("dioGoBack()"); pg.wait_for_timeout(1200)
        out['2_after_wapas_from_fir'] = pg.evaluate(STATE)
        pg.screenshot(path=V + f'{tag}_2_after_wapas.png')
        # ── 3) history ──
        pg.evaluate("showPage('cases', null)"); pg.wait_for_timeout(800)
        pg.evaluate("showPage('reminders', null)"); pg.wait_for_timeout(800)
        out['3_hist_after_3_pages'] = pg.evaluate("history.length")
        out['errors'] = errs[:5]
        b.close()
    print(tag, json.dumps(out, ensure_ascii=False, indent=1), flush=True)
    return out


if __name__ == '__main__':
    only = os.environ.get('DIO_ONLY', '')
    res = {}
    if only in ('', 'desktop'): res['desktop'] = run(True)
    if only in ('', 'mobile'): res['mobile'] = run(False)
    json.dump(res, open(V + 'repro.json', 'w'), ensure_ascii=False, indent=1)
