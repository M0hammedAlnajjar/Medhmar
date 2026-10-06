package com.gulfracing.service;

import com.gulfracing.dto.AgreementDtos;
import com.gulfracing.entity.TrainingAgreement;
import com.gulfracing.enums.AgreementStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.TrainerProfileRepository;
import com.gulfracing.repository.TrainingAgreementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingAgreementService {
    private static final List<AgreementStatus> OPEN_STATES =
            List.of(AgreementStatus.PENDING_APPROVAL, AgreementStatus.ACTIVE);

    private final TrainingAgreementRepository agreements;
    private final TrainerProfileRepository trainerProfiles;
    private final CamelRepository camels;
    private final CamelAccessService camelAccess;
    private final UserService users;
    private final Clock clock;
    private final OwnershipRecordRepository ownerships;

    @Transactional
    public AgreementDtos.View propose(AgreementDtos.Create request, Long actorId) {
        var owner = users.getActive(actorId);
        requireOwnerRole(owner);
        validateDates(request.startsAt(), request.endsAt());

        if (actorId.equals(request.trainerUserId())) {
            throw ApiException.badRequest("An owner cannot be their own trainer.");
        }

        var camel = camels.findLockedById(request.camelId())
                .orElseThrow(() -> ApiException.notFound("Camel"));
        if (!Boolean.TRUE.equals(camel.getIsActive())) {
            throw ApiException.conflict("The camel is inactive.");
        }
        camelAccess.requireFullOwner(camel.getCamelId(), actorId);

        var trainer = trainerProfiles.findById(request.trainerUserId())
                .orElseThrow(() -> ApiException.notFound("Trainer profile"));
        var trainerUser = users.getActive(request.trainerUserId());
        if (trainerUser.getRoles().stream().noneMatch(r -> "TRAINER".equals(r.getRoleName()))) {
            throw ApiException.conflict("The designated trainer must have the TRAINER role.");
        }

        var existing = agreements.findActiveForCamelForUpdate(camel.getCamelId(), OPEN_STATES);
        existing.forEach(this::refreshLifecycle);
        if (existing.stream().anyMatch(a -> OPEN_STATES.contains(a.getStatus()))) {
            throw ApiException.conflict("This camel already has a pending or active training agreement.");
        }

        var agreement = new TrainingAgreement();
        agreement.setOwner(owner);
        agreement.setTrainer(trainer);
        agreement.setCamel(camel);
        applyTerms(
                agreement,
                request.feeOmr(),
                request.prizeSharePct(),
                request.saleSharePct(),
                request.startsAt(),
                request.endsAt(),
                request.terms()
        );
        agreement.setProposedAt(clock.instant());
        agreement.setStatus(AgreementStatus.PENDING_APPROVAL);

        return AgreementDtos.View.from(agreements.saveAndFlush(agreement));
    }

    @Transactional
    public AgreementDtos.View update(Long id, AgreementDtos.Update request, Long actorId) {
        var agreement = locked(id);
        refreshLifecycle(agreement);
        requireOwner(agreement, actorId);

        if (agreement.getStatus() != AgreementStatus.PENDING_APPROVAL) {
            throw ApiException.conflict("Only pending agreements may be edited.");
        }

        validateDates(request.startsAt(), request.endsAt());
        applyTerms(
                agreement,
                request.feeOmr(),
                request.prizeSharePct(),
                request.saleSharePct(),
                request.startsAt(),
                request.endsAt(),
                request.terms()
        );

        return AgreementDtos.View.from(agreement);
    }

    @Transactional
    public List<AgreementDtos.View> mine(Long actorId) {
        users.getActive(actorId);
        var result = agreements.findByOwner_UserIdOrTrainer_UserIdOrderByAgreementIdDesc(actorId, actorId);
        result.forEach(this::refreshLifecycle);
        return result.stream().map(AgreementDtos.View::from).toList();
    }

    @Transactional
    public List<AgreementDtos.View> assigned(Long actorId) {
        var actor = users.getActive(actorId);
        if (actor.getRoles().stream().noneMatch(r -> "TRAINER".equals(r.getRoleName()))) {
            throw ApiException.forbidden();
        }

        var result = agreements.findByTrainer_UserIdAndStatusOrderByAgreementIdDesc(
                actorId, AgreementStatus.ACTIVE
        );
        result.forEach(this::refreshLifecycle);

        return result.stream()
                .filter(a -> a.getStatus() == AgreementStatus.ACTIVE)
                .map(AgreementDtos.View::from)
                .toList();
    }

    @Transactional
    public List<AgreementDtos.View> all(Long actorId) {
        if (!users.isAdmin(actorId)) {
            throw ApiException.forbidden();
        }

        var result = agreements.findAll(Sort.by(Sort.Direction.DESC, "agreementId"));
        result.forEach(this::refreshLifecycle);
        return result.stream().map(AgreementDtos.View::from).toList();
    }

    @Transactional
    public AgreementDtos.View get(Long id, Long actorId) {
        var agreement = find(id);
        refreshLifecycle(agreement);
        requireParticipant(agreement, actorId);
        return AgreementDtos.View.from(agreement);
    }

    @Transactional
    public AgreementDtos.View accept(Long id, Long actorId) {
        var agreement = locked(id);
        refreshLifecycle(agreement);
        requireTrainer(agreement, actorId);

        if (agreement.getStatus() != AgreementStatus.PENDING_APPROVAL) {
            throw ApiException.conflict("Only pending agreements may be accepted.");
        }

        camelAccess.requireFullOwner(
                agreement.getCamel().getCamelId(),
                agreement.getOwner().getUserId()
        );

        var now = clock.instant();
        agreement.setStatus(AgreementStatus.ACTIVE);
        agreement.setRespondedAt(now);
        agreement.setAcceptedAt(now);
        agreement.setRejectionReason(null);
        agreement.setRejectedBy(null);

        return AgreementDtos.View.from(agreement);
    }

    @Transactional
    public AgreementDtos.View reject(Long id, AgreementDtos.Reason request, Long actorId) {
        var agreement = locked(id);
        refreshLifecycle(agreement);
        requireTrainer(agreement, actorId);

        if (agreement.getStatus() != AgreementStatus.PENDING_APPROVAL) {
            throw ApiException.conflict("Only pending agreements may be rejected.");
        }

        agreement.setStatus(AgreementStatus.REJECTED);
        agreement.setRespondedAt(clock.instant());
        agreement.setRejectedBy(users.getActive(actorId));
        agreement.setRejectionReason(cleanReason(request == null ? null : request.reason()));

        return AgreementDtos.View.from(agreement);
    }

    @Transactional
    public AgreementDtos.View terminate(Long id, AgreementDtos.Reason request, Long actorId) {
        var agreement = locked(id);
        refreshLifecycle(agreement);
        requireParticipant(agreement, actorId);

        if (agreement.getStatus() == AgreementStatus.PENDING_APPROVAL
                && !actorId.equals(agreement.getOwner().getUserId())
                && !users.isAdmin(actorId)) {
            throw ApiException.forbidden();
        }

        if (agreement.getStatus() != AgreementStatus.ACTIVE
                && agreement.getStatus() != AgreementStatus.PENDING_APPROVAL) {
            throw ApiException.conflict("This agreement can no longer be terminated.");
        }

        agreement.setStatus(AgreementStatus.TERMINATED);
        agreement.setTerminatedAt(clock.instant());
        agreement.setTerminatedBy(users.getActive(actorId));
        agreement.setTerminationReason(cleanReason(request == null ? null : request.reason()));

        return AgreementDtos.View.from(agreement);
    }

    @Transactional
    public TrainingAgreement findActiveAgreementForSale(Long camelId) {
        validateId(camelId);
        var candidates = agreements.findActiveForCamelForUpdate(
                camelId,
                List.of(AgreementStatus.ACTIVE)
        );
        candidates.forEach(this::refreshLifecycle);

        return candidates.stream()
                .filter(a -> a.getStatus() == AgreementStatus.ACTIVE)
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public void terminateForOwnershipChange(Long camelId, Long actorId) {
        var openAgreements = agreements.findActiveForCamelForUpdate(camelId, OPEN_STATES);
        if (openAgreements.isEmpty()) {
            return;
        }

        var actor = users.getActive(actorId);
        for (var agreement : openAgreements) {
            refreshLifecycle(agreement);
            if (!OPEN_STATES.contains(agreement.getStatus())) {
                continue;
            }
            agreement.setStatus(AgreementStatus.TERMINATED);
            agreement.setTerminatedAt(clock.instant());
            agreement.setTerminatedBy(actor);
            agreement.setTerminationReason("Camel ownership changed.");
        }
    }

    @Transactional
    public void terminateIfOwnerLostFullOwnership(Long camelId) {
        var openAgreements = agreements.findActiveForCamelForUpdate(camelId, OPEN_STATES);
        if (openAgreements.isEmpty()) {
            return;
        }

        var nowDate = java.util.Date.from(clock.instant());
        for (var agreement : openAgreements) {
            refreshLifecycle(agreement);
            if (!OPEN_STATES.contains(agreement.getStatus())) {
                continue;
            }

            Long ownerId = agreement.getOwner().getUserId();
            Double share = ownerships.currentOwnershipShare(camelId, ownerId, nowDate);
            if (share == null || share < 99.999d) {
                agreement.setStatus(AgreementStatus.TERMINATED);
                agreement.setTerminatedAt(clock.instant());
                agreement.setTerminationReason("Owner no longer holds full ownership of the camel.");
            }
        }
    }

    private void applyTerms(
            TrainingAgreement agreement,
            java.math.BigDecimal feeOmr,
            java.math.BigDecimal prizeSharePct,
            java.math.BigDecimal saleSharePct,
            Instant startsAt,
            Instant endsAt,
            String terms
    ) {
        agreement.setFeeOmr(feeOmr);
        agreement.setPrizeSharePct(prizeSharePct);
        agreement.setSaleSharePct(saleSharePct);
        agreement.setStartsAt(startsAt);
        agreement.setEndsAt(endsAt);
        agreement.setTerms(cleanTerms(terms));
    }

    private void validateDates(Instant startsAt, Instant endsAt) {
        if (!endsAt.isAfter(startsAt) || startsAt.isBefore(clock.instant())) {
            throw ApiException.badRequest(
                    "Agreement start must not be in the past and end must be later."
            );
        }
    }

    private void refreshLifecycle(TrainingAgreement agreement) {
        var now = clock.instant();

        if (agreement.getStatus() == AgreementStatus.PENDING_APPROVAL
                && !agreement.getEndsAt().isAfter(now)) {
            agreement.setStatus(AgreementStatus.EXPIRED);
            if (agreement.getExpiredAt() == null) {
                agreement.setExpiredAt(now);
            }
            return;
        }

        if (agreement.getStatus() == AgreementStatus.ACTIVE
                && !agreement.getEndsAt().isAfter(now)) {
            agreement.setStatus(AgreementStatus.COMPLETED);
            if (agreement.getCompletedAt() == null) {
                agreement.setCompletedAt(now);
            }
        }
    }

    private String cleanTerms(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.strip();
    }

    private String cleanReason(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.strip();
    }

    private TrainingAgreement find(Long id) {
        validateId(id);
        return agreements.findById(id)
                .orElseThrow(() -> ApiException.notFound("Agreement"));
    }

    private TrainingAgreement locked(Long id) {
        validateId(id);
        return agreements.findLockedById(id)
                .orElseThrow(() -> ApiException.notFound("Agreement"));
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw ApiException.badRequest("A valid ID is required.");
        }
    }

    private void requireOwnerRole(com.gulfracing.entity.User actor) {
        if (actor.getRoles().stream().noneMatch(r ->
                "OWNER".equals(r.getRoleName()) || "ADMIN".equals(r.getRoleName()))) {
            throw ApiException.forbidden();
        }
    }

    private void requireOwner(TrainingAgreement agreement, Long actorId) {
        users.getActive(actorId);
        if (!actorId.equals(agreement.getOwner().getUserId()) && !users.isAdmin(actorId)) {
            throw ApiException.forbidden();
        }
    }

    private void requireParticipant(TrainingAgreement agreement, Long actorId) {
        users.getActive(actorId);
        if (!actorId.equals(agreement.getOwner().getUserId())
                && !actorId.equals(agreement.getTrainer().getUserId())
                && !users.isAdmin(actorId)) {
            throw ApiException.forbidden();
        }
    }

    private void requireTrainer(TrainingAgreement agreement, Long actorId) {
        var actor = users.getActive(actorId);
        if (!actorId.equals(agreement.getTrainer().getUserId())
                || actor.getRoles().stream().noneMatch(r -> "TRAINER".equals(r.getRoleName()))) {
            throw ApiException.forbidden();
        }
    }
}
