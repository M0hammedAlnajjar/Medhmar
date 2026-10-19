import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  authView,
  requireRegisteredRole
} from '../js/auth-view.js';

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

  assert.throws(
      () => requireRegisteredRole(
          { userId: 42, roles: ['VIEWER'] },
          'OWNER'
      ),
      /selected role was not confirmed/
  );

  assert.throws(
      () => requireRegisteredRole(
          { userId: 42, roles: ['VIEWER'] },
          'TRAINER'
      ),
      /selected role was not confirmed/
  );

  assert.throws(
      () => requireRegisteredRole(
          { userId: 42, roles: [] },
          'OWNER'
      ),
      /selected role/
  );

  assert.throws(
      () => requireRegisteredRole(null, 'TRAINER'),
      /selected role/
  );

  assert.throws(
      () => requireRegisteredRole(
          { roles: ['ADMIN'] },
          'ADMIN'
      ),
      /valid account type/
  );
});

test('Google signup uses the selected account type', () => {
  const appSource = readFileSync(
      new URL('../js/app.js', import.meta.url),
      'utf8'
  );

  const apiSource = readFileSync(
      new URL('../js/api.js', import.meta.url),
      'utf8'
  );

  const signupHtml = authView('signup');

  for (const role of ['VIEWER', 'OWNER', 'TRAINER']) {
    assert.match(signupHtml, new RegExp('value="' + role + '"'));
  }

  assert.match(
      appSource,
      /authApi\.googleSignupRole\(role\)/
  );

  assert.match(
      appSource,
      /authApi\.clearGoogleSignupRole\(\)/
  );

  assert.match(
      apiSource,
      /googleSignupRole/
  );

  assert.match(
      apiSource,
      /clearGoogleSignupRole/
  );

  assert.doesNotMatch(
      signupHtml,
      /For Owner or Trainer registration/
  );
});