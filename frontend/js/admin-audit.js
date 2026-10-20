// Medhmar administrator audit history: uneditable, backend-paginated records.
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
})[char]);
const display = value => value === null || value === undefined || value === '' ? '—' : esc(value);
const dateLabel = value => {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return '—';
  return esc(new Intl.DateTimeFormat('en-GB', {
    timeZone:'UTC', dateStyle:'medium', timeStyle:'short'
  }).format(date) + ' UTC');
};
const queryUrl = (filters, page) => {
  const query = new URLSearchParams();
  for (const key of ['actionType','entityType','actorUserId','from','to']) {
    if (filters[key]) query.set(key, String(filters[key]));
  }
  if (page > 0) query.set('page', String(page));
  const encoded = query.toString();
  return '/admin/audit-logs' + (encoded ? '?' + encoded : '');
};
const failure = message => '<section class="admin-audit-message" role="alert"><h2>Audit history unavailable</h2><p>' +
  esc(message || 'Could not load audit records. Please retry.') +
  '</p><a href="/admin/audit-logs" data-link class="admin-audit-button">Try again</a></section>';
const heading = (title, sub) => '<header class="admin-audit-hero"><div><p class="admin-audit-eyebrow">PLATFORM SECURITY</p><h1>' +
  esc(title) + '</h1><p>' + esc(sub) +
  '</p></div><span class="admin-audit-readonly" aria-label="Read-only history">Read only</span></header>';

export function adminAuditListView({ data = null, filters = {}, error = '' } = {}) {
  if (error) return heading('Audit Logs','Track significant changes across Medhmar.') + failure(error);
  if (!data || !Array.isArray(data.content) || !Number.isInteger(data.totalElements) ||
      !Number.isInteger(data.page) || !Number.isInteger(data.totalPages)) {
    return heading('Audit Logs','Track significant changes across Medhmar.') +
      failure('The server returned an invalid audit history response.');
  }
  const fields = [
    ['actionType','Action','text'], ['entityType','Entity','text'],
    ['actorUserId','Actor user ID','number'], ['from','From (UTC)','date'], ['to','To (UTC)','date']
  ];
  const form = '<form id="admin-audit-filters" class="admin-audit-filters">' +
    fields.map(([name,label,type])=>'<label><span>' + esc(label) + '</span><input name="' +
      name + '" type="' + type + '" value="' + esc(filters[name] || '') + '"' +
      (type === 'number' ? ' min="1" step="1"' : '') +
      (type === 'text' ? ' maxlength="50"' : '') + '></label>').join('') +
    '<div class="admin-audit-filter-actions"><button type="submit" class="admin-audit-button">Apply filters</button>' +
    '<a data-link href="/admin/audit-logs" class="admin-audit-reset">Clear</a></div></form>';
  const records = data.content;
  const body = records.map(record => '<tr>' +
    '<td><strong>#' + display(record.auditId) + '</strong></td>' +
    '<td><span class="admin-audit-action">' + display(record.actionType) + '</span></td>' +
    '<td>' + display(record.entityType) + ' <small>#' + display(record.entityId) + '</small></td>' +
    '<td>' + (record.actorUserId == null ? 'Not recorded' : '#' + display(record.actorUserId)) + '</td>' +
    '<td>' + (record.camelId == null ? '—' : '#' + display(record.camelId)) + '</td>' +
    '<td><time>' + dateLabel(record.createdAt) + '</time></td>' +
    '<td><a class="admin-audit-view" data-link href="/admin/audit-logs/' +
      encodeURIComponent(String(record.auditId)) + '">View details</a></td></tr>').join('');
  const pager = '<div class="admin-audit-pagination"><span>Showing ' +
    (records.length ? (data.page * data.size + 1) + '–' +
      (data.page * data.size + records.length) : '0') + ' of ' + data.totalElements + ' records</span>' +
    '<div>' + (data.page > 0 ? '<a data-link href="' + esc(queryUrl(filters, data.page - 1)) +
      '">Previous</a>' : '') +
    '<span>Page ' + (data.page + 1) + ' of ' + Math.max(1, data.totalPages) + '</span>' +
    (data.page + 1 < data.totalPages ? '<a data-link href="' +
      esc(queryUrl(filters, data.page + 1)) + '">Next</a>' : '') + '</div></div>';
  return heading('Audit Logs','A permanent, searchable record of platform changes. Times are shown in UTC.') +
    '<section class="admin-audit-panel"><div class="admin-audit-panel-heading"><h2>Event history</h2>' +
    '<p>' + data.totalElements + ' matching records · latest first</p></div>' + form +
    (records.length ? '<div class="admin-audit-table-wrap"><table class="admin-audit-table"><thead><tr>' +
      '<th>Event</th><th>Action</th><th>Entity</th><th>Actor</th><th>Camel</th><th>Recorded (UTC)</th><th>Details</th>' +
      '</tr></thead><tbody>' + body + '</tbody></table></div>' :
      '<div class="admin-audit-empty"><h3>No audit events found</h3><p>Try different filters or check back after platform activity.</p></div>') +
    pager + '</section><p class="admin-audit-disclaimer">Entries are created by backend operations, and cannot be edited or deleted from the dashboard. ' +
    'Older records may not include an actor ID.</p>';
}

export function adminAuditDetailView({ record = null, error = '' } = {}) {
  const back = '<a href="/admin/audit-logs" data-link class="admin-audit-back">← Back to audit history</a>';
  if (error || !record || record.auditId == null) {
    return heading('Audit event','View a recorded platform action.') + back +
      failure(error || 'Audit event was not found.');
  }
  const fields = [
    ['Event ID', '#' + record.auditId], ['Action',record.actionType],
    ['Entity type',record.entityType], ['Entity ID',record.entityId == null ? null : '#' + record.entityId],
    ['Actor user ID',record.actorUserId == null ? 'Not recorded' : '#' + record.actorUserId],
    ['Camel ID',record.camelId == null ? null : '#' + record.camelId],
    ['Recorded (UTC)',dateLabel(record.createdAt)]
  ];
  return heading('Audit event #' + record.auditId,'Recorded by the backend. This event cannot be altered.') +
    back + '<section class="admin-audit-panel admin-audit-detail"><h2>Event details</h2><dl>' +
    fields.map(([name,value])=>'<div><dt>' + esc(name) + '</dt><dd>' +
      (name === 'Recorded (UTC)' ? value : display(value)) + '</dd></div>').join('') +
    '</dl><h3>Description</h3><p class="admin-audit-description">' +
    display(record.description || 'No additional description recorded.') +
    '</p></section>';
}
