/* ════════════════════════════════════════════════════════════════════════
   Digital IO — ایک ہی نشانات کا سیٹ (TASK 19، افسر کی ہدایت 11 نومبر 2026)
   ────────────────────────────────────────────────────────────────────────
   «ایک ہی کام کا بٹن ہر جگہ ایک جیسا — وہی شکل، ناپ، نشان، رنگ اور نام۔
    معیار = مقدمہ کی فہرست کے ایکشن بٹن۔ تمام نشانات ایک ہی سیٹ سے۔»

   • پورے سسٹم کا ہر نشان صرف یہاں (DIO_ICONS) — 24×24 خانہ، لکیر currentColor،
     موٹائی 1.9، گول سرے۔ پہلے سات (open … copy) مقدمہ کی فہرست کے بالکل وہی نشان ہیں۔
   • استعمال: <i class="dio-i" data-ico="print" aria-hidden="true"></i>  (یا dioIco('print'))
     یہ فائل <head> میں سب سے پہلے چلتی ہے اور ہر نشان کا CSS (mask) ایک بار لگا دیتی ہے —
     اس لیے نشان کسی بھی جگہ (HTML، JS کی ' یا " یا ` والی لکیر) میں ایک ہی طرح لکھا جاتا ہے،
     اور Windows / Android پر بالکل ایک جیسا بنتا ہے (ایموجی کی طرح آلے کے حساب سے نہیں بدلتا)۔
   • بٹن کی شکل: dio-ui.css کا .dio-btn (pt میں)۔ dioBtn() اسی کی HTML بناتا ہے۔
   • ایک کام = ایک نام (DIO_ACT_LABEL) — بٹن اور اشارہ (title) دونوں میں۔
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var I = {
    // ── معیار: مقدمہ کی فہرست کے ایکشن بٹن (جوں کے توں) ──
    open:      '<path d="M6.5 3.5h7l4.5 4.5V20.5h-11.5z"/><path d="M13.5 3.5V8H18"/>',
    edit:      '<path d="M4 20h4L18 10l-4-4L4 16v4z"/><path d="M14 6l4 4"/>',
    print:     '<path d="M7 8V3.5h10V8"/><path d="M6 17.5H4.5V10a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v7.5H18"/><path d="M7 14h10v6.5H7z"/>',
    download:  '<path d="M12 3.5v11"/><path d="M7.5 10.5L12 15l4.5-4.5"/><path d="M4.5 20h15"/>',
    share:     '<path d="M12 15V3.5"/><path d="M7.5 8L12 3.5 16.5 8"/><path d="M4.5 13.5V20h15v-6.5"/>',
    delete:    '<path d="M4 7h16"/><path d="M9.5 7V4.5h5V7"/><path d="M6.5 7l1 13h9l1-13"/>',
    copy:      '<path d="M8.5 8.5h11v11h-11z"/><path d="M15.5 8.5V4.5h-11v11h4"/>',
    // ── باقی ایکشن (اسی طرز پر) ──
    duplicate: '<path d="M8.5 8.5h11v11h-11z"/><path d="M15.5 8.5V4.5h-11v11h4"/><path d="M14 11.5v5"/><path d="M11.5 14h5"/>',
    cut:       '<circle cx="6.5" cy="17.5" r="2.6"/><circle cx="17.5" cy="17.5" r="2.6"/><path d="M8.4 15.6L18.5 4"/><path d="M15.6 15.6L5.5 4"/>',
    paste:     '<path d="M9 3.5h6v3H9z"/><path d="M9 5H5.5v15.5h13V5H15"/><path d="M12 10v6.5"/><path d="M9.3 13.8L12 16.5l2.7-2.7"/>',
    save:      '<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v6h7V4"/><path d="M8 20v-6h8v6"/>',
    view:      '<path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
    close:     '<path d="M6 6l12 12"/><path d="M18 6L6 18"/>',
    add:       '<path d="M12 5v14"/><path d="M5 12h14"/>',
    search:    '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
    back:      '<path d="M14 6l6 6-6 6"/><path d="M20 12H4"/>',
    forward:   '<path d="M10 6l-6 6 6 6"/><path d="M4 12h16"/>',
    home:      '<path d="M4 10.5L12 4l8 6.5V20H4z"/><path d="M9.5 20v-6h5v6"/>',
    upload:    '<path d="M7.5 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18.4 11a3.75 3.75 0 0 1-.4 7.5"/><path d="M12 20.5V12"/><path d="M9 15l3-3 3 3"/>',
    camera:    '<path d="M3.5 8h3.2l1.6-2.4h7.4L17.3 8h3.2v11.5h-17z"/><circle cx="12" cy="13.5" r="3.6"/>',
    location:  '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    mic:       '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',
    reminder:  '<path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 14 6.5 10z"/><path d="M10.2 19a2 2 0 0 0 3.6 0"/>',
    // ── نظام کے دوسرے بٹن ──
    more:      '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
    dropdown:  '<path d="M6.5 9.5l5.5 5.5 5.5-5.5"/>',
    up:        '<path d="M6.5 14.5L12 9l5.5 5.5"/>',
    down:      '<path d="M6.5 9.5l5.5 5.5 5.5-5.5"/>',
    next:      '<path d="M14.5 6.5L9 12l5.5 5.5"/>',
    prev:      '<path d="M9.5 6.5L15 12l-5.5 5.5"/>',
    keys:      '<rect x="2.5" y="6" width="19" height="12" rx="2"/><path d="M6 9.5h.01M9 9.5h.01M12 9.5h.01M15 9.5h.01M18 9.5h.01M6 12.5h.01M18 12.5h.01M8.5 15h7"/><path d="M9 12.5h6"/>',
    theme:     '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9.5" r="1.1"/><circle cx="14.5" cy="9" r="1.1"/><circle cx="16" cy="14" r="1.1"/><path d="M12 21a3 3 0 0 0 3-3 2 2 0 0 1 2-2h1"/>',
    logout:    '<path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4"/><path d="M10 16l-4-4 4-4M6 12h10"/>',
    split:     '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M12 4v16"/>',
    folder:    '<path d="M3.5 7.5h6l2 2.5h9V19a1.5 1.5 0 0 1-1.5 1.5h-14A1.5 1.5 0 0 1 3.5 19z"/>',
    doc:       '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/>',
    list:      '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    check:     '<path d="M4.5 12.5l5 5 10-11"/>',
    refresh:   '<path d="M20 11a8 8 0 1 0-.6 4"/><path d="M20 4.5V11h-6.5"/>',
    calendar:  '<rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    lock:      '<path d="M5.5 11h13v9.5h-13z"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3"/>',
    unlock:    '<path d="M5.5 11h13v9.5h-13z"/><path d="M8.5 11V8a3.5 3.5 0 0 1 6.4-2"/>',
    user:      '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5a7.5 7.5 0 0 1 15 0"/>',
    alert:     '<path d="M12 4L3 19.5h18z"/><path d="M12 10v4.5"/><path d="M12 17.2h.01"/>',
    info:      '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5"/><path d="M12 7.8h.01"/>',
    settings:  '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
    link:      '<path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/>',
    form:      '<path d="M4.5 4h15v16h-15z"/><path d="M8 9h8"/><path d="M8 12.5h8"/><path d="M8 16h5"/>',
    stop:      '<rect x="7.5" y="7.5" width="9" height="9" rx="1.5" fill="#000"/>',
    mail:      '<rect x="3" y="5.5" width="18" height="13" rx="1.5"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/>',
    reject:    '<circle cx="12" cy="12" r="8.5"/><path d="M9 9l6 6M15 9l-6 6"/>',
    rename:    '<rect x="3" y="7" width="13" height="10" rx="1.5"/><path d="M19 5v14M17 5h4M17 19h4"/><path d="M6.5 12h6"/>',
    reply:     '<path d="M4.5 4h15v12H8l-3.5 3.5z"/><path d="M8.5 8.5h7M8.5 11.5h4.5"/>',
    restore:   '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4.5V9h4.5"/>',
    signature: '<path d="M3.5 17c2.5-6 5-9.5 6.5-9.5 2.5 0-1.5 9.5 1 9.5 1.5 0 2.5-3 4-3s1 2.5 2.5 2.5c1 0 2-1 3-1.5"/><path d="M3.5 20.5h17"/>',
    // ── ایڈیٹر کی فارمیٹنگ (ہر ایڈیٹر میں ایک جیسی) ──
    bold:      '<path d="M7 4.5h6a3.75 3.75 0 0 1 0 7.5H7z"/><path d="M7 12h7a4 4 0 0 1 0 8H7z"/>',
    italic:    '<path d="M10 4.5h8M6 19.5h8M15 4.5L9 19.5"/>',
    underline: '<path d="M7 4v7a5 5 0 0 0 10 0V4"/><path d="M5 20.5h14"/>',
    strike:    '<path d="M4 12h16"/><path d="M16.5 6.5C16 5 14.3 4 12 4 9.2 4 7.5 5.4 7.5 7.4c0 1.6 1 2.6 2.7 3.3"/><path d="M8 16.8c.6 1.8 2.3 3.2 4.6 3.2 2.8 0 4.4-1.5 4.4-3.5 0-1-.4-1.8-1.1-2.5"/>',
    undo:      '<path d="M9 14L4.5 9.5 9 5"/><path d="M4.5 9.5H14a5.5 5.5 0 0 1 0 11h-3"/>',
    redo:      '<path d="M15 14l4.5-4.5L15 5"/><path d="M19.5 9.5H10a5.5 5.5 0 0 0 0 11h3"/>',
    'align-right':  '<path d="M4 5.5h16M9 10h11M4 14.5h16M9 19h11"/>',
    'align-center': '<path d="M4 5.5h16M7 10h10M4 14.5h16M7 19h10"/>',
    'align-left':   '<path d="M4 5.5h16M4 10h11M4 14.5h16M4 19h11"/>',
    justify:   '<path d="M4 5.5h16M4 10h16M4 14.5h16M4 19h16"/>',
    'font-up':   '<path d="M3 19L8 5.5 13 19"/><path d="M4.8 14.5h6.4"/><path d="M18 8v8M14 12h8"/>',
    'font-down': '<path d="M3 19L8 5.5 13 19"/><path d="M4.8 14.5h6.4"/><path d="M14 12h8"/>',
    numbers:   '<path d="M10 6h10M10 12h10M10 18h10"/><path d="M4.5 4.5h1.2v4"/><path d="M4 16h2.4L4 19.5h2.6"/>',
    bullets:   '<path d="M10 6h10M10 12h10M10 18h10"/><circle cx="5" cy="6" r="1.1"/><circle cx="5" cy="12" r="1.1"/><circle cx="5" cy="18" r="1.1"/>',
    painter:   '<rect x="4" y="3.5" width="13" height="5.5" rx="1"/><path d="M17 6.2h2.5v5H11.5v3"/><path d="M10 14.2h3v6.3h-3z"/>',
    'clear-format': '<path d="M5 5.5h11M10.5 5.5L8 19"/><path d="M14.5 14.5l5 5M19.5 14.5l-5 5"/>',
    'find-replace': '<circle cx="9.5" cy="9.5" r="5.5"/><path d="M13.5 13.5l3 3"/><path d="M15.5 20.5h5M18.5 18.5l2 2-2 2"/>',
    rtl:       '<path d="M10 4.5h6.5M13 4.5V14M16 4.5V14"/><path d="M10 4.5a3 3 0 0 0 0 6h3"/><path d="M20 19H5M8 16.5L5 19l3 2.5"/>',
    ltr:       '<path d="M8 4.5h6.5M11 4.5V14M14 4.5V14"/><path d="M8 4.5a3 3 0 0 0 0 6h3"/><path d="M4 19h15M16 16.5l3 2.5-3 2.5"/>',
    indent:    '<path d="M4 5.5h16M10 10h10M10 14.5h10M4 19h16"/><path d="M4 9.5l3 2.75-3 2.75"/>',
    outdent:   '<path d="M4 5.5h16M10 10h10M10 14.5h10M4 19h16"/><path d="M7 9.5l-3 2.75 3 2.75"/>',
    table:     '<rect x="3.5" y="4.5" width="17" height="15" rx="1"/><path d="M3.5 9.5h17M3.5 14.5h17M9.2 4.5v15M14.8 4.5v15"/>',
    'change-case': '<path d="M3 18L7 6.5 11 18"/><path d="M4.4 14h5.2"/><circle cx="16.5" cy="15" r="3"/><path d="M19.5 12v6"/>',
    subscript: '<path d="M4 6l8 10M12 6l-8 10"/><path d="M15.5 16.5a2 2 0 1 1 3.4 1.4l-3.4 2.6h4"/>',
    superscript: '<path d="M4 8l8 10M12 8l-8 10"/><path d="M15.5 6.5a2 2 0 1 1 3.4 1.4l-3.4 2.6h4"/>',
    paragraph: '<path d="M10 4.5v15M15 4.5v15"/><path d="M18 4.5h-8.5a4 4 0 0 0 0 8H10"/>',
    border:    '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M8 8h8v8H8z" stroke-dasharray="1.5 2"/>',
    styles:    '<path d="M4 6.5h16M4 11.5h10M4 16.5h13"/>',
    // ── نقشہ موقع کے ڈرائنگ اوزار ──
    pointer:   '<path d="M5.5 3.5l13 7.5-6 1.4-2.6 5.8z"/>',
    pan:       '<path d="M8 12V6a1.5 1.5 0 0 1 3 0v5M11 11V4.5a1.5 1.5 0 0 1 3 0V11M14 11V6a1.5 1.5 0 0 1 3 0v6.5"/><path d="M8 12V9.5a1.5 1.5 0 0 0-3 0v3.5c0 4 3 7.5 7 7.5s5-3 5-7"/>',
    pen:       '<path d="M15.5 4.5l4 4L8.5 19.5h-4v-4z"/><path d="M13.5 6.5l4 4"/>',
    line:      '<path d="M5 19L19 5"/>',
    arrow:     '<path d="M4.5 12h14.5M14 7l5 5-5 5"/>',
    rect:      '<rect x="4" y="6" width="16" height="12" rx="1"/>',
    circle:    '<circle cx="12" cy="12" r="8"/>',
    text:      '<path d="M5 6.5V4.5h14v2M12 4.5v15M9 19.5h6"/>',
    ruler:     '<path d="M3.5 15.5L15.5 3.5l5 5-12 12z"/><path d="M7.5 11.5l2 2M10.5 8.5l2 2M13.5 5.5l2 2"/>',
    symbols:   '<path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z"/><path d="M12 8.5l1.1 2.3 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z"/>',
    mark:      '<circle cx="12" cy="12" r="8.5"/><path d="M10.5 9l2-1.5V16.5"/><path d="M10 16.5h5"/>',
    image:     '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><circle cx="9" cy="9.5" r="1.8"/><path d="M20.5 16l-5-5-9 8.5"/>',
    'image-swap': '<rect x="3.5" y="4.5" width="12" height="10" rx="1.2"/><path d="M3.5 12l3.5-3.5 4 4"/><path d="M19 10v6.5a3 3 0 0 1-3 3h-5"/><path d="M13 17.5l-2 2 2 2"/>',
    crop:      '<path d="M6.5 3v14.5H21"/><path d="M3 6.5h14.5V21"/>',
    'bring-forward': '<rect x="9" y="9" width="11" height="11" rx="1"/><path d="M15 6V4H4v11h2"/><path d="M14.5 17.5v-5M12 15l2.5-2.5L17 15"/>',
    'send-backward': '<rect x="4" y="4" width="11" height="11" rx="1"/><path d="M18 9h2v11H9v-2"/><path d="M9.5 7v5M7 9.5L9.5 12 12 9.5"/>',
    'flip-h':  '<path d="M12 3.5v17"/><path d="M9 7L4 17h5z"/><path d="M15 7l5 10h-5z"/>',
    'flip-v':  '<path d="M3.5 12h17"/><path d="M7 9l10-5v5z"/><path d="M7 15l10 5v-5z"/>',
    'rotate-left':  '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4.5V9h4.5"/>',
    'rotate-right': '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4.5V9h-4.5"/>',
    'zoom-in':  '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M8.5 11h5M11 8.5v5"/>',
    'zoom-out': '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5M8.5 11h5"/>',
    'zoom-reset': '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M8 9.5l1.5-1v7M14.5 9.5l1.5-1v7M12 11h.01M12 14h.01"/>',
    'fit-page':  '<path d="M6 3.5h12v17H6z"/><path d="M12 7v9M9.5 13.5L12 16l2.5-2.5"/>'
  };

  // ایک کام = ایک نام (بٹن اور اشارہ)
  var LABEL = {
    print: 'پرنٹ', download: 'ڈاؤن لوڈ', share: 'شیئر', copy: 'کاپی', cut: 'کاٹیں', paste: 'چسپاں', duplicate: 'ڈپلیکیٹ',
    edit: 'ترمیم', delete: 'حذف', save: 'محفوظ کریں', view: 'دیکھیں', open: 'کھولیں', close: 'بند کریں', add: 'درج کریں',
    search: 'تلاش', back: 'واپس', forward: 'آگے', home: 'ہوم', upload: 'اپ لوڈ', camera: 'کیمرہ', location: 'مقام',
    mic: 'آواز سے لکھیں', reminder: 'یاددہانی', cancel: 'منسوخ', undo: 'کالعدم', redo: 'دوبارہ', rename: 'نام بدلیں', reject: 'مسترد کریں'
  };

  function svg(name) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="1.9" ' +
      'stroke-linecap="round" stroke-linejoin="round">' + (I[name] || '') + '</svg>';
  }
  function url(name) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg(name)).replace(/'/g, '%27') + '")'; }

  // ── CSS: ہر نشان ایک بار (پورے صفحے کے لیے) ──
  function inject(doc) {
    doc = doc || document;
    if (!doc || doc.getElementById('dio-icons-css')) return;
    var css = '.dio-i{display:inline-block;flex:none;width:1.15em;height:1.15em;font-style:normal;line-height:1;vertical-align:-0.2em;' +
      'background-color:transparent;-webkit-mask:var(--dio-i) center/100% 100% no-repeat;mask:var(--dio-i) center/100% 100% no-repeat;' +
      'pointer-events:none;speak:never;}' +
      '@media print{.dio-i{print-color-adjust:exact;-webkit-print-color-adjust:exact;}}';
    Object.keys(I).forEach(function (k) { css += '.dio-i[data-ico="' + k + '"]{--dio-i:' + url(k) + ';background-color:currentColor;}'; });
    var st = doc.createElement('style');
    st.id = 'dio-icons-css';
    st.textContent = css;
    (doc.head || doc.documentElement).appendChild(st);
  }

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }

  // <i class="dio-i" data-ico="print" aria-hidden="true"></i>
  function dioIco(name) { return '<i class="dio-i" data-ico="' + esc(name) + '" aria-hidden="true"></i>'; }

  /* مشترکہ بٹن — dioBtn(kind, onclickJs, opts)
     opts.label  : دکھنے والا نام (نہ ہو تو صرف نشان — نام اشارے میں)
     opts.title  : اشارہ (نہ ہو تو اسی کام کا معیاری نام؛ کلید جیسے «(Ctrl+P)» opts.key سے)
     opts.tone   : 'pri' (گہرا نیلا — «+ … درج کریں» / کارڈ کا آخری «محفوظ کریں») | 'danger' (کارڈ کا آخری «حذف کریں»)
     opts.id / opts.attrs / opts.cls : اضافی
     js: onclick کا کوڈ — پہلے سے attribute کے لیے محفوظ (escape شدہ)، جیسے پورے نظام میں ہوتا ہے؛ یہاں دوبارہ نہیں بدلا جاتا */
  function dioBtn(kind, js, opts) {
    opts = opts || {};
    var lab = opts.label === undefined ? null : opts.label;
    var std = LABEL[kind] || '';
    var title = opts.title || ((lab || std) + (opts.key ? ' (' + opts.key + ')' : ''));
    var cls = 'dio-btn' + (lab ? '' : ' dio-btn--i') + (kind === 'delete' ? ' dio-btn--del' : '') +
      (opts.tone === 'pri' ? ' dio-btn--pri' : opts.tone === 'danger' ? ' dio-btn--danger' : '') + (opts.cls ? ' ' + opts.cls : '');
    var ico = I[kind] ? dioIco(kind) : (opts.ico && I[opts.ico] ? dioIco(opts.ico) : '');
    return '<button type="button" class="' + cls + '" data-act="' + esc(kind) + '"' + (opts.id ? ' id="' + esc(opts.id) + '"' : '') +
      ' title="' + esc(title) + '" aria-label="' + esc(title) + '"' + (js ? ' onclick="' + js + '"' : '') + (opts.attrs ? ' ' + opts.attrs : '') + '>' +
      ico + (lab ? '<span>' + esc(lab) + '</span>' : '') + '</button>';
  }

  /* بٹن کا نام بدلیں مگر نشان رہنے دیں — «محفوظ ہو رہا ہے…» اور پھر واپس «محفوظ کریں»
     (textContent / innerHTML سے پورا بٹن مٹ جاتا تھا: نشان غائب، کہیں پرانا 💾 یا انگریزی نام لوٹ آتا) */
  function dioBtnText(b, t) {
    if (!b) return;
    var s = null, k = b.children || [];
    for (var i = 0; i < k.length; i++) if (k[i].tagName === 'SPAN') { s = k[i]; break; }
    if (s) { s.textContent = t; return; }
    if (b.querySelector && b.querySelector('.dio-i') && typeof document !== 'undefined') {
      s = document.createElement('span'); s.textContent = t; b.appendChild(s); return;
    }
    b.textContent = t;
  }

  var W = typeof window !== 'undefined' ? window : {};
  W.DIO_ICONS = I;
  W.DIO_ACT_LABEL = LABEL;
  W.dioIco = dioIco;
  W.dioBtn = dioBtn;
  W.dioIconsInject = inject;
  W.dioIconSvg = svg;
  W.dioBtnText = dioBtnText;
  if (typeof document !== 'undefined') inject(document);
  /* global module */
  if (typeof module !== 'undefined' && module.exports) module.exports = { DIO_ICONS: I, DIO_ACT_LABEL: LABEL, dioBtn: dioBtn, dioIco: dioIco, dioBtnText: dioBtnText, svg: svg };
})();
