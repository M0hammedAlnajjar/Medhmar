import assert from 'node:assert/strict';

// Exercise the actual SPA and existing handlers, with isolated test-only API
// responses. No production accounts are read or changed by this check.
export async function checkAdminUsers(browser, baseUrl) {
  const context = await browser.newContext({ viewport: { width: 1680, height: 960 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const admin = { userId: 42, fullName: 'Test Administrator', roles: ['ADMIN', 'VIEWER'] };
  const users = [
    { userId: 41, fullName: 'Test Owner', email: 'owner@example.invalid', roles: ['OWNER'], accountStatus: 'ACTIVE', joinedAt: '2026-10-14T00:00:00Z' },
    { ...admin, email: 'admin@example.invalid', accountStatus: 'ACTIVE', joinedAt: '2026-10-21T00:00:00Z' }
  ];
  let statsAvailable = true;
  let listRequests = 0;
  const statistics = {
    totalUsers: 31,
    roles: Object.fromEntries([['VIEWER', 24], ['OWNER', 7], ['TRAINER', 0], ['ORGANIZER', 0], ['ADMIN', 2]]
      .map(([role, total]) => [role, { total }]))
  };
  try {
    await page.route('**/*:8080/**', route => {
      const path = new URL(route.request().url()).pathname;
      let data = { content: [], totalPages: 1, totalElements: 0 };
      if (path === '/api/users/me') data = admin;
      if (path === '/api/auth/csrf') data = { headerName: 'X-XSRF-TOKEN', token: 'test-only-token' };
      if (path === '/api/admin/users') {
        listRequests++;
        data = { content: users, page: 0, size: 20, totalPages: 2, totalElements: 31 };
      }
      if (path === '/api/admin/users/stats') {
        if (!statsAvailable) return route.fulfill({ status: 503, contentType: 'application/json', body: '{}' });
        data = statistics;
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(data) });
    });
    await page.goto(`${baseUrl}/admin/users`);
    await page.locator('.admin-user-row').first().waitFor();
    assert.equal(await page.locator('.admin-users-stat-total strong').innerText(), '31');
    assert.equal(await page.locator('.admin-users-stat-owner strong').innerText(), '7', 'aggregate count must reach the view rather than silently falling back to this page');

    const owner = page.locator('.admin-users-role-filter[data-role="OWNER"]');
    await owner.click();
    assert.equal(await owner.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.admin-user-row:visible').count(), 1);
    assert.match(await page.locator('.admin-user-row:visible').innerText(), /Test Owner/);
    await page.locator('[name="search"]').fill('admin@example.invalid');
    assert.equal(await page.locator('.admin-user-row:visible').count(), 0);
    assert.equal(await page.locator('#admin-users-empty-filter').isVisible(), true);
    await page.locator('#admin-users-clear').click();
    await page.waitForFunction(() => document.querySelector('.admin-users-role-filter[data-role=""]')?.getAttribute('aria-pressed') === 'true');
    assert.equal(await page.locator('.admin-user-row:visible').count(), 2);
    assert.equal(await owner.getAttribute('aria-pressed'), 'false', 'reset must synchronize the visible role selection');

    // Native buttons support Enter and Space; roles remain an inclusive filter.
    const viewer = page.locator('.admin-users-role-filter[data-role="VIEWER"]');
    await viewer.focus();
    await viewer.press('Enter');
    assert.equal(await page.locator('.admin-user-row:visible').count(), 1);
    assert.match(await page.locator('.admin-user-row:visible').innerText(), /Test Administrator/);
    await page.locator('.admin-users-role-filter[data-role=""]').press('Space');
    assert.equal(await page.locator('.admin-user-row:visible').count(), 2);
    await page.locator('#admin-status-filter').selectOption('SUSPENDED');
    assert.equal(await page.locator('.admin-user-row:visible').count(), 0);
    await page.locator('#admin-users-clear').click();
    await page.waitForFunction(() => [...document.querySelectorAll('.admin-user-row')].every(row => !row.hidden));

    await page.locator('.view-admin-user').first().click();
    assert.equal(await page.locator('.admin-user-detail-modal').isVisible(), true);
    await page.locator('#close-modal').click();
    await page.locator('.manage-user').first().click();
    assert.equal(await page.locator('#user-form').isVisible(), true, 'Edit must open the existing management form');
    await page.locator('#close-modal').click();

    const artwork = await page.locator('.admin-users-racing-art').evaluate(async image => {
      await image.decode();
      return { loaded: image.naturalWidth > 0, background: getComputedStyle(image.closest('section')).backgroundImage };
    });
    assert.equal(artwork.loaded, true);
    assert.equal(artwork.background, 'none', 'the user page must not inherit the old photographic hero');
    assert.equal(await page.locator('.admin-footer, .admin-topbar-pill').count(), 0);
    await page.screenshot({ path: 'test-results/admin-users-racing-desktop.png', fullPage: true });
    for (const width of [1440, 1024, 768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `page must not overflow at ${width}px`);
      assert.equal(await page.locator('.admin-users-role-filter').count(), 6);
      assert.equal(await page.locator('#admin-users-refresh').isVisible(), true);
    }
    await page.screenshot({ path: 'test-results/admin-users-racing-mobile.png', fullPage: true });

    statsAvailable = false;
    const previousRequests = listRequests;
    await page.locator('#admin-users-refresh').click();
    await page.waitForFunction(() => document.querySelector('.admin-users-stat-owner strong')?.textContent === '1');
    assert.ok(listRequests > previousRequests);
    assert.match(await page.locator('.admin-users-role-note').innerText(), /this page only/);
    assert.equal(await page.locator('.admin-users-stat-total strong').innerText(), '31');
    assert.deepEqual(errors, [], 'user management must not produce unhandled errors');
  } finally {
    await context.close();
  }
}
