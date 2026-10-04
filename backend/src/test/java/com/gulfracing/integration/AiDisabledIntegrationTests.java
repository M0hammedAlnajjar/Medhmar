package com.gulfracing.integration;

import org.junit.jupiter.api.Test;
import java.util.Map;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AiDisabledIntegrationTests extends IntegrationSupport {
    @Test
    void backendStartsWithoutCredentialsAndAssistantReportsUnavailable() throws Exception {
        var user = register("ai-disabled@example.com");
        var session = login(user.email());
        mvc.perform(get("/api/ai/status").session(session)).andExpect(status().isOk())
                .andExpect(jsonPath("$.available").value(false));
        mvc.perform(post("/api/ai/chat").session(session).with(csrf()).contentType("application/json")
                .content(payload(Map.of("question", "كيف أسجل؟"))))
                .andExpect(status().isServiceUnavailable()).andExpect(jsonPath("$.code").value("AI_NOT_CONFIGURED"));
        mvc.perform(get("/api/users/me").session(session)).andExpect(status().isOk());
    }
}
