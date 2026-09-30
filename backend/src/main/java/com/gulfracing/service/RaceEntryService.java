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

            throw ApiException.conflict(
                    "Camel is already registered in this race."
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
                        ApiException.notFound("Race entry")
                );
    }

    public RaceEntry updateRaceEntry(
            Long id,
            RaceEntry updatedRaceEntry) {

        validateId(id);

        if (updatedRaceEntry == null) {
            throw ApiException.badRequest(
                    "Race entry cannot be null."
            );
        }

        if (updatedRaceEntry.getEntryStatus() == null) {
            throw ApiException.badRequest(
                    "Race entry status is required."
            );
        }

        RaceEntry raceEntry = getRaceEntryById(id);

        /*
         * Organizer/Admin may change the registration decision,
         * but cannot move the entry to another race, camel,
         * or registrant.
         */
        raceEntry.setEntryStatus(
                updatedRaceEntry.getEntryStatus()
        );

        return raceEntryRepository.save(raceEntry);
    }

    public void deleteRaceEntry(Long id) {

        RaceEntry raceEntry = getRaceEntryById(id);

        raceEntryRepository.delete(raceEntry);
    }

    public Long getRaceOrganizerId(Long entryId) {

        validateId(entryId);

        return raceEntryRepository
                .findRaceOrganizerIdByEntryId(entryId)
                .orElseThrow(() ->
                        ApiException.notFound("Race entry")
                );
    }

    private void validateRaceEntry(RaceEntry raceEntry) {

        if (raceEntry == null) {
            throw ApiException.badRequest(
                    "Race entry cannot be null."
            );
        }

        if (raceEntry.getRegisteredAt() == null) {
            throw ApiException.badRequest(
                    "Registration date is required."
            );
        }

        if (raceEntry.getParticipantNumber() == null ||
                raceEntry.getParticipantNumber() <= 0) {

            throw ApiException.badRequest(
                    "Participant number must be greater than zero."
            );
        }

        if (raceEntry.getEntryStatus() == null) {
            throw ApiException.badRequest(
                    "Race entry status is required."
            );
        }

        if (raceEntry.getRace() == null ||
                raceEntry.getRace().getRaceId() == null) {

            throw ApiException.badRequest(
                    "Race ID is required."
            );
        }

        if (raceEntry.getRegistrant() == null ||
                raceEntry.getRegistrant().getUserId() == null) {

            throw ApiException.badRequest(
                    "Registrant ID is required."
            );
        }

        if (raceEntry.getCamel() == null ||
                raceEntry.getCamel().getCamelId() == null) {

            throw ApiException.badRequest(
                    "Camel ID is required."
            );
        }
    }

    private void validateId(Long id) {

        if (id == null || id <= 0) {
            throw ApiException.badRequest(
                    "Race entry ID must be greater than zero."
            );
        }
    }
}