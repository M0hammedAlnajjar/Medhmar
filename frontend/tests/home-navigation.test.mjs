import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { matchRoute } from '../js/routes.js';
import { bindHomePhotoFallbacks } from '../js/home-photo-fallbacks.js';
const source = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const home = source.slice(source.indexOf('function home()'), source.indexOf('function bindHomeControls()'));

test('the Home entry replaces the retired landing view and preserves discovery destinations', () => {
  assert.equal(matchRoute('/').route.name, 'Home / Overview');
  assert.equal(matchRoute('/index.html').route.name, 'Home / Overview');
  assert.doesNotMatch(source, /function landing\(/);
  for (const path of ['/races','/camels','/pedigree','/marketplace','/tourism']) {
    assert.ok(home.includes(path), path); assert.ok(matchRoute(path), path);
  }
  assert.match(home, /data-link/);
  assert.match(home, /loading="lazy"/);
  assert.match(home, /data-mh-story-fallback/);
});

test('a failed home photo switches to its local fallback once despite repeated binding', () => {
  const callbacks = []; let assignments = 0;
  const img = { dataset: { mhStoryFallback: '/assets/mock-camels/camel-4.jpg' }, complete: false,
    addEventListener(type, callback) { callbacks.push(callback); },
    set src(value) { assert.equal(value, this.dataset.mhStoryFallback); assignments++; }
  };
  const container = { querySelectorAll: () => [img] };
  bindHomePhotoFallbacks(container); bindHomePhotoFallbacks(container);
  assert.equal(callbacks.length, 1); callbacks[0](); callbacks[0]();
  assert.equal(assignments, 1);
});

test('cached image failures recover immediately', () => {
  const img = { dataset: { mhStoryFallback: '/assets/mock-camels/camel-4.jpg' }, complete: true, naturalWidth: 0, addEventListener() {} };
  bindHomePhotoFallbacks({ querySelectorAll: () => [img] });
  assert.equal(img.src, img.dataset.mhStoryFallback);
});
