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
 assert.doesNotMatch(html,/VISITOR TIPS|Make the most of your experience|Photo credits|heritage-tips|heritage-credits/);
 assert.match(html,/class="heritage-cards"/);
 assert.match(html,/class="heritage-dialog"/);
 assert.doesNotMatch(html,/tourism-hero|Explore Experiences|PENDING|APPROVED/);
});

test('heritage keeps photograph license attribution without visitor tips or credits panels',async()=>{
 const html=heritageExperiences();
 assert.doesNotMatch(html,/heritage-tips|heritage-credits|Photo credits|Plan your visit|Track etiquette/);
 const {readFile}=await import('node:fs/promises');
 const css=await readFile(new URL('../assets/heritage-experiences.css',import.meta.url),'utf8');
 assert.ok(css.includes('.heritage-photo-credit'));
 assert.doesNotMatch(css,/\.heritage-tips\b|\.heritage-credits\b/);
});
