package com.gulfracing.service;

import com.gulfracing.dto.OwnershipHistoryDTO;
import com.gulfracing.entity.Camel;
import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;

import java.time.Clock;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OwnershipRecordService {
    private final AuditRecorder audit;

    private final OwnershipRecordRepository ownershipRecords;
    private final CamelRepository camels;
    private final UserRepository users;
    private final Clock clock;
    private final TrainingAgreementService trainingAgreementService;
    private final EntityManager entityManager;

    @Transactional
    public Long addOwnershipRecord(
            Double sharePercent,
            Date startAt,
            Date endAt,
            Long camelId,
            Long ownerId
    ) {
        if (endAt != null && !endAt.after(startAt)) {
            throw ApiException.badRequest(
                    "Ownership end date must be after the start date."
            );
        }

        var camel = camels.findLockedById(camelId)
                .orElseThrow(() -> ApiException.notFound("Camel"));

        validateOwnershipTotal(camelId, null, sharePercent, startAt, endAt);
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

        Long ownershipId = ownershipRecords
                .saveAndFlush(ownershipRecord)
                .getOwnershipId();

        trainingAgreementService.terminateIfOwnerLostFullOwnership(camelId);
        audit.record("CREATED", "Ownership", ownershipId, camelId, null);
        return ownershipId;
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

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public OwnershipRecord updateOwnershipRecord(
            Long id,
            Double updateSharePercent,
            Date updateStartAt,
            Date updateEndAt
    ) {
        if (updateEndAt != null && !updateEndAt.after(updateStartAt)) {
            throw ApiException.badRequest(
                    "Ownership end date must be after the start date."
            );
        }

        OwnershipRecord initial = getById(id);
        Long camelId = initial.getCamel().getCamelId();
        camels.findLockedById(camelId).orElseThrow(() -> ApiException.notFound("Camel"));
        entityManager.refresh(initial, LockModeType.PESSIMISTIC_WRITE);
        if (!Boolean.TRUE.equals(initial.getIsActive())) throw ApiException.notFound("Ownership record");
        validateOwnershipTotal(camelId, id, updateSharePercent, updateStartAt, updateEndAt);
        OwnershipRecord record = getById(id);
        record.setSharePercent(updateSharePercent);
        record.setStartAt(updateStartAt);
        record.setEndAt(updateEndAt);
        record.setUpdatedDate(Date.from(clock.instant()));
        ownershipRecords.saveAndFlush(record);
        trainingAgreementService.terminateIfOwnerLostFullOwnership(
                record.getCamel().getCamelId()
        );
        audit.record("UPDATED", "Ownership", id, record.getCamel().getCamelId(), null);
        return record;
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public Boolean deleteById(Long id) {
        OwnershipRecord record = getById(id);
        camels.findLockedById(record.getCamel().getCamelId())
                .orElseThrow(() -> ApiException.notFound("Camel"));
        entityManager.refresh(record, LockModeType.PESSIMISTIC_WRITE);
        if (!Boolean.TRUE.equals(record.getIsActive())) throw ApiException.notFound("Ownership record");
        record.setIsActive(false);
        Date now = Date.from(clock.instant());
        record.setEndAt(record.getEndAt() == null ? now : record.getEndAt());
        record.setUpdatedDate(now);
        ownershipRecords.saveAndFlush(record);
        trainingAgreementService.terminateIfOwnerLostFullOwnership(record.getCamel().getCamelId());
        audit.record("DELETED", "Ownership", id, record.getCamel().getCamelId(), null);
        return true;
    }

    // Check every interval boundary, including scheduled future ownership. Intervals are [start,end).
    private void validateOwnershipTotal(Long camelId, Long excludedId, Double share, Date start, Date end) {
        if (share == null || !Double.isFinite(share) || share <= 0 || share > 100 || start == null) {
            throw ApiException.badRequest("Ownership requires a valid start date and share between 0 and 100.");
        }
        var records = ownershipRecords.findByCamel_CamelIdAndIsActiveTrue(camelId).stream()
                .filter(r -> !java.util.Objects.equals(r.getOwnershipId(), excludedId)).toList();
        var boundaries = new java.util.TreeSet<Date>();
        boundaries.add(start);
        for (var r : records) {
            if (r.getStartAt() != null && !r.getStartAt().before(start)
                    && (end == null || r.getStartAt().before(end))) boundaries.add(r.getStartAt());
        }
        for (Date at : boundaries) {
            java.math.BigDecimal total = java.math.BigDecimal.valueOf(share);
            for (var r : records) {
                if ((r.getStartAt() == null || !r.getStartAt().after(at))
                        && (r.getEndAt() == null || r.getEndAt().after(at)) && r.getSharePercent() != null) {
                    total = total.add(java.math.BigDecimal.valueOf(r.getSharePercent()));
                }
            }
            if (total.compareTo(java.math.BigDecimal.valueOf(100)) > 0) {
                throw ApiException.conflict("Overlapping ownership shares cannot exceed 100 percent.");
            }
        }
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) {
            throw ApiException.badRequest("An ownership record ID is required.");
        }
    }

    @Transactional(readOnly = true)
    public List<Camel> getMyCamels(Long ownerId) {
        if (ownerId == null || ownerId <= 0) {
            throw ApiException.badRequest("A user ID is required.");
        }

        Date now = Date.from(clock.instant());

        return ownershipRecords.findCurrentCamelsByOwnerId(ownerId, now);
    }
}
