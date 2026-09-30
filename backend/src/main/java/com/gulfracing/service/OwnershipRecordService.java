package com.gulfracing.service;

import com.gulfracing.entity.Camel;
import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.entity.User;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class OwnershipRecordService {
    OwnershipRecordRepository ownershipRecordRepository;
    CamelRepository camelRepository;
    UserRepository userRepository;

    @Autowired
    public OwnershipRecordService(OwnershipRecordRepository ownershipRecordRepository, CamelRepository camelRepository, UserRepository userRepository) {
        this.ownershipRecordRepository = ownershipRecordRepository;
        this.camelRepository = camelRepository;
        this.userRepository = userRepository;
    }

    //Add service
    public Long addOwnershipRecord(Double sharePercent, Date startAt, Date endAt, Long camelId, Long ownerId) {
        Optional<Camel> camel = camelRepository.findById(camelId);
        Optional<User> owner = userRepository.findById(ownerId);
        if (camel.isEmpty() || owner.isEmpty()) {
            return null;
        }

        OwnershipRecord ownershipRecord = new OwnershipRecord();
        ownershipRecord.setSharePercent(sharePercent);
        ownershipRecord.setStartAt(startAt);
        ownershipRecord.setEndAt(endAt);
        ownershipRecord.setCamel(camel.get());
        ownershipRecord.setOwner(owner.get());
        ownershipRecord.setIsActive(true);
        ownershipRecord.setCreatedDate(new Date());
        ownershipRecord = ownershipRecordRepository.save(ownershipRecord);
        return ownershipRecord.getOwnershipId();
    }

    //Get all service
    public List<OwnershipRecord> getAllOwnershipRecords() {
        return ownershipRecordRepository.getAllOwnershipRecords();
    }

    //Get By Id service
    public OwnershipRecord getById(Long id) {
        Optional<OwnershipRecord> ownershipRecord = ownershipRecordRepository.findById(id);
        if (ownershipRecord.isPresent()
                && ownershipRecord.get().getIsActive()) {
            return ownershipRecord.get();
        }

        return new OwnershipRecord();
    }

    //Update service
    public OwnershipRecord updateOwnershipRecord(Long id, Double updateSharePercent, Date updateStartAt, Date updateEndAt) {
        OwnershipRecord ownershipRecordToUpdate = ownershipRecordRepository.getById(id);
        if (ownershipRecordToUpdate == null) {
            return new OwnershipRecord();
        }

        ownershipRecordToUpdate.setSharePercent(updateSharePercent);
        ownershipRecordToUpdate.setStartAt(updateStartAt);
        ownershipRecordToUpdate.setEndAt(updateEndAt);
        ownershipRecordToUpdate.setUpdatedDate(new Date());
        return ownershipRecordRepository.save(ownershipRecordToUpdate);
    }

    //Delete service
    public Boolean deleteById(Long id) {
        OwnershipRecord deleteOwnershipRecord = ownershipRecordRepository.getById(id);
        if (deleteOwnershipRecord == null) {
            return false;
        }
        deleteOwnershipRecord.setIsActive(false);
        deleteOwnershipRecord.setUpdatedDate(new Date());
        ownershipRecordRepository.save(deleteOwnershipRecord);
        return true;
    }
}
