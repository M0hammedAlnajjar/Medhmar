package com.gulfracing.integration;

import com.gulfracing.entity.Race;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.util.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RaceAuthorizationIntegrationTests extends IntegrationSupport {
    @Autowired RaceRepository races;
    @Test
    void raceWritesRequireOrganizerRoleAndExistingRaceOwnership() throws Exception {
        var viewer = register("viewer@example.com");
        var owner = register("owner@example.com");
        var other = register("other@example.com");
        users.updateRoles(owner.userId(),Set.of("ORGANIZER"));
        users.updateRoles(other.userId(),Set.of("ORGANIZER"));
        var race = new Race();
        race.setName("Race"); race.setStartsAt(NOW.plusSeconds(3600)); race.setLocation("Muscat");
        race.setDistanceKm(5.0); race.setStatus(RaceStatus.SCHEDULED);
        race.setOrganizer(userRepository.findById(owner.userId()).orElseThrow());
        long id = races.saveAndFlush(race).getRaceId();
        mvc.perform(get("/api/races/"+id)).andExpect(status().isOk());
        mvc.perform(delete("/api/races/"+id).session(login(viewer.email())).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(delete("/api/races/"+id).session(login(other.email())).with(csrf())).andExpect(status().isForbidden());
        mvc.perform(post("/api/races").session(login(other.email())).with(csrf()).contentType("application/json")
            .content(payload(Map.of("name","Spoofed","startsAt",NOW.plusSeconds(3600).toString(),"location","Muscat",
                "distanceKm",5,"status","SCHEDULED","organizerId",owner.userId())))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/races/"+id).session(login(owner.email())).with(csrf())).andExpect(status().isNoContent());
    }
}
