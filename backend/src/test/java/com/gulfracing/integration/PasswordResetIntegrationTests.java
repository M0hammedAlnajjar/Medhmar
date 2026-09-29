package com.gulfracing.integration;

import com.gulfracing.exception.ApiException;
import com.gulfracing.service.PasswordResetService;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import java.util.Map;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class PasswordResetIntegrationTests extends IntegrationSupport {
    @Test
    void resetResponsesDoNotDiscloseAccountsOrTokensAndRequestsAreThrottled() throws Exception {
        register("reset@example.com");
        var known = mvc.perform(post("/api/auth/forgot-password").with(csrf()).contentType("application/json")
            .content(payload(Map.of("email","reset@example.com")))).andExpect(status().isOk()).andReturn();
        var unknown = mvc.perform(post("/api/auth/forgot-password").with(csrf()).contentType("application/json")
            .content(payload(Map.of("email","absent@example.com")))).andExpect(status().isOk()).andReturn();
        assertThat(known.getResponse().getContentAsString()).isEqualTo(unknown.getResponse().getContentAsString()).doesNotContain("token");
        var token = ArgumentCaptor.forClass(String.class);
        verify(mail, timeout(2000)).send(eq("reset@example.com"),token.capture());
        assertThat(token.getValue()).hasSize(43);
        var stored = resetRepository.findAll().getFirst();
        assertThat(stored.getTokenHash()).isEqualTo(PasswordResetService.hash(token.getValue())).hasSize(64);
        assertThat(stored.getExpiresAt()).isEqualTo(NOW.plusSeconds(1800));
        resets.requestReset("reset@example.com");
        assertThat(resetRepository.count()).isEqualTo(1);
    }
    @Test
    void resetChangesPasswordOnceAndRevokesExistingSessions() throws Exception {
        var user = register("reset@example.com");
        var oldSession = login(user.email());
        String token = issueToken(user.email());
        String newPassword = "ReplacementPassword123!";
        mvc.perform(post("/api/auth/reset-password").with(csrf()).contentType("application/json")
            .content(payload(Map.of("token",token,"password",newPassword)))).andExpect(status().isOk());
        mvc.perform(get("/api/users/me").session(oldSession)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
            .content(payload(Map.of("email",user.email(),"password",PASSWORD)))).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
            .content(payload(Map.of("email",user.email(),"password",newPassword)))).andExpect(status().isOk());
        assertThatThrownBy(() -> resets.reset(token,"AnotherPassword123!")).isInstanceOf(ApiException.class);
    }
    @Test
    void expiredAndInvalidTokensCannotChangeThePassword() throws Exception {
        register("reset@example.com");
        String token = issueToken("reset@example.com");
        var stored = resetRepository.findByTokenHash(PasswordResetService.hash(token)).orElseThrow();
        stored.setExpiresAt(NOW.minusSeconds(1));
        resetRepository.saveAndFlush(stored);
        assertThatThrownBy(() -> resets.reset(token,"ReplacementPassword123!")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> resets.reset("a".repeat(43),"ReplacementPassword123!")).isInstanceOf(ApiException.class);
        login("reset@example.com");
    }
    String issueToken(String email) {
        resets.requestReset(email);
        var token = ArgumentCaptor.forClass(String.class);
        verify(mail, timeout(2000)).send(eq(email),token.capture());
        return token.getValue();
    }
}
