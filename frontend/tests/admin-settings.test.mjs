import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { adminSettingsView } from '../js/admin-console.js';

test('Admin Settings uses live account details, neutral icon, and correct profile fields', () => {
  const html = adminSettingsView({ user: {
    userId: 18, fullName: 'Salim Administrator', email: 'salim@example.test',
    roles: ['ADMIN'], accountStatus: 'ACTIVE', preferredLanguage: 'ar'
  }});
  assert.match(html, /id="admin-settings-title">Admin Settings/);
  assert.match(html, /Salim Administrator/);
  assert.match(html, /salim@example\.test/);
  assert.match(html, /<strong>ADMIN<\/strong>/);
  assert.match(html, /<strong>ACTIVE<\/strong>/);
  assert.match(html, /Account ID<\/span><strong>18<\/strong>/);
  assert.match(html, /id="settings-form"/);
  assert.match(html, /name="fullName"/);
  assert.match(html, /id="settings-language" name="preferredLanguage"/);
  assert.match(html, /value="ar" selected/);
  assert.match(html, /id="settings-email"[^>]*readonly/);
  assert.match(html, /data-settings-save-label>Save Changes/);
  assert.match(html, /admin-settings-hero-mark/);
  assert.match(html, /<circle cx="32" cy="22" r="10"/);
  assert.doesNotMatch(html, /class="profile-avatar">H|class="admin-settings-person">H/);
  assert.doesNotMatch(html, /YOUR WORKSPACE|My Camels|Explore Races/);
});

test('Admin Settings safely escapes untrusted account fields and does not fake access', () => {
  const html = adminSettingsView({ user: {
    userId: 4, fullName: '<script>alert(1)</script>',
    email: '"><img src=x onerror=alert(1)>',
    roles: ['<ADMIN>'], accountStatus: '<ACTIVE>', preferredLanguage: 'xx'
  }});
  assert.doesNotMatch(html, /<script>|<img src=x/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /&lt;ADMIN&gt;/);
  assert.match(html, /&lt;ACTIVE&gt;/);
  assert.match(html, /value="en" selected/);
  assert.doesNotMatch(html, /Your account is secure|Two-factor enabled/i);
});

test('Admin Settings uses read-only email and preserves user-entered name after failed save', async () => {
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const api = await readFile(new URL('../js/api.js', import.meta.url), 'utf8');
  const controller = await readFile(new URL('../../backend/src/main/java/com/gulfracing/controller/UserController.java', import.meta.url), 'utf8');
  assert.match(app, /authApi\.updateMe\(\{/);
  assert.match(app, /if \(!form\.isConnected \|\| String\(state\.user\?\.userId\)/);
  assert.match(app, /feedback\.hidden = false/);
  assert.match(app, /submit\.disabled = false/);
  assert.match(app, /label\.textContent = 'Saving…'/);
  assert.match(app, /fullName\.length > 150/);
  assert.match(app, /\['en','ar'\]\.includes\(language\)/);
  assert.match(api, /updateMe: \(payload\) => api\("\/api\/users\/me", \{ method: "PUT"/);
  assert.match(controller, /@PutMapping\("\/me"\)/);
});

test('Admin Settings responsive styling is loaded after shared admin CSS', async () => {
  const css = await readFile(new URL('../assets/admin-settings.css', import.meta.url), 'utf8');
  const index = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(css, /\.admin-console \.admin-settings-hero/);
  assert.match(css, /\.admin-console \.admin-settings-layout/);
  assert.match(css, /@media\(max-width:1020px\)/);
  assert.match(css, /@media\(max-width:440px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.ok(index.indexOf('/assets/admin-settings.css') > index.indexOf('/assets/admin-audit.css'));
});
