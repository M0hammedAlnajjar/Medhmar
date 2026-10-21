package com.gulfracing.integration;

import org.junit.jupiter.api.Test;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.Set;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminUserStatsIntegrationTests extends IntegrationSupport {
    @Test
    void adminGetsPlatformWideRoleTotalsAndRealComparableRegistrationCounts() throws Exception {
        var session = admin();
        var owner = register("stats-owner@example.com", "OWNER");
        users.updateRoles(owner.userId(), Set.of("OWNER", "VIEWER"));
        var previous = register("stats-previous@example.com", "VIEWER");

        // User joins at current real time; explicitly place records in the
        // fixed integration clock's periods without changing domain insert logic.
        jdbc.update("UPDATE users SET joined_at = ? WHERE user_id = ?",
            Timestamp.from(NOW.minusSeconds(3600)), owner.userId());
        jdbc.update("UPDATE users SET joined_at = ? WHERE user_id = ?",
            Timestamp.from(Instant.parse("2029-12-01T04:00:00Z")), previous.userId());

        mvc.perform(get("/api/admin/users/stats").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalUsers").value(3))
            .andExpect(jsonPath("$.roles.ADMIN.total").value(1))
            .andExpect(jsonPath("$.roles.OWNER.total").value(1))
            .andExpect(jsonPath("$.roles.VIEWER.total").value(2))
            .andExpect(jsonPath("$.roles.TRAINER.total").value(0))
            .andExpect(jsonPath("$.newUsersThisMonth").value(1))
            .andExpect(jsonPath("$.newUsersPreviousPeriod").value(1))
            .andExpect(jsonPath("$.roles.OWNER.newThisMonth").value(1))
            .andExpect(jsonPath("$.roles.VIEWER.newPreviousPeriod").value(1));
    }

    @Test
    void roleStatisticsAreAccessibleOnlyToVerifiedAdministrators() throws Exception {
        var viewer = register("stats-viewer@example.com");
        mvc.perform(get("/api/admin/users/stats").session(login(viewer.email())))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/users/stats"))
            .andExpect(status().isUnauthorized());
    }
}
