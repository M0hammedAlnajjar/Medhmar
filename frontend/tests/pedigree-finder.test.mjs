import test from 'node:test';
import assert from 'node:assert/strict';
import { pedigreeFinder } from '../js/pedigree-finder.js';
test('finder starts with a name search instead of another camel directory',()=>{
 const html=pedigreeFinder();
 assert.match(html,/Search pedigree/);
 assert.doesNotMatch(html,/name="gender"|name="breed"|name="status"|name="category"|pedigree-tree|Barq|grid-3/);
});
test('finder uses registered IDs for selection and escapes API names',()=>{
 const html=pedigreeFinder({q:{search:'Barq'},page:{content:[{camelId:41,name:'<script>Barq</script>',breed:'Omani'}]}});
 assert.match(html,/camel=41/);
 assert.match(html,/&lt;script&gt;/);
 assert.doesNotMatch(html,/<script>/);
});
test('selected camel shows its actual tree inline without duplicated page headings',()=>{
 const html=pedigreeFinder({q:{camel:'41'},tree:{camelId:41,name:'Actual camel',sireName:'Actual sire'}});
 assert.match(html,/Actual camel|Actual sire/);
 assert.match(html,/class="pedigree-tree"/);
 assert.doesNotMatch(html,/<h1|Illustrative preview|Barq/);
});
test('failed or empty lookups never render a fabricated tree',()=>{
 assert.match(pedigreeFinder({q:{search:'missing'},page:{content:[]}}),/No camels match/);
 const html=pedigreeFinder({q:{camel:'41'},treeError:{status:404}});
 assert.match(html,/Camel not found/);
 assert.doesNotMatch(html,/class="pedigree-tree"/);
});
