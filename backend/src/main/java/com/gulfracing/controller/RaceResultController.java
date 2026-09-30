package com.gulfracing.controller;

import com.gulfracing.dto.RaceResultDTO;
import com.gulfracing.exception.ApiException;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.RaceEntryService;
import com.gulfracing.service.RaceResultService;
import com.gulfracing.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/race-results")
public class RaceResultController {

    private final RaceResultService raceResultService;
    private final RaceEntryService raceEntryService;
    private final UserService userService;

    public RaceResultController(
            RaceResultService raceResultService,
            RaceEntryService raceEntryService,
            UserService userService) {

        this.raceResultService = raceResultService;
        this.raceEntryService = raceEntryService;
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RaceResultDTO createRaceResult(
            @Valid @RequestBody RaceResultDTO raceResultDTO,
            Authentication authentication) {

        requireManager(
                raceResultDTO.getEntryId(),
                authentication
        );

        return RaceResultDTO.convertToDTO(
                raceResultService.addRaceResult(
                        raceResultDTO.toEntity()
                )
        );
    }

    @GetMapping
    public List<RaceResultDTO> getAllRaceResults() {

        return RaceResultDTO.convertToDTO(
                raceResultService.getAllRaceResults()
        );
    }

    @GetMapping("/{entryId}")
    public RaceResultDTO getRaceResultById(
            @PathVariable Long entryId) {

        return RaceResultDTO.convertToDTO(
                raceResultService.getRaceResultById(entryId)
        );
    }

    @PutMapping("/{entryId}")
    public RaceResultDTO updateRaceResult(
            @PathVariable Long entryId,
            @Valid @RequestBody RaceResultDTO raceResultDTO,
            Authentication authentication) {

        requireManager(entryId, authentication);

        return RaceResultDTO.convertToDTO(
                raceResultService.updateRaceResult(
                        entryId,
                        raceResultDTO.toEntity()
                )
        );
    }

    @DeleteMapping("/{entryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRaceResult(
            @PathVariable Long entryId,
            Authentication authentication) {

        requireManager(entryId, authentication);

        raceResultService.deleteRaceResult(entryId);
    }

    private void requireManager(
            Long entryId,
            Authentication authentication) {

        Long actorId = AccountAccess.requiredId(authentication);

        if (userService.isAdmin(actorId)) {
            return;
        }

        Long organizerId = raceEntryService.getRaceOrganizerId(entryId);

        if (!actorId.equals(organizerId)) {
            throw ApiException.forbidden();
        }
    }
}