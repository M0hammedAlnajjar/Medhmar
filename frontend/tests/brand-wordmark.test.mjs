import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const logo = await readFile(new URL("../assets/medhmar-logo.svg", import.meta.url), "utf8");
const css = await readFile(new URL("../assets/styles.css", import.meta.url), "utf8");
const app = await readFile(new URL("../js/app.js", import.meta.url), "utf8");
const auth = await readFile(new URL("../js/auth-view.js", import.meta.url), "utf8");

test("shared logo displays only the Medhmar wordmark and subtitle", () => {
  assert.match(logo, /viewBox="0 0 174 58"/);
  assert.match(logo, />MEDHMAR<\/text>/);
  assert.match(logo, />OMAN CAMEL RACING<\/text>/);
  assert.doesNotMatch(logo, /medhmarGold|Camel \+ racing track symbol|<path\b|<defs>/);
});

test("navigation and authentication continue to share the same responsive wordmark", () => {
  assert.match(app, /src="\/assets\/medhmar-logo\.svg"/);
  assert.match(auth, /src="\/assets\/medhmar-logo\.svg"/);
  assert.match(css, /\.brand-wordmark img\{width:148px;height:48px/);
  assert.match(css, /\.auth-brandbar \.brand-wordmark img\{width:176px;height:58px/);
});
