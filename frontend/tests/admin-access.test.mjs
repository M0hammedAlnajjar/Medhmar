import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { matchRoute, canAccessRoute } from '../js/routes.js';
import { renderAccount } from '../js/account-view.js';
import { adminShell, adminDashboard, adminUsersView, adminSettingsView } from '../js/admin-console.js';
import { adminAuditListView, adminAuditDetailView } from '../js/admin-audit.js';
import { adminChallengesView, adminOrganizationsView } from '../js/admin-modules.js';
import { adminSystemHealthView } from '../js/admin-system-health.js';
import { hasAnyRole } from '../js/format.js';
import { demo } from '../js/data.js';
import { bindPedigreeImages } from '../js/pedigree-view.js';

const source = (await readFile(new URL('../js/app.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/gm, '')
  .replace("window.addEventListener('popstate',render); init();", '');

function harness(user, { me = async () => user, users, dashboard, audits, auditDetail, challengeList, organizationList, health } = {}) {
  const root = { innerHTML: '', addEventListener: () => {} };
  const location = { pathname: '/admin', hash: '', search: '' };
  const requests = [];
  const context = vm.createContext({
    bindAdminChartTabs: () => {}, bindAdminModules: () => {}, bindBroadcastPreview: () => {}, bindTrainingJournal: () => {}, bindOrganizationDirectory: () => {}, bindHeritageExperiences: () => {}, bindDigitalRaceCards: () => {}, bindMarketplaceBrowse: () => {}, bindTrainerProfile: () => {},
    session: user, demo, matchRoute, canAccessRoute, bindPedigreeImages, renderAccount, hasAnyRole, adminShell, adminDashboard, adminUsersView, adminSettingsView, adminAuditListView, adminAuditDetailView, adminChallengesView, adminOrganizationsView, adminSystemHealthView,
    normalizePath: () => location.pathname,
    authView: () => '<h1>Sign In</h1>',
    authApi: { me: async () => { requests.push('me'); return me(); } },
    adminModulesApi: {
      challenges:async () => {requests.push('challenges');return challengeList
        ?challengeList():{content:[],page:0,size:20,totalElements:0,totalPages:0};},
      organizations:async () => {requests.push('organizations');return organizationList
        ?organizationList():{content:[],page:0,size:20,totalElements:0,totalPages:0};}
    },
    URLSearchParams,
    adminAuditApi: {
      list: async () => { requests.push('audit-list'); return audits ? audits() :
        { content:[{auditId:1,actionType:'LOGIN',entityType:'User',entityId:1,createdAt:'2026-10-20T00:00:00Z'}],
          page:0,size:20,totalElements:1,totalPages:1 }; },
      one: async () => { requests.push('audit-detail'); return auditDetail ? auditDetail() :
        {auditId:1,actionType:'LOGIN',entityType:'User',entityId:1,createdAt:'2026-10-20T00:00:00Z'}; }
    },
    adminHealthApi: {
      check: async () => {
        requests.push('system-health');
        return health ? health() : {
          backendStatus:'RESPONDING',databaseStatus:'CONNECTED',
          totalChallenges:1,totalVotes:1,checkedAt:'2026-10-20T08:00:00Z'
        };
      }
    },
    adminApi: { 
      dashboard: async () => {
        requests.push('dashboard');
        return dashboard ? dashboard() : { totalUsers:1,activeCamels:2,upcomingRaces:3,activeListings:4,
          activity:Array.from({length:7},(_,i)=>({date:'2026-10-12',newUsers:i,newCamels:i,newListings:i})),
          recentEvents:[],generatedAt:'2026-10-18T10:00:00Z' };
      },
      users: async () => {
        requests.push('users');
        return users ? users() : { content: [{ userId: 50, fullName: 'Live Account', email: 'live@example.com', roles: ['VIEWER'], accountStatus: 'ACTIVE' }], page: 0, totalPages: 1, totalElements: 1 };
      }
    },
    document: {
      querySelector: selector => selector === '#app' ? root : null,
      querySelectorAll: () => [], documentElement: {},
    },
    localStorage: { getItem: () => null }, URLSearchParams, location,
    history: { replaceState: (_, __, path) => { location.pathname = path; } },
  });
  vm.runInContext(source, context);
  vm.runInContext('state.user=session;', context);
  return { root, location, requests, context, render: () => vm.runInContext('render()', context) };
}

test('admin route denies guests, every ordinary role and malformed identities', () => {
  const route = matchRoute('/admin/').route;
  for (const user of [null, {}, { roles: ['ADMIN'] }, { userId: 1, roles: 'ADMIN' }, ...['VIEWER', 'OWNER', 'TRAINER', 'ORGANIZER'].map(role => ({ userId: 1, roles: [role] }))]) {
    assert.equal(canAccessRoute(route, user), false);
  }
  assert.equal(canAccessRoute(route, { userId: 1, roles: ['OWNER', 'ADMIN'] }), true);
});

test('ordinary users cannot see admin links, dashboard, demo accounts or trigger user-list requests', async () => {
  for (const role of ['VIEWER', 'OWNER', 'TRAINER', 'ORGANIZER']) {
    const app = harness({ userId: 1, fullName: 'User', roles: [role] });
    await app.render();
    assert.match(app.root.innerHTML, /Access denied/);
    assert.doesNotMatch(app.root.innerHTML, /href="\/admin"|Admin Dashboard|manage-user|mohammed@medhmar/);
    assert.deepEqual(app.requests, []);
  }
});

test('denied admin access shows account roles and safe recovery instructions', async () => {
 const app = harness({userId:42,fullName:'Ali <script>',roles:['VIEWER'],accountStatus:'ACTIVE'});
 await app.render();
 assert.match(app.root.innerHTML,/Only accounts with the ADMIN role/);
 assert.match(app.root.innerHTML,/Current roles:<\/strong> VIEWER/);
 assert.match(app.root.innerHTML,/Ali &lt;script&gt;/);
 assert.doesNotMatch(app.root.innerHTML,/<script>/);
 assert.match(app.root.innerHTML,/Sign out and sign in again/);
 assert.match(app.root.innerHTML,/href="\/settings"/);
 assert.doesNotMatch(app.root.innerHTML,/class="admin-console"|href="\/admin"/);
 assert.deepEqual(app.requests,[]);
});

test('direct guest navigation redirects to sign in without requesting admin data', async () => {
  const app = harness({ fullName: 'Guest', roles: [] });
  await app.render();
  assert.equal(app.location.pathname, '/signin');
  assert.match(app.root.innerHTML, /Sign In/);
  assert.deepEqual(app.requests, []);
});

test('admin role is rechecked with the server and revoked roles cannot load users', async () => {
  const app = harness({ userId: 1, roles: ['ADMIN'] }, { me: async () => ({ userId: 1, roles: ['VIEWER'] }) });
  await app.render();
  assert.deepEqual(app.requests, ['me']);
  assert.match(app.root.innerHTML, /Access denied/);
  assert.doesNotMatch(app.root.innerHTML, /href="\/admin"|manage-user/);
});

test('verified admin receives live users, never demo accounts or fake totals', async () => {
  const app = harness({ userId: 1, roles: ['ADMIN'] });
  await app.render();
  assert.deepEqual(app.requests, ['me', 'dashboard']);
  assert.match(app.root.innerHTML, /class="admin-console"/);
  assert.match(app.root.innerHTML, /Total Users/);
  assert.match(app.root.innerHTML, /id="admin-refresh"|Live platform data/);
  assert.doesNotMatch(app.root.innerHTML, /Live Account/);
  app.location.pathname='/admin/users';
  await app.render();
  assert.match(app.root.innerHTML, /Live Account/);
  assert.match(app.root.innerHTML, /1 registered users/);
  assert.deepEqual(app.requests,['me','dashboard','me','users']);
  assert.doesNotMatch(app.root.innerHTML, /2,100|mohammed@medhmar|preview data/);
});

test('API failures fail closed, including expired sessions and forbidden responses', async () => {
  for (const status of [401, 403, 500]) {
    const app = harness({ userId: 1, roles: ['ADMIN'] }, { dashboard: async () => { throw Object.assign(new Error('Denied'), { status }); } });
    await app.render();
    assert.doesNotMatch(app.root.innerHTML, /class="small-btn manage-user"|Live Account|[0-9]+ registered users/);
    assert.equal(vm.runInContext('state.adminUsers', app.context), null);
    if (status === 401) assert.equal(app.location.pathname, '/signin');
    // A verified administrator may still see the dedicated Admin menu on a
    // transient 500, but never the protected user-list records.
    if (status === 500) {
      assert.match(app.root.innerHTML, /Could not load dashboard data/);
      assert.match(app.root.innerHTML, /class="admin-console"/);
    } else {
      assert.doesNotMatch(app.root.innerHTML, /class="admin-console"/);
    }
  }
});

test('late admin responses cannot restore the dashboard after navigation', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const app = harness({ userId: 1, roles: ['ADMIN'] }, { dashboard: () => pending });
  const render = app.render();
  await new Promise(resolve => setImmediate(resolve));
  app.location.pathname = '/signin';
  await app.render();
  release({ totalUsers:99,activeCamels:0,upcomingRaces:0,activeListings:0,activity:[],recentEvents:[], generatedAt:'2026-10-18T10:00:00Z' });
  await render;
  assert.match(app.root.innerHTML, /Sign In/);
  assert.doesNotMatch(app.root.innerHTML, /99|Admin Dashboard/);
  assert.equal(vm.runInContext('state.adminUsers', app.context), null);
});


test('verified administrator can browse read-only audit history and detail', async () => {
  const app = harness({ userId: 10, fullName: 'Administrator', roles: ['ADMIN'] });
  app.location.pathname='/admin/audit-logs';
  await app.render();
  assert.deepEqual(app.requests,['me','audit-list']);
  assert.match(app.root.innerHTML, /LOGIN|Read only|View details/);
  assert.doesNotMatch(app.root.innerHTML, /Add Audit|Edit Audit|Delete/);
  app.location.pathname='/admin/audit-logs/1';
  await app.render();
  assert.deepEqual(app.requests,['me','audit-list','me','audit-detail']);
  assert.match(app.root.innerHTML,/Audit event #1|Back to audit history/);
});
test('revoked administrator cannot download audit records', async () => {
  const app = harness({ userId: 10, roles: ['ADMIN'] },
    {me:async()=>({userId:10,roles:['OWNER']})});
  app.location.pathname='/admin/audit-logs';
  await app.render();
  assert.deepEqual(app.requests,['me']);
  assert.match(app.root.innerHTML,/Access denied/);
});
test('audit API failure does not show stale records or mock records', async () => {
  const app = harness({userId:10,roles:['ADMIN']},
    {audits:async()=>{throw Object.assign(new Error('Backend offline'),{status:500});}});
  app.location.pathname='/admin/audit-logs';
  await app.render();
  assert.match(app.root.innerHTML,/Audit history unavailable/);
  assert.doesNotMatch(app.root.innerHTML,/View details|LOGIN/);
});

test('admin-only challenge and organization screens fetch authenticated data',async()=>{
 const account={userId:1,roles:['ADMIN']};
 const app=harness(account,{challengeList:async()=>({content:[{
   challengeId:44,title:'Live test',status:'DRAFT',creatorId:1,camels:[],totalVotes:0,
   opensAt:'2030-01-01T10:00:00Z',closesAt:'2030-01-02T10:00:00Z'
 }],page:0,size:20,totalElements:1,totalPages:1})});
 app.location.pathname='/admin/challenges';
 await app.render();
 assert.deepEqual(app.requests,['me','challenges']);
 assert.match(app.root.innerHTML,/Live test|Create challenge/);
 assert.doesNotMatch(app.root.innerHTML,/Sample challenge/);
 app.location.pathname='/admin/organizations';
 await app.render();
 assert.deepEqual(app.requests,['me','challenges','me','organizations']);
 assert.match(app.root.innerHTML,/Add organization|No organizations/);
});
test('revoked admin cannot request protected organization directory',async()=>{
 const app=harness({userId:1,roles:['ADMIN']},{me:async()=>({userId:1,roles:['VIEWER']})});
 app.location.pathname='/admin/organizations';
 await app.render();
 assert.deepEqual(app.requests,['me']);
 assert.match(app.root.innerHTML,/Access denied/);
});
test('admin module backend errors are shown without fabricated records',async()=>{
 const app=harness({userId:1,roles:['ADMIN']},
   {challengeList:async()=>{throw Object.assign(new Error('Unavailable'),{status:500})}});
 app.location.pathname='/admin/challenges';
 await app.render();
 assert.deepEqual(app.requests,['me','challenges']);
 assert.match(app.root.innerHTML,/Challenges unavailable/);
 assert.doesNotMatch(app.root.innerHTML,/Live test/);
});

test('authenticated admin sees live connection status and real vote counts',async()=>{
 const app=harness({userId:10,roles:['ADMIN']});
 app.location.pathname='/admin/system-health';
 await app.render();
 assert.deepEqual(app.requests,['me','system-health']);
 assert.match(app.root.innerHTML,/Database &amp; API Health|Connected|Responding|Check Connection/);
 assert.match(app.root.innerHTML,/Total saved votes across all challenges/);
 assert.match(app.root.innerHTML,/Checked: 20 Oct 2026/);
});
test('revoked ADMIN role cannot query protected system connectivity',async()=>{
 const app=harness({userId:10,roles:['ADMIN']},{me:async()=>({userId:10,roles:['OWNER']})});
 app.location.pathname='/admin/system-health';
 await app.render();
 assert.deepEqual(app.requests,['me']);
 assert.match(app.root.innerHTML,/Access denied/);
});
test('failed system health fetch never displays cached or invented counts',async()=>{
 const app=harness({userId:10,roles:['ADMIN']},{health:async()=>{
   throw Object.assign(new Error('backend offline'),{status:500});
 }});
 app.location.pathname='/admin/system-health';
 await app.render();
 assert.deepEqual(app.requests,['me','system-health']);
 assert.match(app.root.innerHTML,/Health check unavailable/);
 assert.doesNotMatch(app.root.innerHTML,/Connected|jdbc:secret-host/);
});
test('system health API rejects expired sessions and failed authorization',async()=>{
 for(const status of [401,403]){
  const app=harness({userId:10,roles:['ADMIN']},{health:async()=>{
    throw Object.assign(new Error('No access'),{status});
  }});
  app.location.pathname='/admin/system-health';
  await app.render();
  assert.deepEqual(app.requests,['me','system-health']);
  assert.doesNotMatch(app.root.innerHTML,/class="admin-system-count"|Total saved votes/);
  assert.doesNotMatch(app.root.innerHTML,/class="admin-console"/);
 }
});
