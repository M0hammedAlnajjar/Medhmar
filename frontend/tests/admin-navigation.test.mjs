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
 assert.match(html,/Manage Users|Admin Settings|Dashboard|Challenges|Organizations|System Health|id="admin-signout"/);
 assert.doesNotMatch(html,/class="topbar"|nav-mobile-user|href="\/home"|href="\/races"|href="\/marketplace"|href="\/camels"/);
});
test('admin routes are not accessible to regular users',()=>{
 for(const url of ['/admin','/admin/users','/admin/settings','/admin/audit-logs','/admin/audit-logs/1','/admin/challenges','/admin/organizations','/admin/system-health']){
  const r=matchRoute(url)?.route;assert.ok(r,url);
  for(const role of ['VIEWER','OWNER','TRAINER','ORGANIZER'])
   assert.equal(canAccessRoute(r,user(role)),false);
  assert.equal(canAccessRoute(r,user('ADMIN')),true);
 }
});

test('Back to Website opens public Home and preserves the choice until returning to admin', async()=>{
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 const start=app.indexOf('const publicWebsiteMode =');
 const end=app.indexOf('function toast(',start);
 assert.ok(start>0 && end>start,'website navigation helper must exist');
 const location={pathname:'/admin',search:''};
 const history={state:{},pushState(next,_title,url){
  this.state=next;
  const parsed=new URL(url,'http://localhost');
  location.pathname=parsed.pathname;
  location.search=parsed.search;
 }};
 const context=vm.createContext({history,location,URL,render:()=>{}});
 vm.runInContext(app.slice(start,end)+'\nthis.goTo = go; this.websiteMode = publicWebsiteMode;',context);
 context.goTo('/home?view=website');
 assert.equal(location.pathname,'/home');
 assert.equal(context.websiteMode(),true);
 assert.equal(history.state.publicWebsite,true);
 context.goTo('/races');
 assert.equal(location.pathname,'/races');
 assert.equal(history.state.publicWebsite,true,'public browsing must survive further SPA navigation');
 // Direct opening or refreshing the explicit URL must also stay in public mode.
 history.state={}; location.pathname='/home'; location.search='?view=website';
 assert.equal(context.websiteMode(),true);
 context.goTo('/admin');
 assert.equal(history.state.publicWebsite,undefined,'returning to admin resets the public-view mode');
 assert.equal(context.websiteMode(),false);
});

test('ADMIN sees the public site shell in explicit website mode while admin pages stay separate',async()=>{
 const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
 const start=app.indexOf('const shell = (body,');
 const end=app.indexOf('const demoNote',start);
 assert.ok(start>0 && end>start);
 const location={pathname:'/home'};
 const history={state:{publicWebsite:true}};
 const context=vm.createContext({
  location,history,
  state:{user:{userId:1,roles:['ADMIN']}},
  hasAnyRole:(user,role)=>user.roles.includes(role),
  adminArea:path=>path==='/admin'||path.startsWith('/admin/'),
  normalizePath:()=>location.pathname,
  publicWebsiteMode:()=>history.state.publicWebsite===true,
  adminShell:()=>'<div class="admin-console">ADMIN</div>',
  topbar:()=>'<header>Public navigation</header>',
  homeFooter:()=>'<footer>Public footer</footer>'
 });
 vm.runInContext(app.slice(start,end)+'\nthis.viewShell = shell;',context);
 assert.match(context.viewShell('HOME','/home'),/class="app-shell"/);
 assert.doesNotMatch(context.viewShell('HOME','/home'),/class="admin-console"/);
 location.pathname='/admin';
 assert.match(context.viewShell('ADMIN','/admin'),/class="admin-console"/);
 location.pathname='/home';history.state={};
 assert.match(context.viewShell('DEFAULT','/home'),/class="admin-console"/);
 assert.match(app,/!authPaths\.has\(path\) && !publicWebsiteMode\(\)/);
});
