package com.gulfracing.controller;

import com.gulfracing.dto.ChallengeDtos.ChallengeResponse;
import com.gulfracing.dto.ChallengeDtos.StreamRequest;
import com.gulfracing.dto.OrganizationDtos.View;
import com.gulfracing.dto.PageResponse;
import com.gulfracing.service.ChallengeService;
import com.gulfracing.service.OrganizationService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

// Administrative discovery only. Mutations reuse the existing service-protected endpoints.
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminModulesController {
    private final ChallengeService challenges;
    private final OrganizationService organizations;

    @GetMapping("/challenges")
    public PageResponse<ChallengeResponse> challenges(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return challenges.adminList(page, size);
    }

    @PutMapping("/challenges/{id}/stream")
    public ChallengeResponse updateStream(@PathVariable @Positive Long id,
            @Valid @RequestBody StreamRequest request) {
        return challenges.updateStream(id, request.url());
    }

    @GetMapping("/organizations")
    public PageResponse<View> organizations(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return organizations.adminList(page, size);
    }
}
