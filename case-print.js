/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — مقدمے کی دستاویزات: انتخاب کر کے ایک ساتھ پرنٹ / ڈاؤن لوڈ / شیئر
   case-print.js  (v553؛ v554 — افسر کا قاعدہ)
   «اس بٹن کا مقصد یہ ہے کہ پورا کیس کھول کر ایک ایک صفحہ نہ کھولنا پڑے بلکہ
    ایک ہی کمانڈ میں پورا کیس پرنٹ، کاپی، منتقل یا شیئر کیا جا سکے — اور فائل
    بالکل ویسی ہو جیسی مقدمے کے اندر چِپ کھولنے پر نظر آتی ہے: جو فارم، ضمنی،
    چالان یا سزا سلپ الگ ایک یا زیادہ صفحات پر ہے، یہاں بھی ویسا ہی۔»

   dioCasePrint(caseId, mode)   mode: 'print' | 'download' | 'share'
     تینوں بٹن الگ الگ کام: پرنٹ = سیدھا پرنٹ؛ ڈاؤن لوڈ = اسی آلے پر فائل
     (PDF یا Word)؛ شیئر = فائل (PDF یا Word) WhatsApp / ای میل وغیرہ پر۔
     1) فہرست: chips کی ترتیب سے ہر دستاویز (محفوظ ڈیٹا والی پر سبز نشان)؛
        ہر محفوظ چالان اور ہر محفوظ نقشہ الگ سطر۔ ملزمان / گواہان (FIR،
        کراس ورژن)، ہمراہی ملازمان اور شہادتیں فہرست میں نہیں (v554)۔
     2) کاغذ کا سائز ایک بار پوچھا جاتا ہے (لیگل/A4) — سب پر وہی
     3) ہر منتخب دستاویز اپنے ہی «پرنٹ» راستے سے بنتی ہے (وہی کاغذ جو اُس کا
        اپنا پرنٹ بٹن دیتا ہے — اسکرین کی شکل کبھی نہیں)؛ فہرست والی دستاویزات
        (ضمنیاں، بیانات 161، درخواستیں، CDR، CRO، RFA) کا ہر محفوظ ریکارڈ الگ
     4) پرنٹ: سب ایک ہی پرنٹ میں، ہر دستاویز نئے صفحے سے اور اپنے صفحے کے
        سائز/حاشیوں کے ساتھ (CSS named pages)
        PDF / Word (.docx): ہر دستاویز کے اپنے صفحات، اپنے کاغذ پر — ہر صفحہ
        بالکل وہی جو پرنٹ میں (ایک فائل)

   DIO.printPack.merge([html…]) → ایک مکمل HTML (ہر دستاویز کا CSS اپنے دائرے میں)
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIO = window.DIO || {};

  const E = (v) => (typeof esc === 'function') ? esc(v) : String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const TOAST = (m, t, d) => { try { if (typeof showToast === 'function') showToast(m, t || 'info', d); } catch (_) { /* پیغام نہ دکھ سکے تو کوئی بات نہیں */ } };
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  // ═══ 1) کئی پرنٹ HTML → ایک دستاویز ══════════════════════════════════
  //   ہر دستاویز پہلے چھپے iframe میں بنتی ہے (اُس کی اپنی اسکرپٹ — مثلاً ضمنی کی
  //   صفحہ بندی — وہیں چل جاتی ہے)، پھر اُس کا تیار DOM + CSS اپنے دائرے (.dpk-N)
  //   میں منتقل؛ @page اُس کا اپنا نام والا صفحہ (named page) بن جاتا ہے۔
  function splitSel(sel) {
    const out = []; let depth = 0, cur = '', q = null;
    for (let i = 0; i < sel.length; i++) {
      const ch = sel[i];
      if (q) { cur += ch; if (ch === q && sel[i - 1] !== '\\') q = null; continue; }
      if (ch === '"' || ch === "'") { q = ch; cur += ch; continue; }
      if (ch === '(' || ch === '[') depth++;
      else if (ch === ')' || ch === ']') depth--;
      if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
      cur += ch;
    }
    if (cur.trim()) out.push(cur);
    return out;
  }
  function scopeOne(s, sc) {
    let t = s.trim();
    if (!t) return t;
    let m = /^(?::root|html)(?![\w-])([\s\S]*)$/i.exec(t);
    if (m) {
      t = m[1].trim();
      if (!t) return sc;
      if (t[0] === '>') t = t.slice(1).trim();
      if (!/^body(?![\w-])/i.test(t)) return sc + ' ' + t;
    }
    m = /^body(?![\w-])([\s\S]*)$/i.exec(t);
    if (m) return sc + m[1];
    return sc + ' ' + t;
  }
  function scopeRules(rules, sc, pageName, out, fonts) {
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      try {
        if (r.type === 1) {                                   // عام قاعدہ
          // position:fixed (ہر صفحے پر دہرانا) مجموعے میں دوسری دستاویزات پر بھی آ جاتا —
          //   اپنی دستاویز کے دائرے تک محدود (absolute)
          let decl = r.style.cssText;
          if (r.style.position === 'fixed') decl = decl.replace(/position\s*:\s*fixed/i, 'position: absolute');
          out.push(splitSel(r.selectorText).map(x => scopeOne(x, sc)).join(', ') + '{' + decl + '}');
        } else if (r.type === 4) {                            // @media
          const inner = []; scopeRules(r.cssRules, sc, pageName, inner, fonts);
          out.push('@media ' + r.media.mediaText + '{' + inner.join('\n') + '}');
        } else if (r.type === 12) {                           // @supports
          const inner = []; scopeRules(r.cssRules, sc, pageName, inner, fonts);
          out.push('@supports ' + r.conditionText + '{' + inner.join('\n') + '}');
        } else if (r.type === 6) {                            // @page → نام والا صفحہ
          const ps = (r.selectorText || '').trim();
          const body = r.cssText.slice(r.cssText.indexOf('{'));
          out.push('@page ' + pageName + (ps && ps[0] === ':' ? ps : '') + ' ' + body);
        } else if (r.type === 5) {                            // @font-face (ایک بار)
          fonts.add(r.cssText);
        } else if (r.type === 3) {
          /* @import — شیٹ کا لنک الگ سے شامل ہوتا ہے */
        } else {
          out.push(r.cssText);                                // @keyframes وغیرہ
        }
      } catch (_) { /* ایک قاعدہ نہ سمجھ آئے تو باقی چلتے رہیں */ }
    }
  }
  function pageInfo(html) {
    let page = { w: 8.5, h: 13 }, mg = { l: 0, r: 0, t: 0, b: 0 };
    try { if (DIO.share && DIO.share.pageFromHtml) page = DIO.share.pageFromHtml(html); } catch (_) { /* پہلے سے طے */ }
    const m = /@page\s*\{[^}]*margin\s*:\s*([^;}]+)/i.exec(html || '');
    if (m) {
      const u = (x) => {
        const n = /(-?[\d.]+)\s*(in|mm|cm|pt|px)?/.exec(x || '0'); if (!n) return 0;
        const v = +n[1], k = n[2] || 'px';
        return k === 'in' ? v : k === 'mm' ? v / 25.4 : k === 'cm' ? v / 2.54 : k === 'pt' ? v / 72 : v / 96;
      };
      let p = m[1].trim().split(/\s+/).map(u);
      if (p.length === 1) p = [p[0], p[0], p[0], p[0]];
      else if (p.length === 2) p = [p[0], p[1], p[0], p[1]];
      else if (p.length === 3) p = [p[0], p[1], p[2], p[1]];
      mg = { t: p[0], r: p[1], b: p[2], l: p[3] };
    }
    return { page, mg };
  }
  async function settle(html) {
    const pi = pageInfo(html);
    const cw = Math.max(200, Math.round((pi.page.w - pi.mg.l - pi.mg.r) * 96));
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:fixed;left:-30000px;top:0;border:0;background:#fff;width:' + cw + 'px;height:' + Math.round(pi.page.h * 96) + 'px;';
    f.style.setProperty('display', 'block', 'important');
    f.style.setProperty('visibility', 'visible', 'important');
    document.documentElement.appendChild(f);
    const d = f.contentWindow.document;
    d.open(); d.write(html); d.close();
    await sleep(200);
    for (let i = 0; i < 50; i++) {
      let st = 'loaded'; try { st = d.fonts ? d.fonts.status : 'loaded'; } catch (_) { st = 'loaded'; }
      if (st === 'loaded') break;
      await sleep(100);
    }
    await sleep(350);
    return { frame: f, doc: d };
  }
  async function merge(htmls, title) {
    const parts = [], fonts = new Set(), links = new Set();
    for (let n = 0; n < htmls.length; n++) {
      // ہر دستاویز اپنے پرنٹ جیسی — جفت صفحات پر مثل باندھنے کی جگہ (v553 قاعدہ)
      let hn = htmls[n];
      try { if (typeof window.dioBindHtml === 'function') hn = await window.dioBindHtml(hn); } catch (_) { /* ضمنی */ }
      const st = await settle(hn);
      try {
        const d = st.doc, sc = '.dpk-' + n, pageName = 'dpk' + n;
        const css = [];
        [].forEach.call(d.styleSheets, (sh) => {
          let rules = null;
          try { rules = sh.cssRules; } catch (_) { rules = null; }
          if (rules) scopeRules(rules, sc, pageName, css, fonts);
          else if (sh.href) links.add(sh.href);                 // دوسری جگہ کی شیٹ (Google Fonts)
        });
        d.querySelectorAll('link[rel="stylesheet"][href]').forEach(l => { if (/fonts\.googleapis/.test(l.href)) links.add(l.href); });
        const body = d.body.cloneNode(true);
        // تیار شکل کی نقل: کینوس → تصویر، خانوں کی قدر، اسکرپٹ/انداز الگ
        const srcC = d.body.querySelectorAll('canvas'), dstC = body.querySelectorAll('canvas');
        for (let i = 0; i < srcC.length && i < dstC.length; i++) {
          try { const im = d.createElement('img'); im.src = srcC[i].toDataURL('image/png'); im.style.cssText = srcC[i].style.cssText; im.width = srcC[i].width; dstC[i].replaceWith(im); } catch (_) { /* کینوس نہ پڑھا جا سکے */ }
        }
        const srcF = d.body.querySelectorAll('input,textarea,select'), dstF = body.querySelectorAll('input,textarea,select');
        for (let i = 0; i < srcF.length && i < dstF.length; i++) {
          try {
            if (srcF[i].tagName === 'TEXTAREA') dstF[i].textContent = srcF[i].value;
            else if (srcF[i].tagName === 'SELECT') { const o = dstF[i].options[srcF[i].selectedIndex]; if (o) o.setAttribute('selected', 'selected'); }
            else if (srcF[i].type === 'checkbox' || srcF[i].type === 'radio') { if (srcF[i].checked) dstF[i].setAttribute('checked', 'checked'); }
            else dstF[i].setAttribute('value', srcF[i].value);
          } catch (_) { /* ضمنی */ }
        }
        body.querySelectorAll('script,style,link').forEach(x => x.remove());
        const cls = ['dpk', 'dpk-' + n].concat([].slice.call(d.body.classList)).join(' ');
        const dir = d.body.getAttribute('dir') || d.documentElement.getAttribute('dir') || 'rtl';
        const bst = (d.body.getAttribute('style') || '').replace(/"/g, "'");
        // v554: اکیلے پرنٹ میں fixed عنصر (مثلاً نیچے «Digital IO») صفحے کے نیچے ہوتا ہے؛ یہاں وہ
        //   اپنی دستاویز تک محدود (absolute) ہے — اس لیے دستاویز کم از کم ایک صفحے جتنی اونچی،
        //   تاکہ وہ اسی جگہ (صفحے کے نیچے) رہے، مواد کے فوراً نیچے نہیں
        let minH = '';
        try {
          const win = d.defaultView;
          if ([].some.call(d.body.querySelectorAll('*'), el => win.getComputedStyle(el).position === 'fixed')) {
            // دستاویز کا اوپر والا سرا اکیلے پرنٹ میں کہاں سے شروع ہوتا ہے (body کا حاشیہ، پہلی سرخی کے
            //   حاشیے سے مل کر) — اتنا چھوڑ کر باقی صفحہ؛ نیچے کا حاشیہ صفر، تاکہ fixed عنصر ٹھیک اسی
            //   جگہ رہے اور دستاویز اگلے صفحے پر نہ پھسلے
            const pi = pageInfo(hn), top = d.body.getBoundingClientRect().top + (win.scrollY || 0);
            const px = Math.floor((pi.page.h - pi.mg.t - pi.mg.b) * 96 - Math.max(0, top)) - 1;
            if (px > 100) minH = 'min-height:' + px + 'px;box-sizing:border-box;margin-bottom:0;';
          }
        } catch (_) { minH = ''; }
        parts.push({ css: css.join('\n'), html: '<div class="' + E(cls) + '" dir="' + E(dir) + '" style="position:relative;' + bst + ';' + minH + 'page:' + pageName + ';' +
          (n ? 'break-before:page;' : '') + '">' + body.innerHTML + '</div>' });
      } finally { st.frame.remove(); }
    }
    return '<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title>' + E(title || ' ') + '</title>' +
      [...links].map(h => '<link rel="stylesheet" href="' + E(h) + '">').join('') +
      '<style>' + [...fonts].join('\n') + '</style>' +
      '<style>html,body{margin:0;padding:0;background:#fff;} :where(.dpk){display:block;margin:8px;} ' +
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style>' +
      parts.map(p => '<style>' + p.css + '</style>').join('') +
      // data-dio-nobind: ہر دستاویز پر مثل کی جگہ اوپر اُس کے اپنے صفحات کے حساب سے لگ چکی — پورے
      //   مجموعے پر دوبارہ نہیں (ورنہ مجموعے کے جفت صفحے پر، مثلاً دوسری دستاویز کے پہلے صفحے پر، غلط نشان)
      '</head><body data-dio-nobind="1">' + parts.map(p => p.html).join('') + '</body></html>';
  }
  DIO.printPack = { merge, _scopeOne: scopeOne, _splitSel: splitSel };

  // ═══ 2) مقدمے کی دستاویزات کی فہرست (chips کی ترتیب) ═══════════════════
  async function loadChallans(caseId) {
    try {
      const { data, error } = await supabaseClient.from('report_173').select('id,report_type,report_subtype,form_data,created_at').eq('case_id', caseId);
      if (error) throw error;
      return data || [];
    } catch (_) {
      try { return JSON.parse(localStorage.getItem('dio_r173docs_' + caseId) || '[]').map(d => ({ id: d.id, report_type: d.type, report_subtype: d.subtype, form_data: d.form_data })); }
      catch (__) { return []; }
    }
  }
  function challanName(r) {
    let nm = r.report_type || 'چالان';
    try { const t = (typeof R173_TYPES !== 'undefined' ? R173_TYPES : []).find(x => x.id === r.report_type); if (t) nm = t.name; } catch (_) { /* نام نہ ملے */ }
    const f = r.form_data || {};
    const dt = (typeof formatDate === 'function') ? formatDate(f.sho_date2 || f.sho_date || (r.created_at ? String(r.created_at).slice(0, 10) : '')) : '';
    return 'رپورٹ 173 — ' + nm + (r.report_subtype === 'cross_version' ? ' (کراس ورژن)' : '') + (dt && dt !== '—' ? ' — ' + dt : '');
  }
  function naqshaSketches(caseId) {
    try { const d = JSON.parse(localStorage.getItem('dio_naqsha_' + caseId) || 'null'); return (d && Array.isArray(d.sketches)) ? d.sketches : []; }
    catch (_) { return []; }
  }

  // سرور پر اس مقدمے کی قطاریں (محفوظ ڈیٹا کا سبز نشان) — نہ ملے تو خالی
  async function rowsOf(table, cols, caseId) {
    try {
      const { data, error } = await supabaseClient.from(table).select(cols).eq('case_id', caseId);
      if (error) throw error;
      return data || [];
    } catch (_) { return []; }
  }
  // عالمی (let) متغیر — دوسری فائل کا؛ موجود نہ ہو تو خالی
  const G = {
    zimni: () => { try { return (typeof _zimniList !== 'undefined' && Array.isArray(_zimniList)) ? _zimniList : []; } catch (_) { return []; } },
    za: () => { try { return (typeof _zaList !== 'undefined' && Array.isArray(_zaList)) ? _zaList : []; } catch (_) { return []; } },
    matn: () => { try { return (typeof _firMatn !== 'undefined' && Array.isArray(_firMatn)) ? _firMatn : []; } catch (_) { return []; } },
    cdr: () => { try { return (typeof _cdrList !== 'undefined' && Array.isArray(_cdrList)) ? _cdrList : []; } catch (_) { return []; } },
    rfa: () => { try { return (typeof _rfaList !== 'undefined' && Array.isArray(_rfaList)) ? _rfaList : []; } catch (_) { return []; } },
    croAcc: () => { try { return (typeof _croAllAccused !== 'undefined' && Array.isArray(_croAllAccused)) ? _croAllAccused : []; } catch (_) { return []; } },
    croCards: () => { try { return (typeof _croAllCards !== 'undefined' && _croAllCards) ? _croAllCards : {}; } catch (_) { return {}; } },
  };
  const sno = (z) => parseInt(z && z.serial_no, 10) || parseInt(((z && z.content) || {}).serial_no, 10) || 0;
  const byOrder = (a, b) => (sno(a) - sno(b)) || String(a.report_date || a.created_at || '').localeCompare(String(b.report_date || b.created_at || ''));

  // ہر ریکارڈ اپنے «پرنٹ» سے — ایک ایک کر کے (فہرست والی دستاویزات)
  async function eachPrint(list, openOne, printOne) {
    const out = [];
    for (const r of list) {
      if (window._dcpCancel) break;
      try {
        await openOne(r);
        await waitStable(4000);
        const h = await capture(() => printOne(r));
        if (h) out.push(h);
      } catch (e) { try { console.warn('case print item:', e && e.message); } catch (_) { /* ضمنی */ } }
    }
    return out;
  }

  // ملزمان / گواہان (FIR، کراس ورژن)، ہمراہی ملازمان اور شہادتیں اس فہرست میں نہیں (v554، افسر کا قاعدہ)
  const NOT_IN_LIST = { staff: 1, shahadatain: 1 };

  async function buildItems(c) {
    const cross = (typeof caseHasCross === 'function') && caseHasCross(c);
    const [matn, zim, za, cdr, rfa, cro, cdocs] = await Promise.all([
      rowsOf('fir_matn', 'id,type', c.id), rowsOf('zimni_reports', 'id', c.id), rowsOf('zimni_androoni_reports', 'id', c.id),
      rowsOf('cdr_imei_requests', 'id', c.id), rowsOf('rfa_forms', 'id', c.id), rowsOf('cro_cards', 'id,accused_id', c.id),
      rowsOf('case_documents', 'id,document_type', c.id)]);
    const cnt = {
      fir: matn.filter(x => (x.type || 'fir') === 'fir').length,
      cross_version: matn.filter(x => x.type === 'cross_version').length,
      zamniyat: zim.length, statements_161: za.length, cdr_imei: cdr.length, rfa_form: rfa.length,
      cro_card: cro.filter(x => x.accused_id).length,
      darkhwastain: cdocs.filter(x => x.document_type === 'darkhwastain').length,
    };
    const has = (k) => {
      if (cnt[k]) return true;
      try { return typeof _misalHasData === 'function' && _misalHasData(k); } catch (_) { return false; }
    };
    const firRows = (t) => G.matn().filter(m => (m.type || 'fir') === t && String(m.matn || '').trim());
    const zimniAll = async () => eachPrint(G.zimni().slice().sort(byOrder), async () => {}, (z) => _printZimniById(z.id));
    const L = [];
    L.push({ id: 'index_naql', name: 'انڈیکس نقل مسل', saved: true, open: () => _openMisalEditor('index_naql') });
    // FIR اور کراس ورژن الگ الگ — ہر ایک کا صرف اپنا متن (ایک ہی چیز دو بار نہ آئے)
    L.push({ id: 'fir', name: 'ایف آئی آر', saved: has('fir'), open: () => _ddPick('fir-dd', 'fir'),
      print: () => (typeof _firPrintRows === 'function' && firRows('fir').length) ? _firPrintRows(firRows('fir')) : null });
    if (cross) L.push({ id: 'cross_version', name: 'کراس ورژن', saved: has('cross_version'), open: () => _ddPick('fir-dd', 'cross_version'),
      print: () => (typeof _firPrintRows === 'function' && firRows('cross_version').length) ? _firPrintRows(firRows('cross_version')) : null });
    // ہر محفوظ چالان الگ سطر
    const ch = await loadChallans(c.id);
    ch.forEach(r => L.push({
      id: 'r173:' + r.id, name: challanName(r), saved: true, group: 'r173',
      open: async () => { await openR173List(); await _r173OpenDoc(r.id); await sleep(700); },
      print: () => _printR173()
    }));
    if (!ch.length) L.push({ id: 'r173', name: 'رپورٹ 173 ض ف', saved: false, open: () => openR173List() });
    (typeof MISAL_CASE_DOCS !== 'undefined' ? MISAL_CASE_DOCS : []).forEach(d => {
      if (d.id === 'index_naql' || NOT_IN_LIST[d.id]) return;
      if (d.id === 'crime_scene') {
        const sk = naqshaSketches(c.id);
        if (sk.length) {
          sk.forEach(s => L.push({
            id: 'naq:' + s.id, saved: true, group: 'naq',
            name: 'نقشہ موقع — ' + (s.type === 'baramad' ? 'جائے برامدگی' : 'جائے وقوعہ') + ' #' + (s.serial || ''),
            open: () => openNaqsha(c.id),
            html: (paper) => (typeof window._naqSketchHTML === 'function') ? window._naqSketchHTML(s.id, paper) : Promise.resolve('')
          }));
          return;
        }
      }
      const it = { id: d.id, name: d.name, saved: has(d.id), open: () => _openMisalEditor(d.id) };
      // نقشہ موقع (اس آلے پر فہرست نہ ہو): فہرست کھول کر سرور سے آئے تمام نقشے
      if (d.id === 'crime_scene') {
        it.name = 'نقشہ موقع (تمام محفوظ نقشے)';
        it.htmls = async (paper) => {
          const ids = (typeof window._naqSketchIds === 'function') ? window._naqSketchIds() : [];
          const out = [];
          for (const id of ids) { const h = await window._naqSketchHTML(id, paper); if (h) out.push(h); }
          return out;
        };
      }
      // ضمنیاں: ہر ضمنی الگ — بالکل وہی کاغذ جو فہرست میں اُس کی سطر کا «پرنٹ» دیتا ہے
      if (d.id === 'zamniyat') { it.name = 'ضمنیات (تمام)'; it.htmls = zimniAll; it.once = 'zimni'; }
      // میمورنڈم کی چِپ بھی ضمنیوں کا ہی صفحہ کھولتی ہے — وہی کاغذ (دونوں منتخب ہوں تو ایک ہی بار)
      if (d.id === 'memorandum') { it.htmls = zimniAll; it.once = 'zimni'; }
      if (d.id === 'statements_161') {
        it.name = 'بیانات 161 ض ف (تمام)';
        it.htmls = async () => eachPrint(G.za().slice().sort(byOrder), async () => {}, (z) => _printZimniAById(z.id));
      }
      if (d.id === 'darkhwastain') {
        it.name = 'درخواستیں (تمام)';
        it.htmls = async () => {
          const list = (typeof dioLoadDocEntries === 'function') ? await dioLoadDocEntries('darkhwastain', c.id) : [];
          return eachPrint(list, (e) => _dkOpenEntry(e), () => _dkPrint());
        };
      }
      if (d.id === 'cdr_imei') {
        it.name = 'CDR/IMEI (تمام درخواستیں)';
        it.htmls = async () => eachPrint(G.cdr().slice().reverse(), async (r) => { _cdrOpen(r.id); try { _cdrBalance(); } catch (_) { /* ناپ */ } }, () => _printCdr());
      }
      if (d.id === 'cro_card') {
        it.name = 'CRO کارڈ (تمام)';
        it.htmls = async () => {
          const cards = G.croCards();
          return eachPrint(G.croAcc().filter(a => cards[a.id]), (a) => _openCroForAccused(a.id), () => _printCro());
        };
      }
      if (d.id === 'rfa_form') {
        it.name = 'RFA فارم (تمام)';
        it.htmls = async () => eachPrint(G.rfa().slice(), async (r) => { _openRfaDoc(r.id); }, () => _printRfa());
      }
      L.push(it);
    });
    return L;
  }

  // ═══ 3) انتخاب کا خانہ — تین بٹن، تین الگ کام ═══════════════════════════
  const MODES = {
    print: { ttl: 'پرنٹ', note: 'منتخب دستاویزات ایک ہی پرنٹ میں آئیں گی — ہر دستاویز نئے صفحے سے، بالکل ویسی جیسی مقدمے میں اُس کی چِپ کھولنے پر نظر آتی ہے۔ کاغذ کا سائز (لیگل/A4) ایک بار پوچھا جائے گا۔' },
    download: { ttl: 'ڈاؤن لوڈ', note: 'منتخب دستاویزات ایک ہی فائل (PDF یا Word) میں اس آلے پر محفوظ ہوں گی — ہر دستاویز نئے صفحے سے، بالکل ویسی جیسی مقدمے میں نظر آتی ہے۔' },
    share: { ttl: 'شیئر', note: 'منتخب دستاویزات ایک ہی فائل (PDF یا Word) میں WhatsApp / ای میل وغیرہ پر بھیجی جائیں گی — ہر دستاویز نئے صفحے سے، بالکل ویسی جیسی مقدمے میں نظر آتی ہے۔' },
  };
  let _items = [], _case = null;
  async function dioCasePrint(caseId, mode) {
    const M = MODES[mode] ? mode : 'print';
    try {
      if (typeof _dioNeed === 'function') await _dioNeed(['misal-docs.js', 'case-docs.js', 'case-form.js', 'report173.js']);
      _case = (typeof getCase === 'function') ? await getCase(caseId) : null;
      if (!_case) { TOAST('مقدمہ نہیں ملا', 'error'); return; }
      if (typeof loadMisalDocs === 'function') await loadMisalDocs(caseId);
      try { if (typeof _misalCase !== 'undefined') _misalCase = _case; } catch (_) { /* ضمنی */ }
      _items = await buildItems(_case);
    } catch (e) { TOAST('دستاویزات کی فہرست نہیں بن سکی — ' + ((e && e.message) || ''), 'error'); return; }
    const rows = _items.map((it, i) => `
      <label class="dcp-row">
        <input type="checkbox" value="${i}">
        <span class="dcp-nm">${E(it.name)}</span>
        ${it.saved ? '<span class="dcp-ok" title="محفوظ ڈیٹا موجود">● محفوظ</span>' : '<span class="dcp-no">خالی</span>'}
      </label>`).join('');
    const body = `
      <style>
        /* #modal-body دو کالم کا grid ہے (اندراج کارڈ) — یہ فہرست پوری چوڑائی میں */
        .dcp-wrap{direction:rtl;font-family:'Jameel Noori Nastaleeq';width:100%;grid-column:1/-1;}
        .dcp-tools{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;}
        .dcp-list{display:flex;flex-direction:column;gap:6px;max-height:55vh;overflow:auto;padding:2px;width:100%;box-sizing:border-box;}
        .dcp-row{display:flex;align-items:center;gap:8px;padding:6px 10px;border:1px solid var(--border,#ccd);border-radius:9px;cursor:pointer;background:var(--bg-secondary,#f8fafc);min-height:44px;box-sizing:border-box;}
        .dcp-row:has(input:checked){border-color:var(--accent,#2563eb);background:var(--nav-active,#e0edff);}
        .dcp-row input{width:18px;height:18px;flex-shrink:0;margin:0;}
        .dcp-nm{flex:1;min-width:0;font-size:14pt;line-height:1.6;}
        .dcp-ok{font-size:10pt;color:var(--green,#16a34a);white-space:nowrap;}
        .dcp-no{font-size:10pt;color:var(--text-muted,#889);white-space:nowrap;}
        .dcp-note{font-size:10.5pt;color:var(--text-muted,#667);margin-top:8px;line-height:1.8;}
      </style>
      <div class="dcp-wrap" data-mode="${M}">
        <div class="dcp-tools">
          <button type="button" class="btn btn-secondary btn-sm" onclick="_dcpPick('saved')">صرف محفوظ</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="_dcpPick('all')">سب منتخب</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="_dcpPick('none')">کوئی نہیں</button>
        </div>
        <div class="dcp-list" id="dcp-list">${rows}</div>
        <div class="dcp-note">${MODES[M].note}</div>
      </div>`;
    const btn = (cls, act, label) => `<button type="button" class="btn ${cls}" data-dcp="${act}" onclick="_dcpRun('${M}','${act}')">${label}</button>`;
    const acts = (M === 'print') ? btn('btn-primary', 'print', '🖨️ پرنٹ کریں')
      : (M === 'download') ? btn('btn-primary', 'pdf', '⬇️ PDF ڈاؤن لوڈ') + btn('btn-primary', 'word', '⬇️ Word ڈاؤن لوڈ')
      : btn('btn-primary', 'pdf', '📤 PDF شیئر') + btn('btn-primary', 'word', '📤 Word شیئر');
    const foot = `<div style="display:flex;gap:8px;direction:rtl;flex-wrap:wrap;">${acts}
        <button type="button" class="btn btn-secondary" onclick="closeModal()">منسوخ</button></div>`;
    openModal(MODES[M].ttl + ' — مقدمہ ' + (_case.fir_number || '') + ' کی دستاویزات', body, foot);
    // کارڈ صرف اتنا چوڑا جتنی ضرورت (پہلے 980px — آدھا خالی)
    try { const mc = document.querySelector('#modal-backdrop .modal-card'); if (mc) mc.style.maxWidth = '520px'; } catch (_) { /* ضمنی */ }
    _dcpPick('saved');
    window._dcpMode = M;
  }
  window._dcpPick = function (k) {
    document.querySelectorAll('#dcp-list input[type=checkbox]').forEach(cb => {
      const it = _items[+cb.value];
      cb.checked = (k === 'all') ? true : (k === 'none') ? false : !!(it && it.saved && it.id !== 'index_naql');
    });
  };

  // ═══ 4) تیاری — ہر دستاویز کھول کر اُس کا اپنا پرنٹ ════════════════════
  function overlay(msg) {
    let o = document.getElementById('dcp-busy');
    if (!o) {
      o = document.createElement('div'); o.id = 'dcp-busy'; o.className = 'no-print';
      o.setAttribute('role', 'status'); o.setAttribute('aria-live', 'polite');
      o.style.cssText = 'position:fixed;inset:0;z-index:100002;background:rgba(9,20,40,.62);display:flex;align-items:center;justify-content:center;padding:16px;';
      o.innerHTML = '<div style="background:var(--bg-card,#fff);color:var(--text-primary,#111);border-radius:14px;padding:18px 22px;min-width:min(360px,100%);text-align:center;direction:rtl;font-family:\'Jameel Noori Nastaleeq\';box-shadow:0 18px 50px rgba(0,0,0,.35);">' +
        '<div style="font-size:15pt;line-height:1.9;">دستاویزات تیار ہو رہی ہیں…</div><div id="dcp-busy-m" style="font-size:12pt;line-height:1.9;color:var(--text-secondary,#445);"></div>' +
        '<button type="button" class="btn btn-secondary btn-sm" style="margin-top:8px;" onclick="window._dcpCancel=true">روکیں</button></div>';
      document.body.appendChild(o);
    }
    const m = document.getElementById('dcp-busy-m'); if (m) m.textContent = msg || '';
  }
  async function waitStable(max) {
    const host = () => document.getElementById('dio-dv-body') || document.getElementById('page-content');
    let last = -1, same = 0;
    for (let t = 0; t < (max || 7000); t += 160) {
      await sleep(160);
      const h = host(); const len = h ? h.innerHTML.length : 0;
      const busy = h && /کھل رہا ہے|loading-spinner/.test(h.innerHTML.slice(0, 4000));
      if (len === last && !busy) { if (++same >= 3) return; } else same = 0;
      last = len;
    }
  }
  // کھلا ہوا کاغذ (صرف اصل کاغذ — فہرست، بٹن یا اسکرین کبھی نہیں)
  const PAPER_IDS = ['ch173-doc', 'dk-doc', 'saza-doc', 'dio-naqsha-doc', 'cdr-doc', 'idx-paper', 'rfa-doc', 'cro-doc', 'misal-editor'];
  function openPaper() {
    for (const id of PAPER_IDS) {
      const e = document.getElementById(id);
      if (e && e.getClientRects().length && e.getBoundingClientRect().width > 300) return e;
    }
    return null;
  }
  // دستاویز کا اپنا «پرنٹ» چلا کر اُس کا کاغذ (چھپتا نہیں)۔ اپنا پرنٹ براؤزر کی چھپائی
  // ہو (CDR) تو کھلا ہوا کاغذ؛ کچھ نہ ملے تو '' (اسکرین کی نقل کبھی نہیں — v554)
  async function capture(run) {
    const r = await DIO.share.capturePrint(run);
    if (r && r.html) return r.html;
    if (r && r.native) {
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (_) { /* فونٹ */ }
      const el = openPaper();
      if (el) return DIO.share._elementToHtml(el);
    }
    return '';
  }
  // کاغذ پر واقعی کچھ ہے؟ (خالی سانچے میں صرف «Digital IO» رہ جاتا ہے)
  function hasContent(h) {
    const t = String(h || '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<head[\s\S]*?<\/head>/i, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/Digital IO/g, ' ').replace(/\s+/g, '');
    return t.length >= 2 || /<img\b|<svg\b|<canvas\b/i.test(String(h || ''));
  }
  async function htmlFor(it, paper) {
    await it.open();
    await waitStable();
    if (typeof it.html === 'function') return (await it.html(paper)) || '';
    if (typeof it.htmls === 'function') return (await it.htmls(paper)) || [];
    return capture(it.print || (() => (typeof _dioPrintCurrent === 'function') ? _dioPrintCurrent() : null));
  }
  async function collect(sel, paper) {
    const htmls = [], skipped = [], once = {};
    for (let i = 0; i < sel.length; i++) {
      if (window._dcpCancel) break;
      const it = sel[i];
      // ایک ہی کاغذ دو سطروں سے (ضمنیات / میمورنڈم) — ایک ہی بار۔ الگ الگ محفوظ ریکارڈ (چاہے
      //   متن ایک جیسا ہو، مثلاً دو CDR درخواستیں) سب آتے ہیں — جیسے مقدمے میں ہیں
      if (it.once) { if (once[it.once]) continue; once[it.once] = 1; }
      overlay((i + 1) + ' / ' + sel.length + ' — ' + it.name);
      try {
        const got = await htmlFor(it, paper);
        const arr = Array.isArray(got) ? got : [got];
        let any = false;
        arr.forEach(h => { if (h && hasContent(h)) { any = true; htmls.push(h); } });
        if (!any) skipped.push(it.name);
      } catch (e) { skipped.push(it.name); try { console.warn('case print:', it.id, e && e.message); } catch (_) { /* ضمنی */ } }
    }
    return { htmls, skipped };
  }
  function leaveCase() {
    try { if (typeof _dioExitDocView === 'function' && document.getElementById('dio-docview')) _dioExitDocView(); } catch (_) { /* ضمنی */ }
    try { if (typeof goBackToCases === 'function') goBackToCases(); } catch (_) { /* ضمنی */ }
  }
  // شیئر: فائل بننے میں چند سیکنڈ لگتے ہیں — موبائل کا «شیئر» صرف تازہ ٹچ پر کھلتا ہے،
  //   اس لیے تیار فائل کے لیے ایک چھوٹا خانہ: «شیئر کریں» (اسی وقت) · «ڈاؤن لوڈ»
  function readyBox(file, title) {
    const old = document.getElementById('dcp-ready'); if (old) old.remove();
    const box = document.createElement('div');
    box.id = 'dcp-ready'; box.className = 'no-print';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'فائل تیار');
    box.style.cssText = 'position:fixed;inset:0;z-index:100003;background:rgba(9,20,40,.55);display:flex;align-items:center;justify-content:center;padding:16px;';
    box.innerHTML = '<div dir="rtl" style="background:var(--bg-card,#fff);color:var(--text-primary,#111);border:1px solid var(--border,#ccd);border-radius:14px;padding:18px 18px 12px;width:min(380px,100%);box-shadow:0 18px 50px rgba(0,0,0,.35);text-align:center;font-family:\'Jameel Noori Nastaleeq\';">' +
      '<b style="display:block;font-size:15pt;line-height:1.9;">فائل تیار ہے</b>' +
      '<small style="display:block;font-size:10.5pt;color:var(--text-muted,#667);line-height:1.8;margin-bottom:10px;" dir="auto">' + E(file.name) + '</small>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
      '<button type="button" class="btn btn-primary" data-k="share" style="min-height:46px;">📤 شیئر کریں</button>' +
      '<button type="button" class="btn btn-secondary" data-k="dl" style="min-height:46px;">⬇️ ڈاؤن لوڈ</button></div>' +
      '<button type="button" data-k="x" style="margin-top:6px;background:none;border:0;color:var(--text-muted,#667);font-size:11pt;cursor:pointer;font-family:inherit;min-height:36px;">بند کریں</button></div>';
    document.body.appendChild(box);
    box.addEventListener('click', async (ev) => {
      const b = ev.target.closest('button'); if (!b) { if (ev.target === box) box.remove(); return; }
      const k = b.getAttribute('data-k');
      if (k === 'x') { box.remove(); return; }
      if (k === 'dl') { DIO.share.download(file, file.name); box.remove(); TOAST('فائل ڈاؤن لوڈ ہو گئی', 'success'); return; }
      const r = await DIO.share.deliver([file], title, false);
      if (r === 'cancel') return;
      box.remove();
      TOAST(r === 'shared' ? 'فائل شیئر کے لیے بھیج دی گئی' : 'اس آلے پر شیئر دستیاب نہیں — فائل ڈاؤن لوڈ ہو گئی', 'success', 4500);
    });
    try { box.querySelector('[data-k="share"]').focus(); } catch (_) { /* ضمنی */ }
  }

  // mode: 'print' | 'download' | 'share' · fmt: 'print' | 'pdf' | 'word'
  window._dcpRun = async function (mode, fmt) {
    if (!MODES[mode]) { fmt = (mode === 'print') ? 'print' : fmt; mode = 'print'; }
    if (mode !== 'print' && fmt !== 'pdf' && fmt !== 'word') fmt = 'pdf';
    const sel = [].slice.call(document.querySelectorAll('#dcp-list input[type=checkbox]:checked')).map(cb => _items[+cb.value]).filter(Boolean);
    if (!sel.length) { TOAST('پہلے کوئی دستاویز منتخب کریں', 'info'); return; }
    if (typeof closeModal === 'function') closeModal();
    let cur = 'legal'; try { cur = localStorage.getItem('dio_ch173_paper') === 'a4' ? 'a4' : 'legal'; } catch (_) { /* پہلے سے طے */ }
    const paper = (typeof dioAskPaper === 'function') ? await dioAskPaper({ current: cur }) : cur;
    if (!paper) return;
    window._dcpCancel = false;
    const prevAuto = window.__dioPaperAuto;
    window.__dioPaperAuto = paper;                 // ہر دستاویز اسی کاغذ پر (دوبارہ نہ پوچھے)
    let got = { htmls: [], skipped: [] };
    const title = 'مقدمہ ' + (_case.fir_number || '') + ' — دستاویزات';
    try {
      if (typeof dioLoadScript === 'function') { await dioLoadScript('dio-forms.js'); await dioLoadScript('dio-share.js'); }
      overlay('مقدمہ کھل رہا ہے');
      await openCaseWorkspace(_case.id);
      await sleep(600);
      got = await collect(sel, paper);
    } catch (e) {
      got = { htmls: [], skipped: [], err: e };
    } finally {
      window.__dioPaperAuto = prevAuto;
    }
    try {
      if (window._dcpCancel) { leaveCase(); TOAST('روک دیا گیا', 'info'); return; }
      if (got.err) { leaveCase(); TOAST('دستاویزات تیار نہیں ہو سکیں — ' + ((got.err && got.err.message) || ''), 'error', 6000); return; }
      if (!got.htmls.length) { leaveCase(); TOAST('منتخب دستاویزات میں چھاپنے کو کچھ نہیں ملا', 'error', 5000); return; }
      if (got.skipped.length) TOAST('یہ دستاویزات خالی تھیں (شامل نہیں): ' + got.skipped.join('، '), 'info', 6000);
      if (mode === 'print') {
        overlay('ایک ساتھ جوڑا جا رہا ہے');
        const merged = (got.htmls.length === 1) ? got.htmls[0] : await merge(got.htmls, title);
        const box = document.getElementById('dcp-busy'); if (box) box.remove();
        leaveCase();
        if (typeof dioPrint === 'function') dioPrint(merged);
        return;
      }
      const step = (i, n) => overlay((fmt === 'word' ? 'Word' : 'PDF') + ' فائل بن رہی ہے — ' + (i + 1) + ' / ' + n);
      step(0, got.htmls.length);
      // PDF اور Word دونوں میں ہر صفحہ بالکل پرنٹ جیسا (ہر دستاویز اپنے صفحات اور اپنے کاغذ پر)
      const blob = (fmt === 'word') ? await DIO.share.docxMany(got.htmls, title, step) : await DIO.share.pdfMany(got.htmls, step);
      const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const name = DIO.share.safeName(title) + (fmt === 'word' ? '.docx' : '.pdf');
      const file = new File([blob], name, { type: fmt === 'word' ? DOCX : 'application/pdf' });
      const box = document.getElementById('dcp-busy'); if (box) box.remove();
      leaveCase();
      if (mode === 'download') { DIO.share.download(file, name); TOAST('فائل ڈاؤن لوڈ ہو گئی — ' + name, 'success', 4500); }
      else readyBox(file, title);
    } catch (e) {
      TOAST('فائل نہیں بن سکی — ' + ((e && e.message) || 'نامعلوم خرابی'), 'error', 6000);
    } finally {
      const box = document.getElementById('dcp-busy'); if (box) box.remove();
    }
  };

  window.dioCasePrint = dioCasePrint;
})();
