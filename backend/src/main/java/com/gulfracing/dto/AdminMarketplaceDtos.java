package com.gulfracing.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.gulfracing.entity.MarketPlace;
import com.gulfracing.enums.MarketPlaceStatus;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Date;

/** Administrator views and requests for marketplace moderation. Same records as the public marketplace. */
public final class AdminMarketplaceDtos {
    private AdminMarketplaceDtos() {}

    public record Seller(Long userId, String fullName, String email) {}

    public record ListingView(
            Long listingId,
            String title,
            String description,
            String category,
            String breed,
            String imageUrl,
            BigDecimal askingPriceOmr,
            String currency,
            MarketPlaceStatus status,
            boolean active,
            boolean publiclyVisible,
            Date createdAt,
            Date updatedAt,
            Long camelId,
            Seller seller
    ) {
        public static ListingView from(MarketPlace m) {
            var camel = m.getCamel();
            var user = m.getUser();
            boolean active = Boolean.TRUE.equals(m.getIsActive());
            return new ListingView(
                    m.getListingId(),
                    camel != null ? camel.getName() : null,
                    m.getDescription(),
                    camel != null ? camel.getCategory() : null,
                    camel != null ? camel.getBreed() : null,
                    camel != null ? camel.getPhotoUrl() : null,
                    m.getAskingPriceOmr(),
                    "OMR",
                    m.getStatus(),
                    active,
                    active && m.getStatus() == MarketPlaceStatus.AVAILABLE,
                    m.getCreatedAt(),
                    m.getUpdatedDate(),
                    camel != null ? camel.getCamelId() : null,
                    user != null ? new Seller(user.getUserId(), user.getFullName(), user.getEmail()) : null
            );
        }
    }

    public record Stats(long total, long active, long pending, long rejected,
                        long sold, long inactive, Instant generatedAt) {}

    /** Only whitelisted fields can be edited; everything else in the JSON body is ignored. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record UpdateRequest(
            @NotNull(message = "Asking price is required")
            @Positive(message = "Asking price must be greater than zero")
            @Digits(integer = 9, fraction = 3) BigDecimal askingPriceOmr,
            @NotNull(message = "Description is required")
            @Size(min = 3, max = 255, message = "Description has to be between 3 and 255 characters")
            String description
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record StatusRequest(
            @NotNull(message = "Status is required") MarketPlaceStatus status,
            @Size(max = 500) String reason
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record DecisionRequest(@Size(max = 500) String reason) {}
}
