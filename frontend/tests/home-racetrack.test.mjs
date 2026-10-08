import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/home.css', import.meta.url), 'utf8');
const jpeg = readFileSync(new URL('../assets/home-racetrack.jpg', import.meta.url));

test('photographic home backdrop is scoped to the home route and is not SVG', () => {
  assert.match(css, /\.app-shell:has\(\.home-experience\)\s*\{/);
  assert.match(css, /url\("\/assets\/home-racetrack\.jpg"\)/);
  assert.doesNotMatch(css, /home-racetrack\.svg/);
  assert.match(css, /@media\(max-width:600px\)/);
});

test('the locally served background is a real raster JPEG with reasonable file size', () => {
  assert.equal(jpeg[0], 0xff);
  assert.equal(jpeg[1], 0xd8);
  assert.equal(jpeg[2], 0xff);
  assert.ok(jpeg.length > 10_000, 'image must not be an empty placeholder');
  assert.ok(jpeg.length < 800_000, 'background should load efficiently');
});

test('readability comes from CSS gradient layers, not burned-in UI', () => {
  assert.match(css, /linear-gradient\(180deg/);
  assert.match(css, /linear-gradient\(90deg/);
  assert.match(css, /background-repeat:no-repeat/);
});
