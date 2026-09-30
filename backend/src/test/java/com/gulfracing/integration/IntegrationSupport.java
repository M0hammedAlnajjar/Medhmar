package com.gulfracing.integration;

import com.gulfracing.dto.AuthDtos.RegisterRequest;
import com.gulfracing.dto.UserDtos.UserResponse;
import com.gulfracing.dto.ChallengeDtos.*;
import com.gulfracing.entity.Camel;
import com.gulfracing.repository.*;
import com.gulfracing.service.*;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.*;
import tools.jackson.databind.ObjectMapper;
import java.time.*;
import java.util.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
abstract class IntegrationSupport {
    protected static final String PASSWORD = "StrongPassword123!";
    protected static final Instant NOW = Instant.parse("2030-01-01T10:00:00Z");
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserService users;
    @Autowired ChallengeService challenges;
    @Autowired PasswordResetService resets;
    @Autowired GoogleAccountService googleAccounts;
    @Autowired UserRepository userRepository;
    @Autowired RoleRepository roleRepository;
    @Autowired AuthAccountRepository accountRepository;
    @Autowired PasswordResetRepository resetRepository;
    @Autowired CamelRepository camelRepository;
    @Autowired VoteRepository voteRepository;
    @Autowired ChallengeRepository challengeRepository;
    @Autowired JdbcTemplate jdbc;
    @MockitoBean Clock clock;
    @MockitoBean ResetMailSender mail;

    @BeforeEach
    void cleanDatabase() {
        for (String table : List.of("votes","challenge_camels","challenges","race_results","race_entries","races","offer","market_place",
            "ownership_record","pedigree","trainer_profile","password_resets","auth_accounts","user_roles","users","camel"))
            jdbc.update("DELETE FROM " + table);
        when(clock.instant()).thenReturn(NOW);
    }
    UserResponse register(String email) {
        return users.register(new RegisterRequest("Test User", email, PASSWORD, "en"));
    }
    MockHttpSession login(String email) throws Exception {
        var result = mvc.perform(post("/api/auth/login").with(csrf())
            .contentType("application/json").content(json.writeValueAsString(Map.of("email", email, "password", PASSWORD))))
            .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }
    MockHttpSession admin() throws Exception {
        var user = register("admin@example.com");
        users.updateRoles(user.userId(), Set.of("ADMIN"));
        return login(user.email());
    }
    Camel camel(String name) {
        var camel = new Camel();
        camel.setName(name);
        return camelRepository.saveAndFlush(camel);
    }
    ChallengeResponse draft(Long ownerId) {
        return challenges.create(ownerId, new ChallengeRequest("Test Challenge", NOW.minusSeconds(60), NOW.plusSeconds(3600)));
    }
    ChallengeResponse openChallenge(Long ownerId, Long first, Long second) {
        var challenge = draft(ownerId);
        challenges.addCamel(challenge.challengeId(), first, ownerId);
        challenges.addCamel(challenge.challengeId(), second, ownerId);
        return challenges.open(challenge.challengeId(), ownerId);
    }
    String payload(Object value) { return json.writeValueAsString(value); }
}
