import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { pedigreeView, bindPedigreeImages } from '../js/pedigree-view.js';
import { matchRoute, canAccessRoute } from '../js/routes.js';

const render = tree => pedigreeView({ status: 'ready', data: { tree } });
const family = {
  camelId: 41, name: 'Barq', photoUrl: 'https://example.com/barq.jpg',
  sire: { camelId: 2, name: 'Al Zaeem', sire: { camelId: 4, name: 'Al Majd' }, damName: 'Al Noor' },
  dam: { camelId: 3, name: 'Bint Al Reem', sireName: 'Al Sultan', dam: { camelId: 7, name: 'Al Dewa' } },
};

test('renders the requested camel and keeps paternal and maternal ancestors on their own branches', () => {
  const html = render(family);
  const paternal = html.split('aria-label="Paternal ancestry"')[1].split('aria-label="Maternal ancestry"')[0];
  const maternal = html.split('aria-label="Maternal ancestry"')[1];
  assert.match(html, /Barq’s family/);
  assert.match(html, /href="\/camels\/41\/profile"/);
  assert.match(paternal, /Sire: Al Zaeem/);
  assert.match(paternal, /Paternal Grand Sire: Al Majd/);
  assert.match(paternal, /Paternal Grand Dam: Al Noor/);
  assert.doesNotMatch(paternal, /Al Sultan|Al Dewa/);
  assert.match(maternal, /Maternal Grand Sire: Al Sultan/);
  assert.match(maternal, /Maternal Grand Dam: Al Dewa/);
  assert.equal((html.match(/class="pedigree-node(?: |")/g) || []).length, 7);
  assert.match(html, /href="\/camels\/2" data-link/);
  assert.match(html, /https:\/\/example.com\/barq.jpg/);
});

test('shows the edit action only when the current user may manage this camel', () => {
  const editable = pedigreeView({ status: 'ready', data: { tree: family, canEdit: true } });
  const readOnly = pedigreeView({ status: 'ready', data: { tree: family, canEdit: false } });
  assert.match(editable, /href="\/camels\/41\/pedigree\/edit"/);
  assert.doesNotMatch(readOnly, /\/pedigree\/edit/);
});

test('unknown and name-only ancestors never invent names, IDs, photos or links', () => {
  const html = render({ camelId: 52, name: 'Najm', sireName: 'Unregistered sire' });
  assert.match(html, /Unregistered sire/);
  assert.match(html, /Name only/);
  assert.equal((html.match(/class="pedigree-node pedigree-node-empty"/g) || []).length, 5);
  assert.doesNotMatch(html, /href="\/camels\/(?:undefined|null|2)"|data-pedigree-photo|Barq|Al Zaeem/);
  assert.match(html, /Not recorded/);
});

test('camel names are escaped and unsafe photo URLs are rejected', () => {
  const html = render({ camelId: 42, name: '<img src=x onerror=alert(1)>', photoUrl: 'javascript:alert(1)', sireName: '<script>alert(1)</script>' });
  assert.doesNotMatch(html, /<script>|<img src=x|javascript:|data-pedigree-photo/);
  assert.match(html, /&lt;img/);
  assert.match(render({ camelId: 43, name: 'Photo', photoUrl: '/assets/mock-camels/camel-1.jpg' }), /data-pedigree-photo/);
});

test('loading, missing records and server failures do not show a fabricated tree', () => {
  assert.match(pedigreeView({ status: 'loading' }), /Loading pedigree/);
  for (const status of [401, 403, 404, 500, 0]) {
    const html = pedigreeView({ status: 'error', error: { status } });
    assert.doesNotMatch(html, /class="pedigree-tree"|Barq/);
    if (status === 404) assert.match(html, /Camel not found/);
    if (status === 500 || status === 0) assert.match(html, /data-act="retry"/);
  }
  assert.match(pedigreeView({ status: 'ready', data: { tree: null } }), /Unable to load pedigree/);
});

const source = (await readFile(new URL('../js/app.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\r?\n/gm, '')
  .replace("window.addEventListener('popstate',render); init();", '');

test('route loads live data by ID and ignores a late response after moving to another camel', async () => {
  const requests = [], pending = new Map();
  const root = { innerHTML: '', addEventListener() {}, querySelectorAll: () => [] };
  const location = { pathname: '/camels/41', search: '' };
  const context = vm.createContext({
    demo: {
      camel: {}
    },
    pedigreeView, bindPedigreeImages, matchRoute, canAccessRoute, authView: () => '',
    normalizePath: () => location.pathname, location,
    localStorage: { getItem: () => null },
    document: { querySelector: s => s === '#app' ? root : null, querySelectorAll: () => [], documentElement: {} },
    pedigreeApi: { tree: id => { requests.push(id); return new Promise(resolve => pending.set(id, resolve)); } },
  });
  vm.runInContext(source, context);
  await vm.runInContext('render()', context);
  assert.match(root.innerHTML, /Loading pedigree/);
  location.pathname = '/camels/52';
  await vm.runInContext('render()', context);
  pending.get('52')({ camelId: 52, name: 'Najm', sireName: 'Actual sire' });
  await new Promise(resolve => setImmediate(resolve));
  pending.get('41')(family);
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(requests, ['41', '52']);
  assert.match(root.innerHTML, /Najm’s family|Actual sire/);
  assert.doesNotMatch(root.innerHTML, /Barq’s family/);
});
