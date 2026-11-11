"""(TASK 19) اصل ایپ کی جانچ — پورے نظام میں ایک جیسے بٹن اور نشانات

افسر کا حکم (11 نومبر 2026): «ایک ہی نام / کام کا ہر بٹن ہر جگہ بالکل ایک جیسا — وہی شکل، ناپ، نشان، رنگ اور نام۔
معیار = مقدمہ کی فہرست کے ایکشن بٹن۔ تمام نشانات ایک ہی سیٹ سے۔» فیصلے: دو صورتیں ایک بٹن (فہرست میں صرف نشان،
پٹی / کارڈ / ⋯ میں نشان + نام)؛ ہر جگہ سرمئی، صرف «+ … درج کریں» اور کارڈ کا آخری تصدیقی بٹن گہرا؛ ایک کام = ایک لفظ۔

Desktop 1366×768 اور Mobile 390×844 (touch)، اصل ایپ (صرف Supabase آزمائشی):
  1) 14 اسکرینوں پر ہر نظر آنے والا مشترکہ بٹن: (کام، صورت، رنگ) کی ہر جوڑی کا ایک ہی روپ — ناپ، رنگ، کنارہ،
     گولائی، حروف، نشان کا ناپ اور نشان کی ڈرائنگ؛ مقدمہ کی فہرست کا ناپ (24pt / موبائل 33pt، نشان 11.25pt)
  2) پرنٹ / شیئر / ڈاؤن لوڈ / کاپی / ڈپلیکیٹ / واپس کا نشان ہر اسکرین پر ایک ہی (اور سیٹ والا)
  3) کسی نظر آنے والے بٹن میں ایموجی، الٹا تیر یا اپنی SVG نہیں؛ ▾ چننے والے سب ایک شکل
  4) بٹن اپنا کام کرتے ہیں: مقدمہ کی فہرست (کھولیں / ترمیم / پرنٹ / ڈاؤن لوڈ / شیئر / حذف)، ضمنی کی فہرست
     (ترمیم / پرنٹ / شیئر / ڈپلیکیٹ / حذف)، ⋯ فہرست (محفوظ / پرنٹ / واپس)، چالان کی پٹی (B، کالعدم)،
     واقعاتی رپورٹ (محفوظ / پرنٹ / فہرست)، ہوم، 5-C جواب کا ribbon (B، تلاش، بند)، سسٹم کے فارم (پرنٹ)
  5) ⋯ کا «پرنٹ» = Ctrl+P (وہی کاغذ)
  6) ٹیبوں کی پٹی اور اوپر کی پٹی: نشان اسی سیٹ سے (شکل وہی — موازنہ: t19_compare.py)
چلانا: `python3 t19_test.py` (DIO_ONLY=desktop|mobile)
"""
from v564_common import *

V = OUT + '/t19/'
os.makedirs(V, exist_ok=True)
R = []


def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:500] if extra != '' else ''), flush=True)


SEED19 = """(() => { const d = window.__db;
  const c1 = d.cases.find(c => c.id === 'c1');
  Object.assign(c1, { fir_number:'663/26', fir_date:'15/10/2026', occurrence_date:'22/09/2026', section_of_law:'379 ت پ',
    complainant:'محمد امجد حسین ولد عاشق حسین قوم آرائیں سکنہ بیرون دہلی گیٹ ملتان', complainant_cnic:'36302-1234567-1', complainant_cell:'0300-1234567',
    case_station:'صدر ملتان', case_district:'ملتان' });
  d.fir_matn = [{ id:'m1', case_id:'c1', type:'fir', matn:'سائل ایک شریف اور قانون پسند شہری ہے۔', created_at:'2026-10-15' }];
  d.case_witnesses = [{ id:'w1', case_id:'c1', full_name:'شہزاد احمد ولد بشیر احمد', witness_type:'fir', status:'fir_eye', created_at:'2026-10-15' }];
  d.report_173 = [{ id:'r1', case_id:'c1', officer_id:'o1', report_type:'interim', report_subtype:'fir', form_data:{ head:'انٹیرم چالان', saved_at:'2026-10-20T10:00:00Z' }, created_at:'2026-10-20T10:00:00Z' }];
  d.applications_5c = [{ id:'f1', officer_id:'o1', serial_number:12, complainant_name:'محمد رفیق', complainant_cnic:'36302-1111111-1',
    received_date:'2026-10-20', status:'pending', created_at:'2026-10-20', application_5c_numbers:[], application_5c_attachments:[] }];
  d.zimni_reports = []; d.zimni_androoni_reports = [];
  Object.keys(localStorage).filter(k => /^dio_za_|^dio_zimni_/.test(k)).forEach(k => localStorage.removeItem(k));
  return Promise.all(d.cases.map(c => offlineStore.cache('cases_cache', JSON.parse(JSON.stringify(c))))).then(() => 0); })()"""

# ہر نظر آنے والا مشترکہ بٹن / ▾ چننے والا / باقی بٹن — اسی لمحے کی اصل شکل (computed)
LOOKS = r"""(() => {
  const vis = (el) => { const r = el.getBoundingClientRect(); if (r.width < 3 || r.height < 3) return false;
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity < .05) return false; } return true; };
  const pt = (v) => Math.round(parseFloat(v) * 0.75 * 100) / 100;
  const EMO = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}←→↑↓⬅➡⬆⬇✕✖×▾▼▲⋯↶↷↩↪⤓⇤⇥⇔⇅⇋⟲⟳]/u;
  const btn = [], pick = [], bad = [];
  document.querySelectorAll('.dio-btn').forEach(b => { if (!vis(b)) return;
    const s = getComputedStyle(b), i = b.querySelector('.dio-i'), r = b.getBoundingClientRect();
    const is = i ? getComputedStyle(i) : null, ir = i ? i.getBoundingClientRect() : null;
    btn.push({ act: b.getAttribute('data-act') || '', form: b.querySelector(':scope > span') ? 'lbl' : 'ico',
      tone: b.classList.contains('dio-btn--pri') ? 'pri' : b.classList.contains('dio-btn--danger') ? 'danger' : 'grey',
      w: Math.round(r.width), h: Math.round(r.height), bg: s.backgroundColor, fg: s.color, bd: s.borderTopWidth + ' ' + s.borderTopColor, rad: s.borderTopLeftRadius,
      fs: pt(s.fontSize), ff: s.fontFamily.split(',')[0].replace(/["']/g, ''), iw: ir ? Math.round(ir.width) : 0, ih: ir ? Math.round(ir.height) : 0,
      ico: i ? i.getAttribute('data-ico') : '', mask: is ? (is.getPropertyValue('--dio-i') || '').trim().length + ':' + (is.getPropertyValue('--dio-i') || '').trim().slice(-60) : '',
      svg: !!b.querySelector('svg'), title: b.title || '', where: (b.closest('[id]') || {}).id || '' }); });
  // ▾ چننے والے: کاغذ کو موبائل پر چھوٹا/بڑا (zoom / transform) کیا جاتا ہے — ناپ CSS والا (zoom سے پہلے) لیا جائے
  document.querySelectorAll('.dio-pick').forEach(b => { if (!vis(b)) return; const s = getComputedStyle(b), i = b.querySelector('.dio-i'), z = b.currentCSSZoom || 1;
    let zoomed = Math.abs(z - 1) > 0.01; for (let e = b; e && e.nodeType === 1 && !zoomed; e = e.parentElement) { const t = getComputedStyle(e).transform; if (t && t !== 'none') zoomed = true; }
    pick.push({ w: Math.round(b.offsetWidth), h: Math.round(b.offsetHeight), bg: s.backgroundColor, fg: s.color, bd: s.borderTopWidth + ' ' + s.borderTopColor,
      rad: s.borderTopLeftRadius, ico: i ? i.getAttribute('data-ico') : '', inDoc: !!b.closest('#ch173-doc:not(.zf-editor)'), zoomed }); });
  document.querySelectorAll('button, [role=button], .dio-pick').forEach(b => { if (!vis(b)) return;
    const t = (b.innerText || '').trim(); if (EMO.test(t) && !b.closest('.dio-tile, .dio-stat, [contenteditable=true], .cc-i, .dvm-tab')) bad.push('emoji «' + t.slice(0, 20) + '» ' + (b.title || b.className).slice(0, 40));
    if (b.querySelector('svg') && !b.closest('.dio-tile, .dio-stat, .login-method, #login-screen') && !b.matches('.dio-tile, .dio-stat, .login-method')) bad.push('svg ' + (b.title || b.className).slice(0, 40)); });
  return { btn, pick, bad };
})()"""

HOOK = """(() => { window.__dp = []; window.__dioPaperAuto = 'keep';
  if (!window.__dpOrig) window.__dpOrig = window._dioDoPrint;
  window._dioDoPrint = function (h) { window.__dp.push(String(h).length); };
  window.__ex = []; if (!window.__exOrig) { window.__exOrig = document.execCommand.bind(document);
    document.execCommand = function (c) { window.__ex.push(String(c)); return window.__exOrig.apply(document, arguments); }; }
  window.__conf = 0; window.confirm = () => { window.__conf++; return false; };
  return 0; })()"""


def ev(pg, js, ms=1200):
    try:
        r = pg.evaluate(js)
    except Exception as e:
        print('  js fail', js[:70], str(e)[:160]); r = None
    pg.wait_for_timeout(ms)
    return r


def reset(pg):
    ev(pg, """try{_dioMenuClose()}catch(e){} try{_irClose(true)}catch(e){} try{_dioResetTabs&&_dioResetTabs()}catch(e){} try{_dioExitDocView()}catch(e){} try{closeModal()}catch(e){}
      try{document.body.classList.remove('r5c-open'); const o=document.getElementById('response5c-overlay'); o&&o.remove();}catch(e){}
      try{document.querySelectorAll('#dio-paper-ask,#dio-dv-picker,#wb-find-box,.cc-menu').forEach(x=>x.remove());}catch(e){} 0""", 400)


def click(pg, sel, ms=1200):
    try:
        pg.evaluate("(s) => { const b = [...document.querySelectorAll(s)].find(x => { const r = x.getBoundingClientRect(); return r.width > 2 && r.height > 2; }); if (!b) throw new Error('no ' + s); b.click(); return 0; }", sel)
        pg.wait_for_timeout(ms); return True
    except Exception as e:
        print('  click fail', sel, str(e)[:120]); return False


def modal_text(pg):
    return pg.evaluate("(() => { const m = document.getElementById('modal-backdrop'); return m && getComputedStyle(m).display !== 'none' ? (m.innerText || '').slice(0, 200) : ''; })()")


SCREENS = [
    ('cases', ["showPage('cases', null)"]),
    ('case_workspace', ["openCaseWorkspace('c1')"]),
    ('zimni_list', ["openCaseWorkspace('c1')", "_openMisalEditor('zamniyat')"]),
    ('zimni_editor_menu', ["openCaseWorkspace('c1')", "_openMisalEditor('zamniyat')", "_newZimni()", "document.getElementById('dio-dv-fab').click()"]),
    ('statements_161', ["openCaseWorkspace('c1')", "_openMisalEditor('statements_161')"]),
    ('challan_list', ["openCaseWorkspace('c1')", "openR173List()"]),
    ('challan_editor', ["openCaseWorkspace('c1')", "openR173List()", "_r173NewDoc(false)"]),
    ('naqsha_editor', ["openCaseWorkspace('c1')", "_openMisalEditor('crime_scene')", "_naqNew()"]),
    ('incident_editor', ["showPage('incident', null)", "openIncidentNew()"]),
    ('templates', ["showPage('templates', null)"]),
    ('fir', ["openCaseWorkspace('c1')", "_openMisalEditor('fir')"]),
    ('cdr_editor', ["openCaseWorkspace('c1')", "_openMisalEditor('cdr_imei')", "_newCdr()"]),
    ('darkhwast_editor', ["openCaseWorkspace('c1')", "_openMisalEditor('darkhwastain')", "_dkNewEntry()"]),
    ('case_print_card', ["showPage('cases', null)", "openCasePrint('c1')"]),
    ('reply_5c', ["showPage('fivec', null)", "open5CResponse('f1')"]),
]


def run(b, tag, vp, extra):
    desktop = tag == 'desktop'
    ctx, pg, errs = open_app(b, viewport=vp, **extra)
    pg.evaluate("document.documentElement.classList.add('dio-child'); 0")   # جیسے v570 کی ٹیب کے اندر
    pg.evaluate(SEED19)
    # ضمنیاں اصل راستے سے (فہرست میں قطاریں ہوں)
    pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
    for i, (txt, dt) in enumerate([(' پہلی ضمنی — تفتیش جاری ہے۔', '19/10/2026'), (' دوسری ضمنی — گواہان کے بیانات۔', '20/10/2026')]):
        ev(pg, "openCaseWorkspace('c1')", 1300); ev(pg, "openZimniEditor('c1')", 1200); ev(pg, "_newZimni()", 1600)
        pg.evaluate("""(d) => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = d; a.dispatchEvent(new Event('input',{bubbles:true})); return 0; }""", dt)
        pg.evaluate("""(t) => { const b = document.querySelector('#ch173-doc .zf-body'); b.focus(); const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
          const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, t); return 0; }""", txt)
        pg.keyboard.press('Control+s'); pg.wait_for_timeout(1800)
    n_z = pg.evaluate("window.__db.zimni_reports.filter(z => z.case_id === 'c1').length")
    check(f'{tag} 0) تیاری: دو ضمنیاں محفوظ (اصل Ctrl+S)', n_z == 2, n_z)
    pg.evaluate(HOOK)

    # ── 1–3) ہر اسکرین کے بٹنوں کی شکل ──
    allb, allp, bad = [], [], []
    for name, steps in SCREENS:
        if name == 'reply_5c' and not desktop: continue
        reset(pg)
        for s_ in steps: ev(pg, s_, 1800)
        L = pg.evaluate(LOOKS)
        for x in L['btn']: x['screen'] = name
        allb += L['btn']; allp += L['pick']; bad += [name + ': ' + x for x in L['bad']]
        pg.screenshot(path=V + f'{tag}_{name}.png')
    pg.evaluate(HOOK)
    groups = {}
    for x in allb:
        k = (x['act'], x['form'], x['tone'])
        look = (x['h'], x['bg'], x['fg'], x['bd'], x['rad'], x['fs'], x['ff'], x['iw'], x['ih'], x['mask']) + ((x['w'],) if x['form'] == 'ico' else ())
        groups.setdefault(k, {}).setdefault(look, set()).add(x['screen'])
    multi = {"|".join(k): {str(lk): sorted(v) for lk, v in g.items()} for k, g in groups.items() if len(g) > 1}
    json.dump({'multi': multi, 'all': allb}, open(V + f'{tag}_looks.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    check(f'{tag} 1) ہر (کام، صورت، رنگ) کا ایک ہی روپ — {len(allb)} بٹن، {len(groups)} جوڑیاں، {len(set(x["screen"] for x in allb))} اسکرینیں',
          not multi and len(allb) > 150, json.dumps(multi, ensure_ascii=False)[:1500])
    want_h = 32 if desktop else 44
    std = [x for x in allb if x['act'] in ('open', 'edit', 'print', 'download', 'share', 'delete') and x['form'] == 'ico' and x['screen'] == 'cases']
    check(f'{tag} 1) معیار: مقدمہ کی فہرست کے بٹن {want_h}×{want_h}px، نشان 15px، گولائی 8px، سرمئی',
          len(std) >= 6 and all(x['w'] == want_h and x['h'] == want_h and x['iw'] == 15 and x['rad'] == '8px' and x['tone'] == 'grey' for x in std),
          [(x['act'], x['w'], x['h'], x['iw'], x['rad']) for x in std[:6]])
    heights = sorted(set(x['h'] for x in allb))
    check(f'{tag} 1) ہر مشترکہ بٹن کی اونچائی ایک ({want_h}px)', heights == [want_h], heights)
    tones = sorted(set((x['act'], x['tone']) for x in allb if x['tone'] != 'grey'))
    check(f'{tag} 1) رنگ: سرمئی؛ گہرا صرف «+ … درج کریں» اور کارڈ کا آخری بٹن', all(a in ('add', 'save', 'print', 'download', 'share', 'delete', 'reject', 'lock', 'check', 'mail') for a, _ in tones), tones)
    for act in ('print', 'share', 'download', 'copy', 'duplicate', 'back'):
        ms = set(x['mask'] for x in allb if x['act'] == act and x['ico'] == act)
        scr = sorted(set(x['screen'] for x in allb if x['act'] == act))
        check(f'{tag} 2) «{act}» کا نشان ہر اسکرین پر ایک ({len(scr)} اسکرینیں)', len(ms) == 1 and len(scr) >= (1 if act in ('copy', 'duplicate') else 2), [scr, len(ms)])
    reg = pg.evaluate("(() => { const i = document.createElement('i'); i.className = 'dio-i'; i.dataset.ico = 'print'; document.body.appendChild(i); const v = getComputedStyle(i).getPropertyValue('--dio-i').trim(); i.remove(); return v.length + ':' + v.slice(-60); })()")
    check(f'{tag} 2) پرنٹ کا نشان = سیٹ (dio-icons.js) والا', all(x['mask'] == reg for x in allb if x['ico'] == 'print'), reg[:40])
    check(f'{tag} 3) کسی بٹن میں ایموجی / تیر کا حرف / اپنی SVG نہیں', not bad, bad[:10])
    pk = set((x['bg'], x['fg'], x['bd'], x['rad']) for x in allp if not x['zoomed'])
    sizes = set((x['w'], x['h']) for x in allp if not x['inDoc'] and not x['zoomed'])   # موبائل پر کاغذ zoom ہوتا ہے — اس کے اندر کا ناپ اسی تناسب سے
    check(f'{tag} 3) ▾ چننے والے ({len(allp)}) سب ایک شکل', len(pk) == 1 and len(sizes) == 1 and all(x['ico'] in ('dropdown', 'calendar', 'location') for x in allp), [pk, sizes])

    # ── 4) بٹن اپنا کام کرتے ہیں ──
    try:
        reset(pg); ev(pg, "showPage('cases', null)", 1500)
        row = "#page-content tr:has([data-act=open])"
        ok_open = click(pg, '#page-content [data-act=open]', 1500) and pg.evaluate("!!document.getElementById('misal-doc-bar')")
        res = {'open': ok_open}
        for act, word in (('edit', 'ترمیم'), ('print', 'پرنٹ'), ('download', 'ڈاؤن لوڈ'), ('share', 'شیئر'), ('delete', 'حذف')):
            reset(pg); ev(pg, "showPage('cases', null)", 1300)
            click(pg, f'#page-content [data-act={act}]', 1500)
            res[act] = word in modal_text(pg)
        check(f'{tag} 4) مقدمہ کی فہرست: کھولیں / ترمیم / پرنٹ / ڈاؤن لوڈ / شیئر / حذف — ہر ایک اپنا کام', all(res.values()), res)
    except Exception as e:
        check(f'{tag} 4) مقدمہ کی فہرست', False, repr(e)[:300])
    try:
        res = {}
        reset(pg); ev(pg, "openCaseWorkspace('c1')", 1300); ev(pg, "_openMisalEditor('zamniyat')", 1800)
        n0 = len(pg.evaluate("window.__dp"))
        click(pg, '.zt [data-act=print]', 3000); res['print'] = len(pg.evaluate("window.__dp")) == n0 + 1
        reset(pg); ev(pg, "openCaseWorkspace('c1')", 1300); ev(pg, "_openMisalEditor('zamniyat')", 1800)
        click(pg, '.zt [data-act=edit]', 2500); res['edit'] = pg.evaluate("!!document.querySelector('#ch173-doc tr.zf-blk .zf-body') && /تفتیش جاری|گواہان/.test(document.querySelector('#ch173-doc').innerText)")
        reset(pg); ev(pg, "openCaseWorkspace('c1')", 1300); ev(pg, "_openMisalEditor('zamniyat')", 1800)
        click(pg, '.zt [data-act=duplicate]', 2500); res['duplicate'] = pg.evaluate("!!document.getElementById('zf-dup-badge')")
        reset(pg); ev(pg, "openCaseWorkspace('c1')", 1300); ev(pg, "_openMisalEditor('zamniyat')", 1800)
        c0 = pg.evaluate("window.__conf"); m0 = modal_text(pg)
        click(pg, '.zt [data-act=delete]', 1200); res['delete'] = pg.evaluate("window.__conf") == c0 + 1 or 'حذف' in modal_text(pg)
        reset(pg); ev(pg, "openCaseWorkspace('c1')", 1300); ev(pg, "_openMisalEditor('zamniyat')", 1800)
        pg.evaluate("window.__shareRuns = 0; window.__spOrig = window.dioSharePrint; window.dioSharePrint = async function () { window.__shareRuns++; return true; }; 0")
        click(pg, '.zt [data-act=share]', 1500)
        res['share'] = pg.evaluate("window.__shareRuns") == 1
        pg.evaluate("window.dioSharePrint = window.__spOrig; 0")
        n_z = pg.evaluate("window.__db.zimni_reports.filter(z => z.case_id === 'c1').length")
        check(f'{tag} 4) ضمنی کی فہرست: پرنٹ / ترمیم / ڈپلیکیٹ / حذف (تصدیق) / شیئر — کوئی ضمنی ضائع نہیں', all(res.values()) and n_z == 2, [res, n_z])
    except Exception as e:
        check(f'{tag} 4) ضمنی کی فہرست', False, repr(e)[:300])
    try:
        res = {}
        reset(pg); ev(pg, "openCaseWorkspace('c1')", 1300); ev(pg, "_openMisalEditor('zamniyat')", 1800); ev(pg, "_newZimni()", 2000)
        pg.evaluate("""(() => { const a = document.querySelector('#ch173-doc tr.zf-blk .zf-actbody'); a.textContent = '21/10/2026'; a.dispatchEvent(new Event('input',{bubbles:true}));
          const b = document.querySelector('#ch173-doc .zf-body'); b.focus(); const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
          const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('insertText', false, ' تیسری ضمنی — ⋯ کے «محفوظ کریں» سے۔'); return 0; })()""")
        pg.wait_for_timeout(400)
        n0 = pg.evaluate("window.__db.zimni_reports.length")
        click(pg, '#dio-dv-fab', 500); click(pg, '#dio-dv-menu [data-act=save]', 2200)
        res['save'] = pg.evaluate("window.__db.zimni_reports.length") == n0 + 1
        d0 = len(pg.evaluate("window.__dp")); pg.evaluate("window.__dioPaperAuto = 'keep'; 0")
        click(pg, '#dio-dv-fab', 500); click(pg, '#dio-dv-menu [data-act=print]', 3000)
        h_btn = pg.evaluate("window.__dp.slice(-1)[0]")
        pg.evaluate("window.__dioPaperAuto = 'keep'; document.querySelectorAll('#dio-paper-ask').forEach(x => x.remove()); 0")
        pg.evaluate("""(() => { const b = document.querySelector('#ch173-doc tr.zf-blk .zf-body'); b.focus(); const r = document.createRange(); r.selectNodeContents(b); r.collapse(false);
          const s = getSelection(); s.removeAllRanges(); s.addRange(r); return 0; })()""")
        pg.keyboard.press('Control+p'); pg.wait_for_timeout(3000)
        h_key = pg.evaluate("window.__dp.slice(-1)[0]")
        res['print'] = len(pg.evaluate("window.__dp")) == d0 + 2
        check(f'{tag} 5) ⋯ کا «پرنٹ» = Ctrl+P (وہی کاغذ، حروف کی لمبائی برابر)', res['print'] and h_btn == h_key and h_btn > 1000, [h_btn, h_key])
        click(pg, '#dio-dv-fab', 500); click(pg, '#dio-dv-menu [data-act=back]', 1800)
        res['back'] = pg.evaluate("!document.querySelector('#ch173-doc tr.zf-blk')")
        check(f'{tag} 4) ⋯ فہرست: محفوظ کریں (سرور پر) / پرنٹ / واپس', all(res.values()), res)
    except Exception as e:
        check(f'{tag} 4) ⋯ فہرست', False, repr(e)[:300])
    try:
        reset(pg); ev(pg, "openCaseWorkspace('c1')", 1300); ev(pg, "openR173List()", 1800); ev(pg, "_r173NewDoc(false)", 2500)
        pg.evaluate("window.__ex = []; 0")
        pg.evaluate("(() => { const e = document.querySelector('#ch173-doc .rotinner[contenteditable=true], #ch173-doc [contenteditable=true]'); e.focus(); return 0; })()")
        click(pg, '[data-act=bold]', 300); click(pg, '[data-act=undo]', 300)
        ex = pg.evaluate("window.__ex")
        check(f'{tag} 4) چالان کی پٹی: B → bold، کالعدم → undo', 'bold' in ex and 'undo' in ex, ex)
    except Exception as e:
        check(f'{tag} 4) چالان کی پٹی', False, repr(e)[:300])
    try:
        res = {}
        reset(pg); ev(pg, "showPage('incident', null)", 1200); ev(pg, "openIncidentNew()", 2200)
        pg.evaluate("""(() => { const f = document.querySelector('#ir-doc [data-k=nature]'); f.focus(); document.execCommand('insertText', false, 'چوری'); f.dispatchEvent(new Event('input', {bubbles: true})); return 0; })()""")
        pg.wait_for_timeout(400)
        n0 = pg.evaluate("(window.__db.incident_reports || []).length")
        click(pg, '.ir-strip [data-act=save]', 2200); res['save'] = pg.evaluate("(window.__db.incident_reports || []).length") == n0 + 1
        p0 = pg.evaluate("window.__printCalls") + len(pg.evaluate("window.__dp"))
        click(pg, '.ir-strip [data-act=print]', 2500); res['print'] = pg.evaluate("window.__printCalls") + len(pg.evaluate("window.__dp")) > p0
        pg.evaluate("window.confirm = () => true; 0")
        click(pg, '.ir-strip [data-act=back]', 1500); res['back'] = pg.evaluate("!document.getElementById('ir-view')")
        pg.evaluate("window.confirm = () => { window.__conf++; return false; }; 0")
        check(f'{tag} 4) واقعاتی رپورٹ: محفوظ کریں / پرنٹ / فہرست', all(res.values()), res)
    except Exception as e:
        check(f'{tag} 4) واقعاتی رپورٹ', False, repr(e)[:300])
    try:
        reset(pg); ev(pg, "showPage('templates', null)", 2000)
        d0 = len(pg.evaluate("window.__dp")); p0 = pg.evaluate("window.__printCalls")
        click(pg, '#tpl-forms-wrap [data-act=print]', 3500)
        ok = len(pg.evaluate("window.__dp")) > d0 or pg.evaluate("window.__printCalls") > p0
        check(f'{tag} 4) سسٹم کے فارم: پرنٹ', ok)
    except Exception as e:
        check(f'{tag} 4) سسٹم کے فارم', False, repr(e)[:300])
    try:
        reset(pg); ev(pg, "showPage('cases', null)", 1200)
        click(pg, '#dio-home-btn', 1500)
        check(f'{tag} 4) اوپر کی پٹی: ہوم → ڈیش بورڈ (نشان اسی سیٹ کا)', pg.evaluate("window._activePage") == 'dashboard'
              and pg.evaluate("document.querySelector('#dio-home-btn .dio-i').dataset.ico") == 'home')
    except Exception as e:
        check(f'{tag} 4) ہوم', False, repr(e)[:300])
    if desktop:
        try:
            res = {}
            reset(pg); ev(pg, "showPage('fivec', null)", 1500); ev(pg, "open5CResponse('f1')", 2500)
            pg.evaluate("window.__ex = []; 0")
            pg.evaluate("document.getElementById('a4-paper').focus(); 0")
            click(pg, '.wb-ribbon [data-act=bold]', 300)
            res['bold'] = 'bold' in pg.evaluate("window.__ex")
            click(pg, '.wb-ribbon [data-act=search]', 500); res['find'] = pg.evaluate("!!document.getElementById('wb-find-box')")
            click(pg, '#wb-find-box [data-act=close]', 400); res['close'] = pg.evaluate("!document.getElementById('wb-find-box')")
            labels = pg.evaluate("[...document.querySelectorAll('.wb-ribbon button, .wb-ribbon .wb-glab')].map(b => (b.innerText || '') + ' ' + (b.title || '')).join(' | ')")
            res['urdu'] = not re.search(r'\b(Paste|Cut|Copy|Find|Replace|Undo|Redo|Bold|Clipboard|Font|Paragraph|Styles|Editing|Heading)\b', labels)
            check(f'{tag} 4) 5-C جواب کا ribbon: B / تلاش / بند — اور کوئی انگریزی نام نہیں', all(res.values()), res)
        except Exception as e:
            check(f'{tag} 4) 5-C ribbon', False, repr(e)[:300])
    check(f'{tag}: کوئی JS غلطی نہیں', not errs, errs[:3])
    ctx.close()

    # ── 6) ٹیبوں کی پٹی (اصل v570 ٹیبیں) ──
    try:
        from t22_common import open_tabs
        tctx, tp, terrs = open_tabs(b, desktop=desktop)
        ic = tp.evaluate("[...document.querySelectorAll('#dio-tabs-strip button, #dio-tabs-strip .x')].map(b => [b.getAttribute('data-act'), (b.querySelector('.dio-i') || {}).dataset ? b.querySelector('.dio-i').dataset.ico : null, !!b.querySelector('svg')])")
        want = {'back': 'back', 'fwd': 'forward', 'new': 'add', 'close': 'close', 'split': 'split'}
        ok = all(i == want[a] and not s for a, i, s in ic if a in want) and any(a == 'back' for a, _, _ in ic)
        tp.screenshot(path=V + f'{tag}_tabs.png', clip={'x': 0, 'y': 0, 'width': vp['width'], 'height': 110 if desktop else 200})
        n = len(tp.evaluate("DIOTabs._state().tabs"))
        tp.click('#dio-tabs-strip [data-act="new"]'); tp.wait_for_timeout(1500)
        n2 = len(tp.evaluate("DIOTabs._state().tabs"))
        check(f'{tag} 6) ٹیبوں کی پٹی: واپس / آگے / + / ✕ / ساتھ ساتھ — نشان اسی سیٹ سے (اپنی SVG نہیں)؛ «+» نئی ٹیب کھولے', ok and n2 == n + 1, [ic, n, n2])
        check(f'{tag} 6) ٹیبوں میں کوئی JS غلطی نہیں', not terrs, terrs[:3])
        tctx.close()
    except Exception as e:
        check(f'{tag} 6) ٹیبوں کی پٹی', False, repr(e)[:300])


with sync_playwright() as p:
    b = p.chromium.launch()
    only = os.environ.get('DIO_ONLY', '')
    if only in ('', 'desktop'):
        run(b, 'desktop', {'width': 1366, 'height': 768}, {})
    if only in ('', 'mobile'):
        run(b, 'mobile', {'width': 390, 'height': 844}, dict(is_mobile=True, has_touch=True, device_scale_factor=2))
    b.close()

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
