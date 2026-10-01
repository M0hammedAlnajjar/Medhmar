package com.gulfracing.dto;
import com.gulfracing.entity.Mudammer;
import com.gulfracing.enums.AgreementStatus;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class MudammerDTO {

    @Positive
    private Long agreementId;
    private Date proposedAt;
    private Date startsAt;
    private Date endsAt;
    private BigDecimal feeOmr;
    private BigDecimal offeredSharePct;
    private AgreementStatus status;
    private Date acceptedAt;
    private Long userId;
    private Long trainerId;
    private Long camelId;

    public static MudammerDTO convertToDTO(Mudammer entity) {
        return MudammerDTO.builder()
                .agreementId(entity.getAgreementId())
                .proposedAt(entity.getProposedAt())
                .startsAt(entity.getStartsAt())
                .endsAt(entity.getEndsAt())
                .feeOmr(entity.getFeeOmr())
                .offeredSharePct(entity.getOfferedSharePct())
                .status(entity.getStatus())
                .acceptedAt(entity.getAcceptedAt())
                .userId(entity.getUser() != null
                        ? entity.getUser().getUserId()
                        : null)
                .trainerId(entity.getTrainer() != null
                        ? entity.getTrainer().getUserId()
                        : null)
                .camelId(entity.getCamel() != null
                        ? entity.getCamel().getCamelId()
                        : null)
                .build();
    }

    public static List<MudammerDTO> convertToDTO(List<Mudammer> entityList) {
        List<MudammerDTO> dtos = new ArrayList<>();

        for (Mudammer mudammer : entityList) {
            dtos.add(convertToDTO(mudammer));
        }

        return dtos;
    }
}
