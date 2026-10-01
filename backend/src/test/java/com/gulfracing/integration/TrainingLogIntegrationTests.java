package com.gulfracing.integration;

import com.gulfracing.dto.AgreementDtos;
import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.entity.TrainerProfile;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.TrainerProfileRepository;
import com.gulfracing.service.TrainingAgreementService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.util.Date;
import java.util.Map;
import java.util.Set;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TrainingLogIntegrationTests extends IntegrationSupport {
    @Autowired OwnershipRecordRepository ownerships;
    @Autowired TrainerProfileRepository profiles;
    @Autowired TrainingAgreementService agreementService;

    private Long ownedCamel(Long ownerId) {
        var camel = camel("Training Camel");
        camel.setStatus(CamelStatus.ACTIVE);
        camel.setIsActive(true);
        camelRepository.saveAndFlush(camel);
        var own = new OwnershipRecord();
        own.setCamel(camel);
        own.setOwner(userRepository.findById(ownerId).orElseThrow());
        own.setSharePercent(100.0);
        own.setStartAt(Date.from(NOW.minusSeconds(60)));
        own.setIsActive(true);
        own.setCreatedDate(Date.from(NOW.minusSeconds(60)));
        ownerships.saveAndFlush(own);
        return camel.getCamelId();
    }

    @Test
    void assignedCamelsAndTrainingSessionsAreScopedToTrainerAndOwner() throws Exception {
        var owner = register("log-owner@example.com");
        var trainer = register("log-trainer@example.com");
        var outsider = register("log-outsider@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(trainer.userId(), Set.of("TRAINER"));
        users.updateRoles(outsider.userId(), Set.of("TRAINER"));
        var profile = new TrainerProfile();
        profile.setUser(userRepository.findById(trainer.userId()).orElseThrow());
        profiles.saveAndFlush(profile);
        Long camelId = ownedCamel(owner.userId());

        var request = new AgreementDtos.Create(camelId, trainer.userId(), new BigDecimal("20.000"),
                new BigDecimal("10.00"), new BigDecimal("5.00"), NOW, NOW.plusSeconds(86400));
        var agreement = agreementService.propose(request, owner.userId());
        var pendingId = agreement.agreementId();
        var trainerSession = login(trainer.email());
        var ownerSession = login(owner.email());
        var outsideSession = login(outsider.email());

        mvc.perform(get("/api/agreements/assigned").session(trainerSession))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
        var pendingBody = payload(Map.of("agreementId", pendingId, "sessionAt", NOW.toString(),
                "durationMinutes", 60, "notes", "Warm-up and endurance"));
        mvc.perform(post("/api/training-logs").session(trainerSession).with(csrf())
                .contentType("application/json").content(pendingBody)).andExpect(status().isConflict());

        agreementService.accept(pendingId, trainer.userId());
        mvc.perform(get("/api/agreements/assigned").session(trainerSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].camelId").value(camelId))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"));
        mvc.perform(get("/api/agreements/assigned").session(ownerSession))
                .andExpect(status().isForbidden());

        mvc.perform(post("/api/training-logs").session(ownerSession).with(csrf())
                .contentType("application/json").content(pendingBody)).andExpect(status().isForbidden());
        mvc.perform(post("/api/training-logs").session(outsideSession).with(csrf())
                .contentType("application/json").content(pendingBody)).andExpect(status().isForbidden());

        mvc.perform(post("/api/training-logs").session(trainerSession).with(csrf())
                .contentType("application/json").content(pendingBody)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.durationMinutes").value(60))
                .andExpect(jsonPath("$.agreementId").value(pendingId));

        mvc.perform(get("/api/training-logs/agreement/" + pendingId).session(ownerSession))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].notes").value("Warm-up and endurance"));
        mvc.perform(get("/api/training-logs/agreement/" + pendingId).session(outsideSession))
                .andExpect(status().isForbidden());

        var futureBody = payload(Map.of("agreementId", pendingId,
                "sessionAt", NOW.plusSeconds(10).toString(), "durationMinutes", 20, "notes", "Future session"));
        mvc.perform(post("/api/training-logs").session(trainerSession).with(csrf())
                .contentType("application/json").content(futureBody)).andExpect(status().isBadRequest());

        agreementService.terminate(pendingId, owner.userId());
        mvc.perform(post("/api/training-logs").session(trainerSession).with(csrf())
                .contentType("application/json").content(pendingBody)).andExpect(status().isConflict());
    }
}
