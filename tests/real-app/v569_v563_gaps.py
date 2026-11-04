"""(v569) 3 نومبر سے پہلے کا اصل کوڈ (v563، commit af2bdb6) اور v569 — الفاظ کے فاصلے کی براہِ راست ناپ

دونوں نسخے ساتھ ساتھ (v563: DIO_BASE=http://localhost:8771/ ، v569: http://localhost:8770/)؛ ایک ہی متن، ایک ہی
اصل فونٹ فائل۔ ہر دستاویز کے چھپنے والے کاغذ (پرنٹ کا آخری HTML) میں:
  • kerning (فونٹ کی حتمی قدر)
  • متن کی «قدرتی چوڑائی» — وہی متن ایک ہی سطر میں (justify کے بغیر)، دستاویز کے اپنے فونٹ / فاصلے کے اصولوں پر،
    em میں — الفاظ کے بیچ کا فاصلہ اور حروف کی بناوٹ دونوں اسی میں
  • دو اردو الفاظ کے بیچ سب سے تنگ خالی جگہ (em)
چلانا: DIO_BASE=... DIO_TAG=v563|v569 python3 v569_v563_gaps.py
"""
from v564_common import *

V = OUT + '/v569/gaps/'
os.makedirs(V, exist_ok=True)
TAG = os.environ.get('DIO_TAG', 'v569')

MEASURE = """async ([h, sel]) => { const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;left:-30000px;top:0;width:816px;height:1248px;border:0;';
  document.documentElement.appendChild(f); const d = f.contentDocument; d.open(); d.write(h); d.close();
  await new Promise(r => setTimeout(r, 900)); try { await d.fonts.ready; } catch (_) {}
  const w = f.contentWindow; const els = [...d.querySelectorAll(sel)].filter(e => (e.textContent || '').trim().length > 40);
  const out = { n: els.length, kern: null, natural: [], minGap: null, gaps: 0, font: null };
  els.forEach((el) => {
    const cs = w.getComputedStyle(el); out.kern = cs.fontKerning; out.font = cs.fontFamily.slice(0, 30) + ' ' + cs.fontSize;
    out.ws = cs.wordSpacing; out.ls = cs.letterSpacing; out.len = (out.len || 0) + el.textContent.replace(/\s+/g, ' ').trim().length;
    out.head = el.textContent.replace(/\s+/g, ' ').trim().slice(0, 60);
    const em = parseFloat(cs.fontSize);
    const s = d.createElement('span'); s.textContent = el.textContent.replace(/\\s+/g, ' ').trim();
    s.style.cssText = 'white-space:pre;display:inline-block;text-align:right;position:absolute;right:0;top:0;visibility:hidden;';
    el.appendChild(s); out.natural.push(+(s.getBoundingClientRect().width / em).toFixed(3));
    // ایک سطر والی نقل (justify نہیں) میں ہر خالی جگہ کی چوڑائی — الفاظ کا اصل فاصلہ، justify اور سطر ٹوٹنے سے الگ
    { const tt = s.firstChild, vv = tt.nodeValue, rr = d.createRange();
      for (let i = 1; i < vv.length - 1; i++) { if (vv[i] !== ' ' || !/[\u0600-\u06FF]/.test(vv[i - 1]) || !/[\u0600-\u06FF]/.test(vv[i + 1])) continue;
        rr.setStart(tt, i); rr.setEnd(tt, i + 1); const g = rr.getBoundingClientRect().width / em; out.lineGaps = (out.lineGaps || 0) + 1;
        if (out.lineMin === undefined || g < out.lineMin) out.lineMin = +g.toFixed(3); } }
    s.remove();
    // دو اردو الفاظ کے بیچ ہر خالی جگہ (ایک ہی سطر پر)
    const tw = d.createTreeWalker(el, NodeFilter.SHOW_TEXT); let t;
    while ((t = tw.nextNode())) { const v = t.nodeValue;
      for (let i = 1; i < v.length - 1; i++) {
        if (v[i] !== ' ' || !/[\\u0600-\\u06FF]/.test(v[i - 1]) || !/[\\u0600-\\u06FF]/.test(v[i + 1])) continue;
        // خالی جگہ (space) کے اپنے خانے کی چوڑائی — v564_test.py کا SPACES والا طریقہ (لفظ کے اندر جُڑے حروف کا خانہ
        //   نستعلیق میں کبھی پوری سطر جتنا آتا ہے، اس لیے پڑوسی حروف کے کنارے نہیں ناپے جاتے)
        const r = d.createRange(); r.setStart(t, i); r.setEnd(t, i + 1); const sp = r.getBoundingClientRect();
        r.setStart(t, i - 1); r.setEnd(t, i); const a = r.getBoundingClientRect();
        r.setStart(t, i + 1); r.setEnd(t, i + 2); const b = r.getBoundingClientRect();
        if (sp.width <= 0 || Math.abs(a.top - sp.top) > 2 || Math.abs(b.top - sp.top) > 2) continue;   // سطر کے آخر کی جگہ
        const g = sp.width / parseFloat(w.getComputedStyle(t.parentElement).fontSize); out.gaps++; if (out.minGap === null || g < out.minGap) out.minGap = g;
      } }
  });
  if (out.minGap !== null) out.minGap = +out.minGap.toFixed(3);
  f.remove(); return out; }"""

HOOK = """(() => { window.__dp = []; window.__dioPaperAuto = 'legal';
  window._dioDoPrint = function (h) { window.__dp.push(h); }; return 0; })()"""


def grab(pg, call):
    pg.evaluate(HOOK); pg.evaluate(call + '; 0')
    for _ in range(150):
        if pg.evaluate("window.__dp.length"): break
        pg.wait_for_timeout(200)
    return pg.evaluate("window.__dp[0] || ''")


TEXT = ' '.join(PARA)

with sync_playwright() as p:
    b = p.chromium.launch()
    res = {}
    ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
    pg.evaluate("window.confirm = () => true; 0")
    # ── بیرونی ضمنی ──
    open_zimni(pg)
    pg.evaluate(fill_js(4, 2))
    pg.evaluate("""() => { const a = _zimniDoc().querySelector('tr.zf-blk .zf-actbody'); a.focus(); const r = document.createRange(); r.selectNodeContents(a);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, '16/10/2026'); return 0; }""")
    pg.wait_for_timeout(600)
    h = grab(pg, "_dioPrintCurrent()")
    res['zimni'] = pg.evaluate(MEASURE, [h, '#ch173-doc tr.zf-blk .zf-body'])
    res['zimni_screen'] = pg.evaluate("() => getComputedStyle(document.querySelector('#ch173-doc tr.zf-blk .zf-body')).fontKerning")
    # ── درخواست (متن لکھ کر) ──
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("_openMisalEditor('darkhwastain')"); pg.wait_for_timeout(2200)
    pg.evaluate("""(t) => { const e = document.querySelector('#dk-doc .dk-body'); if (!e) return 0; e.focus(); const r = document.createRange();
        r.selectNodeContents(e); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); return 0; }""", TEXT)
    pg.wait_for_timeout(600)
    h = grab(pg, "_dioPrintCurrent()")
    res['darkhwast'] = pg.evaluate(MEASURE, [h, '#dk-doc .dk-body'])
    res['darkhwast_screen'] = pg.evaluate("() => { const e = document.querySelector('#dk-doc .dk-body'); return e ? getComputedStyle(e).fontKerning : null; }")
    ctx.close()
    # ── چالان (حالات) ──
    ctx, pg, errs2 = open_app(b, viewport={'width': 1366, 'height': 768})
    pg.evaluate(SEED); pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2600)
    pg.evaluate("""(t) => { const h = document.querySelector('#ch173-doc [data-k="halaat"]'); h.focus(); const r = document.createRange();
        r.selectNodeContents(h); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); return 0; }""", ' ' + ' '.join(PARA[:2]))
    pg.wait_for_timeout(800)
    h = grab(pg, "_printR173()")
    res['challan'] = pg.evaluate(MEASURE, [h, '#ch173-doc [data-k="halaat"]'])
    res['challan_screen'] = pg.evaluate("() => getComputedStyle(document.querySelector('#ch173-doc [data-k=\"halaat\"]')).fontKerning")
    res['errors'] = (errs + errs2)[:4]
    ctx.close()
    b.close()
json.dump(res, open(V + TAG + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(TAG, json.dumps(res, ensure_ascii=False))
