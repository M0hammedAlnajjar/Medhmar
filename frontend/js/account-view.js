import { matchRoute, canAccessRoute } from './routes.js';

// Shared, framework-free account view. Roles come from /api/users/me,
// and protected actions are still enforced by the Spring Boot backend.
const esc = value => String(value ?? '').replace(/[&<>"']/g, c =>
  ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const hasRole = (user, roles) => Boolean(user?.userId) &&
  Array.isArray(user.roles) && user.roles.some(role => roles.includes(role.replace(/^ROLE_/, '')));
const pill = label => '<span class="badge neutral">' + esc(label) + '</span>';

const actions = [
  ['Explore Races', 'Upcoming racing events and results.', '/races'],
  ['Community Challenges', 'Participate in published challenges.', '/challenges'],
  ['My Camels', 'Registered camels and pedigree.', '/camels/my', ['OWNER']],
  ['My Listings', 'Manage marketplace listings.', '/marketplace/my-listings', ['OWNER']],
  ['Training Agreements', 'View training agreements.', '/agreements', ['OWNER', 'TRAINER']],
  ['Training Journal', 'Your camel training sessions.', '/training', ['TRAINER']],
  ['Trainer Directory', 'Browse trainer profiles.', '/trainer-profile', ['TRAINER']],
  ['Race Operations', 'Manage races and entries.', '/organizer', ['ORGANIZER', 'ADMIN']],
  ['Audit Logs', 'Administrator audit records.', '/audit-logs', ['ADMIN']],
  ['Manage Users', 'Manage registered users and roles.', '#account-administration', ['ADMIN']]
];

export function renderAccount({ user, adminUsers = null, adminPageData = null, adminError = '', language = 'en' }) {
  if (!user?.userId) return '<section class="card card-pad"><h2>Sign in required</h2></section>';
  const admin = hasRole(user, ['ADMIN']);
  const cards = actions.filter(([, , path, roles]) =>
    (!roles || hasRole(user, roles)) &&
    (path.startsWith('#') || canAccessRoute(matchRoute(path)?.route, user))
  );
  const links = cards.map(([title, description, path]) =>
    '<a class="account-tool" href="' + esc(path) + '"' +
    (path.startsWith('#') ? '' : ' data-link') + '><strong>' + esc(title) +
    '</strong><span>' + esc(description) + '</span></a>').join('');
  const preferredLanguage = user.preferredLanguage || language;
  const profile =
    '<div class="account-layout"><div class="account-primary">' +
    '<section class="card profile-hero account-profile" aria-label="Account profile">' +
    '<div class="profile-avatar">' + esc(String(user.fullName || 'U').trim().charAt(0).toUpperCase() || 'U') + '</div>' +
    '<div><div class="kicker">YOUR ACCOUNT</div><h2>' + esc(user.fullName || 'My Account') +
    '</h2><p>' + esc(user.email || '') + '</p><div class="actions">' +
    (Array.isArray(user.roles) ? user.roles.map(pill).join('') : '') +
    (user.accountStatus ? pill(user.accountStatus) : '') +
    '</div></div></section>' +
    '<section class="card card-pad account-tools"><div class="kicker">YOUR WORKSPACE</div>' +
    '<h2>Quick access</h2><p class="account-muted">Tools shown according to your account role.</p>' +
    '<div class="account-tool-grid">' + links + '</div></section></div>' +
    '<section class="card card-pad settings-preferences" aria-label="Account preferences">' +
    '<div class="kicker">ACCOUNT PREFERENCES</div><h2>Personal information</h2>' +
    '<p class="account-muted">Update your name and preferred language.</p>' +
    '<form id="settings-form" class="form">' +
    '<div class="field"><label for="settings-fullname">Full Name</label>' +
    '<input class="input" id="settings-fullname" name="fullName" autocomplete="name" required maxlength="150" value="' +
    esc(user.fullName || '') + '"></div>' +
    '<div class="field"><label for="settings-language">Preferred Language</label>' +
    '<select class="select" id="settings-language" name="preferredLanguage">' +
    '<option value="en"' + (preferredLanguage === 'en' ? ' selected' : '') + '>English</option>' +
    '<option value="ar"' + (preferredLanguage === 'ar' ? ' selected' : '') + '>Arabic</option>' +
    '</select></div><div class="settings-preferences-actions">' +
    '<button class="btn btn-primary" type="submit">Save Changes</button>' +
    '<button class="btn btn-secondary" type="button" id="logout-btn">Sign Out</button>' +
    '</div></form></section></div>';

  if (!admin) return profile;
  if (!Array.isArray(adminUsers)) {
    // Never show fabricated or cached account data if the admin API fails.
    return profile + (adminError
      ? '<section class="card card-pad account-admin" id="account-administration" role="alert">' +
        '<h2>Administrator access unavailable</h2><p>' + esc(adminError) + '</p>' +
        '<button class="btn btn-secondary" type="button" id="admin-retry">Retry</button></section>'
      : '');
  }
  const page = adminPageData || {};
  const current = Math.max(0, Number(page.page) || 0);
  const total = Math.max(1, Number(page.totalPages) || 1);
  const rows = adminUsers.map(account =>
    '<tr><td><strong>' + esc(account.fullName || '—') + '</strong></td>' +
    '<td>' + esc(account.email || '—') + '</td><td>' +
    (Array.isArray(account.roles) ? account.roles.map(pill).join(' ') : '') +
    '</td><td>' + pill(account.accountStatus || 'UNKNOWN') +
    '</td><td><button class="small-btn manage-user" type="button" data-user="' +
    esc(account.userId) + '">Manage</button></td></tr>').join('');
  return profile +
    '<section class="account-admin" id="account-administration" aria-label="Administrator tools">' +
    '<div class="page-head"><div><div class="kicker">ADMINISTRATION</div><h2>Admin Dashboard</h2>' +
    '<p>Manage registered users and account access.</p></div></div>' +
    '<p class="account-muted">' + (Number(page.totalElements) || 0) + ' registered users · Page ' +
    (current + 1) + ' of ' + total + '</p>' +
    '<div class="table-wrap"><table><thead><tr><th>User</th><th>Email</th><th>Roles</th>' +
    '<th>Status</th><th>Action</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5">No registered users found.</td></tr>') +
    '</tbody></table></div><div class="actions section">' +
    '<button class="btn btn-secondary admin-page" type="button" data-page="' + (current - 1) + '"' +
    (current <= 0 ? ' disabled' : '') + '>Previous</button>' +
    '<button class="btn btn-secondary admin-page" type="button" data-page="' + (current + 1) + '"' +
    (current + 1 >= total ? ' disabled' : '') + '>Next</button></div></section>';
}
