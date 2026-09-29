package com.gulfracing.service;

import com.gulfracing.entity.Camel;
import com.gulfracing.repository.CamelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class CamelService {
    CamelRepository camelRepository;

    @Autowired
    public CamelService(CamelRepository camelRepository) {
        this.camelRepository = camelRepository;
    }

    //Add service
    public Long addCamel(String name, String gender, Date birthDate, String breed, String photoUrl, String status) {
        Camel camel = new Camel();
        camel.setIsActive(true);
        camel.setCreatedDate(new Date());
        camel.setName(name);
        camel.setGender(gender);
        camel.setBirthDate(birthDate);
        camel.setBreed(breed);
        camel.setPhotoUrl(photoUrl);
        camel.setStatus(status);
        camel = camelRepository.save(camel);
        return camel.getCamelId();
    }

    //Get all service
    public List<Camel> getAllCamels() {
        return camelRepository.getAllCamels();
    }

    //Get By Id service
    public Camel getById(Long id) {
        Optional<Camel> camel = camelRepository.findById(id);
        if (camel.isPresent() && camel.get().getIsActive()) {
            return camel.get();
        }

        return new Camel();
    }

    //Update service
    public Camel updateCamel(Long id, String updateName,
                             String updateGender, Date updateBirthDate,
                             String updateBreed, String updatePhotoUrl,
                             String updateStatus) {
        Camel camelToUpdate = camelRepository.getById(id);
        if(camelToUpdate==null){
            return new Camel();
        }
        camelToUpdate.setUpdatedDate(new Date());
        camelToUpdate.setName(updateName);
        camelToUpdate.setGender(updateGender);
        camelToUpdate.setBirthDate(updateBirthDate);
        camelToUpdate.setBreed(updateBreed);
        camelToUpdate.setPhotoUrl(updatePhotoUrl);
        camelToUpdate.setStatus(updateStatus);
        camelToUpdate = camelRepository.save(camelToUpdate);
        return camelToUpdate;
    }

    //Delete service
    public Boolean deleteById(Long id) {
        Camel deleteCamel = camelRepository.getById(id);
        if(deleteCamel == null){
            return false;
        }else{
            deleteCamel.setIsActive(false);
            deleteCamel.setUpdatedDate(new Date());
            camelRepository.deleteById(id);
            return true;
        }
    }
}
