package com.gulfracing.controller;

import com.gulfracing.ai.AiAssistantService;
import com.gulfracing.ai.AiKnowledgeService;
import com.gulfracing.dto.AiDtos;
import com.gulfracing.security.AccountAccess;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {
    private final AiAssistantService assistant;
    private final AiKnowledgeService knowledge;

    @GetMapping("/status")
    public AiDtos.Status status() { return assistant.status(); }

    @GetMapping("/guide")
    public AiDtos.Guide guide() { return new AiDtos.Guide(knowledge.guide()); }

    @PostMapping("/chat")
    public AiDtos.ChatResponse chat(@Valid @RequestBody AiDtos.ChatRequest request,
            Authentication authentication) {
        return assistant.chat(request, AccountAccess.requiredId(authentication));
    }
}
