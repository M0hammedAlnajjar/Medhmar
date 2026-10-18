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
 assert.match(adminDashboard({user:{fullName:'Boss'},page:{totalElements:17}}),/17/);
 const error=adminDashboard({user:{fullName:'Boss'},page:null,error:'Unavailable'});
 assert.match(error,/Unavailable/);
 assert.doesNotMatch(error,/<strong>\d+<\/strong>/);
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
