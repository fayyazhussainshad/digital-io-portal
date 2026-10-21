"""(v557) اصل ایپ کی جانچ — Desktop + Mobile

افسر کی فہرست (22 اکتوبر 2026):
  1) «نیا اندراج — 5-C درخواست» سے «مضمون / خلاصہ» کا خانہ ختم
     (پرانی درخواستوں کا محفوظ خلاصہ مٹتا نہیں — ترمیم پر بھی جوں کا توں)
  2) 5-C درخواست کسی مقدمے سے متعلق ہو تو وہ اُس مقدمے کے اندر بھی نظر آئے:
     مقدمے کی چِپ پٹی میں «5-C درخواستیں (n)» — صرف اُسی مقدمے میں جس سے جڑی ہو؛
     دبانے پر پورے صفحے میں اسی مقدمے کی درخواستیں (جواب / پرنٹ / PDF / شیئر / حذف)
     اور «+ 5-C درخواست درج کریں» (یہ مقدمہ پہلے سے منتخب)

چلانا: README.md — `python3 v557_test.py`
"""
import sys, os, json
sys.path.insert(0, '.')
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v557/'
os.makedirs(V, exist_ok=True)

SEED = """(() => { const d = window.__db;
  d.cases.push({ id: 'c2', officer_id: 'o1', fir_number: '777/26', section_of_law: '324 ت پ', status: 'under',
    complainant: 'غلام عباس ولد اللہ بخش', created_at: '2026-10-09T00:00:00Z' });
  // پرانی درخواست — کسی مقدمے سے نہیں جڑی، محفوظ خلاصہ کے ساتھ
  d.applications_5c = [{ id: 'ap1', officer_id: 'o1', serial_number: 1, complainant_name: 'پرانا درخواست گزار',
    subject: 'پرانا خلاصہ — زمین کا تنازعہ', status: 'received', created_at: '2026-10-01T00:00:00Z' }];
  d.application_5c_numbers = [{ id: 'n1', application_5c_id: 'ap1', application_number: '5C-11' }];
  d.application_5c_attachments = [];
  return Promise.all(d.cases.map(c => offlineStore.cache('cases_cache', JSON.parse(JSON.stringify(c))))).then(() => 0); })()"""
# اصل ڈیٹابیس serial_number خود دیتا ہے — آزمائشی ڈیٹابیس میں ہم دیتے ہیں
SERIAL = """(() => { let n = 1; (window.__db.applications_5c || []).forEach(a => { if (a.serial_number == null) a.serial_number = ++n + 10; }); return 0; })()"""

def db(pg, t): return pg.evaluate(f"JSON.parse(JSON.stringify(window.__db[{json.dumps(t)}] || []))")

def ws(pg, cid='c1'):
    pg.evaluate("try{_dioResetTabs&&_dioResetTabs()}catch(e){} try{_dioExitDocView()}catch(e){} try{closeModal()}catch(e){} 0")
    pg.evaluate(f"openCaseWorkspace('{cid}')"); pg.wait_for_timeout(1600)

def chip(pg):
    return pg.evaluate("(() => { const s = document.getElementById('f5c-case-chip'); const c = s && s.querySelector('.mdoc-chip'); return c ? c.textContent.replace(/\\s+/g, ' ').trim() : ''; })()")

def fill_5c(pg, mobile, name, number):
    if mobile:
        pg.fill('#f5c-name-n', name)
    else:
        pg.fill('#f5c-name', name)
    pg.fill('.f5c-num-row [data-field="application_number"]', number)

def run(b, tag, args, mobile):
    ctx, pg, errs = open_app(b, **args)
    pg.on('dialog', lambda d: d.accept())
    pg.evaluate(SEED)
    pg.evaluate("dioLoadScript('fivec.js')"); pg.wait_for_timeout(500)
    sec = ''
    def section(n):
        nonlocal sec; sec = n; print('── ' + tag + ': ' + n, flush=True)
    try:
        # ── 1) «مضمون / خلاصہ» کا خانہ نہیں ───────────────────────────────
        section('5-C کارڈ')
        pg.evaluate("DIOEntry.hub()"); pg.wait_for_timeout(400)
        pg.click(".dio-hub button:has-text('5-C')"); pg.wait_for_timeout(1200)
        body = pg.evaluate("document.getElementById('modal-body').innerText")
        title = pg.evaluate("document.getElementById('modal-title').textContent")
        check(f'{tag}: 5-C کارڈ — «مضمون / خلاصہ» کا خانہ نہیں', 'مضمون' not in body and 'خلاصہ' not in body
              and not pg.evaluate("!!document.getElementById('f5c-subject')"), title)
        check(f'{tag}: 5-C کارڈ — «متعلقہ مقدمہ (اختیاری)» موجود، دونوں مقدمات فہرست میں',
              'متعلقہ مقدمہ' in body and pg.evaluate("[...document.querySelectorAll('#dio-case option')].map(o => o.value).filter(Boolean).sort().join()") == 'c1,c2')
        pg.screenshot(path=f'{V}{tag}_1_card.png')

        # ── 2) مقدمہ 1234/26 سے جوڑ کر محفوظ ──────────────────────────────
        section('مقدمے سے جوڑ کر محفوظ')
        pg.select_option('#dio-case', 'c1')
        fill_5c(pg, mobile, 'زاہد اقبال ولد فیض احمد', '5C-101')
        pg.click("#modal-footer .btn-primary"); pg.wait_for_timeout(1500)
        pg.evaluate(SERIAL)
        apps = [a for a in db(pg, 'applications_5c') if a.get('complainant_name') == 'زاہد اقبال ولد فیض احمد']
        check(f'{tag}: محفوظ — case_id = c1، مقدمہ نمبر 1234/26، خلاصہ کا خانہ نہیں بھیجا',
              len(apps) == 1 and apps[0].get('case_id') == 'c1' and apps[0].get('fir_number') == '1234/26' and 'subject' not in apps[0], apps)

        # ── 3) مقدمے کے اندر chip ────────────────────────────────────────
        section('مقدمے میں chip')
        ws(pg, 'c1')
        check(f'{tag}: مقدمہ 1234/26 — چِپ پٹی میں «5-C درخواستیں (1)»', chip(pg) == '5-C درخواستیں (1)', chip(pg))
        pg.screenshot(path=f'{V}{tag}_2_chip.png')
        ws(pg, 'c2')
        check(f'{tag}: مقدمہ 777/26 (کوئی درخواست نہیں جڑی) — chip نہیں', chip(pg) == '', chip(pg))

        # ── 4) chip → پورے صفحے میں اسی مقدمے کی درخواستیں ─────────────────
        section('مقدمے کی 5-C فہرست')
        ws(pg, 'c1')
        pg.click('#f5c-case-chip .mdoc-chip'); pg.wait_for_timeout(1500)
        st = pg.evaluate("""(() => ({ full: !!document.getElementById('dio-docview'),
            tab: [...document.querySelectorAll('#dio-dv-tabs span')].map(s => s.textContent.replace('✕','').trim()).filter(Boolean),
            head: (document.querySelector('#f5c-case-view .dio-hs1') || {}).textContent || '',
            rows: [...document.querySelectorAll('#f5c-case-rows tr')].map(r => r.children[1] && r.children[1].innerText.trim()) }))()""")
        check(f'{tag}: پورا صفحہ، ٹیب «5-C درخواستیں»، سرخی میں مقدمہ نمبر، صرف اسی مقدمے کی درخواست',
              st['full'] and '5-C درخواستیں' in st['tab'] and '1234/26' in st['head']
              and len(st['rows']) == 1 and st['rows'][0].startswith('زاہد اقبال'), st)
        btns = pg.evaluate("[...document.querySelectorAll('#f5c-case-rows tr:first-child td:last-child [title]')].map(b => b.getAttribute('title'))")
        check(f'{tag}: ہر درخواست کے ساتھ وہی بٹن — ترمیم، فائل، جواب، پرنٹ، PDF، شیئر، حذف',
              all(any(k in t for t in btns) for k in ['ترمیم', 'فائل', 'جواب', 'پرنٹ', 'PDF', 'شیئر', 'حذف']), btns)
        pg.screenshot(path=f'{V}{tag}_3_list.png')
        if mobile:
            ov = pg.evaluate("document.documentElement.scrollWidth - window.innerWidth")
            check(f'{tag}: موبائل — صفحہ اسکرین سے باہر نہیں پھیلتا', ov <= 1, ov)

        # ── 5) فہرست سے نئی درخواست — یہ مقدمہ پہلے سے منتخب ──────────────
        section('فہرست سے نئی درخواست')
        pg.click('#f5c-case-view .dio-add-btn'); pg.wait_for_timeout(1200)
        check(f'{tag}: «+ 5-C درخواست درج کریں» — مقدمہ 1234/26 پہلے سے منتخب', pg.evaluate("document.getElementById('dio-case').value") == 'c1')
        fill_5c(pg, mobile, 'رشید احمد', '5C-202')
        pg.click("#modal-footer .btn-primary"); pg.wait_for_timeout(1800)
        pg.evaluate(SERIAL)
        n_rows = pg.evaluate("document.querySelectorAll('#f5c-case-rows tr').length")
        check(f'{tag}: محفوظ کرنے کے بعد فہرست اور chip خود تازہ (2)، مقدمہ کھلا رہا',
              n_rows == 2 and chip(pg) == '5-C درخواستیں (2)' and pg.evaluate("!!document.getElementById('misal-doc-bar')"), (n_rows, chip(pg)))

        # ── 6) فہرست سے حذف — مقدمہ کا صفحہ نہیں مٹتا ──────────────────────
        section('حذف')
        pg.evaluate("_f5cRenderCaseList('c1')"); pg.wait_for_timeout(900)
        pg.click("#f5c-case-rows tr:has-text('رشید احمد') [title='حذف']"); pg.wait_for_timeout(1800)
        n_rows = pg.evaluate("document.querySelectorAll('#f5c-case-rows tr').length")
        check(f'{tag}: حذف کے بعد فہرست (1) اور chip (1)، مقدمہ کا صفحہ برقرار (5-C صفحہ اوپر نہیں آیا)',
              n_rows == 1 and chip(pg) == '5-C درخواستیں (1)' and pg.evaluate("!!document.getElementById('misal-doc-bar') && !document.getElementById('fivec-search')"),
              (n_rows, chip(pg)))

        # ── 7) پرانی درخواست: ترمیم سے خلاصہ نہیں مٹتا؛ مقدمے سے بعد میں جوڑنا ──
        section('پرانی درخواست')
        pg.evaluate("open5CForm('ap1')"); pg.wait_for_timeout(1200)
        check(f'{tag}: پرانی درخواست کی ترمیم — خلاصہ کا خانہ نہیں', not pg.evaluate("!!document.getElementById('f5c-subject')"))
        pg.select_option('#dio-case', 'c2')
        pg.click("#modal-footer .btn-primary"); pg.wait_for_timeout(1500)
        ap1 = [a for a in db(pg, 'applications_5c') if a['id'] == 'ap1'][0]
        check(f'{tag}: ترمیم کے بعد پرانا خلاصہ جوں کا توں، اب مقدمہ 777/26 سے جڑی',
              ap1.get('subject') == 'پرانا خلاصہ — زمین کا تنازعہ' and ap1.get('case_id') == 'c2' and ap1.get('fir_number') == '777/26', ap1)
        ws(pg, 'c2')
        check(f'{tag}: مقدمہ 777/26 میں اب chip «5-C درخواستیں (1)»', chip(pg) == '5-C درخواستیں (1)', chip(pg))

        # ── 8) آف لائن بھی chip ─────────────────────────────────────────
        section('آف لائن')
        ctx.set_offline(True); pg.wait_for_timeout(300)
        ws(pg, 'c1')
        check(f'{tag}: آف لائن — مقدمہ 1234/26 میں chip آلے کے ریکارڈ سے (1)', chip(pg) == '5-C درخواستیں (1)', chip(pg))
        ctx.set_offline(False); pg.wait_for_timeout(800)

        # ── 9) 5-C کا اپنا صفحہ پہلے کی طرح ────────────────────────────────
        section('5-C صفحہ')
        pg.evaluate("try{_dioResetTabs&&_dioResetTabs()}catch(e){} try{_dioExitDocView()}catch(e){} 0")
        pg.evaluate("showPage('fivec', null)"); pg.wait_for_timeout(1500)
        rows = pg.evaluate("[...document.querySelectorAll('#f5c-rows tr')].map(r => r.children[1] && r.children[1].innerText.replace(/\\s+/g,' ').trim())")
        check(f'{tag}: 5-C صفحہ — تمام درخواستیں، ہر جڑی درخواست کے نام کے نیچے مقدمہ نمبر',
              len(rows) == 2 and any('1234/26' in r for r in rows) and any('777/26' in r for r in rows), rows)
        pg.screenshot(path=f'{V}{tag}_4_page.png')
    except Exception as e:
        check(f'{tag}: section crashed: {sec}', False, repr(e)[:300])

    check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:3])
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch()
    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'): run(b, 'desktop', dict(viewport={'width': 1366, 'height': 768}), False)
    if only in ('', 'mobile'): run(b, 'mobile', dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2), True)
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
