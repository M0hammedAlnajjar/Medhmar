import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {adminChallengesView,adminOrganizationsView,loadChallengeCamels,bindCamelPhotoPicker} from '../js/admin-modules.js';
import {adminShell} from '../js/admin-console.js';
import {matchRoute,canAccessRoute} from '../js/routes.js';

const page=content=>({content,page:0,size:20,totalElements:content.length,totalPages:content.length?1:0});
const draft={challengeId:10,title:'Real draft',status:'DRAFT',creatorId:3,totalVotes:0,
  opensAt:'2030-01-01T09:00:00Z',closesAt:'2030-01-02T09:00:00Z',
  camels:[{camelId:33,name:'Camel A'}]};
const org={organizationId:5,name:'Test Club',region:'Muscat',description:'Local club',
  contactEmail:'club@example.invalid',status:'INACTIVE',createdAt:'2026-10-10T00:00:00Z'};
test('admin navigation and all module routes are guarded',()=>{
 for(const path of ['/admin/challenges','/admin/organizations']){
  const route=matchRoute(path)?.route;assert.ok(route);
  assert.equal(canAccessRoute(route,{userId:1,roles:['ADMIN']}),true);
  for(const role of ['VIEWER','OWNER','ORGANIZER','TRAINER'])
   assert.equal(canAccessRoute(route,{userId:1,roles:[role]}),false);
  assert.equal(canAccessRoute(route,null),false);
  const html=adminShell({user:{fullName:'Admin'},active:path,body:'Content'});
  assert.match(html,new RegExp('href="'+path+'" data-link class="active"'));
 }
});
test('challenges show real draft with safe data and backend-supported actions',()=>{
 const html=adminChallengesView({data:page([draft])});
 assert.match(html,/Real draft|Challenge #10|Publish & open voting|Attach camel ID|Create challenge/);
 assert.match(html,/data-admin-challenge-edit="10"|data-admin-challenge-camel="10"/);
 assert.match(html,/disabled title="Assign exactly two camels first"/);
 assert.doesNotMatch(html,/Mock challenge|demo challenge/i);
 const ready=adminChallengesView({data:page([{...draft,camels:[{camelId:33,name:'A'},{camelId:34,name:'B'}]}])});
 assert.match(ready,/data-admin-challenge-action="open"/);
 assert.doesNotMatch(ready,/disabled title="Assign exactly two camels first"/);
 const closed=adminChallengesView({data:page([{...draft,status:'CLOSED',camels:[]}])});
 assert.doesNotMatch(closed,/data-admin-challenge-action="open"|data-admin-challenge-action="close"/);
});
test('reference layout has summary metrics, filter tabs, paired camels and visible editor',()=>{
 const html=adminChallengesView({data:page([draft])});
 assert.match(html,/<h1\b[^>]*>Challenges<\/h1>/);
 assert.match(html,/Total challenges|Open for voting|Drafts|Total votes/);
 assert.match(html,/role="tablist" aria-label="Challenge status"/);
 assert.match(html,/data-admin-challenge-filter="OPEN"/);
 assert.match(html,/class="mhch-layout"/);
 assert.match(html,/class="mhch-duo"/);
 assert.match(html,/id="mhch-new-title">New challenge/);
 assert.match(html,/id="admin-challenge-create"/);
 assert.match(html,/name="opensDate"|name="opensTime"/);
 assert.match(html,/name="closesDate"|name="closesTime"/);
 assert.match(html,/Details<\/strong>|Camels<\/strong>|Publish<\/strong>/);
 assert.match(html,/2030-01-01T13:00/);
 assert.match(html,/01 Jan 2030/);
 assert.match(html,/Muscat|GMT\+4/);
 assert.match(html,/id="admin-challenge-search"/);
 assert.match(html,/data-challenge-status="DRAFT"/);
 assert.match(html,/Create challenge/);
 assert.doesNotMatch(html,/admin-challenge-hero|admin-challenge-toolbar|admin-module-create/);
});
test('real camel portraits, votes and status are safely rendered',()=>{
 const c={...draft,status:'OPEN',totalVotes:5,camels:[
   {camelId:33,name:'Al Barq',photoUrl:'/assets/mock-camels/camel-7.jpg',voteCount:3,votePercent:60},
   {camelId:34,name:'<Camel>',photoUrl:'javascript:alert(1)',voteCount:2,votePercent:40}
 ]};
 const html=adminChallengesView({data:page([c])});
 assert.match(html,/class="mhch-vs"/);
 assert.match(html,/class="mhch-camel-picture"/);
 assert.match(html,/src="\/assets\/mock-camels\/camel-7.jpg"/);
 assert.match(html,/3 votes · 60.0%/);
 assert.match(html,/2 votes · 40.0%/);
 assert.match(html,/&lt;Camel&gt;/);
 assert.doesNotMatch(html,/javascript:alert|<Camel>/);
 assert.match(html,/Photo unavailable/);
 assert.match(html,/Voting open/);
 assert.match(html,/View details/);
 assert.doesNotMatch(html,/data-admin-challenge-action="open"/);
});
test('summary distinguishes current page counts from total counts',()=>{
 const part={content:[draft],page:1,size:1,totalElements:5,totalPages:5};
 const html=adminChallengesView({data:part});
 assert.match(html,/Total challenges/);
 assert.match(html,/Open \(this page\)|Drafts \(this page\)/);
 assert.match(html,/Votes \(this page\)/);
 assert.match(html,/current page of API results/);
 assert.match(html,/href="\/admin\/challenges\?page=0"/);
 assert.match(html,/href="\/admin\/challenges\?page=2"/);
});
test('organizations can be edited, status managed and input safely escaped',()=>{
 const html=adminOrganizationsView({data:page([org])});
 assert.match(html,/Test Club|INACTIVE|Add organization|Edit organization & status/);
 assert.match(html,/data-admin-organization-edit="5"/);
 assert.match(html,/name="status"/);
 const evil=adminOrganizationsView({data:page([{...org,name:'<img src=x onerror=alert(1)>'}])});
 assert.match(evil,/&lt;img src=x/);assert.doesNotMatch(evil,/<img src=x/);
});
test('module screens use explicit empty/error states without fabricated counts',()=>{
 assert.match(adminChallengesView({data:page([])}),/No challenges yet/);
 assert.match(adminOrganizationsView({data:page([])}),/No organizations registered/);
 assert.match(adminChallengesView({error:'<script>alert(1)</script>'}),/&lt;script&gt;/);
 assert.match(adminOrganizationsView({error:'Backend unavailable'}),/Organizations unavailable/);
});
test('module data is loaded after server-side admin verification',async()=>{
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 const api=await readFile(new URL('../js/api.js',import.meta.url),'utf8');
 assert.match(app,/adminModulesApi\.challenges\(page\)/);
 assert.match(app,/adminModulesApi\.organizations\(page\)/);
 assert.match(app,/bindAdminModules\(root/);
 assert.match(api,/\/api\/admin\/challenges/);
 assert.match(api,/\/api\/admin\/organizations/);
});

test('administrator can hide, show and delete challenges with recorded votes',()=>{
 const visible=adminChallengesView({data:page([{...draft,status:'OPEN',totalVotes:12,hidden:false}])});
 assert.match(visible,/data-admin-challenge-action="hide"/);
 assert.match(visible,/Hide from public/);
 assert.match(visible,/data-admin-challenge-action="delete"/);
 assert.match(visible,/data-admin-challenge-action="close"/);
 const hidden=adminChallengesView({data:page([{...draft,status:'CLOSED',totalVotes:12,hidden:true}])});
 assert.match(hidden,/data-admin-challenge-action="show"/);
 assert.match(hidden,/Show publicly/);
 assert.match(hidden,/Closed · Hidden/);
 assert.match(hidden,/data-admin-challenge-action="delete"/);
 assert.doesNotMatch(hidden,/data-admin-challenge-action="hide"/);
});

test('draft camel picker lists API names and excludes already attached camels',()=>{
 const camels=[{camelId:1,name:'Al Barq',breed:'Omani'},{camelId:2,name:'Shaheen',breed:'Omani'}];
 const html=adminChallengesView({data:page([{...draft,camels:[camels[0]]}]),camels});
 assert.match(html,/<select name="camelId" required>/);
 assert.match(html,/<option value="2">Shaheen · #2 · Omani<\/option>/);
 assert.doesNotMatch(html,/<option value="1">|Registered camel ID|Attach camel ID/);
 const full=adminChallengesView({data:page([{...draft,camels}]),camels});
 assert.match(full,/<select name="camelId" required disabled>/);
 assert.match(full,/Two camels already attached/);
 const failed=adminChallengesView({data:page([draft]),camelError:'Unable to load registered camels.'});
 assert.match(failed,/Unable to load registered camels/);
 assert.match(failed,/<select name="camelId" required disabled>/);
});

test('camel picker loads every API page and rejects directory failures',async()=>{
 const calls=[];
 const result=await loadChallengeCamels({list:async q=>{
  calls.push(q);return {totalPages:2,content:q.page===0?[{camelId:1,name:'First'}]:[{camelId:2,name:'Second'}]};
 }});
 assert.deepEqual(result.map(c=>c.camelId),[1,2]);
 assert.deepEqual(calls,[{page:0,size:100},{page:1,size:100}]);
 await assert.rejects(loadChallengeCamels({list:async()=>({content:[]})}),/Invalid camel directory/);
 await assert.rejects(loadChallengeCamels({list:async()=>{throw new Error('offline');}}),/offline/);
 assert.deepEqual(await loadChallengeCamels({list:async()=>({content:[],totalPages:1})},()=>false),[]);
});

test('camel picker renders stored photos and safe missing-photo placeholders',()=>{
 const camels=[{camelId:8,name:'Shaheen',photoUrl:'/uploads/shaheen.jpg'},
  {camelId:9,name:'<script>bad</script>',photoUrl:'javascript:alert(1)'}];
 const html=adminChallengesView({data:page([{...draft,camels:[]}]),camels});
 assert.match(html,/data-camel-choice="8" aria-pressed="false"/);
 assert.match(html,/src="\/uploads\/shaheen.jpg"/);
 assert.match(html,/Choose a camel by photo/);
 assert.match(html,/Photo unavailable/);
 assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);
 assert.doesNotMatch(html,/<script>|src="javascript:/);
});

test('photo choices synchronize with native selection without submitting a challenge',()=>{
 const select={value:'',disabled:false,addEventListener(type,fn){this[type]=fn;}};
 const choice=id=>({dataset:{camelChoice:id},setAttribute(key,value){this[key]=value;},
  addEventListener(type,fn){this[type]=fn;}});
 const first=choice('8'),second=choice('9');
 bindCamelPhotoPicker({querySelector:()=>select,querySelectorAll:selector=>selector==='[data-camel-choice]'?[first,second]:[]});
 first.click();
 assert.equal(select.value,'8');assert.equal(first['aria-pressed'],'true');
 assert.equal(second['aria-pressed'],'false');
 select.value='9';select.change();
 assert.equal(first['aria-pressed'],'false');assert.equal(second['aria-pressed'],'true');
 select.disabled=true;first.click();assert.equal(select.value,'9');
});
