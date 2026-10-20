package com.gulfracing.dto;

import com.gulfracing.entity.RaceEntry;
import com.gulfracing.enums.RaceEntryStatus;

import java.time.Instant;

public record RaceParticipantDTO(
        Long entryId,
        Integer participantNumber,
        RaceEntryStatus entryStatus,
        Long raceId,
        Long camelId,
        String camelName,
        Long registrantId,
        String registrantName,
        Instant registeredAt
) {
    public static RaceParticipantDTO from(RaceEntry entry) {
        return new RaceParticipantDTO(
                entry.getEntryId(),
                entry.getParticipantNumber(),
                entry.getEntryStatus(),
                entry.getRace() == null ? null : entry.getRace().getRaceId(),
                entry.getCamel() == null ? null : entry.getCamel().getCamelId(),
                entry.getCamel() == null ? null : entry.getCamel().getName(),
                entry.getRegistrant() == null ? null : entry.getRegistrant().getUserId(),
                entry.getRegistrant() == null ? null : entry.getRegistrant().getFullName(),
                entry.getRegisteredAt()
        );
    }
}
