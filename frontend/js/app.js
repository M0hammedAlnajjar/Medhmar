import { authView } from './auth-view.js';
import { matchRoute, normalizePath, canAccessRoute } from './routes.js';
import { demo } from './data.js';
import { authApi, challengeApi, adminApi, raceCardApi, trainingApi } from './api.js';

const $ = (s, el=document) => el.querySelector(s);
const root = $('#app');
const toastRoot = $('#toast-root');
const guestUser = { fullName: 'Guest', email: '', roles: [] };
let renderEpoch = 0;
const state = { adminUsers: null, adminPage: 0, user: guestUser, challenges: [], challengeDetail: null, challengeError: '', lang: localStorage.getItem('medhmar-lang') || 'en' };
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const badge = s => `<span class="badge ${['ACTIVE','OPEN','APPROVED','OFFICIAL'].includes(s)?'success':['PENDING','UPCOMING'].includes(s)?'warning':['SUSPENDED','REJECTED','CLOSED'].includes(s)?'danger':'neutral'}">${esc(s)}</span>`;
const go = p => { history.pushState({},'',p); render(); };
function toast(msg,type=''){ const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=msg; toastRoot.append(el); setTimeout(()=>el.remove(),3200); }

const navItems = [
  ['/home','Home'],['/challenges','Challenges'],['/training','Training'],['/organizations','Organizations'],
  ['/tourism','Heritage'],['/race-cards','Race Cards'],['/trainer-profile','Trainer'],['/admin','Admin']
];
const visibleNavItems = () => navItems.filter(([path]) => canAccessRoute(matchRoute(path)?.route, state.user));
function topbar(active=''){
  const signedIn = Boolean(state.user?.userId);
  const accountActions = signedIn
    ? `<a class="profile-btn" href="/settings" data-link><span class="avatar">${esc(state.user.fullName?.[0]||'U')}</span><span>${esc(state.user.fullName?.split(' ')[0]||'User')}</span></a>`
    : `<a class="profile-btn" href="/signin" data-link><span>Sign In</span></a><a class="profile-btn" href="/signup" data-link><span>Create Account</span></a>`;

  return `<header class="topbar"><div class="topbar-inner"><a class="brand" href="/" data-link><img src="/assets/mark.svg" alt=""><span>MEDHMAR</span></a>
  <nav class="nav">${visibleNavItems().map(([p,l])=>`<a href="${p}" data-link class="${active===p?'active':''}">${l}</a>`).join('')}</nav>
  <div class="nav-actions"><button class="lang-btn" id="lang-toggle">${state.lang==='en'?'EN | AR':'AR | EN'}</button>${accountActions}</div></div></header>`;
}
const head = (t,s,a='') => `<div class="page-head"><div><div class="kicker">MEDHMAR</div><h1>${t}</h1><p>${s}</p></div>${a?`<div class="actions">${a}</div>`:''}</div>`;
const shell = (body,active='') => `<div class="app-shell">${topbar(active)}<main class="main">${body}</main><footer>MEDHMAR • Mohammed frontend scope • Auth / Security / Integration / Pedigree / Challenges / Training Log / Admin / Platform</footer></div>`;
const demoNote = () => `<div class="demo-note">Connected screens use the Spring Boot API when available; preview data is shown when it is offline.</div>`;

function landing(){
 return `<div class="app-shell">${topbar()}<section class="hero"><div class="hero-inner"><div class="hero-kicker">Omani camel racing • digital platform</div><h1>Experience the Heritage of Camel Racing.</h1><p>Secure access, challenges, training records, organizations, cultural content and official digital race cards in one premium platform.</p><div class="actions"><a class="btn btn-primary" href="/home" data-link>Explore Medhmar</a><a class="btn btn-secondary" href="/signup" data-link>Create account</a></div></div></section><main class="main"><div class="section-title"><h2>Mohammed's Platform Modules</h2><span>Focused implementation only</span></div><div class="grid grid-4">${[['Secure accounts','Authentication, registration and password recovery.'],['Challenges & voting','Published camel challenges with protected voting.'],['Training records','Chronological trainer session logs.'],['Platform operations','Admin, organizations, tourism and race cards.']].map(([t,d])=>`<article class="card card-pad"><h3>${t}</h3><p class="form-help">${d}</p></article>`).join('')}</div></main></div>`;
}

const auth = authView;

function home(){ const firstName=state.user?.fullName?.trim().split(/\s+/)[0]||'Guest'; return shell(`${head(`Good morning, ${esc(firstName)} 👋`,'Welcome back to Medhmar. Your integration overview keeps your platform modules in one place.')}${demoNote()}<div class="stats">${[['Challenges','2','1 open'],['Training Logs','18','this month'],['Organizations','3','active'],['Race Cards','3','versions']].map(([a,b,c])=>`<div class="card stat"><div class="stat-label">${a}</div><div class="stat-value">${b}</div><div class="stat-note">${c}</div></div>`).join('')}</div><div class="grid grid-2"><section class="card card-pad"><div class="section-title"><h2>Quick access</h2></div><div class="grid grid-2">${visibleNavItems().filter(([path])=>path!=='/home').map(([p,l])=>`<a class="card card-pad" href="${p}" data-link><strong>${l}</strong><p class="form-help">Open module →</p></a>`).join('')}</div></section><section class="card card-pad"><div class="section-title"><h2>Platform activity</h2></div><div class="timeline"><div class="timeline-item"><h3>Challenge opened</h3><p>Desert Champions Challenge is accepting votes.</p></div><div class="timeline-item"><h3>Race card published</h3><p>Al Bashayer Camel Race v3 is now public.</p></div><div class="timeline-item"><h3>Profile secured</h3><p>Role-aware access is active for this session.</p></div></div></section></div>`,'/home'); }

function settings(){ return shell(`${head('Profile & Settings','Update your profile and preferred language.')}${demoNote()}<div class="two-pane"><section class="card profile-hero"><div class="profile-avatar">M</div><div><h1>${esc(state.user.fullName)}</h1><p>${esc(state.user.email)}</p><div class="actions">${state.user.roles.map(badge).join('')}</div></div></section><section class="card card-pad"><form id="settings-form" class="form"><div class="field"><label>Full Name</label><input class="input" name="fullName" value="${esc(state.user.fullName)}"></div><div class="field"><label>Preferred Language</label><select class="select" name="preferredLanguage"><option value="en">English</option><option value="ar">العربية</option></select></div><button class="btn btn-primary">Save Changes</button><button class="btn btn-secondary" type="button" id="logout-btn">Sign Out</button></form></section></div>`,'/settings'); }

function trainer(){ const t=demo.trainer; return shell(`${head('Trainer Profile','Professional profile integrated with the current platform.')}${demoNote()}<section class="card profile-hero"><div class="profile-avatar">S</div><div><h1>${t.name}</h1><p>Professional Camel Trainer • ${t.location}</p><div class="actions">${badge('ACTIVE')}<span class="badge neutral">★ ${t.rating}</span></div></div><div class="stats"><div class="stat"><div class="stat-value">${t.assigned}</div><div class="stat-label">Assigned Camels</div></div><div class="stat"><div class="stat-value">${t.years}</div><div class="stat-label">Years Experience</div></div></div></section><section class="card card-pad section"><h2>About</h2><p>${t.bio}</p></section>`,'/trainer-profile'); }

const challengeCard = c => `<article class="card challenge-card"><div class="section-title"><div><div class="kicker">Camel Challenge</div><h2>${esc(c.title)}</h2></div>${badge(c.status)}</div><div class="challenge-vs">${c.camels.map((x,i)=>`${i?'<div class="vs">VS</div>':''}<div class="camel-vote"><div class="camel-art"></div><h3>${esc(x.name)}</h3><strong>${x.votePercent}%</strong><div class="vote-bar"><span style="width:${Number(x.votePercent)||0}%"></span></div></div>`).join('')}</div><a class="btn btn-primary" href="/challenges/${c.challengeId}" data-link>View Challenge</a></article>`;
const votingOpen = c => c?.status === 'OPEN' && Date.now() >= new Date(c.opensAt).getTime() && Date.now() < new Date(c.closesAt).getTime();
function challenges(){
 const body = state.challengeError
   ? `<section class="card error"><h2>Unable to load live challenges</h2><p>${esc(state.challengeError)}</p></section>`
   : state.challenges.length
     ? `<div class="grid grid-2" id="challenges-grid">${state.challenges.map(challengeCard).join('')}</div>`
     : '<section class="card card-pad"><h2>No live challenges yet</h2><p>Create and open a challenge in the backend before voting.</p></section>';
 return shell(`${head('Camel Challenges','Live challenge data from the Spring Boot API.')}${body}`,'/challenges');
}
function challenge(id){
 const c = (state.challengeDetail && String(state.challengeDetail.challengeId)===String(id))
   ? state.challengeDetail
   : state.challenges.find(x=>String(x.challengeId)===String(id));
 if(!c) return shell(`${head('Challenge unavailable','This challenge could not be loaded from the backend.')}<section class="card error"><p>${esc(state.challengeError || 'No matching live challenge was found.')}</p><a class="btn btn-primary" href="/challenges" data-link>Back to Challenges</a></section>`,'/challenges');
 const signedIn = Boolean(state.user?.userId);
 const open = votingOpen(c);
 const voteMessage = !signedIn ? 'Sign in before voting.' : !open ? 'Voting is not open for this challenge.' : 'One vote per account. Votes cannot be switched after they are recorded.';
 return shell(`${head(esc(c.title),voteMessage,badge(c.status))}<article class="card challenge-card"><div class="challenge-vs">${c.camels.map((x,i)=>`${i?'<div class="vs">VS</div>':''}<div class="camel-vote"><div class="camel-art"></div><h2>${esc(x.name)}</h2><div class="stat-value">${x.votePercent}%</div><p>${x.voteCount} votes</p><div class="vote-bar"><span style="width:${Number(x.votePercent)||0}%"></span></div>${signedIn && open ? `<button class="btn btn-primary vote-btn" data-challenge="${c.challengeId}" data-camel="${x.camelId}">Vote ${esc(x.name)}</button>` : `<button class="btn btn-primary" disabled>${signedIn ? 'Voting unavailable' : 'Sign in to vote'}</button>`}</div>`).join('')}</div></article>`,'/challenges');
}

function training(){ return shell(`${head('Training Log','Chronological training history for an active assignment.','<button class="btn btn-primary" id="add-training-btn">+ Add Training Session</button>')}${demoNote()}<div class="two-pane"><section class="card card-pad"><h2>Barq — Training Log</h2><p class="form-help">Agreement #15 • Active training period</p><div class="timeline">${demo.logs.map(l=>`<div class="timeline-item"><h3>${l.type}</h3><p><strong>${l.date}</strong> • ${l.duration} minutes</p><p>${l.notes}</p></div>`).join('')}</div></section><aside class="card card-pad"><h2>Session rules</h2><div class="info-list"><div class="info-row"><span>Agreement</span><strong>ACTIVE</strong></div><div class="info-row"><span>Max duration</span><strong>720 min</strong></div><div class="info-row"><span>History</span><strong>Append-only</strong></div></div></aside></div>`,'/training'); }

function admin(page) {
 if(!canAccessRoute(matchRoute('/admin').route,state.user) || !Array.isArray(state.adminUsers)) return adminDenied();
 const rows=state.adminUsers.map(u=>`<tr><td><strong>${esc(u.fullName)}</strong></td><td>${esc(u.email)}</td><td>${(u.roles||[]).map(badge).join(' ')}</td><td>${badge(u.accountStatus)}</td><td><button class="small-btn manage-user" data-user="${esc(u.userId)}">Manage</button></td></tr>`).join('');
 return shell(`${head('Admin Dashboard','Manage registered users and account access.')}<p>${Number(page.totalElements)||0} registered users · Page ${Number(page.page)+1} of ${Math.max(1,Number(page.totalPages)||0)}</p><div class="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Roles</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No registered users found.</td></tr>'}</tbody></table></div><div class="actions section"><button class="btn btn-secondary admin-page" data-page="${Math.max(0,page.page-1)}" ${page.page<=0?'disabled':''}>Previous</button><button class="btn btn-secondary admin-page" data-page="${Number(page.page)+1}" ${page.page+1>=page.totalPages?'disabled':''}>Next</button></div>`,'/admin');
}
function adminDenied() {
 return shell('<section class="card permission"><div class="state-icon">403</div><h1>Access denied</h1><p>This page is available only to administrators.</p><a class="btn btn-primary" href="/home" data-link>Back to Home</a></section>');
}
function denyAdminAccess() {
 state.adminUsers=null;
 if(!state.user?.userId) {
  history.replaceState({},'', '/signin');root.innerHTML=auth('signin');
 } else root.innerHTML=adminDenied();
}

function pedigree(id){ const p=demo.pedigree; return shell(`${head('Pedigree','Camel profile pedigree section only — the core Camel CRUD remains outside Mohammed’s scope.')}<div class="card pedigree-wrap"><div class="pedigree"><div class="pedigree-row"><div class="pedigree-node"><div class="pedigree-label">Camel</div><div class="pedigree-name">${p.camel}</div></div></div><div class="pedigree-row parents"><div class="pedigree-node"><div class="pedigree-label">Sire</div><div class="pedigree-name">${p.sire}</div></div><div class="pedigree-node"><div class="pedigree-label">Dam</div><div class="pedigree-name">${p.dam}</div></div></div><div class="pedigree-row grands">${p.grands.map((x,i)=>`<div class="pedigree-node"><div class="pedigree-label">Grand ${i<2?'Sire/Dam':'Parent'}</div><div class="pedigree-name">${x}</div></div>`).join('')}</div></div></div>`,''); }

function organizations(){ return shell(`${head('Racing Organizations','Regional organizer groups and membership visibility.')}${demoNote()}<div class="grid grid-3">${demo.organizations.map(o=>`<article class="card org-card"><div class="org-top"><div class="org-logo">M</div><div><h3>${o.name}</h3><p class="form-help">${o.region}</p></div></div><div class="org-stats"><div class="org-stat"><strong>${o.members}</strong><span>Members</span></div><div class="org-stat"><strong>${o.races}</strong><span>Races</span></div><div class="org-stat"><strong>${o.status}</strong><span>Status</span></div></div></article>`).join('')}</div>`,'/organizations'); }
function tourism(){ return shell(`${head('Tourism & Cultural Content','Approved visitor and heritage content within the Medhmar platform.')}<section class="tourism-hero"><div><div class="hero-kicker">Experience the culture behind the race</div><h1>Discover Camel Racing Heritage</h1><p>Regional events, visitor information and approved cultural knowledge.</p></div></section><section class="section"><div class="grid grid-3">${demo.tourism.map(x=>`<article class="card card-pad"><div class="kicker">${x.type}</div><h3>${x.title}</h3><p>${x.location} • ${x.date}</p>${badge(x.status)}</article>`).join('')}</div></section>`,'/tourism'); }

const raceRows = () => `<table><thead><tr><th>No.</th><th>Camel</th><th>Owner</th><th>Trainer</th><th>Category</th></tr></thead><tbody>${[['01','Barq','Ahmed Al Balushi','Salim Al Rashidi','Racing'],['02','Shahin','Khalid Al Maamari','Nasser Al Hinai','Racing'],['03','Al Sahab','Mohammed Al Naqbi','Rashid Al Kindi','Racing'],['04','Najm','Saif Al Busaidi','Khalid Al Harthy','Racing']].map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
function raceCards(){ return shell(`${head('Digital Race Cards','Public, immutable race-card publications with version history.')}${demoNote()}<div class="race-card-sheet"><div class="race-card-head"><div><div class="kicker">Official Digital Race Card</div><h2>Al Bashayer Camel Race</h2><p>12 October 2026 • Al Dakhiliyah • 5 KM</p></div>${badge('OFFICIAL')}</div><div class="table-wrap">${raceRows()}</div></div><section class="section"><h2>Publication History</h2><div class="version-list">${demo.raceCards.map(c=>`<div class="version"><div><strong>Version ${c.version}</strong><div class="form-help">Published ${c.published}</div></div><span>${c.participants} participants</span></div>`).join('')}</div></section>`,'/race-cards'); }
function publishRaceCard(id){ return shell(`${head('Race Card Publish Control','Mohammed-owned race-card publication control inside organizer context.','<button class="btn btn-primary" id="publish-race-card" data-race="'+id+'">Publish New Version</button>')}<div class="race-card-sheet"><div class="race-card-head"><div><div class="kicker">Race #${esc(id)}</div><h2>Al Bashayer Camel Race</h2><p>Publishing snapshots accepted entries and creates an immutable new version.</p></div>${badge('READY')}</div><div class="table-wrap">${raceRows()}</div></div>`,''); }

function notFound(){ return shell(`<section class="card error"><div class="state-icon">!</div><h2>Page not found</h2><p>This route is not part of Mohammed's assigned frontend scope.</p><a class="btn btn-primary" href="/home" data-link>Go Home</a></section>`); }

function screen(match){ const {name}=match.route, p=match.params; return {
 'Landing / Entry Page':landing,
 'Sign In':()=>auth('signin'),'Create Account':()=>auth('signup'),'Forgot Password':()=>auth('forgot'),'Reset Password':()=>auth('reset'),
 'Home / Overview':home,'Settings / User Profile':settings,'Trainer Profile':trainer,'Challenges':challenges,
 'Challenge Detail + Voting':()=>challenge(p.id),'Training Log':training,'Admin Dashboard':admin,'Pedigree Section':()=>pedigree(p.id),
 'Race Card Publish Control':()=>publishRaceCard(p.id),'Organizations UI':organizations,'Tourism / Cultural Content UI':tourism,
 'Race Card Public / History UI':raceCards
 }[name] || notFound; }

async function render() {
 const epoch=++renderEpoch, match=matchRoute(normalizePath());
 state.adminUsers=null;
 $('#modal')?.remove();
 document.documentElement.lang=state.lang;
 document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';
 if(match && !canAccessRoute(match.route,state.user)) {
  denyAdminAccess();bind();return;
 }
 if(match?.route?.path==='/admin') {
  root.innerHTML=shell('<section class="card card-pad" role="status">Checking administrator access…</section>');bind();
  try {
   const user=await authApi.me();
   if(epoch!==renderEpoch) return;
   state.user=user;
   if(!canAccessRoute(match.route,user)) {denyAdminAccess();bind();return;}
   const page=await adminApi.users(state.adminPage);
   if(epoch!==renderEpoch) return;
   if(!Array.isArray(page?.content)) throw new Error('Unable to load the user list.');
   state.adminUsers=page.content;
   root.innerHTML=admin(page);
  } catch(err) {
   if(epoch!==renderEpoch) return;
   state.adminUsers=null;
   if(err.status===401) {state.user={...guestUser};denyAdminAccess();}
   else if(err.status===403) {
    state.user={...state.user,roles:(state.user.roles||[]).filter(role=>role!=='ADMIN')};
    denyAdminAccess();
   } else root.innerHTML=shell('<section class="card error"><h1>Administrator access unavailable</h1><p>Could not verify your access or load users. Please try again.</p><button class="btn btn-primary" id="admin-retry">Retry</button></section>');
  }
 } else root.innerHTML=match?screen(match)():notFound();
 bind();
}
function bind(){
 $('#admin-retry')?.addEventListener('click',()=>render());
 document.querySelectorAll('.admin-page').forEach(button=>button.addEventListener('click',()=>{state.adminPage=Number(button.dataset.page);render();}));
 bindAuth();
 document.querySelectorAll('[data-link]').forEach(a=>a.addEventListener('click',e=>{ if(!e.ctrlKey&&!e.metaKey){e.preventDefault();go(a.getAttribute('href'));} }));
 $('#lang-toggle')?.addEventListener('click',()=>{state.lang=state.lang==='en'?'ar':'en';localStorage.setItem('medhmar-lang',state.lang);render();});
 $('#auth-form')?.addEventListener('submit',handleAuth); $('#settings-form')?.addEventListener('submit',handleSettings); $('#logout-btn')?.addEventListener('click',handleLogout);
 document.querySelectorAll('.vote-btn').forEach(b=>b.addEventListener('click',handleVote)); $('#add-training-btn')?.addEventListener('click',showTrainingModal);
 $('#publish-race-card')?.addEventListener('click',handlePublish); document.querySelectorAll('.manage-user').forEach(b=>b.addEventListener('click',()=>showUserModal(b.dataset.user)));
}
async function handleAuth(e) {
 e.preventDefault();
 const form=e.currentTarget, kind=form.dataset.kind;
 const f=Object.fromEntries(new FormData(form));
 const submit=form.querySelector('[type="submit"]'), feedback=$('#auth-feedback');
 if(submit.disabled) return;
 feedback.hidden=true;
 try {
  if((kind==='signup'||kind==='reset') && f.password!==f.confirmPassword) {
   $('#auth-confirmPassword').focus();
   throw new Error('Passwords do not match.');
  }
  submit.disabled=true;
  form.setAttribute('aria-busy','true');
  if(kind==='signin') {
   state.user=await authApi.login({email:f.email,password:f.password});
   if(f.rememberMe) localStorage.setItem('medhmar-remembered-email',f.email);
   else localStorage.removeItem('medhmar-remembered-email');
   toast('Signed in successfully.','success');go('/home');
  } else if(kind==='signup') {
   await authApi.register({fullName:f.fullName,email:f.email,password:f.password,role:f.role,preferredLanguage:state.lang});
   toast('Account created. Sign in to continue.','success');go('/signin');
  } else if(kind==='forgot') {
   await authApi.forgot(f.email);
   feedback.textContent='If the account exists, a reset link will be sent.';
   feedback.className='auth-feedback success';feedback.hidden=false;
  } else {
   const token=new URLSearchParams(location.hash.slice(1)).get('token') || new URLSearchParams(location.search).get('token');
   if(!token) throw new Error('Open the reset link sent to your email before setting a new password.');
   await authApi.reset(token,f.password);
   toast('Password reset successfully.','success');go('/signin');
  }
 } catch(err) {
  feedback.textContent=err.message || 'Unable to complete this request. Please try again.';
  feedback.className='auth-feedback error';feedback.hidden=false;
 } finally {
  submit.disabled=false;form.removeAttribute('aria-busy');
 }
}
function bindAuth() {
 const form=$('#auth-form');
 if(!form) return;
 if(form.dataset.kind==='signin') {
  const remembered=localStorage.getItem('medhmar-remembered-email');
  if(remembered) { form.elements.email.value=remembered;form.elements.rememberMe.checked=true; }
 }
 document.querySelectorAll('[data-password-target]').forEach(button=>button.addEventListener('click',()=>{
  const input=document.getElementById(button.dataset.passwordTarget);
  const visible=input.type==='password';input.type=visible?'text':'password';
  button.setAttribute('aria-pressed',String(visible));
  const label=document.querySelector(`label[for="${input.id}"]`).textContent.toLowerCase();
  button.setAttribute('aria-label',`${visible?'Hide':'Show'} ${label}`);
 }));
 $('#google-signin')?.addEventListener('click',()=>{
  if(form.dataset.kind==='signup' && form.elements.role.value!=='VIEWER') {
   const feedback=$('#auth-feedback');
   feedback.textContent='Select Fan / Spectator for Google registration. To register as an Owner or Trainer, use Create Account above.';
   feedback.className='auth-feedback error';feedback.hidden=false;
   form.elements.role.focus();return;
  }
  if(form.dataset.kind==='signup' && !form.elements.terms.reportValidity()) return;
  window.location.assign(authApi.googleUrl());
 });
}
async function handleLogout(){ try{await authApi.logout();}catch{} state.user={...guestUser}; toast('Signed out.','success'); go('/signin'); }
async function handleSettings(e){ e.preventDefault(); const f=Object.fromEntries(new FormData(e.currentTarget)); try{state.user=await authApi.updateMe(f)||{...state.user,...f};toast('Profile updated.','success');}catch{state.user={...state.user,...f};toast('Backend unavailable; preview updated locally.','error');} render(); }
async function handleVote(e){ const b=e.currentTarget; if(!state.user?.userId){toast('Sign in before voting.','error');go('/signin');return;} b.disabled=true; try{await challengeApi.vote(b.dataset.challenge,Number(b.dataset.camel)); const updated=await challengeApi.one(b.dataset.challenge); state.challengeDetail=updated; state.challenges=state.challenges.map(c=>String(c.challengeId)===String(updated.challengeId)?updated:c); toast('Vote recorded successfully.','success'); render();}catch(err){toast(err.message,'error');b.disabled=false;} }
async function handlePublish(e){ const b=e.currentTarget;b.disabled=true;try{await raceCardApi.publish(b.dataset.race);toast('New immutable race-card version published.','success');}catch(err){toast(`${err.message}. Preview data unchanged.`,'error');b.disabled=false;} }
function showTrainingModal(){ document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><h2>Add Training Session</h2><p>Submit only against an active agreement.</p><form id="training-form" class="form"><div class="field"><label>Agreement ID</label><input class="input" name="agreementId" type="number" value="15" required></div><div class="field"><label>Duration</label><input class="input" name="durationMinutes" type="number" value="45" min="1" max="720" required></div><div class="field"><label>Notes</label><textarea class="textarea" name="notes" required>Endurance training session.</textarea></div><div class="modal-actions"><button type="button" class="btn btn-secondary" id="close-modal">Cancel</button><button class="btn btn-primary">Save</button></div></form></div></div>`); $('#close-modal').onclick=()=>$('#modal').remove(); $('#training-form').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));f.agreementId=Number(f.agreementId);f.durationMinutes=Number(f.durationMinutes);f.sessionAt=new Date().toISOString();try{await trainingApi.add(f);toast('Training session saved.','success');$('#modal').remove();}catch(err){toast(err.message,'error');}}; }
function showUserModal(id) {
 if(!canAccessRoute(matchRoute('/admin').route,state.user) || !Array.isArray(state.adminUsers)) return;
 const u=state.adminUsers.find(x=>String(x.userId)===String(id));
 if(!u) return;
 document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><h2>Manage ${esc(u.fullName)}</h2><form id="user-form" class="form"><fieldset class="field"><legend>Roles</legend>${['VIEWER','OWNER','TRAINER','ORGANIZER','ADMIN'].map(role=>`<label><input type="checkbox" name="roles" value="${role}" ${(u.roles||[]).includes(role)?'checked':''}> ${role}</label>`).join('')}</fieldset><div class="field"><label for="user-status">Status</label><select id="user-status" class="select" name="status">${['ACTIVE','INACTIVE','SUSPENDED'].map(status=>`<option ${u.accountStatus===status?'selected':''}>${status}</option>`).join('')}</select></div><div class="modal-actions"><button type="button" class="btn btn-secondary" id="close-modal">Cancel</button><button class="btn btn-primary" type="submit">Save</button></div></form></div></div>`);
 $('#close-modal').onclick=()=>$('#modal')?.remove();
 $('#user-form').onsubmit=async e=>{
  e.preventDefault();
  const form=e.currentTarget, data=new FormData(form), roles=data.getAll('roles'), status=data.get('status');
  const submit=form.querySelector('[type="submit"]'), epoch=renderEpoch;
  if(submit.disabled) return;
  if(!roles.length) {toast('Select at least one role.','error');return;}
  submit.disabled=true;
  try {
   const user=await authApi.me();
   if(epoch!==renderEpoch || !form.isConnected) return;
   state.user=user;
   if(!canAccessRoute(matchRoute('/admin').route,user)) {await render();return;}
   const rolesChanged=JSON.stringify([...roles].sort())!==JSON.stringify([...(u.roles||[])].sort());
   // Update roles last: changing an account's access revokes its old sessions.
   if(status!==u.accountStatus) await adminApi.status(u.userId,status);
   if(rolesChanged) await adminApi.roles(u.userId,roles);
   toast('User access updated.','success');
   if(epoch===renderEpoch) {$('#modal')?.remove();await render();}
  } catch(err) {
   toast(err.message,'error');
   if(epoch===renderEpoch && (err.status===401||err.status===403)) {
    if(err.status===401) state.user={...guestUser};
    else state.user={...state.user,roles:(state.user.roles||[]).filter(role=>role!=='ADMIN')};
    await render();
   }
  } finally {submit.disabled=false;}
 };
}

async function init(){
 try{state.user=await authApi.me();}catch{state.user={...guestUser};}
 try{
   const page=await challengeApi.list();
   state.challenges=page?.content||[];
   state.challengeError='';
 }catch(err){
   state.challenges=[];
   state.challengeError=err.message||'Unable to connect to the challenge API.';
 }
 const match=matchRoute(normalizePath());
 if(match?.route?.name==='Challenge Detail + Voting'){
   try{
     state.challengeDetail=await challengeApi.one(match.params.id);
     state.challengeError='';
   }catch(err){
     state.challengeDetail=null;
     state.challengeError=err.message||'Unable to load this challenge.';
   }
 }
 render();
}
window.addEventListener('popstate',render); init();

