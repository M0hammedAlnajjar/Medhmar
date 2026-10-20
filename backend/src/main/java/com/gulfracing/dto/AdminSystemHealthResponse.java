package com.gulfracing.dto;

import java.time.Instant;

/** Safe operational status for the administrator UI. Never expose connection credentials. */
public record AdminSystemHealthResponse(
        String backendStatus,
        String databaseStatus,
        Long totalChallenges,
        Long totalVotes,
        Instant checkedAt
) {}
