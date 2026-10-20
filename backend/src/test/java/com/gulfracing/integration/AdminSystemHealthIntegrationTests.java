package com.gulfracing.integration;

import com.gulfracing.service.AdminSystemHealthService;
import com.gulfracing.repository.ChallengeRepository;
import com.gulfracing.repository.VoteRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Clock;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AdminSystemHealthIntegrationTests extends IntegrationSupport {
    @Test
    void adminCanProbeDatabaseAndReadRealChallengeAndVoteCounts() throws Exception {
        var session = admin();
        var actor = userRepository.findByEmail("admin@example.com").orElseThrow();
        var first = camel("Al Barq");
        var second = camel("Shaheen");
        var challenge = openChallenge(actor.getUserId(), first.getCamelId(), second.getCamelId());
        var voter = register("health-voter@example.com");
        challenges.vote(challenge.challengeId(), first.getCamelId(), voter.userId());

        var result = mvc.perform(get("/api/admin/system-health").session(session))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.backendStatus").value("RESPONDING"))
            .andExpect(jsonPath("$.databaseStatus").value("CONNECTED"))
            .andExpect(jsonPath("$.totalChallenges").value(1))
            .andExpect(jsonPath("$.totalVotes").value(1))
            .andExpect(jsonPath("$.checkedAt").exists())
            .andReturn();
        var jsonBody = result.getResponse().getContentAsString();
        assertThat(jsonBody).doesNotContain("jdbc:", "password", "host", "username");
    }

    @Test
    void guestsAndNonAdminsCannotReadConnectivityOrCounts() throws Exception {
        var viewer = register("health-viewer@example.com");
        mvc.perform(get("/api/admin/system-health")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/system-health").session(login(viewer.email())))
            .andExpect(status().isForbidden());
    }

    @Test
    void failedDbProbeReturnsSafeDisconnectedStatusWithUnavailableCounts() {
        var mockedJdbc = mock(JdbcTemplate.class);
        when(mockedJdbc.queryForObject("SELECT 1", Integer.class))
            .thenThrow(new DataAccessResourceFailureException("jdbc:secret-host/password=private"));
        var service = new AdminSystemHealthService(
            mockedJdbc, mock(ChallengeRepository.class), mock(VoteRepository.class), Clock.systemUTC());
        var result = service.check();
        assertThat(result.backendStatus()).isEqualTo("RESPONDING");
        assertThat(result.databaseStatus()).isEqualTo("DISCONNECTED");
        assertThat(result.totalChallenges()).isNull();
        assertThat(result.totalVotes()).isNull();
    }
}
