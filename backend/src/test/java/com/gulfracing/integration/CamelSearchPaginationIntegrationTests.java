package com.gulfracing.integration;

import com.gulfracing.entity.Camel;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.Gender;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CamelSearchPaginationIntegrationTests extends IntegrationSupport {

    private Camel createCamel(
            String name,
            Gender gender,
            String breed,
            String category,
            CamelStatus status,
            boolean active
    ) {
        Camel camel = new Camel();
        camel.setName(name);
        camel.setGender(gender);
        camel.setBreed(breed);
        camel.setCategory(category);
        camel.setStatus(status);
        camel.setIsActive(active);
        camel.setCreatedDate(new Date());

        return camelRepository.saveAndFlush(camel);
    }

    @Test
    void getAllUsesDefaultPagination() throws Exception {
        createCamel("Camel One", Gender.MALE, "Omani", "RACING", CamelStatus.ACTIVE, true);
        createCamel("Camel Two", Gender.FEMALE, "Sudanese", "SHOW", CamelStatus.ACTIVE, true);

        var body = mvc.perform(get("/camel/getAll"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var node = json.readTree(body);

        assertThat(node.get("content").isArray()).isTrue();
        assertThat(node.get("page").asInt()).isEqualTo(0);
        assertThat(node.get("size").asInt()).isEqualTo(20);
        assertThat(node.get("totalElements").asLong()).isGreaterThanOrEqualTo(2);
        assertThat(node.has("totalPages")).isTrue();
    }

    @Test
    void searchByNameIsCaseInsensitive() throws Exception {
        createCamel("Desert Storm", Gender.MALE, "Omani", "RACING", CamelStatus.ACTIVE, true);
        createCamel("Golden Star", Gender.FEMALE, "Omani", "SHOW", CamelStatus.ACTIVE, true);

        var body = mvc.perform(get("/camel/getAll")
                        .param("search", "STORM"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var content = json.readTree(body).get("content");

        assertThat(content).hasSize(1);
        assertThat(content.get(0).get("name").asText()).isEqualTo("Desert Storm");
    }

    @Test
    void filtersCanBeCombined() throws Exception {
        createCamel("Racer One", Gender.MALE, "Omani", "RACING", CamelStatus.ACTIVE, true);
        createCamel("Racer Two", Gender.FEMALE, "Omani", "RACING", CamelStatus.ACTIVE, true);
        createCamel("Racer Three", Gender.MALE, "Sudanese", "RACING", CamelStatus.ACTIVE, true);

        var body = mvc.perform(get("/camel/getAll")
                        .param("gender", "MALE")
                        .param("breed", "Omani")
                        .param("category", "RACING")
                        .param("status", "ACTIVE"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var content = json.readTree(body).get("content");

        assertThat(content).hasSize(1);
        assertThat(content.get(0).get("name").asText()).isEqualTo("Racer One");
    }

    @Test
    void inactiveCamelsAreExcluded() throws Exception {
        createCamel("Visible Camel", Gender.MALE, "Omani", "RACING", CamelStatus.ACTIVE, true);
        createCamel("Hidden Camel", Gender.MALE, "Omani", "RACING", CamelStatus.ACTIVE, false);

        var body = mvc.perform(get("/camel/getAll")
                        .param("search", "Hidden Camel"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var node = json.readTree(body);

        assertThat(node.get("content")).isEmpty();
        assertThat(node.get("totalElements").asLong()).isZero();
    }

    @Test
    void customPageAndSizeWork() throws Exception {
        createCamel("Page Camel 1", Gender.MALE, "Omani", "RACING", CamelStatus.ACTIVE, true);
        createCamel("Page Camel 2", Gender.MALE, "Omani", "RACING", CamelStatus.ACTIVE, true);
        createCamel("Page Camel 3", Gender.MALE, "Omani", "RACING", CamelStatus.ACTIVE, true);

        var body = mvc.perform(get("/camel/getAll")
                        .param("page", "0")
                        .param("size", "2")
                        .param("search", "Page Camel"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        var node = json.readTree(body);

        assertThat(node.get("content")).hasSize(2);
        assertThat(node.get("page").asInt()).isEqualTo(0);
        assertThat(node.get("size").asInt()).isEqualTo(2);
        assertThat(node.get("totalElements").asLong()).isEqualTo(3);
        assertThat(node.get("totalPages").asInt()).isEqualTo(2);
    }

    @Test
    void invalidPageSizeIsRejected() throws Exception {
        mvc.perform(get("/camel/getAll")
                        .param("size", "0"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/camel/getAll")
                        .param("size", "101"))
                .andExpect(status().isBadRequest());

        mvc.perform(get("/camel/getAll")
                        .param("page", "-1"))
                .andExpect(status().isBadRequest());
    }
}