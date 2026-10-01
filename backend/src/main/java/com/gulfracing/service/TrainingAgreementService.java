package com.gulfracing.service;

import com.gulfracing.dto.AgreementDtos;
import com.gulfracing.entity.TrainingAgreement;
import com.gulfracing.enums.AgreementStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.TrainerProfileRepository;
import com.gulfracing.repository.TrainingAgreementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingAgreementService {
    private static final List<AgreementStatus> ACTIVE_STATES =
            List.of(AgreementStatus.PENDING_APPROVAL, AgreementStatus.ACTIVE);
    private final TrainingAgreementRepository agreements;
    private final TrainerProfileRepository trainerProfiles;
    private final CamelRepository camels;
    private final CamelAccessService camelAccess;
    private final UserService users;
    private final Clock clock;

    @Transactional
    public AgreementDtos.View propose(AgreementDtos.Create request, Long actorId) {
        var owner = users.getActive(actorId);
        if (owner.getRoles().stream().noneMatch(r -> "OWNER".equals(r.getRoleName())
                || "ADMIN".equals(r.getRoleName()))) throw ApiException.forbidden();
        if (!request.endsAt().isAfter(request.startsAt()) || request.startsAt().isBefore(clock.instant())) {
            throw ApiException.badRequest("Agreement start must not be in the past and end must be later.");
        }
        if (actorId.equals(request.trainerUserId())) {
            throw ApiException.badRequest("An owner cannot be their own trainer.");
        }
        var camel = camels.findLockedById(request.camelId())
                .orElseThrow(() -> ApiException.notFound("Camel"));
        if (!Boolean.TRUE.equals(camel.getIsActive())) throw ApiException.conflict("The camel is inactive.");
        camelAccess.requireFullOwner(camel.getCamelId(), actorId);
        var trainer = trainerProfiles.findById(request.trainerUserId())
                .orElseThrow(() -> ApiException.notFound("Trainer profile"));
        var trainerUser = users.getActive(request.trainerUserId());
        if (trainerUser.getRoles().stream().noneMatch(r -> "TRAINER".equals(r.getRoleName()))) {
            throw ApiException.conflict("The designated trainer must have the TRAINER role.");
        }
        if (agreements.existsByCamel_CamelIdAndStatusIn(camel.getCamelId(), ACTIVE_STATES)) {
            throw ApiException.conflict("This camel already has a pending or active training agreement.");
        }

        var agreement = new TrainingAgreement();
        agreement.setOwner(owner);
        agreement.setTrainer(trainer);
        agreement.setCamel(camel);
        agreement.setFeeOmr(request.feeOmr());
        agreement.setPrizeSharePct(request.prizeSharePct());
        agreement.setSaleSharePct(request.saleSharePct());
        agreement.setStartsAt(request.startsAt());
        agreement.setEndsAt(request.endsAt());
        agreement.setProposedAt(clock.instant());
        agreement.setStatus(AgreementStatus.PENDING_APPROVAL);
        return AgreementDtos.View.from(agreements.saveAndFlush(agreement));
    }

    @Transactional(readOnly = true)
    public List<AgreementDtos.View> mine(Long actorId) {
        users.getActive(actorId);
        return agreements.findByOwner_UserIdOrTrainer_UserIdOrderByAgreementIdDesc(actorId, actorId)
                .stream().map(AgreementDtos.View::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AgreementDtos.View> all(Long actorId) {
        if (!users.isAdmin(actorId)) throw ApiException.forbidden();
        return agreements.findAll(Sort.by(Sort.Direction.DESC, "agreementId"))
                .stream().map(AgreementDtos.View::from).toList();
    }

    @Transactional(readOnly = true)
    public AgreementDtos.View get(Long id, Long actorId) {
        var agreement = find(id);
        requireParticipant(agreement, actorId);
        return AgreementDtos.View.from(agreement);
    }

    @Transactional
    public AgreementDtos.View accept(Long id, Long actorId) {
        var agreement = locked(id);
        requireTrainer(agreement, actorId);
        if (agreement.getStatus() != AgreementStatus.PENDING_APPROVAL) {
            throw ApiException.conflict("Only pending agreements may be accepted.");
        }
        if (!agreement.getEndsAt().isAfter(clock.instant())) {
            throw ApiException.conflict("This proposed agreement has expired.");
        }
        camelAccess.requireFullOwner(agreement.getCamel().getCamelId(), agreement.getOwner().getUserId());
        agreement.setStatus(AgreementStatus.ACTIVE);
        agreement.setRespondedAt(clock.instant());
        agreement.setAcceptedAt(clock.instant());
        return AgreementDtos.View.from(agreement);
    }

    @Transactional
    public AgreementDtos.View reject(Long id, Long actorId) {
        var agreement = locked(id);
        requireTrainer(agreement, actorId);
        if (agreement.getStatus() != AgreementStatus.PENDING_APPROVAL) {
            throw ApiException.conflict("Only pending agreements may be rejected.");
        }
        agreement.setStatus(AgreementStatus.REJECTED);
        agreement.setRespondedAt(clock.instant());
        return AgreementDtos.View.from(agreement);
    }

    @Transactional
    public AgreementDtos.View terminate(Long id, Long actorId) {
        var agreement = locked(id);
        requireParticipant(agreement, actorId);
        if (agreement.getStatus() == AgreementStatus.PENDING_APPROVAL
                && !actorId.equals(agreement.getOwner().getUserId())) throw ApiException.forbidden();
        if (agreement.getStatus() != AgreementStatus.ACTIVE
                && agreement.getStatus() != AgreementStatus.PENDING_APPROVAL) {
            throw ApiException.conflict("This agreement can no longer be terminated.");
        }
        agreement.setStatus(AgreementStatus.TERMINATED);
        agreement.setTerminatedAt(clock.instant());
        return AgreementDtos.View.from(agreement);
    }

    private TrainingAgreement find(Long id) {
        validateId(id);
        return agreements.findById(id).orElseThrow(() -> ApiException.notFound("Agreement"));
    }

    private TrainingAgreement locked(Long id) {
        validateId(id);
        return agreements.findLockedById(id).orElseThrow(() -> ApiException.notFound("Agreement"));
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) throw ApiException.badRequest("A valid agreement ID is required.");
    }

    private void requireParticipant(TrainingAgreement agreement, Long actorId) {
        users.getActive(actorId);
        if (!actorId.equals(agreement.getOwner().getUserId())
                && !actorId.equals(agreement.getTrainer().getUserId())
                && !users.isAdmin(actorId)) throw ApiException.forbidden();
    }

    private void requireTrainer(TrainingAgreement agreement, Long actorId) {
        var actor = users.getActive(actorId);
        if (!actorId.equals(agreement.getTrainer().getUserId())
                || actor.getRoles().stream().noneMatch(r -> "TRAINER".equals(r.getRoleName()))) {
            throw ApiException.forbidden();
        }
    }
}
