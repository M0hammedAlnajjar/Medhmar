package com.gulfracing.service;

import com.gulfracing.entity.RaceEntry;
import com.gulfracing.entity.RaceResult;
import com.gulfracing.enums.RaceEntryStatus;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.RaceEntryRepository;
import com.gulfracing.repository.RaceResultRepository;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.util.List;

@Service
public class RaceResultService {

    private final RaceResultRepository raceResultRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final Clock clock;

    public RaceResultService(
            RaceResultRepository raceResultRepository,
            RaceEntryRepository raceEntryRepository,
            Clock clock) {

        this.raceResultRepository = raceResultRepository;
        this.raceEntryRepository = raceEntryRepository;
        this.clock = clock;
    }

    public RaceResult addRaceResult(RaceResult raceResult) {

        validateRaceResult(raceResult);

        Long entryId = raceResult.getRaceEntry().getEntryId();

        RaceEntry raceEntry = raceEntryRepository.findById(entryId)
                .orElseThrow(() ->
                        ApiException.notFound("Race entry")
                );

        if (raceResultRepository.existsById(entryId)) {
            throw ApiException.badRequest(
                    "Race result already exists for this race entry."
            );
        }

        if (raceEntry.getEntryStatus() != RaceEntryStatus.ACCEPTED) {
            throw ApiException.conflict(
                    "Results can only be recorded for accepted race entries."
            );
        }

        validateRaceReadyForResults(raceEntry);

        raceResult.setRaceEntry(raceEntry);

        return raceResultRepository.save(raceResult);
    }

    public List<RaceResult> getAllRaceResults() {
        return raceResultRepository.findAll();
    }

    public RaceResult getRaceResultById(Long entryId) {

        validateId(entryId);

        return raceResultRepository.findById(entryId)
                .orElseThrow(() ->
                        ApiException.notFound("Race result")
                );
    }

    public RaceResult updateRaceResult(
            Long entryId,
            RaceResult updatedRaceResult) {

        validateId(entryId);
        validateRaceResult(updatedRaceResult);

        RaceResult raceResult = getRaceResultById(entryId);

        validateRaceReadyForResults(
                raceResult.getRaceEntry()
        );

        raceResult.setFinishPosition(
                updatedRaceResult.getFinishPosition()
        );

        raceResult.setElapsedMs(
                updatedRaceResult.getElapsedMs()
        );

        return raceResultRepository.save(raceResult);
    }

    public void deleteRaceResult(Long entryId) {

        RaceResult raceResult = getRaceResultById(entryId);

        raceResultRepository.delete(raceResult);
    }

    private void validateRaceReadyForResults(
            RaceEntry raceEntry) {

        var race = raceEntry.getRace();

        if (race.getStartsAt().isAfter(clock.instant())) {
            throw ApiException.conflict(
                    "Race results cannot be recorded before the race starts."
            );
        }

        if (race.getStatus() != RaceStatus.CLOSED
                && race.getStatus() != RaceStatus.COMPLETED) {

            throw ApiException.conflict(
                    "Race results can only be recorded for closed or completed races."
            );
        }
    }

    private void validateRaceResult(RaceResult raceResult) {

        if (raceResult == null) {
            throw ApiException.badRequest(
                    "Race result cannot be null."
            );
        }

        if (raceResult.getRaceEntry() == null
                || raceResult.getRaceEntry().getEntryId() == null) {

            throw ApiException.badRequest(
                    "Race entry ID is required."
            );
        }

        if (raceResult.getFinishPosition() == null
                || raceResult.getFinishPosition() <= 0) {

            throw ApiException.badRequest(
                    "Finish position must be greater than zero."
            );
        }

        if (raceResult.getElapsedMs() == null
                || raceResult.getElapsedMs() <= 0) {

            throw ApiException.badRequest(
                    "Elapsed time must be greater than zero."
            );
        }
    }

    private void validateId(Long entryId) {

        if (entryId == null || entryId <= 0) {
            throw ApiException.badRequest(
                    "Race entry ID must be greater than zero."
            );
        }
    }
}