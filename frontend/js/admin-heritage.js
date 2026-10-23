const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const dateTimeLocal = value => {
  if(!value)return '';
  const date=new Date(value);if(Number.isNaN(date.valueOf()))return '';
  return new Date(date.valueOf()+4*60*60*1000).toISOString().slice(0,16);
};
const orgOptions = (organizations, selected='') => `<option value="" ${selected==null||selected===''?'selected':''}>Platform-wide</option>`+organizations.map(org=>`<option value="${esc(org.organizationId)}" ${String(org.organizationId)===String(selected)?'selected':''}>${esc(org.name)} · #${esc(org.organizationId)}</option>`).join('');
const organizationField = (organizations,selected='') => `<label>Organization (optional)<select name="organizationId">${orgOptions(organizations,selected)}</select></label>`;
const eventFields = (organizations,event=null) => `${organizationField(organizations,event?.organizationId)}<label>Event name<input name="name" required maxlength="180" value="${esc(event?.name||'')}" placeholder="Visitor event name"></label><label>Type<input name="type" required maxlength="80" value="${esc(event?.type||'Visitor Experience')}" placeholder="Visitor Experience"></label><label>Location<input name="location" required maxlength="255" value="${esc(event?.location||'')}"></label><label>Starts · Muscat time<input name="startAt" type="datetime-local" required value="${dateTimeLocal(event?.startAt)}"></label><label>Ends · Muscat time<input name="endAt" type="datetime-local" required value="${dateTimeLocal(event?.endAt)}"></label><label class="admin-heritage-full">Description<textarea name="description" maxlength="2000" rows="3">${esc(event?.description||'')}</textarea></label>`;
const storyFields = (organizations,story=null) => `${organizationField(organizations,story?.organizationId)}<label>Story title<input name="title" required maxlength="180" value="${esc(story?.title||'')}" placeholder="Cultural story title"></label><label>Category<input name="category" required maxlength="100" value="${esc(story?.category||'Cultural Story')}" placeholder="Cultural Story"></label><label>Content type<input name="type" required maxlength="80" value="${esc(story?.type||'ARTICLE')}" placeholder="ARTICLE"></label><label class="admin-heritage-full">Story text<textarea name="description" required maxlength="5000" rows="5">${esc(story?.description||'')}</textarea></label><label class="admin-heritage-full">Related link<input name="contentUrl" type="url" required maxlength="2048" value="${esc(story?.contentUrl||'')}" placeholder="https://..."></label>`;
const errorBox = '<p class="admin-heritage-error" role="alert" hidden></p>';
function eventCard(event,organizations) {
  return `<article class="admin-heritage-card"><header><div><span>VISITOR EVENT · #${esc(event.eventId)}</span><h3>${esc(event.name)}</h3></div><span>${esc(event.organizationName||'Platform-wide')}</span></header><p>${esc(event.location)} · ${esc(event.startAt||'')}</p><p>${esc(event.description||'No description provided.')}</p><details><summary>Edit visitor event</summary><form class="admin-heritage-form" data-heritage-edit-event="${esc(event.eventId)}">${eventFields(organizations,event)}${errorBox}<button class="admin-heritage-submit" type="submit">Save event</button></form></details></article>`;
}
function storyCard(story,organizations) {
  return `<article class="admin-heritage-card"><header><div><span>CULTURAL STORY · #${esc(story.contentId)}</span><h3>${esc(story.title)}</h3></div><span class="admin-heritage-status">${esc(story.approvedStatus)}</span></header><p>${esc(story.organizationName||'Platform-wide')} · ${esc(story.category)}</p><p>${esc(story.description||'No story text provided.')}</p><details><summary>Edit cultural story</summary><form class="admin-heritage-form" data-heritage-edit-story="${esc(story.contentId)}">${storyFields(organizations,story)}${errorBox}<button class="admin-heritage-submit" type="submit">Save and publish story</button></form></details>${story.approvedStatus!=='APPROVED'?`<button class="admin-heritage-secondary" type="button" data-heritage-approve="${esc(story.contentId)}">Publish story</button>`:''}</article>`;
}
export function adminHeritageView({events=[],stories=[],organizations=[],error=''}={}) {
  const orgs=Array.isArray(organizations)?organizations:[];
  const intro='<header class="admin-heritage-hero" aria-labelledby="admin-heritage-title"><div class="admin-heritage-hero-copy"><span class="admin-heritage-eyebrow">CONTENT MANAGEMENT</span><h1 id="admin-heritage-title">Heritage</h1><p>Add and update cultural stories and visitor events shown on the public Heritage page.</p></div><img class="admin-heritage-art" src="/assets/admin-heritage-racing.svg" alt="" aria-hidden="true" width="1272" height="413"></header>';
  if(error)return intro+`<section class="admin-heritage-panel" role="alert"><h2>Heritage content unavailable</h2><p>${esc(error)}</p><button type="button" class="admin-heritage-submit" data-heritage-retry>Try again</button></section>`;

  const eventsList=Array.isArray(events)?events:[],storiesList=Array.isArray(stories)?stories:[];
  return intro+'<div class="admin-heritage-grid">'+
    '<section class="admin-heritage-panel"><div class="admin-heritage-heading"><div><span>VISITOR EXPERIENCES</span><h2>Visitor events</h2></div><span>'+eventsList.length+' events</span></div>'+
    '<details class="admin-heritage-create"><summary>+ Add visitor event</summary><form class="admin-heritage-form" data-heritage-create-event>'+eventFields(orgs)+errorBox+'<button class="admin-heritage-submit" type="submit">Create event</button></form></details>'+
    (eventsList.length?eventsList.map(event=>eventCard(event,orgs)).join(''):'<p class="admin-heritage-empty">No visitor events yet.</p>')+'</section>'+
    '<section class="admin-heritage-panel"><div class="admin-heritage-heading"><div><span>OMANI CULTURE</span><h2>Cultural stories</h2></div><span>'+storiesList.length+' stories</span></div>'+
    '<details class="admin-heritage-create"><summary>+ Add cultural story</summary><form class="admin-heritage-form" data-heritage-create-story>'+storyFields(orgs)+errorBox+'<button class="admin-heritage-submit" type="submit">Create and publish story</button></form></details>'+
    (storiesList.length?storiesList.map(story=>storyCard(story,orgs)).join(''):'<p class="admin-heritage-empty">No cultural stories yet.</p>')+'</section></div>';
}
const muscatInstant = value => {
  const date=new Date(value+'+04:00');
  if(Number.isNaN(date.valueOf()))throw new Error('Enter a valid Muscat date and time.');
  return date.toISOString();
};
const formValues = (form,kind) => {
  const values=Object.fromEntries(new FormData(form));
  if(kind==='event')return {...values,organizationId:values.organizationId?Number(values.organizationId):null,startAt:muscatInstant(values.startAt),endAt:muscatInstant(values.endAt),description:values.description.trim()||null};
  return {...values,organizationId:values.organizationId?Number(values.organizationId):null,title:values.title.trim(),type:values.type.trim(),category:values.category.trim(),contentUrl:values.contentUrl.trim(),description:values.description.trim()};
};
export function bindAdminHeritage(root,actions={}) {
  const submit=async(form,action)=>{
    const button=form.querySelector('[type="submit"]'),feedback=form.querySelector('.admin-heritage-error');
    if(button)button.disabled=true;if(feedback){feedback.hidden=true;feedback.textContent='';}
    try{await action(formValues(form,form.dataset.heritageCreateEvent!==undefined||form.dataset.heritageEditEvent!==undefined?'event':'story'));await actions.refresh();}
    catch(error){if(feedback){feedback.textContent=error?.message||'Request failed.';feedback.hidden=false;}if(button)button.disabled=false;}
  };
  root.querySelector('[data-heritage-create-event]')?.addEventListener('submit',event=>{event.preventDefault();submit(event.currentTarget,values=>actions.createEvent(values));});
  root.querySelector('[data-heritage-create-story]')?.addEventListener('submit',event=>{event.preventDefault();submit(event.currentTarget,values=>actions.createStory(values));});
  root.querySelectorAll('[data-heritage-edit-event]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();submit(form,values=>actions.updateEvent(form.dataset.heritageEditEvent,values));}));
  root.querySelectorAll('[data-heritage-edit-story]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();submit(form,values=>actions.updateStory(form.dataset.heritageEditStory,values));}));
  root.querySelectorAll('[data-heritage-approve]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;try{await actions.approveStory(button.dataset.heritageApprove);await actions.refresh();}catch(error){button.disabled=false;const p=document.createElement('p');p.className='admin-heritage-error';p.textContent=error?.message||'Could not publish story.';button.after(p);}}));
  root.querySelector('[data-heritage-retry]')?.addEventListener('click',()=>actions.refresh());
}
