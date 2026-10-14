import { demo } from './data.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const descriptions = ['A community dedicated to advancing camel racing and supporting local talent.', 'Preserving racing heritage through community events and training.', 'Bringing camel racing enthusiasts together in southern Oman.'];
const covers = ['/assets/home-racetrack.jpg','/assets/racing-hero.webp','/assets/home-racetrack.jpg'];
const events = [{organizationId:1,name:'Al Bashayer Spring Race',day:'12',month:'APR',date:'2027-04-12',location:'Al Dakhiliyah Race Track',time:'7:00 AM (GST)'},{organizationId:2,name:'Nizwa Heritage Cup',day:'26',month:'APR',date:'2027-04-26',location:'Nizwa Race Track',time:'6:30 AM (GST)'}];
export function filterOrganizations(items, query = '', region = '') {
  const term = query.trim().toLowerCase();
  return items.filter(o => (!region || o.region === region) && `${o.name} ${o.region}`.toLowerCase().includes(term));
}
export function organizationDirectory(items) {
  const stats = [[items.length,'Organizations'],[items.reduce((n,o)=>n+o.members,0),'Members'],[items.reduce((n,o)=>n+o.races,0),'Races']];
  return `<section class="organization-directory"><header class="directory-heading"><div><p class="kicker">MEDHMAR</p><h1>Racing Organizations</h1><p>Discover regional racing communities and their upcoming events.</p><span class="directory-sample">Sample organizations and events</span></div><div class="directory-summary">${stats.map(([n,label])=>`<article><strong>${n}</strong><span>${label}</span></article>`).join('')}</div></header><div class="directory-filters"><label><span class="sr-only">Search organizations</span><input type="search" id="organization-search" placeholder="Search organizations by name or region…"></label><label><span class="sr-only">Filter by region</span><select id="organization-region"><option value="">All Regions</option>${[...new Set(items.map(o=>o.region))].map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select></label></div><p class="directory-count" aria-live="polite"></p><div class="directory-cards"></div><section class="directory-events"><h2>Upcoming Organization Events</h2><p>Illustrative event schedule · not published races</p><div class="directory-event-list"></div></section><dialog class="directory-dialog" aria-labelledby="organization-dialog-title"><form method="dialog"><button class="directory-close" aria-label="Close details">×</button></form><h2 id="organization-dialog-title"></h2><div class="directory-dialog-body"></div><form method="dialog"><button class="btn btn-primary">Close</button></form></dialog></section>`;
}
export function bindOrganizationDirectory(root) {
  const section = root.querySelector('.organization-directory'); if (!section) return;
  // Data is deliberately local presentation data, never membership or race API writes.
  {
    const items = demo.organizations;
    const search = section.querySelector('#organization-search');
    const region = section.querySelector('#organization-region');
    const dialog = section.querySelector('dialog');
    function show(title, body) {
      section.querySelector('#organization-dialog-title').textContent = title;
      section.querySelector('.directory-dialog-body').innerHTML = body;
      dialog.showModal();
    }
    function update() {
      const visible = filterOrganizations(items,search.value,region.value);
      section.querySelector('.directory-count').textContent = `${visible.length} sample organization${visible.length === 1?'':'s'}`;
      section.querySelector('.directory-cards').innerHTML = visible.map(o=>`<article class="directory-card"><img class="directory-cover directory-cover-${o.id}" src="${covers[(o.id-1)%covers.length]}" alt="Camel racing on a desert track"><div class="directory-card-body"><div class="directory-card-title"><img src="/assets/medhmar-logo-icon.svg" alt=""><div><h2>${esc(o.name)}</h2><p>${esc(o.region)}</p></div><span class="directory-active">${esc(o.status)}</span></div><p class="directory-description">${descriptions[o.id-1] || 'A regional camel racing community.'}</p><dl class="directory-card-stats"><div><dt>Members</dt><dd>${o.members}</dd></div><div><dt>Races</dt><dd>${o.races}</dd></div><div><dt>Status</dt><dd>${esc(o.status)}</dd></div></dl><button class="btn btn-primary" data-organization="${o.id}">View Organization <span aria-hidden="true">→</span></button></div></article>`).join('') || '<div class="directory-empty"><h2>No organizations found</h2><p>Try another name or choose All Regions.</p></div>';
      const shownEvents = events.filter(e=>visible.some(o=>o.id===e.organizationId));
      section.querySelector('.directory-event-list').innerHTML = shownEvents.map((e)=>`<article class="directory-event"><time datetime="${e.date}"><span>${e.month}</span><strong>${e.day}</strong><span>2027</span></time><img src="${covers[e.organizationId-1]}" alt=""><div><h3>${e.name}</h3><p>${esc(items.find(o=>o.id===e.organizationId).name)}</p></div><p>${e.location}</p><p>${e.time}</p><button class="directory-event-button" data-event="${e.organizationId}" aria-label="View ${e.name}">→</button></article>`).join('') || '<p class="directory-empty">No sample events for this selection.</p>';
    }
    search.addEventListener('input',update); region.addEventListener('change',update);
    section.addEventListener('click',event=> {
      const button = event.target.closest('[data-organization], [data-event]'); if (!button) return;
      if (button.dataset.organization) {
        const o = items.find(o=>o.id===Number(button.dataset.organization));
        show(o.name,`<p>${esc(o.region)} · ${esc(o.status)}</p><p>${descriptions[o.id-1]}</p><p>${o.members} members · ${o.races} races</p><p class="directory-sample">Sample organization. Membership actions are not available in this preview.</p>`);
      } else {
        const e = events.find(e=>e.organizationId===Number(button.dataset.event));
        show(e.name,`<p>${e.day} ${e.month} 2027 · ${e.time}</p><p>${e.location}</p><p class="directory-sample">Illustrative event, not an official race schedule.</p>`);
      }
    });
    update();
  }
}
