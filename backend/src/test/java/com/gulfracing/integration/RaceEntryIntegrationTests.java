package com.gulfracing.integration;

import com.gulfracing.entity.Race;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RaceEntryIntegrationTests extends IntegrationSupport {

    @Autowired
    RaceRepository raceRepository;

    @Test
    void raceEntryFollowsRegistrationAndOrganizerAuthorization() throws Exception {

        var owner = register("owner-entry@example.com");
        var organizer = register("organizer-entry@example.com");
        var otherOrganizer = register("other-organizer-entry@example.com");

        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(organizer.userId(), Set.of("ORGANIZER"));
        users.updateRoles(otherOrganizer.userId(), Set.of("ORGANIZER"));

        var ownerSession = login(owner.email());
        var organizerSession = login(organizer.email());
        var otherOrganizerSession = login(otherOrganizer.email());

        Map<String, Object> camelRequest = new HashMap<>();
        camelRequest.put("name", "Entry Camel");
        camelRequest.put("gender", "MALE");
        camelRequest.put("birthDate", "2020-01-01T00:00:00Z");
        camelRequest.put("breed", "Omani");
        camelRequest.put("status", "ACTIVE");

        var camelResponse = mvc.perform(
                        post("/camel/add")
                                .session(ownerSession)
                                .with(csrf())
                                .contentType("application/json")
                                .content(payload(camelRequest))
                )
                .andExpect(status().isOk())
                .andReturn();

        Long camelId = json.readTree(
                camelResponse.getResponse().getContentAsString()
        ).asLong();

        var race = new Race();
        race.setName("Race Entry Test");
        race.setStartsAt(NOW.plusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(5.0);
        race.setStatus(RaceStatus.OPEN);
        race.setOrganizer(
                userRepository.findById(
                        organizer.userId()
                ).orElseThrow()
        );

        race = raceRepository.saveAndFlush(race);

        Long raceId = race.getRaceId();

        Map<String, Object> entryRequest = new HashMap<>();
        entryRequest.put("registeredAt", NOW.toString());
        entryRequest.put("participantNumber", 1);
        entryRequest.put("raceId", raceId);
        entryRequest.put("camelId", camelId);

        var entryResponse = mvc.perform(
                        post("/api/race-entries")
                                .session(ownerSession)
                                .with(csrf())
                                .contentType("application/json")
                                .content(payload(entryRequest))
                )
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.registrantId").value(owner.userId()))
                .andExpect(jsonPath("$.entryStatus").value("PENDING"))
                .andReturn();

        Long entryId = json.readTree(
                entryResponse.getResponse().getContentAsString()
        ).get("entryId").asLong();

        mvc.perform(
                        post("/api/race-entries")
                                .session(ownerSession)
                                .with(csrf())
                                .contentType("application/json")
                                .content(payload(entryRequest))
                )
                .andExpect(status().isConflict());

        Map<String, Object> updateRequest = new HashMap<>();
        updateRequest.put("registeredAt", NOW.toString());
        updateRequest.put("participantNumber", 1);
        updateRequest.put("raceId", raceId);
        updateRequest.put("camelId", camelId);
        updateRequest.put("entryStatus", "ACCEPTED");

        mvc.perform(
                        put("/api/race-entries/" + entryId)
                                .session(otherOrganizerSession)
                                .with(csrf())
                                .contentType("application/json")
                                .content(payload(updateRequest))
                )
                .andExpect(status().isForbidden());

        mvc.perform(
                        put("/api/race-entries/" + entryId)
                                .session(organizerSession)
                                .with(csrf())
                                .contentType("application/json")
                                .content(payload(updateRequest))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.entryStatus").value("ACCEPTED"))
                .andExpect(jsonPath("$.registrantId").value(owner.userId()))
                .andExpect(jsonPath("$.camelId").value(camelId))
                .andExpect(jsonPath("$.raceId").value(raceId));
    }
}