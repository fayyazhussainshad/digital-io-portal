"""(v568) TASK 7 — محفوظ ضمنیات کی فہرست، «تمام ضمنیاں»، ڈپلیکیٹ ضمنی، بیان 161 کا محفوظ ہونا، بیان 161 کی 27 اکتوبر والی ترتیب
اصل ایپ کی جانچ (Desktop 1366×768 + Mobile 390×844)؛ صرف Supabase کی جگہ آزمائشی ڈیٹا۔

افسر کی ہدایت (4 نومبر 2026) اور جواب:
  A) فہرست: ترمیم / پرنٹ (کھولے بغیر، وہی پرنٹ) / شیئر / ڈپلیکیٹ / حذف — PDF اور نقل نہیں؛ نمبر جیسا لکھا (2-الف) + کالم 1 کی
     تاریخ؛ «تمام ضمنیاں» = ہر ضمنی اپنے پرنٹ جیسی، ترتیب سے، ہر ایک نئے صفحے سے (پرانی ستمبر والی ضمنیاں بھی)
  B) ڈپلیکیٹ (جواب: اسی مقدمے میں، وہی نمبر + تاریخ): نشان، وہی تاریخ + افسر یا وہی نمبر = محفوظ نہیں؛ درستی پر محفوظ اور نشان ختم؛
     غیر محفوظ نقل انڈیکس / 161 میں نہیں
  C) بیان 161: بٹن اور Ctrl+S سے محفوظ — عنوان (گواہ کا نام) اور بیان میں لکھی تاریخ کے ساتھ؛ سرور «دوہرا» کہے تو کبھی جھوٹا
     «محفوظ» نہیں؛ منسلک اندرونی شیٹ والی بیرونی ضمنی پر Ctrl+S / اوپر کا «محفوظ» = ضمنی (بیان نہیں)؛ لکھتے ہی خودکار مسودہ
  D) اکیلا بیان 161 = 27 اکتوبر (v558) کی ترتیب (kerning خودکار)؛ بیرونی ضمنی کی منسلک اندرونی شیٹ اپنی الگ نقل پر
چلانا: `python3 v568_test.py` — ایک ہی: DIO_ONLY=desktop|mobile
"""
from v564_common import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v568/test/'
os.makedirs(V, exist_ok=True)
OLD = open(HERE + '/v568_old_body.js', encoding='utf-8').read()
TXT = ' '.join(PARA)
TOASTS = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push(String(m)); try { return o.apply(this, arguments); } catch (_) { return 0; } }; return 0; })()"""
WIT = """(() => { const d = window.__db;
  d.case_witnesses = [
    { id:'w1', case_id:'c1', full_name:'غلام رسول ولد اللہ دتہ قوم جٹ سکنہ چک نمبر 5 فیض', status:'fir_eye', witness_type:'fir', created_at:'2026-10-01' },
    { id:'w2', case_id:'c1', full_name:'احمد علی ولد بشیر احمد', status:'fir_eye', witness_type:'fir', created_at:'2026-10-02' } ];
  d.fir_matn = [{ id:'m1', case_id:'c1', type:'fir', matn:'میں مدعی مقدمہ ہوں۔', created_at:'2026-10-01' }];
  return 0; })()"""
ROWS = """() => [...document.querySelectorAll('.zt tbody tr[data-zid]')].map(tr => ({ id: tr.getAttribute('data-zid'), no: tr.querySelector('td.num').innerText.trim(),
  d: tr.querySelector('td.dtc').innerText.trim(), b: [...tr.querySelectorAll('button')].map(b => b.title.split(' — ')[0]) }))"""
ZR = "() => (window.__db.zimni_reports || []).filter(r => !r.deleted_at).map(r => ({ id: r.id, zno: (r.content || {}).zno || String(r.serial_no), d: r.report_date, a: ((r.content || {}).author || {}).role || 'io', at: (r.content || {}).saved_at }))"
ZA = "() => (window.__db.zimni_androoni_reports || []).filter(r => !r.deleted_at).map(r => ({ id: r.id, sn: r.serial_no, d: r.report_date, w: (r.content || {}).witnesses || [], dd: (r.content || {}).doc_date || '' }))"


def toasts(pg, n0):
    return pg.evaluate(f"(window.__toasts||[]).slice({n0})")


def nt(pg):
    return pg.evaluate("(window.__toasts||[]).length")


def mk_old(pg, sid, sn, date, reps):
    """ستمبر 2026 (17 ستمبر سے پہلے) کی پرانی ضمنی — اُس وقت کے اصل خاکے (commit 2b3ef1c) سے، سرور پر محفوظ"""
    pg.evaluate("""([sid, sn, date, txt, reps]) => { const o = currentOfficer || {}; const c = window.__db.cases.find(x => x.id === 'c1');
        _zimniActive = { serial_no: sn }; let h = window.__oldZimniBody(o, c);
        const t = document.createElement('template'); t.innerHTML = h;
        t.content.querySelector('.zf-actbody').textContent = date;
        t.content.querySelector('.zf-body').innerHTML = 'جناب عالیٰ! ' + Array.from({length: reps}, (_, i) => '<div>' + (i + 1) + '۔ ' + txt + '</div>').join('');
        t.content.querySelector('[data-k="io_date"]').textContent = date;
        window.__db.zimni_reports.push({ id: sid, case_id: 'c1', serial_no: sn, report_date: date.split('/').reverse().join('-'), officer_id: 'o1', rev: 1,
          content: { bodyHtml: t.innerHTML, head: 'رپورٹ ضمنی', serial_no: sn, saved_at: '2026-09-0' + sn + 'T10:00:00Z' }, created_at: '2026-09-0' + sn + 'T10:00:00Z' });
        _zimniActive = null; return 0; }""", [sid, sn, date, TXT, reps])


def grab(pg, fn, paper):
    """کسی بھی راستے کا اصل کاغذ (چھپائی کا iframe) — fn: js یا python callable"""
    pg.evaluate(SNAP); pg.evaluate("window.__snaps = []; window.__dioPaperAuto = undefined; 0")
    if callable(fn): fn()
    else: pg.evaluate(fn + '; 0')
    pick_paper(pg, paper)
    for _ in range(200):
        if pg.evaluate("window.__snaps.length"): break
        pg.wait_for_timeout(200)
    return pg.evaluate("window.__snaps[0] || ''")


def pages(b, html, name):
    p = V + name + '.pdf'
    html_pdf(b, html, p)
    return pages_png(p, V + name)


def type_into(pg, sel, txt, idx=0, replace=True):
    pg.evaluate("""([sel, t, i, rep]) => { const a = _zimniDoc().querySelectorAll(sel)[i]; a.focus();
      const r = document.createRange(); r.selectNodeContents(a); if (!rep) r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      document.execCommand('insertText', false, t); return 0; }""", [sel, txt, idx, replace])
    pg.wait_for_timeout(400)


def save_btn(pg):
    """افسر کی طرح محفوظ: کرسر ضمنی کے متن میں، Ctrl+S (ضمنی کی پٹی میں «محفوظ» پورے صفحے کی پٹی میں ہوتا ہے)"""
    n0 = nt(pg)
    pg.evaluate("(() => { const e = _zimniDoc().querySelector('tr.zf-blk .zf-body'); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()")
    pg.keyboard.press('Control+s'); pg.wait_for_timeout(1800)
    return toasts(pg, n0)


def to_list(pg):
    pg.evaluate("window.confirm = () => false; 0")
    pg.evaluate("_zimniBackToList()"); pg.wait_for_timeout(1300)
    pg.evaluate("window.confirm = () => true; 0")


def stmt_end(pg):
    """بیان کے خانے کے آخر میں کرسر (افسر کی طرح؛ موبائل پر کاغذ چھوٹا ہوتا ہے — اسی لیے کلک کی جگہ کرسر سیدھا)"""
    pg.evaluate("""(() => { const e = [...document.querySelectorAll('#ch173-doc .zfa-wit-stmt')].pop(); e.scrollIntoView({ block: 'center' }); e.focus();
      const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()""")
    pg.wait_for_timeout(200)


def btn_metrics(pg, sel):
    return pg.evaluate("""(sel) => { const b = document.querySelector(sel); if (!b) return null; const s = getComputedStyle(b);
      return [Math.round(b.getBoundingClientRect().height), s.borderRadius, s.fontSize, s.paddingTop, s.paddingLeft, b.className.replace(/\\s+/g, ' ').trim().split(' ').filter(c => /^(btn|btn-sm|dio-act)$/.test(c)).sort().join(' ')]; }""", sel)


def run(desktop):
    tag = 'desktop' if desktop else 'mobile'
    paper = 'legal' if desktop else 'a4'          # دونوں کاغذ جانچے جائیں
    with sync_playwright() as p:
        b = p.chromium.launch()
        vp = {'width': 1366, 'height': 768} if desktop else {'width': 390, 'height': 844}
        extra = {} if desktop else {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
        ctx, pg, errs = open_app(b, viewport=vp, **extra)
        pg.evaluate("window.confirm = () => true; 0"); pg.evaluate(TOASTS)
        pg.evaluate(SEED); pg.evaluate(WIT); pg.evaluate(OLD + '; 0')
        mk_old(pg, 'z1', 1, '05/09/2026', 14)                  # پرانی ضمنی (ستمبر) — لیگل پر 4 صفحے، منسلک اندرونی شیٹ سمیت
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800)

        # ── نئی ضمنیاں: 2 (کالم 1 میں «161 ض ف») اور 2-الف (ہاتھ سے لکھا نمبر) ──
        pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2300)
        pg.evaluate(fill_js(3, 2)); type_into(pg, 'tr.zf-blk .zf-actbody', '16/10/2026')
        type_into(pg, 'tr.zf-blk .zf-actbody', ' بوقت 11:00 161 ض ف', 1, False)
        t = save_btn(pg)
        check(f'{tag} setup: ضمنی 2 محفوظ', any('سرور پر محفوظ' in x for x in t), t)
        to_list(pg)
        pg.click("button:has-text('ضمنی درج کریں')"); pg.wait_for_timeout(2300)
        pg.evaluate(fill_js(2, 2)); type_into(pg, 'tr.zf-blk .zf-actbody', '18/10/2026'); type_into(pg, '[data-k="zno"]', '2-الف')
        t = save_btn(pg)
        check(f'{tag} setup: ضمنی 2-الف محفوظ', any('سرور پر محفوظ' in x for x in t), t)
        to_list(pg)
        pg.screenshot(path=V + f'{tag}_01_list.png', full_page=False)

        # ═══ A) فہرست ═══
        rows = pg.evaluate(ROWS)
        check(f'{tag} A6: ہر قطار میں ضمنی نمبر جیسا محفوظ (2-الف) اور کالم 1 کی تاریخ',
              [(r['no'], r['d']) for r in rows] == [('2-الف', '18/10/2026'), ('2', '16/10/2026'), ('1', '05/09/2026')], [(r['no'], r['d']) for r in rows])
        check(f'{tag} A2/A3: «PDF» اور «نقل» کے بٹن نہیں — ترمیم / پرنٹ / شیئر / ڈپلیکیٹ / حذف',
              all(r['b'] == ['ترمیم', 'پرنٹ', 'شیئر', 'ڈپلیکیٹ', 'حذف'] for r in rows)
              and not pg.evaluate("[...document.querySelectorAll('.zt-wrap button')].some(b => /^(PDF|نقل)/.test((b.title || '').trim()) || /^(📄\\s*)?PDF$|^(📋\\s*)?نقل$/.test(b.textContent.trim()))"), rows[0]['b'])
        zm = btn_metrics(pg, ".zt tbody tr[data-zid] button[title^='پرنٹ']")
        check(f'{tag} A4: فہرست میں افقی scroll نہیں (5 بٹن بھی ایک قطار / کارڈ میں)', pg.evaluate("(() => { const w = document.querySelector('.zt-wrap'); return w.scrollWidth <= w.clientWidth + 1; })()"))
        zid2 = [r['id'] for r in rows if r['no'] == '2'][0]
        zidA = [r['id'] for r in rows if r['no'] == '2-الف'][0]

        # A1: قطار کا «پرنٹ» — ضمنی کھولے بغیر؛ = اندر سے «پرنٹ» بٹن = Ctrl+P (وہی کاغذ، pixel تک)
        h_row = grab(pg, lambda: pg.click(f".zt tbody tr[data-zid='{zid2}'] button[title^='پرنٹ']"), paper)
        opened = pg.evaluate("!!document.querySelector('#ch173-doc .zf-tbl')")
        P_row = pages(b, h_row, f'{tag}_A1_row')
        pg.evaluate(f"_openZimni('{zid2}'); 0"); pg.wait_for_timeout(2500)
        h_in = grab(pg, lambda: pg.evaluate("(document.querySelector('#dio-dv-bar button[onclick=\"_dioPrintCurrent()\"]') || document.querySelector('[data-dio-print]')).click()"), paper)
        P_in = pages(b, h_in, f'{tag}_A1_inside')
        def ctrlp():
            pg.click('#ch173-doc tr.zf-blk .zf-body'); pg.keyboard.press('End'); pg.keyboard.press('Control+p')
        h_cp = grab(pg, ctrlp, paper)
        P_cp = pages(b, h_cp, f'{tag}_A1_ctrlp')
        s1, d1 = same_pages(P_row, P_in); s2, d2 = same_pages(P_row, P_cp)
        check(f'{tag} A1: قطار کا «پرنٹ» ضمنی کھولے بغیر سیدھا کاغذ (ایڈیٹر نہیں کھلا)', 'zf-tbl' in h_row and not opened, (len(h_row), opened))
        check(f'{tag} A1: قطار کا پرنٹ = اندر سے «پرنٹ» بٹن = Ctrl+P ({paper}، ہر صفحہ pixel تک)', s1 and s2, (len(P_row), d1, d2))
        to_list(pg)

        # A5: «تمام ضمنیاں» — 1 (پرانی، منسلک اندرونی شیٹ)، 2، 2-الف — ہر ایک اپنے پرنٹ جیسی، ترتیب سے، نئے صفحے سے
        h_all = grab(pg, lambda: pg.click("button:has-text('تمام ضمنیاں')"), paper)
        P_all = pages(b, h_all, f'{tag}_A5_all')
        singles, counts = [], []
        for zid in ['z1', zid2, zidA]:
            h = grab(pg, f"_printZimniById('{zid}')", paper)
            ps = pages(b, h, f'{tag}_A5_one_{len(counts) + 1}')
            singles += ps; counts.append(len(ps))
        sa, da = same_pages(P_all, singles)
        contact(P_all, V + f'{tag}_A5_all_sheet.png')
        check(f'{tag} A5: «تمام ضمنیاں» — {len(P_all)} صفحے = اکیلے پرنٹ {counts} (ترتیب 1، 2، 2-الف؛ ہر ضمنی نئے صفحے سے؛ مثل کی لکیر ہر ضمنی کے صفحہ 2، 4 …؛ ہر صفحہ pixel تک)',
              sa and len(P_all) == sum(counts), (len(P_all), counts, da))
        check(f'{tag} A5: پرانی ضمنی کی منسلک اندرونی شیٹ «تمام ضمنیاں» میں بھی (پولیس فارم 25—54(2))', h_all.count('class="zf-androoni"') >= 1 and '25—54(2)' in h_all, h_all.count('zf-androoni'))

        # ═══ B) ڈپلیکیٹ ═══
        n_before = len(pg.evaluate(ZR))
        pg.click(f".zt tbody tr[data-zid='{zid2}'] button[title^='ڈپلیکیٹ']"); pg.wait_for_timeout(2500)
        st = pg.evaluate("""(() => ({ badge: (document.getElementById('zf-dup-badge') || {}).textContent || '', zno: _zimniDoc().querySelector('[data-k="zno"]').textContent.trim(),
            c1: _zimniDoc().querySelector('tr.zf-blk .zf-actbody').textContent.trim(), id: (_zimniActive || {}).id || null,
            body: _zimniDoc().querySelectorAll('tr.zf-blk').length }))()""")
        pg.screenshot(path=V + f'{tag}_02_duplicate_editor.png')
        check(f'{tag} B7: «ڈپلیکیٹ» — نقل ترمیم کے لیے کھلی، پٹی میں «ڈپلیکیٹ» نشان، وہی نمبر (2) اور تاریخ (16/10/2026)',
              st['badge'] == 'ڈپلیکیٹ' and st['zno'] == '2' and st['c1'] == '16/10/2026' and st['id'] is None and st['body'] == 3, st)
        hp = grab(pg, lambda: pg.evaluate("(document.querySelector('#dio-dv-bar button[onclick=\"_dioPrintCurrent()\"]') || document.querySelector('[data-dio-print]')).click()"), paper)
        check(f'{tag} B7: «ڈپلیکیٹ» نشان کاغذ پر نہیں', 'ڈپلیکیٹ' not in hp and 'zf-tbl' in hp)
        to_list(pg)
        dr = pg.evaluate("[...document.querySelectorAll('.zt tbody tr.zt-draft')].map(r => r.innerText.replace(/\\s+/g, ' '))")
        check(f'{tag} B7: فہرست میں نقل «ڈپلیکیٹ» نشان کے ساتھ (غیر محفوظ)؛ محفوظ ضمنیاں وہی 3', len(dr) == 1 and 'ڈپلیکیٹ' in dr[0] and len(pg.evaluate(ROWS)) == 3, dr)
        # B10: غیر محفوظ نقل — انڈیکس نقل مسل اور 161 کے نمبر میں نہیں
        pg.evaluate("_doAddMisalDoc('index_naql')"); pg.wait_for_timeout(500)
        pg.evaluate("_openMisalEditor('index_naql')"); pg.wait_for_selector('#misal-editor'); pg.wait_for_timeout(1800)
        idx = pg.evaluate("[...document.querySelectorAll('#misal-editor #idxz-table td.idxz-n')].map(t => t.textContent.trim()).filter(Boolean)")
        check(f'{tag} B10: غیر محفوظ ڈپلیکیٹ انڈیکس نقل مسل میں نہیں (صرف 3 محفوظ ضمنیاں)', sorted(idx) == sorted(['1', '2', '2-الف']), idx)
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800)
        pg.click(".zt tbody tr.zt-draft button[data-act='edit']"); pg.wait_for_timeout(2300)
        check(f'{tag} B7: نقل دوبارہ کھلی — نشان برقرار', pg.evaluate("(document.getElementById('zf-dup-badge') || {}).textContent") == 'ڈپلیکیٹ')
        # B9: جوں کی توں نقل — وہی تاریخ + وہی افسر اور وہی نمبر: محفوظ نہیں
        t = save_btn(pg)
        check(f'{tag} B9: وہی تاریخ + وہی تفتیشی افسر + وہی نمبر — خبردار، محفوظ نہیں', len(pg.evaluate(ZR)) == n_before and any('محفوظ نہیں ہوئی' in x for x in t)
              and pg.evaluate("!!document.getElementById('zf-dup-badge')"), t)
        type_into(pg, 'tr.zf-blk .zf-actbody', '20/10/2026')
        t = save_btn(pg)
        check(f'{tag} B9: تاریخ بدلی مگر نمبر وہی (2) — خبردار، محفوظ نہیں', len(pg.evaluate(ZR)) == n_before and any('ضمنی نمبر' in x and 'محفوظ نہیں' in x for x in t), t)
        type_into(pg, '[data-k="zno"]', '3')
        t = save_btn(pg)
        zr = pg.evaluate(ZR)
        check(f'{tag} B8: تاریخ (20/10/2026) اور نمبر (3) درست — محفوظ، «ڈپلیکیٹ» نشان ختم', len(zr) == n_before + 1 and any(r['zno'] == '3' and r['d'] == '2026-10-20' for r in zr)
              and not pg.evaluate("!!document.getElementById('zf-dup-badge')"), (t, [r['zno'] for r in zr]))
        n161 = pg.evaluate("""(() => { const r = window.__db.zimni_reports.find(x => (x.content || {}).zno === '3'), o = window.__db.zimni_reports.find(x => (x.content || {}).zno === '2');
            const g = (x) => { const t = document.createElement('template'); t.innerHTML = x.content.bodyHtml; return [...t.content.querySelectorAll('.zf-161n')].map(m => m.getAttribute('data-n')); };
            return [g(o), g(r)]; })()""")
        check(f'{tag} B8: نقل کا «161 ض ف» نمبر محفوظ ہوتے وقت اپنی جگہ کے حساب سے (اصل 1 → نقل 2، اصل نہیں بدلا)', n161 == [['1'], ['2']], n161)
        to_list(pg)
        rows = pg.evaluate(ROWS)
        check(f'{tag} B8: فہرست میں نئی ضمنی 3 (20/10/2026) عام قطار — کوئی نقل/مسودہ باقی نہیں',
              rows[0]['no'] == '3' and rows[0]['d'] == '20/10/2026' and not pg.evaluate("document.querySelectorAll('.zt tbody tr.zt-draft').length"), [(r['no'], r['d']) for r in rows])
        # B9: سینئر افسر کا لاحقہ — ضمنی 3 کی نقل، لکھنے والا SHO، وہی تاریخ: نمبر 3 نہیں، 3-الف ہاں
        zid3 = rows[0]['id']
        pg.click(f".zt tbody tr[data-zid='{zid3}'] button[title^='ڈپلیکیٹ']"); pg.wait_for_timeout(2500)
        pg.evaluate("_zimniSetAuthor(_zimniSeniorDefault('sho')); 0"); pg.wait_for_timeout(400)
        t = save_btn(pg)
        ok1 = len(pg.evaluate(ZR)) == n_before + 1
        type_into(pg, '[data-k="zno"]', '3-الف')
        t2 = save_btn(pg)
        zr = pg.evaluate(ZR)
        check(f'{tag} B9: نقل + SHO اسی تاریخ پر — نمبر 3 رد، 3-الف محفوظ (سینئر افسر کا لاحقہ)', ok1 and any(r['zno'] == '3-الف' and r['a'] == 'sho' for r in zr), (t, t2))
        to_list(pg)

        # ═══ C) بیان 161 ═══
        pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
        def za_list():
            if pg.evaluate("!!document.querySelector('#ch173-doc .zfa-tbl')"):
                pg.evaluate("window.confirm = () => false; 0"); pg.evaluate("document.getElementById('zfa-back-btn').click()"); pg.wait_for_timeout(1500); pg.evaluate("window.confirm = () => true; 0")
        def new_za(who, date):
            za_list()
            pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(1800)
            za_pick(pg, who, 1400)   # v577: کاغذ کے کونے کا «▾»
            stmt_end(pg); pg.keyboard.type(' میں موقع پر موجود تھا۔')
            if date:
                pg.evaluate("(d) => { const e = document.querySelectorAll('#ch173-doc .zfa-wit-date'); e[e.length - 1].textContent = d; return 0; }", date)
            pg.wait_for_timeout(300)
        new_za('غلام رسول', '02/11/2026')
        pg.screenshot(path=V + f'{tag}_03_161_editor.png')
        n0 = nt(pg); za_save(pg); pg.wait_for_timeout(2200); t = toasts(pg, n0)
        za = pg.evaluate(ZA)
        check(f'{tag} C11: بیان 161 «⋯ → محفوظ کریں» — سرور پر، عنوان (گواہ کا نام) اور بیان میں لکھی تاریخ (02/11/2026) کے ساتھ',
              any('سرور پر محفوظ' in x for x in t) and len(za) == 1 and za[0]['w'] and 'غلام رسول' in za[0]['w'][0] and za[0]['d'] == '2026-11-02' and za[0]['dd'] == '02/11/2026', (t, za))
        new_za('احمد علی', '03/11/2026')
        n0 = nt(pg); stmt_end(pg); pg.keyboard.press('Control+s'); pg.wait_for_timeout(2200); t = toasts(pg, n0)
        za = pg.evaluate(ZA)
        check(f'{tag} C11: بیان 161 Ctrl+S — سرور پر (دو بیان)', any('سرور پر محفوظ' in x for x in t) and len(za) == 2, (t, len(za)))
        za_list()
        L = pg.evaluate("""[...document.querySelectorAll('.zat-wrap tbody tr[data-zaid]')].map(r => ({ d: r.querySelector('.dtc').innerText.trim(), w: r.querySelector('.wit').innerText.trim(),
            b: [...r.querySelectorAll('button')].map(x => x.title.split(' — ')[0]) }))""")
        pg.screenshot(path=V + f'{tag}_04_161_list.png')
        check(f'{tag} C11: بیانات کی فہرست — لکھی تاریخ، گواہ کا نام، ترمیم / پرنٹ / شیئر / حذف',
              [(x['d'], x['w']) for x in L] == [('03/11/2026', 'احمد علی'), ('02/11/2026', 'غلام رسول')] and all(x['b'] == ['ترمیم', 'پرنٹ', 'شیئر', 'حذف'] for x in L), L)
        h161 = grab(pg, "_printZimniAById(String(_zaList[0].id))", paper)
        check(f'{tag} C11: فہرست سے بیان کا پرنٹ', 'zfa-tbl' in h161 and 'احمد علی' in h161, len(h161))

        # C (اصل وجہ): سرور «اسی نمبر کا پہلے سے» (unique: مقدمہ + نمبر؛ حذف شدہ بیان بھی نمبر رکھتا ہے)
        pg.evaluate("window.__opts.unique = { zimni_androoni_reports: [['case_id', 'serial_no']] }; 0")
        pg.evaluate("_deleteZimniA(String(_zaList[0].id), true)"); pg.wait_for_timeout(1500)       # بیان 2 حذف (نشان)
        new_za('احمد علی', '04/11/2026')
        n0 = nt(pg); za_save(pg); pg.wait_for_timeout(2500); t = toasts(pg, n0)
        za = pg.evaluate(ZA)
        za_list()
        lr = pg.evaluate("[...document.querySelectorAll('.zat-wrap tbody tr[data-zaid]')].map(r => r.querySelector('.dtc').innerText.trim())")
        check(f'{tag} C11: حذف شدہ بیان کا نمبر سرور پر — نیا بیان اگلے خالی نمبر (3) پر محفوظ؛ سبز پیغام سچا، فہرست میں موجود',
              any('نمبر 3 سرور پر محفوظ' in x for x in t) and sorted(r['sn'] for r in za) == [1, 3] and '04/11/2026' in lr, (t, za, lr))
        # کوئی اور «دوہرا» رد — کبھی جھوٹا «محفوظ» نہیں؛ بیان آلے پر، «سرور پر بھیجنا باقی»؛ رد ختم ہو تو خود سرور پر
        pg.evaluate("window.__opts.fail = ['zimni_androoni_reports:insert']; window.__opts.failCode = '23505'; 0")
        new_za('غلام رسول', '05/11/2026')
        n0 = nt(pg); za_save(pg); pg.wait_for_timeout(2500); t = toasts(pg, n0)
        za_list()
        lr = pg.evaluate("[...document.querySelectorAll('.zat-wrap tbody tr[data-zaid]')].map(r => r.innerText.replace(/\\s+/g, ' '))")
        check(f'{tag} C11: سرور کا «دوہرا» رد — سبز «محفوظ» نہیں (سرخ پیغام)، بیان غائب نہیں: فہرست میں «سرور پر بھیجنا باقی»',
              not any('سرور پر محفوظ' in x for x in t) and any('قبول نہیں' in x for x in t) and any('05/11/2026' in r and 'بھیجنا باقی' in r for r in lr), (t, lr))
        pg.evaluate("window.__opts.fail = []; window.__opts.failCode = '42501'; window._zaLastTry = 0; _zaSyncPending(); 0"); pg.wait_for_timeout(2500)
        check(f'{tag} C11: رد ختم — بیان خود سرور پر (دوہرا نہیں)', sorted(r['dd'] for r in pg.evaluate(ZA)) == ['02/11/2026', '04/11/2026', '05/11/2026'], pg.evaluate(ZA))
        pg.evaluate("window.__opts.unique = {}; 0")

        # C12: لکھتے ہی خودکار مسودہ — صفحہ بند ہو کر دوبارہ کھلے تو متن واپس
        za_list()
        pg.click("button:has-text('بیان درج کریں')"); pg.wait_for_timeout(1800)
        za_pick(pg, 'احمد علی', 1400)
        stmt_end(pg); pg.keyboard.type(' خودکار مسودہ کی جانچ۔'); pg.wait_for_timeout(2300)
        dk = pg.evaluate("Object.values(JSON.parse(localStorage.getItem('dio_za_draft_c1') || '{}')).some(d => /خودکار مسودہ کی جانچ/.test(d.bodyHtml || ''))")
        check(f'{tag} C12: لکھتے ہی خودکار مسودہ (1.5 سیکنڈ) اسی آلے پر', dk)

        # ═══ D) اکیلا بیان 161 = 27 اکتوبر کی ترتیب؛ بیرونی ضمنی کی منسلک اندرونی شیٹ الگ ═══
        kz = pg.evaluate("getComputedStyle(document.getElementById('ch173-doc')).fontKerning")
        h161 = grab(pg, "_printZimniA()", paper)
        check(f'{tag} D13: اکیلا بیان 161 — kerning خودکار (27 اکتوبر جیسا): اسکرین اور پرنٹ', kz == 'auto' and 'html #ch173-doc{ font-kerning:auto; }' in h161, kz)
        # صفحہ بند → دوبارہ لاگ اِن → مسودہ واپس (C12)
        pg.reload(); pg.wait_for_timeout(2500)
        pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }"""); pg.wait_for_timeout(2500)
        pg.evaluate("try{_skipOnboarding()}catch(e){}; try{closeModal()}catch(e){}; window.confirm = () => true; 0"); pg.evaluate(TOASTS)
        pg.evaluate(SEED.replace("Object.keys(localStorage).filter(k => /^dio_za_|^dio_zimni_/.test(k)).forEach(k => localStorage.removeItem(k));", '')); pg.evaluate(WIT); pg.evaluate(OLD + '; 0')
        mk_old(pg, 'z1', 1, '05/09/2026', 14)
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1300)
        pg.evaluate("_openMisalEditor('statements_161')"); pg.wait_for_timeout(1800)
        drow = pg.evaluate("[...document.querySelectorAll('.zat-wrap tr.zt-draft')].length")
        if drow: pg.click(".zat-wrap tr.zt-draft button[data-act='edit']"); pg.wait_for_timeout(1600)
        back = pg.evaluate("/خودکار مسودہ کی جانچ/.test((document.getElementById('ch173-doc') || {}).textContent || '')")
        check(f'{tag} C12: صفحہ بند ہو کر دوبارہ کھلا — مسودہ فہرست میں، کھولنے پر لکھا متن واپس', drow == 1 and back, (drow, back))
        pg.evaluate("_zaClose()"); pg.wait_for_timeout(1200)

        # D14: منسلک اندرونی شیٹ والی پرانی بیرونی ضمنی — اپنی ضمنی کے ساتھ (v569: kerning خودکار، 3 نومبر سے پہلے جیسا)؛
        #   اکیلے بیان 161 کے فنکشن کبھی نہیں
        pg.evaluate("""(() => { window.__zaCssCalls = 0; window.__zaBodyCalls = 0; const a = window._zaFormCSS, b = window._zaDefaultBody;
            window._zaFormCSS = _zaFormCSS = function () { window.__zaCssCalls++; return a.apply(this, arguments); };
            window._zaDefaultBody = _zaDefaultBody = function () { window.__zaBodyCalls++; return b.apply(this, arguments); }; return 0; })()""")
        pg.evaluate("_openMisalEditor('zamniyat')"); pg.wait_for_timeout(1800)
        pg.evaluate("_openZimni('z1'); 0"); pg.wait_for_timeout(3500)
        att = pg.evaluate("!!document.querySelector('#ch173-doc .zf-androoni .zfa-tbl')")
        kb = pg.evaluate("getComputedStyle(document.getElementById('ch173-doc')).fontKerning")
        hb = grab(pg, lambda: pg.evaluate("(document.querySelector('#dio-dv-bar button[onclick=\"_dioPrintCurrent()\"]') || document.querySelector('[data-dio-print]')).click()"), paper)
        calls = pg.evaluate("[window.__zaCssCalls, window.__zaBodyCalls]")
        check(f'{tag} D14: بیرونی ضمنی کی منسلک اندرونی شیٹ — ایڈیٹر اور پرنٹ اکیلے بیان 161 کی CSS / خاکہ نہیں لیتے (اپنی نقل)؛ kerning اپنی ضمنی جیسی (v569: خودکار)',
              att and calls == [0, 0] and kb == 'auto' and 'font-kerning' not in hb and 'zf-androoni' in hb, (att, calls, kb))
        # C (اصل وجہ 2): اسی ضمنی پر Ctrl+S / اوپر کی پٹی کا «محفوظ» = ضمنی (بیان 161 نہیں)
        pg.evaluate("(() => { const e = document.querySelector('#ch173-doc td.zf-c-body .zf-body'); e.scrollIntoView({ block: 'center' }); e.focus(); const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()")
        pg.keyboard.type(' نئی سطر'); pg.wait_for_timeout(300)
        za0 = len(pg.evaluate(ZA)); at0 = [r['at'] for r in pg.evaluate(ZR) if r['id'] == 'z1'][0]
        n0 = nt(pg); pg.keyboard.press('Control+s'); pg.wait_for_timeout(2200); t = toasts(pg, n0)
        at1 = [r['at'] for r in pg.evaluate(ZR) if r['id'] == 'z1'][0]
        check(f'{tag} C: منسلک اندرونی شیٹ والی ضمنی پر Ctrl+S — ضمنی محفوظ، کوئی «بیان 161» نہیں بنا', at1 != at0 and len(pg.evaluate(ZA)) == za0 and not any('بیان' in x for x in t), (t, at0, at1))
        pg.keyboard.type(' اور'); pg.wait_for_timeout(300)
        n0 = nt(pg); pg.evaluate("_dioSaveCurrent(); 0"); pg.wait_for_timeout(2200); t = toasts(pg, n0)
        at2 = [r['at'] for r in pg.evaluate(ZR) if r['id'] == 'z1'][0]
        check(f'{tag} C: اوپر کی پٹی کا «محفوظ» — ضمنی محفوظ، بیان نہیں', at2 != at1 and len(pg.evaluate(ZA)) == za0, t)
        to_list(pg)

        # A4: بٹن مقدمہ کی فہرست جیسے (شکل، سائز)
        pg.evaluate("showPage('cases', null)"); pg.wait_for_timeout(1800)
        cm = btn_metrics(pg, "#page-content button[aria-label='پرنٹ']")
        check(f'{tag} A4: فہرست کے بٹن مقدمہ کی فہرست کے بٹنوں جیسے (اونچائی، گولائی، حروف، اندرونی جگہ)', zm and cm and zm[:5] == cm[:5] and 'btn btn-sm' in zm[5], (zm, cm))
        check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:4])
        b.close()


if __name__ == '__main__':
    only = os.environ.get('DIO_ONLY', '')
    for d in (True, False):
        if only and only != ('desktop' if d else 'mobile'): continue
        try: run(d)
        except Exception as e:
            check(('desktop' if d else 'mobile') + ': جانچ رک گئی', False, repr(e)[:400])
    fails = [r for r in R if r[0] == 'FAIL']
    print('\nRESULT: %d PASS, %d FAIL' % (len(R) - len(fails), len(fails)))
    sys.exit(1 if fails else 0)
