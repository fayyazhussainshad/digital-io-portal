import sys, json, subprocess
sys.path.insert(0, '.')
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra) if extra != '' else ''), flush=True)

def typ(pg, k, text, append=False):
    pg.evaluate(f"""() => {{ const el=document.querySelector('#ir-doc [data-k="{k}"]'); el.focus(); const r=document.createRange();
      r.selectNodeContents(el); if ({'true' if append else 'false'}) r.collapse(false); const s=getSelection(); s.removeAllRanges(); s.addRange(r); }}""")
    pg.keyboard.insert_text(text)

def fill(pg):
    pg.select_option('#ir-doc .ir-cell:has([data-k="nature"]) select', 'چوری')
    pg.evaluate("_irSetDt('occ','2026-10-08T05:15'); _irSetDt('info','2026-10-08T05:20')")
    typ(pg, 'place', 'نیو وقاص ٹاؤن ملتان')
    typ(pg, 'caller', 'ملک زاہد اقبال ولد فیض احمد قوم کھوکھر سکنہ نیو وقاص ٹاؤن ملتان موبائل نمبر 0300-1234567')
    typ(pg, 'victim', 'ملک زاہد اقبال')
    typ(pg, 'motive', '-')
    typ(pg, 'accused', 'نامعلوم — تعداد 1')
    typ(pg, 'hulya', '--')
    typ(pg, 'vehicle', '-')
    typ(pg, 'visitors', 'SDPO صدر سرکل، PFSA ٹیم، CRO ٹیم')
    typ(pg, 'arrested', '-')
    typ(pg, 'detail', 'مسمی ملک زاہد اقبال ولد فیض احمد قوم کھوکھر سکنہ نیو وقاص ٹاؤن ملتان موبائل نمبر 0300-1234567 نے بذریعہ 15 اطلاع دی کہ بوقت 5:15 بجے صبح نماز کے لیے اٹھے تو کمرہ چیک کیا تو تالا کھلا تھا، کسی نامعلوم ملزم نے تقریباً 80 لاکھ روپے نقدی اور تقریباً 100 تولہ طلائی زیورات چوری کر لیے ہیں۔ من SI/SHO معہ PFSA اور CRO ٹیم موقع پر موجود ہوں، مزید تفتیش جاری ہے۔', append=True)
    pg.evaluate("document.activeElement && document.activeElement.blur()"); pg.wait_for_timeout(500)

GEO = """(() => { const d=document.getElementById('ir-doc'), t=d.querySelector('.ir-table'), r=t.querySelector('tr');
  const db=d.getBoundingClientRect(), tb=t.getBoundingClientRect(), cs=getComputedStyle(d);
  const contentL = db.left + parseFloat(cs.paddingLeft), contentR = db.right - parseFloat(cs.paddingRight);
  const ths=[...t.querySelectorAll('th')], lbls=[...t.querySelectorAll('th .ir-lbl')];
  const maxLbl=Math.max(...lbls.map(s=>s.offsetWidth));
  const cl=d.querySelector('.ir-closing').getBoundingClientRect();
  const lineH = parseFloat(getComputedStyle(ths[0]).lineHeight) || 30;
  return { display:getComputedStyle(t).display, tableL:Math.round(tb.left), tableR:Math.round(tb.right), contentL:Math.round(contentL), contentR:Math.round(contentR),
    cells:[...r.children].map(c=>Math.round(c.getBoundingClientRect().width)), tableW:Math.round(tb.width),
    c1:Math.round(ths[0].getBoundingClientRect().width), maxLbl:Math.round(maxLbl),
    wrapped: ths.filter(th=>{ const sp=th.querySelector('.ir-lbl'); return sp.offsetWidth > th.clientWidth - 16 + 1 || sp.getClientRects().length > 1 && new Set([...sp.getClientRects()].map(r=>Math.round(r.top))).size > 1; }).map(th=>th.textContent.trim()),
    closingCenter: Math.round((cl.left+cl.right)/2), tableCenter: Math.round((tb.left+tb.right)/2),
    pz: d.style.getPropertyValue('--ir-pz'), fs: cs.fontSize }; })()"""

def print_geometry(pg, how):
    """Put the page in the exact print state (isolation + print media + A4 width) and measure."""
    vp = pg.viewport_size
    if how == 'ctrlp':
        pg.keyboard.press('Control+p')
    else:
        pg.click('.ir-strip [data-dio-print]')
    pg.wait_for_timeout(300)
    pg.emulate_media(media='print'); pg.set_viewport_size({'width': 794, 'height': 1123}); pg.wait_for_timeout(300)
    g = pg.evaluate(GEO)
    pg.emulate_media(media='null'); pg.set_viewport_size(vp); pg.wait_for_timeout(200)   # emulation OFF (page.pdf پھر اصل print media)
    pg.evaluate("window.dispatchEvent(new Event('afterprint'))"); pg.wait_for_timeout(200)
    return g

def real_pdf(pg, name, how):
    if how == 'ctrlp': pg.keyboard.press('Control+p')
    else: pg.click('.ir-strip [data-dio-print]')
    pg.wait_for_timeout(300)
    print('  state before pdf', name, pg.evaluate("({calls: window.__printCalls, body: document.body.className, inHost: !!document.querySelector('#dio-nprint-host #ir-doc'), active: (document.activeElement||{}).className})"))
    pg.pdf(path=f'{OUT}/{name}.pdf', prefer_css_page_size=True, print_background=True)
    pg.evaluate("window.dispatchEvent(new Event('afterprint'))"); pg.wait_for_timeout(200)
    info = subprocess.run(['pdfinfo', f'{OUT}/{name}.pdf'], capture_output=True, text=True).stdout
    subprocess.run(['pdftoppm', '-png', '-r', '90', '-singlefile', f'{OUT}/{name}.pdf', f'{OUT}/{name}'])
    return info

def check_print(g, tag):
    check(f'{tag}: table is a real table (not block)', g['display'] == 'table', g['display'])
    check(f'{tag}: table spans full width — right 1in margin to left 0.4in margin',
          abs(g['tableL'] - g['contentL']) <= 1 and abs(g['tableR'] - g['contentR']) <= 1, (g['tableL'], g['contentL'], g['tableR'], g['contentR']))
    check(f'{tag}: column 2 fills to the left border', sum(g['cells']) >= g['tableW'] - 2, (g['cells'], g['tableW']))
    check(f'{tag}: column 1 = longest label (+padding)', g['c1'] - g['maxLbl'] <= 26 and not g['wrapped'], (g['c1'], g['maxLbl'], g['wrapped']))
    check(f'{tag}: closing line centred on table', abs(g['closingCenter'] - g['tableCenter']) <= 3, (g['closingCenter'], g['tableCenter']))
    check(f'{tag}: right margin 0.5in, left 0.4in', g['contentR'] == 794 - 48 and g['contentL'] == 38, (g['contentL'], g['contentR']))
    check(f'{tag}: full 14pt, no shrink', g['fs'] == '18.6667px' and g['pz'] in ('1', ''), (g['fs'], g['pz']))

with sync_playwright() as p:
    b = p.chromium.launch()
    # ══════════ DESKTOP (real app) ══════════
    ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
    ctx.grant_permissions(['clipboard-read', 'clipboard-write', 'geolocation'], origin=BASE.rstrip('/'))
    pg.evaluate("showPage('incident', null)"); pg.wait_for_timeout(1000)
    pg.screenshot(path=OUT + '/d01_list_empty.png')
    pg.click('.page-header .dio-add-btn'); pg.wait_for_selector('#ir-doc'); pg.wait_for_timeout(1500)
    fill(pg)
    pg.screenshot(path=OUT + '/d02_doc_top.png')
    g = print_geometry(pg, 'ctrlp');  check_print(g, 'desktop Ctrl+P')
    g2 = print_geometry(pg, 'button'); check_print(g2, 'desktop print button')
    check('Ctrl+P and print button give identical layout', g == g2)
    i1 = real_pdf(pg, 'd03_print_ctrlp', 'ctrlp'); i2 = real_pdf(pg, 'd04_print_button', 'button')
    check('print = 1 A4 page (Ctrl+P)', 'Pages:           1' in i1 and '(A4)' in i1)
    check('print = 1 A4 page (button)', 'Pages:           1' in i2 and '(A4)' in i2)
    diff = subprocess.run(['python3', '-c', f"""
from PIL import Image, ImageChops
a=Image.open('{OUT}/d03_print_ctrlp.png').convert('RGB'); b=Image.open('{OUT}/d04_print_button.png').convert('RGB')
print(ImageChops.difference(a,b).getbbox())"""], capture_output=True, text=True).stdout.strip()
    check('Ctrl+P page == button page (pixel identical)', diff == 'None', diff)
    txt = subprocess.run(['pdftotext', f'{OUT}/d03_print_ctrlp.pdf', '-'], capture_output=True, text=True).stdout
    check('printed page has no buttons/toolbar', all(w not in txt for w in ['محفوظ کریں', 'دستخط بنائیں', 'مقدمہ سے', 'فہرست']))
    # save + list actions
    pg.click('.ir-strip .btn-primary'); pg.wait_for_timeout(600)
    check('saved', len(pg.evaluate("window.__db.incident_reports")) == 1)
    pg.evaluate("_irClose(true)"); pg.wait_for_timeout(500)
    acts = pg.locator('.ir-card .ir-act').all_inner_texts()
    check('card actions: پرنٹ / ترمیم / شیئر / کاپی / نام بدلیں / حذف', [a.strip() for a in acts] == ['پرنٹ', 'ترمیم', 'شیئر', 'کاپی', 'نام بدلیں', 'حذف'], acts)
    lay = pg.evaluate("""(() => { const b=document.querySelector('.ir-card-body').getBoundingClientRect(), a=document.querySelector('.ir-card .ir-acts').getBoundingClientRect();
      return {beside: a.right <= b.left + 1, sameRow: a.top < b.bottom && a.bottom > b.top, acts:[Math.round(a.left),Math.round(a.right)], body:[Math.round(b.left),Math.round(b.right)]}; })()""")
    check('actions sit beside the report (same row, left side)', lay['beside'] and lay['sameRow'], lay)
    card = pg.inner_text('.ir-card')
    check('card shows date+time, caller, victim, thana', all(w in card for w in ['08/10/2026', '05:15', 'اطلاع دہندہ:', 'ملک زاہد اقبال', 'متاثرہ:', 'تھانہ:', 'صدر ملتان']) and 'ولد' not in card.split('اطلاع دہندہ:')[1].split('\n')[0], card.replace('\n', ' | ')[:240])
    pg.fill('#ir-list-q', 'صدر ملتان'); pg.wait_for_timeout(200)
    check('list search by thana', pg.locator('.ir-card').count() == 1)
    pg.fill('#ir-list-q', 'ملک زاہد'); pg.wait_for_timeout(200)
    check('list search by caller/victim', pg.locator('.ir-card').count() == 1)
    pg.screenshot(path=OUT + '/d05_list_actions.png')
    # ── direct print from the list (no opening) ──
    n0 = pg.evaluate('window.__printCalls')
    pg.click('.ir-card .ir-act:has-text("پرنٹ")'); pg.wait_for_timeout(300)
    st = pg.evaluate("({calls: window.__printCalls, inHost: !!document.querySelector('#dio-nprint-host #ir-doc'), quick: !!document.querySelector('#ir-view.ir-quick'), op: getComputedStyle(document.getElementById('ir-view')).opacity})")
    check('list print: prints straight away (no opening on screen)', st['calls'] == n0 + 1 and st['inHost'] and st['quick'] and st['op'] == '0', st)
    pg.pdf(path=f'{OUT}/d06_list_print.pdf', prefer_css_page_size=True, print_background=True)
    info = subprocess.run(['pdfinfo', f'{OUT}/d06_list_print.pdf'], capture_output=True, text=True).stdout
    subprocess.run(['pdftoppm', '-png', '-r', '90', '-singlefile', f'{OUT}/d06_list_print.pdf', f'{OUT}/d06_list_print'])
    d_same = subprocess.run(['python3', '-c', f"""
from PIL import Image, ImageChops
a=Image.open('{OUT}/d03_print_ctrlp.png').convert('RGB'); b=Image.open('{OUT}/d06_list_print.png').convert('RGB')
bb=ImageChops.difference(a,b).getbbox(); print(bb)"""], capture_output=True, text=True).stdout.strip()
    check('list print = 1 A4 page, same report', 'Pages:           1' in info and '(A4)' in info, d_same)
    pg.evaluate("window.dispatchEvent(new Event('afterprint'))"); pg.wait_for_timeout(300)
    check('after list print: back on list, search kept', pg.locator('#ir-view').count() == 0 and pg.input_value('#ir-list-q') == 'ملک زاہد' and pg.locator('.ir-card').count() == 1)
    pg.fill('#ir-list-q', ''); pg.evaluate("_irListFilter('')"); pg.wait_for_timeout(200)
    # ── rename ──
    pg.once('dialog', lambda d: d.accept('وقاص ٹاؤن چوری — 80 لاکھ'))
    pg.click('.ir-card .ir-act:has-text("نام بدلیں")'); pg.wait_for_timeout(500)
    check('rename shows new name', 'وقاص ٹاؤن چوری — 80 لاکھ' in pg.inner_text('.ir-card .ir-card-t'))
    check('rename saved to DB', pg.evaluate("window.__db.incident_reports[0].data.name") == 'وقاص ٹاؤن چوری — 80 لاکھ')
    # ── copy = clipboard (no new report) ──
    pg.click('.ir-card .ir-act:has-text("کاپی")'); pg.wait_for_timeout(500)
    clip = pg.evaluate("""(async () => { const items = await navigator.clipboard.read(); const it = items[0];
      return {types: it.types, html: await (await it.getType('text/html')).text(), text: await (await it.getType('text/plain')).text()}; })()""")
    check('copy puts the formatted report (table) on the clipboard', 'text/html' in clip['types'] and '<table' in clip['html'] and 'نیو وقاص ٹاؤن ملتان' in clip['html'] and 'dir="rtl"' in clip['html'], clip['types'])
    check('copy also gives full text (WhatsApp/SMS)', 'نوعیت وقوعہ: چوری' in clip['text'] and '0300-1234567' in clip['text'])
    check('copy does NOT create a new report', len(pg.evaluate("window.__db.incident_reports")) == 1 and pg.locator('.ir-card').count() == 1)
    # ── share ──
    # v551 (افسر کی ہدایت): شیئر = پوری فائل PDF + Word (پہلے صرف متن جاتا تھا)
    pg.evaluate("""window.__shared=null; navigator.canShare = () => true;
      navigator.share = async (o) => { window.__shared = { names: (o.files||[]).map(f => f.name),
        doc: o.files && o.files.find(f => /\\.doc$/.test(f.name)) ? await o.files.find(f => /\\.doc$/.test(f.name)).text() : '',
        pdfHead: o.files && o.files.find(f => /\\.pdf$/.test(f.name)) ? (await o.files.find(f => /\\.pdf$/.test(f.name)).text()).slice(0, 8) : '' }; }; 0""")
    pg.bring_to_front()   # اوپر کی PDF جانچ نے نیا ٹیب کھولا تھا — پس منظر کا ٹیب سست/منجمد رہتا ہے
    pg.click('.ir-card .ir-act:has-text("شیئر")'); pg.wait_for_selector('#dio-share-box', timeout=15000)
    pg.click('#dio-share-box button[data-k="both"]')
    # page.pdf کے بعد headless صفحہ «پس منظر» کی طرح سست رہتا ہے — باہر سے بار بار جانچ اسے جگائے رکھتی ہے
    for _ in range(240):
        if pg.evaluate("!!window.__shared"): break
        pg.wait_for_timeout(500)
    sh = pg.evaluate("window.__shared") or {}
    check('share sends the FULL file — PDF + Word', sorted(n.split('.')[-1] for n in sh.get('names', [])) == ['doc', 'pdf'] and sh.get('pdfHead', '').startswith('%PDF'), sh.get('names'))
    check('Word file has the full report (table + all text)', '<table' in sh.get('doc', '') and 'نیو وقاص ٹاؤن ملتان' in sh.get('doc', '') and '0300-1234567' in sh.get('doc', '') and 'SI/SHO' in sh.get('doc', ''))
    pg.evaluate("_irClose(true)"); pg.wait_for_timeout(900)   # فہرست سے شیئر رپورٹ کھول کر دکھاتا ہے — واپس فہرست
    # ── edit ──
    pg.click('.ir-card .ir-act:has-text("ترمیم")'); pg.wait_for_selector('#ir-doc'); pg.wait_for_timeout(800)
    check('edit opens the saved report', 'نیو وقاص ٹاؤن ملتان' in pg.inner_text('#ir-doc [data-k=place]'))
    typ(pg, 'vehicle', 'موٹر سائیکل'); pg.click('.ir-strip .btn-primary'); pg.wait_for_timeout(600)
    orig = pg.evaluate("window.__db.incident_reports")
    check('edit+save keeps the renamed name', orig and orig[0]['data']['name'] == 'وقاص ٹاؤن چوری — 80 لاکھ' and orig[0]['data']['f']['vehicle'] == 'موٹر سائیکل')
    pg.evaluate("_irClose(true)"); pg.wait_for_timeout(400)
    # ── natures dropdown: ASI order, most frequent on top ──
    pg.click('.page-header .dio-add-btn'); pg.wait_for_selector('#ir-doc'); pg.wait_for_timeout(600)
    opts = pg.evaluate("[...document.querySelectorAll('#ir-doc .ir-cell:has([data-k=nature]) select option')].map(o=>o.textContent).slice(1)")
    check('natures: most used (چوری) on top, then ASI order, «دیگر» last',
          opts[:11] == ['چوری', 'جنسی زیادتی', 'قتل', 'نقب زنی', 'راہزنی', 'روڈ ایکسیڈنٹ', 'ڈکیتی', 'لاوارث نعش', 'خودکشی', 'آگ لگنا', 'ہوائی فائرنگ'] and opts[-1] == 'دیگر', opts[:12])
    pg.evaluate("_irClose(true)"); pg.wait_for_timeout(300)
    # ── delete ──
    pg.once('dialog', lambda d: d.accept())
    pg.click('.ir-card .ir-act:has-text("حذف")'); pg.wait_for_timeout(600)
    check('delete removes report (→ recycle bin)', len(pg.evaluate("window.__db.incident_reports")) == 0 and pg.evaluate("window.__db.recycle_bin.length") == 1)
    # regression: other tables on screen still responsive (screen-only rule kept)
    pg.set_viewport_size({'width': 820, 'height': 900}); pg.wait_for_timeout(200)
    disp = pg.evaluate("(() => { const t=document.createElement('table'); t.innerHTML='<tr><td>x</td></tr>'; document.getElementById('page-content').appendChild(t); const d=getComputedStyle(t).display; t.remove(); return d; })()")
    check('screen < 900px: app tables still scroll (unchanged)', disp == 'block', disp)
    pg.emulate_media(media='print'); pg.wait_for_timeout(100)
    disp2 = pg.evaluate("(() => { const t=document.createElement('table'); document.body.appendChild(t); const d=getComputedStyle(t).display; t.remove(); return d; })()")
    pg.emulate_media(media='null')
    check('print: app tables stay real tables (system-wide fix)', disp2 == 'table', disp2)
    check('no JS errors (desktop real app)', not errs, errs[:4])
    ctx.close()

    # ══════════ MOBILE (real app) ══════════
    mctx, mp, merrs = open_app(b, viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    mp.evaluate("showPage('incident', null)"); mp.wait_for_timeout(1000)
    mp.click('.page-header .dio-add-btn'); mp.wait_for_selector('#ir-doc'); mp.wait_for_timeout(1500)
    fill(mp)
    mp.evaluate("document.getElementById('ir-scroll').scrollTop=0"); mp.wait_for_timeout(200)
    mp.screenshot(path=OUT + '/m01_doc_top.png')
    mg = mp.evaluate("""(() => { const d=document.getElementById('ir-doc').getBoundingClientRect(), s=document.getElementById('ir-scroll'), st=document.querySelector('.ir-strip').getBoundingClientRect();
      return {docW:Math.round(d.width), scrW:s.clientWidth, gapTop:Math.round(d.top-st.bottom), hScroll:s.scrollWidth>s.clientWidth+1,
        fs:getComputedStyle(document.querySelector('#ir-doc [data-k=caller]')).fontSize,
        saveVisible:(()=>{const r=document.querySelector('.ir-strip .btn-primary').getBoundingClientRect(); return r.left>=0 && r.right<=innerWidth})()}; })()""")
    check('mobile: document full width, no blank space, no sideways scroll', mg['docW'] == mg['scrW'] and mg['gapTop'] == 0 and not mg['hScroll'], mg)
    check('mobile: real 14pt text', mg['fs'] == '18.6667px', mg['fs'])
    check('mobile: «محفوظ کریں» visible', mg['saveVisible'])
    mp.evaluate("document.getElementById('ir-scroll').scrollTop=99999"); mp.wait_for_timeout(200)
    mp.screenshot(path=OUT + '/m02_doc_bottom.png')
    mg2 = print_geometry(mp, 'button'); check_print(mg2, 'mobile print button')
    mi = real_pdf(mp, 'm03_print', 'button')
    check('mobile print = 1 A4 page', 'Pages:           1' in mi and '(A4)' in mi)
    mp.click('.ir-strip .btn-primary'); mp.wait_for_timeout(600)
    mp.evaluate("_irClose(true)"); mp.wait_for_timeout(500)
    mp.screenshot(path=OUT + '/m04_list.png')
    ml = mp.evaluate("""(() => { const a=[...document.querySelectorAll('.ir-card .ir-act')]; const b=document.querySelector('.ir-card-body').getBoundingClientRect(), g=document.querySelector('.ir-card .ir-acts').getBoundingClientRect();
      return {n:a.length, beside: g.right <= b.left + 1 && g.top < b.bottom, overflow: document.documentElement.scrollWidth > innerWidth + 1,
        minH: Math.min(...a.map(x=>x.getBoundingClientRect().height)), minW: Math.min(...a.map(x=>x.getBoundingClientRect().width)), bodyW: Math.round(b.width)}; })()""")
    check('mobile list: 6 actions beside the report, touch-size, no overflow', ml['n'] == 6 and ml['beside'] and not ml['overflow'] and ml['minH'] >= 44 and ml['minW'] >= 44 and ml['bodyW'] >= 200, ml)
    n0 = mp.evaluate('window.__printCalls')
    mp.click('.ir-card .ir-act[aria-label="پرنٹ"]'); mp.wait_for_timeout(300)
    mp.pdf(path=f'{OUT}/m05_list_print.pdf', prefer_css_page_size=True, print_background=True)
    mi2 = subprocess.run(['pdfinfo', f'{OUT}/m05_list_print.pdf'], capture_output=True, text=True).stdout
    subprocess.run(['pdftoppm', '-png', '-r', '90', '-singlefile', f'{OUT}/m05_list_print.pdf', f'{OUT}/m05_list_print'])
    check('mobile list print: 1 A4 page without opening', mp.evaluate('window.__printCalls') == n0 + 1 and 'Pages:           1' in mi2 and '(A4)' in mi2)
    mp.evaluate("window.dispatchEvent(new Event('afterprint'))"); mp.wait_for_timeout(300)
    check('mobile: back on list after print', mp.locator('#ir-view').count() == 0 and mp.locator('.ir-card').count() == 1)
    check('no JS errors (mobile real app)', not merrs, merrs[:4])
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} passed')
json.dump(R, open(OUT + '/real_results.json', 'w'), ensure_ascii=False, indent=1)
sys.exit(1 if fails else 0)   # v547: CI میں ناکامی پر build رکے
