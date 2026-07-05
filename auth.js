// ===================================================================
// AUTH SYSTEM — Login, Roles, Password Change
// ===================================================================

const AUTH = {
  _key: 'shingee_auth',
  _usersKey: 'shingee_users',

  // Default users
  getUsers(){
    const raw = localStorage.getItem(this._usersKey);
    if(raw) return JSON.parse(raw);
    // پہلی بار — default users
    const defaults = [
      { username: 'admin',  password: '1234', role: 'admin',  name: 'ایڈمن' },
      { username: 'worker', password: '1234', role: 'worker', name: 'کارکن' },
    ];
    localStorage.setItem(this._usersKey, JSON.stringify(defaults));
    return defaults;
  },

  saveUsers(users){
    localStorage.setItem(this._usersKey, JSON.stringify(users));
  },

  login(username, password){
    const users = this.getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if(!user) return false;
    const session = { ...user, loginTime: Date.now() };
    localStorage.setItem(this._key, JSON.stringify(session));
    return user;
  },

  logout(){
    localStorage.removeItem(this._key);
    location.reload();
  },

  getSession(){
    const raw = localStorage.getItem(this._key);
    if(!raw) return null;
    const session = JSON.parse(raw);
    // 8 گھنٹے بعد auto logout
    if(Date.now() - session.loginTime > 8 * 60 * 60 * 1000){
      localStorage.removeItem(this._key);
      return null;
    }
    return session;
  },

  isAdmin(){
    const s = this.getSession();
    return s && s.role === 'admin';
  },

  changePassword(username, oldPass, newPass){
    const users = this.getUsers();
    const idx = users.findIndex(u => u.username === username && u.password === oldPass);
    if(idx === -1) return false;
    users[idx].password = newPass;
    this.saveUsers(users);
    // Session بھی update کریں
    const session = this.getSession();
    if(session && session.username === username){
      session.password = newPass;
      localStorage.setItem(this._key, JSON.stringify(session));
    }
    return true;
  }
};

// ===================================================================
// LOGIN PAGE
// ===================================================================
function showLoginPage(){
  document.body.innerHTML = `
    <div style="
      min-height:100vh;
      background:linear-gradient(135deg,#1B5E20,#33691E);
      display:flex; align-items:center; justify-content:center;
      padding:20px; direction:rtl;
    ">
      <div style="
        background:white; border-radius:20px; padding:32px;
        width:100%; max-width:380px;
        box-shadow:0 20px 60px rgba(0,0,0,.25);
      ">
        <!-- Logo -->
        <div style="text-align:center; margin-bottom:24px;">
          <div style="font-size:3rem;">🌿</div>
          <div style="font-size:1.3rem; font-weight:800; color:#1B5E20; margin-top:8px;">
            Shingee Smart Dairy
          </div>
          <div style="font-size:.85rem; color:#757575;">& Livestock Farm</div>
          <div style="font-size:.75rem; color:#9E9E9E; margin-top:4px;">ملتان، پنجاب، پاکستان</div>
        </div>

        <!-- Error msg -->
        <div id="login-error" style="
          display:none; background:#FFEBEE; color:#B71C1C;
          padding:10px 14px; border-radius:8px; margin-bottom:16px;
          font-size:.88rem; font-weight:600; text-align:center;
          border-right:4px solid #B71C1C;
        "></div>

        <!-- Form -->
        <div style="margin-bottom:16px;">
          <label style="display:block; font-size:.85rem; font-weight:700; color:#424242; margin-bottom:6px;">
            👤 صارف
          </label>
          <select id="login-username" style="
            width:100%; padding:12px; border:2px solid #E0E0E0;
            border-radius:10px; font-size:1rem; font-family:inherit;
            background:white; color:#212121;
          ">
            <option value="admin">ایڈمن (مالک)</option>
            <option value="worker">کارکن</option>
          </select>
        </div>

        <div style="margin-bottom:24px;">
          <label style="display:block; font-size:.85rem; font-weight:700; color:#424242; margin-bottom:6px;">
            🔑 پاسورڈ
          </label>
          <div style="position:relative;">
            <input type="password" id="login-password"
              placeholder="پاسورڈ درج کریں"
              maxlength="20"
              style="
                width:100%; padding:12px; border:2px solid #E0E0E0;
                border-radius:10px; font-size:1.1rem; font-family:inherit;
                text-align:center; letter-spacing:4px;
              "
              onkeydown="if(event.key==='Enter') doLogin()"
            >
            <span onclick="togglePassVis()" style="
              position:absolute; left:12px; top:50%;
              transform:translateY(-50%); cursor:pointer; font-size:1.1rem;
            " id="pass-eye">👁️</span>
          </div>
        </div>

        <button onclick="doLogin()" style="
          width:100%; padding:14px;
          background:linear-gradient(135deg,#1B5E20,#2E7D32);
          color:white; border:none; border-radius:10px;
          font-size:1.05rem; font-weight:700; font-family:inherit;
          cursor:pointer; box-shadow:0 4px 15px rgba(27,94,32,.3);
        ">
          داخل ہوں →
        </button>

        <div style="text-align:center; margin-top:16px; font-size:.75rem; color:#9E9E9E;">
          پہلی بار: پاسورڈ 1234 ہے
        </div>
      </div>
    </div>
  `;

  setTimeout(() => document.getElementById('login-password')?.focus(), 100);
}

function togglePassVis(){
  const inp = document.getElementById('login-password');
  const eye = document.getElementById('pass-eye');
  if(inp.type === 'password'){
    inp.type = 'text';
    eye.textContent = '🙈';
  } else {
    inp.type = 'password';
    eye.textContent = '👁️';
  }
}

function doLogin(){
  const username = document.getElementById('login-username').value;
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');

  if(!password){
    errEl.textContent = 'پاسورڈ درج کریں';
    errEl.style.display = 'block';
    return;
  }

  const user = AUTH.login(username, password);
  if(!user){
    errEl.textContent = '❌ غلط پاسورڈ — دوبارہ کوشش کریں';
    errEl.style.display = 'block';
    document.getElementById('login-password').value = '';
    document.getElementById('login-password').focus();
    return;
  }

  // Login کامیاب — صفحہ reload
  location.reload();
}

// ===================================================================
// PASSWORD CHANGE MODAL
// ===================================================================
function openChangePassword(){
  const session = AUTH.getSession();
  const bodyHtml = `
    <div class="form-group">
      <label class="form-label">پرانا پاسورڈ</label>
      <input type="password" class="form-control" id="cp-old" placeholder="پرانا پاسورڈ">
    </div>
    <div class="form-group">
      <label class="form-label">نیا پاسورڈ</label>
      <input type="password" class="form-control" id="cp-new" placeholder="نیا پاسورڈ">
    </div>
    <div class="form-group">
      <label class="form-label">نیا پاسورڈ دوبارہ</label>
      <input type="password" class="form-control" id="cp-confirm" placeholder="تصدیق کریں">
    </div>
    <div id="cp-error" style="display:none;" class="alert alert-danger"></div>
  `;
  showModal({
    title: '🔑 پاسورڈ تبدیل کریں',
    bodyHtml,
    actions: [
      { label:'منسوخ', class:'btn-outline', onClick: closeModal },
      { label:'تبدیل کریں', class:'btn-primary', onClick: () => {
          const old = document.getElementById('cp-old').value;
          const nw = document.getElementById('cp-new').value;
          const confirm = document.getElementById('cp-confirm').value;
          const errEl = document.getElementById('cp-error');

          if(!old || !nw || !confirm){
            errEl.textContent = 'تمام خانے پُر کریں';
            errEl.style.display = 'block'; return;
          }
          if(nw !== confirm){
            errEl.textContent = 'نیا پاسورڈ مطابقت نہیں رکھتا';
            errEl.style.display = 'block'; return;
          }
          if(nw.length < 4){
            errEl.textContent = 'پاسورڈ کم از کم 4 حروف کا ہونا چاہیے';
            errEl.style.display = 'block'; return;
          }

          const ok = AUTH.changePassword(session.username, old, nw);
          if(!ok){
            errEl.textContent = 'پرانا پاسورڈ غلط ہے';
            errEl.style.display = 'block'; return;
          }
          closeModal();
          toast('✅ پاسورڈ کامیابی سے تبدیل ہو گیا');
        }
      }
    ]
  });
}
