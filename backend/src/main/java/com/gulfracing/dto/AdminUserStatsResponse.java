package com.gulfracing.dto;

import java.time.Instant;
import java.util.Map;

/** Live, administrator-only totals and registrations; roles may overlap across users. */
public record AdminUserStatsResponse(
    long totalUsers,
    long newUsersThisMonth,
    long newUsersPreviousPeriod,
    Map<String, RoleStats> roles,
    Instant generatedAt
) {
    public record RoleStats(long total, long newThisMonth, long newPreviousPeriod) { }
}
