import test from "node:test";
import assert from "node:assert/strict";

globalThis.window = { location: { hostname: "localhost" } };

const { trainerProfile, bindTrainerProfile } = await import("../js/trainer-profile.js");

test("trainer page displays the live directory loading state", () => {
  const html = trainerProfile();

  assert.match(html, /Trainer Profile/);
  assert.match(html, /Experience and dedication behind every performance/);
  assert.match(html, /data-trainer-results/);
  assert.match(html, /role="status"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Loading trainer profiles/);
  assert.doesNotMatch(html, /Salim Al Rashidi|Three illustrative camels|CC BY-SA 4\.0/);
});

test("trainer directory has an accessible heading and breadcrumb", () => {
  const html = trainerProfile();

  assert.match(html, /aria-labelledby="trainer-page-title"/);
  assert.match(html, /id="trainer-page-title"/);
  assert.match(html, /aria-label="Breadcrumb"/);
  assert.match(html, /href="\/home" data-link/);
});

test("binding without a trainer results container has no side effects", () => {
  assert.doesNotThrow(() =>
    bindTrainerProfile({ querySelector: () => null })
  );
});
