"""(v551) لینڈنگ صفحہ: قرآن و حدیث صرف یہاں (ڈیش بورڈ پر نہیں) · ترتیب: پٹی → 4 کارڈ → تعارفی سطر ·
(22 اکتوبر 2026) سب درود پاک سے متعلق، ہر بار کھلنے پر نئی، 15 سیکنڈ · عربی Amiri / Amiri Quran، اردو Jameel Noori · ڈیش بورڈ: صورتحال «دیگر سہولیات» سے اوپر،
«ملزمان / گواہان» بٹن نہیں — Desktop + Mobile"""
import sys
from real import *

fails = []
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg)
    if not cond: fails.append(msg)

def landing(b, name, vp):
    ctx = b.new_context(service_workers='block', viewport=vp)
    ctx.route('**/*', route)
    pg = ctx.new_page(); errs = []
    pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.clock.install()
    pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
    pg.evaluate("document.fonts.ready"); pg.wait_for_timeout(600)
    r = pg.evaluate("""() => {
      const z = document.getElementById('dio-zikr');
      const land = document.querySelector('#login-screen .dio-land-hero');
      const kids = [...land.children].map(e => e.className || e.id);
      const ar = document.getElementById('dio-zikr-ar'), ur = document.getElementById('dio-zikr-ur');
      return { kids, kind: z.dataset.kind, ar: ar.textContent, ur: ur.textContent,
        ref: document.getElementById('dio-zikr-ref').textContent,
        arFont: getComputedStyle(ar).fontFamily, urFont: getComputedStyle(ur).fontFamily,
        visible: z.getBoundingClientRect().height > 0,
        hOverflow: document.documentElement.scrollWidth > innerWidth + 1,
        n: DIOZikr.items.length, hold: DIOZikr.holdMs };
    }""")
    check(r['visible'], f'{name}: قرآن/حدیث کی پٹی لینڈنگ پر نظر آتی ہے')
    order = [k for k in r['kids'] if any(x in k for x in ('dio-zikr', 'dio-land-feats', 'dio-land-lead'))]
    check(order == ['dio-zikr', 'dio-land-feats', 'dio-land-lead'], f'{name}: ترتیب پٹی → 4 کارڈ → تعارفی سطر ({order})')
    check(bool(r['ar']) and bool(r['ur']) and bool(r['ref']), f'{name}: عربی + اردو + حوالہ بھرے ہوئے')
    check(r['hold'] == 15000, f'{name}: وقفہ {r["hold"]}ms = 15000 (پہلے 30000)')
    check(not r['hOverflow'], f'{name}: افقی scroll نہیں')
    pg.screenshot(path=f'{OUT}/land_{name}_1.png', full_page=True)
    # وقت کی پیمائش ایک تازہ تبدیلی سے: start() ابھی اگلی دکھاتا ہے اور 30s کا وقفہ نئے سرے سے
    pg.evaluate("DIOZikr.start()"); pg.clock.run_for(300)
    r['kind'] = pg.evaluate("document.getElementById('dio-zikr').dataset.kind")
    r['arFont'] = pg.evaluate("getComputedStyle(document.getElementById('dio-zikr-ar')).fontFamily")
    first = pg.evaluate("document.getElementById('dio-zikr-ar').textContent")
    pg.clock.run_for(13600); pg.wait_for_timeout(50)
    same = pg.evaluate("document.getElementById('dio-zikr-ar').textContent") == first
    check(same, f'{name}: 14 سیکنڈ پر وہی آیت/حدیث')
    pg.clock.run_for(1500); pg.wait_for_timeout(400)
    st = pg.evaluate("({a:document.getElementById('dio-zikr-ar').textContent, k:document.getElementById('dio-zikr').dataset.kind, f:getComputedStyle(document.getElementById('dio-zikr-ar')).fontFamily})")
    check(st['a'] != first, f'{name}: 15 سیکنڈ بعد اگلی (قسم: {r["kind"]}→{st["k"]})')
    # فونٹ: ایک آیت اور ایک حدیث خود دکھا کر ناپو
    fq = pg.evaluate("(()=>{const i=DIOZikr.items.find(x=>x.k==='q');const z=document.getElementById('dio-zikr');z.dataset.kind='q';return getComputedStyle(document.getElementById('dio-zikr-ar')).fontFamily})()")
    fh = pg.evaluate("(()=>{const z=document.getElementById('dio-zikr');z.dataset.kind='h';return getComputedStyle(document.getElementById('dio-zikr-ar')).fontFamily})()")
    check('Amiri Quran DIO' in fq.split(',')[0], f'{name}: آیت کا فونٹ {fq.split(",")[0]}')
    check('Amiri DIO' in fh.split(',')[0], f'{name}: حدیث کا فونٹ {fh.split(",")[0]}')
    check('Jameel Noori Nastaleeq' in r['urFont'].split(',')[0], f'{name}: اردو ترجمہ کا فونٹ {r["urFont"].split(",")[0]}')
    fl = pg.evaluate("""async () => { await document.fonts.ready;
      return ['Amiri Quran DIO','Amiri DIO','Jameel Noori Nastaleeq'].map(f => [f, document.fonts.check('16pt "'+f+'"', 'سُبۡحَٰنَ')]); }""")
    for f, ok in fl: check(ok, f'{name}: فونٹ لوڈ ہوا — {f}')
    pg.screenshot(path=f'{OUT}/land_{name}_2.png', full_page=True)
    # سب 24 آئٹم باری باری — کوئی خالی/ٹوٹا نہیں
    # ہر آئٹم مقرر خانے میں پورا سمائے (کچھ کٹے نہیں) اور کارڈ کی اونچائی نہ بدلے
    fitr = pg.evaluate("""async () => { DIOZikr.stop(); const z = document.getElementById('dio-zikr'); const out = [];
      const h0 = document.querySelector('#login-screen .dio-land').getBoundingClientRect().height;
      for (let i = 0; i < DIOZikr.items.length; i++) { const it = DIOZikr.items[i];
        z.dataset.kind = it.k; document.getElementById('dio-zikr-ar').textContent = it.a;
        document.getElementById('dio-zikr-ur').textContent = it.u; document.getElementById('dio-zikr-ref').textContent = it.r;
        DIOZikr.fit();
        const zk = parseFloat(z.style.getPropertyValue('--zk')) || 1;
        out.push({ r: it.r, over: z.scrollHeight - z.clientHeight, zk,
                   land: document.querySelector('#login-screen .dio-land').getBoundingClientRect().height - h0 }); }
      return out; }""")
    over = [x for x in fitr if x['over'] > 1]
    check(not over, f'{name}: تمام آئٹم خانے میں پورے (کٹے نہیں) {[(x["r"], x["over"]) for x in over][:4]}')
    jump = [x for x in fitr if abs(x['land']) > 1]
    check(not jump, f'{name}: آئٹم بدلنے پر کارڈ کی اونچائی نہیں بدلتی {[(x["r"], x["land"]) for x in jump][:3]}')
    small = min(fitr, key=lambda x: x['zk'])
    print(f'      کم ترین پیمانہ: {small["zk"]} ({small["r"]})')
    fits_screen = pg.evaluate("document.documentElement.scrollHeight <= innerHeight + 1")
    if name.startswith('desktop'): check(fits_screen, f'{name}: پورا لینڈنگ کارڈ ایک اسکرین میں (قانونی پٹی سمیت)')
    bad = pg.evaluate("""() => DIOZikr.items.filter(i => !i.a || !i.u || !i.r || !/[\\u0600-\\u06FF]/.test(i.a)).length""")
    check(bad == 0, f'{name}: تمام {r["n"]} آئٹم مکمل')
    # سب درود پاک سے متعلق (عربی میں صلاۃ/سلام کا لفظ)
    nd = pg.evaluate(r"""() => DIOZikr.items.filter(i => !i.g && !/(صَل|صَلّ|صَلَا|صَلاَ|صَلَّ|يُصَلّ|يُصَلُّ|صلّ|صَلُّ|صَلَّى|يُسَلِّمُ|السَّلاَمَ)/.test(i.a) && !/درود|صلاۃ|سلام/.test(i.u)).map(i => i.r)""")
    check(not nd, f'{name}: تمام آئٹم درود پاک سے متعلق {nd}')
    check(not errs, f'{name}: کوئی JS خرابی نہیں {errs[:3]}')
    ctx.close()

def reopen(b, name, vp):
    # ہر بار صفحہ کھلنے پر نئی آیت/حدیث — 6 بار کھول کر دیکھو (وہی آلہ / localStorage)
    ctx = b.new_context(service_workers='block', viewport=vp)
    ctx.route('**/*', route)
    seen = []; errs = []
    for k in range(6):
        pg = ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE + 'index.html'); pg.wait_for_timeout(1200)
        seen.append(pg.evaluate("document.getElementById('dio-zikr-ref').textContent"))
        pg.close()
    check(all(seen[i] != seen[i + 1] for i in range(len(seen) - 1)), f'{name}: ہر بار کھلنے پر نئی ({seen})')
    check(len(set(seen)) >= 5, f'{name}: 6 بار کھلنے پر کم از کم 5 مختلف ({len(set(seen))})')
    check(not errs, f'{name}: کوئی JS خرابی نہیں {errs[:3]}')
    ctx.close()

def dashboard(b, name, vp):
    ctx, pg, errs = open_app(b, viewport=vp)
    r = pg.evaluate("""() => {
      const root = document.getElementById('dash-root');
      const heads = [...root.querySelectorAll('.dio-sec-h')].map(e => e.textContent.trim());
      const tiles = [...root.querySelectorAll('.dio-tile-lbl')].map(e => e.textContent.trim());
      return { heads, tiles, islamic: !!document.getElementById('islamic-bar') || !!root.querySelector('.dio-ayat'),
               zikrTimer: (window.DIOZikr ? 1 : 0), hOverflow: document.documentElement.scrollWidth > innerWidth + 1 };
    }""")
    h = r['heads']
    check('مقدمات کی صورتحال' in h and 'دیگر سہولیات' in h and h.index('مقدمات کی صورتحال') < h.index('دیگر سہولیات'),
          f'{name}: صورتحال «دیگر سہولیات» سے اوپر ({h})')
    check(h.index('اہم سیکشن') < h.index('مقدمات کی صورتحال'), f'{name}: اہم سیکشن سب سے اوپر')
    check('ملزمان / گواہان' not in r['tiles'], f'{name}: «ملزمان / گواہان» بٹن نہیں')
    check(not r['islamic'], f'{name}: ڈیش بورڈ پر اسلامی پٹی نہیں')
    check(not r['hOverflow'], f'{name}: افقی scroll نہیں')
    pg.screenshot(path=f'{OUT}/dash_{name}.png', full_page=True)
    check(not errs, f'{name}: کوئی JS خرابی نہیں {errs[:3]}')
    ctx.close()

with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp in [('desktop', {'width': 1366, 'height': 768}), ('desktop_tall', {'width': 1440, 'height': 1000}),
                     ('mobile', {'width': 390, 'height': 844}), ('mobile360', {'width': 360, 'height': 740})]:
        landing(b, name, vp)
    for name, vp in [('desktop', {'width': 1366, 'height': 768}), ('mobile', {'width': 390, 'height': 844})]:
        reopen(b, name, vp)
        dashboard(b, name, vp)
    b.close()
print('\nFAILS:', len(fails)); sys.exit(1 if fails else 0)
