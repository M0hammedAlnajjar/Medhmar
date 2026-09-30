package com.gulfracing.controller;


import com.gulfracing.dto.TrainerProfileDTO;
import com.gulfracing.service.TrainerProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trainer-profile")
@RequiredArgsConstructor
public class TrainerProfileController {

    private final TrainerProfileService trainerProfileService;

    @PostMapping("/add")
    public Long addTrainerProfile(
            @Valid @RequestBody TrainerProfileDTO dto,
            Authentication auth
    ) {
        return trainerProfileService.create(
                dto.getUserId(),
                dto.getBio(),
                dto.getLocation()
        );
    }

    @GetMapping("/getAll")
    public List<TrainerProfileDTO> getAllTrainerProfiles() {
        return TrainerProfileDTO.convertToDTO(
                trainerProfileService.getAll()
        );
    }

    @GetMapping("/getById")
    public TrainerProfileDTO getById(
            @RequestParam Long id
    ) {
        return TrainerProfileDTO.convertToDTO(
                trainerProfileService.getById(id)
        );
    }

    @PutMapping("/update")
    public TrainerProfileDTO updateTrainerProfile(
            @Valid @RequestBody TrainerProfileDTO dto,
            Authentication auth
    ) {
        return TrainerProfileDTO.convertToDTO(
                trainerProfileService.update(
                        dto.getUserId(),
                        dto.getBio(),
                        dto.getLocation()
                )
        );
    }

    @DeleteMapping("/deleteById")
    public Boolean deleteTrainerProfile(
            @RequestParam Long id
    ) {
        return trainerProfileService.delete(id);
    }
}