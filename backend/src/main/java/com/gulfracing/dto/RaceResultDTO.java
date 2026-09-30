package com.gulfracing.dto;

import com.gulfracing.entity.RaceEntry;
import com.gulfracing.entity.RaceResult;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RaceResultDTO {

    @NotNull(message = "Race entry ID is required")
    @Positive(message = "Race entry ID must be greater than zero")
    private Long entryId;

    @NotNull(message = "Finish position is required")
    @Positive(message = "Finish position must be greater than zero")
    private Integer finishPosition;

    @NotNull(message = "Elapsed time is required")
    @Positive(message = "Elapsed time must be greater than zero")
    private Long elapsedMs;

    public static RaceResultDTO convertToDTO(RaceResult entity) {

        if (entity == null) {
            return null;
        }

        return RaceResultDTO.builder()
                .entryId(entity.getEntryId())
                .finishPosition(entity.getFinishPosition())
                .elapsedMs(entity.getElapsedMs())
                .build();
    }

    public static List<RaceResultDTO> convertToDTO(List<RaceResult> entities) {

        if (entities == null) {
            return List.of();
        }

        return entities.stream()
                .map(RaceResultDTO::convertToDTO)
                .toList();
    }

    public RaceResult toEntity() {

        RaceResult raceResult = new RaceResult();

        if (entryId != null) {
            RaceEntry raceEntry = new RaceEntry();
            raceEntry.setEntryId(entryId);
            raceResult.setRaceEntry(raceEntry);
        }

        raceResult.setFinishPosition(finishPosition);
        raceResult.setElapsedMs(elapsedMs);

        return raceResult;
    }
}