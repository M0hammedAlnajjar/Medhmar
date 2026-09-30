package com.gulfracing.controller;

import com.gulfracing.dto.TrainerProfileDTO;
import com.gulfracing.exception.ApiException;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.TrainerProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/trainer-profile")
@RequiredArgsConstructor
public class TrainerProfileController {
    private final TrainerProfileService trainerProfileService;

    @PostMapping("/add")
    @ResponseStatus(HttpStatus.CREATED)
    public Long addTrainerProfile(@Valid @RequestBody TrainerProfileDTO dto, Authentication auth) {
        Long actorId = AccountAccess.requiredId(auth);
        requireSelf(dto.getUserId(), actorId);
        return trainerProfileService.create(actorId, dto.getBio(), dto.getLocation());
    }

    @GetMapping("/getAll")
    public List<TrainerProfileDTO> getAllTrainerProfiles() {
        return TrainerProfileDTO.convertToDTO(trainerProfileService.getAll());
    }

    @GetMapping("/getById")
    public TrainerProfileDTO getById(@RequestParam Long id) {
        return TrainerProfileDTO.convertToDTO(trainerProfileService.getById(id));
    }

    @PutMapping("/update")
    public TrainerProfileDTO updateTrainerProfile(@Valid @RequestBody TrainerProfileDTO dto, Authentication auth) {
        Long actorId = AccountAccess.requiredId(auth);
        requireSelf(dto.getUserId(), actorId);
        return TrainerProfileDTO.convertToDTO(
                trainerProfileService.update(actorId, dto.getBio(), dto.getLocation())
        );
    }

    @DeleteMapping("/deleteById")
    public Boolean deleteTrainerProfile(@RequestParam Long id, Authentication auth) {
        Long actorId = AccountAccess.requiredId(auth);
        requireSelf(id, actorId);
        return trainerProfileService.delete(actorId);
    }

    private void requireSelf(Long requestedUserId, Long actorId) {
        if (requestedUserId != null && !actorId.equals(requestedUserId)) {
            throw ApiException.forbidden();
        }
    }
}
