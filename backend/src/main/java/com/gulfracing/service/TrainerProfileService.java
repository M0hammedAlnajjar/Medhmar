package com.gulfracing.service;

import com.gulfracing.entity.TrainerProfile;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.TrainerProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainerProfileService {
    private final TrainerProfileRepository trainerProfileRepository;
    private final UserService userService;

    @Transactional
    public Long create(Long actorId, String bio, String location) {
        var user = userService.getActive(actorId);
        boolean permittedRole = user.getRoles().stream().anyMatch(role ->
                "TRAINER".equals(role.getRoleName()) || "ADMIN".equals(role.getRoleName()));
        if (!permittedRole) throw ApiException.forbidden();
        if (trainerProfileRepository.existsById(actorId)) {
            throw ApiException.conflict("A trainer profile already exists for this user.");
        }

        var trainerProfile = new TrainerProfile();
        trainerProfile.setUser(user);
        trainerProfile.setBio(bio);
        trainerProfile.setLocation(location);
        return trainerProfileRepository.saveAndFlush(trainerProfile).getUserId();
    }

    @Transactional(readOnly = true)
    public List<TrainerProfile> getAll() {
        return trainerProfileRepository.findAll(Sort.by("userId"));
    }

    @Transactional(readOnly = true)
    public TrainerProfile getById(Long id) {
        return trainerProfileRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Trainer profile"));
    }

    @Transactional
    public TrainerProfile update(Long actorId, String bio, String location) {
        userService.getActive(actorId);
        var trainerProfile = trainerProfileRepository.findById(actorId)
                .orElseThrow(() -> ApiException.notFound("Trainer profile"));
        trainerProfile.setBio(bio);
        trainerProfile.setLocation(location);
        return trainerProfile;
    }

    @Transactional
    public Boolean delete(Long actorId) {
        userService.getActive(actorId);
        var trainerProfile = trainerProfileRepository.findById(actorId)
                .orElseThrow(() -> ApiException.notFound("Trainer profile"));
        trainerProfileRepository.delete(trainerProfile);
        return true;
    }
}
