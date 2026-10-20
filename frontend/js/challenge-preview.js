// Real challenge feature: every title, contender and vote total originates from /api/challenges.
// The hero photograph is illustrative, not a live stream or a source of vote results.
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
}[char]));
const safeCount = value => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
  ? value.toLocaleString('en-US') : '—';
const percent = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
  ? value : null;
const utc = value => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('en-GB', {day:'2-digit',month:'short',year:'numeric',
        hour:'2-digit',minute:'2-digit',timeZone:'UTC'}) + ' UTC' : 'Unavailable';
};
const validPhoto = value => typeof value === 'string' && (
  /^https?:\/\/[^\s]+$/i.test(value) || /^\/assets\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i.test(value)
);
const votingOpen = challenge => challenge?.status === 'OPEN' &&
  Date.now() >= new Date(challenge.opensAt).getTime() &&
  Date.now() < new Date(challenge.closesAt).getTime();
const featureBadge = challenge => challenge.status === 'CLOSED' ? 'CLOSED · RESULTS' :
  votingOpen(challenge) ? 'VOTING OPEN' : 'VOTING SCHEDULED';

export function broadcastPreview(challenge=null, {signedIn=false,error=''}={}) {
  if (error || !challenge) {
    return '<section class="broadcast-preview broadcast-empty" aria-label="Challenge spotlight">'+
      '<div class="broadcast-heading"><div><div class="kicker">MEDHMAR</div><h1>Camel Challenges</h1>'+
      '<p>Follow published competitions and support your champion.</p></div></div>'+
      '<div class="broadcast-empty-content" role="status"><h2>'+
      (error?'Challenges temporarily unavailable':'No published challenges yet')+'</h2><p>'+
      (error?'Unable to load the challenge records. Please retry.':
        'Challenges will appear here when an administrator publishes one.')+
      '</p><button type="button" id="refresh-challenges" class="broadcast-refresh">Refresh challenges</button></div></section>';
  }
  const camels = Array.isArray(challenge.camels) ? challenge.camels : [];
  const open = votingOpen(challenge);
  const id = challenge.challengeId;
  const totalVotes = safeCount(challenge.totalVotes);
  const candidateCards = camels.length ? camels.map(camel => {
    const share = percent(camel.votePercent);
    const src = validPhoto(camel.photoUrl) ? escapeHtml(camel.photoUrl) : null;
    const picture = src ? '<img src="'+src+'" alt="'+escapeHtml(camel.name||'Registered camel')+'" loading="lazy" referrerpolicy="no-referrer">' :
      '<div class="broadcast-photo-placeholder" role="img" aria-label="No camel photograph available">No photo</div>';
    let action = '';
    if (open && signedIn) action = '<button type="button" class="vote-btn" data-challenge="'+escapeHtml(id)+
      '" data-camel="'+escapeHtml(camel.camelId)+'">Vote for '+escapeHtml(camel.name||'Camel')+'</button>';
    else if (open) action = '<a class="broadcast-vote-link" href="/signin" data-link>Sign in to vote</a>';
    else action = '<button type="button" disabled>Voting unavailable</button>';
    return '<article class="broadcast-candidate">'+picture+'<div><div class="broadcast-candidate-title">'+
      '<h3>'+escapeHtml(camel.name||'Unnamed camel')+'</h3><span>#'+escapeHtml(camel.camelId)+'</span></div>'+
      '<div class="broadcast-count"><span>'+safeCount(camel.voteCount)+' votes</span><strong>'+
      (share===null?'—':share.toFixed(0)+'%')+'</strong></div><div class="broadcast-meter" role="meter" '+
      'aria-label="Vote share for '+escapeHtml(camel.name||'Camel')+'" aria-valuemin="0" aria-valuemax="100" '+
      (share===null?'':'aria-valuenow="'+share+'"')+'><span style="width:'+(share===null?0:share)+'%"></span></div>'+
      action+'</div></article>';
  }).join('') : '<p>No participating camels are available.</p>';
  const votingNote = !open ? (challenge.status==='CLOSED'?'Voting has closed. These are the recorded results.':
    'Voting will be available during the scheduled window.') :
    signedIn ? 'One vote per account. Votes are saved to the platform and cannot be changed.' :
    'Sign in to cast one recorded vote.';
  return '<section class="broadcast-preview broadcast-live-data" aria-label="Featured published challenge">'+
    '<div class="broadcast-heading"><div><div class="kicker">MEDHMAR · CHALLENGE #'+escapeHtml(id)+'</div>'+
    '<h1>'+escapeHtml(challenge.title||'Camel Challenge')+'</h1>'+
    '<p>Support your champion. Results come from the Medhmar platform.</p></div>'+
    '<span class="broadcast-live">'+escapeHtml(featureBadge(challenge))+'<small>'+
    escapeHtml(totalVotes)+' recorded votes</small></span></div>'+
    '<p class="broadcast-notice">Real challenge data · Illustrative racetrack photograph. No live stream is connected.</p>'+
    '<div class="broadcast-grid"><div><div class="broadcast-player" id="broadcast-player">'+
    '<img src="/assets/home-racetrack.jpg" alt="Illustrative photograph of camels racing on a track">'+
    '<span class="broadcast-label">RACE PHOTO</span>'+
    '<div class="broadcast-toolbar"><span>Illustrative photo · Not a live broadcast</span>'+
    '<button type="button" data-preview-fullscreen aria-label="Expand race photograph">⛶ Full screen</button></div></div>'+
    '<div class="broadcast-feature-subheading"><h2>'+escapeHtml(challenge.title||'Camel Challenge')+'</h2>'+
    '<button type="button" id="refresh-challenges" class="broadcast-refresh">Refresh results</button></div>'+
    '<p>Challenge #'+escapeHtml(id)+' · '+escapeHtml(challenge.status)+
    ' · '+escapeHtml(camels.length)+' registered contenders</p>'+
    '<div class="broadcast-tabs" role="tablist" aria-label="Challenge information">'+
    '<button type="button" role="tab" data-preview-tab="overview" id="challenge-overview" '+
    'aria-selected="true" aria-controls="broadcast-info">Overview</button>'+
    '<button type="button" role="tab" data-preview-tab="participants" id="challenge-participants" '+
    'aria-selected="false" aria-controls="broadcast-info">Participants</button></div>'+
    '<div id="broadcast-info" role="tabpanel" aria-labelledby="challenge-overview" '+
    'data-overview="'+escapeHtml('Voting opens '+utc(challenge.opensAt)+'. Voting closes '+utc(challenge.closesAt)+'.')+'" '+
    'data-participants="'+escapeHtml(camels.length?camels.map(c=>String(c.name||'Camel')+' (#'+c.camelId+')').join(' · '):'No participating camels')+'">'+
    '<p>Voting opens '+escapeHtml(utc(challenge.opensAt))+'. Voting closes '+
    escapeHtml(utc(challenge.closesAt))+'.</p></div></div>'+
    '<aside class="broadcast-voting"><h2>Choose your champion</h2>'+
    '<p>'+escapeHtml(votingNote)+'</p>'+candidateCards+
    '<p class="broadcast-vote-note">Votes shown here are recorded results, not simulated votes.</p>'+
    '<a data-link class="broadcast-challenge-link" href="/challenges/'+encodeURIComponent(String(id))+
    '">View challenge details →</a></aside></div>'+
    '<div class="broadcast-facts"><div><small>Challenge ID</small><strong>#'+escapeHtml(id)+'</strong></div>'+
    '<div><small>Opens (UTC)</small><strong>'+escapeHtml(utc(challenge.opensAt))+'</strong></div>'+
    '<div><small>Closes (UTC)</small><strong>'+escapeHtml(utc(challenge.closesAt))+'</strong></div>'+
    '<div><small>Broadcast</small><strong>Not connected</strong></div></div></section>';
}

// Presentation interactions only; real voting is handled by the app's authenticated vote API.
export function bindBroadcastPreview(root) {
  const section = root.querySelector('.broadcast-preview');
  if (!section) return;
  section.querySelector('[data-preview-fullscreen]')?.addEventListener('click', async () => {
    const player = section.querySelector('.broadcast-player');
    try { if (player?.requestFullscreen) await player.requestFullscreen(); }
    catch { /* Fullscreen is optional; voting and data must remain unaffected. */ }
  });
  section.querySelectorAll('[data-preview-tab]').forEach(button => button.addEventListener('click', () => {
    section.querySelectorAll('[data-preview-tab]').forEach(tab =>
      tab.setAttribute('aria-selected', String(tab===button)));
    const info = section.querySelector('#broadcast-info');
    if (!info) return;
    info.setAttribute('aria-labelledby',button.id);
    const kind = button.dataset.previewTab==='participants'?'participants':'overview';
    const text = info.dataset[kind] || '';
    info.textContent = text;
  }));
}
