const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const sampleItems = [
  {id:1,category:'stories',label:'Cultural Stories',title:'Camel Racing Heritage Exhibition',location:'Nizwa',date:'18 Oct 2026',image:'training',description:'Explore the people and traditions behind camel racing, from breeding and training to the community around the track.',body:'This sample exhibition introduces the roles of owners, trainers and organizers. Discover the care, preparation and community participation that support a racing camel. The date and venue are illustrative; this is not a published event.'},
  {id:2,category:'events',label:'Visitor Events',title:'Race Day Visitor Experience',location:'Adam',date:'24 Oct 2026',image:'robot-jockeys',description:'Discover a race day from trackside atmosphere to the people who prepare and care for the camels.',body:'This sample visitor experience follows the preparation and atmosphere of a race day. Check the official organizer schedule before planning a visit. The displayed date and location are illustrative, and no booking is offered.'},
  {id:3,category:'stories',label:'Cultural Stories',title:'Traditional Racing Terminology',location:'Oman',date:'Cultural guide',image:'finish-line',description:'An introduction to common racing terms, equipment and the people involved in the sport.',body:'Mudammer: a camel trainer who prepares racing camels. Track: the course used for training and competition. Robot jockey: remotely controlled equipment used in many modern camel races. This is a sample introductory guide.'}
];
const photo = name => `/assets/organization-photos/${name}.webp`;
const dateLabel = value => { const date=value?new Date(value):null;return date&&!Number.isNaN(date.valueOf())?date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Muscat'}):'Date unavailable'; };
const imageFor = (item,index) => item.category==='events'?['robot-jockeys','finish-line','training'][index%3]:['training','finish-line','robot-jockeys'][index%3];
function fromApi({events=[],content=[]}={}) {
  const stories=(Array.isArray(content)?content:[]).map((item,index)=>({
    id:`story-${item.contentId}`,category:'stories',label:item.category||'Cultural Story',title:item.title,
    location:item.organizationName||'Oman',date:'Cultural story',image:imageFor({category:'stories'},index),
    description:item.description||item.category||'Cultural story from the Medhmar community.',body:item.description||'',url:item.contentUrl
  }));
  const visits=(Array.isArray(events)?events:[]).map((item,index)=>({
    id:`event-${item.eventId}`,category:'events',label:'Visitor Event',title:item.name,location:item.location,
    date:dateLabel(item.startAt),image:imageFor({category:'events'},index),
    description:item.description||item.type||'Visitor event',body:item.description||'',url:''
  }));
  const records=[...stories,...visits];
  return records.length?records:sampleItems;
}
export function filterHeritage(category='all',query='',records=sampleItems) {
  const term=query.trim().toLowerCase();
  return records.filter(item=>(category==='all'||item.category===category)&&`${item.title} ${item.location} ${item.description}`.toLowerCase().includes(term));
}
const icon = paths => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true">${paths}</svg>`;
export function heritageExperiences(data=null) {
  const live=Boolean(data),items=live?fromApi(data):sampleItems;
  const cards=(records)=>records.map((item,index)=>`<article class="heritage-card"><img src="${photo(imageFor(item,index))}" alt="Camel racing heritage" width="1280" height="853"><div class="heritage-card-body"><span class="heritage-label">${esc(item.label)}</span><h2>${esc(item.title)}</h2><p class="heritage-meta">${esc(item.location)} · ${esc(item.date)}</p><p class="heritage-description">${esc(item.description)}</p><button type="button" data-heritage-item="${esc(item.id)}">${item.category==='events'?'View Experience':'Read Story'} <span aria-hidden="true">→</span></button></div></article>`).join('');
  return `<section class="heritage-experiences"><header class="heritage-heading"><p class="kicker">MEDHMAR</p><h1>Camel Racing Heritage</h1><p>Explore the traditions, people and experiences behind the race.</p></header><div class="heritage-toolbar"><div class="heritage-categories" role="group" aria-label="Experience category"><button type="button" data-heritage-category="all" aria-pressed="true">All Experiences</button><button type="button" data-heritage-category="stories" aria-pressed="false">Cultural Stories</button><button type="button" data-heritage-category="events" aria-pressed="false">Visitor Events</button></div><label class="heritage-search"><span class="heritage-sr-only">Search experiences</span><input type="search" id="heritage-search" placeholder="Search experiences, stories or topics…"></label></div><div class="heritage-results-heading"><span>${live?'Cultural stories & visitor events':'Sample experiences'}</span><p id="heritage-count" role="status"></p></div><div class="heritage-cards"></div><section class="heritage-tips" aria-labelledby="heritage-tips-title"><div><p class="kicker">VISITOR TIPS</p><h2 id="heritage-tips-title">Make the most of your experience</h2></div><article>${icon('<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1"/>')}<div><h3>Plan your visit</h3><p>Check organizer times</p></div></article><article>${icon('<path d="M3 19h18M7 19V9a5 5 0 0 1 10 0v10M7 12h10"/>')}<div><h3>What to bring</h3><p>Water and sun protection</p></div></article><article>${icon('<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m0-17a3 3 0 0 1 0 6m3 3a6 6 0 0 1 3 5v3"/>')}<div><h3>Track etiquette</h3><p>Follow organizer guidance</p></div></article></section><details class="heritage-credits"><summary>Photo credits</summary><p>Illustrative camel racing photographs from the UAE and Morocco.</p><ul><li><a href="https://commons.wikimedia.org/wiki/File:Camel_Race_Training.jpg" target="_blank" rel="noopener">Camel Race Training</a> — Lintophilip (UAE)</li><li><a href="https://commons.wikimedia.org/wiki/File:Camel_race_using_robot_jockeys.jpg" target="_blank" rel="noopener">Camel race using robot jockeys</a> — Houssain tork (Morocco)</li><li><a href="https://commons.wikimedia.org/wiki/File:Camel_Race_Finishing_Line.jpg" target="_blank" rel="noopener">Camel Race Finishing Line</a> — Tmsprophoto.photography (UAE)</li></ul><p>All images licensed <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>.</p></details><dialog class="heritage-dialog" aria-labelledby="heritage-dialog-title"><form method="dialog"><button aria-label="Close details" class="heritage-close">×</button></form><p class="kicker">MEDHMAR HERITAGE</p><h2 id="heritage-dialog-title"></h2><p class="heritage-dialog-meta"></p><p class="heritage-dialog-body"></p><a class="heritage-dialog-link" target="_blank" rel="noopener" hidden>Open related resource</a><form method="dialog"><button class="btn btn-primary">Close</button></form></dialog></section>`;
}
export function bindHeritageExperiences(root,data=null) {
  const section=root.querySelector('.heritage-experiences');if(!section)return;
  const items=data?fromApi(data):sampleItems;let category='all';const search=section.querySelector('#heritage-search');
  function update(){
    const visible=filterHeritage(category,search.value,items);
    section.querySelector('#heritage-count').textContent=`${visible.length} result${visible.length===1?'':'s'}`;
    section.querySelectorAll('[data-heritage-category]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.heritageCategory===category)));
    section.querySelector('.heritage-cards').innerHTML=visible.map((item,index)=>`<article class="heritage-card"><img src="${photo(imageFor(item,index))}" alt="Camel racing heritage" width="1280" height="853"><div class="heritage-card-body"><span class="heritage-label">${esc(item.label)}</span><h2>${esc(item.title)}</h2><p class="heritage-meta">${esc(item.location)} · ${esc(item.date)}</p><p class="heritage-description">${esc(item.description)}</p><button type="button" data-heritage-item="${esc(item.id)}">${item.category==='events'?'View Experience':'Read Story'} <span aria-hidden="true">→</span></button></div></article>`).join('')||'<div class="heritage-empty"><h2>No experiences found</h2><p>There are no published stories or visitor events matching this search.</p></div>';
  }
  search.addEventListener('input',update);
  section.addEventListener('click',event=>{
    const categoryButton=event.target.closest('[data-heritage-category]');if(categoryButton){category=categoryButton.dataset.heritageCategory;update();return;}
    const button=event.target.closest('[data-heritage-item]');if(!button)return;
    const item=items.find(entry=>String(entry.id)===button.dataset.heritageItem);if(!item)return;
    section.querySelector('#heritage-dialog-title').textContent=item.title;
    section.querySelector('.heritage-dialog-meta').textContent=`${item.location} · ${item.date}`;
    section.querySelector('.heritage-dialog-body').textContent=item.body||item.description||'';
    const link=section.querySelector('.heritage-dialog-link');
    if(item.url&&/^https?:\/\//i.test(item.url)){link.href=item.url;link.hidden=false;}else link.hidden=true;
    section.querySelector('dialog').showModal();
  });update();
}
