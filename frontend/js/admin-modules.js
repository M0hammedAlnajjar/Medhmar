// Administrators manage real challenges and organizations, never demo records.
const esc = x => String(x ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const int = x => Number.isSafeInteger(x)&&x>=0?x.toLocaleString('en-US'):'—';
const dateLabel = value => {
  const d=value?new Date(value):null;
  return d&&!Number.isNaN(d.getTime())?
    new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(d)+' UTC':'—';
};
const localDate = value => {
  const d=value?new Date(value):null;
  if(!d||Number.isNaN(d.getTime()))return '';
  // Oman uses UTC+04:00 year-round; datetime-local fields always show Muscat time.
  return new Date(d.getTime()+4*60*60*1000).toISOString().slice(0,16);
};
const status = raw => {
  const s=String(raw||'UNKNOWN').toUpperCase();
  return '<span class="admin-module-status admin-module-status-'+(s==='ACTIVE'||s==='OPEN'?'active':s==='DRAFT'?'draft':'inactive')+'">'+esc(s)+'</span>';
};
const message = (heading,error) => '<section class="admin-module-message" role="alert"><h2>'+esc(heading)+
  '</h2><p>'+esc(error||'Unable to load data. Please try again.')+'</p><button class="admin-module-button" data-admin-module-retry type="button">Retry</button></section>';
const pagination = (kind,page) => {
  const n=page.page, total=page.totalPages;
  return '<nav class="admin-module-pagination" aria-label="'+esc(kind)+' pagination"><span>'+
    int(page.totalElements)+' total records</span><div>'+
    (n>0?'<a data-link href="/admin/'+kind+'?page='+(n-1)+'">Previous</a>':'')+
    '<span>Page '+(n+1)+' of '+Math.max(1,total)+'</span>'+
    (n+1<total?'<a data-link href="/admin/'+kind+'?page='+(n+1)+'">Next</a>':'')+
    '</div></nav>';
};
const validPage=data => data&&Array.isArray(data.content)&&Number.isInteger(data.page)&&
  Number.isInteger(data.totalPages)&&Number.isInteger(data.totalElements)&&data.page>=0;

// Admin Challenges mirrors the approved two-column operations workspace.
// Every number, challenge and camel comes from a backend response, never a mock.
const challengeDateLabel = value => {
 const d=value?new Date(value):null;
 return d&&!Number.isNaN(d.getTime())?
   new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Muscat',day:'2-digit',month:'short',
     year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d):'—';
};
const challengeTimeLabel = value => {
 const d=value?new Date(value):null;
 return d&&!Number.isNaN(d.getTime())?
   new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Muscat',hour:'2-digit',minute:'2-digit',
     hourCycle:'h23'}).format(d):'—';
};
const challengeIcon = name => {
 const paths={
  list:'<path d="M9 6h12M9 12h12M9 18h12"/><path d="M4 6h1M4 12h1M4 18h1"/>',
  play:'<path d="m8 5 11 7-11 7z"/>',
  draft:'<path d="M7 3h7l5 5v13H7zM14 3v6h5M10 14h6m-6 4h6"/>',
  votes:'<path d="M5 19v-7m7 7V5m7 14v-9"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>'
 };
 return '<svg viewBox="0 0 24 24" aria-hidden="true" width="23" height="23" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+(paths[name]||paths.info)+'</svg>';
};
const challengePhoto = camel => {
 const raw=typeof camel?.photoUrl==='string'?camel.photoUrl.trim():'';
 const safe=/^https?:\/\//i.test(raw)||/^\/(?!\/)/.test(raw)?raw:'';
 return safe?'<img src="'+esc(safe)+'" alt="'+esc(camel.name||'Camel')+'" loading="lazy" decoding="async">':
  '<div class="mhch-photo-placeholder"><img src="/assets/medhmar-logo-icon.svg" alt="" loading="lazy"><span>Photo unavailable</span></div>';
};
const challengeSteps = () => '<ol class="mhch-steps" aria-label="Challenge creation steps">'+
 ['Details','Camels','Publish'].map((label,i)=>'<li'+(i===0?' class="is-active" aria-current="step"':'')+
 '><span>'+(i+1)+'</span><strong>'+label+'</strong></li>').join('')+'</ol>';
const challengePager = page => {
 const current=page.page, last=page.totalPages;
 return '<nav class="mhch-pager" aria-label="Challenges pagination"><span>Showing '+
  int(page.content.length)+' of '+int(page.totalElements)+' challenges</span><div>'+
  (current>0?'<a href="/admin/challenges?page='+(current-1)+'" data-link aria-label="Previous page">‹</a>':
    '<span class="is-disabled" aria-hidden="true">‹</span>')+
  '<span class="is-current" aria-current="page">'+(current+1)+'</span>'+
  (current+1<last?'<a href="/admin/challenges?page='+(current+1)+'" data-link aria-label="Next page">›</a>':
    '<span class="is-disabled" aria-hidden="true">›</span>')+'</div></nav>';
};
const challengeCard = c => {
 const cams=Array.isArray(c.camels)?c.camels:[],id=c.challengeId,draft=c.status==='DRAFT',open=c.status==='OPEN';
 const search=[c.title,id,c.creatorId,...cams.map(cam=>cam.name||'')].join(' ').toLocaleLowerCase();
 const photoCards=Array.from({length:2},(_,i)=>{
   const camel=cams[i];
   if(!camel)return '<div class="mhch-camel mhch-camel-missing"><div class="mhch-camel-picture">'+
    '<div class="mhch-photo-placeholder"><img src="/assets/medhmar-logo-icon.svg" alt="" loading="lazy"><span>Awaiting camel</span></div></div>'+
    '<div class="mhch-camel-caption"><strong>Not assigned</strong><span>Attach a registered camel</span></div></div>';
   return '<div class="mhch-camel"><div class="mhch-camel-picture">'+challengePhoto(camel)+'</div>'+
    '<div class="mhch-camel-caption"><strong>'+esc(camel.name||'Unnamed camel')+'</strong><span>Camel #'+esc(camel.camelId)+'</span></div></div>';
 }).join('');
 const stage=draft?'Draft':open?'Voting open':'Closed', tone=draft?'draft':open?'open':'closed';
 const timingText=open?'Voting closes '+challengeDateLabel(c.closesAt)+' (Muscat GMT+4).':
   draft?'Draft — assign exactly two camels before publishing.':'Voting is closed for this challenge.';
 return '<article class="mhch-card admin-challenge-card" data-challenge-status="'+esc(c.status)+
  '" data-challenge-search="'+esc(search)+'">'+
  '<div class="mhch-card-heading"><div><span class="mhch-card-overline">CHALLENGE #'+esc(id)+
   ' · USER #'+esc(c.creatorId??'—')+'</span><h3>'+esc(c.title||'Untitled challenge')+'</h3></div>'+
   '<span class="mhch-status mhch-status-'+tone+'"><span aria-hidden="true"></span>'+stage+'</span></div>'+
  '<div class="mhch-duo" aria-label="Challenge camel pair">'+photoCards+
   (cams.length===2?'<span class="mhch-vs" aria-hidden="true">VS</span>':'')+'</div>'+
  '<dl class="mhch-card-stats">'+
    '<div>'+challengeIcon('calendar')+'<span><dt>Opens</dt><dd>'+esc(challengeDateLabel(c.opensAt))+'</dd><small>Muscat (GMT+4)</small></span></div>'+
    '<div>'+challengeIcon('calendar')+'<span><dt>Closes</dt><dd>'+esc(challengeDateLabel(c.closesAt))+'</dd><small>Muscat (GMT+4)</small></span></div>'+
    '<div>'+challengeIcon('votes')+'<span><dt>Total votes</dt><dd>'+int(c.totalVotes)+'</dd></span></div>'+
  '</dl><div class="mhch-card-footer"><p>'+challengeIcon('clock')+esc(timingText)+'</p><div class="mhch-card-actions">'+
  '<details class="mhch-details"><summary>View details</summary><div class="mhch-details-content">'+
    '<p><strong>Challenge #'+esc(id)+'</strong> · '+esc(stage)+' · '+int(c.totalVotes)+' recorded votes</p>'+
    (cams.length?'<ul>'+cams.map(cam=>'<li>'+esc(cam.name||'Camel')+' (#'+esc(cam.camelId)+') · '+
      int(cam.voteCount)+' votes'+(Number.isFinite(Number(cam.votePercent))?' · '+
      esc(Number(cam.votePercent).toFixed(1))+'%':'')+'</li>').join('')+'</ul>':
      '<p>No camels assigned.</p>')+
    '</div></details>'+
  (open?'<button type="button" class="mhch-outline-danger" data-admin-challenge-action="close" data-challenge-id="'+esc(id)+'">Close voting</button>':'')+
  '</div></div>'+
  (draft?'<div class="mhch-draft-tools"><details class="admin-module-edit"><summary>Edit draft details</summary>'+
    '<form data-admin-challenge-edit="'+esc(id)+'" class="admin-module-form">'+
    '<label>Title<input name="title" maxlength="200" required value="'+esc(c.title||'')+'"></label>'+
    '<label>Opens (Muscat)<input name="opensAt" type="datetime-local" required value="'+esc(localDate(c.opensAt))+'"></label>'+
    '<label>Closes (Muscat)<input name="closesAt" type="datetime-local" required value="'+esc(localDate(c.closesAt))+'"></label>'+
    '<p class="admin-module-form-error" role="alert" hidden></p><button type="submit" class="admin-module-button">Save draft</button></form></details>'+
    '<form data-admin-challenge-camel="'+esc(id)+'" class="admin-module-camel-form">'+
    '<label>Attach camel ID<input name="camelId" type="number" min="1" step="1" required placeholder="Registered camel ID"></label>'+
    '<p class="admin-module-form-error" role="alert" hidden></p><button type="submit" class="admin-module-outline"'+
    (cams.length>=2?' disabled':'')+'>Attach camel</button></form>'+
    '<button type="button" class="admin-module-button" data-admin-challenge-action="open" data-challenge-id="'+esc(id)+'"'+
    (cams.length!==2?' disabled title="Assign exactly two camels first"':'')+'>Publish & open voting</button></div>':'')+
  '<p class="admin-module-form-error admin-module-item-error" role="alert" hidden></p></article>';
};
export function adminChallengesView({data=null,error=''}={}) {
 const head='<header class="mhch-heading mhch-challenges-hero" aria-labelledby="admin-challenges-title"><div class="mhch-hero-copy"><span class="mhch-hero-eyebrow">CHALLENGE MANAGEMENT</span><h1 id="admin-challenges-title">Challenges</h1><p>Create challenges, pair camels, and manage public voting.</p></div><img class="mhch-hero-art" src="/assets/admin-challenges-racing.svg" alt="" aria-hidden="true" width="1472" height="410"></header>';
 if(error||!validPage(data))return '<div class="mhch-page">'+head+
   message('Challenges unavailable',error||'Unexpected response from the server.')+'</div>';
 const list=data.content,counts={OPEN:0,DRAFT:0,CLOSED:0},totalVotes=list.reduce((sum,c)=>{
   if(Object.hasOwn(counts,c.status))counts[c.status]++;
   return sum+(Number.isSafeInteger(c.totalVotes)&&c.totalVotes>=0?c.totalVotes:0);
 },0);
 const paginated=data.totalElements>list.length;
 const metricItems=[
  {name:'Total challenges',value:data.totalElements,icon:'list',tone:'brown'},
  {name:paginated?'Open (this page)':'Open for voting',value:counts.OPEN,icon:'play',tone:'green'},
  {name:paginated?'Drafts (this page)':'Drafts',value:counts.DRAFT,icon:'draft',tone:'brown'},
  {name:paginated?'Votes (this page)':'Total votes',value:totalVotes,icon:'votes',tone:'brown'}
 ];
 const metrics='<section class="mhch-metrics" aria-label="Challenge metrics">'+metricItems.map(m=>
  '<div class="mhch-metric"><div class="mhch-metric-icon mhch-metric-'+m.tone+'">'+challengeIcon(m.icon)+
  '</div><div><span>'+esc(m.name)+'</span><strong>'+int(m.value)+'</strong></div></div>').join('')+'</section>';
 const tabs=[['ALL','All',list.length],['OPEN','Open',counts.OPEN],['DRAFT','Drafts',counts.DRAFT],['CLOSED','Closed',counts.CLOSED]];
 const tabBar='<div class="mhch-list-tools"><div class="mhch-tabs" role="tablist" aria-label="Challenge status">'+
  tabs.map(([value,label,count],i)=>'<button type="button" role="tab" data-admin-challenge-filter="'+value+
   '" aria-selected="'+(i===0)+'" tabindex="'+(i===0?0:-1)+'">'+label+' <span>'+int(count)+'</span></button>').join('')+
  '</div><label class="mhch-search">'+challengeIcon('search')+
  '<input id="admin-challenge-search" type="search" placeholder="Search challenges..." aria-label="Search challenges on this page" autocomplete="off"></label></div>';
 const left='<section class="mhch-directory" aria-label="Challenge directory">'+tabBar+
   (list.length?'<div class="mhch-list">'+list.map(challengeCard).join('')+'</div>':
     '<div class="mhch-empty">No challenges yet. Create your first challenge using the form.</div>')+
   '<p class="mhch-no-match" id="admin-challenge-no-match" hidden>No challenges match your search or status filter on this page.</p>'+
   challengePager(data)+'</section>';
 const form='<aside class="mhch-new" aria-labelledby="mhch-new-title"><h2 id="mhch-new-title">New challenge</h2>'+
  '<p class="mhch-new-subtitle">Start with the challenge details.</p>'+challengeSteps()+
  '<form id="admin-challenge-create" class="mhch-form" aria-label="Create challenge">'+
  '<label>Challenge title<input type="text" name="title" maxlength="200" required placeholder="e.g. Weekend Desert Challenge"></label>'+
  '<fieldset><legend>Opens</legend><div class="mhch-datetime">'+
   '<label><span class="mhch-sr">Opening date</span><input type="date" name="opensDate" aria-label="Opening date" required></label>'+
   '<label><span class="mhch-sr">Opening time</span><input type="time" name="opensTime" value="09:30" aria-label="Opening time" required></label>'+
  '</div></fieldset>'+
  '<fieldset><legend>Closes</legend><div class="mhch-datetime">'+
   '<label><span class="mhch-sr">Closing date</span><input type="date" name="closesDate" aria-label="Closing date" required></label>'+
   '<label><span class="mhch-sr">Closing time</span><input type="time" name="closesTime" value="09:30" aria-label="Closing time" required></label>'+
  '</div></fieldset>'+
  '<p class="mhch-timezone-note">All times are in Muscat (GMT+4).</p>'+
  '<p class="admin-module-form-error" role="alert" hidden></p>'+
  '<button type="submit" class="mhch-save">Save draft</button></form>'+
  '<div class="mhch-next">'+challengeIcon('info')+'<p>Next: add exactly two registered camels, then publish.</p></div></aside>';
 return '<div class="mhch-page">'+head+metrics+'<div class="mhch-layout">'+left+form+'</div>'+
  (paginated?'<p class="mhch-page-note">Status counts, vote totals and filters below reflect the current page of API results.</p>':'')+
  '</div>';
}
const organizationForm = (o=null) =>
  '<label>Organization name<input name="name" required maxlength="180" value="'+esc(o?.name||'')+'"></label>'+
  '<label>Region<input name="region" required maxlength="120" value="'+esc(o?.region||'')+'"></label>'+
  '<label>Contact email<input name="contactEmail" type="email" required maxlength="254" value="'+esc(o?.contactEmail||'')+'"></label>'+
  '<label class="admin-module-full">Description<textarea name="description" maxlength="2000" rows="2">'+esc(o?.description||'')+'</textarea></label>'+
  (o?'<label>Status<select name="status"><option value="ACTIVE"'+(o.status==='ACTIVE'?' selected':'')+'>Active</option>'+
    '<option value="INACTIVE"'+(o.status==='INACTIVE'?' selected':'')+'>Inactive</option></select></label>':'');
export function adminOrganizationsView({data=null,error=''}={}) {
 const ready=!error&&validPage(data);
 const intro='<header class="admin-org-hero" aria-labelledby="admin-organizations-title"><div class="admin-org-hero-copy"><span class="admin-org-eyebrow">ORGANIZATION OPERATIONS</span><h1 id="admin-organizations-title">Organizations</h1><p>Manage regional organizers, contact details and organization status.</p></div><span class="admin-org-live'+(ready?'':' is-unavailable')+'">'+(ready?'Live data':'Data unavailable')+'</span><img class="admin-org-hero-art" src="/assets/admin-organizations-racing.svg" alt="" aria-hidden="true" width="1392" height="605"></header>';
 if(!ready)return intro+message('Organizations unavailable',error||'Unexpected response from the server.');
 const list=data.content;
 const cards=list.map(o=>'<article class="admin-module-item"><div class="admin-module-item-top"><div>'+
   '<span class="admin-module-id">Organization #'+esc(o.organizationId)+'</span><h3>'+esc(o.name)+'</h3></div>'+status(o.status)+'</div>'+
   '<dl class="admin-module-facts"><div><dt>Region</dt><dd>'+esc(o.region||'—')+'</dd></div>'+
   '<div><dt>Contact</dt><dd>'+esc(o.contactEmail||'—')+'</dd></div>'+
   '<div><dt>Created</dt><dd>'+esc(dateLabel(o.createdAt))+'</dd></div></dl>'+
   (o.description?'<p class="admin-module-subtitle">'+esc(o.description)+'</p>':'')+
   '<details class="admin-module-edit"><summary>Edit organization & status</summary>'+
   '<form data-admin-organization-edit="'+esc(o.organizationId)+'" data-original-status="'+esc(o.status)+'" class="admin-module-form">'+
   organizationForm(o)+'<p class="admin-module-form-error" role="alert" hidden></p>'+
   '<button class="admin-module-button" type="submit">Save organization</button></form></details></article>').join('');
 return intro+'<section class="admin-module-panel"><div class="admin-module-panel-top"><h2>Organization directory</h2><span>'+
   int(data.totalElements)+' organizations</span></div><details class="admin-module-create"><summary>+ Add organization</summary>'+
   '<form id="admin-organization-create" class="admin-module-form">'+organizationForm()+
   '<p class="admin-module-form-error" role="alert" hidden></p><button type="submit" class="admin-module-button">Create organization</button></form>'+
   '<p class="admin-module-hint">New organizations start as Active. The creator becomes an organization organizer.</p></details>'+
   (list.length?'<div class="admin-module-list">'+cards+'</div>':'<div class="admin-module-empty">No organizations registered yet.</div>')+
   pagination('organizations',data)+'</section>';
}
const timestamps=form=>{
 const fields=form.elements;
 const hasSplit=Boolean(fields.opensDate&&fields.opensTime&&fields.closesDate&&fields.closesTime);
 const opening=hasSplit?fields.opensDate.value+'T'+fields.opensTime.value:fields.opensAt.value;
 const closing=hasSplit?fields.closesDate.value+'T'+fields.closesTime.value:fields.closesAt.value;
 const parse=value=>new Date(value+'+04:00');
 const opens=parse(opening),closes=parse(closing);
 if(!opening||!closing||Number.isNaN(opens.getTime())||Number.isNaN(closes.getTime())||closes<=opens)
   throw new Error('Closing date must be after opening date.');
 const title=fields.title.value.trim();
 if(!title)throw new Error('Challenge title is required.');
 return {title,opensAt:opens.toISOString(),closesAt:closes.toISOString()};
};
export function bindAdminModules(root,actions={}) {
 const search=root.querySelector('#admin-challenge-search');
 const tabs=Array.from(root.querySelectorAll('[data-admin-challenge-filter]'));
 let active='ALL';
 const applyFilters=()=>{
  if(!tabs.length)return;
  const query=(search?.value||'').trim().toLocaleLowerCase();
  let count=0;
  const cards=root.querySelectorAll('.admin-challenge-card');
  cards.forEach(card=>{
   const visible=(!query||card.dataset.challengeSearch.includes(query))&&
     (active==='ALL'||card.dataset.challengeStatus===active);
   card.hidden=!visible;
   if(visible)count++;
  });
  const noMatch=root.querySelector('#admin-challenge-no-match');
  if(noMatch)noMatch.hidden=count!==0||cards.length===0;
 };
 search?.addEventListener('input',applyFilters);
 const activate=(tab,focus=false)=>{
  active=tab.dataset.adminChallengeFilter;
  tabs.forEach(item=>{
   const selected=item===tab;
   item.setAttribute('aria-selected',String(selected));
   item.tabIndex=selected?0:-1;
  });
  if(focus)tab.focus();
  applyFilters();
 };
 tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>activate(tab));
  tab.addEventListener('keydown',event=>{
   let to;
   if(event.key==='ArrowRight')to=(index+1)%tabs.length;
   else if(event.key==='ArrowLeft')to=(index-1+tabs.length)%tabs.length;
   else if(event.key==='Home')to=0;
   else if(event.key==='End')to=tabs.length-1;
   else return;
   event.preventDefault();activate(tabs[to],true);
  });
 });
 const run=async(form,callback)=>{
  const button=form.querySelector('[type="submit"]'), feedback=form.querySelector('.admin-module-form-error');
  if(button?.disabled)return;
  if(feedback){feedback.hidden=true;feedback.textContent='';}
  if(button)button.disabled=true;
  try {await callback();}
  catch(error) {if(feedback){feedback.textContent=error?.message||'Request failed.';feedback.hidden=false;}}
  finally {if(button?.isConnected)button.disabled=false;}
 };
 root.querySelector('#admin-challenge-create')?.addEventListener('submit',e=>{
  e.preventDefault();run(e.currentTarget,()=>actions.createChallenge(timestamps(e.currentTarget)));
 });
 root.querySelectorAll('[data-admin-challenge-edit]').forEach(form=>form.addEventListener('submit',e=>{
  e.preventDefault();run(form,()=>actions.updateChallenge(form.dataset.adminChallengeEdit,timestamps(form)));
 }));
 root.querySelectorAll('[data-admin-challenge-camel]').forEach(form=>form.addEventListener('submit',e=>{
  e.preventDefault();run(form,()=>actions.addCamel(form.dataset.adminChallengeCamel,Number(form.elements.camelId.value)));
 }));
 root.querySelectorAll('[data-admin-challenge-action]').forEach(button=>button.addEventListener('click',async()=>{
  if(button.disabled)return;
  const type=button.dataset.adminChallengeAction,id=button.dataset.challengeId;
  if(!globalThis.confirm((type==='open'?'Publish this challenge and start voting when its opening time arrives?':'Close voting for this challenge?')))return;
  button.disabled=true;
  try {await actions.transitionChallenge(type,id);}
  catch(error) {const p=button.closest('.admin-module-item').querySelector('.admin-module-item-error');p.textContent=error?.message||'Request failed.';p.hidden=false;}
  finally {if(button.isConnected)button.disabled=false;}
 }));
 root.querySelector('#admin-organization-create')?.addEventListener('submit',e=>{
  e.preventDefault();const form=e.currentTarget;
  run(form,()=>actions.createOrganization(Object.fromEntries(new FormData(form))));
 });
 root.querySelectorAll('[data-admin-organization-edit]').forEach(form=>form.addEventListener('submit',e=>{
  e.preventDefault();const fields=Object.fromEntries(new FormData(form));
  if(fields.status!==form.dataset.originalStatus&&fields.status==='INACTIVE'&&
      !globalThis.confirm('Set this organization to Inactive?'))return;
  run(form,()=>actions.updateOrganization(form.dataset.adminOrganizationEdit,fields));
 }));
 root.querySelector('[data-admin-module-retry]')?.addEventListener('click',()=>actions.refresh());
}
