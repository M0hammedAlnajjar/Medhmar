package com.gulfracing.dto;

import com.gulfracing.entity.OwnershipRecord;

import java.util.Date;

// Public view of one ownership period. Exposes the owner's name only, never contact details.
public record OwnershipHistoryDTO(
        Long ownershipId,
        String ownerName,
        Double sharePercent,
        Date startAt,
        Date endAt,
        boolean current
) {
    public static OwnershipHistoryDTO of(OwnershipRecord record, boolean current) {
        return new OwnershipHistoryDTO(
                record.getOwnershipId(),
                record.getOwner() == null ? null : record.getOwner().getFullName(),
                record.getSharePercent(),
                record.getStartAt(),
                record.getEndAt(),
                current
        );
    }
}
