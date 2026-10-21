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
  assert.doesNotMatch(html,/class="admin-system-count">0|class="admin-health-state admin-health-state-ok"/);
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

test('reference visual sections use real metrics and identify uninstrumented services',()=>{
 const response=adminSystemHealthView({data:live,samples:[
  {checkedAt:'2026-10-20T06:59:00Z',durationMs:135,result:'CONNECTED'},
  {checkedAt:'2026-10-20T07:00:00Z',durationMs:89,result:'CONNECTED'}
 ]});
 for(const label of ['Service Status','API Response Time','Resource Usage','Database Activity','Recent Checks'])
  assert.ok(response.includes(label),label);
 assert.equal((response.match(/class="admin-sys-kpi"/g)||[]).length,4);
 assert.match(response,/svg class="admin-sys-chart"/);
 assert.match(response,/89 ms/);
 assert.match(response,/Not monitored/);
 assert.match(response,/View audit logs/);
 assert.doesNotMatch(response,/24.hours|120 ms|32%|58%|Active Connections: 12/);
 const noMeasurements=adminSystemHealthView({data:live});
 assert.match(noMeasurements,/No response-time samples yet/);
 assert.doesNotMatch(noMeasurements,/>120 ms</);
});
test('health chart rejects invalid and negative browser observations',()=>{
 const html=adminSystemHealthView({data:live,samples:[
  {checkedAt:'invalid',durationMs:100,result:'CONNECTED'},
  {checkedAt:live.checkedAt,durationMs:-12,result:'CONNECTED'},
  {checkedAt:live.checkedAt,durationMs:42,result:'CONNECTED'}
 ]});
 assert.match(html,/1 checks/);
 assert.match(html,/42 ms/);
 assert.doesNotMatch(html,/100 ms/);
});
test('health monitoring style is responsive and existing page keeps refresh behavior',async()=>{
 const css=await readFile(new URL('../assets/admin-console.css',import.meta.url),'utf8');
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 for(const selector of ['.admin-console .admin-sys-kpis','.admin-console .admin-sys-content-row','.admin-console .admin-sys-chart',
  '.admin-console .admin-sys-resource','@media(max-width:1090px)']) assert.ok(css.includes(selector),selector);
 assert.match(app,/adminHealthSamples: \[\]/);
 assert.match(app,/samples:state\.adminHealthSamples/);
 assert.match(app,/nowMs\(\)-checkStarted/);
});
