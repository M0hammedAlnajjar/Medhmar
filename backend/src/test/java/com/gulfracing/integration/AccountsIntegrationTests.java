package com.gulfracing.integration;

import com.gulfracing.enums.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import java.util.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AccountsIntegrationTests extends IntegrationSupport {
    @Test
    void registrationUsesSelectedRoleNormalizesEmailAndHashesPassword() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json")
            .content(payload(Map.of("fullName","Mohammed","email","MOHAMMED@example.com","password",PASSWORD,
                "preferredLanguage","en","role","TRAINER","roles",List.of("ADMIN")))))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("mohammed@example.com"))
            .andExpect(jsonPath("$.roles", contains("TRAINER")))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.passwordHash").doesNotExist());
        var account = accountRepository.findByProviderAndProviderSubject(Provider.LOCAL,"mohammed@example.com").orElseThrow();
        assertThat(account.getPasswordHash()).isNotEqualTo(PASSWORD);
        assertThat(new BCryptPasswordEncoder().matches(PASSWORD, account.getPasswordHash())).isTrue();
        assertThat(roleRepository.count()).isEqualTo(5);
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json")
            .content(payload(Map.of("fullName","Other","email","mohammed@example.com","password",PASSWORD,"role","VIEWER"))))
            .andExpect(status().isConflict());
    }
    @Test
    void registrationRejectsMissingOrPrivilegedSelfAssignedRoles() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json")
            .content(payload(Map.of("fullName","No Role","email","norole@example.com","password",PASSWORD))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors.role").exists());

        for (String role : List.of("ADMIN", "ORGANIZER")) {
            mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json")
                .content(payload(Map.of("fullName","Blocked Role","email",role.toLowerCase(Locale.ROOT)+"@example.com",
                    "password",PASSWORD,"role",role))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.role").exists());
        }
        assertThat(userRepository.count()).isZero();
    }
    @Test
    void invalidRegistrationReturnsFieldErrors() throws Exception {
        mvc.perform(post("/api/auth/register").with(csrf()).contentType("application/json")
            .content(payload(Map.of("fullName","","email","invalid","password","short","role","VIEWER"))))
            .andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors.email").exists());
        assertThat(userRepository.count()).isZero();
    }
    @Test
    void realCsrfLoginRotatesSessionAndLogoutRevokesIt() throws Exception {
        register("session@example.com");
        var csrfResult = mvc.perform(get("/api/auth/csrf")).andExpect(status().isOk()).andReturn();
        var session = (MockHttpSession) csrfResult.getRequest().getSession(false);
        String oldSessionId = session.getId();
        var token = json.readTree(csrfResult.getResponse().getContentAsString());
        String oldToken = token.get("token").asText();
        String header = token.get("headerName").asText();
        mvc.perform(post("/api/auth/login").session(session).header(header, oldToken).contentType("application/json")
            .content(payload(Map.of("email","session@example.com","password",PASSWORD))))
            .andExpect(status().isOk());
        assertThat(session.getId()).isNotEqualTo(oldSessionId);
        mvc.perform(get("/api/users/me").session(session)).andExpect(status().isOk());
        mvc.perform(post("/api/auth/logout").session(session).header(header, oldToken)).andExpect(status().isForbidden());
        var next = mvc.perform(get("/api/auth/csrf").session(session)).andReturn();
        String newToken = json.readTree(next.getResponse().getContentAsString()).get("token").asText();
        mvc.perform(post("/api/auth/logout").session(session).header(header,newToken)).andExpect(status().isNoContent());
        assertThat(session.isInvalid()).isTrue();
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
    }
    @Test
    void loginRejectsWrongCredentialsAndMissingCsrf() throws Exception {
        register("login@example.com");
        String body = payload(Map.of("email","login@example.com","password","WrongPassword123!"));
        mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json").content(body))
            .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType("application/json").content(body))
            .andExpect(status().isForbidden());
    }
    @Test
    void viewerCannotManageUsersAndAdminRoleChangeRevokesOldSessions() throws Exception {
        MockHttpSession admin = admin();
        var viewer = register("viewer@example.com");
        var viewerSession = login(viewer.email());
        mvc.perform(get("/api/admin/users").session(viewerSession)).andExpect(status().isForbidden());
        mvc.perform(put("/api/admin/users/"+viewer.userId()+"/roles").session(viewerSession).with(csrf())
            .contentType("application/json").content(payload(Map.of("roles",List.of("ADMIN")))))
            .andExpect(status().isForbidden());
        mvc.perform(put("/api/admin/users/"+viewer.userId()+"/roles").session(admin).with(csrf())
            .contentType("application/json").content(payload(Map.of("roles",List.of("OWNER","TRAINER")))))
            .andExpect(status().isOk());
        mvc.perform(get("/api/users/me").session(viewerSession)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me").session(login(viewer.email())))
            .andExpect(status().isOk()).andExpect(jsonPath("$.roles",containsInAnyOrder("OWNER","TRAINER")));
    }
    @Test
    void suspendingAccountRevokesItsSessionAndPreventsLogin() throws Exception {
        MockHttpSession admin = admin();
        var user = register("disabled@example.com");
        var session = login(user.email());
        mvc.perform(put("/api/admin/users/"+user.userId()+"/status").session(admin).with(csrf())
            .contentType("application/json").content(payload(Map.of("status","SUSPENDED")))).andExpect(status().isOk());
        mvc.perform(get("/api/users/me").session(session)).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").with(csrf()).contentType("application/json")
            .content(payload(Map.of("email",user.email(),"password",PASSWORD)))).andExpect(status().isUnauthorized());
    }
    @Test
    void profileUpdatesDoNotChangeEmailOrRoles() throws Exception {
        var user = register("profile@example.com");
        mvc.perform(put("/api/users/me").session(login(user.email())).with(csrf()).contentType("application/json")
            .content(payload(Map.of("fullName","New Name","preferredLanguage","ar","email","other@example.com","roles",List.of("ADMIN")))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value("New Name"))
            .andExpect(jsonPath("$.email").value(user.email())).andExpect(jsonPath("$.roles",contains("VIEWER")));
    }
}
