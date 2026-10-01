package com.gulfracing.controller;

import com.gulfracing.dto.RaceEntryDTO;
import com.gulfracing.dto.RaceEntryRequests;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.RaceEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/race-entries")
@RequiredArgsConstructor
public class RaceEntryController {
    private final RaceEntryService raceEntryService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RaceEntryDTO createRaceEntry(@Valid @RequestBody RaceEntryRequests.Create request,
                                        Authentication auth) {
        return RaceEntryDTO.convertToDTO(
                raceEntryService.register(request, AccountAccess.requiredId(auth)));
    }

    @GetMapping
    public List<RaceEntryDTO> getAllRaceEntries(Authentication auth) {
        return RaceEntryDTO.convertToDTO(
                raceEntryService.getAllRaceEntries(AccountAccess.requiredId(auth)));
    }

    @GetMapping("/mine")
    public List<RaceEntryDTO> mine(Authentication auth) {
        return RaceEntryDTO.convertToDTO(raceEntryService.mine(AccountAccess.requiredId(auth)));
    }

    @GetMapping("/race/{raceId}")
    public List<RaceEntryDTO> forRace(@PathVariable Long raceId, Authentication auth) {
        return RaceEntryDTO.convertToDTO(
                raceEntryService.forRace(raceId, AccountAccess.requiredId(auth)));
    }

    @GetMapping("/{id}")
    public RaceEntryDTO getRaceEntryById(@PathVariable Long id, Authentication auth) {
        return RaceEntryDTO.convertToDTO(
                raceEntryService.getById(id, AccountAccess.requiredId(auth)));
    }

    @PutMapping("/{id}")
    public RaceEntryDTO updateRaceEntry(@PathVariable Long id,
                                        @Valid @RequestBody RaceEntryRequests.Decision request,
                                        Authentication auth) {
        return RaceEntryDTO.convertToDTO(
                raceEntryService.decide(id, request.entryStatus(), AccountAccess.requiredId(auth)));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRaceEntry(@PathVariable Long id, Authentication auth) {
        raceEntryService.withdraw(id, AccountAccess.requiredId(auth));
    }
}
