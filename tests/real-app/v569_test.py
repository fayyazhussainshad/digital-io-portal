"""(v569) اصل ایپ کی جانچ — الفاظ کا فاصلہ: 3 نومبر (v564) کا «فونٹ kerning بند» قاعدہ صرف چالان (رپورٹ 173) پر

افسر کا حکم (4 نومبر 2026): «Fix Current line and word to word spacing for report 173 only and not for other
documents, restore previous except reports 173» — انتخاب: «Keep rule in 173 only» + «Restore ضمنی too» +
منسلک اندرونی شیٹ «Follow its بیرونی ضمنی»۔

Desktop 1366×768 اور Mobile 390×844 (touch) — ہر دستاویز:
  • اسکرین پر فونٹ کی kerning (چالان: بند؛ باقی سب: خودکار، 3 نومبر سے پہلے جیسا)
  • «پرنٹ» بٹن اور Ctrl+P کا کاغذ ایک؛ براؤزر مینو (⋮ › Print) کی چھپائی؛ شیئر PDF کا خانہ
  • چالان: دو اردو الفاظ کے بیچ سب سے تنگ خالی جگہ ≥ 0.19em (آج والا فاصلہ جوں کا توں)
  • ضمنی: فونٹ کی اپنی kerning واپس (سب سے تنگ جگہ 0.1em سے کم — 3 نومبر سے پہلے جیسی؛ اصل v563 کوڈ سے براہِ
    راست موازنہ: v569_v563_gaps.py)
  • پورا مقدمہ ایک ساتھ: چالان والا حصہ بند، باقی خودکار
چلانا: `python3 v569_test.py` (DIO_ONLY=desktop|mobile)
"""
from v564_common import *

V = OUT + '/v569/test/'
os.makedirs(V, exist_ok=True)
R = []


def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)


HOOK_DP = """((paper) => { window.__dp = []; window.__dioPaperAuto = paper || 'keep';
  if (!window.__dpOrig) window.__dpOrig = window._dioDoPrint;
  window._dioDoPrint = function (h) { window.__dp.push(h); }; return 0; })"""
UNHOOK_DP = "(() => { if (window.__dpOrig) window._dioDoPrint = window.__dpOrig; window.__dioPaperAuto = undefined; return 0; })()"


def final_print(pg, fn, paper='legal'):
    """fn() — افسر کا راستہ (بٹن / Ctrl+P / سیدھا فنکشن)؛ واپسی: آخری کاغذ (iframe میں جانے والا HTML)"""
    pg.evaluate(HOOK_DP, paper)
    fn()
    for _ in range(150):
        if pg.evaluate("window.__dp.length"): break
        pg.wait_for_timeout(200)
    h = pg.evaluate("window.__dp[0] || ''")
    pg.evaluate(UNHOOK_DP)
    return re.sub(r'saved_at[^,]*', '', h)


# کاغذ (iframe) میں: body اور متن کی kerning + دو اردو الفاظ کے بیچ سب سے تنگ خالی جگہ (em)
PAPER = """async ([h, sel]) => { const f = document.createElement('iframe');
  f.style.cssText = 'position:fixed;left:-30000px;top:0;width:816px;height:1248px;border:0;';
  document.documentElement.appendChild(f); const d = f.contentDocument; d.open(); d.write(h); d.close();
  await new Promise(r => setTimeout(r, 900)); try { await d.fonts.ready; } catch (_) {}
  const w = f.contentWindow; const els = [...d.querySelectorAll(sel)].filter(e => (e.textContent || '').trim().length > 20);
  const out = { body: w.getComputedStyle(d.body).fontKerning, n: els.length, kern: els.length ? w.getComputedStyle(els[0]).fontKerning : null, gaps: 0, min: null,
                parts: [] };
  // الفاظ کا فاصلہ justify اور سطر ٹوٹنے سے الگ: ہر متن کی ایک سطر والی نقل (justify نہیں) — دستاویز کے اپنے فونٹ،
  //   kerning، word/letter-spacing پر؛ ہر خالی جگہ (space) کے اپنے خانے کی چوڑائی ÷ فونٹ سائز
  els.forEach((el) => { const sp0 = d.createElement('span');
    sp0.style.cssText = 'white-space:pre;display:inline-block;text-align:right;position:absolute;right:0;top:0;visibility:hidden;text-align-last:auto;';
    sp0.textContent = el.textContent.replace(/\s+/g, ' ').trim(); el.appendChild(sp0);
    const t = sp0.firstChild, v = t.nodeValue, em = parseFloat(w.getComputedStyle(sp0).fontSize), r = d.createRange();
    for (let i = 1; i < v.length - 1; i++) {
      if (v[i] !== ' ' || !/[\u0600-\u06FF]/.test(v[i - 1]) || !/[\u0600-\u06FF]/.test(v[i + 1])) continue;
      r.setStart(t, i); r.setEnd(t, i + 1); const g = r.getBoundingClientRect().width / em;
      out.gaps++; if (out.min === null || g < out.min) out.min = g; }
    sp0.remove(); });
  if (out.min !== null) out.min = +out.min.toFixed(3);
  d.querySelectorAll('[class*="dpk-"]').forEach((r) => { if (!/(^| )dpk-\\d+( |$)/.test(r.className)) return;
    const t = [...r.querySelectorAll('*')].find(e => e.children.length === 0 && /[\\u0600-\\u06FF]{3}/.test(e.textContent || '') && w.getComputedStyle(e).display !== 'none');
    out.parts.push({ cls: r.className, kern: w.getComputedStyle(r).fontKerning, text: t ? w.getComputedStyle(t).fontKerning : null,
                     challan: !!(r.querySelector('#ch173-doc') && !r.querySelector('.zf-tbl,.zfa-tbl')) }); });
  f.remove(); return out; }"""

SCREEN = """(sel) => { const e = document.querySelector(sel); if (!e) return null;
  return { kern: getComputedStyle(e).fontKerning, ws: getComputedStyle(e).wordSpacing, sheet: !!document.getElementById('dio-text-screen') }; }"""

# براؤزر کا اپنا مینو (⋮ › Print): beforeprint کے لمحے اصل چھپنے والی جگہ کی kerning — چالان (پرانا راستہ: زندہ
#   دستاویز #dio-nprint-host میں) اور ضمنی (اپنا تیار کاغذ، الگ shadow خانہ #dio-pp-host)
MENU = """(sel) => { window.dispatchEvent(new Event('beforeprint'));
  let e = document.querySelector('#dio-nprint-host ' + sel), where = 'nprint-host';
  if (!e) { const h = document.getElementById('dio-pp-host'); if (h && h.shadowRoot) { e = h.shadowRoot.querySelector(sel); where = 'pp-host'; } }
  const k = e ? getComputedStyle(e).fontKerning : null;
  window.dispatchEvent(new Event('afterprint')); return { where, kern: k }; }"""

FRAME = """async (h) => { const fr = await DIO.share._frameFor(h); const k = fr.doc.defaultView.getComputedStyle(fr.doc.body).fontKerning;
  try { fr.frame.remove(); } catch (_) {} return k; }"""
SHARE = """async (h) => { try { const b = await DIO.share.pdf({ html: h }, 'v569'); return b && b.size > 15000 ? 'ok:' + b.size : 'small:' + (b && b.size); } catch (e) { return 'ERR ' + e.message; } }"""
RAW = "async (call) => { const r = await DIO.share.capturePrint(() => { (0, eval)(call); }); return r.html || ''; }"

TXT = ' ' + ' '.join(PARA[:2])
WIT = """(() => { const d = window.__db;
  d.case_witnesses = [
    { id:'w1', case_id:'c1', full_name:'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض', status:'fir_eye', witness_type:'fir', created_at:'2026-10-01' } ];
  return 0; })()"""
HALAAT = '#ch173-doc [data-k="halaat"]'
ZBODY = '#ch173-doc tr.zf-blk .zf-body'


def put_text(pg, sel, txt, replace=False):
    pg.evaluate("""([s, t, rep]) => { const h = document.querySelector(s); h.focus(); const r = document.createRange(); r.selectNodeContents(h);
        if (!rep) r.collapse(false); const g = getSelection(); g.removeAllRanges(); g.addRange(r); document.execCommand('insertText', false, t); return 0; }""", [sel, txt, replace])
    pg.wait_for_timeout(500)


def ctrl_p(pg, sel):
    def go():
        pg.click(sel); pg.keyboard.press('End'); pg.keyboard.press('Control+p')
    return go


def measurer(b):
    """کاغذ کی ناپ ایک الگ عام صفحے پر، «پرنٹ» کی شکل میں (v564_test.py کا html_page جیسا) — موبائل کی نقالی والے صفحے
    میں Chrome کی text autosizing (صرف اسکرین، چھپائی میں کبھی نہیں) آزمائشی iframe کا متن بڑا کر دیتی ہے"""
    c = b.new_context(viewport={'width': 1000, 'height': 1400}); c.route('**/*', route)
    q = c.new_page(); q.emulate_media(media='print'); q.goto(BASE + 'offline.html'); q.wait_for_timeout(500)
    return c, q


def run(b, tag, vp, extra):
    desktop = tag == 'desktop'
    mc, mq = measurer(b)
    ctx, pg, errs = open_app(b, viewport=vp, **extra)
    pg.evaluate("window.confirm = () => true; 0")
    pg.evaluate(SEED); pg.evaluate(WIT)
    raws = {}
    # ═══ 1) چالان (رپورٹ 173) — آج والا فاصلہ جوں کا توں ═══
    try:
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2600)
        put_text(pg, HALAAT, TXT)
        typed = pg.evaluate("(s) => document.querySelector(s).textContent", HALAAT)
        pg.evaluate("_saveR173()"); pg.wait_for_timeout(1800)
        pg.evaluate("(async () => { openReport173WithType('list'); await new Promise(r => setTimeout(r, 2200)); const x = (window.__db.report_173 || []).slice(-1)[0]; if (x) await _r173OpenDoc(String(x.id)); return 0; })()")
        pg.wait_for_timeout(2800); pg.evaluate("document.fonts.ready")
        back = pg.evaluate("(s) => document.querySelector(s).textContent", HALAAT)
        check(f'{tag} چالان: محفوظ → دوبارہ کھولا — حالات کا متن وہی', words(back) == words(typed) and len(words(typed)) > 100, (len(words(back)), len(words(typed))))
        s = pg.evaluate(SCREEN, HALAAT)
        check(f'{tag} چالان: اسکرین پر kerning بند (آج جیسا)؛ «ہر دستاویز» والا اسکرین قاعدہ نہیں', s and s['kern'] == 'none' and not s['sheet'], s)
        hb = final_print(pg, lambda: pg.evaluate("_printR173(); 0"))
        open(V + f'{tag}_challan_print.html', 'w', encoding='utf-8').write(hb)
        ok_head = hb.startswith('<!DOCTYPE html><html dir="rtl"><head><style id="dio-text-css">body{ font-kerning:none; }</style><meta charset="UTF-8">') or \
            '<head><style id="dio-text-css">body{ font-kerning:none; }</style><meta charset="UTF-8">' in hb
        m = mq.evaluate(PAPER, [hb, HALAAT])
        check(f'{tag} چالان: پرنٹ کا کاغذ — kerning بند، دو اردو الفاظ کے بیچ سب سے تنگ جگہ ≥ 0.19em (آج جیسا)',
              ok_head and m['body'] == 'none' and m['kern'] == 'none' and m['gaps'] >= 15 and (m['min'] or 0) >= 0.19, m)
        if desktop:
            hc = final_print(pg, ctrl_p(pg, '#ch173-doc .normwrap'))
            check(f'{tag} چالان: Ctrl+P = «پرنٹ» — کاغذ حرف بحرف ایک', hc == hb and len(hb) > 20000, (len(hc), len(hb)))
        mn = pg.evaluate(MENU, '[data-k="halaat"]')
        check(f'{tag} چالان: براؤزر مینو (⋮ › Print) — kerning بند (آج جیسا)', mn['kern'] == 'none', mn)
        raws['challan'] = pg.evaluate(RAW, "_printR173()")
        fk = pg.evaluate(FRAME, raws['challan'])
        sh = pg.evaluate(SHARE, raws['challan']) if desktop else 'ok:skip'
        check(f'{tag} چالان: شیئر PDF کا کاغذ — kerning بند؛ PDF بنتی ہے', fk == 'none' and str(sh).startswith('ok:'), (fk, sh))
    except Exception as e:
        check(f'{tag} چالان: حصہ رک گیا', False, repr(e)[:400])

    # ═══ 2) بیرونی ضمنی — 3 نومبر سے پہلے جیسی ═══
    try:
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1500)
        pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2300)
        pg.evaluate(fill_js(4, 2))
        pg.evaluate("""() => { const a = _zimniDoc().querySelector('tr.zf-blk .zf-actbody'); a.focus(); const r = document.createRange(); r.selectNodeContents(a);
          const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, '16/10/2026'); return 0; }""")
        pg.wait_for_timeout(600)
        ed = pg.evaluate("[...document.querySelectorAll('#ch173-doc tr.zf-blk .zf-body')].map(x => x.textContent)")
        if desktop:
            pg.click(ZBODY); pg.keyboard.press('End'); pg.keyboard.press('Control+s')
        else:
            pg.evaluate("document.getElementById('zf-save-btn').click()")
        pg.wait_for_timeout(2200)
        n = pg.evaluate("(window.__db.zimni_reports || []).length")
        sid = pg.evaluate("(window.__db.zimni_reports || []).slice(-1)[0].id")
        pg.evaluate("async () => { await _zimniBackToList(); return 0; }"); pg.wait_for_timeout(900)
        pg.evaluate("(id) => { _openZimni(id); return 0; }", sid); pg.wait_for_timeout(3000)
        back = pg.evaluate("[...document.querySelectorAll('#ch173-doc tr.zf-blk .zf-body')].map(x => x.textContent)")
        check(f'{tag} ضمنی: محفوظ → دوبارہ کھولی — ہر اندراج کا متن وہی', n == 1 and [words(x) for x in back] == [words(x) for x in ed] and len(ed) == 4, (n, len(back)))
        s = pg.evaluate(SCREEN, ZBODY)
        check(f'{tag} ضمنی: اسکرین پر kerning خودکار (3 نومبر سے پہلے جیسی)', s and s['kern'] == 'auto' and not s['sheet'], s)
        hb = final_print(pg, lambda: pg.evaluate("(document.querySelector('#dio-dv-bar button[onclick=\"_dioPrintCurrent()\"]') || document.querySelector('[data-dio-print]')).click()"))
        open(V + f'{tag}_zimni_print.html', 'w', encoding='utf-8').write(hb)
        m = mq.evaluate(PAPER, [hb, ZBODY])
        check(f'{tag} ضمنی: «پرنٹ» بٹن کا کاغذ — kerning خودکار، کوئی kerning قاعدہ نہیں؛ فونٹ کی اپنی kerning واپس (سب سے تنگ جگہ < 0.1em، 3 نومبر سے پہلے جیسی)',
              'font-kerning' not in hb and 'zf-tbl' in hb and m['body'] == 'auto' and m['kern'] == 'auto' and m['gaps'] > 100 and (m['min'] if m['min'] is not None else 1) < 0.1, m)
        if desktop:
            hc = final_print(pg, ctrl_p(pg, ZBODY))
            check(f'{tag} ضمنی: Ctrl+P = «پرنٹ» — کاغذ حرف بحرف ایک', hc == hb and len(hb) > 20000, (len(hc), len(hb)))
        mn = pg.evaluate(MENU, '.zf-body')
        check(f'{tag} ضمنی: براؤزر مینو (⋮ › Print) — اپنا تیار کاغذ، kerning خودکار', mn['where'] == 'pp-host' and mn['kern'] == 'auto', mn)
        raws['zimni'] = re.sub(r'saved_at[^,]*', '', pg.evaluate(RAW, "_dioPrintCurrent()"))
        fk = pg.evaluate(FRAME, raws['zimni'])
        sh = pg.evaluate(SHARE, raws['zimni']) if desktop else 'ok:skip'
        check(f'{tag} ضمنی: شیئر PDF کا کاغذ — kerning خودکار؛ PDF بنتی ہے', fk == 'auto' and str(sh).startswith('ok:'), (fk, sh))
    except Exception as e:
        check(f'{tag} ضمنی: حصہ رک گیا', False, repr(e)[:400])

    # ═══ 3) اکیلا بیان 161 ═══
    try:
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
        pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(1800)
        v = pg.evaluate("() => ([...document.querySelectorAll('#zfa-wit-sel option')].find(o => /غلام رسول/.test(o.textContent)) || {}).value")
        pg.select_option('#zfa-wit-sel', v); pg.wait_for_timeout(1400)
        put_text(pg, '#ch173-doc .zfa-wit-stmt', TXT)
        s = pg.evaluate(SCREEN, '#ch173-doc .zfa-wit-stmt')
        hb = final_print(pg, lambda: pg.evaluate("_printZimniA(); 0"))
        m = mq.evaluate(PAPER, [hb, '#ch173-doc .zfa-wit-stmt'])
        check(f'{tag} بیان 161: اسکرین اور پرنٹ پر kerning خودکار (27 اکتوبر / 3 نومبر سے پہلے جیسا)',
              s and s['kern'] == 'auto' and m['body'] == 'auto' and m['kern'] == 'auto' and 'font-kerning:none' not in hb, (s, m))
    except Exception as e:
        check(f'{tag} بیان 161: حصہ رک گیا', False, repr(e)[:400])

    # ═══ 4) باقی دستاویزات ═══
    DOCS = [('درخواست', "_openMisalEditor('darkhwastain')", '#dk-doc .dk-body', True),
            ('سزا سلپ', "_openMisalEditor('saza_slip')", '#saza-doc', True),
            ('انڈیکس نقل مسل', "_openMisalEditor('index_naql')", '#idx-paper', False),
            ('RFA فارم', "_openMisalEditor('rfa_form')", '#rfa-doc', False)]
    for name, opener, sel, menu in DOCS:
        try:
            pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; try{closeModal()}catch(e){}; 0")
            pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
            pg.evaluate(opener + '; 0'); pg.wait_for_timeout(2000)
            if 'rfa' in opener: pg.evaluate("(typeof _newRfa === 'function') && _newRfa(); 0"); pg.wait_for_timeout(1300)
            if name == 'درخواست': put_text(pg, sel, ' '.join(PARA), True)
            s = pg.evaluate(SCREEN, sel)
            hb = final_print(pg, lambda: pg.evaluate("_dioPrintCurrent(); 0"))
            m = mq.evaluate(PAPER, [hb, sel]) if hb else None
            check(f'{tag} {name}: اسکرین اور پرنٹ پر kerning خودکار (3 نومبر سے پہلے جیسا)',
                  s and s['kern'] == 'auto' and hb and 'font-kerning:none' not in hb and m['body'] == 'auto' and (m['kern'] in ('auto', None)), (s, m and {k: m[k] for k in ('body', 'kern', 'n')}))
            if menu:
                mn = pg.evaluate(MENU, sel.split(' ')[0])
                check(f'{tag} {name}: براؤزر مینو (⋮ › Print) — kerning خودکار', mn['kern'] == 'auto', mn)
            if name == 'درخواست':
                raws['darkhwast'] = re.sub(r'saved_at[^,]*', '', pg.evaluate(RAW, "_dioPrintCurrent()"))
                fk = pg.evaluate(FRAME, raws['darkhwast'])
                check(f'{tag} {name}: شیئر PDF کا کاغذ — kerning خودکار', fk == 'auto', fk)
        except Exception as e:
            check(f'{tag} {name}: حصہ رک گیا', False, repr(e)[:400])
    # واقعاتی رپورٹ (اپنا صفحہ)
    try:
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; 0")
        pg.evaluate("showPage('incident', null)"); pg.wait_for_timeout(1200)
        pg.evaluate("document.querySelector('.page-header .dio-add-btn').click(); 0"); pg.wait_for_timeout(2200)
        s = pg.evaluate(SCREEN, '#ir-doc')
        check(f'{tag} واقعاتی رپورٹ: اسکرین پر kerning خودکار', s and s['kern'] == 'auto', s)
        try: pg.evaluate("closeModal(); 0")
        except Exception: pass
    except Exception as e:
        check(f'{tag} واقعاتی رپورٹ: حصہ رک گیا', False, repr(e)[:400])

    # ═══ 5) پورا مقدمہ ایک ساتھ ═══
    if desktop and raws.get('challan') and raws.get('zimni') and raws.get('darkhwast'):
        try:
            pg.evaluate("async () => { await dioLoadScript('dio-forms.js'); await dioLoadScript('dio-share.js'); await dioLoadScript('case-print.js'); return 0; }")
            merged = pg.evaluate("async (hs) => await DIO.printPack.merge(hs, 'v569')", [raws['challan'], raws['zimni'], raws['darkhwast']])
            hb = final_print(pg, lambda: pg.evaluate("(h) => { dioPrint(h); return 0; }", merged))
            m = mq.evaluate(PAPER, [hb, 'zz-none'])
            ch = [x for x in m['parts'] if x['challan']]; rest = [x for x in m['parts'] if not x['challan']]
            check(f'{tag} پورا مقدمہ: چالان والا حصہ kerning بند، ضمنی اور درخواست خودکار',
                  m['body'] == 'auto' and len(ch) == 1 and ch[0]['kern'] == 'none' and ch[0]['text'] == 'none' and len(rest) == 2
                  and all(x['kern'] == 'auto' and x['text'] == 'auto' for x in rest), m['parts'])
        except Exception as e:
            check(f'{tag} پورا مقدمہ: حصہ رک گیا', False, repr(e)[:400])

    check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:3])
    pg.screenshot(path=V + f'{tag}_last.png')
    ctx.close(); mc.close()


def words(t):
    return re.sub(r'[\s ]+', ' ', t or '').strip()


with sync_playwright() as p:
    b = p.chromium.launch()
    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'):
        run(b, 'desktop', {'width': 1366, 'height': 768}, {})
    if only in ('', 'mobile'):
        run(b, 'mobile', {'width': 390, 'height': 844}, dict(is_mobile=True, has_touch=True, device_scale_factor=2))
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
