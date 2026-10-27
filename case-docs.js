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
    html += `<div style="font-size:6.75pt;color:var(--text-faint);letter-spacing:2px;text-transform:uppercase;padding:6px 0 4px;">${cat}</div>`;
    filtered.forEach(doc => {
      const checked = selected.includes(doc);
      html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:4px;cursor:pointer;transition:background 0.1s;" onmouseenter="this.style.background='var(--hover-bg)'" onmouseleave="this.style.background=''" onclick="toggleDoc('${_dioJsHtml(doc)}',this)">
        <input type="checkbox" ${checked?'checked':''} style="accent-color:var(--accent);width:14px;height:14px;pointer-events:none;">
        <span style="font-size:9pt;color:${checked?'var(--accent)':'var(--text-secondary)'};">${esc(doc)}</span>
      </div>`;
    });
  }
  // Custom documents
  const customDocs = selected.filter(d => !ALL_MISAL_DOCS.includes(d));
  if (customDocs.length) {
    html += `<div style="font-size:6.75pt;color:var(--text-faint);letter-spacing:2px;text-transform:uppercase;padding:6px 0 4px;">اپنی دستاویزات</div>`;
    customDocs.forEach(doc => {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:4px;cursor:pointer;" onclick="toggleDoc('${_dioJsHtml(doc)}',this)">
        <input type="checkbox" checked style="accent-color:var(--accent);width:14px;height:14px;pointer-events:none;">
        <span style="font-size:9pt;color:var(--accent);">${esc(doc)}</span>
        <span onclick="event.stopPropagation();removeCustomDoc('${_dioJsHtml(doc)}');" style="margin-inline-start:auto;color:var(--red);font-size:9pt;cursor:pointer;">×</span>
      </div>`;
    });
  }
  return html;
}


