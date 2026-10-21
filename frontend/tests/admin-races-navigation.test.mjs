import test from "node:test";
import assert from "node:assert/strict";
import { matchRoute, canAccessRoute } from "../js/routes.js";
import { adminShell } from "../js/admin-console.js";

const user = role => ({ userId: 1, fullName: "Test User", roles: [role] });

test("admin races route is restricted to admins", () => {
  const route = matchRoute("/admin/races")?.route;
  assert.ok(route);
  assert.equal(route.name, "Admin Races");
  assert.equal(canAccessRoute(route, user("ADMIN")), true);
  for (const role of ["VIEWER", "OWNER", "TRAINER", "ORGANIZER"]) {
    assert.equal(canAccessRoute(route, user(role)), false);
  }
});

test("race workspace places Races first in Management and keeps website navigation", () => {
  const html = adminShell({
    user: user("ADMIN"),
    active: "/admin/races",
    body: "<p>Race management</p>"
  });
  assert.match(html, /href="\/admin\/audit-logs"/);
  assert.match(html, /href="\/admin\/races" data-link class="active"/);
  assert.ok(html.indexOf('href="/admin/races"') < html.indexOf('href="/admin/users"'));
  assert.match(html, /data-admin-layout="races"/);
  assert.match(html, /href="\/home\?view=website"/);
  assert.ok(html.indexOf('href="/admin/races"') < html.indexOf('href="/admin/settings"'));
});
