package com.gulfracing.dto;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.enums.MarketPlaceStatus;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
public class MarketPlaceDTO {

    @Positive
    private Long listingId;

    @Positive(message = "Asking price must be greater than zero")
    private Double askingPriceOmr;

    private Date createdAt;

    private MarketPlaceStatus status;

    @Size(min = 3, max = 255, message = "Description has to be between 3 and 255 characters")
    private String description;

    @Positive(message = "Camel id must be positive")
    private Long camelId;

    // Response field. The authenticated account is always used for write operations.
    @Positive(message = "User id must be positive")
    private Long userId;

    public static MarketPlaceDTO convertToDTO(MarketPlace entity) {
        return MarketPlaceDTO.builder()
                .listingId(entity.getListingId())
                .askingPriceOmr(entity.getAskingPriceOmr())
                .createdAt(entity.getCreatedAt())
                .status(entity.getStatus())
                .description(entity.getDescription())
                .camelId(entity.getCamel() != null ? entity.getCamel().getCamelId() : null)
                .userId(entity.getUser() != null ? entity.getUser().getUserId() : null)
                .build();
    }

    public static List<MarketPlaceDTO> convertToDTO(List<MarketPlace> entityList) {
        List<MarketPlaceDTO> dtos = new ArrayList<>();
        for (MarketPlace marketPlace : entityList) {
            dtos.add(convertToDTO(marketPlace));
        }
        return dtos;
    }
}
