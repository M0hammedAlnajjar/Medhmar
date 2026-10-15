import { pedigreeView, pedigreePlaceholder } from './pedigree-view.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function pedigreeFinder({q={},page=null,tree=null,treeError=null,emptyRegistry=false,loadState='ready',loadError=null}={}) {
 const search=q.search||'',selected=String(q.camel||'');
 const selection=tree?`<div class="pedigree-selection"><div><span>Selected camel</span><h2>${esc(tree.name)}</h2></div><a href="/pedigree?choose=1${search?'&amp;search='+encodeURIComponent(search):''}" data-link class="btn btn-secondary">Choose another camel</a></div>${pedigreeView({status:'ready',data:{tree}},{embedded:true})}`:`${loadState==='loading'?'<p role="status" class="pedigree-load-status">Loading registered lineage…</p>':(treeError||loadError)?pedigreeView({status:'error',error:treeError||loadError},{embedded:true}):''}${pedigreePlaceholder()}`;
 const results=search&&page?`<section class="pedigree-search-results" aria-label="Camel search results"><h2>Select a camel to view its pedigree</h2>${page.content.length?`<ul>${page.content.map(c=>`<li><div><strong>${esc(c.name)}</strong><span>Registry #${esc(c.camelId)}${c.breed?' · '+esc(c.breed):''}${c.birthDate?' · Born '+esc(c.birthDate):''}</span></div><a class="btn ${selected===String(c.camelId)?'btn-secondary':'btn-primary'}" href="/pedigree?${esc(new URLSearchParams({search,camel:String(c.camelId),...(q.page?{page:String(q.page)}:{})}).toString())}" data-link ${selected===String(c.camelId)?'aria-current="true"':''}>${selected===String(c.camelId)?'Selected':'View family tree'}</a></li>`).join('')}</ul>`:'<p class="pedigree-finder-empty">No camels match this name. Try another name or check the registry in Camels.</p>'}</section>`:'';
 return `<section class="pedigree-finder"><form class="pedigree-search-form" data-form="pedigree-filter"><label for="pedigree-search">Find a camel by name</label><div><input class="input" type="search" id="pedigree-search" name="search" placeholder="Enter a registered camel’s name…" value="${esc(search)}" required maxlength="100"><button class="btn btn-primary" type="submit">Search pedigree</button></div></form>${selection}${results}${loadState==='ready'&&!loadError&&!search&&!selected?`<section class="pedigree-finder-start"><h2>${emptyRegistry?'No registered camels yet':'Choose a camel to explore its bloodline'}</h2><p>${emptyRegistry?'Register a camel and record its parents to display a family tree here.':'Search for a registered camel above to see its sire, dam and grandparents.'}</p><a href="/camels" class="btn btn-secondary" data-link>Manage and browse camels</a></section>`:''}</section>`;
}

// Resolve the initial tree from the registry, never from fabricated lineage data.
export async function loadPedigreeFinder(params, camelApi, pedigreeApi) {
 const q={...params,search:(params.search||'').trim()};
 let selected=/^[1-9]\d*$/.test(q.camel||'')?q.camel:'';
 let page=null,emptyRegistry=false;
 if(q.search) page=await camelApi.list({page:q.page||0,size:8,search:q.search});
 else if(!selected&&q.choose!=='1') {
  const first=await camelApi.list({page:0,size:1});
  selected=String(first.content?.[0]?.camelId||'');
  if(!/^[1-9]\d*$/.test(selected)) {selected='';emptyRegistry=true;}
 }
 let tree=null,treeError=null;
 if(selected) {try{tree=await pedigreeApi.tree(selected);}catch(error){treeError=error;}}
 return {q:{...q,camel:selected},page,tree,treeError,emptyRegistry};
}
