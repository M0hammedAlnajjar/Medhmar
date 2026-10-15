import test from 'node:test';
import assert from 'node:assert/strict';
import { pedigreeFinder } from '../js/pedigree-finder.js';
test('finder starts with a name search instead of another camel directory',()=>{
 const html=pedigreeFinder();
 assert.match(html,/Search pedigree/);
 assert.doesNotMatch(html,/name="gender"|name="breed"|name="status"|name="category"|Barq|grid-3/);
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
 assert.match(html,/data-pedigree-placeholder/);
 assert.doesNotMatch(html,/data-pedigree-record/);
});

test('initial visit loads the first registered camel and its recorded lineage',async()=>{
 const {loadPedigreeFinder}=await import('../js/pedigree-finder.js');
 const calls=[];
 const data=await loadPedigreeFinder({}, {list:async q=>{calls.push(q);return {content:[{camelId:41}]};}}, {tree:async id=>({camelId:Number(id),name:'Barq',sireName:'Recorded sire'})});
 assert.deepEqual(calls,[{page:0,size:1}]);
 assert.equal(data.q.camel,'41');
 assert.match(pedigreeFinder(data),/Recorded sire/);
 assert.doesNotMatch(pedigreeFinder(data),/pedigree-finder-start/);
});
test('empty registry shows honest guidance without a fabricated family',async()=>{
 const {loadPedigreeFinder}=await import('../js/pedigree-finder.js');
 const data=await loadPedigreeFinder({}, {list:async()=>({content:[]})}, {tree:()=>assert.fail('must not request an invented camel')});
 assert.match(pedigreeFinder(data),/No registered camels yet/);
 assert.match(pedigreeFinder(data),/data-pedigree-placeholder/);
 assert.doesNotMatch(pedigreeFinder(data),/data-pedigree-record/);
});
test('explicit camel, search and change-selection actions are respected',async()=>{
 const {loadPedigreeFinder}=await import('../js/pedigree-finder.js');
 const noList={list:()=>assert.fail('explicit selection should not load the registry')};
 const data=await loadPedigreeFinder({camel:'52'},noList,{tree:async()=>({camelId:52,name:'Najm'})});
 assert.equal(data.tree.name,'Najm');
 const choosing=await loadPedigreeFinder({choose:'1'},noList,{tree:()=>assert.fail('choosing should not load a tree')});
 assert.equal(choosing.tree,null);
 const search=await loadPedigreeFinder({search:'missing'},{list:async()=>({content:[]})},{tree:()=>assert.fail('no result should not load a tree')});
 assert.equal(search.tree,null);
});

test('family tree layout stays visible during loading, empty searches and API failures',()=>{
 for(const data of [{},{loadState:'loading'},{loadState:'error',loadError:{status:500}},{q:{search:'missing'},page:{content:[]}}]){
  const html=pedigreeFinder(data);
  assert.match(html,/data-pedigree-placeholder/);
  assert.equal((html.match(/class="pedigree-node(?: |")/g)||[]).length,7);
  assert.doesNotMatch(html,/data-pedigree-record|href="\/camels\/\d|Barq/);
 }
});
