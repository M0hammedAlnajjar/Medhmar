package com.gulfracing.service;

import com.gulfracing.entity.Race;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.RaceRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

@Service
public class RaceService {

    private final RaceRepository raceRepository;

    public RaceService(RaceRepository raceRepository) {
        this.raceRepository = raceRepository;
    }

    public Race addRace(Race race) {
        validateRace(race);
        race.setRaceId(null);
        return raceRepository.save(race);
    }

    public Page<Race> getRaces(
            String search,
            RaceStatus status,
            int page,
            int size) {

        if (page < 0) {
            throw ApiException.badRequest(
                    "Page must be zero or greater."
            );
        }

        if (size <= 0 || size > 100) {
            throw ApiException.badRequest(
                    "Size must be between 1 and 100."
            );
        }

        String normalizedSearch =
                search == null || search.trim().isEmpty()
                        ? null
                        : search.trim();

        Pageable pageable = PageRequest.of(page, size);

        return raceRepository.searchAndFilter(
                normalizedSearch,
                status,
                pageable
        );
    }

    public Race getRaceById(Long id) {
        validateId(id);

        return raceRepository.findById(id)
                .orElseThrow(() ->
                        ApiException.notFound("Race")
                );
    }

    public Race updateRace(Long id, Race updatedRace) {

        validateId(id);
        validateRace(updatedRace);

        Race race = getRaceById(id);

        validateStatusTransition(
                race.getStatus(),
                updatedRace.getStatus()
        );

        race.setName(updatedRace.getName());
        race.setStartsAt(updatedRace.getStartsAt());
        race.setLocation(updatedRace.getLocation());
        race.setDistanceKm(updatedRace.getDistanceKm());
        race.setStatus(updatedRace.getStatus());
        race.setCoverImageUrl(updatedRace.getCoverImageUrl());
        race.setResultsImageUrl(updatedRace.getResultsImageUrl());
        race.setOrganizer(updatedRace.getOrganizer());
        race.setOrganization(updatedRace.getOrganization());

        return raceRepository.save(race);
    }

    public void deleteRace(Long id) {
        Race race = getRaceById(id);
        raceRepository.delete(race);
    }

    private void validateStatusTransition(
            RaceStatus currentStatus,
            RaceStatus newStatus) {

        if (currentStatus == newStatus) {
            return;
        }

        boolean validTransition = switch (currentStatus) {

            case SCHEDULED ->
                    newStatus == RaceStatus.OPEN
                            || newStatus == RaceStatus.CANCELLED;

            case OPEN ->
                    newStatus == RaceStatus.CLOSED
                            || newStatus == RaceStatus.CANCELLED;

            case CLOSED ->
                    newStatus == RaceStatus.COMPLETED
                            || newStatus == RaceStatus.CANCELLED;

            case COMPLETED, CANCELLED -> false;
        };

        if (!validTransition) {
            throw ApiException.conflict(
                    "Race status cannot change from "
                            + currentStatus
                            + " to "
                            + newStatus
                            + "."
            );
        }
    }

    private void validateRace(Race race) {

        if (race == null) {
            throw ApiException.badRequest(
                    "Race cannot be null."
            );
        }

        if (race.getName() == null
                || race.getName().trim().isEmpty()) {
            throw ApiException.badRequest(
                    "Race name is required."
            );
        }

        if (race.getName().length() > 150) {
            throw ApiException.badRequest(
                    "Race name cannot exceed 150 characters."
            );
        }

        if (race.getStartsAt() == null) {
            throw ApiException.badRequest(
                    "Race start date is required."
            );
        }

        if (race.getLocation() == null
                || race.getLocation().trim().isEmpty()) {
            throw ApiException.badRequest(
                    "Race location is required."
            );
        }

        if (race.getLocation().length() > 255) {
            throw ApiException.badRequest(
                    "Race location cannot exceed 255 characters."
            );
        }

        if (race.getDistanceKm() == null
                || race.getDistanceKm() <= 0) {
            throw ApiException.badRequest(
                    "Race distance must be greater than zero."
            );
        }

        if (race.getStatus() == null) {
            throw ApiException.badRequest(
                    "Race status is required."
            );
        }

        if (race.getOrganizer() == null) {
            throw ApiException.badRequest(
                    "Race organizer is required."
            );
        }
    }

    private void validateId(Long id) {

        if (id == null || id <= 0) {
            throw ApiException.badRequest(
                    "Race ID must be greater than zero."
            );
        }
    }
}