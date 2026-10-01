package com.gulfracing.integration;

import com.gulfracing.entity.Race;
import com.gulfracing.entity.RaceEntry;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.RaceEntryStatus;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.repository.RaceEntryRepository;
import com.gulfracing.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RaceCardIntegrationTests extends IntegrationSupport {
    @Autowired RaceRepository races;
    @Autowired RaceEntryRepository entries;

    @Test
    void organizerPublishesVersionedRaceCardFromAcceptedEntries() throws Exception {
        var owner = register("card-owner@example.com");
        var organizer = register("card-organizer@example.com");
        var outsider = register("card-outsider@example.com");
        users.updateRoles(organizer.userId(), Set.of("ORGANIZER"));
        users.updateRoles(outsider.userId(), Set.of("ORGANIZER"));

        var race = new Race();
        race.setName("National Day Race");
        race.setStartsAt(NOW.plusSeconds(3600));
        race.setLocation("Muscat");
        race.setDistanceKm(6.0);
        race.setStatus(RaceStatus.OPEN);
        race.setOrganizer(userRepository.findById(organizer.userId()).orElseThrow());
        races.saveAndFlush(race);

        var camel = camel("Al Barq");
        camel.setStatus(CamelStatus.ACTIVE);
        camel.setIsActive(true);
        camelRepository.saveAndFlush(camel);

        var entry = new RaceEntry();
        entry.setRace(race);
        entry.setRegistrant(userRepository.findById(owner.userId()).orElseThrow());
        entry.setCamel(camel);
        entry.setRegisteredAt(NOW);
        entry.setParticipantNumber(7);
        entry.setEntryStatus(RaceEntryStatus.ACCEPTED);
        entries.saveAndFlush(entry);

        mvc.perform(post("/api/race-cards/races/" + race.getRaceId() + "/publish")
                        .session(login(outsider.email())).with(csrf()))
                .andExpect(status().isForbidden());

        var session = login(organizer.email());
        mvc.perform(post("/api/race-cards/races/" + race.getRaceId() + "/publish")
                        .session(session).with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.version").value(1))
                .andExpect(jsonPath("$.entries[0].trimNumber").value(7))
                .andExpect(jsonPath("$.entries[0].camelName").value("Al Barq"))
                .andExpect(jsonPath("$.entries[0].ownerName").value("Test User"));

        mvc.perform(post("/api/race-cards/races/" + race.getRaceId() + "/publish")
                        .session(session).with(csrf()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.version").value(2));

        mvc.perform(get("/api/race-cards/races/" + race.getRaceId() + "/latest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.version").value(2))
                .andExpect(jsonPath("$.entries.length()").value(1));
    }
}
