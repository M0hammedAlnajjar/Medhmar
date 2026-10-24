import test from 'node:test';
import assert from 'node:assert/strict';
import {broadcastPreview, publishedChallengeCards, bindBroadcastPreview} from '../js/challenge-preview.js';

const challenge = {
  challengeId: 42,title: 'TEST - Camel Racing Challenge',
  status: 'OPEN', opensAt: new Date(Date.now()-3600000).toISOString(),
  closesAt: new Date(Date.now()+86400000).toISOString(),
  totalVotes: 4,
  camels:[
    {camelId:1,name:'Al Barq',voteCount:3,votePercent:75,photoUrl:null},
    {camelId:2,name:'Shaheen',voteCount:1,votePercent:25,photoUrl:null}
  ]
};
test('published challenge replaces all old sample details with recorded data',()=>{
 const html=broadcastPreview(challenge,{signedIn:true});
 assert.match(html,/TEST - Camel Racing Challenge|CHALLENGE #42/);
 assert.match(html,/Al Barq|Shaheen|3 votes|1 votes|75%|25%/);
 assert.match(html,/data-challenge="42" data-camel="1"/);
 assert.match(html,/data-challenge="42" data-camel="2"/);
 assert.match(html,/No live stream is connected|Not connected/);
 assert.match(html,/class="broadcast-stage"/);
 assert.match(html,/broadcast-stage-center/);
 assert.match(html,/challenge-camel-placeholder\.svg/);
 assert.doesNotMatch(html,/744 votes|456 votes|1\.2K watching|Al Bashaer Evening Challenge|Try one sample vote|Reset preview vote/);
 assert.doesNotMatch(html,/data-preview-vote/);
 assert.doesNotMatch(html,/Refresh results|broadcast-bottom-tools|broadcast-tabs|broadcast-info/);
});
test('unsigned visitors see only authenticated vote links; future/closed challenges cannot vote',()=>{
 const publicView=broadcastPreview(challenge,{signedIn:false});
 assert.match(publicView,/Sign in to vote/);
 assert.doesNotMatch(publicView,/class="vote-btn"/);
 const future=broadcastPreview({...challenge,opensAt:new Date(Date.now()+3600000).toISOString()},{signedIn:true});
 assert.match(future,/VOTING SCHEDULED|Voting unavailable/);
 assert.doesNotMatch(future,/class="vote-btn"/);
 const closed=broadcastPreview({...challenge,status:'CLOSED'},{signedIn:true});
 assert.match(closed,/CLOSED · RESULTS|Voting has closed/);
 assert.doesNotMatch(closed,/class="vote-btn"/);
});
test('empty and API-error states do not advertise fictional events',()=>{
 const noData=broadcastPreview();
 assert.match(noData,/No published challenges yet/);
 assert.match(broadcastPreview(null,{error:'Network error'}),/Challenges temporarily unavailable/);
 for(const html of [noData,broadcastPreview(null,{error:'Network error'})])
  assert.doesNotMatch(html,/Al Barq|Shaheen|live preview|sample votes|744/gi);
});
test('user supplied names and photo URLs cannot inject HTML',()=>{
 const evil=broadcastPreview({...challenge,title:'<img src=x onerror=alert(1)>',
   camels:[{camelId:1,name:'<script>alert(1)</script>',voteCount:0,votePercent:0,
     photoUrl:'javascript:alert(1)'}]},{signedIn:true});
 assert.doesNotMatch(evil,/<script>|<img src=x|src="javascript:/);
 assert.match(evil,/&lt;img src=x|&lt;script&gt;/);
 assert.match(evil,/challenge-camel-placeholder\.svg/);
});
test('the challenge keeps the real voting actions and gallery but omits the old details controls',()=>{
 const html=broadcastPreview(challenge,{signedIn:true});
 for(const removed of ['broadcast-bottom-tools','broadcast-tabs','broadcast-info',
   'data-preview-tab','Refresh results','Voting opens'])assert.ok(!html.includes(removed),removed);
 assert.match(html,/data-preview-fullscreen/);
 assert.doesNotMatch(html,/data-preview-image|data-preview-motion|broadcast-scene-image/);
 assert.match(html,/data-challenge="42" data-camel="1"/);
});

test('approved black live standby keeps real challenge metadata and voting data',()=>{
 const html=broadcastPreview(challenge,{signedIn:true});
 assert.match(html,/class="broadcast-grid"/);
 assert.match(html,/class="broadcast-player"/);
 assert.match(html,/class="broadcast-heading"/);
 assert.match(html,/class="broadcast-voting"/);
 assert.match(html,/class="broadcast-stage"/);
 assert.match(html,/broadcast-stage-dot/);
 assert.match(html,/data-preview-fullscreen/);
 assert.doesNotMatch(html,/data-preview-image|data-preview-motion|broadcast-scene-image/);
 assert.doesNotMatch(html,/data-preview-tab|data-results=|broadcast-info/);
 assert.match(html,/3 votes|75%/);
 assert.doesNotMatch(html,/class="broadcast-facts"|Opens \(UTC\)|Closes \(UTC\)|<small>Broadcast<\/small>/);
 assert.match(html,/CLOSED · RESULTS|VOTING OPEN|VOTING SCHEDULED/);
 assert.match(html,/DEMO PREVIEW · No live stream is connected/);
 assert.match(html,/broadcast-demo-tag|LIVE<\/strong>/);
 assert.match(html,/DEMO|PHOTO PREVIEW/);
 assert.match(html,/broadcast-demo-progress/);
 assert.match(html,/Black livestream placeholder/);
 assert.doesNotMatch(html,/2,300 viewers|Live broadcast connected|1234 votes/);
});
test('published cards show only API data and use safe fallback illustration',()=>{
 const html=publishedChallengeCards([{
  ...challenge,status:'CLOSED',title:'<script>unsafe</script>',
  camels:[
   {camelId:1,name:'Al Barq',voteCount:3,votePercent:75,photoUrl:'javascript:alert(1)'},
   {camelId:2,name:'Shaheen',voteCount:1,votePercent:25,photoUrl:null}
  ]
 }]);
 assert.match(html,/More Published Challenges/);
 assert.match(html,/broadcast-published-card/);
 assert.match(html,/broadcast-published-placeholder/);
 assert.match(html,/More challenges on the way/);
 assert.equal((html.match(/broadcast-published-card/g)||[]).length,1);
 const two=publishedChallengeCards([{...challenge,status:'CLOSED'}, {...challenge,challengeId:43,title:'Real second recorded challenge'}]);
 assert.doesNotMatch(two,/broadcast-published-placeholder|More challenges on the way/);
 assert.match(html,/&lt;script&gt;unsafe&lt;\/script&gt;/);
 assert.match(html,/Al Barq|Shaheen|75%|25%/);
 assert.match(html,/href="\/challenges\/42"/);
 assert.doesNotMatch(html,/<script>|src="javascript:|Desert Speed Challenge|Winter Racing Cup/);
 const empty=publishedChallengeCards([]);
 assert.match(empty,/More published challenges will appear here/);
 assert.doesNotMatch(empty,/broadcast-published-card|Desert Speed Challenge/);
});
test('live standby exposes a working fullscreen action and no fictional player actions',()=>{
 const html=broadcastPreview(challenge,{signedIn:true});
 assert.match(html,/data-preview-fullscreen/);
 assert.doesNotMatch(html,/data-preview-image|data-preview-motion|broadcast-scene-image/);
 assert.match(html,/DEMO/);
 const button={addEventListener(kind,listener){this.click=listener;}};
 let requested=0;
 const player={requestFullscreen(){requested++;return Promise.resolve();}};
 const section={querySelector(sel){if(sel==='[data-preview-fullscreen]')return button;if(sel==='.broadcast-player')return player;return null;}};
 bindBroadcastPreview({querySelector:sel=>sel==='.broadcast-preview'?section:null});
 assert.equal(typeof button.click,'function');
 return button.click().then(()=>assert.equal(requested,1));
});

test('challenge retains schedule on hero but removes extra navigation and times row',()=>{
 const html=broadcastPreview(challenge,{signedIn:true});
 assert.doesNotMatch(html,/broadcast-facts|<small>Challenge ID<\/small>|<small>Opens \(UTC\)<\/small>|<small>Closes \(UTC\)<\/small>|<small>Broadcast<\/small>/);
 assert.match(html,/CHALLENGE #42/);
 assert.match(html,/Opens .* UTC|Opens /);
 assert.doesNotMatch(html,/Voting opens|broadcast-bottom-tools|broadcast-info|data-preview-tab|Refresh results/);
 assert.match(html,/No live stream is connected/);
});

test('approved compact challenge layout keeps true status and fullscreen',async()=>{
 const {readFile}=await import('node:fs/promises');
 const css=await readFile(new URL('../assets/challenge-preview.css',import.meta.url),'utf8');
 const html=broadcastPreview(challenge,{signedIn:false});
 for(const selector of [
  '.app-shell:has(.broadcast-preview) .broadcast-grid',
  '.app-shell:has(.broadcast-preview) .broadcast-voting',
  '.app-shell:has(.broadcast-preview) .broadcast-published-card',
  '.app-shell:has(.broadcast-preview) .broadcast-published-placeholder',
  '@media(max-width:970px)','@media(max-width:660px)'
 ])assert.ok(css.includes(selector),selector);
 assert.match(css,/border-left:1px solid #e9dfd2/);
 assert.match(css,/display:contents/);
 assert.match(css,/grid-template-columns:minmax\(0,33%\) minmax\(0,1fr\)/);
 assert.doesNotMatch(css,/fonts\.googleapis\.com|https?:\/\/|@import/);
 assert.match(css,/url\('\/assets\/racing-hero\.webp'\)/);
 for(const label of ['data-preview-fullscreen','class="broadcast-stage"','DEMO PREVIEW'])assert.ok(html.includes(label),label);
 assert.doesNotMatch(html,/data-preview-tab|id="refresh-challenges"|broadcast-bottom-tools/);
 assert.match(html,/Sign in to vote/);
 assert.doesNotMatch(html,/broadcast-facts/);
});

test('upcoming challenge placeholder matches the reference using decorative inline SVG only',async()=>{
 const {readFile}=await import('node:fs/promises');
 const css=await readFile(new URL('../assets/challenge-preview.css',import.meta.url),'utf8');
 const single=publishedChallengeCards([challenge]);
 const placeholder=single.match(/<aside class="broadcast-published-placeholder"[^]*?<\/aside>/)?.[0];
 assert.ok(placeholder,'the one-record placeholder must render');
 assert.match(placeholder,/class="broadcast-placeholder-landscape"/);
 assert.match(placeholder,/class="broadcast-placeholder-flag"/);
 assert.match(placeholder,/viewBox="0 0 640 185"/);
 assert.match(placeholder,/aria-hidden="true" focusable="false"/);
 assert.match(placeholder,/challenge-mountains/);
 assert.match(placeholder,/More challenges on the way/);
 assert.match(placeholder,/Only real challenge results are shown/);
 assert.doesNotMatch(placeholder,/<img|https?:\/\/|<script|<button/);
 assert.equal((placeholder.match(/<svg/g)||[]).length,2);
 assert.match(css,/\.broadcast-placeholder-landscape/);
 assert.match(css,/\.broadcast-placeholder-copy/);
 assert.match(css,/\.broadcast-placeholder-flag/);
 assert.doesNotMatch(css,/url\('\/assets\/racing-hero\.webp'\) center 43%\/cover no-repeat/);
 const multiple=publishedChallengeCards([challenge,{...challenge,challengeId:43}]);
 assert.doesNotMatch(multiple,/broadcast-placeholder-landscape|broadcast-published-placeholder/);
 const none=publishedChallengeCards([]);
 assert.doesNotMatch(none,/broadcast-placeholder-landscape/);
});

test('heritage head-to-head layout places recorded opponents side-by-side with VS',async()=>{
 const {readFile}=await import('node:fs/promises');
 const css=await readFile(new URL('../assets/challenge-preview.css',import.meta.url),'utf8');
 const fallback=await readFile(new URL('../assets/challenge-camel-placeholder.svg',import.meta.url),'utf8');
 const heritage=await readFile(new URL('../assets/challenge-vote-heritage.svg',import.meta.url),'utf8');
 const html=broadcastPreview(challenge,{signedIn:true});
 assert.match(html,/class="broadcast-contenders is-duel"/);
 assert.equal((html.match(/<article class="broadcast-candidate(?: is-alternate)?">/g)||[]).length,2);
 assert.match(html,/class="broadcast-vs" aria-hidden="true">VS<\/span>/);
 assert.equal((html.match(/challenge-camel-placeholder\.svg/g)||[]).length,2);
 assert.match(html,/3 votes|1 votes|75%|25%/);
 assert.match(html,/data-challenge="42" data-camel="1"/);
 assert.match(html,/data-challenge="42" data-camel="2"/);
 assert.match(css,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/challenge-vote-heritage\.svg/);
 assert.match(css,/@media\(max-width:390px\)/);
 assert.match(fallback,/<svg[\s\S]*<path/);
 assert.match(heritage,/id="sadu"/);
 // No false VS badge when only one opponent is returned by the API.
 const single=broadcastPreview({...challenge,camels:challenge.camels.slice(0,1)},{signedIn:true});
 assert.doesNotMatch(single,/class="broadcast-vs"/);
 const photo=broadcastPreview({...challenge,camels:[{...challenge.camels[0],photoUrl:'https://cdn.example.test/camel.jpg'}]},{signedIn:true});
 assert.match(photo,/src="https:\/\/cdn\.example\.test\/camel\.jpg"/);
 assert.doesNotMatch(photo,/challenge-camel-placeholder\.svg/);
});
