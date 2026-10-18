import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAccount } from '../js/account-view.js';
import { matchRoute, canAccessRoute } from '../js/routes.js';

const user = role => ({
  userId: 1, fullName: '<Test User>', email: 'test@example.com',
  preferredLanguage: 'en', accountStatus: 'ACTIVE', roles: [role]
});
const screen = role => renderAccount({ user: user(role) });

test('all roles share the same profile and preferences', () => {
  for (const role of ['VIEWER','OWNER','TRAINER','ORGANIZER','ADMIN']) {
    const html = screen(role);
    assert.match(html, /Account profile|Personal information/);
    assert.match(html, /id="settings-form"/);
    assert.doesNotMatch(html, /<Test User>/);
    assert.match(html, /&lt;Test User&gt;/);
  }
});

test('account quick actions are matched to roles', () => {
  assert.doesNotMatch(screen('VIEWER'), /My Camels|Training Journal|Manage Users|Admin Dashboard/);
  assert.match(screen('OWNER'), /My Camels|My Listings|Training Agreements/);
  assert.doesNotMatch(screen('OWNER'), /Manage Users|Training Journal/);
  assert.match(screen('TRAINER'), /Training Journal|Training Agreements/);
  assert.doesNotMatch(screen('TRAINER'), /My Listings|Manage Users/);
  assert.match(screen('ORGANIZER'), /Race Operations/);
  assert.doesNotMatch(screen('ORGANIZER'), /Admin Dashboard|Manage Users/);
});

test('admin data only appears with active ADMIN role and returned server records', () => {
  const accounts = [{ userId: 52, fullName: 'Real Member', email: 'member@example.com',
    roles: ['VIEWER'], accountStatus: 'ACTIVE' }];
  const options = { adminUsers: accounts, adminPageData: { page: 1, totalPages: 4, totalElements: 72 } };
  const admin = renderAccount({ user: user('ADMIN'), ...options });
  assert.match(admin, /Admin Dashboard|Real Member|Page 2 of 4/);
  assert.match(admin, /class="small-btn manage-user"/);
  assert.match(admin, /data-page="2"/);
  assert.doesNotMatch(renderAccount({ user: user('OWNER'), ...options }), /Real Member|Admin Dashboard/);
  assert.doesNotMatch(renderAccount({ user: user('ADMIN') }), /Real Member|class="small-btn manage-user"/);
});

test('admin server error does not invent or reveal records', () => {
  const html = renderAccount({ user: user('ADMIN'), adminError: 'Server unavailable' });
  assert.match(html, /Administrator access unavailable|Server unavailable/);
  assert.doesNotMatch(html, /class="small-btn manage-user"|registered users/);
});

test('account route requires authentication and unknown routes are denied', () => {
  const route = matchRoute('/settings').route;
  assert.equal(canAccessRoute(route, null), false);
  assert.equal(canAccessRoute(route, { roles: ['ADMIN'] }), false);
  assert.equal(canAccessRoute(route, user('VIEWER')), true);
  assert.equal(canAccessRoute(null, user('ADMIN')), false);
});
