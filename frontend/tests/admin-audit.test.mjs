import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { adminAuditListView, adminAuditDetailView } from '../js/admin-audit.js';

const record = { auditId: 12, actionType: 'ROLE_UPDATED', entityType: 'User',
  entityId: 81, actorUserId: 7, camelId: null,
  createdAt: '2026-10-20T08:30:00Z', description: 'Role change approved' };
const page = { content: [record], page: 0, size: 20, totalElements: 31, totalPages: 2 };

test('read-only audit list renders real records with actor and UTC time', () => {
  const html = adminAuditListView({ data: page, filters: { actionType: 'ROLE_UPDATED' } });
  assert.match(html, /Audit Logs|ROLE_UPDATED|Actor|#7/);
  assert.match(html, /UTC|31 matching records/);
  assert.match(html, /href="\/admin\/audit-logs\/12"/);
  assert.match(html, /href="\/admin\/audit-logs\?actionType=ROLE_UPDATED&amp;page=1"/);
  assert.match(html, /Read only/);
  assert.doesNotMatch(html, /Add Audit|Edit Audit|delete-audit|audit-add|audit-edit/);
});
test('audit list never inserts raw data into HTML and has safe empty/error states', () => {
  const evil = '<img src=x onerror=alert(1)>';
  const html = adminAuditListView({ data:{...page,content:[{...record, actionType:evil,entityType:evil}]},
    filters:{actionType:evil} });
  assert.doesNotMatch(html, /<img src=x/);
  assert.match(html, /&lt;img src=x/);
  assert.match(adminAuditListView({data:{...page,content:[],totalElements:0,totalPages:0}}), /No audit events found/);
  assert.match(adminAuditListView({error:'<script>alert(1)</script>'}), /&lt;script&gt;/);
  assert.match(adminAuditListView({data:null}), /invalid audit history response/);
});
test('audit detail is immutable and safely displays description', () => {
  const html = adminAuditDetailView({record:{...record,description:'<svg onload=alert(1)>'}});
  assert.match(html,/Audit event #12|Role|ROLE_UPDATED/);
  assert.match(html,/Not recorded|—/);
  assert.match(html,/&lt;svg onload=alert/);
  assert.doesNotMatch(html,/Edit|Delete|Create Entry/);
  assert.match(adminAuditDetailView({error:'Not found'}), /Not found/);
});
test('audit route and API contain no client mutation actions', async () => {
  const app=await readFile(new URL('../js/app.js',import.meta.url),'utf8');
  const api=await readFile(new URL('../js/api.js',import.meta.url),'utf8');
  const routes=await readFile(new URL('../js/routes.js',import.meta.url),'utf8');
  assert.match(app,/adminAuditApi\.list\(auditFilters\(\)\)/);
  assert.match(app,/adminAuditApi\.one\(match\.params\.id\)/);
  assert.doesNotMatch(app,/delete-audit|audit-add|audit-edit|auditForm|auditLogApi/);
  assert.match(api,/export const adminAuditApi/);
  assert.doesNotMatch(api,/\/audit-log\/add|\/audit-log\/update|\/audit-log\/deleteById/);
  assert.doesNotMatch(routes,/Add Audit Log|Edit Audit Log/);
});

test('approved trace artwork is decorative and audit records remain read-only', async () => {
  const svg = await readFile(new URL('../assets/admin-audit-hero.svg', import.meta.url), 'utf8');
  assert.match(svg, /<svg[^>]+viewBox="0 0 1225 475"/);
  assert.match(svg, /Decorative audit illustration/);
  assert.doesNotMatch(svg, /<image|<script|foreignObject|data:image/);
  for (const html of [adminAuditListView({data:page}),adminAuditDetailView({record}),adminAuditListView({error:'Unavailable'})]) {
    assert.match(html, /aria-labelledby="admin-audit-title"/);
    assert.match(html, /<img class="admin-audit-hero-art"[^>]*alt="" aria-hidden="true"/);
    assert.match(html, /class="admin-audit-readonly" aria-label="Read-only history"/);
    assert.match(html, /Read only<\/span>/);
    assert.doesNotMatch(html, /Add Audit|Edit Audit|Delete Audit/);
  }
});
