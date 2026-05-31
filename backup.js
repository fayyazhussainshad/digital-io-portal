/* ═══════════════════════════════════════════════════════════
   DIGITAL IO — BACKUP & SYNC TAB
   Device backup, Google Drive connect, Supabase cloud status.
   ═══════════════════════════════════════════════════════════ */

// ── BACKUP PAGE ──
registerPage('backup',renderBackupPage);
function renderBackupPage(container){container.innerHTML=`<div class="page-header"><div class="page-title">☁️ Backup & Multi-Cloud Sync</div><button class="btn btn-primary" onclick="triggerBackupNow()">🔄 Backup Now</button></div><div class="backup-dest-grid"><div class="card"><div class="card-title">💾 DEVICE BACKUP</div><div style="text-align:center;padding:10px 0;"><div style="font-size:36px;margin-bottom:8px;">💾</div><div style="font-size:12px;font-weight:600;">Local Device</div><div style="font-size:10px;color:var(--green);margin-top:4px;">✅ Always Available Offline</div></div><button class="btn btn-secondary btn-sm" style="width:100%;margin-top:8px;" onclick="triggerBackupNow()">💾 Backup Now</button><button class="btn btn-secondary btn-sm" style="width:100%;margin-top:4px;" onclick="restoreFromLocalBackup()">📂 Restore</button></div><div class="card"><div class="card-title">🟢 GOOGLE DRIVE</div><div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;">Connect for automatic real-time cloud backup.</div><button class="btn btn-primary btn-sm" style="width:100%;" onclick="connectGoogleDrive()">🔗 Connect Google Drive</button></div><div class="card"><div class="card-title">☁️ SUPABASE CLOUD</div><div style="font-size:12px;color:var(--green);margin-bottom:8px;">✅ Active</div><div style="font-size:10px;color:var(--text-muted);">• Daily automatic backups<br>• AES-256 encryption<br>• Accessible from any device</div></div></div>`;}

