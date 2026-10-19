package com.gulfracing.service;

import com.gulfracing.entity.TrainerProfile;
import com.gulfracing.dto.TrainerProfileDTO;
import com.gulfracing.enums.AccountStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.TrainerProfileRepository;
import com.gulfracing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TrainerProfileService {
    private final TrainerProfileRepository trainerProfileRepository;
    private final UserRepository userRepository;
    private final UserService userService;
    private final TrainerPhotoStorageService trainerPhotoStorage;

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
    public List<TrainerProfileDTO> getActiveTrainers() {
        var profilesByUserId = trainerProfileRepository.findAll(Sort.by("userId")).stream()
                .collect(java.util.stream.Collectors.toMap(TrainerProfile::getUserId, profile -> profile));
        return userRepository.findByAccountStatusAndRoles_RoleNameOrderByUserId(AccountStatus.ACTIVE, "TRAINER")
                .stream()
                .map(user -> {
                    var profile = profilesByUserId.get(user.getUserId());
                    return TrainerProfileDTO.builder()
                            .userId(user.getUserId())
                            .trainerName(user.getFullName())
                            .avatarUrl(user.getAvatarUrl())
                            .bio(profile == null ? null : profile.getBio())
                            .location(profile == null ? null : profile.getLocation())
                            .profileCreated(profile != null)
                            .build();
                })
                .toList();
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
    public String uploadPhoto(Long actorId, MultipartFile photo) {
        var user = userService.getActive(actorId);
        boolean trainerRole = user.getRoles().stream().anyMatch(role -> "TRAINER".equals(role.getRoleName()));
        if (!trainerRole) throw ApiException.forbidden();
        if (!trainerProfileRepository.existsById(actorId)) {
            throw ApiException.notFound("Trainer profile");
        }
        String photoUrl = trainerPhotoStorage.store(photo);
        user.setAvatarUrl(photoUrl);
        return photoUrl;
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
