// Administrator moderation of the EXISTING marketplace. All data comes from /api/admin/marketplace,
// which reads and writes the same listing records regular users see. No sample or mock records.
import { fmtOmr, fmtDate } from './format.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const count = v => Number.isSafeInteger(v) && v >= 0 ? v.toLocaleString('en-US') : '—';
const svg = d => '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + d + '</svg>';
const ICONS = {
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  trash: '<path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2 6"/><path d="M20 4v7h-7"/>',
  list: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  store: '<path d="M4 9 5.5 4h13L20 9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M4 9v11h16V9M10 20v-5h4v5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ban: '<circle cx="12" cy="12" r="9"/><path d="m5.6 5.6 12.8 12.8"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8Z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
  pause: '<circle cx="12" cy="12" r="9"/><path d="M10 9v6M14 9v6"/>'
};
const icon = k => svg(ICONS[k] || '');

export const STATUS_LABELS = {AVAILABLE:'Active', PENDING:'Pending', REJECTED:'Rejected', SOLD:'Sold', CANCELLED:'Inactive'};
export const SORTS = {newest:'Newest first', oldest:'Oldest first', price_asc:'Price: low to high', price_desc:'Price: high to low'};
const EDITABLE_STATUSES = ['AVAILABLE','PENDING','REJECTED'];
const statusBadge = s => '<span class="admin-users-status mkt-status-' + esc(String(s || 'unknown').toLowerCase()) + '"><span aria-hidden="true">●</span>' +
  esc(STATUS_LABELS[s] || s || 'Unknown') + '</span>';
const safeImage = u => typeof u === 'string' && (/^https?:\/\//i.test(u) || (/^\/assets\/[\w./-]+$/.test(u) && !u.includes('..'))) ? u : '';
const moderatable = l => l && l.active === true && EDITABLE_STATUSES.includes(l.status);

const validPage = d => d && Array.isArray(d.content) && Number.isInteger(d.page) && Number.isInteger(d.totalPages) && Number.isInteger(d.totalElements);
const validStats = s => s && ['total','active','pending','rejected','sold','inactive'].every(k => Number.isSafeInteger(s[k]) && s[k] >= 0);

export function marketplaceQuery(filters = {}, page = 0) {
  const q = new URLSearchParams();
  for (const k of ['search','status','category','sort']) if (filters[k]) q.set(k, String(filters[k]));
  if (page > 0) q.set('page', String(page));
  const s = q.toString();
  return '/admin/marketplace' + (s ? '?' + s : '');
}

function statCards(stats) {
  const cards = [
    ['Total Listings', stats?.total, 'list', 'total', 'All marketplace records'],
    ['Active Listings', stats?.active, 'store', 'active', 'Visible to buyers'],
    ['Pending Approval', stats?.pending, 'clock', 'pending', 'Awaiting a decision'],
    ['Rejected Listings', stats?.rejected, 'ban', 'rejected', 'Hidden by moderation'],
    ['Sold Listings', stats?.sold, 'tag', 'sold', 'Completed sales'],
    ['Inactive Listings', stats?.inactive, 'pause', 'inactive', 'Cancelled or removed']
  ];
  return '<section class="admin-users-stats" aria-label="Marketplace statistics">' + cards.map(([label, value, ic, tone, hint]) =>
    '<article class="admin-users-stat mkt-stat-' + tone + '"><span class="admin-users-stat-icon">' + icon(ic) + '</span><div>' +
    '<span class="admin-users-stat-label">' + esc(label) + '</span><strong>' + count(value) + '</strong><small>' + esc(hint) + '</small></div></article>').join('') + '</section>';
}

function hero() {
  return '<section class="admin-users-hero" aria-labelledby="admin-market-title"><div class="mkt-hero-copy"><span class="admin-users-kicker">MARKETPLACE ADMINISTRATION</span>' +
    '<h1 id="admin-market-title">Marketplace Management</h1>' +
    '<p>Monitor, review, and manage all marketplace listings across the Medhmar platform.</p></div>' +
    '<button type="button" id="admin-market-refresh" class="admin-users-refresh-btn mkt-hero-refresh">' + icon('refresh') + ' Refresh</button>' +
    '<img class="mkt-hero-art" src="/assets/admin-marketplace-racing.svg" alt="" aria-hidden="true" width="1024" height="327"></section>';
}

function row(l) {
  const img = safeImage(l.imageUrl);
  const thumb = img ? '<img class="mkt-thumb" src="' + esc(img) + '" alt="' + esc(l.title || 'Camel') + '" loading="lazy" referrerpolicy="no-referrer">' :
    '<span class="mkt-thumb mkt-thumb-empty" aria-hidden="true">' + esc(String(l.title || '?').charAt(0).toUpperCase()) + '</span>';
  const id = esc(l.listingId);
  const name = esc(l.title || 'Untitled listing');
  const btn = (act, ic, label, cls = '') => '<button type="button" class="admin-users-action mkt-action ' + cls + '" data-mkt-action="' + act + '" data-id="' + id +
    '" title="' + label + '" aria-label="' + label + ' ' + name + '">' + icon(ic) + '</button>';
  const can = moderatable(l);
  return '<tr class="mkt-row" data-listing="' + id + '"><td>' + thumb + '</td>' +
    '<td><span class="admin-users-identity"><strong>' + name + '</strong><small>#LST-' + id + '</small></span></td>' +
    '<td>' + esc(l.category || '—') + '</td>' +
    '<td><span class="admin-users-identity"><strong>' + esc(l.seller?.fullName || '—') + '</strong><small>#USR-' + esc(l.seller?.userId ?? '—') + '</small></span></td>' +
    '<td class="mkt-price">' + esc(fmtOmr(l.askingPriceOmr)) + '</td>' +
    '<td>' + statusBadge(l.status) + '</td><td>' + esc(fmtDate(l.createdAt)) + '</td>' +
    '<td class="admin-users-actions">' + btn('view', 'eye', 'View') +
    (can ? btn('edit', 'edit', 'Edit') : '') +
    (can && l.status !== 'AVAILABLE' ? btn('approve', 'check', 'Approve', 'mkt-approve') : '') +
    (can && l.status !== 'REJECTED' ? btn('reject', 'x', 'Reject', 'mkt-reject') : '') +
    (l.active === true && l.status !== 'SOLD' ? btn('remove', 'trash', 'Remove', 'mkt-remove') : '') + '</td></tr>';
}

const ACTION_LABELS = {CREATED:'Listing created', UPDATED:'Listing edited', APPROVED:'Listing approved', REJECTED:'Listing rejected',
  STATUS_CHANGED:'Status changed', REMOVED:'Listing removed', CANCELLED:'Cancelled by seller'};
function auditPanel(events, error) {
  const body = error ? '<p class="mkt-audit-note" role="alert">' + esc(error) + '</p>' :
    !events.length ? '<p class="mkt-audit-note">No marketplace activity has been recorded yet.</p>' :
    '<ul class="mkt-audit-list">' + events.slice(0, 8).map(e => {
      const t = e.createdAt ? new Date(e.createdAt) : null;
      const when = t && !Number.isNaN(t.getTime()) ? new Intl.DateTimeFormat('en-GB', {timeZone:'UTC', dateStyle:'medium', timeStyle:'short'}).format(t) + ' UTC' : '—';
      return '<li><strong>' + esc(ACTION_LABELS[e.actionType] || e.actionType) + '</strong> · Listing #' + esc(e.entityId) +
        '<small>' + esc(when) + (e.actorUserId ? ' · Admin #' + esc(e.actorUserId) : '') + '</small>' +
        (e.description ? '<em>' + esc(e.description) + '</em>' : '') + '</li>';
    }).join('') + '</ul>';
  return '<section class="admin-users-panel mkt-audit" aria-label="Recent marketplace activity"><div class="admin-users-toolbar"><div>' +
    '<h2>Recent marketplace activity</h2><p>Administrative and seller actions recorded in the audit log.</p></div>' +
    '<a class="admin-users-clear-btn mkt-audit-link" data-link href="/admin/audit-logs?entityType=Listing">Open audit logs</a></div>' + body + '</section>';
}

export function adminMarketplaceView({data = null, filters = {}, error = '', auditEvents = [], auditError = ''} = {}) {
  if (error || !data || !validStats(data.stats) || !validPage(data.page)) {
    return '<div class="admin-users-view admin-marketplace-view">' + hero() + statCards(null) +
      '<section class="admin-users-error" role="alert"><h2>Marketplace data unavailable</h2><p>' + esc(error || 'The server returned an unexpected response.') +
      '</p><button type="button" id="admin-retry" class="btn btn-secondary">Retry</button></section></div>';
  }
  const {stats, page} = data;
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const f = {search: filters.search || '', status: filters.status || '', category: filters.category || '', sort: filters.sort || 'newest'};
  const opt = (value, label, current) => '<option value="' + esc(value) + '"' + (value === current ? ' selected' : '') + '>' + esc(label) + '</option>';
  const catOptions = (categories.includes(f.category) || !f.category ? categories : [...categories, f.category]);
  const filtersForm = '<form class="admin-users-filters" id="admin-market-filters" role="search" autocomplete="off">' +
    '<label class="admin-users-field admin-users-field-search"><span>Search listings</span><span class="admin-users-search">' + icon('search') +
    '<input type="search" name="search" maxlength="100" placeholder="Listing title or seller name" value="' + esc(f.search) + '"></span></label>' +
    '<label class="admin-users-field"><span>Status</span><select name="status"><option value="">All statuses</option>' +
    Object.entries(STATUS_LABELS).map(([v, l]) => opt(v, l, f.status)).join('') + '</select></label>' +
    '<label class="admin-users-field"><span>Category</span><select name="category"><option value="">All categories</option>' +
    catOptions.map(c => opt(c, c, f.category)).join('') + '</select></label>' +
    '<label class="admin-users-field"><span>Sort by</span><select name="sort">' +
    Object.entries(SORTS).map(([v, l]) => opt(v, l, f.sort)).join('') + '</select></label>' +
    '<div class="admin-users-filter-actions"><button class="admin-users-filter-btn" type="submit">Apply</button> ' +
    '<button class="admin-users-clear-btn" type="button" id="admin-market-clear">Clear filters</button></div></form>';
  const rows = page.content.map(row).join('');
  const from = page.totalElements === 0 ? 0 : page.page * (page.size || page.content.length) + 1;
  const to = page.page * (page.size || page.content.length) + page.content.length;
  const filtered = Boolean(f.search || f.status || f.category);
  const pager = '<div class="admin-users-pagination"><button type="button" data-mkt-page="' + (page.page - 1) + '"' + (page.page <= 0 ? ' disabled' : '') + ' aria-label="Previous page">‹</button>' +
    '<span>Page ' + (page.page + 1) + ' of ' + Math.max(1, page.totalPages) + '</span>' +
    '<button type="button" data-mkt-page="' + (page.page + 1) + '"' + (page.page + 1 >= page.totalPages ? ' disabled' : '') + ' aria-label="Next page">›</button></div>';
  return '<div class="admin-users-view admin-marketplace-view">' + hero() + statCards(stats) +
    '<section class="admin-users-panel" aria-label="Marketplace listings"><div class="admin-users-toolbar"><div><h2>Marketplace listings</h2>' +
    '<p>Review, edit, approve, reject or remove listings. Changes apply to the live marketplace.</p></div>' +
    '<span class="admin-users-live-count">' + count(page.totalElements) + ' listings' + (filtered ? ' match' : '') + '</span></div>' + filtersForm +
    '<div class="admin-users-scroll"><table class="admin-users-table mkt-table"><thead><tr><th>Image</th><th>Listing</th><th>Category</th><th>Seller</th><th>Price</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="8" class="admin-users-no-data">' + (filtered ? 'No listings match these filters.' : 'No marketplace listings exist yet.') + '</td></tr>') +
    '</tbody></table></div><footer class="admin-users-foot"><p>' + (page.totalElements ? 'Showing ' + from + ' to ' + to + ' of ' + count(page.totalElements) + ' listings' : 'No listings to show') + '</p>' + pager + '</footer></section>' +
    auditPanel(Array.isArray(auditEvents) ? auditEvents : [], auditError) + '</div>';
}

// ---------- dialogs ----------
const dl = rows => '<dl class="mkt-facts">' + rows.map(([k, v]) => '<div><dt>' + esc(k) + '</dt><dd>' + v + '</dd></div>').join('') + '</dl>';
function detailsHtml(l) {
  const img = safeImage(l.imageUrl);
  return '<h2>' + esc(l.title || 'Untitled listing') + '</h2><p class="mkt-modal-sub">Listing #' + esc(l.listingId) + ' · ' + statusBadge(l.status) + '</p>' +
    (img ? '<img class="mkt-detail-photo" src="' + esc(img) + '" alt="' + esc(l.title || 'Camel') + '" referrerpolicy="no-referrer">' : '') +
    '<p class="mkt-description">' + esc(l.description || 'No description provided.') + '</p>' +
    dl([['Category', esc(l.category || '—')], ['Breed', esc(l.breed || '—')], ['Price', esc(fmtOmr(l.askingPriceOmr)) + ' (' + esc(l.currency || 'OMR') + ')'],
      ['Seller', esc(l.seller?.fullName || '—') + ' (#' + esc(l.seller?.userId ?? '—') + ')'], ['Seller email', esc(l.seller?.email || '—')],
      ['Created', esc(fmtDate(l.createdAt))], ['Last updated', esc(fmtDate(l.updatedAt))],
      ['Public marketplace', l.publiclyVisible ? 'Visible to buyers' : 'Hidden from buyers']]);
}
const footer = (confirmLabel, danger) => '<p class="admin-module-form-error mkt-error" role="alert" hidden></p><div class="modal-actions"><button type="button" class="btn btn-secondary" data-mkt-close>Cancel</button>' +
  (confirmLabel ? '<button type="submit" class="btn ' + (danger ? 'btn-danger' : 'btn-primary') + '">' + esc(confirmLabel) + '</button>' : '') + '</div>';

export function bindAdminMarketplace(root, actions = {}) {
  const view = root.querySelector('.admin-users-view');
  if (!view || !view.querySelector('#admin-market-title')) return;
  const filtersForm = root.querySelector('#admin-market-filters');
  const go = (filters, page = 0) => actions.navigate(marketplaceQuery(filters, page));
  const current = () => Object.fromEntries(new FormData(filtersForm).entries());
  root.querySelector('#admin-market-refresh')?.addEventListener('click', () => actions.refresh());
  filtersForm?.addEventListener('submit', e => { e.preventDefault(); go(current()); });
  root.querySelector('#admin-market-clear')?.addEventListener('click', () => actions.navigate('/admin/marketplace'));
  root.querySelectorAll('[data-mkt-page]').forEach(b => b.addEventListener('click', () => {
    if (!b.disabled) go(actions.filters || {}, Number(b.dataset.mktPage));
  }));

  const close = () => document.getElementById('modal')?.remove();
  const open = (html, onSubmit) => {
    close();
    document.body.insertAdjacentHTML('beforeend', '<div class="modal-backdrop" id="modal"><div class="modal mkt-modal" role="dialog" aria-modal="true"><form class="form" novalidate>' + html + '</form></div></div>');
    const modal = document.getElementById('modal'), form = modal.querySelector('form');
    modal.addEventListener('click', e => { if (e.target === modal) close(); });
    modal.querySelectorAll('[data-mkt-close]').forEach(b => b.addEventListener('click', close));
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (!onSubmit) return;
      const submit = form.querySelector('[type="submit"]'), error = form.querySelector('.mkt-error');
      error.hidden = true;
      if (submit) submit.disabled = true;
      try { await onSubmit(Object.fromEntries(new FormData(form).entries())); close(); }
      catch (err) { error.textContent = err?.message || 'Request failed.'; error.hidden = false; if (submit) submit.disabled = false; }
    });
    form.querySelector('input,textarea,select,button')?.focus();
    return form;
  };
  const listing = async id => {
    try { return await actions.get(id); } catch (err) { actions.toast(err?.message || 'Unable to load the listing.', 'error'); return null; }
  };

  root.querySelectorAll('[data-mkt-action]').forEach(button => button.addEventListener('click', async () => {
    const id = button.dataset.id, kind = button.dataset.mktAction;
    button.disabled = true;
    const l = await listing(id);
    button.disabled = false;
    if (!l) return;
    const label = esc(l.title || 'Listing') + ' (#' + esc(l.listingId) + ')';
    if (kind === 'view') {
      open(detailsHtml(l) + footer('', false).replace('Cancel', 'Close'));
    } else if (kind === 'edit') {
      open('<h2>Edit listing</h2><p class="mkt-modal-sub">' + label + '. Category and photo belong to the camel record and are not editable here.</p>' +
        '<div class="field"><label>Asking price (OMR)</label><input class="input" name="askingPriceOmr" type="number" min="0.001" step="0.001" required value="' + esc(l.askingPriceOmr ?? '') + '"></div>' +
        '<div class="field"><label>Description</label><textarea class="textarea" name="description" minlength="3" maxlength="255" rows="4" required>' + esc(l.description || '') + '</textarea></div>' +
        '<div class="field"><label>Status</label><select class="select" name="status">' + EDITABLE_STATUSES.map(s => '<option value="' + s + '"' + (s === l.status ? ' selected' : '') + '>' + esc(STATUS_LABELS[s]) + '</option>').join('') + '</select></div>' +
        footer('Save changes', false), async f => {
          const price = Number(f.askingPriceOmr), text = String(f.description || '').trim();
          if (!Number.isFinite(price) || price <= 0) throw new Error('Enter an asking price greater than zero.');
          if (text.length < 3 || text.length > 255) throw new Error('Description must contain between 3 and 255 characters.');
          await actions.update(id, {askingPriceOmr: f.askingPriceOmr, description: text});
          if (f.status !== l.status) await actions.setStatus(id, f.status);
          actions.done('Listing updated.');
        });
    } else if (kind === 'approve') {
      open('<h2>Approve listing?</h2><p class="mkt-modal-sub">' + label + ' will become Active and visible in the public marketplace.</p>' + footer('Approve listing', false),
        async () => { await actions.approve(id); actions.done('Listing approved.'); });
    } else if (kind === 'reject') {
      open('<h2>Reject listing?</h2><p class="mkt-modal-sub">' + label + ' will be hidden from the public marketplace. The seller keeps their account and the listing record.</p>' +
        '<div class="field"><label>Reason (optional, recorded in the audit log)</label><textarea class="textarea" name="reason" maxlength="500" rows="3"></textarea></div>' + footer('Reject listing', true),
        async f => { await actions.reject(id, String(f.reason || '').trim()); actions.done('Listing rejected.'); });
    } else if (kind === 'remove') {
      open('<h2>Remove listing?</h2><p class="mkt-modal-sub">You are removing <strong>' + label + '</strong> listed by ' + esc(l.seller?.fullName || 'unknown seller') +
        '. It disappears from the public marketplace and is marked Inactive (soft delete). The seller account is not affected.</p>' +
        '<div class="field"><label>Reason (optional, recorded in the audit log)</label><textarea class="textarea" name="reason" maxlength="500" rows="3"></textarea></div>' + footer('Remove listing', true),
        async f => { await actions.remove(id, String(f.reason || '').trim()); actions.done('Listing removed.'); });
    }
  }));
}
