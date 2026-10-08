import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const app = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const landingFn = app.split("function landing(){")[1]?.split("const auth = authView")[0];
if (!landingFn) throw new Error("Landing page implementation missing");
const landing = new Function("topbar", "function landing(){" + landingFn + "; return landing();")(() => "<nav></nav>");

test("landing uses verified authentic photographic links, one hero and four unique modules", () => {
  const urls = [...landing.matchAll(/<img\b[^>]*\bsrc="(https:\/\/(?:thumb|upload)\.wikimedia\.org[^"]+)"/g)].map(match => match[1]);
  assert.equal(urls.length, 5, "hero and all four modules should use real photos");
  assert.equal(new Set(urls).size, 5, "images should be varied instead of repeated");
  assert.match(landing, /class="landing-race-photo" src="https:\/\/thumb\.wikimedia\.org/);
  assert.doesNotMatch(landing, /landing-race-photo" src="\/assets\/landing-hero-wide/);
});

test("landing keeps navigation while removing photo credits UI entirely", () => {
  assert.match(landing, /href="\/race-cards" data-link>Explore Races<\/a>/);
  assert.match(landing, /href="\/tourism" data-link>Discover Heritage<\/a>/);
  assert.match(landing, /href="\/race-cards" data-link aria-label="Open race cards for Sultan Qaboos Race"/);
  assert.doesNotMatch(landing, /Photography credits and licenses|landing-photo-credits|<details/);
  assert.doesNotMatch(landing, /landing-legal-footer|photo-credits\.html|Photo credits/);
});

test("photography markup remains decorative outside of content and keeps lazy loading", () => {
  assert.match(landing, /alt="Actual photograph of racing camels with robotic jockeys"/);
  assert.equal((landing.match(/loading="lazy"/g) || []).length, 4);
  assert.equal((landing.match(/decoding="async"/g) || []).length, 5);
  assert.match(landing, /fetchpriority="high"/);
});

