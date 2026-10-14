// Presentation of the existing sample journal; backend submission stays in app.js.
const sessions = [
  { id: 1, date: '06 Oct 2026', month: '2026-10', time: '7:00 AM', type: 'Endurance Training', duration: 45, notes: 'Good response during the final phase.' },
  { id: 2, date: '04 Oct 2026', month: '2026-10', time: '6:30 AM', type: 'Speed Training', duration: 30, notes: 'Pace and recovery were strong.' },
  { id: 3, date: '01 Oct 2026', month: '2026-10', time: '7:15 AM', type: 'General Training', duration: 55, notes: 'Steady warm-up and controlled finish.' }
];
let month = '2026-10';
const icon = kind => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',journal:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',user:'<circle cx="12" cy="7" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',chart:'<path d="M4 20V13h4v7m2 0V8h4v12m2 0V3h4v17"/>'})[kind]}</svg>`;
export function trainingJournal() {
  const visible = sessions.filter(s => s.month === month);
  const total = visible.reduce((sum,s) => sum + s.duration, 0);
  const stats = [['journal',visible.length,'Sessions'],['clock',total,'Training Minutes'],['chart',visible.length?`${Math.round(total/visible.length)} min`:'—','Average Session'],['calendar',visible[0]?.date.slice(0,6)||'—','Last Session']];
  return `<section class="training-journal"><div class="journal-heading"><div><div class="kicker">MEDHMAR</div><h1>Training Log</h1><p>Track every session. Build a stronger champion.</p><span class="journal-sample">${icon('journal')} Sample training journal</span></div><button class="btn btn-primary" id="add-training-btn">+ Add Training Session</button></div>
  <article class="journal-camel"><img src="/assets/mock-camels/camel-7.jpg" alt="Al Barq, sample racing camel"><div><h2>Al Barq <span class="journal-active">● Active</span></h2><p>Racing camel · Male · 4 years</p><p>${icon('user')} Trainer: Mohammed Alnajjar</p></div><div class="journal-camel-agreement"><p>${icon('journal')} Agreement #15</p><p>${icon('user')} Owner: Salim Al Balushi</p><p>${icon('calendar')} 01 Oct – 31 Oct 2026</p></div></article>
  <div class="journal-stats">${stats.map(([i,value,label])=>`<article><span class="journal-stat-icon">${icon(i)}</span><div><strong>${value}</strong><span>${label}</span></div></article>`).join('')}</div>
  <div class="journal-grid"><section class="journal-history"><div class="journal-history-heading"><h2>Training History</h2><div><label class="journal-filter">Camel<select aria-label="Select camel"><option>Al Barq</option></select></label><label class="journal-filter">Month<select id="journal-month"><option value="2026-10" ${month==='2026-10'?'selected':''}>October 2026</option><option value="2026-09" ${month==='2026-09'?'selected':''}>September 2026</option></select></label></div></div><div class="journal-sessions">${visible.map(s=>`<article class="journal-session"><span class="journal-session-icon">${icon('journal')}</span><div><h3>${s.type}</h3><p>${icon('calendar')} ${s.date} · ${s.time} <span class="journal-duration">${icon('clock')} ${s.duration} min</span></p><p>${s.notes}</p></div><button type="button" class="journal-outline" data-journal-session="${s.id}">View session →</button></article>`).join('')||'<p class="journal-empty">No sample sessions for this month.</p>'}</div><p class="journal-history-note">${visible.length} sample sessions · Display data only</p></section>
  <aside><section class="journal-agreement"><div><h2>Training Agreement</h2><span class="journal-active">● Active</span></div><p>${icon('journal')} Agreement #15</p><p>${icon('calendar')} 01 Oct – 31 Oct 2026</p><p>${icon('user')} Trainer: Mohammed Alnajjar</p><p>${icon('user')} Owner: Salim Al Balushi</p><button type="button" class="journal-outline" data-journal-agreement>View Agreement →</button><p class="journal-rule">Sessions are recorded permanently.</p></section><figure class="journal-track"><img src="/assets/home-racetrack.jpg" alt="Camels training on a sandy track"><figcaption>“ Consistency builds champions.</figcaption></figure></aside></div>
  <dialog class="journal-dialog" id="journal-dialog" aria-labelledby="journal-dialog-title"><h2 id="journal-dialog-title"></h2><div id="journal-dialog-body"></div><form method="dialog"><button class="btn btn-primary">Close</button></form></dialog></section>`;
}
export function bindTrainingJournal(root) {
  const section = root.querySelector('.training-journal'); if (!section) return;
  section.querySelector('#journal-month').addEventListener('change', event => {
    month = event.target.value; section.outerHTML = trainingJournal();
    bindTrainingJournal(root);
    // Reconnect the existing backend submission modal after rebuilding the sample view.
    root.dispatchEvent(new Event('journal-rendered'));
    root.querySelector('#journal-month')?.focus();
  });
  function show(title, body) {
    section.querySelector('#journal-dialog-title').textContent = title;
    section.querySelector('#journal-dialog-body').innerHTML = body;
    section.querySelector('#journal-dialog').showModal();
  }
  section.querySelectorAll('[data-journal-session]').forEach(button => button.addEventListener('click', () => {
    const s = sessions.find(item => item.id === Number(button.dataset.journalSession));
    show(s.type, `<p>${s.date} · ${s.time}</p><p><strong>${s.duration} minutes</strong></p><p>${s.notes}</p><p class="journal-rule">Sample session — not a saved account record.</p>`);
  }));
  section.querySelector('[data-journal-agreement]').addEventListener('click', () => show('Sample Training Agreement #15', '<p>Al Barq · Owner: Salim Al Balushi</p><p>Trainer: Mohammed Alnajjar</p><p>01 Oct – 31 Oct 2026 · Active</p><p class="journal-rule">This is illustrative data. Open Agreements for your actual records.</p>'));
}
