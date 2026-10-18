package com.gulfracing.integration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Owner promotion is driven by successful sales, never by offer creation alone.
 * IntegrationSupport uses MySQL and the application's real authorization chain.
 */
class MarketplaceOwnerPromotionIntegrationTests extends IntegrationSupport {

    @Test
    void pendingAndDeclinedOffersNeverPromoteViewers() throws Exception {
        var seller = register("pending-promotion-seller@example.com", "OWNER");
        var buyer = register("pending-promotion-buyer@example.com");
        var sellerSession = login(seller.email());
        var buyerSession = login(buyer.email());
        long listingId = listCamel(sellerSession);
        long offerId = offer(buyerSession, listingId);
        assertThat(users.me(buyer.userId()).roles()).containsExactly("VIEWER");
        assertThat(userRepository.findById(buyer.userId()).orElseThrow().getSecurityVersion()).isZero();

        mvc.perform(post("/offer/" + offerId + "/decline")
                .session(sellerSession).with(csrf()))
            .andExpect(status().isOk());
        assertThat(users.me(buyer.userId()).roles()).containsExactly("VIEWER");
        assertThat(userRepository.findById(buyer.userId()).orElseThrow().getSecurityVersion()).isZero();
        mvc.perform(get("/api/users/me").session(buyerSession))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles", containsInAnyOrder("VIEWER")));
    }

    @Test
    void existingOwnerRetainsRolesAndDoesNotInvalidateSessionsOrDuplicateGrant() throws Exception {
        var seller = register("existing-owner-seller@example.com", "OWNER");
        var buyer = register("existing-owner-buyer@example.com", "OWNER");
        users.updateRoles(buyer.userId(), Set.of("OWNER", "VIEWER"));
        var sellerSession = login(seller.email());
        var buyerSession = login(buyer.email());
        long before = userRepository.findById(buyer.userId()).orElseThrow().getSecurityVersion();
        long offerId = offer(buyerSession, listCamel(sellerSession));

        mvc.perform(post("/offer/" + offerId + "/accept")
                .session(sellerSession).with(csrf()))
            .andExpect(status().isOk());

        assertThat(users.me(buyer.userId()).roles()).containsExactlyInAnyOrder("VIEWER", "OWNER");
        assertThat(userRepository.findById(buyer.userId()).orElseThrow().getSecurityVersion())
            .isEqualTo(before);
        mvc.perform(get("/api/users/me").session(buyerSession))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles", containsInAnyOrder("VIEWER", "OWNER")));
        assertThat(jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE action_type='OWNER_ROLE_GRANTED' AND entity_id=?",
            Integer.class, buyer.userId())).isZero();
    }

    @Test
    void trainerBuyerKeepsTrainerRoleAndGainsOwnerOnlyAfterSale() throws Exception {
        var seller = register("trainer-promotion-seller@example.com", "OWNER");
        var buyer = register("trainer-promotion-buyer@example.com", "TRAINER");
        var sellerSession = login(seller.email());
        var buyerSession = login(buyer.email());
        long offerId = offer(buyerSession, listCamel(sellerSession));
        assertThat(users.me(buyer.userId()).roles()).containsExactly("TRAINER");

        mvc.perform(post("/offer/" + offerId + "/accept")
                .session(sellerSession).with(csrf()))
            .andExpect(status().isOk());

        assertThat(users.me(buyer.userId()).roles()).containsExactlyInAnyOrder("TRAINER", "OWNER");
        mvc.perform(get("/api/users/me").session(buyerSession))
            .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me").session(login(buyer.email())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.roles", containsInAnyOrder("TRAINER", "OWNER")));
    }

    @Test
    void failedTransferMustNotGrantOwnerOrChangeOffer() throws Exception {
        var seller = register("failed-transfer-seller@example.com", "OWNER");
        var buyer = register("failed-transfer-buyer@example.com");
        var sellerSession = login(seller.email());
        var buyerSession = login(buyer.email());
        long listingId = listCamel(sellerSession);
        long offerId = offer(buyerSession, listingId);
        Long camelId = jdbc.queryForObject(
            "SELECT camel_id FROM market_place WHERE listing_id=?", Long.class, listingId);
        // Simulate ownership having been lost before the seller accepts.
        jdbc.update("UPDATE ownership_record SET is_active=FALSE WHERE camel_id=? AND owner_id=?",
            camelId, seller.userId());

        mvc.perform(post("/offer/" + offerId + "/accept")
                .session(sellerSession).with(csrf()))
            .andExpect(status().isConflict());

        assertThat(users.me(buyer.userId()).roles()).containsExactly("VIEWER");
        assertThat(jdbc.queryForObject("SELECT status FROM offer WHERE offer_id=?", String.class, offerId))
            .isEqualTo("PENDING");
        assertThat(jdbc.queryForObject("SELECT status FROM market_place WHERE listing_id=?", String.class, listingId))
            .isEqualTo("AVAILABLE");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM sale_transaction WHERE offer_id=?",
            Integer.class, offerId)).isZero();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM audit_log WHERE action_type='OWNER_ROLE_GRANTED' AND entity_id=?",
            Integer.class, buyer.userId())).isZero();
    }

    private long listCamel(MockHttpSession seller) throws Exception {
        var camel = mvc.perform(post("/camel/add")
                .session(seller).with(csrf()).contentType("application/json")
                .content(payload(java.util.Map.of(
                    "name", "Buyer Promotion Camel", "gender", "MALE",
                    "birthDate", "2020-01-01T00:00:00Z", "breed", "Omani",
                    "status", "ACTIVE"))))
            .andExpect(status().isOk()).andReturn();
        long camelId = json.readTree(camel.getResponse().getContentAsString()).asLong();
        var listing = mvc.perform(post("/marketplace/add")
                .session(seller).with(csrf()).contentType("application/json")
                .content(payload(java.util.Map.of("askingPriceOmr", 3500,
                    "description", "Promotion acceptance test", "camelId", camelId))))
            .andExpect(status().isOk()).andReturn();
        return json.readTree(listing.getResponse().getContentAsString()).asLong();
    }

    private long offer(MockHttpSession buyer, long listingId) throws Exception {
        var result = mvc.perform(post("/offer/add")
                .session(buyer).with(csrf()).contentType("application/json")
                .content(payload(java.util.Map.of("offeredPriceOmr", 3000, "listingId", listingId))))
            .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).asLong();
    }
}
