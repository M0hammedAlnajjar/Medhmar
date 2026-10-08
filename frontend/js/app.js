import { renderRacesListing, renderRaceDetails, renderRaceParticipants } from "./race-app.js";
import { renderRaceArchive, renderRaceResults, renderRaceRegistration, renderMyRegistrations, renderOrganizerDashboard, renderCreateRace, renderManageRace } from "./race-extra-app.js";
import { authView } from './auth-view.js';
import { syncAssistantDock } from './assistant-view.js';
import { pedigreeView, bindPedigreeImages } from './pedigree-view.js';
import { matchRoute, normalizePath, canAccessRoute } from './routes.js';
import { demo } from './data.js';
import { authApi, challengeApi, adminApi, raceCardApi, trainingApi, camelApi, marketplaceApi, offerApi, agreementApi, auditLogApi, pedigreeApi } from './api.js';
import { GENDERS, CAMEL_STATUSES, buildQuery, hasAnyRole, canManageCamels, fmtOmr, fmtDate, statusTone, isHttpUrl, isFullOwner, toCamelPayload, toListingPayload, toOfferCreatePayload, toOfferUpdatePayload } from './format.js';
import { ENABLE_MOCK_MARKETPLACE, MOCK_CAMELS, getMockListing, isMockListingId, mockMarketplacePage } from './mock-marketplace.js';

const $ = (s, el=document) => el.querySelector(s);
const root = $('#app');
const toastRoot = $('#toast-root');
const guestUser = { fullName: 'Guest', email: '', roles: [] };
let renderEpoch = 0;
const state = {
  adminUsers: null,
  adminPage: 0,
  user: guestUser,
  challenges: [],
  challengeDetail: null,
  challengeError: '',
  view: { key: '', status: 'idle', data: null, error: null },
  lang: localStorage.getItem('medhmar-lang') || 'en'
};
const esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const badge = s => `<span class="badge ${['ACTIVE','OPEN','APPROVED','OFFICIAL'].includes(s)?'success':['PENDING','UPCOMING'].includes(s)?'warning':['SUSPENDED','REJECTED','CLOSED'].includes(s)?'danger':'neutral'}">${esc(s)}</span>`;
const go = p => { history.pushState({},'',p); render(); };
function toast(msg,type=''){ const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=msg; toastRoot.append(el); setTimeout(()=>el.remove(),3200); }


const navItems = [
    ['/home','Home'],
    ['/challenges','Challenges'],
    ['/training','Training'],
    ['/agreements','Agreements'],
    ['/audit-logs','Audit log'],
    ['/organizations','Organizations'],
    ['/tourism','Heritage'],
    ['/races','Races'],
    ['/race-cards','Race Cards'],
    ['/trainer-profile','Trainer'],
    ['/admin','Admin']
];


const navAll = [...navItems.slice(0,7),['/camels','Camels'],['/pedigree','Pedigree'],['/marketplace','Marketplace'],...navItems.slice(7)];
const visibleNavItems = () => navAll.filter(([path]) => canAccessRoute(matchRoute(path)?.route, state.user));
const primaryNavPaths = new Set(['/home','/races','/challenges','/training','/camels','/pedigree','/marketplace']);

function topbar(active='', compact=false){
  const signedIn = Boolean(state.user?.userId);
  const items = visibleNavItems();
  const navLink = ([p,l]) => `<a href="${p}" data-link class="${active===p?'active':''}">${l}</a>`;
  const corePaths = ['/home', '/races', '/camels', '/pedigree', '/marketplace'];
  const desktopItems = compact ? corePaths.map(path => items.find(([p]) => p === path)).filter(Boolean) : items;
  const extraItems = compact ? items.filter(([path]) => !corePaths.includes(path)) : [];
  const moreMenu = extraItems.length ? `<details class="pedigree-more"><summary>More <span aria-hidden="true">⌄</span></summary><div class="pedigree-more-menu">${extraItems.map(navLink).join('')}</div></details>` : '';

  const accountActions = signedIn
    ? `<a class="profile-btn" href="/settings" data-link aria-label="Open profile settings"><span class="avatar">${esc(state.user.fullName?.[0]||'U')}</span><span class="profile-name">${esc(state.user.fullName?.split(' ')[0]||'User')}</span><span class="profile-chevron" aria-hidden="true">⌄</span></a>`
    : `<a class="nav-account nav-account-secondary" href="/signin" data-link>Sign In</a><a class="nav-account nav-account-primary" href="/signup" data-link>Create Account</a>`;

  const searchAction = `<a class="nav-search" href="/races" data-link aria-label="Search races" title="Search races"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="m16 16 4 4"></path></svg></a>`;
  const language = '<span class="nav-language-single" aria-label="English language">EN</span>';
  const mobileMenu = `<details class="nav-mobile"><summary aria-label="Open navigation"><span aria-hidden="true">☰</span></summary><div class="nav-mobile-menu">${items.map(navLink).join('')}</div></details>`;

  return `<header class="topbar"><div class="topbar-inner">
    ${mobileMenu}
    <a class="brand brand-wordmark" href="/" data-link aria-label="Medhmar home"><img src="/assets/medhmar-logo.svg" alt="MEDHMAR — Oman Camel Racing"></a>
    <nav class="nav nav-desktop" aria-label="Primary navigation">${desktopItems.map(navLink).join('')}${moreMenu}</nav>
    <div class="nav-actions" dir="ltr">${searchAction}${accountActions}${language}</div>
  </div></header>`;
}
const head = (t,s,a='') => `<div class="page-head"><div><div class="kicker">MEDHMAR</div><h1>${t}</h1><p>${s}</p></div>${a?`<div class="actions">${a}</div>`:''}</div>`;
const shell = (body,active='', compact=false) => `<div class="app-shell${compact?' pedigree-shell':''}">${topbar(active, compact)}<main class="main">${body}</main><footer>${compact ? 'MEDHMAR • Oman Camel Racing' : 'MEDHMAR • Mohammed frontend scope • Auth / Security / Integration / Pedigree / Challenges / Training Log / Admin / Platform'}</footer></div>`;
const demoNote = () => `<div class="demo-note">Connected screens use the Spring Boot API when available; preview data is shown when it is offline.</div>`;

function landing(){
 // Actual photographs served by Wikimedia Commons. Credits and licenses are
 // linked under the module grid. They are illustrative, not event-specific.
 const photos = {
  hero: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Camel_race_using_robot_jockeys.jpg/1280px-Camel_race_using_robot_jockeys.jpg',
  account: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Camel_of_Oman.jpg',
  community: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8f/Camel_racing.jpg/960px-Camel_racing.jpg',
  training: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Camel_Race_Training.jpg/960px-Camel_Race_Training.jpg',
  platform: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/89/Camels_crossing_the_desert_Wahiba_Sands_Bidiya%2C_Oman_%2853697960088%29.jpg/1280px-Camels_crossing_the_desert_Wahiba_Sands_Bidiya%2C_Oman_%2853697960088%29.jpg'
 };
 const modules = [
  ['ACCOUNT','Secure accounts','Authentication, registration and passwords for a safe and personalized experience.','/signin',photos.account,'Secure'],
  ['COMMUNITY','Challenges & voting','Published camel challenges, community voting and leaderboards.','/challenges',photos.community,'Live'],
  ['TRAINER TOOLS','Training records','Chronological trainer session logs, performance notes and progress tracking.','/training',photos.training,'Training'],
  ['PLATFORM','Platform operations','Race cards, organizations, heritage and more to keep Medhmar running smoothly.','/race-cards',photos.platform,'Explore']
 ];
 return '<div class="app-shell landing-page">' + topbar() +
 '<main class="landing-hero" aria-labelledby="landing-title">' +
 '<section class="landing-editorial">' +
 '<div class="landing-brandline"><span class="landing-rule"></span><div><div class="landing-wordmark">MEDHMAR</div><div class="landing-eyebrow">OMAN\'S CAMEL RACING COMMUNITY</div></div></div>' +
 '<div class="landing-copy"><h1 id="landing-title">Where tradition<br>races into<br><em>the future.</em></h1>' +
 '<p>Races. Camels. Heritage. Community.<br>Experience Oman\'s living legacy and a new generation of racing excellence.</p>' +
 '<div class="landing-hero-actions"><a class="landing-primary" href="/race-cards" data-link>Explore Races</a><a class="landing-secondary" href="/tourism" data-link>Discover Heritage</a></div></div>' +
 '<div class="landing-signature"><span class="landing-signature-line"></span><span>PEOPLE</span><b>×</b><span>CAMELS</span><b>×</b><span>OMAN</span><b>×</b><span>A BRIGHTER TOMORROW</span><img class="landing-landscape" src="/assets/oman-line.svg" alt="" aria-hidden="true"></div>' +
 '</section>' +
 '<section class="landing-visual" aria-label="Camel race in Oman">' +
 '<img class="landing-race-photo" src="'+photos.hero+'" alt="Actual photograph of racing camels with robotic jockeys" fetchpriority="high" decoding="async" referrerpolicy="no-referrer">' +
 '<div class="landing-photo-wash" aria-hidden="true"></div>' +
 '<a class="landing-track-card" href="/race-cards" data-link aria-label="Open race cards for Sultan Qaboos Race"><div><div class="landing-track-kicker">UP NEXT AT AL SAHWA TRACK</div><strong>Sultan Qaboos Race</strong><span>18 Oct 2024&nbsp; · &nbsp;Al Seeb, Oman</span></div></a>' +
 '</section>' +
 '</main>' +
 '<section class="landing-below main" aria-labelledby="landing-modules-title">' +
 '<div class="landing-section-head"><div><h2 id="landing-modules-title">Platform modules</h2><p>Your essential Medhmar tools in one place.</p></div><a class="landing-view-all" href="/home" data-link>View all modules</a></div>' +
 '<div class="landing-module-grid">' +
 modules.map(([k,t,d,p,img,b],i)=>'<a class="landing-module-card" href="'+p+'" data-link><div class="landing-module-thumb"><img src="'+img+'" alt="" loading="lazy" decoding="async" referrerpolicy="no-referrer"></div><div class="landing-module-body"><div class="landing-module-meta"><span class="landing-module-index">0'+(i+1)+'</span><span>'+k+'</span></div><h3>'+t+'</h3><p>'+d+'</p><span class="landing-module-badge">'+b+'</span></div></a>').join('') +
 '</div>' +
 '<details class="landing-photo-credits"><summary>Photography credits and licenses</summary>' +
 '<p>Real photographs from Oman and other camel-racing regions. Images are illustrative, not photographs of the sample races. They may be cropped to fit the design.</p>' +
 '<ul>' +
 '<li><a href="https://commons.wikimedia.org/wiki/File:Camel_race_using_robot_jockeys.jpg" target="_blank" rel="noopener noreferrer">Camel race with robotic jockeys</a> and <a href="https://commons.wikimedia.org/wiki/File:Camel_racing.jpg" target="_blank" rel="noopener noreferrer">racing camels</a> — Houssain tork, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.</li>' +
 '<li><a href="https://commons.wikimedia.org/wiki/File:Camel_of_Oman.jpg" target="_blank" rel="noopener noreferrer">Camel in Oman</a> — Desertroad, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.</li>' +
 '<li><a href="https://commons.wikimedia.org/wiki/File:Camel_Race_Training.jpg" target="_blank" rel="noopener noreferrer">Training camels</a> — Lintophilip, <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>.</li>' +
 '<li><a href="https://commons.wikimedia.org/wiki/File:Camels_crossing_the_desert_Wahiba_Sands_Bidiya,_Oman_(53697960088).jpg" target="_blank" rel="noopener noreferrer">Camels in the Wahiba Sands, Oman</a> — dronepicr, <a href="https://creativecommons.org/licenses/by/2.0/" target="_blank" rel="noopener noreferrer">CC BY 2.0</a>.</li>' +
 '</ul></details>' +
 '</section>' +
 '</div>';
}

const auth = authView;

function home() {
  const firstName = esc(state.user?.fullName?.trim().split(/\s+/)[0] || 'Guest');
  const greeting = state.user?.userId ? `Welcome back, ${firstName}.` : 'Welcome to Medhmar.';

  const discoveries = [
    {
      path: '/races',
      eyebrow: '01 / THE RACE',
      title: 'Every race has a story.',
      description: 'Find races, participants and results.',
      image: '/assets/racing-hero.webp',
      alt: 'Camels racing on an Omani track',
    },
    {
      path: '/camels',
      eyebrow: '02 / THE CHAMPIONS',
      title: 'Meet the camels.',
      description: 'Get to know the athletes of the track.',
      image: '/assets/mock-camels/camel-1.jpg',
      alt: 'Portrait of a racing camel',
    },
    {
      path: '/pedigree',
      eyebrow: '03 / THE LEGACY',
      title: 'Explore their lineage.',
      description: 'Discover family trees and heritage.',
      image: '/assets/mock-camels/camel-3.jpg',
      alt: 'Camel in the desert',
    },
  ];
  const discoveryCards = discoveries.map(card => `
    <a class="home-discovery-card" href="${card.path}" data-link>
      <img src="${card.image}" alt="${esc(card.alt)}" loading="lazy" decoding="async">
      <span class="home-discovery-shade" aria-hidden="true"></span>
      <span class="home-discovery-top">${card.eyebrow}</span>
      <span class="home-discovery-copy">
        <strong>${card.title}</strong>
        <span>${card.description}</span>
      </span>
    </a>
  `).join('');

  const shortcutPaths = new Set([
    '/challenges', '/training', '/agreements', '/race-cards',
    '/organizations', '/trainer-profile', '/admin', '/audit-logs',
  ]);
  const shortcuts = visibleNavItems()
    .filter(([path]) => shortcutPaths.has(path))
    .map(([path, label], i) => `
      <a class="home-shortcut" href="${path}" data-link>
        <span class="home-shortcut-index">${String(i + 1).padStart(2, '0')}</span>
        <span class="home-shortcut-name">${esc(label)}</span>
        <span class="home-shortcut-arrow" aria-hidden="true">↗</span>
      </a>
    `).join('');

  return shell(`
    <div class="home-experience" lang="en" dir="ltr">
      <header class="home-intro">
        <div>
          <p class="home-overline"><span aria-hidden="true"></span> YOUR RACING HUB</p>
          <h1>${greeting}</h1>
        </div>
        <a href="/races" data-link class="home-intro-link">Explore race calendar <span aria-hidden="true">↗</span></a>
      </header>

      <section class="home-section" aria-labelledby="home-discover-title">
        <div class="home-section-header">
          <div>
            <p class="home-overline">DISCOVER MEDHMAR</p>
            <h2 id="home-discover-title">A world beyond the finish line.</h2>
            <p>Explore the moments and stories that make camel racing special.</p>
          </div>
          <span class="home-section-number">01 — EXPLORE</span>
        </div>
        <div class="home-discovery-grid">${discoveryCards}</div>
      </section>

      <section class="home-workspace" aria-labelledby="home-tools-title">
        <div class="home-tools">
          <div class="home-section-header home-tools-header">
            <div>
              <p class="home-overline">YOUR WORKSPACE</p>
              <h2 id="home-tools-title">Everything within reach.</h2>
              <p>Jump into the platform tools available to your account.</p>
            </div>
          </div>
          <div class="home-shortcuts">${shortcuts}</div>
        </div>
        <a class="home-heritage" href="/tourism" data-link>
          <img src="/assets/racing-hero.webp" alt="Camels on a racing track in Oman" loading="lazy" decoding="async">
          <span class="home-heritage-overlay" aria-hidden="true"></span>
          <span class="home-heritage-copy">
            <span>BEYOND RACE DAY</span>
            <strong>Discover the<br>heritage of Oman.</strong>
            <span class="home-heritage-cta">Explore our story <span aria-hidden="true">↗</span></span>
          </span>
        </a>
      </section>
    </div>
  `, '/home');
}

function settings() {
  const user = state.user || guestUser;
  const roles = Array.isArray(user.roles) ? user.roles : [];
  return shell(`${head('Profile & Settings', 'Manage your profile and account preferences.')}
    <div class="settings-account-layout">
      <div class="settings-profile-stack">
        <section class="card profile-hero settings-profile-card" aria-label="Account profile">
          <div class="profile-avatar">${esc(user.fullName?.[0] || 'M')}</div>
          <div class="settings-profile-copy">
            <div class="kicker">YOUR ACCOUNT</div>
            <h2>${esc(user.fullName || 'Guest')}</h2>
            <p>${esc(user.email || 'Sign in to view your account details.')}</p>
            <div class="actions">${roles.map(badge).join('')}</div>
          </div>
        </section>
        <section class="card card-pad settings-preferences">
          <div class="kicker">ACCOUNT PREFERENCES</div>
          <h2>Personal information</h2>
          <p>Update your profile and preferred language.</p>
          <form id="settings-form" class="form">
            <div class="field"><label for="settings-fullname">Full Name</label>
              <input class="input" id="settings-fullname" name="fullName" autocomplete="name" value="${esc(user.fullName || '')}" maxlength="150"></div>
            <div class="field"><label for="settings-language">Preferred Language</label>
              <select class="select" id="settings-language" name="preferredLanguage">
                <option value="en" ${state.lang === 'en' ? 'selected' : ''}>English</option>
                <option value="ar" ${state.lang === 'ar' ? 'selected' : ''}>العربية</option>
              </select>
            </div>
            <div class="settings-preferences-actions">
              <button class="btn btn-primary" type="submit">Save Changes</button>
              <button class="btn btn-secondary" type="button" id="logout-btn">Sign Out</button>
            </div>
          </form>
        </section>
      </div>
    </div>
  `, '/settings');
}

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
function denyRoleAccess(route) {
 if(!state.user?.userId) { history.replaceState({},'', '/signin');root.innerHTML=auth('signin');return; }
 const roles=(route?.roles||[]).map(role=>role.toLowerCase()).join(' or ');
 root.innerHTML=shell(`<section class="card permission"><div class="state-icon">403</div><h1>Access denied</h1><p>This page is available to ${esc(roles)} accounts.</p><a class="btn btn-primary" href="/home" data-link>Back to Home</a></section>`);
}

function pedigree(){ return shell(pedigreeView(state.view), '/camels', true); }

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
const canManageAgreements = () => isAdmin() || hasAnyRole(state.user, 'OWNER');
const canAcceptAgreement = agreement => hasAnyRole(state.user, 'TRAINER')
  && String(state.user?.userId) === String(agreement?.trainerUserId)
  && agreement?.status === 'PENDING_APPROVAL';
const blankView = () => ({ key: '', status: 'idle', data: null, error: null });
const refresh = () => { state.view = blankView(); render(); };
const needAuth = () => { if (!signedIn()) throw Object.assign(new Error('Sign in to continue.'), { status: 401 }); };
async function camelMap(ids) {
  const out = {};
  await Promise.all([...new Set(ids.filter(Boolean))].map(id => camelApi.one(id).then(c => { out[id] = c; }).catch(() => {})));
  return out;
}

const loaders = {
  'Pedigree Directory': async () => {
    const q = qparams();
    return {
      q,
      page: await camelApi.list({
        page: q.page || 0,
        size: 12,
        search: q.search,
        gender: q.gender,
        breed: q.breed,
        category: q.category,
        status: q.status,
      }),
    };
  },
  'Pedigree Section': async p => {
    const tree = await pedigreeApi.tree(p.id);
    let canEdit = false;
    if (signedIn() && canManageCamels(state.user)) {
      if (isAdmin()) canEdit = true;
      else {
        const mine = await camelApi.mine().catch(() => []);
        canEdit = mine.some(c => String(c.camelId) === String(p.id));
      }
    }
    return { tree, canEdit };
  },
  'Edit Pedigree': async p => {
    needAuth();
    const minePromise = isAdmin() ? Promise.resolve([]) : camelApi.mine().catch(() => []);
    const [pedigree, camel, candidatesPage, mine] = await Promise.all([
      pedigreeApi.get(p.id),
      camelApi.one(p.id),
      camelApi.list({ page: 0, size: 100 }),
      minePromise,
    ]);
    return {
      pedigree,
      camel,
      candidates: candidatesPage?.content || [],
      canEdit: isAdmin() || mine.some(c => String(c.camelId) === String(p.id)),
    };
  },
  'Training Agreements': async () => ({ agreements: isAdmin() ? await agreementApi.list() : await agreementApi.mine() }),
  'Add Training Agreement': async () => ({}),
  'Training Agreement Details': async p => ({ agreement: await agreementApi.one(p.id) }),
  'Edit Training Agreement': async p => ({ agreement: await agreementApi.one(p.id) }),
  'Audit Logs': async () => ({ logs: await auditLogApi.list() }),
  'Add Audit Log': async () => ({}),
  'Audit Log Details': async p => ({ log: await auditLogApi.one(p.id) }),
  'Edit Audit Log': async p => ({ log: await auditLogApi.one(p.id) }),
  'Camels': async () => { const q = qparams(); return { q, page: await camelApi.list({ page: q.page || 0, size: 12, search: q.search, gender: q.gender, breed: q.breed, category: q.category, status: q.status }) }; },
  'My Camels': async () => { needAuth(); return { camels: await camelApi.mine() }; },
  'Add Camel': async () => { needAuth(); return {}; },
  'Camel Profile': async p => {
    const [profile, mine] = await Promise.all([camelApi.profile(p.id), signedIn() ? camelApi.mine().catch(() => []) : []]);
    return { profile, isOwner: mine.some(c => String(c.camelId) === String(p.id)) };
  },
  'Edit Camel': async p => { needAuth(); return { camel: await camelApi.one(p.id) }; },
  'Camel Ownership History': async p => { const [camel, history] = await Promise.all([camelApi.one(p.id), camelApi.ownership(p.id)]); return { camel, history }; },
  'Marketplace': async () => { const q = qparams(); if (ENABLE_MOCK_MARKETPLACE) { const page = mockMarketplacePage({ page: q.page || 0, size: 12, search: q.search, minPrice: q.minPrice, maxPrice: q.maxPrice }); return { q, page, camels: MOCK_CAMELS }; } const page = await marketplaceApi.list({ page: q.page || 0, size: 12, search: q.search, minPrice: q.minPrice, maxPrice: q.maxPrice }); return { q, page, camels: await camelMap(page.content.map(l => l.camelId)) }; },
  'Create Listing': async () => { needAuth(); return { camels: await camelApi.mine(), camelId: qparams().camelId }; },
  'My Listings': async () => { needAuth(); const listings = await marketplaceApi.mine(); return { listings, camels: await camelMap(listings.map(l => l.camelId)) }; },
  'Listing History': async () => { needAuth(); const listings = await marketplaceApi.history(); return { listings, camels: await camelMap(listings.map(l => l.camelId)) }; },
  'Listing Detail': async p => {
    if (isMockListingId(p.id)) { const listing = getMockListing(p.id); const camel = MOCK_CAMELS[listing.camelId]; return { listing, camel, seller: false, offers: null, myOffer: null, mock: true }; }
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
  const key = normalizePath() + location.search;
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
const camelPhoto = c => { const fallback = "/assets/mock-camels/camel-" + ((((Number(c?.camelId) || 1) - 1) % 8) + 1) + ".jpg"; const src = isHttpUrl(c?.photoUrl) ? c.photoUrl : fallback; return '<img class="camel-thumb" src="' + esc(src) + '" alt="' + esc(c?.name || "Camel") + '" loading="lazy" referrerpolicy="no-referrer">'; };
const row = (l, v) => `<div class="info-row"><span>${l}</span><strong>${v}</strong></div>`;
const pager = pg => pg.totalPages > 1 ? `<div class="pager"><button class="small-btn" data-act="page" data-page="${pg.page - 1}" ${pg.page <= 0 ? 'disabled' : ''}>← Previous</button><span>Page ${pg.page + 1} of ${pg.totalPages} • ${pg.totalElements} results</span><button class="small-btn" data-act="page" data-page="${pg.page + 1}" ${pg.page + 1 >= pg.totalPages ? 'disabled' : ''}>Next →</button></div>` : '';
const opts = (list, cur, any) => `${any ? `<option value="">${any}</option>` : ''}${list.map(x => `<option ${x === cur ? 'selected' : ''}>${x}</option>`).join('')}`;

const pedigreeParentOptions = (candidates, gender, selectedId, child) => {
  const childBirth = child?.birthDate ? new Date(child.birthDate).getTime() : null;
  const valid = (candidates || [])
    .filter(c => String(c.camelId) !== String(child?.camelId))
    .filter(c => c.gender === gender)
    .filter(c => c.status === 'ACTIVE')
    .filter(c => !childBirth || !c.birthDate || new Date(c.birthDate).getTime() < childBirth)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  return `<option value="">Not linked to a registered camel</option>${valid.map(c => `<option value="${esc(c.camelId)}" ${String(c.camelId) === String(selectedId ?? '') ? 'selected' : ''}>${esc(c.name)} — #${esc(c.camelId)}${c.breed ? ` · ${esc(c.breed)}` : ''}</option>`).join('')}`;
};

const pedigreeEditScreen = () => scr('/camels', camelTabs(''), 'Edit Pedigree', d => {
  const camel = d.camel || {};
  const pedigree = d.pedigree || {};
  if (!d.canEdit) {
    return {
      title: `Pedigree — ${esc(camel.name || `Camel #${camel.camelId || ''}`)}`,
      sub: 'Registered parent links can only be changed by the camel owner or an administrator.',
      body: errorCard({ status: 403, message: 'You do not own this camel.' }),
    };
  }
  const sireOptions = pedigreeParentOptions(d.candidates, 'MALE', pedigree.sireCamelId, camel);
  const damOptions = pedigreeParentOptions(d.candidates, 'FEMALE', pedigree.damCamelId, camel);
  const legacySire = !pedigree.sireCamelId && pedigree.sire ? `<p class="form-help">Current unregistered sire name: <strong>${esc(pedigree.sire)}</strong></p>` : '';
  const legacyDam = !pedigree.damCamelId && pedigree.dam ? `<p class="form-help">Current unregistered dam name: <strong>${esc(pedigree.dam)}</strong></p>` : '';
  return {
    title: `Edit pedigree — ${esc(camel.name || `Camel #${camel.camelId}`)}`,
    sub: 'Link the camel to registered parents. The server validates gender, age, ownership and circular ancestry.',
    actions: `<a class="btn btn-secondary" href="/camels/${esc(camel.camelId)}" data-link>Back to pedigree</a>`,
    body: `<form class="form card card-pad" data-form="pedigree-edit" data-id="${esc(camel.camelId)}">
      <div class="field">
        <label for="pedigree-sire">Sire (father)</label>
        <select id="pedigree-sire" class="select" name="sireCamelId">${sireOptions}</select>
        ${legacySire}
        <span class="form-help">Only active male camels born before this camel are shown.</span>
      </div>
      <div class="field">
        <label for="pedigree-dam">Dam (mother)</label>
        <select id="pedigree-dam" class="select" name="damCamelId">${damOptions}</select>
        ${legacyDam}
        <span class="form-help">Only active female camels born before this camel are shown.</span>
      </div>
      <div class="form-feedback" aria-live="polite"></div>
      <div class="modal-actions">
        <a class="btn btn-secondary" href="/camels/${esc(camel.camelId)}" data-link>Cancel</a>
        <button class="btn btn-primary" type="submit">Save pedigree</button>
      </div>
    </form>`,
  };
});

// ---- TrainingAgreement and auditLog entity screens ----
const agreementStatuses = ['DRAFT','PENDING_APPROVAL','APPROVED','ACTIVE','REJECTED','TERMINATED','COMPLETED','EXPIRED'];
const isoInput = value => { if(!value) return ''; const d=new Date(value); d.setMinutes(d.getMinutes()-d.getTimezoneOffset()); return d.toISOString().slice(0,16); };
const agreementForm = (a = {}, edit = false) => `<form class="form card card-pad entity-form" data-form="agreement-${edit?'edit':'add'}" data-id="${esc(a.agreementId||'')}">
<h2>Participants & schedule</h2>${!edit?`<div class="form-row"><div class="field"><label for="agreement-camel">Camel ID <span class="required">*</span></label><input id="agreement-camel" class="input" name="camelId" type="number" min="1" required placeholder="e.g. 204" value="${esc(a.camelId||'')}"></div><div class="field"><label for="agreement-trainer">Trainer user ID <span class="required">*</span></label><input id="agreement-trainer" class="input" name="trainerUserId" type="number" min="1" required placeholder="Trainer account ID" value="${esc(a.trainerUserId||'')}"></div></div>`:`<div class="form-row">${row('Camel',`#${esc(a.camelId)}`)}${row('Trainer',`#${esc(a.trainerUserId)}`)}</div>`}
<div class="form-row"><div class="field"><label for="agreement-start">Start date <span class="required">*</span></label><input id="agreement-start" class="input" name="startsAt" type="datetime-local" required value="${isoInput(a.startsAt)}"></div><div class="field"><label for="agreement-end">End date <span class="required">*</span></label><input id="agreement-end" class="input" name="endsAt" type="datetime-local" required value="${isoInput(a.endsAt)}"></div></div>
<h2>Compensation</h2><div class="form-row"><div class="field"><label for="agreement-fee">Training fee (OMR) <span class="required">*</span></label><input id="agreement-fee" class="input" name="feeOmr" type="number" min="0" step="0.001" required placeholder="0.000" value="${esc(a.feeOmr??'')}"></div><div class="field"><label for="agreement-prize">Prize share (%) <span class="required">*</span></label><input id="agreement-prize" class="input" name="prizeSharePct" type="number" min="0" max="100" step="0.01" required placeholder="0.00" value="${esc(a.prizeSharePct??'')}"></div></div><div class="field"><label for="agreement-sale">Sale share (%) <span class="required">*</span></label><input id="agreement-sale" class="input" name="saleSharePct" type="number" min="0" max="100" step="0.01" required placeholder="0.00" value="${esc(a.saleSharePct??'')}"></div><div class="field"><label for="agreement-terms">Terms</label><textarea id="agreement-terms" class="textarea" name="terms" maxlength="5000" placeholder="Describe the training arrangement and expectations">${esc(a.terms||'')}</textarea><span class="form-help">Optional · up to 5,000 characters</span></div><div class="form-feedback" aria-live="polite"></div><div class="modal-actions"><a class="btn btn-secondary" href="${edit?`/agreements/${esc(a.agreementId)}`:'/agreements'}" data-link>Cancel</a><button class="btn btn-primary" type="submit">${edit?'Save Changes':'Create Agreement'}</button></div></form>`;
const auditForm = (a = {}, edit = false) => `<form class="form card card-pad entity-form" data-form="audit-${edit?'edit':'add'}" data-id="${esc(a.auditId||'')}"><h2>Audit event details</h2><div class="form-row"><div class="field"><label for="audit-action">Action type <span class="required">*</span></label><input id="audit-action" class="input" name="actionType" required maxlength="50" placeholder="e.g. CREATED" value="${esc(a.actionType||'')}"></div><div class="field"><label for="audit-type">Entity type <span class="required">*</span></label><input id="audit-type" class="input" name="entityType" required maxlength="50" placeholder="e.g. TrainingAgreement" value="${esc(a.entityType||'')}"></div></div><div class="form-row"><div class="field"><label for="audit-entity-id">Entity ID <span class="required">*</span></label><input id="audit-entity-id" class="input" name="entityId" type="number" min="1" required placeholder="Related record ID" value="${esc(a.entityId||'')}"></div><div class="field"><label for="audit-camel-id">Camel ID <span class="required">*</span></label><input id="audit-camel-id" class="input" name="camelId" type="number" min="1" required placeholder="Related camel ID" value="${esc(a.camelId||'')}"></div></div><div class="field"><label for="audit-description">Description</label><textarea id="audit-description" class="textarea" name="description" placeholder="Additional context for this event">${esc(a.description||'')}</textarea></div>${edit?`<p class="form-help">Recorded ${fmtDate(a.createdAt)} · audit timestamp is server managed</p>`:''}<div class="form-feedback" aria-live="polite"></div><div class="modal-actions"><a class="btn btn-secondary" href="${edit?`/audit-logs/${esc(a.auditId)}`:'/audit-logs'}" data-link>Cancel</a><button class="btn btn-primary" type="submit">${edit?'Save Changes':'Create Audit Entry'}</button></div></form>`;
const agreementScreen = () => scr('/agreements', '', 'Training Agreements', d => { const q=qparams(), all=d.agreements||[], filtered=all.filter(a=>(!q.search||`${a.agreementId} ${a.camelId} ${a.trainerUserId} ${a.ownerUserId}`.toLowerCase().includes(q.search.toLowerCase()))&&(!q.status||a.status===q.status));filtered.sort((a,b)=>q.sort==='oldest'?Number(a.agreementId)-Number(b.agreementId):Number(b.agreementId)-Number(a.agreementId)); return {title:'Training Agreements',sub:'Manage camel training terms, participants and active periods.',actions:canManageAgreements()?'<a class="btn btn-primary" href="/agreements/new" data-link>+ Add Agreement</a>':'',body:`<form class="toolbar" data-form="agreement-filter"><input class="input" name="search" aria-label="Search agreements" placeholder="Search camel, trainer or agreement ID" value="${esc(q.search||'')}"><select class="select" name="status" aria-label="Filter by status">${opts(agreementStatuses,q.status,'All statuses')}</select><select class="select" name="sort" aria-label="Sort agreements"><option value="newest" ${q.sort!=='oldest'?'selected':''}>Newest first</option><option value="oldest" ${q.sort==='oldest'?'selected':''}>Oldest first</option></select><button type="submit" class="btn btn-primary">Filter</button></form>${filtered.length?`<div class="table-wrap"><table><thead><tr><th>Agreement</th><th>Camel</th><th>Trainer</th><th>Period</th><th>Fee</th><th>Status</th><th>Actions</th></tr></thead><tbody>${filtered.map(a=>`<tr><td><strong>#${esc(a.agreementId)}</strong></td><td>#${esc(a.camelId)}</td><td>#${esc(a.trainerUserId)}</td><td>${fmtDate(a.startsAt)} – ${fmtDate(a.endsAt)}</td><td>${fmtOmr(a.feeOmr)}</td><td>${sb(a.status)}</td><td class="table-actions"><a class="small-btn" href="/agreements/${a.agreementId}" data-link>View</a>${canAcceptAgreement(a)?`<button class="small-btn" data-act="accept-agreement" data-id="${esc(a.agreementId)}">Accept</button>`:''}${canManageAgreements()&&a.status==='PENDING_APPROVAL'?`<a class="small-btn" href="/agreements/${a.agreementId}/edit" data-link>Edit</a>`:''}</td></tr>`).join('')}</tbody></table></div>`:emptyCard('No agreements found','No training agreements match this search or status.',canManageAgreements()?'<a class="btn btn-primary" href="/agreements/new" data-link>Add Agreement</a>':'')}`}; });
const agreementDetailScreen = () => scr('/agreements','','Agreement details',d=>{const a=d.agreement;return {title:`Agreement #${esc(a.agreementId)}`,sub:'Training arrangement and lifecycle details.',actions:`${canAcceptAgreement(a)?`<button class="btn btn-primary" data-act="accept-agreement" data-id="${esc(a.agreementId)}">Accept Agreement</button>`:''}${canManageAgreements()&&a.status==='PENDING_APPROVAL'?`<a class="btn btn-secondary" href="/agreements/${a.agreementId}/edit" data-link>Edit</a>`:''}<a class="btn btn-ghost" href="/agreements" data-link>Back to Agreements</a>`,body:`<div class="grid grid-2"><section class="card card-pad"><h2>Participants & schedule</h2><div class="info-list">${row('Status',sb(a.status))}${row('Owner',`#${esc(a.ownerUserId)}`)}${row('Trainer',`#${esc(a.trainerUserId)}`)}${row('Camel',`#${esc(a.camelId)}`)}${row('Starts',fmtDate(a.startsAt))}${row('Ends',fmtDate(a.endsAt))}${row('Proposed',fmtDate(a.proposedAt))}${row('Responded',fmtDate(a.respondedAt))}</div></section><section class="card card-pad"><h2>Compensation</h2><div class="info-list">${row('Training fee',fmtOmr(a.feeOmr))}${row('Prize share',`${esc(a.prizeSharePct)}%`)}${row('Sale share',`${esc(a.saleSharePct)}%`)}</div></section><section class="card card-pad"><h2>Terms</h2><p class="entity-copy">${esc(a.terms||'No additional terms recorded.')}</p></section><section class="card card-pad"><h2>Lifecycle</h2><div class="info-list">${row('Accepted',fmtDate(a.acceptedAt))}${row('Completed',fmtDate(a.completedAt))}${row('Expired',fmtDate(a.expiredAt))}${row('Terminated',fmtDate(a.terminatedAt))}${row('Rejection reason',esc(a.rejectionReason||'—'))}${row('Termination reason',esc(a.terminationReason||'—'))}</div></section></div>`};});
const auditScreen = () => scr('/audit-logs','','Audit logs',d=>{const q=qparams(), all=d.logs||[], filtered=all.filter(a=>(!q.search||`${a.auditId} ${a.actionType} ${a.entityType} ${a.entityId} ${a.camelId} ${a.description||''}`.toLowerCase().includes(q.search.toLowerCase()))&&(!q.actionType||a.actionType===q.actionType));filtered.sort((a,b)=>q.sort==='oldest'?new Date(a.createdAt)-new Date(b.createdAt):new Date(b.createdAt)-new Date(a.createdAt));const actions=[...new Set(all.map(a=>a.actionType).filter(Boolean))];return {title:'Audit log',sub:'A traceable history of platform events and related camel records.',actions:'<a class="btn btn-primary" href="/audit-logs/new" data-link>+ Add Audit Entry</a>',body:`<form class="toolbar" data-form="audit-filter"><input class="input" name="search" aria-label="Search audit logs" placeholder="Search event, entity or description" value="${esc(q.search||'')}"><select class="select" name="actionType">${opts(actions,q.actionType,'All actions')}</select><select class="select" name="sort" aria-label="Sort audit entries"><option value="newest" ${q.sort!=='oldest'?'selected':''}>Newest first</option><option value="oldest" ${q.sort==='oldest'?'selected':''}>Oldest first</option></select><button class="btn btn-primary">Filter</button></form>${filtered.length?`<div class="table-wrap"><table><thead><tr><th>Event</th><th>Action</th><th>Entity</th><th>Camel</th><th>Recorded</th><th>Actions</th></tr></thead><tbody>${filtered.map(a=>`<tr><td><strong>#${esc(a.auditId)}</strong></td><td>${esc(a.actionType)}</td><td>${esc(a.entityType)} #${esc(a.entityId)}</td><td>#${esc(a.camelId)}</td><td>${fmtDate(a.createdAt)}</td><td class="table-actions"><a class="small-btn" href="/audit-logs/${a.auditId}" data-link>View</a><a class="small-btn" href="/audit-logs/${a.auditId}/edit" data-link>Edit</a><button class="small-btn" data-act="delete-audit" data-id="${esc(a.auditId)}">Delete</button></td></tr>`).join('')}</tbody></table></div>`:emptyCard('No audit entries','There are no audit entries matching the current filters.','<a class="btn btn-primary" href="/audit-logs/new" data-link>Add Audit Entry</a>')}`};});
const auditDetailScreen = () => scr('/audit-logs','','Audit entry details',d=>{const a=d.log;return {title:`Audit entry #${esc(a.auditId)}`,sub:`${esc(a.actionType)} · ${esc(a.entityType)} #${esc(a.entityId)}`,actions:`<a class="btn btn-secondary" href="/audit-logs/${a.auditId}/edit" data-link>Edit</a><a class="btn btn-ghost" href="/audit-logs" data-link>Back to Audit Log</a>`,body:`<section class="card card-pad"><h2>Event information</h2><div class="info-list">${row('Action type',esc(a.actionType))}${row('Entity type',esc(a.entityType))}${row('Entity ID',`#${esc(a.entityId)}`)}${row('Camel',`#${esc(a.camelId)}`)}${row('Recorded',fmtDate(a.createdAt))}</div><h2 class="entity-subhead">Description</h2><p class="entity-copy">${esc(a.description||'No description recorded.')}</p></section>`};});

// ---- Camels ----
const camelCard = c => `<article class="card card-pad">${camelPhoto({...c, photoUrl: null})}<div class="section-title"><h3>${esc(c.name)}</h3>${sb(c.status)}</div><div class="info-list">${row('Breed', esc(c.breed))}${row('Gender', esc(c.gender))}${row('Born', fmtDate(c.birthDate))}${row('Category', esc(c.category || '—'))}</div><div class="actions"><a class="btn btn-primary" href="/camels/${c.camelId}/profile" data-link>View profile</a><a class="btn btn-secondary" href="/camels/${c.camelId}" data-link>View pedigree</a></div></article>`;
const pedigreeDirectoryCard = c => `<article class="card card-pad">${camelPhoto({...c, photoUrl: null})}<div class="section-title"><div><div class="kicker">PEDIGREE</div><h3>${esc(c.name)}</h3></div>${sb(c.status)}</div><div class="info-list">${row('Breed', esc(c.breed))}${row('Gender', esc(c.gender))}${row('Born', fmtDate(c.birthDate))}${row('Category', esc(c.category || '—'))}</div><div class="actions"><a class="btn btn-primary" href="/camels/${c.camelId}" data-link>View pedigree</a><a class="btn btn-secondary" href="/camels/${c.camelId}/profile" data-link>View profile</a></div></article>`;
// Static visual example only; live ancestor names and photos come from PedigreeTreeDTO
// after a visitor opens a registered camel. Do not invent links to sample ancestors.
const pedigreeDirectoryVisual = () => `<section class="pedigree-directory-preview" aria-label="Illustrative three-generation camel pedigree">
  <figure class="pedigree-chart pedigree-preview-chart" aria-labelledby="pedigree-preview-caption">
    <figcaption id="pedigree-preview-caption" class="pedigree-sr-only">Example three-generation camel pedigree: Barq, its parents and four grandparents.</figcaption>
    <div class="pedigree-tree">
      <div class="pedigree-subject">
        <div class="pedigree-node pedigree-node-subject">
          <span class="pedigree-photo" aria-hidden="true"><img src="/assets/mock-camels/camel-1.jpg" alt="" loading="lazy" decoding="async"></span>
          <span class="pedigree-node-copy"><span class="pedigree-label">Camel</span><span class="pedigree-name">Barq</span></span>
        </div>
      </div>
      <ol class="pedigree-parents" aria-label="Example parents and grandparents">
        <li class="pedigree-branch" aria-label="Paternal ancestry">
          <div class="pedigree-node">
          <span class="pedigree-photo" aria-hidden="true"><img src="/assets/mock-camels/camel-2.jpg" alt="" loading="lazy" decoding="async"></span>
          <span class="pedigree-node-copy"><span class="pedigree-label">Sire</span><span class="pedigree-name">Al Zaeem</span></span>
        </div>
          <ol class="pedigree-grandparents" aria-label="Paternal grandparents">
            <li><div class="pedigree-node">
          <span class="pedigree-photo" aria-hidden="true"><img src="/assets/mock-camels/camel-3.jpg" alt="" loading="lazy" decoding="async"></span>
          <span class="pedigree-node-copy"><span class="pedigree-label">Grand Sire</span><span class="pedigree-name">Al Majd</span></span>
        </div></li>
            <li><div class="pedigree-node">
          <span class="pedigree-photo" aria-hidden="true"><img src="/assets/mock-camels/camel-4.jpg" alt="" loading="lazy" decoding="async"></span>
          <span class="pedigree-node-copy"><span class="pedigree-label">Grand Dam</span><span class="pedigree-name">Al Noor</span></span>
        </div></li>
          </ol>
        </li>
        <li class="pedigree-branch" aria-label="Maternal ancestry">
          <div class="pedigree-node">
          <span class="pedigree-photo" aria-hidden="true"><img src="/assets/mock-camels/camel-5.jpg" alt="" loading="lazy" decoding="async"></span>
          <span class="pedigree-node-copy"><span class="pedigree-label">Dam</span><span class="pedigree-name">Bint Al Reem</span></span>
        </div>
          <ol class="pedigree-grandparents" aria-label="Maternal grandparents">
            <li><div class="pedigree-node">
          <span class="pedigree-photo" aria-hidden="true"><img src="/assets/mock-camels/camel-6.jpg" alt="" loading="lazy" decoding="async"></span>
          <span class="pedigree-node-copy"><span class="pedigree-label">Grand Sire</span><span class="pedigree-name">Al Sultan</span></span>
        </div></li>
            <li><div class="pedigree-node">
          <span class="pedigree-photo" aria-hidden="true"><img src="/assets/mock-camels/camel-7.jpg" alt="" loading="lazy" decoding="async"></span>
          <span class="pedigree-node-copy"><span class="pedigree-label">Grand Dam</span><span class="pedigree-name">Al Dewa</span></span>
        </div></li>
          </ol>
        </li>
      </ol>
    </div>
    <div class="pedigree-legend">
      <span><b>Sire</b> Father</span>
      <span><b>Dam</b> Mother</span>
      <span class="pedigree-hint">Illustrative preview. Select a registered camel below to see its actual pedigree.</span>
    </div>
  </figure>
</section>`;
const pedigreeDirectoryScreen = () => scr('/pedigree', '', 'Pedigree', d => ({
  title: 'Pedigree',
  sub: 'Explore registered camel bloodlines and open each family tree.',
  body: `${pedigreeDirectoryVisual()}<form class="toolbar pedigree-directory-toolbar" data-form="pedigree-filter"><input class="input" name="search" placeholder="Search camel by name…" value="${esc(d.q.search || '')}"><select class="select" name="gender">${opts(GENDERS, d.q.gender, 'Any gender')}</select><input class="input" name="breed" placeholder="Breed" value="${esc(d.q.breed || '')}"><input class="input" name="category" placeholder="Category" value="${esc(d.q.category || '')}"><select class="select" name="status">${opts(CAMEL_STATUSES, d.q.status, 'Any status')}</select><button class="btn btn-primary" type="submit">Filter</button></form>${d.page.content.length ? `<div class="grid grid-3">${d.page.content.map(pedigreeDirectoryCard).join('')}</div>${pager(d.page)}` : emptyCard('No camels found', 'No registered camels match these pedigree filters.', '<a class="btn btn-secondary" href="/camels" data-link>Browse camels</a>')}`,
}));

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
    actions: `${sell}<a class="btn btn-secondary" href="/camels/${p.camelId}/ownership" data-link>Ownership history</a><a class="btn btn-secondary" href="/camels/${p.camelId}" data-link>View pedigree</a>${canEdit ? `<a class="btn btn-secondary" href="/camels/${p.camelId}/edit" data-link>Edit</a><button class="btn btn-danger" data-act="delete-camel" data-id="${p.camelId}" data-name="${esc(p.name)}">Delete</button>` : ''}`,
    body: `<div class="two-pane"><section class="card card-pad">${camelPhoto({...p, photoUrl: null})}<div class="section-title"><h2>Profile</h2>${sb(p.status)}</div><div class="info-list">${row('Born', fmtDate(p.birthDate))}${row('Breed', esc(p.breed))}${row('Gender', esc(p.gender))}${row('Category', esc(p.category || '—'))}</div></section>
<aside><section class="card card-pad"><div class="section-title"><h2>Pedigree</h2><a class="small-btn" href="/camels/${p.camelId}" data-link>Open tree</a></div><div class="info-list">${row('Sire', parent(ped.sire, ped.sireCamelId))}${row('Dam', parent(ped.dam, ped.damCamelId))}${row('Recorded', fmtDate(ped.recordedAt))}</div>${canEdit ? `<div class="actions"><a class="btn btn-primary" href="/camels/${p.camelId}/pedigree/edit" data-link>Edit pedigree</a></div>` : ''}</section>
<section class="card card-pad section"><h2>Current owners</h2>${p.owners.length ? `<div class="info-list">${p.owners.map(o => row(esc(o.name || '—'), `${esc(o.sharePercent)}%`)).join('')}</div>` : '<p class="form-help">No current owner recorded.</p>'}<p class="form-help">Owner names only — contact details are never shown.</p></section>
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
  'Training Agreements': agreementScreen, 'Add Training Agreement': () => scr('/agreements','','Add Training Agreement',()=>({title:'Create Training Agreement',sub:'Set the terms for a camel and trainer partnership.',body:agreementForm()})),
  'Edit Training Agreement': () => scr('/agreements','','Edit Training Agreement',d=>({title:`Edit Agreement #${esc(d.agreement.agreementId)}`,sub:'Only pending agreements can be updated.',body:agreementForm(d.agreement,true)})),
  'Training Agreement Details': agreementDetailScreen, 'Audit Logs': auditScreen,
  'Add Audit Log': () => scr('/audit-logs','','Add Audit Entry',()=>({title:'Create Audit Entry',sub:'Record an event associated with a camel and platform entity.',body:auditForm()})),
  'Edit Audit Log': () => scr('/audit-logs','','Edit Audit Entry',d=>({title:`Edit Audit Entry #${esc(d.log.auditId)}`,sub:'Update the recorded event details.',body:auditForm(d.log,true)})),
  'Audit Log Details': auditDetailScreen,
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
    if (kind === 'agreement-add' || kind === 'agreement-edit') {
    const start=form.elements.startsAt, end=form.elements.endsAt;
    end.setCustomValidity(start.value && end.value && end.value <= start.value ? 'End date must be after the start date.' : '');
    if (!form.reportValidity()) return;
  }
    if (kind === 'camel-filter') return go('/camels' + buildQuery(f));
    if (kind === 'pedigree-filter') return go('/pedigree' + buildQuery(f));
    if (kind === 'market-filter') return go('/marketplace' + buildQuery(f));
    if (kind === 'agreement-filter') return go('/agreements' + buildQuery(f));
    if (kind === 'audit-filter') return go('/audit-logs' + buildQuery(f));
  if (btn) btn.disabled = true;
  try {
    if (kind === 'camel-add') { const newId = await camelApi.add(toCamelPayload(f)); toast('Camel registered.', 'success'); go(`/camels/${newId}/profile`); }
    else if (kind === 'camel-edit') { await camelApi.update(toCamelPayload(f, id)); toast('Camel updated.', 'success'); go(`/camels/${id}/profile`); }
    else if (kind === 'pedigree-edit') {
      const payload = {
        sireCamelId: f.sireCamelId ? Number(f.sireCamelId) : null,
        damCamelId: f.damCamelId ? Number(f.damCamelId) : null,
      };
      await pedigreeApi.update(id, payload);
      state.view = blankView();
      toast('Pedigree updated.', 'success');
      go(`/camels/${id}`);
    }
    else if (kind === 'listing-add') { const newId = await marketplaceApi.add(toListingPayload(f)); toast('Listing published.', 'success'); go(`/marketplace/${newId}`); }
    else if (kind === 'listing-edit') { await marketplaceApi.update(toListingPayload(f, id)); toast('Listing updated.', 'success'); go(`/marketplace/${id}`); }
    else if (kind === 'offer-add') { await offerApi.add(toOfferCreatePayload(f.offeredPriceOmr, id)); closeModal(); toast('Offer submitted.', 'success'); go('/offers'); }
    else if (kind === 'offer-edit') { await offerApi.update(toOfferUpdatePayload(f.offeredPriceOmr, id)); closeModal(); toast('Offer updated.', 'success'); refresh(); }
    else if (kind === 'agreement-add' || kind === 'agreement-edit') {
      const payload={feeOmr:Number(f.feeOmr),prizeSharePct:Number(f.prizeSharePct),saleSharePct:Number(f.saleSharePct),startsAt:new Date(f.startsAt).toISOString(),endsAt:new Date(f.endsAt).toISOString(),terms:f.terms||null};
      if(kind==='agreement-add') { payload.camelId=Number(f.camelId);payload.trainerUserId=Number(f.trainerUserId);await agreementApi.add(payload);toast('Training agreement proposed.','success');go('/agreements'); }
      else { await agreementApi.update(id,payload);toast('Training agreement updated.','success');go(`/agreements/${id}`); }
    }
    else if (kind === 'audit-add' || kind === 'audit-edit') {
      const payload={actionType:f.actionType.trim(),entityType:f.entityType.trim(),entityId:Number(f.entityId),camelId:Number(f.camelId),description:f.description||null};
      if(kind==='audit-add') { await auditLogApi.add(payload);toast('Audit entry created.','success');go('/audit-logs'); }
      else { payload.auditId=Number(id);await auditLogApi.update(payload);toast('Audit entry updated.','success');go(`/audit-logs/${id}`); }
    }
  } catch (err) { failure(err); if (btn) btn.disabled = false; }
}
function onMineClick(e) {
  const el = e.target.closest?.('[data-act]'); if (!el) return;
  const { act, id, price, listing, page } = el.dataset;
  if (act === 'retry') return refresh();
  if (act === 'page') return go(withQuery({ page }));
  if (act === 'make-offer') return signedIn() ? offerModal('add', listing, price) : (toast('Sign in to make an offer.', 'error'), go('/signin'));
  if (act === 'edit-offer') return offerModal('edit', id, price);
  if (act === 'accept-agreement') return confirmModal('Accept training agreement?', `Accept agreement #${esc(id)} and begin the training period?`, 'Accept agreement', false, async () => { await agreementApi.accept(id);toast('Training agreement accepted.','success');refresh(); });
  if (act === 'delete-audit') return confirmModal('Delete audit entry?', `Audit entry #${esc(id)} will be permanently removed.`, 'Delete entry', true, async () => { await auditLogApi.remove(id);toast('Audit entry deleted.','success');refresh(); });
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
 'Challenge Detail + Voting':()=>challenge(p.id),'Training Log':training,'Training Agreements':agreementScreen,'Add Training Agreement':()=>mineScreens()[name](),'Edit Training Agreement':()=>mineScreens()[name](),'Training Agreement Details':agreementDetailScreen,
 'Audit Logs':auditScreen,'Add Audit Log':()=>mineScreens()[name](),'Edit Audit Log':()=>mineScreens()[name](),'Audit Log Details':auditDetailScreen,
 'Admin Dashboard':admin,'Pedigree Directory':pedigreeDirectoryScreen,'Pedigree Section':()=>pedigree(p.id),'Edit Pedigree':pedigreeEditScreen,
 'Race Card Publish Control':()=>publishRaceCard(p.id),'Organizations UI':organizations,'Tourism / Cultural Content UI':tourism,
 'Race Card Public / History UI':raceCards,
 ...mineScreens()
 }[name] || notFound; }

async function render() {
 const epoch=++renderEpoch, match=matchRoute(normalizePath());
 loadView(match);
 state.adminUsers=null;
 $('#modal')?.remove();
 document.documentElement.lang=state.lang;
 document.documentElement.dir=state.lang==='ar'?'rtl':'ltr';
 if(match && !canAccessRoute(match.route,state.user)) {
  if(match.route.path==='/admin') denyAdminAccess(); else denyRoleAccess(match.route);
  bind();return;
 }

    if ([
        "Races Listing",
        "Race Archive",
        "Race Details",
        "Race Participants",
        "Race Results",
        "Race Registration",
        "My Registrations",
        "Organizer Race Dashboard",
        "Add Race",
        "Manage Race"
    ].includes(match?.route?.name)) {
        root.innerHTML = shell(
            '<div id="race-view"></div>',
            '/races'
        );

        const raceView = document.querySelector("#race-view");
        const name = match.route.name;

        if (name === "Races Listing") {
            await renderRacesListing(raceView);
        } else if (name === "Race Archive") {
            await renderRaceArchive(raceView);
        } else if (name === "Race Details") {
            await renderRaceDetails(raceView, match.params.id);
        } else if (name === "Race Participants") {
            await renderRaceParticipants(raceView, match.params.id);
        } else if (name === "Race Results") {
            await renderRaceResults(raceView, match.params.id);
        } else if (name === "Race Registration") {
            await renderRaceRegistration(raceView, match.params.id);
        } else if (name === "My Registrations") {
            await renderMyRegistrations(raceView);
        } else if (name === "Organizer Race Dashboard") {
            await renderOrganizerDashboard(raceView, state.user);
        } else if (name === "Add Race") {
            await renderCreateRace(raceView, state.user);
        } else if (name === "Manage Race") {
            await renderManageRace(
                raceView,
                match.params.id,
                state.user
            );
        }

        bind();
        return;
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
 bindPedigreeImages(root);
 // The dock lives outside #app and survives in-app route changes.
 if (document.body) syncAssistantDock({ user: state.user, preferredLanguage: state.lang, path: normalizePath() });
 $('#admin-retry')?.addEventListener('click',()=>render());
 document.querySelectorAll('.admin-page').forEach(button=>button.addEventListener('click',()=>{state.adminPage=Number(button.dataset.page);render();}));
 bindAuth();
 document.querySelectorAll('[data-link]').forEach(a=>a.addEventListener('click',e=>{ if(!e.ctrlKey&&!e.metaKey){e.preventDefault();go(a.getAttribute('href'));} }));
 document.querySelectorAll('[data-language]').forEach(button=>button.addEventListener('click',async()=>{
  const language=button.dataset.language;
  if(state.lang===language) return;
  state.lang=language;localStorage.setItem('medhmar-lang',language);
  await render();
  document.querySelector(`[data-language="${language}"]`)?.focus({preventScroll:true});
 }));
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
  // New Google accounts are provisioned as VIEWER (Fan / Spectator) by the backend.
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
 const publicAuthPaths=new Set(['/signin','/signup','/forgot-password','/reset-password']);
 if(publicAuthPaths.has(normalizePath())) state.user={...guestUser};
 else {
  try{state.user=await authApi.me();}catch{state.user={...guestUser};}
 }
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




