import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { adminMarketplaceView, marketplaceQuery, STATUS_LABELS } from '../js/admin-marketplace.js';
import { adminShell } from '../js/admin-console.js';
import { matchRoute, canAccessRoute } from '../js/routes.js';

const stats = {total:6, active:2, pending:1, rejected:1, sold:1, inactive:1, generatedAt:'2030-01-01T00:00:00Z'};
const listing = (over = {}) => ({listingId:11, title:'Shahin', description:'Race ready', category:'RACING', breed:'Omani',
  imageUrl:'https://example.invalid/a.jpg', askingPriceOmr:3000, currency:'OMR', status:'AVAILABLE', active:true, publiclyVisible:true,
  createdAt:'2030-01-01T09:00:00Z', camelId:4, seller:{userId:9, fullName:'Seller One', email:'s@example.invalid'}, ...over});
const page = (content, extra = {}) => ({content, page:0, size:10, totalElements:content.length, totalPages:content.length ? 1 : 0, ...extra});
const view = (content, extra = {}) => adminMarketplaceView({data:{stats, page:page(content), categories:['RACING','BREEDING']}, ...extra});

test('Marketplace Management is in the sidebar directly below Manage Users and highlights when selected', () => {
  const html = adminShell({user:{fullName:'Admin'}, active:'/admin/marketplace', body:'x'});
  const nav = html.match(/<nav class="admin-sidebar-nav"[\s\S]*?<\/nav>/)[0];
  const labels = [...nav.matchAll(/<span>([^<]+)<\/span><\/a>/g)].map(m => m[1]);
  assert.equal(labels[labels.indexOf('Manage Users') + 1], 'Marketplace Management');
  assert.deepEqual(labels.filter(l => ['Dashboard','Manage Users','Audit Logs','Admin Settings'].includes(l)),
    ['Dashboard','Manage Users','Audit Logs','Admin Settings']);
  assert.match(html, /href="\/admin\/marketplace" data-link class="active" aria-current="page"><span class="admin-nav-icon"><svg/);
  assert.match(adminShell({user:{}, active:'/admin', body:''}), /href="\/admin\/marketplace" data-link><span/);
  assert.doesNotMatch(html, /href="\/marketplace"/);
});

test('the admin marketplace route is ADMIN-only', () => {
  const route = matchRoute('/admin/marketplace')?.route;
  assert.ok(route);
  assert.equal(canAccessRoute(route, {userId:1, roles:['ADMIN']}), true);
  for (const role of ['VIEWER','OWNER','ORGANIZER','TRAINER']) assert.equal(canAccessRoute(route, {userId:1, roles:[role]}), false);
  assert.equal(canAccessRoute(route, null), false);
});

test('statistics and table render only real values from the API', () => {
  const html = view([listing(), listing({listingId:12, title:'Reem', status:'PENDING', publiclyVisible:false})]);
  for (const label of ['Total Listings','Active Listings','Pending Approval','Rejected Listings','Sold Listings','Inactive Listings'])
    assert.match(html, new RegExp(label));
  assert.match(html, /<strong>6<\/strong>/);
  for (const col of ['Image','Listing','Category','Seller','Price','Status','Created','Actions']) assert.match(html, new RegExp('<th>' + col + '</th>'));
  assert.match(html, /Marketplace Management/);
  assert.match(html, /Monitor, review, and manage all marketplace listings across the Medhmar platform\./);
  assert.match(html, /Seller One/); assert.match(html, /3,000 OMR/); assert.match(html, /2 listings/);
  assert.match(html, /id="admin-market-refresh"/);
  for (const s of ['AVAILABLE','PENDING','REJECTED','SOLD','CANCELLED']) assert.ok(STATUS_LABELS[s]);
});

test('row actions follow the listing state', () => {
  const act = (l, a) => new RegExp('data-mkt-action="' + a + '" data-id="' + l.listingId + '"').test(view([l]));
  const active = listing(), pending = listing({status:'PENDING'}), rejected = listing({status:'REJECTED'});
  const sold = listing({status:'SOLD', active:false}), gone = listing({status:'CANCELLED', active:false});
  assert.ok(act(active, 'view') && act(active, 'edit') && act(active, 'reject') && act(active, 'remove') && !act(active, 'approve'));
  assert.ok(act(pending, 'approve') && act(pending, 'reject'));
  assert.ok(act(rejected, 'approve') && !act(rejected, 'reject') && act(rejected, 'remove'));
  for (const l of [sold, gone]) assert.ok(act(l, 'view') && !act(l, 'edit') && !act(l, 'approve') && !act(l, 'reject') && !act(l, 'remove'));
});

test('untrusted listing data is escaped and unsafe image URLs are dropped', () => {
  const evil = listing({title:'<img src=x onerror=alert(1)>', imageUrl:'javascript:alert(1)', seller:{userId:1, fullName:'<script>x</script>'}});
  const html = view([evil]);
  assert.doesNotMatch(html, /<img src=x|<script>x/);
  assert.doesNotMatch(html, /javascript:alert/);
  assert.match(html, /&lt;img src=x/);
  assert.match(adminMarketplaceView({error:'<b>bad</b>'}), /&lt;b&gt;bad&lt;\/b&gt;/);
});

test('empty, filtered-empty and error states are explicit and never show fabricated totals', () => {
  assert.match(view([]), /No marketplace listings exist yet\./);
  assert.match(view([], {filters:{search:'zzz'}}), /No listings match these filters\./);
  const failed = adminMarketplaceView({error:'Unable to load live marketplace data. Please retry.'});
  assert.match(failed, /Marketplace data unavailable/); assert.match(failed, /id="admin-retry"/);
  assert.doesNotMatch(failed, /<strong>\d/); assert.match(failed, /<strong>—<\/strong>/);
  assert.match(adminMarketplaceView({data:{stats:{total:'x'}, page:page([])}}), /Marketplace data unavailable/);
});

test('filters, sort, pagination and audit activity are wired', () => {
  const html = view([listing()], {filters:{search:'sha', status:'PENDING', category:'RACING', sort:'price_asc'},
    auditEvents:[{auditId:1, actionType:'REJECTED', entityId:11, actorUserId:2, createdAt:'2030-01-01T09:00:00Z', description:'Status AVAILABLE -> REJECTED; reason: spam'}]});
  assert.match(html, /name="search"[^>]*value="sha"/);
  assert.match(html, /<option value="PENDING" selected>Pending/);
  assert.match(html, /<option value="RACING" selected>RACING/);
  assert.match(html, /<option value="price_asc" selected>/);
  assert.match(html, /data-mkt-page="1" disabled|data-mkt-page="1"[^>]*disabled/);
  assert.match(html, /Listing rejected/); assert.match(html, /reason: spam/);
  assert.match(html, /href="\/admin\/audit-logs\?entityType=Listing"/);
  assert.equal(marketplaceQuery({search:'a b', status:'SOLD', sort:'newest'}, 2), '/admin/marketplace?search=a+b&status=SOLD&sort=newest&page=2');
  assert.equal(marketplaceQuery({}, 0), '/admin/marketplace');
  assert.match(adminMarketplaceView({data:{stats, page:page([listing()]), categories:[]}, auditError:'Recent activity is temporarily unavailable.'}), /temporarily unavailable/);
});

test('data is loaded from the admin marketplace API after server-side admin verification', async () => {
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const api = await readFile(new URL('../js/api.js', import.meta.url), 'utf8');
  for (const call of ['adminMarketplaceApi.stats()', 'adminMarketplaceApi.list(filters)', 'adminMarketplaceApi.categories()', 'bindAdminMarketplace(root'])
    assert.ok(app.includes(call), call);
  for (const endpoint of ['/api/admin/marketplace', '/approve', '/reject', '/status', '/stats', '/categories'])
    assert.ok(api.includes(endpoint), endpoint);
  assert.match(app, /'Admin Marketplace':adminMarketplacePage/);
  // The page must not ship sample or mock listings.
  const mod = await readFile(new URL('../js/admin-marketplace.js', import.meta.url), 'utf8');
  assert.doesNotMatch(mod, /mock-marketplace|sampleMarketplacePage|Illustrative/i);
});
