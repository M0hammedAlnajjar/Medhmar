package com.gulfracing.service;

import com.gulfracing.dto.OwnershipHistoryDTO;
import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnershipRecordService {

    private final OwnershipRecordRepository ownershipRecords;
    private final CamelRepository camels;
    private final UserRepository users;
    private final Clock clock;

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

    @Transactional(readOnly = true)
    public List<OwnershipHistoryDTO> getOwnershipHistory(Long camelId) {
        validateCamelId(camelId);
        if (camels.getById(camelId) == null) {
            throw ApiException.notFound("Camel");
        }
        Date now = Date.from(clock.instant());
        return ownershipRecords.findHistoryByCamelId(camelId).stream()
                .map(record -> OwnershipHistoryDTO.of(record, isCurrent(record, now)))
                .toList();
    }

    private boolean isCurrent(OwnershipRecord record, Date now) {
        return Boolean.TRUE.equals(record.getIsActive())
                && record.getSharePercent() != null && record.getSharePercent() > 0
                && (record.getStartAt() == null || !record.getStartAt().after(now))
                && (record.getEndAt() == null || record.getEndAt().after(now));
    }

    private void validateCamelId(Long id) {
        if (id == null || id <= 0) {
            throw ApiException.badRequest("A camel ID is required.");
        }
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
