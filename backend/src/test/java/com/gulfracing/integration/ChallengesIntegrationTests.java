package com.gulfracing.integration;

import com.gulfracing.dto.ChallengeDtos.*;
import com.gulfracing.exception.ApiException;
import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class ChallengesIntegrationTests extends IntegrationSupport {
    @Test
    void draftIsPrivateAndOnlyCreatorCanEdit() throws Exception {
        var owner = register("owner@example.com");
        var other = register("other@example.com");
        var draft = draft(owner.userId());
        String url = "/api/challenges/" + draft.challengeId();
        mvc.perform(get(url)).andExpect(status().isNotFound());
        mvc.perform(get(url).session(login(owner.email()))).andExpect(status().isOk());
        mvc.perform(put(url).session(login(other.email())).with(csrf()).contentType("application/json")
            .content(payload(new ChallengeRequest("Changed",NOW,NOW.plusSeconds(60))))).andExpect(status().isForbidden());
        mvc.perform(get("/api/challenges")).andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(0));
    }
    @Test
    void openingRequiresTwoDifferentCamelsAndPublishedEntriesCannotChange() {
        var owner = register("owner@example.com");
        var first = camel("First"); var second = camel("Second"); var third = camel("Third");
        var draft = draft(owner.userId()); long id = draft.challengeId();
        challenges.addCamel(id,first.getCamelId(),owner.userId());
        challenges.addCamel(id,first.getCamelId(),owner.userId());
        assertThatThrownBy(() -> challenges.open(id,owner.userId())).isInstanceOf(ApiException.class);
        challenges.addCamel(id,second.getCamelId(),owner.userId());
        assertThatThrownBy(() -> challenges.addCamel(id,third.getCamelId(),owner.userId())).isInstanceOf(ApiException.class);
        challenges.open(id,owner.userId());
        assertThatThrownBy(() -> challenges.removeCamel(id,first.getCamelId(),owner.userId())).isInstanceOf(ApiException.class);
    }
    @Test
    void usersVoteOnceAndResultsAreCalculatedFromStoredVotes() throws Exception {
        var owner = register("owner@example.com"); var voter = register("voter@example.com");
        var first = camel("First"); var second = camel("Second");
        var challenge = openChallenge(owner.userId(),first.getCamelId(),second.getCamelId());
        var session = login(voter.email());
        String url = "/api/challenges/"+challenge.challengeId()+"/votes";
        mvc.perform(post(url).session(session).with(csrf()).contentType("application/json")
            .content(payload(Map.of("camelId",first.getCamelId(),"userId",owner.userId()))))
            .andExpect(status().isCreated());
        mvc.perform(post(url).session(session).with(csrf()).contentType("application/json")
            .content(payload(Map.of("camelId",second.getCamelId())))).andExpect(status().isConflict());
        challenges.vote(challenge.challengeId(),second.getCamelId(),owner.userId());
        var result = challenges.get(challenge.challengeId(),null);
        assertThat(result.totalVotes()).isEqualTo(2);
        assertThat(result.camels()).allSatisfy(c -> {
            assertThat(c.voteCount()).isEqualTo(1);
            assertThat(c.votePercent()).isEqualByComparingTo("50.00");
        });
        assertThat(voteRepository.existsByUser_UserIdAndChallengeCamel_Id_ChallengeId(voter.userId(),challenge.challengeId())).isTrue();
    }
    @Test
    void votingRejectsAnonymousUsersForeignCamelsAndClosedChallenges() throws Exception {
        var user = register("user@example.com");
        var first = camel("First"); var second = camel("Second"); var outsider = camel("Outside");
        var challenge = openChallenge(user.userId(),first.getCamelId(),second.getCamelId());
        String url = "/api/challenges/"+challenge.challengeId()+"/votes";
        mvc.perform(post(url).with(csrf()).contentType("application/json")
            .content(payload(Map.of("camelId",first.getCamelId())))).andExpect(status().isUnauthorized());
        assertThatThrownBy(() -> challenges.vote(challenge.challengeId(),outsider.getCamelId(),user.userId())).isInstanceOf(ApiException.class);
        challenges.close(challenge.challengeId(),user.userId());
        assertThatThrownBy(() -> challenges.vote(challenge.challengeId(),first.getCamelId(),user.userId())).isInstanceOf(ApiException.class);
    }
    @Test
    void votingWindowIncludesOpeningButExcludesClosing() {
        var user = register("user@example.com");
        var first = camel("First"); var second = camel("Second");
        var draft = challenges.create(user.userId(),new ChallengeRequest("Scheduled",NOW.plusSeconds(60),NOW.plusSeconds(120)));
        long id = draft.challengeId();
        challenges.addCamel(id,first.getCamelId(),user.userId());
        challenges.addCamel(id,second.getCamelId(),user.userId());
        challenges.open(id,user.userId());
        assertThatThrownBy(() -> challenges.vote(id,first.getCamelId(),user.userId())).isInstanceOf(ApiException.class);
        org.mockito.Mockito.when(clock.instant()).thenReturn(NOW.plusSeconds(60));
        challenges.vote(id,first.getCamelId(),user.userId());
        var other = register("other@example.com");
        org.mockito.Mockito.when(clock.instant()).thenReturn(NOW.plusSeconds(120));
        assertThatThrownBy(() -> challenges.vote(id,second.getCamelId(),other.userId())).isInstanceOf(ApiException.class);
        assertThat(challenges.get(id,null).status()).isEqualTo(com.gulfracing.enums.ChallengeStatus.CLOSED);
    }
    @Test
    void datesAndPaginationAreValidated() throws Exception {
        var user = register("user@example.com");
        mvc.perform(post("/api/challenges").session(login(user.email())).with(csrf()).contentType("application/json")
            .content(payload(new ChallengeRequest("Invalid",NOW.plusSeconds(100),NOW.plusSeconds(20)))))
            .andExpect(status().isBadRequest());
        mvc.perform(get("/api/challenges?size=1000")).andExpect(status().isBadRequest());
    }
}
