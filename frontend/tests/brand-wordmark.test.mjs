import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const asset = file => readFile(new URL(`../assets/${file}`, import.meta.url), "utf8");
const [navLogo, fullLogo, iconLogo, css, app, auth, index] = await Promise.all([
  asset("medhmar-logo.svg"),
  asset("medhmar-logo-full.svg"),
  asset("medhmar-logo-icon.svg"),
  asset("styles.css"),
  readFile(new URL("../js/app.js", import.meta.url), "utf8"),
  readFile(new URL("../js/auth-view.js", import.meta.url), "utf8"),
  readFile(new URL("../index.html", import.meta.url), "utf8"),
]);

test("approved Medhmar artwork is embedded locally in responsive logo variants", () => {
  for (const [svg, expectedDimensions] of [
    [navLogo, "640 164"],
    [fullLogo, "480 312"],
    [iconLogo, "100 70"],
  ]) {
    assert.match(svg, new RegExp(`viewBox="0 0 ${expectedDimensions}"`));
    assert.match(svg, /data:image\/webp;base64,UklGR/);
    const base64 = svg.match(/href="data:image\/webp;base64,([^"]+)"/)?.[1];
    assert.ok(base64 && base64.length > 1000);
    const bytes = Buffer.from(base64, "base64");
    assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
    assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  }
});

test("navbar, auth pages, and favicon show approved brand variants", () => {
  assert.match(app, /src="\/assets\/medhmar-logo\.svg"/);
  assert.match(auth, /src="\/assets\/medhmar-logo-full\.svg"/);
  assert.match(index, /href="\/assets\/medhmar-logo-icon\.svg"/);
  assert.match(css, /\.brand-wordmark\{background:#fbf8f2/);
  assert.match(css, /\.brand-wordmark img\{width:190px;height:48px/);
  assert.match(css, /\.auth-brandbar \.brand-wordmark img\{width:126px;height:78px/);
  assert.match(css, /@media\(max-width:480px\)\{\s*\.topbar \.brand-wordmark img/);
  assert.doesNotMatch(css, /\/assets\/mark\.svg/);
  assert.doesNotMatch(auth, /auth-camel-watermark/);
});
