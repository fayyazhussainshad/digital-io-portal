"""(v551) سسٹم کے تمام فارم — اصل ایپ سے، خالی مقدمے پر، خالی سانچے بنا کر system-forms.js میں۔

افسر کی ہدایت: «جو فارم سسٹم نے بنائے ہیں یا آئندہ بنائے گا، ٹمپلیٹس میں نام کے ساتھ
خود شامل ہوں — بغیر ڈیٹا کے، مگر کالم/قطار کے نام برقرار۔»

نیا فارم کوڈ میں آئے تو اسے FORMS میں ایک سطر سے شامل کر کے یہ اسکرپٹ دوبارہ چلائیں:
    (cd ../.. && python3 -m http.server 8770 &) ; python3 forms_build.py
tests/security.test.js پکڑتا ہے اگر کوئی چالان / درخواست / مسل کا فارم فہرست میں نہ ہو۔
(اس کے علاوہ ایپ خود بھی فہرست سے باہر کھلنے والی دستاویز کو «خودکار» فارم بنا لیتی ہے۔)
"""
import sys, json, os
from real import *

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CASE = "{id:'cB',officer_id:'o1',status:'under',created_at:'2026-10-14T00:00:00Z'}"
# CRO کارڈ ملزم کا ہوتا ہے — خالی نام کا ایک ملزم (الگ مقدمہ تاکہ باقی فارم خالی رہیں)
CASE_CRO = "{id:'cC',officer_id:'o1',status:'under',created_at:'2026-10-14T00:00:00Z'}"

def open_case(pg, cid='cB'):
    pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}; try{closeModal()}catch(e){}")
    pg.evaluate(f"openCaseWorkspace('{cid}')"); pg.wait_for_timeout(1300)

# (id, نام, گروپ, کھولنے کا طریقہ)  — id وہی جو DIO.forms.currentFormKey بناتا ہے
def forms(pg):
    L = []
    L.append(('index_naql', 'انڈیکس نقل مسل', 'مسل', "_openMisalEditor('index_naql')", []))
    L.append(('zamniyat', 'ضمنی (رپورٹ ضمنی)', 'ضمنیات', "_openMisalEditor('zamniyat')", ['_newZimni()', ZBLANK]))
    L.append(('statements_161', 'اندرونی ضمنی — بیانات 161 ض ف', 'ضمنیات', "_openMisalEditor('statements_161')", ['_newZimniA()', ZBLANK]))
    for t in pg.evaluate("R173_TYPES.map(t=>[t.id,t.name])"):
        if t[0] == 'tatima_challan':
            for s in pg.evaluate("R173_TATIMA_SUBS.map(s=>[s.id,s.name])"):
                L.append((f'r173:tatima_challan:{s[0]}', f'تتمہ چالان — {s[1]}', 'رپورٹ 173 ض ف (چالان)',
                          "openReport173WithType('tatima_challan')", [f"_r173Subtype='{s[0]}'; _renderR173()"]))
        else:
            L.append((f'r173:{t[0]}', t[1], 'رپورٹ 173 ض ف (چالان)', f"openReport173WithType('{t[0]}')", []))
    for t in pg.evaluate("DK_TYPES.map(t=>[t.id,t.name])"):
        name = ' … '.join([x for x in t[1].split('  ') if x.strip()]).replace(' …  … ', ' … ').strip()
        L.append((f'dk:{t[0]}', name, 'درخواستیں', "_openMisalEditor('darkhwastain')", [f"_dkSetType('{t[0]}')"]))
    L.append(('saza_slip', 'سزا سلپ', 'مسل', "_openMisalEditor('saza_slip')", []))
    L.append(('crime_scene', 'نقشہ موقع', 'مسل', "_openMisalEditor('crime_scene')", []))
    L.append(('cdr_imei', 'CDR / IMEI درخواست', 'مسل', "_openMisalEditor('cdr_imei')", []))
    L.append(('rfa_form', 'RFA فارم', 'مسل', "_openMisalEditor('rfa_form')", ['_newRfa()']))
    L.append(('cro_card', 'CRO کارڈ', 'مسل', "@cro", []))
    L.append(('incident', 'واقعاتی رپورٹ', 'دیگر', "@incident", [], '#ir-doc'))
    L.append(('gasht', 'گشت رپورٹ', 'دیگر', "@gasht", [], '#gl-doc'))
    return L

# ضمنی کا اگلا نمبر (1) ڈیٹا ہے، فارم کا حصہ نہیں — خالی
ZBLANK = "(() => { const d = DIO.forms.findPaper(); if (!d) return; d.querySelectorAll('*').forEach(e => { if (!e.children.length && /^\\s*1\\s*$/.test(e.textContent)) e.textContent = ''; }); })()"

ALIASES = {'zamniyat': ['memorandum']}

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 900})
    pg.evaluate("dioLoadScript('dio-forms.js')"); pg.wait_for_timeout(600)
    pg.evaluate(f"window.__db.cases.push({CASE}); window.__db.cases.push({CASE_CRO});"
                "window.__db.case_accused.push({id:'aC',case_id:'cC',name:'',accused_type:'fir',created_at:'2026-10-14'})")
    out, fails = [], []
    for row in forms(pg):
        fid, name, group, opener, steps = row[:5]
        sel = row[5] if len(row) > 5 else None
        try:
            if opener == '@cro':
                open_case(pg, 'cC'); pg.evaluate("_openMisalEditor('cro_card')"); pg.wait_for_timeout(1500)
                pg.evaluate("_openCroForAccused('aC')")
            elif opener == '@incident':
                pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}")
                pg.evaluate("showPage('incident', null)"); pg.wait_for_timeout(1500); pg.evaluate("_irNew()")
            elif opener == '@gasht':
                pg.evaluate("try{_dioResetTabs();_dioExitDocView()}catch(e){}")
                pg.evaluate("document.getElementById('ir-view')&&document.getElementById('ir-view').remove()")
                pg.evaluate("showPage('gasht', null)"); pg.wait_for_timeout(1500); pg.evaluate("_glNew()")
            else:
                open_case(pg); pg.evaluate(opener)
            pg.wait_for_timeout(1800)
            for s in steps:
                pg.evaluate(s); pg.wait_for_timeout(1300)
            pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(300)
            cap = pg.evaluate("""(sel) => { const el = DIO.forms.findPaper(sel || undefined); if (!el) return null;
                const c = DIO.forms.capture(el, {clearDataK:false}); c.src = el.id || el.className; return c; }""", sel)
            if not cap or len(cap['html']) < 300:
                fails.append(fid); print('FAIL', fid, 'paper not found'); continue
            out.append({'id': fid, 'name': name, 'group': group, 'aliases': ALIASES.get(fid, []),
                        'wIn': cap['wIn'], 'hIn': cap['hIn'], 'html': cap['html']})
            print(f"ok  {fid:34s} {cap['src'][:24]:24s} {cap['wIn']}x{cap['hIn']}in {len(cap['html'])//1024}KB")
        except Exception as e:
            fails.append(fid); print('FAIL', fid, str(e)[:200])
    print('errors', errs[:6])
    b.close()

hdr = """/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — سسٹم کے فارم (خالی سانچے) — system-forms.js
   ⚠ خودکار بنی ہوئی فائل — ہاتھ سے نہ بدلیں۔ بنانے کا طریقہ:
       tests/real-app/forms_build.py  (اصل ایپ، خالی مقدمہ، DIO.forms.capture)
   ہر فارم: { id, name, group, aliases, wIn, hIn (کاغذ انچ میں), html }
   ═══════════════════════════════════════════════════════════════ */
"""
with open(os.path.join(ROOT, 'system-forms.js'), 'w', encoding='utf-8') as f:
    f.write(hdr + 'window.DIO_SYSTEM_FORMS = ' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
print('\nforms:', len(out), 'fails:', fails, 'size:', os.path.getsize(os.path.join(ROOT, 'system-forms.js')) // 1024, 'KB')
sys.exit(1 if fails else 0)
