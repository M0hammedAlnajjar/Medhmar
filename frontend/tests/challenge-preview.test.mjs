import test from 'node:test';
import assert from 'node:assert/strict';
import { broadcastPreview, bindBroadcastPreview } from '../js/challenge-preview.js';
test('sample votes stay local, allow one choice and can be reset', () => {
  let html = broadcastPreview(), votes, reset;
  assert.match(html, /No live stream is connected/);
  function element(dataset = {}) { return { dataset, addEventListener(type, callback) { this[type] = callback; }, focus() {} }; }
  const root = { querySelector(selector) {
    if (selector !== '.broadcast-preview') return null;
    votes = [element({ previewVote: '0' }), element({ previewVote: '1' })]; reset = element();
    return { set outerHTML(value) { html = value; },
      querySelectorAll(selector) { return selector === '[data-preview-vote]' ? votes : []; },
      querySelector(selector) { return selector === '[data-preview-reset]' ? reset : null; }
    };
  } };
  bindBroadcastPreview(root); votes[0].click();
  assert.match(html, /745 votes/); assert.match(html, /✓ Selected/);
  votes[1].click(); assert.doesNotMatch(html, /457 votes/);
  reset.click(); assert.match(html, /744 votes/); assert.doesNotMatch(html, /✓ Selected/);
});
