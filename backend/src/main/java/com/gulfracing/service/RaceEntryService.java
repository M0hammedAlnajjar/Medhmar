package com.gulfracing.service;

import com.gulfracing.entity.RaceEntry;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.RaceEntryRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RaceEntryService {

    private final RaceEntryRepository raceEntryRepository;

    public RaceEntryService(RaceEntryRepository raceEntryRepository) {
        this.raceEntryRepository = raceEntryRepository;
    }

    public RaceEntry addRaceEntry(RaceEntry raceEntry) {

        validateRaceEntry(raceEntry);

        if (raceEntryRepository.existsByRaceRaceIdAndCamelCamelId(
                raceEntry.getRace().getRaceId(),
                raceEntry.getCamel().getCamelId())) {

            throw new IllegalArgumentException(
                    "Camel is already registered in this race"
            );
        }

        raceEntry.setEntryId(null);

        return raceEntryRepository.save(raceEntry);
    }

    public List<RaceEntry> getAllRaceEntries() {
        return raceEntryRepository.findAll();
    }

    public RaceEntry getRaceEntryById(Long id) {

        validateId(id);

        return raceEntryRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Race entry not found with ID: " + id
                        )
                );
    }

    public RaceEntry updateRaceEntry(Long id, RaceEntry updatedRaceEntry) {

        validateId(id);
        validateRaceEntry(updatedRaceEntry);

        RaceEntry raceEntry = getRaceEntryById(id);

        boolean changedRaceOrCamel =
                !raceEntry.getRace().getRaceId()
                        .equals(updatedRaceEntry.getRace().getRaceId())
                        ||
                        !raceEntry.getCamel().getCamelId()
                                .equals(updatedRaceEntry.getCamel().getCamelId());

        if (changedRaceOrCamel &&
                raceEntryRepository.existsByRaceRaceIdAndCamelCamelId(
                        updatedRaceEntry.getRace().getRaceId(),
                        updatedRaceEntry.getCamel().getCamelId())) {

            throw new IllegalArgumentException(
                    "Camel is already registered in this race"
            );
        }

        raceEntry.setRegisteredAt(updatedRaceEntry.getRegisteredAt());
        raceEntry.setParticipantNumber(updatedRaceEntry.getParticipantNumber());
        raceEntry.setEntryStatus(updatedRaceEntry.getEntryStatus());
        raceEntry.setRace(updatedRaceEntry.getRace());
        raceEntry.setRegistrant(updatedRaceEntry.getRegistrant());
        raceEntry.setCamel(updatedRaceEntry.getCamel());

        return raceEntryRepository.save(raceEntry);
    }

    public void deleteRaceEntry(Long id) {

        RaceEntry raceEntry = getRaceEntryById(id);

        raceEntryRepository.delete(raceEntry);
    }

    private void validateRaceEntry(RaceEntry raceEntry) {

        if (raceEntry == null) {
            throw new IllegalArgumentException(
                    "Race entry cannot be null"
            );
        }

        if (raceEntry.getRegisteredAt() == null) {
            throw new IllegalArgumentException(
                    "Registration date is required"
            );
        }

        if (raceEntry.getParticipantNumber() == null ||
                raceEntry.getParticipantNumber() <= 0) {
            throw new IllegalArgumentException(
                    "Participant number must be greater than zero"
            );
        }

        if (raceEntry.getEntryStatus() == null) {
            throw new IllegalArgumentException(
                    "Race entry status is required"
            );
        }

        if (raceEntry.getRace() == null ||
                raceEntry.getRace().getRaceId() == null) {
            throw new IllegalArgumentException(
                    "Race ID is required"
            );
        }

        if (raceEntry.getRegistrant() == null ||
                raceEntry.getRegistrant().getUserId() == null) {
            throw new IllegalArgumentException(
                    "Registrant ID is required"
            );
        }

        if (raceEntry.getCamel() == null ||
                raceEntry.getCamel().getCamelId() == null) {
            throw new IllegalArgumentException(
                    "Camel ID is required"
            );
        }
    }

    private void validateId(Long id) {

        if (id == null || id <= 0) {
            throw new IllegalArgumentException(
                    "Race entry ID must be greater than zero"
            );
        }
    }


    public Long getRaceOrganizerId(Long entryId) {
        if (entryId == null || entryId <= 0) {
            throw ApiException.badRequest("Race entry ID must be greater than zero.");
        }

        return raceEntryRepository.findRaceOrganizerIdByEntryId(entryId)
                .orElseThrow(() -> ApiException.notFound("Race entry"));
    }
}