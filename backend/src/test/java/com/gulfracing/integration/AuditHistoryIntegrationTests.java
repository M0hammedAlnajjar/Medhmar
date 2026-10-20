package com.gulfracing.integration;

import com.gulfracing.service.AuditRecorder;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuditHistoryIntegrationTests extends IntegrationSupport {
    @Autowired AuditRecorder recorder;

    @Test
    void adminCanFilterAndPageRealAuditRecords() throws Exception {
        var session = admin();
        var actor = register("audit-subject@example.com");
        long firstId = recorder.record("AUDIT_LIST_TEST", "User", actor.userId(), null, actor.userId());
        long secondId = recorder.record("AUDIT_LIST_TEST", "User", actor.userId(), null, actor.userId());
        recorder.record("AUDIT_OTHER_TEST", "Camel", actor.userId(), null, actor.userId());

        mvc.perform(get("/api/admin/audit-logs").session(session)
                .param("actionType", "AUDIT_LIST_TEST")
                .param("entityType", "User")
                .param("actorUserId", actor.userId().toString())
                .param("from", "2030-01-01T00:00:00Z")
                .param("to", "2030-01-01T23:59:59Z")
                .param("page", "0").param("size", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].auditId").value(secondId))
            .andExpect(jsonPath("$.content[0].actorUserId").value(actor.userId()))
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.totalPages").value(2));

        mvc.perform(get("/api/admin/audit-logs").session(session)
                .param("actionType", "AUDIT_LIST_TEST").param("size", "1").param("page", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].auditId").value(firstId));

        mvc.perform(get("/api/admin/audit-logs/{id}", firstId).session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.actionType").value("AUDIT_LIST_TEST"));
    }

    @Test
    void auditHistoryIsRestrictedAndReadOnlyEvenForAdmins() throws Exception {
        var viewer = register("audit-viewer@example.com");
        var viewerSession = login(viewer.email());
        var adminSession = admin();

        mvc.perform(get("/api/admin/audit-logs"))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/audit-logs").session(viewerSession))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/audit-logs").session(adminSession))
            .andExpect(status().isOk());

        // No mutation mapping is published, even to an administrator.
        mvc.perform(post("/api/admin/audit-logs").session(adminSession).with(csrf())
                .contentType("application/json").content("{}"))
            .andExpect(status().isMethodNotAllowed());
        mvc.perform(put("/api/admin/audit-logs/1").session(adminSession).with(csrf())
                .contentType("application/json").content("{}"))
            .andExpect(status().isMethodNotAllowed());
        mvc.perform(delete("/api/admin/audit-logs/1").session(adminSession).with(csrf()))
            .andExpect(status().isMethodNotAllowed());
        mvc.perform(post("/audit-log/add").session(adminSession).with(csrf())
                .contentType("application/json").content("{}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void invalidRangeAndPaginationAreRejected() throws Exception {
        var session = admin();
        mvc.perform(get("/api/admin/audit-logs").session(session)
                .param("size", "101"))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/admin/audit-logs").session(session)
                .param("from", "2030-01-03T00:00:00Z")
                .param("to", "2030-01-01T00:00:00Z"))
            .andExpect(status().isBadRequest());
    }
}
