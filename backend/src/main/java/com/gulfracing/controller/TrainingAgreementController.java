package com.gulfracing.controller;

import com.gulfracing.dto.AgreementDtos;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.TrainingAgreementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/agreements")
@RequiredArgsConstructor
public class TrainingAgreementController {
    private final TrainingAgreementService agreements;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AgreementDtos.View propose(@Valid @RequestBody AgreementDtos.Create request, Authentication auth) {
        return agreements.propose(request, AccountAccess.requiredId(auth));
    }

    @GetMapping
    public List<AgreementDtos.View> all(Authentication auth) {
        return agreements.all(AccountAccess.requiredId(auth));
    }

    @GetMapping("/mine")
    public List<AgreementDtos.View> mine(Authentication auth) {
        return agreements.mine(AccountAccess.requiredId(auth));
    }

    @GetMapping("/{id}")
    public AgreementDtos.View get(@PathVariable Long id, Authentication auth) {
        return agreements.get(id, AccountAccess.requiredId(auth));
    }

    @PostMapping("/{id}/accept")
    public AgreementDtos.View accept(@PathVariable Long id, Authentication auth) {
        return agreements.accept(id, AccountAccess.requiredId(auth));
    }

    @PostMapping("/{id}/reject")
    public AgreementDtos.View reject(@PathVariable Long id, Authentication auth) {
        return agreements.reject(id, AccountAccess.requiredId(auth));
    }

    @PostMapping("/{id}/terminate")
    public AgreementDtos.View terminate(@PathVariable Long id, Authentication auth) {
        return agreements.terminate(id, AccountAccess.requiredId(auth));
    }
}
