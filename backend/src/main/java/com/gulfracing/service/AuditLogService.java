package com.gulfracing.service;

import com.gulfracing.entity.AuditLog;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.AuditLogRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;
    private final CamelService camelService;

    @Transactional
    public Long create(
            String actionType,
            String entityType,
            Long entityId,
            String description,
            Long camelId
    ) {
        var camel = camelService.getById(camelId);

        var auditLog = new AuditLog();
        auditLog.setActionType(actionType);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setCreatedAt(Instant.now());
        auditLog.setDescription(description);
        auditLog.setCamel(camel);

        return auditLogRepository.saveAndFlush(auditLog).getAuditId();
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getAll() {
        return auditLogRepository.findAll(Sort.by("createdAt"));
    }

    @Transactional(readOnly = true)
    public AuditLog getById(Long id) {
        return auditLogRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Audit log"));
    }

    @Transactional
    public AuditLog update(
            Long id,
            String actionType,
            String entityType,
            Long entityId,
            String description,
            Long camelId
    ) {
        var auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Audit log"));

        var camel = camelService.getById(camelId);

        auditLog.setActionType(actionType);
        auditLog.setEntityType(entityType);
        auditLog.setEntityId(entityId);
        auditLog.setDescription(description);
        auditLog.setCamel(camel);

        return auditLog;
    }

    @Transactional
    public Boolean delete(Long id) {
        var auditLog = auditLogRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Audit log"));

        auditLogRepository.delete(auditLog);
        return true;
    }
}
