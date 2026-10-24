// Real challenge feature: every title, contender and vote total originates from /api/challenges.
// The spotlight is a black placeholder for a future stream; voting results still come from the API.
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
  /^https?:\/\/[^\s]+$/i.test(value) ||
  /^\/(?:assets|uploads)\/[a-z0-9/_-]+\.(?:webp|png|jpe?g)$/i.test(value)
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
  radio:'<circle cx="12" cy="12" r="2"/><path d="M7.5 7.5a6.5 6.5 0 0 0 0 9m9-9a6.5 6.5 0 0 1 0 9M4 4a11.3 11.3 0 0 0 0 16m16-16a11.3 11.3 0 0 1 0 16"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  pause:'<path d="M8 5v14m8-14v14"/>',
  play:'<path d="m8 5 11 7-11 7z"/>',
  file:'<path d="M6 3h9l5 5v13H6zM15 3v6h5M9 13h8M9 17h8"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  chevron:'<path d="m9 5 7 7-7 7"/>'
};
const ico = (key,size=17) => '<svg width="'+size+'" height="'+size+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(symbols[key]||symbols.file)+'</svg>';
const safeId = id => encodeURIComponent(String(id));
const camelImage = (camel,cls) => validPhoto(camel?.photoUrl)
  ? '<img class="'+cls+'" src="'+escapeHtml(camel.photoUrl)+'" alt="'+escapeHtml(camel.name||'Registered camel')+'" loading="lazy" referrerpolicy="no-referrer">'
  : '<div class="'+cls+' broadcast-photo-placeholder" role="img" aria-label="Photo unavailable for '+escapeHtml(camel?.name||'Camel')+'; camel illustration shown">'+
    '<img src="/assets/challenge-camel-placeholder.svg" alt="" loading="lazy" decoding="async"></div>';

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
  // The reference uses a consistent, neutral silhouette in voting. Verified camel
  // photos remain available in published challenge cards and detail screens.
  const picture='<div class="broadcast-camel-photo broadcast-photo-placeholder" role="img" aria-label="Camel portrait placeholder for '+escapeHtml(camel.name||'Camel')+'">'+
    '<img src="/assets/challenge-neutral-camel.svg" alt="" loading="lazy" decoding="async"></div>';
  const action=open&&signedIn
    ? '<button type="button" class="vote-btn" data-challenge="'+escapeHtml(id)+'" data-camel="'+escapeHtml(camel.camelId)+'">'+ico('check',15)+'Vote for '+escapeHtml(camel.name||'Camel')+'</button>'
    : open?'<a class="broadcast-vote-link" href="/signin" data-link>Sign in to vote</a>'
    :'<button type="button" disabled>'+(challenge.status==='CLOSED'?'Voting closed':'Voting unavailable')+'</button>';
  return '<article class="broadcast-candidate'+(i?' is-alternate':'')+'">'+picture+'<div class="broadcast-candidate-content">'+
    '<div class="broadcast-candidate-title"><h3>'+escapeHtml(camel.name||'Unnamed camel')+'</h3>'+
    '<span>#'+escapeHtml(camel.camelId)+'</span></div>'+
    '<div class="broadcast-count'+(camel.voteCount===0?' is-zero':'')+'"><b class="broadcast-big-count">'+safeCount(camel.voteCount)+'</b><span>'+safeCount(camel.voteCount)+' votes</span><strong>'+
    (share===null?'—':share.toFixed(0)+'%')+'</strong></div>'+
    '<div class="broadcast-meter" role="meter" aria-label="Vote share for '+escapeHtml(camel.name||'Camel')+
    '" aria-valuemin="0" aria-valuemax="100" '+(share===null?'':'aria-valuenow="'+share+'"')+
    '><span style="width:'+(share===null?0:share)+'%"></span></div>'+action+'</div></article>';
 }).join(''):'<p>No participating camels are available.</p>';
 const votingNote=!open?(challenge.status==='CLOSED'?'Voting closed':
  'Voting will be available during the scheduled window.') :
  signedIn?'Voting open · one recorded vote per account.':
  'Sign in to cast one recorded vote.';
 return '<section class="broadcast-preview broadcast-live-data" aria-label="Featured published challenge">'+
  '<div class="broadcast-grid"><div class="broadcast-left">'+
   '<div class="broadcast-player" id="broadcast-player">'+
    '<div class="broadcast-heading"><div><div class="kicker">MEDHMAR <span aria-hidden="true">›</span> CHALLENGE #'+escapeHtml(id)+'</div>'+
      '<h1>'+escapeHtml(String(challenge.title||'').trim().length>2?challenge.title:'Camel Racing Challenge')+'</h1>'+
      '<p>Support your champion. Results come from the Medhmar platform.</p>'+
      '<div class="broadcast-meta"><span>'+ico('pin')+'Muscat, Oman</span><span>'+ico('calendar')+'Opens '+escapeHtml(utc(challenge.opensAt))+'</span>'+
      '<span>'+ico('calendar')+'Closes '+escapeHtml(utc(challenge.closesAt))+'</span></div></div>'+
      '<div class="broadcast-demo-tag" aria-label="Live-style demonstration; no actual livestream"><strong>'+ico('radio',15)+' LIVE</strong><span>DEMO</span></div></div>'+
    '<div class="broadcast-stage" role="group" aria-label="Black livestream placeholder. Demo only; no live video is connected.">'+
      '<div class="broadcast-stage-center" aria-hidden="true"><span class="broadcast-stage-dot"></span><strong>Live</strong></div>'+
      '<div class="broadcast-demo-player" role="group" aria-label="Broadcast placeholder controls">'+
       '<div class="broadcast-demo-progress" aria-hidden="true"><span></span></div>'+
       '<div class="broadcast-toolbar"><span class="broadcast-toolbar-note">DEMO PREVIEW · No live stream is connected.</span>'+
        '<div class="broadcast-photo-actions"><button type="button" data-preview-fullscreen aria-label="Expand broadcast preview">'+ico('expand',16)+' Full screen</button></div>'+
       '</div>'+
      '</div>'+
    '</div>'+
   '</div>'+
  '</div><aside class="broadcast-voting">'+
    '<div class="broadcast-voting-title"><h2>'+(challenge.status==='CLOSED'?'Challenge results':'Choose your champion')+'</h2></div>'+
    '<p>'+escapeHtml(votingNote)+'</p>'+
    '<div class="broadcast-voting-status"><span class="broadcast-live">'+escapeHtml(badge)+'<small>'+escapeHtml(totalVotes)+' recorded votes</small></span></div>'+
    '<div class="broadcast-contenders'+(camels.length===2?' is-duel':'')+'" aria-label="Competing camels">'+candidateCards+
      (camels.length===2?'<span class="broadcast-vs" aria-hidden="true">VS</span>':'')+'</div>'+
    '<p class="broadcast-vote-note">'+ico('check',15)+'Votes shown here are recorded results, not simulated votes.</p>'+
    '<a data-link class="broadcast-challenge-link" href="/challenges/'+safeId(id)+'">View challenge details →</a>'+
  '</aside></div></section>';
}

// Self-contained decorative landscape. Fit the complete scene inside the banner
// so wide containers cannot crop the mountain summit or the palm trunks.
const upcomingLandscape = `<svg class="broadcast-placeholder-landscape" viewBox="0 0 640 185" preserveAspectRatio="xMaxYMid meet" aria-hidden="true" focusable="false">
 <defs>
  <linearGradient id="challenge-mountains" x1="0" y1="0" x2="0" y2="1">
   <stop stop-color="#e9dccb"/><stop offset=".6" stop-color="#f1e7da"/><stop offset="1" stop-color="#faf6ef" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="challenge-mountain-shade" x1="0" y1="0" x2=".5" y2="1">
   <stop stop-color="#d7c4ad" stop-opacity=".48"/><stop offset="1" stop-color="#eee0cc" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="challenge-sand" x1="0" y1="0" x2="0" y2="1">
   <stop stop-color="#e5d1af" stop-opacity=".44"/><stop offset="1" stop-color="#f6eddc" stop-opacity="0"/>
  </linearGradient>
  <linearGradient id="challenge-landscape-fade">
   <stop offset=".18" stop-color="white" stop-opacity="0"/><stop offset=".42" stop-color="white" stop-opacity=".66"/><stop offset=".67" stop-color="white"/>
  </linearGradient>
  <mask id="challenge-landscape-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="640" height="185">
   <rect width="640" height="185" fill="url(#challenge-landscape-fade)"/>
  </mask>
  <g id="challenge-date-palm">
   <path d="M-1 0C-2 20 0 42-4 66H1C4 42 1 21 1 0Z" fill="#c6a97e"/>
   <g fill="#cfb68f">
    <path d="M0 1C-8-15-21-20-32-16-21-16-9-8 0 1Z"/>
    <path d="M0 1C-16-9-30-8-38 2-26-5-12-3 0 1Z"/>
    <path d="M0 1C-20-2-31 7-33 20-25 8-13 3 0 1Z"/>
    <path d="M0 1C-13 5-19 16-17 29-13 16-7 7 0 1Z"/>
    <path d="M0 1C-4-18-12-29-23-31-13-23-6-12 0 1Z"/>
    <path d="M0 1C-2-20 1-30 9-36 4-25 2-12 0 1Z"/>
    <path d="M0 1C4-20 14-29 26-29 14-23 6-11 0 1Z"/>
    <path d="M0 1C13-15 26-17 37-11 23-12 11-5 0 1Z"/>
    <path d="M0 1C19-7 35-2 40 9 28 1 14 1 0 1Z"/>
    <path d="M0 1C21 0 33 12 32 25 25 11 13 6 0 1Z"/>
    <path d="M0 1C13 5 21 20 17 34 15 20 7 8 0 1Z"/>
   </g>
   <g fill="none" stroke="#cfb68f" stroke-width="1.1" stroke-linecap="round">
    <path d="M-7-7l-5 5m0-10-4 5m-1-8-4 5m-2-7-3 4M-9-2l-5 6m-1-8-5 6m-2-7-4 5m-2-6-4 5M-9 4l-1 8m-5-4v8m-5-5v7M-4-12l-5-1m2-7-6-1m3-5-5-1M2-12l5-4m-4-2 5-5m-4-2 5-4M8-12l7 1m-3-7 7 1m-2-5 6 1M10-4l5 4m1-7 5 4m2-5 6 4M12 2l5 6m2-4 5 6m2-3 5 6M10 7l-1 7m6-2-1 8m6-2-2 8"/>
   </g>
  </g>
 </defs>
 <g mask="url(#challenge-landscape-mask)">
  <path d="M174 130 228 99 244 91 266 74 283 67 299 54 315 61 330 48 343 46 362 28 377 35 392 46 412 34 425 25 440 29 456 14 469 24 483 41 494 38 511 52 522 46 543 62 556 58 581 79 603 85 640 108V154H174Z" fill="url(#challenge-mountains)" opacity=".65"/>
  <path d="m315 61 15-13 13-2 19-18-6 23-12 9-8 18-16 12-27 14 20-29Z" fill="url(#challenge-mountain-shade)" opacity=".5"/>
  <path d="m362 28 15 7 15 11 20-12-18 24-12-6-6 11-10-18-14 25 6-23Z" fill="#ecdfcf" opacity=".55"/>
  <path d="m401 67 24-42 15 4 16-15-13 28-16 14-10 23-23 16Z" fill="url(#challenge-mountain-shade)" opacity=".54"/>
  <path d="m456 14 13 10 14 17 11-3 17 14-23-9-10-7 8 18-17-13-5-14-5 23-7-12-19 30 10-28Z" fill="url(#challenge-mountain-shade)" opacity=".73"/>
  <path d="m459 22 9 26 13 13-12-3 11 18-19-19-7-19-13 17 9-23Z" fill="#fcf8f0" opacity=".65"/>
  <path d="m494 38 17 14 11-6 21 16-20-8-5 10-10-5-5 13-17-19 12 3Z" fill="#e8d9c4" opacity=".3"/>
  <path d="M221 130 259 105 284 95 309 79 329 88 351 69 367 81 389 65 413 91 432 81 452 100 473 81 503 102 530 94 566 113 602 105 640 118V153H221Z" fill="url(#challenge-mountains)" opacity=".45"/>
  <path d="m311 80 18 8 22-19-10 18-15 13-29 14Z" fill="url(#challenge-mountain-shade)" opacity=".28"/>
  <path d="M158 165C257 146 300 137 385 135S542 105 640 117V185H158Z" fill="url(#challenge-sand)" opacity=".8"/>
  <path d="M200 157C293 145 371 153 443 133S568 118 640 126" fill="none" stroke="#e2caa5" stroke-width="2.2" opacity=".35"/>
  <path d="M220 171C320 149 381 158 465 139S576 132 640 133" fill="none" stroke="#f0dfc4" stroke-width="6" opacity=".55"/>
  <path d="M202 173C316 156 395 161 472 143S574 138 640 141" fill="none" stroke="#e6cfac" stroke-width="1.2" opacity=".28"/>
  <g fill="#d6bd96" opacity=".15">
   <ellipse cx="393" cy="141" rx="23" ry="2"/><ellipse cx="552" cy="137" rx="49" ry="3"/>
  </g>
  <g opacity=".57">
   <use href="#challenge-date-palm" transform="translate(390 112) scale(.43)"/>
   <use href="#challenge-date-palm" transform="translate(405 117) scale(.34)"/>
   <use href="#challenge-date-palm" transform="translate(532 94) scale(.65)"/>
   <use href="#challenge-date-palm" transform="translate(557 69) scale(.98)"/>
  </g>
 </g>
</svg>`;

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
     upcomingLandscape+
     '<div class="broadcast-placeholder-copy">'+
     "<svg class=\"broadcast-placeholder-flag\" viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\" fill=\"none\"><path d=\"M5 21V3\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\"/><path d=\"M6 4c5-3 8 3 13 0v10c-5 3-8-3-13 0Z\" fill=\"currentColor\"/></svg>"+
     '<strong>More challenges on the way</strong>'+
     '<p>Additional recorded competitions will appear here when the platform publishes them. Only real challenge results are shown.</p></div></aside>':'')+
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
 // Show the decorative SVG if a stored photo URL no longer resolves.
 section.querySelectorAll?.('img.broadcast-camel-photo').forEach(img=>{
  img.addEventListener('error',()=>{
   if(img.getAttribute('data-camel-fallback')==='true')return;
   img.setAttribute('data-camel-fallback','true');
   img.src='/assets/challenge-camel-placeholder.svg';
   img.alt=(img.alt||'Camel')+' illustration; photo unavailable';
   img.classList.add('broadcast-camel-fallback-image');
  });
 });
 // The video canvas is intentionally inert until a real, authorized stream is configured.
}
