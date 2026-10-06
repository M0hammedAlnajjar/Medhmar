import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { matchRoute, canAccessRoute } from '../js/routes.js';
import { demo } from '../js/data.js';

const source = (await readFile(new URL('../js/app.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/gm, '')
  .replace("window.addEventListener('popstate',render); init();", '');

function harness(user, { me = async () => user, users } = {}) {
  const root = { innerHTML: '', addEventListener: () => {} };
  const location = { pathname: '/admin', hash: '', search: '' };
  const requests = [];
  const context = vm.createContext({
    session: user, demo, matchRoute, canAccessRoute,
    normalizePath: () => location.pathname,
    authView: () => '<h1>Sign In</h1>',
    authApi: { me: async () => { requests.push('me'); return me(); } },
    adminApi: { users: async () => {
      requests.push('users');
      return users ? users() : { content: [{ userId: 50, fullName: 'Live Account', email: 'live@example.com', roles: ['VIEWER'], accountStatus: 'ACTIVE' }], page: 0, totalPages: 1, totalElements: 1 };
    } },
    document: {
      querySelector: selector => selector === '#app' ? root : null,
      querySelectorAll: () => [], documentElement: {},
    },
    localStorage: { getItem: () => null }, location,
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
  assert.deepEqual(app.requests, ['me', 'users']);
  assert.match(app.root.innerHTML, /Live Account/);
  assert.match(app.root.innerHTML, /1 registered users/);
  assert.doesNotMatch(app.root.innerHTML, /2,100|mohammed@medhmar|preview data/);
});

test('API failures fail closed, including expired sessions and forbidden responses', async () => {
  for (const status of [401, 403, 500]) {
    const app = harness({ userId: 1, roles: ['ADMIN'] }, { users: async () => { throw Object.assign(new Error('Denied'), { status }); } });
    await app.render();
    assert.doesNotMatch(app.root.innerHTML, /Admin Dashboard|manage-user|Live Account/);
    assert.equal(vm.runInContext('state.adminUsers', app.context), null);
    if (status === 401) assert.equal(app.location.pathname, '/signin');
  }
});

test('late admin responses cannot restore the dashboard after navigation', async () => {
  let release;
  const pending = new Promise(resolve => { release = resolve; });
  const app = harness({ userId: 1, roles: ['ADMIN'] }, { users: () => pending });
  const render = app.render();
  await new Promise(resolve => setImmediate(resolve));
  app.location.pathname = '/signin';
  await app.render();
  release({ content: [{ userId: 50, fullName: 'Late user', roles: [] }], page: 0, totalPages: 1, totalElements: 1 });
  await render;
  assert.match(app.root.innerHTML, /Sign In/);
  assert.doesNotMatch(app.root.innerHTML, /Late user|Admin Dashboard/);
  assert.equal(vm.runInContext('state.adminUsers', app.context), null);
});


