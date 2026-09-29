package com.gulfracing.controller;

import com.gulfracing.dto.RaceDTO;
import com.gulfracing.service.RaceService;
import com.gulfracing.service.UserService;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.exception.ApiException;
import org.springframework.security.core.Authentication;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
public class RaceController {

    private final RaceService raceService;
    private final UserService users;

    public RaceController(RaceService raceService, UserService users) {
        this.raceService = raceService;
        this.users = users;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RaceDTO createRace(@Valid @RequestBody RaceDTO raceDTO, Authentication auth) {
        requireManager(null, raceDTO, auth);

        return RaceDTO.convertToDTO(
                raceService.addRace(raceDTO.toEntity())
        );
    }

    @GetMapping
    public List<RaceDTO> getAllRaces() {

        return RaceDTO.convertToDTO(
                raceService.getAllRaces()
        );
    }

    @GetMapping("/{id}")
    public RaceDTO getRaceById(@PathVariable Long id) {

        return RaceDTO.convertToDTO(
                raceService.getRaceById(id)
        );
    }

    @PutMapping("/{id}")
    public RaceDTO updateRace(
            @PathVariable Long id,
            @Valid @RequestBody RaceDTO raceDTO, Authentication auth) {
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
    public void deleteRace(@PathVariable Long id, Authentication auth) {
        requireManager(id, null, auth);

        raceService.deleteRace(id);
    }

    private void requireManager(Long raceId, RaceDTO request, Authentication auth) {
        Long actorId = AccountAccess.requiredId(auth);
        if (users.isAdmin(actorId)) return;
        if (request != null && !actorId.equals(request.getOrganizerId())) throw ApiException.forbidden();
        if (raceId != null && !actorId.equals(raceService.getRaceById(raceId).getOrganizer().getUserId()))
            throw ApiException.forbidden();
    }
}
