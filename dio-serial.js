/* ═══════════════════════════════════════════════════════════════
   DIGITAL IO — dio-serial.js   (نمبر شمار کا ایک ہی قاعدہ — پورا نظام)
   ────────────────────────────────────────────────────────────────
   ASI Fayyaz Hussain Shad ka hukm (TASK 9, 4 Nov 2026):
     • Kisi bhi khane/fehrist mein jo ASHKHAAS ya ASHYA ke naam hon
       (مدعی / ملزم / گواہ / برآمدگی / کوئی بھی چیز):
         – sirf AIK naam/cheez  → koi نمبر شمار NAHI («1» akela kabhi nahi)
         – DO ya zyada          → sab par نمبر، pehle par 1 se shuru
     • Zinda (live): doosra naam aate hi dono par نمبر؛ wapas aik reh jaye
       to نمبر khud hat jaye.
     • Pehle yeh qaida 9 alag jagah alag alag likha tha aur sirf fehrist
       BANTE waqt lagta tha — haath se naam mitane/likhne par nahi. Ab
       saare dastavez yahi AIK madadgar istemal karte hain.
   YEH QAIDA IN PAR NAHI: ضمنی کالم 2 کے دستی فقرہ نمبر، 161 ض ف کا خودکار
   سلسلہ، فارم کی قطاروں کے نمبر، اور ایپ کی فہرستوں (مقدمات وغیرہ) کے نمبر۔
   پرانی محفوظ دستاویزات جوں کی توں کھلتی ہیں — قاعدہ تب لگتا ہے جب افسر وہ فہرست بدلے۔

   Shakl: «1۔ نام» (Urdu وقفہ ۔). HTML wali dastavezat mein hindsa <bdi> mein
   (LTR alag) — jo dastavez pehle se jis shakl mein tha, wohi barqarar.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var MARK = '\u06D4';                                   // ۔
  // Kisi entry ke SHURU mein laga نمبر شمار: «1۔ » / «12 ۔». (Angrezi nuqta «.» NAHI —
  // warna «1.5 کلو چرس» jaisi cheez ka «1.» نمبر samajh kar mit jata.)
  var HEAD = /^[\s\u00A0]*\d{1,3}[\s\u00A0]*\u06D4[\s\u00A0]?/;
  // Do chhote naam aik satar mein (چالان کالم 6): «1۔ الف\u2003 2۔ ب»
  var PAIR = /\u2003[\s\u00A0]*(?=\d{1,3}[\s\u00A0]*\u06D4)/;
  var CARET = '\uE000';                                  // cursor ka nishan (sirf hisaab ke liye)

  // Khana (ya us ka editor) is waqt FOCUS mein hai? Sirf tab cursor sambhalna hai —
  // warna selection lagane se browser khana dobara focus kar deta (afsar kahin aur click kare to bhi).
  function hasFocus(el) {
    var a = document.activeElement;
    return !!a && (a === el || el.contains(a) || (a.isContentEditable && a.contains(el)));
  }
  function prefix(i, n) { return n > 1 ? (i + 1) + MARK + ' ' : ''; }
  function strip(s) { return String(s == null ? '' : s).replace(HEAD, ''); }
  function hasHead(s) { return HEAD.test(String(s == null ? '' : s)); }

  // ["الف", "ب"] → ["1۔ الف", "2۔ ب"] ؛ ["الف"] → ["الف"]
  function list(items) {
    var a = (items || []).map(function (x) { return strip(x).trim(); }).filter(Boolean);
    return a.map(function (x, i) { return prefix(i, a.length) + x; });
  }

  // ── Saada matn (har satar = aik entry) ─────────────────────────
  // opts.skip: RegExp — aisi satar entry nahi (misal «تعداد: 2»)
  function numberText(text, opts) {
    opts = opts || {};
    var lines = String(text == null ? '' : text).replace(/\r/g, '').split('\n');
    var real = function (seg) { return !!strip(seg.replace(CARET, '')).replace(/[\s\u00A0\u2003]/g, ''); };
    var rows = lines.map(function (ln) {
      var clean = ln.replace(CARET, '');
      if (!clean.replace(/[\s\u00A0\u2003]/g, '') || (opts.skip && opts.skip.test(clean.trim()))) return null;
      return ln.split(PAIR);
    });
    var n = 0;
    rows.forEach(function (r) { if (r) r.forEach(function (seg) { if (real(seg)) n++; }); });
    var k = 0;
    var out = lines.map(function (ln, li) {
      var r = rows[li];
      if (!r) return ln;
      var segs = [];
      r.forEach(function (seg) {
        if (!real(seg)) {                              // khali, ya sirf bacha hua «2۔» — نمبر hatao
          if (seg.indexOf(CARET) !== -1) segs.push(CARET);
          return;
        }
        // cursor ka nishan نمبر ke andar ho to usay matn ke shuru par le aao
        var hadCaret = seg.indexOf(CARET) !== -1;
        var noCaret = seg.replace(CARET, '');
        var m = noCaret.match(HEAD);
        var headLen = m ? m[0].length : (noCaret.match(/^[\s\u00A0]*/) || [''])[0].length;
        var caretAt = hadCaret ? seg.indexOf(CARET) : -1;
        var body = noCaret.slice(headLen);
        var pre = prefix(k++, n);
        if (hadCaret) {
          var inBody = Math.max(0, caretAt - headLen);
          body = body.slice(0, inBody) + CARET + body.slice(inBody);
        }
        segs.push(pre + body);                         // afsar ki likhi khali jagah barqarar
      });
      return segs.join('\u2003');
    });
    return out.join('\n');
  }

  // ── Zinda khana (contenteditable, saada matn + <br>) ─────────────
  // Lautata hai: true agar kuch badla. Cursor usi harf par rehta hai.
  function applyText(el, opts) {
    if (!el) return false;
    var sel = window.getSelection ? window.getSelection() : null;
    var mark = null;
    try {
      if (sel && sel.rangeCount && el.contains(sel.anchorNode) && hasFocus(el)) {
        var rg = sel.getRangeAt(0).cloneRange();
        rg.collapse(false);
        mark = document.createTextNode(CARET);
        rg.insertNode(mark);
      }
    } catch (_) { mark = null; }
    var before = String(el.innerText || '').replace(/\r/g, '');
    // aakhir ki khali satar (cursor ke liye <br>) barqarar rahe
    var trail = (before.match(/\n+$/) || [''])[0];
    var core = trail ? before.slice(0, -trail.length) : before;
    var after = numberText(core, opts) + trail;
    if (after === before) {
      if (mark && mark.parentNode) { var p0 = mark.parentNode; mark.remove(); try { p0.normalize(); } catch (_) { /* - */ } }
      return false;
    }
    el.innerText = after;
    // nishan dhoondo → cursor wahan → nishan hatao
    try {
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      var n;
      while ((n = w.nextNode())) {
        var i = n.nodeValue.indexOf(CARET);
        if (i === -1) continue;
        n.nodeValue = n.nodeValue.slice(0, i) + n.nodeValue.slice(i + 1);
        if (sel && mark) {
          var r = document.createRange();
          r.setStart(n, i); r.collapse(true);
          sel.removeAllRanges(); sel.addRange(r);
        }
        break;
      }
    } catch (_) { /* UI ka ikhtiyari qadam — na ho sake to chhoR do */ }
    return true;
  }

  // ── Har entry apna element (misal <div class="zf-acc">) ─────────
  // opts.item: har entry ka selector; opts.holder: entry ke andar نمبر ki jagah
  // (na ho to entry khud); opts.style: 'text' («1۔ » saada) ya 'bdi' (<bdi>1۔</bdi> )
  function numHolder(it, opts) { return (opts.holder && it.querySelector(opts.holder)) || it; }
  function readNum(h) {
    // <bdi>1۔</bdi> (+ ' ') / <bdi dir="ltr">1</bdi>۔ / saada «1۔ »
    var f = h.firstChild;
    while (f && f.nodeType === 3 && !f.nodeValue.replace(/[\s\u00A0]/g, '')) f = f.nextSibling;
    if (f && f.nodeType === 1 && /^(BDI|SPAN)$/.test(f.nodeName) && /^\s*\d{1,3}\s*\u06D4?\s*$/.test(f.textContent || '')) {
      var after = f.nextSibling;
      var dotOutside = !/\u06D4/.test(f.textContent) && after && after.nodeType === 3 && /^[\s\u00A0]*\u06D4/.test(after.nodeValue);
      return { kind: 'el', el: f, dotOutside: dotOutside };
    }
    if (f && f.nodeType === 3 && HEAD.test(f.nodeValue)) return { kind: 'text', node: f };
    return null;
  }
  function applyItems(root, opts) {
    if (!root) return false;
    opts = opts || {};
    var items = Array.prototype.filter.call(root.querySelectorAll(opts.item), function (it) {
      return strip(it.textContent || '').replace(/[\s\u00A0]/g, '').length > 0;
    });
    var n = items.length, changed = false;
    // cursor: agar usi matn ke tukre mein hai jis ka نمبر badla, to usay utna hi khiska do
    var sel = window.getSelection ? window.getSelection() : null;
    var an = sel && sel.rangeCount && hasFocus(root) ? sel.anchorNode : null, ao = an ? sel.anchorOffset : 0, moved = false;
    var setText = function (node, nv, oldHead, newHead) {
      if (node === an) { ao = ao <= oldHead ? newHead : ao + (newHead - oldHead); moved = true; }
      node.nodeValue = nv;
    };
    items.forEach(function (it, i) {
      var h = numHolder(it, opts), cur = readNum(h), want = n > 1 ? String(i + 1) : '';
      if (cur && cur.kind === 'el') {
        if (!want) {
          var nx = cur.el.nextSibling;
          cur.el.remove();
          if (nx && nx.nodeType === 3) nx.nodeValue = nx.nodeValue.replace(cur.dotOutside ? /^[\s\u00A0]*\u06D4[\s\u00A0]?/ : /^[\s\u00A0]+/, '');
          changed = true;
        } else {
          var t = cur.dotOutside ? want : want + MARK;
          if ((cur.el.textContent || '').trim() !== t) { cur.el.textContent = t; changed = true; }
        }
        return;
      }
      if (cur && cur.kind === 'text') {
        var v = cur.node.nodeValue, body = v.replace(HEAD, '');
        var head = want ? want + MARK + ' ' : '';
        var nv = head + body;
        if (nv !== v) { setText(cur.node, nv, v.length - body.length, head.length); changed = true; }
        return;
      }
      if (!want) return;
      if (opts.style === 'bdi') {
        var b = document.createElement('bdi');
        b.textContent = want + MARK;
        h.insertBefore(document.createTextNode(' '), h.firstChild);
        h.insertBefore(b, h.firstChild);
      } else {
        var first = h.firstChild;
        if (first && first.nodeType === 3) {
          var fv = first.nodeValue, lead = (fv.match(/^[\s\u00A0]*/) || [''])[0].length;
          setText(first, want + MARK + ' ' + fv.slice(lead), lead, (want + MARK + ' ').length);
        } else h.insertBefore(document.createTextNode(want + MARK + ' '), h.firstChild);
      }
      changed = true;
    });
    if (moved && an && an.isConnected) {
      try { var r = document.createRange(); r.setStart(an, Math.min(ao, (an.nodeValue || '').length)); r.collapse(true); sel.removeAllRanges(); sel.addRange(r); } catch (_) { /* - */ }
    }
    return changed;
  }

  // ── <br> se alag satren (misal واقعاتی رپورٹ: «<bdi>1</bdi>۔ نام<br>…<br>تعداد: <bdi>2</bdi>») ──
  function applyBrLines(root, opts) {
    if (!root) return false;
    opts = opts || {};
    // har satar ko aik waqti <span data-dio-sl> mein lapeto, applyItems chalao, phir khol do
    var kids = Array.prototype.slice.call(root.childNodes), lines = [[]];
    kids.forEach(function (k) { if (k.nodeName === 'BR') lines.push([]); else lines[lines.length - 1].push(k); });
    var wraps = [];
    lines.forEach(function (ln) {
      if (!ln.length) return;
      var txt = ln.map(function (x) { return x.textContent || ''; }).join('').trim();
      if (!txt || (opts.skip && opts.skip.test(txt))) return;
      var s = document.createElement('span');
      s.setAttribute('data-dio-sl', '1');
      root.insertBefore(s, ln[0]);
      ln.forEach(function (x) { s.appendChild(x); });
      wraps.push(s);
    });
    var changed = applyItems(root, { item: 'span[data-dio-sl]', style: opts.style });
    wraps.forEach(function (s) { while (s.firstChild) root.insertBefore(s.firstChild, s); s.remove(); });
    if (opts.count) {                                    // «تعداد: n» bhi sahi
      var n = wraps.length;
      Array.prototype.forEach.call(root.querySelectorAll('bdi'), function (b) {
        var prev = b.previousSibling;
        if (prev && prev.nodeType === 3 && opts.count.test(prev.nodeValue) && b.textContent !== String(n) && n > 0) { b.textContent = String(n); changed = true; }
      });
    }
    return changed;
  }

  // ── Kisi khane ko zinda banao: likhte/mitate hi نمبر durust ─────────
  // opts.mode: 'text' | 'items' | 'br'; opts.ready(el) → false ho to abhi nahi;
  // opts.after(el, changed) — dastavez ka apna kaam (layout, dirty …)
  function run(el, opts) {
    if (!el || !el.isConnected || (opts.ready && opts.ready(el) === false)) return false;
    var changed = false;
    try {
      changed = opts.mode === 'items' ? applyItems(el, opts)
              : opts.mode === 'br' ? applyBrLines(el, opts)
              : applyText(el, opts);
    } catch (_) { changed = false; }
    if (changed) {
      el._dioSerialSelf = true;
      try { el.dispatchEvent(new Event('input', { bubbles: true })); } catch (_) { /* purana browser */ }
      el._dioSerialSelf = false;
    }
    try { if (opts.after) opts.after(el, changed); } catch (_) { /* dastavez ka apna qadam */ }
    return changed;
  }

  // ── Zinda khane ki register. Aik hi sunne wala poore safhe par: khana apna
  //    editor ho (چالان کے خانے) ya kisi bare editor ke andar (ضمنی کا «بنام») —
  //    dono soorton mein likhte/mitate (600ms ruk kar) aur khana chhorte hi نمبر durust.
  var _reg = [], _auto = [];
  function _owner(node) {
    for (var n = node; n && n !== document; n = n.parentNode) {
      if (n._dioSerialOpts) return n;
    }
    // Dastavez ne apni fehrist ka selector diya ho (DIOSerial.auto) — pehli tabdeeli par khud jud jaye
    var elm = node && (node.nodeType === 1 ? node : node.parentElement);
    for (var i = 0; elm && i < _auto.length; i++) {
      var hit = elm.closest(_auto[i][0]);
      if (hit) { bind(hit, _auto[i][1]); return hit; }
    }
    return null;
  }
  // AHEM: sirf wohi fehrist jise afsar ne ABHI badla («_dioSerialTouched») — purani
  // mehfooz dastavez kholne ya kahin aur likhne se koi fehrist khud nahi badalti.
  function _schedule(el, leaving) {
    clearTimeout(el._dioSerialT);
    var o = el._dioSerialOpts;
    el._dioSerialT = setTimeout(function () {
      if (!el._dioSerialTouched) return;
      if (leaving) el._dioSerialTouched = false;
      run(el, leaving ? Object.assign({ leaving: true }, o) : o);
    }, leaving ? 0 : (o.delay || 600));
  }
  var _wired = false;
  function _wire() {
    if (_wired || typeof document === 'undefined') return;
    _wired = true;
    document.addEventListener('input', function (e) {
      var t = e.target;
      if (t && t._dioSerialSelf) return;
      var sel = window.getSelection ? window.getSelection() : null;
      var el = _owner(sel && sel.anchorNode) || _owner(t);
      if (el && !el._dioSerialSelf) { el._dioSerialTouched = true; _schedule(el, false); }
    }, true);
    document.addEventListener('focusout', function (e) {
      var t = e.target;
      _reg = _reg.filter(function (el) { return el.isConnected; });
      _reg.forEach(function (el) { if (t && (t === el || (t.contains && t.contains(el)))) _schedule(el, true); });
    }, true);
  }
  function bind(el, opts) {
    if (!el) return;
    el._dioSerialOpts = opts || {};
    if (_reg.indexOf(el) === -1) _reg.push(el);
    _wire();
  }
  // Nayi/har dastavez: «yeh selector meri fehrist hai» — bas aik line (aainda ke tamam forms ke liye bhi)
  function auto(selector, opts) { _auto.push([selector, opts || {}]); _wire(); }

  window.DIOSerial = {
    MARK: MARK, HEAD: HEAD,
    prefix: prefix, strip: strip, hasHead: hasHead, list: list,
    numberText: numberText, applyText: applyText, applyItems: applyItems, applyBrLines: applyBrLines,
    run: run, bind: bind, auto: auto
  };
})();
