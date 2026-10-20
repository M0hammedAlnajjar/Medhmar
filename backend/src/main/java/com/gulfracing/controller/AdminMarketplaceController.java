package com.gulfracing.controller;

import com.gulfracing.dto.AdminMarketplaceDtos.*;
import com.gulfracing.dto.PageResponse;
import com.gulfracing.enums.MarketPlaceStatus;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.AdminMarketplaceService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** ADMIN-only moderation of the existing marketplace (also enforced by SecurityConfig and the service). */
@RestController
@RequestMapping("/api/admin/marketplace")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminMarketplaceController {
    private final AdminMarketplaceService marketplace;

    @GetMapping
    public PageResponse<ListingView> list(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size,
            @RequestParam(required = false) @Size(max = 100) String search,
            @RequestParam(required = false) MarketPlaceStatus status,
            @RequestParam(required = false) @Size(max = 100) String category,
            @RequestParam(defaultValue = "newest") @Size(max = 20) String sort,
            Authentication auth) {
        return PageResponse.from(marketplace.list(AccountAccess.requiredId(auth), page, size,
                search, status, category, sort), v -> v);
    }

    @GetMapping("/stats")
    public Stats stats(Authentication auth) {
        return marketplace.stats(AccountAccess.requiredId(auth));
    }

    @GetMapping("/categories")
    public List<String> categories(Authentication auth) {
        return marketplace.categories(AccountAccess.requiredId(auth));
    }

    @GetMapping("/{id}")
    public ListingView get(@PathVariable @Positive Long id, Authentication auth) {
        return marketplace.get(AccountAccess.requiredId(auth), id);
    }

    @PutMapping("/{id}")
    public ListingView update(@PathVariable @Positive Long id,
                              @Valid @RequestBody UpdateRequest request, Authentication auth) {
        return marketplace.update(AccountAccess.requiredId(auth), id,
                request.askingPriceOmr(), request.description());
    }

    @PostMapping("/{id}/approve")
    public ListingView approve(@PathVariable @Positive Long id, Authentication auth) {
        return marketplace.approve(AccountAccess.requiredId(auth), id);
    }

    @PostMapping("/{id}/reject")
    public ListingView reject(@PathVariable @Positive Long id,
                              @Valid @RequestBody(required = false) DecisionRequest request, Authentication auth) {
        return marketplace.reject(AccountAccess.requiredId(auth), id,
                request == null ? null : request.reason());
    }

    @PutMapping("/{id}/status")
    public ListingView status(@PathVariable @Positive Long id,
                              @Valid @RequestBody StatusRequest request, Authentication auth) {
        return marketplace.changeStatus(AccountAccess.requiredId(auth), id,
                request.status(), request.reason());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remove(@PathVariable @Positive Long id,
                                       @RequestParam(required = false) @Size(max = 500) String reason,
                                       Authentication auth) {
        marketplace.remove(AccountAccess.requiredId(auth), id, reason);
        return ResponseEntity.noContent().build();
    }
}
