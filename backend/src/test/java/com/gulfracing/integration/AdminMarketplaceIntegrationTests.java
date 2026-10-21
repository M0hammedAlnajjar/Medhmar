package com.gulfracing.integration;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.enums.MarketPlaceStatus;
import com.gulfracing.repository.MarketPlaceRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpSession;

import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminMarketplaceIntegrationTests extends IntegrationSupport {
    @Autowired MarketPlaceRepository listingRepository;

    private long listing(Long sellerId, String camelName, String category, String price, MarketPlaceStatus status, boolean active) {
        var camel = camel(camelName);
        jdbc.update("UPDATE camel SET category = ?, is_active = TRUE WHERE camel_id = ?", category, camel.getCamelId());
        var m = new MarketPlace();
        m.setAskingPriceOmr(new BigDecimal(price));
        m.setDescription("Listing for " + camelName);
        m.setStatus(status);
        m.setIsActive(active);
        m.setCreatedAt(new Date());
        m.setCreatedDate(new Date());
        m.setCamel(camelRepository.getReferenceById(camel.getCamelId()));
        m.setUser(userRepository.getReferenceById(sellerId));
        return listingRepository.saveAndFlush(m).getListingId();
    }

    private long auditCount(String action, long listingId) {
        return jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE entity_type = 'Listing' AND entity_id = ? AND action_type = ?",
            Long.class, listingId, action);
    }

    @Test
    void everyAdminMarketplaceEndpointRejectsAnonymousAndNonAdminUsers() throws Exception {
        var seller = register("mkt-seller-a@example.com", "OWNER");
        long id = listing(seller.userId(), "Barq", "RACING", "1000.000", MarketPlaceStatus.AVAILABLE, true);
        var sellerSession = login(seller.email());
        String body = payload(Map.of("askingPriceOmr", 5, "description", "Changed by seller"));
        String base = "/api/admin/marketplace";
        for (MockHttpSession session : new MockHttpSession[]{null, sellerSession}) {
            int expected = session == null ? 401 : 403;
            var requests = new org.springframework.test.web.servlet.RequestBuilder[]{
                get(base), get(base + "/stats"), get(base + "/categories"), get(base + "/" + id),
                put(base + "/" + id).with(csrf()).contentType("application/json").content(body),
                post(base + "/" + id + "/approve").with(csrf()),
                post(base + "/" + id + "/reject").with(csrf()).contentType("application/json").content("{}"),
                put(base + "/" + id + "/status").with(csrf()).contentType("application/json")
                    .content(payload(Map.of("status", "REJECTED"))),
                delete(base + "/" + id).with(csrf())};
            for (var request : requests) {
                var builder = request instanceof org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder b ? b : null;
                if (session != null && builder != null) builder.session(session);
                mvc.perform(request).andExpect(status().is(expected));
            }
        }
        assertThat(jdbc.queryForObject("SELECT status FROM market_place WHERE listing_id = ?", String.class, id))
            .isEqualTo("AVAILABLE");
    }

    @Test
    void statsListSearchFilterAndSortUseRealMarketplaceRows() throws Exception {
        var a = register("mkt-seller-b@example.com", "OWNER");
        long active = listing(a.userId(), "Shahin", "RACING", "3000.000", MarketPlaceStatus.AVAILABLE, true);
        long cheap = listing(a.userId(), "Reem", "BREEDING", "500.000", MarketPlaceStatus.AVAILABLE, true);
        listing(a.userId(), "Pending One", "RACING", "900.000", MarketPlaceStatus.PENDING, true);
        listing(a.userId(), "Rejected One", "RACING", "900.000", MarketPlaceStatus.REJECTED, true);
        listing(a.userId(), "Sold One", "RACING", "900.000", MarketPlaceStatus.SOLD, false);
        listing(a.userId(), "Gone One", "RACING", "900.000", MarketPlaceStatus.CANCELLED, false);
        var admin = admin();

        mvc.perform(get("/api/admin/marketplace/stats").session(admin))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.total").value(6)).andExpect(jsonPath("$.active").value(2))
            .andExpect(jsonPath("$.pending").value(1)).andExpect(jsonPath("$.rejected").value(1))
            .andExpect(jsonPath("$.sold").value(1)).andExpect(jsonPath("$.inactive").value(1));
        // Dashboard card and management card share the same source.
        mvc.perform(get("/api/admin/dashboard").session(admin))
            .andExpect(jsonPath("$.activeListings").value(2));

        mvc.perform(get("/api/admin/marketplace").session(admin).param("status", "AVAILABLE").param("sort", "price_asc"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalElements").value(2))
            .andExpect(jsonPath("$.content[0].listingId").value(cheap))
            .andExpect(jsonPath("$.content[1].listingId").value(active))
            .andExpect(jsonPath("$.content[0].seller.email").value("mkt-seller-b@example.com"));
        mvc.perform(get("/api/admin/marketplace").session(admin).param("search", "shah"))
            .andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/admin/marketplace").session(admin).param("search", "SELLER-B").param("size", "100"))
            .andExpect(jsonPath("$.totalElements").value(0)); // email is not searchable; name is
        mvc.perform(get("/api/admin/marketplace").session(admin).param("category", "breeding"))
            .andExpect(jsonPath("$.totalElements").value(1));
        mvc.perform(get("/api/admin/marketplace/categories").session(admin))
            .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/admin/marketplace").session(admin).param("size", "101")).andExpect(status().isBadRequest());
        mvc.perform(get("/api/admin/marketplace").session(admin).param("sort", "bogus")).andExpect(status().isBadRequest());
    }

    @Test
    void rejectHidesFromPublicMarketplaceAndApproveRestoresIt() throws Exception {
        var seller = register("mkt-seller-c@example.com", "OWNER");
        long id = listing(seller.userId(), "Wahiba", "RACING", "1500.000", MarketPlaceStatus.AVAILABLE, true);
        var admin = admin();
        mvc.perform(get("/marketplace/getById").param("id", String.valueOf(id))).andExpect(status().isOk());

        mvc.perform(post("/api/admin/marketplace/" + id + "/reject").session(admin).with(csrf())
                .contentType("application/json").content(payload(Map.of("reason", "Misleading photos"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"))
            .andExpect(jsonPath("$.publiclyVisible").value(false));
        mvc.perform(get("/marketplace/getAll")).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(get("/marketplace/getById").param("id", String.valueOf(id))).andExpect(status().isNotFound());
        mvc.perform(get("/marketplace/getById").param("id", String.valueOf(id)).session(login(seller.email())))
            .andExpect(status().isOk());
        assertThat(auditCount("REJECTED", id)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT description FROM audit_log WHERE action_type = 'REJECTED'", String.class))
            .contains("Misleading photos");
        assertThat(jdbc.queryForObject("SELECT actor_user_id FROM audit_log WHERE action_type = 'REJECTED'", Long.class))
            .isEqualTo(userRepository.findByEmail("admin@example.com").orElseThrow().getUserId());
        mvc.perform(post("/api/admin/marketplace/" + id + "/reject").session(admin).with(csrf())
            .contentType("application/json").content("{}")).andExpect(status().isConflict());

        mvc.perform(post("/api/admin/marketplace/" + id + "/approve").session(admin).with(csrf()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("AVAILABLE"));
        mvc.perform(get("/marketplace/getAll")).andExpect(jsonPath("$.totalElements").value(1));
        assertThat(auditCount("APPROVED", id)).isEqualTo(1);
    }

    @Test
    void editChangesOnlyWhitelistedFieldsAndValidatesOnTheServer() throws Exception {
        var seller = register("mkt-seller-d@example.com", "OWNER");
        var other = register("mkt-other-d@example.com", "OWNER");
        long id = listing(seller.userId(), "Sahab", "RACING", "1000.000", MarketPlaceStatus.AVAILABLE, true);
        var admin = admin();
        var body = new java.util.HashMap<String, Object>();
        body.put("askingPriceOmr", "1250.500");
        body.put("description", "Updated by an administrator");
        body.put("status", "SOLD");          // must be ignored
        body.put("userId", other.userId());  // must be ignored
        mvc.perform(put("/api/admin/marketplace/" + id).session(admin).with(csrf())
                .contentType("application/json").content(payload(body)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.askingPriceOmr").value(1250.5));
        assertThat(jdbc.queryForObject("SELECT status FROM market_place WHERE listing_id = ?", String.class, id)).isEqualTo("AVAILABLE");
        assertThat(jdbc.queryForObject("SELECT user_id FROM market_place WHERE listing_id = ?", Long.class, id)).isEqualTo(seller.userId());
        assertThat(auditCount("UPDATED", id)).isEqualTo(1);
        // The regular marketplace shows the edit.
        mvc.perform(get("/marketplace/getById").param("id", String.valueOf(id)))
            .andExpect(jsonPath("$.description").value("Updated by an administrator"));
        for (var bad : new Object[]{Map.of("askingPriceOmr", 0, "description", "valid text"),
                Map.of("askingPriceOmr", -4, "description", "valid text"),
                Map.of("askingPriceOmr", 10, "description", "ab"),
                Map.of("description", "valid text")}) {
            mvc.perform(put("/api/admin/marketplace/" + id).session(admin).with(csrf())
                .contentType("application/json").content(payload(bad))).andExpect(status().isBadRequest());
        }
    }

    @Test
    void statusChangesAreRestrictedAndRemovalIsASoftDeleteThatKeepsTheSeller() throws Exception {
        var seller = register("mkt-seller-e@example.com", "OWNER");
        long id = listing(seller.userId(), "Najm", "RACING", "800.000", MarketPlaceStatus.AVAILABLE, true);
        long sold = listing(seller.userId(), "Sold Camel", "RACING", "800.000", MarketPlaceStatus.SOLD, false);
        var admin = admin();
        for (String blocked : new String[]{"SOLD", "CANCELLED"}) {
            mvc.perform(put("/api/admin/marketplace/" + id + "/status").session(admin).with(csrf())
                .contentType("application/json").content(payload(Map.of("status", blocked)))).andExpect(status().isBadRequest());
        }
        mvc.perform(put("/api/admin/marketplace/" + id + "/status").session(admin).with(csrf())
                .contentType("application/json").content(payload(Map.of("status", "PENDING"))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("PENDING"));
        assertThat(auditCount("STATUS_CHANGED", id)).isEqualTo(1);
        mvc.perform(post("/api/admin/marketplace/" + sold + "/approve").session(admin).with(csrf())).andExpect(status().isConflict());

        mvc.perform(delete("/api/admin/marketplace/" + id).param("reason", "Duplicate").session(admin).with(csrf()))
            .andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT is_active FROM market_place WHERE listing_id = ?", Boolean.class, id)).isFalse();
        assertThat(jdbc.queryForObject("SELECT status FROM market_place WHERE listing_id = ?", String.class, id)).isEqualTo("CANCELLED");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM users WHERE user_id = ?", Long.class, seller.userId())).isEqualTo(1);
        assertThat(auditCount("REMOVED", id)).isEqualTo(1);
        mvc.perform(get("/marketplace/getAll")).andExpect(jsonPath("$.totalElements").value(0));
        mvc.perform(delete("/api/admin/marketplace/" + id).session(admin).with(csrf())).andExpect(status().isConflict());
        mvc.perform(delete("/api/admin/marketplace/" + sold).session(admin).with(csrf())).andExpect(status().isConflict());
        mvc.perform(delete("/api/admin/marketplace/999999").session(admin).with(csrf())).andExpect(status().isNotFound());
        // Marketplace audit events are reviewable through the existing admin audit endpoint.
        mvc.perform(get("/api/admin/audit-logs").session(admin).param("entityType", "Listing"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2));
    }
}
