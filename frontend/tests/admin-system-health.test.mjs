import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { adminSystemHealthView } from '../js/admin-system-health.js';
import { adminShell } from '../js/admin-console.js';
import { matchRoute,canAccessRoute } from '../js/routes.js';

const live={backendStatus:'RESPONDING',databaseStatus:'CONNECTED',
  totalChallenges:3,totalVotes:9,checkedAt:'2026-10-20T07:00:00Z'};

test('real backend and database status show counts, not assumed availability',()=>{
 const html=adminSystemHealthView({data:live});
 assert.match(html,/Connected|Responding|3|9|20 Oct 2026/);
 assert.match(html,/id="admin-health-check"/);
 assert.match(html,/Total saved votes across all challenges/);
 assert.doesNotMatch(html,/jdbc:|root password|api-key|fake uptime/i);
});
test('disconnected DB never turns missing counts into misleading zeros',()=>{
 const html=adminSystemHealthView({data:{...live,databaseStatus:'DISCONNECTED',totalChallenges:null,totalVotes:null}});
 assert.match(html,/Disconnected|Counts are unavailable/);
 assert.doesNotMatch(html,/class="admin-system-count">0</);
 assert.match(html,/class="admin-system-count">—</);
});
test('unreachable backend and invalid response are not displayed as connected',()=>{
 for(const inputs of [{error:'Connection failed'},{data:null},{data:{...live,databaseStatus:'UNVERIFIED'}}]){
  const html=adminSystemHealthView(inputs);
  assert.match(html,/Health check unavailable/);
  assert.doesNotMatch(html,/Connected|class="admin-system-count"/);
 }
});
test('health page guard is ADMIN-only, in standalone admin shell',()=>{
 const route=matchRoute('/admin/system-health')?.route;
 assert.ok(route);
 assert.equal(canAccessRoute(route,{userId:1,roles:['ADMIN']}),true);
 for(const role of ['VIEWER','OWNER','TRAINER','ORGANIZER'])
  assert.equal(canAccessRoute(route,{userId:1,roles:[role]}),false);
 assert.equal(canAccessRoute(route,null),false);
 const html=adminShell({user:{userId:1,roles:['ADMIN']},active:'/admin/system-health',body:'Report'});
 assert.match(html,/href="\/admin\/system-health" data-link class="active" aria-current="page"/);
 assert.doesNotMatch(html,/class="topbar"|href="\/home"/);
});
test('frontend calls protected health GET and binds manual refresh',async()=>{
 const api=await readFile(new URL('../js/api.js',import.meta.url),'utf8');
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 assert.match(api,/api\('\/api\/admin\/system-health'\)/);
 assert.match(app,/adminHealthApi\.check\(\)/);
 assert.match(app,/\$\('#admin-health-check'\)\?\.addEventListener\('click',\(\)=>render\(\)\)/);
});
