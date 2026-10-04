package com.gulfracing.controller;

import com.gulfracing.dto.RaceDTO;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.OrganizationService;
import com.gulfracing.service.RaceService;
import com.gulfracing.service.UserService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/races")
public class RaceController {

    private final RaceService raceService;
    private final UserService users;
    private final OrganizationService organizations;

    public RaceController(
            RaceService raceService,
            UserService users,
            OrganizationService organizations) {

        this.raceService = raceService;
        this.users = users;
        this.organizations = organizations;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RaceDTO createRace(
            @Valid @RequestBody RaceDTO raceDTO,
            Authentication auth) {

        requireManager(null, raceDTO, auth);

        return RaceDTO.convertToDTO(
                raceService.addRace(
                        raceDTO.toEntity()
                )
        );
    }

    @GetMapping
    public Page<RaceDTO> getRaces(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) RaceStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return raceService
                .getRaces(search, status, page, size)
                .map(RaceDTO::convertToDTO);
    }

    @GetMapping("/{id}")
    public RaceDTO getRaceById(
            @PathVariable Long id) {

        return RaceDTO.convertToDTO(
                raceService.getRaceById(id)
        );
    }

    @PutMapping("/{id}")
    public RaceDTO updateRace(
            @PathVariable Long id,
            @Valid @RequestBody RaceDTO raceDTO,
            Authentication auth) {

        requireManager(id, raceDTO, auth);

        return RaceDTO.convertToDTO(
                raceService.updateRace(
                        id,
                        raceDTO.toEntity()
                )
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRace(
            @PathVariable Long id,
            Authentication auth) {

        requireManager(id, null, auth);

        raceService.deleteRace(id);
    }

    private void requireManager(
            Long raceId,
            RaceDTO request,
            Authentication auth) {

        Long actorId = AccountAccess.requiredId(auth);

        if (users.isAdmin(actorId)) {
            return;
        }

        if (request != null
                && !actorId.equals(request.getOrganizerId())) {

            throw ApiException.forbidden();
        }

        if (request != null
                && request.getOrganizationId() != null) {

            organizations.requireManager(
                    request.getOrganizationId(),
                    actorId
            );
        }

        if (raceId != null) {

            var existing =
                    raceService.getRaceById(raceId);

            if (!actorId.equals(
                    existing.getOrganizer().getUserId())) {

                throw ApiException.forbidden();
            }

            if (existing.getOrganization() != null) {

                organizations.requireManager(
                        existing.getOrganization()
                                .getOrganizationId(),
                        actorId
                );
            }
        }
    }
}