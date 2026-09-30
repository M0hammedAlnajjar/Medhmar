package com.gulfracing.integration;

import com.gulfracing.entity.Race;
import com.gulfracing.entity.RaceEntry;
import com.gulfracing.enums.RaceEntryStatus;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.repository.RaceEntryRepository;
import com.gulfracing.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RaceResultIntegrationTests extends IntegrationSupport {

    @Autowired
    RaceRepository raceRepository;

    @Autowired
    RaceEntryRepository raceEntryRepository;

    @Test
    void raceResultCanBeManagedByRaceOrganizer() throws Exception {

        var organizer = register("organizer@example.com");
        users.updateRoles(organizer.userId(), Set.of("ORGANIZER"));

        var camel = camel("Test Camel");

        var race = new Race();
        race.setName("Test Race");
        race.setStartsAt(NOW.plusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(5.0);
        race.setStatus(RaceStatus.SCHEDULED);
        race.setOrganizer(
                userRepository.findById(
                        organizer.userId()
                ).orElseThrow()
        );

        race = raceRepository.saveAndFlush(race);

        var raceEntry = new RaceEntry();
        raceEntry.setRegisteredAt(NOW);
        raceEntry.setParticipantNumber(1);
        raceEntry.setEntryStatus(
                RaceEntryStatus.ACCEPTED
        );
        raceEntry.setRace(race);
        raceEntry.setRegistrant(
                userRepository.findById(
                        organizer.userId()
                ).orElseThrow()
        );
        raceEntry.setCamel(camel);

        raceEntry = raceEntryRepository.saveAndFlush(
                raceEntry
        );

        Long entryId = raceEntry.getEntryId();

        mvc.perform(
                        post("/api/race-results")
                                .session(login(organizer.email()))
                                .with(csrf())
                                .contentType("application/json")
                                .content(
                                        payload(
                                                Map.of(
                                                        "entryId", entryId,
                                                        "finishPosition", 1,
                                                        "elapsedMs", 320000
                                                )
                                        )
                                )
                )
                .andExpect(status().isCreated());

        mvc.perform(
                        get("/api/race-results/" + entryId)
                )
                .andExpect(status().isOk())
                .andExpect(
                        jsonPath("$.entryId")
                                .value(entryId)
                )
                .andExpect(
                        jsonPath("$.finishPosition")
                                .value(1)
                )
                .andExpect(
                        jsonPath("$.elapsedMs")
                                .value(320000)
                );

        mvc.perform(
                        put("/api/race-results/" + entryId)
                                .session(login(organizer.email()))
                                .with(csrf())
                                .contentType("application/json")
                                .content(
                                        payload(
                                                Map.of(
                                                        "entryId", entryId,
                                                        "finishPosition", 2,
                                                        "elapsedMs", 330000
                                                )
                                        )
                                )
                )
                .andExpect(status().isOk());

        mvc.perform(
                        delete("/api/race-results/" + entryId)
                                .session(login(organizer.email()))
                                .with(csrf())
                )
                .andExpect(status().isNoContent());
    }
}