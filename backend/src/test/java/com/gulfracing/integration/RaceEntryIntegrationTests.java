package com.gulfracing.integration;

import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.entity.Race;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Date;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RaceEntryIntegrationTests extends IntegrationSupport {
    @Autowired RaceRepository races;
    @Autowired OwnershipRecordRepository ownerships;

    private Race race(Long organizerId, RaceStatus status) {
        var race = new Race();
        race.setName("Qualification Race");
        race.setStartsAt(NOW.plusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(5.0);
        race.setStatus(status);
        race.setOrganizer(userRepository.findById(organizerId).orElseThrow());
        return races.saveAndFlush(race);
    }

    private Long ownedCamel(Long ownerId) {
        var camel = camel("Participant Camel");
        camel.setStatus(CamelStatus.ACTIVE);
        camel.setIsActive(true);
        camelRepository.saveAndFlush(camel);

        var ownership = new OwnershipRecord();
        ownership.setCamel(camel);
        ownership.setOwner(userRepository.findById(ownerId).orElseThrow());
        ownership.setSharePercent(100.0);
        ownership.setStartAt(Date.from(NOW.minusSeconds(60)));
        ownership.setIsActive(true);
        ownership.setCreatedDate(Date.from(NOW.minusSeconds(60)));
        ownerships.saveAndFlush(ownership);
        return camel.getCamelId();
    }

    @Test
    void ownerRegistrationAssignsTrustedFieldsAndOrganizerDecides() throws Exception {
        var owner = register("race-entry-owner@example.com");
        var other = register("race-entry-other@example.com");
        var organizer = register("race-entry-organizer@example.com");
        var unrelatedOrganizer = register("race-entry-unrelated@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(other.userId(), Set.of("OWNER"));
        users.updateRoles(organizer.userId(), Set.of("ORGANIZER"));
        users.updateRoles(unrelatedOrganizer.userId(), Set.of("ORGANIZER"));
        var ownerSession = login(owner.email());
        var otherSession = login(other.email());
        var organizerSession = login(organizer.email());
        var unrelatedSession = login(unrelatedOrganizer.email());
        var race = race(organizer.userId(), RaceStatus.OPEN);
        Long firstCamel = ownedCamel(owner.userId());
        Long secondCamel = ownedCamel(other.userId());

        var body = payload(Map.of("raceId", race.getRaceId(), "camelId", firstCamel));
        mvc.perform(post("/api/race-entries").with(csrf()).contentType("application/json")
                .content(body)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/race-entries").session(ownerSession).with(csrf()).contentType("application/json")
                .content(payload(Map.of("raceId", race.getRaceId(), "camelId", firstCamel,
                        "registrantId", other.userId())))).andExpect(status().isForbidden());
        mvc.perform(post("/api/race-entries").session(otherSession).with(csrf()).contentType("application/json")
                .content(body)).andExpect(status().isForbidden());

        var response = mvc.perform(post("/api/race-entries").session(ownerSession).with(csrf())
                .contentType("application/json").content(body))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.entryStatus").value("PENDING"))
                .andExpect(jsonPath("$.registrantId").value(owner.userId()))
                .andExpect(jsonPath("$.participantNumber").value(1))
                .andReturn().getResponse().getContentAsString();
        Long id = json.readTree(response).get("entryId").asLong();
        assertThat(json.readTree(response).get("registeredAt").asText()).isEqualTo(NOW.toString());

        mvc.perform(post("/api/race-entries").session(ownerSession).with(csrf()).contentType("application/json")
                .content(body)).andExpect(status().isConflict());
        mvc.perform(post("/api/race-entries").session(otherSession).with(csrf()).contentType("application/json")
                .content(payload(Map.of("raceId", race.getRaceId(), "camelId", secondCamel))))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.participantNumber").value(2));
        mvc.perform(get("/api/race-entries").session(ownerSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/race-entries/mine").session(ownerSession)).andExpect(status().isOk())
                .andExpect(jsonPath("$[0].entryId").value(id));
        mvc.perform(get("/api/race-entries/" + id).session(otherSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/race-entries/race/" + race.getRaceId()).session(ownerSession))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/race-entries/race/" + race.getRaceId()).session(organizerSession))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(2));

        var decision = payload(Map.of("entryStatus", "ACCEPTED"));
        mvc.perform(put("/api/race-entries/" + id).session(ownerSession).with(csrf())
                .contentType("application/json").content(decision)).andExpect(status().isForbidden());
        mvc.perform(put("/api/race-entries/" + id).session(unrelatedSession).with(csrf())
                .contentType("application/json").content(decision)).andExpect(status().isForbidden());
        mvc.perform(put("/api/race-entries/" + id).session(organizerSession).with(csrf())
                .contentType("application/json").content(payload(Map.of("entryStatus", "PENDING")))
                .andExpect(status().isBadRequest());
        mvc.perform(put("/api/race-entries/" + id).session(organizerSession).with(csrf())
                .contentType("application/json").content(decision))
                .andExpect(status().isOk()).andExpect(jsonPath("$.entryStatus").value("ACCEPTED"));
        mvc.perform(put("/api/race-entries/" + id).session(organizerSession).with(csrf())
                .contentType("application/json").content(decision)).andExpect(status().isConflict());
        mvc.perform(delete("/api/race-entries/" + id).session(ownerSession).with(csrf()))
                .andExpect(status().isConflict());
    }

    @Test
    void pendingEntryCanBeWithdrawnWithoutDeletingHistory() throws Exception {
        var owner = register("withdraw-owner@example.com");
        var organizer = register("withdraw-organizer@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(organizer.userId(), Set.of("ORGANIZER"));
        var race = race(organizer.userId(), RaceStatus.OPEN);
        Long camelId = ownedCamel(owner.userId());
        var session = login(owner.email());

        String result = mvc.perform(post("/api/race-entries").session(session).with(csrf())
                .contentType("application/json")
                .content(payload(Map.of("raceId", race.getRaceId(), "camelId", camelId))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long id = json.readTree(result).get("entryId").asLong();
        mvc.perform(delete("/api/race-entries/" + id).session(session).with(csrf()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/race-entries/" + id).session(session))
                .andExpect(status().isOk()).andExpect(jsonPath("$.entryStatus").value("WITHDRAWN"));
        mvc.perform(post("/api/race-entries").session(session).with(csrf()).contentType("application/json")
                .content(payload(Map.of("raceId", race.getRaceId(), "camelId", camelId))))
                .andExpect(status().isConflict());
    }

    @Test
    void viewerClosedRaceAndPastStartCannotCreateRegistrations() throws Exception {
        var viewer = register("registration-viewer@example.com");
        var owner = register("registration-owner@example.com");
        var organizer = register("registration-organizer@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(organizer.userId(), Set.of("ORGANIZER"));
        Long camelId = ownedCamel(owner.userId());
        var openRace = race(organizer.userId(), RaceStatus.OPEN);
        var body = payload(Map.of("raceId", openRace.getRaceId(), "camelId", camelId));

        mvc.perform(post("/api/race-entries").session(login(viewer.email())).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().isForbidden());

        openRace.setStatus(RaceStatus.CLOSED);
        races.saveAndFlush(openRace);
        mvc.perform(post("/api/race-entries").session(login(owner.email())).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().isConflict());

        openRace.setStatus(RaceStatus.OPEN);
        openRace.setStartsAt(NOW.minusSeconds(1));
        races.saveAndFlush(openRace);
        mvc.perform(post("/api/race-entries").session(login(owner.email())).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().isConflict());
    }
}
