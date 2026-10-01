package com.gulfracing.service;

import com.gulfracing.dto.TrainingLogDtos;
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
    public TrainingLogDtos.View add(TrainingLogDtos.Create request, Long actorId) {
        var actor = users.getActive(actorId);
        var agreement = agreements.findLockedById(request.agreementId())
                .orElseThrow(() -> ApiException.notFound("Agreement"));
        if (!actorId.equals(agreement.getTrainer().getUserId())
                || actor.getRoles().stream().noneMatch(r -> "TRAINER".equals(r.getRoleName()))) {
            throw ApiException.forbidden();
        }
        if (agreement.getStatus() != AgreementStatus.ACTIVE) {
            throw ApiException.conflict("Training can only be logged for an accepted active agreement.");
        }
        var now = clock.instant();
        if (now.isBefore(agreement.getStartsAt()) || !now.isBefore(agreement.getEndsAt())) {
            throw ApiException.conflict("The training agreement is outside its active date range.");
        }
        if (request.sessionAt().isAfter(now)
                || request.sessionAt().isBefore(agreement.getStartsAt())
                || !request.sessionAt().isBefore(agreement.getEndsAt())) {
            throw ApiException.badRequest("Session time must be within the agreement and cannot be in the future.");
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
    public List<TrainingLogDtos.View> forAgreement(Long id, Long actorId) {
        users.getActive(actorId);
        if (id == null || id <= 0) throw ApiException.badRequest("A valid agreement ID is required.");
        var agreement = agreements.findById(id).orElseThrow(() -> ApiException.notFound("Agreement"));
        if (!actorId.equals(agreement.getOwner().getUserId())
                && !actorId.equals(agreement.getTrainer().getUserId())
                && !users.isAdmin(actorId)) {
            throw ApiException.forbidden();
        }
        return logs.findByAgreement_AgreementIdOrderBySessionAtDescLogIdDesc(id)
                .stream().map(TrainingLogDtos.View::from).toList();
    }
}
