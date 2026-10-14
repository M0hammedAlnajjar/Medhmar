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
    private final com.gulfracing.repository.CamelRepository camels;
    private final AuditRecorder recorder;

    @Transactional
    public Long create(
            String actionType,
            String entityType,
            Long entityId,
            String description,
            Long camelId
    ) {
        if (camelId != null && !camels.existsById(camelId)) throw ApiException.notFound("Camel");
        Long id = recorder.record("MANUAL_NOTE", entityType, entityId, camelId, null);
        auditLogRepository.findById(id).orElseThrow().setDescription(description);
        return id;
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
        throw ApiException.conflict("Audit history is append-only and cannot be edited.");
    }

    @Transactional
    public Boolean delete(Long id) {
        throw ApiException.conflict("Audit history is append-only and cannot be deleted.");
    }
}
