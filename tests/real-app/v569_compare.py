"""(v569) تبدیلی سے پہلے (before) اور بعد (after) کا موازنہ — v569_baseline.py دونوں بار چلنے کے بعد

  • چالان (رپورٹ 173): پرنٹ HTML حرف بحرف وہی (Legal + A4، Desktop + Mobile)، اسکرین کی تصویر pixel تک وہی،
    شیئر PDF اور براؤزر مینو والی چھپائی کے صفحات pixel تک وہی
  • باقی ہر دستاویز: پرنٹ HTML میں فرق صرف v564 کا «kerning بند» قاعدہ (اور اس کا تبصرہ) — اور کچھ نہیں؛ اسکرین /
    کاغذ پر kerning «none» سے واپس «auto» (3 نومبر سے پہلے جیسا)
  • پورا مقدمہ: چالان والا حصہ kerning بند، باقی حصے خودکار
"""
from v564_common import *

V = OUT + '/v569/base/'
R = []


def check(name, ok, extra=''):
    R.append(('PASS' if ok else 'FAIL', name, extra))
    print(('PASS ' if ok else 'FAIL ') + name + (' — ' + str(extra)[:400] if extra != '' else ''), flush=True)


def rd(name):
    p = V + name
    return open(p, encoding='utf-8').read() if os.path.exists(p) else None


def js(name):
    p = V + name
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else None


# v564 کا قاعدہ — جو «پہلے» میں ہر دستاویز پر تھا اور «بعد» میں صرف چالان پر
RULES = [
    re.compile(r'<style id="dio-text-css">body\{ font-kerning:none; \}</style>'),
    re.compile(r'/\* v564: الفاظ نہ جُڑیں — فونٹ کی kerning بند \(پورے سسٹم کا قاعدہ: app-core\.js dioTextCSS\)؛\s*'
               r'اسکرین اور کاغذ دونوں پر ایک، اس لیے سطریں دونوں جگہ ایک جیسی ٹوٹتی ہیں۔ \*/\s*#ch173-doc\{ font-kerning:none; \}'),
]


def strip_rule(h):
    for r in RULES:
        h = r.sub('', h)
    return h


def norm(h):
    return re.sub(r'\s+', ' ', h or '').strip()


# کاغذ کو نیچے تک بھرنے والی خالی قطاروں کی اونچائی — ایپ چھپائی کے وقت متن ناپ کر لگاتی ہے؛ kerning واپس «auto»
#   ہونے سے متن کم سطروں میں آتا ہے تو یہ اونچائی اسی حساب سے بدلتی ہے (3 نومبر سے پہلے کی طرح)
FILL = re.compile(r'(<td class="(?:zf-c-[a-z]+|saza-c\d)"[^>]*?style="height: )\d+(px)')


def fills(h):
    return FILL.findall(h or '') and [m.group(0)[-12:] for m in FILL.finditer(h or '')]


def norm_fill(h):
    return FILL.sub(r'\1N\2', norm(h))


def pdf_pages(name, tag):
    p = V + name
    if not os.path.exists(p): return None
    return pages_png(p, V + 'png_' + tag + '_' + name.replace('.pdf', ''), 70)


def same_png(a, b):
    if not (os.path.exists(a) and os.path.exists(b)): return False, 'missing'
    A = Image.open(a).convert('RGB'); B = Image.open(b).convert('RGB')
    if A.size != B.size: return False, ('size', A.size, B.size)
    d = ImageChops.difference(A, B).getbbox()
    return d is None, d


# ── 1) چالان: کچھ نہیں بدلا ──
for dev in ('desktop', 'mobile'):
    for paper in ('legal', 'a4'):
        a, b = rd(f'before_{dev}_challan_print_{paper}.html'), rd(f'after_{dev}_challan_print_{paper}.html')
        check(f'{dev} چالان: پرنٹ کا کاغذ ({paper}) حرف بحرف وہی', a is not None and a == b and len(a) > 20000, (len(a or ''), len(b or '')))
    a, b = rd(f'before_{dev}_challan_raw.html'), rd(f'after_{dev}_challan_raw.html')
    check(f'{dev} چالان: شیئر / پورا مقدمہ والا HTML حرف بحرف وہی', a is not None and a == b, (len(a or ''), len(b or '')))
    ok, d = same_png(V + f'before_{dev}_challan_screen.png', V + f'after_{dev}_challan_screen.png')
    check(f'{dev} چالان: اسکرین کی تصویر pixel تک وہی', ok, d)
    jb, ja = js(f'before_{dev}_challan.json'), js(f'after_{dev}_challan.json')
    check(f'{dev} چالان: اسکرین + کاغذ پر kerning بند (پہلے بھی، اب بھی)',
          ja and jb and ja['screen']['kern'] == 'none' and ja['screen']['text'] == 'none' and ja['print_legal']['text'] == 'none'
          and ja['print_a4']['text'] == 'none' and jb['screen']['kern'] == 'none', (ja and ja['screen'], ja and ja['print_legal']))
    check(f'{dev} چالان: اسکرین پر اب «ہر دستاویز» والا قاعدہ نہیں (صرف چالان کی اپنی CSS)', ja and ja['screen']['sheet'] is False and jb['screen']['sheet'] is True)
for kind in ('share', 'menu'):
    pa, pb = pdf_pages(f'before_challan_{kind}.pdf', 'b'), pdf_pages(f'after_challan_{kind}.pdf', 'a')
    ok, diffs = (same_pages(pa, pb) if pa and pb else (False, 'missing'))
    check(f'چالان: {"شیئر PDF" if kind == "share" else "براؤزر مینو (⋮ › Print)"} کے صفحات pixel تک وہی', ok and len(pa) >= 1, (len(pa or []), diffs))

# ── 2) باقی دستاویزات: فرق صرف قاعدہ ──
for dev in ('desktop', 'mobile'):
    a, b = rd(f'before_{dev}_zimni_print.html'), rd(f'after_{dev}_zimni_print.html')
    check(f'{dev} بیرونی ضمنی: پرنٹ HTML میں فرق صرف v564 کا kerning قاعدہ + نیچے تک بھرنے والی قطار کی ناپی اونچائی (باقی سب وہی)',
          a and b and norm_fill(strip_rule(a)) == norm_fill(b) and a != b and 'font-kerning:none' not in b,
          (len(a or ''), len(b or ''), 'خالی قطار پہلے', sorted(set(fills(a) or [])), 'اب', sorted(set(fills(b) or []))))
    jb, ja = js(f'before_{dev}_zimni.json'), js(f'after_{dev}_zimni.json')
    check(f'{dev} بیرونی ضمنی: kerning «none» سے واپس «auto» — اسکرین اور کاغذ (3 نومبر سے پہلے جیسا)',
          jb and ja and jb['screen']['text'] == 'none' and ja['screen']['kern'] == 'auto' and ja['screen']['text'] == 'auto'
          and ja['print']['body'] == 'auto' and ja['print']['text'] == 'auto', (jb and jb['screen'], ja and ja['screen'], ja and ja['print']))
    ob, oa = js(f'before_{dev}_others.json') or {}, js(f'after_{dev}_others.json') or {}
    for name in [k for k in ob if k != 'errors']:
        b0, a0 = ob.get(name) or {}, oa.get(name) or {}
        hb, ha = rd(f'before_{dev}_{name}_print.html') or '', rd(f'after_{dev}_{name}_print.html') or ''
        if hb:
            same = norm(strip_rule(hb)) == norm(ha)
            check(f'{dev} {name}: پرنٹ HTML میں فرق صرف v564 کا kerning قاعدہ' + ('' if same else ' + نیچے تک بھرنے والی قطاروں کی ناپی اونچائی'),
                  norm_fill(strip_rule(hb)) == norm_fill(ha) and 'font-kerning:none' not in ha,
                  (len(hb), len(ha)) + (() if same else ('پہلے', sorted(set(fills(hb) or [])), 'اب', sorted(set(fills(ha) or [])))))
        sa = (a0.get('screen') or {})
        pa_ = (a0.get('print') or {})
        ok = (not sa or (sa.get('kern') == 'auto' and sa.get('text') == 'auto' and sa.get('sheet') is False)) and \
             (not pa_ or (pa_.get('body') == 'auto' and pa_.get('text') in ('auto', None)))
        check(f'{dev} {name}: اسکرین اور کاغذ پر kerning «auto» (3 نومبر سے پہلے جیسا)', ok and (sa or pa_), (b0.get('screen'), sa, pa_))
    check(f'{dev}: کوئی JS غلطی نہیں (بعد)', not (oa.get('errors') or []) and not ((js(f'after_{dev}_zimni.json') or {}).get('errors') or [])
          and not ((js(f'after_{dev}_challan.json') or {}).get('errors') or []), oa.get('errors'))

# ── 3) پورا مقدمہ ──
mb, ma = js('before_case_merged.json'), js('after_case_merged.json')
if ma:
    parts = ma['kern']['parts']
    ch = [p for p in parts if p['challan']]
    rest = [p for p in parts if not p['challan']]
    check('پورا مقدمہ: چالان والا حصہ kerning بند، باقی (ضمنی، درخواست، سزا سلپ) خودکار؛ body خودکار',
          ma['kern']['body'] == 'auto' and ch and all(p['kern'] == 'none' and p['text'] == 'none' for p in ch)
          and rest and all(p['kern'] == 'auto' and p['text'] in ('auto', None) for p in rest), parts)
    check('پورا مقدمہ: پہلے سب حصے kerning بند تھے', mb and all(p['kern'] == 'none' for p in mb['kern']['parts']), mb and mb['kern'])
    hb, ha = rd('before_case_merged_print.html'), rd('after_case_merged_print.html')
    # «پہلے» میں ہر حصے کی CSS میں قاعدہ (dioBindHtml) تھا: .dpk-N{font-kerning: none;} — «بعد» میں صرف چالان کے حصے میں
    nb = len(re.findall(r'\.dpk-\d+\s*\{\s*font-kerning: none;\s*\}', hb or '')); na = len(re.findall(r'\.dpk-\d+\s*\{\s*font-kerning: none;\s*\}', ha or ''))
    check('پورا مقدمہ: kerning بند کا قاعدہ صرف ایک حصے (چالان) میں', na == 1 and nb >= 3, (nb, na))

# ── 4) شیئر PDF (باقی دستاویزات): صفحات بنتے ہیں ──
for name in ('zimni_share', 'zimni_menu', 'darkhwast_share'):
    pb, pa = pdf_pages(f'before_{name}.pdf', 'b'), pdf_pages(f'after_{name}.pdf', 'a')
    check(f'{name}: PDF بنتی ہے (پہلے {len(pb or [])} صفحات، اب {len(pa or [])})', pa and len(pa) >= 1, (len(pb or []), len(pa or [])))

fails = [r for r in R if r[0] == 'FAIL']
print(f'\nFAILS: {len(fails)} of {len(R)}')
sys.exit(1 if fails else 0)
