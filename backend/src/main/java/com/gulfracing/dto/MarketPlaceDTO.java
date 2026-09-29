package com.gulfracing.dto;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.enums.MarketPlaceStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class MarketPlaceDTO {
    @Positive
    private Long listingId;

    @NotNull(message = "Asking price cannot be null")
    @Positive(message = "Asking price must be greater than zero")
    private Double askingPriceOmr;

    private Date createdAt;

    @NotNull(message = "Marketplace status cannot be null")
    private MarketPlaceStatus status;

    @NotBlank(message = "Description cannot be blank")
    @Size(min = 3, max = 500, message = "Description has to be between 3 and 500 characters")
    private String description;

    @NotNull(message = "Camel id cannot be null")
    @Positive(message = "Camel id must be positive")
    private Long camelId;

    @NotNull(message = "User id cannot be null")
    @Positive(message = "User id must be positive")
    private Long userId;

    public static MarketPlaceDTO convertToDTO(MarketPlace entity) {
        MarketPlaceDTO dto = MarketPlaceDTO.builder()
                .listingId(entity.getListingId())
                .askingPriceOmr(entity.getAskingPriceOmr())
                .createdAt(entity.getCreatedAt())
                .status(entity.getStatus())
                .description(entity.getDescription())
                .camelId(entity.getCamel() != null ? entity.getCamel().getCamelId() : null)
                .userId(entity.getUser() != null ? entity.getUser().getUserId() : null)
                .build();
        return dto;
    }

    public static List<MarketPlaceDTO> convertToDTO(List<MarketPlace> entityList) {
        List<MarketPlaceDTO> dtos = new ArrayList<>();
        for (MarketPlace marketPlace : entityList) {
            dtos.add(convertToDTO(marketPlace));
        }
        return dtos;
    }
}
