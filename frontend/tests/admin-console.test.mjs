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
 for(const title of ['Total Users','Registered Camels','Upcoming Races','Active Listings','Platform Activity','Recent Activity','Quick access'])
  assert.match(html,new RegExp(title.replaceAll('/','\\/')));
 assert.match(html,/OWNER_ROLE_GRANTED|Owner Role Granted/);
 assert.match(html,/admin-activity-svg/);
 assert.match(html,/Review listings|Manage users/);
 assert.match(html,/System health|Audit logs/);
 assert.doesNotMatch(html,new RegExp('<strong>(?:1,248|642|118)</strong>|All Systems Operational|Payment Service.+Online'));
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
 assert.match(html,/Activity data is unavailable/);
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
 assert.match(html,/admin-quick-links/);
 assert.match(html,/admin-dashboard-quick/);
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


test('Manage Users implements the approved admin theme with live, page-scoped role cards',()=>{
 const users=[
  {userId:7,fullName:'Test Owner',email:'owner@test.invalid',roles:['OWNER','VIEWER'],accountStatus:'ACTIVE',joinedAt:'2026-10-01T00:00:00Z'},
  {userId:8,fullName:'Test Trainer',email:'trainer@test.invalid',roles:['TRAINER'],accountStatus:'SUSPENDED',joinedAt:'2026-09-01T00:00:00Z'}
 ];
 const html=adminUsersView({users,page:{page:0,totalPages:2,totalElements:30}});
 assert.match(html,/class="admin-users-hero"/);
 assert.match(html,/class="admin-users-stats"/);
 assert.match(html,/30 registered users/);
 assert.match(html,/role-owner/);
 assert.match(html,/status-suspended/);
 assert.match(html,/id="admin-user-filters"/);
 assert.match(html,/id="admin-users-refresh"/);
 assert.match(html,/class="admin-users-toolbar"/);
 assert.match(html,/class="admin-users-field admin-users-field-search"/);
 assert.match(html,/id="admin-users-clear"/);
 assert.match(html,/Total Users includes all registered accounts/);
 assert.doesNotMatch(html,/admin-users-filter-btn/);
 assert.match(html,/data-user-search="/);
 assert.match(html,/view-admin-user/);
 assert.match(html,/small-btn manage-user/);
 assert.match(html,/On this page/);
 assert.match(html,/name="role"/);
 assert.match(html,/name="joined"/);
 assert.doesNotMatch(html,/1,248|892|214|Add User|last month|\+12%/);
});
test('User directory escapes malicious content, has safe placeholders and no pretend totals',()=>{
 const html=adminUsersView({users:[{
  userId:10,fullName:'<img src=x onerror=alert(1)>',email:'<script>alert(1)</script>',
  roles:['ADMIN','UNKNOWN'],accountStatus:'ACTIVE',joinedAt:'invalid'
 }],page:{page:0,totalPages:1}});
 assert.doesNotMatch(html,/<img src=x|<script>/);
 assert.match(html,/&lt;img/);
 assert.match(html,/&lt;script&gt;/);
 assert.match(html,/class="admin-users-stat/);
 assert.match(html,/User count unavailable/);
 const denied=adminUsersView({users:null,error:'Forbidden <script>'});
 assert.match(denied,/&lt;script&gt;/);
 assert.doesNotMatch(denied,/class="small-btn manage-user/);
 assert.doesNotMatch(denied,/Showing 1 to/);
});
test('User management filters and read-only view are wired into the existing SPA',async()=>{
 const {readFile}=await import('node:fs/promises');
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 const css=await readFile(new URL('../assets/admin-console.css',import.meta.url),'utf8');
 assert.match(app,/function bindAdminUserControls\(\)/);
 assert.match(app,/bindAdminUserControls\(\);/);
 assert.match(app,/\.view-admin-user/);
 assert.match(app,/admin-users-refresh/);
 assert.match(css,/\.admin-console \.admin-users-hero/);
 assert.match(css,/\.admin-console \.admin-users-filters/);
 assert.match(css,/@media\(max-width:560px\)/);
});


test('supplied Medhmar camel brand replaces the old site and admin assets',async()=>{
 const {readFile}=await import('node:fs/promises');
 const [publicLogo,camelIcon,stacked,css,app]=await Promise.all([
  readFile(new URL('../assets/medhmar-logo.svg',import.meta.url),'utf8'),
  readFile(new URL('../assets/medhmar-logo-icon.svg',import.meta.url),'utf8'),
  readFile(new URL('../assets/medhmar-logo-stacked.svg',import.meta.url),'utf8'),
  readFile(new URL('../assets/admin-console.css',import.meta.url),'utf8'),
  readFile(new URL('../js/app.js',import.meta.url),'utf8')
 ]);
 for (const logo of [publicLogo,camelIcon,stacked]) {
  assert.match(logo,/data:image\/webp;base64,UklG/);
  assert.match(logo,/<svg[^>]+viewBox=/);
 }
 assert.match(stacked,/CAMEL RACING PLATFORM|Camel Racing Platform/);
 assert.match(app,/src="\/assets\/medhmar-logo\.svg"/);
 const shell=adminShell({user:{userId:1,roles:['ADMIN']},active:'/admin/users'});
 assert.match(shell,/src="\/assets\/medhmar-admin-logo-approved\.webp"/);
 assert.match(shell,/class="admin-mobile-brand"[^>]*>.*medhmar-admin-logo-compact\.webp/);
 assert.doesNotMatch(shell,/<strong>MEDHMAR<\/strong><span>ADMINISTRATION<\/span>/);
 assert.match(css,/\.admin-console \.admin-sidebar-brand img/);
});

test('approved sharp logo is committed locally and used only in administrator chrome', async()=>{
 const {readFile}=await import('node:fs/promises');
 for(const name of ['medhmar-admin-logo-approved.webp','medhmar-admin-logo-compact.webp']){
  const data=await readFile(new URL('../assets/'+name,import.meta.url));
  assert.equal(data.toString('ascii',0,4),'RIFF');
  assert.equal(data.toString('ascii',8,12),'WEBP');
  assert.ok(data.length>20_000);
 }
 const shell=adminShell({user:{userId:1,fullName:'Admin',roles:['ADMIN']},active:'/admin'});
 assert.match(shell,/medhmar-admin-logo-approved\.webp/);
 assert.match(shell,/medhmar-admin-logo-compact\.webp/);
 assert.doesNotMatch(shell,/<strong>MEDHMAR<\/strong><span>ADMINISTRATION<\/span>/);
 const css=await readFile(new URL('../assets/admin-console.css',import.meta.url),'utf8');
 assert.match(css,/\.admin-console \.admin-sidebar-brand img/);
 assert.match(css,/width:210px/);
});

test('real weekly count chart has 3 tabs and only nonzero days draw bars',()=>{
 const summary={totalUsers:2,activeCamels:0,upcomingRaces:0,activeListings:0,
  recentEvents:[],generatedAt:'2026-10-19T00:00:00Z',
  activity:Array.from({length:7},(_,i)=>({
   date:'2026-10-'+String(i+13),newUsers:i>4?1:0,newCamels:0,newListings:0
  }))};
 const html=adminDashboard({summary});
 assert.match(html,/role="tablist" aria-label="Platform activity category"/);
 for(const id of ['users','camels','listings'])assert.match(html,new RegExp('id="admin-chart-tab-'+id+'"'));
 const users=html.split('id="admin-chart-panel-users"')[1].split('</section>')[0];
 assert.equal((users.match(/class="admin-chart-bar admin-chart-bar-users"/g)||[]).length,2);
 assert.equal((users.match(/class="admin-chart-zero"/g)||[]).length,5);
 assert.match(users,/18 Oct 2026: 1 new user/);
 assert.match(html,/data-chart-panel="camels"[^>]* hidden/);
 assert.match(html,/Last 7 days · UTC/);
 assert.doesNotMatch(html,/<polyline|class="admin-chart-legend"/);
});
test('invalid API activity never fabricates zeroes or tabs',()=>{
 const activity=Array.from({length:7},(_,i)=>({
  date:'2026-10-'+String(i+13),newUsers:0,newCamels:0,newListings:0
 }));
 activity[3].newListings=null;
 const html=adminDashboard({summary:{totalUsers:0,activeCamels:0,upcomingRaces:0,activeListings:0,recentEvents:[],activity}});
 assert.match(html,/Activity data is unavailable/);
 assert.doesNotMatch(html,/role="tablist"/);
});
test('admin chart tabs bind inside the existing SPA',async()=>{
 const {readFile}=await import('node:fs/promises');
 const code=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 assert.ok(code.includes('bindAdminChartTabs();'));
 assert.ok(code.includes('bindAdminChartTabs } from'));
});


test('dashboard reference groups admin navigation and links to operational pages',()=>{
 const shell=adminShell({user:{fullName:'Admin'},active:'/admin',body:'Dashboard'});
 for(const heading of ['OVERVIEW','MANAGEMENT','SYSTEM','Back to Website'])assert.match(shell,new RegExp(heading));
 assert.match(shell,/href="\/" data-link class="admin-back-website"/);
 const html=adminDashboard({summary:null});
 for(const path of ['/admin/users','/admin/marketplace','/admin/system-health','/admin/audit-logs'])
  assert.ok(html.includes('href="'+path+'" data-link'),path);
 assert.match(html,/admin-dashboard-quick|Quick access/);
 assert.match(html,/Data unavailable/);
 assert.doesNotMatch(html,/admin-panel-health|All Systems Operational/);
});
test('responsive admin dashboard selectors are scoped to the dedicated workspace',async()=>{
 const css=await (await import('node:fs/promises')).readFile(new URL('../assets/admin-console.css',import.meta.url),'utf8');
 for(const token of ['.admin-console .admin-sidebar-group','.admin-console .admin-dashboard-quick','.admin-console .admin-quick-links','.admin-console .admin-chart-caption'])assert.ok(css.includes(token));
});
