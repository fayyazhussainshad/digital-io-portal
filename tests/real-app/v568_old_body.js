// v568 جانچ: ستمبر 2026 (17 ستمبر سے پہلے) کی پرانی بیرونی ضمنی کا خاکہ — commit 2b3ef1c کا _zimniDefaultBody جوں کا توں (صرف نام بدلا)
window.__oldZimniBody = function(o, c) {
  o = o || {}; c = c || {};
  const z = _zimniActive || {};
  const E = (v) => (typeof esc === 'function') ? esc(v == null ? '' : String(v)) : (v == null ? '' : String(v));
  const D = (v) => v ? ((typeof formatDate === 'function') ? formatDate(v) : v) : '';
  const year = new Date().getFullYear();
  const io = (typeof getIOSignLine === 'function') ? getIOSignLine()
           : ((o.full_name || '') + (o.designation ? ' ' + o.designation : '') + (o.station ? ' تھانہ ' + o.station : ''));
  // ── Auto-fetch (case + officer record se) ──
  const district = E(o.district || '');
  const thana    = E(o.station || '');
  const firNo    = E(c.fir_number || '');
  const firDate  = E(D(c.fir_date || ''));
  const wDate    = E(D(c.occurrence_date || ''));                                     // وقوعہ کی تاریخ
  const wPlace   = E(c.place_of_occurrence || c.jaye_waqoia || ''); // مقام وقوعہ — occurrence_place ہٹا دیا (اب صرف "بحد" خانے میں آتا ہے)
  const behad    = E(c.behad || c.occurrence_place || c.distance || c.samt || ''); // بحد — نئے فارم کی "بحد" فیلڈ (occurrence_place) سے
  const compl    = E(c.complainant_name || c.complainant || '');
  const serial   = E(z.serial_no || '');
  const ioE      = E(io);
  // جرم — دفعات اور "ت پ" الگ الگ (ت پ بائیں کنارے پر)
  let jBody = ((c.section_of_law || '') + ' ' + (c.offence_type || '')).trim();
  let jSuf  = 'ت پ';
  try {
    if (typeof _ch173JurmParts === 'function') {
      const jp = _ch173JurmParts(c.section_of_law);
      jBody = jp.body; jSuf = jp.suffix;
    }
  } catch (_) { /* پرانا کوڈ: اختیاری */ }

  return `
  <div class="zf-head">
    <div class="zf-formno">پولیس فارم نمبر&nbsp;25—54(1)</div>
    <div class="zf-titlerow">
      <span class="zf-zila" data-k="zila">ضلع ${district}</span>
      <span class="zf-title">رپورٹ ضمنی بیرونی</span>
    </div>
  </div>

  <div class="zf-meta">
    <div class="zf-r1">
      <span class="zf-fld"><span class="zf-lbl">تھانہ۔</span><span class="zf-ln" data-k="thana">${thana}</span></span>
      <span class="zf-fld"><span class="zf-lbl">سال</span><span class="zf-ln zf-nw" data-k="saal">${year}</span></span>
      <span class="zf-fld"><span class="zf-lbl">ضمنی نمبر</span><span class="zf-ln zf-nw" data-k="zno">${serial}</span></span>
    </div>

    <div class="zf-mid">
      <!-- دائیں : مقدمہ نمبر / مورخہ — اور نیچے وقوعہ (تاریخ اوپر والی مورخہ کی سیدھ میں) -->
      <div class="zf-gR">
        <span class="zf-lbl">مقدمہ نمبر</span>
        <span class="zf-ln zf-nw" data-k="fir">${firNo}</span>
        <span class="zf-lbl">مورخہ</span>
        <span class="zf-ln zf-nw" data-k="fdate">${firDate}</span>

        <span class="zf-lbl">تاریخ و مقام وقوعہ۔</span>
        <span class="zf-ln zf-span2" data-k="wplace">${wPlace}</span>
        <span class="zf-ln zf-nw" data-k="wdate">${wDate}</span>
      </div>
      <!-- بائیں : تھانہ میں پہنچنے / تھانہ سے روانگی -->
      <div class="zf-gL">
        <span class="zf-lbl">تھانہ میں پہنچنے کا وقت و تاریخ</span>
        <span class="zf-ln" data-k="arrival"></span>
        <span class="zf-lbl">تھانہ سے روانگی کا وقت و تاریخ</span>
        <span class="zf-ln" data-k="depart"></span>
      </div>
    </div>

    <div class="zf-mrow">
      <span class="zf-fld"><span class="zf-lbl">بحد۔</span><span class="zf-ln" data-k="behad">${behad}</span></span>
      <span class="zf-jurm"><span class="zf-lbl">جرم۔</span><span class="zf-ln zf-j-body" data-k="jurm">${E(jBody)}</span><span class="zf-j-suf" data-k="jurm_suf">${E(jSuf)}</span></span>
    </div>
  </div>

  <table class="zf-tbl">
    <colgroup>
      <col style="width:14%"><col style="width:7%"><col style="width:55%"><col style="width:24%">
    </colgroup>
    <thead>
      <tr>
        <th class="zf-c-action">تاریخ و وقت<br>کارروائی</th>
        <th class="zf-c-serial"><div class="zf-vert">رپورٹ نمبر شمار<br>سلسلہ وار</div></th>
        <th class="zf-c-body">حالاتِ تفتیش</th>
        <th class="zf-c-from">از۔</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="zf-c-action"><div class="zf-actbody" data-k="action" contenteditable="true"><br></div></td>
        <td class="zf-c-serial"><button class="zf-pick no-print" contenteditable="false" onclick="_zimniAccPicker(event)" title="ملزمان منتخب کریں">&#9662;</button><div class="zf-nums" contenteditable="true"><div class="zf-num">1</div></div></td>
        <td class="zf-c-body" colspan="2">
          <div class="zf-bl"><span class="zf-lbl">سرکار بذریعہ ۔</span> <span class="zf-bdyln" data-k="sarkar">${compl}</span></div>
          <div class="zf-bl zf-bl-banam"><span class="zf-lbl">بنام۔</span><span class="zf-bdyln zf-acclist" data-k="banam"></span></div>
          <div class="zf-bl zf-bl-mor"><span class="zf-lbl">مرتبہ ۔</span> <span class="zf-bdyln zf-io" data-k="murattib">${ioE}</span></div>
          <div class="zf-body" data-mic="true" data-k="halaat">جناب عالیٰ! بحوالہ رپورٹ </div>
          <!-- اختتام — تحریر جہاں بھی ختم ہو (کسی بھی صفحے پر) اس کے نیچے آتا ہے -->
          <div class="zf-close" data-k="close">رپورٹ ضمنی مرتب ہو کرارسال خدمت ہے</div>
          <div class="zf-signblk" style="text-align:left !important;">
            <div class="zf-gap"><br></div>
            <div class="zf-gap"><br></div>
            <div class="zf-sign" data-k="io_sign" style="text-align:left !important;display:block;text-decoration:none;">${ioE}</div>
            <div class="zf-signdate" data-k="io_date" style="text-align:left !important;display:block;">${E(_zimniToday())}</div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>`;
}
