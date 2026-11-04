"""(v567) انڈیکس نقل مسل — «بنام» میں FIR اور کراس ورژن کے ملزمان الگ الگ (افسر کا حکم، 4 نومبر 2026)
اصل ایپ (Desktop 1366×768 + Mobile 390×844)، سکرین + «پرنٹ» بٹن = Ctrl+P۔

  • کراس ورژن والا مقدمہ: FIR کے «بنام» میں صرف FIR کے ملزمان؛ نیچے «کراس ورژن» — کراس کا مدعی (رابطہ / شناختی
    کارڈ سمیت) اور صرف کراس کے ملزمان
  • کراس ورژن کا اندراج نہ ہو مگر کراس کے ملزمان درج ہوں: کراس کا حصہ پھر بھی الگ (FIR میں ملے جلے نہیں)
  • کراس کے بغیر مقدمہ: پہلے جیسا (4 «بنام»، کراس کا حصہ نہیں)؛ 18 ضمنیاں بھی ایک Folio صفحہ
چلانا: `python3 v567_test.py` — ایک ہی: DIO_ONLY=desktop|mobile
"""
import sys, os, re, json, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)

V = OUT + '/v567/'
os.makedirs(V, exist_ok=True)
SEED = """(() => { const d = window.__db;
  const c1 = d.cases.find(c => c.id === 'c1');
  Object.assign(c1, { fir_number: '663/26', fir_date: '2026-10-09', complainant_cell: '03001234567', complainant_cnic: '3630212345671',
    cross_complainant: 'محمد اکرم ولد غلام قادر قوم جٹ سکنہ چک 5 فیض ملتان', cross_complainant_cell: '03111234567', cross_complainant_cnic: '3630298765431' });
  d.cases = d.cases.filter(c => c.id === 'c1');
  d.cases.push({ id: 'c2', officer_id: 'o1', fir_number: '700/26', section_of_law: '380 ت پ', status: 'under', complainant: 'رشید احمد ولد فضل دین',
    occurrence_date: '2026-10-20', fir_date: '2026-10-20', created_at: '2026-10-20T00:00:00Z' });
  d.cases.push({ id: 'c3', officer_id: 'o1', fir_number: '701/26', section_of_law: '379 ت پ', status: 'under', complainant: 'ناصر علی ولد شوکت علی',
    occurrence_date: '2026-10-21', fir_date: '2026-10-21', created_at: '2026-10-21T00:00:00Z' });
  d.case_accused = [
    { id: 'a1', case_id: 'c1', name: 'محمد شفیق ولد رفیق', accused_type: 'fir', cell: '03017654321', cnic: '3630276543211', created_at: '2026-10-08T01:00:00Z' },
    { id: 'a2', case_id: 'c1', name: 'غلام عباس ولد اللہ دتہ', accused_type: 'fir', created_at: '2026-10-08T02:00:00Z' },
    { id: 'a3', case_id: 'c1', name: 'ناصر محمود ولد بشیر', accused_type: 'cross_version', cell: '03221112223', cnic: '3630211122231', created_at: '2026-10-08T03:00:00Z' },
    { id: 'a4', case_id: 'c1', name: 'طارق جمیل ولد نذیر', accused_type: 'cross_version', created_at: '2026-10-08T04:00:00Z' },
    { id: 'b1', case_id: 'c2', name: 'اکیلا ملزم ولد فلاں', accused_type: 'fir', created_at: '2026-10-20' },
    { id: 'd1', case_id: 'c3', name: 'ایف آئی آر ملزم ولد الف', created_at: '2026-10-21T01:00:00Z' },
    { id: 'd2', case_id: 'c3', name: 'کراس ملزم ولد ب', accused_type: 'cross_version', created_at: '2026-10-21T02:00:00Z' } ];
  d.officers_directory = [{ id: 'o1', full_name: 'فیاض حسین شاد', designation: 'ASI' }];
  d.zimni_reports = [
    { id: 'zc1', case_id: 'c1', serial_no: 1, report_date: '2026-10-11', officer_id: 'o1', content: { zno: '1', col1_date: '11/10/2026' } },
    { id: 'zc2', case_id: 'c1', serial_no: 2, report_date: '2026-10-12', officer_id: 'o1', content: { zno: '2', col1_date: '12/10/2026' } },
    { id: 'zc3', case_id: 'c1', serial_no: 3, report_date: '2026-10-13', officer_id: 'o1', content: { zno: '3', col1_date: '13/10/2026' } } ];
  return Promise.all(d.cases.map(c => offlineStore.cache('cases_cache', JSON.parse(JSON.stringify(c))))).then(() => 0); })()"""
READ = """(() => { const ed = document.getElementById('misal-editor'); if (!ed) return null;
  const t = (id) => { const e = document.getElementById(id); return e ? e.textContent.replace(/[\\s\\u00A0]+/g, ' ').trim() : null; };
  const fir = [1, 2, 3, 4].map(i => t('idxn-name-' + i));
  const xs = [...ed.querySelectorAll('#idxn-xv-acc .idxn-x-slot')].map(s => s.getAttribute('data-i'));
  const xv = xs.map(i => ({ n: t('idxn-x-name-' + i), cell: t('idxn-x-cell-' + i), cnic: t('idxn-x-cnic-' + i) }));
  const P = ed.querySelector('#idxn-parties');
  const order = P ? [...P.querySelectorAll('[id]')].map(e => e.id).filter(id => /^(idxn-complainant|idxn-name-\\d|idxn-xv-head|idxn-x-complainant|idxn-x-name-\\d)$/.test(id)) : [];
  const L = [...ed.querySelectorAll('#idxn-parties .fill-line')].filter(s => /cnic|name|complainant/.test(s.id)).map(s => Math.round(s.getBoundingClientRect().left));
  return { fir, xv, hasXv: !!document.getElementById('idxn-xv'), head: t('idxn-xv-head'), xc: t('idxn-x-complainant'),
    xcell: t('idxn-x-mudai-cell'), xcnic: t('idxn-x-mudai-cnic'), order, firCell1: t('idxn-cell-1'), lefts: [Math.min(...L), Math.max(...L)] }; })()"""


def open_index(pg, cid):
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; try{closeModal()}catch(e){}")
    pg.evaluate(f"openCaseWorkspace('{cid}')"); pg.wait_for_timeout(1500)
    pg.evaluate("_doAddMisalDoc('index_naql')"); pg.wait_for_timeout(500)      # افسر کا راستہ: «انڈیکس نقل مسل» کی چِپ
    pg.evaluate("_openMisalEditor('index_naql')"); pg.wait_for_selector('#misal-editor'); pg.wait_for_timeout(1800)
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)


def print_html(pg, how):
    pg.evaluate("document.getElementById('dio-print-frame') && document.getElementById('dio-print-frame').remove(); 0")
    if how == 'button':
        pg.evaluate("_dioPrintCurrent()")
    else:
        pg.click('#misal-editor', position={'x': 200, 'y': 40}); pg.keyboard.press('Control+p')
    pg.wait_for_timeout(900)
    return pg.evaluate("document.getElementById('dio-print-frame') ? document.getElementById('dio-print-frame').contentDocument.documentElement.outerHTML : ''")


def run(desktop):
    tag = 'desktop' if desktop else 'mobile'
    with sync_playwright() as p:
        b = p.chromium.launch()
        vp = {'width': 1366, 'height': 768} if desktop else {'width': 390, 'height': 844}
        extra = {} if desktop else {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}
        ctx, pg, errs = open_app(b, viewport=vp, **extra)
        pg.evaluate(SEED)

        # ═══ کراس ورژن والا مقدمہ ═══
        open_index(pg, 'c1')
        m = pg.evaluate(READ)
        check(f'{tag}: FIR کے «بنام» میں صرف FIR کے ملزمان (کراس کا کوئی نہیں)',
              m and sorted([x for x in m['fir'] if x]) == sorted(['محمد شفیق ولد رفیق', 'غلام عباس ولد اللہ دتہ']), m and m['fir'])
        check(f'{tag}: FIR کے «بنام» کی 4 جگہیں (فارم جیسا)، خالی جگہیں خالی', m and len(m['fir']) == 4 and m['fir'].count('') == 2, m and m['fir'])
        check(f'{tag}: «کراس ورژن» کا حصہ — سرخی، کراس کا مدعی', m and m['hasXv'] and m['head'] == 'کراس ورژن' and m['xc'] == 'محمد اکرم ولد غلام قادر قوم جٹ سکنہ چک 5 فیض ملتان', m and [m['head'], m['xc']])
        check(f'{tag}: کراس کے مدعی کا رابطہ / شناختی کارڈ (0000-0000000 / 00000-0000000-0)', m and m['xcell'] == '0311-1234567' and m['xcnic'] == '36302-9876543-1', m and [m['xcell'], m['xcnic']])
        check(f'{tag}: کراس کے «بنام» میں صرف کراس کے ملزمان، رابطہ / شناختی کارڈ کے ساتھ',
              m and sorted(x['n'] for x in m['xv']) == sorted(['ناصر محمود ولد بشیر', 'طارق جمیل ولد نذیر'])
              and any(x['cell'] == '0322-1112223' and x['cnic'] == '36302-1112223-1' for x in m['xv']), m and m['xv'])
        check(f'{tag}: ترتیب — سرکار، FIR بنام (4)، «کراس ورژن»، کراس سرکار، کراس بنام',
              m and m['order'][:5] == ['idxn-complainant', 'idxn-name-1', 'idxn-name-2', 'idxn-name-3', 'idxn-name-4']
              and m['order'][5:7] == ['idxn-xv-head', 'idxn-x-complainant'] and all(x.startswith('idxn-x-name-') for x in m['order'][7:]), m and m['order'])
        check(f'{tag}: تمام نقطہ دار لکیریں ایک ہی کنارے پر (کراس کا حصہ بھی)', m and m['lefts'][1] - m['lefts'][0] <= 1, m and m['lefts'])
        pg.evaluate("(() => { const e = document.getElementById('idxn-xv'); if (e) e.scrollIntoView({ block: 'center' }); return 0; })()"); pg.wait_for_timeout(300)
        pg.screenshot(path=V + f'{tag}_01_index_cross.png')
        hb = print_html(pg, 'button')
        check(f'{tag}: پرنٹ (بٹن) — «کراس ورژن» اور کراس کے ملزمان کاغذ پر، FIR کے حصے میں کراس ملزم نہیں',
              'کراس ورژن' in hb and 'طارق جمیل ولد نذیر' in hb and re.search(r'id="idxn-name-\d"[^>]*>[^<]*ناصر محمود', hb) is None, len(hb))
        if desktop:
            hk = print_html(pg, 'ctrlp')
            body = lambda h: re.sub(r'<script[\s\S]*?</script>', '', h.split('<body', 1)[-1])
            check(f'{tag}: Ctrl+P = «پرنٹ» بٹن (وہی کاغذ)', hk and body(hk) == body(hb), (len(hk), len(hb)))
        pp = pg.context.new_page(); pp.set_content(hb); pp.wait_for_timeout(1500); pp.evaluate("document.fonts.ready")
        pp.pdf(path=V + f'{tag}_index_cross.pdf', prefer_css_page_size=True, print_background=True); pp.close()
        subprocess.run(['pdftoppm', '-png', '-r', '70', V + f'{tag}_index_cross.pdf', V + f'{tag}_index_cross'])
        info = subprocess.run(['pdfinfo', V + f'{tag}_index_cross.pdf'], capture_output=True, text=True).stdout
        npg = int(re.search(r'Pages:\s+(\d+)', info).group(1))
        check(f'{tag}: کاغذ Folio (8.5×13in)', re.search(r'Page size:\s+612 x 936', info) is not None, [l for l in info.splitlines() if 'Page size' in l or 'Pages' in l])
        # کراس کا حصہ لمبا — «انڈکس ضمنیات» کی جدول بیچ میں نہ ٹوٹے: پوری ایک ہی صفحے پر (سرخی سمیت)
        txt = [subprocess.run(['pdftotext', '-f', str(i), '-l', str(i), V + f'{tag}_index_cross.pdf', '-'], capture_output=True, text=True).stdout for i in range(1, npg + 1)]
        D3 = ['11/10/2026', '12/10/2026', '13/10/2026']
        zpage = [i + 1 for i, t in enumerate(txt) if any(d in t for d in D3)]
        check(f'{tag}: «انڈکس ضمنیات» کی جدول بیچ میں نہیں ٹوٹی — تینوں ضمنیاں ایک ہی صفحے پر', len(zpage) == 1 and all(d in txt[zpage[0] - 1] for d in D3), (npg, zpage))
        pg.evaluate("document.getElementById('dio-print-frame') && document.getElementById('dio-print-frame').remove(); 0")

        # ═══ کراس ورژن کا اندراج نہیں، مگر کراس کا ملزم درج ═══
        open_index(pg, 'c3')
        m3 = pg.evaluate(READ)
        check(f'{tag}: کراس کا اندراج نہیں مگر کراس ملزم — FIR میں صرف FIR کا، کراس کا الگ حصے میں',
              m3 and [x for x in m3['fir'] if x] == ['ایف آئی آر ملزم ولد الف'] and m3['hasXv'] and [x['n'] for x in m3['xv']] == ['کراس ملزم ولد ب'], m3)

        # ═══ کراس کے بغیر مقدمہ — پہلے جیسا ═══
        open_index(pg, 'c2')
        m2 = pg.evaluate(READ)
        check(f'{tag}: کراس کے بغیر مقدمہ — کراس کا حصہ نہیں، 4 «بنام»، ملزم پہلی جگہ پر', m2 and not m2['hasXv'] and len(m2['fir']) == 4 and m2['fir'][0] == 'اکیلا ملزم ولد فلاں', m2)
        pg.evaluate("""(() => { for (let i = 1; i <= 18; i++) window.__db.zimni_reports.push({ id: 'zz' + i, case_id: 'c2', serial_no: i, report_date: '2026-10-' + String(10 + (i % 18)).padStart(2, '0'), officer_id: 'o1' }); return 0; })()""")
        open_index(pg, 'c2')
        h18 = print_html(pg, 'button')
        pp = pg.context.new_page(); pp.set_content(h18); pp.wait_for_timeout(1500); pp.evaluate("document.fonts.ready")
        pp.pdf(path=V + f'{tag}_index_18.pdf', prefer_css_page_size=True, print_background=True); pp.close()
        info = subprocess.run(['pdfinfo', V + f'{tag}_index_18.pdf'], capture_output=True, text=True).stdout
        check(f'{tag}: (regression) کراس کے بغیر مقدمہ، 18 ضمنیاں — ایک Folio صفحہ', re.search(r'Pages:\s+1\n', info) is not None, [l for l in info.splitlines() if 'Pages' in l])
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
