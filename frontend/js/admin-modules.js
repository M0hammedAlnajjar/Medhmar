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
const hero = (eyebrow,title,sub,notice) => '<header class="admin-module-hero"><div><span class="admin-module-eyebrow">'+esc(eyebrow)+
  '</span><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div><span class="admin-module-pill">'+esc(notice)+'</span></header>';
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

// Challenge administration follows the persisted lifecycle: details, two camels, publish.
const challengeDateLabel = value => {
  const d=value?new Date(value):null;
  return d&&!Number.isNaN(d.getTime())
    ? new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Muscat',day:'2-digit',month:'short',
      year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(d)+' (Muscat)'
    : '—';
};
const challengeSteps = (current,completed=false) =>
  '<ol class="admin-challenge-steps" aria-label="Challenge publishing steps">'+
  ['Details','Camels','Publish'].map((label,i)=>{
    const step=i+1,kind=completed||step<current?'complete':step===current?'current':'pending';
    return '<li class="admin-challenge-step is-'+kind+'"'+(step===current&&!completed?' aria-current="step"':'')+
      '><span class="admin-challenge-step-number">'+step+'</span><span>'+label+'</span></li>';
  }).join('')+'</ol>';
const camelPhoto = camel => {
  const raw=typeof camel.photoUrl==='string'?camel.photoUrl.trim():'';
  // Only render normal web/absolute-root URLs, never untrusted schemes or protocol-relative URLs.
  const safe=/^https?:\/\//i.test(raw)||/^\/(?!\/)/.test(raw)?raw:'';
  return '<div class="admin-challenge-portrait">'+
    (safe?'<img src="'+esc(safe)+'" alt="'+esc(camel.name||'Camel')+'" loading="lazy" decoding="async">':
      '<div class="admin-challenge-photo-empty"><img src="/assets/medhmar-logo-icon.svg" alt="" loading="lazy"><span>No photo available</span></div>')+
    '</div>';
};
export function adminChallengesView({data=null,error=''}={}) {
 const intro='<header class="admin-module-hero admin-challenge-hero"><div><span class="admin-module-eyebrow">MEDHMAR · CHALLENGE OPERATIONS</span>'+
   '<h1>Challenge management</h1><p>Create, manage and publish real camel challenges, all in one place.</p>'+
   '<span class="admin-challenge-hero-caption">Live backend data · Oman time (UTC+04:00)</span></div>'+
   '<div class="admin-challenge-hero-mark" aria-hidden="true"><img src="/assets/medhmar-admin-logo-compact.webp" alt=""></div></header>';
 if(error||!validPage(data))return intro+message('Challenges unavailable',error||'Unexpected response from the server.');
 const list=data.content;
 const cards=list.map(c=>{
  const id=c.challengeId,draft=c.status==='DRAFT',open=c.status==='OPEN',
    cams=Array.isArray(c.camels)?c.camels:[],current=draft?(cams.length===2?3:2):3;
  const search=[c.title,id,...cams.map(cam=>cam.name||'')].join(' ').toLocaleLowerCase();
  const portraits=cams.length?cams.map((camel,i)=>
    '<div class="admin-challenge-contender">'+camelPhoto(camel)+
    '<div class="admin-challenge-contender-info"><strong>'+esc(camel.name||'Unnamed camel')+'</strong>'+
    '<span>Camel #'+esc(camel.camelId)+'</span>'+
    (draft?'':'<small>'+int(camel.voteCount)+' votes'+
      (Number.isFinite(Number(camel.votePercent))?' · '+esc(Number(camel.votePercent).toFixed(1))+'%':'')+'</small>')+
    '</div></div>').join(''):'<div class="admin-challenge-contender-empty">No camels assigned. Attach two registered camels to continue.</div>';
  return '<article class="admin-module-item admin-challenge-card" data-challenge-status="'+esc(c.status)+
   '" data-challenge-search="'+esc(search)+'">'+
   '<div class="admin-module-item-top"><div><span class="admin-module-id">CHALLENGE #'+esc(id)+'</span>'+
   '<h3>'+esc(c.title||'Untitled challenge')+'</h3></div>'+status(c.status)+'</div>'+
   challengeSteps(current,!draft)+
   '<div class="admin-challenge-content"><div class="admin-challenge-camels" aria-label="Participating camels">'+portraits+'</div>'+
   '<dl class="admin-module-facts admin-challenge-facts">'+
   '<div><dt>Opens · Muscat</dt><dd>'+esc(challengeDateLabel(c.opensAt))+'</dd></div>'+
   '<div><dt>Closes · Muscat</dt><dd>'+esc(challengeDateLabel(c.closesAt))+'</dd></div>'+
   '<div><dt>Votes recorded</dt><dd>'+int(c.totalVotes)+'</dd></div>'+
   '<div><dt>Created by</dt><dd>Account #'+esc(c.creatorId??'—')+'</dd></div></dl></div>'+
   (draft?'<details class="admin-module-edit"><summary>Edit draft details</summary>'+
     '<form data-admin-challenge-edit="'+esc(id)+'" class="admin-module-form">'+
     '<label>Title<input name="title" maxlength="200" required value="'+esc(c.title||'')+'"></label>'+
     '<label>Opens · Muscat time<input name="opensAt" type="datetime-local" required value="'+esc(localDate(c.opensAt))+'"></label>'+
     '<label>Closes · Muscat time<input name="closesAt" type="datetime-local" required value="'+esc(localDate(c.closesAt))+'"></label>'+
     '<p class="admin-module-form-error" role="alert" hidden></p><button type="submit" class="admin-module-button">Save draft</button></form></details>'+
     '<form data-admin-challenge-camel="'+esc(id)+'" class="admin-module-camel-form">'+
       '<label>Attach camel ID<input name="camelId" type="number" required min="1" step="1" placeholder="Registered camel ID"></label>'+
       '<p class="admin-module-form-error" role="alert" hidden></p><button class="admin-module-outline" type="submit"'+
       (cams.length>=2?' disabled':'')+'>Attach camel</button></form>':'')+
   '<div class="admin-module-item-actions">'+
    (draft?'<button type="button" class="admin-module-button" data-admin-challenge-action="open" data-challenge-id="'+esc(id)+'"'+
      (cams.length!==2?' disabled title="Assign exactly two camels first"':'')+'>Publish & open voting</button>':'')+
    (open?'<button type="button" class="admin-module-outline" data-admin-challenge-action="close" data-challenge-id="'+esc(id)+'">Close voting</button>':'')+
    '</div><p class="admin-module-form-error admin-module-item-error" role="alert" hidden></p></article>';
 }).join('');
 return intro+'<section class="admin-module-panel admin-challenge-panel">'+
   '<div class="admin-module-panel-top"><div><span class="admin-challenge-kicker">WORKSPACE</span><h2>Challenge directory</h2></div>'+
   '<span>'+int(data.totalElements)+' challenges including drafts</span></div>'+
   '<details class="admin-module-create admin-challenge-create"><summary>+ Create challenge</summary>'+
   '<div class="admin-challenge-create-intro"><strong>Start a new challenge</strong>'+
   '<p>Save the details first, attach exactly two registered camels, then publish from the draft card below.</p></div>'+
   challengeSteps(1)+
   '<form id="admin-challenge-create" class="admin-module-form">'+
   '<label>Challenge title<input name="title" maxlength="200" required placeholder="Challenge name"></label>'+
   '<label>Opens · Muscat time<input type="datetime-local" name="opensAt" required></label>'+
   '<label>Closes · Muscat time<input type="datetime-local" name="closesAt" required></label>'+
   '<p class="admin-module-form-error" role="alert" hidden></p><button type="submit" class="admin-module-button">Save draft</button></form>'+
   '<p class="admin-module-hint">All dates use Muscat time (UTC+04:00). No changes are public until you publish.</p></details>'+
   '<div class="admin-challenge-toolbar"><label>Search on this page<input id="admin-challenge-search" type="search" placeholder="Challenge name, camel or ID" autocomplete="off"></label>'+
   '<label>Status<select id="admin-challenge-status"><option value="ALL">All statuses</option><option value="DRAFT">Draft</option>'+
   '<option value="OPEN">Open</option><option value="CLOSED">Closed</option></select></label>'+
   '<span class="admin-challenge-visible" id="admin-challenge-visible" role="status" aria-live="polite">Showing '+int(list.length)+' of '+int(data.totalElements)+' challenges</span></div>'+
   (list.length?'<div class="admin-module-list admin-challenge-list">'+cards+'</div>':
     '<div class="admin-module-empty">No challenges yet. Create the first draft above.</div>')+
   '<p class="admin-challenge-no-match" id="admin-challenge-no-match" hidden>No challenges match these filters on this page.</p>'+
   '<p class="admin-challenge-page-hint">Search and status filters apply to this loaded page. Use pagination for other records.</p>'+
   pagination('challenges',data)+'</section>';
}
const organizationForm = (o=null) =>
  '<label>Organization name<input name="name" required maxlength="180" value="'+esc(o?.name||'')+'"></label>'+
  '<label>Region<input name="region" required maxlength="120" value="'+esc(o?.region||'')+'"></label>'+
  '<label>Contact email<input name="contactEmail" type="email" required maxlength="254" value="'+esc(o?.contactEmail||'')+'"></label>'+
  '<label class="admin-module-full">Description<textarea name="description" maxlength="2000" rows="2">'+esc(o?.description||'')+'</textarea></label>'+
  (o?'<label>Status<select name="status"><option value="ACTIVE"'+(o.status==='ACTIVE'?' selected':'')+'>Active</option>'+
    '<option value="INACTIVE"'+(o.status==='INACTIVE'?' selected':'')+'>Inactive</option></select></label>':'');
export function adminOrganizationsView({data=null,error=''}={}) {
 const intro=hero('ORGANIZATION OPERATIONS','Organizations','Manage regional organizers, contact details and organization status.','Live data');
 if(error||!validPage(data))return intro+message('Organizations unavailable',error||'Unexpected response from the server.');
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
 const muscat=value=>new Date(value+'+04:00');
 const opens=muscat(form.elements.opensAt.value),closes=muscat(form.elements.closesAt.value);
 if(Number.isNaN(opens.getTime())||Number.isNaN(closes.getTime())||closes<=opens)
   throw new Error('Closing date must be after opening date.');
 return {title:form.elements.title.value.trim(),opensAt:opens.toISOString(),closesAt:closes.toISOString()};
};
export function bindAdminModules(root,actions={}) {
 const search=root.querySelector('#admin-challenge-search'), filter=root.querySelector('#admin-challenge-status');
 const applyFilters=()=>{
  if(!search||!filter)return;
  const query=search.value.trim().toLocaleLowerCase();
  const cards=Array.from(root.querySelectorAll('.admin-challenge-card'));
  let visible=0;
  for(const card of cards){
   const matches=(!query||card.dataset.challengeSearch.includes(query))&&
     (filter.value==='ALL'||card.dataset.challengeStatus===filter.value);
   card.hidden=!matches;
   if(matches)visible++;
  }
  const count=root.querySelector('#admin-challenge-visible');
  if(count)count.textContent='Showing '+visible+' of '+cards.length+' on this page';
  const empty=root.querySelector('#admin-challenge-no-match');
  if(empty)empty.hidden=visible!==0||cards.length===0;
 };
 search?.addEventListener('input',applyFilters);
 filter?.addEventListener('change',applyFilters);
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
