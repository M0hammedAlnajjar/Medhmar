// ADMIN-only observability: report verified server data and browser-observed timings only.
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const validCount=x=>Number.isSafeInteger(x)&&x>=0;
const number=x=>validCount(x)?x.toLocaleString('en-US'):'—';
const time=x=>{const d=x?new Date(x):null;return d&&!Number.isNaN(d.getTime())?
 new Intl.DateTimeFormat('en-GB',{timeZone:'UTC',dateStyle:'medium',timeStyle:'medium'}).format(d)+' UTC':'Not available';};
const drawings={
 database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
 code:'<path d="m8 7-5 5 5 5"/><path d="m16 7 5 5-5 5"/><path d="m14 4-4 16"/>',
 trophy:'<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4ZM7 6H4v3a4 4 0 0 0 4 4M17 6h3v3a4 4 0 0 1-4 4"/>',
 votes:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20v-2a6 6 0 0 1 12 0v2H3ZM16 15a5 5 0 0 1 5 5h-4"/>',
 shield:'<path d="m12 2 8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3Z"/><path d="m9 12 2 2 4-4"/>',
 storage:'<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="11" r="3"/><path d="M8 17h8"/>',
 chart:'<path d="M3 18h18M4 14l5-5 4 3 7-8M16 4h4v4"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 warn:'<path d="M12 3 2 21h20L12 3ZM12 9v5M12 18h.01"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
 refresh:'<path d="M20 7v5h-5M4 17v-5h5M5.5 9a7 7 0 0 1 12.1-2L20 12M4 12l2.4 5A7 7 0 0 0 19 15"/>'
};
const icon=x=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(drawings[x]||'')+'</svg>';
const badge=(label,state)=>'<span class="admin-health-state admin-health-state-'+state+'" role="status">'+esc(label)+'</span>';
const samplesOf=xs=>Array.isArray(xs)?xs.filter(s=>s&&Number.isFinite(s.durationMs)&&s.durationMs>=0&&s.durationMs<=600000&&
 typeof s.checkedAt==='string'&&!Number.isNaN(Date.parse(s.checkedAt))&&
 ['CONNECTED','DISCONNECTED','UNAVAILABLE'].includes(s.result)).slice(-16):[];
const card=(name,sub,kind,body)=>'<article class="admin-sys-kpi"><span class="admin-sys-kpi-icon admin-sys-'+kind+'">'+
 icon(kind)+'</span><div><span class="admin-sys-kpi-name">'+esc(name)+'</span>'+body+'<small>'+esc(sub)+'</small></div></article>';
const row=(name,sub,kind,label,status)=>'<div class="admin-sys-service"><span class="admin-sys-service-icon admin-sys-'+kind+'">'+icon(kind)+
 '</span><div><strong>'+esc(name)+'</strong><small>'+esc(sub)+'</small></div>'+badge(label,status)+'</div>';
function chart(samples){
 const ss=samplesOf(samples);
 if(!ss.length)return '<div class="admin-sys-chart-empty">'+icon('chart')+
 '<strong>No response-time samples yet</strong><p>Check Connection will start a history of real requests in this browser tab.</p></div>';
 const max=Math.max(50,Math.ceil(Math.max(...ss.map(s=>s.durationMs))*1.2/50)*50);
 const x=i=>54+(ss.length===1?220:i*435/(ss.length-1));
 const y=ms=>183-Math.round(149*ms/max);
 const grid=[0,.25,.5,.75,1].map(t=>'<line x1="54" x2="503" y1="'+(183-149*t)+'" y2="'+(183-149*t)+'" stroke="#e8e4e1"/>'+
 '<text x="43" y="'+(187-149*t)+'" font-size="11" text-anchor="end" fill="#7a8496">'+Math.round(t*max)+'</text>').join('');
 const path=ss.map((s,i)=>x(i)+','+y(s.durationMs)).join(' ');
 const points=ss.map((s,i)=>'<circle cx="'+x(i)+'" cy="'+y(s.durationMs)+'" r="4" fill="'+
 (s.result==='UNAVAILABLE'?'#bc842c':'#c90931')+'"><title>'+esc(time(s.checkedAt))+
 ' · '+Math.round(s.durationMs)+' ms</title></circle>').join('');
 return '<div class="admin-sys-chart-metric"><strong>'+Math.round(ss.at(-1).durationMs)+' ms</strong>'+
 '<span>Latest observed round-trip</span><span>'+ss.length+' checks</span></div>'+
 '<svg class="admin-sys-chart" viewBox="0 0 540 210" role="img" aria-label="Measured response time for '+ss.length+' health checks">'+
 grid+(ss.length>1?'<polyline points="'+path+'" fill="none" stroke="#c90931" stroke-width="3" stroke-linecap="round"/>':'')+
 points+'<text x="54" y="204" font-size="10" fill="#84909c">Oldest</text>'+
 '<text x="503" y="204" text-anchor="end" font-size="10" fill="#84909c">Latest</text></svg>';
}
const gauge=(label,style)=>'<div class="admin-sys-resource"><div class="admin-sys-ring admin-sys-ring-'+style+
 '"><span>—</span></div><strong>'+label+'</strong><small>Not monitored</small></div>';
const sectionHead=(id,title,sub,tail='')=>'<header class="admin-sys-section-head"><div><h2 id="'+id+'">'+title+
 '</h2><p>'+sub+'</p></div>'+tail+'</header>';
export function adminSystemHealthView({data=null,error='',samples=[]}={}){
 const valid=!error&&data&&data.backendStatus==='RESPONDING'&&
 ['CONNECTED','DISCONNECTED'].includes(data.databaseStatus)&&typeof data.checkedAt==='string'&&
 !Number.isNaN(Date.parse(data.checkedAt))&&
 (data.databaseStatus==='DISCONNECTED'||(validCount(data.totalChallenges)&&validCount(data.totalVotes)));
 const connected=Boolean(valid&&data.databaseStatus==='CONNECTED');
 const result=valid?(connected?'Connected':'Disconnected'):'Unavailable';
 const snapshots=samplesOf(samples);
 const figures=card('Database','MySQL · Live SELECT 1','database',badge(result,connected?'ok':valid?'down':'unknown'))+
 card('Backend API','Authenticated health endpoint','code',badge(valid?'Responding':'Unverified',valid?'ok':'unknown'))+
 card('Challenges','Total recorded','trophy','<strong class="admin-system-count">'+(connected?number(data.totalChallenges):'—')+'</strong>')+
 card('Votes','Total saved votes across all challenges','votes','<strong class="admin-system-count">'+(connected?number(data.totalVotes):'—')+'</strong>');
 const events=snapshots.slice(-4).reverse().map(s=>
 '<li class="admin-sys-check-event"><span class="admin-sys-event-icon admin-sys-event-'+(s.result==='CONNECTED'?'ok':'warn')+
 '">'+icon(s.result==='CONNECTED'?'check':'warn')+'</span><span><strong>'+
 (s.result==='CONNECTED'?'Database check succeeded':s.result==='DISCONNECTED'?'Database disconnected':'Endpoint unavailable')+
 '</strong><small>Health check · '+Math.round(s.durationMs)+' ms</small></span>'+
 '<time datetime="'+esc(s.checkedAt)+'">'+esc(time(s.checkedAt))+'</time></li>').join('');
 return '<section class="admin-system-hero admin-sys-hero" aria-labelledby="admin-sys-title">'+
 '<div class="admin-sys-hero-copy"><span class="admin-system-eyebrow">PLATFORM OPERATIONS</span><h1 id="admin-sys-title">System Health</h1>'+
 '<p>Monitor database, API, and operational services across Medhmar.</p></div>'+
 '<img class="admin-sys-hero-art" src="/assets/admin-system-health-hero.svg" width="725" height="580" alt="" aria-hidden="true">'+
 '<div class="admin-sys-hero-tools"><span class="admin-sys-checked">'+icon('clock')+
 esc(valid?'Last checked · '+time(data.checkedAt):'Awaiting check')+'</span>'+
 '<button type="button" id="admin-health-check" class="admin-system-refresh" aria-label="Check connection again">'+
 icon('refresh')+' Check Connection</button></div></section>'+
 (!valid?'<div class="admin-system-unavailable" role="alert"><strong>Health check unavailable.</strong> '+
 'The backend did not return valid live results. Availability has not been confirmed.</div>':
 !connected?'<div class="admin-system-unavailable" role="alert"><strong>Database disconnected.</strong> Counts are unavailable until MySQL responds.</div>':'')+
 '<section class="admin-sys-kpis" aria-label="Live system health statistics">'+figures+'</section>'+
 '<div class="admin-sys-content-row"><section class="admin-system-panel admin-sys-services-panel">'+
 sectionHead('sys-service-title','Service Status','Verified probes and clearly identified monitoring gaps')+
 '<div class="admin-sys-service-list">'+
 row('Database (MySQL)',connected?'SQL SELECT 1 succeeded':'Database connection not confirmed','database',result,
 connected?'ok':valid?'down':'unknown')+
 row('Backend API',valid?'Protected endpoint responded':'Request not confirmed','code',valid?'Responding':'Unverified',valid?'ok':'unknown')+
 row('Authentication','No dedicated session health probe','shield','Not monitored','unknown')+
 row('File Storage','No storage monitoring endpoint','storage','Not monitored','unknown')+
 '</div></section><section class="admin-system-panel admin-sys-chart-panel">'+
 sectionHead('sys-chart-title','API Response Time','Actual timings from health requests in this browser tab',
 '<span class="admin-sys-chart-legend"><i></i>Health API</span>')+chart(snapshots)+'</section></div>'+
 '<div class="admin-sys-bottom-row"><section class="admin-system-panel">'+
 sectionHead('sys-resource-title','Resource Usage','No CPU, memory, or disk telemetry endpoint is configured')+
 '<div class="admin-sys-resources">'+gauge('CPU','cpu')+gauge('Memory','ram')+gauge('Disk','disk')+'</div></section>'+
 '<section class="admin-system-panel">'+
 sectionHead('sys-db-title','Database Activity','Live MySQL counts and checks from this tab')+
 '<div class="admin-sys-db-stat-grid">'+
 '<div>'+icon('trophy')+'<strong>'+(connected?number(data.totalChallenges):'—')+'</strong><small>Challenges recorded</small></div>'+
 '<div>'+icon('votes')+'<strong>'+(connected?number(data.totalVotes):'—')+'</strong><small>Votes saved</small></div>'+
 '<div>'+icon('database')+'<strong>'+snapshots.filter(s=>s.result==='CONNECTED').length+
 '</strong><small>Successful checks in this tab</small></div>'+
 '<div>'+icon('clock')+'<strong>'+(snapshots.length?Math.round(snapshots.at(-1).durationMs)+' ms':'—')+
 '</strong><small>Latest request duration</small></div></div></section>'+
 '<section class="admin-system-panel">'+sectionHead('sys-events-title','Recent Checks','This browser tab only',
 '<a href="/admin/audit-logs" data-link>View audit logs →</a>')+
 (events?'<ul class="admin-sys-events">'+events+'</ul>':
 '<p class="admin-sys-no-events">No health checks recorded in this tab yet.</p>')+'</section></div>'+
 '<p class="admin-system-note admin-sys-disclaimer">Checked: '+esc(valid?time(data.checkedAt):'Unavailable')+
 '. Data comes from the authenticated health endpoint or real browser timing. No credentials or connection details are exposed.</p>';
}
