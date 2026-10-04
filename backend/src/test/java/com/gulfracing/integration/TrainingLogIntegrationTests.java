package com.gulfracing.integration;

import com.gulfracing.entity.TrainerProfile;
import com.gulfracing.entity.TrainingAgreement;
import com.gulfracing.enums.AgreementStatus;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.repository.TrainerProfileRepository;
import com.gulfracing.repository.TrainingAgreementRepository;
import com.gulfracing.repository.TrainingLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class TrainingLogIntegrationTests extends IntegrationSupport {

    @Autowired TrainingAgreementRepository agreements;
    @Autowired TrainingLogRepository logs;
    @Autowired TrainerProfileRepository trainerProfiles;

    private record Fixture(
            Long agreementId,
            Long ownerId,
            String ownerEmail,
            Long trainerId,
            String trainerEmail
    ) {}

    private Fixture activeAgreement() {
        var owner = register("training-log-owner@example.com");
        var trainer = register("training-log-trainer@example.com");
        users.updateRoles(owner.userId(), Set.of("OWNER"));
        users.updateRoles(trainer.userId(), Set.of("TRAINER"));

        var profile = new TrainerProfile();
        profile.setUser(userRepository.findById(trainer.userId()).orElseThrow());
        profile.setBio("Training log test trainer");
        profile.setLocation("Muscat");
        trainerProfiles.saveAndFlush(profile);

        var camel = camel("Training Log Camel");
        camel.setStatus(CamelStatus.ACTIVE);
        camel.setIsActive(true);
        camelRepository.saveAndFlush(camel);

        var agreement = new TrainingAgreement();
        agreement.setOwner(userRepository.findById(owner.userId()).orElseThrow());
        agreement.setTrainer(profile);
        agreement.setCamel(camel);
        agreement.setFeeOmr(new BigDecimal("25.500"));
        agreement.setPrizeSharePct(new BigDecimal("10.00"));
        agreement.setSaleSharePct(new BigDecimal("5.00"));
        agreement.setStartsAt(NOW.minusSeconds(3600));
        agreement.setEndsAt(NOW.plusSeconds(3600));
        agreement.setProposedAt(NOW.minusSeconds(7200));
        agreement.setRespondedAt(NOW.minusSeconds(3600));
        agreement.setAcceptedAt(NOW.minusSeconds(3600));
        agreement.setStatus(AgreementStatus.ACTIVE);
        agreements.saveAndFlush(agreement);

        return new Fixture(
                agreement.getAgreementId(),
                owner.userId(),
                owner.email(),
                trainer.userId(),
                trainer.email()
        );
    }

    private String logPayload(Long agreementId, String sessionAt, int duration, String notes) {
        return payload(Map.of(
                "agreementId", agreementId,
                "sessionAt", sessionAt,
                "durationMinutes", duration,
                "notes", notes
        ));
    }

    @Test
    void designatedTrainerCreatesLogAndParticipantsCanReadIt() throws Exception {
        var fixture = activeAgreement();
        var trainerSession = login(fixture.trainerEmail());
        var ownerSession = login(fixture.ownerEmail());

        mvc.perform(post("/api/training-logs")
                        .session(trainerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(logPayload(
                                fixture.agreementId(),
                                NOW.minusSeconds(600).toString(),
                                45,
                                " Endurance training "
                        )))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.agreementId").value(fixture.agreementId()))
                .andExpect(jsonPath("$.trainerUserId").value(fixture.trainerId()))
                .andExpect(jsonPath("$.ownerUserId").value(fixture.ownerId()))
                .andExpect(jsonPath("$.durationMinutes").value(45))
                .andExpect(jsonPath("$.notes").value("Endurance training"));

        mvc.perform(get("/api/training-logs/agreement/" + fixture.agreementId())
                        .session(ownerSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].agreementId").value(fixture.agreementId()))
                .andExpect(jsonPath("$[0].notes").value("Endurance training"));

        mvc.perform(get("/api/training-logs/agreement/" + fixture.agreementId())
                        .session(trainerSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].durationMinutes").value(45));

        assertThat(logs.count()).isEqualTo(1);
    }

    @Test
    void onlyDesignatedTrainerMayAppendAndOnlyParticipantsMayRead() throws Exception {
        var fixture = activeAgreement();
        var otherTrainer = register("training-log-other-trainer@example.com");
        users.updateRoles(otherTrainer.userId(), Set.of("TRAINER"));
        var otherTrainerSession = login(otherTrainer.email());

        mvc.perform(post("/api/training-logs")
                        .session(otherTrainerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(logPayload(
                                fixture.agreementId(),
                                NOW.minusSeconds(300).toString(),
                                30,
                                "Unauthorized attempt"
                        )))
                .andExpect(status().isForbidden());

        var viewer = register("training-log-viewer@example.com");
        var viewerSession = login(viewer.email());
        mvc.perform(get("/api/training-logs/agreement/" + fixture.agreementId())
                        .session(viewerSession))
                .andExpect(status().isForbidden());

        var ownerSession = login(fixture.ownerEmail());
        mvc.perform(post("/api/training-logs")
                        .session(ownerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(logPayload(
                                fixture.agreementId(),
                                NOW.minusSeconds(300).toString(),
                                30,
                                "Owner cannot append"
                        )))
                .andExpect(status().isForbidden());

        assertThat(logs.count()).isZero();
    }

    @Test
    void invalidTimesDurationAndInactiveAgreementAreRejected() throws Exception {
        var fixture = activeAgreement();
        var trainerSession = login(fixture.trainerEmail());

        mvc.perform(post("/api/training-logs")
                        .session(trainerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(logPayload(
                                fixture.agreementId(),
                                NOW.plusSeconds(60).toString(),
                                30,
                                "Future session"
                        )))
                .andExpect(status().isBadRequest());

        mvc.perform(post("/api/training-logs")
                        .session(trainerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(logPayload(
                                fixture.agreementId(),
                                NOW.minusSeconds(300).toString(),
                                0,
                                "Invalid duration"
                        )))
                .andExpect(status().isBadRequest());

        var agreement = agreements.findById(fixture.agreementId()).orElseThrow();
        agreement.setStatus(AgreementStatus.TERMINATED);
        agreement.setTerminatedAt(NOW);
        agreements.saveAndFlush(agreement);

        mvc.perform(post("/api/training-logs")
                        .session(trainerSession)
                        .with(csrf())
                        .contentType("application/json")
                        .content(logPayload(
                                fixture.agreementId(),
                                NOW.minusSeconds(300).toString(),
                                30,
                                "Inactive agreement"
                        )))
                .andExpect(status().isConflict());

        assertThat(logs.count()).isZero();
    }
}
