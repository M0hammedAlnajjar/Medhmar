package com.gulfracing.controller;

import com.gulfracing.dto.RaceEntryDTO;
import com.gulfracing.service.RaceEntryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/race-entries")
public class RaceEntryController {

    private final RaceEntryService raceEntryService;

    public RaceEntryController(RaceEntryService raceEntryService) {
        this.raceEntryService = raceEntryService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RaceEntryDTO createRaceEntry(
            @Valid @RequestBody RaceEntryDTO raceEntryDTO) {

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
            @Valid @RequestBody RaceEntryDTO raceEntryDTO) {

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
            @PathVariable Long id) {

        raceEntryService.deleteRaceEntry(id);
    }
}