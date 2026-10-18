import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { matchRoute, canAccessRoute } from '../js/routes.js';
import { adminShell } from '../js/admin-console.js';

const source = (await readFile(new URL('../js/app.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/gm, '')
  .replace("window.addEventListener('popstate',render); init();", '');
function navbar(user) {
 const root={addEventListener:()=>{}};
 const context=vm.createContext({
  matchRoute, canAccessRoute, location:{pathname:'/home',hash:'',search:''},
  localStorage:{getItem:()=>null}, document:{querySelector:q=>q==='#app'?root:null},
  authView:()=>'',adminShell
 });
 vm.runInContext(source,context);context.testUser=user;
 vm.runInContext('state.user=testUser;',context);
 return vm.runInContext("topbar('/home')",context);
}
const user=role=>({userId:7,fullName:'Tester',roles:[role]});
test('regular navigation never contains admin tools, regardless of role',()=>{
 for(const acct of [null,user('VIEWER'),user('OWNER'),user('TRAINER'),user('ORGANIZER'),user('ADMIN')]){
  const html=navbar(acct);
  assert.doesNotMatch(html,/class="nav-admin"|class="nav-mobile-admin"|Admin Dashboard|Manage Users|Audit Log|href="\/admin"/);
 }
});
test('owner and trainer keep their agreements in regular More',()=>{
 for(const role of ['OWNER','TRAINER']){
  const html=navbar(user(role));
  assert.match(html,/class="pedigree-more"/);
  assert.match(html,/href="\/agreements"/);
 }
});
test('admin uses a completely separate shell with no community navigation',()=>{
 const html=adminShell({user:user('ADMIN'),active:'/admin/audit-logs',body:'Audit body'});
 assert.match(html,/class="admin-console"/);
 assert.match(html,/href="\/admin\/audit-logs" data-link class="active" aria-current="page"/);
 assert.match(html,/Manage Users|Admin Settings|Dashboard|id="admin-signout"/);
 assert.doesNotMatch(html,/class="topbar"|nav-mobile-user|href="\/home"|href="\/races"|href="\/marketplace"|href="\/camels"/);
});
test('admin routes are not accessible to regular users',()=>{
 for(const url of ['/admin','/admin/users','/admin/settings','/admin/audit-logs','/admin/audit-logs/1/edit']){
  const r=matchRoute(url)?.route;assert.ok(r,url);
  for(const role of ['VIEWER','OWNER','TRAINER','ORGANIZER'])
   assert.equal(canAccessRoute(r,user(role)),false);
  assert.equal(canAccessRoute(r,user('ADMIN')),true);
 }
});
