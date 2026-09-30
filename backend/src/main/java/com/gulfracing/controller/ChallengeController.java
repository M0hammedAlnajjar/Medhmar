package com.gulfracing.controller;

import com.gulfracing.dto.ChallengeDtos.*;
import com.gulfracing.dto.PageResponse;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.ChallengeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/challenges")
@RequiredArgsConstructor
public class ChallengeController {
    private final ChallengeService challenges;

    @GetMapping
    public PageResponse<ChallengeResponse> list(@RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return challenges.list(page, size);
    }
    @GetMapping("/mine")
    public PageResponse<ChallengeResponse> mine(Authentication auth,
        @RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return challenges.mine(AccountAccess.requiredId(auth), page, size);
    }
    @GetMapping({"/{id}", "/{id}/results"})
    public ChallengeResponse get(@PathVariable @Positive Long id, Authentication auth) {
        return challenges.get(id, AccountAccess.optionalId(auth));
    }
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ChallengeResponse create(Authentication auth, @Valid @RequestBody ChallengeRequest request) {
        return challenges.create(AccountAccess.requiredId(auth), request);
    }
    @PutMapping("/{id}")
    public ChallengeResponse update(@PathVariable @Positive Long id, Authentication auth,
        @Valid @RequestBody ChallengeRequest request) {
        return challenges.update(id, AccountAccess.requiredId(auth), request);
    }
    @PutMapping("/{id}/camels/{camelId}")
    public ChallengeResponse add(@PathVariable @Positive Long id, @PathVariable @Positive Long camelId, Authentication auth) {
        return challenges.addCamel(id, camelId, AccountAccess.requiredId(auth));
    }
    @DeleteMapping("/{id}/camels/{camelId}")
    public ChallengeResponse remove(@PathVariable @Positive Long id, @PathVariable @Positive Long camelId, Authentication auth) {
        return challenges.removeCamel(id, camelId, AccountAccess.requiredId(auth));
    }
    @PostMapping("/{id}/open")
    public ChallengeResponse open(@PathVariable @Positive Long id, Authentication auth) {
        return challenges.open(id, AccountAccess.requiredId(auth));
    }
    @PostMapping("/{id}/close")
    public ChallengeResponse close(@PathVariable @Positive Long id, Authentication auth) {
        return challenges.close(id, AccountAccess.requiredId(auth));
    }
    @PostMapping("/{id}/votes")
    @ResponseStatus(HttpStatus.CREATED)
    public VoteResponse vote(@PathVariable @Positive Long id, Authentication auth,
        @Valid @RequestBody VoteRequest request) {
        return challenges.vote(id, request.camelId(), AccountAccess.requiredId(auth));
    }
}
