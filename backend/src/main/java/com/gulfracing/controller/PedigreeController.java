package com.gulfracing.controller;

import com.gulfracing.dto.PedigreeDTO;
import com.gulfracing.dto.PedigreeTreeDTO;
import com.gulfracing.dto.PedigreeUpdateRequest;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.PedigreeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/camel")
@RequiredArgsConstructor
public class PedigreeController {

    private final PedigreeService pedigrees;

    // Public ancestry details, including legacy names where parents are not registered.
    @GetMapping("/{camelId}/pedigree")
    public PedigreeDTO get(@PathVariable Long camelId) {
        return pedigrees.get(camelId);
    }

    // Public ancestry tree, with a bounded depth to avoid unbounded recursive responses.
    @GetMapping("/{camelId}/pedigree/tree")
    public PedigreeTreeDTO tree(
            @PathVariable Long camelId,
            @RequestParam(defaultValue = "3") int generations
    ) {
        return pedigrees.getTree(camelId, generations);
    }

    // OWNER/ADMIN at the HTTP layer; ownership of this specific camel checked in the service.
    @PutMapping("/{camelId}/pedigree")
    public PedigreeDTO update(
            @PathVariable Long camelId,
            @Valid @RequestBody PedigreeUpdateRequest request,
            Authentication auth
    ) {
        return pedigrees.update(camelId, request, AccountAccess.requiredId(auth));
    }
}
