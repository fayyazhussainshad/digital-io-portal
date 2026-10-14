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
  } catch(_) { /* parhna na ho sake to pehle wali/khali qadr rahe */ }

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
      <label style="${lbl}">${label}</label>
      <div style="${ro}padding:9px 12px;border-radius:6px;background:var(--bg-tertiary);border:1px solid var(--border);font-size:13px;color:var(--text-secondary);">
        ${val || '<span style="color:var(--text-faint);">ایڈمن نے درج نہیں کیا</span>'}
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
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;"></div>
    <div><div class="page-title">ترتیبات و پروفائل</div>
    <div class="page-subtitle">آپ کا سرکاری ریکارڈ — ڈیٹابیس سے خودکار مطابقت</div></div>
  </div>

  <!-- ── PROFILE HEADER ─────────────────────────────────── -->
  <div class="card" style="margin-bottom:16px;padding:20px;">
    <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;direction:rtl;">
      <!-- Name + role — RIGHT side (sidebar side) -->
      <div style="flex:1;text-align:right;">
        <div style="font-size:22px;font-weight:800;color:var(--text-primary);font-family:'Jameel Noori Nastaleeq',serif;">${_esc(o.full_name||'افسر کا نام')}</div>
        <div style="font-size:13px;color:var(--text-secondary);margin-top:2px;">${_esc(o.designation||'—')} &nbsp;·&nbsp; محکمانہ نمبر <span style="direction:ltr;unicode-bidi:embed;display:inline-block;">${_esc(o.badge_number||'—')}</span></div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">تھانہ ${_esc(o.station||'—')}, ضلع ${_esc(o.district||'—')}</div>
      </div>
      <!-- Profile completeness -->
      <div style="text-align:center;min-width:90px;">
        <div style="font-size:26px;font-weight:800;color:${pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)'};">${pct}%</div>
        <div style="font-size:10px;color:var(--text-muted);">پروفائل مکمل</div>
        <div style="height:6px;background:var(--bg-tertiary);border-radius:3px;margin-top:6px;overflow:hidden;">
          <div style="height:100%;width:${pct}%;background:${pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)'};border-radius:3px;"></div>
        </div>
      </div>
      <!-- Avatar — LEFT side (opposite to sidebar) -->
      <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,var(--accent-dark),var(--accent));flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;overflow:hidden;cursor:pointer;border:3px solid var(--accent);" id="profile-avatar-btn" onclick="changeProfilePhoto()" title="تصویر تبدیل کریں">
        ${avatarHtml}
      </div>
    </div>
  </div>

  <!-- FONT SIZE CARD hata diya gaya (user ki hidayat) — poora system ab
       aik hi معیاری size (16px) par. Neeche security card se jari. -->

  <!-- ── SECURITY CARD (below name card) ─────────────────── -->
  <div class="card" style="margin-bottom:16px;">
    <div class="card-title" style="margin-bottom:12px;">سیکیورٹی</div>
    <div style="display:flex;flex-direction:column;gap:8px;font-size:12px;">
      <div style="display:flex;align-items:center;gap:8px;"><svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="#1d7a4c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M4 10.5l4 4 8-9"/></svg> MFA فعال ہے</div>
      <div style="display:flex;align-items:center;gap:8px;"><svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="#1d7a4c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M4 10.5l4 4 8-9"/></svg> آڈٹ لاگنگ فعال ہے</div>
      <div style="display:flex;align-items:center;gap:8px;"><svg viewBox="0 0 20 20" width="14" height="14" fill="none" stroke="#1d7a4c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none"><path d="M4 10.5l4 4 8-9"/></svg> ڈیٹا خفیہ کردہ ہے</div>
    </div>
    <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border);">
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;"><span dir="ltr" style="unicode-bidi:isolate;display:inline-block;">${_esc(currentUser?.email||'—')}</span></div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-secondary btn-sm" onclick="openChangePasswordModal()">پاسورڈ تبدیل کریں</button>
        ${(typeof window.isBiometricEnabled === 'function' && window.isBiometricEnabled())
          ? `<button class="btn btn-secondary btn-sm" onclick="disableBiometric()">بایومیٹرک بند کریں</button>`
          : `<button class="btn btn-secondary btn-sm" onclick="enableBiometric()">بایومیٹرک فعال کریں</button>`}
        <button class="btn btn-secondary btn-sm" onclick="_setupPin()"><span dir="ltr">PIN</span> سیٹ کریں</button>
        <button class="btn btn-secondary btn-sm" onclick="window.dioLockPinSettings&&dioLockPinSettings()">ایپ لاک <span dir="ltr">PIN</span></button>
        <button class="btn btn-secondary btn-sm" onclick="showOnboardingAgain()">گائیڈ دوبارہ دیکھیں</button>
      </div>
      <div style="font-size:10px;color:var(--text-muted);margin-top:6px;">${(typeof window.isBiometricEnabled === 'function' && window.isBiometricEnabled())
        ? 'بایومیٹرک اس ڈیوائس پر فعال ہے۔ لاگ آؤٹ اس ڈیوائس پر "تالا" کی طرح کام کرے گا؛ مکمل لاگ آؤٹ کے لیے پہلے بایومیٹرک اور PIN بند کریں۔'
        : 'بایومیٹرک فعال کرنے سے آپ فنگرپرنٹ/فیس سے لاگ ان کر سکیں گے'}</div>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;direction:rtl;">

    <!-- RIGHT COLUMN (sidebar side) ───────────────────────── -->
    <div>

      <!-- SECTION 1: Official Details (Urdu, correct order) -->
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title" style="margin-bottom:16px;">افسر کی معلومات
          <span style="font-size:11px;color:var(--text-faint);font-weight:400;margin-right:8px;">تبدیلی کے لیے ایڈمن سے رابطہ کریں</span>
        </div>
        ${roField('پورا نام', o.full_name)}
        ${roField('رینک / عہدہ', o.designation)}
        ${roField('محکمانہ نمبر', o.badge_number)}
        ${roField('سیل نمبر', o.official_phone||o.phone)}
        ${roField('شناختی کارڈ نمبر', _cnicShow(o))}
        ${roField('ای میل ایڈریس', currentUser?.email ? '<span dir="ltr" style="unicode-bidi:isolate;display:inline-block;">'+_esc(currentUser.email)+'</span>' : '')}
        <div style="margin-top:8px;padding:8px 12px;background:var(--accent-glow);border-radius:6px;font-size:11px;color:var(--text-muted);direction:rtl;text-align:right;">
          یہ خانے ڈسٹرکٹ ایڈمن سیٹ کرتا ہے۔ تبدیلی کے لیے ایڈمن پینل سے رابطہ کریں۔
        </div>
      </div>

    </div>

    <!-- LEFT COLUMN ────────────────────────────────────────── -->
    <div>

      <!-- Profile Photo -->
      <div class="card" style="margin-bottom:16px;text-align:center;padding:20px;">
        <div class="card-title" style="margin-bottom:16px;text-align:right;">پروفائل تصویر</div>
        <div style="width:110px;height:110px;border-radius:50%;background:linear-gradient(135deg,var(--accent-dark),var(--accent));margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;color:#fff;overflow:hidden;border:3px solid var(--accent);" id="settings-avatar">
          ${avatarHtml}
        </div>
        <button class="btn btn-secondary btn-sm" onclick="changeProfilePhoto()">تصویر تبدیل کریں</button>
        ${photoSrc ? `<br><button class="btn btn-danger btn-sm" onclick="removeProfilePhoto()" style="margin-top:6px;">تصویر ہٹائیں</button>` : ''}
      </div>

      <!-- Current Posting (editable) — no cell number -->
      <div class="card" style="margin-bottom:16px;">
        <div class="card-title" style="margin-bottom:4px;">موجودہ تعیناتی</div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:16px;direction:rtl;text-align:right;">تھانہ/ضلع تبدیل کرنے سے ٹرانسفر درج ہو گا</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;direction:rtl;margin-bottom:10px;">
          ${edField('تھانہ', 'set-station', o.station, 'مثلاً سیتل ماڑی')}
          ${edField('ضلع', 'set-district', o.district, 'مثلاً ملتان')}
        </div>
        <button class="btn btn-primary" onclick="savePostingSettings()" style="margin-top:4px;">تعیناتی محفوظ کریں</button>
      </div>

      <!-- Employment History -->
      <div class="card">
        <div class="card-title" style="margin-bottom:4px;">ملازمت کی تاریخ
          
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-bottom:14px;">تمام تھانوں کی مکمل تاریخ</div>
        ${_renderTransferTimeline(transfers, o)}
      </div>

    </div>
  </div>`;

  // Async: update offline auth status display
  _updateOfflineAuthBadge();
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

function _esc(s){ return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

/* ── شناختی کارڈ نمبر — دو کالم کا مسئلہ ─────────────────────────────
   ڈیٹابیس میں CNIC کے **دو** کالم موجود ہیں: `cnic` اور `cnic_number`۔
   رجسٹریشن (auth.js) `cnic` میں لکھتی ہے — ڈیشوں کے ساتھ۔
   یہ صفحہ پہلے صرف `cnic_number` پڑھتا تھا — یعنی جو لکھا گیا وہ کبھی
   دکھایا ہی نہیں گیا، اور خانہ ہمیشہ "ایڈمن نے درج نہیں کیا" رہتا تھا۔
   اب دونوں کالم دیکھے جاتے ہیں، اور دونوں شکلیں (13 ہندسے یا ڈیشوں
   والی) درست دکھتی ہیں۔
   ──────────────────────────────────────────────────────────────────── */
function _cnicShow(o){
  const raw = String((o && (o.cnic_number || o.cnic)) || '').trim();
  if (!raw) return '';
  const d = raw.replace(/\D/g, '');
  const txt = (d.length === 13) ? d.replace(/(\d{5})(\d{7})(\d)/, '$1-$2-$3') : raw;
  return '<span dir="ltr" style="unicode-bidi:isolate;display:inline-block;">' + _esc(txt) + '</span>';
}
function _fmtDate(iso){ if(!iso)return''; const p=iso.substring(0,10).split('-'); return p.length===3?`${p[2]}/${p[1]}/${p[0]}`:iso; }

function _profilePct(o){
  const fields=[o.full_name,o.badge_number,o.designation,o.station,o.district,
    o.official_phone||o.phone,o.cnic_number||o.cnic];
  return Math.round(fields.filter(f=>f&&String(f).trim()).length/fields.length*100);
}

function _renderTransferTimeline(transfers, o){
  if(!transfers.length){
    // Show current posting as the only entry
    return `<div style="display:flex;gap:12px;direction:rtl;align-items:flex-start;">
      <div style="width:10px;height:10px;border-radius:50%;background:var(--green);flex-shrink:0;margin-top:4px;"></div>
      <div>
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${_esc(o.station||'—')}, ${_esc(o.district||'—')}</div>
        <div style="font-size:11px;color:var(--green);">موجودہ تعیناتی</div>
        ${!navigator.onLine?'<div style="font-size:10px;color:var(--text-faint);margin-top:2px;">مکمل تاریخ دیکھنے کے لیے انٹرنیٹ درکار ہے</div>':''}
      </div>
    </div>`;
  }
  const items=transfers.map((t,i)=>`
    <div style="display:flex;gap:12px;direction:rtl;align-items:flex-start;padding-bottom:${i<transfers.length-1?'14px':'0'};${i<transfers.length-1?'border-bottom:1px solid var(--border-light);margin-bottom:14px;':''}">
      <div style="display:flex;flex-direction:column;align-items:center;flex-shrink:0;">
        <div style="width:10px;height:10px;border-radius:50%;background:${i===0?'var(--green)':'var(--accent)'};"></div>
        ${i<transfers.length-1?`<div style="width:2px;flex:1;min-height:20px;background:var(--border);margin-top:4px;"></div>`:''}
      </div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:600;color:var(--text-primary);">${_esc(t.to_station||'—')}${t.to_district?', '+_esc(t.to_district):''}</div>
        <div style="font-size:11px;color:${i===0?'var(--green)':'var(--text-muted)'};">${i===0?'موجودہ تعیناتی':'سابقہ: '+_esc(t.from_station||'—')}</div>
        <div style="display:flex;gap:10px;direction:rtl;flex-wrap:wrap;margin-top:3px;">
          ${t.transfer_date?`<span style="font-size:10px;color:var(--text-faint);" dir="ltr">${_fmtDate(t.transfer_date)}</span>`:''}
          ${t.order_number?`<span style="font-size:10px;color:var(--text-faint);">آرڈر نمبر <span dir="ltr" style="unicode-bidi:isolate;">${_esc(t.order_number)}</span></span>`:''}
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
      ?'<span style="color:var(--green);">تیار</span>'
      :'<span style="color:var(--amber);">ایک بار آن لائن لاگ ان کریں</span>';
  }catch(_){ /* ikhtiyari qadam — na ho sake to chhoR do */ }
}

// ── SAVE FUNCTIONS ────────────────────────────────────────────────────────────

async function savePostingSettings(){
  // AHEM: `set-official-phone` is markup me MOJOOD NAHI (cell number
  // jaan bujh kar hataya gaya tha) — pehle yahan seedha .value liya ja
  // raha tha, is liye null par TypeError aata tha aur "تعیناتی محفوظ
  // کریں" button bilkul kaam nahi karta tha. Ab mehfooz tareeqe se.
  const _v = id => { const el = document.getElementById(id); return el ? String(el.value||'').trim() : ''; };
  const newStation = _v('set-station');
  const newDistrict= _v('set-district');
  const phone      = _v('set-official-phone');
  if(!newStation){showToast('تھانہ درج کرنا ضروری ہے۔','error');return;}

  const stationChanged = newStation !== (currentOfficer?.station||'');
  const oid = await getOfficerId();

  try{
    // Always update profile first — this refreshes currentOfficer in memory
    // so new cases immediately pick up the new station
    await updateOfficerProfile({
      station: newStation, district: newDistrict,
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
        notes:'ترتیبات سے درج کیا گیا',
      }).then(()=>{}).catch(err=>console.warn('Transfer record failed (non-critical):',err.message));
    }

    showToast(stationChanged?`تعیناتی اپ ڈیٹ ہو گئی — ${newStation}`:'تعیناتی محفوظ ہو گئی۔','success');
    renderSettings(document.getElementById('page-content'));
  }catch(err){ showToast(err.message,'error'); }
}

function changeProfilePhoto(){
  const i=document.createElement('input');i.type='file';i.accept='image/*';
  i.onchange=e=>{
    const f=e.target.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      // Compress via canvas before saving (keep small for DB)
      const img=new Image();
      img.onload=async()=>{
        const canvas=document.createElement('canvas');
        const max=400, scale=Math.min(1,max/img.width);
        canvas.width=img.width*scale; canvas.height=img.height*scale;
        canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
        const src=canvas.toDataURL('image/jpeg',0.7);
        try{localStorage.setItem('dio_profile_photo',src);localStorage.setItem('officer_photo_url',src);}catch(e){ /* storage band/bhara ho (private mode/quota) — ye qadam chhoR do */ }
        // Save to Supabase officer record (persists across devices/logins)
        // v546: نتیجہ دیکھ کر صاف پیغام؛ انٹرنیٹ نہ ہو تو قطار میں (خود sync)
        let _phRes = null;
        try{
          const oid=await getOfficerId();
          _phRes = await dioSaveRow('officers','update',{id:oid,profile_photo:src});
          if(currentOfficer) currentOfficer.profile_photo=src;
        }catch(_){ _phRes = { status:'error', error:_ }; if (typeof dioLogError === 'function') dioLogError('profile photo: server save nakaam', _); }
        if (typeof updateSidebarProfile === 'function') updateSidebarProfile();
        document.querySelectorAll('.officer-card-avatar,.sidebar-avatar,#settings-avatar,#profile-avatar-btn,#sidebar-avatar,#topbar-avatar,#dash-welcome-avatar')
          .forEach(el=>{el.innerHTML=`<img src="${src}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" alt="">`;});
        dioSaveToast(_phRes, 'پروفائل تصویر', { ok: 'محفوظ ہو گئی', fail: 'محفوظ نہیں ہوئی' });
      };
      img.src=ev.target.result;
    };
    r.readAsDataURL(f);
  };
  i.click();
}

function removeProfilePhoto(){
  if(!confirm('کیا پروفائل تصویر ہٹا دی جائے؟')) return;
  localStorage.removeItem('dio_profile_photo');
  // v546: نتیجہ آنے کے بعد پیغام — پہلے سرور ناکام ہونے پر بھی «ہٹا دی گئی» آتا تھا
  if(currentOfficer) currentOfficer.profile_photo=null;
  renderSettings(document.getElementById('page-content'));
  (async()=>{
    let res;
    try{ const oid=await getOfficerId(); res = await dioSaveRow('officers','update',{id:oid,profile_photo:null}); }
    catch(_){ res = { status:'error', error:_ }; if (typeof dioLogError === 'function') dioLogError('profile photo: server se hatana nakaam', _); }
    dioSaveToast(res, 'پروفائل تصویر', { ok: 'ہٹا دی گئی', fail: 'ہٹائی نہیں جا سکی', local: 'اس آلے سے ہٹا دی گئی' });
  })();
}

function openChangePasswordModal(){
  openModal('پاسورڈ تبدیل کریں',
    `<div style="margin-bottom:12px;font-size:12px;color:var(--text-muted);">نیا پاسورڈ درج کریں۔ آپ لاگ ان ہی رہیں گے۔</div>
     <div style="margin-bottom:10px;"><label style="display:block;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;">نیا پاسورڈ</label><input type="password" id="cp-new" style="width:100%;padding:9px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;box-sizing:border-box;" placeholder="کم از کم 8 حروف"></div>
     <div><label style="display:block;font-size:11px;color:var(--text-muted);margin-bottom:4px;font-weight:600;">نیا پاسورڈ دوبارہ</label><input type="password" id="cp-confirm" style="width:100%;padding:9px 12px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;box-sizing:border-box;" placeholder="دوبارہ درج کریں"></div>`,
    `<div style="display:flex;gap:8px;direction:rtl;justify-content:flex-start;"><button class="btn btn-secondary" onclick="closeModal()">منسوخ</button>
     <button class="btn btn-primary" onclick="doChangePassword()">پاسورڈ اپ ڈیٹ کریں</button>`
  );
}

async function doChangePassword(){
  const np=document.getElementById('cp-new').value;
  const nc=document.getElementById('cp-confirm').value;
  if(np.length<8){showToast('پاسورڈ کم از کم 8 حروف کا ہونا چاہیے۔','error');return;}
  if(np!==nc){showToast('دونوں پاسورڈ ایک جیسے نہیں۔','error');return;}
  try{
    const{error}=await supabaseClient.auth.updateUser({password:np});
    if(error)throw error;
    // v538: آف لائن ریکارڈ نئے پاس ورڈ سے — پہلے یہاں ایک غیر موجود فنکشن
    //   (_saveOfflineAuth) تھا: پاس ورڈ سرور پر بدل جاتا مگر افسر کو غلطی
    //   کا پیغام ملتا اور آف لائن پرانا پاس ورڈ ہی چلتا رہتا۔
    try { if (typeof window._dioSavePwVerifier === 'function') await window._dioSavePwVerifier(currentUser && currentUser.email, np); } catch (_) { /* ikhtiyari qadam — na ho sake to chhoR do */ }
    closeModal();
    showToast('پاسورڈ تبدیل ہو گیا۔','success');
  }catch(err){showToast(err.message,'error');}
}

// Keep backward-compatible alias
function _pickFontSize(key) {
  if (typeof setFontSize === 'function') setFontSize(key);
  // Update button highlight without full re-render
  document.querySelectorAll('#dio-font-size-btns [data-fs]').forEach(btn => {
    const on = btn.getAttribute('data-fs') === key;
    btn.style.border = '2px solid ' + (on ? 'var(--accent)' : 'var(--border)');
    btn.style.background = on ? 'var(--accent-bg,rgba(56,189,248,0.12))' : 'var(--bg-tertiary)';
  });
  const labels = { small:'چھوٹا', medium:'درمیانہ', large:'بڑا', xlarge:'بہت بڑا' };
  if (typeof showToast === 'function') showToast('فونٹ سائز: ' + (labels[key]||key), 'success');
}
window._pickFontSize = _pickFontSize;
