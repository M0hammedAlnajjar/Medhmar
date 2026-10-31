import test from 'node:test';
import assert from 'node:assert/strict';
import {broadcastPreview,publishedChallengeCards,bindBroadcastPreview} from '../js/challenge-preview.js';

const challenge={
 challengeId:42,title:'Registered challenge',status:'OPEN',
 opensAt:new Date(Date.now()-3600000).toISOString(),
 closesAt:new Date(Date.now()+86400000).toISOString(),totalVotes:4,
 camels:[
  {camelId:1,name:'Al Barq',voteCount:3,votePercent:75,photoUrl:'/uploads/camels/barq.jpg'},
  {camelId:2,name:'Shaheen',voteCount:1,votePercent:25,photoUrl:'/uploads/camels/shaheen.png'}
 ]
};

test('the page preserves registered identities, photos, schedule and vote targets',()=>{
 const html=broadcastPreview({...challenge,title:'a'},{signedIn:true});
 assert.match(html,/<h1>Challenges<\/h1>/);
 assert.match(html,/<h2>a<\/h2>/);
 for(const value of ['CHALLENGE #42','Al Barq','Shaheen','75% of votes','25% of votes',
   '/uploads/camels/barq.jpg','/uploads/camels/shaheen.png',
   'data-challenge="42" data-camel="1"','data-challenge="42" data-camel="2"','4 total votes'])
  assert.ok(html.includes(value),value);
 assert.match(html,/Opens .* UTC/);
 assert.match(html,/Closes .* UTC/);
 assert.doesNotMatch(html,/challenge-neutral-camel\.svg|broadcast-winner/);
});

test('offline media has an honest unavailable state and no pretend playback controls',()=>{
 const html=broadcastPreview(challenge);
 assert.match(html,/BROADCAST OFFLINE/);
 assert.match(html,/Broadcast unavailable/);
 assert.match(html,/No stream is connected to this challenge/);
 assert.doesNotMatch(html,/<iframe|broadcast-demo|broadcast-stage-dot|data-preview-fullscreen|>Live</);
});

test('only signed-in accounts can vote inside the valid open window',()=>{
 assert.match(broadcastPreview(challenge,{signedIn:true}),/class="vote-btn"/);
 const guest=broadcastPreview(challenge);
 assert.match(guest,/href="\/signin" data-link>Sign in to vote/);
 assert.doesNotMatch(guest,/class="vote-btn"/);
 for(const record of [
  {...challenge,status:'CLOSED'},
  {...challenge,opensAt:new Date(Date.now()+3600000).toISOString()},
  {...challenge,closesAt:new Date(Date.now()-1000).toISOString()}
 ])assert.doesNotMatch(broadcastPreview(record,{signedIn:true}),/class="vote-btn"/);
});

test('final results highlight exactly one positive winner, without disabled vote buttons',()=>{
 const html=broadcastPreview({...challenge,status:'CLOSED'});
 assert.match(html,/<h2 id="broadcast-results-title">Final results<\/h2>/);
 assert.match(html,/Voting closed/);
 assert.equal((html.match(/class="broadcast-winner"/g)||[]).length,1);
 assert.match(html,/<article class="broadcast-candidate is-winner">[^]*?<h3>Al Barq<\/h3>/);
 assert.doesNotMatch(html,/<button|class="vote-btn"|Sign in to vote/);
});

test('ties, zero votes, missing counts and inconsistent totals never invent a winner',()=>{
 for(const record of [
  {...challenge,totalVotes:0,camels:challenge.camels.map(c=>({...c,voteCount:0,votePercent:0}))},
  {...challenge,camels:challenge.camels.map(c=>({...c,voteCount:2,votePercent:50}))},
  {...challenge,totalVotes:5},
  {...challenge,totalVotes:null},
  {...challenge,camels:[{...challenge.camels[0],voteCount:-1},challenge.camels[1]]},
  {...challenge,camels:[]}
 ])assert.doesNotMatch(broadcastPreview({...record,status:'CLOSED'}),/broadcast-winner|is-winner/);
 assert.doesNotMatch(broadcastPreview(challenge),/broadcast-winner|is-winner/);
});

test('unknown and zero vote shares remain visible without fabricated percentages',()=>{
 const html=broadcastPreview({...challenge,camels:[
  {...challenge.camels[0],voteCount:0,votePercent:0},
  {...challenge.camels[1],votePercent:NaN}
 ]});
 assert.match(html,/0% of votes/);
 assert.match(html,/Vote share unavailable/);
 assert.doesNotMatch(html,/NaN%|undefined%/);
});

test('missing or broken data shows a retryable state without a fabricated event',()=>{
 for(const [html,title] of [
  [broadcastPreview(),'No published challenges yet'],
  [broadcastPreview(null,{error:'Network error'}),'Challenges temporarily unavailable']
 ]){
  assert.ok(html.includes(title));
  assert.match(html,/id="refresh-challenges"/);
  assert.doesNotMatch(html,/Al Barq|Shaheen|broadcast-stage|total votes|sample event/i);
 }
});

test('HTML and unsafe photo URLs remain escaped on both public presentations',()=>{
 const record={...challenge,title:'<img src=x onerror=alert(1)>',camels:[
  {...challenge.camels[0],name:'<script>unsafe</script>',photoUrl:'javascript:alert(1)'},
  {...challenge.camels[1],photoUrl:'https://cdn.example.test/photo.jpg" onerror="alert(1)'}
 ]};
 for(const html of [broadcastPreview(record),publishedChallengeCards([record])]){
  assert.match(html,/&lt;img src=x|&lt;script&gt;/);
  assert.match(html,/challenge-neutral-camel\.svg/);
  assert.doesNotMatch(html,/<script>|<img src=x|src="javascript:|src="[^"]*" onerror=/);
 }
});

test('head-to-head markup is used only for two registered contenders',()=>{
 const duel=broadcastPreview(challenge);
 assert.equal((duel.match(/class="broadcast-vs"/g)||[]).length,1);
 for(const camels of [[],challenge.camels.slice(0,1),[...challenge.camels,{...challenge.camels[0],camelId:3}]]){
  const html=broadcastPreview({...challenge,camels});
  assert.doesNotMatch(html,/class="broadcast-vs"/);
  assert.equal((html.match(/<article class="broadcast-candidate/g)||[]).length,camels.length);
 }
});

test('detail and spotlight render the same data, stream and voting rules',()=>{
 const record={...challenge,streamUrl:'https://youtu.be/dQw4w9WgXcQ'};
 for(const signedIn of [false,true]){
  const spotlight=broadcastPreview(record,{signedIn}).split('<div class="broadcast-grid">')[1];
  const detail=broadcastPreview(record,{signedIn,detail:true}).split('<div class="broadcast-grid">')[1];
  assert.equal(detail.replace('href="/challenges">Back to Challenges',
   'href="/challenges/42">View challenge details'),spotlight);
 }
});

test('archive rows preserve registered portraits, final percentages and detail links',()=>{
 const html=publishedChallengeCards([{...challenge,status:'CLOSED'}]);
 assert.match(html,/Past challenges/);
 assert.match(html,/broadcast-badge-closed/);
 assert.equal((html.match(/<article class="broadcast-published-card"/g)||[]).length,1);
 for(const value of ['/uploads/camels/barq.jpg','/uploads/camels/shaheen.png',
   '<figcaption>Al Barq</figcaption>','75%','25%','href="/challenges/42"','View results'])
  assert.ok(html.includes(value),value);
 assert.doesNotMatch(html,/More challenges on the way|Upcoming published challenges/);
});

test('an archive without votes says so instead of showing meaningless percentage bars',()=>{
 const html=publishedChallengeCards([{...challenge,status:'CLOSED',totalVotes:0,
  camels:challenge.camels.map(c=>({...c,voteCount:0,votePercent:0}))}]);
 assert.match(html,/No votes recorded/);
 assert.doesNotMatch(html,/\d+%|broadcast-meter|broadcast-winner/);
});

test('empty and mixed-status archives never create records or label open events as past',()=>{
 const empty=publishedChallengeCards();
 assert.match(empty,/No other published challenges yet/);
 assert.doesNotMatch(empty,/broadcast-published-card|Registered challenge/);
 const mixed=publishedChallengeCards([challenge,{...challenge,challengeId:43,status:'CLOSED'}]);
 assert.match(mixed,/>More challenges</);
 assert.doesNotMatch(mixed,/>Past challenges</);
 assert.equal((mixed.match(/<article class="broadcast-published-card"/g)||[]).length,2);
});

test('a failed or cached-broken registered photo falls back once to a labeled illustration',()=>{
 let onError;
 const img={
  src:'/uploads/missing.jpg',alt:'Al Barq',complete:true,naturalWidth:0,attrs:{},
  getAttribute(name){return this.attrs[name];},
  setAttribute(name,value){this.attrs[name]=value;},
  classList:{add(){}},
  addEventListener(type,listener){if(type==='error')onError=listener;}
 };
 const section={querySelector:()=>null};
 bindBroadcastPreview({querySelector:()=>section,querySelectorAll:()=>[img]});
 assert.equal(img.src,'/assets/challenge-neutral-camel.svg');
 assert.equal(img.alt,'Al Barq illustration; photo unavailable');
 onError();
 assert.equal(img.alt,'Al Barq illustration; photo unavailable');
});

test('connected broadcasts retain a real fullscreen action',async()=>{
 let click,requested=0;
 const button={addEventListener(type,listener){click=listener;}};
 const stage={requestFullscreen:async()=>requested++};
 const section={querySelector(selector){
  return selector==='[data-preview-fullscreen]'?button:selector==='.broadcast-stage'?stage:null;
 }};
 bindBroadcastPreview({querySelector:()=>section});
 await click();
 assert.equal(requested,1);
});
