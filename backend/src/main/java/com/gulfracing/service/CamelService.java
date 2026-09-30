package com.gulfracing.service;

import com.gulfracing.entity.Camel;
import com.gulfracing.entity.Pedigree;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.Gender;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.PedigreeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CamelService {

    private final CamelRepository camelRepository;
    private final PedigreeRepository pedigrees;

    @Transactional
    public Long addCamel(
            String name,
            Gender gender,
            Date birthDate,
            String breed,
            String photoUrl,
            String sire,
            String dam,
            String category,
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
        camel.setSire(sire);
        camel.setDam(dam);
        camel.setCategory(category);
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
            String updateSire,
            String updateDam,
            String updateCategory,
            CamelStatus updateStatus
    ) {
        Camel camelToUpdate = getById(id);

        // An ordinary profile edit cannot silently contradict canonical registered parents.
        Pedigree ownPedigree = pedigrees.findByCamel_CamelId(id).orElse(null);
        if (ownPedigree != null) {
            Camel registeredSire = ownPedigree.getSireCamel();
            Camel registeredDam = ownPedigree.getDamCamel();

            if (registeredSire != null) {
                if (updateSire != null && !updateSire.equals(registeredSire.getName())) {
                    throw ApiException.conflict("Change a registered sire through the pedigree API.");
                }
                updateSire = registeredSire.getName();
                validateEarlierBirth(registeredSire.getBirthDate(), updateBirthDate);
            }

            if (registeredDam != null) {
                if (updateDam != null && !updateDam.equals(registeredDam.getName())) {
                    throw ApiException.conflict("Change a registered dam through the pedigree API.");
                }
                updateDam = registeredDam.getName();
                validateEarlierBirth(registeredDam.getBirthDate(), updateBirthDate);
            }
        }

        // Prevent later camel edits from invalidating existing descendants' parent links.
        List<Pedigree> sireOf = pedigrees.findBySireCamel_CamelId(id);
        List<Pedigree> damOf = pedigrees.findByDamCamel_CamelId(id);
        if (!sireOf.isEmpty() && updateGender != Gender.MALE) {
            throw ApiException.conflict("A recorded sire must remain MALE.");
        }
        if (!damOf.isEmpty() && updateGender != Gender.FEMALE) {
            throw ApiException.conflict("A recorded dam must remain FEMALE.");
        }
        for (Pedigree child : sireOf) {
            validateEarlierBirth(updateBirthDate, child.getCamel().getBirthDate());
            child.getCamel().setSire(updateName);
        }
        for (Pedigree child : damOf) {
            validateEarlierBirth(updateBirthDate, child.getCamel().getBirthDate());
            child.getCamel().setDam(updateName);
        }

        camelToUpdate.setUpdatedDate(new Date());
        camelToUpdate.setName(updateName);
        camelToUpdate.setGender(updateGender);
        camelToUpdate.setBirthDate(updateBirthDate);
        camelToUpdate.setBreed(updateBreed);
        camelToUpdate.setPhotoUrl(updatePhotoUrl);
        camelToUpdate.setSire(updateSire);
        camelToUpdate.setDam(updateDam);
        camelToUpdate.setCategory(updateCategory);
        camelToUpdate.setStatus(updateStatus);
        return camelToUpdate;
    }

    @Transactional
    public Boolean deleteById(Long id) {
        Camel camel = getById(id);
        camel.setIsActive(false);
        camel.setUpdatedDate(new Date());
        // Keep ancestry intact: registered historical parents may later be inactive.
        return true;
    }

    private void validateEarlierBirth(Date parentBirth, Date childBirth) {
        if (parentBirth != null && childBirth != null && !parentBirth.before(childBirth)) {
            throw ApiException.conflict("A recorded parent must be born before its child.");
        }
    }
}
