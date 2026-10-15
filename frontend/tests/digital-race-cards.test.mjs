import test from 'node:test';
import assert from 'node:assert/strict';
import { getRaceCard, renderRaceCardDocument } from '../js/digital-race-cards.js';
test('version snapshots have matching participant counts and preserve older values',()=>{
 assert.equal(getRaceCard('bashayer',1).card.entries.length,3);
 assert.equal(getRaceCard('bashayer',3).card.entries.length,4);
 assert.notEqual(getRaceCard('bashayer',2).card.entries[1].trainer,getRaceCard('bashayer',3).card.entries[1].trainer);
 assert.equal(getRaceCard('nizwa').card.entries.length,2);
 assert.equal(getRaceCard('unknown',99).card.version,3);
});
test('race card renders a labeled sample and accessible participant table',()=>{
 const html=renderRaceCardDocument('bashayer',1);
 assert.match(html,/Sample publication/);
 assert.match(html,/Version 1/);
 assert.match(html,/scope="col"/);
 assert.equal((html.match(/scope="row"/g)||[]).length,3);
 assert.match(html,/CC BY-SA 4.0/);
});
