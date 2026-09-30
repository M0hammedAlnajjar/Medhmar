package com.gulfracing.service;

import com.gulfracing.entity.Camel;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.Gender;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CamelService {

    private final CamelRepository camelRepository;

    @Transactional
    public Long addCamel(
            String name,
            Gender gender,
            Date birthDate,
            String breed,
            String photoUrl,
            CamelStatus status
    ) {
        Camel camel = new Camel();
        camel.setIsActive(true);
        camel.setCreatedDate(new Date());
        camel.setName(name);
        camel.setGender(gender);
        camel.setBirthDate(birthDate);
        camel.setBreed(breed);
        camel.setPhotoUrl(photoUrl);
        camel.setStatus(status);

        return camelRepository.save(camel).getCamelId();
    }

    @Transactional(readOnly = true)
    public List<Camel> getAllCamels() {
        return camelRepository.getAllCamels();
    }

    @Transactional(readOnly = true)
    public Camel getById(Long id) {
        if (id == null || id <= 0) {
            throw ApiException.badRequest("A camel ID is required.");
        }

        return camelRepository.findById(id)
                .filter(camel -> Boolean.TRUE.equals(camel.getIsActive()))
                .orElseThrow(() -> ApiException.notFound("Camel"));
    }

    @Transactional
    public Camel updateCamel(
            Long id,
            String updateName,
            Gender updateGender,
            Date updateBirthDate,
            String updateBreed,
            String updatePhotoUrl,
            CamelStatus updateStatus
    ) {
        Camel camelToUpdate = getById(id);
        camelToUpdate.setUpdatedDate(new Date());
        camelToUpdate.setName(updateName);
        camelToUpdate.setGender(updateGender);
        camelToUpdate.setBirthDate(updateBirthDate);
        camelToUpdate.setBreed(updateBreed);
        camelToUpdate.setPhotoUrl(updatePhotoUrl);
        camelToUpdate.setStatus(updateStatus);
        return camelToUpdate;
    }

    @Transactional
    public Boolean deleteById(Long id) {
        Camel camel = getById(id);
        camel.setIsActive(false);
        camel.setUpdatedDate(new Date());
        return true;
    }
}
