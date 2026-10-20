package com.gulfracing.integration;

import com.gulfracing.dto.ChallengeDtos.ChallengeRequest;
import com.gulfracing.dto.OrganizationDtos.Create;
import com.gulfracing.service.ChallengeService;
import com.gulfracing.service.OrganizationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
}
