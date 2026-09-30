package com.gulfracing.dto;

import com.gulfracing.entity.Offer;
import com.gulfracing.enums.OfferStatus;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class OfferDTO {

    @Positive
    private Long offerId;

    @Positive(message = "Offered price must be greater than zero")
    private Double offeredPriceOmr;

    private Date createdAt;
    private OfferStatus status;
    private Date respondedAt;

    // Response field. The authenticated account is always used for write operations.
    @Positive(message = "User id must be positive")
    private Long userId;

    @Positive(message = "Listing id must be positive")
    private Long listingId;

    public static OfferDTO convertToDTO(Offer entity) {
        return OfferDTO.builder()
                .offerId(entity.getOfferId())
                .offeredPriceOmr(entity.getOfferedPriceOmr())
                .createdAt(entity.getCreatedAt())
                .status(entity.getStatus())
                .respondedAt(entity.getRespondedAt())
                .userId(entity.getUser() != null ? entity.getUser().getUserId() : null)
                .listingId(entity.getMarketplace() != null ? entity.getMarketplace().getListingId() : null)
                .build();
    }

    public static List<OfferDTO> convertToDTO(List<Offer> entityList) {
        List<OfferDTO> dtos = new ArrayList<>();
        for (Offer offer : entityList) {
            dtos.add(convertToDTO(offer));
        }
        return dtos;
    }
}
