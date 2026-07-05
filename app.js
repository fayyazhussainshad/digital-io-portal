// ===================================================================
// APP BOOTSTRAP — Auth + Data Sync
// ===================================================================
document.addEventListener('DOMContentLoaded', async () => {

  // سب سے پہلے login چیک کریں
  const session = AUTH.getSession();
  if(!session){
    showLoginPage();
    return;
  }

  // Login ہو چکا ہے — app چلائیں
  seedIfEmpty();
  initSidebar();
  updateTopbarDate();
  showUserInfo(session);
  showConnectionBanner();

  if(SUPABASE_READY){
    try{
      await DB.pullFromCloud();
      if(!localStorage.getItem('shingee_pushed_to_cloud')){
        await DB.pushLocalToCloud();
      }
    } catch(e){ console.warn("Sync error:", e); }
  }

  handleRoute();
});

function showUserInfo(session){
  // Topbar میں user info اور logout بٹن
  const topbar = document.getElementById('topbar');
  const userDiv = document.createElement('div');
  userDiv.style.cssText = 'display:flex;align-items:center;gap:8px;';
  userDiv.innerHTML = `
    <span style="font-size:.78rem;opacity:.85;">
      ${session.role === 'admin' ? '👑' : '👷'} ${session.name}
    </span>
    <button onclick="openChangePassword()" style="
      background:rgba(255,255,255,.15); border:none; color:white;
      padding:4px 8px; border-radius:6px; font-size:.75rem; cursor:pointer;
    ">🔑</button>
    <button onclick="AUTH.logout()" style="
      background:rgba(255,255,255,.15); border:none; color:white;
      padding:4px 8px; border-radius:6px; font-size:.75rem; cursor:pointer;
    ">خروج</button>
  `;
  topbar.appendChild(userDiv);

  // Worker کے لیے کچھ buttons disable کریں
  if(session.role === 'worker'){
    // Worker صرف milk اور feed enter کر سکتا ہے
    document.querySelectorAll('.nav-link').forEach(link => {
      const page = link.dataset.page;
      const restricted = ['breeding','calving','vaccination','deworming','treatment','income','expenses','profit'];
      if(restricted.includes(page)){
        link.style.opacity = '.5';
        link.style.pointerEvents = 'none';
        link.title = 'صرف ایڈمن کے لیے';
      }
    });
  }
}
