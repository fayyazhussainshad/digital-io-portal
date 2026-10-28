"""(v560 تیاری) tools/dio-inventory.js — اصل ایپ پر، Desktop + Mobile:
   گنتی درست، «سرور پر نہیں گئے» درست، وجوہات، session کی حالت، سرور پر نہ ملنے والے مقدمات،
   بیک اپ فائل (خفیہ چابیاں نہیں)، اور سب سے اہم: کچھ بھی تبدیل نہیں ہوتا (localStorage،
   IndexedDB، سرور — پہلے اور بعد بالکل ایک جیسے)۔"""
import os, sys, json
from playwright.sync_api import sync_playwright
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from real import open_app, OUT

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = open(os.path.join(ROOT, 'tools', 'dio-inventory.js'), encoding='utf-8').read()
U1 = '11111111-1111-4111-8111-111111111111'   # سرور پر موجود مقدمہ
U2 = '22222222-2222-4222-8222-222222222222'   # سرور پر نہیں (حذف/کبھی نہیں گیا)

SEED = """async ([U1, U2]) => {
  // ایپ کا اپنا پس منظر sync (v560 سے: لاگ اِن کے چند سیکنڈ بعد اور ہر واپسی پر) بیج میں رکھا «باقی» کام
  // جانچ کے بیچ نہ بھیجے — ورنہ گنتی اس پر منحصر کہ sync پہلے چلا یا یہ آلہ (وقت کی دوڑ)۔ آلہ ویسا جیسا افسر کا لیپ ٹاپ تھا۔
  for (const f of ['_zimniSyncPending', '_zaSyncPending', '_r173SyncPending', '_syncOfflineQueue']) window[f] = async () => 0;
  if (window.DIOSync) DIOSync.kick = async () => 0;
  __db.cases.push({ id: U1, officer_id: 'o1', fir_number: '700/26', status: 'under', created_at: '2026-10-20T00:00:00Z' });
  __db.case_documents = [{ id: 'd1', case_id: U1, document_type: 'saza_slip', content: {} }];
  // ایپ کا اپنا نقشہ-sync (5 سیکنڈ والا) سرور پر نہ لکھ سکے — ورنہ «زیرِ التوا» نشان جانچ سے پہلے ہی ہٹ جاتا ہے
  __opts.fail = ['case_documents:insert', 'case_documents:update'];
  const S = (k, v) => localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v));
  // ضمنی: 3 کل — 1 سرور پر، 1 آف لائن (local-)، 1 سرور کا رد (_pending + وجہ)
  S('dio_zimni_' + U1, [
    { id: 'z-srv-1', case_id: U1, serial_no: 1, content: {} },
    { id: 'local-1730000000000', case_id: U1, serial_no: 2, _pending: true, _sync_err: '', content: {} },
    { id: 'z-srv-3', case_id: U1, serial_no: 3, _pending: true, _sync_err: 'سرور نے اجازت نہیں دی', content: {} }]);
  // ضمنی ایسے مقدمے کی جو آف لائن بنا (local- مقدمہ)
  S('dio_zimni_local-1729999999999', [{ id: 'local-1730000000001', serial_no: 1, _pending: true, content: {} }]);
  S('dio_zimni_draft_' + U1, { 'new:1': { html: 'x' }, 'id:z-srv-1': { html: 'y' } });
  S('dio_zimni_col', 'content');                                   // آلے کی تکنیکی چابی — ضمنی نہیں گنی جانی چاہیے
  S('dio_zimni_types_o1', { 'متفرق': ['نئی قسم'] });               // ترتیبات
  // بیان 161: 2 کل، 1 باقی
  S('dio_za_' + U2, [{ id: 'za-1', serial_no: 1 }, { id: 'local-1730000000002', serial_no: 2, _pending: true }]);
  // چالان: 2 کل، 1 local-
  S('dio_r173docs_' + U1, [{ id: 'r-1', type: 'challan' }, { id: 'local-1730000000003', type: 'interim' }]);
  S('dio_r173_' + U1, { a: {}, b: {} });
  // سزا سلپ: U1 سرور پر ہے، U2 نہیں
  S('dio_saza_' + U1, { saved_at: 'x' }); S('dio_saza_' + U2, { saved_at: 'y' });
  S('dio_saza_paper', 'legal');
  // نقشہ موقع: 2 خاکے، زیرِ التوا
  S('dio_naqsha_' + U1, { sketches: [{ id: 1 }, { id: 2 }] }); S('dio_naqsha_' + U1 + '::pending', '1');
  // محفوظ دستاویزات (درخواستیں) — docType میں _ والا بھی
  S('dio_sd_darkhwastain_' + U1, [{ id: 'sd-1' }, { id: 'local-1730000000004', _pendingSync: true }]);
  S('dio_sd_saza_slip_' + U1, [{ id: 'sd-2' }]);
  S('dio_rfalist_' + U1, [{ id: 'tmp_1730000000005' }]);
  S('dio_cdrlist_' + U1, [{ id: 'c-1' }, { id: 'tmp_1', _pending: true }]);
  S('dio_cro_' + U1, { id: 'tmp_1730000000006' });
  S('dio_firmatn_' + U1, [{ id: 'f-1' }]); S('dio_fircopies_' + U1, [{ id: 'tmp_2' }]);
  S('dio_accused_' + U1, [{ id: 'a-1' }, { id: 'a-2' }]);
  S('dio_staff_' + U1, [{ id: 's-1' }]);
  S('dio_irlist_o1', [{ id: 'ir-1' }, { id: 'ir-2', _pending: true }]);
  S('dio_ch173_papers_challan', ['x']);
  S('dio_biometric_cred', 'SECRET-BIO'); S('dio_pin_rt', 'SECRET-PIN');
  S('sb-abc-auth-token', 'SECRET-TOKEN');
  S('dio_some_unknown_thing', '1');
  // IndexedDB: اصل offlineStore سے — قطار میں 1 باقی + 1 مستقل ناکام؛ آف لائن مقدمہ cache میں
  await offlineStore.enqueue('evidence', 'insert', { case_id: U1, name: 'x' });
  await offlineStore.enqueue('report_173', 'insert', { case_id: U1 });
  const pend = await offlineStore.getPending();
  await offlineStore._markQueueItem(pend[1].qid, 'failed', { last_error: 'new row violates row-level security policy' });
  await offlineStore.cache('cases_cache', { id: 'local-1729999999999', officer_id: 'o1', fir_number: '9/26', _pending: true });
  await offlineStore.storeFile('fid-1', 'data:image/jpeg;base64,AAAA', { mimeType: 'image/jpeg', fileName: 'a.jpg' });
}"""

SNAP = """async () => {
  const ls = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); ls[k] = localStorage.getItem(k); }
  const q = (await offlineStore.getPending()).length + (await offlineStore.getFailed()).length;
  const cc = (await offlineStore.getAll('cases_cache')).length;
  return JSON.stringify({ ls, q, cc, db: JSON.stringify(__db) });
}"""

res = []
def check(name, ok, info=''):
    res.append((name, bool(ok))); print(('PASS' if ok else 'FAIL'), name, info if not ok else '')

def run(b, label, vp, mobile=False):
    ctx, pg, errs = open_app(b, viewport=vp, is_mobile=mobile, has_touch=mobile, accept_downloads=True)
    pg.evaluate(SEED, [U1, U2])
    pg.wait_for_timeout(300)
    before = pg.evaluate(SNAP)
    with pg.expect_download() as dl:
        out = pg.evaluate(SCRIPT)
    d = dl.value
    path = f'{OUT}/v560_inventory_{label}.json'
    d.save_as(path)
    after = pg.evaluate(SNAP)
    pg.wait_for_timeout(300)
    pg.screenshot(path=f'{OUT}/v560_inventory_{label}.png')
    S = {r['قسم']: r for r in out['summary']}
    g = lambda k, c: (S.get(k) or {}).get(c)
    check(f'[{label}] کچھ بھی تبدیل نہیں ہوا (localStorage + IndexedDB + سرور)', before == after)
    check(f'[{label}] session = ہاں', out['server']['session'] is True)
    check(f'[{label}] ضمنی (بیرونی): کل 4، باقی 3', g('ضمنی (بیرونی)', 'کل') == 4 and g('ضمنی (بیرونی)', 'سرور پر نہیں گئے') == 3, g('ضمنی (بیرونی)', 'کل'))
    check(f'[{label}] ضمنی: سرور کے رد کی وجہ دکھائی', 'سرور نے اجازت نہیں دی (1)' in (g('ضمنی (بیرونی)', 'وجوہات') or ''))
    check(f'[{label}] ضمنی مسودے: 2', g('ضمنی (بیرونی) — خودکار مسودے', 'کل') == 2)
    check(f'[{label}] بیان 161: کل 2، باقی 1', g('بیان 161 ض ف / اندرونی ضمنی', 'کل') == 2 and g('بیان 161 ض ف / اندرونی ضمنی', 'سرور پر نہیں گئے') == 1)
    ch = 'چالان / رپورٹ 173 (مکمل، نامکمل، انٹیرم، تتمہ، اخراج، عدم پتہ)'
    check(f'[{label}] چالان: کل 2، باقی 1', g(ch, 'کل') == 2 and g(ch, 'سرور پر نہیں گئے') == 1)
    check(f'[{label}] سزا سلپ: کل 2، سرور پر نہیں 1', g('سزا سلپ', 'کل') == 2 and g('سزا سلپ', 'سرور پر نہیں گئے') == 1)
    check(f'[{label}] نقشہ موقع: 2 خاکے باقی', g('نقشہ موقع', 'کل') == 2 and g('نقشہ موقع', 'سرور پر نہیں گئے') == 2)
    check(f'[{label}] درخواستیں: کل 2، باقی 1', g('محفوظ دستاویزات — درخواستیں', 'کل') == 2 and g('محفوظ دستاویزات — درخواستیں', 'سرور پر نہیں گئے') == 1)
    check(f'[{label}] dio_sd_saza_slip_… درست قسم میں', g('محفوظ دستاویزات — سزا سلپ', 'کل') == 1)
    check(f'[{label}] RFA / CRO / فوٹو کاپی: tmp_ = باقی', g('RFA فارم', 'سرور پر نہیں گئے') == 1 and g('CRO کارڈ', 'سرور پر نہیں گئے') == 1 and g('فوٹو کاپی ایف آئی آر', 'سرور پر نہیں گئے') == 1)
    check(f'[{label}] CDR: کل 2، باقی 1', g('CDR / IMEI فارم', 'کل') == 2 and g('CDR / IMEI فارم', 'سرور پر نہیں گئے') == 1)
    check(f'[{label}] واقعاتی رپورٹ: کل 2، باقی 1', g('واقعاتی رپورٹ', 'کل') == 2 and g('واقعاتی رپورٹ', 'سرور پر نہیں گئے') == 1)
    check(f'[{label}] آف لائن قطار: شہادت باقی + چالان مستقل ناکام (وجہ سمیت)',
          g('آف لائن قطار — شہادت', 'سرور پر نہیں گئے') == 1 and 'مستقل ناکام' in (g('آف لائن قطار — چالان / رپورٹ 173', 'وجوہات') or ''))
    check(f'[{label}] آف لائن بنا مقدمہ (local-) پکڑا', g('مقدمات (cache)', 'سرور پر نہیں گئے') == 1 and len(out['server']['localCaseIds']) == 1)
    miss = [m['case_id'] for m in out['server']['missingCases']]
    check(f'[{label}] سرور پر نہ ملنے والا مقدمہ: صرف U2', miss == [U2], miss)
    check(f'[{label}] تصویر/فائل جو اپ لوڈ نہیں ہوئی: 1', g('شہادت/تصاویر — فائلیں جو ابھی اپ لوڈ نہیں ہوئیں', 'سرور پر نہیں گئے') == 1)
    check(f'[{label}] نامعلوم چابی فہرست میں (کچھ چھپا نہیں)', 'dio_some_unknown_thing' in out['unknownKeys'])
    check(f'[{label}] dio_zimni_col ضمنی نہیں گنی گئی', 'dio_zimni_col' not in out['unknownKeys'] and g('ضمنی (بیرونی)', 'مقدمات') == 2)
    bk = json.load(open(path, encoding='utf-8'))
    raw = open(path, encoding='utf-8').read()
    check(f'[{label}] بیک اپ: خفیہ چابیاں شامل نہیں', 'SECRET-' not in raw and 'dio_biometric_cred' not in bk['localStorage'])
    check(f'[{label}] بیک اپ: ضمنیاں + قطار + فائل شامل', ('dio_zimni_' + U1) in bk['localStorage'] and len(bk['indexedDB'].get('sync_queue', [])) == 2
          and len(bk['indexedDB'].get('pending_files', [])) == 1 and 'session_cache' not in bk['indexedDB'])
    check(f'[{label}] اسکرین پر خلاصہ (RTL)', pg.evaluate("(()=>{const p=document.getElementById('dio-inv-panel');return !!p && p.dir==='rtl' && p.querySelectorAll('tr').length>10})()"))
    check(f'[{label}] صفحے پر کوئی JS غلطی نہیں', not errs, errs[:3])
    # session نہ ہو (آف لائن لاگ اِن کی حالت) — صاف بتائے
    pg.evaluate("supabaseClient.auth.getSession = async () => ({ data: { session: null }, error: null })")
    with pg.expect_download():
        out2 = pg.evaluate(SCRIPT)
    check(f'[{label}] session نہیں → «نہیں» صاف لکھا', out2['server']['session'] is False and
          'سرور پر کچھ نہیں بھیج سکتا' in pg.evaluate("document.getElementById('dio-inv-panel').innerText"))
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch()
    run(b, 'desktop', {'width': 1366, 'height': 768})
    run(b, 'mobile', {'width': 390, 'height': 844}, mobile=True)
    b.close()
fails = [n for n, ok in res if not ok]
print(f'\n{len(res) - len(fails)}/{len(res)} PASS')
sys.exit(1 if fails else 0)
