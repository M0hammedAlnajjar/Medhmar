// Challenge identities, photos, schedules and results always come from /api/challenges.
// The offline race poster is decorative; it never represents a connected broadcast.
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
}[char]));
const isCount = value => Number.isSafeInteger(value) && value >= 0;
const safeCount = value => isCount(value) ? value.toLocaleString('en-US') : '—';
const percent = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100
  ? value : null;
const utc = value => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleString('en-GB', {day:'2-digit',month:'short',year:'numeric',
        hour:'2-digit',minute:'2-digit',timeZone:'UTC'}) + ' UTC' : 'Unavailable';
};
const validPhoto = value => typeof value === 'string' && (
  /^https?:\/\/[^\s]+$/i.test(value) ||
  /^\/(?:assets|uploads)\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i.test(value)
);
// Only validated YouTube IDs can enter the iframe or its direct playback link.
const youtubeVideoId = value => {
  if(typeof value !== 'string' || !value.trim())return null;
  try {
    const url=new URL(value);
    if(url.protocol!=='https:'||url.username||url.password||url.port||url.hash)return null;
    const host=url.hostname.toLowerCase();
    let id=null;
    if(host==='youtu.be'||host==='www.youtu.be')id=url.pathname.slice(1);
    else if(['youtube.com','www.youtube.com','m.youtube.com'].includes(host)){
      if(url.pathname==='/watch')id=url.searchParams.get('v');
      else if(/^\/(live|embed|shorts)\/[A-Za-z0-9_-]{11}$/.test(url.pathname))
        id=url.pathname.split('/')[2];
    }
    return /^[A-Za-z0-9_-]{11}$/.test(id||'')?id:null;
  }catch { return null; }
};
const votingOpen = challenge => challenge?.status === 'OPEN' &&
  Date.now() >= new Date(challenge.opensAt).getTime() &&
  Date.now() < new Date(challenge.closesAt).getTime();
const featureBadge = challenge => challenge.status === 'CLOSED' ? 'Completed' :
  votingOpen(challenge) ? 'Voting open' :
  Date.now() >= new Date(challenge.closesAt).getTime() ? 'Voting ended' : 'Voting scheduled';
const symbols = {
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  trophy:'<path d="M7 3h10v9a5 5 0 0 1-10 0zM7 6H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4M12 17v4m-5 0h10"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  videoOff:'<path d="m3 3 18 18M10 5h6a2 2 0 0 1 2 2v6M6 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-1M18 9l4-3v12l-4-3"/>',
  group:'<circle cx="9" cy="8" r="3"/><path d="M3 21v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6m1 4a5 5 0 0 1 3 5"/>',
  check:'<path d="m5 12 4 4L19 6"/>'
};
const ico = (key,size=17) => '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(symbols[key]||symbols.check)+'</svg>';
const safeId = id => encodeURIComponent(String(id));
const camelImage = (camel,cls) => validPhoto(camel?.photoUrl)
  ? '<img class="'+cls+'" src="'+escapeHtml(camel.photoUrl)+'" alt="'+escapeHtml(camel.name||'Registered camel')+'" loading="lazy" decoding="async" referrerpolicy="no-referrer">'
  : '<div class="'+cls+' broadcast-photo-placeholder" role="img" aria-label="Photo unavailable for '+escapeHtml(camel?.name||'Camel')+'; camel illustration shown">'+
    '<img src="/assets/challenge-neutral-camel.svg" alt="" loading="lazy" decoding="async"></div>';

function pageHeading(detail,challenge) {
  return '<header class="challenge-page-heading">'+
    '<nav class="challenge-breadcrumb" aria-label="Breadcrumb"><a href="/home" data-link>Home</a><span aria-hidden="true">/</span>'+
    (detail?'<a href="/challenges" data-link>Challenges</a><span aria-hidden="true">/</span><span aria-current="page">Challenge #'+escapeHtml(challenge.challengeId)+'</span>':
      '<span aria-current="page">Challenges</span>')+'</nav>'+
    '<div class="challenge-page-title"><div><h1>'+(detail?'Challenge details':'Challenges')+'</h1><p>Follow the competition. Explore the results.</p></div>'+
    (detail?'<a class="challenge-outline-link" href="/challenges" data-link>All challenges</a>':
      challenge?'<a class="challenge-outline-link" href="#published-challenges">View all challenges</a>':'')+'</div></header>';
}

// A badge is earned only by a unique positive final result with consistent API totals.
function winner(challenge,camels) {
  if(challenge.status!=='CLOSED'||!isCount(challenge.totalVotes)||challenge.totalVotes===0||
    !camels.length||camels.some(c=>!isCount(c.voteCount))||
    camels.reduce((sum,c)=>sum+c.voteCount,0)!==challenge.totalVotes)return null;
  const highest=camels.reduce((max,c)=>Math.max(max,c.voteCount),0);
  const leaders=camels.filter(c=>c.voteCount===highest);
  return leaders.length===1?leaders[0]:null;
}

export function broadcastPreview(challenge=null,{signedIn=false,error='',detail=false}={}) {
  if(error||!challenge)return '<section class="broadcast-preview broadcast-empty" aria-label="Challenge spotlight">'+
    pageHeading(false,null)+'<div class="broadcast-empty-content" role="status">'+ico('trophy',36)+
    '<h2>'+(error?'Challenges temporarily unavailable':'No published challenges yet')+'</h2><p>'+
    (error?'Unable to load the challenge records. Please retry.':'Challenges will appear here when an administrator publishes one.')+
    '</p><button type="button" id="refresh-challenges" class="broadcast-refresh">Refresh challenges</button></div></section>';
  const camels=Array.isArray(challenge.camels)?challenge.camels:[];
  const open=votingOpen(challenge),closed=challenge.status==='CLOSED';
  const id=challenge.challengeId,embedId=youtubeVideoId(challenge.streamUrl);
  const champion=winner(challenge,camels);
  const votingNote=closed?'Voting closed':open?'Voting open':featureBadge(challenge);
  const candidateCards=camels.map((camel,i)=>{
    const share=percent(camel.votePercent),won=camel===champion;
    const action=open?(signedIn
      ? '<button type="button" class="vote-btn" data-challenge="'+escapeHtml(id)+'" data-camel="'+escapeHtml(camel.camelId)+'">'+ico('check',15)+'Vote for '+escapeHtml(camel.name||'Camel')+'</button>'
      : '<a class="broadcast-vote-link" href="/signin" data-link>Sign in to vote</a>') : '';
    return '<article class="broadcast-candidate'+(i?' is-alternate':'')+(won?' is-winner':'')+'">'+
      '<div class="broadcast-portrait">'+camelImage(camel,'broadcast-camel-photo')+
      (won?'<span class="broadcast-winner">'+ico('trophy',17)+'Winner</span>':'')+'</div>'+
      '<div class="broadcast-candidate-content"><h3>'+escapeHtml(camel.name||'Unnamed camel')+'</h3>'+
      '<div class="broadcast-count"><b class="broadcast-big-count">'+safeCount(camel.voteCount)+'</b><span>'+(camel.voteCount===1?'vote':'votes')+'</span></div>'+
      (challenge.totalVotes===0?'':'<p class="broadcast-share">'+(share===null?'Vote share unavailable':share.toLocaleString('en-US',{maximumFractionDigits:2})+'% of votes')+'</p>')+action+'</div></article>';
  }).join('');
  const media=embedId
    ? '<div class="broadcast-stage broadcast-stage-connected" role="group" aria-label="Embedded YouTube broadcast">'+
      '<iframe class="broadcast-stream-frame" data-video-id="'+embedId+'" src="https://www.youtube.com/embed/'+embedId+'?rel=0" title="Medhmar challenge broadcast" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div>'+
      '<div class="broadcast-stream-tools" aria-label="Broadcast playback options"><span class="broadcast-stream-help">Video not loading?</span><div class="broadcast-stream-links">'+
      '<button type="button" data-stream-switch aria-label="Try YouTube privacy-enhanced video player">Try alternate player</button>'+
      '<a target="_blank" rel="noopener" referrerpolicy="strict-origin-when-cross-origin" href="https://www.youtube.com/watch?v='+embedId+'">Watch on YouTube</a>'+
      '<button type="button" data-preview-fullscreen aria-label="Expand broadcast">'+ico('expand',16)+'Full screen</button></div></div>'
    : '<div class="broadcast-stage" role="group" aria-label="Broadcast unavailable; decorative race photograph">'+
      '<span class="broadcast-offline-badge"><span aria-hidden="true"></span>BROADCAST OFFLINE</span>'+
      '<div class="broadcast-stage-center">'+ico('videoOff',46)+'<h3>Broadcast unavailable</h3><p>No stream is connected to this challenge.</p></div></div>';
  return '<section class="broadcast-preview broadcast-live-data" aria-label="Featured published challenge">'+pageHeading(detail,challenge)+
    '<div class="broadcast-grid"><header class="broadcast-heading">'+
    '<div class="broadcast-feature-kicker">FEATURED CHALLENGE <span>· CHALLENGE #'+escapeHtml(id)+'</span></div>'+
    '<h2>'+escapeHtml(String(challenge.title||'').trim()||'Camel Racing Challenge')+'</h2>'+
    '<div class="broadcast-meta"><span>'+ico('pin')+'Muscat, Oman</span><span>'+ico('calendar')+'Opens '+escapeHtml(utc(challenge.opensAt))+'</span>'+
    '<span>'+ico('calendar')+'Closes '+escapeHtml(utc(challenge.closesAt))+'</span></div></header>'+
    '<div class="broadcast-left"><div class="broadcast-player" id="broadcast-player">'+media+'</div></div>'+
    '<aside class="broadcast-voting" aria-labelledby="broadcast-results-title"><div class="broadcast-voting-title"><h2 id="broadcast-results-title">'+
    (closed?'Final results':open?'Choose your champion':'Challenge results')+'</h2><span class="broadcast-voting-status'+(open?' is-open':'')+'">'+escapeHtml(votingNote)+'</span></div>'+
    '<div class="broadcast-contenders'+(camels.length===2?' is-duel':'')+'" aria-label="Competing camels">'+
    (candidateCards||'<p class="broadcast-no-contenders">No participating camels are available.</p>')+
    (camels.length===2?'<span class="broadcast-vs" aria-hidden="true">VS</span>':'')+'</div>'+
    (challenge.totalVotes===0?'<p class="broadcast-zero-note">No votes have been recorded'+(closed?' for this challenge.':' yet.')+'</p>':'')+
    (open?'<p class="broadcast-vote-note">'+(signedIn?'One recorded vote per account.':'Sign in to cast one recorded vote.')+'</p>':'')+
    '<div class="broadcast-results-footer"><span class="broadcast-total">'+safeCount(challenge.totalVotes)+' total '+(challenge.totalVotes===1?'vote':'votes')+'</span>'+
    (detail?'<a data-link class="broadcast-challenge-link" href="/challenges">Back to Challenges</a>':
      '<a data-link class="broadcast-challenge-link" href="/challenges/'+safeId(id)+'">View challenge details</a>')+'</div></aside></div></section>';
}

export function publishedChallengeCards(challenges=[]) {
  const allClosed=challenges.every(c=>c.status==='CLOSED');
  return '<section class="broadcast-published" id="published-challenges" aria-labelledby="broadcast-published-title">'+
    '<div class="broadcast-published-heading"><h2 id="broadcast-published-title">'+(allClosed?'Past challenges':'More challenges')+'</h2>'+
    '<div class="broadcast-archive-tools"><span>'+challenges.length+' '+(challenges.length===1?'challenge':'challenges')+'</span>'+
    '<label class="broadcast-search"><span class="broadcast-sr-only">Search challenges</span><input type="search" data-challenge-search placeholder="Search challenges"></label>'+
    '<label><span class="broadcast-sr-only">Challenge status</span><select data-challenge-filter><option value="all">All challenges</option><option value="closed">Completed</option><option value="open">Voting open</option><option value="scheduled">Scheduled</option></select></label></div></div>'+
    '<div class="broadcast-archive-body'+(challenges.length<=1?' is-single':'')+'"><div class="broadcast-upcoming">'+
    (challenges.length?challenges.map(c=>{
      const camels=Array.isArray(c.camels)?c.camels:[],closed=c.status==='CLOSED';
      const portraits=camels.slice(0,2).map(camel=>'<figure class="broadcast-card-contender">'+camelImage(camel,'broadcast-card-contender-photo')+
        '<figcaption>'+escapeHtml(camel.name||'Unnamed camel')+'</figcaption></figure>').join('');
      const result=c.totalVotes===0?'No votes recorded':!isCount(c.totalVotes)?'Results unavailable':
        closed?camels.slice(0,2).map(camel=>{
          const share=percent(camel.votePercent);
          return escapeHtml(camel.name||'Camel')+' '+(share===null?'—':share.toLocaleString('en-US',{maximumFractionDigits:2})+'%');
        }).join(' · '):safeCount(c.totalVotes)+' recorded '+(c.totalVotes===1?'vote':'votes');
      return '<article class="broadcast-published-card" data-archive-status="'+(closed?'closed':votingOpen(c)?'open':'scheduled')+'"><div class="broadcast-card-photo" role="group" aria-label="Registered challenge contenders">'+
        (portraits||'<span class="broadcast-card-no-photos">No contender photos</span>')+'</div>'+
        '<div class="broadcast-card-copy"><span class="broadcast-card-badge'+(closed?' broadcast-badge-closed':'')+'">'+featureBadge(c)+'</span>'+
        '<h3>'+escapeHtml(c.title||'Camel Challenge')+'</h3><p class="broadcast-archive-date">'+ico('calendar',15)+escapeHtml(utc(c.opensAt))+' – '+escapeHtml(utc(c.closesAt))+'</p>'+
        '<p>'+ico('group',15)+camels.length+' contenders<span class="broadcast-archive-names">'+camels.map(camel=>escapeHtml(camel.name||'Unnamed camel')).join(' vs ')+'</span></p></div>'+
        '<div class="broadcast-card-results">'+result+'</div><a href="/challenges/'+safeId(c.challengeId)+'" class="broadcast-card-button" data-link>'+
        (closed?'View results':'View challenge')+'</a></article>';
    }).join(''):'<p class="broadcast-upcoming-empty">No other published challenges yet.</p>')+'</div>'+
    (challenges.length<=1?'<img class="broadcast-archive-art" src="/assets/challenge-track-landscape.svg" alt="" aria-hidden="true" loading="lazy">':'')+'<p class="broadcast-filter-empty" hidden role="status">No challenges match your search.</p></div></section>';
}

export function bindBroadcastPreview(root) {
  const archive=root.querySelector('.broadcast-published');
  const search=archive?.querySelector('[data-challenge-search]');
  const filter=archive?.querySelector('[data-challenge-filter]');
  const filterArchive=()=>{
    const query=(search?.value||'').trim().toLocaleLowerCase();
    let matches=0;
    archive.querySelectorAll('.broadcast-published-card').forEach(card=>{
      const show=(!query||card.textContent.toLocaleLowerCase().includes(query))&&
        (!filter||filter.value==='all'||card.dataset.archiveStatus===filter.value);
      card.hidden=!show;
      if(show)matches++;
    });
    const empty=archive.querySelector('.broadcast-filter-empty');
    if(empty)empty.hidden=matches>0||(!query&&filter?.value==='all');
  };
  search?.addEventListener('input',filterArchive);
  filter?.addEventListener('change',filterArchive);
  const section=root.querySelector('.broadcast-preview');
  if(!section)return;
  section.querySelector('[data-preview-fullscreen]')?.addEventListener('click',async()=>{
    try{await section.querySelector('.broadcast-stage')?.requestFullscreen?.();}
    catch{/* Fullscreen is optional and never changes voting data. */}
  });
  const switcher=section.querySelector('[data-stream-switch]');
  const frame=section.querySelector('.broadcast-stream-frame');
  switcher?.addEventListener('click',()=>{
    const id=frame?.dataset?.videoId;
    if(!/^[A-Za-z0-9_-]{11}$/.test(id||''))return;
    const privacy=switcher.dataset.streamMode!=='privacy';
    switcher.dataset.streamMode=privacy?'privacy':'standard';
    frame.src='https://'+(privacy?'www.youtube-nocookie.com':'www.youtube.com')+'/embed/'+id+'?rel=0';
    switcher.textContent=privacy?'Try standard player':'Try alternate player';
    switcher.setAttribute('aria-label',privacy?'Try standard YouTube player':'Try YouTube privacy-enhanced video player');
  });
  root.querySelectorAll?.('img.broadcast-camel-photo, img.broadcast-card-contender-photo').forEach(img=>{
    const fallback=()=>{
      if(img.getAttribute('data-camel-fallback')==='true')return;
      img.setAttribute('data-camel-fallback','true');
      img.src='/assets/challenge-neutral-camel.svg';
      img.alt=(img.alt||'Camel')+' illustration; photo unavailable';
      img.classList.add('broadcast-camel-fallback-image');
    };
    img.addEventListener('error',fallback);
    if(img.complete&&img.naturalWidth===0)fallback();
  });
}
