package com.gulfracing.service;

import com.gulfracing.dto.AdminMarketplaceDtos.ListingView;
import com.gulfracing.dto.AdminMarketplaceDtos.Stats;
import com.gulfracing.entity.MarketPlace;
import com.gulfracing.enums.MarketPlaceStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.MarketPlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.Date;
import java.util.List;
import java.util.Set;

/**
 * Administrator moderation of the existing marketplace. Operates on the same MarketPlace rows
 * that regular users see; there is no separate admin data. Every method re-verifies the ADMIN
 * role on the server in addition to the controller's role check.
 */
@Service
@RequiredArgsConstructor
public class AdminMarketplaceService {
    static final String ENTITY = "Listing";
    private static final Set<MarketPlaceStatus> MODERATABLE =
            Set.of(MarketPlaceStatus.AVAILABLE, MarketPlaceStatus.PENDING, MarketPlaceStatus.REJECTED);

    private final MarketPlaceRepository listings;
    private final UserService users;
    private final AuditRecorder audit;
    private final Clock clock;

    @Transactional(readOnly = true)
    public Page<ListingView> list(Long adminId, int page, int size, String search,
                                  MarketPlaceStatus status, String category, String sort) {
        requireAdmin(adminId);
        Sort order = switch (sort == null ? "newest" : sort) {
            case "newest" -> Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("listingId"));
            case "oldest" -> Sort.by(Sort.Order.asc("createdAt"), Sort.Order.asc("listingId"));
            case "price_asc" -> Sort.by(Sort.Order.asc("askingPriceOmr"), Sort.Order.desc("listingId"));
            case "price_desc" -> Sort.by(Sort.Order.desc("askingPriceOmr"), Sort.Order.desc("listingId"));
            default -> throw ApiException.badRequest("Unsupported sort option.");
        };
        boolean activeOnly = status == MarketPlaceStatus.AVAILABLE
                || status == MarketPlaceStatus.PENDING || status == MarketPlaceStatus.REJECTED;
        return listings.searchForAdmin(clean(search), status, activeOnly, clean(category),
                PageRequest.of(page, size, order)).map(ListingView::from);
    }

    @Transactional(readOnly = true)
    public Stats stats(Long adminId) {
        requireAdmin(adminId);
        long total = listings.count();
        long pending = 0, rejected = 0, sold = 0, cancelled = 0;
        for (Object[] row : listings.countGroupedByStatus()) {
            if (row[0] == null) continue;
            long n = ((Number) row[1]).longValue();
            switch ((MarketPlaceStatus) row[0]) {
                case PENDING -> pending = n;
                case REJECTED -> rejected = n;
                case SOLD -> sold = n;
                case CANCELLED -> cancelled = n;
                default -> { }
            }
        }
        // Same query that feeds the Admin Dashboard "Active Listings" card.
        long active = listings.countActiveListings(MarketPlaceStatus.AVAILABLE);
        return new Stats(total, active, pending, rejected, sold, cancelled, clock.instant());
    }

    @Transactional(readOnly = true)
    public List<String> categories(Long adminId) {
        requireAdmin(adminId);
        return listings.findDistinctCategories();
    }

    @Transactional(readOnly = true)
    public ListingView get(Long adminId, Long id) {
        requireAdmin(adminId);
        return ListingView.from(listings.findById(positive(id))
                .orElseThrow(() -> ApiException.notFound("Marketplace listing")));
    }

    @Transactional
    public ListingView approve(Long adminId, Long id) {
        requireAdmin(adminId);
        var listing = lockedModeratable(id);
        var previous = listing.getStatus();
        if (previous == MarketPlaceStatus.AVAILABLE) {
            throw ApiException.conflict("This listing is already active.");
        }
        listing.setStatus(MarketPlaceStatus.AVAILABLE);
        touch(listing);
        audit.record("APPROVED", ENTITY, id, camelId(listing), adminId, "Status " + previous + " -> AVAILABLE");
        return ListingView.from(listing);
    }

    @Transactional
    public ListingView reject(Long adminId, Long id, String reason) {
        requireAdmin(adminId);
        var listing = lockedModeratable(id);
        var previous = listing.getStatus();
        if (previous == MarketPlaceStatus.REJECTED) {
            throw ApiException.conflict("This listing is already rejected.");
        }
        listing.setStatus(MarketPlaceStatus.REJECTED);
        touch(listing);
        audit.record("REJECTED", ENTITY, id, camelId(listing), adminId,
                "Status " + previous + " -> REJECTED" + reasonSuffix(reason));
        return ListingView.from(listing);
    }

    @Transactional
    public ListingView changeStatus(Long adminId, Long id, MarketPlaceStatus target, String reason) {
        requireAdmin(adminId);
        if (target == null || !MODERATABLE.contains(target)) {
            // SOLD is produced only by an accepted offer (sale record + ownership transfer);
            // CANCELLED/inactive is produced only by removing the listing.
            throw ApiException.badRequest(
                    "Status can only be set to AVAILABLE, PENDING or REJECTED. "
                    + "Use Remove to deactivate a listing; SOLD is set by an accepted offer.");
        }
        var listing = lockedModeratable(id);
        var previous = listing.getStatus();
        if (previous == target) {
            throw ApiException.conflict("The listing already has this status.");
        }
        listing.setStatus(target);
        touch(listing);
        audit.record("STATUS_CHANGED", ENTITY, id, camelId(listing), adminId,
                "Status " + previous + " -> " + target + reasonSuffix(reason));
        return ListingView.from(listing);
    }

    @Transactional
    public ListingView update(Long adminId, Long id, BigDecimal price, String description) {
        requireAdmin(adminId);
        validate(price, description);
        var listing = lockedModeratable(id);
        var changes = new StringBuilder();
        if (listing.getAskingPriceOmr() == null || listing.getAskingPriceOmr().compareTo(price) != 0) {
            changes.append("price ").append(listing.getAskingPriceOmr()).append(" -> ").append(price);
        }
        String text = description.strip();
        if (!text.equals(listing.getDescription())) {
            if (changes.length() > 0) changes.append("; ");
            changes.append("description changed");
        }
        if (changes.length() == 0) {
            return ListingView.from(listing);
        }
        listing.setAskingPriceOmr(price);
        listing.setDescription(text);
        touch(listing);
        audit.record("UPDATED", ENTITY, id, camelId(listing), adminId, "Admin edit: " + changes);
        return ListingView.from(listing);
    }

    /** Soft removal: same state a seller cancellation produces. Never touches the seller account. */
    @Transactional
    public void remove(Long adminId, Long id, String reason) {
        requireAdmin(adminId);
        var listing = locked(id);
        if (listing.getStatus() == MarketPlaceStatus.SOLD) {
            throw ApiException.conflict("A sold listing cannot be removed.");
        }
        if (!Boolean.TRUE.equals(listing.getIsActive())) {
            throw ApiException.conflict("This listing has already been removed or cancelled.");
        }
        var previous = listing.getStatus();
        listing.setStatus(MarketPlaceStatus.CANCELLED);
        listing.setIsActive(false);
        touch(listing);
        audit.record("REMOVED", ENTITY, id, camelId(listing), adminId,
                "Status " + previous + " -> CANCELLED (soft delete)" + reasonSuffix(reason));
    }

    // ---- helpers ----

    private void requireAdmin(Long adminId) {
        if (adminId == null || !users.isAdmin(adminId)) {
            throw ApiException.forbidden();
        }
    }

    private MarketPlace locked(Long id) {
        return listings.findLockedById(positive(id))
                .orElseThrow(() -> ApiException.notFound("Marketplace listing"));
    }

    private MarketPlace lockedModeratable(Long id) {
        var listing = locked(id);
        if (!Boolean.TRUE.equals(listing.getIsActive()) || !MODERATABLE.contains(listing.getStatus())) {
            throw ApiException.conflict("Only an active, unsold listing can be moderated.");
        }
        return listing;
    }

    private void touch(MarketPlace listing) {
        listing.setUpdatedDate(Date.from(clock.instant()));
    }

    private static Long camelId(MarketPlace listing) {
        return listing.getCamel() != null ? listing.getCamel().getCamelId() : null;
    }

    private static Long positive(Long id) {
        if (id == null || id <= 0) throw ApiException.badRequest("A marketplace listing ID is required.");
        return id;
    }

    private static String clean(String value) {
        if (value == null || value.isBlank()) return null;
        String trimmed = value.trim();
        return trimmed.length() > 100 ? trimmed.substring(0, 100) : trimmed;
    }

    private static String reasonSuffix(String reason) {
        String cleaned = reason == null ? "" : reason.strip();
        return cleaned.isEmpty() ? "" : "; reason: " + (cleaned.length() > 500 ? cleaned.substring(0, 500) : cleaned);
    }

    private static void validate(BigDecimal price, String description) {
        if (price == null || price.signum() <= 0 || price.stripTrailingZeros().scale() > 3
                || price.precision() - price.scale() > 9) {
            throw ApiException.badRequest("Asking price must be greater than zero.");
        }
        if (description == null || description.strip().length() < 3 || description.length() > 255) {
            throw ApiException.badRequest("Description must contain between 3 and 255 characters.");
        }
    }
}
