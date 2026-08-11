/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — مقدمہ کی دستاویزات کے ٹیمپلیٹ
   (پہلے یہ سب cases.js میں تھا — وہ فائل بہت بڑی ہو گئی تھی،
    اسی لیے کئی بار غلط جگہ تبدیلی ہو جاتی تھی۔)
   ═══════════════════════════════════════════════════════════ */

function renderDocChecklist(docs, selected) {
  let html = '';
  for (const [cat, items] of Object.entries(MISAL_CHECKLIST)) {
    const filtered = docs.filter(d => items.includes(d));
    if (!filtered.length) continue;
    html += `<div style="font-size:9px;color:var(--text-faint);letter-spacing:2px;text-transform:uppercase;padding:6px 0 4px;">${cat}</div>`;
    filtered.forEach(doc => {
      const checked = selected.includes(doc);
      html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:4px;cursor:pointer;transition:background 0.1s;" onmouseenter="this.style.background='var(--hover-bg)'" onmouseleave="this.style.background=''" onclick="toggleDoc('${doc.replace(/'/g,"\\'")}',this)">
        <input type="checkbox" ${checked?'checked':''} style="accent-color:var(--accent);width:14px;height:14px;pointer-events:none;">
        <span style="font-size:12px;color:${checked?'var(--accent)':'var(--text-secondary)'};">${doc}</span>
      </div>`;
    });
  }
  // Custom documents
  const customDocs = selected.filter(d => !ALL_MISAL_DOCS.includes(d));
  if (customDocs.length) {
    html += `<div style="font-size:9px;color:var(--text-faint);letter-spacing:2px;text-transform:uppercase;padding:6px 0 4px;">Custom Documents</div>`;
    customDocs.forEach(doc => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:4px;cursor:pointer;" onclick="toggleDoc('${doc.replace(/'/g,"\\'")}',this)">
        <input type="checkbox" checked style="accent-color:var(--accent);width:14px;height:14px;pointer-events:none;">
        <span style="font-size:12px;color:var(--accent);">${doc}</span>
        <span onclick="event.stopPropagation();removeCustomDoc('${doc.replace(/'/g,"\\'")}');" style="margin-inline-start:auto;color:var(--red);font-size:12px;cursor:pointer;">×</span>
      </div>`;
    });
  }
  return html;
}


function openDocEditor(docIndex) {
  currentDocIndex = docIndex;
  const c = window._workspaceCase;
  const docs = window._workspaceDocs;
  const docName = docs[docIndex];
  const draftKey = currentCaseId + '_' + docIndex;
  const savedContent = docDrafts[draftKey] || null;

  // Update sidebar active state
  document.querySelectorAll('.doc-card').forEach(el => el.classList.remove('active'));
  const activeCard = document.getElementById('doc-card-' + docIndex);
  if (activeCard) activeCard.classList.add('active');

  const editor = document.getElementById('workspace-editor-area');
  if (!editor) return;

  // Build auto-filled template
  const template = buildDocTemplate(docName, c, savedContent);

  editor.innerHTML = `
    <!-- Toolbar -->
    <div class="template-toolbar">
      <span style="font-size:13px;font-weight:700;color:var(--accent);flex:1;">📄 ${docName}</span>
      <select id="font-family-sel" onchange="changeFont(this.value)" style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;padding:4px 8px;color:var(--text-secondary);font-size:11px;">
        <option value="jameel" selected>Jameel Noori Nastaleeq</option>
        <option value="noto">Noto Nastaliq Urdu</option>
        <option value="times">Times New Roman</option>
        <option value="arial">Arial</option>
      </select>
      <select id="font-size-sel" onchange="changeFontSize(this.value)" style="background:var(--bg-card);border:1px solid var(--border);border-radius:4px;padding:4px 8px;color:var(--text-secondary);font-size:11px;">
        <option value="12">12px</option>
        <option value="14" selected>14px</option>
        <option value="16">16px</option>
        <option value="18">18px</option>
        <option value="20">20px</option>
        <option value="22">22px</option>
      </select>
      <button class="btn btn-secondary btn-sm" onclick="toggleDirection()">⇄ LTR/RTL</button>
      <button class="btn btn-secondary btn-sm" onclick="saveDocDraft(${docIndex})">💾 Save Draft</button>
      <button class="btn btn-secondary btn-sm" onclick="printThisDoc('${docName}')">🖨️ Print</button>
      <button class="btn btn-primary btn-sm" onclick="markDocDone(${docIndex})">✅ Mark Complete</button>
    </div>
    <!-- Editor -->
    <div style="padding:24px;background:var(--bg-tertiary);min-height:calc(100% - 50px);">
      <div id="doc-template-editor" class="template-editor" contenteditable="true" dir="rtl" spellcheck="false" style="font-size:14px;min-height:600px;">
        ${template}
      </div>
    </div>`;
}


function buildDocTemplate(docName, c, savedContent) {
  if (savedContent) return savedContent;

  // Auto-fill values
  const fir = c.fir_number || '____________';
  const firDate = c.fir_date || '____________';
  const occurrence = c.occurrence_date || '____________';
  const complainant = c.complainant || '____________';
  const compCnic = c.complainant_cnic || '____________';
  const compCell = c.complainant_cell || '____________';
  const compProfession = c.complainant_profession || '____________';
  const section = c.section_of_law || '____________';
  const offence = c.offence_type || '____________';
  const sho = c.sho || '____________';
  const sdpo = c.sdpo || '____________';
  const firWriter = c.fir_writer || '____________';
  const station = currentOfficer?.station || '____________';
  const district = currentOfficer?.district || '____________';
  const io = currentOfficer?.full_name || '____________';
  const year = new Date().getFullYear();

  const field = (val) => `<span class="template-field" contenteditable="true">${val}</span>`;

  // Generic template — specific templates will be added when sample files are provided
  const ts = 'border:1px solid #333;padding:6px 8px;';
  const th = 'border:1px solid #333;padding:6px 8px;background:#f0f0f0;font-weight:700;text-align:center;';
  const td = 'border:1px solid #333;padding:6px 8px;';
  const tdr = 'border:1px solid #333;padding:6px 8px;text-align:right;';
  const wrap = 'font-family:\'Jameel Noori Nastaleeq\',\'Noto Nastaliq Urdu\',serif;direction:rtl;font-size:14px;line-height:2;color:#000;';
  const etd = (v) => `<td style="${td}"><span class="template-field" contenteditable="true">${v}</span></td>`;
  const etdr = (v) => `<td style="${tdr}"><span class="template-field" contenteditable="true">${v}</span></td>`;
  const ef = (v) => `<span class="template-field" contenteditable="true">${v}</span>`;

  const templates = {

    // ══════════════════════════════════════════════
    //  1. CDR FORM
    // ══════════════════════════════════════════════
    'CDR Form': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="${td}width:33%;font-weight:700;">تھانہ ${ef(station)}</td>
          <td style="${td}text-align:center;">ڈائری نمبر ${ef('۔۔۔۔۔۔')} مورخہ ${ef('۔۔۔۔۔۔')}</td>
          <td style="${td}width:33%;text-align:left;font-weight:700;">ضلع ${ef(district)}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="${td}" colspan="3">مقدمہ نمبر ${ef(fir)} مورخہ ${ef(firDate)} بجرم ${ef(section)} ت پ تھانہ ${ef(station)} ${ef(district)}</td>
        </tr>
        <tr>
          <td style="${td}width:50%;">تاریخ/وقت وقوعہ: ${ef(occurrence)}</td>
          <td style="${td}">مقام وقوعہ: ${ef('۔۔۔۔۔۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">تفتیشی افسر: ${ef(io)}</td>
          <td style="${td}">موبائل نمبر: ${ef('۔۔۔۔۔۔۔۔۔۔۔')}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;font-size:13px;">
        <tr>
          <td style="${th}width:8%;">نمبرشمار</td>
          <td style="${th}width:28%;">مطلوبہ درکار CDR/IMEI</td>
          <td style="${th}width:22%;">ماڈل فون (اگر معلوم ہو)</td>
          <td style="${th}width:21%;">ڈیٹا کی ابتدائی تاریخ</td>
          <td style="${th}width:21%;">ڈیٹا کی آخری تاریخ</td>
        </tr>
        ${[1,2,3,4,5,6,7,8,9].map(n=>`<tr>
          <td style="${td}text-align:center;">${n}</td>
          <td style="${td}height:28px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>`).join('')}
        <tr>
          <td style="${th}">ٹوٹل تعداد</td>
          <td style="${th}">تعداد سم نمبرز</td>
          <td style="${th}">موبائل سیٹ نمبرز</td>
          <td style="${th}">سم لوکیشن: YES</td>
          <td style="${th}">سم ملکیت: YES</td>
        </tr>
        <tr>
          <td style="${td}" colspan="3"></td>
          <td style="${td}" colspan="2" class="template-field" contenteditable="true">اس کیلئے یہی فارم علیحدہ سے بمعہ FIR لف کریں</td>
        </tr>
        <tr>
          <td style="${td}font-weight:700;" colspan="5">دستخط درخواست کنندہ/تفتیشی آفیسر معہ تاریخ: ${ef(io)}</td>
        </tr>
      </table>
      <div style="margin-top:10px;font-size:12px;line-height:2;">
        <div style="font-weight:700;">نوٹ:</div>
        <div>1۔ موبائل فون کال ڈیٹا ریکارڈ صرف FIR یا FIR سے متعلقہ ہونے کی صورت میں فراہم کیا جائے گا یا ایسی انکوائریز جنکا حکم نامہ ہائی کورٹ اور سپریم کورٹ نے دیا ہوں۔</div>
        <div>2۔ اگر CDR's/IMEI's کا اندراج FIR میں نہ ہو تو ضمنی میں اندراج کریں۔</div>
        <div>3۔ ضمنی نمبر ${ef('۔۔۔۔۔')} تاریخ ${ef('۔۔۔۔۔')} مرتبہ ${ef('۔۔۔۔۔')} (کاپی ضمنی ہمراہ بھجوائیں یا فارم ہذا کی پشت پر اقتباس ضمنی تحریر کریں)</div>
        <div>4۔ CDR کے غلط استعمال کی صورت میں ذمہ دار افسر کے خلاف سخت محکمانہ کاروائی کی جائیگی۔</div>
        <div>5۔ CDR کے ذریعے کیس ٹریس ہونے/ملزمان/اشتہاری پکڑے جانے پر/ریکوری ہونے پر IT آفس (موبائل ٹریکنگ سیل ملتان) کو بھی رپورٹ ارسال کی جائے۔</div>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="${td}width:50%;text-align:center;padding:20px 8px 8px;">
            <div>Forwarded Please</div>
            <div style="font-weight:700;">${ef((typeof getSHOSignLine==='function') ? getSHOSignLine(station) : '')}</div>
            <div style="font-size:11pt;">${ef(formatDate(new Date()))}</div>
          </td>
          <td style="${td}text-align:center;padding:20px 8px 8px;">
            <div>Forwarded</div>
            <div style="font-weight:700;">سرکل DSP/SDPO ${ef(sdpo)}</div>
          </td>
        </tr>
      </table>
    </div>`,

    // ══════════════════════════════════════════════
    //  2. CRO FORM
    // ══════════════════════════════════════════════
    'CRO Form': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
        <tr>
          <td style="padding:4px 8px;text-align:left;font-size:12px;">طرف الف</td>
          <td style="padding:4px 8px;text-align:center;font-size:16px;font-weight:900;">سٹینڈرڈائیزڈ کریمینل انڈکس کارڈ</td>
          <td style="padding:4px 8px;font-size:12px;">CRO نمبر ${ef('۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:2px 8px;text-align:center;font-size:13px;">(برائے جیل)</td>
          <td style="padding:2px 8px;font-size:12px;">فوٹو گراف تاریخ ${ef('۔۔۔۔۔')}</td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="${td}width:12%;">ساتھ مل</td>
          <td style="${td}width:15%;">ساتھ پیہ<br><small>یاں پیاں کریں</small></td>
          <td style="${td}width:18%;">ماں رشتہ پیہ<br><small>یاں پیاں کریں</small></td>
          <td style="${td}width:18%;">ماں رشتہ پیہ<br><small>یاں پیاں کریں</small></td>
          <td rowspan="2" style="${td}width:20%;text-align:center;vertical-align:middle;">
            <div style="border:1px dashed #999;height:90px;width:70px;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;">تصویر</div>
          </td>
          <td rowspan="2" style="${td}width:17%;text-align:center;vertical-align:middle;">
            <div style="border:1px dashed #999;height:90px;width:70px;margin:0 auto;display:flex;align-items:center;justify-content:center;font-size:11px;">تصویر</div>
          </td>
        </tr>
        <tr>
          <td style="${td}height:50px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>
      </table>
      <div style="margin:6px 0;font-size:12px;border:1px solid #333;padding:4px 8px;">متعلقہ رانی پولیس اسٹیشن ${ef(station)}</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="${th}width:10%;">نام</td>
          <td style="${td}width:25%;">${ef('۔۔۔۔۔۔۔۔۔۔')}</td>
          <td style="${th}width:8%;">عرف</td>
          <td style="${td}width:20%;">${ef('۔۔۔۔۔')}</td>
          <td style="${th}width:10%;">والد/شوہر کا نام</td>
          <td style="${td}">${ef('۔۔۔۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">جنس</td>
          <td style="${td}">${ef('مرد / عورت')}</td>
          <td style="${th}">ذریعہ آمدن</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">تعلیم</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">زبان</td>
          <td style="${td}">${ef('اردو')}</td>
          <td style="${th}">ذریعہ معاش</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">قومیت</td>
          <td style="${td}">${ef('پاکستانی')}</td>
        </tr>
        <tr>
          <td style="${th}">تاریخ پیدائش</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">مقام پیدائش</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">عمر (سال)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">مستقل پتہ</td>
          <td style="${td}" colspan="5">${ef('۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">شناختی کارڈ نمبر</td>
          <td style="${td}">${ef('۔۔۔۔۔')}</td>
          <td style="${th}">والد/شوہر کا نام عرف</td>
          <td style="${td}" colspan="3">${ef('۔۔۔۔۔۔۔۔')}</td>
        </tr>
      </table>
      <div style="font-weight:700;margin:6px 0;border-bottom:1px solid #333;padding-bottom:2px;font-size:13px;">قومیت / Nationality</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <tr>
          <td style="${th}">مر صورت/مقدمہ</td>
          <td style="${td}">${ef(offence||'قتل')}</td>
          <td style="${th}">تھ</td>
          <td style="${td}">${ef(station)}</td>
        </tr>
        <tr>
          <td style="${th}">FIR نمبر بذریعہ</td>
          <td style="${td}">${ef(fir)}</td>
          <td style="${th}">مورخہ</td>
          <td style="${td}">${ef(firDate)}</td>
        </tr>
        <tr>
          <td style="${th}">دفعات</td>
          <td style="${td}" colspan="3">${ef(section)}</td>
        </tr>
        <tr>
          <td style="${th}">بال (رنگ)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
          <td style="${th}">بال (سائز)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">داڑھی (رنگت)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
          <td style="${th}">داڑھی (سائز)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">رنگ چہرہ</td>
          <td style="${td}">${ef('گورا/سانولا/کالا')}</td>
          <td style="${th}">کان</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${th}">آ نکھیں (رنگت)</td>
          <td style="${td}">${ef('۔۔۔')}</td>
          <td style="${th}">ناک</td>
          <td style="${td}">${ef('۔۔۔')}</td>
        </tr>
      </table>
      <div style="font-weight:700;margin:8px 0 4px;font-size:13px;">نشانات انگشت جمع کرانے ہونے پر سادہ و قلع قلع:</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <tr>
          <td style="${th}text-align:center;">دائیں چھوٹی</td>
          <td style="${th}text-align:center;">دائیں انگوٹھی</td>
          <td style="${th}text-align:center;">دائیں درمیانی</td>
          <td style="${th}text-align:center;">دائیں شہادت</td>
          <td style="${th}text-align:center;">دائیں انگوٹھا</td>
        </tr>
        <tr>
          <td style="${td}height:70px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>
        <tr>
          <td style="${th}text-align:center;">بائیں چھوٹی</td>
          <td style="${th}text-align:center;">بائیں انگوٹھی</td>
          <td style="${th}text-align:center;">بائیں درمیانی</td>
          <td style="${th}text-align:center;">بائیں شہادت</td>
          <td style="${th}text-align:center;">بائیں انگوٹھا</td>
        </tr>
        <tr>
          <td style="${td}height:70px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>
        <tr>
          <td style="${th}text-align:center;" colspan="2">بائیں جاراناتیاں یک وقتی</td>
          <td style="${td}" colspan="3"></td>
        </tr>
        <tr>
          <td style="${th}text-align:center;" colspan="2">دائیں جاراناتیاں یک وقتی</td>
          <td style="${td}" colspan="3"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="${td}text-align:center;padding:30px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">نام و عہدہ<br>${ef(station)}</div>
          </td>
          <td style="${td}text-align:center;padding:30px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">تفتیشی افسر ${ef(io)}</div>
          </td>
          <td style="${td}font-size:12px;">تیارکنندہ کا نام و عہدہ ${ef(io)}</td>
        </tr>
      </table>
    </div>`,

    // ══════════════════════════════════════════════
    //  3. ZIMNI ANDROONI
    // ══════════════════════════════════════════════
    'Zimni Androoni': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="padding:2px 8px;font-size:12px;">پولیس فارم نمبر 25—54(1)</td>
          <td style="padding:2px 8px;text-align:center;font-size:16px;font-weight:900;">اندرونی ضمنی</td>
          <td style="padding:2px 8px;text-align:left;"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="${td}width:50%;font-weight:700;font-size:15px;">رپورٹ ضمنی</td>
          <td style="${td}">ضلع ${ef(district)}</td>
          <td style="${td}">تھانہ ${ef(station)}</td>
        </tr>
        <tr>
          <td style="${td}">سال ${ef(new Date().getFullYear().toString())}</td>
          <td style="${td}">ضمنی نمبر ${ef('۔۔۔۔۔')}</td>
          <td style="${td}"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:4px;">
        <tr>
          <td style="${td}width:25%;">مقدمہ نمبر ${ef(fir)}</td>
          <td style="${td}width:25%;">مورخہ ${ef(firDate)}</td>
          <td style="${td}width:25%;">تھانہ میں پہنچنے کا وقت و تاریخ</td>
          <td style="${td}width:25%;">${ef('۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">تاریخ و مقام وقوعہ ${ef(occurrence)}</td>
          <td style="${td}"></td>
          <td style="${td}">تھانہ سے روانگی کا وقت و تاریخ</td>
          <td style="${td}">${ef('۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">بحد ${ef('۔۔۔۔۔')}</td>
          <td style="${td}">جرم ${ef(section)}</td>
          <td style="${td}" colspan="2"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr>
          <td style="${th}width:20%;text-align:center;">تاریخ و وقت کارروائی</td>
          <td style="${th}width:15%;text-align:center;">رپورٹ نمبر شمار سلسلہ وار</td>
          <td style="${th}text-align:center;">حالات تفتیش</td>
          <td style="${th}width:15%;text-align:center;">از</td>
        </tr>
        ${[1,2,3,4,5].map(n=>`<tr>
          <td style="${td}height:70px;vertical-align:top;">${ef('۔۔۔۔۔')}</td>
          <td style="${td}vertical-align:top;text-align:center;">${n}</td>
          <td style="${td}vertical-align:top;">
            <div>سرکار بذریعہ ${ef(station)} بنام ${ef(complainant)}</div>
            <div class="template-field" contenteditable="true" style="min-height:50px;display:block;"></div>
          </td>
          <td style="${td}vertical-align:top;">${ef(io)}</td>
        </tr>`).join('')}
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <tr>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">SHO ${ef(sho)}<br>تھانہ ${ef(station)}</div>
          </td>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">تفتیشی افسر<br>${ef(io)}</div>
          </td>
        </tr>
      </table>
    </div>`,

    // ══════════════════════════════════════════════
    //  4. ZIMNI BEROONI
    // ══════════════════════════════════════════════
    'Zimni Berooni': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="padding:2px 8px;font-size:12px;">پولیس فارم نمبر 25—54(1)</td>
          <td style="padding:2px 8px;text-align:center;font-size:16px;font-weight:900;">بیرونی ضمنی</td>
          <td style="padding:2px 8px;text-align:left;"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="${td}width:50%;font-weight:700;font-size:15px;">رپورٹ ضمنی</td>
          <td style="${td}">ضلع ${ef(district)}</td>
          <td style="${td}">تھانہ ${ef(station)}</td>
        </tr>
        <tr>
          <td style="${td}">سال ${ef(new Date().getFullYear().toString())}</td>
          <td style="${td}">ضمنی نمبر ${ef('۔۔۔۔۔')}</td>
          <td style="${td}"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:4px;">
        <tr>
          <td style="${td}width:25%;">مقدمہ نمبر ${ef(fir)}</td>
          <td style="${td}width:25%;">مورخہ ${ef(firDate)}</td>
          <td style="${td}width:25%;">تھانہ میں پہنچنے کا وقت و تاریخ</td>
          <td style="${td}width:25%;">${ef('۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">تاریخ و مقام وقوعہ ${ef(occurrence)}</td>
          <td style="${td}"></td>
          <td style="${td}">تھانہ سے روانگی کا وقت و تاریخ</td>
          <td style="${td}">${ef('۔۔۔۔۔۔۔')}</td>
        </tr>
        <tr>
          <td style="${td}">بحد ${ef('۔۔۔۔۔')}</td>
          <td style="${td}">جرم ${ef(section)}</td>
          <td style="${td}" colspan="2"></td>
        </tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:8px;">
        <tr>
          <td style="${th}width:20%;text-align:center;">تاریخ و وقت کارروائی</td>
          <td style="${th}width:15%;text-align:center;">رپورٹ نمبر شمار سلسلہ وار</td>
          <td style="${th}text-align:center;">حالات تفتیش</td>
          <td style="${th}width:15%;text-align:center;">از</td>
        </tr>
        ${[1,2,3,4,5,6].map(n=>`<tr>
          <td style="${td}height:70px;vertical-align:top;">${ef('۔۔۔۔۔')}</td>
          <td style="${td}vertical-align:top;text-align:center;">${n}</td>
          <td style="${td}vertical-align:top;">
            <div>سرکار بذریعہ ${ef(station)} بنام ${ef(complainant)}</div>
            <div class="template-field" contenteditable="true" style="min-height:50px;display:block;"></div>
          </td>
          <td style="${td}vertical-align:top;">${ef(io)}</td>
        </tr>`).join('')}
      </table>
      <table style="width:100%;border-collapse:collapse;margin-top:20px;">
        <tr>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">SHO ${ef(sho)}<br>تھانہ ${ef(station)}</div>
          </td>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">تفتیشی افسر<br>${ef(io)}</div>
          </td>
        </tr>
      </table>
    </div>`,

    // ══════════════════════════════════════════════
    //  5. INVESTIGATION BILLS
    // ══════════════════════════════════════════════
    'Investigation Bills': `<div style="${wrap}">
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="padding:4px 8px;font-weight:700;font-size:14px;">تھانہ ${ef(station)}</td>
          <td style="padding:4px 8px;text-align:left;font-weight:700;font-size:14px;">ضلع ${ef(district)}</td>
        </tr>
      </table>
      <div style="text-align:center;font-size:16px;font-weight:900;border-top:2px solid #333;border-bottom:2px solid #333;padding:6px 0;margin:6px 0;">
        بل بابت تفتیش مقدمات و خرچ خوراک ملزمان بند حوالات
      </div>
      <div style="text-align:center;margin-bottom:10px;font-size:14px;">
        بابت ماہ ${ef('۔۔۔۔۔۔۔۔')} سال ${ef(new Date().getFullYear().toString())} ء
      </div>
      <div style="font-weight:700;margin-bottom:6px;">جناب عالیٰ!</div>
      <div style="margin-bottom:10px;text-align:justify;line-height:2.2;">
        گذارش ہے کہ بل بابت تفتیش مقدمات و خرچ خوراک ملزمان بند حوالات جائز طور پر مرتب کیا گیا ہے۔ یہ بل نہ پہلے مرتب ہوا اور نہ ہی برآمد ہوا ہے۔ بل منظور فرماتے ہوئے برآمد کئے جانے کا حکم صادر فرمایا جائے۔
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        <tr>
          <td style="${td}width:50%;">رپورٹ محرر: ${ef('۔۔۔۔۔۔۔۔۔۔')}</td>
          <td style="${td}">مرتب کنندہ: ${ef(io)}</td>
        </tr>
      </table>
      <div style="font-size:13px;font-weight:700;margin:8px 0 4px;">
        بل بابت تفتیش مقدمات بمعہ تفصیل خوراک ملزمان بند حوالات، پوسٹمارٹم، اسٹیشنری و دیگر اخراجات جو کہ مقدمات کے خرچہ سے متعلق ہیں
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <tr>
          <td style="${th}width:5%;">نمبرشمار</td>
          <td style="${th}width:14%;">تفصیل مقدمات</td>
          <td style="${th}width:14%;">رپٹ نمبر معہ تاریخ بندی و روانگی ملزم</td>
          <td style="${th}width:10%;">معیاد حراست ملزم</td>
          <td style="${th}width:25%;">خرچہ تفتیش و تفصیل مقدمات</td>
          <td style="${th}width:8%;">کل خرچ</td>
          <td style="${th}width:8%;">فاصلہ آمد ورفت</td>
          <td style="${th}width:10%;">نام تفتیشی افسر</td>
          <td style="${th}width:11%;">نام و پتہ حوالات ملزمان</td>
          <td style="${th}width:10%;">دستخط تفتیشی افسر</td>
        </tr>
        <tr>
          <td style="${td}text-align:center;">1</td>
          <td style="${td}"><div class="template-field" contenteditable="true">${offence||fir}</div></td>
          <td style="${td}">${ef(fir + ' ' + firDate)}</td>
          <td style="${td}height:180px;vertical-align:top;"></td>
          <td style="${td}vertical-align:top;font-size:10px;line-height:1.8;">
            1۔ بل اخراجات ٹرانسپورٹ/ڈیڈ باڈی برائے پوسٹمارٹم<br>
            2۔ بل تیاری نقشہ بذریعہ نقشہ نویس<br>
            3۔ بل سرالوجسٹ بذریعہ کیمیکل ایگزامینر بذریعہ قبضہ پولیس اشیاء<br>
            4۔ بل بلیسٹک ایکسپرٹ کی واردات میں استعمال ہونے والے اسلحہ کی ترسیل<br>
            5۔ بل ٹرانسپورٹ برائے گرفتاری ملزمان (عدم دستیابی گاڑی سرکاری)<br>
            ۶۔ بل ٹرانسپورٹ برائے جسمانی ریمانڈ (عدم دستیابی گاڑی سرکاری)<br>
            ۷۔ بل ٹرانسپورٹ برائے اسلحہ<br>
            ۸۔ بل ٹرانسپورٹ برائے برآمدگی چوری شدہ/چھینی گئی گاڑی/کیس پراپرٹی<br>
            ۹۔ بل اندھا قتل نعش کا پوسٹمارٹم/اخراجات کفن دفن<br>
            ۱۰۔ بل ٹرانسپورٹ و میڈیکل برائے زخمی<br>
            ۱1۔ بل برائے فوٹو گرافی وقوعہ ڈیڈ باڈی<br>
            ۱2۔ بل برائے ویڈیو فلم غیرقانونی اجتماعات<br>
            ۱3۔ بل ٹرانسپورٹ برائے شناخت پریڈ<br>
            ۱4۔ بل اخراجات مشتبہ افراد زیرحراست<br>
            ۱5۔ بل ٹرانسپورٹ برائے معائنہ انجن/چیسز نمبر/فورنزک سائنس لیبارٹری<br>
            ۱۶۔ بل فنگرپرنٹ/فٹ مولڈز/ہینڈ رائٹنگ<br>
            ۱۷۔ بل دیگر حادثاتی اخراجات
          </td>
          <td style="${td}vertical-align:top;"></td>
          <td style="${td}vertical-align:top;"></td>
          <td style="${td}vertical-align:top;">${ef(io)}</td>
          <td style="${td}vertical-align:top;"></td>
          <td style="${td}vertical-align:top;"></td>
        </tr>
        ${[2,3].map(n=>`<tr>
          <td style="${td}text-align:center;">${n}</td>
          <td style="${td}height:60px;"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
          <td style="${td}"></td>
        </tr>`).join('')}
      </table>
      <div style="font-size:12px;margin-top:8px;border:1px solid #ccc;padding:6px 8px;">
        <span style="font-weight:700;">نوٹ:</span> بل اخراجات بمطابق شیڈول DIG ویلفئیر اینڈ فنانس پنجاب لاہور بحوالہ چٹھی نمبر 6914-19/A مورخہ 10.03.2003 مرتب کرکے ارسال کریں۔
      </div>
      <table style="width:100%;border-collapse:collapse;margin-top:16px;">
        <tr>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">رپورٹ محرر</div>
          </td>
          <td style="${td}text-align:center;padding:40px 8px 8px;">
            <div style="border-top:1px solid #333;padding-top:4px;">مرتب کنندہ ${ef(io)}</div>
          </td>
        </tr>
      </table>
    </div>`,

  };

    // Return specific template or generic
  if (templates[docName]) return templates[docName];

  // Generic bilingual template for all other documents
  return `
    <div style="text-align:center;margin-bottom:20px;direction:rtl;">
      <div style="font-size:18px;font-weight:900;margin:10px 0;border-bottom:2px solid #333;padding-bottom:8px;">${docName}</div>
      <div style="font-size:12px;color:#777;">FIR نمبر: ${fir} &nbsp;|&nbsp; تاریخ: ${firDate}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;direction:rtl;margin-bottom:16px;">
      <tr><td style="width:25%;padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">FIR نمبر</td><td style="padding:8px;border:1px solid #ccc;">${field(fir)}</td><td style="width:25%;padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">تاریخ</td><td style="padding:8px;border:1px solid #ccc;">${field(firDate)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">پولیس اسٹیشن</td><td style="padding:8px;border:1px solid #ccc;">${field(station)}</td><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">ضلع</td><td style="padding:8px;border:1px solid #ccc;">${field(district)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">مدعی</td><td style="padding:8px;border:1px solid #ccc;">${field(complainant)}</td><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">دفعات</td><td style="padding:8px;border:1px solid #ccc;">${field(section)}</td></tr>
      <tr><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">تفتیشی افسر</td><td style="padding:8px;border:1px solid #ccc;">${field(io)}</td><td style="padding:8px;border:1px solid #ccc;font-weight:600;background:#f9f9f9;">SHO</td><td style="padding:8px;border:1px solid #ccc;">${field(sho)}</td></tr>
    </table>
    <div style="direction:rtl;margin-bottom:12px;">
      <div style="font-weight:600;margin-bottom:6px;">تفصیلات / Details:</div>
      <div class="template-field" contenteditable="true" style="min-height:200px;display:block;width:100%;border:1px dashed #aaa;padding:10px;font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu','Times New Roman',serif;"></div>
    </div>
    <div style="direction:rtl;margin-top:30px;display:grid;grid-template-columns:1fr 1fr;gap:20px;direction:rtl;">
      <div style="text-align:center;"><div style="border-top:1px solid #333;margin-top:40px;padding-top:4px;font-size:11px;">تفتیشی افسر / Investigation Officer</div></div>
      <div style="text-align:center;"><div style="border-top:1px solid #333;margin-top:40px;padding-top:4px;font-size:11px;">SHO / Station House Officer</div></div>
    </div>`;
}

