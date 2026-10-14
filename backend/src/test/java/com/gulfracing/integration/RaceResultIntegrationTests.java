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
        users.updateRoles(
                organizer.userId(),
                Set.of("ORGANIZER")
        );

        var camel = camel("Test Camel");

        var race = new Race();
        race.setName("Test Race");
        race.setStartsAt(NOW.minusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(5.0);
        race.setStatus(RaceStatus.CLOSED);
        race.setOrganizer(
                userRepository.findById(
                        organizer.userId()
                ).orElseThrow()
        );

        race = raceRepository.saveAndFlush(race);

        var raceEntry = new RaceEntry();
        raceEntry.setRegisteredAt(
                NOW.minusSeconds(7200)
        );
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

    @Test
    void shouldRejectResultBeforeRaceStarts() throws Exception {

        var organizer = register("organizer@example.com");
        users.updateRoles(
                organizer.userId(),
                Set.of("ORGANIZER")
        );

        var camel = camel("Future Camel");

        var race = new Race();
        race.setName("Future Race");
        race.setStartsAt(NOW.plusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(5.0);
        race.setStatus(RaceStatus.CLOSED);
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

        mvc.perform(
                        post("/api/race-results")
                                .session(login(organizer.email()))
                                .with(csrf())
                                .contentType("application/json")
                                .content(
                                        payload(
                                                Map.of(
                                                        "entryId", raceEntry.getEntryId(),
                                                        "finishPosition", 1,
                                                        "elapsedMs", 320000
                                                )
                                        )
                                )
                )
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectResultWhenRaceIsNotClosedOrCompleted() throws Exception {

        var organizer = register("organizer@example.com");
        users.updateRoles(
                organizer.userId(),
                Set.of("ORGANIZER")
        );

        var camel = camel("Open Race Camel");

        var race = new Race();
        race.setName("Open Race");
        race.setStartsAt(NOW.minusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(5.0);
        race.setStatus(RaceStatus.OPEN);
        race.setOrganizer(
                userRepository.findById(
                        organizer.userId()
                ).orElseThrow()
        );

        race = raceRepository.saveAndFlush(race);

        var raceEntry = new RaceEntry();
        raceEntry.setRegisteredAt(
                NOW.minusSeconds(7200)
        );
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

        mvc.perform(
                        post("/api/race-results")
                                .session(login(organizer.email()))
                                .with(csrf())
                                .contentType("application/json")
                                .content(
                                        payload(
                                                Map.of(
                                                        "entryId", raceEntry.getEntryId(),
                                                        "finishPosition", 1,
                                                        "elapsedMs", 320000
                                                )
                                        )
                                )
                )
                .andExpect(status().isConflict());
    }

    @Autowired com.gulfracing.service.RaceResultService results;

    @Test
    void duplicatePositionIsRejectedWithinRaceButAllowedAcrossRaces() {
        var organizer = register("positions@example.com");
        var race = new Race();
        race.setName("Positions"); race.setLocation("Muscat"); race.setDistanceKm(5.0);
        race.setStartsAt(NOW.minusSeconds(60)); race.setStatus(RaceStatus.CLOSED);
        race.setOrganizer(userRepository.findById(organizer.userId()).orElseThrow());
        raceRepository.saveAndFlush(race);
        var first = positionEntry(race, organizer.userId(), 1);
        var second = positionEntry(race, organizer.userId(), 2);
        results.addRaceResult(resultFor(first, 1));
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> results.addRaceResult(resultFor(second, 1)))
                .isInstanceOf(com.gulfracing.exception.ApiException.class);
        results.addRaceResult(resultFor(second, 2));
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> results.updateRaceResult(second.getEntryId(), resultFor(second, 1)))
                .isInstanceOf(com.gulfracing.exception.ApiException.class);
        var other = new Race();
        other.setName("Other race"); other.setLocation("Muscat"); other.setDistanceKm(5.0);
        other.setStartsAt(NOW.minusSeconds(60)); other.setStatus(RaceStatus.CLOSED);
        other.setOrganizer(userRepository.findById(organizer.userId()).orElseThrow());
        raceRepository.saveAndFlush(other);
        results.addRaceResult(resultFor(positionEntry(other, organizer.userId(), 1), 1));
    }

    private RaceEntry positionEntry(Race race, Long organizerId, int number) {
        var entry = new RaceEntry(); entry.setRace(race); entry.setCamel(camel("Entry " + number));
        entry.setRegistrant(userRepository.findById(organizerId).orElseThrow());
        entry.setRegisteredAt(NOW.minusSeconds(120)); entry.setParticipantNumber(number);
        entry.setEntryStatus(RaceEntryStatus.ACCEPTED);
        return raceEntryRepository.saveAndFlush(entry);
    }
    private com.gulfracing.entity.RaceResult resultFor(RaceEntry entry, int position) {
        var result = new com.gulfracing.entity.RaceResult(); result.setRaceEntry(entry);
        result.setFinishPosition(position); result.setElapsedMs(100000L); return result;
    }
}
