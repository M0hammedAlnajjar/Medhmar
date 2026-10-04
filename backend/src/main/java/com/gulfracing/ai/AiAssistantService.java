package com.gulfracing.ai;

import com.gulfracing.dto.AiDtos;
import com.gulfracing.exception.ApiException;
import com.gulfracing.service.UserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Service
public class AiAssistantService {
    private static final Logger log = LoggerFactory.getLogger(AiAssistantService.class);
    private final AiModelGateway model;
    private final AiKnowledgeService knowledge;
    private final AiRequestLimiter limiter;
    private final UserService users;
    private final boolean enabled;
    private final String policy;

    public AiAssistantService(AiModelGateway model, AiKnowledgeService knowledge,
            AiRequestLimiter limiter, UserService users,
            @Value("${app.ai.enabled:false}") boolean enabled,
            @Value("classpath:ai/assistant-policy.txt") Resource policy) throws IOException {
        this.model = model;
        this.knowledge = knowledge;
        this.limiter = limiter;
        this.users = users;
        this.enabled = enabled;
        this.policy = policy.getContentAsString(StandardCharsets.UTF_8);
    }

    public AiDtos.Status status() {
        return new AiDtos.Status(enabled && model.available(), List.of("ar", "en"), 2000);
    }

    public AiDtos.ChatResponse chat(AiDtos.ChatRequest request, Long actorId) {
        users.getActive(actorId);
        if (!status().available()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AI_NOT_CONFIGURED",
                    "The assistant is not enabled. Please contact the platform administrator.");
        }
        String language = request.language() == null ? "ar" : request.language();
        try (var permit = limiter.acquire(actorId)) {
            var context = knowledge.context(request);
            String instructions = policy + "\nResponse language: "
                    + ("ar".equals(language) ? "Arabic" : "English")
                    + "\n\nAPPROVED PLATFORM GUIDE:\n" + knowledge.guide();
            String answer;
            // The read transaction has ended before this potentially slow network call.
            try {
                answer = model.answer(instructions, context.json());
            } catch (RuntimeException failure) {
                // Never log provider exception text, prompts, answers, credentials or PII.
                log.warn("AI provider request failed ({})", failure.getClass().getSimpleName());
                throw providerFailure();
            }
            if (answer == null || answer.isBlank() || answer.length() > 12000) throw providerFailure();
            return new AiDtos.ChatResponse(answer.strip(), language, context.sources());
        }
    }

    private static ApiException providerFailure() {
        return new ApiException(HttpStatus.BAD_GATEWAY, "AI_PROVIDER_UNAVAILABLE",
                "The assistant could not answer right now. Please try again later.");
    }
}
