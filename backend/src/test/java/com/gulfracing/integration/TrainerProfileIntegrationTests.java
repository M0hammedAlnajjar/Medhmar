package com.gulfracing.integration;

import org.junit.jupiter.api.Test;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TrainerProfileIntegrationTests extends IntegrationSupport {

    @Test
    void trainerCanCreateReadUpdateAndDeleteOwnProfile() throws Exception {
        var trainer = register("trainer-profile@example.com");
        users.updateRoles(trainer.userId(), Set.of("TRAINER"));
        var session = login(trainer.email());

        var created = mvc.perform(post("/trainer-profile/add").session(session).with(csrf())
                .contentType("application/json")
                .content(payload(Map.of("userId", trainer.userId(), "bio", "Trainer bio", "location", "Muscat"))))
                .andExpect(status().isCreated()).andReturn();
        assertThat(created.getResponse().getContentAsString()).isEqualTo(trainer.userId().toString());

        var profile = mvc.perform(get("/trainer-profile/getById")
                .param("id", trainer.userId().toString()))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(profile).contains("Trainer bio").contains("Muscat");
        assertThat(json.readTree(profile).get("userId").asLong()).isEqualTo(trainer.userId());

        var all = mvc.perform(get("/trainer-profile/getAll")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json.readTree(all).size()).isEqualTo(1);

        mvc.perform(put("/trainer-profile/update").session(session).with(csrf())
                .contentType("application/json")
                .content(payload(Map.of("bio", "Updated trainer", "location", "Nizwa"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.location").value("Nizwa"));

        mvc.perform(post("/trainer-profile/add").session(session).with(csrf())
                .contentType("application/json").content(payload(Map.of("bio", "Duplicate"))))
                .andExpect(status().isConflict());

        mvc.perform(delete("/trainer-profile/deleteById").session(session).with(csrf())
                .param("id", trainer.userId().toString()))
                .andExpect(status().isOk());
        mvc.perform(get("/trainer-profile/getById").param("id", trainer.userId().toString()))
                .andExpect(status().isNotFound());
    }

    @Test
    void viewerAndUnauthenticatedUsersCannotCreateTrainerProfiles() throws Exception {
        var viewer = register("viewer-profile@example.com");
        var session = login(viewer.email());
        mvc.perform(post("/trainer-profile/add").with(csrf())
                .contentType("application/json").content(payload(Map.of("bio", "Invalid"))))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/trainer-profile/add").session(session).with(csrf())
                .contentType("application/json").content(payload(Map.of("bio", "Invalid"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void trainerCannotModifyAnotherUsersProfileOrSubmitOversizedFields() throws Exception {
        var first = register("trainer-first@example.com");
        users.updateRoles(first.userId(), Set.of("TRAINER"));
        var firstSession = login(first.email());
        var second = register("trainer-second@example.com");
        users.updateRoles(second.userId(), Set.of("TRAINER"));
        var secondSession = login(second.email());

        mvc.perform(post("/trainer-profile/add").session(secondSession).with(csrf())
                .contentType("application/json").content(payload(Map.of("bio", "Second user"))))
                .andExpect(status().isCreated());

        mvc.perform(post("/trainer-profile/add").session(firstSession).with(csrf())
                .contentType("application/json")
                .content(payload(Map.of("userId", second.userId(), "bio", "Spoof"))))
                .andExpect(status().isForbidden());

        mvc.perform(put("/trainer-profile/update").session(firstSession).with(csrf())
                .contentType("application/json")
                .content(payload(Map.of("userId", second.userId(), "bio", "Spoof"))))
                .andExpect(status().isForbidden());

        mvc.perform(delete("/trainer-profile/deleteById").session(firstSession).with(csrf())
                .param("id", second.userId().toString()))
                .andExpect(status().isForbidden());

        mvc.perform(post("/trainer-profile/add").session(firstSession).with(csrf())
                .contentType("application/json").content(payload(Map.of("location", "x".repeat(151)))))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/trainer-profile/getById").param("id", second.userId().toString()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.bio").value("Second user"));
    }
}
