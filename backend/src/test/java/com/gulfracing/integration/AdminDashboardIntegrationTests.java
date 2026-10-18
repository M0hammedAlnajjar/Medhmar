package com.gulfracing.integration;

import com.gulfracing.entity.Camel;
import com.gulfracing.service.AuditRecorder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Date;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminDashboardIntegrationTests extends IntegrationSupport {
    @Autowired AuditRecorder recorder;

    @Test
    void adminDashboardReturnsLiveCountsSevenUtcDaysAndRecentAuditEvents() throws Exception {
        var adminUser = register("dashboard-admin@example.com");
        users.updateRoles(adminUser.userId(), Set.of("ADMIN"));
        var session = login(adminUser.email());

        Camel sample = camel("Dash Camel");
        sample.setIsActive(true);
        sample.setCreatedDate(Date.from(NOW.minusSeconds(3600)));
        camelRepository.saveAndFlush(sample);
        recorder.record("CAMEL_ADDED", "Camel", sample.getCamelId(), sample.getCamelId(), adminUser.userId());

        var response = mvc.perform(get("/api/admin/dashboard").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalUsers").value(1))
            .andExpect(jsonPath("$.activeCamels").value(1))
            .andExpect(jsonPath("$.upcomingRaces").value(0))
            .andExpect(jsonPath("$.activeListings").value(0))
            .andExpect(jsonPath("$.activity.length()").value(7))
            .andExpect(jsonPath("$.recentEvents[0].actionType").value("CAMEL_ADDED"))
            .andExpect(jsonPath("$.recentEvents[0].actorUserId").value(adminUser.userId()))
            .andReturn();
        String payload = response.getResponse().getContentAsString();
        assertThat(payload).doesNotContain(adminUser.email(), "passwordHash", "StrongPassword123!");
    }

    @Test
    void onlyAnAuthenticatedAdminMayReadDashboard() throws Exception {
        var viewer = register("dashboard-viewer@example.com");
        mvc.perform(get("/api/admin/dashboard").session(login(viewer.email())))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/dashboard"))
            .andExpect(status().isUnauthorized());
    }
}
