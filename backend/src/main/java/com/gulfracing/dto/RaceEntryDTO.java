package com.gulfracing.dto;

import com.gulfracing.entity.Camel;
import com.gulfracing.entity.Race;
import com.gulfracing.entity.RaceEntry;
import com.gulfracing.entity.User;
import com.gulfracing.enums.RaceEntryStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RaceEntryDTO {

    private Long entryId;

    @NotNull(message = "Registration date is required")
    private Instant registeredAt;

    @NotNull(message = "Participant number is required")
    @Positive(message = "Participant number must be greater than zero")
    private Integer participantNumber;

    private RaceEntryStatus entryStatus;

    @NotNull(message = "Race ID is required")
    @Positive(message = "Race ID must be greater than zero")
    private Long raceId;

    @Positive(message = "Registrant ID must be greater than zero")
    private Long registrantId;

    @NotNull(message = "Camel ID is required")
    @Positive(message = "Camel ID must be greater than zero")
    private Long camelId;

    public static RaceEntryDTO convertToDTO(RaceEntry entity) {

        if (entity == null) {
            return null;
        }

        return RaceEntryDTO.builder()
                .entryId(entity.getEntryId())
                .registeredAt(entity.getRegisteredAt())
                .participantNumber(entity.getParticipantNumber())
                .entryStatus(entity.getEntryStatus())
                .raceId(
                        entity.getRace() == null
                                ? null
                                : entity.getRace().getRaceId()
                )
                .registrantId(
                        entity.getRegistrant() == null
                                ? null
                                : entity.getRegistrant().getUserId()
                )
                .camelId(
                        entity.getCamel() == null
                                ? null
                                : entity.getCamel().getCamelId()
                )
                .build();
    }

    public static List<RaceEntryDTO> convertToDTO(List<RaceEntry> entities) {

        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(RaceEntryDTO::convertToDTO)
                .toList();
    }

    public RaceEntry toEntity() {

        RaceEntry raceEntry = new RaceEntry();

        raceEntry.setRegisteredAt(registeredAt);
        raceEntry.setParticipantNumber(participantNumber);
        raceEntry.setEntryStatus(entryStatus);

        if (raceId != null) {
            Race race = new Race();
            race.setRaceId(raceId);
            raceEntry.setRace(race);
        }

        if (registrantId != null) {
            User registrant = new User();
            registrant.setUserId(registrantId);
            raceEntry.setRegistrant(registrant);
        }

        if (camelId != null) {
            Camel camel = new Camel();
            camel.setCamelId(camelId);
            raceEntry.setCamel(camel);
        }

        return raceEntry;
    }
}