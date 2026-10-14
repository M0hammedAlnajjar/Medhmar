package com.gulfracing.service;

import com.gulfracing.entity.AuditLog;
import com.gulfracing.repository.AuditLogRepository;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.security.AccountAccess;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.Clock;

@Service
@RequiredArgsConstructor
public class AuditRecorder {
    private final AuditLogRepository logs;
    private final CamelRepository camels;
    private final Clock clock;

    // Joins the business transaction: neither operation nor its audit can commit alone.
    @Transactional
    public Long record(String action, String type, Long id, Long camelId, Long actorId) {
        var log = new AuditLog();
        log.setActionType(action);
        log.setEntityType(type);
        log.setEntityId(id);
        log.setCreatedAt(clock.instant());
        log.setActorUserId(actorId != null ? actorId : AccountAccess.optionalId(
                SecurityContextHolder.getContext().getAuthentication()));
        if (camelId != null) log.setCamel(camels.getReferenceById(camelId));
        return logs.save(log).getAuditId();
    }
}
