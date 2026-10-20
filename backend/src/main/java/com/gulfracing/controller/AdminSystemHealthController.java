package com.gulfracing.controller;

import com.gulfracing.dto.AdminSystemHealthResponse;
import com.gulfracing.service.AdminSystemHealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Explicit ADMIN-only live connectivity and challenge-vote counts. */
@RestController
@RequestMapping("/api/admin/system-health")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminSystemHealthController {
    private final AdminSystemHealthService health;

    @GetMapping
    public AdminSystemHealthResponse check() {
        return health.check();
    }
}
