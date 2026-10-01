package com.gulfracing.integration;

import org.junit.jupiter.api.Test;
import java.util.Map;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TourismIntegrationTests extends IntegrationSupport {
    @Test
    void organizationPublishesTourismEventTracksVisitsAndApprovesContent() throws Exception {
        var organizer = register("tourism-organizer@example.com");
        var outsider = register("tourism-outsider@example.com");
        users.updateRoles(organizer.userId(), Set.of("ORGANIZER"));
        users.updateRoles(outsider.userId(), Set.of("ORGANIZER"));
        var session = login(organizer.email());

        String orgJson = mvc.perform(post("/api/organizations").session(session).with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "name", "Muscat Racing Club",
                                "region", "Muscat",
                                "description", "Tourism organizer",
                                "contactEmail", "club@example.com"
                        ))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long orgId = json.readTree(orgJson).get("organizationId").asLong();

        var eventBody = Map.of(
                "organizationId", orgId,
                "name", "Camel Racing Heritage Day",
                "type", "CULTURAL_EVENT",
                "location", "Muscat",
                "startAt", NOW.plusSeconds(3600).toString(),
                "endAt", NOW.plusSeconds(7200).toString(),
                "description", "Visitor-friendly camel racing event"
        );
        String eventJson = mvc.perform(post("/api/tourism/events").session(session).with(csrf())
                        .contentType("application/json").content(payload(eventBody)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long eventId = json.readTree(eventJson).get("eventId").asLong();

        mvc.perform(get("/api/tourism/events/" + eventId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.organizationId").value(orgId));

        mvc.perform(post("/api/tourism/events/" + eventId + "/visits").with(csrf())
                        .header("User-Agent", "Medhmar-Test")
                        .header("Referer", "https://example.test/"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.eventId").value(eventId));

        mvc.perform(get("/api/tourism/events/" + eventId + "/visits").session(login(outsider.email())))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/tourism/events/" + eventId + "/visits").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));

        var contentBody = Map.of(
                "organizationId", orgId,
                "title", "Camel Racing Traditions",
                "type", "ARTICLE",
                "contentUrl", "https://example.test/culture/camel-racing",
                "category", "HERITAGE"
        );
        String contentJson = mvc.perform(post("/api/tourism/content").session(session).with(csrf())
                        .contentType("application/json").content(payload(contentBody)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.approvedStatus").value("PENDING"))
                .andReturn().getResponse().getContentAsString();
        Long contentId = json.readTree(contentJson).get("contentId").asLong();

        mvc.perform(get("/api/tourism/content"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        mvc.perform(post("/api/tourism/content/" + contentId + "/approve").session(session).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.approvedStatus").value("APPROVED"));
        mvc.perform(get("/api/tourism/content"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1));
    }
}
