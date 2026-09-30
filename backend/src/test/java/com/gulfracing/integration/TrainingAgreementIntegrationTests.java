package com.gulfracing.integration;

import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.entity.TrainerProfile;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.TrainerProfileRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Date;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TrainingAgreementIntegrationTests extends IntegrationSupport {
    @Autowired OwnershipRecordRepository ownerships;
    @Autowired TrainerProfileRepository profiles;

    private Long ownedCamel(Long ownerId) {
        var camel = camel("Agreement Camel");
        camel.setStatus(CamelStatus.ACTIVE);
        camel.setIsActive(true);
        camelRepository.saveAndFlush(camel);
        var ownership = new OwnershipRecord();
        ownership.setCamel(camel);
        ownership.setOwner(userRepository.findById(ownerId).orElseThrow());
        ownership.setSharePercent(100.0);
        ownership.setStartAt(Date.from(NOW.minusSeconds(60)));
        ownership.setIsActive(true);
        ownership.setCreatedDate(Date.from(NOW.minusSeconds(60)));
        ownerships.saveAndFlush(ownership);
        return camel.getCamelId();
    }

    private void trainerProfile(Long id) {
        var profile = new TrainerProfile();
        profile.setUser(userRepository.findById(id).orElseThrow());
        profile.setBio("Experienced trainer");
        profile.setLocation("Muscat");
        profiles.saveAndFlush(profile);
    }

    private String proposal(Long camelId, Long trainerId) {
        return payload(Map.of(
                "camelId", camelId,
                "trainerUserId", trainerId,
                "feeOmr", 25.5,
                "prizeSharePct", 10,
                "saleSharePct", 5,
                "startsAt", NOW.plusSeconds(3600).toString(),
                "endsAt", NOW.plusSeconds(86400).toString()));
    }

    @Test
    void ownerProposesAndOnlyDesignatedTrainerAccepts() throws Exception {
        var owner = register("agreement-owner@example.com");
        var trainer = register("agreement-trainer@example.com");
        var other = register("agreement-other@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(trainer.userId(), Set.of("TRAINER"));
        users.updateRoles(other.userId(), Set.of("TRAINER"));
        trainerProfile(trainer.userId());
        trainerProfile(other.userId());
        Long camelId = ownedCamel(owner.userId());
        var ownerSession = login(owner.email());
        var trainerSession = login(trainer.email());
        var otherSession = login(other.email());
        var body = proposal(camelId, trainer.userId());

        mvc.perform(post("/api/agreements").with(csrf()).contentType("application/json").content(body))
                .andExpect(status().isUnauthorized());
        var created = mvc.perform(post("/api/agreements").session(ownerSession).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING_APPROVAL"))
                .andExpect(jsonPath("$.ownerUserId").value(owner.userId()))
                .andExpect(jsonPath("$.trainerUserId").value(trainer.userId()))
                .andReturn().getResponse().getContentAsString();
        Long id = json.readTree(created).get("agreementId").asLong();
        mvc.perform(post("/api/agreements").session(ownerSession).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().isConflict());
        mvc.perform(get("/api/agreements").session(ownerSession)).andExpect(status().isForbidden());
        mvc.perform(get("/api/agreements/mine").session(trainerSession))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].agreementId").value(id));
        mvc.perform(get("/api/agreements/" + id).session(otherSession)).andExpect(status().isForbidden());
        mvc.perform(post("/api/agreements/" + id + "/accept").session(ownerSession).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/agreements/" + id + "/accept").session(otherSession).with(csrf()))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/agreements/" + id + "/accept").session(trainerSession).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ACTIVE"));
        mvc.perform(post("/api/agreements/" + id + "/accept").session(trainerSession).with(csrf()))
                .andExpect(status().isConflict());
        mvc.perform(post("/api/agreements/" + id + "/terminate").session(ownerSession).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("TERMINATED"));
        mvc.perform(get("/api/agreements/" + id).session(trainerSession))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("TERMINATED"));
    }

    @Test
    void nonOwnerCannotProposeAndTrainerMayReject() throws Exception {
        var owner = register("agreement-owner-two@example.com");
        var intruder = register("agreement-intruder@example.com");
        var trainer = register("agreement-trainer-two@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(intruder.userId(), Set.of("OWNER"));
        users.updateRoles(trainer.userId(), Set.of("TRAINER"));
        trainerProfile(trainer.userId());
        Long camelId = ownedCamel(owner.userId());
        var body = proposal(camelId, trainer.userId());
        mvc.perform(post("/api/agreements").session(login(intruder.email())).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().isConflict());
        var result = mvc.perform(post("/api/agreements").session(login(owner.email())).with(csrf())
                .contentType("application/json").content(body)).andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Long id = json.readTree(result).get("agreementId").asLong();
        mvc.perform(post("/api/agreements/" + id + "/reject").session(login(trainer.email())).with(csrf()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REJECTED"));
        mvc.perform(post("/api/agreements/" + id + "/accept").session(login(trainer.email())).with(csrf()))
                .andExpect(status().isConflict());
        assertThat(profiles.existsById(trainer.userId())).isTrue();
    }

    @Test
    void invalidSharesAndDatesAreRejected() throws Exception {
        var owner = register("agreement-owner-three@example.com");
        var trainer = register("agreement-trainer-three@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(trainer.userId(), Set.of("TRAINER"));
        trainerProfile(trainer.userId());
        Long camelId = ownedCamel(owner.userId());
        mvc.perform(post("/api/agreements").session(login(owner.email())).with(csrf())
                .contentType("application/json")
                .content(payload(Map.of("camelId", camelId, "trainerUserId", trainer.userId(),
                        "feeOmr", 1, "prizeSharePct", 120, "saleSharePct", 15,
                        "startsAt", NOW.plusSeconds(3600).toString(),
                        "endsAt", NOW.plusSeconds(86400).toString()))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/agreements").session(login(owner.email())).with(csrf())
                .contentType("application/json")
                .content(payload(Map.of("camelId", camelId, "trainerUserId", trainer.userId(),
                        "feeOmr", 1, "prizeSharePct", 10, "saleSharePct", 15,
                        "startsAt", NOW.plusSeconds(86400).toString(),
                        "endsAt", NOW.plusSeconds(3600).toString()))).andExpect(status().isBadRequest());
    }
}
