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
  const local=new Date(d.getTime()-d.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
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

export function adminChallengesView({data=null,error='' }={}) {
 const intro=hero('CHALLENGE OPERATIONS','Challenges','Create drafts, assign two camels, and control public voting.','Live data');
 if(error||!validPage(data))return intro+message('Challenges unavailable',error||'Unexpected response from the server.');
 const list=data.content;
 const cards=list.map(c=>{
  const id=c.challengeId, draft=c.status==='DRAFT', open=c.status==='OPEN', cams=Array.isArray(c.camels)?c.camels:[];
  return '<article class="admin-module-item"><div class="admin-module-item-top"><div><span class="admin-module-id">Challenge #'+esc(id)+'</span><h3>'+esc(c.title||'Untitled challenge')+
   '</h3></div>'+status(c.status)+'</div><dl class="admin-module-facts">'+
   '<div><dt>Creator</dt><dd>#'+esc(c.creatorId??'—')+'</dd></div>'+
   '<div><dt>Opens</dt><dd>'+esc(dateLabel(c.opensAt))+'</dd></div>'+
   '<div><dt>Closes</dt><dd>'+esc(dateLabel(c.closesAt))+'</dd></div>'+
   '<div><dt>Votes</dt><dd>'+int(c.totalVotes)+'</dd></div></dl>'+
   '<p class="admin-module-subtitle"><strong>Participating camels:</strong> '+(cams.length?cams.map(m=>esc(m.name||'Camel')+' (#'+esc(m.camelId)+')').join(' · '):'No camels assigned yet')+'</p>'+
   (draft?'<details class="admin-module-edit"><summary>Edit draft</summary><form data-admin-challenge-edit="'+esc(id)+'" class="admin-module-form">'+
       '<label>Title<input name="title" maxlength="200" required value="'+esc(c.title||'')+'"></label>'+
       '<label>Opens (local time)<input name="opensAt" type="datetime-local" required value="'+esc(localDate(c.opensAt))+'"></label>'+
       '<label>Closes (local time)<input name="closesAt" type="datetime-local" required value="'+esc(localDate(c.closesAt))+'"></label>'+
       '<p class="admin-module-form-error" role="alert" hidden></p><button type="submit" class="admin-module-button">Save draft</button></form></details>'+
     '<form data-admin-challenge-camel="'+esc(id)+'" class="admin-module-camel-form">'+
       '<label>Attach camel ID<input name="camelId" type="number" required min="1" step="1" placeholder="Registered camel ID"></label>'+
       '<p class="admin-module-form-error" role="alert" hidden></p><button class="admin-module-outline" type="submit"'+(cams.length>=2?' disabled':'')+'>Attach camel</button></form>':'')+
   '<div class="admin-module-item-actions">'+
    (draft?'<button type="button" class="admin-module-button" data-admin-challenge-action="open" data-challenge-id="'+esc(id)+'"'+(cams.length!==2?' disabled title="Assign exactly two camels first"':'')+'>Publish & open voting</button>':'')+
    (open?'<button type="button" class="admin-module-outline" data-admin-challenge-action="close" data-challenge-id="'+esc(id)+'">Close voting</button>':'')+
    '</div><p class="admin-module-form-error admin-module-item-error" role="alert" hidden></p></article>';
 }).join('');
 return intro+'<section class="admin-module-panel"><div class="admin-module-panel-top"><h2>Challenge directory</h2><span>'+
   int(data.totalElements)+' challenges including drafts</span></div>'+
   '<details class="admin-module-create"><summary>+ Create challenge</summary>'+
   '<form id="admin-challenge-create" class="admin-module-form"><label>Challenge title<input name="title" maxlength="200" required placeholder="Challenge name"></label>'+
   '<label>Opens (local time)<input type="datetime-local" name="opensAt" required></label>'+
   '<label>Closes (local time)<input type="datetime-local" name="closesAt" required></label>'+
   '<p class="admin-module-form-error" role="alert" hidden></p><button type="submit" class="admin-module-button">Save draft</button></form>'+
   '<p class="admin-module-hint">After saving, attach exactly two registered camels, then publish.</p></details>'+
   (list.length?'<div class="admin-module-list">'+cards+'</div>':'<div class="admin-module-empty">No challenges yet. Create the first draft above.</div>')+
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
 const opens=new Date(form.elements.opensAt.value),closes=new Date(form.elements.closesAt.value);
 if(Number.isNaN(opens.getTime())||Number.isNaN(closes.getTime())||closes<=opens)
   throw new Error('Closing date must be after opening date.');
 return {title:form.elements.title.value.trim(),opensAt:opens.toISOString(),closesAt:closes.toISOString()};
};
export function bindAdminModules(root,actions={}) {
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
