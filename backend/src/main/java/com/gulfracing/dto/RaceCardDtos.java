package com.gulfracing.dto;

import com.gulfracing.entity.RaceCard;
import com.gulfracing.entity.RaceCardEntry;
import java.time.Instant;
import java.util.List;

public final class RaceCardDtos {
    private RaceCardDtos() {}

    public record EntryView(
            Long cardEntryId, Long raceEntryId, Integer trimNumber, Integer participantNumber,
            Long camelId, String camelName, Long ownerUserId, String ownerName, String trainerName
    ) {
        public static EntryView from(RaceCardEntry entity) {
            return new EntryView(entity.getCardEntryId(), entity.getEntry().getEntryId(), entity.getTrimNumber(),
                    entity.getEntry().getParticipantNumber(), entity.getEntry().getCamel().getCamelId(),
                    entity.getCamelNameSnapshot(), entity.getEntry().getRegistrant().getUserId(),
                    entity.getOwnerNameSnapshot(), entity.getTrainerNameSnapshot());
        }
    }

    public record View(
            Long cardId, Long raceId, String raceName, Integer version,
            Instant publishDate, Long publishedBy, List<EntryView> entries
    ) {
        public static View from(RaceCard entity) {
            return new View(entity.getCardId(), entity.getRace().getRaceId(), entity.getRace().getName(),
                    entity.getVersion(), entity.getPublishDate(), entity.getPublishedBy().getUserId(),
                    entity.getEntries().stream().map(EntryView::from).toList());
        }
    }
}
