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

test("landing keeps navigation and routes while moving credits off the page", () => {
  assert.match(landing, /href="\/race-cards" data-link>Explore Races<\/a>/);
  assert.match(landing, /href="\/tourism" data-link>Discover Heritage<\/a>/);
  assert.match(landing, /href="\/race-cards" data-link aria-label="Open race cards for Sultan Qaboos Race"/);
  assert.doesNotMatch(landing, /Photography credits and licenses|landing-photo-credits|<details/);
  assert.match(landing, /<footer class="landing-legal-footer"><a href="\/assets\/photo-credits.html">Photo credits<\/a><\/footer>/);
});

test("photography markup remains decorative outside of content and keeps lazy loading", () => {
  assert.match(landing, /alt="Actual photograph of racing camels with robotic jockeys"/);
  assert.equal((landing.match(/loading="lazy"/g) || []).length, 4);
  assert.equal((landing.match(/decoding="async"/g) || []).length, 5);
  assert.match(landing, /fetchpriority="high"/);
});

test("photo source attribution is preserved on a separate document", async () => {
  const source = await readFile(new URL("../assets/photo-credits.html", import.meta.url), "utf8");
  assert.match(source, /Photography credits/);
  assert.match(source, /not photographs of the fictional sample races/);
  assert.match(source, /commons\.wikimedia\.org\/wiki\/File:Camel_of_Oman/);
  assert.match(source, /creativecommons\.org\/licenses\/by-sa\/4\.0/);
  assert.match(source, /creativecommons\.org\/licenses\/by\/2\.0/);
});
