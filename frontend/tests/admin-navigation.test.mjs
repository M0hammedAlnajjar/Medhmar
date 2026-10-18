import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { matchRoute, canAccessRoute } from '../js/routes.js';

// Exercise the actual navbar renderer, without a browser or backend request.
const source = (await readFile(new URL('../js/app.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/gm, '')
  .replace("window.addEventListener('popstate',render); init();", '');

function navbar(user, pathname = '/home', hash = '') {
  const location = { pathname, hash, search: '' };
  const context = vm.createContext({
    location, matchRoute, canAccessRoute,
    normalizePath: () => location.pathname,
    authView: () => '',
    localStorage: { getItem: () => 'en' },
    document: { querySelector: () => null }
  });
  vm.runInContext(source, context);
  context.testUser = user;
  vm.runInContext('state.user=testUser;', context);
  return vm.runInContext("topbar('/home')", context);
}
const user = role => ({ userId: 7, fullName: 'Tester', roles: [role] });
const more = html => html.match(/<details class="pedigree-more">[\s\S]*?<\/details>/)?.[0] || '';
const adminDropdown = html => html.match(/<details class="nav-admin">[\s\S]*?<\/details>/)?.[0] || '';
const mobile = html => html.match(/<details class="nav-mobile">[\s\S]*?<\/details>/)?.[0] || '';

test('normal users and guests never see an administrator menu or audit records', () => {
  for (const account of [null, {}, user('VIEWER'), user('OWNER'), user('TRAINER'), user('ORGANIZER')]) {
    const html = navbar(account);
    assert.doesNotMatch(html, /class="nav-admin"|class="nav-mobile-admin"|Audit Log|Admin Dashboard|Manage Users/);
    assert.doesNotMatch(more(html), /\/admin|\/audit-logs/);
  }
});

test('owner and trainer agreements remain in ordinary More navigation', () => {
  for (const role of ['OWNER', 'TRAINER']) {
    const html = navbar(user(role));
    assert.match(more(html), /href="\/agreements"/);
    assert.doesNotMatch(more(html), /Audit Log|Admin Dashboard|Manage Users/);
  }
});

test('admin has a separate desktop dropdown with dashboard, users and audit log', () => {
  const html = navbar(user('ADMIN'));
  const admin = adminDropdown(html);
  assert.match(admin, /Open administration menu/);
  assert.match(admin, /href="\/admin"[^>]*>Admin Dashboard/);
  assert.match(admin, /href="\/admin#account-administration"[^>]*>Manage Users/);
  assert.match(admin, /href="\/audit-logs"[^>]*>Audit Log/);
  assert.doesNotMatch(more(html), /\/admin|\/audit-logs|Manage Users/);
  assert.ok(html.indexOf('class="nav-admin"') > html.indexOf('class="pedigree-more"'));
});

test('mobile menu visibly separates administrator navigation from user links', () => {
  const html = mobile(navbar(user('ADMIN')));
  assert.match(html, /class="nav-mobile-user"/);
  assert.match(html, /class="nav-mobile-admin" aria-label="Administration"/);
  assert.match(html, /Administration<\/div>/);
  assert.ok(html.indexOf('nav-mobile-admin') > html.indexOf('nav-mobile-user'));
  const userLinks = html.slice(html.indexOf('nav-mobile-user'), html.indexOf('</nav>'));
  assert.doesNotMatch(userLinks, /href="\/audit-logs"|href="\/admin"/);
  assert.match(html, /href="\/audit-logs"/);
});

test('multi-role administrators remain separated, and non-admin identities cannot spoof menu', () => {
  assert.match(adminDropdown(navbar({ userId: 3, roles: ['OWNER','ADMIN'] })), /Admin Dashboard/);
  assert.doesNotMatch(navbar({ roles: ['ADMIN'] }), /class="nav-admin"|nav-mobile-admin/);
  assert.doesNotMatch(navbar({ userId: 1, roles: 'ADMIN' }), /class="nav-admin"|nav-mobile-admin/);
});

test('admin menu highlights its active section, including manage-users anchor', () => {
  const html = navbar(user('ADMIN'), '/admin', '#account-administration');
  assert.match(adminDropdown(html), /href="\/admin#account-administration" data-link class="active" aria-current="page"/);
  const audit = navbar(user('ADMIN'), '/audit-logs');
  assert.match(adminDropdown(audit), /href="\/audit-logs" data-link class="active" aria-current="page"/);
});
