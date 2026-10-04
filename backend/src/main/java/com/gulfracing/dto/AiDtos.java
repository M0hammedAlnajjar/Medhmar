package com.gulfracing.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;

public final class AiDtos {
    private AiDtos() {}

    public record ChatRequest(
            @NotBlank @Size(max = 2000) String question,
            @Pattern(regexp = "ar|en") String language,
            @Positive Long raceId,
            @Positive Long camelId
    ) {}

    public record Source(String id, String label, String path) {}
    public record ChatResponse(String answer, String language, List<Source> sources) {}
    public record Status(boolean available, List<String> languages, int maxQuestionLength) {}
    public record Guide(String content) {}
}
