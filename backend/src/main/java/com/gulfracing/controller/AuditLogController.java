package com.gulfracing.controller;

import com.gulfracing.dto.AuditLogDTO;
import com.gulfracing.dto.PageResponse;
import com.gulfracing.service.AuditLogService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

// Append-only audit history: only server-side AuditRecorder writes events.
// No API routes allow clients (including administrators) to alter or delete audit events.
@RestController
@RequestMapping("/api/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AuditLogController {
    private final AuditLogService auditLogService;

    @GetMapping
    public PageResponse<AuditLogDTO> list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Size(max = 50) String actionType,
            @RequestParam(required = false) @Size(max = 50) String entityType,
            @RequestParam(required = false) @Positive Long actorUserId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
        return auditLogService.list(page, size, actionType, entityType, actorUserId, from, to);
    }

    @GetMapping("/{id}")
    public AuditLogDTO detail(@PathVariable @Positive Long id) {
        return AuditLogDTO.convertToDTO(auditLogService.getById(id));
    }
}
