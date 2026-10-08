import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/styles.css", import.meta.url), "utf8");
const landing = app.split("function landing(){")[1].split("const auth = authView")[0];

test("landing removes decorative arrows without changing the primary routes", () => {
  assert.ok(landing, "Landing markup is required");
  assert.doesNotMatch(landing, /→|landing-circle-arrow|landing-track-arrow|landing-module-arrow/);
  assert.match(landing, /href="\/race-cards" data-link>Explore Races<\/a>/);
  assert.match(landing, /href="\/tourism" data-link>Discover Heritage<\/a>/);
  assert.match(landing, /href="\/home" data-link>View all modules<\/a>/);
});

test("race highlight and module cards remain clickable without arrow links", () => {
  assert.match(landing, /<a class="landing-track-card" href="\/race-cards" data-link/);
  assert.match(landing, /Sultan Qaboos Race/);
  assert.match(landing, /<a class="landing-module-card" href="['"]\+p\+['"]" data-link>/);
  assert.doesNotMatch(landing, /<aside class="landing-track-card"|landing-track-arrow/);
});

test("layout gives removed arrow space back to content on mobile and desktop", () => {
  assert.doesNotMatch(css, /\.landing-(?:circle-arrow|track-arrow|module-arrow)/);
  assert.match(css, /\.landing-primary,\.landing-secondary\{[^\n]*justify-content:center/);
  assert.match(css, /grid-template-areas:"image" "body"/);
  assert.match(css, /\.landing-track-card:focus-visible/);
});
