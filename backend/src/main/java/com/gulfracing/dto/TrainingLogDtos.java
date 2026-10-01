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

    public record View(Long logId, Long agreementId, Long camelId, Long trainerUserId,
                       Instant sessionAt, Integer durationMinutes, String notes, Instant createdAt) {
        public static View from(TrainingLog log) {
            return new View(log.getLogId(), log.getAgreement().getAgreementId(),
                    log.getAgreement().getCamel().getCamelId(),
                    log.getAgreement().getTrainer().getUserId(), log.getSessionAt(),
                    log.getDurationMinutes(), log.getNotes(), log.getCreatedAt());
        }
    }
}
