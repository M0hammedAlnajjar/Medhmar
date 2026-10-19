import test from 'node:test';
import assert from 'node:assert/strict';
import {adminShell,adminDashboard,adminUsersView,adminSettingsView} from '../js/admin-console.js';
test('admin shell has only internal administrator routes',()=>{
 const html=adminShell({user:{fullName:'<Admin>'},active:'/admin/users',body:'Only administration data'});
 assert.match(html,/&lt;Admin&gt;/);
 assert.match(html,/href="\/admin\/users" data-link class="active" aria-current="page"/);
 assert.doesNotMatch(html,/href="\/home"|href="\/races"|href="\/pedigree"|href="\/marketplace"|href="\/camels"/);
});
test('admin dashboard contains live count and no fake stats',()=>{
 assert.match(adminDashboard({user:{fullName:'Boss'},summary:{totalUsers:17,activeCamels:3,upcomingRaces:2,activeListings:1,activity:Array.from({length:7},(_,i)=>({date:'2026-10-'+String(12+i).padStart(2,'0'),newUsers:i,newCamels:i+1,newListings:2*i})),recentEvents:[],generatedAt:'2026-10-18T10:00:00Z'}}),/17/);
 const error=adminDashboard({user:{fullName:'Boss'},summary:null,error:'Unavailable'});
 assert.match(error,/Unavailable/);
 assert.doesNotMatch(error,/admin-metric-card[^]*?<strong>\d+<\/strong>/);
});
test('admin user list escapes sensitive text and supports pagination',()=>{
 const html=adminUsersView({users:[{userId:9,fullName:'<b>',email:'test@example.com',roles:['OWNER'],accountStatus:'ACTIVE'}],page:{page:1,totalPages:3,totalElements:26}});
 assert.match(html,/&lt;b&gt;/);assert.doesNotMatch(html,/<b>/);
 assert.match(html,/manage-user|26 registered users|data-page="2"/);
 assert.doesNotMatch(adminUsersView({users:null,error:'Denied'}),/manage-user/);
});
test('admin settings use a dedicated profile form without community features',()=>{
 const html=adminSettingsView({user:{fullName:'Admin',email:'admin@example.com'}});
 assert.match(html,/id="settings-form"|name="preferredLanguage"/);
 assert.doesNotMatch(html,/YOUR WORKSPACE|My Camels|Explore Races/);
});

test('dashboard renders real weekly activity, secure recent events and honest status',()=>{
 const summary={totalUsers:20,activeCamels:9,upcomingRaces:4,activeListings:2,
  activity:Array.from({length:7},(_,i)=>({date:'2026-10-'+String(12+i).padStart(2,'0'),newUsers:i,newCamels:i+1,newListings:i+2})),
  recentEvents:[{auditId:22,actionType:'OWNER_ROLE_GRANTED',entityType:'User',entityId:18,actorUserId:5,createdAt:'2026-10-18T10:00:00Z'}],
  generatedAt:'2026-10-18T10:00:00Z'};
 const html=adminDashboard({user:{fullName:'Admin'},summary});
 for(const title of ['Total Users','Registered Camels','Upcoming / Open Races','Active Listings','Platform Activity','Recent Activity','System Status'])
  assert.match(html,new RegExp(title.replaceAll('/','\\/')));
 assert.match(html,/OWNER_ROLE_GRANTED|Owner Role Granted/);
 assert.match(html,/admin-activity-svg/);
 assert.match(html,/Database queries/);
 assert.match(html,/Not monitored/);
 assert.doesNotMatch(html,/1,248|642|118|All Systems Operational|Payment Service.+Online/);
});
test('dashboard escapes audit values and never presents missing values as zero',()=>{
 const html=adminDashboard({user:{fullName:'<Admin>'},summary:{totalUsers:0,activeCamels:0,upcomingRaces:0,activeListings:0,
 activity:[],recentEvents:[{actionType:'<script>',entityType:'<img>',entityId:2,createdAt:'invalid'}]}});
 assert.match(html,/&lt;Script&gt;|&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>|<img>/);
 const offline=adminDashboard({user:{fullName:'Admin'},error:'API unavailable'});
 assert.match(offline,/Unverified|Activity data is unavailable/);
 assert.doesNotMatch(offline,/all systems operational/i);
});


test('approved dashboard design is integrated at the existing admin route',()=>{
 const live={totalUsers:5,activeCamels:4,upcomingRaces:2,activeListings:3,
  generatedAt:'2026-10-19T00:00:00Z',
  activity:Array.from({length:7},(_,i)=>({date:'2026-10-'+String(i+12),newUsers:i,newCamels:0,newListings:1})),
  recentEvents:[]};
 const html=adminDashboard({user:{fullName:'Operator'},summary:live});
 assert.match(html,/id="admin-dashboard-title"/);
 assert.match(html,/id="admin-refresh"/);
 assert.match(html,/admin-data-status/);
 assert.match(html,/Live platform data/);
 assert.match(html,/admin-activity-svg/);
 assert.doesNotMatch(html,/admin-dashboard\.html|demo users|mock metrics/i);
});

test('invalid chart records do not become misleading zero values',()=>{
 const summary={totalUsers:8,activeCamels:5,upcomingRaces:1,activeListings:2,
  generatedAt:'2026-10-19T00:00:00Z',
  activity:Array.from({length:7},(_,i)=>({date:'2026-10-'+String(i+12),newUsers:i,newCamels:0,newListings:1})),
  recentEvents:[]};
 summary.activity[0].newUsers=null;
 const html=adminDashboard({user:{fullName:'Operator'},summary});
 assert.match(html,/Activity data is unavailable/);
 assert.doesNotMatch(html,/class="admin-activity-svg"/);
});

test('offline mode exposes refresh without claiming platform data is live',()=>{
 const html=adminDashboard({user:{fullName:'Operator'},error:'Network unavailable'});
 assert.match(html,/id="admin-refresh"/);
 assert.match(html,/Data unavailable/);
 assert.match(html,/Unverified/);
 assert.doesNotMatch(html,/Live platform data|admin-health-good/);
});

test('admin layout stays separate and dashboard refresh can be bound by SPA', async()=>{
 const shell=adminShell({user:{userId:1,fullName:'Owner',roles:['ADMIN']},active:'/admin',body:'Dashboard'});
 assert.match(shell,/class="admin-console"/);
 assert.match(shell,/href="\/admin" data-link class="active"/);
 assert.doesNotMatch(shell,/href="\/home"|href="\/races"|href="\/camels"/);
 const {readFile}=await import('node:fs/promises');
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 assert.match(app,/\$\('#admin-refresh'\)\?\.addEventListener\('click',\(\)=>render\(\)\)/);
 const css=await readFile(new URL('../assets/admin-console.css',import.meta.url),'utf8');
 assert.match(css,/grid-template-columns:235px minmax\(0,1fr\)/);
 assert.doesNotMatch(css,/\.admin-header-inner/);
});


test('reference-matched administration header and dashboard panels are present',()=>{
 const shell=adminShell({user:{fullName:'Admin'},active:'/admin',body:'Content'});
 assert.match(shell,/admin-sidebar-brand|admin-topbar-breadcrumb/);
 assert.match(shell,/Administrator workspace/);
 assert.match(shell,/aria-current="page"/);
 assert.doesNotMatch(shell,/href="\/home"|href="\/camels"|href="\/marketplace"/);
 const data={totalUsers:12,activeCamels:8,upcomingRaces:3,activeListings:2,
   generatedAt:'2026-10-19T00:00:00Z',
   activity:Array.from({length:7},(_,i)=>({date:'2026-10-'+String(i+12),newUsers:i,newCamels:i+1,newListings:i})),
   recentEvents:[]};
 const html=adminDashboard({summary:data});
 assert.match(html,/PLATFORM OVERVIEW/);
 assert.match(html,/class="admin-chart-period"/);
 assert.match(html,/admin-status-check/);
 assert.match(html,/admin-panel-health/);
 assert.match(html,/12|Registered Camels/);
});
test('reference styling stays inside the dedicated administration scope',async()=>{
 const {readFile}=await import('node:fs/promises');
 const css=await readFile(new URL('../assets/admin-console.css',import.meta.url),'utf8');
 assert.match(css,/\.admin-console \.admin-topbar-breadcrumb/);
 assert.match(css,/\.admin-console \.admin-status-check/);
 assert.match(css,/racing-hero\.webp/);
 assert.match(css,/@media\(max-width:450px\)/);
});

test('admin banner is a committed WebP asset and replaces the old image',async()=>{
 const {readFile}=await import('node:fs/promises');
 const css=await readFile(new URL('../assets/admin-console.css',import.meta.url),'utf8');
 const image=await readFile(new URL('../assets/admin-dashboard-race.webp',import.meta.url));
 assert.equal(image.toString('ascii',0,4),'RIFF');
 assert.equal(image.toString('ascii',8,12),'WEBP');
 assert.ok(image.byteLength>10_000,'real banner asset must not be a placeholder');
 assert.match(css,/url\('\/assets\/admin-dashboard-race\.webp'\)/);
 const finalRule=css.slice(css.lastIndexOf('Medhmar admin banner:'));
 assert.doesNotMatch(finalRule,/home-racetrack\.jpg|racing-hero\.webp/);
 assert.match(finalRule,/background-position:62% 26%/);
 assert.match(finalRule,/background-position:center 26%/);
 assert.match(finalRule,/min-height:244px/);
});
