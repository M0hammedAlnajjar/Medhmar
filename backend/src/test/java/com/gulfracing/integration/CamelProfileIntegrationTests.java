package com.gulfracing.integration;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.entity.Pedigree;
import com.gulfracing.enums.MarketPlaceStatus;
import com.gulfracing.repository.MarketPlaceRepository;
import com.gulfracing.repository.PedigreeRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CamelProfileIntegrationTests extends IntegrationSupport {
    @Autowired PedigreeRepository pedigrees;
    @Autowired MarketPlaceRepository marketPlaces;

    private long createCamel(org.springframework.mock.web.MockHttpSession session, Map<String, Object> extra) throws Exception {
        Map<String, Object> request = new HashMap<>(Map.of("name", "Profile Camel", "gender", "MALE",
            "birthDate", "2020-01-01T00:00:00Z", "breed", "Omani", "status", "ACTIVE"));
        request.putAll(extra);
        var created = mvc.perform(post("/camel/add").session(session)
            .with(csrf()).contentType("application/json").content(json.writeValueAsString(request)))
            .andExpect(status().isOk()).andReturn();
        return json.readTree(created.getResponse().getContentAsString()).asLong();
    }

    @Test
    void publicProfileShowsCoreDataPedigreeOwnerNameAndActiveListingWithoutContactDetails() throws Exception {
        var owner = register("profile-owner@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        var session = login(owner.email());
        long id = createCamel(session, Map.of("sire", "Thunder", "dam", "Dawn", "category", "RACING"));

        var pedigree = new Pedigree();
        pedigree.setCamel(camelRepository.getReferenceById(id));
        pedigree.setRecordedAt(new Date());
        pedigrees.saveAndFlush(pedigree);

        var listing = new MarketPlace();
        listing.setCamel(camelRepository.getReferenceById(id));
        listing.setUser(userRepository.getReferenceById(owner.userId()));
        listing.setAskingPriceOmr(1500.0);
        listing.setDescription("Fast racer");
        listing.setStatus(MarketPlaceStatus.AVAILABLE);
        listing.setIsActive(true);
        listing.setCreatedAt(new Date());
        marketPlaces.saveAndFlush(listing);

        // No session: profile reads are public.
        var body = mvc.perform(get("/camel/profile").param("id", Long.toString(id)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        var node = json.readTree(body);
        assertThat(node.get("name").asText()).isEqualTo("Profile Camel");
        assertThat(node.get("category").asText()).isEqualTo("RACING");
        assertThat(node.get("pedigree").get("sire").asText()).isEqualTo("Thunder");
        assertThat(node.get("pedigree").get("dam").asText()).isEqualTo("Dawn");
        assertThat(node.get("pedigree").get("pedigreeId").isNumber()).isTrue();
        assertThat(node.get("owners")).hasSize(1);
        assertThat(node.get("owners").get(0).get("name").asText()).isEqualTo("Test User");
        assertThat(node.get("owners").get(0).get("sharePercent").asDouble()).isEqualTo(100.0);
        assertThat(node.get("activeListing").get("askingPriceOmr").asDouble()).isEqualTo(1500.0);
        assertThat(body).doesNotContain("profile-owner@example.com").doesNotContain("email").doesNotContain("phone");
    }

    @Test
    void profileWithoutPedigreeRecordOrListingReturnsNullListing() throws Exception {
        var owner = register("plain-owner@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        long id = createCamel(login(owner.email()), Map.of());

        var node = json.readTree(mvc.perform(get("/camel/profile").param("id", Long.toString(id)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(node.get("activeListing").isNull()).isTrue();
        assertThat(node.get("pedigree").get("pedigreeId").isNull()).isTrue();
    }

    @Test
    void cancelledListingIsNotShownAndMissingOrInactiveCamelsReturnNotFound() throws Exception {
        var owner = register("cancel-owner@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        var session = login(owner.email());
        long id = createCamel(session, Map.of());

        var listing = new MarketPlace();
        listing.setCamel(camelRepository.getReferenceById(id));
        listing.setUser(userRepository.getReferenceById(owner.userId()));
        listing.setStatus(MarketPlaceStatus.CANCELLED);
        listing.setIsActive(true);
        marketPlaces.saveAndFlush(listing);

        var node = json.readTree(mvc.perform(get("/camel/profile").param("id", Long.toString(id)))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(node.get("activeListing").isNull()).isTrue();

        mvc.perform(get("/camel/profile").param("id", "999999")).andExpect(status().isNotFound());
        mvc.perform(delete("/camel/deleteById").param("id", Long.toString(id)).session(session).with(csrf()))
            .andExpect(status().isOk());
        mvc.perform(get("/camel/profile").param("id", Long.toString(id))).andExpect(status().isNotFound());
    }

    @Test
    void sireDamAndCategoryValidationAndOwnerOnlyUpdate() throws Exception {
        var owner = register("edit-owner@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        var session = login(owner.email());
        long id = createCamel(session, Map.of("sire", "A"));

        Map<String, Object> update = new HashMap<>(Map.of("camelId", id, "name", "Profile Camel", "gender", "MALE",
            "birthDate", "2020-01-01T00:00:00Z", "breed", "Omani", "status", "ACTIVE", "sire", "x".repeat(101)));
        mvc.perform(put("/camel/update").session(session).with(csrf()).contentType("application/json")
            .content(json.writeValueAsString(update))).andExpect(status().isBadRequest());

        update.put("sire", "Bolt"); update.put("dam", "Rain"); update.put("category", "SHOW");
        mvc.perform(put("/camel/update").session(session).with(csrf()).contentType("application/json")
            .content(json.writeValueAsString(update))).andExpect(status().isOk());
        var camel = camelRepository.findById(id).orElseThrow();
        assertThat(camel.getSire()).isEqualTo("Bolt");
        assertThat(camel.getDam()).isEqualTo("Rain");
        assertThat(camel.getCategory()).isEqualTo("SHOW");
    }
}
