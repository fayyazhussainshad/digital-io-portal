"""(v566) TASK 6 — بیرونی ضمنی: نمبر، تاریخ، ایک افسر ایک تاریخ، سینئر افسر کی ضمنی، ملزمان ▾، 161 کا نمبر، کراس ورژن
اصل ایپ کی جانچ (Desktop 1366×768 + Mobile 390×844)؛ صرف Supabase کی جگہ آزمائشی ڈیٹا۔

افسر کی ہدایت (3 نومبر 2026) اور جواب (4 نومبر: 1a، 2a، 3a، 4a، 5a):
  A) «ضمنی نمبر» کے خانے میں جو لکھا وہی نمبر (1، 01، 001، 1-الف، 02-ب) — فہرست، انڈیکس، پرنٹ، تلاش ہر جگہ
  B) ضمنی کی تاریخ = کالم 1 کی لکھی تاریخ (آلے کی محفوظ کرنے کی تاریخ کبھی نہیں)
  C) ایک افسر ایک مقدمے میں ایک تاریخ کی ایک ضمنی؛ سینئر افسر اسی تاریخ پر: 3-الف، پھر 3-ب (1a: «لکھنے والا» کا انتخاب،
     2a: «مرتبہ» اور دستخط میں سینئر کا نام مقرر، 3a: اُس تاریخ پر تفتیشی افسر کی ضمنی نہ ہو تو اگلا سادہ نمبر)
  D) ملزمان ▾: کچھ خود نہیں لگتا؛ چننا / ہٹانا بار بار؛ محفوظ → دوبارہ کھولیں = جوں کا توں
  E) کالم 1 میں «161 ض ف» کے نیچے مسلسل نمبر (4a: محفوظ ہوتے ہی پکا، 5a: کاغذ پر بھی)
  F) کراس ورژن والے مقدمے میں کالم 3: FIR کا مدعی/بنام، «کراس ورژن»، کراس کا مدعی/بنام — الگ الگ ▾
  + regression: کالم 2 دستی نمبر، کالم 1 ↔ دستخط کی تاریخ، Ctrl+P = «پرنٹ» بٹن (pixel تک)
چلانا: `python3 v566_test.py` — ایک ہی: DIO_ONLY=desktop|mobile
"""
from v564_common import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v566/'
os.makedirs(V, exist_ok=True)
TOASTS = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"""
LAST_TOAST = "(window.__toasts || []).slice(-1)[0] || ''"
ACC = """(() => { const d = window.__db;
  d.case_accused = [
    { id:'a1', case_id:'c1', name:'محمد شفیق ولد رفیق', accused_type:'fir', created_at:'2026-10-08T01:00:00Z' },
    { id:'a2', case_id:'c1', name:'غلام عباس ولد اللہ دتہ', accused_type:'fir', created_at:'2026-10-08T02:00:00Z' },
    { id:'a3', case_id:'c1', name:'ناصر محمود ولد بشیر', accused_type:'cross_version', created_at:'2026-10-08T03:00:00Z' },
    { id:'a4', case_id:'c1', name:'طارق جمیل ولد نذیر', accused_type:'cross_version', created_at:'2026-10-08T04:00:00Z' } ];
  const c1 = d.cases.find(c => c.id === 'c1');
  c1.cross_complainant = 'محمد اکرم ولد غلام قادر قوم جٹ سکنہ چک 5 فیض ملتان'; c1.is_cross_version = true;
  d.cases = d.cases.filter(c => c.id !== 'c2');
  d.cases.push({ id:'c2', officer_id:'o1', fir_number:'700/26', section_of_law:'380 ت پ', status:'under', complainant:'رشید احمد ولد فضل دین',
    occurrence_date:'2026-10-20', created_at:'2026-10-20T00:00:00Z' });
  d.case_accused.push({ id:'b1', case_id:'c2', name:'اکیلا ملزم ولد فلاں', accused_type:'fir', created_at:'2026-10-20' });
  return Promise.all(d.cases.map(c => offlineStore.cache('cases_cache', JSON.parse(JSON.stringify(c))))).then(() => 0); })()"""
BANAM = "(k) => Array.from(_zimniDoc().querySelectorAll('[data-k=\"' + k + '\"] .zf-acc .nm')).map(n => n.textContent.trim())"
LIST_ROWS = "() => Array.from(document.querySelectorAll('.zt tbody tr[data-zid]')).map(tr => [tr.querySelector('td.num').innerText.trim(), tr.querySelector('td.dtc').innerText.trim(), tr.cells[2].innerText.trim()])"


def to_list(pg):
    pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1300)


def new_zimni(pg):
    pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2300)


def type_c1(pg, txt, block=0):
    """افسر کی طرح: کالم 1 میں کرسر رکھ کر لکھنا (پرانا متن چن کر اس کی جگہ)"""
    pg.evaluate("""([t, i]) => { const a = _zimniDoc().querySelectorAll('tr.zf-blk .zf-actbody')[i]; a.focus();
      const r = document.createRange(); r.selectNodeContents(a); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      document.execCommand('insertText', false, t); return 0; }""", [txt, block])
    pg.wait_for_timeout(600)


def set_zno(pg, txt):
    pg.evaluate("""(t) => { const z = _zimniDoc().querySelector('[data-k="zno"]'); z.focus();
      const r = document.createRange(); r.selectNodeContents(z); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      document.execCommand('insertText', false, t); return 0; }""", txt)
    pg.wait_for_timeout(300)


def save(pg):
    """«💾 محفوظ» بٹن (ضمنی کھلی رہتی ہے) — نتیجہ: محفوظ ہوئی؟ + آخری پیغام"""
    n0 = pg.evaluate("(window.__toasts||[]).length")
    pg.evaluate("window.__saveRes = undefined; _saveZimni(false, true).then(r => { window.__saveRes = r; }); 0")
    for _ in range(60):
        if pg.evaluate("window.__saveRes !== undefined"): break
        pg.wait_for_timeout(100)
    pg.wait_for_timeout(500)
    msgs = pg.evaluate(f"(window.__toasts||[]).slice({n0})")
    return pg.evaluate("window.__saveRes"), (msgs[-1] if msgs else '')


def add_block(pg):
    pg.evaluate("_zimniAddBlock(); 0"); pg.wait_for_timeout(300)


def body_of(html):
    """چھپائی کا اصل کاغذ (CSS / اسکرپٹ کے بغیر) — صرف دستاویز کا متن"""
    m = re.search(r'<div id="ch173-doc"[^>]*>([\s\S]*)', html or '')
    t = m.group(1) if m else (html or '')
    return re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', '', t)


def snap_html(pg, how, paper='legal'):
    asked, html = capture(pg, how, paper)
    return html


def run(desktop):
    tag = 'desktop' if desktop else 'mobile'
    with sync_playwright() as p:
        b = p.chromium.launch()
        vp = {'width': 1366, 'height': 768} if desktop else {'width': 390, 'height': 844}
        extra = {} if desktop else {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
        ctx, pg, errs = open_app(b, viewport=vp, **extra)
        pg.evaluate("window.confirm = () => true; 0")
        pg.evaluate(TOASTS)
        if not desktop:      # موبائل: «کاغذ» منظر بھی جانچا جاتا ہے؛ شروع «فارم» (افسر کا عام)
            pg.evaluate("localStorage.setItem('dio_doc_view', 'form'); 0")
        # افسر کا اصل راستہ: مقدمہ → «ضمنیات» → «+ ضمنی درج کریں» (مقدمے میں FIR + کراس ورژن کے ملزمان)
        pg.evaluate(SEED); pg.evaluate(ACC)
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1500)
        new_zimni(pg)

        # ═══ D) نئی ضمنی: کچھ خود نہیں لگتا ═══
        check(f'{tag} D: نئی ضمنی — «بنام» خالی (مقدمے میں 2 FIR + 2 کراس ملزم، کوئی خود نہیں لگا)',
              pg.evaluate(BANAM, 'banam') == [] and pg.evaluate(BANAM, 'banam_x') == [], [pg.evaluate(BANAM, 'banam'), pg.evaluate(BANAM, 'banam_x')])
        # ═══ F) کراس ورژن — کالم 3 کی ترتیب ═══
        order = pg.evaluate("""() => { const c = _zimniDoc().querySelector('tr.zf-prerow td.zf-c-body');
            return [...c.querySelectorAll('.zf-bl')].map(b => b.getAttribute('data-k') || (b.querySelector('[data-k]') || {}).getAttribute && b.querySelector('[data-k]').getAttribute('data-k')); }""")
        check(f'{tag} F: کالم 3 — سرکار، بنام، «کراس ورژن»، سرکار (کراس)، بنام (کراس)، پھر مرتبہ',
              order == ['sarkar', 'banam', 'xv_head', 'sarkar_x', 'banam_x', 'murattib'], order)
        check(f'{tag} F: کراس ورژن کا مدعی — مقدمے کا «کراس ورژن مدعی» (FIR کے مدعی کی طرح نام، ولدیت، قوم، سکنہ)',
              pg.evaluate("_zimniDoc().querySelector('[data-k=sarkar_x]').textContent.trim()") == 'محمد اکرم ولد غلام قادر قوم جٹ سکنہ چک 5 فیض ملتان'
              and 'محمد امجد حسین' in pg.evaluate("_zimniDoc().querySelector('[data-k=sarkar]').textContent"))
        picks = pg.evaluate("[...(_zimniDoc().querySelectorAll('.zf-pick'))].map(b => b.dataset.which)")
        check(f'{tag} F: دو الگ ▾ (FIR / کراس ورژن)', picks == ['fir', 'cross'], picks)
        # ▾ اپنی «بنام» سطر کی سیدھ میں (کاغذ منظر میں)
        if desktop:
            al = pg.evaluate("""() => ['banam', 'banam_x'].map((k, i) => { const l = _zimniDoc().querySelector('[data-k="' + k + '"]').closest('.zf-bl').getBoundingClientRect();
                const b = _zimniDoc().querySelectorAll('.zf-pick')[i].getBoundingClientRect(); return Math.round((b.top + b.height / 2) - (l.top + Math.min(l.height, 28) / 2)); })""")
            check(f'{tag} D: ▾ اپنی «بنام» سطر کے برابر (فرق px)', all(abs(x) <= 6 for x in al), al)
        pg.screenshot(path=V + f'{tag}_01_new_cross.png')

        # ═══ D) چننا / ہٹانا — اصل کلک، بار بار ═══
        pg.click('#ch173-doc .zf-pick[data-which=fir]'); pg.wait_for_timeout(500)
        menu = pg.evaluate("[...document.querySelectorAll('#zf-acc-menu label')].map(l => l.textContent.trim())")
        acc_fir = pg.evaluate("_zimniAccOf('fir').map(a => a.name)")
        check(f'{tag} F: FIR کے ▾ میں صرف FIR کے ملزمان (کراس نہیں)', sorted(menu) == sorted(['محمد شفیق ولد رفیق', 'غلام عباس ولد اللہ دتہ']), menu)
        boxes = pg.locator('#zf-acc-menu input[type=checkbox]')
        boxes.nth(0).click(); pg.wait_for_timeout(250)
        s1 = pg.evaluate(BANAM, 'banam')
        boxes.nth(1).click(); pg.wait_for_timeout(250)
        s2 = pg.evaluate(BANAM, 'banam')
        boxes.nth(0).click(); pg.wait_for_timeout(250)
        s3 = pg.evaluate(BANAM, 'banam')
        boxes.nth(0).click(); pg.wait_for_timeout(250)
        s4 = pg.evaluate(BANAM, 'banam')
        check(f'{tag} D: نشان لگاتے ہی نام آیا (اکیلا ہو تو «1۔» نہیں)', s1 == [acc_fir[0]], s1)
        check(f'{tag} D: دوسرا نشان — دونوں، 1۔ 2۔ (مقدمے کی ترتیب سے)', s2 == ['1۔ ' + acc_fir[0], '2۔ ' + acc_fir[1]], s2)
        check(f'{tag} D: پہلا ہٹایا — صرف دوسرا (بغیر نمبر)', s3 == [acc_fir[1]], s3)
        check(f'{tag} D: دوبارہ لگایا — پھر دونوں (▾ ہر بار کام کرتا ہے)', s4 == s2, s4)
        check(f'{tag} D: مینو کھلا رہتا ہے (بار بار چنیں)', pg.evaluate("!!document.getElementById('zf-acc-menu')"))
        pg.screenshot(path=V + f'{tag}_02_picker.png')
        pg.click('#zf-acc-x'); pg.wait_for_timeout(300)
        pg.click('#ch173-doc .zf-pick[data-which=cross]'); pg.wait_for_timeout(500)
        xmenu = pg.evaluate("[...document.querySelectorAll('#zf-acc-menu label')].map(l => l.textContent.trim())")
        check(f'{tag} F: کراس کے ▾ میں صرف کراس ورژن کے ملزمان', sorted(xmenu) == sorted(['ناصر محمود ولد بشیر', 'طارق جمیل ولد نذیر']), xmenu)
        pg.locator('#zf-acc-menu input[type=checkbox]').nth(0).click(); pg.wait_for_timeout(250)
        pg.mouse.click(8, vp['height'] - 8); pg.wait_for_timeout(300)
        xb = pg.evaluate(BANAM, 'banam_x')
        check(f'{tag} F: کراس «بنام» میں کراس ملزم، FIR «بنام» میں کوئی کراس ملزم نہیں (ملے جلے نہیں)',
              len(xb) == 1 and xb[0] in xmenu and not any(n.split('۔ ')[-1] in xmenu for n in pg.evaluate(BANAM, 'banam')), [xb, pg.evaluate(BANAM, 'banam')])
        check(f'{tag} D: باہر کلک سے مینو بند', pg.evaluate("!document.getElementById('zf-acc-menu')"))

        # ═══ A + B + E) نمبر 2-الف، کالم 1 کی تاریخ، 161 ═══
        banam_before = pg.evaluate(BANAM, 'banam'); banamx_before = pg.evaluate(BANAM, 'banam_x')
        type_c1(pg, '29/10/2026 بوقت 10:00 بیان 161 ض ف')
        add_block(pg); type_c1(pg, 'بوقت 11:00 بیانات 161 ض ف', 1)
        add_block(pg); type_c1(pg, 'بوقت 12:00 161ض۔ف', 2)
        add_block(pg); type_c1(pg, 'بوقت 13:00 بیان ۱۶۱ ض ف', 3)
        m161 = pg.evaluate("[...(_zimniDoc().querySelectorAll('.zf-161n'))].map(m => m.textContent)")
        check(f'{tag} E: 4 بیان (161 ض ف، 161ض۔ف، ۱۶۱ ض ف) → (1)…(4) ہر ایک کے نیچے', m161 == ['(1)', '(2)', '(3)', '(4)'], m161)
        under = pg.evaluate("""() => { const a = _zimniDoc().querySelector('tr.zf-blk .zf-actbody'); const m = a.querySelector('.zf-161n');
            const r = document.createRange(); r.selectNodeContents(a); r.setEndBefore(m); const t = r.getBoundingClientRect(); const mm = m.getBoundingClientRect();
            return [Math.round(mm.top - t.bottom), m.previousSibling ? 1 : 0]; }""")
        check(f'{tag} E: نمبر «161 ض ف» کی سطر کے نیچے (اسی خانے میں، اگلی سطر)', -4 <= under[0] <= 12, under)
        set_zno(pg, '2 الف')
        res, msg = save(pg)
        rec = pg.evaluate("(() => { const z = _zimniList.find(x => (x.content||{}).zno === '2-الف'); return z ? { sn: z.serial_no, zno: z.content.zno, rd: z.report_date, au: z.content.author, pick: /zf-pick|\\u25BE/.test(z.content.bodyHtml) } : null; })()")
        check(f'{tag} A: «2 الف» لکھا → «2-الف» محفوظ (بنیادی نمبر 2)', res is True and rec and rec['zno'] == '2-الف' and rec['sn'] == 2, [res, msg, rec])
        check(f'{tag} A: خانے میں بھی «2-الف»', pg.evaluate("_zimniDoc().querySelector('[data-k=zno]').textContent") == '2-الف')
        check(f'{tag} B: تاریخ = کالم 1 کی (2026-10-29) — آج (آلے کی) تاریخ نہیں', rec and rec['rd'] == '2026-10-29', rec)
        check(f'{tag} D: محفوظ HTML میں ▾ نہیں (صرف اسکرین کا اوزار)', rec and not rec['pick'], rec)
        check(f'{tag} A: پیغام میں «2-الف»', '2-الف' in msg, msg)
        zw = pg.evaluate("""() => { const z = _zimniDoc().querySelector('[data-k=zno]'); const s = document.createElement('span');
            s.style.font = getComputedStyle(z).font; s.style.position = 'absolute'; s.style.whiteSpace = 'nowrap'; s.textContent = '003-الف';
            document.body.appendChild(s); const w = s.getBoundingClientRect().width; s.remove();
            const sc = _zimniDoc().getBoundingClientRect().width / (_zimniDoc().offsetWidth || 1);
            return [Math.round(z.getBoundingClientRect().width / sc), Math.round(w)]; }""")
        check(f'{tag} A: خانہ 3 ہندسوں + لاحقے (003-الف) جتنا چوڑا', zw[0] >= zw[1], zw)
        pg.screenshot(path=V + f'{tag}_03_saved_2alif.png')
        Z1 = pg.evaluate("_zimniList.find(x => (x.content||{}).zno === '2-الف').id")

        # ═══ D) محفوظ → دوبارہ کھولیں = جوں کا توں ═══
        to_list(pg)
        rows = pg.evaluate(LIST_ROWS)
        check(f'{tag} A+B: فہرست — «2-الف» اور 29/10/2026 (آلے کی آج کی تاریخ نہیں)', rows and rows[0][0] == '2-الف' and rows[0][1] == '29/10/2026', rows)
        check(f'{tag} B: فہرست میں محفوظ کرنے کا وقت (آلے کا) نہیں', not any(re.search(r'\d{1,2}:\d{2}\s*(am|pm)', ' '.join(r)) for r in rows), rows)
        pg.evaluate(f"_openZimni('{Z1}')"); pg.wait_for_timeout(2500)
        check(f'{tag} D: دوبارہ کھولا — «بنام» وہی (کچھ دوبارہ نہیں لگا)', pg.evaluate(BANAM, 'banam') == banam_before and pg.evaluate(BANAM, 'banam_x') == banamx_before,
              [pg.evaluate(BANAM, 'banam'), banam_before])
        check(f'{tag} D: کھولنے سے کوئی تبدیلی نہیں (غیر محفوظ نشان نہیں)', pg.evaluate("_zimniDirty") is False)
        check(f'{tag} E: کھولنے پر 161 کے نمبر وہی (1–4)', pg.evaluate("[...(_zimniDoc().querySelectorAll('.zf-161n'))].map(m => m.textContent)") == ['(1)', '(2)', '(3)', '(4)'])
        check(f'{tag} D: ▾ دوبارہ کھولنے کے بعد بھی موجود (FIR + کراس)، کالم 2 میں کوئی بچا «▾» متن نہیں',
              pg.evaluate("_zimniDoc().querySelectorAll('.zf-pick').length") == 2 and not pg.evaluate("/\\u25BE/.test([...(_zimniDoc().querySelector('tr.zf-prerow td.zf-c-serial').childNodes)].filter(n => n.nodeType === 3).map(n => n.nodeValue).join(''))"))
        pg.click('#ch173-doc .zf-pick[data-which=fir]'); pg.wait_for_timeout(500)
        ok_menu = pg.evaluate("!!document.getElementById('zf-acc-menu')")
        st = pg.evaluate("[...document.querySelectorAll('#zf-acc-menu input')].map(i => i.checked)")
        check(f'{tag} D: دوبارہ کھولنے کے بعد ▾ کام کرتا ہے — چنے ہوئے نشان کے ساتھ', ok_menu and st == [True, True], [ok_menu, st])
        # تمام ہٹا کر محفوظ → دوبارہ کھولیں → خالی ہی
        boxes = pg.locator('#zf-acc-menu input[type=checkbox]')
        boxes.nth(0).click(); pg.wait_for_timeout(200); boxes.nth(1).click(); pg.wait_for_timeout(200)
        pg.click('#zf-acc-x'); pg.wait_for_timeout(200)
        check(f'{tag} D: سب ہٹا دیے — «بنام» خالی', pg.evaluate(BANAM, 'banam') == [])
        res, msg = save(pg)
        to_list(pg); pg.evaluate(f"_openZimni('{Z1}')"); pg.wait_for_timeout(2500)
        check(f'{tag} D: خالی «بنام» محفوظ → دوبارہ کھولیں → خالی ہی (نام واپس نہیں آئے)', res is True and pg.evaluate(BANAM, 'banam') == [], [res, pg.evaluate(BANAM, 'banam')])

        # ═══ PRINT — Ctrl+P = «پرنٹ» بٹن؛ نمبر، 161، ▾ نہیں ═══
        if not desktop:
            pg.evaluate("localStorage.setItem('dio_doc_view', 'paper'); document.querySelector('.dio-mbar [data-m=paper]') && document.querySelector('.dio-mbar [data-m=paper]').click(); 0")
            pg.wait_for_timeout(800)
        hb_full = snap_html(pg, 'button')
        pdf_b = html_pdf(b, hb_full, V + f'{tag}_print_button.pdf')
        hb = body_of(hb_full)
        txt_ok = ('data-k="zno"' in hb) and re.search(r'data-k="zno"[^>]*>2-الف<', hb) is not None
        check(f'{tag} A: پرنٹ (بٹن) — «ضمنی نمبر 2-الف»', txt_ok, re.findall(r'data-k="zno"[^>]*>[^<]*<', hb)[:2])
        check(f'{tag} E: پرنٹ میں 161 کے نمبر (1)…(4) (5a: کاغذ پر بھی)', re.findall(r'class="zf-161n"[^>]*>\((\d+)\)<', hb) == ['1', '2', '3', '4'], re.findall(r'zf-161n[^>]*>[^<]*<', hb)[:5])
        check(f'{tag} D: پرنٹ میں ▾ نہیں', '▾' not in hb and 'zf-pick' not in hb)
        check(f'{tag} A: کاغذ پر نمبر کا خانہ (فریم) نہیں — صرف ایڈیٹر میں', 'zf-editor' not in re.search(r'<div id="ch173-doc"[^>]*>', hb_full).group(0))
        if desktop:
            hc = snap_html(pg, 'ctrlp')
            pdf_c = html_pdf(b, hc, V + f'{tag}_print_ctrlp.pdf')
            same, diffs = same_pages(pages_png(pdf_b, V + f'{tag}_pb'), pages_png(pdf_c, V + f'{tag}_pc'))
            check(f'{tag} PRINT: Ctrl+P = «پرنٹ» بٹن (ہر صفحہ pixel تک)', same, diffs)
        n_pages, _sz = pdf_info(pdf_b)
        contact(pages_png(pdf_b, V + f'{tag}_print'), V + f'{tag}_04_print_pages.png')
        check(f'{tag} PRINT: کاغذ بنا (صفحات)', n_pages >= 1, n_pages)

        # ═══ C) ایک افسر ایک تاریخ — دوسری پر خبردار ═══
        to_list(pg); new_zimni(pg)
        n_before = pg.evaluate("_zimniList.length")
        type_c1(pg, '29/10/2026')
        res, msg = save(pg)
        check(f'{tag} C: تفتیشی افسر کی اسی تاریخ کی دوسری ضمنی — خبردار، محفوظ نہیں',
              res is False and 'ایک افسر ایک تاریخ' in msg and pg.evaluate("_zimniList.length") == n_before, msg)
        # B: کالم 1 میں تاریخ نہیں → محفوظ نہیں
        type_c1(pg, 'بوقت 10:00')
        res, msg = save(pg)
        check(f'{tag} B: کالم 1 میں تاریخ نہ ہو — خبردار، محفوظ نہیں (آلے کی تاریخ نہیں لگتی)', res is False and 'تاریخ' in msg and pg.evaluate("_zimniList.length") == n_before, msg)
        # تفتیشی افسر کی 30/10 کی ضمنی — نمبر 3 (تجویز کردہ)
        type_c1(pg, '30/10/2026')
        zno3 = pg.evaluate("_zimniDoc().querySelector('[data-k=zno]').textContent")
        res, msg = save(pg)
        check(f'{tag} C: تفتیشی افسر، دوسری تاریخ (30/10) — اگلا نمبر 3 محفوظ', res is True and zno3 == '3', [zno3, msg])

        # ═══ C) سینئر افسر — اسی تاریخ پر 3-الف، پھر 3-ب ═══
        to_list(pg); new_zimni(pg)
        type_c1(pg, '30/10/2026')
        pg.select_option('#zf-author', 'sho'); pg.wait_for_timeout(600)
        zs = pg.evaluate("_zimniDoc().querySelector('[data-k=zno]').textContent")
        lines = pg.evaluate("[...(_zimniDoc().querySelectorAll('[data-k=murattib],[data-k=io_sign]'))].map(x => x.textContent.trim())")
        check(f'{tag} C: «لکھنے والا: SHO» — اسی تاریخ پر نمبر 3-الف خود', zs == '3-الف', zs)
        check(f'{tag} C (2a): «مرتبہ» اور دستخط میں SHO کا نام + عہدہ (ترتیبات سے)', lines == ['ندیم عباس شاد SI/SHO تھانہ صدر ملتان'] * 2, lines)
        locked = pg.evaluate("[...(_zimniDoc().querySelectorAll('[data-k=murattib] .zf-ioname,[data-k=io_sign] .zf-ioname'))].map(x => x.getAttribute('contenteditable') + ':' + x.textContent)")
        check(f'{tag} C (2a): سینئر افسر کا نام دستاویز میں مقرر (قابلِ ترمیم نہیں)', locked == ['false:ندیم عباس شاد'] * 2, locked)
        # دستاویز میں نام پر لکھنے کی کوشش — رکتی ہے
        pg.evaluate("""() => { const n = _zimniDoc().querySelector('[data-k=io_sign] .zf-ioname'); const r = document.createRange(); r.selectNodeContents(n);
            const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; }""")
        pg.keyboard.type('x'); pg.wait_for_timeout(300)
        check(f'{tag} C (2a): نام پر ٹائپ کرنے سے نام نہیں بدلا', pg.evaluate("_zimniDoc().querySelector('[data-k=io_sign] .zf-ioname').textContent") == 'ندیم عباس شاد')
        pg.screenshot(path=V + f'{tag}_05_sho_zimni.png')
        res, msg = save(pg)
        check(f'{tag} C: SHO کی ضمنی اسی تاریخ پر محفوظ (3-الف)', res is True and '3-الف' in msg, msg)
        to_list(pg); new_zimni(pg)
        type_c1(pg, '30/10/2026')
        pg.select_option('#zf-author', 'dsp'); pg.wait_for_timeout(600)
        pg.fill('#zf-author-name', 'سید اظہر عباس'); pg.dispatch_event('#zf-author-name', 'change'); pg.wait_for_timeout(400)
        zd = pg.evaluate("_zimniDoc().querySelector('[data-k=zno]').textContent")
        check(f'{tag} C: دوسرا سینئر (DSP) اسی تاریخ پر — 3-ب', zd == '3-ب', zd)
        check(f'{tag} C (1a): نام اوپر سے لکھا (صرف اسی ضمنی کے لیے) — دستاویز میں وہی',
              pg.evaluate("_zimniDoc().querySelector('[data-k=io_sign]').textContent.trim()") == 'سید اظہر عباس DSP')
        res, msg = save(pg)
        check(f'{tag} C: DSP کی ضمنی محفوظ (3-ب)', res is True and '3-ب' in msg, msg)
        # وہی SHO دوبارہ اسی تاریخ → خبردار
        to_list(pg); new_zimni(pg)
        type_c1(pg, '30/10/2026'); pg.select_option('#zf-author', 'sho'); pg.wait_for_timeout(500)
        res, msg = save(pg)
        check(f'{tag} C: وہی SHO اسی تاریخ پر دوسری ضمنی — خبردار، محفوظ نہیں', res is False and 'ندیم عباس شاد' in msg and 'ایک افسر ایک تاریخ' in msg, msg)
        # 3a: سینئر افسر ایسی تاریخ پر جس پر تفتیشی افسر کی ضمنی نہیں — اگلا سادہ نمبر
        type_c1(pg, '31/10/2026'); pg.wait_for_timeout(400)
        z4 = pg.evaluate("_zimniDoc().querySelector('[data-k=zno]').textContent")
        res, msg = save(pg)
        check(f'{tag} C (3a): SHO، تاریخ 31/10 (تفتیشی افسر کی ضمنی نہیں) — اگلا سادہ نمبر 4', res is True and z4 == '4', [z4, msg])

        # ═══ E) ضمنی 3 میں پہلا بیان = 5 (ضمنی 2-الف میں 4) ═══
        to_list(pg)
        z3id = pg.evaluate("_zimniList.find(x => (x.content||{}).zno === '3').id")
        pg.evaluate(f"_openZimni('{z3id}')"); pg.wait_for_timeout(2500)
        type_c1(pg, '30/10/2026 بوقت 09:00 بیان 161 ض ف')
        m = pg.evaluate("[...(_zimniDoc().querySelectorAll('.zf-161n'))].map(m => m.textContent)")
        res, msg = save(pg)
        check(f'{tag} E: ضمنی 1 (2-الف) میں 4 بیان → ضمنی 3 کا پہلا بیان 5', m == ['(5)'] and res is True, [m, msg])
        # 4a: پچھلی ضمنی میں بیان بڑھا — بعد والی محفوظ ضمنی کا نمبر نہیں بدلتا، خبردار
        to_list(pg); pg.evaluate(f"_openZimni('{Z1}')"); pg.wait_for_timeout(2500)
        add_block(pg); type_c1(pg, 'بوقت 14:00 بیان 161 ض ف', 4)
        m5 = pg.evaluate("[...(_zimniDoc().querySelectorAll('.zf-161n'))].map(m => m.textContent)")
        res, msg = save(pg); pg.wait_for_timeout(1200)
        warned = any('ترتیب میں نہیں' in t for t in pg.evaluate("window.__toasts"))
        z3n = pg.evaluate("(() => { const z = _zimniList.find(x => (x.content||{}).zno === '3'); return (String(z.content.bodyHtml).match(/zf-161n[^>]*>\\((\\d+)\\)</g) || []).length ? String(z.content.bodyHtml).match(/>\\((\\d+)\\)</)[1] : ''; })()")
        check(f'{tag} E (4a): پچھلی ضمنی میں نیا بیان (5) — ضمنی 3 کا محفوظ نمبر 5 ہی رہا (پکا) اور خبردار کیا',
              m5 == ['(1)', '(2)', '(3)', '(4)', '(5)'] and z3n == '5' and warned, [m5, z3n, warned])

        # ═══ انڈیکس نقل مسل — نمبر، تاریخ، افسر ═══
        to_list(pg)
        pg.evaluate("_openMisalEditor('index_naql')"); pg.wait_for_timeout(2500)
        idx = pg.evaluate("""() => { const t = document.getElementById('idxz-table'); if (!t) return null;
            const out = []; t.querySelectorAll('tr').forEach(tr => { const c = tr.querySelectorAll('td'); for (let g = 0; g < c.length; g += 3)
              if (c[g].textContent.trim()) out.push([c[g].textContent.trim(), c[g+1].textContent.trim(), c[g+2].textContent.trim()]); }); return out; }""")
        want_n = ['2-الف', '3', '3-الف', '3-ب', '4']
        check(f'{tag} A: انڈیکس نقل مسل — نمبر جیسے لکھے، ترتیب 2-الف، 3، 3-الف، 3-ب، 4', idx and [r[0] for r in idx] == want_n, idx)
        check(f'{tag} B: انڈیکس — تاریخ کالم 1 کی (29/10، 30/10 …)', idx and [r[1] for r in idx] == ['29/10/2026', '30/10/2026', '30/10/2026', '30/10/2026', '31/10/2026'], idx)
        check(f'{tag} C (2a): انڈیکس — سینئر افسر کی ضمنی پر اُسی کا نام', idx and idx[2][2].startswith('ندیم عباس شاد') and idx[3][2].startswith('سید اظہر عباس'), idx)
        pg.screenshot(path=V + f'{tag}_06_index.png')

        # ═══ تلاش — «ضمنی نمبر 2-الف» ═══
        pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; showPage('dashboard', null)"); pg.wait_for_timeout(1500)
        pg.click('#sr-query'); pg.keyboard.type('2-الف'); pg.wait_for_timeout(2500)
        sres = pg.evaluate("(document.getElementById('sr-results') || { innerText: '' }).innerText.replace(/[\\u2066-\\u2069]/g, '')")
        check(f'{tag} A: تلاش «2-الف» → «ضمنی نمبر 2-الف» اور تاریخ 29/10/2026', 'ضمنی نمبر 2-الف' in sres and '29/10/2026' in sres, sres[:300])
        pg.screenshot(path=V + f'{tag}_07_search.png')

        # ═══ پرانی (v566 سے پہلے کی) محفوظ ضمنی — ▾ بٹن HTML میں تھا: کھولو، کچھ نہ بدلے، ▾ چلے، پرنٹ میں ▾ نہیں ═══
        pg.evaluate("openCaseWorkspace('c2')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1500)
        pg.evaluate("""() => { _newZimni(); return 0; }"""); pg.wait_for_timeout(2300)
        old_html = pg.evaluate("""() => { const d = _zimniDoc(); const td = d.querySelector('tr.zf-prerow td.zf-c-serial');
            td.innerHTML = '<button class="zf-pick no-print" contenteditable="false" onclick="_zimniAccPicker(event)" title="ملزمان منتخب کریں">&#9662;</button>';
            d.querySelector('[data-k="banam"]').innerHTML = '<div class="zf-acc"><span class="nm">اکیلا ملزم ولد فلاں</span></div>';
            d.querySelector('tr.zf-blk .zf-actbody').textContent = '20/10/2026'; return d.innerHTML; }""")
        pg.evaluate("""(h) => { const id = DIOSync.uuid(); const z = { id, case_id: 'c2', serial_no: 1, report_date: '2026-11-04',
            content: { bodyHtml: h, head: 'رپورٹ ضمنی', serial_no: 1, saved_at: '2026-10-20T10:00:00.000Z', col1_date: '20/10/2026' } };
            window.__db.zimni_reports.push(Object.assign({}, z)); _zimniList = [z]; _zimniLocalPut('c2', _zimniList); window.__oldId = id; return 0; }""", old_html)
        pg.evaluate("_zimniDirty = false; _renderZimniList(); 0"); pg.wait_for_timeout(800)
        rows = pg.evaluate(LIST_ROWS)
        check(f'{tag} B: پرانی ضمنی (report_date = آلے کی 04/11) — فہرست میں کالم 1 کی 20/10/2026', rows and rows[0][1] == '20/10/2026', rows)
        pg.evaluate("_openZimni(window.__oldId)"); pg.wait_for_timeout(2500)
        check(f'{tag} D: پرانی ضمنی کھولی — «بنام» وہی ایک نام، کچھ نہیں لگا، غیر محفوظ نشان نہیں',
              pg.evaluate(BANAM, 'banam') == ['اکیلا ملزم ولد فلاں'] and pg.evaluate("_zimniDirty") is False, pg.evaluate(BANAM, 'banam'))
        check(f'{tag} D: پرانی ضمنی — ▾ ایک (کراس نہیں)، کالم 2 میں بچا «▾» متن نہیں',
              pg.evaluate("_zimniDoc().querySelectorAll('.zf-pick').length") == 1 and '▾' not in pg.evaluate("[...(_zimniDoc().querySelector('tr.zf-prerow td.zf-c-serial').childNodes)].filter(n => n.nodeType === 3).map(n => n.nodeValue).join('')"))
        pg.click('#ch173-doc .zf-pick[data-which=fir]'); pg.wait_for_timeout(500)
        check(f'{tag} D: پرانی ضمنی — ▾ کام کرتا ہے، نام پہچانا (نشان لگا)', pg.evaluate("[...document.querySelectorAll('#zf-acc-menu input')].map(i => i.checked)") == [True])
        pg.click('#zf-acc-x'); pg.wait_for_timeout(200)
        check(f'{tag} F: کراس ورژن کے بغیر مقدمہ — کالم 3 میں کراس کا حصہ نہیں', not pg.evaluate("!!_zimniDoc().querySelector('[data-k=xv_head],[data-k=banam_x]')"))
        hp = body_of(snap_html(pg, 'button'))
        check(f'{tag} D: پرانی ضمنی کا پرنٹ — ▾ نہیں', '▾' not in hp and 'zf-pick' not in hp)

        # ═══ regression ═══
        to_list(pg); new_zimni(pg)
        type_c1(pg, '21/10/2026')
        # کالم 1 ↔ دستخط کی تاریخ
        sd = pg.evaluate("_zimniDoc().querySelector('[data-k=io_date]').textContent.trim()")
        check(f'{tag} REG: کالم 1 کی تاریخ → دستخط کے نیچے کی تاریخ', sd == '21/10/2026', sd)
        pg.evaluate("""() => { const n = _zimniDoc().querySelector('[data-k=io_date]'); n.focus(); const r = document.createRange(); r.selectNodeContents(n);
            const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, '22/10/2026'); return 0; }""")
        pg.wait_for_timeout(500)
        c1 = pg.evaluate("_zimniDoc().querySelector('tr.zf-blk .zf-actbody').textContent.trim()")
        check(f'{tag} REG: دستخط کی تاریخ → کالم 1', c1.startswith('22/10/2026'), c1)
        # کالم 2 دستی نمبر
        add_block(pg)
        pg.evaluate("""() => { const n = _zimniDoc().querySelectorAll('tr.zf-blk .zf-num'); n[0].textContent = '3'; n[1].textContent = '7'; return 0; }""")
        res, msg = save(pg)
        nums = pg.evaluate("(() => { const z = _zimniList.find(x => x.report_date === '2026-10-22'); const t = document.createElement('template'); t.innerHTML = z.content.bodyHtml; return [...t.content.querySelectorAll('.zf-num')].map(n => n.textContent); })()")
        check(f'{tag} REG: کالم 2 کا فقرہ نمبر دستی — لکھا ہوا (3، 7) ہی محفوظ', res is True and nums == ['3', '7'], [res, msg, nums])

        # ═══ فہرست — تمام ضمنیاں نمبر / تاریخ / سینئر افسر کے ساتھ (محفوظ → reload → دوسرا آلہ: v566_sync_test.py) ═══
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(2000)
        rows = pg.evaluate(LIST_ROWS)
        check(f'{tag} A: فہرست کی ترتیب 4، 3-ب، 3-الف، 3، 2-الف (نمبر جیسے لکھے)',
              [r[0] for r in rows] == ['4', '3-ب', '3-الف', '3', '2-الف'] and rows[-1][1] == '29/10/2026', rows)
        check(f'{tag} C: فہرست میں سینئر افسر کا نام قسم کے نیچے', any('ندیم عباس شاد' in r[2] for r in rows) and any('سید اظہر عباس' in r[2] for r in rows), rows)
        pg.screenshot(path=V + f'{tag}_08_list.png', full_page=True)
        check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:4])
        b.close()


only = os.environ.get('DIO_ONLY', '')
for d in (True, False):
    if only == 'desktop' and not d: continue
    if only == 'mobile' and d: continue
    try:
        run(d)
    except Exception as e:
        import traceback; traceback.print_exc()
        check(('desktop' if d else 'mobile') + ': جانچ مکمل چلی', False, str(e)[:300])

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
