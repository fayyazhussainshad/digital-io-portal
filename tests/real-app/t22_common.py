"""(TASK 22) ٹیبوں کی جانچ کے مشترکہ اوزار — اصل ایپ (index.html + تمام اصل scripts)، ٹیبیں حقیقی (ہر ٹیب اصل
Digital IO کی الگ نقل، اسی صفحے کے فریم میں)؛ صرف Supabase کی جگہ آزمائشی ڈیٹا (mock-supabase.js، اوپر کی کھڑکی کا)۔"""
import sys, os, json, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from v564_common import *

DESK = {'width': 1366, 'height': 768}
MOB = {'width': 390, 'height': 844}
MOBX = {'is_mobile': True, 'has_touch': True, 'device_scale_factor': 2}

# دوسرا مقدمہ (701/26) — دو مقدمات ساتھ ساتھ
SEED2 = """(() => { const d = window.__db;
  if (!d.cases.find(c => c.id === 'c2')) {
    const c1 = d.cases.find(c => c.id === 'c1');
    d.cases.push(Object.assign({}, JSON.parse(JSON.stringify(c1)), { id:'c2', fir_number:'701/26', fir_date:'20/10/2026', section_of_law:'411 ت پ',
      complainant:'غلام مصطفیٰ ولد احمد دین قوم جٹ سکنہ موضع بستی ملوک', created_at:'2026-10-20T10:00:00Z' }));
  }
  d.fir_matn = [{ id:'m1', case_id:'c1', type:'fir', matn:'میں مدعی مقدمہ ہوں اور بیرون دہلی گیٹ ملتان کا رہائشی ہوں۔', created_at:'2026-10-01' }];
  return Promise.all(d.cases.map(c => offlineStore.cache('cases_cache', JSON.parse(JSON.stringify(c))))).then(() => 0); })()"""


def open_tabs(b, desktop=True, seed=True, ctx=None):
    vp = DESK if desktop else MOB
    extra = {} if desktop else MOBX
    if ctx is None:
        ctx, pg, errs = open_app(b, tabs=True, viewport=vp, **extra)
    else:
        pg = ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        pg.goto(BASE + 'index.html'); pg.wait_for_timeout(2500)
        pg.evaluate("""async () => { currentUser = {id:'u1', email:'io@test.pk', user_metadata:{}}; await _loadOfficerProfile(); await loginSuccess(); }""")
    pg.on('frameattached', lambda f: None)
    if seed:
        pg.evaluate(SEED); pg.evaluate(SEED2)
    wait_active_ready(pg)
    pg.evaluate("window.confirm = () => true; 0")
    return ctx, pg, errs


def S(pg, js):
    """اوپر کی کھڑکی میں ٹیبوں کی حالت"""
    return pg.evaluate("(() => { const S = DIOTabs._state(); " + js + " })()")


def tabs(pg):
    return S(pg, """return S.tabs.map(t => ({ id: t.id, idx: t.idx, n: t.entries.length, on: t.id === S.active, dirty: t.dirty, loading: t.loading,
        cur: (t.entries[t.idx] || {}).t, num: (t.entries[t.idx] || {}).n, loc: (t.entries[t.idx] || {}).loc,
        titles: t.entries.map(e => e.t + (e.n ? ' ' + e.n : '')), live: t.entries.map(e => !!e.fid) }));""")


def active_fid(pg):
    return S(pg, "const t = S.tabs.find(x => x.id === S.active); const e = t && t.entries[t.idx]; return e ? e.fid : null;")


def frame_of(pg, fid):
    for f in pg.frames:
        if f.name == 'dio-tab-' + fid:
            return f
    return None


def af(pg):
    """فعال ٹیب کا فریم (Playwright Frame)"""
    return frame_of(pg, active_fid(pg))


def wait_active_ready(pg, ms=30000):
    t0 = time.time()
    while time.time() - t0 < ms / 1000:
        ok = pg.evaluate("""(() => { try { const S = DIOTabs._state(); const t = S.tabs.find(x => x.id === S.active); if (!t || t.loading) return false;
          const e = t.entries[t.idx]; if (!e || e.pending || !e.fid) return false; const r = S.frames[e.fid]; return !!(r && r.win && r.win.DIOTabsChild && r.win.DIOTabsChild.ready); } catch (_) { return false; } })()""")
        if ok:
            pg.wait_for_timeout(250)
            return True
        pg.wait_for_timeout(150)
    raise RuntimeError('active tab not ready')


def strip_click(pg, sel):
    pg.click('#dio-tabs-strip ' + sel); pg.wait_for_timeout(400)


def type_zimni(f, txt):
    f.evaluate("""(t) => { const e = _zimniDoc().querySelector('tr.zf-blk .zf-body'); e.focus();
      const r = document.createRange(); r.selectNodeContents(e); r.collapse(false); const s = getSelection(); s.removeAllRanges(); s.addRange(r);
      document.execCommand('insertText', false, t); return 0; }""", txt)


def zimni_text(f):
    return f.evaluate("(() => { try { const d = _zimniDoc(); return d && d.querySelector('tr.zf-blk .zf-body') ? d.querySelector('tr.zf-blk .zf-body').innerText : null; } catch (_) { return null; } })()")
