// A standalone administration UI; no site-wide community modules are shown here.
const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const links=[['/admin','Dashboard'],['/admin/users','Manage Users'],['/admin/audit-logs','Audit Logs'],['/admin/settings','Admin Settings']];
const adminIcon = key => ({"dashboard":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"3\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"3\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"3\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/><rect x=\"14\" y=\"14\" width=\"7\" height=\"7\" rx=\"1.5\"/></svg>","users":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75\"/></svg>","audit":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><rect x=\"5\" y=\"3\" width=\"14\" height=\"18\" rx=\"2\"/><path d=\"M9 8h6M9 12h6M9 16h4\"/></svg>","settings":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><circle cx=\"12\" cy=\"12\" r=\"3\"/><path d=\"M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1.1 1.5V21h-3v-.9a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.5-1.1H4v-3h1.5A1.7 1.7 0 0 0 7 9.8a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-2 .1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 11.7 4V3h3v1a1.7 1.7 0 0 0 1.1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1.1H22v3h-1.1a1.7 1.7 0 0 0-1.5 1.1Z\"/></svg>","camel":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M3 17h3l2-5 4-2 2 2h5l2-4M8 12V8l2-3 4 1 1 4M7 17v4m11-7v7M2 14l1 3\"/></svg>","race":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M7 21h10M12 17v4M5 4h14v7a7 7 0 0 1-14 0V4Zm0 3H3v3a3 3 0 0 0 3 3m13-6h2v3a3 3 0 0 1-3 3\"/></svg>","market":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M6 5h11l5 7-10 10L2 12 6 5Z\"/><circle cx=\"8\" cy=\"10\" r=\"1\"/></svg>","logout":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9\"/></svg>","refresh":"<svg viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M20 11a8 8 0 1 0-2 6\"/><path d=\"M20 4v7h-7\"/></svg>"})[key]||"";

export function adminShell({user,active='/admin',body=''}) {
 const chosen=active.startsWith('/admin/audit-logs')?'/admin/audit-logs':active;
 const icons={ '/admin':'dashboard','/admin/users':'users','/admin/audit-logs':'audit','/admin/settings':'settings' };
 const nav=links.map(([path,label])=>'<a href="'+path+'" data-link'+(chosen===path?' class="active" aria-current="page"':'')+
   '><span class="admin-nav-icon">'+adminIcon(icons[path])+'</span><span>'+label+'</span></a>').join('');
 const titles={'/admin':'Overview','/admin/users':'Manage Users','/admin/audit-logs':'Audit Logs','/admin/settings':'Admin Settings'};
 const section=titles[chosen]||'Administration';
 const name=String(user?.fullName||'Administrator').trim();
 const initial=name.charAt(0).toUpperCase()||'A';
 return '<div class="admin-console" lang="en" dir="ltr"><aside class="admin-sidebar" aria-label="Administrator workspace">'+
   '<a class="admin-sidebar-brand" href="/admin" data-link aria-label="Medhmar administration home">'+
   '<img src="/assets/medhmar-logo-stacked.svg" alt="Medhmar Camel Racing Platform" width="164" height="100"></a>'+
   '<nav class="admin-sidebar-nav" aria-label="Administration">'+nav+'</nav>'+
   '<div class="admin-sidebar-bottom"><button id="admin-signout" type="button">'+adminIcon('logout')+'<span>Sign Out</span></button></div></aside>'+
   '<div class="admin-workspace"><header class="admin-topbar">'+
   '<a href="/admin" data-link class="admin-topbar-breadcrumb">Administration</a><span class="admin-breadcrumb-separator">/</span><strong class="admin-topbar-section">'+esc(section)+'</strong>'+
   '<a href="/admin" class="admin-mobile-brand" data-link aria-label="Medhmar administration home"><img src="/assets/medhmar-logo.svg" alt="Medhmar Camel Racing Platform" width="135" height="40"></a>'+
   '<details class="admin-mobile-nav"><summary aria-label="Open administration navigation">☰ Menu</summary>'+
   '<nav aria-label="Mobile administration">'+nav+'</nav></details>'+
   '<span class="admin-topbar-pill">Administrator workspace</span>'+
   '<div class="admin-user-chip"><span class="admin-user-avatar" aria-hidden="true">'+esc(initial)+'</span>'+
   '<span><strong>'+esc(name)+'</strong><small>Administrator</small></span></div>'+
   '<button type="button" id="admin-mobile-signout" class="admin-mobile-signout" aria-label="Sign out">Sign Out</button>'+
   '</header><main class="admin-main">'+body+'</main>'+
   '<footer class="admin-footer">© '+new Date().getFullYear()+' Medhmar. All rights reserved.</footer></div></div>';
}
const validCount=value => typeof value==='number' && Number.isSafeInteger(value) && value>=0;
const number=value => validCount(value) ? value.toLocaleString('en-US') : '—';
const safeLabel=value => String(value||'').replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
function dateTime(value) {
 const date = value ? new Date(value) : null;
 return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'UTC'})+' UTC' : 'Time unavailable';
}
function weeklyChart(rows) {
 if(!Array.isArray(rows)||rows.length!==7 ||
    rows.some(day => !day || typeof day.date !== 'string' ||
      !validCount(day.newUsers) || !validCount(day.newCamels) ||
      !validCount(day.newListings))) {
  return '<div class="admin-chart-unavailable">Activity data is unavailable.</div>';
 }
 const data=rows.map(d=>({
   date:d.date,users:d.newUsers,camels:d.newCamels,listings:d.newListings
 }));
 const maxValue=Math.max(1,...data.flatMap(d=>[d.users,d.camels,d.listings]));
 const max=Math.ceil(maxValue/5)*5;
 const width=700, x0=45, x1=679, y0=13, y1=180;
 const xy=(n,i)=>[x0+(x1-x0)*i/6,y1-n/max*(y1-y0)];
 const series=[['users','New Users','admin-line-users'],['camels','New Camels','admin-line-camels'],['listings','New Listings','admin-line-listings']];
 const grid=Array.from({length:5},(_,i)=>{
   const y=y1-(y1-y0)*i/4;
   return '<line x1="'+x0+'" x2="'+x1+'" y1="'+y+'" y2="'+y+'" class="admin-chart-grid"/>'+
     '<text x="33" y="'+(y+4)+'" class="admin-chart-tick" text-anchor="end">'+Math.round(max*i/4)+'</text>';
 }).join('');
 const lines=series.map(([key,title,style])=>{
  const pts=data.map((d,i)=>xy(d[key],i));
  const points=pts.map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ');
  const markers=pts.map(([x,y],i)=>{
    const tip='<title>'+title+': '+data[i][key]+' on '+esc(data[i].date)+'</title>';
    if(key==='camels') return '<rect class="'+style+' admin-chart-square" x="'+(x-4)+'" y="'+(y-4)+'" width="8" height="8">'+tip+'</rect>';
    if(key==='listings')return '<path class="'+style+' admin-chart-triangle" d="M '+x+' '+(y-5)+' L '+(x-5)+' '+(y+4)+' L '+(x+5)+' '+(y+4)+' Z">'+tip+'</path>';
    return '<circle cx="'+x+'" cy="'+y+'" r="4.5" class="'+style+' admin-chart-dot">'+tip+'</circle>';
  }).join('');
  return '<polyline points="'+points+'" class="'+style+'"/>'+markers;
 }).join('');
 const dayLabels=data.map((d,i)=>{
   const parsed=new Date(d.date+'T00:00:00Z');
   const day=Number.isNaN(parsed.getTime())?d.date.slice(5):parsed.toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'});
   return '<text x="'+xy(0,i)[0]+'" y="203" class="admin-chart-tick" text-anchor="middle">'+esc(day)+'</text>';
 }).join('');
 const desc=data.map(d=>esc(d.date)+': '+d.users+' users, '+d.camels+' camels, '+d.listings+' listings').join('; ');
 return '<svg class="admin-activity-svg" viewBox="0 0 '+width+' 213" role="img" aria-label="'+esc('Activity in UTC: '+desc)+'" preserveAspectRatio="xMidYMid meet">'+
  grid+lines+dayLabels+'</svg>'+
  '<div class="admin-chart-legend"><span class="admin-legend-users">New Users</span><span class="admin-legend-camels">New Camels</span><span class="admin-legend-listings">New Listings</span></div>';
}
export function adminDashboard({user,summary=null,error='',page=null}) {
 const live=summary&&typeof summary==='object'?summary:null;
 const totalUsers=live?.totalUsers ?? (validCount(page?.totalElements)?page.totalElements:null);
 const metrics=[
  {label:'Total Users',value:totalUsers,icon:'users',tone:'users',sub:'Registered platform users'},
  {label:'Registered Camels',value:live?.activeCamels,icon:'camel',tone:'camels',sub:'Camels in the system'},
  {label:'Upcoming / Open Races',value:live?.upcomingRaces,icon:'race',tone:'races',sub:'Races open for registration'},
  {label:'Active Listings',value:live?.activeListings,icon:'market',tone:'market',sub:'Active marketplace listings'}
 ];
 const cards=metrics.map(m=>'<article class="admin-metric-card">'+
   '<span class="admin-metric-icon admin-tone-'+m.tone+'">'+adminIcon(m.icon)+'</span>'+
   '<div><span class="admin-metric-label">'+m.label+'</span><strong>'+number(m.value)+'</strong>'+
   '<small>'+m.sub+'</small></div></article>').join('');
 const events=Array.isArray(live?.recentEvents)?live.recentEvents.slice(0,4):[];
 const activityList=events.length?events.map(a=>{
   const action=String(a.actionType||'Activity recorded'), entity=String(a.entityType||'Record');
   const search=(action+' '+entity).toUpperCase();
   const kind=search.includes('CAMEL')?'camel':search.includes('RACE')?'race':
     /LISTING|MARKET|OFFER/.test(search)?'market':'users';
   const tone=kind==='camel'||kind==='market'?'camels':'users';
   return '<li class="admin-recent-event"><span class="admin-event-icon admin-tone-'+tone+'">'+adminIcon(kind)+'</span>'+
     '<div><strong>'+esc(safeLabel(action))+'</strong><small>'+esc(entity)+' #'+esc(a.entityId??'—')+
     (a.actorUserId?' · Actor #'+esc(a.actorUserId):'')+'</small></div>'+
     '<time datetime="'+esc(a.createdAt||'')+'">'+esc(dateTime(a.createdAt))+'</time></li>';
 }).join(''):'<li class="admin-empty-state">'+(live?'No audit events recorded yet.':'Recent activity unavailable.')+'</li>';
 const updated=live?.generatedAt?dateTime(live.generatedAt):'Not available';
 const status=live?'<span class="admin-health-good">Responding</span>':'<span class="admin-health-unknown">Unverified</span>';
 const pill=live?'<span class="admin-live-pill">Live platform data</span>':'<span class="admin-live-pill admin-offline-pill">Data unavailable</span>';
 return '<section class="admin-hero" aria-labelledby="admin-dashboard-title">'+
   '<div class="admin-hero-copy"><span class="admin-hero-eyebrow">PLATFORM OVERVIEW</span>'+
   '<h1 id="admin-dashboard-title">Admin Dashboard</h1><p>Monitor and manage the Medhmar platform.</p></div>'+
   '<div class="admin-hero-actions"><button id="admin-refresh" class="admin-refresh-btn" type="button" aria-label="Refresh dashboard data">'+adminIcon('refresh')+' Refresh</button></div></section>'+
   '<section class="admin-metrics" aria-label="Current platform figures">'+cards+'</section>'+
   '<div class="admin-data-status" role="status">'+pill+'<span>Last updated: '+esc(updated)+'</span></div>'+
   (error?'<div class="admin-summary-error" role="status">Could not load dashboard data: '+esc(error)+
     ' <button type="button" id="admin-retry" class="btn btn-secondary">Retry</button></div>':'')+
   '<div class="admin-overview-grid"><section class="admin-panel admin-panel-chart"><div class="admin-panel-heading">'+
   '<div><h2>Platform Activity</h2><p>Daily platform records</p></div><span class="admin-chart-period">Last 7 days <span aria-hidden="true">⌄</span></span></div>'+
   weeklyChart(live?.activity)+'</section>'+
   '<section class="admin-panel admin-panel-events"><div class="admin-panel-heading"><h2>Recent Activity</h2>'+
   '<a href="/admin/audit-logs" data-link>View Audit Logs <span aria-hidden="true">→</span></a></div>'+
   '<ul class="admin-recent-list">'+activityList+'</ul></section></div>'+
   '<section class="admin-panel admin-panel-health"><div class="admin-status-heading">'+
   '<div><h2>System Status</h2><p>Request-level indicators</p></div></div>'+
   '<div class="admin-status-check"><span class="admin-status-icon" aria-hidden="true">'+adminIcon('settings')+'</span><strong>Backend API</strong>'+status+'</div>'+
   '<div class="admin-status-check"><span class="admin-status-icon" aria-hidden="true">'+adminIcon('dashboard')+'</span><strong>Database queries</strong>'+status+'</div>'+
   '<div class="admin-status-check"><span class="admin-status-icon" aria-hidden="true">'+adminIcon('market')+'</span><strong>External services</strong><span class="admin-health-unknown">Not monitored</span></div>'+
   '</section>';
}
// Shared heading for the existing Users and Settings pages.
const header=(k,t,d)=>'<div class="admin-heading"><p>'+esc(k)+'</p><h1>'+esc(t)+'</h1><span>'+esc(d)+'</span></div>';
const usersIcon = key => ({
  search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',
  filter:'<path d="M4 5h16l-6.5 8v5l-3 2v-7Z"/>',
  refresh:'<path d="M20 11a8 8 0 1 0-2 6M20 4v7h-7"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  edit:'<path d="m4 20 4.5-1 11-11-3.5-3.5-11 11L4 20Zm10-14 3.5 3.5"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
  viewer:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  owner:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 11l2 2 3-3"/>',
  trainer:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 17l2 2 4-5"/>',
  organizer:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 21v-2a6 6 0 0 1 12 0v2m2-8a6 6 0 0 1 6 6v2"/>',
  admin:'<path d="m12 2 8 3v6c0 5-3 8-8 11-5-3-8-6-8-11V5Z"/><path d="M12 6v12M6 12h12"/>',
  users:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 10a4 4 0 0 1 0 8m3 3v-2a5 5 0 0 0-2-4"/>'
})[key] || '';
const iconUser = key => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+usersIcon(key)+'</svg>';
const safeDate = v => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric',timeZone:'UTC'});
};
const initials = name => String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const safeRole = value => ['VIEWER','OWNER','TRAINER','ORGANIZER','ADMIN'].includes(value) ? value : 'OTHER';
export function adminUsersView({users,page,error=''}) {
 const current=Math.max(0,Number(page?.page)||0),total=Math.max(1,Number(page?.totalPages)||1);
 const totalElements=validCount(page?.totalElements)?page.totalElements:null;
 const live=Array.isArray(users), all=live?users:[];
 const cards=[
  {role:null,title:'Total Users',value:totalElements,caption:'Registered platform users',tone:'total',icon:'users'},
  ...['VIEWER','OWNER','TRAINER','ORGANIZER','ADMIN'].map(role=>({
   role,title:role==='VIEWER'?'Viewers':role==='OWNER'?'Owners':role==='TRAINER'?'Trainers':role==='ORGANIZER'?'Organizers':'Admins',
   value:live?all.filter(u=>Array.isArray(u.roles)&&u.roles.includes(role)).length:null,
   caption:'On this page',tone:role.toLowerCase(),icon:role.toLowerCase()
  }))
 ];
 const stats=cards.map(c=>'<article class="admin-users-stat admin-users-stat-'+c.tone+'">'+
   '<span class="admin-users-stat-icon">'+iconUser(c.icon)+'</span><div>'+
   '<span class="admin-users-stat-label">'+esc(c.title)+'</span>'+
   '<strong>'+number(c.value)+'</strong><small>'+c.caption+'</small></div></article>').join('');
 const rows=all.map((u,i)=>{
  const roles=Array.isArray(u.roles)?u.roles:[];
  const status=String(u.accountStatus||'UNKNOWN').toUpperCase();
  const roleBadges=roles.length?roles.map(r=>'<span class="admin-users-role role-'+safeRole(r).toLowerCase()+'">'+esc(r)+'</span>').join(' '):'<span class="admin-users-role">—</span>';
  const date=u.joinedAt?new Date(u.joinedAt):null;
  const joined=date&&!Number.isNaN(date.valueOf())?date.toISOString().slice(0,10):'';
  return '<tr class="admin-user-row" data-user-search="'+esc(String(u.fullName||'')+' '+String(u.email||'')+' '+String(u.userId??''))+
    '" data-user-roles="'+esc(roles.join(' '))+'" data-user-status="'+esc(status)+'" data-user-joined="'+joined+'">'+
    '<td class="admin-users-rownum">'+(current*20+i+1)+'</td>'+
    '<td><span class="admin-users-person"><span class="admin-users-initials" aria-hidden="true">'+esc(initials(u.fullName))+'</span>'+
    '<span class="admin-users-identity"><strong>'+esc(u.fullName||'Unnamed account')+'</strong>'+
    '<small>#USR-'+esc(u.userId??'—')+'</small></span></span></td>'+
    '<td class="admin-users-email">'+esc(u.email||'—')+'</td>'+
    '<td><span class="admin-users-badges">'+roleBadges+'</span></td>'+
    '<td><span class="admin-users-status status-'+esc(status.toLowerCase())+'"><span aria-hidden="true">●</span>'+esc(status)+'</span></td>'+
    '<td><time'+(joined?' datetime="'+joined+'"':'')+'>'+safeDate(u.joinedAt)+'</time></td>'+
    '<td class="admin-users-actions">'+
    '<button class="admin-users-action view-admin-user" type="button" data-user="'+esc(u.userId)+'" aria-label="View '+esc(u.fullName||'user')+'">'+iconUser('eye')+'</button>'+
    '<button class="small-btn manage-user admin-users-action" type="button" data-user="'+esc(u.userId)+'" aria-label="Manage '+esc(u.fullName||'user')+'">'+iconUser('edit')+'</button></td></tr>';
 }).join('');
 const from=totalElements===null?null:totalElements===0?0:current*20+1;
 const to=totalElements===null?null:Math.min((current+1)*20,totalElements);
 const nav='<div class="admin-users-pagination"><button class="admin-page" type="button" data-page="'+(current-1)+'"'+(current===0?' disabled':'')+' aria-label="Previous page">‹</button>'+
 '<span>Page '+(current+1)+' of '+total+'</span>'+
 '<button class="admin-page" type="button" data-page="'+(current+1)+'"'+(current+1>=total?' disabled':'')+' aria-label="Next page">›</button></div>';
 return '<div class="admin-users-view">'+
 '<section class="admin-users-hero" aria-labelledby="admin-users-title">'+
 '<span class="admin-users-kicker">ACCOUNT ADMINISTRATION</span>'+
 '<h1 id="admin-users-title">Manage Users</h1>'+
 '<p>View and manage all platform users</p>'+
 '<div class="admin-users-date">'+iconUser('calendar')+'<span>'+esc(new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric',timeZone:'UTC'}))+'</span></div></section>'+
 '<section class="admin-users-stats" aria-label="Account statistics">'+stats+'</section>'+
 (!live?'<section class="admin-users-error" role="alert"><h2>Administrator access unavailable</h2><p>'+esc(error||'Unable to load accounts.')+'</p><button type="button" id="admin-retry" class="btn btn-secondary">Retry</button></section>':
 '<section class="admin-users-panel" aria-label="User directory"><form class="admin-users-filters" id="admin-user-filters" autocomplete="off">'+
 '<label class="admin-users-search">'+iconUser('search')+'<span class="sr-only">Search users on this page</span><input type="search" name="search" placeholder="Search users on this page by name, email or ID"></label>'+
 '<label class="sr-only" for="admin-role-filter">Role</label><select id="admin-role-filter" name="role"><option value="">All Roles</option>'+['VIEWER','OWNER','TRAINER','ORGANIZER','ADMIN'].map(r=>'<option value="'+r+'">'+r.charAt(0)+r.slice(1).toLowerCase()+'</option>').join('')+'</select>'+
 '<label class="sr-only" for="admin-status-filter">Status</label><select id="admin-status-filter" name="status"><option value="">All Status</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option></select>'+
 '<label class="sr-only" for="admin-joined-filter">Joined</label><select id="admin-joined-filter" name="joined"><option value="">Joined: All Time</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select>'+
 '<button class="admin-users-filter-btn" type="submit">'+iconUser('filter')+' Filter</button>'+
 '<button class="admin-users-refresh-btn" type="button" id="admin-users-refresh">'+iconUser('refresh')+' Refresh Users</button></form>'+
 '<p class="admin-users-page-hint">Search and filters apply to the '+all.length+' accounts loaded on this page. Role cards show page counts, not platform-wide totals.</p>'+
 '<div class="admin-users-scroll"><table class="admin-users-table"><thead><tr><th>#</th><th>User</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>'+
 '<tbody>'+rows+(rows?'':'<tr><td colspan="7" class="admin-users-no-data">No registered users found.</td></tr>')+
 '</tbody></table></div>'+
 '<div class="admin-users-empty-filter" id="admin-users-empty-filter" hidden>No users match these filters on this page.</div>'+
 '<footer class="admin-users-foot"><p id="admin-users-count">'+(totalElements!==null?'Showing '+from+' to '+to+' of '+number(totalElements)+' registered users':'User count unavailable')+'</p>'+nav+'</footer></section>')+
 '</div>';
}
export function adminSettingsView({user,language='en'}) {
  const lang=user?.preferredLanguage||language;
  return header('ADMINISTRATION','Admin Settings','Manage your own administrator profile and language.')+
    '<section class="card card-pad admin-settings-card"><form id="settings-form" class="form">'+
    '<div class="field"><label for="settings-fullname">Full Name</label><input class="input" id="settings-fullname" name="fullName" autocomplete="name" maxlength="150" required value="'+esc(user?.fullName||'')+'"></div>'+
    '<div class="field"><label for="settings-language">Preferred Language</label><select class="select" id="settings-language" name="preferredLanguage">'+
    '<option value="en"'+(lang==='en'?' selected':'')+'>English</option><option value="ar"'+(lang==='ar'?' selected':'')+'>Arabic</option></select></div>'+
    '<p class="admin-note">Account: '+esc(user?.email||'')+'</p><button class="btn btn-primary" type="submit">Save Changes</button></form></section>';
}
