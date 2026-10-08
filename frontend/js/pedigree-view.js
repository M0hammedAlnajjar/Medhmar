// A three-generation view of PedigreeTreeDTO. Names without registered IDs
// remain visible, but never become links to another camel's record.
const escape = (value = '') => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
}[char]));

const registered = node => /^[1-9]\d*$/.test(String(node?.camelId ?? ''));
const parent = (node, side) => node?.[side] || (node?.[`${side}Name`]?.trim()
  ? { name: node[`${side}Name`].trim() } : null);

function photoUrl(value) {
  if (typeof value !== 'string') return '';
  // Also allow the same-origin image assets used by the frontend.
  if (/^\/assets\/[\w./-]+$/.test(value) && !value.includes('..')) return value;
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

const photoPlaceholder = `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M11 8l2-3h6l2 3h5a3 3 0 0 1 3 3v14H3V11a3 3 0 0 1 3-3z"/><circle cx="16" cy="16" r="5"/></svg><span>No photo</span>`;

function nodeCard(node, role, { subject = false, lineage = '' } = {}) {
  const known = Boolean(node?.name?.trim());
  const name = known ? node.name.trim() : 'Not recorded';
  const src = photoUrl(node?.photoUrl);
  const linked = registered(node) && !subject;
  const tag = linked ? 'a' : 'div';
  const attributes = linked
    ? `href="/camels/${encodeURIComponent(node.camelId)}" data-link aria-label="${escape(`${lineage} ${role}: ${name}. View pedigree`.trim())}"`
    : `aria-label="${escape(`${lineage} ${role}: ${name}`.trim())}"`;
  return `<${tag} class="pedigree-node${subject ? ' pedigree-node-subject' : ''}${known ? '' : ' pedigree-node-empty'}" ${attributes}>
    <span class="pedigree-photo" aria-hidden="true">${photoPlaceholder}${src ? `<img src="${escape(src)}" alt="" decoding="async" referrerpolicy="no-referrer" data-pedigree-photo>` : ''}</span>
    <span class="pedigree-node-copy"><span class="pedigree-label">${escape(role)}</span><span class="pedigree-name">${escape(name)}</span>${known && !registered(node) ? '<span class="pedigree-name-only">Name only</span>' : ''}</span>
    ${linked ? '<span class="pedigree-node-arrow" aria-hidden="true">↗</span>' : ''}
  </${tag}>`;
}

function branch(node, side) {
  const relative = parent(node, side);
  const label = side === 'sire' ? 'Sire' : 'Dam';
  const lineage = side === 'sire' ? 'Paternal' : 'Maternal';
  return `<li class="pedigree-branch" aria-label="${lineage} ancestry">
    ${nodeCard(relative, label)}
    <ol class="pedigree-grandparents" aria-label="${lineage} grandparents">
      <li>${nodeCard(parent(relative, 'sire'), 'Grand Sire', { lineage })}</li>
      <li>${nodeCard(parent(relative, 'dam'), 'Grand Dam', { lineage })}</li>
    </ol>
  </li>`;
}

function feedback(status, error) {
  if (status !== 'error') return `<div class="pedigree-feedback" role="status" aria-busy="true"><span class="pedigree-loader" aria-hidden="true"></span><h2>Loading pedigree…</h2><p>Finding this camel’s family tree.</p></div>`;
  const missing = error?.status === 404;
  const restricted = error?.status === 401 || error?.status === 403;
  const title = missing ? 'Camel not found' : restricted ? 'Pedigree unavailable' : 'Unable to load pedigree';
  const message = missing ? 'This camel may have been removed from the registry.'
    : restricted ? 'Your account cannot access this pedigree.'
    : 'We could not load this family tree. Please try again.';
  const action = error?.status === 401 ? '<a class="btn btn-primary" href="/signin" data-link>Sign in</a>'
    : missing || restricted ? '<a class="btn btn-secondary" href="/camels" data-link>Browse camels</a>'
    : '<button class="btn btn-primary" type="button" data-act="retry">Try again</button>';
  return `<div class="pedigree-feedback" role="alert"><h2>${title}</h2><p>${message}</p>${action}</div>`;
}

function directoryControls(data) {
  const { q = {}, page = {}, tree, selectedId } = data;
  const camels = [...(page.content || [])];
  if (tree && !camels.some(c => String(c.camelId) === String(tree.camelId))) camels.unshift(tree);
  const selected = String(tree?.camelId ?? selectedId ?? '');
  const options = camels.map(c => `<option value="${escape(c.camelId)}"${String(c.camelId) === selected ? ' selected' : ''}>${escape(c.name)} · #${escape(c.camelId)}</option>`).join('');
  const pageLink = number => {
    const params = new URLSearchParams({ page: String(number) });
    if (q.search) params.set('search', q.search);
    return escape(`/pedigree?${params}`);
  };
  return `<div class="pedigree-controls">
    <div class="pedigree-picker"><label for="pedigree-camel">Selected camel</label><select id="pedigree-camel" class="select"${camels.length ? '' : ' disabled'}>
      ${camels.some(c => String(c.camelId) === selected) ? '' : '<option value="" selected>Choose a camel</option>'}${options}
    </select></div>
    <form class="pedigree-search" data-form="pedigree-filter" role="search" aria-label="Find a camel">
      <label class="pedigree-sr-only" for="pedigree-search">Search camel by name</label>
      <input id="pedigree-search" class="input" type="search" name="search" placeholder="Search camel by name…" value="${escape(q.search || '')}">
      <button class="btn btn-secondary" type="submit">Search</button>
      ${q.search ? '<a class="pedigree-clear" href="/pedigree" data-link>Clear</a>' : ''}
    </form>
    ${page.totalPages > 1 ? `<nav class="pedigree-pagination" aria-label="Camel selection pages">
      ${page.page > 0 ? `<a href="${pageLink(page.page - 1)}" data-link aria-label="Previous camels">←</a>` : '<span aria-hidden="true">←</span>'}
      <small>${escape(page.page + 1)} / ${escape(page.totalPages)}</small>
      ${page.page + 1 < page.totalPages ? `<a href="${pageLink(page.page + 1)}" data-link aria-label="Next camels">→</a>` : '<span aria-hidden="true">→</span>'}
    </nav>` : ''}
  </div>`;
}

export function pedigreeView(view, { directory = false } = {}) {
  const tree = view.data?.tree;
  const ready = view.status === 'ready' && tree && registered(tree);
  const actions = ready ? `<div class="actions"><a class="btn btn-secondary pedigree-profile-link" href="/camels/${encodeURIComponent(tree.camelId)}/profile" data-link>View camel profile <span aria-hidden="true">↗</span></a>${view.data?.canEdit ? `<a class="btn btn-primary" href="/camels/${encodeURIComponent(tree.camelId)}/pedigree/edit" data-link>Edit pedigree</a>` : ''}</div>` : '';
  const empty = directory && view.status === 'ready' && !tree && !view.data?.treeError;
  const content = ready ? `<figure class="pedigree-chart" aria-labelledby="pedigree-caption">
      <figcaption id="pedigree-caption" class="pedigree-sr-only">Three-generation pedigree of ${escape(tree.name)}. Sire is the father; dam is the mother.</figcaption>
      <div class="pedigree-tree">
        <div class="pedigree-subject">${nodeCard(tree, 'Camel', { subject: true })}</div>
        <ol class="pedigree-parents" aria-label="Parents and grandparents">${branch(tree, 'sire')}${branch(tree, 'dam')}</ol>
      </div>
      <div class="pedigree-legend"><span><b>Sire</b> Father</span><span><b>Dam</b> Mother</span><span class="pedigree-hint">Select a registered ancestor to explore its pedigree.</span></div>
    </figure>` : empty ? `<div class="pedigree-feedback" role="status"><h2>No camels found</h2><p>${view.data?.q?.search ? 'Try another name to find a registered camel.' : 'Registered camels will appear here when they are added.'}</p><a class="btn btn-secondary" href="${view.data?.q?.search ? '/pedigree' : '/camels'}" data-link>${view.data?.q?.search ? 'Clear search' : 'Browse camels'}</a></div>`
    : feedback(view.status === 'ready' ? 'error' : view.status, view.data?.treeError || view.error);
  return `<section class="pedigree-page${directory ? ' pedigree-directory-page' : ''}" lang="en" dir="ltr" aria-labelledby="pedigree-title">
    ${directory ? '' : '<a class="pedigree-back" href="/pedigree" data-link><span aria-hidden="true">←</span> All pedigrees</a>'}
    <div class="pedigree-heading"><div><h1 id="pedigree-title">Pedigree</h1><p>${ready ? `Explore ${escape(tree.name)}’s family across three generations.` : 'Explore the family behind every camel.'}</p></div>${actions}</div>
    ${directory && view.data?.page ? directoryControls(view.data) : ''}
    ${content}
  </section>`;
}

export function bindPedigreeImages(container) {
  container.querySelectorAll?.('[data-pedigree-photo]').forEach(img => {
    const fallback = () => img.remove();
    img.addEventListener('error', fallback, { once: true });
    if (img.complete && !img.naturalWidth) fallback();
  });
}
