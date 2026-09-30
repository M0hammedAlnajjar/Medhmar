package com.gulfracing.service;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.enums.MarketPlaceStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.MarketPlaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MarketPlaceService {

    private final MarketPlaceRepository marketPlaces;
    private final CamelRepository camels;
    private final CamelAccessService camelAccess;
    private final UserService users;
    private final Clock clock;

    @Transactional
    public Long addMarketPlace(
            Double askingPriceOmr,
            String description,
            Long camelId,
            Long actorId
    ) {
        validateListingInput(askingPriceOmr, description, camelId);
        camelAccess.requireFullOwner(camelId, actorId);

        var camel = camels.findById(camelId)
                .filter(c -> Boolean.TRUE.equals(c.getIsActive()))
                .orElseThrow(() -> ApiException.notFound("Camel"));

        if (marketPlaces.existsByCamel_CamelIdAndIsActiveTrue(camelId)) {
            throw ApiException.conflict("This camel already has an active marketplace listing.");
        }

        Date now = Date.from(clock.instant());
        var marketPlace = new MarketPlace();
        marketPlace.setAskingPriceOmr(askingPriceOmr);
        marketPlace.setCreatedAt(now);
        marketPlace.setStatus(MarketPlaceStatus.AVAILABLE);
        marketPlace.setDescription(description.strip());
        marketPlace.setIsActive(true);
        marketPlace.setCreatedDate(now);
        marketPlace.setCamel(camel);
        marketPlace.setUser(users.getActive(actorId));

        return marketPlaces.save(marketPlace).getListingId();
    }

    @Transactional(readOnly = true)
    public List<MarketPlace> getAllMarketPlaces() {
        return marketPlaces.getAllMarketPlaces();
    }

    @Transactional(readOnly = true)
    public MarketPlace getById(Long id) {
        validateId(id);
        return marketPlaces.findByListingIdAndIsActiveTrue(id)
                .orElseThrow(() -> ApiException.notFound("Marketplace listing"));
    }

    @Transactional
    public MarketPlace updateMarketPlace(
            Long id,
            Double askingPriceOmr,
            String description,
            Long actorId
    ) {
        validateId(id);
        validateListingInput(askingPriceOmr, description, 1L);

        var listing = lockedActive(id);
        requireSeller(listing, actorId);

        if (listing.getStatus() != MarketPlaceStatus.AVAILABLE) {
            throw ApiException.conflict("Only an available listing can be updated.");
        }

        listing.setAskingPriceOmr(askingPriceOmr);
        listing.setDescription(description.strip());
        listing.setUpdatedDate(Date.from(clock.instant()));

        return listing;
    }

    @Transactional
    public Boolean deleteById(Long id, Long actorId) {
        validateId(id);
        var listing = lockedActive(id);
        requireSeller(listing, actorId);

        if (listing.getStatus() == MarketPlaceStatus.SOLD) {
            throw ApiException.conflict("A sold listing cannot be cancelled.");
        }

        listing.setStatus(MarketPlaceStatus.CANCELLED);
        listing.setIsActive(false);
        listing.setUpdatedDate(Date.from(clock.instant()));
        return true;
    }

    @Transactional(readOnly = true)
    public void requireSeller(MarketPlace listing, Long actorId) {
        if (users.isAdmin(actorId)) {
            return;
        }

        if (listing.getUser() == null || !actorId.equals(listing.getUser().getUserId())) {
            throw ApiException.forbidden();
        }
    }

    private MarketPlace lockedActive(Long id) {
        var listing = marketPlaces.findLockedById(id)
                .orElseThrow(() -> ApiException.notFound("Marketplace listing"));

        if (!Boolean.TRUE.equals(listing.getIsActive())) {
            throw ApiException.notFound("Marketplace listing");
        }
        return listing;
    }

    private void validateListingInput(Double askingPriceOmr, String description, Long camelId) {
        if (askingPriceOmr == null || askingPriceOmr <= 0) {
            throw ApiException.badRequest("Asking price must be greater than zero.");
        }
        if (description == null || description.isBlank() || description.length() > 255) {
            throw ApiException.badRequest("Description must contain between 3 and 255 characters.");
        }
        if (description.strip().length() < 3) {
            throw ApiException.badRequest("Description must contain between 3 and 255 characters.");
        }
        if (camelId == null || camelId <= 0) {
            throw ApiException.badRequest("A camel ID is required.");
        }
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw ApiException.badRequest("A marketplace listing ID is required.");
        }
    }
}
