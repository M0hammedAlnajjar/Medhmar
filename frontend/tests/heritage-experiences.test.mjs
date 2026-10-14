import test from 'node:test';
import assert from 'node:assert/strict';
import { filterHeritage, heritageExperiences } from '../js/heritage-experiences.js';
test('heritage combines search and categories',()=>{
 assert.equal(filterHeritage().length,3);
 assert.equal(filterHeritage('stories').length,2);
 assert.equal(filterHeritage('events',' ADAM ').length,1);
 assert.equal(filterHeritage('stories','Adam').length,0);
 assert.equal(filterHeritage('all','unknown').length,0);
});
test('heritage clearly marks sample content and has no hero or approval badges',()=>{
 const html=heritageExperiences();
 assert.match(html,/Sample experiences/);
 assert.match(html,/Photo credits/);
 assert.doesNotMatch(html,/tourism-hero|Explore Experiences|PENDING|APPROVED/);
});
