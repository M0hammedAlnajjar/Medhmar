package com.gulfracing.integration;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PedigreeIntegrationTests extends IntegrationSupport {

    @Test
    void ownerRegistersParentsAndPublicCanReadPedigreeProfileAndAncestryTree() throws Exception {
        var owner = register("pedigree-owner@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        MockHttpSession session = login(owner.email());

        long sire = createCamel(session, "Thunder", "MALE", "2010-01-01T00:00:00Z", Map.of());
        long dam = createCamel(session, "Dawn", "FEMALE", "2011-01-01T00:00:00Z", Map.of());
        long child = createCamel(session, "Falcon", "MALE", "2020-01-01T00:00:00Z", Map.of());

        var created = mvc.perform(put("/camel/" + child + "/pedigree")
                        .session(session).with(csrf()).contentType("application/json")
                        .content(payload(Map.of("sireCamelId", sire, "damCamelId", dam))))
                .andExpect(status().isOk()).andReturn();

        var body = json.readTree(created.getResponse().getContentAsString());
        assertThat(body.get("pedigreeId").isNumber()).isTrue();
        assertThat(body.get("sireCamelId").asLong()).isEqualTo(sire);
        assertThat(body.get("damCamelId").asLong()).isEqualTo(dam);
        assertThat(body.get("sire").asText()).isEqualTo("Thunder");
        assertThat(body.get("dam").asText()).isEqualTo("Dawn");
        assertThat(body.get("recordedAt").isNull()).isFalse();

        // Reads are public but reveal no account or owner contact details.
        var read = mvc.perform(get("/camel/" + child + "/pedigree"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        assertThat(read).doesNotContain("pedigree-owner@example.com").doesNotContain("password");
        assertThat(json.readTree(read).get("sireCamelId").asLong()).isEqualTo(sire);

        var profile = json.readTree(mvc.perform(get("/camel/profile")
                        .param("id", Long.toString(child)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(profile.get("pedigree").get("sireCamelId").asLong()).isEqualTo(sire);
        assertThat(profile.get("pedigree").get("damCamelId").asLong()).isEqualTo(dam);
        assertThat(profile.get("pedigree").get("sire").asText()).isEqualTo("Thunder");

        var tree = json.readTree(mvc.perform(get("/camel/" + child + "/pedigree/tree")
                        .param("generations", "3"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(tree.get("name").asText()).isEqualTo("Falcon");
        assertThat(tree.get("sire").get("camelId").asLong()).isEqualTo(sire);
        assertThat(tree.get("dam").get("camelId").asLong()).isEqualTo(dam);
        assertThat(tree.get("sire").get("name").asText()).isEqualTo("Thunder");

        mvc.perform(get("/camel/" + child + "/pedigree/tree").param("generations", "0"))
                .andExpect(status().isBadRequest());
        mvc.perform(get("/camel/" + child + "/pedigree/tree").param("generations", "5"))
                .andExpect(status().isBadRequest());

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM pedigree WHERE camel_id = ?",
                Integer.class, child)).isEqualTo(1);
    }

    @Test
    void rejectsNonOwnersEvenIfTheyHaveOwnerRole() throws Exception {
        var owner = register("real-owner@example.com");
        var other = register("wrong-owner@example.com");
        var viewer = register("pedigree-viewer@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(other.userId(), Set.of("OWNER"));
        MockHttpSession ownerSession = login(owner.email());

        long child = createCamel(ownerSession, "Owned Camel", "FEMALE", "2020-01-01T00:00:00Z", Map.of());

        mvc.perform(put("/camel/" + child + "/pedigree").with(csrf())
                        .contentType("application/json").content(payload(Map.of())))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/camel/" + child + "/pedigree").session(login(viewer.email())).with(csrf())
                        .contentType("application/json").content(payload(Map.of())))
                .andExpect(status().isForbidden());
        mvc.perform(put("/camel/" + child + "/pedigree").session(login(other.email())).with(csrf())
                        .contentType("application/json").content(payload(Map.of())))
                .andExpect(status().isForbidden());
    }

    @Test
    void validatesSexSelfReferenceDuplicateParentsAgeAndMissingOrInactiveParents() throws Exception {
        var owner = register("validation-owner@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        MockHttpSession session = login(owner.email());

        long child = createCamel(session, "Young Camel", "MALE", "2020-01-01T00:00:00Z", Map.of());
        long male = createCamel(session, "Older Male", "MALE", "2010-01-01T00:00:00Z", Map.of());
        long female = createCamel(session, "Older Female", "FEMALE", "2011-01-01T00:00:00Z", Map.of());
        long youngerMale = createCamel(session, "Younger Male", "MALE", "2022-01-01T00:00:00Z", Map.of());

        expectInvalid(session, child, Map.of("sireCamelId", child));
        expectInvalid(session, child, Map.of("sireCamelId", male, "damCamelId", male));
        expectInvalid(session, child, Map.of("sireCamelId", female));
        expectInvalid(session, child, Map.of("damCamelId", male));
        expectInvalid(session, child, Map.of("sireCamelId", youngerMale));

        mvc.perform(put("/camel/" + child + "/pedigree").session(session).with(csrf())
                        .contentType("application/json").content(payload(Map.of("sireCamelId", 999999))))
                .andExpect(status().isNotFound());

        mvc.perform(delete("/camel/deleteById").param("id", Long.toString(male))
                        .session(session).with(csrf())).andExpect(status().isOk());
        mvc.perform(put("/camel/" + child + "/pedigree").session(session).with(csrf())
                        .contentType("application/json").content(payload(Map.of("sireCamelId", male))))
                .andExpect(status().isNotFound());

        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM pedigree WHERE camel_id = ?",
                Integer.class, child)).isZero();
    }

    @Test
    void preventsCircularAncestryAndRetainsLegacyNamesWithoutRegisteredLinks() throws Exception {
        var owner = register("cycle-owner@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        MockHttpSession session = login(owner.email());

        long ancestor = createCamel(session, "Grandfather", "MALE", "2010-01-01T00:00:00Z", Map.of());
        long child = createCamel(session, "Child", "MALE", "2020-01-01T00:00:00Z",
                Map.of("sire", "Unregistered Sire", "dam", "Unregistered Dam"));

        var legacy = json.readTree(mvc.perform(get("/camel/" + child + "/pedigree"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(legacy.get("sire").asText()).isEqualTo("Unregistered Sire");
        assertThat(legacy.get("dam").asText()).isEqualTo("Unregistered Dam");
        assertThat(legacy.get("sireCamelId").isNull()).isTrue();

        mvc.perform(put("/camel/" + child + "/pedigree").session(session).with(csrf())
                        .contentType("application/json").content(payload(Map.of("sireCamelId", ancestor))))
                .andExpect(status().isOk());

        // An ancestor cannot later be assigned its descendant as parent.
        var cycle = mvc.perform(put("/camel/" + ancestor + "/pedigree").session(session).with(csrf())
                        .contentType("application/json").content(payload(Map.of("sireCamelId", child))))
                .andExpect(status().isBadRequest()).andReturn();
        assertThat(cycle.getResponse().getContentAsString()).contains("Circular pedigree");

        var updated = json.readTree(mvc.perform(get("/camel/" + child + "/pedigree"))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(updated.get("sire").asText()).isEqualTo("Grandfather");
        assertThat(updated.get("dam").asText()).isEqualTo("Unregistered Dam");

        long pedigreeId = updated.get("pedigreeId").asLong();
        var cleared = json.readTree(mvc.perform(put("/camel/" + child + "/pedigree")
                        .session(session).with(csrf()).contentType("application/json")
                        .content(payload(Map.of())))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(cleared.get("pedigreeId").asLong()).isEqualTo(pedigreeId);
        assertThat(cleared.get("sire").isNull()).isTrue();
        assertThat(cleared.get("dam").asText()).isEqualTo("Unregistered Dam");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM pedigree WHERE camel_id = ?",
                Integer.class, child)).isEqualTo(1);
    }

    @Test
    void ordinaryCamelEditsCannotCorruptRegisteredPedigreeAndRenamesRefreshLegacyNames() throws Exception {
        var owner = register("edit-pedigree-owner@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        MockHttpSession session = login(owner.email());

        long sire = createCamel(session, "Sire Name", "MALE", "2010-01-01T00:00:00Z", Map.of());
        long child = createCamel(session, "Offspring", "FEMALE", "2020-01-01T00:00:00Z", Map.of());

        mvc.perform(put("/camel/" + child + "/pedigree").session(session).with(csrf())
                        .contentType("application/json").content(payload(Map.of("sireCamelId", sire))))
                .andExpect(status().isOk());

        // Prevent bypassing canonical registered sire ID through old sire text.
        mvc.perform(put("/camel/update").session(session).with(csrf()).contentType("application/json")
                        .content(payload(camelUpdate(child, "Offspring", "FEMALE",
                                "2020-01-01T00:00:00Z", "Fake Sire")))
                ).andExpect(status().isConflict());

        // An established sire cannot be turned female.
        mvc.perform(put("/camel/update").session(session).with(csrf()).contentType("application/json")
                        .content(payload(camelUpdate(sire, "Sire Name", "FEMALE",
                                "2010-01-01T00:00:00Z", null)))
                ).andExpect(status().isConflict());

        // Nor can an existing sire be changed to be younger than his recorded offspring.
        mvc.perform(put("/camel/update").session(session).with(csrf()).contentType("application/json")
                        .content(payload(camelUpdate(sire, "Sire Name", "MALE",
                                "2021-01-01T00:00:00Z", null)))
                ).andExpect(status().isConflict());

        mvc.perform(put("/camel/update").session(session).with(csrf()).contentType("application/json")
                        .content(payload(camelUpdate(sire, "Renamed Sire", "MALE",
                                "2010-01-01T00:00:00Z", null)))
                ).andExpect(status().isOk());

        var profile = json.readTree(mvc.perform(get("/camel/profile").param("id", Long.toString(child)))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString());
        assertThat(profile.get("pedigree").get("sire").asText()).isEqualTo("Renamed Sire");
        assertThat(camelRepository.findById(child).orElseThrow().getSire()).isEqualTo("Renamed Sire");
    }

    private void expectInvalid(MockHttpSession session, long childId, Map<String, Object> request) throws Exception {
        mvc.perform(put("/camel/" + childId + "/pedigree").session(session).with(csrf())
                        .contentType("application/json").content(payload(request)))
                .andExpect(status().isBadRequest());
    }

    private long createCamel(
            MockHttpSession session,
            String name,
            String gender,
            String birth,
            Map<String, Object> extra
    ) throws Exception {
        var request = new HashMap<String, Object>(Map.of(
                "name", name,
                "gender", gender,
                "birthDate", birth,
                "breed", "Omani",
                "status", "ACTIVE"
        ));
        request.putAll(extra);
        var result = mvc.perform(post("/camel/add").session(session).with(csrf())
                        .contentType("application/json").content(payload(request)))
                .andExpect(status().isOk()).andReturn();
        return json.readTree(result.getResponse().getContentAsString()).asLong();
    }

    private Map<String, Object> camelUpdate(
            long camelId,
            String name,
            String gender,
            String birth,
            String sire
    ) {
        var request = new HashMap<String, Object>(Map.of(
                "camelId", camelId,
                "name", name,
                "gender", gender,
                "birthDate", birth,
                "breed", "Omani",
                "status", "ACTIVE"
        ));
        if (sire != null) {
            request.put("sire", sire);
        }
        return request;
    }
}
