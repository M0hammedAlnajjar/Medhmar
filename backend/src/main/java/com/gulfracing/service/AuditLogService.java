package com.gulfracing.service;

import com.gulfracing.entity.AuditLog;
import com.gulfracing.dto.AuditLogDTO;
import com.gulfracing.dto.PageResponse;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.AuditLogRepository;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageRequest;
import jakarta.persistence.criteria.Predicate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;

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

    // Server-side pagination prevents loading the entire audit history into the browser.
    // Filters and sort are evaluated in the database, with stable ordering for ties.
    @Transactional(readOnly = true)
    public PageResponse<AuditLogDTO> list(int page, int size, String actionType,
            String entityType, Long actorUserId, Instant from, Instant to) {
        if (from != null && to != null && from.isAfter(to))
            throw ApiException.badRequest("From timestamp must be on or before To timestamp.");
        var conditions = (org.springframework.data.jpa.domain.Specification<AuditLog>) (root, query, cb) -> {
            var predicates = new ArrayList<Predicate>();
            if (actionType != null && !actionType.isBlank())
                predicates.add(cb.equal(root.get("actionType"), actionType.trim()));
            if (entityType != null && !entityType.isBlank())
                predicates.add(cb.equal(root.get("entityType"), entityType.trim()));
            if (actorUserId != null)
                predicates.add(cb.equal(root.get("actorUserId"), actorUserId));
            if (from != null)
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            if (to != null)
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            return cb.and(predicates.toArray(new Predicate[0]));
        };
        var records = auditLogRepository.findAll(conditions,
            PageRequest.of(page, size, Sort.by(
                Sort.Order.desc("createdAt"), Sort.Order.desc("auditId"))));
        return PageResponse.from(records, AuditLogDTO::convertToDTO);
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
