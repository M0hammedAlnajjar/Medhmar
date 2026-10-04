package com.gulfracing.controller;

import com.gulfracing.dto.AuditLogDTO;
import com.gulfracing.service.AuditLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/audit-log")
@RequiredArgsConstructor
public class AuditLogController {

    private final AuditLogService auditLogService;

    @PostMapping("/add")
    @ResponseStatus(HttpStatus.CREATED)
    public Long addAuditLog(@Valid @RequestBody AuditLogDTO dto) {
        return auditLogService.create(
                dto.getActionType(),
                dto.getEntityType(),
                dto.getEntityId(),
                dto.getDescription(),
                dto.getCamelId()
        );
    }

    @GetMapping("/getAll")
    public List<AuditLogDTO> getAllAuditLogs() {
        return AuditLogDTO.convertToDTO(auditLogService.getAll());
    }

    @GetMapping("/getById")
    public AuditLogDTO getById(@RequestParam Long id) {
        return AuditLogDTO.convertToDTO(auditLogService.getById(id));
    }

    @PutMapping("/update")
    public AuditLogDTO updateAuditLog(
            @Valid @RequestBody AuditLogDTO dto
    ) {
        return AuditLogDTO.convertToDTO(
                auditLogService.update(
                        dto.getAuditId(),
                        dto.getActionType(),
                        dto.getEntityType(),
                        dto.getEntityId(),
                        dto.getDescription(),
                        dto.getCamelId()
                )
        );
    }

    @DeleteMapping("/deleteById")
    public Boolean deleteAuditLog(@RequestParam Long id) {
        return auditLogService.delete(id);
    }
}
