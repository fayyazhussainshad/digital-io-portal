"""اصل ایپ کی بنیادی جانچ — مقدمہ، دستاویزات، محفوظ کرنا، حذف شدہ مواد، آف لائن قطار۔

اصل index.html اور اصل scripts؛ صرف Supabase کی جگہ آزمائشی ڈیٹا (mock-supabase.js)۔
سرور کی ناکامی کی نقل: window.__opts.fail (رد) اور window.__opts.silent (RLS کی خاموش
روک — غلطی کے بغیر 0 قطار)۔ ہر جانچ Desktop پر، اور اہم جانچیں Mobile پر بھی۔

چلانا: README.md (اسی فولڈر میں) — `python3 core_test.py`
"""
import sys, json, subprocess
sys.path.insert(0, '.')
from real import *

R = []
def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra) if extra != '' else ''), flush=True)

TOAST_HOOK = """(() => { window.__toasts = []; const o = window.showToast;
  window.showToast = function (m, t) { window.__toasts.push([t || 'info', String(m)]); return o.apply(this, arguments); }; return 0; })()"""

def toasts(pg):
    return pg.evaluate("window.__toasts.splice(0)")

def server(pg, fail=(), silent=(), code='42501'):
    pg.evaluate(f"window.__opts.fail={json.dumps(list(fail))}; window.__opts.silent={json.dumps(list(silent))}; window.__opts.failCode={json.dumps(code)}; 0")

def db(pg, t):
    return pg.evaluate(f"JSON.parse(JSON.stringify(window.__db[{json.dumps(t)}] || []))")

def has(ts, kind, *words):
    return any(t[0] == kind and all(w in t[1] for w in words) for t in ts)

def no_success(ts):
    return not any(t[0] == 'success' for t in ts)

def need(pg, *files):
    pg.evaluate("async (fs) => { for (const f of fs) await dioLoadScript(f); }", list(files)); pg.wait_for_timeout(150)

SEED = """(() => {
  const d = window.__db;
  d.cases.push({ id: 'c2', officer_id: 'o1', fir_number: '77/25', section_of_law: '302/34 ت پ', case_station: 'کینٹ ملتان',
    case_district: 'ملتان', complainant: 'محمد اسلم', status: 'complete', created_at: '2025-03-01T00:00:00Z' });
  d.case_accused[0].cnic = '36302-1234567-1';
  d.case_accused.push({ id: 'a2', case_id: 'c2', name: 'نامعلوم ملزم', cnic: '36302-1234567-1', accused_type: 'fir', created_at: '2025-03-02' });
  d.reminders = [{ id: 'rem1', officer_id: 'o1', text: 'چالان جمع کرانا FIR 1234/26', reminder_date: '2026-10-20', is_done: false, created_at: '2026-10-10T00:00:00Z' }];
  d.court_dates = [{ id: 'cd1', officer_id: 'o1', case_id: 'c1', fir_number: '1234/26', hearing_date: '2026-10-22', court_name: 'سول جج ملتان', status: 'pending', created_at: '2026-10-10T00:00:00Z' }];
  d.suspects = [{ id: 'sp1', officer_id: 'o1', full_name: 'مشتبہ اول', created_at: '2026-10-10T00:00:00Z' }];
  d.templates = [{ id: 'tp1', officer_id: 'o1', title: 'پرانا نام', content: 'متن', category: 'عام', created_at: '2026-10-10T00:00:00Z' }];
  d.applications_5c = [{ id: 'ap1', officer_id: 'o1', complainant_name: 'درخواست گزار', status: 'pending', created_at: '2026-10-10T00:00:00Z' }];
  d.application_5c_numbers = [{ id: 'n1', application_5c_id: 'ap1', application_number: '5C-11' }];
  d.application_5c_attachments = [];
  return 0; })()"""


def run_core(pg, tag):
    """وہ جانچیں جو Desktop اور Mobile دونوں پر چلتی ہیں۔"""
    pg.evaluate(TOAST_HOOK); pg.evaluate(SEED)

    # ══ 1) مقدمہ: نیا اندراج → محفوظ؛ ترمیم → صرف بدلا خانہ بدلے ══
    _sec = '══ 1) مقدمہ: نیا اندراج → محفوظ؛ ترمیم → صرف بدلا خانہ بدلے ══'
    try:
        pg.evaluate("showPage('cases', null)"); pg.wait_for_timeout(900)
        pg.evaluate("openAddCaseModal()"); pg.wait_for_selector('#cf-fir'); pg.wait_for_timeout(400)
        pg.screenshot(path=f'{OUT}/{tag}_c01_new_case_card.png')
        pg.evaluate("""() => { const v = (id, x) => { const el = document.getElementById(id); el.value = x; };
          v('cf-fir', '555/26'); v('cf-date', '14/10/2026'); v('cf-occurrence-date', '13/10/2026');
          v('cf-section-search', '392 ت پ'); v('cf-occurrence-place', 'چوک کمہاراں والا ملتان');
          v('cf-complainant', 'رانا نوید ولد رانا شفیق قوم راجپوت سکنہ گلگشت ملتان'); }""")
        toasts(pg)
        pg.evaluate("saveNewCase()"); pg.wait_for_timeout(900)
        t = toasts(pg)
        new = [c for c in db(pg, 'cases') if c.get('fir_number') == '555/26']
        check(f'{tag} case: new case saved with دفعات, تھانہ, ضلع', len(new) == 1 and new[0]['section_of_law'] == '392 ت پ' and new[0]['case_station'] == 'صدر ملتان', new[:1])
        rem = [r for r in db(pg, 'reminders') if '555/26' in r.get('text', '')]
        check(f'{tag} case: auto reminders (10-day 173 + 15-day untrace) really created', len(rem) == 2, [r['reminder_date'] for r in rem])
        check(f'{tag} case: success message only after real save', has(t, 'success', 'مقدمہ درج ہو گیا', '555/26'), t)
        cid = new[0]['id'] if new else None
        pg.evaluate(f"openEditCaseModal('{cid}')"); pg.wait_for_selector('#cf-fir'); pg.wait_for_timeout(400)
        pg.evaluate("document.getElementById('cf-occurrence-place').value = 'گلگشت کالونی ملتان'"); toasts(pg)
        pg.evaluate(f"saveEditCase('{cid}')"); pg.wait_for_timeout(800)
        c = [c for c in db(pg, 'cases') if c['id'] == cid][0]
        check(f'{tag} case: edit changes only the edited field', c['occurrence_place'] == 'گلگشت کالونی ملتان' and c['section_of_law'] == '392 ت پ' and c['complainant'].startswith('رانا نوید'), c['occurrence_place'])
        pg.evaluate("try{closeModal()}catch(e){}; 0")

    except Exception as e:
        check(f'{tag} section crashed: ' + _sec, False, repr(e)[:200])
    # ══ 2) مقدمہ حذف — «حذف شدہ مواد» میں نقل کے بغیر کبھی نہیں (نمبر 2) ══
    _sec = '══ 2) مقدمہ حذف — «حذف شدہ مواد» میں نقل کے بغیر کبھی نہیں (نمبر 2) ══'
    try:
        need(pg, 'bin.js')
        # v560: «حذف» = نشان (deleted_at) — قطار سرور پر رہتی ہے (اس کی ضمنیاں/چالان بھی)؛ بحالی اسی شناخت سے
        live = lambda: [x for x in db(pg, 'cases') if x['id'] == cid and not x.get('deleted_at')]
        server(pg, fail=['recycle_bin:insert']); toasts(pg)
        pg.evaluate(f"doDeleteCase('{cid}')"); pg.wait_for_timeout(700)
        t = toasts(pg)
        check(f'{tag} case delete: bin copy refused → case NOT deleted', len(live()) == 1 and not db(pg, 'recycle_bin'), t)
        check(f'{tag} case delete: clear failure message, no success', has(t, 'error', 'مقدمہ', 'حذف نہیں ہوا') and no_success(t) and not has(t, 'info', 'منتقل'), t)
        server(pg, silent=['cases:update']); toasts(pg)
        pg.evaluate(f"doDeleteCase('{cid}')"); pg.wait_for_timeout(700)
        t = toasts(pg)
        check(f'{tag} case delete: server silently blocks delete (RLS) → case kept, bin copy undone, error shown',
              len(live()) == 1 and not db(pg, 'recycle_bin') and has(t, 'error', 'حذف نہیں ہوا'), (t, len(db(pg, 'recycle_bin'))))
        server(pg); toasts(pg)
        pg.evaluate(f"doDeleteCase('{cid}')"); pg.wait_for_timeout(700)
        t = toasts(pg); bin_ = db(pg, 'recycle_bin')
        row = [x for x in db(pg, 'cases') if x['id'] == cid]
        check(f'{tag} case delete: normal → case gone (marked, row kept), full copy in bin',
              not live() and len(row) == 1 and bool(row[0].get('deleted_at')) and len(bin_) == 1 and bin_[0]['item_type'] == 'case' and bin_[0]['item_data']['fir_number'] == '555/26', t)
        # بحالی: سرور رد کرے تو بن سے نہ ہٹے
        server(pg, fail=['cases:update']); toasts(pg)
        pg.evaluate(f"_binRestore('{bin_[0]['id']}', 'case')"); pg.wait_for_timeout(600)
        t = toasts(pg)
        check(f'{tag} bin restore: server refuses → item stays in bin, error shown', len(db(pg, 'recycle_bin')) == 1 and not live() and has(t, 'error', 'بحال نہیں ہوا') and no_success(t), t)
        server(pg); toasts(pg)
        pg.evaluate(f"_binRestore('{bin_[0]['id']}', 'case')"); pg.wait_for_timeout(600)
        t = toasts(pg)
        check(f'{tag} bin restore: normal → same case back (same id), bin empty', len(live()) == 1 and live()[0].get('fir_number') == '555/26' and not db(pg, 'recycle_bin') and has(t, 'success', 'بحال'), t)

    except Exception as e:
        check(f'{tag} section crashed: ' + _sec, False, repr(e)[:200])
    # ══ 3) یاددہانی اور پیشی کا حذف (نمبر 2) ══
    _sec = '══ 3) یاددہانی اور پیشی کا حذف (نمبر 2) ══'
    try:
        pg.evaluate("showPage('reminders', null)"); pg.wait_for_timeout(900)
        server(pg, fail=['recycle_bin:insert']); toasts(pg)
        pg.evaluate("_deleteRem('rem1')"); pg.wait_for_timeout(700)
        t = toasts(pg)
        check(f'{tag} reminder delete: bin copy refused → reminder kept', any(r['id'] == 'rem1' for r in db(pg, 'reminders')) and has(t, 'error', 'یاددہانی', 'حذف نہیں ہوئی') and no_success(t), t)
        server(pg, silent=['reminders:delete']); toasts(pg)
        pg.evaluate("_deleteRem('rem1')"); pg.wait_for_timeout(700)
        t = toasts(pg)
        check(f'{tag} reminder delete: delete silently blocked → kept, bin copy undone', any(r['id'] == 'rem1' for r in db(pg, 'reminders')) and not db(pg, 'recycle_bin') and has(t, 'error', 'حذف نہیں ہوئی'), (t, db(pg, 'recycle_bin')))
        server(pg); toasts(pg)
        pg.evaluate("_deleteRem('rem1')"); pg.wait_for_timeout(700)
        t = toasts(pg); bin_ = db(pg, 'recycle_bin')
        check(f'{tag} reminder delete: normal → gone, copy in bin', not any(r['id'] == 'rem1' for r in db(pg, 'reminders')) and len(bin_) == 1 and bin_[0]['item_type'] == 'reminder' and has(t, 'info', 'حذف شدہ مواد'), t)
        pg.evaluate(f"_binDoPerm('{bin_[0]['id']}')"); pg.wait_for_timeout(400)
        need(pg, 'court.js')
        pg.evaluate("showPage('court', null)"); pg.wait_for_timeout(900)
        server(pg, fail=['recycle_bin:insert']); toasts(pg)
        pg.evaluate("_deleteCourtDate('cd1')"); pg.wait_for_timeout(700)
        t = toasts(pg)
        check(f'{tag} peshi delete: bin copy refused → peshi kept', any(r['id'] == 'cd1' for r in db(pg, 'court_dates')) and has(t, 'error', 'پیشی', 'حذف نہیں ہوئی') and not has(t, 'info', 'منتقل'), t)
        server(pg, silent=['court_dates:update']); toasts(pg)
        pg.evaluate("_markCourtDone('cd1')"); pg.wait_for_timeout(600)
        t = toasts(pg)
        check(f'{tag} peshi «مکمل»: silently blocked → still pending, error shown', db(pg, 'court_dates')[0]['status'] == 'pending' and has(t, 'error', 'مکمل نہیں ہوئی') and no_success(t), t)
        server(pg); toasts(pg)
        pg.evaluate("_deleteCourtDate('cd1')"); pg.wait_for_timeout(700)
        t = toasts(pg)
        check(f'{tag} peshi delete: normal → gone, copy in bin', not db(pg, 'court_dates') and db(pg, 'recycle_bin')[0]['item_type'] == 'court', t)
        pg.screenshot(path=f'{OUT}/{tag}_c02_after_peshi_delete.png')

    except Exception as e:
        check(f'{tag} section crashed: ' + _sec, False, repr(e)[:200])
    # ══ 4) دستاویز (مثل): محفوظ — سرور پر ریکارڈ نہ ہو تو نیا بنے، رد ہو تو صاف ناکامی ══
    _sec = '══ 4) دستاویز (مثل): محفوظ — سرور پر ریکارڈ نہ ہو تو نیا بنے، رد ہو تو صاف ناکامی ══'
    try:
        pg.evaluate("openCaseWorkspace('c1')"); pg.wait_for_timeout(1500)
        pg.evaluate("_doAddMisalDoc('brief')"); pg.wait_for_timeout(500)
        pg.evaluate("_openMisalEditor('brief')"); pg.wait_for_selector('#misal-editor'); pg.wait_for_timeout(500)
        pg.evaluate("document.getElementById('misal-editor').innerHTML = '<p>بریف مقدمہ — آزمائشی متن</p>'; 0"); toasts(pg)
        pg.evaluate("saveMisalDoc('brief')"); pg.wait_for_timeout(600)
        t = toasts(pg); docs = [d for d in db(pg, 'case_documents') if d.get('document_type') == 'brief']
        check(f'{tag} document: saved to server', len(docs) == 1 and 'آزمائشی متن' in json.dumps(docs[0].get('content'), ensure_ascii=False) and has(t, 'success', 'دستاویز محفوظ'), t)
        pg.screenshot(path=f'{OUT}/{tag}_c03_document.png')
        pg.evaluate("window.__db.case_documents = window.__db.case_documents.filter(d => d.document_type !== 'brief'); 0")
        pg.evaluate("document.getElementById('misal-editor').innerHTML = '<p>دوسرا متن</p>'; 0"); toasts(pg)
        pg.evaluate("saveMisalDoc('brief')"); pg.wait_for_timeout(600)
        t = toasts(pg); docs = [d for d in db(pg, 'case_documents') if d.get('document_type') == 'brief']
        check(f'{tag} document: record missing on server → created (was: false «محفوظ», text lost)', len(docs) == 1 and 'دوسرا متن' in json.dumps(docs[0].get('content'), ensure_ascii=False) and has(t, 'success'), t)
        server(pg, silent=['case_documents:update'], fail=['case_documents:insert']); toasts(pg)
        pg.evaluate("document.getElementById('misal-editor').innerHTML = '<p>تیسرا متن</p>'; 0")
        pg.evaluate("saveMisalDoc('brief')"); pg.wait_for_timeout(600)
        t = toasts(pg)
        check(f'{tag} document: server blocks → clear failure, no «محفوظ»', has(t, 'error', 'دستاویز', 'محفوظ نہیں ہوئی') and no_success(t) and 'تیسرا' not in json.dumps(db(pg, 'case_documents'), ensure_ascii=False), t)
        server(pg)
        # پرنٹ: صرف دستاویز چھپتی ہے (کوئی بٹن/پٹی نہیں)، A4
        pg.evaluate("printMisalDoc('بریف مقدمہ')"); pg.wait_for_timeout(800)
        pf = pg.evaluate("""(() => { const f = document.getElementById('dio-print-frame'); if (!f) return null; const d = f.contentDocument;
          return { text: d.body.innerText, buttons: d.querySelectorAll('button,select,.doc-toolbar,.editor-toolbar').length,
            a4: [...d.querySelectorAll('style')].some(s => /size:A4/.test(s.textContent)), dir: d.documentElement.getAttribute('dir') }; })()""")
        # جو دستاویز سکرین پر ہے وہی چھپے (محفوظ نہ ہو سکی تب بھی افسر کا لکھا ہوا)
        check(f'{tag} document print: only the document, A4, RTL, no buttons', pf and 'تیسرا متن' in pf['text'] and pf['buttons'] == 0 and pf['a4'] and pf['dir'] == 'rtl', pf)
        pg.evaluate("document.getElementById('dio-print-frame') && document.getElementById('dio-print-frame').remove(); 0")

    except Exception as e:
        check(f'{tag} section crashed: ' + _sec, False, repr(e)[:200])
    # ══ 5) سابقہ ریکارڈ کا لیبل — دفعات اور تھانہ (نمبر 5) ══
    _sec = '══ 5) سابقہ ریکارڈ کا لیبل — دفعات اور تھانہ (نمبر 5) ══'
    try:
        need(pg, 'mulziman.js')
        pg.evaluate("openAccusedCard('c1')"); pg.wait_for_timeout(700)
        pg.evaluate("_accPrevRecord('a1')"); pg.wait_for_timeout(700)
        # v553: سابقہ ریکارڈ = dio-prev.js کی یکجا فہرست (سسٹم + درج کیا ہوا، بغیر دہرائے) —
        #   ہر ریکارڈ ایک کارڈ: FIR · تاریخ · جرم (صرف دفعات) · تھانہ · ضلع · حیثیت · فیصلہ
        cards = pg.evaluate("[...document.querySelectorAll('.dio-rec')].filter(c => c.getClientRects().length).map(c => c.innerText.replace(/\\s+/g, ' '))")
        hit = [c for c in cards if '77/25' in c]
        check(f'{tag} previous record: label shows FIR + بجرم دفعات + تھانہ', len(hit) == 1 and '302/34 ت پ' in hit[0] and 'کینٹ ملتان' in hit[0] and 'قتل' not in hit[0], hit[:1] or cards[:2])
        pg.screenshot(path=f'{OUT}/{tag}_c04_prev_record.png')
        pg.evaluate("try{closeModal()}catch(e){}; 0")

    except Exception as e:
        check(f'{tag} section crashed: ' + _sec, False, repr(e)[:200])
    # ══ 6) سرکاری گاڑی — آف لائن دو بار محفوظ = سرور پر ایک قطار (نمبر 7) ══
    _sec = '══ 6) سرکاری گاڑی — آف لائن دو بار محفوظ = سرور پر ایک قطار (نمبر 7) ══'
    try:
        need(pg, 'sho-dsp.js')
        pg.evaluate("_misalCaseId = 'c1'; window.__db.sarkari_gari = []; 0")
        pg.context.set_offline(True); pg.wait_for_timeout(200)
        for veh in ('LEA-1234', 'LEA-5678'):
            pg.evaluate("openSarkariGari()"); pg.wait_for_selector('#gari-number')
            pg.evaluate(f"document.getElementById('gari-number').value = '{veh}'; document.getElementById('gari-driver').value = 'کانسٹیبل اکرم'; 0")
            pg.evaluate("_saveSarkariGari()"); pg.wait_for_timeout(500)
        q = pg.evaluate("offlineStore.getPending().then(p => p.filter(x => x.table === 'sarkari_gari').map(x => x.data.vehicle_number))")
        check(f'{tag} vehicle offline: two saves → ONE queued entry (latest data)', q == ['LEA-5678'], q)
        pg.context.set_offline(False); pg.wait_for_timeout(200)
        pg.evaluate("offlineStore.processQueue(supabaseClient)"); pg.wait_for_timeout(500)
        g = db(pg, 'sarkari_gari')
        check(f'{tag} vehicle: internet back → exactly one row on server', len(g) == 1 and g[0]['vehicle_number'] == 'LEA-5678', g)
        pg.evaluate("localStorage.removeItem('digital_io_sarkari_gari'); 0")   # یہ آلہ id نہیں جانتا (آف لائن سے آیا)
        pg.evaluate("openSarkariGari()"); pg.wait_for_selector('#gari-number')
        pg.evaluate("document.getElementById('gari-number').value = 'LEA-9999'; 0")
        pg.evaluate("_saveSarkariGari()"); pg.wait_for_timeout(500)
        g = db(pg, 'sarkari_gari')
        check(f'{tag} vehicle: next online save updates that row (no duplicate)', len(g) == 1 and g[0]['vehicle_number'] == 'LEA-9999', g)
    except Exception as e:
        check(f'{tag} section crashed: ' + _sec, False, repr(e)[:200])

def run_desktop_only(pg):
    """باقی سرور لکھائیوں کے نمونے (نمبر 1) اور 5-C کی آف لائن قطار۔"""
    pg.on('dialog', lambda d: d.accept())
    # مشتبہ — حذف: خاموش روک پر «حذف ہو گیا» نہیں
    try:
        need(pg, 'suspects.js')
        server(pg, silent=['suspects:delete']); toasts(pg)
        pg.evaluate("_deleteSuspect('sp1')"); pg.wait_for_timeout(600)
        t = toasts(pg)
        check('suspects delete: silently blocked → kept, clear failure', len(db(pg, 'suspects')) == 1 and has(t, 'error', 'مشتبہ', 'حذف نہیں ہوا') and no_success(t), t)
        server(pg); toasts(pg)
        pg.evaluate("_deleteSuspect('sp1')"); pg.wait_for_timeout(600)
        check('suspects delete: normal → removed', not db(pg, 'suspects'), toasts(pg))
    except Exception as e:
        check('section crashed: ' + 'مشتبہ — حذف: خاموش روک پر «حذف ہو گیا» نہیں', False, repr(e)[:200])
    # ٹیمپلیٹ — نام: سرور کی روک پر پرانا نام ہی رہے
    try:
        need(pg, 'templates.js')
        pg.evaluate("_tplList = JSON.parse(JSON.stringify(window.__db.templates)); document.body.insertAdjacentHTML('beforeend', '<input id=\"tpl-rename-inp\" value=\"نیا نام\">'); 0")
        server(pg, silent=['templates:update']); toasts(pg)
        pg.evaluate("_doRenameTpl('tp1')"); pg.wait_for_timeout(500)
        t = toasts(pg)
        check('template rename: silently blocked → name unchanged, clear failure', db(pg, 'templates')[0]['title'] == 'پرانا نام' and has(t, 'error', 'تبدیل نہیں ہوا') and no_success(t), t)
        server(pg); pg.evaluate("_doRenameTpl('tp1')"); pg.wait_for_timeout(500)
        check('template rename: normal → renamed', db(pg, 'templates')[0]['title'] == 'نیا نام', toasts(pg))
        pg.evaluate("document.getElementById('tpl-rename-inp') && document.getElementById('tpl-rename-inp').remove(); 0")
    except Exception as e:
        check('section crashed: ' + 'ٹیمپلیٹ — نام: سرور کی روک پر پرانا نام ہی رہے', False, repr(e)[:200])
    # 5-C — حذف: درخواست نہ مٹے تو اس کے نمبر/فائلیں بھی نہ مٹیں
    try:
        need(pg, 'fivec.js')
        server(pg, silent=['applications_5c:delete'])
        r = pg.evaluate("deleteApplication5C('ap1').then(() => 'ok', e => 'error: ' + e.message)")
        check('5-C delete: silently blocked → rejected (no false «Deleted»)', r.startswith('error') and len(db(pg, 'applications_5c')) == 1, r)
        server(pg)
    except Exception as e:
        check('section crashed: ' + '5-C — حذف: درخواست نہ مٹے تو اس کے نمبر/فائلیں بھی نہ مٹیں', False, repr(e)[:200])
    # 5-C آف لائن: نمبر sync نہ ہوں تو اندراج «synced» نہیں، اور دوبارہ کوشش دوہری درخواست نہیں بناتی
    try:
        pg.context.set_offline(True); pg.wait_for_timeout(200)
        pg.evaluate("addApplication5C({ complainant_name: 'آف لائن درخواست', status: 'pending', numbers: [{ application_number: '5C-77' }] })"); pg.wait_for_timeout(500)
        before = len(db(pg, 'applications_5c')) + 1
    except Exception as e:
        check('section crashed: ' + '5-C آف لائن: نمبر sync نہ ہوں تو اندراج «synced» نہیں، اور دوبارہ کوشش دوہری درخواست نہیں بناتی', False, repr(e)[:200])
    # ایپ انٹرنیٹ واپس آتے ہی خود قطار چلاتی ہے — اس لیے سرور کی ناکامی پہلے سے
    try:
        server(pg, fail=['application_5c_numbers:insert'], code='57014')
        pg.context.set_offline(False); pg.wait_for_timeout(300)
        pg.evaluate("offlineStore.processQueue(supabaseClient)"); pg.wait_for_timeout(600)
        pend = pg.evaluate("offlineStore.getPending().then(p => p.filter(x => x.table === 'fivec').map(x => !!x.data._mainId))")
        apps = [a for a in db(pg, 'applications_5c') if a.get('complainant_name') == 'آف لائن درخواست']
        check('5-C sync: numbers refused → item stays pending (remembers the created application)', len(apps) == 1 and pend == [True], (len(apps), pend))
        server(pg)
        pg.evaluate("offlineStore.processQueue(supabaseClient)"); pg.wait_for_timeout(600)
        apps = [a for a in db(pg, 'applications_5c') if a.get('complainant_name') == 'آف لائن درخواست']
        nums = [n for n in db(pg, 'application_5c_numbers') if apps and n.get('application_5c_id') == apps[0]['id']]
        left = pg.evaluate("offlineStore.getPending().then(p => p.filter(x => x.table === 'fivec').length)")
        check('5-C sync: retry → numbers saved, NO duplicate application, queue empty', len(apps) == 1 and len(nums) == 1 and left == 0 and len(db(pg, 'applications_5c')) == before, (len(apps), len(nums), left))
    except Exception as e:
        check('section crashed: ' + 'ایپ انٹرنیٹ واپس آتے ہی خود قطار چلاتی ہے — اس لیے سرور کی ناکامی پہلے سے', False, repr(e)[:200])


with sync_playwright() as p:
    b = p.chromium.launch()
    # ══════════ DESKTOP ══════════
    ctx, pg, errs = open_app(b, viewport={'width': 1366, 'height': 768})
    run_core(pg, 'desktop')
    run_desktop_only(pg)
    check('no JS errors (desktop)', not errs, errs[:4])
    ctx.close()
    # ══════════ MOBILE ══════════
    mctx, mp, merrs = open_app(b, viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
    run_core(mp, 'mobile')
    # پیغام فون کی سکرین میں پورا نظر آئے (دائیں سے بائیں)
    mp.evaluate("showToast('❌ یاددہانی حذف نہیں ہوئی — «حذف شدہ مواد» میں نقل نہیں ہو سکی — انٹرنیٹ دیکھ کر دوبارہ کوشش کریں', 'error', 5000)"); mp.wait_for_timeout(300)
    tb = mp.evaluate("(() => { const t = document.getElementById('toast-msg').getBoundingClientRect(); return { l: t.left, r: t.right, w: innerWidth, dir: getComputedStyle(document.getElementById('toast-msg')).direction }; })()")
    check('mobile: failure message fits the screen, RTL', tb['l'] >= 0 and tb['r'] <= tb['w'] and tb['dir'] == 'rtl', tb)
    mp.screenshot(path=f'{OUT}/mobile_c05_failure_toast.png')
    check('no JS errors (mobile)', not merrs, merrs[:4])
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\n{len(R) - len(fails)}/{len(R)} passed')
json.dump(R, open(OUT + '/core_results.json', 'w'), ensure_ascii=False, indent=1)
sys.exit(1 if fails else 0)
