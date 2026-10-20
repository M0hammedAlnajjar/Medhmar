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

const symbols = {
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  trophy:'<path d="M7 3h10v9a5 5 0 0 1-10 0zM7 6H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 17v4m-5 0h10"/>',
  group:'<circle cx="9" cy="7" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m4 9v-2a6 6 0 0 0-4-5"/>',
  chart:'<path d="M4 20v-7M10 20V4M16 20v-11M22 20v-5"/>',
  radio:'<circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.5 6.5 0 0 0 0 9m9-9a6.5 6.5 0 0 1 0 9M4 4a11.3 11.3 0 0 0 0 16m16-16a11.3 11.3 0 0 1 0 16"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  file:'<path d="M6 3h9l5 5v13H6zM15 3v6h5M9 13h8M9 17h8"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>'
};
const ico = (key,size=17) => '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(symbols[key]||symbols.file)+'</svg>';
const safeId = id => encodeURIComponent(String(id));
const camelImage = (camel,cls) => validPhoto(camel?.photoUrl)
  ? '<img class="'+cls+'" src="'+escapeHtml(camel.photoUrl)+'" alt="'+escapeHtml(camel.name||'Registered camel')+'" loading="lazy" referrerpolicy="no-referrer">'
  : '<div class="'+cls+' broadcast-photo-placeholder" role="img" aria-label="No camel photograph available">No photo</div>';

export function broadcastPreview(challenge=null,{signedIn=false,error=''}={}) {
 if(error||!challenge)return '<section class="broadcast-preview broadcast-empty" aria-label="Challenge spotlight">'+
  '<div class="broadcast-heading"><div><div class="kicker">MEDHMAR</div><h1>Camel Challenges</h1><p>Follow published competitions and support your champion.</p></div></div>'+
  '<div class="broadcast-empty-content" role="status"><h2>'+(error?'Challenges temporarily unavailable':'No published challenges yet')+'</h2><p>'+
  (error?'Unable to load the challenge records. Please retry.':'Challenges will appear here when an administrator publishes one.')+
  '</p><button type="button" id="refresh-challenges" class="broadcast-refresh">Refresh challenges</button></div></section>';
 const camels=Array.isArray(challenge.camels)?challenge.camels:[];
 const open=votingOpen(challenge);
 const id=challenge.challengeId;
 const totalVotes=safeCount(challenge.totalVotes);
 const badge=featureBadge(challenge);
 const candidateCards=camels.length?camels.map((camel,i)=>{
  const share=percent(camel.votePercent);
  const picture=camelImage(camel,'broadcast-camel-photo');
  const action=open&&signedIn
    ? '<button type="button" class="vote-btn" data-challenge="'+escapeHtml(id)+'" data-camel="'+escapeHtml(camel.camelId)+'">'+ico('check',15)+'Vote for '+escapeHtml(camel.name||'Camel')+'</button>'
    : open?'<a class="broadcast-vote-link" href="/signin" data-link>Sign in to vote</a>'
    :'<button type="button" disabled>Voting unavailable</button>';
  return '<article class="broadcast-candidate'+(i?' is-alternate':'')+'">'+picture+'<div class="broadcast-candidate-content">'+
    '<div class="broadcast-candidate-title"><h3>'+escapeHtml(camel.name||'Unnamed camel')+'</h3>'+
    '<span>#'+escapeHtml(camel.camelId)+'</span></div>'+
    '<div class="broadcast-count"><span>'+safeCount(camel.voteCount)+' votes</span><strong>'+
    (share===null?'—':share.toFixed(0)+'%')+'</strong></div>'+
    '<div class="broadcast-meter" role="meter" aria-label="Vote share for '+escapeHtml(camel.name||'Camel')+
    '" aria-valuemin="0" aria-valuemax="100" '+(share===null?'':'aria-valuenow="'+share+'"')+
    '><span style="width:'+(share===null?0:share)+'%"></span></div>'+action+'</div></article>';
 }).join(''):'<p>No participating camels are available.</p>';
 const votingNote=!open?(challenge.status==='CLOSED'?'Voting has closed. These are the recorded results.':
  'Voting will be available during the scheduled window.') :
  signedIn?'One vote per account. Votes are saved to the platform and cannot be changed.':
  'Sign in to cast one recorded vote.';
 const dates='Voting opens '+utc(challenge.opensAt)+'. Voting closes '+utc(challenge.closesAt)+'.';
 const participants=camels.length?camels.map(c=>String(c.name||'Camel')+' (#'+c.camelId+')').join(' · '):'No participating camels';
 const results=camels.length?camels.map(c=>String(c.name||'Camel')+': '+safeCount(c.voteCount)+' votes ('+
  (percent(c.votePercent)===null?'—':percent(c.votePercent).toFixed(0)+'%')+')').join(' · '):'No recorded contenders';
 return '<section class="broadcast-preview broadcast-live-data" aria-label="Featured published challenge">'+
  '<div class="broadcast-grid"><div class="broadcast-left">'+
    '<div class="broadcast-player" id="broadcast-player">'+
      '<img class="broadcast-scene-image" src="/assets/home-racetrack.jpg" alt="Illustrative photograph of camels racing on a track">'+
      '<div class="broadcast-heading"><div><div class="kicker">MEDHMAR <span aria-hidden="true">›</span> CHALLENGE #'+escapeHtml(id)+'</div>'+
        '<h1>'+escapeHtml(challenge.title||'Camel Challenge')+'</h1>'+
        '<p>Support your champion. Results come from the Medhmar platform.</p>'+
        '<div class="broadcast-meta"><span>'+ico('pin')+'Muscat, Oman</span><span>'+ico('calendar')+'Opens '+escapeHtml(utc(challenge.opensAt))+'</span>'+
        '<span>'+ico('calendar')+'Closes '+escapeHtml(utc(challenge.closesAt))+'</span></div></div>'+
        '<span class="broadcast-live">'+escapeHtml(badge)+'<small>'+escapeHtml(totalVotes)+' recorded votes</small></span></div>'+
      '<span class="broadcast-label">RACE PHOTO</span>'+
      '<div class="broadcast-toolbar"><span>Real challenge data · Illustrative racetrack photograph. No live stream is connected.</span>'+
      '<div class="broadcast-photo-actions"><button type="button" data-preview-fullscreen aria-label="Expand race photograph">'+ico('expand',16)+' Full screen</button>'+
      '<button type="button" data-preview-image="prev" aria-label="Previous illustrative photograph">‹</button>'+
      '<button type="button" data-preview-image="next" aria-label="Next illustrative photograph">›</button></div></div>'+
    '</div>'+
    '<div class="broadcast-bottom-tools"><div class="broadcast-tabs" role="tablist" aria-label="Challenge information">'+
      '<button type="button" role="tab" data-preview-tab="overview" id="challenge-overview" aria-selected="true" aria-controls="broadcast-info">Overview</button>'+
      '<button type="button" role="tab" data-preview-tab="participants" id="challenge-participants" aria-selected="false" aria-controls="broadcast-info">'+ico('group',16)+'Participants</button>'+
      '<button type="button" role="tab" data-preview-tab="results" id="challenge-results" aria-selected="false" aria-controls="broadcast-info">'+ico('chart',16)+'Results</button>'+
      '</div><button type="button" id="refresh-challenges" class="broadcast-refresh">Refresh results</button></div>'+
    '<div id="broadcast-info" role="tabpanel" aria-labelledby="challenge-overview" tabindex="0" data-overview="'+escapeHtml(dates)+
      '" data-participants="'+escapeHtml(participants)+'" data-results="'+escapeHtml(results)+'"><p>'+escapeHtml(dates)+'</p></div>'+
    '<div class="broadcast-facts"><div>'+ico('file',23)+'<span><small>Challenge ID</small><strong>#'+escapeHtml(id)+'</strong></span></div>'+
      '<div>'+ico('calendar',23)+'<span><small>Opens (UTC)</small><strong>'+escapeHtml(utc(challenge.opensAt))+'</strong></span></div>'+
      '<div>'+ico('calendar',23)+'<span><small>Closes (UTC)</small><strong>'+escapeHtml(utc(challenge.closesAt))+'</strong></span></div>'+
      '<div>'+ico('radio',23)+'<span><small>Broadcast</small><strong>Not connected</strong></span></div></div>'+
  '</div><aside class="broadcast-voting">'+
    '<div class="broadcast-voting-title"><span class="broadcast-trophy">'+ico('trophy',20)+'</span><h2>Choose your champion</h2></div>'+
    '<p>'+escapeHtml(votingNote)+'</p>'+candidateCards+
    '<p class="broadcast-vote-note">'+ico('check',15)+'Votes shown here are recorded results, not simulated votes.</p>'+
    '<a data-link class="broadcast-challenge-link" href="/challenges/'+safeId(id)+'">View challenge details →</a>'+
  '</aside></div></section>';
}

// Renders only API-returned published challenges; never invents the cards shown in the visual concept.
export function publishedChallengeCards(challenges=[]) {
 return '<section class="broadcast-published" id="published-challenges" aria-labelledby="broadcast-published-title">'+
   '<div class="broadcast-published-heading"><div><span class="broadcast-section-kicker">'+ico('trophy',16)+' MEDHMAR</span>'+
     '<h2 id="broadcast-published-title">More Published Challenges</h2>'+
     '<p>Other recorded challenges and their results.</p></div>'+
     '<a href="#published-challenges" class="broadcast-all-link">View all challenges '+ico('chevron',16)+'</a></div>'+
   (challenges.length?'<div class="broadcast-upcoming">'+challenges.map(c=>{
     const camels=Array.isArray(c.camels)?c.camels:[];
     const closed=c.status==='CLOSED',open=votingOpen(c);
     const state=closed?'CLOSED':open?'OPEN':'SCHEDULED';
     const stateClass=closed?'closed':open?'open':'scheduled';
     const gallery=camels.slice(0,3).map(camel=>camelImage(camel,'broadcast-mini-avatar')).join('');
     const shares=closed&&camels.length?
       '<div class="broadcast-card-results">'+camels.slice(0,2).map(camel=>{
         const share=percent(camel.votePercent);
         return '<div><span>'+escapeHtml(camel.name||'Camel')+'</span><div class="broadcast-meter">'+
          '<span style="width:'+(share??0)+'%"></span></div><strong>'+(share===null?'—':share.toFixed(0)+'%')+'</strong></div>';
       }).join('')+'</div>':
       '<div class="broadcast-card-avatars" aria-label="Registered contender portraits">'+gallery+'</div>';
     return '<article class="broadcast-published-card">'+
       '<div class="broadcast-card-top"><div class="broadcast-card-photo" role="img" aria-label="Illustrative racing photograph">'+
       '<span class="broadcast-card-badge broadcast-badge-'+stateClass+'">'+state+'</span></div>'+
       '<div class="broadcast-card-copy"><h3>'+escapeHtml(c.title||'Camel Challenge')+'</h3>'+
       '<p>'+ico('calendar',15)+escapeHtml(utc(c.opensAt))+' – '+escapeHtml(utc(c.closesAt))+'</p>'+
       '<p>'+ico('group',15)+camels.length+' contenders</p></div></div>'+
       '<div class="broadcast-card-bottom">'+shares+
       '<a href="/challenges/'+safeId(c.challengeId)+'" class="broadcast-card-button" data-link>View Challenge '+ico('chevron',15)+'</a></div></article>';
   }).join('')+
   (challenges.length===1?
    '<aside class="broadcast-published-placeholder" aria-label="Upcoming published challenges">'+
     '<span class="broadcast-section-kicker">MEDHMAR</span>'+
     '<strong>More challenges on the way</strong>'+
     '<p>Additional recorded competitions will appear here when the platform publishes them. Only real challenge results are shown.</p></aside>':'')+
   '</div>':
   '<div class="broadcast-upcoming-empty">The featured challenge is shown above. More published challenges will appear here when available.</div>')+
   '</section>';
}

// Presentation interactions only. Voting remains governed by the authenticated backend API.
export function bindBroadcastPreview(root) {
 const section=root.querySelector('.broadcast-preview');
 if(!section)return;
 section.querySelector('[data-preview-fullscreen]')?.addEventListener('click',async()=>{
  const player=section.querySelector('.broadcast-player');
  try{if(player?.requestFullscreen)await player.requestFullscreen();}
  catch{/* Fullscreen is optional and cannot change voting data. */}
 });
 // This gallery deliberately uses only shipped illustrative photography.
 const gallery=['/assets/home-racetrack.jpg','/assets/racing-hero.webp'];
 const scene=section.querySelector('.broadcast-scene-image');
 let photoIndex=0;
 section.querySelectorAll('[data-preview-image]').forEach(button=>button.addEventListener('click',()=>{
  if(!scene)return;
  photoIndex=(photoIndex+(button.dataset.previewImage==='next'?1:-1)+gallery.length)%gallery.length;
  scene.src=gallery[photoIndex];
 }));
 const tabs=[...section.querySelectorAll('[data-preview-tab]')];
 const activate=(button,focus=false)=>{
   for(const tab of tabs){
     const current=tab===button;
     tab.setAttribute('aria-selected',String(current));
     tab.tabIndex=current?0:-1;
   }
   const info=section.querySelector('#broadcast-info');
   if(!info)return;
   info.setAttribute('aria-labelledby',button.id);
   info.textContent=info.dataset[button.dataset.previewTab]||'';
   if(focus)button.focus();
 };
 tabs.forEach((button,i)=>{
   button.tabIndex=i? -1:0;
   button.addEventListener('keydown',event=>{
     let next;
     if(event?.key==='ArrowRight')next=(i+1)%tabs.length;
     else if(event?.key==='ArrowLeft')next=(i-1+tabs.length)%tabs.length;
     else if(event?.key==='Home')next=0;
     else if(event?.key==='End')next=tabs.length-1;
     else return;
     event.preventDefault();activate(tabs[next],true);
   });
   button.addEventListener('click',()=>activate(button));
 });
}
