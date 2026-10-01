package com.gulfracing.integration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MarketplaceOfferIntegrationTests extends IntegrationSupport {

    @Test
    void marketplaceListingUsesAuthenticatedSellerAndActiveOwnership() throws Exception {
        var owner = register("market-owner@example.com");
        var other = register("market-other@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));

        var ownerSession = login(owner.email());
        long camelId = createCamel(ownerSession);

        var listingRequest = new HashMap<String, Object>();
        listingRequest.put("askingPriceOmr", 2500);
        listingRequest.put("description", "Race-ready camel for sale");
        listingRequest.put("camelId", camelId);
        listingRequest.put("userId", other.userId());
        listingRequest.put("status", "SOLD");

        var result = mvc.perform(post("/marketplace/add")
                        .session(ownerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(listingRequest)))
                .andExpect(status().isOk())
                .andReturn();

        long listingId =
                json.readTree(result.getResponse().getContentAsString()).asLong();

        assertThat(jdbc.queryForObject(
                "SELECT user_id FROM market_place WHERE listing_id = ?",
                Long.class,
                listingId
        )).isEqualTo(owner.userId());

        assertThat(jdbc.queryForObject(
                "SELECT status FROM market_place WHERE listing_id = ?",
                String.class,
                listingId
        )).isEqualTo("AVAILABLE");

        assertThat(jdbc.queryForObject(
                "SELECT is_active FROM market_place WHERE listing_id = ?",
                Boolean.class,
                listingId
        )).isTrue();

        assertThat(jdbc.queryForObject(
                "SELECT is_active FROM ownership_record WHERE camel_id = ? AND owner_id = ?",
                Boolean.class,
                camelId,
                owner.userId()
        )).isTrue();

        mvc.perform(get("/marketplace/getAll"))
                .andExpect(status().isOk());

        mvc.perform(post("/ownershipRecord/add")
                        .session(ownerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "sharePercent", 100,
                                "startAt", "2030-01-01T10:00:00Z",
                                "camelId", camelId,
                                "ownerId", owner.userId()
                        ))))
                .andExpect(status().isForbidden());
    }

    @Test
    void acceptingOfferTransfersOwnershipAndDeclinesOtherPendingOffers()
            throws Exception {

        var seller = register("seller@example.com");
        var buyer = register("buyer@example.com");
        var secondBuyer = register("second-buyer@example.com");

        users.updateRoles(seller.userId(), Set.of("OWNER"));

        var sellerSession = login(seller.email());
        var buyerSession = login(buyer.email());
        var secondBuyerSession = login(secondBuyer.email());

        long camelId = createCamel(sellerSession);
        long listingId = createListing(sellerSession, camelId);

        long acceptedOfferId = createOffer(
                buyerSession,
                listingId,
                3100,
                seller.userId(),
                "ACCEPTED"
        );

        long declinedOfferId = createOffer(
                secondBuyerSession,
                listingId,
                3200,
                seller.userId(),
                "ACCEPTED"
        );

        assertThat(jdbc.queryForObject(
                "SELECT user_id FROM offer WHERE offer_id = ?",
                Long.class,
                acceptedOfferId
        )).isEqualTo(buyer.userId());

        assertThat(jdbc.queryForObject(
                "SELECT status FROM offer WHERE offer_id = ?",
                String.class,
                acceptedOfferId
        )).isEqualTo("PENDING");

        // Buyer must NOT be able to accept the offer.
        mvc.perform(post("/offer/" + acceptedOfferId + "/accept")
                        .session(buyerSession)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // Seller can accept the offer.
        mvc.perform(post("/offer/" + acceptedOfferId + "/accept")
                        .session(sellerSession)
                        .with(csrf()))
                .andExpect(status().isOk());

        assertThat(jdbc.queryForObject(
                "SELECT status FROM offer WHERE offer_id = ?",
                String.class,
                acceptedOfferId
        )).isEqualTo("ACCEPTED");

        assertThat(jdbc.queryForObject(
                "SELECT status FROM offer WHERE offer_id = ?",
                String.class,
                declinedOfferId
        )).isEqualTo("DECLINED");

        assertThat(jdbc.queryForObject(
                "SELECT status FROM market_place WHERE listing_id = ?",
                String.class,
                listingId
        )).isEqualTo("SOLD");

        assertThat(jdbc.queryForObject(
                "SELECT is_active FROM market_place WHERE listing_id = ?",
                Boolean.class,
                listingId
        )).isFalse();

        assertThat(jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM ownership_record
                WHERE camel_id = ?
                  AND owner_id = ?
                  AND is_active = TRUE
                """,
                Integer.class,
                camelId,
                seller.userId()
        )).isZero();

        assertThat(jdbc.queryForObject(
                """
                SELECT COUNT(*)
                FROM ownership_record
                WHERE camel_id = ?
                  AND owner_id = ?
                  AND is_active = TRUE
                """,
                Integer.class,
                camelId,
                buyer.userId()
        )).isEqualTo(1);

        assertThat(jdbc.queryForObject(
                """
                SELECT share_percent
                FROM ownership_record
                WHERE camel_id = ?
                  AND owner_id = ?
                  AND is_active = TRUE
                """,
                Double.class,
                camelId,
                buyer.userId()
        )).isEqualTo(100.0);
    }

    // ---------------------------------------------------------
    // Buyer / Seller Security Tests
    // ---------------------------------------------------------

    @Test
    void offerDetailsAreRestrictedToBuyerSellerAndAuthenticatedUsers()
            throws Exception {

        var seller = register("details-seller@example.com");
        var buyer = register("details-buyer@example.com");
        var outsider = register("details-outsider@example.com");

        users.updateRoles(seller.userId(), Set.of("OWNER"));

        var sellerSession = login(seller.email());
        var buyerSession = login(buyer.email());
        var outsiderSession = login(outsider.email());

        long camelId = createCamel(sellerSession);
        long listingId = createListing(sellerSession, camelId);

        long offerId = createOffer(
                buyerSession,
                listingId,
                3000,
                seller.userId(),
                "ACCEPTED"
        );

        // Buyer can view.
        mvc.perform(get("/offer/getById")
                        .param("id", String.valueOf(offerId))
                        .session(buyerSession))
                .andExpect(status().isOk());

        // Seller can view.
        mvc.perform(get("/offer/getById")
                        .param("id", String.valueOf(offerId))
                        .session(sellerSession))
                .andExpect(status().isOk());

        // Unrelated authenticated user cannot view.
        mvc.perform(get("/offer/getById")
                        .param("id", String.valueOf(offerId))
                        .session(outsiderSession))
                .andExpect(status().isForbidden());

        // Unauthenticated user cannot access offers.
        mvc.perform(get("/offer/getById")
                        .param("id", String.valueOf(offerId)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void onlyBuyerCanUpdateOrCancelOwnOffer() throws Exception {

        var seller = register("update-seller@example.com");
        var buyer = register("update-buyer@example.com");
        var outsider = register("update-outsider@example.com");

        users.updateRoles(seller.userId(), Set.of("OWNER"));

        var sellerSession = login(seller.email());
        var buyerSession = login(buyer.email());
        var outsiderSession = login(outsider.email());

        long camelId = createCamel(sellerSession);
        long listingId = createListing(sellerSession, camelId);

        long offerId = createOffer(
                buyerSession,
                listingId,
                3000,
                seller.userId(),
                "ACCEPTED"
        );

        // Seller cannot update buyer's offer.
        mvc.perform(put("/offer/update")
                        .session(sellerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "offerId", offerId,
                                "offeredPriceOmr", 3300,
                                "listingId", listingId
                        ))))
                .andExpect(status().isForbidden());

        // Unrelated user cannot update buyer's offer.
        mvc.perform(put("/offer/update")
                        .session(outsiderSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "offerId", offerId,
                                "offeredPriceOmr", 3300,
                                "listingId", listingId
                        ))))
                .andExpect(status().isForbidden());

        // Buyer can update own offer.
        mvc.perform(put("/offer/update")
                        .session(buyerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "offerId", offerId,
                                "offeredPriceOmr", 3300,
                                "listingId", listingId
                        ))))
                .andExpect(status().isOk());

        assertThat(jdbc.queryForObject(
                "SELECT offered_price_omr FROM offer WHERE offer_id = ?",
                Double.class,
                offerId
        )).isEqualTo(3300.0);

        // Outsider cannot cancel buyer's offer.
        mvc.perform(delete("/offer/deleteById")
                        .param("id", String.valueOf(offerId))
                        .session(outsiderSession)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // Seller cannot cancel buyer's offer.
        mvc.perform(delete("/offer/deleteById")
                        .param("id", String.valueOf(offerId))
                        .session(sellerSession)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // Buyer can cancel own offer.
        mvc.perform(delete("/offer/deleteById")
                        .param("id", String.valueOf(offerId))
                        .session(buyerSession)
                        .with(csrf()))
                .andExpect(status().isOk());

        assertThat(jdbc.queryForObject(
                "SELECT is_active FROM offer WHERE offer_id = ?",
                Boolean.class,
                offerId
        )).isFalse();
    }

    @Test
    void onlySellerCanViewAndDeclineListingOffers() throws Exception {

        var seller = register("decline-seller@example.com");
        var buyer = register("decline-buyer@example.com");
        var outsider = register("decline-outsider@example.com");

        users.updateRoles(seller.userId(), Set.of("OWNER"));

        var sellerSession = login(seller.email());
        var buyerSession = login(buyer.email());
        var outsiderSession = login(outsider.email());

        long camelId = createCamel(sellerSession);
        long listingId = createListing(sellerSession, camelId);

        long offerId = createOffer(
                buyerSession,
                listingId,
                3000,
                seller.userId(),
                "ACCEPTED"
        );

        // Seller can view offers belonging to their listing.
        mvc.perform(get("/offer/listing/" + listingId)
                        .session(sellerSession))
                .andExpect(status().isOk());

        // Buyer cannot view all offers on seller's listing.
        mvc.perform(get("/offer/listing/" + listingId)
                        .session(buyerSession))
                .andExpect(status().isForbidden());

        // Unrelated user cannot view listing offers.
        mvc.perform(get("/offer/listing/" + listingId)
                        .session(outsiderSession))
                .andExpect(status().isForbidden());

        // Buyer cannot decline their own offer.
        mvc.perform(post("/offer/" + offerId + "/decline")
                        .session(buyerSession)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // Unrelated user cannot decline the offer.
        mvc.perform(post("/offer/" + offerId + "/decline")
                        .session(outsiderSession)
                        .with(csrf()))
                .andExpect(status().isForbidden());

        // Seller can decline offer.
        mvc.perform(post("/offer/" + offerId + "/decline")
                        .session(sellerSession)
                        .with(csrf()))
                .andExpect(status().isOk());

        assertThat(jdbc.queryForObject(
                "SELECT status FROM offer WHERE offer_id = ?",
                String.class,
                offerId
        )).isEqualTo("DECLINED");
    }

    // ---------------------------------------------------------
    // Helper Methods
    // ---------------------------------------------------------

    private long createCamel(MockHttpSession ownerSession) throws Exception {

        var result = mvc.perform(post("/camel/add")
                        .session(ownerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "name", "Marketplace Camel",
                                "gender", "MALE",
                                "birthDate", "2020-01-01T00:00:00Z",
                                "breed", "Omani",
                                "status", "ACTIVE"
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return json.readTree(
                result.getResponse().getContentAsString()
        ).asLong();
    }

    private long createListing(
            MockHttpSession sellerSession,
            long camelId
    ) throws Exception {

        var result = mvc.perform(post("/marketplace/add")
                        .session(sellerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "askingPriceOmr", 3500,
                                "description", "Camel marketplace listing",
                                "camelId", camelId
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return json.readTree(
                result.getResponse().getContentAsString()
        ).asLong();
    }

    private long createOffer(
            MockHttpSession buyerSession,
            long listingId,
            double price,
            long spoofedUserId,
            String spoofedStatus
    ) throws Exception {

        var result = mvc.perform(post("/offer/add")
                        .session(buyerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "offeredPriceOmr", price,
                                "listingId", listingId,
                                "userId", spoofedUserId,
                                "status", spoofedStatus
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return json.readTree(
                result.getResponse().getContentAsString()
        ).asLong();
    }
}