import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { receivedOffersSection } from '../js/received-offers.js';

const offer = (over = {}) => ({offerId:7, offeredPriceOmr:2500, createdAt:'2030-01-02T10:00:00Z', status:'PENDING', userId:42, listingId:3, buyerName:'Buyer One', ...over});
const badge = s => `<b>${s}</b>`;

test('received offers show buyer, price, date, status and accept/decline for pending offers', () => {
  const html = receivedOffersSection([offer(), offer({offerId:8, status:'ACCEPTED'}), offer({offerId:9, status:'DECLINED'})], {badge});
  assert.match(html, /<h2>Received Offers<\/h2>/);
  for (const col of ['Buyer','Offered price','Offer date','Status','Actions']) assert.match(html, new RegExp(`<th>${col}</th>`));
  assert.match(html, /Buyer One/); assert.match(html, /2,500 OMR/); assert.match(html, /<b>PENDING<\/b>/);
  assert.match(html, /data-act="accept-offer" data-id="7" data-price="2500"/);
  assert.match(html, /data-act="decline-offer" data-id="7"/);
  for (const id of [8, 9]) assert.doesNotMatch(html, new RegExp(`data-act="(accept|decline)-offer" data-id="${id}"`));
});

test('empty state is explicit', () => {
  assert.match(receivedOffersSection([], {badge}), /No offers received yet\./);
});

test('a failed request shows an error, never the empty state', () => {
  const html = receivedOffersSection({error:'Forbidden <script>'}, {badge});
  assert.match(html, /Unable to load offers/); assert.match(html, /Forbidden &lt;script&gt;/);
  assert.doesNotMatch(html, /No offers received yet/);
  assert.match(receivedOffersSection(undefined, {badge}), /Unable to load offers/);
});

test('buyer names are escaped and fall back to the user id', () => {
  const html = receivedOffersSection([offer({buyerName:'<img src=x onerror=1>'}), offer({offerId:8, buyerName:null, userId:99})], {badge});
  assert.doesNotMatch(html, /<img src=x/); assert.match(html, /&lt;img src=x/); assert.match(html, /User #99/);
});

test('listing page wires the seller view to the server endpoint and My Listings opens the listing', async () => {
  const app = await readFile(new URL('../js/app.js', import.meta.url), 'utf8');
  const api = await readFile(new URL('../js/api.js', import.meta.url), 'utf8');
  assert.match(app, /seller \? offerApi\.forListing\(p\.id\)/);
  assert.match(app, /receivedOffersSection\(d\.offers, \{ badge: sb \}\)/);
  assert.match(api, /forListing: \(listingId\) => api\(`\/offer\/listing\//);
  assert.match(api, /accept: \(id\) => api\(`\/offer\/\$\{encodeURIComponent\(id\)\}\/accept`, \{ method: "POST" \}\)/);
  assert.match(api, /decline: \(id\) => api\(`\/offer\/\$\{encodeURIComponent\(id\)\}\/decline`, \{ method: "POST" \}\)/);
  assert.match(app, /withActions && l\.status === 'AVAILABLE' \? `\/marketplace\/\$\{l\.listingId\}`/);
  assert.match(app, /act === 'accept-offer'/); assert.match(app, /act === 'decline-offer'/);
  // Buyer-facing My Offers is untouched and still uses the buyer endpoint.
  assert.match(app, /'My Offers': async \(\) => \{ needAuth\(\); return \{ offers: await offerApi\.mine\(\) \}; \}/);
});
