import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {adminChallengesView,adminOrganizationsView} from '../js/admin-modules.js';
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
