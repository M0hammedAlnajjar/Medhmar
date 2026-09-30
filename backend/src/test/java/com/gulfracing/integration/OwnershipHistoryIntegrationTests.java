package com.gulfracing.integration;

import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.repository.OwnershipRecordRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Date;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OwnershipHistoryIntegrationTests extends IntegrationSupport {
    @Autowired OwnershipRecordRepository ownerships;

    private com.gulfracing.entity.Camel activeCamel(String name) {
        var camel = camel(name);
        camel.setIsActive(true);
        return camelRepository.saveAndFlush(camel);
    }

    private OwnershipRecord record(Long camelId, Long ownerId, double share, Date start, Date end, boolean active) {
        var r = new OwnershipRecord();
        r.setCamel(camelRepository.getReferenceById(camelId));
        r.setOwner(userRepository.getReferenceById(ownerId));
        r.setSharePercent(share);
        r.setStartAt(start);
        r.setEndAt(end);
        r.setIsActive(active);
        return ownerships.saveAndFlush(r);
    }

    @Test
    void publicHistoryListsPastAndCurrentOwnersOldestFirstWithoutContactDetails() throws Exception {
        var first = register("first-owner@example.com");
        var second = register("second-owner@example.com");
        Date t0 = Date.from(NOW.minusSeconds(7200)), t1 = Date.from(NOW.minusSeconds(3600));
        long camelId = activeCamel("History Camel").getCamelId();
        // Saved newest-first to prove ordering comes from the query, not insertion order.
        record(camelId, second.userId(), 100.0, t1, null, true);
        record(camelId, first.userId(), 100.0, t0, t1, false);

        var body = mvc.perform(get("/camel/ownership-history").param("id", Long.toString(camelId)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var node = json.readTree(body);
        assertThat(node).hasSize(2);
        assertThat(node.get(0).get("ownerName").asText()).isEqualTo("Test User");
        assertThat(node.get(0).get("current").asBoolean()).isFalse();
        assertThat(node.get(0).get("endAt").isNull()).isFalse();
        assertThat(node.get(1).get("current").asBoolean()).isTrue();
        assertThat(node.get(1).get("endAt").isNull()).isTrue();
        assertThat(node.get(0).get("startAt").asText()).isNotEqualTo(node.get(1).get("startAt").asText());
        assertThat(body).doesNotContain("first-owner@example.com").doesNotContain("second-owner@example.com")
            .doesNotContain("email").doesNotContain("phone");
    }

    @Test
    void endedOrInactiveRecordsAreNotMarkedCurrent() throws Exception {
        var owner = register("expired-owner@example.com");
        long camelId = activeCamel("Expired Camel").getCamelId();
        record(camelId, owner.userId(), 50.0, Date.from(NOW.minusSeconds(7200)), Date.from(NOW.minusSeconds(60)), true);
        record(camelId, owner.userId(), 50.0, Date.from(NOW.minusSeconds(3600)), null, false);

        var node = json.readTree(mvc.perform(get("/camel/ownership-history").param("id", Long.toString(camelId)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(node).hasSize(2);
        assertThat(node.get(0).get("current").asBoolean()).isFalse();
        assertThat(node.get(1).get("current").asBoolean()).isFalse();
    }

    @Test
    void camelWithoutRecordsReturnsEmptyListAndOtherCamelsAreNotMixedIn() throws Exception {
        var owner = register("other-owner@example.com");
        long withRecords = activeCamel("Has Records").getCamelId();
        long empty = activeCamel("No Records").getCamelId();
        record(withRecords, owner.userId(), 100.0, Date.from(NOW.minusSeconds(60)), null, true);

        var node = json.readTree(mvc.perform(get("/camel/ownership-history").param("id", Long.toString(empty)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(node).isEmpty();
    }

    @Test
    void invalidMissingAndInactiveCamelsAreRejected() throws Exception {
        mvc.perform(get("/camel/ownership-history").param("id", "999999")).andExpect(status().isNotFound());
        mvc.perform(get("/camel/ownership-history").param("id", "0")).andExpect(status().isBadRequest());
        var inactive = camel("Retired Record");
        inactive.setIsActive(false);
        camelRepository.saveAndFlush(inactive);
        mvc.perform(get("/camel/ownership-history").param("id", Long.toString(inactive.getCamelId())))
            .andExpect(status().isNotFound());
    }

    @Test
    void adminOwnershipRoutesStayRestricted() throws Exception {
        mvc.perform(get("/ownershipRecord/getAll")).andExpect(status().isUnauthorized());
        var viewer = register("viewer-history@example.com");
        mvc.perform(get("/ownershipRecord/getAll").session(login(viewer.email()))).andExpect(status().isForbidden());
    }
}
