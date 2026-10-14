import test from 'node:test';
import assert from 'node:assert/strict';
import { filterOrganizations, organizationDirectory } from '../js/organization-directory.js';
import { demo } from '../js/data.js';
test('directory search and region combine, with trimmed case-insensitive names',()=>{
  assert.equal(filterOrganizations(demo.organizations,' NIZWA ').length,1);
  assert.equal(filterOrganizations(demo.organizations,'nizwa','Dhofar').length,0);
  assert.equal(filterOrganizations(demo.organizations,'','Dhofar')[0].id,3);
  assert.equal(filterOrganizations(demo.organizations,'missing').length,0);
});
test('directory marks sample data and escapes region options',()=>{
  const html=organizationDirectory([{name:'Test',region:'<script>',members:1,races:2}]);
  assert.match(html,/Sample organizations and events/);
  assert.match(html,/&lt;script&gt;/);
  assert.doesNotMatch(html,/<script>/);
});
