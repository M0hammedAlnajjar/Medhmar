import test from 'node:test';
import assert from 'node:assert/strict';
import { marketPrice,camelAge,sampleMarketplacePage,loadMarketplaceBrowse,marketplaceBrowse,marketplaceListingCard } from '../js/marketplace-view.js';
test('marketplace formats OMR precisely and derives complete years from birth date',()=>{
 assert.equal(marketPrice('3800.000'),'OMR 3,800.000');
 assert.equal(marketPrice('12.375'),'OMR 12.375');
 assert.equal(marketPrice(null),'Price not provided');
 assert.equal(camelAge('2022-10-16',new Date('2026-10-15T00:00:00Z')),'3 years');
 assert.equal(camelAge('2022-10-15',new Date('2026-10-15T00:00:00Z')),'4 years');
 assert.equal(camelAge('invalid'),'');
});
test('sample search price bounds and ordering combine',()=>{
 assert.equal(sampleMarketplacePage({search:' BARQ '}).totalElements,1);
 assert.deepEqual(sampleMarketplacePage({minPrice:'3300',maxPrice:'4600',sort:'price-desc'}).content.map(s=>s.name),['Shahin','Barq']);
 assert.deepEqual(sampleMarketplacePage({sort:'price-asc'}).content.map(s=>s.name),['Al Reem','Barq','Shahin']);
 assert.equal(sampleMarketplacePage({minPrice:'9000'}).totalElements,0);
});
test('live listing cards preserve IDs photos and pedigree links and escape API content',()=>{
 const html=marketplaceListingCard({listingId:77,camelId:41,askingPriceOmr:'12.375',status:'AVAILABLE'},{41:{name:'<script>camel</script>',photoUrl:'javascript:alert(1)'}});
 assert.match(html,/href="\/marketplace\/77"/);
 assert.match(html,/href="\/pedigree\?camel=41"/);
 assert.match(html,/Photo not provided/);
 assert.doesNotMatch(html,/<script>|javascript:|data-market-sample/);
 assert.match(html,/&lt;script&gt;/);
});
test('empty live marketplace gets labeled samples while filters and explicit live mode stay live',async()=>{
 const emptyApi={list:async()=>({content:[],page:0,totalPages:0,totalElements:0})};
 const camelApi={one:()=>assert.fail('empty listings must not fetch camels')};
 assert.equal((await loadMarketplaceBrowse({},emptyApi,camelApi)).preview,true);
 assert.equal((await loadMarketplaceBrowse({search:'missing'},emptyApi,camelApi)).preview,false);
 assert.equal((await loadMarketplaceBrowse({minPrice:'0'},emptyApi,camelApi)).preview,false);
 assert.equal((await loadMarketplaceBrowse({preview:'0'},emptyApi,camelApi)).preview,false);
 await assert.rejects(()=>loadMarketplaceBrowse({},{list:async()=>{throw new Error('offline');}},camelApi),/offline/);
});
test('real listings keep backend pagination and preview avoids all backend calls',async()=>{
 const data=await loadMarketplaceBrowse({page:'2'},{list:async q=>{assert.equal(q.page,'2');return {content:[{listingId:9,camelId:41}],page:2,totalPages:4,totalElements:40};}},{one:async id=>({camelId:id,name:'Recorded camel'})});
 assert.equal(data.page.page,2);assert.equal(data.camels[41].name,'Recorded camel');assert.equal(data.preview,false);
 const preview=await loadMarketplaceBrowse({preview:'1'},{list:()=>assert.fail('sample mode must not call API')},{});
 const html=marketplaceBrowse(preview);
 assert.match(html,/not camels offered for sale/);
 assert.match(html,/data-market-sample/);
 assert.doesNotMatch(html,/href="\/marketplace\/sample|href="\/pedigree\?camel=sample/);
});
