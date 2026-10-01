package com.gulfracing.integration;

import com.gulfracing.enums.OrganizationStatus;
import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class OrganizationIntegrationTests extends IntegrationSupport {
    @Test
    void organizerCreatesOrganizationManagesMembersAndScopesRace() throws Exception {
        var organizer = register("org-owner@example.com");
        var secondOrganizer = register("org-second@example.com");
        var outsider = register("org-outsider@example.com");
        users.updateRoles(organizer.userId(), Set.of("ORGANIZER"));
        users.updateRoles(secondOrganizer.userId(), Set.of("ORGANIZER"));
        users.updateRoles(outsider.userId(), Set.of("ORGANIZER"));

        var session = login(organizer.email());
        String created = mvc.perform(post("/api/organizations").session(session).with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "name", "Oman Camel Racing Federation",
                                "region", "Muscat",
                                "description", "Regional organizer",
                                "contactEmail", "racing@example.com"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value(OrganizationStatus.ACTIVE.name()))
                .andReturn().getResponse().getContentAsString();
        Long organizationId = json.readTree(created).get("organizationId").asLong();

        mvc.perform(get("/api/organizations/" + organizationId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Oman Camel Racing Federation"));
        mvc.perform(get("/api/organizations/" + organizationId + "/members"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].userId").value(organizer.userId()))
                .andExpect(jsonPath("$[0].roleName").value("ORGANIZER"));

        mvc.perform(post("/api/organizations/" + organizationId + "/members")
                        .session(session).with(csrf()).contentType("application/json")
                        .content(payload(Map.of("userId", secondOrganizer.userId(), "roleName", "ORGANIZER"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.userId").value(secondOrganizer.userId()));

        mvc.perform(post("/api/races").session(login(outsider.email())).with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "name", "Unauthorized Organization Race",
                                "startsAt", NOW.plusSeconds(3600).toString(),
                                "location", "Muscat",
                                "distanceKm", 5.0,
                                "status", "OPEN",
                                "organizerId", outsider.userId(),
                                "organizationId", organizationId
                        ))))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/races").session(session).with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "name", "Organization Race",
                                "startsAt", NOW.plusSeconds(3600).toString(),
                                "location", "Muscat",
                                "distanceKm", 5.0,
                                "status", "OPEN",
                                "organizerId", organizer.userId(),
                                "organizationId", organizationId
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.organizationId").value(organizationId));
    }
}
