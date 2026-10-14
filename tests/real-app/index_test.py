"""انڈیکس نقل مسل — اصل ایپ کی جانچ (Desktop + Mobile، سکرین + Ctrl+P / «پرنٹ» بٹن)۔

جانچ: ترمیمی پٹی نہیں · «محفوظ» / «منظوری» بٹن نہیں · اوپر اور پہلی سطر کے بعد ایک سطر کی جگہ ·
«ضلع» کنارے پر نہیں کٹتا · تاریخیں ایک ہی سطر میں · جدول کی اونچائی (+1 انچ) · جدول کے بعد اور
«انڈکس ضمنیات» سے پہلے ایک سطر کی جگہ · نقطہ دار لکیریں برابر · ضمنیاں خود بخود (نمبر شمار، تاریخ،
تفتیشی افسر) — ضمنی نہ ہو تو نمبر خالی · ضمنیات کی جدول 2/2 کالم، کوئی خانہ نہیں ٹوٹتا۔

چلانا: README.md (اسی فولڈر میں) — `python3 index_test.py`
"""
import sys, json, subprocess, re
sys.path.insert(0, '.')
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra) if extra != '' else ''), flush=True)

SEED = """(() => {
  const d = window.__db;
  const c = d.cases.find(x => x.id === 'c1');
  c.fir_date = '2026-10-09';
  c.complainant_cell = '03001234567';
  c.complainant_cnic = '3630212345671';
  d.case_accused[0].cell = '03017654321'; d.case_accused[0].cnic = '3630276543211';
  d.officers_directory = [{ id: 'o1', full_name: 'فیاض حسین شاد', designation: 'ASI' },
                          { id: 'o9', full_name: 'محمد عبدالرحمن خان', designation: 'SI' }];
  d.zimni_reports = [];
  return 0; })()"""

# اندر کی ناپ — px میں (96px = 1 انچ)
MEASURE = """(() => {
  const ed = document.getElementById('misal-editor'); if (!ed) return null;
  const r = el => el ? el.getBoundingClientRect() : null;
  const tbl = ed.querySelector('#idxn-main');
  const zt  = ed.querySelector('#idxz-table');
  const lines = [...ed.querySelectorAll('.fill-line')].map(s => { const b = r(s); return { id: s.id, left: Math.round(b.left), right: Math.round(b.right), w: Math.round(b.width) }; });
  const oneLine = el => { if (!el) return true; const lh = parseFloat(getComputedStyle(el).lineHeight) || 30;
    const range = document.createRange(); range.selectNodeContents(el); const rects = [...range.getClientRects()];
    const tops = new Set(rects.map(x => Math.round(x.top))); return tops.size <= 1 && el.scrollWidth <= el.clientWidth + 1; };
  const dates = [...ed.querySelectorAll('#idxn-main td:nth-child(2), #idxn-main td:nth-child(3)')];
  const zCells = [...ed.querySelectorAll('#idxz-table td')];
  const heading = ed.querySelector('#idxn-head');
  // کالم وار ترتیب (پہلا حصہ اوپر سے نیچے، پھر دوسرا)
  const colwise = sel => { const rows = [...zt.querySelectorAll('tr')].slice(1).map(tr => [...tr.querySelectorAll(sel)].map(t => t.textContent.trim()));
    return [0, 1].flatMap(g => rows.map(r => r[g])); };
  // موبائل پر کاغذ zoom میں — ناپ کو اصل (کاغذ کے) px میں بدلو
  const k = ed.getBoundingClientRect().width / 816;
  const dst = ed.querySelector('#idxn-dst');
  return {
    toolbar: !!document.querySelector('#workspace-editor-area .editor-toolbar'),
    savedBox: !!document.querySelector('#workspace-editor-area #dio-saved-box'),
    barButtons: [...document.querySelectorAll('#dio-dv-bar button')].filter(b => b.offsetParent !== null || getComputedStyle(b).display !== 'none').map(b => b.textContent.trim()),
    hiddenBar: [...document.querySelectorAll('#dio-dv-bar button')].filter(b => getComputedStyle(b).display === 'none').map(b => b.textContent.trim()),
    edTop: Math.round(r(ed).top), headTop: Math.round(r(heading).top), headBottom: Math.round(r(heading).bottom),
    tableTop: Math.round(r(tbl).top), tableBottom: Math.round(r(tbl).bottom), tableH: Math.round(r(tbl).height),
    nextAfterTable: Math.round(r(ed.querySelector('#idxn-parties')).top),
    zHeadTop: Math.round(r(ed.querySelector('#idxz-head')).top), lastPartyBottom: Math.round(r(ed.querySelector('#idxn-parties')).bottom),
    edLeft: Math.round(r(ed).left), edRight: Math.round(r(ed).right),
    dstLeft: Math.round(r(dst).left), dstRight: Math.round(r(dst).right),
    lines,
    datesOneLine: dates.every(oneLine), dateTexts: dates.map(d => d.textContent.trim()),
    zOneLine: zCells.every(oneLine),
    zCols: zt.querySelectorAll('tr:first-child th').length,
    zSerials: colwise('td.idxz-n'), zDates: colwise('td.idxz-d'), zOfc: colwise('td.idxz-o'),
    k,
    zW: [...zt.querySelectorAll('tr:first-child th')].slice(0, 3).map(t => Math.round(t.getBoundingClientRect().width)),
    editable: ed.getAttribute('contenteditable'),
  };
})()"""

def open_index(pg):
    pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
    pg.evaluate("_doAddMisalDoc('index_naql')"); pg.wait_for_timeout(500)
    pg.evaluate("_openMisalEditor('index_naql')"); pg.wait_for_selector('#misal-editor'); pg.wait_for_timeout(1500)
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)

def print_frame(pg):
    return pg.evaluate("""(() => { const f = document.getElementById('dio-print-frame'); if (!f) return null; const d = f.contentDocument;
      return { html: d.documentElement.outerHTML.length, buttons: d.querySelectorAll('button,select,.editor-toolbar').length,
        folio: [...d.querySelectorAll('style')].some(s => /size:8\\.5in 13in/.test(s.textContent)), dir: d.documentElement.getAttribute('dir') }; })()""")

def frame_measure(pg):
    """پرنٹ والے iframe کے اندر — کاغذ کی چوڑائی پر — کوئی خانہ ٹوٹا یا باہر تو نہیں"""
    return pg.evaluate("""(() => { const f = document.getElementById('dio-print-frame'); if (!f) return null; const d = f.contentDocument;
      const oneLine = el => { const range = d.createRange(); range.selectNodeContents(el); const tops = new Set([...range.getClientRects()].map(x => Math.round(x.top))); return tops.size <= 1 && el.scrollWidth <= el.clientWidth + 1; };
      d.body.style.width = 'calc(8.5in - 16.5mm)'; d.body.style.margin = '0';   // کاغذ کی چوڑائی
      const dst = d.getElementById('idxn-dst'); const b = d.body.getBoundingClientRect();
      return { dates: [...d.querySelectorAll('#idxn-main td:nth-child(2), #idxn-main td:nth-child(3)')].every(oneLine),
               zim: [...d.querySelectorAll('#idxz-table td')].every(oneLine),
               dstInside: dst ? (dst.getBoundingClientRect().left >= b.left - 0.5 && dst.scrollWidth <= dst.clientWidth + 1) : null,
               bodyW: Math.round(b.width) }; })()""")

def run(pg, tag):
    pg.evaluate(SEED)
    open_index(pg)
    m = pg.evaluate(MEASURE)
    pg.screenshot(path=f'{OUT}/{tag}_i01_index_empty.png', full_page=False)
    check(f'{tag} no editing toolbar on index', m and not m['toolbar'], m and m['toolbar'])
    check(f'{tag} no saved-files box on index', not m['savedBox'])
    check(f'{tag} «محفوظ» and «منظوری» buttons hidden for index', 'محفوظ' in m['hiddenBar'] and 'منظوری' in m['hiddenBar'] and 'پرنٹ' not in m['hiddenBar'], m['hiddenBar'])
    check(f'{tag} no zimni yet → serial column empty', all(s == '' for s in m['zSerials']) and len(m['zSerials']) == 18, m['zSerials'][:4])
    check(f'{tag} zimni table: 2 groups × 3 columns', m['zCols'] == 6, m['zCols'])
    check(f'{tag} zimni: IO-name column wider than date column', m['zW'][2] > m['zW'][1], m['zW'])
    # ایک سطر (Enter) = 8mm ≈ 30px
    k = m['k']; g = lambda v: round(v / k)
    gap_top = g(m['headTop'] - m['edTop'])
    check(f'{tag} one-line space above heading', gap_top >= 30, gap_top)
    check(f'{tag} one-line space after first line', g(m['tableTop'] - m['headBottom']) >= 29, g(m['tableTop'] - m['headBottom']))
    check(f'{tag} one-line space after table', g(m['nextAfterTable'] - m['tableBottom']) >= 29, g(m['nextAfterTable'] - m['tableBottom']))
    check(f'{tag} one-line space above انڈکس ضمنیات', g(m['zHeadTop'] - m['lastPartyBottom']) >= 29, g(m['zHeadTop'] - m['lastPartyBottom']))
    # میز کی اونچائی: پہلے 14mm + 40mm = 54mm (≈204px)؛ اب +1 انچ (96px) ≈ 300px
    check(f'{tag} table height +1 inch (≈300px)', 290 <= g(m['tableH']) <= 312, g(m['tableH']))
    lefts = [l['left'] for l in m['lines'] if 'cnic' in l['id'] or 'name' in l['id'] or 'complainant' in l['id']]
    check(f'{tag} dotted lines all end at the same edge', max(lefts) - min(lefts) <= 1, sorted(set(lefts)))
    pairs = [(a['w'], b['w']) for a, b in zip([l for l in m['lines'] if 'cell' in l['id']], [l for l in m['lines'] if 'cnic' in l['id']])]
    check(f'{tag} contact/CNIC dotted lines equal', all(abs(a - b) <= 2 for a, b in pairs), pairs)
    check(f'{tag} ضلع ≥13mm from paper edge (was 8mm)', g(m['dstLeft'] - m['edLeft']) >= 50, g(m['dstLeft'] - m['edLeft']))
    check(f'{tag} dates on one line', m['datesOneLine'], m['dateTexts'])

    # ── ضمنیاں ایک ایک کر کے لکھی جائیں → انڈیکس میں خود بخود ──
    pg.evaluate("""window.__db.zimni_reports.push({ id:'z1', case_id:'c1', serial_no:1, report_date:'2026-10-09', officer_id:'o1' }); 0""")
    pg.evaluate("_openMisalEditor('index_naql', true)"); pg.wait_for_timeout(1200)
    m1 = pg.evaluate(MEASURE)
    check(f'{tag} 1 zimni → only serial 1 filled', m1['zSerials'][0] == '1' and all(s == '' for s in m1['zSerials'][1:]), m1['zSerials'][:3])
    check(f'{tag} zimni 1 date + IO', m1['zDates'][0] == '09/10/2026' and 'فیاض حسین شاد' in m1['zOfc'][0], (m1['zDates'][0], m1['zOfc'][0]))
    pg.evaluate("""window.__db.zimni_reports.push(
      { id:'z2', case_id:'c1', serial_no:2, report_date:'2026-10-11', officer_id:'o9' },
      { id:'z3', case_id:'c1', serial_no:3, report_date:'2026-10-14', officer_id:'o1' }); 0""")
    pg.evaluate("_openMisalEditor('index_naql', true)"); pg.wait_for_timeout(1200)
    m3 = pg.evaluate(MEASURE)
    check(f'{tag} 3 zimniyan → serials 1,2,3 then empty', m3['zSerials'][:4] == ['1', '2', '3', ''], m3['zSerials'][:4])
    check(f'{tag} each zimni keeps its own date + IO', m3['zDates'][:3] == ['09/10/2026', '11/10/2026', '14/10/2026'] and 'محمد عبدالرحمن خان' in m3['zOfc'][1], (m3['zDates'][:3], m3['zOfc'][:3]))
    check(f'{tag} zimni cells: no wrap', m3['zOneLine'])
    check(f'{tag} nothing saved to server for index', not any((d.get('content') or {}).get('html') for d in pg.evaluate("window.__db.case_documents || []") if d.get('document_type') == 'index_naql'))
    pg.screenshot(path=f'{OUT}/{tag}_i02_index_zimni.png', full_page=False)

    # ── پرنٹ: «پرنٹ» بٹن اور Ctrl+P ایک ہی ──
    pg.evaluate("_dioPrintCurrent()"); pg.wait_for_timeout(900)
    pf = print_frame(pg); fm = frame_measure(pg)
    check(f'{tag} print button: Folio, RTL, no buttons/toolbar', pf and pf['folio'] and pf['dir'] == 'rtl' and pf['buttons'] == 0, pf)
    check(f'{tag} print: dates + zimni on one line, ضلع inside page', fm and fm['dates'] and fm['zim'] and fm['dstInside'], fm)
    pg.evaluate("document.getElementById('dio-print-frame') && document.getElementById('dio-print-frame').remove(); 0")
    html_btn = None
    pg.evaluate("_dioPrintCurrent()"); pg.wait_for_timeout(300)
    html_btn = pg.evaluate("document.getElementById('dio-print-frame').contentDocument.body.innerHTML")
    pg.evaluate("document.getElementById('dio-print-frame').remove(); 0")
    pg.click('#misal-editor', position={'x': 200, 'y': 40}) if tag == 'desk' else None
    pg.keyboard.press('Control+p'); pg.wait_for_timeout(300)
    pf2 = print_frame(pg)
    html_key = pg.evaluate("document.getElementById('dio-print-frame') ? document.getElementById('dio-print-frame').contentDocument.body.innerHTML : null")
    check(f'{tag} Ctrl+P → same paper as «پرنٹ» button', pf2 and pf2['folio'] and html_key == html_btn, (pf2, html_key is not None and len(html_key), len(html_btn)))
    # PDF ki tasveer (iframe ka mawad alag se — wahi jo kaghaz par chhapta hai)
    html = pg.evaluate("document.getElementById('dio-print-frame').contentDocument.documentElement.outerHTML")
    p2 = pg.context.new_page(); p2.set_content(html); p2.wait_for_timeout(1500); p2.evaluate("document.fonts.ready")
    p2.pdf(path=f'{OUT}/{tag}_i04_paper.pdf', prefer_css_page_size=True, print_background=True)
    info2 = subprocess.run(['pdfinfo', f'{OUT}/{tag}_i04_paper.pdf'], capture_output=True, text=True).stdout
    subprocess.run(['pdftoppm', '-png', '-r', '80', '-singlefile', f'{OUT}/{tag}_i04_paper.pdf', f'{OUT}/{tag}_i04_paper'])
    check(f'{tag} paper: exactly 1 Folio page', re.search(r'Pages:\s+1\n', info2) and '612 x 936' in info2, [l for l in info2.splitlines() if 'Page' in l])
    p2.close()
    pg.evaluate("document.getElementById('dio-print-frame') && document.getElementById('dio-print-frame').remove(); 0")

    # ── 18 ضمنیاں، لمبا نام → پھر بھی ایک صفحہ، کوئی خانہ نہیں ٹوٹتا ──
    pg.evaluate("""window.__db.officers_directory.push({ id:'o7', full_name:'چوہدری محمد عبدالرحمن خان بلوچ', designation:'Inspector' });
      for (let n = 4; n <= 18; n++) window.__db.zimni_reports.push({ id:'z'+n, case_id:'c1', serial_no:n, report_date:'2026-10-' + String(10+n%18).padStart(2,'0'), officer_id: n%2 ? 'o7' : 'o9' }); 0""")
    pg.evaluate("_openMisalEditor('index_naql', true)"); pg.wait_for_timeout(1500)
    m18 = pg.evaluate(MEASURE)
    check(f'{tag} 18 zimniyan → 1–9 right half, 10–18 left half', m18['zSerials'] == [str(i) for i in range(1, 19)], m18['zSerials'])
    check(f'{tag} 18 zimniyan: long names stay on one line (screen)', m18['zOneLine'])
    pg.screenshot(path=f'{OUT}/{tag}_i05_index_18.png', full_page=False)
    pg.evaluate("_dioPrintCurrent()"); pg.wait_for_timeout(900)
    fm = frame_measure(pg)
    html = pg.evaluate("document.getElementById('dio-print-frame').contentDocument.documentElement.outerHTML")
    pg.evaluate("document.getElementById('dio-print-frame').remove(); 0")
    p3 = pg.context.new_page(); p3.set_content(html); p3.wait_for_timeout(1500)
    p3.pdf(path=f'{OUT}/{tag}_i06_paper18.pdf', prefer_css_page_size=True, print_background=True)
    info3 = subprocess.run(['pdfinfo', f'{OUT}/{tag}_i06_paper18.pdf'], capture_output=True, text=True).stdout
    subprocess.run(['pdftoppm', '-png', '-r', '80', '-singlefile', f'{OUT}/{tag}_i06_paper18.pdf', f'{OUT}/{tag}_i06_paper18'])
    p3.close()
    check(f'{tag} 18 zimniyan print: one line each + still 1 Folio page', fm and fm['zim'] and re.search(r'Pages:\s+1\n', info3), (fm, [l for l in info3.splitlines() if 'Pages' in l]))
    pg.evaluate("window.__db.zimni_reports.push({ id:'z19', case_id:'c1', serial_no:19, report_date:'2026-10-20', officer_id:'o1' }); 0")
    pg.evaluate("_openMisalEditor('index_naql', true)"); pg.wait_for_timeout(1500)
    m19 = pg.evaluate(MEASURE)
    check(f'{tag} 19th zimni → table grows by a row (nothing dropped)', '19' in m19['zSerials'] and len(m19['zSerials']) == 20, m19['zSerials'][-4:])

    # دوسری دستاویز پر «محفوظ» / «منظوری» واپس نظر آئیں
    pg.evaluate("_doAddMisalDoc('brief')"); pg.wait_for_timeout(400)
    pg.evaluate("_openMisalEditor('brief')"); pg.wait_for_timeout(700)
    hb = pg.evaluate("[...document.querySelectorAll('#dio-dv-bar button')].filter(b => getComputedStyle(b).display === 'none').map(b => b.textContent.trim())")
    tb = pg.evaluate("!!document.querySelector('#workspace-editor-area .editor-toolbar')")
    check(f'{tag} other documents keep محفوظ/منظوری + toolbar', 'محفوظ' not in hb and 'منظوری' not in hb and tb, (hb, tb))
    pg.evaluate("_dioSwitchTab('index_naql')"); pg.wait_for_timeout(900)
    hb2 = pg.evaluate("[...document.querySelectorAll('#dio-dv-bar button')].filter(b => getComputedStyle(b).display === 'none').map(b => b.textContent.trim())")
    check(f'{tag} back on index tab → buttons hidden again', 'محفوظ' in hb2 and 'منظوری' in hb2, hb2)
    pg.evaluate("_dioExitDocView()"); pg.wait_for_timeout(300)


if __name__ == '__main__':
    with sync_playwright() as p:
        b = p.chromium.launch()
        for tag, args in [('desk', dict(viewport={'width': 1366, 'height': 768})),
                          ('mob', dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True))]:
            ctx, pg, errs = open_app(b, **args)
            try:
                run(pg, tag)
            except Exception as e:
                check(f'{tag} crashed', False, repr(e)[:300])
            check(f'{tag} no page errors', not errs, errs[:5])
            ctx.close()
        b.close()
    bad = [r for r in R if r[0] == 'FAIL']
    print(f'\n{len(R) - len(bad)}/{len(R)} PASS')
    sys.exit(1 if bad else 0)
