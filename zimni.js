/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — رپورٹ ضمنی (ZIMNI / PROGRESS REPORT)
   Police Form 25-54(1) — MS Word-style rich text editor
   ═══════════════════════════════════════════════════════════ */

let _zimniCaseId = null;
let _zimniCase   = null;
let _zimniList   = [];
let _zimniActive = null;  // currently open zimni record

// ── ENTRY POINT (called when ضمنیات/میمورنڈم button pressed) ──
async function openZimniEditor(caseId) {
  _zimniCaseId = caseId || (typeof _misalCaseId !== 'undefined' ? _misalCaseId : null)
              || (typeof currentCaseId !== 'undefined' ? currentCaseId : null);
  if (typeof getCase === 'function' && _zimniCaseId) {
    try { _zimniCase = await getCase(_zimniCaseId); } catch(_) { _zimniCase = null; }
  }
  await _loadZimni();
  _renderZimniList();
}

async function _loadZimni() {
  if (!navigator.onLine) {
    try { _zimniList = JSON.parse(localStorage.getItem('dio_zimni_' + _zimniCaseId) || '[]'); }
    catch(_) { _zimniList = []; }
    return;
  }
  try {
    const { data } = await supabaseClient
      .from('zimni_reports').select('*')
      .eq('case_id', _zimniCaseId)
      .order('serial_no', { ascending: true });
    _zimniList = data || [];
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
  } catch(_) {
    try { _zimniList = JSON.parse(localStorage.getItem('dio_zimni_' + _zimniCaseId) || '[]'); }
    catch(_2) { _zimniList = []; }
  }
}

// ── LIST VIEW (all zimni entries for this case) ───────────────
function _renderZimniList() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  area.innerHTML = `
  <div style="padding:14px;direction:rtl;height:100%;overflow-y:auto;">
    <div style="display:flex;align-items:center;justify-content:flex-start;gap:8px;margin-bottom:12px;">
      <button class="btn btn-primary btn-sm" onclick="_newZimni()">➕ نئی ضمنی</button>
    </div>
    ${_zimniList.length ? `
    <div style="display:flex;flex-direction:column;gap:8px;">
      ${_zimniList.map(z => `
        <div class="card" style="padding:12px;direction:rtl;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer;"
             onclick="_openZimni('${z.id}')">
          <div>
            <div style="font-weight:700;font-size:14px;font-family:'Jameel Noori Nastaleeq',serif;">ضمنی نمبر ${z.serial_no || '—'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${z.report_date || ''}</div>
          </div>
          <div style="display:flex;gap:6px;">
            <button class="btn btn-secondary btn-sm" style="padding:2px 8px;" onclick="event.stopPropagation();_openZimni('${z.id}')">✏️</button>
            <button class="btn btn-danger btn-sm" style="padding:2px 8px;" onclick="event.stopPropagation();_deleteZimni('${z.id}')">🗑️</button>
          </div>
        </div>`).join('')}
    </div>` : `
    <div style="text-align:center;padding:40px 20px;color:var(--text-muted);">
      <div style="font-size:40px;margin-bottom:10px;">📋</div>
      <div style="font-size:14px;">ابھی کوئی ضمنی رپورٹ نہیں</div>
      <div style="font-size:11px;margin-top:6px;">اوپر "نئی ضمنی" پر کلک کریں</div>
    </div>`}
  </div>`;
}

function _newZimni() {
  const nextSerial = (_zimniList.reduce((m,z)=>Math.max(m, parseInt(z.serial_no)||0), 0)) + 1;
  _zimniActive = { id: null, serial_no: nextSerial, content: null };
  _renderZimniEditor();
}

function _openZimni(id) {
  _zimniActive = _zimniList.find(z => z.id === id) || null;
  if (!_zimniActive) return;
  _renderZimniEditor();
}

// ── EDITOR (MS Word style, Police Form 25-54(1)) ──────────────
function _renderZimniEditor() {
  const area = document.getElementById('workspace-editor-area')
            || document.getElementById('workspace-tab-content')
            || document.getElementById('page-content');
  if (!area) return;
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const c = _zimniCase || {};
  const z = _zimniActive || {};
  const saved = z.content || {};
  const year = new Date().getFullYear();

  const savedBody = saved.bodyHtml || _zimniDefaultBody(o, c);

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;direction:rtl;">
    <!-- Top toolbar -->
    <div style="display:flex;align-items:center;gap:6px;padding:8px 12px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:var(--bg-secondary);">
      <button onclick="_zFmt('bold')" title="بولڈ (Ctrl+B)" style="${_zBtn()}font-weight:900;">B</button>
      <button onclick="_zFmt('italic')" title="ترچھا (Ctrl+I)" style="${_zBtn()}font-style:italic;">I</button>
      <button onclick="_zFmt('underline')" title="انڈر لائن (Ctrl+U)" style="${_zBtn()}text-decoration:underline;">U</button>
      <span style="width:1px;height:22px;background:var(--border);margin:0 3px;"></span>
      <button onclick="_zFont(1)" title="فونٹ بڑا" style="${_zBtn()}">A+</button>
      <button onclick="_zFont(-1)" title="فونٹ چھوٹا" style="${_zBtn()}font-size:11px;">A−</button>
      <span style="width:1px;height:22px;background:var(--border);margin:0 3px;"></span>
      <button onclick="_zFmt('justifyRight')" title="دائیں" style="${_zBtn()}">⫷</button>
      <button onclick="_zFmt('justifyCenter')" title="درمیان" style="${_zBtn()}">≡</button>
      <button onclick="_zFmt('justifyLeft')" title="بائیں" style="${_zBtn()}">⫸</button>
      <button onclick="_zFmt('justifyFull')" title="مکمل" style="${_zBtn()}">☰</button>
      <span style="width:1px;height:22px;background:var(--border);margin:0 3px;"></span>
      <button onclick="_zAddRow()" title="نئی قطار" style="${_zBtn()}font-size:11px;">➕ قطار</button>
      <div style="margin-right:auto;display:flex;gap:6px;">
        <button class="btn btn-primary btn-sm" onclick="_saveZimni()">💾 محفوظ</button>
        <button class="btn btn-secondary btn-sm" onclick="_printZimni()">🖨️ پرنٹ</button>
        <button class="btn btn-secondary btn-sm" onclick="_renderZimniList()">↩ واپس</button>
      </div>
    </div>

    <!-- Document -->
    <div style="flex:1;overflow-y:auto;padding:16px;background:var(--bg-tertiary);">
      <div id="zimni-doc" contenteditable="true" spellcheck="false" style="
        max-width:210mm;margin:0 auto;padding:18mm;
        background:#fff;color:#111;
        font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;
        font-size:15px;line-height:2;
        direction:rtl;text-align:justify;
        box-shadow:0 4px 20px rgba(0,0,0,0.15);border-radius:4px;outline:none;
      ">${savedBody}</div>
    </div>
  </div>`;

  // Keyboard shortcuts
  setTimeout(() => {
    const ed = document.getElementById('zimni-doc');
    if (ed) {
      ed.focus();
      ed.onkeydown = (e) => {
        if (e.ctrlKey || e.metaKey) {
          if (e.key==='b'){e.preventDefault();document.execCommand('bold');}
          if (e.key==='i'){e.preventDefault();document.execCommand('italic');}
          if (e.key==='u'){e.preventDefault();document.execCommand('underline');}
        }
      };
    }
  }, 80);
}

// Default document body (Police Form 25-54(1))
function _zimniDefaultBody(o, c) {
  const z = _zimniActive || {};
  const station = o.station || '________';
  const district = o.district || '________';
  const year = new Date().getFullYear();
  const cell = (v) => v || '';
  return `
  <div style="text-align:left;font-size:11px;color:#555;margin-bottom:6px;">پولیس فارم نمبر 25—54(1) — بیرونی</div>
  <div style="text-align:center;font-size:18px;font-weight:800;margin-bottom:4px;">رپورٹ ضمنی</div>
  <div style="text-align:center;font-size:13px;margin-bottom:12px;">ضلع ${district} تھانہ ${station} — سال ${year} — ضمنی نمبر <b>${z.serial_no||''}</b></div>

  <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px;">
    <tr>
      <td style="border:1px solid #999;padding:6px;width:33%;"><b>مقدمہ نمبر:</b> ${cell(c.fir_number)}</td>
      <td style="border:1px solid #999;padding:6px;width:33%;"><b>مورخہ:</b> ${cell(c.occurrence_date)}</td>
      <td style="border:1px solid #999;padding:6px;"><b>تھانہ میں پہنچنے کا وقت و تاریخ:</b> </td>
    </tr>
    <tr>
      <td style="border:1px solid #999;padding:6px;"><b>تاریخ و مقام وقوعہ:</b> </td>
      <td style="border:1px solid #999;padding:6px;" colspan="2"><b>تھانہ سے روانگی کا وقت و تاریخ:</b> </td>
    </tr>
    <tr>
      <td style="border:1px solid #999;padding:6px;"><b>بحد:</b> </td>
      <td style="border:1px solid #999;padding:6px;" colspan="2"><b>جرم:</b> ${cell(c.section_of_law)} ${cell(c.offence_type)}</td>
    </tr>
  </table>

  <!-- Main 4-column table -->
  <table style="width:100%;border-collapse:collapse;font-size:13px;" id="zimni-main-table">
    <thead>
      <tr style="background:#f0f0f0;">
        <th style="border:1px solid #999;padding:6px;width:18%;">از۔تھانہ</th>
        <th style="border:1px solid #999;padding:6px;">حالاتِ تفتیش</th>
        <th style="border:1px solid #999;padding:6px;width:12%;">رپورٹ نمبر شمار سلسلہ وار</th>
        <th style="border:1px solid #999;padding:6px;width:16%;">تاریخ و وقت کارروائی</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="border:1px solid #999;padding:8px;vertical-align:top;">${o.full_name||''}<br>${station}</td>
        <td style="border:1px solid #999;padding:8px;vertical-align:top;text-align:justify;min-height:200px;"> </td>
        <td style="border:1px solid #999;padding:8px;text-align:center;vertical-align:top;">${z.serial_no||''}</td>
        <td style="border:1px solid #999;padding:8px;vertical-align:top;"> </td>
      </tr>
    </tbody>
  </table>`;
}

// Add a new row to the main table
function _zAddRow() {
  const ed = document.getElementById('zimni-doc');
  if (!ed) return;
  const tbody = ed.querySelector('#zimni-main-table tbody');
  if (!tbody) { showToast('⚠️ ٹیبل نہیں ملا', 'warn'); return; }
  const o = (typeof currentOfficer !== 'undefined' && currentOfficer) ? currentOfficer : {};
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td style="border:1px solid #999;padding:8px;vertical-align:top;">${o.full_name||''}<br>${o.station||''}</td>
    <td style="border:1px solid #999;padding:8px;vertical-align:top;text-align:justify;"> </td>
    <td style="border:1px solid #999;padding:8px;text-align:center;vertical-align:top;"> </td>
    <td style="border:1px solid #999;padding:8px;vertical-align:top;"> </td>`;
  tbody.appendChild(tr);
}

// ── FORMATTING ────────────────────────────────────────────────
function _zBtn() {
  return 'min-width:32px;height:30px;border:1px solid var(--border);border-radius:6px;background:var(--bg-card);color:var(--text-primary);cursor:pointer;font-size:14px;padding:0 7px;';
}
function _zFmt(cmd) {
  const ed = document.getElementById('zimni-doc');
  if (ed) ed.focus();
  document.execCommand(cmd, false, null);
}
function _zFont(dir) {
  const ed = document.getElementById('zimni-doc');
  if (!ed) return;
  ed.focus();
  const sel = window.getSelection();
  if (sel && sel.toString()) {
    document.execCommand('fontSize', false, dir > 0 ? '5' : '2');
  } else {
    const cur = parseInt(window.getComputedStyle(ed).fontSize) || 15;
    ed.style.fontSize = Math.max(11, Math.min(26, cur + dir*2)) + 'px';
  }
}

// ── SAVE ──────────────────────────────────────────────────────
async function _saveZimni() {
  const ed = document.getElementById('zimni-doc');
  if (!ed) return;
  const bodyHtml = ed.innerHTML;
  const z = _zimniActive || {};
  const rec = {
    case_id: _zimniCaseId,
    serial_no: z.serial_no || 1,
    report_date: new Date().toISOString().slice(0,10),
    content: { bodyHtml },
  };
  try {
    const oid = (typeof getOfficerId === 'function') ? await getOfficerId() : null;
    if (oid) rec.officer_id = oid;
    let savedRec = null;
    if (z.id) {
      const { data } = await supabaseClient.from('zimni_reports').update(rec).eq('id', z.id).select().single();
      savedRec = data || { ...rec, id: z.id };
      const idx = _zimniList.findIndex(x => x.id === z.id);
      if (idx >= 0) _zimniList[idx] = savedRec;
    } else {
      const { data, error } = await supabaseClient.from('zimni_reports').insert(rec).select().single();
      if (error) throw error;
      savedRec = data || { ...rec, id: 'tmp_'+Date.now() };
      _zimniList.push(savedRec);
    }
    _zimniActive = savedRec;
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
    showToast('✅ ضمنی محفوظ ہو گئی', 'success');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

async function _deleteZimni(id) {
  if (!confirm('کیا آپ یہ ضمنی حذف کرنا چاہتے ہیں؟')) return;
  try {
    await supabaseClient.from('zimni_reports').delete().eq('id', id);
    _zimniList = _zimniList.filter(z => z.id !== id);
    try { localStorage.setItem('dio_zimni_' + _zimniCaseId, JSON.stringify(_zimniList)); } catch(_) {}
    _renderZimniList();
    showToast('🗑️ حذف ہو گئی', 'info');
  } catch(e) { showToast('❌ ' + e.message, 'error'); }
}

// ── PRINT (only the document, MS Word style) ──────────────────
function _printZimni() {
  const ed = document.getElementById('zimni-doc');
  if (!ed) return;
  const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
    <style>@page{size:A4;margin:15mm}
      body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;text-align:justify;font-size:15px;line-height:2;color:#000;}
      table{border-collapse:collapse;width:100%;}td,th{border:1px solid #000;padding:6px;}
    </style></head><body>${ed.innerHTML}</body></html>`;
  if (typeof dioPrint === 'function') {
    dioPrint(html);
  } else {
    const w = window.open('', '_blank');
    w.document.write(html); w.document.close(); w.print();
  }
}
