package com.gulfracing.dto;

import com.gulfracing.entity.TrainingLog;
import jakarta.validation.constraints.*;

import java.time.Instant;

public final class TrainingLogDtos {
    private TrainingLogDtos() {}

    public record Create(
            @NotNull @Positive Long agreementId,
            @NotNull Instant sessionAt,
            @NotNull @Min(1) @Max(720) Integer durationMinutes,
            @NotBlank @Size(max = 2000) String notes
    ) {}

    public record View(
            Long logId,
            Long agreementId,
            Long camelId,
            Long ownerUserId,
            Long trainerUserId,
            Instant sessionAt,
            Integer durationMinutes,
            String notes,
            Instant createdAt
    ) {
        public static View from(TrainingLog entity) {
            var agreement = entity.getAgreement();
            return new View(
                    entity.getLogId(),
                    agreement.getAgreementId(),
                    agreement.getCamel().getCamelId(),
                    agreement.getOwner().getUserId(),
                    agreement.getTrainer().getUserId(),
                    entity.getSessionAt(),
                    entity.getDurationMinutes(),
                    entity.getNotes(),
                    entity.getCreatedAt()
            );
        }
    }
}
