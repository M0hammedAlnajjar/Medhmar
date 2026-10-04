package com.gulfracing.service;

import com.gulfracing.dto.TrainingLogDtos;
import com.gulfracing.entity.TrainingAgreement;
import com.gulfracing.entity.TrainingLog;
import com.gulfracing.enums.AgreementStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.TrainingAgreementRepository;
import com.gulfracing.repository.TrainingLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainingLogService {

    private final TrainingLogRepository logs;
    private final TrainingAgreementRepository agreements;
    private final UserService users;
    private final Clock clock;

    @Transactional
    public TrainingLogDtos.View create(TrainingLogDtos.Create request, Long actorId) {
        var actor = users.getActive(actorId);
        if (actor.getRoles().stream().noneMatch(role -> "TRAINER".equals(role.getRoleName()))) {
            throw ApiException.forbidden();
        }

        var agreement = findAgreement(request.agreementId());
        if (!actorId.equals(agreement.getTrainer().getUserId())) {
            throw ApiException.forbidden();
        }
        if (agreement.getStatus() != AgreementStatus.ACTIVE) {
            throw ApiException.conflict("Training logs can only be added to an active agreement.");
        }

        var now = clock.instant();
        if (now.isBefore(agreement.getStartsAt()) || !now.isBefore(agreement.getEndsAt())) {
            throw ApiException.conflict("The agreement is outside its active date window.");
        }
        if (request.sessionAt().isAfter(now)) {
            throw ApiException.badRequest("Training session time cannot be in the future.");
        }
        if (request.sessionAt().isBefore(agreement.getStartsAt())
                || !request.sessionAt().isBefore(agreement.getEndsAt())) {
            throw ApiException.badRequest("Training session time must be within the agreement period.");
        }

        var log = new TrainingLog();
        log.setAgreement(agreement);
        log.setSessionAt(request.sessionAt());
        log.setDurationMinutes(request.durationMinutes());
        log.setNotes(request.notes().strip());
        log.setCreatedAt(now);

        return TrainingLogDtos.View.from(logs.saveAndFlush(log));
    }

    @Transactional(readOnly = true)
    public List<TrainingLogDtos.View> forAgreement(Long agreementId, Long actorId) {
        var agreement = findAgreement(agreementId);
        requireParticipant(agreement, actorId);

        return logs.findByAgreement_AgreementIdOrderBySessionAtDescLogIdDesc(agreementId)
                .stream()
                .map(TrainingLogDtos.View::from)
                .toList();
    }

    private TrainingAgreement findAgreement(Long agreementId) {
        if (agreementId == null || agreementId <= 0) {
            throw ApiException.badRequest("A valid agreement ID is required.");
        }
        return agreements.findById(agreementId)
                .orElseThrow(() -> ApiException.notFound("Agreement"));
    }

    private void requireParticipant(TrainingAgreement agreement, Long actorId) {
        users.getActive(actorId);
        if (!actorId.equals(agreement.getOwner().getUserId())
                && !actorId.equals(agreement.getTrainer().getUserId())
                && !users.isAdmin(actorId)) {
            throw ApiException.forbidden();
        }
    }
}
