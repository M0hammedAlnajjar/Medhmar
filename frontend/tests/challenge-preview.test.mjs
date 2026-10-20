import test from 'node:test';
import assert from 'node:assert/strict';
import {broadcastPreview, bindBroadcastPreview} from '../js/challenge-preview.js';

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
 assert.match(html,/No photo/);
 assert.doesNotMatch(html,/744 votes|456 votes|1\.2K watching|Al Bashaer Evening Challenge|Try one sample vote|Reset preview vote/);
 assert.doesNotMatch(html,/data-preview-vote/);
 assert.match(html,/Refresh results/);
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
 assert.match(evil,/No photo/);
});
test('tabs and fullscreen only change presentation, never mutate votes',()=>{
 let labels=[];const tabs=[
  {dataset:{previewTab:'overview'},id:'challenge-overview',addEventListener(kind,cb){this.cb=cb;},
   setAttribute(k,v){labels.push([k,v]);}},
  {dataset:{previewTab:'participants'},id:'challenge-participants',
   addEventListener(kind,cb){this.cb=cb;},setAttribute(k,v){labels.push([k,v]);}}
 ];
 const info={dataset:{overview:'Overview text',participants:'Al Barq (#1) · Shaheen (#2)'},
   setAttribute(k,v){this.label=v;},textContent:''};
 const section={
  querySelector(sel){if(sel==='[data-preview-fullscreen]')return null;if(sel==='#broadcast-info')return info;return null;},
  querySelectorAll(sel){return sel==='[data-preview-tab]'?tabs:[];}
 };
 const root={querySelector(sel){return sel==='.broadcast-preview'?section:null;}};
 bindBroadcastPreview(root);
 tabs[1].cb();
 assert.match(info.textContent,/Shaheen/);
 assert.equal(info.label,'challenge-participants');
 assert.ok(labels.some(([k,v])=>k==='aria-selected'&&v==='true'));
});
