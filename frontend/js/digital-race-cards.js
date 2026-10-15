const entrants = [
 {name:'Barq',owner:'Ahmed Al Balushi',trainer:'Salim Al Rashidi'},
 {name:'Shahin',owner:'Khalid Al Maamari',trainer:'Nasser Al Hinai'},
 {name:'Al Sahab',owner:'Mohammed Al Naqbi',trainer:'Rashid Al Kindi'},
 {name:'Najm',owner:'Saif Al Busaidi',trainer:'Khalid Al Harthy'}
];
const races = [
 {id:'bashayer',name:'Al Bashayer Camel Race',date:'12 October 2026',location:'Al Dakhiliyah',distance:'5 KM',versions:[{version:3,published:'06 Oct 2026 09:15',entries:entrants},{version:2,published:'05 Oct 2026 16:30',entries:entrants.map((e,i)=>i===1?{...e,trainer:'Salim Al Rashidi'}:e)},{version:1,published:'04 Oct 2026 10:00',entries:entrants.slice(0,3)}]},
 {id:'nizwa',name:'Nizwa Heritage Race',date:'18 October 2026',location:'Nizwa',distance:'6 KM',versions:[{version:1,published:'10 Oct 2026 08:30',entries:entrants.slice(1,3)}]}
];
export function getRaceCard(raceId='bashayer',version) {
 const race=races.find(r=>r.id===raceId)||races[0];
 const card=race.versions.find(c=>c.version===Number(version))||race.versions[0];
 return {...race,card};
}
export function digitalRaceCards(){return `<section class="digital-race-cards"><header class="drc-heading"><p class="kicker">MEDHMAR</p><h1>Digital Race Cards</h1><p>Explore published race lineups and their version history.</p><span class="drc-sample">Sample race cards · Illustrative data</span></header><div class="drc-toolbar"><label>Select race<select id="drc-race">${races.map(r=>`<option value="${r.id}">${r.name}</option>`).join('')}</select></label><label>Version<select id="drc-version"></select></label><button class="drc-outline" type="button" data-drc-print>Print Card</button></div><div class="drc-content"></div><section class="drc-history" aria-labelledby="drc-history-title"><h2 id="drc-history-title">Publication History</h2><div class="drc-versions"></div></section></section>`;}
const icon = kind => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${({distance:'<circle cx="5" cy="18" r="3"/><circle cx="19" cy="5" r="3"/><path d="M5 15c0-10 14 8 14-7"/>',people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3m0-17a3 3 0 0 1 0 6m3 3a6 6 0 0 1 3 5v3"/>',pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',file:'<path d="M5 2h9l5 5v15H5ZM14 2v6h5M8 12h8M8 16h8"/>'})[kind]}</svg>`;
export function renderRaceCardDocument(raceId,version){
 const race=getRaceCard(raceId,version),c=race.card;
 return `<article class="drc-document"><div class="drc-document-heading"><div><img class="drc-logo" src="/assets/medhmar-logo-full.svg" alt="Medhmar"><p class="kicker">DIGITAL RACE CARD</p><h2>${race.name}</h2><p>${race.date} · ${race.location} · ${race.distance}</p></div><div class="drc-publication"><span class="drc-status">Sample publication</span><span class="drc-version-badge">Version ${c.version}</span><p>Published ${c.published}</p></div></div><div class="drc-summary">${[['distance',race.distance,'Distance'],['people',c.entries.length,'Participants'],['pin',race.location,'Location'],['file',c.version,'Version']].map(([i,v,label])=>`<div>${icon(i)}<div><span>${label}</span><strong>${v}</strong></div></div>`).join('')}</div><div class="drc-table-scroll" tabindex="0" role="region" aria-label="Race participants"><table class="drc-table"><caption class="drc-sr-only">Sample lineup for ${race.name}, version ${c.version}</caption><thead><tr><th scope="col">No.</th><th scope="col">Camel</th><th scope="col">Owner</th><th scope="col">Trainer</th><th scope="col">Category</th></tr></thead><tbody>${c.entries.map((e,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><th scope="row"><span class="drc-camel"><img src="/assets/organization-photos/training.webp" alt="" width="60" height="44"><span>${e.name}</span></span></th><td>${e.owner}</td><td>${e.trainer}</td><td><span class="drc-category">Racing</span></td></tr>`).join('')}</tbody></table></div><p class="drc-note">Published versions preserve the lineup at the time of publication. This is a sample card.</p><details class="drc-photo-credits"><summary>Photo credit</summary><p>Illustrative photograph, not a photograph of each named camel. <a href="https://commons.wikimedia.org/wiki/File:Camel_Race_Training.jpg" target="_blank" rel="noopener">Camel Race Training</a> by Lintophilip, UAE · <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener">CC BY-SA 4.0</a>. Converted to WebP; cropped for display.</p></details></article>`;
}
export function bindDigitalRaceCards(root){
 const section=root.querySelector('.digital-race-cards');if(!section)return;
 const raceSelect=section.querySelector('#drc-race'),versionSelect=section.querySelector('#drc-version');
 function update(reset=false){
  const race=getRaceCard(raceSelect.value,reset?undefined:versionSelect.value);
  versionSelect.innerHTML=race.versions.map((c,i)=>`<option value="${c.version}" ${c.version===race.card.version?'selected':''}>Version ${c.version}${i===0?' (Latest)':''}</option>`).join('');
  section.querySelector('.drc-content').innerHTML=renderRaceCardDocument(race.id,race.card.version);
  section.querySelector('.drc-versions').innerHTML=race.versions.map((c,i)=>`<article class="drc-history-row ${c.version===race.card.version?'is-selected':''}"><div><strong>Version ${c.version}</strong>${i===0?'<span class="drc-version-badge">Latest</span>':''}</div><span>${c.published}</span><span>${c.entries.length} participants</span><button type="button" class="drc-history-button" data-drc-version="${c.version}" ${c.version===race.card.version?'aria-current="true"':''}>View Version <span aria-hidden="true">→</span><span class="drc-sr-only"> ${c.version}</span></button></article>`).join('');
 }
 raceSelect.addEventListener('change',()=>update(true));versionSelect.addEventListener('change',()=>update());
 section.addEventListener('click',event=>{const button=event.target.closest('[data-drc-version]');if(button){versionSelect.value=button.dataset.drcVersion;update();versionSelect.focus();}if(event.target.closest('[data-drc-print]'))window.print();});update(true);
}
