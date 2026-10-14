import test from 'node:test';
import assert from 'node:assert/strict';
import { trainingJournal } from '../js/training-journal.js';
test('sample journal derives its totals from the three displayed sessions', () => {
  const html = trainingJournal();
  assert.match(html, /Sample training journal/);
  assert.equal((html.match(/class="journal-session"/g)||[]).length, 3);
  assert.match(html, /<strong>130<\/strong>/);
  assert.match(html, /<strong>43 min<\/strong>/);
  assert.match(html, /id="add-training-btn"/);
  assert.match(html, /<dialog/);
  assert.doesNotMatch(html, /heart rate|performance score/i);
});
