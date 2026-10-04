package com.gulfracing.dto;

import com.gulfracing.entity.TrainingAgreement;
import com.gulfracing.enums.AgreementStatus;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class TrainingAgreementDTO {

    @Positive
    private Long agreementId;

    private Instant proposedAt;
    private Instant startsAt;
    private Instant endsAt;

    private BigDecimal feeOmr;
    private BigDecimal prizeSharePct;
    private BigDecimal saleSharePct;

    private AgreementStatus status;

    private Instant respondedAt;
    private Instant acceptedAt;
    private Instant terminatedAt;

    private String rejectionReason;
    private String terminationReason;

    private Instant completedAt;
    private Instant expiredAt;

    private String terms;

    private Long terminatedBy;
    private Long rejectedBy;

    private Long ownerUserId;
    private Long trainerId;
    private Long camelId;

    public static TrainingAgreementDTO convertToDTO(TrainingAgreement entity) {
        return TrainingAgreementDTO.builder()
                .agreementId(entity.getAgreementId())
                .proposedAt(entity.getProposedAt())
                .startsAt(entity.getStartsAt())
                .endsAt(entity.getEndsAt())
                .feeOmr(entity.getFeeOmr())
                .prizeSharePct(entity.getPrizeSharePct())
                .saleSharePct(entity.getSaleSharePct())
                .status(entity.getStatus())
                .respondedAt(entity.getRespondedAt())
                .acceptedAt(entity.getAcceptedAt())
                .terminatedAt(entity.getTerminatedAt())
                .ownerUserId(entity.getOwner() != null
                        ? entity.getOwner().getUserId()
                        : null)
                .rejectionReason(entity.getRejectionReason())
                .terminationReason(entity.getTerminationReason())
                .completedAt(entity.getCompletedAt())
                .expiredAt(entity.getExpiredAt())
                .terms(entity.getTerms())
                .terminatedBy(entity.getTerminatedBy() != null
                        ? entity.getTerminatedBy().getUserId()
                        : null)
                .rejectedBy(entity.getRejectedBy() != null
                        ? entity.getRejectedBy().getUserId()
                        : null)
                .trainerId(entity.getTrainer() != null
                        ? entity.getTrainer().getUserId()
                        : null)
                .camelId(entity.getCamel() != null
                        ? entity.getCamel().getCamelId()
                        : null)
                .build();
    }

    public static List<TrainingAgreementDTO> convertToDTO(
            List<TrainingAgreement> entityList
    ) {
        List<TrainingAgreementDTO> dtos = new ArrayList<>();

        for (TrainingAgreement agreement : entityList) {
            dtos.add(convertToDTO(agreement));
        }

        return dtos;
    }
}