/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — TEMPLATES  (forms.js)
   All official forms removed as per officer request
   ═══════════════════════════════════════════════════════════ */

registerPage('forms', renderOfficialForms);

async function renderOfficialForms(container) {
  container.innerHTML = `
  <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
              height:60vh;color:var(--text-muted);text-align:center;">
    <div style="font-size:52px;margin-bottom:16px;">📥</div>
    <div style="font-size:16px;font-weight:600;margin-bottom:8px;color:var(--text-primary);">Templates</div>
    <div style="font-size:13px;">ابھی کوئی ٹیمپلیٹ شامل نہیں</div>
  </div>`;
}
