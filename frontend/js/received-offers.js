// "Received Offers" section of the seller's listing page. Pure rendering: the data comes from
// GET /offer/listing/{id} (seller/admin only on the server). Buyer-side "My Offers" is separate.
import { fmtOmr, fmtDate } from './format.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

export function receivedOffersSection(offers, { badge = s => esc(s) } = {}) {
  let body;
  if (!Array.isArray(offers)) {
    // A failed request must never look like "no offers".
    body = `<div class="error-card" role="alert"><h3>Unable to load offers</h3><p>${esc(offers?.error || 'Please refresh the page and try again.')}</p></div>`;
  } else if (!offers.length) {
    body = '<p class="form-help">No offers received yet.</p>';
  } else {
    body = `<div class="table-wrap"><table><thead><tr><th>Buyer</th><th>Offered price</th><th>Offer date</th><th>Status</th><th>Actions</th></tr></thead><tbody>${offers.map(o => {
      const pending = o.status === 'PENDING';
      return `<tr data-offer="${esc(o.offerId)}"><td>${esc(o.buyerName || `User #${o.userId ?? '—'}`)}</td><td>${fmtOmr(o.offeredPriceOmr)}</td><td>${fmtDate(o.createdAt)}</td><td>${badge(o.status)}</td>` +
        `<td class="table-actions"><a class="small-btn" href="/offers/${esc(o.offerId)}" data-link>Details</a>` +
        (pending ? ` <button class="small-btn" data-act="accept-offer" data-id="${esc(o.offerId)}" data-price="${esc(o.offeredPriceOmr)}">Accept</button> <button class="small-btn" data-act="decline-offer" data-id="${esc(o.offerId)}">Decline</button>` : '') +
        '</td></tr>';
    }).join('')}</tbody></table></div>`;
  }
  return `<section class="card card-pad section" aria-label="Received offers"><h2>Received Offers</h2>${body}` +
    '<p class="form-help">Accepting an offer sells the camel and transfers ownership to the buyer. Other pending offers are declined automatically.</p></section>';
}
