package com.gulfracing.controller;

import com.gulfracing.dto.RaceEntryDTO;
import com.gulfracing.enums.RaceEntryStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.CamelAccessService;
import com.gulfracing.service.RaceEntryService;
import com.gulfracing.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/race-entries")
public class RaceEntryController {

    private final RaceEntryService raceEntryService;
    private final CamelAccessService camelAccessService;
    private final UserService userService;

    public RaceEntryController(
            RaceEntryService raceEntryService,
            CamelAccessService camelAccessService,
            UserService userService) {

        this.raceEntryService = raceEntryService;
        this.camelAccessService = camelAccessService;
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RaceEntryDTO createRaceEntry(
            @Valid @RequestBody RaceEntryDTO raceEntryDTO,
            Authentication authentication) {

        Long actorId = AccountAccess.requiredId(authentication);

        if (!userService.isAdmin(actorId)) {
            camelAccessService.requireOwner(
                    raceEntryDTO.getCamelId(),
                    actorId
            );
        }

        raceEntryDTO.setRegistrantId(actorId);
        raceEntryDTO.setEntryStatus(RaceEntryStatus.PENDING);

        return RaceEntryDTO.convertToDTO(
                raceEntryService.addRaceEntry(
                        raceEntryDTO.toEntity()
                )
        );
    }

    @GetMapping
    public List<RaceEntryDTO> getAllRaceEntries() {

        return RaceEntryDTO.convertToDTO(
                raceEntryService.getAllRaceEntries()
        );
    }

    @GetMapping("/{id}")
    public RaceEntryDTO getRaceEntryById(
            @PathVariable Long id) {

        return RaceEntryDTO.convertToDTO(
                raceEntryService.getRaceEntryById(id)
        );
    }

    @PutMapping("/{id}")
    public RaceEntryDTO updateRaceEntry(
            @PathVariable Long id,
            @Valid @RequestBody RaceEntryDTO raceEntryDTO,
            Authentication authentication) {

        requireManager(id, authentication);

        return RaceEntryDTO.convertToDTO(
                raceEntryService.updateRaceEntry(
                        id,
                        raceEntryDTO.toEntity()
                )
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRaceEntry(
            @PathVariable Long id,
            Authentication authentication) {

        requireManager(id, authentication);

        raceEntryService.deleteRaceEntry(id);
    }

    private void requireManager(
            Long entryId,
            Authentication authentication) {

        Long actorId = AccountAccess.requiredId(authentication);

        if (userService.isAdmin(actorId)) {
            return;
        }

        Long organizerId =
                raceEntryService.getRaceOrganizerId(entryId);

        if (!actorId.equals(organizerId)) {
            throw ApiException.forbidden();
        }
    }
}