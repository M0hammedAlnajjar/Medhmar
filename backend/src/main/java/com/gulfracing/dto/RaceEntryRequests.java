package com.gulfracing.dto;

import com.gulfracing.enums.RaceEntryStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public final class RaceEntryRequests {
    private RaceEntryRequests() {}

    public record Create(
            @NotNull @Positive Long raceId,
            @NotNull @Positive Long camelId,
            @Positive Long registrantId
    ) {}

    public record Decision(@NotNull RaceEntryStatus entryStatus) {}
}
