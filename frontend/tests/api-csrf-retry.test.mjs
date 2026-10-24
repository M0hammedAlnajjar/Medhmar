import test from 'node:test';
import assert from 'node:assert/strict';

test('stale CSRF token is refreshed and the stream update is retried exactly once', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  globalThis.window = {location: {hostname: 'localhost'}};
  const calls = [];
  let issued = 0;
  let writes = 0;

  globalThis.fetch = async (url, options = {}) => {
    const path = new URL(url).pathname;
    calls.push({path, method: options.method || 'GET', headers: new Headers(options.headers)});
    if (path === '/api/auth/csrf') {
      issued++;
      return Response.json({headerName: 'X-CSRF-TOKEN', token: 'csrf-' + issued});
    }
    if (path === '/api/admin/challenges/42/stream') {
      writes++;
      if (writes === 1) {
        assert.equal(options.headers.get('X-CSRF-TOKEN'), 'csrf-1');
        return Response.json({status: 403, code: 'INVALID_CSRF', message: 'CSRF token missing or invalid.'}, {status: 403});
      }
      assert.equal(options.headers.get('X-CSRF-TOKEN'), 'csrf-2');
      return Response.json({challengeId: 42, streamUrl: 'https://youtu.be/2C0lg5HIc6w'});
    }
    throw new Error('Unexpected request ' + path);
  };

  try {
    const {adminModulesApi} = await import('../js/api.js?stream-csrf-retry');
    const result = await adminModulesApi.updateStream(42, 'https://youtu.be/2C0lg5HIc6w');
    assert.equal(result.challengeId, 42);
    assert.equal(writes, 2);
    assert.equal(issued, 2);
    assert.deepEqual(calls.map(c => c.path), [
      '/api/auth/csrf', '/api/admin/challenges/42/stream',
      '/api/auth/csrf', '/api/admin/challenges/42/stream'
    ]);

    // A valid CSRF token cannot grant an account ADMIN privileges.
    globalThis.fetch = async (url, options = {}) => {
      const path = new URL(url).pathname;
      if (path === '/api/auth/csrf') throw new Error('Role denial must not refresh CSRF');
      assert.equal(options.headers.get('X-CSRF-TOKEN'), 'csrf-2');
      return Response.json({status: 403, code: 'FORBIDDEN', message: 'Your account does not have permission for this action.'}, {status: 403});
    };
    await assert.rejects(
      adminModulesApi.updateStream(42, 'https://youtu.be/2C0lg5HIc6w'),
      error => error.status === 403 && error.data.code === 'FORBIDDEN'
    );
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});

test('a repeated CSRF rejection stops after the one permitted retry', async () => {
  const originalFetch = globalThis.fetch;
  const originalWindow = globalThis.window;
  globalThis.window = {location: {hostname: 'localhost'}};
  let csrfRequests = 0;
  let writes = 0;
  globalThis.fetch = async (url) => {
    if (new URL(url).pathname === '/api/auth/csrf') {
      csrfRequests++;
      return Response.json({headerName:'X-CSRF-TOKEN', token:'token-'+csrfRequests});
    }
    writes++;
    return Response.json({status:403, code:'INVALID_CSRF', message:'CSRF token missing or invalid.'}, {status:403});
  };
  try {
    const {api} = await import('../js/api.js?csrf-twice');
    await assert.rejects(api('/api/admin/challenges/42/stream', {
      method:'PUT', body:JSON.stringify({url:'https://youtu.be/2C0lg5HIc6w'})
    }), error => error.status === 403 && error.data.code === 'INVALID_CSRF');
    assert.equal(writes, 2);
    assert.equal(csrfRequests, 2);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWindow === undefined) delete globalThis.window;
    else globalThis.window = originalWindow;
  }
});
