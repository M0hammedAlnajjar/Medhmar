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
            @NotNull Instant endsAt,
            @Size(max = 5000) String terms
    ) {}

    public record Update(
            @NotNull @DecimalMin("0.000") @Digits(integer = 9, fraction = 3) BigDecimal feeOmr,
            @NotNull @DecimalMin("0.00") @DecimalMax("100.00") @Digits(integer = 3, fraction = 2) BigDecimal prizeSharePct,
            @NotNull @DecimalMin("0.00") @DecimalMax("100.00") @Digits(integer = 3, fraction = 2) BigDecimal saleSharePct,
            @NotNull Instant startsAt,
            @NotNull Instant endsAt,
            @Size(max = 5000) String terms
    ) {}

    public record Reason(
            @Size(max = 1000) String reason
    ) {}

    public record View(
            Long agreementId,
            Long ownerUserId,
            Long trainerUserId,
            Long camelId,
            BigDecimal feeOmr,
            BigDecimal prizeSharePct,
            BigDecimal saleSharePct,
            Instant startsAt,
            Instant endsAt,
            Instant proposedAt,
            Instant respondedAt,
            Instant acceptedAt,
            Instant terminatedAt,
            Instant completedAt,
            Instant expiredAt,
            String terms,
            String rejectionReason,
            String terminationReason,
            Long rejectedByUserId,
            Long terminatedByUserId,
            AgreementStatus status,
            long rowVersion
    ) {
        public static View from(TrainingAgreement entity) {
            return new View(
                    entity.getAgreementId(),
                    entity.getOwner().getUserId(),
                    entity.getTrainer().getUserId(),
                    entity.getCamel().getCamelId(),
                    entity.getFeeOmr(),
                    entity.getPrizeSharePct(),
                    entity.getSaleSharePct(),
                    entity.getStartsAt(),
                    entity.getEndsAt(),
                    entity.getProposedAt(),
                    entity.getRespondedAt(),
                    entity.getAcceptedAt(),
                    entity.getTerminatedAt(),
                    entity.getCompletedAt(),
                    entity.getExpiredAt(),
                    entity.getTerms(),
                    entity.getRejectionReason(),
                    entity.getTerminationReason(),
                    entity.getRejectedBy() == null ? null : entity.getRejectedBy().getUserId(),
                    entity.getTerminatedBy() == null ? null : entity.getTerminatedBy().getUserId(),
                    entity.getStatus(),
                    entity.getRowVersion()
            );
        }
    }
}
