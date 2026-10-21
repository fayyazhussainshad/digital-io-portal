/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — مقدمے کی دستاویزات: انتخاب کر کے ایک ساتھ پرنٹ / شیئر
   case-print.js  (v553 — افسر کا قاعدہ)
   «مقدمات کی فہرست میں اقدامات کے بٹنوں کے ساتھ پرنٹ کا بٹن بھی دیں جس میں
    اُس کیس کی تمام دستاویزات (جیسا کہ chips میں ہیں) کی فہرست کھلے؛ جس جس کا
    پرنٹ لینا ہو اُسے منتخب کیا جا سکے۔»

   dioCasePrint(caseId, mode)   mode: 'print' (پہلے سے) | 'share'
     1) فہرست: chips کی ترتیب سے ہر دستاویز (محفوظ ڈیٹا والی پر سبز نشان)؛
        ہر محفوظ چالان اور ہر محفوظ نقشہ الگ سطر
     2) کاغذ کا سائز ایک بار پوچھا جاتا ہے (لیگل/A4) — سب پر وہی
     3) ہر منتخب دستاویز اپنے ہی «پرنٹ» راستے سے بنتی ہے (وہی کاغذ جو اُس کا
        اپنا پرنٹ بٹن دیتا ہے) — پھر سب ایک ہی پرنٹ میں، ہر دستاویز نئے صفحے سے
        اور اپنے صفحے کے سائز/حاشیوں کے ساتھ (CSS named pages)
     4) «شیئر»: وہی مجموعہ پوری فائل (PDF / Word) کی صورت میں

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
    let page = { w: 8.5, h: 13 }, mg = { l: 0, r: 0 };
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
      mg = { r: p[1], l: p[3] };
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
        parts.push({ css: css.join('\n'), html: '<div class="' + E(cls) + '" dir="' + E(dir) + '" style="position:relative;' + bst + ';page:' + pageName + ';' +
          (n ? 'break-before:page;' : '') + '">' + body.innerHTML + '</div>' });
      } finally { st.frame.remove(); }
    }
    return '<!DOCTYPE html><html dir="rtl" lang="ur"><head><meta charset="UTF-8"><title>' + E(title || ' ') + '</title>' +
      [...links].map(h => '<link rel="stylesheet" href="' + E(h) + '">').join('') +
      '<style>' + [...fonts].join('\n') + '</style>' +
      '<style>html,body{margin:0;padding:0;background:#fff;} :where(.dpk){display:block;margin:8px;} ' +
      '*{-webkit-print-color-adjust:exact;print-color-adjust:exact;}</style>' +
      parts.map(p => '<style>' + p.css + '</style>').join('') +
      '</head><body>' + parts.map(p => p.html).join('') + '</body></html>';
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
  async function buildItems(c) {
    const cross = (typeof caseHasCross === 'function') && caseHasCross(c);
    const [acc, wit, matn, zim] = await Promise.all([
      rowsOf('case_accused', 'id,accused_type', c.id), rowsOf('case_witnesses', 'id,witness_type', c.id),
      rowsOf('fir_matn', 'id,type', c.id), rowsOf('zimni_reports', 'id', c.id)]);
    const cnt = { named_accused: acc.filter(x => (x.accused_type || 'fir') === 'fir').length,
      accused_cross: acc.filter(x => x.accused_type === 'cross_version').length,
      witnesses_fir: wit.filter(x => (x.witness_type || 'fir') === 'fir').length,
      witnesses_cross: wit.filter(x => x.witness_type === 'cross_version').length,
      fir: matn.filter(x => (x.type || 'fir') === 'fir').length,
      cross_version: matn.filter(x => x.type === 'cross_version').length,
      zamniyat: zim.length, memorandum: zim.length };
    const has = (k) => {
      if (cnt[k]) return true;
      try { return typeof _misalHasData === 'function' && _misalHasData(k); } catch (_) { return false; }
    };
    const L = [];
    L.push({ id: 'index_naql', name: 'انڈیکس نقل مسل', saved: true, open: () => _openMisalEditor('index_naql') });
    L.push({ id: 'fir', name: 'ایف آئی آر', saved: has('fir'), open: () => _ddPick('fir-dd', 'fir') });
    if (cross) L.push({ id: 'cross_version', name: 'کراس ورژن', saved: has('cross_version'), open: () => _ddPick('fir-dd', 'cross_version') });
    L.push({ id: 'named_accused', name: 'ملزمان FIR', saved: has('named_accused'), open: () => _ddPick('acc-dd', 'named_accused') });
    if (cross) L.push({ id: 'accused_cross', name: 'ملزمان کراس ورژن', saved: has('accused_cross'), open: () => _ddPick('acc-dd', 'accused_cross') });
    L.push({ id: 'witnesses_fir', name: 'گواہان FIR', saved: has('witnesses_fir'), open: () => _ddPick('wit-dd', 'witnesses_fir') });
    if (cross) L.push({ id: 'witnesses_cross', name: 'گواہان کراس ورژن', saved: has('witnesses_cross'), open: () => _ddPick('wit-dd', 'witnesses_cross') });
    // ہر محفوظ چالان الگ سطر
    const ch = await loadChallans(c.id);
    ch.forEach(r => L.push({
      id: 'r173:' + r.id, name: challanName(r), saved: true, group: 'r173',
      open: async () => { await openR173List(); await _r173OpenDoc(r.id); await sleep(700); },
      print: () => _printR173()
    }));
    if (!ch.length) L.push({ id: 'r173', name: 'رپورٹ 173 ض ف', saved: false, open: () => openR173List() });
    (typeof MISAL_CASE_DOCS !== 'undefined' ? MISAL_CASE_DOCS : []).forEach(d => {
      if (d.id === 'index_naql') return;
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
      if (d.id === 'zamniyat') { it.name = 'ضمنیات (تمام)'; it.print = () => _printAllZimni(); }
      if (d.id === 'statements_161') { it.name = 'بیانات 161 ض ف (تمام)'; it.print = () => _printAllZimniA(); }
      L.push(it);
    });
    return L;
  }

  // ═══ 3) انتخاب کا خانہ ════════════════════════════════════════════════
  let _items = [], _case = null;
  async function dioCasePrint(caseId, mode) {
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
        .dcp-wrap{direction:rtl;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;}
        .dcp-tools{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px;}
        .dcp-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:6px;max-height:55vh;overflow:auto;padding:2px;}
        .dcp-row{display:flex;align-items:center;gap:8px;padding:8px 10px;border:1px solid var(--border,#ccd);border-radius:9px;cursor:pointer;background:var(--bg-secondary,#f8fafc);min-height:44px;}
        .dcp-row:has(input:checked){border-color:var(--accent,#2563eb);background:var(--nav-active,#e0edff);}
        .dcp-row input{width:18px;height:18px;flex-shrink:0;}
        .dcp-nm{flex:1;font-size:14pt;line-height:1.6;}
        .dcp-ok{font-size:10pt;color:var(--green,#16a34a);white-space:nowrap;}
        .dcp-no{font-size:10pt;color:var(--text-muted,#889);white-space:nowrap;}
        .dcp-note{font-size:10.5pt;color:var(--text-muted,#667);margin-top:8px;line-height:1.8;}
      </style>
      <div class="dcp-wrap">
        <div class="dcp-tools">
          <button type="button" class="btn btn-secondary btn-sm" onclick="_dcpPick('saved')">صرف محفوظ</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="_dcpPick('all')">سب منتخب</button>
          <button type="button" class="btn btn-secondary btn-sm" onclick="_dcpPick('none')">کوئی نہیں</button>
        </div>
        <div class="dcp-list" id="dcp-list">${rows}</div>
        <div class="dcp-note">منتخب دستاویزات ایک ہی فائل میں آئیں گی — ہر دستاویز نئے صفحے سے، بالکل اپنے پرنٹ کی شکل میں (جدول، سرخیاں اور تمام حروف)۔ کاغذ کا سائز (لیگل/A4) ایک بار پوچھا جائے گا۔</div>
      </div>`;
    const M = mode || 'print';
    const B = {
      print: `<button class="btn ${M === 'print' ? 'btn-primary' : 'btn-secondary'}" onclick="_dcpRun('print')">🖨️ منتخب پرنٹ کریں</button>`,
      share: `<button class="btn ${M === 'share' ? 'btn-primary' : 'btn-secondary'}" onclick="_dcpRun('share')">📤 شیئر (PDF / Word)</button>`,
      download: `<button class="btn ${M === 'download' ? 'btn-primary' : 'btn-secondary'}" onclick="_dcpRun('download')">⬇️ ڈاؤن لوڈ (PDF / Word)</button>`,
    };
    const order = [M].concat(['print', 'share', 'download'].filter(k => k !== M));
    const foot = `<div style="display:flex;gap:8px;direction:rtl;flex-wrap:wrap;">${order.map(k => B[k]).join('')}
        <button class="btn btn-secondary" onclick="closeModal()">منسوخ</button></div>`;
    const ttl = { print: 'پرنٹ', share: 'شیئر', download: 'ڈاؤن لوڈ' }[M] || 'پرنٹ';
    openModal(ttl + ' — مقدمہ ' + (_case.fir_number || '') + ' کی دستاویزات', body, foot);
    _dcpPick('saved');
    window._dcpMode = mode || 'print';
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
      o.innerHTML = '<div style="background:var(--bg-card,#fff);color:var(--text-primary,#111);border-radius:14px;padding:18px 22px;min-width:min(360px,100%);text-align:center;direction:rtl;font-family:\'Jameel Noori Nastaleeq\',serif;box-shadow:0 18px 50px rgba(0,0,0,.35);">' +
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
  async function htmlFor(it, paper) {
    if (typeof it.html === 'function') { await it.open(); await waitStable(); return (await it.html(paper)) || ''; }
    if (typeof it.htmls === 'function') { await it.open(); await waitStable(); return (await it.htmls(paper)) || []; }
    await it.open();
    await waitStable();
    const run = it.print || (() => (typeof _dioPrintCurrent === 'function') ? _dioPrintCurrent() : null);
    const r = await DIO.share.capturePrint(run);
    if (r && r.html) return r.html;
    // اپنا پرنٹ HTML نہ دے (براؤزر کی چھپائی) — تو کھلا ہوا کاغذ ہی (پرنٹ جیسا)
    let el = (DIO.forms && DIO.forms.findPaper) ? DIO.forms.findPaper() : null;
    if (!el) el = document.getElementById('workspace-editor-area');
    return el ? DIO.share._elementToHtml(el) : '';
  }
  window._dcpRun = async function (mode) {
    const sel = [].slice.call(document.querySelectorAll('#dcp-list input[type=checkbox]:checked')).map(cb => _items[+cb.value]).filter(Boolean);
    if (!sel.length) { TOAST('پہلے کوئی دستاویز منتخب کریں', 'info'); return; }
    if (typeof closeModal === 'function') closeModal();
    let cur = 'legal'; try { cur = localStorage.getItem('dio_ch173_paper') === 'a4' ? 'a4' : 'legal'; } catch (_) { /* پہلے سے طے */ }
    const paper = (typeof dioAskPaper === 'function') ? await dioAskPaper({ current: cur }) : cur;
    if (!paper) return;
    window._dcpCancel = false;
    const htmls = [], skipped = [];
    const prevAuto = window.__dioPaperAuto;
    window.__dioPaperAuto = paper;                 // ہر دستاویز اسی کاغذ پر (دوبارہ نہ پوچھے)
    try {
      if (typeof dioLoadScript === 'function') { await dioLoadScript('dio-forms.js'); await dioLoadScript('dio-share.js'); }
      overlay('مقدمہ کھل رہا ہے');
      await openCaseWorkspace(_case.id);
      await sleep(600);
      for (let i = 0; i < sel.length; i++) {
        if (window._dcpCancel) break;
        const it = sel[i];
        overlay((i + 1) + ' / ' + sel.length + ' — ' + it.name);
        try {
          const got = await htmlFor(it, paper);
          const arr = Array.isArray(got) ? got : [got];
          let any = false;
          arr.forEach(h => { if (h && h.length > 300) { any = true; if (htmls.indexOf(h) === -1) htmls.push(h); } });
          if (!any) skipped.push(it.name);
        } catch (e) { skipped.push(it.name); try { console.warn('case print:', it.id, e && e.message); } catch (_) { /* ضمنی */ } }
      }
      if (window._dcpCancel) { TOAST('روک دیا گیا', 'info'); return; }
      if (!htmls.length) { TOAST('منتخب دستاویزات میں چھاپنے کو کچھ نہیں ملا', 'error', 5000); return; }
      overlay('ایک ساتھ جوڑا جا رہا ہے');
      const title = 'مقدمہ ' + (_case.fir_number || '') + ' — دستاویزات';
      const merged = (htmls.length === 1) ? htmls[0] : await merge(htmls, title);
      const box = document.getElementById('dcp-busy'); if (box) box.remove();
      try { if (typeof _dioExitDocView === 'function' && document.getElementById('dio-docview')) _dioExitDocView(); } catch (_) { /* ضمنی */ }
      try { if (typeof goBackToCases === 'function') goBackToCases(); } catch (_) { /* ضمنی */ }
      if (skipped.length) TOAST('یہ دستاویزات خالی تھیں (شامل نہیں): ' + skipped.join('، '), 'info', 6000);
      if (mode === 'share' || mode === 'download') {
        if (DIO.share && DIO.share.open) DIO.share.open({ html: merged }, title, { download: mode === 'download' });
      } else if (typeof dioPrint === 'function') dioPrint(merged);
    } finally {
      window.__dioPaperAuto = prevAuto;
      const box = document.getElementById('dcp-busy'); if (box) box.remove();
    }
  };

  window.dioCasePrint = dioCasePrint;
})();
