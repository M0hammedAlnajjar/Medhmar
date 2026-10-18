package com.gulfracing.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/** Read-only summary of measured platform data. No fabricated or sampled totals. */
public record AdminDashboardResponse(
        long totalUsers,
        long activeCamels,
        long upcomingRaces,
        long activeListings,
        List<ActivityDay> activity,
        List<RecentEvent> recentEvents,
        Instant generatedAt
) {
    public record ActivityDay(LocalDate date, long newUsers, long newCamels, long newListings) { }
    public record RecentEvent(Long auditId, String actionType, String entityType,
                              Long entityId, Long actorUserId, Instant createdAt) { }
}
