package com.gulfracing.dto;

import com.gulfracing.entity.OwnershipRecord;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class OwnershipRecordDTO {
    @Positive
    private Long ownershipId;

    @NotNull(message = "Share percent cannot be null")
    @DecimalMin(value = "0.01", message = "Share percent must be greater than 0")
    @DecimalMax(value = "100.0", message = "Share percent cannot be greater than 100")
    private Double sharePercent;

    @NotNull(message = "Start date cannot be null")
    private Date startAt;

    private Date endAt;

    @NotNull(message = "Camel id cannot be null")
    @Positive(message = "Camel id must be positive")
    private Long camelId;

    @NotNull(message = "Owner id cannot be null")
    @Positive(message = "Owner id must be positive")
    private Long ownerId;

    public static OwnershipRecordDTO convertToDTO(OwnershipRecord entity) {

        OwnershipRecordDTO dto = OwnershipRecordDTO.builder()
                .ownershipId(entity.getOwnershipId())
                .sharePercent(entity.getSharePercent())
                .startAt(entity.getStartAt())
                .endAt(entity.getEndAt())
                .camelId(entity.getCamel() != null ? entity.getCamel().getCamelId() : null)
                .ownerId(entity.getOwner() != null ? entity.getOwner().getUserId() : null)
                .build();
        return dto;
    }

    public static List<OwnershipRecordDTO> convertToDTO(
            List<OwnershipRecord> entityList) {
        List<OwnershipRecordDTO> dtos = new ArrayList<>();
        for (OwnershipRecord ownershipRecord : entityList) {
            dtos.add(convertToDTO(ownershipRecord));
        }
        return dtos;
    }
}
