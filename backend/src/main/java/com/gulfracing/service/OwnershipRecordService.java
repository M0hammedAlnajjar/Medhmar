package com.gulfracing.service;

import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnershipRecordService {

    private final OwnershipRecordRepository ownershipRecords;
    private final CamelRepository camels;
    private final UserRepository users;

    @Transactional
    public Long addOwnershipRecord(
            Double sharePercent,
            Date startAt,
            Date endAt,
            Long camelId,
            Long ownerId
    ) {
        if (endAt != null && !endAt.after(startAt)) {
            throw ApiException.badRequest("Ownership end date must be after the start date.");
        }

        var camel = camels.findById(camelId)
                .orElseThrow(() -> ApiException.notFound("Camel"));
        var owner = users.findById(ownerId)
                .orElseThrow(() -> ApiException.notFound("User"));

        var ownershipRecord = new OwnershipRecord();
        ownershipRecord.setSharePercent(sharePercent);
        ownershipRecord.setStartAt(startAt);
        ownershipRecord.setEndAt(endAt);
        ownershipRecord.setCamel(camel);
        ownershipRecord.setOwner(owner);
        ownershipRecord.setIsActive(true);
        ownershipRecord.setCreatedDate(new Date());

        return ownershipRecords.save(ownershipRecord).getOwnershipId();
    }

    @Transactional(readOnly = true)
    public List<OwnershipRecord> getAllOwnershipRecords() {
        return ownershipRecords.getAllOwnershipRecords();
    }

    @Transactional(readOnly = true)
    public OwnershipRecord getById(Long id) {
        validateId(id);
        var record = ownershipRecords.getById(id);
        if (record == null) {
            throw ApiException.notFound("Ownership record");
        }
        return record;
    }

    @Transactional
    public OwnershipRecord updateOwnershipRecord(
            Long id,
            Double updateSharePercent,
            Date updateStartAt,
            Date updateEndAt
    ) {
        if (updateEndAt != null && !updateEndAt.after(updateStartAt)) {
            throw ApiException.badRequest("Ownership end date must be after the start date.");
        }

        OwnershipRecord record = getById(id);
        record.setSharePercent(updateSharePercent);
        record.setStartAt(updateStartAt);
        record.setEndAt(updateEndAt);
        record.setUpdatedDate(new Date());
        return record;
    }

    @Transactional
    public Boolean deleteById(Long id) {
        OwnershipRecord record = getById(id);
        record.setIsActive(false);
        record.setEndAt(record.getEndAt() == null ? new Date() : record.getEndAt());
        record.setUpdatedDate(new Date());
        return true;
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw ApiException.badRequest("An ownership record ID is required.");
        }
    }
}
