import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../assets/home.css', import.meta.url), 'utf8');
const backdrop = readFileSync(new URL('../assets/home-racetrack.svg', import.meta.url), 'utf8');

test('the racetrack background is scoped to the home screen', () => {
  assert.match(css, /\.app-shell:has\(\.home-experience\)\s*\{/);
  assert.match(css, /url\("\/assets\/home-racetrack\.svg"\)/);
  assert.match(css, /@media\(max-width:600px\)/);
});

test('the backdrop depicts a racing track without palms or buildings', () => {
  assert.match(backdrop, /<svg\s/);
  assert.match(backdrop, /<path\s/);
  assert.match(backdrop, /racing course|track barriers/i);
  assert.doesNotMatch(backdrop, /palm|castle|fortress|fort\b|building/i);
});
