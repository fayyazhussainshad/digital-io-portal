/* ═══════════════════════════════════════════════════════════════════
   DIGITAL IO — HTML sanitization utility  (dio-html.js)
   Audit "Correct #6" — sanitize before save/render/print/export.

   Naya:
   • DOMPurify (jab load ho) — industry-standard XSS filter
   • Fallback — mazboot regex-free template based strip (browser DOM parser)
   • Common attack vectors: scripts, iframes, on* handlers, javascript:/data:
     URLs, style expression(), meta refresh, form/action, embeds, imports.

   Usage:
     DIO.html.safe(dirty)         → cleaned HTML (rich text ke liye)
     DIO.html.text(input)         → HTML-escaped text (esc() jaisa)
     DIO.html.stripScripts(x)     → sirf scripts hataayo (light)
     DIO.html.hasDangerous(x)     → true agar suspicious tags/attrs milen

   ═══════════════════════════════════════════════════════════════════ */

(function () {
  // ── DOMPurify config ────────────────────────────────────────
  // Investigation editor mein Urdu rich text hoti hai — tables, formatting,
  // dates. Restrictive rakhें magar practical: images fine, forms nahin.
  var DOMPURIFY_CONFIG = {
    // Sirf ye tags allowed
    ALLOWED_TAGS: [
      'a','abbr','b','bdi','bdo','blockquote','br','caption','cite','code',
      'col','colgroup','dd','del','details','dfn','div','dl','dt','em',
      'figcaption','figure','h1','h2','h3','h4','h5','h6','hr','i','img',
      'ins','kbd','li','mark','ol','p','pre','q','rp','rt','ruby','s',
      'samp','small','span','strong','sub','summary','sup','table','tbody',
      'td','tfoot','th','thead','time','tr','u','ul','var','wbr',
      // Editors use ye specifically
      'font',           // execCommand fontName legacy
      'center'          // legacy alignment
    ],
    ALLOWED_ATTR: [
      'href','src','alt','title','width','height','align','valign',
      'colspan','rowspan','dir','lang','class','style',
      'contenteditable','spellcheck','data-k','id','tabindex',
      'face','color','size'
    ],
    // Safe URI schemes
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|data:image\/(?:png|jpe?g|gif|webp|svg\+xml));|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    // form, input, script wغیرہ auto-strip
    FORBID_TAGS: ['form','input','button','select','textarea','script','style','iframe','object','embed','link','meta','base','svg','math'],
    FORBID_ATTR: ['formaction','action','srcdoc','ping'],
    KEEP_CONTENT: true,             // striped tag ka andarooni text rakh lo
    ALLOW_DATA_ATTR: true,          // data-k etc rich editors ke liye zaruri
    RETURN_TRUSTED_TYPE: false
  };

  var DIO_HTML = {
    // Full XSS-safe sanitization
    safe: function (dirty) {
      if (dirty == null) return '';
      var str = String(dirty);
      // DOMPurify available?
      if (typeof window.DOMPurify !== 'undefined' && DOMPurify.sanitize) {
        try {
          return DOMPurify.sanitize(str, DOMPURIFY_CONFIG);
        } catch (e) {
          try { console.warn('[DIO.html] DOMPurify failed, fallback:', e); } catch (_) {}
        }
      }
      // Fallback — mazboot native strip
      return this._nativeSanitize(str);
    },

    // Text-only escape (esc() ka namespace-safe alias)
    text: function (input) {
      if (input == null) return '';
      return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    // Light strip — sirf scripts + on* handlers, formatting rakhें
    stripScripts: function (dirty) {
      if (dirty == null) return '';
      var t = document.createElement('template');
      t.innerHTML = String(dirty);
      var kills = t.content.querySelectorAll('script,iframe,object,embed,style,link,meta,base');
      kills.forEach(function (n) { try { n.remove(); } catch (_) {} });
      var all = t.content.querySelectorAll('*');
      all.forEach(function (el) {
        // event handlers strip
        Array.prototype.slice.call(el.attributes).forEach(function (a) {
          var n = a.name.toLowerCase();
          if (n.indexOf('on') === 0) el.removeAttribute(a.name);
        });
      });
      return t.innerHTML;
    },

    // Detection — quick check for known dangerous patterns
    hasDangerous: function (input) {
      if (input == null) return false;
      var s = String(input);
      // Common XSS vectors
      return (
        /<\s*script/i.test(s)               ||
        /<\s*iframe/i.test(s)               ||
        /<\s*(object|embed|meta|base|link)/i.test(s) ||
        /\son\w+\s*=/i.test(s)              ||
        /javascript\s*:/i.test(s)           ||
        /vbscript\s*:/i.test(s)             ||
        /expression\s*\(/i.test(s)          ||   // IE style expression
        /srcdoc\s*=/i.test(s)               ||
        /formaction\s*=/i.test(s)
      );
    },

    // Native fallback — same as existing sanitizeHtml() magar zyada hardened
    _nativeSanitize: function (str) {
      var t = document.createElement('template');
      t.innerHTML = str;
      // 1) Remove kill-tags
      var kill = t.content.querySelectorAll('script,iframe,object,embed,link,style,meta,base,form,input,button,select,textarea,svg,math');
      kill.forEach(function (n) { try { n.remove(); } catch (_) {} });
      // 2) Strip dangerous attrs from every element
      var all = t.content.querySelectorAll('*');
      all.forEach(function (el) {
        Array.prototype.slice.call(el.attributes).forEach(function (a) {
          var n = a.name.toLowerCase();
          var v = String(a.value || '');
          var vl = v.trim().toLowerCase();
          // on* handlers
          if (n.indexOf('on') === 0) return el.removeAttribute(a.name);
          // srcdoc, formaction, action, ping
          if (n === 'srcdoc' || n === 'formaction' || n === 'action' || n === 'ping') {
            return el.removeAttribute(a.name);
          }
          // href/src/xlink:href with javascript:/vbscript:/data:script
          if ((n === 'href' || n === 'src' || n === 'xlink:href') &&
              (vl.indexOf('javascript:') === 0 ||
               vl.indexOf('vbscript:') === 0 ||
               vl.indexOf('data:text/html') === 0)) {
            return el.removeAttribute(a.name);
          }
          // style with expression() or javascript:
          if (n === 'style' &&
              (/expression\s*\(/i.test(v) || /javascript\s*:/i.test(v) ||
               /vbscript\s*:/i.test(v)     || /behavior\s*:/i.test(v)  ||
               /@import/i.test(v))) {
            return el.removeAttribute(a.name);
          }
        });
      });
      return t.innerHTML;
    }
  };

  window.DIO = window.DIO || {};
  window.DIO.html = DIO_HTML;

  // ── Soft-upgrade existing sanitizeHtml() ────────────────────
  // Purani code base 45+ jagahon par `sanitizeHtml(x)` call karta.
  // Us ko `DIO.html.safe(x)` mein forward kar dें — agla release
  // sab jagahon par bhi upgrade ho jayegi.
  //
  // NOTE: Ye override sirf tab lagta hai jab `sanitizeHtml` pehle se
  // window par mojood ho (yani app-core.js load ho chuki ho). Agar
  // dio-html.js sabse pehle load hoti hai (jaisa order hai), to koi
  // problem nahin — app-core.js baad mein apni `sanitizeHtml` install
  // karti hai (const in top-level scope) aur usi ka use hoga.
  // To ensure our upgrade sticks, hum window.sanitizeHtml ko upgrade
  // karte hain DOMContentLoaded ke baad — ya turant agar available ho.
  function _upgradeSanitizeHtml() {
    try {
      // Sirf tab replace karें jab existing wo DIO.html.safe se alag ho
      if (typeof window.sanitizeHtml === 'function' &&
          window.sanitizeHtml !== DIO_HTML.safe) {
        window.sanitizeHtml = function (x) { return DIO_HTML.safe(x); };
      }
    } catch (_) {}
  }
  if (typeof document !== 'undefined') {
    // Multiple hooks — dono baar chalne se koi masla nahi (idempotent)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _upgradeSanitizeHtml);
    } else {
      _upgradeSanitizeHtml();
    }
    // Bhi baad mein — jab load ho jaye
    window.addEventListener && window.addEventListener('load', _upgradeSanitizeHtml);
  }
})();
