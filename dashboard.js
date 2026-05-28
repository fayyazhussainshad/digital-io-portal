// ═══════════════════════════════════════════════════
//  DIGITAL IO — DASHBOARD PAGE
// ═══════════════════════════════════════════════════

registerPage('dashboard', renderDashboard);

async function renderDashboard(container) {
  const stats = await getDashboardStats();
  const officer = currentOfficer || {};

  const initials = officer.full_name
    ? officer.full_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : 'IO';

  const photoSrc = localStorage.getItem('dio_profile_photo');
  const avatarHTML = photoSrc
    ? `<img src="${photoSrc}" alt="">`
    : initials;

  container.innerHTML = `
    <!-- News Ticker -->
    <div class="news-ticker-wrap">
      <span class="news-ticker-text" id="news-ticker">Loading latest updates...</span>
    </div>

    <!-- Officer Card -->
    <div class="officer-card">
      <div class="officer-card-avatar">${avatarHTML}</div>
      <div style="flex:1;">
        <div class="officer-card-name">${officer.full_name || 'Officer'}</div>
        <div class="officer-card-meta">
          <span>🏛️ <b>${officer.station || '—'}</b></span>
          <span>📍 <b>${officer.district || '—'}</b></span>
          <span>🆔 <b>${officer.badge_number || '—'}</b></span>
          <span>👮 <b>${officer.designation || 'IO'}</b></span>
        </div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;color:var(--text-muted);margin-bottom:4px;">ENTRUSTED CASES</div>
        <div style="font-size:40px;font-weight:900;color:var(--accent);font-family:var(--font-display);">${stats.total}</div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card stat-blue" onclick="showPage('cases',null)">
        <div class="stat-num">${stats.total}</div>
        <div class="stat-label">Entrusted</div>
      </div>
      <div class="stat-card stat-green" onclick="showPage('cases',null)">
        <div class="stat-num">${stats.complete}</div>
        <div class="stat-label">Challan Complete</div>
      </div>
      <div class="stat-card stat-amber" onclick="showPage('cases',null)">
        <div class="stat-num">${stats.incomplete}</div>
        <div class="stat-label">Incomplete</div>
      </div>
      <div class="stat-card stat-purple" onclick="showPage('cases',null)">
        <div class="stat-num">${stats.untrace}</div>
        <div class="stat-label">Untraced</div>
      </div>
      <div class="stat-card stat-red" onclick="showPage('cases',null)">
        <div class="stat-num">${stats.cancel}</div>
        <div class="stat-label">Cancelled</div>
      </div>
    </div>

    <!-- Info Row -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px;">
      <!-- Clock -->
      <div class="card">
        <div class="card-title">🕐 Current Time</div>
        <div style="font-size:32px;font-weight:800;color:var(--accent);font-family:var(--font-mono);" id="dash-clock">--:--:--</div>
        <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;" id="dash-date">Loading...</div>
      </div>

      <!-- Weather -->
      <div class="card">
        <div class="card-title">🌤️ Lahore Weather</div>
        <div style="font-size:28px;font-weight:700;color:var(--amber);">38°C</div>
        <div style="font-size:11px;color:var(--text-secondary);margin-top:4px;">Partly Cloudy · Humidity: 45%</div>
        <div style="font-size:10px;color:var(--text-faint);margin-top:2px;">Wind: 12 km/h NW</div>
      </div>

      <!-- Backup Status -->
      <div class="card">
        <div class="card-title">☁️ Backup Status</div>
        ${getBackupStatusHTML()}
      </div>
    </div>

    <!-- Reminders & Tools -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
      <!-- Pending Reminders -->
      <div class="card">
        <div class="card-title" style="display:flex;justify-content:space-between;">
          🔔 Pending Reminders
          <a onclick="showPage('reminders',null)" style="font-size:10px;">View All →</a>
        </div>
        ${stats.reminders.length === 0
          ? `<div style="font-size:12px;color:var(--text-muted);padding:10px 0;">✅ No pending reminders</div>`
          : stats.reminders.map(r => `
              <div class="reminder-item">
                <div class="reminder-dot" style="background:${r.priority==='high'?'var(--red)':r.priority==='medium'?'var(--amber)':'var(--accent)'}"></div>
                <div class="reminder-text">${r.text}</div>
                <div class="reminder-date">${formatDate(r.reminder_date)}</div>
              </div>`).join('')}
      </div>

      <!-- Mind Refresh Tools -->
      <div class="card">
        <div class="card-title">🧩 Mind-Refresh Tools</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px;">
          <div class="mini-tool" onclick="openQuiz()">
            <div style="font-size:24px;margin-bottom:4px;">🧠</div>
            <div style="font-size:10px;color:var(--text-muted);">Legal Quiz</div>
          </div>
          <div class="mini-tool" onclick="openPuzzle()">
            <div style="font-size:24px;margin-bottom:4px;">🔢</div>
            <div style="font-size:10px;color:var(--text-muted);">Logic Puzzle</div>
          </div>
          <div class="mini-tool" onclick="openTimer()">
            <div style="font-size:24px;margin-bottom:4px;">⏱️</div>
            <div style="font-size:10px;color:var(--text-muted);">Focus Timer</div>
          </div>
        </div>
        <div style="padding:10px;background:var(--bg-tertiary);border-radius:8px;font-size:11px;color:var(--text-muted);text-align:center;">
          💡 <em>Article 10-A: Right to fair trial is guaranteed under the Constitution of Pakistan</em>
        </div>
      </div>
    </div>

    <!-- Recent Cases -->
    <div class="card">
      <div class="card-title" style="display:flex;justify-content:space-between;">
        📁 Recent Cases
        <a onclick="showPage('cases',null)" style="font-size:10px;">View All →</a>
      </div>
      ${stats.cases.length === 0
        ? `<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12px;">No cases yet. <a onclick="showPage('cases',null)">Add your first case →</a></div>`
        : `<table class="data-table">
            <thead><tr>
              <th>FIR No.</th><th>Accused</th><th>Section</th><th>Status</th><th>Date</th>
            </tr></thead>
            <tbody>
              ${stats.cases.slice(0,5).map(c => `<tr>
                <td><span class="fir-num" onclick="viewCase('${c.id}')">${c.fir_number}</span></td>
                <td style="color:var(--text-primary);">${c.accused_name || '—'}</td>
                <td style="color:var(--text-muted);font-size:11px;">${c.section_of_law || '—'}</td>
                <td><span class="pill ${STATUS_CLASSES[c.status] || 'pill-blue'}">${STATUS_LABELS[c.status] || c.status}</span></td>
                <td style="color:var(--text-faint);font-size:11px;">${formatDate(c.created_at)}</td>
              </tr>`).join('')}
            </tbody>
          </table>`}
    </div>`;

  // Mini tool card styles inline
  document.querySelectorAll('.mini-tool').forEach(el => {
    el.style.cssText = `background:var(--bg-secondary);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;text-align:center;cursor:pointer;transition:all 0.15s;`;
    el.onmouseenter = () => { el.style.borderColor = 'var(--accent)'; };
    el.onmouseleave = () => { el.style.borderColor = 'var(--border)'; };
  });

  // Start clock
  startDashboardClock();

  // Start news ticker
  setTimeout(startNewsTicker, 100);
}

function getBackupStatusHTML() {
  const status = getBackupStatus();
  const lastBackupStr = status.lastBackup
    ? status.lastBackup.toLocaleTimeString('en-PK')
    : localStorage.getItem(`dio_backup_${currentUser?.id}_time`)
      ? `Saved ${timeAgo(localStorage.getItem(`dio_backup_${currentUser?.id}_time`))}`
      : 'Not yet backed up';

  return `
    <div style="font-size:12px;margin-bottom:6px;">
      <span style="color:${status.googleDriveConnected ? 'var(--green)' : 'var(--amber)'};">
        ${status.googleDriveConnected ? '✅ Google Drive Connected' : '⚠️ Google Drive Not Connected'}
      </span>
    </div>
    <div style="font-size:11px;color:var(--text-muted);">Last backup: <span style="color:var(--accent);">${lastBackupStr}</span></div>
    <button class="btn btn-secondary btn-sm" style="margin-top:8px;width:100%;" onclick="showPage('backup',null)">☁️ Manage Backups</button>`;
}

function startDashboardClock() {
  function tick() {
    const clockEl = document.getElementById('dash-clock');
    const dateEl = document.getElementById('dash-date');
    if (!clockEl) return;
    const now = new Date();
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    clockEl.textContent = now.toLocaleTimeString('en-PK', { hour12: false });
    dateEl.textContent = `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
  }
  tick();
  setInterval(tick, 1000);
}

// ── Mini Tools ──
const quizzes = [
  { q: 'Under which section of CrPC can police call a witness for questioning?', opts: ['Section 54', 'Section 160', 'Section 164'], ans: 'B — Section 160 CrPC (Talbi)' },
  { q: 'What is the punishment for murder under PPC?', opts: ['7 years', '10-14 years', 'Death or life imprisonment'], ans: 'C — Section 302 PPC' },
  { q: 'Under which section is a confession before magistrate recorded?', opts: ['Section 160', 'Section 161', 'Section 164'], ans: 'C — Section 164 CrPC' },
  { q: 'What is the time limit for sending a case diary to the magistrate?', opts: ['24 hours', '48 hours', 'No limit'], ans: 'A — 24 hours under CrPC' },
];
let quizIndex = 0;

function openQuiz() {
  const quiz = quizzes[quizIndex % quizzes.length];
  quizIndex++;
  openModal('🧠 Legal Knowledge Quiz',
    `<p style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:16px;">${quiz.q}</p>
     <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">
       ${quiz.opts.map((o, i) => `<div onclick="this.style.borderColor='var(--accent)';this.style.color='var(--accent)'" 
         style="padding:10px;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:8px;font-size:13px;color:var(--text-secondary);cursor:pointer;transition:all 0.15s;">
         ${String.fromCharCode(65+i)}) ${o}</div>`).join('')}
     </div>
     <div id="quiz-answer" style="display:none;padding:10px;background:var(--green-bg);border-radius:8px;font-size:12px;color:var(--green);">✅ Answer: ${quiz.ans}</div>`,
    `<button class="btn btn-secondary" onclick="document.getElementById('quiz-answer').style.display='block'">Reveal Answer</button>
     <button class="btn btn-primary" onclick="closeModal();openQuiz()">Next Question →</button>`
  );
}

function openPuzzle() {
  openModal('🔢 Logic Puzzle',
    `<p style="font-size:14px;font-weight:600;color:var(--text-primary);margin-bottom:12px;">3 Suspects, 1 Crime</p>
     <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;">
       Ali says: Bilal did it.<br>
       Bilal says: It was not me.<br>
       Chand says: I was with Ali.<br><br>
       <em style="color:var(--text-muted);">Only one person is telling the truth.</em><br><br>
       🔎 Who committed the crime?
     </p>
     <div id="puzzle-ans" style="display:none;margin-top:12px;padding:10px;background:var(--green-bg);border-radius:8px;font-size:12px;color:var(--green);">
       ✅ Answer: <b>Ali</b> committed the crime. If only Chand tells the truth (he was with Ali), then Ali's statement is a lie — meaning Bilal is innocent — so Ali did it.
     </div>`,
    `<button class="btn btn-secondary" onclick="document.getElementById('puzzle-ans').style.display='block'">Reveal Answer</button>
     <button class="btn btn-primary" onclick="closeModal()">Close</button>`
  );
}

let timerInterval = null;
let timerSeconds = 1500;
function openTimer() {
  openModal('⏱️ Focus Timer',
    `<div style="text-align:center;">
       <div style="font-size:64px;font-weight:900;color:var(--accent);font-family:var(--font-mono);letter-spacing:4px;" id="timer-disp">25:00</div>
       <div style="font-size:12px;color:var(--text-muted);margin-top:4px;" id="timer-label">Work Session</div>
       <div style="display:flex;gap:8px;justify-content:center;margin-top:16px;">
         <button class="btn btn-primary" onclick="startFocusTimer()">▶ Start</button>
         <button class="btn btn-secondary" onclick="pauseFocusTimer()">⏸ Pause</button>
         <button class="btn btn-secondary" onclick="resetFocusTimer()">↺ Reset</button>
       </div>
       <div style="display:flex;gap:8px;justify-content:center;margin-top:8px;">
         <button class="btn btn-secondary btn-sm" onclick="setFocusTimer(25,'Work Session')">25 min</button>
         <button class="btn btn-secondary btn-sm" onclick="setFocusTimer(5,'Short Break')">5 min break</button>
         <button class="btn btn-secondary btn-sm" onclick="setFocusTimer(15,'Long Break')">15 min break</button>
       </div>
     </div>`,
    `<button class="btn btn-secondary" onclick="pauseFocusTimer();closeModal()">Close</button>`
  );
  timerSeconds = 1500;
  updateTimerDisplay();
}
function updateTimerDisplay() {
  const el = document.getElementById('timer-disp');
  if (!el) return;
  const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const s = (timerSeconds % 60).toString().padStart(2, '0');
  el.textContent = `${m}:${s}`;
}
function startFocusTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timerSeconds--;
    updateTimerDisplay();
    if (timerSeconds <= 0) { clearInterval(timerInterval); timerInterval = null; showToast('⏱️ Timer complete! Take a break.'); }
  }, 1000);
}
function pauseFocusTimer() { clearInterval(timerInterval); timerInterval = null; }
function resetFocusTimer() { pauseFocusTimer(); timerSeconds = 1500; updateTimerDisplay(); }
function setFocusTimer(mins, label) {
  pauseFocusTimer(); timerSeconds = mins * 60;
  const lbl = document.getElementById('timer-label');
  if (lbl) lbl.textContent = label;
  updateTimerDisplay();
}

console.log('✅ Dashboard Page Loaded');
