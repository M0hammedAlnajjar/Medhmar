package com.gulfracing.controller;

import com.gulfracing.dto.TrainingLogDtos;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.TrainingLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/training-logs")
@RequiredArgsConstructor
public class TrainingLogController {

    private final TrainingLogService trainingLogs;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrainingLogDtos.View create(
            @Valid @RequestBody TrainingLogDtos.Create request,
            Authentication auth
    ) {
        return trainingLogs.create(request, AccountAccess.requiredId(auth));
    }

    @GetMapping("/agreement/{agreementId}")
    public List<TrainingLogDtos.View> forAgreement(
            @PathVariable Long agreementId,
            Authentication auth
    ) {
        return trainingLogs.forAgreement(agreementId, AccountAccess.requiredId(auth));
    }
}
