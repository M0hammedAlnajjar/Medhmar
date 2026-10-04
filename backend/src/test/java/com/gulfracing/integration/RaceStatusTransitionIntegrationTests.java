package com.gulfracing.integration;

import com.gulfracing.entity.Race;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Map;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RaceStatusTransitionIntegrationTests extends IntegrationSupport {

    @Autowired
    RaceRepository races;

    @Test
    void shouldAllowValidRaceStatusTransition() throws Exception {

        var organizer = register("organizer@example.com");

        users.updateRoles(
                organizer.userId(),
                Set.of("ORGANIZER")
        );

        var organizerEntity =
                userRepository.findById(
                        organizer.userId()
                ).orElseThrow();

        Race race = new Race();
        race.setName("Muscat Race");
        race.setStartsAt(NOW.plusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(5.0);
        race.setStatus(RaceStatus.SCHEDULED);
        race.setOrganizer(organizerEntity);

        Long raceId =
                races.saveAndFlush(race).getRaceId();

        mvc.perform(
                        put("/api/races/" + raceId)
                                .session(login(organizer.email()))
                                .with(csrf())
                                .contentType("application/json")
                                .content(
                                        payload(
                                                Map.of(
                                                        "name", "Muscat Race",
                                                        "startsAt", NOW.plusSeconds(3600).toString(),
                                                        "location", "Muscat",
                                                        "distanceKm", 5.0,
                                                        "status", "OPEN",
                                                        "organizerId", organizer.userId()
                                                )
                                        )
                                )
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OPEN"));
    }

    @Test
    void shouldRejectInvalidRaceStatusTransition() throws Exception {

        var organizer = register("organizer@example.com");

        users.updateRoles(
                organizer.userId(),
                Set.of("ORGANIZER")
        );

        var organizerEntity =
                userRepository.findById(
                        organizer.userId()
                ).orElseThrow();

        Race race = new Race();
        race.setName("Muscat Race");
        race.setStartsAt(NOW.plusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(5.0);
        race.setStatus(RaceStatus.OPEN);
        race.setOrganizer(organizerEntity);

        Long raceId =
                races.saveAndFlush(race).getRaceId();

        mvc.perform(
                        put("/api/races/" + raceId)
                                .session(login(organizer.email()))
                                .with(csrf())
                                .contentType("application/json")
                                .content(
                                        payload(
                                                Map.of(
                                                        "name", "Muscat Race",
                                                        "startsAt", NOW.plusSeconds(3600).toString(),
                                                        "location", "Muscat",
                                                        "distanceKm", 5.0,
                                                        "status", "SCHEDULED",
                                                        "organizerId", organizer.userId()
                                                )
                                        )
                                )
                )
                .andExpect(status().isConflict());
    }

    @Test
    void shouldRejectChangingCompletedRaceStatus() throws Exception {

        var organizer = register("organizer@example.com");

        users.updateRoles(
                organizer.userId(),
                Set.of("ORGANIZER")
        );

        var organizerEntity =
                userRepository.findById(
                        organizer.userId()
                ).orElseThrow();

        Race race = new Race();
        race.setName("Completed Race");
        race.setStartsAt(NOW.minusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(5.0);
        race.setStatus(RaceStatus.COMPLETED);
        race.setOrganizer(organizerEntity);

        Long raceId =
                races.saveAndFlush(race).getRaceId();

        mvc.perform(
                        put("/api/races/" + raceId)
                                .session(login(organizer.email()))
                                .with(csrf())
                                .contentType("application/json")
                                .content(
                                        payload(
                                                Map.of(
                                                        "name", "Completed Race",
                                                        "startsAt", NOW.minusSeconds(3600).toString(),
                                                        "location", "Muscat",
                                                        "distanceKm", 5.0,
                                                        "status", "OPEN",
                                                        "organizerId", organizer.userId()
                                                )
                                        )
                                )
                )
                .andExpect(status().isConflict());
    }
}