package com.gulfracing.controller;

import com.gulfracing.dto.RaceDTO;
import com.gulfracing.service.RaceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/races")
public class RaceController {

    private final RaceService raceService;

    public RaceController(RaceService raceService) {
        this.raceService = raceService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RaceDTO createRace(@Valid @RequestBody RaceDTO raceDTO) {

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
            @Valid @RequestBody RaceDTO raceDTO) {

        return RaceDTO.convertToDTO(
                raceService.updateRace(
                        id,
                        raceDTO.toEntity()
                )
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteRace(@PathVariable Long id) {

        raceService.deleteRace(id);
    }
}