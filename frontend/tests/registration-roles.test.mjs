import test from 'node:test';
import assert from 'node:assert/strict';
import { authView, requireRegisteredRole, googleSignupWarning } from '../js/auth-view.js';

test('manual account creation requires one explicit supported account type', () => {
  const html = authView('signup');
  assert.match(html, /name="role" required/);
  assert.match(html, /<option value="" selected disabled>/);
  for (const role of ['VIEWER', 'OWNER', 'TRAINER']) {
    assert.match(html, new RegExp('value="' + role + '"'));
  }
  assert.doesNotMatch(html, /value="ADMIN"/);
});
test('backend response must confirm the chosen role', () => {
  for (const role of ['VIEWER', 'OWNER', 'TRAINER']) {
    const response = { userId: 42, roles: [role] };
    assert.equal(requireRegisteredRole(response, role), response);
  }
  assert.throws(() => requireRegisteredRole({ userId: 42, roles: ['VIEWER'] }, 'OWNER'), /selected role was not confirmed/);
  assert.throws(() => requireRegisteredRole({ userId: 42, roles: ['VIEWER'] }, 'TRAINER'), /selected role was not confirmed/);
  assert.throws(() => requireRegisteredRole({ userId: 42, roles: [] }, 'OWNER'), /selected role/);
  assert.throws(() => requireRegisteredRole(null, 'TRAINER'), /selected role/);
  assert.throws(() => requireRegisteredRole({ roles: ['ADMIN'] }, 'ADMIN'), /valid account type/);
});
test('Google signup warns before overriding Owner or Trainer with Viewer', () => {
  assert.match(googleSignupWarning('OWNER'), /VIEWER/);
  assert.match(googleSignupWarning('TRAINER'), /VIEWER/);
  assert.equal(googleSignupWarning('VIEWER'), '');
  assert.equal(googleSignupWarning(''), '');
  assert.match(authView('signup'), /For Owner or Trainer registration/);
});
