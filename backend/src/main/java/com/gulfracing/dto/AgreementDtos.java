package com.gulfracing.dto;

import com.gulfracing.entity.TrainingAgreement;
import com.gulfracing.enums.AgreementStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;

public final class AgreementDtos {
    private AgreementDtos() {}

    public record Create(
            @NotNull @Positive Long camelId,
            @NotNull @Positive Long trainerUserId,
            @NotNull @DecimalMin("0.000") @Digits(integer = 9, fraction = 3) BigDecimal feeOmr,
            @NotNull @DecimalMin("0.00") @DecimalMax("100.00") @Digits(integer = 3, fraction = 2) BigDecimal prizeSharePct,
            @NotNull @DecimalMin("0.00") @DecimalMax("100.00") @Digits(integer = 3, fraction = 2) BigDecimal saleSharePct,
            @NotNull Instant startsAt,
            @NotNull Instant endsAt
    ) {}

    public record View(
            Long agreementId, Long ownerUserId, Long trainerUserId, Long camelId,
            BigDecimal feeOmr, BigDecimal prizeSharePct, BigDecimal saleSharePct,
            Instant startsAt, Instant endsAt, Instant proposedAt, Instant respondedAt,
            Instant acceptedAt, Instant terminatedAt, AgreementStatus status
    ) {
        public static View from(TrainingAgreement entity) {
            return new View(entity.getAgreementId(), entity.getOwner().getUserId(),
                    entity.getTrainer().getUserId(), entity.getCamel().getCamelId(),
                    entity.getFeeOmr(), entity.getPrizeSharePct(), entity.getSaleSharePct(),
                    entity.getStartsAt(), entity.getEndsAt(), entity.getProposedAt(),
                    entity.getRespondedAt(), entity.getAcceptedAt(), entity.getTerminatedAt(),
                    entity.getStatus());
        }
    }
}
