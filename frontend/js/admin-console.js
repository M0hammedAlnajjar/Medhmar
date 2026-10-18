// A standalone administration UI; no site-wide community modules are shown here.
const esc = v => String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const links=[['/admin','Dashboard'],['/admin/users','Manage Users'],['/admin/audit-logs','Audit Logs'],['/admin/settings','Admin Settings']];
export function adminShell({user,active='/admin',body=''}) {
  const selected=active.startsWith('/admin/audit-logs')?'/admin/audit-logs':active;
  const nav=links.map(([p,l])=>'<a href="'+p+'" data-link'+(p===selected?' class="active" aria-current="page"':'')+'>'+l+'</a>').join('');
  return '<div class="admin-console" dir="ltr"><header class="admin-header"><div class="admin-header-inner">'+
    '<a href="/admin" data-link class="admin-brand" aria-label="Medhmar Admin home"><img src="/assets/medhmar-logo.svg" alt="Medhmar"><span>ADMIN CONSOLE</span></a>'+
    '<nav class="admin-desktop-nav" aria-label="Administration">'+nav+'</nav>'+
    '<div class="admin-account"><span>'+esc(user?.fullName||'Administrator')+'</span><button type="button" id="admin-signout">Sign Out</button></div>'+
    '<details class="admin-mobile-nav"><summary aria-label="Open administration navigation">Menu ☰</summary>'+
    '<nav aria-label="Mobile administration">'+nav+'</nav></details></div></header>'+
    '<main class="admin-main">'+body+'</main><footer class="admin-footer">MEDHMAR · Administration only</footer></div>';
}
const header=(k,t,d)=>'<div class="admin-heading"><p>'+k+'</p><h1>'+t+'</h1><span>'+d+'</span></div>';
export function adminDashboard({user,page,error=''}) {
  const count=page&&Number.isFinite(Number(page.totalElements))?Number(page.totalElements):null;
  const sections=[['/admin/users','Manage Users','Registered accounts, roles and access status.'],['/admin/audit-logs','Audit Logs','Review actions and security-sensitive changes.'],['/admin/settings','Admin Settings','Your administrator profile preferences.']];
  return header('ADMINISTRATION','Dashboard','Welcome, '+esc(user?.fullName||'Administrator')+'. This workspace is separate from the public platform.')+
    '<section class="admin-stats"><div class="admin-stat"><span>REGISTERED USERS</span>'+
    (count!==null?'<strong>'+count.toLocaleString('en-US')+'</strong><small>Live accounts</small>':
     '<p>'+esc(error||'Unable to load live account data.')+'</p><button class="btn btn-secondary" id="admin-retry" type="button">Retry</button>')+
    '</div></section><h2>Administration tools</h2><div class="admin-cards">'+sections.map(([p,t,d])=>
       '<a href="'+p+'" data-link class="admin-card"><strong>'+t+'</strong><span>'+d+'</span><small>Open →</small></a>').join('')+'</div>';
}
export function adminUsersView({users,page,error=''}) {
  const rows=Array.isArray(users)?users.map(u=>
    '<tr><td><strong>'+esc(u.fullName||'—')+'</strong></td><td>'+esc(u.email||'—')+'</td><td>'+
    (Array.isArray(u.roles)?u.roles.map(r=>'<span class="badge neutral">'+esc(r)+'</span>').join(' '):'—')+
    '</td><td>'+esc(u.accountStatus||'UNKNOWN')+'</td><td><button type="button" class="small-btn manage-user" data-user="'+esc(u.userId)+'">Manage</button></td></tr>').join(''):'';
  const current=Math.max(0,Number(page?.page)||0),total=Math.max(1,Number(page?.totalPages)||1);
  return header('ACCESS MANAGEMENT','Manage Users','Control user roles and access through verified administrator requests.')+
    (!Array.isArray(users)?'<section class="card card-pad error" role="alert"><h2>Administrator access unavailable</h2><p>'+esc(error||'Unable to load accounts.')+'</p><button type="button" class="btn btn-secondary" id="admin-retry">Retry</button></section>':
      '<section class="admin-user-table"><p>'+(Number(page?.totalElements)||0)+' registered users · Page '+(current+1)+' of '+total+'</p>'+
      '<div class="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Roles</th><th>Status</th><th>Actions</th></tr></thead><tbody>'+
      (rows||'<tr><td colspan="5">No registered users found.</td></tr>')+'</tbody></table></div><div class="actions section">'+
      '<button class="btn btn-secondary admin-page" type="button" data-page="'+(current-1)+'"'+(current===0?' disabled':'')+'>Previous</button>'+
      '<button class="btn btn-secondary admin-page" type="button" data-page="'+(current+1)+'"'+(current+1>=total?' disabled':'')+'>Next</button></div></section>');
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
