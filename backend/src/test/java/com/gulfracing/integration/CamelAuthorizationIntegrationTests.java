package com.gulfracing.integration;

import org.junit.jupiter.api.Test;
import java.util.*;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class CamelAuthorizationIntegrationTests extends IntegrationSupport {
    @Test
    void camelCreationRecordsOwnershipAndOtherOwnersCannotEditOrDeleteIt() throws Exception {
        var viewer=register("viewer@example.com"); var owner=register("owner@example.com"); var other=register("other@example.com");
        users.updateRoles(owner.userId(),Set.of("OWNER")); users.updateRoles(other.userId(),Set.of("OWNER"));
        var ownerSession=login(owner.email()); var otherSession=login(other.email());
        Map<String,Object> request=new HashMap<>(Map.of("name","Test Camel","gender","MALE",
            "birthDate","2020-01-01T00:00:00Z","breed","Omani","status","ACTIVE"));
        mvc.perform(post("/camel/add").session(login(viewer.email())).with(csrf()).contentType("application/json")
            .content(payload(request))).andExpect(status().isForbidden());
        var created=mvc.perform(post("/camel/add").session(ownerSession).with(csrf()).contentType("application/json")
            .content(payload(request))).andExpect(status().isOk()).andReturn();
        long id=json.readTree(created.getResponse().getContentAsString()).asLong();
        assertThat(jdbc.queryForObject("SELECT owner_id FROM ownership_record WHERE camel_id = ?",Long.class,id)).isEqualTo(owner.userId());
        request.put("camelId",id);
        mvc.perform(put("/camel/update").session(otherSession).with(csrf()).contentType("application/json")
            .content(payload(request))).andExpect(status().isForbidden());
        mvc.perform(delete("/camel/deleteById").param("id",Long.toString(id)).session(otherSession).with(csrf()))
            .andExpect(status().isForbidden());
        mvc.perform(delete("/camel/deleteById").param("id",Long.toString(id)).session(ownerSession).with(csrf()))
            .andExpect(status().isOk());
        assertThat(camelRepository.findById(id).orElseThrow().getIsActive()).isFalse();
    }
}
