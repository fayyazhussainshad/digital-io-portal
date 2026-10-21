/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — پوری فائل شیئر (PDF + Word)  — dio-share.js
   افسر کی ہدایت (اکتوبر 2026): «سسٹم تیار فائل شیئر کرتے ہوئے صرف اردو
   تحریر شیئر کرتا ہے — پوری فائل PDF اور Word فارمیٹ میں، جدولوں اور
   پرنٹ میں نظر آنے والے تمام حروف کے ساتھ شیئر کرے۔»
   (اسی ہدایت پر Word کی پرانی پابندی ختم — صرف شیئر کے لیے .doc فائل۔)

   DIO.share.open(el, title)   → چھوٹا انتخاب: PDF · Word · دونوں
   DIO.share.pdf(el, title)    → Blob (application/pdf)
   DIO.share.word(el, title)   → Blob (application/msword)

   PDF: کاغذ کو اسی شکل میں تصویر بنا کر (html2canvas — fonts/vendor میں
        خود میزبان، آف لائن بھی) صفحہ بہ صفحہ PDF — اردو نستعلیق، جدول،
        لکیریں سب ویسی ہی جیسی پرنٹ میں۔
   Word: کاغذ کی نقل (DIO.forms.capture، ڈیٹا سمیت) ہر عنصر کے انداز کے
        ساتھ — جدول، کالم، سرخیاں، اردو متن۔ (Word میں فونٹ وہی جو اس
        کمپیوٹر پر ہو؛ ہوبہو شکل کے لیے PDF۔)
   موبائل: سسٹم کا Share (WhatsApp وغیرہ) فائل کے ساتھ؛ جہاں فائل شیئر
   ممکن نہ ہو وہاں فائل ڈاؤن لوڈ ہو جاتی ہے۔
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  window.DIO = window.DIO || {};

  var H2C_SRC = 'vendor/html2canvas.min.js';
  function need(src) {
    if (typeof window.dioLoadScript === 'function') return window.dioLoadScript(src);
    return new Promise(function (res) {
      var s = document.createElement('script'); s.src = src; s.onload = function () { res(true); };
      s.onerror = function () { res(false); }; document.head.appendChild(s);
    });
  }

  // کوئی قدم اٹک جائے تو ہمیشہ کا انتظار نہیں — مقررہ وقت کے بعد آگے (یا غلطی)
  function within(p, ms, label) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error((label || 'step') + ' timeout')); }, ms); })]);
  }
  function safeName(t) {
    return String(t || 'Digital IO').replace(/[\\/:*?"<>|\n\r\t]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Digital IO';
  }

  // کاغذ کا سائز: چوڑائی سے (A4 ≈ 8.27in، Legal/Folio ≈ 8.5in)
  function paperOf(el) {
    var w = (el.offsetWidth || el.getBoundingClientRect().width) / 96;
    if (Math.abs(w - 8.27) < 0.15) return { w: 8.27, h: 11.69 };
    if (w > 8.4 && w < 8.7) return { w: 8.5, h: 13 };
    return { w: Math.max(4, w), h: Math.max(4, w) * 1.414 };
  }

  // ── PDF لکھنے والا (چھوٹا، بغیر بیرونی لائبریری): JPEG صفحات ───────
  function b64ToBytes(b64) {
    var bin = atob(b64), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function buildPdf(pages, wPt, hPt) {
    // pages: [{ jpg: Uint8Array, w: px, h: px }]
    var enc = new TextEncoder(), parts = [], offs = [], len = 0;
    function add(x) { var b = (typeof x === 'string') ? enc.encode(x) : x; parts.push(b); len += b.length; }
    function obj(n, body) { offs[n] = len; add(n + ' 0 obj\n'); body(); add('\nendobj\n'); }
    add('%PDF-1.4\n%âãÏÓ\n');
    var n = pages.length, kids = [];
    for (var i = 0; i < n; i++) kids.push((3 + i * 3) + ' 0 R');
    obj(1, function () { add('<< /Type /Catalog /Pages 2 0 R >>'); });
    obj(2, function () { add('<< /Type /Pages /Count ' + n + ' /Kids [' + kids.join(' ') + '] >>'); });
    pages.forEach(function (p, i) {
      var pn = 3 + i * 3, cn = pn + 1, im = pn + 2;
      obj(pn, function () {
        add('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + wPt + ' ' + hPt + '] /Resources << /XObject << /I' + i + ' ' + im +
          ' 0 R >> >> /Contents ' + cn + ' 0 R >>');
      });
      var dh = wPt * p.h / p.w;           // تصویر کی اونچائی (پوائنٹ)
      var cmd = 'q ' + wPt + ' 0 0 ' + dh.toFixed(2) + ' 0 ' + (hPt - dh).toFixed(2) + ' cm /I' + i + ' Do Q';
      obj(cn, function () { add('<< /Length ' + cmd.length + ' >>\nstream\n' + cmd + '\nendstream'); });
      obj(im, function () {
        add('<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h +
          ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.jpg.length + ' >>\nstream\n');
        add(p.jpg); add('\nendstream');
      });
    });
    var xref = len, total = 3 + n * 3;
    var x = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var k = 1; k < total; k++) x += String(offs[k]).padStart(10, '0') + ' 00000 n \n';
    add(x + 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF');
    return new Blob(parts, { type: 'application/pdf' });
  }

  // ── پرنٹ والا HTML (ماڈیول کا اپنا) → پوشیدہ iframe میں کاغذ ─────────
  function pageFromHtml(html) {
    var m = /@page\s*\{[^}]*size\s*:\s*([^;}]+)/i.exec(html || '');
    var v = m ? m[1].trim().toLowerCase() : '';
    if (/a4/.test(v)) return { w: 8.27, h: 11.69 };
    if (/legal/.test(v)) return { w: 8.5, h: 14 };
    var n = /([\d.]+)\s*(in|mm|cm)\s+([\d.]+)\s*(in|mm|cm)/.exec(v);
    if (n) {
      var k = function (x, u) { x = +x; return u === 'mm' ? x / 25.4 : (u === 'cm' ? x / 2.54 : x); };
      return { w: k(n[1], n[2]), h: k(n[3], n[4]) };
    }
    return { w: 8.5, h: 13 };          // سسٹم کا معیاری Legal/Folio
  }
  function marginsFromHtml(html) {
    // @page کا margin (انچ میں) — اوپر، دائیں، نیچے، بائیں
    var m = /@page\s*\{[^}]*margin\s*:\s*([^;}]+)/i.exec(html || '');
    if (!m) return { t: 0, r: 0, b: 0, l: 0 };
    var u = function (x) {
      var n = /(-?[\d.]+)\s*(in|mm|cm|pt|px)?/.exec(x || '0'); if (!n) return 0;
      var v = +n[1], k = n[2] || 'px';
      return k === 'in' ? v : k === 'mm' ? v / 25.4 : k === 'cm' ? v / 2.54 : k === 'pt' ? v / 72 : v / 96;
    };
    var p = m[1].trim().split(/\s+/).map(u);
    if (p.length === 1) p = [p[0], p[0], p[0], p[0]];
    else if (p.length === 2) p = [p[0], p[1], p[0], p[1]];
    else if (p.length === 3) p = [p[0], p[1], p[2], p[1]];
    return { t: p[0], r: p[1], b: p[2], l: p[3] };
  }
  async function frameFor(html) {
    var pg = pageFromHtml(html), mg = marginsFromHtml(html);
    var cw = Math.round((pg.w - mg.l - mg.r) * 96);       // پرنٹ میں مواد کی چوڑائی
    var f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:fixed;left:-30000px;top:0;border:0;background:#fff;width:' + cw + 'px;height:' + Math.round(pg.h * 96) + 'px;';
    f.style.setProperty('display', 'block', 'important');
    f.style.setProperty('visibility', 'visible', 'important');
    // <body> کے باہر (html کے اندر): چھپائی کے وقت والے «body > * چھپاؤ» قاعدے اس پر نہ لگیں
    document.documentElement.appendChild(f);
    var d = f.contentWindow.document;
    // موبائل براؤزر کا «متن خود بڑا کرنا» (text autosizing) کاغذ پر نہیں
    html = String(html).replace(/<head([^>]*)>/i, '<head$1><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<style>html{-webkit-text-size-adjust:100% !important;text-size-adjust:100% !important;}</style>');
    // کاغذ «پرنٹ» کی شکل میں: @media print والے قاعدے لاگو، screen والے نہیں
    html = String(html).replace(/@media\s+print/gi, '@media all').replace(/@media\s+screen/gi, '@media not all');
    d.open(); d.write(html); d.close();
    await new Promise(function (r) { setTimeout(r, 150); });
    // فونٹ لوڈ ہونے کا انتظار — زیادہ سے زیادہ 5 سیکنڈ (کوئی فونٹ اٹک جائے تو بھی آگے)
    for (var w8 = 0; w8 < 50; w8++) {
      var stt = 'loaded';
      try { stt = d.fonts ? d.fonts.status : 'loaded'; } catch (_) { stt = 'loaded'; }
      if (stt === 'loaded') break;
      await new Promise(function (r) { setTimeout(r, 100); });
    }
    await new Promise(function (r) { setTimeout(r, 250); });
    // v553: فائل بھی پرنٹ جیسی — جفت صفحات پر مثل باندھنے کی جگہ (اپنا حساب نہ رکھنے والی دستاویزات)
    try { if (typeof window.dioBindNeeded === 'function' && window.dioBindNeeded(html)) window.dioAutoBind(d, html); } catch (_) { /* ضمنی */ }
    f.style.height = Math.max(d.documentElement.scrollHeight, 50) + 'px';
    return { frame: f, doc: d, page: pg, margin: mg, cw: cw };
  }

  // کاغذ کا عنصر → اپنا مکمل HTML: صفحے کے تمام انداز (CSS) + یہی عنصر — پھر iframe میں
  // «پرنٹ» کے قاعدے لاگو ہوتے ہیں، یعنی موبائل پر بھی وہی کاغذ جو چھپتا ہے (A4/Legal)۔
  function pageCss() {
    var out = [];
    [].forEach.call(document.styleSheets, function (sh) {
      try { [].forEach.call(sh.cssRules || [], function (r) { out.push(r.cssText); }); } catch (_) { /* دوسری جگہ کی شیٹ (Google Fonts) — چھوڑ دو */ }
    });
    return out.join('\n');
  }
  function elementToHtml(el) {
    var c = el.cloneNode(true);
    // خانوں کی موجودہ قدر (value) HTML میں
    var srcF = el.querySelectorAll('input,textarea,select'), dstF = c.querySelectorAll('input,textarea,select');
    for (var i = 0; i < srcF.length && i < dstF.length; i++) {
      try {
        if (srcF[i].tagName === 'TEXTAREA') dstF[i].textContent = srcF[i].value;
        else if (srcF[i].tagName === 'SELECT') { var o = dstF[i].options[srcF[i].selectedIndex]; if (o) o.setAttribute('selected', 'selected'); }
        else if (srcF[i].type === 'checkbox' || srcF[i].type === 'radio') { if (srcF[i].checked) dstF[i].setAttribute('checked', 'checked'); }
        else dstF[i].setAttribute('value', srcF[i].value);
      } catch (_) { /* ضمنی */ }
    }
    c.querySelectorAll('script,button,.no-print,[data-noprint],.colgrip,.rowgrip,.dio-etb,.editor-toolbar').forEach(function (n) { n.remove(); });
    c.style.transform = 'none'; c.style.margin = '0 auto';
    var mk = el.id ? '' : ' data-dio-paper="1"';
    var html = c.outerHTML.replace(/^<([a-z0-9]+)/i, '<$1' + mk);
    // والدین کی شناختیں (#ir-view وغیرہ) — انداز انہی پر لکھے ہوتے ہیں؛ خالی خول میں لپیٹو
    var wrapOpen = '', wrapClose = '';
    for (var n = el.parentElement; n && n !== document.body; n = n.parentElement) {
      var attrs = (n.id ? ' id="' + n.id + '"' : '') + (n.className && typeof n.className === 'string' ? ' class="' + n.className.replace(/"/g, '') + '"' : '');
      wrapOpen = '<div' + attrs + ' style="all:unset;display:block;">' + wrapOpen;
      wrapClose += '</div>';
    }
    // اس دستاویز کا اپنا @page (اس کے ماڈیول کی <style> میں) سب سے پہلے — کاغذ کا سائز وہی
    var ownPage = '';
    for (var a = el; a && a !== document && !ownPage; a = a.parentElement) {
      a.querySelectorAll && [].forEach.call(a.querySelectorAll('style'), function (st) {
        if (ownPage) return;
        var m = /@page\s*\{[^}]*\}/i.exec(st.textContent || ''); if (m) ownPage = m[0];
      });
    }
    return '<!doctype html><html lang="ur" dir="rtl"><head><meta charset="utf-8"><style>' + ownPage + '</style><style>' + pageCss() + '</style>' +
      '<style>html,body{margin:0 !important;padding:0 !important;background:#fff !important;color:#000;overflow:visible !important;height:auto !important;}' +
      'body *{animation:none !important;transition:none !important;}</style></head><body>' + wrapOpen + html + wrapClose + '</body></html>';
  }

  // ── فونٹ (SVG تصویر کے اندر باہر سے فونٹ نہیں آتا — اس لیے ساتھ شامل) ──
  var FONT_URLS = {
    'Jameel Noori Nastaleeq': 'https://cdn.jsdelivr.net/npm/jameel-noori/fonts/jameel-noori-nastaleeq4.woff2',
    'Amiri Quran DIO': 'fonts/amiri-quran-arabic.woff2',
    'Amiri DIO': 'fonts/amiri-arabic.woff2'
  };
  var _fontCache = {};
  async function fontFaceCss(usedText) {
    var css = '';
    for (var fam in FONT_URLS) {
      if (usedText.indexOf(fam) < 0) continue;
      try {
        if (!_fontCache[fam]) {
          var res = await within(fetch(FONT_URLS[fam]), 20000, 'font fetch');
          if (!res.ok) throw new Error('font ' + res.status);
          var u = new Uint8Array(await within(res.arrayBuffer(), 30000, 'font read')), bin = '';
          for (var i = 0; i < u.length; i += 0x8000) bin += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
          _fontCache[fam] = btoa(bin);
        }
        css += "@font-face{font-family:'" + fam + "';src:url(data:font/woff2;base64," + _fontCache[fam] + ") format('woff2');}";
      } catch (_) { /* فونٹ نہ ملا — آلے کا اپنا (مثلاً Noto Nastaliq) استعمال ہو گا */ }
    }
    return css;
  }

  // براؤزر کی اپنی رینڈرنگ (SVG foreignObject) — کھڑے کالم، نستعلیق، جدول بالکل پرنٹ جیسے
  async function nativeCanvas(fr, scale, inline) {
    var d = fr.doc, W = fr.cw, H = d.documentElement.scrollHeight;
    // کاغذ (پرنٹ کے قاعدوں کے ساتھ) کی نقل — ہر عنصر کا حتمی انداز inline، تاکہ تصویر کسی
    // CSS selector پر منحصر نہ رہے (body/html/:root وغیرہ) اور بالکل iframe والی شکل بنے
    // ماڈیول کا اپنا پرنٹ HTML: اس کی اپنی CSS ہی کافی (پہلے سے پرنٹ کے لیے بنی)؛
    // اسکرین کا عنصر: صفحے کی پوری CSS پر منحصر — اس لیے inline
    var cap = (inline && window.DIO.forms && DIO.forms.capture) ? DIO.forms.capture(d.body, { keepData: true }) : null;
    var xml, styles = '';
    if (cap) {
      var holder = document.createElement('div'); holder.innerHTML = cap.html;
      var root = holder.firstElementChild;
      var div = document.createElement('div');
      if (root) { div.setAttribute('style', (root.getAttribute('style') || '') + ';margin:0;'); while (root.firstChild) div.appendChild(root.firstChild); }
      xml = new XMLSerializer().serializeToString(div);
    } else {
      styles = [].map.call(d.querySelectorAll('style'), function (x) { return x.textContent; }).join('\n').replace(/@page[^{]*\{[^}]*\}/g, '');
      var bodyClone = d.body.cloneNode(true);
      bodyClone.querySelectorAll('script,button,.no-print').forEach(function (n) { n.remove(); });
      xml = new XMLSerializer().serializeToString(bodyClone).replace(/^<body/, '<div').replace(/<\/body>$/, '</div>');
    }
    var ff = await fontFaceCss(styles + xml);
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + Math.round(W * scale) + '" height="' + Math.round(H * scale) +
      '" viewBox="0 0 ' + W + ' ' + H + '"><foreignObject x="0" y="0" width="' + W + '" height="' + H + '">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" style="width:' + W + 'px;background:#fff;">' +
      '<style><![CDATA[' + ff + styles.replace(/\]\]>/g, '') + ']]></style>' + xml + '</div></foreignObject></svg>';
    var img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await within(img.decode(), 20000, 'image decode');
    // پہلی بار بنانے پر فونٹ لوڈ ہوتے ہیں — تھوڑا انتظار، پھر اصل تصویر
    var warm = document.createElement('canvas'); warm.width = 8; warm.height = 8;
    try { warm.getContext('2d').drawImage(img, 0, 0); } catch (_) { /* ضمنی */ }
    await new Promise(function (r) { setTimeout(r, ff ? 2200 : 400); });
    // فونٹ مکمل لگنے تک: دو بار بنا کر موازنہ — ایک جیسی ہوں تو تیار (زیادہ سے زیادہ 4 بار)
    function draw() {
      var c = document.createElement('canvas');
      c.width = Math.round(W * scale); c.height = Math.round(H * scale);
      var g = c.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img, 0, 0, c.width, c.height);
      return c;
    }
    function sig(c) {
      var t = document.createElement('canvas'); t.width = 96; t.height = Math.max(1, Math.round(96 * c.height / c.width));
      t.getContext('2d').drawImage(c, 0, 0, t.width, t.height);
      return t.toDataURL('image/png');        // tainted ہو تو یہیں پکڑا جائے (پھر متبادل راستہ)
    }
    var c = draw(), prev = sig(c);
    for (var k = 0; k < 3 && ff; k++) {
      await new Promise(function (r) { setTimeout(r, 900); });
      var c2 = draw(), s2 = sig(c2);
      c = c2;
      if (s2 === prev) break;
      prev = s2;
    }
    return c;
  }

  // صفحوں کی حدیں: زبردستی صفحہ (break-before/after) اور سطر کے بیچ سے نہ کاٹنا
  function forcedBreaks(fr, scale) {
    var d = fr.doc, win = d.defaultView, out = [];
    d.querySelectorAll('body *').forEach(function (n) {
      var cs = win.getComputedStyle(n);
      var top = n.getBoundingClientRect().top + win.scrollY, bot = top + n.getBoundingClientRect().height;
      if (/always|page/.test(cs.breakBefore + ' ' + cs.pageBreakBefore) && top > 5) out.push(Math.round(top * scale));
      if (/always|page/.test(cs.breakAfter + ' ' + cs.pageBreakAfter)) out.push(Math.round(bot * scale));
    });
    return out.sort(function (a, b) { return a - b; });
  }
  function whiteRow(g, w, y) {
    var px = g.getImageData(0, y, w, 1).data;
    for (var i = 0; i < px.length; i += 16) { if (px[i] < 235 || px[i + 1] < 235 || px[i + 2] < 235) return false; }
    return true;
  }
  function paginate(canvas, pageContentH, forced) {
    var g = canvas.getContext('2d'), cuts = [], y = 0, H = canvas.height;
    while (y < H - 4) {
      var limit = y + pageContentH, f = forced.filter(function (b) { return b > y + 10 && b <= limit; })[0];
      var end;
      if (f) end = f;
      else if (limit >= H) end = H;
      else {
        end = limit;
        for (var t = limit; t > limit - pageContentH * 0.18; t -= 2) { if (whiteRow(g, canvas.width, t)) { end = t; break; } }
      }
      cuts.push([y, end]); y = end;
    }
    return cuts;
  }

  async function pdfFromHtml(html, inline) {
    var fr = await frameFor(html);
    try {
      var H = fr.doc.documentElement.scrollHeight;
      var scale = Math.min(2, Math.max(1.25, 14000 / Math.max(H, 1)));
      var canvas;
      try { canvas = await nativeCanvas(fr, scale, inline); }
      catch (e) {                                                    // متبادل: html2canvas
        window.__dioShareLastErr = String((e && e.stack) || e);
        return await pdfOf(fr.doc.body, fr.page);
      }
      var pg = fr.page, mg = fr.margin, ppi = 96 * scale;
      var cuts = paginate(canvas, Math.round((pg.h - mg.t - mg.b) * ppi), forcedBreaks(fr, scale));
      // بالکل خالی حصہ (کاغذ کی نچلی خالی جگہ) الگ صفحہ نہ بنے — پہلا صفحہ ہمیشہ
      var gg = canvas.getContext('2d');
      cuts = cuts.filter(function (c, i) {
        if (i === 0) return true;
        for (var y = c[0]; y < c[1]; y += 6) { if (!whiteRow(gg, canvas.width, y)) return true; }
        return false;
      });
      var pages = cuts.map(function (c) {
        var pc = document.createElement('canvas');
        pc.width = Math.round(pg.w * ppi); pc.height = Math.round(pg.h * ppi);
        var g = pc.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, pc.width, pc.height);
        g.drawImage(canvas, 0, c[0], canvas.width, c[1] - c[0], Math.round(mg.l * ppi), Math.round(mg.t * ppi), canvas.width, c[1] - c[0]);
        return { jpg: b64ToBytes(pc.toDataURL('image/jpeg', 0.92).split(',')[1]), w: pc.width, h: pc.height };
      });
      if (!pages.length) throw new Error('دستاویز خالی ہے');
      return buildPdf(pages, Math.round(pg.w * 72), Math.round(pg.h * 72));
    } finally { fr.frame.remove(); }
  }

  async function pdf(el, title) {
    if (!el) throw new Error('دستاویز نہیں ملی');
    var isHtml = (typeof el === 'object' && el.html && !el.nodeType);
    return pdfFromHtml(isHtml ? el.html : elementToHtml(el), !isHtml);
  }
  async function pdfOf(el, pageHint) {
    if (!el) throw new Error('دستاویز نہیں ملی');
    var ok = await need(H2C_SRC);
    if (!ok || typeof window.html2canvas !== 'function') throw new Error('PDF بنانے کا آلہ لوڈ نہیں ہو سکا');
    var paper = pageHint || paperOf(el);
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (_) { /* فونٹ کا انتظار ضمنی */ }
    var saved = { t: el.style.transform, m: el.style.marginBottom, o: el.style.transformOrigin };
    el.style.transform = 'none'; el.style.marginBottom = '0';
    var canvas, rots = [];
    try {
      // کھڑے (گھمائے ہوئے) خانے — html2canvas انہیں درست نہیں بناتا؛ الگ بنا کر گھما کر لگائیں گے
      rots = findRotated(el);
      canvas = await window.html2canvas(el, {
        onclone: function (cd) {
          try { cd.querySelectorAll('[data-dio-rot]').forEach(function (n) { n.style.visibility = 'hidden'; }); } catch (_) { /* ضمنی */ }
        },
        scale: 2, backgroundColor: '#ffffff', useCORS: true, logging: false,
        windowWidth: pageHint ? Math.round(pageHint.w * 96) : Math.max(document.documentElement.clientWidth, el.scrollWidth + 40),
        ignoreElements: function (n) {
          try {
            if (!n.matches) return false;
            return n.matches('.no-print,button,.colgrip,.rowgrip,[class*="grip"],.dio-etb,.editor-toolbar,[data-noprint],#dio-saved-box,.dio-saved-box');
          } catch (_) { return false; }
        }
      });
      await paintRotated(el, canvas, rots);
    } finally {
      rots.forEach(function (r) { try { r.el.removeAttribute('data-dio-rot'); } catch (_) { /* ضمنی */ } });
      el.style.transform = saved.t; el.style.marginBottom = saved.m; el.style.transformOrigin = saved.o;
    }
    // صفحوں میں تقسیم
    var pxPerIn = canvas.width / paper.w;
    var pageH = Math.round(paper.h * pxPerIn);
    var pages = [];
    for (var y = 0; y < canvas.height - 4; y += pageH) {
      var h = Math.min(pageH, canvas.height - y);
      var c = document.createElement('canvas');
      c.width = canvas.width; c.height = pageH;
      var g = c.getContext('2d');
      g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      var data = c.toDataURL('image/jpeg', 0.92).split(',')[1];
      pages.push({ jpg: b64ToBytes(data), w: c.width, h: c.height });
    }
    if (!pages.length) throw new Error('دستاویز خالی ہے');
    return buildPdf(pages, Math.round(paper.w * 72), Math.round(paper.h * 72));
  }

  // ── کھڑے خانے (writing-mode: vertical یا rotate) ─────────────────
  function rotationOf(n, win) {
    var cs = win.getComputedStyle(n), deg = 0;
    if (/^vertical/.test(cs.writingMode || '')) deg += 90;
    var t = cs.transform;
    if (t && t !== 'none') {
      var m = /matrix\(([^)]+)\)/.exec(t);
      if (m) { var v = m[1].split(',').map(parseFloat); deg += Math.round(Math.atan2(v[1], v[0]) * 180 / Math.PI); }
    }
    deg = ((deg % 360) + 360) % 360;
    return deg;
  }
  function findRotated(root) {
    var win = root.ownerDocument.defaultView, out = [];
    var all = root.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var n = all[i];
      if (n.closest('[data-dio-rot]')) continue;
      var d = rotationOf(n, win);
      if (d === 90 || d === 270) {
        if (!(n.textContent || '').trim()) continue;
        n.setAttribute('data-dio-rot', String(out.length));
        out.push({ el: n, deg: d });
      }
    }
    return out;
  }
  // ہر کھڑے خانے کا متن سیدھا بنا کر، اسی جگہ گھما کر کینوس پر
  async function paintRotated(root, canvas, rots) {
    if (!rots.length) return;
    var doc = root.ownerDocument, win = doc.defaultView;
    var rr = root.getBoundingClientRect();
    var k = canvas.width / rr.width;
    var g = canvas.getContext('2d');
    for (var i = 0; i < rots.length; i++) {
      var R = rots[i], n = R.el, b = n.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      var cs = win.getComputedStyle(n);
      var tmp = doc.createElement('div');
      tmp.style.cssText = 'position:absolute;left:-30000px;top:0;background:transparent;writing-mode:horizontal-tb;transform:none;' +
        'direction:' + cs.direction + ';text-align:' + (cs.textAlign || 'center') + ';font-family:' + cs.fontFamily + ';font-size:' + cs.fontSize +
        ';font-weight:' + cs.fontWeight + ';line-height:' + cs.lineHeight + ';color:' + cs.color + ';width:' + b.height + 'px;white-space:normal;';
      tmp.innerHTML = n.innerHTML;
      tmp.querySelectorAll('*').forEach(function (c) { c.style.writingMode = 'horizontal-tb'; c.style.transform = 'none'; c.style.position = 'static'; });
      doc.body.appendChild(tmp);
      try {
        var t = await window.html2canvas(tmp, { scale: k, backgroundColor: null, logging: false });
        var cx = (b.left - rr.left + b.width / 2) * k, cy = (b.top - rr.top + b.height / 2) * k;
        g.save(); g.translate(cx, cy); g.rotate(R.deg * Math.PI / 180);
        g.drawImage(t, -t.width / 2, -t.height / 2);
        g.restore();
      } catch (_) { /* یہ خانہ رہ گیا — باقی کاغذ بنتا رہے */ }
      finally { tmp.remove(); }
    }
  }

  // ── Word (.doc — Word اسے سیدھا کھولتا ہے؛ جدول اور اردو متن برقرار) ──
  function wordHtml(el, title) {
    var cap = (window.DIO.forms && DIO.forms.capture) ? DIO.forms.capture(el, { keepData: true }) : { html: el.outerHTML };
    var paper = paperOf(el);
    return '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" ' +
      'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + safeName(title) + '</title>' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->' +
      '<style>@page Section1{size:' + paper.w + 'in ' + paper.h + 'in;margin:0.4in 0.4in 0.4in 0.4in;}' +
      'div.Section1{page:Section1;} body{direction:rtl;font-family:"Jameel Noori Nastaleeq","Noto Nastaliq Urdu","Times New Roman",serif;}' +
      'table{border-collapse:collapse;} td,th{mso-line-height-rule:at-least;}</style></head>' +
      '<body dir="rtl" lang="ur"><div class="Section1" dir="rtl">' + cap.html + '</div></body></html>';
  }
  // پرنٹ والا HTML (اپنی <style> سمیت) → Word: Office کے نشان شامل
  function wordFromPrintHtml(html, title) {
    var pg = pageFromHtml(html);
    var head = '<meta charset="utf-8"><!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom>' +
      '<w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]--><style>@page WordSection1{size:' + pg.w + 'in ' + pg.h + 'in;margin:0.4in;}' +
      'div.WordSection1{page:WordSection1;}</style>';
    var h = String(html).replace(/<script[\s\S]*?<\/script>/gi, '');
    h = h.replace(/<html([^>]*)>/i, '<html$1 xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">');
    h = /<head[^>]*>/i.test(h) ? h.replace(/<head([^>]*)>/i, '<head$1>' + head) : head + h;
    h = h.replace(/<body([^>]*)>/i, '<body$1><div class="WordSection1" dir="rtl">').replace(/<\/body>/i, '</div></body>');
    if (!/<title>/i.test(h)) h = h.replace(/<\/head>/i, '<title>' + safeName(title) + '</title></head>');
    return h;
  }
  // Word: پرنٹ کی شکل والا کاغذ (چھپی چیزیں ہٹا کر) — ہر عنصر کا انداز inline، تاکہ Word
  // جدول کی لکیریں، چوڑائیاں، سرخیاں اور اردو متن ویسے ہی رکھے۔ کھڑے خانوں کو Word کا اپنا
  // گھماؤ (mso-rotate) دیا جاتا ہے۔
  async function word(el, title) {
    var body;
    try {
      var html = (el && typeof el === 'object' && el.html && !el.nodeType) ? el.html : elementToHtml(el);
      var fr = await frameFor(html);
      try {
        var win = fr.doc.defaultView;
        fr.doc.querySelectorAll('td,th').forEach(function (td) {
          var v = td.querySelector('*') ? [td].concat([].slice.call(td.querySelectorAll('*'))) : [td];
          for (var i = 0; i < v.length; i++) {
            var dg = rotationOf(v[i], win);
            if (dg === 90 || dg === 270) { td.setAttribute('data-mso-rot', dg === 90 ? '90' : '-90'); break; }
          }
        });
        var cap = DIO.forms.capture(fr.doc.body, { keepData: true });
        var h = cap.html.replace(/data-mso-rot="(-?\d+)"([^>]*?)style="/g, 'data-mso-rot="$1"$2style="mso-rotate:$1;');
        // Word/LibreOffice لکیروں کی الگ الگ خصوصیات کم سمجھتے ہیں — مختصر شکل (border-top:1px solid #000)
        h = h.replace(/style="([^"]*)"/g, function (m, st) {
          var map = {}, rest = [];
          st.split(';').forEach(function (d) {
            var k = d.indexOf(':'); if (k < 0) return;
            var n = d.slice(0, k).trim(), v = d.slice(k + 1).trim();
            var bm = /^border-(top|right|bottom|left)-(width|style|color)$/.exec(n);
            if (bm) { (map[bm[1]] = map[bm[1]] || {})[bm[2]] = v; } else rest.push(n + ':' + v);
          });
          ['top', 'right', 'bottom', 'left'].forEach(function (sd) {
            var b = map[sd]; if (!b) return;
            var w = b.width || '0px', sty = b.style || 'none', c = b.color || '#000';
            if (sty !== 'none' && parseFloat(w) > 0) rest.push('border-' + sd + ':' + w + ' ' + sty + ' ' + c);
            else rest.push('border-' + sd + ':none');
          });
          return 'style="' + rest.join(';') + '"';
        });
        var pg = fr.page, mg = fr.margin;
        body = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" ' +
          'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><title>' + safeName(title) + '</title>' +
          '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom><w:DoNotOptimizeForBrowser/></w:WordDocument></xml><![endif]-->' +
          '<style>@page WordSection1{size:' + pg.w + 'in ' + pg.h + 'in;margin:' + mg.t + 'in ' + mg.r + 'in ' + mg.b + 'in ' + mg.l + 'in;}' +
          'div.WordSection1{page:WordSection1;} table{border-collapse:collapse;}</style></head>' +
          '<body dir="rtl" lang="ur"><div class="WordSection1" dir="rtl">' + h + '</div></body></html>';
      } finally { fr.frame.remove(); }
    } catch (_) {
      body = (el && typeof el === 'object' && el.html && !el.nodeType) ? wordFromPrintHtml(el.html, title) : wordHtml(el, title);
    }
    return new Blob(['\ufeff', body], { type: 'application/msword' });
  }

  // ── ماڈیول کا اپنا «پرنٹ» چلا کر اس کا HTML پکڑنا (پرنٹ ہوتا نہیں) ──
  //    یہی وہ کاغذ ہے جو پرنٹ میں نظر آتا ہے — شیئر بھی بالکل یہی۔
  async function capturePrint(run) {
    var html = null, native = false;
    var o = { dp: window.dioPrint, dd: window._dioDoPrint, pr: window.print, op: window.open };
    window.dioPrint = function (h) { html = h; };
    window._dioDoPrint = function (h) { html = h; };
    window.print = function () { native = true; };
    window.open = function () {
      var buf = '';
      return { document: { write: function (x) { buf += x; html = buf; }, close: function () { /* - */ }, open: function () { /* - */ } },
        print: function () { /* - */ }, focus: function () { /* - */ }, close: function () { /* - */ } };
    };
    // v553: پرنٹ اب کاغذ کا سائز پوچھتا ہے — نقل لیتے وقت نہ پوچھے (موجودہ کاغذ ہی)
    var ownAuto = !window.__dioPaperAuto;
    if (ownAuto) window.__dioPaperAuto = 'keep';
    try { await run(); await new Promise(function (r) { setTimeout(r, 60); }); }
    finally {
      window.dioPrint = o.dp; window._dioDoPrint = o.dd; window.print = o.pr; window.open = o.op;
      if (ownAuto) window.__dioPaperAuto = undefined;
    }
    return { html: html, native: native };
  }

  // شیئر: پہلے ماڈیول کا پرنٹ والا کاغذ؛ وہ نہ ملے تو کھلی دستاویز کا کاغذ (el)
  async function fromPrint(run, title, fallbackEl) {
    var r = { html: null };
    try { r = await capturePrint(run); } catch (_) { r = { html: null }; }
    if (r.html) { open({ html: r.html }, title); return true; }
    var el = (typeof fallbackEl === 'function') ? fallbackEl() : fallbackEl;
    if (!el && window.DIO && DIO.forms) el = DIO.forms.findPaper();
    if (el) { open(el, title); return true; }
    toast('شیئر کے لیے دستاویز نہیں ملی', 'error');
    return false;
  }

  function download(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
  }

  // فائلیں: شیئر (موبائل) ورنہ ڈاؤن لوڈ
  async function deliver(files, title, onlyDownload) {
    if (onlyDownload) { files.forEach(function (f) { download(f, f.name); }); return 'downloaded'; }
    var shareable = files.filter(function (f) {
      try { return navigator.canShare && navigator.canShare({ files: [f] }); } catch (_) { return false; }
    });
    var shared = false;
    if (shareable.length) {
      try { await navigator.share({ files: shareable, title: safeName(title) }); shared = true; }
      catch (e) { if (e && e.name === 'AbortError') return 'cancel'; }
    }
    var rest = shared ? files.filter(function (f) { return shareable.indexOf(f) < 0; }) : files;
    rest.forEach(function (f) { download(f, f.name); });
    return shared ? (rest.length ? 'shared+downloaded' : 'shared') : 'downloaded';
  }

  async function make(el, title, kind) {
    var base = safeName(title), files = [];
    if (kind === 'pdf' || kind === 'both') files.push(new File([await pdf(el, title)], base + '.pdf', { type: 'application/pdf' }));
    if (kind === 'word' || kind === 'both') files.push(new File([await word(el, title)], base + '.doc', { type: 'application/msword' }));
    return files;
  }

  function toast(m, t, d) { try { if (typeof showToast === 'function') showToast(m, t || 'info', d || 3500); } catch (_) { /* ضمنی */ } }

  // ── انتخاب کا چھوٹا خانہ ───────────────────────────────────────
  function open(el, title, opts) {
    opts = opts || {};
    if (!el) { toast('شیئر کے لیے دستاویز نہیں ملی', 'error'); return; }
    var old = document.getElementById('dio-share-box'); if (old) old.remove();
    var box = document.createElement('div');
    box.id = 'dio-share-box'; box.className = 'no-print';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-label', 'فائل شیئر کریں');
    box.innerHTML =
      '<div class="dio-shr-card" dir="rtl">' +
      '<b class="dio-shr-h">' + (opts.download ? 'فائل ڈاؤن لوڈ کریں' : 'فائل شیئر کریں') + '</b>' +
      '<small class="dio-shr-sub">پوری دستاویز — جدول، سرخیاں اور تمام حروف بالکل پرنٹ جیسے</small>' +
      '<div class="dio-shr-btns">' +
      '<button type="button" data-k="pdf">PDF</button>' +
      '<button type="button" data-k="word">Word</button>' +
      '<button type="button" data-k="both" class="is-main">PDF + Word</button>' +
      '</div><div class="dio-shr-msg" aria-live="polite"></div>' +
      '<button type="button" class="dio-shr-x" data-k="x">بند کریں</button></div>';
    document.body.appendChild(box);
    var msg = box.querySelector('.dio-shr-msg');
    box.addEventListener('click', async function (ev) {
      var b = ev.target.closest('button'); if (!b) { if (ev.target === box) box.remove(); return; }
      var k = b.getAttribute('data-k');
      if (k === 'x') { box.remove(); return; }
      box.querySelectorAll('button').forEach(function (x) { x.disabled = true; });
      msg.textContent = 'فائل تیار ہو رہی ہے…';
      try {
        var files = await make(el, title, k);
        var r = await deliver(files, title, !!opts.download);
        if (r === 'cancel') { msg.textContent = ''; }
        else {
          box.remove();
          toast(r === 'shared' ? 'فائل شیئر کے لیے بھیج دی گئی' : 'فائل تیار — ڈاؤن لوڈ ہو گئی', 'success');
        }
      } catch (e) {
        msg.textContent = 'فائل نہیں بن سکی — ' + ((e && e.message) || 'نامعلوم خرابی');
      } finally {
        box.querySelectorAll('button').forEach(function (x) { x.disabled = false; });
      }
    });
  }

  // انداز (ایک بار)
  (function css() {
    if (document.getElementById('dio-share-css')) return;
    var st = document.createElement('style'); st.id = 'dio-share-css';
    st.textContent =
      '#dio-share-box{position:fixed;inset:0;z-index:100000;background:rgba(9,20,40,.55);display:flex;align-items:center;justify-content:center;padding:16px;}' +
      '#dio-share-box .dio-shr-card{background:var(--bg-card,#fff);color:var(--text-primary,#111);border:1px solid var(--border,#ccd);border-radius:14px;' +
      'padding:18px 18px 12px;width:min(380px,100%);box-shadow:0 18px 50px rgba(0,0,0,.35);text-align:center;font-family:"Jameel Noori Nastaleeq","Noto Nastaliq Urdu",serif;}' +
      '#dio-share-box .dio-shr-h{display:block;font-size:15pt;line-height:1.9;}' +
      '#dio-share-box .dio-shr-sub{display:block;font-size:10.5pt;color:var(--text-muted,#667);line-height:1.8;margin-bottom:10px;}' +
      '#dio-share-box .dio-shr-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px;}' +
      '#dio-share-box .dio-shr-btns button{min-height:46px;border-radius:10px;border:1.5px solid var(--accent,#13294b);background:transparent;' +
      'color:var(--text-primary,#13294b);font-size:12.5pt;font-weight:700;cursor:pointer;font-family:inherit;}' +
      '#dio-share-box .dio-shr-btns button.is-main{grid-column:1/-1;background:var(--accent,#13294b);color:#fff;}' +
      '#dio-share-box .dio-shr-btns button:disabled{opacity:.6;cursor:wait;}' +
      '#dio-share-box .dio-shr-msg{min-height:1.8em;font-size:10.5pt;line-height:1.8;margin-top:8px;color:var(--text-secondary,#445);}' +
      '#dio-share-box .dio-shr-x{margin-top:2px;background:none;border:0;color:var(--text-muted,#667);font-size:11pt;cursor:pointer;font-family:inherit;}';
    document.head.appendChild(st);
  })();

  window.DIO.share = { open: open, pdf: pdf, word: word, wordHtml: wordHtml, make: make, deliver: deliver, paperOf: paperOf,
    capturePrint: capturePrint, fromPrint: fromPrint, pageFromHtml: pageFromHtml,
    _elementToHtml: elementToHtml, _frameFor: frameFor };
})();
