"""(v551) اصل ایپ — Desktop + Mobile:
  A) ٹمپلیٹس: «سسٹم کے فارم» کی فہرست (تمام فارم، نام کے ساتھ)، خالی (ڈیٹا نہیں)، کھول کر ترمیم،
     محفوظ (آلہ + سرور)، اصل بحال، پرنٹ (Ctrl+P = پرنٹ بٹن، ایک ہی کاغذ)، شیئر PDF/Word
  B) خودکار: فہرست سے باہر کی دستاویز کھلے تو خالی فارم «خودکار شامل» ہو جائے
  C) شیئر: چالان / ضمنی / واقعاتی رپورٹ / گشت — پوری فائل PDF (پرنٹ جیسی) + Word (جدول + متن)
  D) خودکار انٹیرم چالان: 10 دن بعد، صرف نئے زیر تفتیش مقدمات، دوہرا نہیں، یاددہانی ایک ہی
"""
import sys, json, subprocess, os
from real import *

R = []
def check(name, ok, extra=''):
    R.append(ok)
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra) if (extra != '' and not ok) else ''), flush=True)

def db(pg, t):
    return pg.evaluate(f"JSON.parse(JSON.stringify(window.__db[{json.dumps(t)}] || []))")

def pdf_pages(path):
    info = subprocess.run(['pdfinfo', path], capture_output=True, text=True).stdout
    for l in info.splitlines():
        if l.startswith('Pages:'): return int(l.split()[1])
    return 0

def share_download(pg, opener_js, kind, path):
    pg.evaluate("document.getElementById('dio-share-box') && document.getElementById('dio-share-box').remove()")
    pg.evaluate(opener_js)
    pg.wait_for_selector('#dio-share-box', timeout=20000)
    with pg.expect_download(timeout=90000) as d:
        pg.click(f'#dio-share-box button[data-k="{kind}"]')
    d.value.save_as(path)
    pg.wait_for_timeout(300)
    return path

def run(b, tag, vp, mobile=False):
    ctx, pg, errs = open_app(b, viewport=vp, accept_downloads=True, has_touch=mobile, is_mobile=mobile)
    # ── A) ٹمپلیٹس ──
    pg.evaluate("showPage('templates', null)"); pg.wait_for_timeout(2500)
    pg.wait_for_selector('.dio-tplf tbody tr', timeout=20000)
    n_rows = pg.evaluate("document.querySelectorAll('.dio-tplf tbody tr').length")
    n_sys = pg.evaluate("DIO_SYSTEM_FORMS.length")
    names = pg.evaluate("[...document.querySelectorAll('.dio-tplf td.nm')].map(e=>e.textContent)")
    check(f'{tag} ٹمپلیٹس: سسٹم کے تمام فارم فہرست میں ({n_rows}/{n_sys})', n_rows == n_sys and n_sys >= 35)
    must = ['انڈیکس نقل مسل', 'چالان مکمل', 'انٹیرم چالان', 'سزا سلپ', 'نقشہ موقع', 'RFA فارم', 'CRO کارڈ', 'واقعاتی رپورٹ', 'گشت رپورٹ']
    check(f'{tag} ٹمپلیٹس: اہم فارم نام کے ساتھ', all(any(m in n for n in names) for m in must), [m for m in must if not any(m in n for n in names)])
    check(f'{tag} ٹمپلیٹس: افقی scroll نہیں', pg.evaluate("document.documentElement.scrollWidth <= innerWidth + 1"))
    pg.screenshot(path=f'{OUT}/v551_{tag}_tpl_list.png', full_page=False)
    # خالی: افسر/SHO کا نام، تھانہ، تاریخ کسی فارم میں نہیں
    leak = pg.evaluate("""() => { const bad = []; const vals = ['فیاض حسین شاد', 'صدر ملتان', 'ندیم عباس شاد', 'Fayyaz', '14/10/2026'];
        DIO_SYSTEM_FORMS.forEach(f => { const t = f.html.replace(/<[^>]+>/g, ' '); vals.forEach(v => { if (t.indexOf(v) >= 0) bad.push(f.id + ':' + v); }); }); return bad; }""")
    check(f'{tag} فارم بغیر ڈیٹا (افسر/تھانہ/تاریخ نہیں)', not leak, leak[:5])
    # کھولیں: چالان مکمل — کالم کے نام برقرار
    pg.evaluate("DIOFormsUI.open('r173:mukammal')"); pg.wait_for_selector('#dio-fv-paper'); pg.wait_for_timeout(600)
    heads = pg.evaluate("document.getElementById('dio-fv-paper').innerText")
    check(f'{tag} چالان فارم: کالم/قطار کے نام برقرار', all(w in heads for w in ['ملزمان', 'تفصیل', 'مختصر حالات', 'تھانہ']), heads[:200])
    check(f'{tag} فارم: قابلِ ترمیم', pg.evaluate("document.getElementById('dio-fv-paper').isContentEditable"))
    fits = pg.evaluate("(() => { const z = document.getElementById('dio-fv-zoom').getBoundingClientRect(); return z.right <= innerWidth + 2 && z.left >= -2; })()")
    check(f'{tag} فارم: کاغذ اسکرین میں سمایا (موبائل پر چھوٹا)', fits)
    pg.screenshot(path=f'{OUT}/v551_{tag}_form_open.png')
    # ترمیم + محفوظ
    pg.evaluate("""(() => { const p = document.getElementById('dio-fv-paper'); const s = document.createElement('span');
        s.textContent = 'آزمائشی ترمیم'; s.id = 'v551-edit'; p.firstElementChild.appendChild(s); p.dispatchEvent(new Event('input')); })()""")
    pg.evaluate("window.__toasts=[]; const o=showToast; window.showToast=function(m,t){window.__toasts.push([t,String(m)]);return o.apply(this,arguments)}; 0")
    pg.evaluate("DIOFormsUI.save()"); pg.wait_for_timeout(900)
    t = pg.evaluate("window.__toasts")
    srv = [r for r in db(pg, 'templates') if (r.get('content') or '').startswith('<!--dio-form:r173:mukammal-->')]
    check(f'{tag} ترمیم محفوظ: آلہ + سرور (اور «محفوظ» پیغام)', len(srv) == 1 and 'آزمائشی ترمیم' in srv[0]['content'] and any(x[0] == 'success' for x in t), t)
    pg.evaluate("DIOFormsUI.close()"); pg.wait_for_timeout(300)
    st = pg.evaluate("[...document.querySelectorAll('.dio-tplf tbody tr')].filter(r=>r.textContent.includes('چالان مکمل')).map(r=>r.querySelector('.st').textContent)[0]")
    check(f'{tag} فہرست میں «ترمیم شدہ»', st == 'ترمیم شدہ', st)
    hidden = pg.evaluate("[...document.querySelectorAll('#tpl-table-wrap td')].some(td => td.textContent.includes('فارم رپورٹ'))")
    check(f'{tag} ترمیم شدہ نقل «میرے ٹمپلیٹس» میں دوہری نہیں', not hidden)
    # پرنٹ: بٹن اور Ctrl+P ایک ہی کاغذ
    pg.evaluate("DIOFormsUI.open('r173:mukammal')"); pg.wait_for_selector('#dio-fv-paper'); pg.wait_for_timeout(400)
    pg.evaluate("window.__pp=[]; window._dioDoPrint=function(h){window.__pp.push(h)}; 0")
    pg.evaluate("DIOFormsUI.printOpen()"); pg.keyboard.press('Control+p'); pg.wait_for_timeout(300)
    pp = pg.evaluate("window.__pp")
    check(f'{tag} پرنٹ: Ctrl+P = پرنٹ بٹن (ایک ہی کاغذ، 8.5×13)', len(pp) == 2 and pp[0] == pp[1] and 'size:8.5in 13in' in pp[0] and 'آزمائشی ترمیم' in pp[0])
    # پرنٹ کی اصل PDF (کاغذ)
    p2 = ctx.new_page(); p2.set_content(pp[0]); p2.wait_for_timeout(1500)
    p2.pdf(path=f'{OUT}/v551_{tag}_form_print.pdf', prefer_css_page_size=True, print_background=True); p2.close()
    check(f'{tag} پرنٹ: ایک صفحہ', pdf_pages(f'{OUT}/v551_{tag}_form_print.pdf') == 1)
    # اصل بحال
    pg.evaluate("window.confirm=()=>true; 0")
    pg.evaluate("DIOFormsUI.reset('r173:mukammal', true)"); pg.wait_for_timeout(900)
    srv = [r for r in db(pg, 'templates') if (r.get('content') or '').startswith('<!--dio-form:r173:mukammal-->')]
    check(f'{tag} اصل فارم بحال (سرور کی نقل بھی ہٹی)', not srv and 'آزمائشی ترمیم' not in pg.evaluate("document.getElementById('dio-fv-paper').innerText"))
    # شیئر (فارم): PDF + Word
    f1 = share_download(pg, "DIOFormsUI.shareOpen()", 'pdf', f'{OUT}/v551_{tag}_form.pdf')
    check(f'{tag} فارم شیئر: PDF (8.5×13)', pdf_pages(f1) >= 1 and '612 x 936' in subprocess.run(['pdfinfo', f1], capture_output=True, text=True).stdout)
    f2 = share_download(pg, "DIOFormsUI.shareOpen()", 'word', f'{OUT}/v551_{tag}_form.doc')
    w = open(f2, encoding='utf-8-sig').read()
    check(f'{tag} فارم شیئر: Word (جدول + اردو)', '<table' in w and 'ملزمان' in w and 'urn:schemas-microsoft-com:office:word' in w)
    pg.evaluate("DIOFormsUI.close(true)")

    # ── B) خودکار: فہرست سے باہر کی دستاویز ──
    pg.evaluate("window.__db.cases.push({id:'cX',officer_id:'o1',status:'under',created_at:'2026-10-01T00:00:00Z'}); localStorage.removeItem('dio_forms_auto_v1'); 0")
    pg.evaluate("DIO_SYSTEM_FORMS = DIO_SYSTEM_FORMS.filter(f => f.id !== 'saza_slip'); 0")   # گویا نیا فارم
    pg.evaluate("openCaseWorkspace('cX')"); pg.wait_for_timeout(1300)
    pg.evaluate("_openMisalEditor('saza_slip')"); pg.wait_for_timeout(4500)
    auto = pg.evaluate("JSON.parse(localStorage.getItem('dio_forms_auto_v1')||'[]')")
    check(f'{tag} خودکار: نیا فارم کھلتے ہی ٹمپلیٹس میں «خودکار شامل»', len(auto) == 1 and auto[0]['id'] == 'saza_slip' and 'سزا سلپ' in auto[0]['name'], [a.get('id') for a in auto])
    check(f'{tag} خودکار: فارم میں تاریخ/افسر نہیں', bool(auto) and '14/10/2026' not in auto[0]['html'] and 'فیاض حسین شاد' not in auto[0]['html'])
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}")
    pg.evaluate("showPage('templates', null)"); pg.wait_for_timeout(2200)
    tags = pg.evaluate("[...document.querySelectorAll('.dio-tplf-tag.is-auto')].length")
    check(f'{tag} خودکار فارم فہرست میں نظر آتا ہے', tags == 1)

    # ── C) شیئر — اصل دستاویزات (ڈیٹا سمیت) ──
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
    pg.evaluate("openReport173WithType('mukammal')"); pg.wait_for_timeout(2500)
    bar_btn = pg.evaluate("!!document.getElementById('dio-dv-share')")
    check(f'{tag} دستاویز کی پٹی میں «شیئر» بٹن', bar_btn)
    c1 = share_download(pg, "_dioShareCurrent()", 'pdf', f'{OUT}/v551_{tag}_challan.pdf')
    subprocess.run(['pdftoppm', '-png', '-r', '70', '-f', '1', '-l', '1', c1, f'{OUT}/v551_{tag}_challan'])
    check(f'{tag} چالان شیئر: PDF ایک صفحہ، کاغذ 8.5×13', pdf_pages(c1) == 1 and '612 x 936' in subprocess.run(['pdfinfo', c1], capture_output=True, text=True).stdout)
    c2 = share_download(pg, "_dioShareCurrent()", 'word', f'{OUT}/v551_{tag}_challan.doc')
    w = open(c2, encoding='utf-8-sig').read()
    check(f'{tag} چالان شیئر: Word میں جدول، کالم کے نام اور مقدمے کا ڈیٹا', '<table' in w and 'مختصر حالات' in w and '1234/26' in w and 'mso-rotate' in w)
    # «دونوں» — دو فائلیں
    pg.evaluate("_dioShareCurrent()"); pg.wait_for_selector('#dio-share-box')
    got = []
    pg.on('download', lambda d: got.append(d.suggested_filename))
    pg.click('#dio-share-box button[data-k="both"]'); pg.wait_for_timeout(9000)
    check(f'{tag} «PDF + Word»: دونوں فائلیں', sorted(x.split('.')[-1] for x in got) == ['doc', 'pdf'], got)
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}")
    # واقعاتی رپورٹ (موجودہ رپورٹ کا کاغذ)
    pg.evaluate("showPage('incident', null)"); pg.wait_for_timeout(1500); pg.evaluate("_irNew()"); pg.wait_for_timeout(1500)
    i1 = share_download(pg, "_irShare()", 'pdf', f'{OUT}/v551_{tag}_incident.pdf')
    check(f'{tag} واقعاتی رپورٹ شیئر: PDF (A4)', pdf_pages(i1) >= 1 and '595 x 842' in subprocess.run(['pdfinfo', i1], capture_output=True, text=True).stdout)
    subprocess.run(['pdftoppm', '-png', '-r', '70', '-f', '1', '-l', '1', i1, f'{OUT}/v551_{tag}_incident'])

    # ── D) خودکار انٹیرم چالان ──
    pg.evaluate("""(() => {
      window.__db.cases.push({ id:'cI', officer_id:'o1', fir_number:'777/26', fir_date:'2026-10-14', status:'under',
        complainant:'ملک ارشد ولد ملک نواز قوم آرائیں سکنہ ملتان', section_of_law:'379 ت پ', created_at:'2026-10-14T10:00:00Z' });
      window.__db.cases.push({ id:'cOld', officer_id:'o1', fir_number:'100/26', fir_date:'2026-09-01', status:'under', created_at:'2026-09-01T10:00:00Z' });
      window.__db.cases.push({ id:'cDone', officer_id:'o1', fir_number:'778/26', fir_date:'2026-10-14', status:'complete', created_at:'2026-10-14T11:00:00Z' });
      window.__db.reminders = window.__db.reminders || [];
      window.__db.reminders.push({ id:'remI', officer_id:'o1', is_done:false, reminder_date:'2026-10-24',
        text:'انٹیرم چالان — مقدمہ FIR 777/26 (ملک ارشد) — 10 دن مکمل: سسٹم خودکار انٹیرم چالان بنائے گا، جائزہ لے کر پیش کریں' });
      localStorage.removeItem('dio_auto_interim_done_v1');
      try { offlineStore.clear && offlineStore.clear('cases_cache'); } catch(e) {}
      return 0; })()""")
    r0 = pg.evaluate("DIO.autoInterim.run({silent:true})")
    check(f'{tag} انٹیرم: 10 دن سے پہلے نہیں بنتا', r0.get('made', 0) == 0, r0)
    pg.evaluate("window.__realDate = Date; (function(){ const T = new window.__realDate('2026-10-24T09:00:00+05:00').getTime(); const D = window.__realDate;"
                " function F(...a){ return a.length ? new D(...a) : new D(T); } F.now=()=>T; F.UTC=D.UTC; F.parse=D.parse; F.prototype=D.prototype; window.Date = F; })(); 0")
    r1 = pg.evaluate("DIO.autoInterim.run({silent:true})")
    rows = [r for r in db(pg, 'report_173') if r.get('case_id') == 'cI' and r.get('report_type') == 'interim']
    check(f'{tag} انٹیرم: 10ویں دن خودکار بنا (report_173، نام «انٹیرم چالان»)', r1.get('made') == 1 and len(rows) == 1 and 'انٹیرم چالان' in rows[0]['form_data']['head'], r1)
    other = [r for r in db(pg, 'report_173') if r.get('case_id') in ('cOld', 'cDone')]
    check(f'{tag} انٹیرم: پرانے / غیر زیر تفتیش مقدمات میں نہیں', not other, other)
    rem = [r for r in db(pg, 'reminders') if '777/26' in (r.get('text') or '')]
    check(f'{tag} انٹیرم: یاددہانی ایک ہی — «تیار» میں بدلی', len(rem) == 1 and 'انٹیرم چالان تیار' in rem[0]['text'], rem)
    pg.evaluate("localStorage.removeItem('dio_auto_interim_done_v1'); 0")
    r2 = pg.evaluate("DIO.autoInterim.run({silent:true})")
    rows = [r for r in db(pg, 'report_173') if r.get('case_id') == 'cI' and r.get('report_type') == 'interim']
    check(f'{tag} انٹیرم: دوبارہ چلنے پر دوہرا نہیں', r2.get('made') == 0 and len(rows) == 1)
    pg.evaluate("window.Date = window.__realDate; 0")
    st = [c for c in db(pg, 'cases') if c['id'] == 'cI'][0]['status']
    check(f'{tag} انٹیرم: مقدمے کی حالت «زیر تفتیش» ہی', st == 'under', st)
    # محفوظ چالانوں کی فہرست میں، اور کھولنے پر مقدمے کے ڈیٹا سے بھرا فارم
    pg.evaluate("openCaseWorkspace('cI')"); pg.wait_for_timeout(1500)
    pg.evaluate("openReport173WithType('list')"); pg.wait_for_timeout(2000)
    lst = pg.evaluate("document.getElementById('workspace-editor-area').innerText")
    check(f'{tag} انٹیرم: محفوظ چالانوں کی فہرست میں «انٹیرم چالان»', 'انٹیرم چالان (خودکار' in lst, lst[:200])
    pg.screenshot(path=f'{OUT}/v551_{tag}_interim_list.png')
    did = rows[0]['id']
    pg.evaluate(f"_r173OpenDoc('{did}')"); pg.wait_for_timeout(2500)
    doc = pg.evaluate("(document.getElementById('ch173-doc')||{}).innerText || ''")
    check(f'{tag} انٹیرم: کھولنے پر فارم مقدمے کے ڈیٹا سے بھرا', 'انٹیرم' in doc and '777/26' in doc and 'ملک ارشد' in doc, doc[:200])
    pg.screenshot(path=f'{OUT}/v551_{tag}_interim_open.png')
    check(f'{tag} کوئی JS خرابی نہیں', not errs, errs[:4])
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch()
    run(b, 'desktop', {'width': 1366, 'height': 900})
    run(b, 'mobile', {'width': 390, 'height': 844}, mobile=True)
    b.close()
print('\nFAILS:', R.count(False), 'of', len(R)); sys.exit(1 if False in R else 0)
