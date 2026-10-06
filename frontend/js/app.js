import { matchRoute, normalizePath } from './routes.js';
import { demo } from './data.js';
import { authApi, challengeApi, adminApi, raceCardApi, trainingApi, camelApi, marketplaceApi, offerApi } from './api.js';
import { GENDERS, CAMEL_STATUSES, buildQuery, hasAnyRole, canManageCamels, fmtOmr, fmtDate, statusTone, isHttpUrl, isFullOwner, toCamelPayload, toListingPayload, toOfferCreatePayload, toOfferUpdatePayload } from './format.js';

const $ = (s, el=document) => el.querySelector(s);
const root = $('#app');
const toastRoot = $('#toast-root');
const guestUser = { fullName: 'Guest', email: '', roles: [] };
const state = { user: guestUser, challenges: [], challengeDetail: null, challengeError: '', view: { key: '', status: 'idle', data: null, error: null }, lang: localStorage.getItem('medhmar-lang') || 'en' };
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const badge = s => `<span class="badge ${['ACTIVE','OPEN','APPROVED','OFFICIAL'].includes(s)?'success':['PENDING','UPCOMING'].includes(s)?'warning':['SUSPENDED','REJECTED','CLOSED'].includes(s)?'danger':'neutral'}">${esc(s)}</span>`;
const go = p => { history.pushState({},'',p); render(); };
function toast(msg,type=''){ const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=msg; toastRoot.append(el); setTimeout(()=>el.remove(),3200); }

const navItems = [
  ['/home','Home'],['/challenges','Challenges'],['/training','Training'],['/organizations','Organizations'],
  ['/tourism','Heritage'],['/race-cards','Race Cards'],['/trainer-profile','Trainer'],['/admin','Admin']
];
const navAll = [...navItems.slice(0,7),['/camels','Camels'],['/marketplace','Marketplace'],...navItems.slice(7)];
function topbar(active=''){
  return `<header class="topbar"><div class="topbar-inner"><a class="brand" href="/" data-link><img src="/assets/mark.svg" alt=""><span>MEDHMAR</span></a>
  <nav class="nav">${navAll.map(([p,l])=>`<a href="${p}" data-link class="${active===p?'active':''}">${l}</a>`).join('')}</nav>
  <div class="nav-actions"><button class="lang-btn" id="lang-toggle">${state.lang==='en'?'EN | AR':'AR | EN'}</button><a class="profile-btn" href="/settings" data-link><span class="avatar">${esc(state.user.fullName?.[0]||'G')}</span><span>${esc(state.user.fullName?.split(' ')[0]||'Guest')}</span></a></div></div></header>`;
}
const head = (t,s,a='') => `<div class="page-head"><div><div class="kicker">MEDHMAR</div><h1>${t}</h1><p>${s}</p></div>${a?`<div class="actions">${a}</div>`:''}</div>`;
const shell = (body,active='') => `<div class="app-shell">${topbar(active)}<main class="main">${body}</main><footer>MEDHMAR • Mohammed frontend scope • Auth / Security / Integration / Pedigree / Challenges / Training Log / Admin / Platform</footer></div>`;
const demoNote = () => `<div class="demo-note">Connected screens use the Spring Boot API when available; preview data is shown when it is offline.</div>`;

function landing(){
 return `<div class="app-shell">${topbar()}<section class="hero"><div class="hero-inner"><div class="hero-kicker">Omani camel racing • digital platform</div><h1>Experience the Heritage of Camel Racing.</h1><p>Secure access, challenges, training records, organizations, cultural content and official digital race cards in one premium platform.</p><div class="actions"><a class="btn btn-primary" href="/home" data-link>Explore Medhmar</a><a class="btn btn-secondary" href="/signup" data-link>Create account</a></div></div></section><main class="main"><div class="section-title"><h2>Mohammed's Platform Modules</h2><span>Focused implementation only</span></div><div class="grid grid-4">${[['Secure accounts','Authentication, registration and password recovery.'],['Challenges & voting','Published camel challenges with protected voting.'],['Training records','Chronological trainer session logs.'],['Platform operations','Admin, organizations, tourism and race cards.']].map(([t,d])=>`<article class="card card-pad"><h3>${t}</h3><p class="form-help">${d}</p></article>`).join('')}</div></main></div>`;
}

function auth(kind){
 const cfg = {
  signin:['Welcome Back','Sign in to your Medhmar account.',`<div class="field"><label>Email</label><input class="input" name="email" type="email" value="mohammed@medhmar.om" required></div><div class="field"><label>Password</label><input class="input" name="password" type="password" value="MedhmarDemo2026!" required></div><div class="auth-links"><a href="/forgot-password" data-link>Forgot password?</a></div><button class="btn btn-primary" type="submit">Sign In</button>`],
  signup:['Create Your Account','Join Medhmar and be part of the camel racing community.',`<div class="field"><label>Full Name</label><input class="input" name="fullName" value="Mohammed Al Najjar" required></div><div class="field"><label>Email</label><input class="input" name="email" type="email" value="mohammed@example.com" required></div><div class="field"><label>Password</label><input class="input" name="password" type="password" value="StrongPass2026!" required></div><div class="field"><label>Account Type</label><select class="select" name="role" required><option value="VIEWER">Fan / Spectator</option><option value="OWNER">Camel Owner</option><option value="TRAINER">Trainer (Mudammer)</option></select><div class="form-help">Choose your account type. Organizer and Admin roles are assigned only by an administrator.</div></div><div class="field"><label>Language</label><select class="select" name="preferredLanguage"><option value="en">English</option><option value="ar">العربية</option></select></div><button class="btn btn-primary" type="submit">Create Account</button>`],
  forgot:['Forgot Your Password?','Enter your email to receive a reset link.',`<div class="field"><label>Email</label><input class="input" name="email" type="email" value="mohammed@example.com" required></div><button class="btn btn-primary" type="submit">Send Reset Link</button>`],
  reset:['Create New Password','Enter a secure password to continue.',`<div class="field"><label>New Password</label><input class="input" name="password" type="password" value="StrongPass2026!" required></div><div class="field"><label>Confirm Password</label><input class="input" name="confirmPassword" type="password" value="StrongPass2026!" required></div><button class="btn btn-primary" type="submit">Reset Password</button>`]
 }[kind];
 return `<div class="app-shell">${topbar()}<div class="auth-layout"><div class="auth-visual"></div><div class="auth-panel"><div class="auth-box"><h1>${cfg[0]}</h1><p>${cfg[1]}</p><form class="form" id="auth-form" data-kind="${kind}">${cfg[2]}</form><div class="divider">or</div><a class="btn btn-secondary" href="/" data-link>Back to Medhmar</a></div></div></div></div>`;
}

function home(){ const firstName=state.user?.fullName?.trim().split(/\s+/)[0]||'Guest'; return shell(`${head(`Good morning, ${esc(firstName)} 👋`,'Welcome back to Medhmar. Your integration overview keeps your platform modules in one place.')}${demoNote()}<div class="stats">${[['Challenges','2','1 open'],['Training Logs','18','this month'],['Organizations','3','active'],['Race Cards','3','versions']].map(([a,b,c])=>`<div class="card stat"><div class="stat-label">${a}</div><div class="stat-value">${b}</div><div class="stat-note">${c}</div></div>`).join('')}</div><div class="grid grid-2"><section class="card card-pad"><div class="section-title"><h2>Quick access</h2></div><div class="grid grid-2">${navItems.slice(1,7).map(([p,l])=>`<a class="card card-pad" href="${p}" data-link><strong>${l}</strong><p class="form-help">Open module →</p></a>`).join('')}</div></section><section class="card card-pad"><div class="section-title"><h2>Platform activity</h2></div><div class="timeline"><div class="timeline-item"><h3>Challenge opened</h3><p>Desert Champions Challenge is accepting votes.</p></div><div class="timeline-item"><h3>Race card published</h3><p>Al Bashayer Camel Race v3 is now public.</p></div><div class="timeline-item"><h3>Profile secured</h3><p>Role-aware access is active for this session.</p></div></div></section></div>`,'/home'); }

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

function admin(){ return shell(`${head('Admin Dashboard','Manage users, roles and account status without exposing teammate-owned business modules.')}${demoNote()}<div class="stats">${[['Users','2,100','total'],['Active','1,934','accounts'],['Suspended','16','review'],['Roles','5','system']].map(([a,b,c])=>`<div class="card stat"><div class="stat-label">${a}</div><div class="stat-value">${b}</div><div class="stat-note">${c}</div></div>`).join('')}</div><div class="toolbar"><input class="input" placeholder="Search users..."></div><div class="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Action</th></tr></thead><tbody>${demo.users.map(u=>`<tr><td><strong>${u.fullName}</strong></td><td>${u.email}</td><td>${u.roles.map(badge).join(' ')}</td><td>${badge(u.status)}</td><td><button class="small-btn manage-user" data-user="${u.userId}">Manage</button></td></tr>`).join('')}</tbody></table></div>`,'/admin'); }

function pedigree(id){ const p=demo.pedigree; return shell(`${head('Pedigree','Camel profile pedigree section only — the core Camel CRUD remains outside Mohammed’s scope.')}<div class="card pedigree-wrap"><div class="pedigree"><div class="pedigree-row"><div class="pedigree-node"><div class="pedigree-label">Camel</div><div class="pedigree-name">${p.camel}</div></div></div><div class="pedigree-row parents"><div class="pedigree-node"><div class="pedigree-label">Sire</div><div class="pedigree-name">${p.sire}</div></div><div class="pedigree-node"><div class="pedigree-label">Dam</div><div class="pedigree-name">${p.dam}</div></div></div><div class="pedigree-row grands">${p.grands.map((x,i)=>`<div class="pedigree-node"><div class="pedigree-label">Grand ${i<2?'Sire/Dam':'Parent'}</div><div class="pedigree-name">${x}</div></div>`).join('')}</div></div></div>`,''); }

function organizations(){ return shell(`${head('Racing Organizations','Regional organizer groups and membership visibility.')}${demoNote()}<div class="grid grid-3">${demo.organizations.map(o=>`<article class="card org-card"><div class="org-top"><div class="org-logo">M</div><div><h3>${o.name}</h3><p class="form-help">${o.region}</p></div></div><div class="org-stats"><div class="org-stat"><strong>${o.members}</strong><span>Members</span></div><div class="org-stat"><strong>${o.races}</strong><span>Races</span></div><div class="org-stat"><strong>${o.status}</strong><span>Status</span></div></div></article>`).join('')}</div>`,'/organizations'); }
function tourism(){ return shell(`${head('Tourism & Cultural Content','Approved visitor and heritage content within the Medhmar platform.')}<section class="tourism-hero"><div><div class="hero-kicker">Experience the culture behind the race</div><h1>Discover Camel Racing Heritage</h1><p>Regional events, visitor information and approved cultural knowledge.</p></div></section><section class="section"><div class="grid grid-3">${demo.tourism.map(x=>`<article class="card card-pad"><div class="kicker">${x.type}</div><h3>${x.title}</h3><p>${x.location} • ${x.date}</p>${badge(x.status)}</article>`).join('')}</div></section>`,'/tourism'); }

const raceRows = () => `<table><thead><tr><th>No.</th><th>Camel</th><th>Owner</th><th>Trainer</th><th>Category</th></tr></thead><tbody>${[['01','Barq','Ahmed Al Balushi','Salim Al Rashidi','Racing'],['02','Shahin','Khalid Al Maamari','Nasser Al Hinai','Racing'],['03','Al Sahab','Mohammed Al Naqbi','Rashid Al Kindi','Racing'],['04','Najm','Saif Al Busaidi','Khalid Al Harthy','Racing']].map(r=>`<tr>${r.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
function raceCards(){ return shell(`${head('Digital Race Cards','Public, immutable race-card publications with version history.')}${demoNote()}<div class="race-card-sheet"><div class="race-card-head"><div><div class="kicker">Official Digital Race Card</div><h2>Al Bashayer Camel Race</h2><p>12 October 2026 • Al Dakhiliyah • 5 KM</p></div>${badge('OFFICIAL')}</div><div class="table-wrap">${raceRows()}</div></div><section class="section"><h2>Publication History</h2><div class="version-list">${demo.raceCards.map(c=>`<div class="version"><div><strong>Version ${c.version}</strong><div class="form-help">Published ${c.published}</div></div><span>${c.participants} participants</span></div>`).join('')}</div></section>`,'/race-cards'); }
function publishRaceCard(id){ return shell(`${head('Race Card Publish Control','Mohammed-owned race-card publication control inside organizer context.','<button class="btn btn-primary" id="publish-race-card" data-race="'+id+'">Publish New Version</button>')}<div class="race-card-sheet"><div class="race-card-head"><div><div class="kicker">Race #${esc(id)}</div><h2>Al Bashayer Camel Race</h2><p>Publishing snapshots accepted entries and creates an immutable new version.</p></div>${badge('READY')}</div><div class="table-wrap">${raceRows()}</div></div>`,''); }

// ===== Camel / Ownership / Marketplace / Offers / Sale-completion (Camel & Marketplace scope) =====
// Data is loaded per route (state.view), never at startup, and never falls back to fake business data.
const sb = s => `<span class="badge ${statusTone(s)}">${esc(s ?? '—')}</span>`;
const qparams = () => Object.fromEntries(new URLSearchParams(location.search));
const signedIn = () => Boolean(state.user?.userId);
const isAdmin = () => hasAnyRole(state.user, 'ADMIN');
const blankView = () => ({ key: '', status: 'idle', data: null, error: null });
const refresh = () => { state.view = blankView(); render(); };
const needAuth = () => { if (!signedIn()) throw Object.assign(new Error('Sign in to continue.'), { status: 401 }); };
async function camelMap(ids) {
  const out = {};
  await Promise.all([...new Set(ids.filter(Boolean))].map(id => camelApi.one(id).then(c => { out[id] = c; }).catch(() => {})));
  return out;
}

const loaders = {
  'Camels': async () => { const q = qparams(); return { q, page: await camelApi.list({ page: q.page || 0, size: 12, search: q.search, gender: q.gender, breed: q.breed, category: q.category, status: q.status }) }; },
  'My Camels': async () => { needAuth(); return { camels: await camelApi.mine() }; },
  'Add Camel': async () => { needAuth(); return {}; },
  'Camel Profile': async p => {
    const [profile, mine] = await Promise.all([camelApi.profile(p.id), signedIn() ? camelApi.mine().catch(() => []) : []]);
    return { profile, isOwner: mine.some(c => String(c.camelId) === String(p.id)) };
  },
  'Edit Camel': async p => { needAuth(); return { camel: await camelApi.one(p.id) }; },
  'Camel Ownership History': async p => { const [camel, history] = await Promise.all([camelApi.one(p.id), camelApi.ownership(p.id)]); return { camel, history }; },
  'Marketplace': async () => { const q = qparams(); const page = await marketplaceApi.list({ page: q.page || 0, size: 12, search: q.search, minPrice: q.minPrice, maxPrice: q.maxPrice }); return { q, page, camels: await camelMap(page.content.map(l => l.camelId)) }; },
  'Create Listing': async () => { needAuth(); return { camels: await camelApi.mine(), camelId: qparams().camelId }; },
  'My Listings': async () => { needAuth(); const listings = await marketplaceApi.mine(); return { listings, camels: await camelMap(listings.map(l => l.camelId)) }; },
  'Listing History': async () => { needAuth(); const listings = await marketplaceApi.history(); return { listings, camels: await camelMap(listings.map(l => l.camelId)) }; },
  'Listing Detail': async p => {
    const listing = await marketplaceApi.one(p.id);
    const seller = signedIn() && (String(listing.userId) === String(state.user.userId) || isAdmin());
    const [camel, offers, myOffers] = await Promise.all([
      camelApi.one(listing.camelId).catch(() => null),
      seller ? offerApi.forListing(p.id).catch(e => ({ error: e.message })) : null,
      signedIn() && !seller ? offerApi.mine().catch(() => []) : [],
    ]);
    return { listing, camel, seller, offers, myOffer: (myOffers || []).find(o => String(o.listingId) === String(p.id) && o.status === 'PENDING') || null };
  },
  'Edit Listing': async p => { needAuth(); const listing = await marketplaceApi.one(p.id); return { listing, camel: await camelApi.one(listing.camelId).catch(() => null) }; },
  'My Offers': async () => { needAuth(); return { offers: await offerApi.mine() }; },
  'Offer Detail': async p => {
    needAuth();
    const offer = await offerApi.one(p.id);
    let listing = await marketplaceApi.one(offer.listingId).catch(() => null); // sold/cancelled listings are inactive => 404
    if (!listing && offer.status === 'ACCEPTED') listing = (await marketplaceApi.history().catch(() => [])).find(l => l.listingId === offer.listingId) || null;
    const camel = listing ? await camelApi.one(listing.camelId).catch(() => null) : null;
    const ownership = offer.status === 'ACCEPTED' && camel ? await camelApi.ownership(camel.camelId).catch(() => null) : null;
    return { offer, listing, camel, ownership };
  },
};
function loadView(match) {
  const loader = match && loaders[match.route.name];
  if (!loader) { state.view = blankView(); return; }
  const key = location.pathname + location.search;
  if (state.view.key === key) return;
  const next = { ...blankView(), key, status: 'loading' };
  state.view = next;
  loader(match.params).then(d => { if (state.view === next) { next.data = d; next.status = 'ready'; render(); } },
    err => { if (state.view === next) { next.error = err; next.status = 'error'; render(); } });
}

const tabs = (items, active) => `<nav class="subnav">${items.map(([p, l]) => `<a href="${p}" data-link class="${active === p ? 'active' : ''}">${l}</a>`).join('')}</nav>`;
const camelTabs = a => tabs([['/camels', 'All camels'], ['/camels/my', 'My camels'], ...(canManageCamels(state.user) ? [['/camels/new', 'Add camel']] : [])], a);
const marketTabs = a => tabs([['/marketplace', 'Browse'], ['/marketplace/my-listings', 'My listings'], ['/marketplace/history', 'Listing history'], ['/offers', 'My offers'], ...(canManageCamels(state.user) ? [['/marketplace/new', 'Create listing']] : [])], a);
const loadingCard = () => `<section class="card empty"><h2>Loading…</h2><p>Fetching live data from the Medhmar API.</p></section>`;
const emptyCard = (t, m, a = '') => `<section class="card empty"><h2>${t}</h2><p>${m}</p>${a}</section>`;
function errorCard(err) {
  const s = err?.status, m = esc(err?.message || 'Unexpected error.');
  if (s === 401) return `<section class="card permission"><h2>Sign in required</h2><p>${m}</p><a class="btn btn-primary" href="/signin" data-link>Sign in</a></section>`;
  if (s === 403) return `<section class="card permission"><h2>Not allowed</h2><p>${m} Your account does not have permission for this action.</p></section>`;
  if (s === 404) return `<section class="card error"><h2>Not found</h2><p>${m}</p></section>`;
  return `<section class="card error"><h2>Unable to load data</h2><p>${m}</p><button class="btn btn-primary" data-act="retry">Try again</button></section>`;
}
// builder(data) => { title, sub, actions, body }
function scr(active, tabsHtml, fallback, builder) {
  const v = state.view;
  if (v.status !== 'ready') return shell(`${head(fallback, '')}${tabsHtml}${v.status === 'error' ? errorCard(v.error) : loadingCard()}`, active);
  const r = builder(v.data);
  return shell(`${head(r.title, r.sub || '', r.actions || '')}${tabsHtml}${r.body}`, active);
}
const camelPhoto = c => isHttpUrl(c?.photoUrl) ? `<img class="camel-thumb" src="${esc(c.photoUrl)}" alt="${esc(c.name)}" loading="lazy" referrerpolicy="no-referrer">` : '<div class="camel-art"></div>';
const row = (l, v) => `<div class="info-row"><span>${l}</span><strong>${v}</strong></div>`;
const pager = pg => pg.totalPages > 1 ? `<div class="pager"><button class="small-btn" data-act="page" data-page="${pg.page - 1}" ${pg.page <= 0 ? 'disabled' : ''}>← Previous</button><span>Page ${pg.page + 1} of ${pg.totalPages} • ${pg.totalElements} results</span><button class="small-btn" data-act="page" data-page="${pg.page + 1}" ${pg.page + 1 >= pg.totalPages ? 'disabled' : ''}>Next →</button></div>` : '';
const opts = (list, cur, any) => `${any ? `<option value="">${any}</option>` : ''}${list.map(x => `<option ${x === cur ? 'selected' : ''}>${x}</option>`).join('')}`;

// ---- Camels ----
const camelCard = c => `<article class="card card-pad">${camelPhoto(c)}<div class="section-title"><h3>${esc(c.name)}</h3>${sb(c.status)}</div><div class="info-list">${row('Breed', esc(c.breed))}${row('Gender', esc(c.gender))}${row('Born', fmtDate(c.birthDate))}${row('Category', esc(c.category || '—'))}</div><div class="actions"><a class="btn btn-primary" href="/camels/${c.camelId}/profile" data-link>View profile</a></div></article>`;
const camelsScreen = () => scr('/camels', camelTabs('/camels'), 'Camels', d => ({
  title: 'Camels', sub: 'Registered camels from the Medhmar registry.',
  actions: canManageCamels(state.user) ? '<a class="btn btn-primary" href="/camels/new" data-link>+ Add Camel</a>' : '',
  body: `<form class="toolbar" data-form="camel-filter"><input class="input" name="search" placeholder="Search by name…" value="${esc(d.q.search || '')}"><select class="select" name="gender">${opts(GENDERS, d.q.gender, 'Any gender')}</select><input class="input" name="breed" placeholder="Breed" value="${esc(d.q.breed || '')}"><input class="input" name="category" placeholder="Category" value="${esc(d.q.category || '')}"><select class="select" name="status">${opts(CAMEL_STATUSES, d.q.status, 'Any status')}</select><button class="btn btn-primary" type="submit">Filter</button></form>${d.page.content.length ? `<div class="grid grid-3">${d.page.content.map(camelCard).join('')}</div>${pager(d.page)}` : emptyCard('No camels found', 'No camels match these filters.')}`,
}));
const myCamelsScreen = () => scr('/camels', camelTabs('/camels/my'), 'My Camels', d => ({
  title: 'My Camels', sub: 'Camels you currently own.',
  body: d.camels.length ? `<div class="grid grid-3">${d.camels.map(camelCard).join('')}</div>` : emptyCard('You do not own any camels yet', canManageCamels(state.user) ? 'Register your first camel to get started.' : 'Camel registration is available to Owner accounts.', canManageCamels(state.user) ? '<a class="btn btn-primary" href="/camels/new" data-link>Add Camel</a>' : ''),
}));
const camelForm = (c = {}) => `<form class="form card card-pad" data-form="${c.camelId ? 'camel-edit' : 'camel-add'}" ${c.camelId ? `data-id="${c.camelId}"` : ''}>
<div class="form-row"><div class="field"><label>Name</label><input class="input" name="name" required minlength="2" maxlength="50" value="${esc(c.name || '')}"></div><div class="field"><label>Breed</label><input class="input" name="breed" required minlength="2" maxlength="50" value="${esc(c.breed || '')}"></div></div>
<div class="form-row"><div class="field"><label>Gender</label><select class="select" name="gender" required>${opts(GENDERS, c.gender)}</select></div><div class="field"><label>Birth date</label><input class="input" type="date" name="birthDate" required max="${fmtDate(Date.now() - 86400000)}" value="${esc(c.birthDate ? fmtDate(c.birthDate) : '')}"></div></div>
<div class="form-row"><div class="field"><label>Sire</label><input class="input" name="sire" maxlength="100" value="${esc(c.sire || '')}"></div><div class="field"><label>Dam</label><input class="input" name="dam" maxlength="100" value="${esc(c.dam || '')}"></div></div>
<div class="form-row"><div class="field"><label>Category</label><input class="input" name="category" maxlength="50" value="${esc(c.category || '')}"></div><div class="field"><label>Status</label><select class="select" name="status" required>${opts(CAMEL_STATUSES, c.status || 'ACTIVE')}</select></div></div>
<div class="field"><label>Photo URL</label><input class="input" type="url" name="photoUrl" placeholder="https://…" value="${esc(c.photoUrl || '')}"></div>
<div class="modal-actions"><a class="btn btn-secondary" href="${c.camelId ? `/camels/${c.camelId}/profile` : '/camels/my'}" data-link>Cancel</a><button class="btn btn-primary" type="submit">${c.camelId ? 'Save changes' : 'Register camel'}</button></div></form>`;
const addCamelScreen = () => scr('/camels', camelTabs('/camels/new'), 'Add Camel', () => canManageCamels(state.user)
  ? { title: 'Add Camel', sub: 'You become the 100% owner of the camel you register.', body: camelForm() }
  : { title: 'Add Camel', sub: '', body: errorCard({ status: 403, message: 'Only Owner or Admin accounts can register camels.' }) });
const editCamelScreen = () => scr('/camels', camelTabs(''), 'Edit Camel', d => ({ title: `Edit ${esc(d.camel.name)}`, sub: 'Only the full owner (or an admin) can save changes.', body: camelForm(d.camel) }));
const camelProfileScreen = () => scr('/camels', camelTabs(''), 'Camel Profile', d => {
  const p = d.profile, ped = p.pedigree || {}, al = p.activeListing;
  const canEdit = canManageCamels(state.user) && (d.isOwner || isAdmin());
  const parent = (name, id) => id ? `<a href="/camels/${id}/profile" data-link>${esc(name || `Camel #${id}`)}</a>` : esc(name || '—');
  const sell = canManageCamels(state.user) && d.isOwner && !al && isFullOwner(p.owners) && p.status !== 'SOLD' ? `<a class="btn btn-primary" href="/marketplace/new?camelId=${p.camelId}" data-link>List for sale</a>` : '';
  return {
    title: esc(p.name), sub: `${esc(p.breed)} • ${esc(p.gender)} • ${esc(p.category || 'Uncategorised')}`,
    actions: `${sell}<a class="btn btn-secondary" href="/camels/${p.camelId}/ownership" data-link>Ownership history</a><a class="btn btn-secondary" href="/camels/${p.camelId}" data-link>Pedigree section</a>${canEdit ? `<a class="btn btn-secondary" href="/camels/${p.camelId}/edit" data-link>Edit</a><button class="btn btn-danger" data-act="delete-camel" data-id="${p.camelId}" data-name="${esc(p.name)}">Delete</button>` : ''}`,
    body: `<div class="two-pane"><section class="card card-pad">${camelPhoto(p)}<div class="section-title"><h2>Profile</h2>${sb(p.status)}</div><div class="info-list">${row('Born', fmtDate(p.birthDate))}${row('Breed', esc(p.breed))}${row('Gender', esc(p.gender))}${row('Category', esc(p.category || '—'))}${row('Sire', parent(ped.sire, ped.sireCamelId))}${row('Dam', parent(ped.dam, ped.damCamelId))}${row('Pedigree recorded', fmtDate(ped.recordedAt))}</div></section>
<aside><section class="card card-pad"><h2>Current owners</h2>${p.owners.length ? `<div class="info-list">${p.owners.map(o => row(esc(o.name || '—'), `${esc(o.sharePercent)}%`)).join('')}</div>` : '<p class="form-help">No current owner recorded.</p>'}<p class="form-help">Owner names only — contact details are never shown.</p></section>
<section class="card card-pad section"><h2>Marketplace</h2>${al ? `<div class="price">${fmtOmr(al.askingPriceOmr)}</div><p>${esc(al.description)}</p>${sb(al.status)} <a class="btn btn-secondary" href="/marketplace/${al.listingId}" data-link>View listing</a>` : '<p class="form-help">Not currently listed for sale.</p>'}</section></aside></div>`,
  };
});
const ownershipScreen = () => scr('/camels', camelTabs(''), 'Ownership History', d => ({
  title: `Ownership — ${esc(d.camel.name)}`, sub: 'Every ownership period, newest first. Transfers happen only when a seller accepts an offer.',
  actions: `<a class="btn btn-secondary" href="/camels/${d.camel.camelId}/profile" data-link>Back to profile</a>`,
  body: d.history.length ? `<div class="table-wrap"><table><thead><tr><th>Owner</th><th>Share</th><th>From</th><th>To</th><th>Status</th></tr></thead><tbody>${d.history.map(h => `<tr><td><strong>${esc(h.ownerName || '—')}</strong></td><td>${esc(h.sharePercent)}%</td><td>${fmtDate(h.startAt)}</td><td>${fmtDate(h.endAt)}</td><td>${h.current ? sb('ACTIVE').replace('ACTIVE', 'CURRENT') : sb('PREVIOUS')}</td></tr>`).join('')}</tbody></table></div>` : emptyCard('No ownership records', 'This camel has no recorded ownership.'),
}));

// ---- Marketplace ----
const listingCard = (l, camels) => { const c = camels[l.camelId]; return `<article class="card card-pad">${camelPhoto(c)}<div class="section-title"><h3>${esc(c?.name || `Camel #${l.camelId}`)}</h3>${sb(l.status)}</div><div class="price">${fmtOmr(l.askingPriceOmr)}</div><p>${esc(l.description || '')}</p><div class="actions"><a class="btn btn-primary" href="/marketplace/${l.listingId}" data-link>View listing</a></div></article>`; };
const marketScreen = () => scr('/marketplace', marketTabs('/marketplace'), 'Marketplace', d => ({
  title: 'Marketplace', sub: 'Camels currently listed for sale. Prices are in Omani Rial (OMR).',
  body: `<form class="toolbar" data-form="market-filter"><input class="input" name="search" placeholder="Search camel or description…" value="${esc(d.q.search || '')}"><input class="input" type="number" min="0" step="any" name="minPrice" placeholder="Min OMR" value="${esc(d.q.minPrice || '')}"><input class="input" type="number" min="0" step="any" name="maxPrice" placeholder="Max OMR" value="${esc(d.q.maxPrice || '')}"><button class="btn btn-primary" type="submit">Filter</button></form>${d.page.content.length ? `<div class="grid grid-3">${d.page.content.map(l => listingCard(l, d.camels)).join('')}</div>${pager(d.page)}` : emptyCard('No listings found', 'No camels are listed for sale right now.')}`,
}));
const listingTable = (listings, camels, withActions) => `<div class="table-wrap"><table><thead><tr><th>Camel</th><th>Asking price</th><th>Status</th><th>Listed</th><th>Description</th>${withActions ? '<th>Actions</th>' : ''}</tr></thead><tbody>${listings.map(l => { const c = camels[l.camelId]; return `<tr><td><a href="/camels/${l.camelId}/profile" data-link><strong>${esc(c?.name || `Camel #${l.camelId}`)}</strong></a></td><td>${fmtOmr(l.askingPriceOmr)}</td><td>${sb(l.status)}</td><td>${fmtDate(l.createdAt)}</td><td>${esc(l.description || '')}</td>${withActions ? `<td class="table-actions">${l.status === 'AVAILABLE' ? `<a class="small-btn" href="/marketplace/${l.listingId}" data-link>Open</a> <a class="small-btn" href="/marketplace/${l.listingId}/edit" data-link>Edit</a> <button class="small-btn" data-act="cancel-listing" data-id="${l.listingId}">Cancel</button>` : '—'}</td>` : ''}</tr>`; }).join('')}</tbody></table></div>`;
const myListingsScreen = () => scr('/marketplace', marketTabs('/marketplace/my-listings'), 'My Listings', d => ({
  title: 'My Listings', sub: 'Listings you created, including sold and cancelled ones.',
  actions: canManageCamels(state.user) ? '<a class="btn btn-primary" href="/marketplace/new" data-link>+ Create Listing</a>' : '',
  body: d.listings.length ? listingTable(d.listings, d.camels, true) : emptyCard('No listings yet', 'You have not listed any camels for sale.'),
}));
const historyScreen = () => scr('/marketplace', marketTabs('/marketplace/history'), 'Listing History', d => ({
  title: 'Listing History', sub: 'Your sold and cancelled listings.',
  body: d.listings.length ? listingTable(d.listings, d.camels, false) : emptyCard('No history yet', 'Sold or cancelled listings will appear here.'),
}));
const listingForm = (camels, l = {}, camelId = '') => `<form class="form card card-pad" data-form="${l.listingId ? 'listing-edit' : 'listing-add'}" ${l.listingId ? `data-id="${l.listingId}"` : ''}>
<div class="field"><label>Camel</label>${l.listingId ? `<input type="hidden" name="camelId" value="${esc(l.camelId)}"><input class="input" value="${esc(camels[0]?.name || `Camel #${l.camelId}`)}" disabled>` : `<select class="select" name="camelId" required><option value="">Select one of your camels…</option>${camels.filter(c => c.status !== 'SOLD').map(c => `<option value="${c.camelId}" ${String(c.camelId) === String(camelId) ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select><div class="form-help">Only the full (100%) owner can list a camel, and a camel can have one active listing.</div>`}</div>
<div class="field"><label>Asking price (OMR)</label><input class="input" type="number" name="askingPriceOmr" required min="0.001" step="any" value="${esc(l.askingPriceOmr ?? '')}"></div>
<div class="field"><label>Description</label><textarea class="textarea" name="description" required minlength="3" maxlength="255">${esc(l.description || '')}</textarea></div>
<div class="modal-actions"><a class="btn btn-secondary" href="${l.listingId ? `/marketplace/${l.listingId}` : '/marketplace/my-listings'}" data-link>Cancel</a><button class="btn btn-primary" type="submit">${l.listingId ? 'Save changes' : 'Publish listing'}</button></div></form>`;
const createListingScreen = () => scr('/marketplace', marketTabs('/marketplace/new'), 'Create Listing', d => canManageCamels(state.user)
  ? { title: 'Create Listing', sub: 'List one of your camels for sale in OMR.', body: listingForm(d.camels, {}, d.camelId) }
  : { title: 'Create Listing', sub: '', body: errorCard({ status: 403, message: 'Only Owner or Admin accounts can create listings.' }) });
const editListingScreen = () => scr('/marketplace', marketTabs(''), 'Edit Listing', d => ({ title: 'Edit Listing', sub: 'Only the price and description can be changed on an available listing.', body: listingForm(d.camel ? [d.camel] : [], d.listing) }));
const offerRows = (offers, withListing) => `<div class="table-wrap"><table><thead><tr><th>Offer</th>${withListing ? '<th>Listing</th>' : ''}<th>Price</th><th>Status</th><th>Offered</th><th>Responded</th><th>Actions</th></tr></thead><tbody>${offers.map(o => `<tr><td><a href="/offers/${o.offerId}" data-link>#${o.offerId}</a></td>${withListing ? `<td>#${esc(o.listingId)}</td>` : ''}<td>${fmtOmr(o.offeredPriceOmr)}</td><td>${sb(o.status)}</td><td>${fmtDate(o.createdAt)}</td><td>${fmtDate(o.respondedAt)}</td><td class="table-actions"><a class="small-btn" href="/offers/${o.offerId}" data-link>Details</a>${o.status === 'PENDING' ? (withListing ? ` <button class="small-btn" data-act="edit-offer" data-id="${o.offerId}" data-price="${esc(o.offeredPriceOmr)}">Edit price</button> <button class="small-btn" data-act="withdraw-offer" data-id="${o.offerId}">Withdraw</button>` : ` <button class="small-btn" data-act="accept-offer" data-id="${o.offerId}" data-price="${esc(o.offeredPriceOmr)}">Accept</button> <button class="small-btn" data-act="decline-offer" data-id="${o.offerId}">Decline</button>`) : ''}</td></tr>`).join('')}</tbody></table></div>`;
const listingScreen = () => scr('/marketplace', marketTabs(''), 'Listing', d => {
  const l = d.listing, c = d.camel, open = l.status === 'AVAILABLE';
  let side = '';
  if (d.seller) side = `<section class="card card-pad section"><h2>Offers received</h2>${Array.isArray(d.offers) ? (d.offers.length ? offerRows(d.offers, false) : '<p class="form-help">No offers yet.</p>') : errorCard({ message: d.offers?.error || 'Offers unavailable.' })}<p class="form-help">Accepting an offer sells the camel and transfers ownership to the buyer. Other pending offers are declined automatically.</p></section>`;
  const buyer = !d.seller && open ? (!signedIn() ? '<a class="btn btn-primary" href="/signin" data-link>Sign in to make an offer</a>' : d.myOffer ? `<div class="info-list">${row('Your pending offer', fmtOmr(d.myOffer.offeredPriceOmr))}</div><div class="actions"><button class="btn btn-secondary" data-act="edit-offer" data-id="${d.myOffer.offerId}" data-price="${esc(d.myOffer.offeredPriceOmr)}">Edit offer</button><button class="btn btn-danger" data-act="withdraw-offer" data-id="${d.myOffer.offerId}">Withdraw</button></div>` : `<button class="btn btn-primary" data-act="make-offer" data-listing="${l.listingId}" data-price="${esc(l.askingPriceOmr)}">Make an offer</button>`) : '';
  return {
    title: esc(c?.name || `Listing #${l.listingId}`), sub: `Asking ${fmtOmr(l.askingPriceOmr)}`, actions: d.seller && open ? `<a class="btn btn-secondary" href="/marketplace/${l.listingId}/edit" data-link>Edit listing</a><button class="btn btn-danger" data-act="cancel-listing" data-id="${l.listingId}" data-back="1">Cancel listing</button>` : '',
    body: `<div class="two-pane"><section class="card card-pad">${camelPhoto(c)}<div class="section-title"><h2>${esc(c?.name || `Camel #${l.camelId}`)}</h2>${sb(l.status)}</div><p>${esc(l.description || '')}</p><div class="info-list">${c ? `${row('Breed', esc(c.breed))}${row('Gender', esc(c.gender))}${row('Born', fmtDate(c.birthDate))}` : ''}${row('Listed', fmtDate(l.createdAt))}</div><div class="actions"><a class="btn btn-secondary" href="/camels/${l.camelId}/profile" data-link>Camel profile</a></div></section><aside class="card card-pad"><div class="price">${fmtOmr(l.askingPriceOmr)}</div>${d.seller ? '<p class="form-help">This is your listing.</p>' : buyer}</aside></div>${side}`,
  };
});

// ---- Offers + completed sale ----
const myOffersScreen = () => scr('/marketplace', marketTabs('/offers'), 'My Offers', d => ({
  title: 'My Offers', sub: isAdmin() ? 'All offers on the platform.' : 'Offers you made on listings. Offers on your own listings appear on each listing page.',
  body: d.offers.length ? offerRows(d.offers, true) : emptyCard('No offers yet', 'Browse the marketplace and make your first offer.', '<a class="btn btn-primary" href="/marketplace" data-link>Browse Marketplace</a>'),
}));
const offerScreen = () => scr('/marketplace', marketTabs('/offers'), 'Offer', d => {
  const o = d.offer, l = d.listing, c = d.camel, me = String(state.user.userId);
  const seller = (l && String(l.userId) === me) || isAdmin(), buyer = String(o.userId) === me || isAdmin(), pending = o.status === 'PENDING';
  const done = qparams().completed === '1';
  const sale = o.status === 'ACCEPTED' ? `<section class="card card-pad section"><div class="section-title"><h2>${done ? 'Sale completed' : 'Completed sale'}</h2>${sb('ACCEPTED')}</div><div class="info-list">${row('Sale price', fmtOmr(o.offeredPriceOmr))}${row('Accepted on', fmtDate(o.respondedAt))}${c ? row('Camel', `<a href="/camels/${c.camelId}/profile" data-link>${esc(c.name)}</a>`) : ''}</div>${d.ownership ? `<h3>Ownership after sale</h3><div class="table-wrap"><table><thead><tr><th>Owner</th><th>Share</th><th>From</th><th>To</th><th>Status</th></tr></thead><tbody>${d.ownership.map(h => `<tr><td>${esc(h.ownerName || '—')}</td><td>${esc(h.sharePercent)}%</td><td>${fmtDate(h.startAt)}</td><td>${fmtDate(h.endAt)}</td><td>${h.current ? 'Current' : 'Previous'}</td></tr>`).join('')}</tbody></table></div>` : `<p class="form-help">${String(o.userId) === me ? 'The camel is now in your collection.' : 'Ownership was transferred to the buyer.'}</p>`}<div class="actions">${String(o.userId) === me ? '<a class="btn btn-primary" href="/camels/my" data-link>Go to My Camels</a>' : '<a class="btn btn-secondary" href="/marketplace/history" data-link>Listing history</a>'}</div><p class="form-help">The backend records the sale transaction itself; it has no public endpoint, so trainer-share and net-proceeds figures are not available here.</p></section>` : '';
  return {
    title: `Offer #${o.offerId}`, sub: c ? `On ${esc(c.name)}` : `On listing #${esc(o.listingId)}`, actions: sb(o.status),
    body: `<div class="two-pane"><section class="card card-pad"><h2>Details</h2><div class="info-list">${row('Offered price', fmtOmr(o.offeredPriceOmr))}${row('Status', esc(o.status))}${row('Made on', fmtDate(o.createdAt))}${row('Responded on', fmtDate(o.respondedAt))}${row('Listing', l ? `<a href="/marketplace/${l.listingId}" data-link>#${l.listingId}</a>` : `#${esc(o.listingId)} (closed)`)}${l ? row('Asking price', fmtOmr(l.askingPriceOmr)) : ''}</div></section><aside class="card card-pad"><h2>Actions</h2>${pending ? `<div class="actions">${seller ? `<button class="btn btn-primary" data-act="accept-offer" data-id="${o.offerId}" data-price="${esc(o.offeredPriceOmr)}">Accept offer</button><button class="btn btn-secondary" data-act="decline-offer" data-id="${o.offerId}">Decline</button>` : ''}${buyer ? `<button class="btn btn-secondary" data-act="edit-offer" data-id="${o.offerId}" data-price="${esc(o.offeredPriceOmr)}">Edit price</button><button class="btn btn-danger" data-act="withdraw-offer" data-id="${o.offerId}">Withdraw</button>` : ''}</div>` : '<p class="form-help">This offer has been answered and can no longer be changed.</p>'}</aside></div>${sale}`,
  };
});
const mineScreens = () => ({
  'Camels': camelsScreen, 'My Camels': myCamelsScreen, 'Add Camel': addCamelScreen, 'Camel Profile': camelProfileScreen, 'Edit Camel': editCamelScreen,
  'Camel Ownership History': ownershipScreen, 'Marketplace': marketScreen, 'Create Listing': createListingScreen, 'My Listings': myListingsScreen,
  'Listing History': historyScreen, 'Listing Detail': listingScreen, 'Edit Listing': editListingScreen, 'My Offers': myOffersScreen, 'Offer Detail': offerScreen,
});

// ---- Modals, forms and actions (delegated once on #app) ----
const closeModal = () => $('#modal')?.remove();
function openModal(html) { closeModal(); document.body.insertAdjacentHTML('beforeend', `<div class="modal-backdrop" id="modal"><div class="modal">${html}</div></div>`); $('#close-modal')?.addEventListener('click', closeModal); }
function confirmModal(title, msg, label, danger, run) {
  openModal(`<h2>${title}</h2><p>${msg}</p><div class="modal-actions"><button class="btn btn-secondary" id="close-modal" type="button">Cancel</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-btn" type="button">${label}</button></div>`);
  $('#confirm-btn').addEventListener('click', async e => { e.currentTarget.disabled = true; try { await run(); closeModal(); } catch (err) { failure(err); e.currentTarget.disabled = false; } });
}
function offerModal(kind, id, price) {
  openModal(`<h2>${kind === 'add' ? 'Make an offer' : 'Edit your offer'}</h2><p>Enter your price in OMR. The seller can accept or decline.</p><form class="form" data-form="offer-${kind}" data-id="${id}"><div class="field"><label>Offered price (OMR)</label><input class="input" type="number" name="offeredPriceOmr" required min="0.001" step="any" value="${esc(price || '')}"></div><div class="modal-actions"><button class="btn btn-secondary" id="close-modal" type="button">Cancel</button><button class="btn btn-primary" type="submit">${kind === 'add' ? 'Submit offer' : 'Save'}</button></div></form>`);
}
function failure(err) { toast(err.message || 'Request failed.', 'error'); if (err.status === 401) go('/signin'); }
const withQuery = (patch) => { const q = { ...qparams(), ...patch }; if (!q.page || q.page === '0') delete q.page; return location.pathname + buildQuery(q); };

async function onMineSubmit(e) {
  const form = e.target.closest?.('form[data-form]'); if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form, id = form.dataset.id, f = Object.fromEntries(new FormData(form)), btn = form.querySelector('[type=submit]');
  if (kind === 'camel-filter') return go('/camels' + buildQuery(f));
  if (kind === 'market-filter') return go('/marketplace' + buildQuery(f));
  if (btn) btn.disabled = true;
  try {
    if (kind === 'camel-add') { const newId = await camelApi.add(toCamelPayload(f)); toast('Camel registered.', 'success'); go(`/camels/${newId}/profile`); }
    else if (kind === 'camel-edit') { await camelApi.update(toCamelPayload(f, id)); toast('Camel updated.', 'success'); go(`/camels/${id}/profile`); }
    else if (kind === 'listing-add') { const newId = await marketplaceApi.add(toListingPayload(f)); toast('Listing published.', 'success'); go(`/marketplace/${newId}`); }
    else if (kind === 'listing-edit') { await marketplaceApi.update(toListingPayload(f, id)); toast('Listing updated.', 'success'); go(`/marketplace/${id}`); }
    else if (kind === 'offer-add') { await offerApi.add(toOfferCreatePayload(f.offeredPriceOmr, id)); closeModal(); toast('Offer submitted.', 'success'); go('/offers'); }
    else if (kind === 'offer-edit') { await offerApi.update(toOfferUpdatePayload(f.offeredPriceOmr, id)); closeModal(); toast('Offer updated.', 'success'); refresh(); }
  } catch (err) { failure(err); if (btn) btn.disabled = false; }
}
function onMineClick(e) {
  const el = e.target.closest?.('[data-act]'); if (!el) return;
  const { act, id, price, listing, page } = el.dataset;
  if (act === 'retry') return refresh();
  if (act === 'page') return go(withQuery({ page }));
  if (act === 'make-offer') return signedIn() ? offerModal('add', listing, price) : (toast('Sign in to make an offer.', 'error'), go('/signin'));
  if (act === 'edit-offer') return offerModal('edit', id, price);
  if (act === 'delete-camel') return confirmModal('Delete camel?', `This removes ${esc(el.dataset.name)} from the registry. Only the full owner can do this.`, 'Delete', true, async () => { await camelApi.remove(id); toast('Camel deleted.', 'success'); go('/camels/my'); });
  if (act === 'cancel-listing') return confirmModal('Cancel listing?', 'The listing will be removed from the marketplace. A sold listing cannot be cancelled.', 'Cancel listing', true, async () => { await marketplaceApi.cancel(id); toast('Listing cancelled.', 'success'); el.dataset.back ? go('/marketplace/my-listings') : refresh(); });
  if (act === 'withdraw-offer') return confirmModal('Withdraw offer?', 'Only pending offers can be withdrawn.', 'Withdraw', true, async () => { await offerApi.withdraw(id); toast('Offer withdrawn.', 'success'); location.pathname.startsWith('/offers/') ? go('/offers') : refresh(); });
  if (act === 'decline-offer') return confirmModal('Decline offer?', 'The buyer will see this offer as declined.', 'Decline', true, async () => { await offerApi.decline(id); toast('Offer declined.', 'success'); refresh(); });
  if (act === 'accept-offer') return confirmModal('Accept this offer?', `Selling for ${fmtOmr(price)} closes the listing, declines other pending offers and transfers 100% ownership to the buyer. This cannot be undone.`, 'Accept & complete sale', false, async () => { await offerApi.accept(id); toast('Sale completed. Ownership transferred.', 'success'); go(`/offers/${id}?completed=1`); });
}
root.addEventListener('submit', onMineSubmit);
root.addEventListener('click', onMineClick);

function notFound(){ return shell(`<section class="card error"><div class="state-icon">!</div><h2>Page not found</h2><p>This route is not part of Mohammed's assigned frontend scope.</p><a class="btn btn-primary" href="/home" data-link>Go Home</a></section>`); }

function screen(match){ const {name}=match.route, p=match.params; return {
 'Landing / Entry Page':landing,
 'Sign In':()=>auth('signin'),'Create Account':()=>auth('signup'),'Forgot Password':()=>auth('forgot'),'Reset Password':()=>auth('reset'),
 'Home / Overview':home,'Settings / User Profile':settings,'Trainer Profile':trainer,'Challenges':challenges,
 'Challenge Detail + Voting':()=>challenge(p.id),'Training Log':training,'Admin Dashboard':admin,'Pedigree Section':()=>pedigree(p.id),
 'Race Card Publish Control':()=>publishRaceCard(p.id),'Organizations UI':organizations,'Tourism / Cultural Content UI':tourism,
 'Race Card Public / History UI':raceCards,
 ...mineScreens()
 }[name] || notFound; }

function render(){ const path=normalizePath(); const match=matchRoute(path); loadView(match); root.innerHTML = match ? screen(match)() : notFound(); document.documentElement.lang=state.lang; document.documentElement.dir=state.lang==='ar'?'rtl':'ltr'; bind(); }
function bind(){
 document.querySelectorAll('[data-link]').forEach(a=>a.addEventListener('click',e=>{ if(!e.ctrlKey&&!e.metaKey){e.preventDefault();go(a.getAttribute('href'));} }));
 $('#lang-toggle')?.addEventListener('click',()=>{state.lang=state.lang==='en'?'ar':'en';localStorage.setItem('medhmar-lang',state.lang);render();});
 $('#auth-form')?.addEventListener('submit',handleAuth); $('#settings-form')?.addEventListener('submit',handleSettings); $('#logout-btn')?.addEventListener('click',handleLogout);
 document.querySelectorAll('.vote-btn').forEach(b=>b.addEventListener('click',handleVote)); $('#add-training-btn')?.addEventListener('click',showTrainingModal);
 $('#publish-race-card')?.addEventListener('click',handlePublish); document.querySelectorAll('.manage-user').forEach(b=>b.addEventListener('click',()=>showUserModal(b.dataset.user)));
}
async function handleAuth(e){ e.preventDefault(); const kind=e.currentTarget.dataset.kind, f=Object.fromEntries(new FormData(e.currentTarget)); try{ if(kind==='signin'){state.user=await authApi.login({email:f.email,password:f.password}); toast('Signed in successfully.','success');go('/home');} else if(kind==='signup'){await authApi.register(f);toast('Account created.','success');go('/signin');} else if(kind==='forgot'){await authApi.forgot(f.email);toast('If the account exists, a reset link will be sent.','success');} else {if(f.password!==f.confirmPassword) throw new Error('Passwords do not match.'); const token=new URLSearchParams(location.hash.slice(1)).get('token')||'preview-token'; await authApi.reset(token,f.password);toast('Password reset successfully.','success');go('/signin');}}catch(err){toast(err.message,'error');} }
async function handleLogout(){ try{await authApi.logout();}catch{} state.user={...guestUser}; toast('Signed out.','success'); go('/signin'); }
async function handleSettings(e){ e.preventDefault(); const f=Object.fromEntries(new FormData(e.currentTarget)); try{state.user=await authApi.updateMe(f)||{...state.user,...f};toast('Profile updated.','success');}catch{state.user={...state.user,...f};toast('Backend unavailable; preview updated locally.','error');} render(); }
async function handleVote(e){ const b=e.currentTarget; if(!state.user?.userId){toast('Sign in before voting.','error');go('/signin');return;} b.disabled=true; try{await challengeApi.vote(b.dataset.challenge,Number(b.dataset.camel)); const updated=await challengeApi.one(b.dataset.challenge); state.challengeDetail=updated; state.challenges=state.challenges.map(c=>String(c.challengeId)===String(updated.challengeId)?updated:c); toast('Vote recorded successfully.','success'); render();}catch(err){toast(err.message,'error');b.disabled=false;} }
async function handlePublish(e){ const b=e.currentTarget;b.disabled=true;try{await raceCardApi.publish(b.dataset.race);toast('New immutable race-card version published.','success');}catch(err){toast(`${err.message}. Preview data unchanged.`,'error');b.disabled=false;} }
function showTrainingModal(){ document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><h2>Add Training Session</h2><p>Submit only against an active agreement.</p><form id="training-form" class="form"><div class="field"><label>Agreement ID</label><input class="input" name="agreementId" type="number" value="15" required></div><div class="field"><label>Duration</label><input class="input" name="durationMinutes" type="number" value="45" min="1" max="720" required></div><div class="field"><label>Notes</label><textarea class="textarea" name="notes" required>Endurance training session.</textarea></div><div class="modal-actions"><button type="button" class="btn btn-secondary" id="close-modal">Cancel</button><button class="btn btn-primary">Save</button></div></form></div></div>`); $('#close-modal').onclick=()=>$('#modal').remove(); $('#training-form').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));f.agreementId=Number(f.agreementId);f.durationMinutes=Number(f.durationMinutes);f.sessionAt=new Date().toISOString();try{await trainingApi.add(f);toast('Training session saved.','success');$('#modal').remove();}catch(err){toast(err.message,'error');}}; }
function showUserModal(id){ const u=demo.users.find(x=>String(x.userId)===String(id))||demo.users[0]; document.body.insertAdjacentHTML('beforeend',`<div class="modal-backdrop" id="modal"><div class="modal"><h2>Manage ${esc(u.fullName)}</h2><p>Role and account status changes are security-sensitive.</p><form id="user-form" class="form"><div class="field"><label>Role</label><select class="select" name="role">${['VIEWER','OWNER','TRAINER','ORGANIZER','ADMIN'].map(r=>`<option ${u.roles.includes(r)?'selected':''}>${r}</option>`).join('')}</select></div><div class="field"><label>Status</label><select class="select" name="status">${['ACTIVE','INACTIVE','SUSPENDED'].map(s=>`<option ${u.status===s?'selected':''}>${s}</option>`).join('')}</select></div><div class="modal-actions"><button type="button" class="btn btn-secondary" id="close-modal">Cancel</button><button class="btn btn-primary">Save</button></div></form></div></div>`); $('#close-modal').onclick=()=>$('#modal').remove(); $('#user-form').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));try{await adminApi.roles(u.userId,[f.role]);await adminApi.status(u.userId,f.status);toast('User access updated.','success');$('#modal').remove();}catch(err){toast(err.message,'error');}}; }

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
