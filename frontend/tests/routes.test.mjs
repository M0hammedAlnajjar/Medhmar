import test from "node:test";
import assert from "node:assert/strict";
import { MOHAMMED_ROUTES, matchRoute } from "../js/routes.js";

test("contains exactly Mohammed's 17 assigned interface groups", () => {
  assert.equal(MOHAMMED_ROUTES.length, 17);
  assert.ok(MOHAMMED_ROUTES.every((r) => r.owner === "Mohammed"));
});

test("matches Mohammed dynamic routes", () => {
  assert.equal(matchRoute("/challenges/17").route.name, "Challenge Detail + Voting");
  assert.equal(matchRoute("/camels/11").route.name, "Pedigree Section");
  assert.equal(matchRoute("/organizer/races/5/race-card").route.name, "Race Card Publish Control");
});

test("does not expose teammate-owned standalone modules", () => {
  for (const path of ["/races","/archive","/my-camels","/marketplace","/offers","/agreements","/assigned"]) {
    assert.equal(matchRoute(path), null);
  }
});
