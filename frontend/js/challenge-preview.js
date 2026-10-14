// Local presentation only. Never imports the API client or sends preview votes.
let choice = null;
export function broadcastPreview() {
  const votes = [744 + (choice === 0 ? 1 : 0), 456 + (choice === 1 ? 1 : 0)];
  const total = votes[0] + votes[1];
  return `<section class="broadcast-preview" aria-label="Live challenge design preview">
    <div class="broadcast-heading"><div><div class="kicker">MEDHMAR</div><h1>Live Camel Challenge</h1><p>Watch the race. Support your champion.</p></div><span class="broadcast-live">● LIVE PREVIEW<small>Al Bashaer · Oman</small></span></div>
    <p class="broadcast-notice">Design preview · Sample race image and votes. No live stream is connected.</p>
    <div class="broadcast-grid"><div><div class="broadcast-player" id="broadcast-player"><img src="/assets/home-racetrack.jpg" alt="Camels racing on a sandy track in Oman"><span class="broadcast-label">PREVIEW</span><span class="broadcast-watchers">1.2K watching · sample</span><div class="broadcast-toolbar"><span>Race image preview</span><button type="button" data-preview-fullscreen aria-label="Expand race preview">⛶ Full screen</button></div></div><h2>Al Bashaer Evening Challenge</h2><p>5 km · Two contenders · Exhibition preview</p><div class="broadcast-tabs" role="tablist" aria-label="Race preview information"><button type="button" role="tab" aria-selected="true" aria-controls="broadcast-info" id="preview-overview" data-preview-tab="overview">Overview</button><button type="button" role="tab" aria-selected="false" aria-controls="broadcast-info" id="preview-participants" data-preview-tab="participants">Participants</button></div><div id="broadcast-info" role="tabpanel" aria-labelledby="preview-overview"><p>Two champions on the Al Bashaer track. Explore the voting experience using sample data.</p></div></div>
    <aside class="broadcast-voting"><h2>Choose your champion</h2><p>Voting window · preview</p>${['Al Barq','Shaheen'].map((name,i)=>`<article class="broadcast-candidate"><img src="/assets/mock-camels/camel-${i===0?7:2}.jpg" alt="${name}, sample camel portrait"><div><div class="broadcast-candidate-title"><h3>${name}</h3><span>#${i===0?'07':'12'}</span></div><div class="broadcast-count"><span>${votes[i]} votes</span><strong>${Math.round(votes[i]/total*100)}%</strong></div><div class="broadcast-meter"><span style="width:${votes[i]/total*100}%"></span></div><button type="button" data-preview-vote="${i}" ${choice!==null?'disabled':''}>${choice===i?'✓ Selected':`Vote for ${name}`}</button></div></article>`).join('')}<p id="preview-vote-status" role="status">${choice===null?'Try one sample vote. Nothing is saved to your account.':'Sample vote selected. Real challenge votes are unchanged.'}</p>${choice!==null?'<button class="broadcast-reset" type="button" data-preview-reset>Reset preview vote</button>':''}</aside></div>
    <div class="broadcast-facts"><div><small>Distance</small><strong>5 km</strong></div><div><small>Venue</small><strong>Al Bashaer, Oman</strong></div><div><small>Category</small><strong>Open Challenge</strong></div><div><small>Broadcast</small><strong>Design preview</strong></div></div>
    <h2>Upcoming Challenges</h2><div class="broadcast-upcoming">${[['Al Rustaq Morning Challenge','Al Rustaq · 3 km','camel-3.jpg'],['Ibri Heritage Challenge','Ibri · 6 km','camel-6.jpg']].map(([name,detail,img])=>`<article><img src="/assets/mock-camels/${img}" alt="Sample racing camel"><div><h3>${name}</h3><p>${detail}</p></div><span>Sample event</span></article>`).join('')}</div>
  </section>`;
}
export function bindBroadcastPreview(root) {
  const section = root.querySelector('.broadcast-preview');
  if (!section) return;
  section.querySelectorAll('[data-preview-vote]').forEach(button => button.addEventListener('click', () => {
    if (choice !== null) return;
    choice = Number(button.dataset.previewVote);
    section.outerHTML = broadcastPreview();
    bindBroadcastPreview(root);
    root.querySelector('[data-preview-reset]')?.focus();
  }));
  section.querySelector('[data-preview-reset]')?.addEventListener('click', () => {
    choice = null; section.outerHTML = broadcastPreview(); bindBroadcastPreview(root);
    root.querySelector('[data-preview-vote]')?.focus();
  });
  section.querySelector('[data-preview-fullscreen]')?.addEventListener('click', async () => {
    const player = section.querySelector('.broadcast-player');
    try { if (player.requestFullscreen) await player.requestFullscreen(); }
    catch { section.querySelector('#preview-vote-status').textContent = 'Full screen is unavailable in this browser.'; }
  });
  section.querySelectorAll('[data-preview-tab]').forEach(button => button.addEventListener('click', () => {
    section.querySelectorAll('[data-preview-tab]').forEach(tab => tab.setAttribute('aria-selected', String(tab === button)));
    const info = section.querySelector('#broadcast-info'); info.setAttribute('aria-labelledby', button.id);
    info.innerHTML = button.dataset.previewTab === 'participants'
      ? '<p><strong>#07 Al Barq</strong> and <strong>#12 Shaheen</strong> · Two sample contenders.</p>'
      : '<p>Two champions on the Al Bashaer track. Explore the voting experience using sample data.</p>';
  }));
}
