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
