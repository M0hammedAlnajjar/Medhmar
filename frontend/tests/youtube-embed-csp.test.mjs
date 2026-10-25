import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

// Verify the actual response header, not a copied policy constant.
test('frontend server permits trusted YouTube iframe origins without relaxing other CSP rules', async t => {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));

  const child = spawn(process.execPath, ['server.mjs'], {
    cwd: fileURLToPath(new URL('../', import.meta.url)),
    env: { ...process.env, FRONTEND_HOST: '127.0.0.1', FRONTEND_PORT: String(port) },
    stdio: 'ignore'
  });
  t.after(() => child.kill());

  let response;
  for (let attempt = 0; attempt < 40; attempt++) {
    if (child.exitCode !== null) break;
    try {
      response = await fetch('http://127.0.0.1:' + port + '/challenges');
      break;
    } catch {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  assert.ok(response, 'Frontend server should start and respond');
  assert.equal(response.status, 200);
  const policy = response.headers.get('content-security-policy');
  assert.ok(policy, 'CSP header should be present');
  const directives = Object.fromEntries(policy.split(';').map(part => {
    const [name, ...values] = part.trim().split(/\s+/);
    return [name, values];
  }));
  assert.deepEqual(directives['frame-src'], [
    "'self'", 'https://www.youtube-nocookie.com', 'https://www.youtube.com'
  ]);
  assert.deepEqual(directives['default-src'], ["'self'"]);
  assert.deepEqual(directives['frame-ancestors'], ["'none'"]);
  assert.deepEqual(directives['object-src'], ["'none'"]);
  assert.ok(!policy.includes('frame-src *'));
  assert.equal(response.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
});
