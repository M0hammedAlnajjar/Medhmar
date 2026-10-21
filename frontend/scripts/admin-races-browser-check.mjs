import assert from "node:assert/strict";

export async function checkAdminRaces(browser, origin) {
  const context = await browser.newContext({ viewport: { width: 1672, height: 941 }, timezoneId: "Asia/Muscat" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  let role = "ADMIN", failure = 0, saveFailure = false;
  const writes = [], racePages = new Set(), userPages = new Set();
  const races = [
    { raceId: 1, name: "Al Bashayer Autumn Race", startsAt: "2026-10-05T16:00:00Z", location: "Al Bashayer, Oman", distanceKm: 5, status: "CLOSED", organizerId: 12, organizationId: 3, coverImageUrl: `${origin}/assets/racing-hero.webp` },
    { raceId: 2, name: "Bahla Race", startsAt: "2026-10-28T10:39:00Z", location: "Bahla", distanceKm: 6, status: "CLOSED", organizerId: 12 },
    { raceId: 4, name: "Bahla Championship Race", startsAt: "2026-11-21T06:08:00Z", location: "Bahla, Al Dakhiliyah", distanceKm: 8, status: "OPEN", organizerId: 12, coverImageUrl: `${origin}/assets/racing-hero.webp` }
  ];
  let entries = [];
  const admin = { userId: 1, fullName: "Test Administrator", roles: ["ADMIN"] };
  const organizer = { userId: 12, fullName: "Sulaiman Organizer", roles: ["ORGANIZER"] };
  const reply = (route, data, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(data) });
  await page.route("**:8080/**", async route => {
    const url = new URL(route.request().url()), path = url.pathname, method = route.request().method();
    if (path === "/api/users/me") return reply(route, { ...admin, roles: [role] });
    if (path === "/api/auth/csrf") return reply(route, { headerName: "X-XSRF-TOKEN", token: "race-test-token" });
    if (method === "POST" || method === "PUT") {
      const payload = route.request().postDataJSON();
      writes.push({ method, path, payload, csrf: route.request().headers()["x-xsrf-token"] });
      if (saveFailure) return reply(route, { message: "The race status cannot change." }, 400);
      if (path.startsWith("/api/race-entries/")) {
        await new Promise(resolve => setTimeout(resolve, 150));
        entries = entries.map(entry => entry.entryId === Number(path.split("/").at(-1)) ? { ...entry, ...payload } : entry);
        return reply(route, {});
      }
      if (method === "POST") races.push({ ...payload, raceId: 9 });
      else Object.assign(races.find(race => race.raceId === Number(path.split("/").at(-1))), payload);
      return reply(route, payload);
    }
    if (path === "/api/races") {
      if (failure) return reply(route, { message: "Race service unavailable" }, failure);
      const index = Number(url.searchParams.get("page"));
      racePages.add(index);
      return reply(route, { content: races.slice(index * 2, index * 2 + 2), totalPages: Math.ceil(races.length / 2), totalElements: races.length });
    }
    if (path === "/api/race-entries") return reply(route, entries);
    if (path === "/api/admin/users") {
      const index = Number(url.searchParams.get("page"));
      userPages.add(index);
      return reply(route, { content: index ? [organizer] : [admin, { userId: 3, fullName: "Camel Owner", roles: ["OWNER"] }], totalPages: 2, totalElements: 3 });
    }
    if (path === "/camel/getById") return reply(route, { camelId: 7, name: "Al Barq" });
    return reply(route, []);
  });
  const load = async () => {
    await page.goto(`${origin}/admin/races`);
    await page.locator("[data-race-rows]").waitFor();
  };
  try {
    await load();
    assert.equal(await page.locator("[data-race-rows] tr").count(), 3);
    const adminNavHrefs = await page.locator(".admin-sidebar-nav a").evaluateAll(nodes => nodes.map(node => node.getAttribute("href")));
    assert.deepEqual(adminNavHrefs, [
      "/admin",
      "/admin/users",
      "/admin/marketplace",
      "/admin/termination-requests",
      "/admin/heritage",
      "/admin/challenges",
      "/admin/organizations",
      "/admin/system-health",
      "/admin/audit-logs",
      "/admin/races",
      "/admin/settings"
    ]);
    assert.equal(await page.locator('.admin-sidebar-nav a[href="/admin/races"]').getAttribute("aria-current"), "page");
    assert.equal(await page.locator(".admin-sidebar-bottom a").count(), 0);
    assert.equal(await page.locator("#admin-signout").isVisible(), true);
    assert.equal(await page.locator("[data-admin-race-create]").count(), 1, "Race Management still has an editable Create Race button");
    assert.equal(await page.locator(".admin-race-photo-credit").count(), 0, "banner should not show a photo source badge");
    assert.equal(await page.locator(".admin-race-hero").evaluate(hero => getComputedStyle(hero).backgroundImage.includes("omannews.gov.om/images/topics/story-images/698094d5cb92a.jpeg")), true, "banner uses the selected ONA photo");
    assert.equal(await page.locator(".admin-race-hero").evaluate(hero => getComputedStyle(hero).backgroundImage.includes("/assets/admin-races/hero.webp")), true, "banner preserves a local fallback");
    assert.equal(await page.locator(".admin-race-hero").innerText().then(text => text.includes("GREATER HERITAGE")), false, "hero contains no old decorative tagline");
    assert.equal(await page.locator(".admin-race-list-panel .admin-race-heading-icon").count(), 0, "Race List heading should have no camel badge");
    assert.equal(await page.locator(".admin-race-requests-panel .admin-race-heading-icon").count(), 1, "Requests heading keeps its icon");
    assert.equal(await page.locator(".admin-race-metric-total strong").innerText(), "3");
    assert.equal(await page.locator(".admin-race-metric-open strong").innerText(), "1");
    assert.deepEqual([...racePages], [0, 1]);
    assert.deepEqual([...userPages], [0, 1]);
    assert.match(await page.locator("[data-race-rows]").innerText(), /Sulaiman Organizer/);
    assert.match(await page.locator("[data-entry-rows]").innerText(), /No pending registration requests/);
    assert.equal(await page.locator("[data-entry-rows] .admin-race-empty-state svg").count(), 0, "pending registration empty state has no camel icon");
    assert.equal(writes.length, 0);
    assert.equal(await page.locator(".admin-race-thumbnail img").count(), 3);
    await page.waitForFunction(() => [...document.querySelectorAll(".admin-race-thumbnail img")].every(img => img.complete && img.naturalWidth > 0));
    assert.match(await page.locator(".admin-race-thumbnail img").nth(1).getAttribute("src"), /\/assets\/mock-camels\/camel-/);
    const artwork = await page.evaluate(() => ({
      total: getComputedStyle(document.querySelector(".admin-race-metric-total")).backgroundImage,
      open: getComputedStyle(document.querySelector(".admin-race-metric-open")).backgroundImage,
      pending: getComputedStyle(document.querySelector(".admin-race-metric-pending")).backgroundImage,
      completed: getComputedStyle(document.querySelector(".admin-race-metric-completed")).backgroundImage,
      empty: getComputedStyle(document.querySelector(".admin-race-empty-state")).backgroundImage
    }));
    assert.match(artwork.total, /caravan\.svg/);
    assert.match(artwork.open, /dunes\.svg/);
    assert.match(artwork.pending, /people\.svg/);
    assert.match(artwork.completed, /pavilion\.svg/);
    assert.equal(artwork.empty, "none", "pending requests empty state has no desert artwork");
    const placement = await page.evaluate(() => {
      const box = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
      return { list: box(".admin-race-list-panel"), requests: box(".admin-race-requests-panel"), controls: box(".admin-race-controls-panel") };
    });
    assert.equal(placement.list.x, placement.requests.x);
    assert.ok(placement.controls.x > placement.list.x);
    assert.equal(placement.list.y, placement.controls.y);
    await page.screenshot({ path: "test-results/admin-races-desktop.png", fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: "test-results/admin-races-mobile.png", fullPage: true });
    await page.setViewportSize({ width: 1672, height: 941 });
    await page.locator("[data-race-search]").fill("championship");
    assert.equal(await page.locator("[data-race-rows] tr").count(), 1);
    await page.locator("[data-race-status-filter]").selectOption("CLOSED");
    assert.match(await page.locator("[data-race-rows]").innerText(), /No races found/);
    assert.equal(await page.locator("[data-race-rows] .admin-race-empty-state svg").count(), 0, "race list empty state has no camel icon");
    assert.equal(await page.locator("[data-race-rows] .admin-race-empty-state").evaluate(el => getComputedStyle(el).backgroundImage), "none", "race list empty state has no desert artwork");
    await page.locator("[data-race-search]").fill("");
    await page.locator("[data-race-status-filter]").selectOption("");
    await page.locator('[data-race-sort="startsAt"]').click();
    await page.locator('[data-race-sort="startsAt"]').click();
    assert.match(await page.locator("[data-race-rows] tr").first().innerText(), /Championship/);
    assert.equal(await page.locator('[data-race-sort="startsAt"]').evaluate(button => button.parentElement.getAttribute("aria-sort")), "descending");
    await page.locator('[data-admin-race-view="1"]').click();
    assert.match(await page.locator("#admin-race-view-modal").innerText(), /Al Bashayer Autumn Race|Sulaiman Organizer/);
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("[data-admin-race-dialog]").count(), 0);
    assert.equal(await page.locator('[data-admin-race-view="1"]').evaluate(el => el === document.activeElement), true);
    await page.locator('[data-admin-race-control="organizerId"]').click();
    await page.locator("#admin-race-choice").selectOption("2");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    assert.equal(await page.locator('#admin-race-form [name="organizerId"]').evaluate(el => el === document.activeElement), true);
    await page.keyboard.press("Escape");
    await page.locator("[data-admin-race-create]").click();
    const form = page.locator("#admin-race-form");
    await form.locator('[name="name"]').fill("New Oman Race");
    await form.locator('[name="startsAt"]').fill("2030-11-21T10:00");
    await form.locator('[name="distanceKm"]').fill("6.5");
    await form.locator('[name="location"]').fill("Muscat");
    await form.locator('[name="organizerId"]').selectOption("12");
    await form.getByRole("button", { name: "Create Race", exact: true }).click();
    await page.locator('[data-admin-race-view="9"]').waitFor();
    const created = writes.find(write => write.method === "POST" && write.path === "/api/races");
    assert.equal(created.payload.organizerId, 12);
    assert.equal(created.payload.startsAt, "2030-11-21T06:00:00.000Z");
    assert.equal(created.payload.distanceKm, 6.5);
    assert.equal(created.csrf, "race-test-token");
    assert.equal(await page.locator(".admin-race-metric-total strong").innerText(), "4");
    await page.locator('[data-admin-race-edit="9"]').first().click();
    await form.locator('[name="status"]').selectOption("OPEN");
    saveFailure = true;
    await form.getByRole("button", { name: "Save Changes" }).click();
    await page.locator("[data-admin-race-feedback]:visible").waitFor();
    assert.match(await page.locator("[data-admin-race-feedback]").innerText(), /cannot change/);
    saveFailure = false;
    await form.getByRole("button", { name: "Save Changes" }).click();
    await page.waitForFunction(() => document.querySelector(".admin-race-metric-open strong")?.textContent === "2");
    entries = [31, 32].map(entryId => ({ entryId, camelId: 7, raceId: entryId === 31 ? 4 : 9, registrantId: 3, registeredAt: "2026-10-21T08:00:00Z", entryStatus: "PENDING" }));
    await load();
    await page.locator("[data-entry-search]").fill("Al Barq");
    await page.locator("[data-entry-race-filter]").selectOption("4");
    assert.equal(await page.locator("[data-entry-rows] tr").count(), 1);
    await page.locator('[data-entry-id="31"][data-admin-entry-decision="ACCEPTED"]').click();
    assert.equal(await page.locator('[data-entry-id="31"][data-admin-entry-decision="REJECTED"]').isDisabled(), true);
    await page.waitForFunction(() => document.querySelector(".admin-race-metric-pending strong")?.textContent === "1");
    assert.equal(await page.locator("[data-entry-race-filter]").inputValue(), "4");
    assert.match(await page.locator("[data-entry-rows]").innerText(), /No matching registration requests/);
    await page.locator("[data-entry-race-filter]").selectOption("");
    await page.locator('[data-entry-id="32"][data-admin-entry-decision="REJECTED"]').click();
    await page.waitForFunction(() => document.querySelector(".admin-race-metric-pending strong")?.textContent === "0");
    assert.ok(writes.some(write => write.path === "/api/race-entries/31" && write.payload.entryStatus === "ACCEPTED"));
    assert.ok(writes.some(write => write.path === "/api/race-entries/32" && write.payload.entryStatus === "REJECTED"));
    races[0].coverImageUrl = `${origin}/assets/missing-race-photo.webp`;
    races[1].name = '<img src=x onerror="window.__raceXss=true">';
    await load();
    assert.match(await page.locator("[data-race-rows]").innerText(), /<img src=x/);
    assert.equal(await page.evaluate(() => window.__raceXss), undefined);
    await page.waitForFunction(() => [...document.querySelectorAll(".admin-race-thumbnail img")].every(img => img.complete && img.naturalWidth > 0));
    assert.match(await page.locator(".admin-race-thumbnail img").first().getAttribute("src"), /\/assets\/mock-camels\/camel-/);
    for (const width of [1440, 1024, 768, 390]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `Race page must not overflow at ${width}px`);
    }
    await page.locator("[data-admin-race-create]").click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
    await page.evaluate(() => { history.pushState({}, "", "/admin/users"); window.dispatchEvent(new PopStateEvent("popstate")); });
    await page.waitForFunction(() => !document.querySelector("[data-admin-race-dialog]"));
    failure = 503;
    await page.goto(`${origin}/admin/races`);
    await page.locator("[data-admin-race-retry]").waitFor();
    assert.equal(await page.locator(".admin-race-metrics").count(), 0);
    failure = 0;
    await page.locator("[data-admin-race-retry]").click();
    await page.locator("[data-race-rows]").waitFor();
    failure = 403;
    await page.goto(`${origin}/admin/races`);
    await page.getByRole("heading", { name: "Administrator access unavailable" }).waitFor();
    assert.equal(await page.locator("[data-race-rows]").count(), 0);
    role = "VIEWER";
    await page.goto(`${origin}/admin/races`);
    await page.getByText("Access denied", { exact: true }).waitFor();
    assert.equal(await page.locator("[data-admin-races]").count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}
