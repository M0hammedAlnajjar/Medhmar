package com.gulfracing.dto;

import com.gulfracing.entity.Offer;
import com.gulfracing.enums.OfferStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class OfferDTO {
    @Positive
    private Long offerId;

    @NotNull(message = "Offered price cannot be null")
    @Positive(message = "Offered price must be greater than zero")
    private Double offeredPriceOmr;

    private Date createdAt;

    @NotNull(message = "Offer status cannot be null")
    private OfferStatus status;

    private Date respondedAt;

    @Positive(message = "User id must be positive")
    private Long userId;

    @NotNull(message = "Listing id cannot be null")
    @Positive(message = "Listing id must be positive")
    private Long listingId;

    public static OfferDTO convertToDTO(Offer entity) {
        OfferDTO dto = OfferDTO.builder()
                .offerId(entity.getOfferId())
                .offeredPriceOmr(entity.getOfferedPriceOmr())
                .createdAt(entity.getCreatedAt())
                .status(entity.getStatus())
                .respondedAt(entity.getRespondedAt())
                .userId(entity.getUser() != null ? entity.getUser().getUserId() : null)
                .listingId(entity.getMarketplace() != null ? entity.getMarketplace().getListingId() : null)
                .build();
        return dto;
    }

    public static List<OfferDTO> convertToDTO(List<Offer> entityList) {
        List<OfferDTO> dtos = new ArrayList<>();
        for (Offer offer : entityList) {
            dtos.add(convertToDTO(offer));
        }
        return dtos;
    }
}
