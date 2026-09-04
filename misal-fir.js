/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — الف آئی آر کے اندراجات + آواز سے لکھنا
   (پہلے یہ misal-docs.js میں تھا)
   AHEM: misal-docs.js کے BAAD لوڈ ہو
   ═══════════════════════════════════════════════════════════ */

async function _renderFIRView() {
  const area = document.getElementById('workspace-editor-area');
  if (!area) return;
  const c = window._workspaceCase || {};

  area.innerHTML = `
  <div style="display:flex;flex-direction:column;height:100%;">
    <!-- FIR Header bar -->
    <div style="background:var(--bg-secondary);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div style="font-family:'Jameel Noori Nastaleeq',serif;font-size:16px;font-weight:700;color:var(--accent);direction:rtl;">
        متن ایف آئی آر — مقدمہ ${esc(c.fir_number||'')}
      </div>
      <div style="display:flex;gap:6px;direction:rtl;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="_openFIREditor()">📝 متن درج کریں</button>
        <button class="btn btn-secondary dio-modbtn" onclick="_printFIRAll()">🖨️ پرنٹ</button>
        <button class="btn btn-secondary" onclick="_shareFIRAll()">📱 شیئر</button>
      </div>
    </div>

    <!-- FIR entries list -->
    <div style="flex:1;overflow-y:auto;padding:16px;" id="fir-entries-area">
      <div style="text-align:center;padding:30px;color:var(--text-muted);">⏳ لوڈ ہو رہا ہے...</div>
    </div>
  </div>`;

  await _loadFIREntries();
}


async function _loadFIREntries() {
  const area = document.getElementById('fir-entries-area');
  if (!area || !_misalCaseId) return;

  try {
    const { data } = await supabaseClient
      .from('case_documents')
      .select('*')
      .eq('case_id', _misalCaseId)
      .eq('document_type', 'fir')
      .order('created_at', { ascending: false });

    const entries = data || [];

    if (!entries.length) {
      area.innerHTML = `
        <div style="text-align:center;padding:48px;color:var(--text-muted);">
          <div style="font-size:48px;margin-bottom:12px;">📄</div>
          <div style="font-size:14px;font-weight:600;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;">ابھی کوئی FIR متن نہیں</div>
          <div style="font-size:12px;margin-top:6px;">اوپر "متن درج کریں" بٹن دبائیں</div>
        </div>`;
      return;
    }

    area.innerHTML = `
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:var(--bg-secondary);">
          <th style="padding:10px 12px;text-align:right;font-family:'Jameel Noori Nastaleeq',serif;direction:rtl;font-size:13px;border-bottom:2px solid var(--accent);">مضمون</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;border-bottom:2px solid var(--accent);width:120px;">ایکشن</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((e,i) => `
          <tr style="border-bottom:1px solid var(--border);${i%2===0?'background:var(--bg-secondary);':''}">
            <td style="padding:12px;direction:rtl;font-family:'Jameel Noori Nastaleeq',serif;font-size:14px;line-height:2;vertical-align:top;">
              <span style="font-size:11px;color:var(--text-faint);display:block;margin-bottom:4px;">${e.status==='complete'?'✅ مکمل':'📝 مسودہ'} · ${formatDate(e.updated_at||e.created_at)}</span>
              <div id="fir-preview-${e.id}" style="max-height:120px;overflow:hidden;">
                ${e.content?.html ? _stripTags(e.content.html).slice(0,300)+'...' : '—'}
              </div>
            </td>
            <td style="padding:8px;text-align:center;vertical-align:top;">
              <div style="display:flex;flex-direction:column;gap:4px;align-items:center;">
                <button class="btn btn-primary btn-sm" onclick="_editFIREntry('${e.id}')" title="ترمیم">✏️ ترمیم</button>
                <button class="btn btn-secondary btn-sm" onclick="_printFIREntry('${e.id}')" title="پرنٹ">🖨️ پرنٹ</button>
                <button class="btn btn-secondary btn-sm" onclick="_shareFIREntry('${e.id}')" title="شیئر">📱 شیئر</button>
                <button class="btn btn-danger btn-sm" onclick="_deleteFIREntry('${e.id}')" title="حذف">🗑️</button>
              </div>
            </td>
          </tr>`).join('')}
      </tbody>
    </table>`;

    // Store entries for print/share
    window._firEntries = entries;
  } catch(e) {
    if (area) area.innerHTML = `<div style="color:var(--red);padding:20px;">❌ ${e.message}</div>`;
  }
}


function _stripTags(html) {
  const d = document.createElement('div');
  d.innerHTML = html;
  return d.textContent || d.innerText || '';
}


function _openFIREditor(entryId) {
  // Open Word editor for new or existing FIR entry
  if (entryId) {
    // Edit existing — find in _misalDocs and open
    _openMisalEditorDirect('fir');
  } else {
    // New entry
    _openMisalEditorDirect('fir');
  }
}


async function _editFIREntry(entryId) {
  // Load content and open editor
  try {
    const { data } = await supabaseClient
      .from('case_documents').select('*').eq('id', entryId).single();
    if (data) {
      _misalDocs['fir'] = data;
      _openMisalEditorDirect('fir');
    }
  } catch(e) { showToast('❌ '+e.message,'error'); }
}


function _openMisalEditorDirect(docId) {
  const def = MISAL_CASE_DOCS.find(d => d.id === docId);
  if (!def) return;
  _openDocId = docId;
  const area = document.getElementById('workspace-editor-area');
  if (!area) return;
  _renderMisalEditor(docId, def);
}


async function _deleteFIREntry(entryId) {
  openModal('🗑️ FIR حذف کریں',
    `<p style="color:var(--text-secondary);font-size:13px;">کیا آپ یہ FIR متن مستقل حذف کرنا چاہتے ہیں؟</p>`,
    `<button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-danger" onclick="closeModal();_doDeleteFIR('${entryId}')">🗑️ حذف کریں</button>`
  );
}


async function _doDeleteFIR(entryId) {
  try {
    await supabaseClient.from('case_documents').delete().eq('id', entryId);
    delete _misalDocs['fir'];
    showToast('🗑️ FIR حذف ہو گئی','info');
    _refreshMisalBar();
    _renderFIRView();
  } catch(e) { showToast('❌ '+e.message,'error'); }
}


function _printFIREntry(entryId) {
  const entries = window._firEntries || [];
  const e = entries.find(x => x.id === entryId);
  if (!e) return;
  _doPrintFIR(sanitizeHtml(e.content?.html || ''));
}


function _printFIRAll() {
  const entries = window._firEntries || [];
  const html = entries.map(e => sanitizeHtml(e.content?.html || '')).join('<hr>');
  _doPrintFIR(html);
}


function _doPrintFIR(html) {
  const c = window._workspaceCase || {};
  const o = currentOfficer || {};
  let _printHTML = '';
  _printHTML += (`<!DOCTYPE html><html><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu&display=swap" rel="stylesheet">
    <style>
      @page{margin:15mm;} body{font-family:'Jameel Noori Nastaleeq','Noto Nastaliq Urdu',serif;direction:rtl;font-size:14pt;line-height:2;color:#000;}
      h2{text-align:center;font-size:16pt;} .header{text-align:center;border-bottom:2px solid #333;padding-bottom:10px;margin-bottom:16px;}
      /* FIR ka matn CENTER, headings 16pt, matn 14pt (user ki hidayat) */
      .fir-body{ text-align:center; font-size:14pt; line-height:2; }
    </style></head><body>
    <div class="header">
      <div style="font-size:16pt;font-weight:bold;">تھانہ ${o.station||''} ضلع ${o.district||''}</div>
      <div style="font-size:16pt;font-weight:bold;margin-top:6px;">ایف آئی آر — مقدمہ نمبر: ${esc(c.fir_number||'')}</div>
      <div style="font-size:14pt;">تاریخ: ${formatDate(c.fir_date)} | دفعات: ${esc(c.section_of_law||'')}</div>
    </div>
    <div class="fir-body">${html}</div>
    </body></html>`);
  dioPrint(_printHTML);
  
}


function _shareFIREntry(entryId) {
  const entries = window._firEntries || [];
  const e = entries.find(x => x.id === entryId);
  if (!e) return;
  _doShareFIR(_stripTags(e.content?.html||''));
}


function _shareFIRAll() {
  const entries = window._firEntries || [];
  const txt = entries.map(e => _stripTags(e.content?.html||'')).join('\n\n---\n\n');
  _doShareFIR(txt);
}


function _doShareFIR(txt) {
  const c = window._workspaceCase || {};
  const full = `ایف آئی آر — مقدمہ ${c.fir_number||''}\n\n${txt}`;
  if (navigator.share) { navigator.share({title:'FIR',text:full}).catch(()=>{}); }
  else { navigator.clipboard.writeText(full).then(()=>showToast('📋 Copy ہو گئی — WhatsApp میں paste کریں','info')); }
}

// ── SAVE (override to refresh FIR view after save) ────────────

function toggleVoiceInput() {
  if (_voiceActive) {
    _stopVoice();
  } else {
    _startVoice();
  }
}


async function _startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    showToast('⚠️ آپ کا براؤزر آواز کو سپورٹ نہیں کرتا — Chrome استعمال کریں', 'error', 6000);
    return;
  }

  const editor = document.getElementById('misal-editor') || document.getElementById('a4-paper');
  if (!editor) { showToast('⚠️ پہلے دستاویز کھولیں', 'error'); return; }

  // Explicitly request microphone permission first
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Permission granted — stop the stream immediately, SpeechRecognition handles its own
    stream.getTracks().forEach(t => t.stop());
  } catch(err) {
    if (err.name === 'NotAllowedError') {
      showToast('❌ مائیکروفون کی اجازت نہیں — براؤزر میں Allow کریں', 'error', 6000);
    } else if (err.name === 'NotFoundError') {
      showToast('❌ کوئی مائیکروفون نہیں ملا — مائیکروفون جوڑیں', 'error', 6000);
    } else {
      showToast('❌ مائیکروفون خرابی: ' + err.message, 'error', 6000);
    }
    return;
  }

  editor.focus();

  _voiceRecognition = new SpeechRecognition();
  _voiceRecognition.lang           = 'ur-PK';
  _voiceRecognition.continuous     = true;
  _voiceRecognition.interimResults = true;

  _voiceRecognition.onstart = () => {
    console.log('[Voice] Started — ur-PK');
  };

  _voiceRecognition.onresult = (event) => {
    let interim = '';
    let final   = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const t = event.results[i][0].transcript;
      if (event.results[i].isFinal) { final += t + ' '; }
      else { interim += t; }
    }
    if (final) _insertTextAtCursor(editor, final);
    const badge = document.getElementById('voice-status');
    if (badge) badge.textContent = interim ? `🎙️ ${interim}` : '🎙️ سن رہا ہے...';
  };

  _voiceRecognition.onerror = (e) => {
    console.warn('[Voice] Error:', e.error);
    const msgs = {
      'not-allowed':  '❌ مائیکروفون کی اجازت نہیں',
      'no-speech':    null, // ignore silence
      'audio-capture':'❌ مائیکروفون نہیں ملا',
      'network':      '❌ نیٹ ورک کی خرابی — آواز نہیں پہنچ رہی',
      'aborted':      null,
    };
    const msg = msgs[e.error];
    if (msg) { showToast(msg, 'error', 5000); _stopVoice(); }
  };

  _voiceRecognition.onend = () => {
    if (_voiceActive) {
      try { _voiceRecognition.start(); } catch(_) {}
    }
  };

  try {
    _voiceRecognition.start();
    _voiceActive = true;
  } catch(err) {
    showToast('❌ آواز شروع نہیں ہو سکی: ' + err.message, 'error', 5000);
    return;
  }

  const btn = document.getElementById('voice-btn');
  if (btn) {
    btn.style.background  = '#ef4444';
    btn.style.color       = '#fff';
    btn.style.borderColor = '#ef4444';
    btn.textContent       = '⏹️ روکیں';
  }

  // Status bar
  let badge = document.getElementById('voice-status');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'voice-status';
    badge.style.cssText = 'padding:6px 16px;background:#1a1a2e;border-bottom:2px solid #ef4444;font-size:13px;color:#ef4444;direction:rtl;text-align:right;font-family:\'Jameel Noori Nastaleeq\',serif;';
    badge.textContent = '🎙️ سن رہا ہے... اردو میں بولیں';
    const editorArea = document.getElementById('workspace-editor-area');
    if (editorArea) editorArea.insertAdjacentElement('afterbegin', badge);
  }

  showToast('🎙️ اردو میں بولنا شروع کریں', 'success', 3000);
}


function _stopVoice() {
  _voiceActive = false;
  if (_voiceRecognition) { _voiceRecognition.stop(); _voiceRecognition = null; }

  const btn = document.getElementById('voice-btn');
  if (btn) {
    btn.style.background  = '';
    btn.style.color       = '';
    btn.style.borderColor = '';
    btn.textContent       = '🎙️ آواز';
  }

  const badge = document.getElementById('voice-status');
  if (badge) badge.remove();

  showToast('⏹️ آواز کی ریکارڈنگ بند', 'info', 2000);
}

// Insert text at the current cursor position in a contenteditable element

function _insertTextAtCursor(el, text) {
  el.focus();
  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    // Move cursor to after inserted text
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
  } else {
    // Fallback: append to end
    el.textContent += text;
  }
}

