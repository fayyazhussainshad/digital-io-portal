"""(TASK 19) جانچ نہیں، اوزار: اوپر کی پٹی اور ٹیبوں کی پٹی — پہلے (main) بمقابلہ اب
افسر کا اصول: «اوپر کی پٹی ("Digital IO" + «تفتیشی افسر کا چھوٹو»، درمیان میں) اور ٹیبوں کی پٹی جوں کی توں —
صرف نشان ایک سیٹ کے»۔ دونوں نسخے ساتھ ساتھ (DIO_BASE_OLD = main کا git worktree دوسرے پورٹ پر) — ہر بٹن / عنوان
کی جگہ اور ناپ، اور پٹی کی تصویر کا pixel فرق (نشانات کے خانوں کے باہر صفر ہونا چاہیے)۔
چلانا:  git worktree add /tmp/dio-main main && (cd /tmp/dio-main && python3 -m http.server 8771 &)
        DIO_BASE_OLD=http://localhost:8771/ python3 t19_compare.py
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import real
from real import *
from PIL import Image, ImageChops

OLD = os.environ.get('DIO_BASE_OLD', 'http://localhost:8771/')
NEW = real.BASE
V = OUT + '/t19/compare/'
os.makedirs(V, exist_ok=True)

GEO = r"""(() => { const q = (s) => [...document.querySelectorAll(s)].filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect();
    return [s, (e.getAttribute('data-act') || e.id || e.className || '').toString().slice(0, 30), Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
  return [].concat(q('#dio-tabs-strip button'), q('#dio-tabs-strip .dio-tab'), q('#dio-tabs-strip .mtitle'), q('#dio-tabs-strip .count')); })()"""
GEO_TOP = r"""(() => { const q = (s) => [...document.querySelectorAll(s)].filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect();
    return [s, Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; });
  return [].concat(q('.topbar'), q('#dio-home-btn'), q('.dio-tb-name'), q('.dio-tb-tag'), q('.dio-tb-sub'), q('#dio-keys-btn'), q('#theme-picker-btn'), q('.dio-tb-status'), q('.dio-tb-logout')); })()"""
ICONS = r"""(() => [...document.querySelectorAll('#dio-tabs-strip button svg, #dio-tabs-strip button .dio-i, #dio-tabs-strip .x .dio-i, #dio-tabs-strip .x, #dio-tabs-strip .dio-tab .ic')]
  .filter(e => e.getClientRects().length).map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left) - 2, Math.round(r.top) - 2, Math.round(r.right) + 2, Math.round(r.bottom) + 2]; }))()"""
ICONS_TOP = r"""(() => [...document.querySelectorAll('.topbar svg, .topbar .dio-i')].filter(e => e.getClientRects().length)
  .map(e => { const r = e.getBoundingClientRect(); return [Math.round(r.left) - 2, Math.round(r.top) - 2, Math.round(r.right) + 2, Math.round(r.bottom) + 2]; }))()"""


def grab(b, base, desktop):
    real.BASE = base
    from t22_common import open_tabs
    ctx, pg, errs = open_tabs(b, desktop=desktop)
    vp = pg.viewport_size
    f = None
    for fr in pg.frames:
        if fr.name.startswith('dio-tab-'): f = fr
    geo = pg.evaluate(GEO); icons = pg.evaluate(ICONS)
    geo_top = f.evaluate(GEO_TOP) if f else []; icons_top = f.evaluate(ICONS_TOP) if f else []
    top_off = pg.evaluate("(() => { const fr = [...document.querySelectorAll('iframe')].find(x => x.getClientRects().length); return fr ? Math.round(fr.getBoundingClientRect().top) : 0; })()")
    path = V + ('d' if desktop else 'm') + ('_old' if base == OLD else '_new') + '.png'
    pg.screenshot(path=path, clip={'x': 0, 'y': 0, 'width': vp['width'], 'height': top_off + (64 if desktop else 100)})
    ctx.close()
    return geo, geo_top, icons + [[a, b_ + top_off, c, d + top_off] for a, b_, c, d in icons_top], path


def pixdiff(a, b, boxes):
    A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB')
    if A.size != B.size: return 'size', A.size, B.size
    d = ImageChops.difference(A, B).convert('L').point(lambda v: 255 if v > 40 else 0)
    px = d.load(); out = 0; inside = 0
    sc = A.size[0] / (1366 if A.size[0] > 1000 else 390) if False else 1
    W, H = d.size
    dpr = 2 if W < 1000 and W > 400 else 1
    for y in range(H):
        for x in range(W):
            if px[x, y]:
                if any(bx[0] * dpr <= x <= bx[2] * dpr and bx[1] * dpr <= y <= bx[3] * dpr for bx in boxes): inside += 1
                else: out += 1
    d.save(a.replace('_old.png', '_diff.png'))
    return out, inside


with sync_playwright() as p:
    b = p.chromium.launch()
    res = {}
    for desktop in (True, False):
        g_old = grab(b, OLD, desktop); g_new = grab(b, NEW, desktop)
        same_tabs = g_old[0] == g_new[0]; same_top = g_old[1] == g_new[1]
        out, inside = pixdiff(g_old[3], g_new[3], g_old[2] + g_new[2])
        tag = 'desktop' if desktop else 'mobile'
        res[tag] = {'tab_bar_positions_same': same_tabs, 'top_bar_positions_same': same_top, 'pixels_changed_outside_icons': out, 'pixels_changed_inside_icons': inside}
        if not same_tabs: res[tag]['tabs_old_new'] = [g_old[0], g_new[0]]
        if not same_top: res[tag]['top_old_new'] = [g_old[1], g_new[1]]
        print(tag, json.dumps(res[tag], ensure_ascii=False)[:1500])
    b.close()
json.dump(res, open(V + 'result.json', 'w'), ensure_ascii=False, indent=1)
