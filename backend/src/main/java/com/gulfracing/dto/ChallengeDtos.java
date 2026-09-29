package com.gulfracing.dto;

import com.gulfracing.enums.ChallengeStatus;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class ChallengeDtos {
    private ChallengeDtos() {}
    public record ChallengeRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull Instant opensAt,
        @NotNull Instant closesAt
    ) {}
    public record VoteRequest(@NotNull @Positive Long camelId) {}
    public record CamelResult(Long camelId, String name, String photoUrl, long voteCount, BigDecimal votePercent) {}
    public record ChallengeResponse(Long challengeId, String title, Instant opensAt, Instant closesAt,
        ChallengeStatus status, Long creatorId, long totalVotes, List<CamelResult> camels) {}
    public record VoteResponse(Long voteId, Long challengeId, Long camelId, Instant votedAt) {}
}
