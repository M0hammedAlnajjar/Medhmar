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
    [navLogo, "865 169"],
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
  assert.match(css, /\.topbar \.brand-wordmark\{padding:0;background:transparent;border:0/);
  assert.match(css, /\.topbar \.brand-wordmark img\{width:224px;height:54px/);
  assert.match(css, /\.auth-brandbar \.brand-wordmark img\{width:126px;height:78px/);
  assert.match(css, /@media\(max-width:480px\)\{\s*\.topbar \.brand-wordmark img/);
  assert.doesNotMatch(css, /\/assets\/mark\.svg/);
  assert.doesNotMatch(auth, /auth-camel-watermark/);
});

test("desktop reference uses a floating rounded navbar with the original controls", () => {
  assert.match(css, /\.topbar\{[\s\S]*?width:calc\(100% - 36px\);max-width:1600px;height:82px/);
  assert.match(css, /margin:18px auto 0;top:10px;border-radius:12px/);
  assert.match(css, /\.topbar \.brand-wordmark\{padding:0;background:transparent;border:0/);
  assert.match(css, /@media\(max-width:720px\)\{[\s\S]*?width:calc\(100% - 16px\)/);
  assert.match(app, /const primaryDesktopPaths = \[/);
  assert.ok(app.includes("'/races', '/race-cards', '/camels', '/pedigree', '/marketplace'"));
  assert.match(app, /const extraItems = items.filter\(\(\[path\]\) => !visiblePaths.includes\(path\)\);/);
  assert.match(app, /class="nav-search"/);
  assert.match(app, /class="nav-language-single"/);
});
