import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {broadcastPreview,bindBroadcastPreview} from '../js/challenge-preview.js';
import {adminChallengesView} from '../js/admin-modules.js';

const source={
 challengeId:42,title:'Broadcast test',status:'OPEN',
 opensAt:'2030-01-01T10:00:00Z',closesAt:'2030-01-02T10:00:00Z',
 creatorId:9,totalVotes:0,camels:[]
};
const page=c=>({content:[c],page:0,size:20,totalElements:1,totalPages:1});

test('valid YouTube watch, share and live links offer embedded playback and a direct fallback',()=>{
 for(const url of ['https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                   'https://youtu.be/dQw4w9WgXcQ',
                   'https://www.youtube.com/live/dQw4w9WgXcQ']) {
  const html=broadcastPreview({...source,streamUrl:url});
  assert.ok(html.includes('https://www.youtube.com/embed/dQw4w9WgXcQ'));
  assert.match(html,/data-video-id="dQw4w9WgXcQ"/);
  assert.match(html,/data-stream-switch/);
  assert.ok(html.includes('href="https://www.youtube.com/watch?v=dQw4w9WgXcQ"'));
  assert.match(html,/target="_blank" rel="noopener"/);
  assert.match(html,/class="broadcast-stream-frame"/);
  assert.match(html,/VIDEO<\/strong><span>LINKED/);
  assert.doesNotMatch(html,/DEMO PREVIEW/);
 }
});

test('unconfigured or malicious video links never become iframe sources',()=>{
 for(const url of [null,'javascript:alert(1)','https://evil.youtube.com/watch?v=dQw4w9WgXcQ',
                   'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ',
                   'https://youtube.com/watch?v=%22%3E%3Cscript%3E']) {
  const html=broadcastPreview({...source,streamUrl:url});
  assert.doesNotMatch(html,/<iframe/);
  assert.match(html,/No live stream is connected/);
 }
});

test('admin gets an escaped persisted stream link editor on published challenges',()=>{
 const html=adminChallengesView({data:page({...source,streamUrl:'https://youtu.be/dQw4w9WgXcQ'})});
 assert.match(html,/data-admin-challenge-stream="42"/);
 assert.match(html,/name="streamUrl"/);
 assert.match(html,/value="https:\/\/youtu.be\/dQw4w9WgXcQ"/);
 assert.match(html,/Save stream link/);
 const evil=adminChallengesView({data:page({...source,streamUrl:'" onfocus="alert(1)'})});
 assert.doesNotMatch(evil,/value="" onfocus=/);
});

test('URL writes use the admin-only backend endpoint',async()=>{
 const api=await readFile(new URL('../js/api.js',import.meta.url),'utf8');
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 assert.match(api,/\/api\/admin\/challenges\/.*\/stream/);
 assert.match(app,/adminModulesApi\.updateStream/);
});

test('alternate player button changes only between approved YouTube embed hosts',()=>{
 const iframe={dataset:{videoId:'dQw4w9WgXcQ'},src:'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0'};
 const button={
  dataset:{},textContent:'Try alternate player',attributes:{},
  setAttribute(name,value){this.attributes[name]=value;},
  addEventListener(kind,handler){if(kind==='click')this.click=handler;}
 };
 const section={querySelector(selector){
  if(selector==='[data-stream-switch]')return button;
  if(selector==='.broadcast-stream-frame')return iframe;
  return null;
 }};
 const root={querySelector(selector){return selector==='.broadcast-preview'?section:null;}};
 bindBroadcastPreview(root);
 assert.equal(typeof button.click,'function');
 button.click();
 assert.equal(iframe.src,'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0');
 assert.equal(button.textContent,'Try standard player');
 button.click();
 assert.equal(iframe.src,'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0');
 assert.equal(button.textContent,'Try alternate player');
 iframe.dataset.videoId='<script>';
 button.click();
 assert.equal(iframe.src,'https://www.youtube.com/embed/dQw4w9WgXcQ?rel=0');
});
