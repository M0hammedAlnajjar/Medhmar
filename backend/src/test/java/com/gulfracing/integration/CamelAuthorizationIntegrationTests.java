package com.gulfracing.integration;

import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CamelAuthorizationIntegrationTests extends IntegrationSupport {

    @Test
    void camelCreationRecordsOwnershipAndOtherOwnersCannotEditOrDeleteIt() throws Exception {
        var viewer = register("viewer@example.com");
        var owner = register("owner@example.com");
        var other = register("other@example.com");

        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(other.userId(), Set.of("OWNER"));

        var ownerSession = login(owner.email());
        var otherSession = login(other.email());

        Map<String, Object> request = new HashMap<>(Map.of(
                "name", "Test Camel",
                "gender", "MALE",
                "birthDate", "2020-01-01T00:00:00Z",
                "breed", "Omani",
                "status", "ACTIVE"
        ));

        mvc.perform(post("/camel/add")
                        .session(login(viewer.email()))
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(request)))
                .andExpect(status().isForbidden());

        var created = mvc.perform(post("/camel/add")
                        .session(ownerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(request)))
                .andExpect(status().isOk())
                .andReturn();

        long id = json.readTree(
                created.getResponse().getContentAsString()
        ).asLong();

        assertThat(jdbc.queryForObject(
                "SELECT owner_id FROM ownership_record WHERE camel_id = ?",
                Long.class,
                id
        )).isEqualTo(owner.userId());

        request.put("camelId", id);

        mvc.perform(put("/camel/update")
                        .session(otherSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(request)))
                .andExpect(status().isForbidden());

        mvc.perform(delete("/camel/deleteById")
                        .param("id", Long.toString(id))
                        .session(otherSession)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        mvc.perform(delete("/camel/deleteById")
                        .param("id", Long.toString(id))
                        .session(ownerSession)
                        .with(csrf()))
                .andExpect(status().isOk());

        assertThat(
                camelRepository.findById(id).orElseThrow().getIsActive()
        ).isFalse();
    }

    @Test
    void partialOwnerCannotEditOrDeleteCamel() throws Exception {
        var owner = register("full-owner@example.com");
        var partialOwner = register("partial-owner@example.com");

        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(partialOwner.userId(), Set.of("OWNER"));

        var ownerSession = login(owner.email());
        var partialOwnerSession = login(partialOwner.email());

        Map<String, Object> request = new HashMap<>(Map.of(
                "name", "Shared Camel",
                "gender", "MALE",
                "birthDate", "2020-01-01T00:00:00Z",
                "breed", "Omani",
                "status", "ACTIVE"
        ));

        var created = mvc.perform(post("/camel/add")
                        .session(ownerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(request)))
                .andExpect(status().isOk())
                .andReturn();

        long camelId = json.readTree(
                created.getResponse().getContentAsString()
        ).asLong();

        // Change the original owner from 100% to 50%.
        jdbc.update(
                "UPDATE ownership_record SET share_percent = 50 WHERE camel_id = ? AND owner_id = ?",
                camelId,
                owner.userId()
        );

        // Give the second user the other 50%.
        jdbc.update(
                """
                INSERT INTO ownership_record
                (share_percent, start_at, camel_id, owner_id, is_active, created_date)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                50.0,
                java.sql.Timestamp.from(NOW.minusSeconds(60)),
                camelId,
                partialOwner.userId(),
                true,
                java.sql.Timestamp.from(NOW.minusSeconds(60))
        );

        request.put("camelId", camelId);
        request.put("name", "Unauthorized Change");

        // 50% owner must NOT be able to update the whole camel.
        mvc.perform(put("/camel/update")
                        .session(partialOwnerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(request)))
                .andExpect(status().isForbidden());

        // 50% owner must NOT be able to delete the whole camel.
        mvc.perform(delete("/camel/deleteById")
                        .param("id", Long.toString(camelId))
                        .session(partialOwnerSession)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // Original owner is also only 50% now, so they must also be blocked.
        mvc.perform(delete("/camel/deleteById")
                        .param("id", Long.toString(camelId))
                        .session(ownerSession)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // Failed operations must not modify/delete the camel.
        var camel = camelRepository.findById(camelId).orElseThrow();

        assertThat(camel.getIsActive()).isTrue();
        assertThat(camel.getName()).isEqualTo("Shared Camel");
    }
}