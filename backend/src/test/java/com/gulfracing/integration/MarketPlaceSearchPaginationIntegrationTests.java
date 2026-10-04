package com.gulfracing.integration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class MarketPlaceSearchPaginationIntegrationTests extends IntegrationSupport {

    @Test
    void getAllUsesDefaultPagination() throws Exception {
        var seller = createSeller("market-page-default@example.com");

        long camel1 = createCamel(seller.session(), "Desert Star", "Omani");
        long camel2 = createCamel(seller.session(), "Golden Racer", "Sudani");

        createListing(seller.session(), camel1, 1500, "Fast racing camel");
        createListing(seller.session(), camel2, 2500, "Strong camel for sale");

        var result = mvc.perform(get("/marketplace/getAll"))
                .andExpect(status().isOk())
                .andReturn();

        var node = json.readTree(result.getResponse().getContentAsString());

        assertThat(node.get("page").asInt()).isEqualTo(0);
        assertThat(node.get("size").asInt()).isEqualTo(20);
        assertThat(node.get("content").isArray()).isTrue();
        assertThat(node.get("totalElements").asLong()).isGreaterThanOrEqualTo(2);
    }

    @Test
    void searchMatchesCamelNameAndDescriptionCaseInsensitively() throws Exception {
        var seller = createSeller("market-search@example.com");

        long camel1 = createCamel(seller.session(), "Thunder King", "Omani");
        long camel2 = createCamel(seller.session(), "Desert Moon", "Sudani");

        createListing(seller.session(), camel1, 1800, "Powerful racer");
        createListing(seller.session(), camel2, 2200, "Special endurance camel");

        var byName = mvc.perform(get("/marketplace/getAll")
                        .param("search", "THUNDER"))
                .andExpect(status().isOk())
                .andReturn();

        var nameNode = json.readTree(byName.getResponse().getContentAsString());
        assertThat(nameNode.get("content")).hasSize(1);
        assertThat(nameNode.get("content").get(0).get("camelId").asLong())
                .isEqualTo(camel1);

        var byDescription = mvc.perform(get("/marketplace/getAll")
                        .param("search", "ENDURANCE"))
                .andExpect(status().isOk())
                .andReturn();

        var descriptionNode = json.readTree(byDescription.getResponse().getContentAsString());
        assertThat(descriptionNode.get("content")).hasSize(1);
        assertThat(descriptionNode.get("content").get(0).get("camelId").asLong())
                .isEqualTo(camel2);
    }

    @Test
    void filtersByCamelAndPriceRange() throws Exception {
        var seller = createSeller("market-filter@example.com");

        long cheapCamel = createCamel(seller.session(), "Cheap Camel", "Omani");
        long expensiveCamel = createCamel(seller.session(), "Premium Camel", "Omani");

        createListing(seller.session(), cheapCamel, 1000, "Affordable camel");
        createListing(seller.session(), expensiveCamel, 5000, "Premium racing camel");

        var priceResult = mvc.perform(get("/marketplace/getAll")
                        .param("minPrice", "4000")
                        .param("maxPrice", "6000"))
                .andExpect(status().isOk())
                .andReturn();

        var priceNode = json.readTree(priceResult.getResponse().getContentAsString());
        assertThat(priceNode.get("content")).hasSize(1);
        assertThat(priceNode.get("content").get(0).get("camelId").asLong())
                .isEqualTo(expensiveCamel);

        var camelResult = mvc.perform(get("/marketplace/getAll")
                        .param("camelId", Long.toString(cheapCamel)))
                .andExpect(status().isOk())
                .andReturn();

        var camelNode = json.readTree(camelResult.getResponse().getContentAsString());
        assertThat(camelNode.get("content")).hasSize(1);
        assertThat(camelNode.get("content").get(0).get("camelId").asLong())
                .isEqualTo(cheapCamel);
    }

    @Test
    void customPaginationWorks() throws Exception {
        var seller = createSeller("market-pagination@example.com");

        long camel1 = createCamel(seller.session(), "Page Camel One", "Omani");
        long camel2 = createCamel(seller.session(), "Page Camel Two", "Sudani");

        createListing(seller.session(), camel1, 1200, "First pagination listing");
        createListing(seller.session(), camel2, 1300, "Second pagination listing");

        var result = mvc.perform(get("/marketplace/getAll")
                        .param("search", "pagination listing")
                        .param("page", "1")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andReturn();

        var node = json.readTree(result.getResponse().getContentAsString());

        assertThat(node.get("page").asInt()).isEqualTo(1);
        assertThat(node.get("size").asInt()).isEqualTo(1);
        assertThat(node.get("content")).hasSize(1);
        assertThat(node.get("totalElements").asLong()).isEqualTo(2);
        assertThat(node.get("totalPages").asInt()).isEqualTo(2);
    }

    @Test
    void invalidPaginationAndPriceRangesAreRejected() throws Exception {
        mvc.perform(get("/marketplace/getAll").param("page", "-1"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/marketplace/getAll").param("size", "0"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/marketplace/getAll").param("size", "101"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/marketplace/getAll")
                        .param("minPrice", "5000")
                        .param("maxPrice", "1000"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/marketplace/getAll").param("camelId", "-1"))
                .andExpect(status().isBadRequest());
    }

    private Seller createSeller(String email) throws Exception {
        var seller = register(email);
        users.updateRoles(seller.userId(), Set.of("OWNER"));
        return new Seller(login(seller.email()));
    }

    private long createCamel(
            MockHttpSession session,
            String name,
            String breed
    ) throws Exception {
        var result = mvc.perform(post("/camel/add")
                        .session(session)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "name", name,
                                "gender", "MALE",
                                "birthDate", "2020-01-01T00:00:00Z",
                                "breed", breed,
                                "status", "ACTIVE"
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return json.readTree(
                result.getResponse().getContentAsString()
        ).asLong();
    }

    private long createListing(
            MockHttpSession session,
            long camelId,
            double price,
            String description
    ) throws Exception {
        var result = mvc.perform(post("/marketplace/add")
                        .session(session)
                        .with(csrf())
                        .contentType("application/json")
                        .content(payload(Map.of(
                                "askingPriceOmr", price,
                                "description", description,
                                "camelId", camelId
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        return json.readTree(
                result.getResponse().getContentAsString()
        ).asLong();
    }

    private record Seller(MockHttpSession session) {
    }
}