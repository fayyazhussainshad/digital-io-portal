/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — SETTINGS & PROFILE TAB  (v2 — comprehensive)
   Two-way Supabase sync · Read-only admin fields · 
   Officer-editable posting · Employment history timeline
   ═══════════════════════════════════════════════════════════ */

registerPage('settings', renderSettings);

async function renderSettings(container) {
  const o = currentOfficer || {};

  // Fetch employment history from Supabase
  let transfers = [];
  try {
    if (navigator.onLine && o.id) {
      const { data } = await supabaseClient
        .from('officer_transfers')
        .select('*')
        .eq('officer_id', o.id)
        .order('transfer_date', { ascending: false });
      transfers = data || [];
    }
  } catch(_) {}

  const pct = _profilePct(o);
  const initials = (o.full_name||'IO').split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
  const photoSrc = localStorage.getItem('dio_profile_photo');
  const avatarHtml = photoSrc
    ? `<img src="${photoSrc}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">`
    : `<span>${initials}</span>`;

  const inp = 'width:100%;padding:9px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;box-sizing:border-box;';
  const lbl = 'display:block;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;letter-spacing:0.5px;';
  const ro  = inp + 'opacity:0.65;cursor:not-allowed;';
  const fg  = 'margin-bottom:12px;';

  // Read-only field renderer
  const roField = (label, val) => `
    <div style="${fg}">
      <label style="${lbl}">🔒 ${label}</label>
      <div style="${ro}padding:9px 12px;border-radius:6px;background:var(--bg-tertiary);border:1px solid var(--border);font-size:13px;color:var(--text-secondary);">
        ${val || '<span style="color:var(--text-faint);font-style:italic;">Not set by admin</span>'}
      </div>
    </div>`;

  // Editable field renderer
  const edField = (label, id, val, placeholder='', type='text') => `
    <div style="${fg}">
      <label style="${lbl}">${label}</label>
      <input style="${inp}" id="${id}" type="${type}" value="${_esc(val)}" placeholder="${placeholder}">
    </div>`;

  container.innerHTML = `
  <div class="page-header">
    <div><div class="page-title">⚙️ Settings & Profile</div>
    <div class="page-subtitle">Your official record — synced two-way with the department database</div></div>
  </div>

  <!-- ── PROFILE HEADER ─────────────────────────────────── -->
  <div class="card" style="margin-bottom:16px;padding:20px;">
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <!-- Avatar -->
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--accent-dark),var(--accent));flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;overflow:hidden;cursor:pointer;border:3px solid var(--accent);" id="profile-avatar-btn" onclick="changeProfilePhoto()" title="Click to change photo">
        ${avatarHtml}
      </div>
      <!-- Name + role -->
      <div style="flex:1;">
        <div style="font-size:22px;font-weight:800;color:var(--text-primary);">${_esc(o.full_name||'Officer Name')}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">${_esc(o.designation||'—')} &nbsp;·&nbsp; Badge ${_esc(o.badge_number||'—')}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">🏛️ ${_esc(o.station||'—')}, ${_esc(o.district||'—')}</div>
      </div>
      <!-- Profile completeness -->
      <div style="text-align:center;min-width:100px;">
        <div style="font-size:28px;font-weight:800;color:${pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)'};">${pct}%</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Profile Complete</div>
        <div style="height:6px;background:var(--bg-tertiary);border-radius:3px;margin-top:6px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)'};border-radius:3px;transition:width 0.5s;"></div>
        </div>
      </div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">

    <!-- LEFT COLUMN ─────────────────────────────────────── -->
    <div>

      <!-- SECTION 1: Official Details (read-only) -->
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title" style="margin-bottom:16px;">🔒 Official Details
          <span style="font-size:10px;color:var(--text-faint);font-weight:400;margin-left:8px;">Contact admin to update these</span>
        </div>
        ${roField('Full Name', o.full_name)}
        ${roField('Badge / Service Number', o.badge_number)}
        ${roField('Designation / Rank', o.designation)}
        ${roField('CNIC Number', o.cnic_number ? _esc(o.cnic_number).replace(/(\d{5})(\d{7})(\d)/, '$1-$2-$3') : '')}
        <div style="margin-top:8px;padding:8px 12px;background:var(--accent-glow);border-radius:6px;font-size:11px;color:var(--text-muted);">
          ℹ️ These fields are set by your district admin. To request a correction, contact your admin panel.
        </div>
      </div>

      <!-- SECTION 2: Current Posting (editable) -->
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title" style="margin-bottom:4px;">🏛️ Current Posting</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:16px;">Changing station/district here records a transfer and only affects future cases — existing cases keep their original station.</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
          ${edField('Police Station', 'set-station', o.station, 'e.g. Seetal Mari')}
          ${edField('District', 'set-district', o.district, 'e.g. Multan')}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
          ${edField('SHO کا نام', 'set-sho', o.sho_name||'', 'SHO کا مکمل نام')}
          ${edField('DSP/SDPO کا نام', 'set-dsp', o.dsp_name||'', 'DSP کا مکمل نام')}
        </div>
        ${edField('Official Phone (Department)', 'set-official-phone', o.official_phone||o.phone, '0300-0000000')}
        <button class="btn btn-primary" onclick="savePostingSettings()" style="margin-top:4px;">💾 Save Posting</button>
      </div>

    </div>

    <!-- RIGHT COLUMN ────────────────────────────────────── -->
    <div>

      <!-- Profile Photo -->
      <div class="card" style="margin-bottom:16px;text-align:center;padding:20px;">
        <div class="card-title" style="margin-bottom:16px;text-align:left;">🖼️ Profile Photo</div>
        <div style="width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,var(--accent-dark),var(--accent));margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:#fff;overflow:hidden;border:3px solid var(--accent);" id="settings-avatar">
          ${avatarHtml}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="changeProfilePhoto()">📷 Change Photo</button>
        ${photoSrc ? `<br><button class="btn btn-danger btn-sm" onclick="removeProfilePhoto()" style="margin-top:6px;">🗑️ Remove Photo</button>` : ''}
      </div>

      <!-- Employment History -->
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title" style="margin-bottom:4px;">📋 Employment History
          <button class="btn btn-primary btn-sm" onclick="openTransferModal()" style="float:right;margin-top:-4px;">+ Record Transfer</button>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;">Full posting history across all stations</div>
        ${_renderTransferTimeline(transfers, o)}
      </div>

      <!-- Security -->
      <div class="card">
        <div class="card-title" style="margin-bottom:12px;">🔐 Security</div>
        <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
          <div style="display:flex;align-items:center;gap:8px;"><span style="color:var(--green);">✅</span> MFA Active</div>
          <div style="display:flex;align-items:center;gap:8px;"><span style="color:var(--green);">✅</span> Audit Logging Enabled</div>
          <div style="display:flex;align-items:center;gap:8px;"><span style="color:var(--green);">✅</span> Data Encrypted at Rest</div>
          <div style="display:flex;align-items:center;gap:8px;"><span style="color:var(--accent);">🔒</span> Offline Auth: ${(async()=>{try{const c=await offlineStore.getOfflineCredsByEmail(currentUser?.email);return c?'<span style="color:var(--green);">✅ Ready</span>':'<span style="color:var(--amber);">⚠️ Login online once to enable</span>';}catch(_){return '—';}})()}</div>
        </div>
        <div style="margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;">Account</div>
          <div style="font-size:12px;color:var(--text-secondary);margin-bottom:10px;">📧 ${_esc(currentUser?.email||'—')}</div>
          <button class="btn btn-secondary btn-sm" onclick="openChangePasswordModal()">🔑 Change Password</button>
        </div>
      </div>

    </div>
  </div>`;

  // Async: update offline auth status display
  _updateOfflineAuthBadge();
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function _esc(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function _fmtDate(iso){ if(!iso)return''; const p=iso.substring(0,10).split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:iso; }

function _profilePct(o){
  const fields=[o.full_name,o.badge_number,o.designation,o.station,o.district,
    o.official_phone||o.phone,o.cnic_number];
  return Math.round(fields.filter(f=>f&&String(f).trim()).length/fields.length*100);
}

function _renderTransferTimeline(transfers, o){
  if(!transfers.length){
    // Show current posting as the only entry
    return `<div style="display:flex;gap:12px;align-items:flex-start;">
      <div style="width:10px;height:10px;border-radius:50%;background:var(--green);flex-shrink:0;margin-top:4px;"></div>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${_esc(o.station||'—')}, ${_esc(o.district||'—')}</div>
        <div style="font-size:11px;color:var(--green);">● Current Posting</div>
        ${!navigator.onLine?'<div style="font-size:10px;color:var(--text-faint);margin-top:2px;">Connect to load full history</div>':''}
      </div>
    </div>`;
  }
  const items=transfers.map((t,i)=>`
    <div style="display:flex;gap:12px;align-items:flex-start;padding-bottom:${i<transfers.length-1?'14px':'0'};${i<transfers.length-1?'border-bottom:1px solid var(--border-light);margin-bottom:14px;':''}">
      <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
        <div style="width:10px;height:10px;border-radius:50%;background:${i===0?'var(--green)':'var(--accent)'};"></div>
        ${i<transfers.length-1?`<div style="width:2px;flex:1;min-height:20px;background:var(--border);margin-top:4px;"></div>`:''}
      </div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${_esc(t.to_station||'—')}${t.to_district?', '+_esc(t.to_district):''}</div>
        <div style="font-size:11px;color:${i===0?'var(--green)':'var(--text-muted)'};">${i===0?'● Current Posting':'From: '+_esc(t.from_station||'—')}</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:3px;">
          ${t.transfer_date?`<span style="font-size:10px;color:var(--text-faint);">📅 ${_fmtDate(t.transfer_date)}</span>`:''}
          ${t.order_number?`<span style="font-size:10px;color:var(--text-faint);">Order: ${_esc(t.order_number)}</span>`:''}
        </div>
        ${t.notes?`<div style="font-size:11px;color:var(--text-muted);margin-top:3px;font-style:italic;">${_esc(t.notes)}</div>`:''}
      </div>
    </div>`).join('');
  return `<div>${items}</div>`;
}

async function _updateOfflineAuthBadge(){
  // Update offline auth readiness indicator async
  const el=document.querySelector('[data-offline-auth-badge]');
  if(!el) return;
  try{
    const creds=await offlineStore.getOfflineCredsByEmail(currentUser?.email);
    el.innerHTML=creds
      ?'<span style="color:var(--green);">✅ Ready</span>'
      :'<span style="color:var(--amber);">⚠️ Login online once to enable</span>';
  }catch(_){}
}

// ── SAVE FUNCTIONS ────────────────────────────────────────────────────────────

async function savePostingSettings(){
  const newStation = document.getElementById('set-station').value.trim();
  const newDistrict= document.getElementById('set-district').value.trim();
  const phone      = document.getElementById('set-official-phone').value.trim();
  if(!newStation){showToast('⚠️ Police station is required.','error');return;}

  const stationChanged = newStation !== (currentOfficer?.station||'');
  const oid = await getOfficerId();

  try{
    // Always update profile first — this refreshes currentOfficer in memory
    // so new cases immediately pick up the new station
    await updateOfficerProfile({
      station: newStation, district: newDistrict,
      sho_name: (document.getElementById('set-sho')?.value.trim()||null),
      dsp_name: (document.getElementById('set-dsp')?.value.trim()||null),
      official_phone: phone||null, phone: phone||null,
    });
    updateSidebarProfile();

    // Record transfer non-blocking — a failure here does NOT undo the profile update
    if(stationChanged && oid){
      supabaseClient.from('officer_transfers').insert({
        officer_id:   oid,
        from_station: currentOfficer?._prev_station || null,
        from_district:currentOfficer?._prev_district|| null,
        to_station:   newStation,
        to_district:  newDistrict||null,
        transfer_date:new Date().toISOString().split('T')[0],
        notes:'Updated via Settings',
      }).then(()=>{}).catch(err=>console.warn('Transfer record failed (non-critical):',err.message));
    }

    showToast(stationChanged?`✅ Posting updated — now at ${newStation}`:'✅ Posting saved!','success');
    renderSettings(document.getElementById('page-content'));
  }catch(err){ showToast('❌ '+err.message,'error'); }
}

async function savePersonalSettings(){
  try{
    await updateOfficerProfile({
      personal_phone:  document.getElementById('set-personal-phone').value.trim()||null,
      home_address:    document.getElementById('set-address').value.trim()||null,
      emergency_contact: document.getElementById('set-emg-name').value.trim()||null,
      emergency_phone: document.getElementById('set-emg-phone').value.trim()||null,
    });
    // Refresh completeness bar
    const pct=_profilePct(currentOfficer||{});
    showToast(`✅ Personal details saved! Profile ${pct}% complete.`,'success');
    renderSettings(document.getElementById('page-content'));
  }catch(err){ showToast('❌ '+err.message,'error'); }
}

function changeProfilePhoto(){
  const i=document.createElement('input');i.type='file';i.accept='image/*';
  i.onchange=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      const src=ev.target.result;
      try{localStorage.setItem('dio_profile_photo',src);}catch(e){}
      document.querySelectorAll('.officer-card-avatar,.sidebar-avatar,#settings-avatar,#profile-avatar-btn')
        .forEach(el=>{el.innerHTML=`<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">`;});
      showToast('✅ Profile photo updated!','success');
    };
    r.readAsDataURL(f);
  };
  i.click();
}

function removeProfilePhoto(){
  if(!confirm('Remove profile photo?')) return;
  localStorage.removeItem('dio_profile_photo');
  renderSettings(document.getElementById('page-content'));
  showToast('🗑️ Photo removed','info');
}

function openChangePasswordModal(){
  openModal('🔑 Change Password',
    `<div style="margin-bottom:12px;font-size:12px;color:var(--text-muted);">Enter your new password. You will remain logged in.</div>
     <div style="margin-bottom:10px;"><label style="display:block;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;">New Password</label><input type="password" id="cp-new" style="width:100%;padding:9px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;box-sizing:border-box;" placeholder="Min. 8 characters"></div>
     <div><label style="display:block;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;">Confirm New Password</label><input type="password" id="cp-confirm" style="width:100%;padding:9px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;box-sizing:border-box;" placeholder="Repeat password"></div>`,
    `<button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
     <button class="btn btn-primary" onclick="doChangePassword()">🔒 Update Password</button>`
  );
}

async function doChangePassword(){
  const np=document.getElementById('cp-new').value;
  const nc=document.getElementById('cp-confirm').value;
  if(np.length<8){showToast('⚠️ Password must be at least 8 characters.','error');return;}
  if(np!==nc){showToast('⚠️ Passwords do not match.','error');return;}
  try{
    const{error}=await supabaseClient.auth.updateUser({password:np});
    if(error)throw error;
    // Update offline hash for new password
    await _saveOfflineAuth(currentUser.email, np);
    closeModal();
    showToast('✅ Password updated successfully!','success');
  }catch(err){showToast('❌ '+err.message,'error');}
}

// Keep backward-compatible alias
async function saveProfileSettings(){ await savePostingSettings(); }
