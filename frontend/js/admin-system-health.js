// ADMIN-only live status view. Values must come from /api/admin/system-health.
const esc = value => String(value ?? '').replace(/[&<>"']/g,char=>({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;'
}[char]));
const count = value => Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString('en-US') : 'Unavailable';
const checkedAt = value => {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ?
    new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',dateStyle:'medium',timeStyle:'medium'}).format(parsed)+' UTC' :
    'Not available';
};
const stateBadge = (value,good) =>
  '<span class="admin-health-state '+(good?'admin-health-state-ok':'admin-health-state-down')+
  '" role="status">'+esc(value)+'</span>';
const detail = (label,content) => '<div class="admin-system-card"><span class="admin-system-label">'+
  esc(label)+'</span>'+content+'</div>';

export function adminSystemHealthView({data=null,error=''}={}) {
  const goodResponse = !error && data && data.backendStatus==='RESPONDING' &&
    ['CONNECTED','DISCONNECTED'].includes(data.databaseStatus) &&
    typeof data.checkedAt==='string' &&
    (data.databaseStatus==='DISCONNECTED' ||
      (Number.isSafeInteger(data.totalChallenges) && data.totalChallenges>=0 &&
       Number.isSafeInteger(data.totalVotes) && data.totalVotes>=0));
  const connected = Boolean(goodResponse && data.databaseStatus==='CONNECTED');
  const details = goodResponse
    ? '<div class="admin-system-grid">'+
      detail('Backend API',stateBadge('Responding',true)+
        '<p>The protected health endpoint returned an authenticated response.</p>')+
      detail('MySQL database',stateBadge(connected?'Connected':'Disconnected',connected)+
        '<p>'+(connected?'Live SELECT 1 query succeeded.':'Database query failed. Counts are unavailable.')+'</p>')+
      detail('Challenges', '<strong class="admin-system-count">'+(connected?count(data.totalChallenges):'—')+'</strong>'+
        '<p>Total recorded challenges, including drafts and closed events.</p>')+
      detail('Votes', '<strong class="admin-system-count">'+(connected?count(data.totalVotes):'—')+'</strong>'+
        '<p>Total saved votes across all challenges.</p>')+
      '</div>'
    : '<section class="admin-system-unavailable" role="alert"><h2>Health check unavailable</h2>'+
      '<p>The Backend API could not provide a valid health response. Check that Spring Boot is running and try again.</p></section>';
  return '<section class="admin-system-hero"><div><span class="admin-system-eyebrow">PLATFORM OPERATIONS</span>'+
    '<h1>Database &amp; API Health</h1><p>Verify the real backend connection and challenge activity.</p></div>'+
    '<button id="admin-health-check" type="button" class="admin-system-refresh" aria-label="Check connection again">'+
    '⟳ Check Connection</button></section>'+
    '<section class="admin-system-panel" aria-label="System health report" aria-live="polite">'+
    '<div class="admin-system-panel-top"><div><h2>Connection overview</h2>'+
    '<p>Live, read-only health checks from Medhmar.</p></div>'+
    '<span class="admin-system-checked">Checked: '+esc(goodResponse?checkedAt(data.checkedAt):'Not available')+'</span></div>'+
    details+
    '<p class="admin-system-note">Counts are queried directly from the configured application database. '+
    'No credentials, JDBC URL, database host or connection secrets are exposed.</p></section>';
}
