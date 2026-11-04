"""(v569) الفاظ / سطروں کا فاصلہ — صرف چالان (رپورٹ 173) پر 3 نومبر (v564) والا قاعدہ، باقی سب v563 جیسا

یہ اسکرپٹ ایک ہی طرح دو بار چلتا ہے (DIO_TAG=before تبدیلی سے پہلے، DIO_TAG=after بعد میں) اور ہر دستاویز کا
اصل کاغذ (پرنٹ کا آخری HTML)، اسکرین پر فونٹ کی kerning، چالان کی اسکرین تصویر، شیئر PDF اور براؤزر مینو
والی چھپائی محفوظ کرتا ہے — v569_test.py دونوں کا موازنہ کرتا ہے۔
"""
from v564_common import *
import base64

V = OUT + '/v569/base/'
os.makedirs(V, exist_ok=True)
TAG = os.environ.get('DIO_TAG', 'before')
ONLY = os.environ.get('DIO_ONLY', '')

# پرنٹ کا آخری HTML (dioPrint کے بعد، iframe میں جانے والا) — _dioDoPrint پکڑ کر
HOOK_DP = """((paper) => { window.__dp = []; window.__dioPaperAuto = paper || 'keep';
  if (!window.__dpOrig) window.__dpOrig = window._dioDoPrint;
  window._dioDoPrint = function (h) { window.__dp.push(h); }; return 0; })"""
UNHOOK_DP = "(() => { if (window.__dpOrig) window._dioDoPrint = window.__dpOrig; window.__dioPaperAuto = undefined; return 0; })()"

# دستاویز کے کاغذ پر فونٹ کی kerning (اسکرین)
# دستاویز کی جڑیں (dio-keys.js کی ROOT_SEL جیسی فہرست — جانچ کی اپنی نقل)
ROOTS = ('#ch173-doc,#dk-doc,#ir-doc,#saza-doc,#rfa-doc,#rfa-page,#cro-doc,#cdr-doc,#dio-naqsha-doc,#idx-paper,#misal-editor,'
         '#dio-fv-paper,#a4-paper,#tpl-editable-area,#word-doc-editable,[data-dio-doc],#fir-page')
SCREEN_KERN = """() => { const d = [...document.querySelectorAll('""" + ROOTS + """')].find(e => e.getClientRects().length);
  if (!d) return null; const t = [...d.querySelectorAll('*')].find(e => e.children.length === 0 && /[\\u0600-\\u06FF]{3}/.test(e.textContent || '')) || d;
  return { root: d.id || d.className || d.tagName, kern: getComputedStyle(d).fontKerning, text: getComputedStyle(t).fontKerning,
           sheet: !!document.getElementById('dio-text-screen') }; }"""

# چھپنے والے کاغذ میں فونٹ کی kerning — الگ iframe میں (چھپائی کی شکل)
PRINT_KERN = """async (h) => { const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;left:-30000px;top:0;width:900px;height:1200px;border:0;';
  document.documentElement.appendChild(f); const d = f.contentDocument; d.open(); d.write(h); d.close();
  await new Promise(r => setTimeout(r, 700)); try { await d.fonts.ready; } catch (_) {}
  const w = f.contentWindow; const out = { body: w.getComputedStyle(d.body).fontKerning, parts: [] };
  const roots = d.querySelectorAll('[class^="dpk-"], [class*=" dpk-"]');
  const pick = (root) => { const t = [...root.querySelectorAll('*')].find(e => e.children.length === 0 && /[\\u0600-\\u06FF]{3}/.test(e.textContent || '') && w.getComputedStyle(e).display !== 'none'); return t ? w.getComputedStyle(t).fontKerning : null; };
  out.text = pick(d.body);
  roots.forEach(r => out.parts.push({ cls: r.className, kern: w.getComputedStyle(r).fontKerning, text: pick(r), challan: !!(r.querySelector('#ch173-doc') && !r.querySelector('.zf-tbl,.zfa-tbl')) }));
  f.remove(); return out; }"""


def final_print(pg, call, wait_ms=30000, paper='keep'):
    """دستاویز کا اپنا پرنٹ (Ctrl+P والا راستہ) — آخری HTML"""
    pg.evaluate(HOOK_DP, paper)
    pg.evaluate(call + '; 0')
    for _ in range(wait_ms // 200):
        if pg.evaluate("window.__dp.length"): break
        pg.wait_for_timeout(200)
    h = pg.evaluate("window.__dp[0] || ''")
    pg.evaluate(UNHOOK_DP)
    return h


def raw_print(pg, call):
    """DIO.share.capturePrint — وہی HTML جو شیئر / پورا مقدمہ لیتے ہیں (dioPrint سے پہلے)"""
    return pg.evaluate("async () => { const r = await DIO.share.capturePrint(() => { " + call + "; }); return r.html || ''; }")


def share_pdf(pg, raw, path):
    b64 = pg.evaluate("""async (h) => { try { const b = await DIO.share.pdf({ html: h }, 'v569');
        const a = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode.apply(null, a.subarray(i, i + 0x8000));
        return btoa(s); } catch (e) { return 'ERR ' + e.message; } }""", raw)
    if b64.startswith('ERR'):
        return b64
    open(path, 'wb').write(base64.b64decode(b64))
    return path


def save(name, data):
    p = V + f'{TAG}_{name}'
    if isinstance(data, (dict, list)):
        open(p + '.json', 'w', encoding='utf-8').write(json.dumps(data, ensure_ascii=False, indent=1))
    else:
        open(p + '.html', 'w', encoding='utf-8').write(data or '')


def open_challan(pg):
    pg.evaluate(SEED); pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
    pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2600)
    T = ' ' + ' '.join(PARA[:2])
    pg.evaluate("""(t) => { const h = document.querySelector('#ch173-doc [data-k="halaat"]'); h.focus(); const r = document.createRange();
        r.selectNodeContents(h); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); return 0; }""", T)
    pg.wait_for_timeout(600)
    pg.evaluate("_saveR173()"); pg.wait_for_timeout(1800)
    pg.evaluate("(async () => { openReport173WithType('list'); await new Promise(r => setTimeout(r, 2200)); const x = (window.__db.report_173 || []).slice(-1)[0]; if (x) await _r173OpenDoc(String(x.id)); return 0; })()")
    pg.wait_for_timeout(2800)
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)


def challan(b, tag, vp, extra):
    ctx, pg, errs = open_app(b, viewport=vp, **extra)
    pg.evaluate("window.confirm = () => true; 0")
    open_challan(pg)
    res = {'screen': pg.evaluate(SCREEN_KERN)}
    el = pg.query_selector('#ch173-doc')
    el.screenshot(path=V + f'{TAG}_{tag}_challan_screen.png')
    for paper in ('legal', 'a4'):
        h = final_print(pg, "_dioPrintCurrent()", 30000, paper)
        save(f'{tag}_challan_print_{paper}', h)
        res['print_' + paper] = pg.evaluate(PRINT_KERN, h) if h else None
    raw = raw_print(pg, "_dioPrintCurrent()")
    save(f'{tag}_challan_raw', raw)
    if tag == 'desktop':
        res['share'] = share_pdf(pg, raw, V + f'{TAG}_challan_share.pdf')
        # براؤزر کا اپنا مینو (⋮ › Print) — زندہ صفحہ
        path, native = menu_pdf(pg, 'legal', V + f'{TAG}_challan_menu.pdf')
        res['menu'] = [path, native]
    res['errors'] = errs[:4]
    save(f'{tag}_challan', res)
    print(TAG, tag, 'challan', json.dumps(res, ensure_ascii=False)[:600], flush=True)
    ctx.close()
    return raw


def zimni(b, tag, vp, extra):
    ctx, pg, errs = open_app(b, viewport=vp, **extra)
    pg.evaluate("window.confirm = () => true; 0")
    open_zimni(pg)
    pg.evaluate(fill_js(4, 2))
    pg.evaluate("""() => { const a = _zimniDoc().querySelector('tr.zf-blk .zf-actbody'); a.focus(); const r = document.createRange(); r.selectNodeContents(a);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, '16/10/2026'); return 0; }""")
    pg.wait_for_timeout(500)
    res = {'screen': pg.evaluate(SCREEN_KERN)}
    h = final_print(pg, "_dioPrintCurrent()")
    h = re.sub(r'saved_at[^,]*', '', h)
    save(f'{tag}_zimni_print', h)
    res['print'] = pg.evaluate(PRINT_KERN, h) if h else None
    raw = raw_print(pg, "_dioPrintCurrent()")
    raw = re.sub(r'saved_at[^,]*', '', raw)
    save(f'{tag}_zimni_raw', raw)
    if tag == 'desktop':
        res['share'] = share_pdf(pg, raw, V + f'{TAG}_zimni_share.pdf')
        path, native = menu_pdf(pg, 'legal', V + f'{TAG}_zimni_menu.pdf')
        res['menu'] = [path, native]
    res['errors'] = errs[:4]
    save(f'{tag}_zimni', res)
    print(TAG, tag, 'zimni', json.dumps(res, ensure_ascii=False)[:600], flush=True)
    ctx.close()
    return raw


# باقی دستاویزات — مقدمے کا دستاویز منظر، اپنا پرنٹ (Ctrl+P والا راستہ)
DOCS = [
    ('statements_161', "_openMisalEditor('statements_161')", ["(typeof _newZimniA === 'function') && _newZimniA()"]),
    ('darkhwast', "_openMisalEditor('darkhwastain')", []),
    ('saza_slip', "_openMisalEditor('saza_slip')", []),
    ('rfa', "_openMisalEditor('rfa_form')", ["(typeof _newRfa === 'function') && _newRfa()"]),
    ('index_naql', "_openMisalEditor('index_naql')", []),
    ('brief', "_openMisalEditor('brief')", ['WAIT']),
    ('arrest_form', "_openMisalEditor('arrest_form')", ['WAIT']),
    ('incident_report', "showPage('incident', null)", ["document.querySelector('.page-header .dio-add-btn').click()", 'WAIT'], "_irPrint()"),
]


def others(b, tag, vp, extra):
    ctx, pg, errs = open_app(b, viewport=vp, **extra)
    pg.evaluate("window.confirm = () => true; 0")
    pg.evaluate(SEED)
    res, raws = {}, {}
    for item in DOCS:
        name, opener, steps = item[:3]
        pcall = item[3] if len(item) > 3 else "_dioPrintCurrent()"
        try:
            pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; try{closeModal()}catch(e){}; 0")
            pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
            pg.evaluate(opener + '; 0'); pg.wait_for_timeout(1900)
            for s in steps:
                if s == 'WAIT': pg.wait_for_timeout(2500); continue
                pg.evaluate(s + '; 0'); pg.wait_for_timeout(1300)
            pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)
            r = {'screen': pg.evaluate(SCREEN_KERN)}
            h = final_print(pg, pcall, 20000)
            h = re.sub(r'saved_at[^,]*', '', h)
            save(f'{tag}_{name}_print', h)
            r['print'] = pg.evaluate(PRINT_KERN, h) if h else None
            r['len'] = len(h)
            if tag == 'desktop' and name in ('darkhwast', 'saza_slip', 'statements_161'):
                raws[name] = re.sub(r'saved_at[^,]*', '', raw_print(pg, pcall))
            res[name] = r
            print(TAG, tag, name, json.dumps(r, ensure_ascii=False)[:300], flush=True)
        except Exception as e:
            res[name] = {'error': repr(e)[:300]}
            print(TAG, tag, name, 'ERROR', repr(e)[:300], flush=True)
    res['errors'] = errs[:4]
    save(f'{tag}_others', res)
    if tag == 'desktop' and raws.get('darkhwast'):
        res2 = share_pdf(pg, raws['darkhwast'], V + f'{TAG}_darkhwast_share.pdf')
        print(TAG, 'darkhwast share', res2, flush=True)
    ctx.close()
    return raws


def whole_case(b, parts):
    """پورا مقدمہ ایک ساتھ (DIO.printPack.merge) — چالان، ضمنی، درخواست، سزا سلپ"""
    ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
    pg.evaluate(SEED)
    pg.evaluate("async () => { await dioLoadScript('dio-forms.js'); await dioLoadScript('dio-share.js'); await dioLoadScript('case-print.js'); return 0; }")
    merged = pg.evaluate("async (hs) => await DIO.printPack.merge(hs, 'v569')", parts)
    pg.evaluate(HOOK_DP); pg.evaluate("(h) => { dioPrint(h); return 0; }", merged)
    for _ in range(50):
        if pg.evaluate("window.__dp.length"): break
        pg.wait_for_timeout(200)
    h = pg.evaluate("window.__dp[0] || ''")
    save('case_merged_print', h)
    k = pg.evaluate(PRINT_KERN, h)
    save('case_merged', {'kern': k, 'errors': errs[:4]})
    print(TAG, 'whole case', json.dumps(k, ensure_ascii=False)[:600], flush=True)
    ctx.close()


if __name__ == '__main__':
    with sync_playwright() as p:
        b = p.chromium.launch()
        D = ({'width': 1366, 'height': 768}, {})
        M = ({'width': 390, 'height': 844}, dict(is_mobile=True, has_touch=True, device_scale_factor=2))
        parts = []
        if ONLY in ('', 'desktop'):
            parts.append(challan(b, 'desktop', *D))
            parts.append(zimni(b, 'desktop', *D))
            raws = others(b, 'desktop', *D)
            parts += [raws.get('darkhwast', ''), raws.get('saza_slip', '')]
            whole_case(b, [x for x in parts if x])
        if ONLY in ('', 'mobile'):
            challan(b, 'mobile', *M)
            zimni(b, 'mobile', *M)
            others(b, 'mobile', *M)
        b.close()
