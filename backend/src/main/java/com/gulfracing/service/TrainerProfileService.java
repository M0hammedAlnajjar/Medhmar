package com.gulfracing.service;

import com.gulfracing.entity.TrainerProfile;
import com.gulfracing.entity.User;
import com.gulfracing.repository.TrainerProfileRepository;
import com.gulfracing.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class TrainerProfileService {
    TrainerProfileRepository trainerProfileRepository;
    UserRepository userRepository;

    @Autowired
    public TrainerProfileService(TrainerProfileRepository trainerProfileRepository,
                                 UserRepository userRepository) {
        this.trainerProfileRepository = trainerProfileRepository;
        this.userRepository = userRepository;
    }

    public Long create(Long userId, String bio, String location) {

        Optional<User> user = userRepository.findById(userId);

        if (user.isEmpty()) {
            return -1L;
        }

        if (trainerProfileRepository.existsById(userId)) {
            return -1L;
        }

        TrainerProfile trainerProfile = new TrainerProfile();
        trainerProfile.setUser(user.get());
        trainerProfile.setBio(bio);
        trainerProfile.setLocation(location);

        trainerProfile = trainerProfileRepository.save(trainerProfile);

        return trainerProfile.getUserId();
    }

    public List<TrainerProfile> getAll() {
        return trainerProfileRepository.findAll();
    }

    public TrainerProfile getById(Long id) {
        Optional<TrainerProfile> trainerProfile = trainerProfileRepository.findById(id);

        if (trainerProfile.isPresent()) {
            return trainerProfile.get();
        }

        return new TrainerProfile();
    }

    public TrainerProfile update(Long id, String bio, String location) {

        Optional<TrainerProfile> trainerProfileOptional = trainerProfileRepository.findById(id);

        if (trainerProfileOptional.isEmpty()) {
            return new TrainerProfile();
        }

        TrainerProfile trainerProfileToUpdate = trainerProfileOptional.get();

        trainerProfileToUpdate.setBio(bio);
        trainerProfileToUpdate.setLocation(location);

        trainerProfileToUpdate = trainerProfileRepository.save(trainerProfileToUpdate);

        return trainerProfileToUpdate;
    }

    public Boolean delete(Long id) {

        if (!trainerProfileRepository.existsById(id)) {
            return false;
        }

        trainerProfileRepository.deleteById(id);

        return true;
    }

}
