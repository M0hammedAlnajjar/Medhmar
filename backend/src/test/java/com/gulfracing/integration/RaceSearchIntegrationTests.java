package com.gulfracing.integration;

import com.gulfracing.entity.Race;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.repository.RaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class RaceSearchIntegrationTests extends IntegrationSupport {

    @Autowired
    RaceRepository races;

    @Test
    void shouldSearchFilterAndPaginateRaces() throws Exception {

        var organizer = register("organizer@example.com");

        var organizerEntity =
                userRepository.findById(
                        organizer.userId()
                ).orElseThrow();

        Race first = new Race();
        first.setName("Muscat Race");
        first.setStartsAt(NOW.plusSeconds(3600));
        first.setLocation("Muscat");
        first.setDistanceKm(5.0);
        first.setStatus(RaceStatus.OPEN);
        first.setOrganizer(organizerEntity);

        Race second = new Race();
        second.setName("Salalah Race");
        second.setStartsAt(NOW.plusSeconds(7200));
        second.setLocation("Salalah");
        second.setDistanceKm(6.0);
        second.setStatus(RaceStatus.SCHEDULED);
        second.setOrganizer(organizerEntity);

        Race third = new Race();
        third.setName("Muscat Cup");
        third.setStartsAt(NOW.plusSeconds(10800));
        third.setLocation("Muscat");
        third.setDistanceKm(7.0);
        third.setStatus(RaceStatus.OPEN);
        third.setOrganizer(organizerEntity);

        races.saveAndFlush(first);
        races.saveAndFlush(second);
        races.saveAndFlush(third);

        mvc.perform(
                        get("/api/races")
                                .param("search", "Muscat")
                                .param("status", "OPEN")
                                .param("page", "0")
                                .param("size", "1")
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.number").value(0));
    }

    @Test
    void shouldRejectInvalidPaginationValues() throws Exception {

        mvc.perform(
                        get("/api/races")
                                .param("page", "-1")
                                .param("size", "10")
                )
                .andExpect(status().isBadRequest());

        mvc.perform(
                        get("/api/races")
                                .param("page", "0")
                                .param("size", "0")
                )
                .andExpect(status().isBadRequest());

        mvc.perform(
                        get("/api/races")
                                .param("page", "0")
                                .param("size", "101")
                )
                .andExpect(status().isBadRequest());
    }
}