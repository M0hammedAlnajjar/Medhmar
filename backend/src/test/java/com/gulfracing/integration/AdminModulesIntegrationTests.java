package com.gulfracing.integration;

import com.gulfracing.dto.ChallengeDtos.ChallengeRequest;
import com.gulfracing.dto.OrganizationDtos.Create;
import com.gulfracing.service.ChallengeService;
import com.gulfracing.service.OrganizationService;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminModulesIntegrationTests extends IntegrationSupport {
    @Autowired ChallengeService challengeService;
    @Autowired OrganizationService organizationService;

    @Test
    void administratorsSeeDraftChallengesWithPaginationWhilePublicCannot() throws Exception {
        var author = register("admin-challenge-owner@example.com");
        var created = challengeService.create(author.userId(), new ChallengeRequest(
            "Unpublished draft", NOW.plusSeconds(60), NOW.plusSeconds(3600)));
        var adminSession = admin();
        mvc.perform(get("/api/admin/challenges").session(adminSession)
                .param("page", "0").param("size", "1"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(1))
            .andExpect(jsonPath("$.content[0].challengeId").value(created.challengeId()))
            .andExpect(jsonPath("$.content[0].status").value("DRAFT"));
        mvc.perform(get("/api/challenges"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/api/admin/challenges").session(adminSession).param("size", "101"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void organizationsArePagedAndBothAdminEndpointsAreProtected() throws Exception {
        var adminSession = admin();
        var adminUser = userRepository.findByEmail("admin@example.com").orElseThrow();
        organizationService.create(new Create("Race Club", "Muscat", "Regional organizer",
            "club@example.com"), adminUser.getUserId());
        mvc.perform(get("/api/admin/organizations").session(adminSession))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(1))
            .andExpect(jsonPath("$.content[0].name").value("Race Club"))
            .andExpect(jsonPath("$.content[0].status").value("ACTIVE"));

        var viewer = register("admin-module-viewer@example.com");
        var viewerSession = login(viewer.email());
        for (String path : new String[]{"/api/admin/challenges", "/api/admin/organizations"}) {
            mvc.perform(get(path)).andExpect(status().isUnauthorized());
            mvc.perform(get(path).session(viewerSession)).andExpect(status().isForbidden());
        }
    }
    @Test
    void adminCanSaveAndClearStreamLinkButViewerCannot() throws Exception {
        var creator = register("stream-owner@example.com");
        var challenge = challengeService.create(creator.userId(), new ChallengeRequest(
            "Broadcast challenge", NOW.plusSeconds(60), NOW.plusSeconds(3600)));
        var first = camel("Al Barq");
        var second = camel("Shaheen");
        challengeService.addCamel(challenge.challengeId(), first.getCamelId(), creator.userId());
        challengeService.addCamel(challenge.challengeId(), second.getCamelId(), creator.userId());
        challengeService.open(challenge.challengeId(), creator.userId());

        String endpoint = "/api/admin/challenges/" + challenge.challengeId() + "/stream";
        String link = "https://www.youtube.com/live/dQw4w9WgXcQ";
        String jsonBody = payload(Map.of("url", link));
        mvc.perform(put(endpoint).with(csrf()).contentType("application/json")
                .content(jsonBody))
            .andExpect(status().isUnauthorized());
        mvc.perform(put(endpoint).with(csrf()).session(login(creator.email()))
                .contentType("application/json").content(jsonBody))
            .andExpect(status().isForbidden());

        var adminSession = admin();
        mvc.perform(put(endpoint).with(csrf()).session(adminSession)
                .contentType("application/json").content(jsonBody))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.streamUrl").value(link));
        mvc.perform(get("/api/challenges/" + challenge.challengeId()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.streamUrl").value(link));

        mvc.perform(put(endpoint).with(csrf()).session(adminSession)
                .contentType("application/json").content(payload(Map.of(
                    "url", "https://evil.example/watch?v=dQw4w9WgXcQ"))))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/challenges/" + challenge.challengeId()))
            .andExpect(jsonPath("$.streamUrl").value(link));

        mvc.perform(put(endpoint).with(csrf()).session(adminSession)
                .contentType("application/json").content(payload(Map.of("url", ""))))
            .andExpect(status().isOk());
        assertNull(challengeService.get(challenge.challengeId(), null).streamUrl());
    }
}
