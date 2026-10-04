package com.gulfracing.dto;

import com.gulfracing.entity.AuditLog;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuditLogDTO {

    @Positive
    private Long auditId;

    @NotBlank
    @Size(max = 50)
    private String actionType;

    @NotBlank
    @Size(max = 50)
    private String entityType;

    @NotNull
    @Positive
    private Long entityId;

    private Instant createdAt;

    private String description;

    @NotNull
    @Positive
    private Long camelId;

    public static AuditLogDTO convertToDTO(AuditLog entity) {
        return AuditLogDTO.builder()
                .auditId(entity.getAuditId())
                .actionType(entity.getActionType())
                .entityType(entity.getEntityType())
                .entityId(entity.getEntityId())
                .createdAt(entity.getCreatedAt())
                .description(entity.getDescription())
                .camelId(entity.getCamel() != null
                        ? entity.getCamel().getCamelId()
                        : null)
                .build();
    }

    public static List<AuditLogDTO> convertToDTO(List<AuditLog> entityList) {
        return entityList.stream()
                .map(AuditLogDTO::convertToDTO)
                .toList();
    }
}