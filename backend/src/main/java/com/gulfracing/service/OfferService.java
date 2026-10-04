package com.gulfracing.service;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.entity.Offer;
import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.entity.SaleTransaction;
import com.gulfracing.enums.MarketPlaceStatus;
import com.gulfracing.enums.OfferStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.MarketPlaceRepository;
import com.gulfracing.repository.OfferRepository;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.SaleTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OfferService {

    private final OfferRepository offers;
    private final MarketPlaceRepository marketPlaces;
    private final OwnershipRecordRepository ownerships;
    private final MarketPlaceService marketplaceService;
    private final UserService users;
    private final Clock clock;
    private final SaleTransactionRepository saleTransactions;
    private final TrainingAgreementService trainingAgreementService;

    @Transactional
    public Long addOffer(
            Double offeredPriceOmr,
            Long listingId,
            Long actorId
    ) {
        validatePrice(offeredPriceOmr);
        validateId(listingId, "A listing ID is required.");

        var buyer = users.getActive(actorId);
        var listing = marketPlaces.findLockedById(listingId)
                .orElseThrow(() -> ApiException.notFound("Marketplace listing"));

        if (!Boolean.TRUE.equals(listing.getIsActive())
                || listing.getStatus() != MarketPlaceStatus.AVAILABLE) {
            throw ApiException.conflict("This listing is not available for offers.");
        }

        if (listing.getUser() != null && actorId.equals(listing.getUser().getUserId())) {
            throw ApiException.badRequest("You cannot submit an offer on your own listing.");
        }

        if (offers.existsByMarketplace_ListingIdAndUser_UserIdAndIsActiveTrueAndStatus(
                listingId,
                actorId,
                OfferStatus.PENDING
        )) {
            throw ApiException.conflict("You already have a pending offer for this listing.");
        }

        Date now = Date.from(clock.instant());
        var offer = new Offer();
        offer.setOfferedPriceOmr(offeredPriceOmr);
        offer.setCreatedAt(now);
        offer.setStatus(OfferStatus.PENDING);
        offer.setIsActive(true);
        offer.setCreatedDate(now);
        offer.setUser(buyer);
        offer.setMarketplace(listing);

        return offers.save(offer).getOfferId();
    }

    @Transactional(readOnly = true)
    public List<Offer> getAllOffers(Long actorId) {
        users.getActive(actorId);
        if (users.isAdmin(actorId)) {
            return offers.findByIsActiveTrueOrderByOfferIdDesc();
        }
        return offers.findByUser_UserIdAndIsActiveTrueOrderByOfferIdDesc(actorId);
    }

    @Transactional(readOnly = true)
    public List<Offer> getOffersForListing(Long listingId, Long actorId) {
        validateId(listingId, "A listing ID is required.");
        var listing = marketPlaces.findById(listingId)
                .orElseThrow(() -> ApiException.notFound("Marketplace listing"));
        marketplaceService.requireSeller(listing, actorId);
        return offers.findByMarketplace_ListingIdAndIsActiveTrueOrderByOfferIdDesc(listingId);
    }

    @Transactional(readOnly = true)
    public Offer getById(Long id, Long actorId) {
        validateId(id, "An offer ID is required.");
        var offer = activeOffer(id);
        requireBuyerOrSeller(offer, actorId);
        return offer;
    }

    @Transactional
    public Offer updateOffer(Long id, Double offeredPriceOmr, Long actorId) {
        validateId(id, "An offer ID is required.");
        validatePrice(offeredPriceOmr);

        var offer = activeOffer(id);
        requireBuyer(offer, actorId);

        if (offer.getStatus() != OfferStatus.PENDING) {
            throw ApiException.conflict("Only a pending offer can be updated.");
        }

        offer.setOfferedPriceOmr(offeredPriceOmr);
        offer.setUpdatedDate(Date.from(clock.instant()));
        return offer;
    }

    @Transactional
    public Offer declineOffer(Long id, Long actorId) {
        validateId(id, "An offer ID is required.");
        var offer = activeOffer(id);
        var listing = marketPlaces.findLockedById(offer.getMarketplace().getListingId())
                .orElseThrow(() -> ApiException.notFound("Marketplace listing"));
        marketplaceService.requireSeller(listing, actorId);

        if (offer.getStatus() != OfferStatus.PENDING) {
            throw ApiException.conflict("Only a pending offer can be declined.");
        }

        Date now = Date.from(clock.instant());
        offer.setStatus(OfferStatus.DECLINED);
        offer.setRespondedAt(now);
        offer.setUpdatedDate(now);
        return offer;
    }

    @Transactional
    public Offer acceptOffer(Long id, Long actorId) {
        validateId(id, "An offer ID is required.");

        var offer = activeOffer(id);
        var listing = marketPlaces.findLockedById(offer.getMarketplace().getListingId())
                .orElseThrow(() -> ApiException.notFound("Marketplace listing"));
        marketplaceService.requireSeller(listing, actorId);

        if (!Boolean.TRUE.equals(listing.getIsActive())
                || listing.getStatus() != MarketPlaceStatus.AVAILABLE) {
            throw ApiException.conflict("This marketplace listing is no longer available.");
        }

        if (offer.getStatus() != OfferStatus.PENDING) {
            throw ApiException.conflict("Only a pending offer can be accepted.");
        }

        Date now = Date.from(clock.instant());
        Long camelId = listing.getCamel().getCamelId();
        Long sellerId = listing.getUser().getUserId();

        var currentOwnerships = ownerships.findCurrentOwnershipsForUpdate(camelId, now);
        double sellerShare = currentOwnerships.stream()
                .filter(record -> record.getOwner() != null
                        && sellerId.equals(record.getOwner().getUserId()))
                .mapToDouble(record -> record.getSharePercent() == null ? 0.0 : record.getSharePercent())
                .sum();

        if (sellerShare < 99.999d) {
            throw ApiException.conflict("The listing seller is no longer the full owner of this camel.");
        }

        var effectiveAgreement = trainingAgreementService.findActiveAgreementForSale(camelId);

        BigDecimal trainerShareOmr = BigDecimal.ZERO.setScale(3, RoundingMode.HALF_UP);
        BigDecimal sellerNetOmr = BigDecimal.valueOf(offer.getOfferedPriceOmr())
                .setScale(3, RoundingMode.HALF_UP);

        if (effectiveAgreement != null) {
            BigDecimal salePrice = BigDecimal.valueOf(offer.getOfferedPriceOmr());
            trainerShareOmr = salePrice
                    .multiply(effectiveAgreement.getSaleSharePct())
                    .divide(BigDecimal.valueOf(100), 3, RoundingMode.HALF_UP);
            sellerNetOmr = salePrice.subtract(trainerShareOmr)
                    .setScale(3, RoundingMode.HALF_UP);
        }

        trainingAgreementService.terminateForOwnershipChange(
                camelId,
                sellerId
        );

        offer.setStatus(OfferStatus.ACCEPTED);
        offer.setRespondedAt(now);
        offer.setUpdatedDate(now);

        for (Offer other : offers.findByMarketplace_ListingIdAndIsActiveTrueAndStatus(
                listing.getListingId(),
                OfferStatus.PENDING
        )) {
            if (!other.getOfferId().equals(offer.getOfferId())) {
                other.setStatus(OfferStatus.DECLINED);
                other.setRespondedAt(now);
                other.setUpdatedDate(now);
            }
        }

        listing.setStatus(MarketPlaceStatus.SOLD);
        listing.setIsActive(false);
        listing.setUpdatedDate(now);

        for (OwnershipRecord ownership : currentOwnerships) {
            ownership.setEndAt(now);
            ownership.setIsActive(false);
            ownership.setUpdatedDate(now);
        }

        var newOwnership = new OwnershipRecord();
        newOwnership.setCamel(listing.getCamel());
        newOwnership.setOwner(offer.getUser());
        newOwnership.setSharePercent(100.0);
        newOwnership.setStartAt(now);
        newOwnership.setIsActive(true);
        newOwnership.setCreatedDate(now);
        ownerships.save(newOwnership);

        var saleTransaction = new SaleTransaction();
        saleTransaction.setSalePriceOmr(offer.getOfferedPriceOmr());
        saleTransaction.setSoldAt(now);
        saleTransaction.setOffer(offer);
        saleTransaction.setMarketplace(listing);
        saleTransaction.setCamel(listing.getCamel());
        saleTransaction.setSeller(listing.getUser());
        saleTransaction.setBuyer(offer.getUser());

        saleTransaction.setTrainerShareOmr(trainerShareOmr);
        saleTransaction.setSellerNetOmr(sellerNetOmr);

        if (effectiveAgreement != null) {
            saleTransaction.setTrainer(effectiveAgreement.getTrainer().getUser());
            saleTransaction.setAgreement(effectiveAgreement);
        }

        saleTransactions.save(saleTransaction);
        return offer;
    }

    @Transactional
    public Boolean deleteById(Long id, Long actorId) {
        validateId(id, "An offer ID is required.");
        var offer = activeOffer(id);
        requireBuyer(offer, actorId);

        if (offer.getStatus() != OfferStatus.PENDING) {
            throw ApiException.conflict("Only a pending offer can be cancelled.");
        }

        offer.setIsActive(false);
        offer.setUpdatedDate(Date.from(clock.instant()));
        return true;
    }

    private Offer activeOffer(Long id) {
        var offer = offers.findById(id)
                .orElseThrow(() -> ApiException.notFound("Offer"));

        if (!Boolean.TRUE.equals(offer.getIsActive())) {
            throw ApiException.notFound("Offer");
        }
        return offer;
    }

    private void requireBuyer(Offer offer, Long actorId) {
        users.getActive(actorId);
        if (users.isAdmin(actorId)) {
            return;
        }

        if (offer.getUser() == null || !actorId.equals(offer.getUser().getUserId())) {
            throw ApiException.forbidden();
        }
    }

    private void requireBuyerOrSeller(Offer offer, Long actorId) {
        users.getActive(actorId);
        if (users.isAdmin(actorId)) {
            return;
        }

        boolean buyer = offer.getUser() != null
                && actorId.equals(offer.getUser().getUserId());
        boolean seller = offer.getMarketplace() != null
                && offer.getMarketplace().getUser() != null
                && actorId.equals(offer.getMarketplace().getUser().getUserId());

        if (!buyer && !seller) {
            throw ApiException.forbidden();
        }
    }

    private void validatePrice(Double price) {
        if (price == null || price <= 0) {
            throw ApiException.badRequest("Offered price must be greater than zero.");
        }
    }

    private void validateId(Long id, String message) {
        if (id == null || id <= 0) {
            throw ApiException.badRequest(message);
        }
    }
}
