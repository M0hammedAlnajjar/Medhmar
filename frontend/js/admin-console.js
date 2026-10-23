// A standalone administration UI; no site-wide community modules are shown here.
const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

const links = [
    ['/admin', 'Dashboard'],
    ['/admin/users', 'Manage Users'],
    ['/admin/marketplace', 'Marketplace Management'],
    ['/admin/termination-requests', 'Termination requests'],
    ['/admin/heritage', 'Heritage'],
    ['/admin/challenges', 'Challenges'],
    ['/admin/organizations', 'Organizations'],
    ['/admin/system-health', 'System Health'],
    ['/admin/audit-logs', 'Audit Logs'],
    ['/admin/races', 'Races'],
    ['/admin/settings', 'Admin Settings']
];

const adminIcon = key => ({
    "dashboard": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',

    "users": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',

    "audit": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',

    "settings": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1.1 1.5V21h-3v-.9a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-2-2 .1-.1A1.7 1.7 0 0 0 7 15a1.7 1.7 0 0 0-1.5-1.1H4v-3h1.5A1.7 1.7 0 0 0 7 9.8a1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-2 .1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 11.7 4V3h3v1a1.7 1.7 0 0 0 1.1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 2 2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1.1H22v3h-1.1a1.7 1.7 0 0 0-1.5 1.1Z"/></svg>',

    "camel": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 17h3l2-5 4-2 2 2h5l2-4M8 12V8l2-3 4 1 1 4M7 17v4m11-7v7M2 14l1 3"/></svg>',

    "race": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 21h10M12 17v4M5 4h14v7a7 7 0 0 1-14 0V4Zm0 3H3v3a3 3 0 0 0 3 3m13-6h2v3a3 3 0 0 1-3 3"/></svg>',

    "market": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M6.5 7.4h4.5M6.5 17.6h11M7 14.6h1.4l1.2-3.1 2.1-1 1.5 1.8 2-1 1.6 3.3h1M9 14.6v3m7 0v-3"/></svg>',

    "challenge": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3l14 18M19 3L5 21M7 3l-4 4m14-4 4 4M7 21l-4-4m14 4 4-4"/></svg>',

    "organization": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 10h2v2H9zm4 0h2v2h-2zM9 15h2v2H9zm4 0h2v2h-2z"/></svg>',

    "database": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>',

    "logout": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>',

    "refresh": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2 6"/><path d="M20 4v7h-7"/></svg>'
})[key] || "";


// Dashboard-only SVG icons share one viewBox, stroke style and optical weight.
// Decorative icons are hidden from assistive technology; card labels carry meaning.
const adminMetricIcon = key => {
    const artwork = {
        users: '<circle cx="24" cy="14" r="6"/>' +
            '<circle cx="10" cy="19" r="4"/><circle cx="38" cy="19" r="4"/>' +
            '<path d="M13 39v-3c0-6.2 4.9-11 11-11s11 4.8 11 11v3H13Z"/>' +
            '<path d="M10 28c-3.5 0-6 2.8-6 6v5h6m28-11c3.5 0 6 2.8 6 6v5h-6"/>',
        // Solid one-hump camel with four distinct legs; readable at 40px.
        camel: '<path fill="currentColor" stroke="none" d="M3.5 29.2c2.1-.9 4.7-1.6 7.4-1.5 3.2-3.4 4.4-10.6 8.5-13.6 4.1-2.9 6.5-.4 9.2 6.6l1.9 4.5c2.8 1 5.4-1.7 5.6-5.4l1.7-10.3c.5-3.3 1.9-5 4.3-5.2l3.3.3 1.2 3.4-2.3 2.1-3.2-.4-1.1 11c-.5 7-3.2 10.6-7 11.4l.7 11.8h-3.8L26.4 33h-6l-2.1 10h-3.8l.6-10.1h-4.1l-.7 10.1H7L6.2 32.6c-2.6-.7-4-1.7-2.7-3.4Z"/>' +
            '<path d="M5 28.5 2.4 26" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round"/>' +
            '<circle cx="43.3" cy="7.2" r=".6" fill="#faf3e9" stroke="none"/>',
        race: '<path d="M14 7 34 42M34 7 14 42"/>' +
            '<path d="m14 7-10 6 7 10 11-10-8-6Zm20 0 10 6-7 10-11-10 8-6Z"/>' +
            '<path d="m10 10 7 8m-2-11 7 6m11-3-6 7m11-6-7 8"/>',
        market: '<path d="M10 10h28l4 11H6l4-11ZM14 10V6h20v4"/>' +
            '<path d="M9 26v15h30V26M19 41V30h10v11"/>' +
            '<path d="M6 21c0 3 3 5 6 5s6-2 6-5c0 3 3 5 6 5s6-2 6-5c0 3 3 5 6 5s6-2 6-5"/>'
    }[key];
    return artwork
        ? '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + artwork + '</svg>'
        : '';
};

export function adminShell({ user, active = '/admin', body = '' }) {
    const chosen = active.startsWith('/admin/audit-logs')
        ? '/admin/audit-logs'
        : active;

    const icons = {
        '/admin': 'dashboard',
        '/admin/users': 'users',
        '/admin/marketplace': 'market',
        '/admin/termination-requests': 'audit',
        '/admin/heritage': 'race',
        '/admin/challenges': 'challenge',
        '/admin/organizations': 'organization',
        '/admin/system-health': 'database',
        '/admin/audit-logs': 'audit',
        '/admin/races': 'race',
        '/admin/settings': 'settings'
    };

    const navLink = ([path, label]) => '<a href="' + path + '" data-link' +
        (chosen === path ? ' class="active" aria-current="page"' : '') +
        '><span class="admin-nav-icon">' + adminIcon(icons[path]) +
        '</span><span>' + label + '</span></a>';
    const nav = links.map(navLink).join('');
    const groups = [
        ['OVERVIEW', links.slice(0, 1)],
        ['MANAGEMENT', links.slice(1, 7)],
        ['SYSTEM', links.slice(7)]
    ];
    const groupedNav = groups.map(([heading, items]) =>
        '<div class="admin-sidebar-group"><p class="admin-sidebar-label">' + heading +
        '</p>' + items.map(navLink).join('') + '</div>'
    ).join('');

    const titles = {
        '/admin': 'Overview',
        '/admin/users': 'Manage Users',
        '/admin/marketplace': 'Marketplace Management',
        '/admin/termination-requests': 'Termination requests',
        '/admin/heritage': 'Heritage',
        '/admin/challenges': 'Challenges',
        '/admin/organizations': 'Organizations',
        '/admin/system-health': 'System Health',
        '/admin/audit-logs': 'Audit Logs',
        '/admin/races': 'Races',
        '/admin/settings': 'Admin Settings'
    };

 const section=titles[chosen]||'Administration';
 const name=String(user?.fullName||'Administrator').trim();
 const initial=name.charAt(0).toUpperCase()||'A';
 return '<div class="admin-console"'+' lang="en" dir="ltr"><aside class="admin-sidebar" aria-label="Administrator workspace">'+
   '<a class="admin-sidebar-brand" href="/admin" data-link aria-label="Medhmar administration home">'+
   '<img src="/assets/medhmar-admin-logo-approved.webp" alt="Medhmar Camel Racing Platform" width="210" height="124"></a>'+
   '<nav class="admin-sidebar-nav" aria-label="Administration">'+groupedNav+'</nav>'+
   '<div class="admin-sidebar-bottom"><button id="admin-signout" type="button">'+adminIcon('logout')+'<span>Sign Out</span></button></div></aside>'+
   '<div class="admin-workspace"><header class="admin-topbar'+(chosen==='/admin/users'?' admin-users-topbar':'')+'">'+
   (chosen==='/admin/challenges'?'<span class="mhch-breadcrumb-home" aria-hidden="true"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></svg></span>':'')+
   '<a href="/admin" data-link class="admin-topbar-breadcrumb">Administration</a><span class="admin-breadcrumb-separator">/</span><strong class="admin-topbar-section">'+esc(section)+'</strong>'+
   '<a href="/admin" class="admin-mobile-brand" data-link aria-label="Medhmar administration home"><img src="/assets/medhmar-admin-logo-compact.webp" alt="Medhmar Camel Racing Platform" width="154" height="39"></a>'+
   '<details class="admin-mobile-nav"><summary aria-label="Open administration navigation">☰ Menu</summary>'+
   '<nav aria-label="Mobile administration">'+nav+'</nav></details>'+
   (chosen==='/admin/challenges'?'<span class="mhch-topbar-location"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>Muscat · GMT+4</span>':chosen==='/admin/users'?'':'<span class="admin-topbar-pill" title="Administrator workspace">Administrator</span>')+
   '<div class="admin-user-chip"><span class="admin-user-avatar" aria-hidden="true">'+esc(initial)+'</span>'+
   (chosen==='/admin/challenges'?'<span class="mhch-topbar-admin"><strong>Admin</strong><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></span>':'<span><strong>'+esc(name)+'</strong><small>Administrator</small></span>')+'</div>'+
   '<button type="button" id="admin-mobile-signout" class="admin-mobile-signout" aria-label="Sign out">Sign Out</button>'+
   '</header><main class="admin-main">'+body+'</main>'+
   (chosen==='/admin/users'?'':'<footer class="admin-footer">'+(chosen==='/admin'?'<span>Administration workspace</span><span>Timestamps GMT+4 · Chart dates UTC</span>':'© '+new Date().getFullYear()+' Medhmar. All rights reserved.')+'</footer>')+'</div></div>';
}

// The admin shell is rebuilt during navigation and API refreshes. Retain the
// independent menu scroll position so selecting a route does not jump the menu.
export function mountAdminScreen(root, html) {
 const scrollTop = root.querySelector('.admin-sidebar-nav')?.scrollTop ?? 0;
 root.innerHTML = html;
 const nav = root.querySelector('.admin-sidebar-nav');
 if (nav) nav.scrollTop = scrollTop;
}

const validCount=value => typeof value==='number' && Number.isSafeInteger(value) && value>=0;
const number=value => validCount(value) ? value.toLocaleString('en-US') : '—';
const safeLabel=value => String(value||'').replace(/_/g,' ').toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
function dateTime(value) {
 const date = value ? new Date(value) : null;
 return date && !Number.isNaN(date.valueOf()) ? date.toLocaleString('en-GB',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Muscat'})+' GMT+4' : 'Time unavailable';
}
function weeklyChart(rows) {
 const validDate=value=>typeof value==='string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value) &&
   !Number.isNaN(new Date(value+'T00:00:00Z').valueOf()) &&
   new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
 if (!Array.isArray(rows)||rows.length!==7 || rows.some(d=>!d||!validDate(d.date)||
     !validCount(d.newUsers)||!validCount(d.newCamels)||!validCount(d.newListings))) {
   return '<div class="admin-chart-unavailable" role="status">Activity data is unavailable.</div>';
 }
 const metrics=[
   {id:'users',field:'newUsers',title:'New Users',unit:'user'},
   {id:'camels',field:'newCamels',title:'New Camels',unit:'camel'},
   {id:'listings',field:'newListings',title:'New Listings',unit:'listing'}
 ];
 const tabs='<div class="admin-chart-tabs" role="tablist" aria-label="Platform activity category">'+
   metrics.map((m,i)=>'<button type="button" role="tab" id="admin-chart-tab-'+m.id+
     '" aria-controls="admin-chart-panel-'+m.id+'" aria-selected="'+(i===0)+
     '" tabindex="'+(i===0?0:-1)+'" class="admin-chart-tab" data-chart="'+m.id+'">'+m.title+'</button>').join('')+'</div>';
 const charts=metrics.map((m,i)=>{
   const values=rows.map(d=>d[m.field]);
   const peak=Math.max(...values), intervals=peak<=2?2:4;
   const step=Math.max(1,Math.ceil(peak/intervals)), maximum=step*intervals;
   const grid=Array.from({length:intervals+1},(_,j)=>{
     const y=195-(158*j/intervals);
     return '<line class="admin-chart-grid" x1="42" x2="674" y1="'+y+'" y2="'+y+'"/>'+
       '<text class="admin-chart-tick" x="32" y="'+(y+4)+'" text-anchor="end">'+(j*step)+'</text>';
   }).join('');
   const bars=rows.map((d,j)=>{
     const x=68+96*j, val=values[j], h=158*val/maximum, y=195-h;
     const date=new Date(d.date+'T00:00:00Z');
     const label=date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'})+
       ': '+val+' new '+m.unit+(val===1?'':'s');
     const bar=val?'<rect class="admin-chart-bar admin-chart-bar-'+m.id+'" x="'+(x-20)+'" y="'+y.toFixed(1)+
       '" width="40" height="'+h.toFixed(1)+'" rx="5"/>':
       '<circle class="admin-chart-zero" cx="'+x+'" cy="195" r="3"/>';
     return '<g role="img" tabindex="0" class="admin-chart-bar-group" aria-label="'+esc(label)+'">'+
       '<title>'+esc(label)+'</title>'+bar+
       '<text class="admin-chart-value" x="'+x+'" y="'+Math.max(24,y-9).toFixed(1)+'" text-anchor="middle">'+val+'</text>'+
       '<text class="admin-chart-tick" x="'+x+'" y="219" text-anchor="middle">'+
       date.toLocaleDateString('en-US',{weekday:'short',timeZone:'UTC'})+'</text></g>';
   }).join('');
   return '<section id="admin-chart-panel-'+m.id+'" data-chart-panel="'+m.id+
     '" class="admin-chart-panel" role="tabpanel" aria-labelledby="admin-chart-tab-'+m.id+
     '"'+(i===0?'':' hidden')+'><svg class="admin-activity-svg" viewBox="0 0 700 235" role="img" aria-label="'+
     esc(m.title+' by UTC day over the last 7 days')+'" preserveAspectRatio="xMidYMid meet">'+grid+bars+'</svg><div class="admin-chart-caption"><strong>'+esc(m.title)+'</strong><span>'+esc(m.id==='users'?'Daily registrations':m.id==='camels'?'Daily camel records':'Daily listings')+'</span></div></section>';
 }).join('');
 return '<div class="admin-chart-container">'+tabs+charts+'</div>';
}

export function bindAdminChartTabs(root=document) {
 const tabs=[...root.querySelectorAll('.admin-chart-tab')],panels=[...root.querySelectorAll('.admin-chart-panel')];
 if(!tabs.length||!panels.length)return;
 const activate=(id,focus=false)=>{
   for(const t of tabs){const current=t.dataset.chart===id;
     t.setAttribute('aria-selected',String(current));t.tabIndex=current?0:-1;
     if(current&&focus)t.focus();
   }
   for(const p of panels)p.hidden=p.dataset.chartPanel!==id;
 };
 tabs.forEach((t,i)=>{
   t.addEventListener('click',()=>activate(t.dataset.chart));
   t.addEventListener('keydown',event=>{
     let next;
     if(event.key==='ArrowRight')next=(i+1)%tabs.length;
     else if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;
     else if(event.key==='Home')next=0;
     else if(event.key==='End')next=tabs.length-1;
     else return;
     event.preventDefault();activate(tabs[next].dataset.chart,true);
   });
 });
}

export function adminDashboard({user,summary=null,error='',page=null}) {
 const live=summary&&typeof summary==='object'?summary:null;
 const totalUsers=live?.totalUsers ?? (validCount(page?.totalElements)?page.totalElements:null);
 const metrics=[
  {label:'Total Users',value:totalUsers,icon:'users',tone:'users',sub:'Registered platform users'},
  {label:'Registered Camels',value:live?.activeCamels,icon:'camel',tone:'camels',sub:'Camels in the system'},
  {label:'Upcoming / Open Races',value:live?.upcomingRaces,icon:'race',tone:'races',sub:'Open for registration'},
  {label:'Active Listings',value:live?.activeListings,icon:'market',tone:'market',sub:'Active marketplace listings'}
 ];
 const cards=metrics.map(m=>'<article class="admin-metric-card">'+
   '<span class="admin-metric-icon admin-tone-'+m.tone+'">'+adminMetricIcon(m.icon)+'</span>'+
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
 const pill=live?'<span class="admin-live-pill">Live platform data</span>':'<span class="admin-live-pill admin-offline-pill">Data unavailable</span>';
 return '<div class="admin-dashboard-page"><section class="admin-hero" aria-labelledby="admin-dashboard-title">'+
   '<div class="admin-hero-copy"><span class="admin-hero-eyebrow">PLATFORM OVERVIEW</span>'+
   '<h1 id="admin-dashboard-title">Admin Dashboard</h1><p>Monitor and manage the Medhmar platform.</p></div>'+
   '<img class="admin-dashboard-art" src="/assets/admin-dashboard-racing.svg" width="826" height="230" alt="" aria-hidden="true">'+
   '<div class="admin-hero-actions"><button id="admin-refresh" class="admin-refresh-btn" type="button" aria-label="Refresh dashboard data">'+adminIcon('refresh')+' Refresh</button></div></section>'+
   '<section class="admin-metrics" aria-label="Current platform figures">'+cards+'</section>'+
   '<div class="admin-data-status" role="status">'+pill+'<span>Last updated: '+esc(updated)+'</span></div>'+
   (error?'<div class="admin-summary-error" role="status">Could not load dashboard data: '+esc(error)+
     ' <button type="button" id="admin-retry" class="btn btn-secondary">Retry</button></div>':'')+
   '<div class="admin-overview-grid"><section class="admin-panel admin-panel-chart"><div class="admin-panel-heading">'+
   '<div><h2>Platform Activity</h2><p>New records over the last 7 days</p></div><span class="admin-chart-period">Last 7 days · UTC</span></div>'+
   weeklyChart(live?.activity)+'</section>'+
   '<section class="admin-panel admin-panel-events"><div class="admin-panel-heading"><h2>Recent Activity</h2>'+
   '<a href="/admin/audit-logs" data-link>View audit logs <span aria-hidden="true">→</span></a></div>'+
   '<ul class="admin-recent-list">'+activityList+'</ul><img class="admin-dashboard-track" src="/assets/admin-dashboard-track.svg" width="450" height="148" alt="" aria-hidden="true"></section></div>'+
   '<section class="admin-dashboard-quick" aria-label="Quick access"><h2>Quick access</h2><div class="admin-quick-links">'+
   '<a href="/admin/users" data-link><span class="admin-quick-icon">'+adminIcon('users')+'</span><span>Manage users</span><span class="admin-quick-chevron" aria-hidden="true">›</span></a>'+
   '<a href="/admin/marketplace" data-link><span class="admin-quick-icon">'+adminIcon('market')+'</span><span>Review listings</span><span class="admin-quick-chevron" aria-hidden="true">›</span></a>'+
   '<a href="/admin/system-health" data-link><span class="admin-quick-icon">'+adminIcon('database')+'</span><span>System health</span><span class="admin-quick-chevron" aria-hidden="true">›</span></a>'+
   '<a href="/admin/audit-logs" data-link><span class="admin-quick-icon">'+adminIcon('audit')+'</span><span>Audit logs</span><span class="admin-quick-chevron" aria-hidden="true">›</span></a></div></section></div>';
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
  viewer:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  owner:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 11l2 2 3-3"/>',
  trainer:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 17l2 2 4-5"/>',
  organizer:'<circle cx="8" cy="8" r="3"/><circle cx="17" cy="8" r="3"/><path d="M2 21v-2a6 6 0 0 1 12 0v2m2-8a6 6 0 0 1 6 6v2"/>',
  admin:'<path d="m12 2 8 3v6c0 5-3 8-8 11-5-3-8-6-8-11V5Z"/><path d="M12 6v12M6 12h12"/>',
  users:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-2a7 7 0 0 1 14 0v2M17 10a4 4 0 0 1 0 8m3 3v-2a5 5 0 0 0-2-4"/>'
})[key] || '';
// Filled reference-inspired role pictograms, isolated to Manage Users KPI cards.
const iconUserStat = key => ({
 total: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><circle cx="16" cy="9" r="5"/><circle cx="6" cy="13" r="3.7"/><circle cx="26" cy="13" r="3.7"/><path d="M7 27v-3c0-5 3.8-8.8 9-8.8s9 3.8 9 8.8v3H7ZM.5 25v-2.4c0-4 2.1-6.2 5.3-6.2 1.2 0 2.3.3 3.2.8a11.7 11.7 0 0 0-4.4 9.8H2a1.5 1.5 0 0 1-1.5-2ZM31.5 25v-2.4c0-4-2.1-6.2-5.3-6.2-1.2 0-2.3.3-3.2.8a11.7 11.7 0 0 1 4.4 9.8H30a1.5 1.5 0 0 0 1.5-2Z"/></svg>',
 viewer: '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M1.5 16S7.5 7 16 7s14.5 9 14.5 9-6 9-14.5 9S1.5 16 1.5 16Z" fill="currentColor"/><circle cx="16" cy="16" r="6.8" fill="#fff"/><circle cx="16" cy="16" r="4.3" fill="currentColor"/></svg>',
 owner: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><circle cx="11" cy="10" r="5"/><circle cx="23" cy="11" r="4.4"/><path d="M0 26v-2.5c0-5.4 4.4-9 10.8-9 5.4 0 9.6 3.8 9.6 9v4.2H2A2 2 0 0 1 0 26Zm22.6 1.7v-4.5a11 11 0 0 0-4.2-8.6 9 9 0 0 1 4.5-1.2c5.6 0 9.1 3.7 9.1 9v3.3a2 2 0 0 1-2 2h-7.4Z"/></svg>',
 trainer: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><circle cx="14" cy="9" r="5.3"/><path d="M2.5 26v-2.8c0-6 4.8-10 11.5-10 4.5 0 8.3 2.2 10 6l-5.3 8.8H4.5a2 2 0 0 1-2-2Z"/><path d="m20.5 27.7 2.2-6.3 6-4.5 2.2 2.3-4.6 6.1-5.8 2.4Z" opacity=".7"/></svg>',
 organizer: '<svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><circle cx="16" cy="8" r="5"/><circle cx="5.8" cy="13" r="4"/><circle cx="26.2" cy="13" r="4"/><path d="M8.5 27v-2.8c0-5 3.1-9 7.5-9s7.5 4 7.5 9V27H8.5ZM0 24.5c0-4.5 2.1-7.6 5.8-7.6 1.2 0 2.4.4 3.5 1.2C7.5 20.5 7 23.5 7 27H2.5A2.5 2.5 0 0 1 0 24.5Zm32 0c0-4.5-2.1-7.6-5.8-7.6-1.2 0-2.4.4-3.5 1.2 1.8 2.4 2.3 5.4 2.3 8.9h4.5a2.5 2.5 0 0 0 2.5-2.5Z"/></svg>',
 admin: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 2 11 4v8.5C27 21 23 26 16 30 9 26 5 21 5 14.5V6l11-4Z"/><path d="M16 3v25" stroke-width="2.2"/></svg>'
})[key] || '';

const iconUser = key => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+usersIcon(key)+'</svg>';
const safeDate = v => {
  if (!v) return '—';
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-US',{month:'short',day:'2-digit',year:'numeric',timeZone:'UTC'});
};
const initials = name => String(name||'?').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
const safeRole = value => ['VIEWER','OWNER','TRAINER','ORGANIZER','ADMIN'].includes(value) ? value : 'OTHER';
export function adminUsersView({users,page,statistics=null,error=''}) {
 const current=Math.max(0,Number(page?.page)||0),total=Math.max(1,Number(page?.totalPages)||1);
 const pageSize=Number.isInteger(page?.size)&&page.size>0?page.size:20;
 const totalElements=validCount(page?.totalElements)?page.totalElements:null;
 const live=Array.isArray(users), all=live?users:[];
 const aggregate=statistics && validCount(statistics.totalUsers) &&
   statistics.roles && typeof statistics.roles==='object' ? statistics : null;
 const monthStats=(record) => record && validCount(record.newThisMonth) &&
   validCount(record.newPreviousPeriod) ? record : null;
 const cards=[
   {role:null,title:'Total Users',value:aggregate?aggregate.totalUsers:totalElements,
    month:aggregate?monthStats({newThisMonth:aggregate.newUsersThisMonth,
     newPreviousPeriod:aggregate.newUsersPreviousPeriod}):null,tone:'total',icon:'total'},
   ...['VIEWER','OWNER','TRAINER','ORGANIZER','ADMIN'].map(role=>{
     const record=aggregate?.roles?.[role];
     return {role,title:role==='VIEWER'?'Viewers':role==='OWNER'?'Owners':role==='TRAINER'?'Trainers':role==='ORGANIZER'?'Organizers':'Admins',
       value:aggregate?(validCount(record?.total)?record.total:null):
         live?all.filter(u=>Array.isArray(u.roles)&&u.roles.includes(role)).length:null,
       month:aggregate?monthStats(record):null,tone:role.toLowerCase(),icon:role.toLowerCase()};
   })
 ];
 const stats=cards.map(c=>{
   const actual=number(c.value);
   let change='<span class="admin-users-stat-trend admin-trend-unknown">—</span>';
   let sub=aggregate?'Monthly data unavailable':c.role?'On this page':'Month trend unavailable';
   if(c.month){
     const curr=c.month.newThisMonth,prev=c.month.newPreviousPeriod;
     sub='+'+number(curr)+' this month';
     if(prev===0 && curr>0)change='<span class="admin-users-stat-trend admin-trend-up" title="New registrations; no prior-month baseline">New</span>';
     else if(prev>0){
       const percent=Math.round((curr-prev)*100/prev), direction=percent>0?'up':percent<0?'down':'flat';
       change='<span class="admin-users-stat-trend admin-trend-'+direction+
         '" title="Registrations compared with the same elapsed period last month">'+
         (percent>0?'↑ ':percent<0?'↓ ':'')+Math.abs(percent)+'%</span>';
     }
   }
   // Native buttons keep the role summary usable with a keyboard. The counts
   // retain their API scope; selecting a role filters the loaded page only.
   return '<article class="admin-users-stat admin-users-stat-'+c.tone+'">'+
     '<button type="button" class="admin-users-role-filter" data-role="'+(c.role||'')+'"'+
     ' aria-pressed="'+!c.role+'" aria-controls="admin-users-table"'+
     ' aria-describedby="admin-users-stat-context-'+c.tone+'"'+(!live?' disabled':'')+'>'+
     '<span class="admin-users-stat-icon">'+(c.role?iconUser(c.icon):iconUserStat('total'))+'</span><span class="admin-users-stat-copy">'+
     '<span class="admin-users-stat-label">'+(c.role?esc(c.title):'All users')+'</span>'+
     '<strong>'+actual+'</strong></span></button>'+
     '<span class="admin-users-stat-context" id="admin-users-stat-context-'+c.tone+'">'+
     (c.role?(aggregate?'Role count across all accounts. ':'On this page. '):'Total Users across all registered accounts. ')+
     'Filters apply to this page only. '+change+'<small>'+esc(sub)+'</small></span></article>';
 }).join('');
 const rows=all.map(u=>{
  const roles=Array.isArray(u.roles)?u.roles:[];
  const status=String(u.accountStatus||'UNKNOWN').toUpperCase();
  const roleBadges=roles.length?roles.map(r=>'<span class="admin-users-role role-'+safeRole(r).toLowerCase()+'">'+esc(r)+'</span>').join(' '):'<span class="admin-users-role">—</span>';
  const date=u.joinedAt?new Date(u.joinedAt):null;
  const joined=date&&!Number.isNaN(date.valueOf())?date.toISOString().slice(0,10):'';
  return '<tr class="admin-user-row" data-user-search="'+esc(String(u.fullName||'')+' '+String(u.email||'')+' '+String(u.userId??''))+
    '" data-user-roles="'+esc(roles.join(' '))+'" data-user-status="'+esc(status)+'" data-user-joined="'+joined+'">'+
    '<td><span class="admin-users-person"><span class="admin-users-initials" aria-hidden="true">'+esc(initials(u.fullName))+'</span>'+
    '<span class="admin-users-identity"><strong>'+esc(u.fullName||'Unnamed account')+'</strong>'+
    '<small>#USR-'+esc(u.userId??'—')+'</small></span></span></td>'+
    '<td class="admin-users-email">'+esc(u.email||'—')+'</td>'+
    '<td><span class="admin-users-badges">'+roleBadges+'</span></td>'+
    '<td><span class="admin-users-status status-'+esc(status.toLowerCase())+'"><span aria-hidden="true">●</span>'+esc(status)+'</span></td>'+
    '<td><time'+(joined?' datetime="'+joined+'"':'')+'>'+safeDate(u.joinedAt)+'</time></td>'+
    '<td class="admin-users-actions">'+
    '<button class="admin-users-action view-admin-user" type="button" data-user="'+esc(u.userId)+'" aria-label="View '+esc(u.fullName||'user')+'">'+iconUser('eye')+'<span>View</span></button>'+
    '<button class="small-btn manage-user admin-users-action" type="button" data-user="'+esc(u.userId)+'" aria-label="Edit '+esc(u.fullName||'user')+'">'+iconUser('edit')+'<span>Edit</span></button></td></tr>';
 }).join('');
 const from=totalElements===null?null:totalElements===0?0:current*pageSize+1;
 const to=totalElements===null?null:Math.min(current*pageSize+all.length,totalElements);
 const nav='<div class="admin-users-pagination"><button class="admin-page" type="button" data-page="'+(current-1)+'"'+(current===0?' disabled':'')+' aria-label="Previous page">‹</button>'+
 '<span>Page '+(current+1)+' of '+total+'</span>'+
 '<button class="admin-page" type="button" data-page="'+(current+1)+'"'+(current+1>=total?' disabled':'')+' aria-label="Next page">›</button></div>';
 return '<div class="admin-users-view">'+
 '<section class="admin-users-hero" aria-labelledby="admin-users-title">'+
 '<div class="admin-users-hero-copy"><span class="admin-users-kicker">MEDHMAR · RACE ADMINISTRATION</span>'+
 '<h1 id="admin-users-title">Manage Users</h1>'+
 '<p>Manage the people behind every race.</p></div>'+
 '<img class="admin-users-racing-art" src="/assets/admin-users-racing.svg" alt="" aria-hidden="true" width="1000" height="209">'+
 '<div class="admin-users-date">'+iconUser('calendar')+'<span>'+esc(new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'Asia/Muscat'}))+'</span></div></section>'+
 '<section class="admin-users-stats" aria-label="Account statistics">'+stats+'</section>'+
 '<p class="admin-users-role-note">Accounts can have multiple roles. <span>'+ (aggregate?'Role counts cover all accounts.':'Role counts are from this page only.')+'</span></p>'+
 (!live?'<section class="admin-users-error" role="alert"><h2>Administrator access unavailable</h2><p>'+esc(error||'Unable to load accounts.')+'</p><button type="button" id="admin-retry" class="btn btn-secondary">Retry</button></section>':
 '<section class="admin-users-panel" aria-label="User directory">'+
 '<div class="admin-users-toolbar"><div><h2>User directory</h2><p>Search, review, and manage registered accounts.</p></div>'+
 '<span class="admin-users-live-count">'+esc(String(all.length))+' accounts loaded</span></div>'+
 '<form class="admin-users-filters" id="admin-user-filters" autocomplete="off" role="search">'+
 '<input type="hidden" id="admin-role-filter" name="role" value="">'+
 '<label class="admin-users-field admin-users-field-search"><span>Search users</span>'+
 '<span class="admin-users-search">'+iconUser('search')+'<input type="search" name="search" placeholder="Name, email or user ID" autocomplete="off"></span></label>'+
 '<label class="admin-users-field"><span>Status</span><select id="admin-status-filter" name="status"><option value="">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option><option value="SUSPENDED">Suspended</option></select></label>'+
 '<label class="admin-users-field"><span>Joined</span><select id="admin-joined-filter" name="joined"><option value="">Any time</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last year</option></select></label>'+
 '<div class="admin-users-filter-actions"><button class="admin-users-clear-btn" type="reset" id="admin-users-clear">Clear filters</button>'+
 '<button class="admin-users-refresh-btn" type="button" id="admin-users-refresh">'+iconUser('refresh')+' Refresh</button></div></form>'+
 '<p class="admin-users-page-hint" id="admin-users-filter-note">Filtering is instant and applies to this page only. '+
 'Total Users includes all registered accounts; role totals may overlap.</p>'+
 '<div class="admin-users-scroll" role="region" aria-label="User directory table" tabindex="0"><table class="admin-users-table" id="admin-users-table"><thead><tr><th scope="col">User</th><th scope="col">Email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Joined</th><th scope="col">Actions</th></tr></thead>'+
 '<tbody>'+rows+(rows?'':'<tr><td colspan="6" class="admin-users-no-data">No registered users found.</td></tr>')+
 '</tbody></table></div>'+
 '<div class="admin-users-empty-filter" id="admin-users-empty-filter" role="status" hidden>No users match these filters on this page.</div>'+
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
