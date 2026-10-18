package com.gulfracing.controller;

import com.gulfracing.dto.AdminDashboardResponse;
import com.gulfracing.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** ADMIN-only summary endpoint for the management dashboard. */
@RestController
@RequestMapping("/api/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDashboardController {
    private final AdminDashboardService dashboard;

    @GetMapping
    public AdminDashboardResponse getDashboard() {
        return dashboard.summary();
    }
}
