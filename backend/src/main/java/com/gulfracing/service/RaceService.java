package com.gulfracing.service;

import com.gulfracing.entity.Race;
import com.gulfracing.repository.RaceRepository;
import org.springframework.stereotype.Service;
import java.util.List;

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

    public List<Race> getAllRaces() {
        return raceRepository.findAll();
    }

    public Race getRaceById(Long id) {
        validateId(id);

        return raceRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Race not found with ID: " + id));
    }

    public Race updateRace(Long id, Race updatedRace) {
        validateId(id);
        validateRace(updatedRace);
        Race race = getRaceById(id);
        race.setName(updatedRace.getName());
        race.setStartsAt(updatedRace.getStartsAt());
        race.setLocation(updatedRace.getLocation());
        race.setDistanceKm(updatedRace.getDistanceKm());
        race.setStatus(updatedRace.getStatus());
        race.setResultsImageUrl(updatedRace.getResultsImageUrl());
        race.setOrganizer(updatedRace.getOrganizer());

        return raceRepository.save(race);
    }

    public void deleteRace(Long id) {
        Race race = getRaceById(id);
        raceRepository.delete(race);
    }

    private void validateRace(Race race) {

        if (race == null) {
            throw new IllegalArgumentException("Race cannot be null");
        }

        if (race.getName() == null ||
                race.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Race name is required");
        }

        if (race.getName().length() > 150) {
            throw new IllegalArgumentException("Race name cannot exceed 150 characters");
        }

        if (race.getStartsAt() == null) {
            throw new IllegalArgumentException("Race start date is required");
        }

        if (race.getLocation() == null ||
                race.getLocation().trim().isEmpty()) {
            throw new IllegalArgumentException("Race location is required");
        }

        if (race.getLocation().length() > 255) {
            throw new IllegalArgumentException("Race location cannot exceed 255 characters");
        }

        if (race.getDistanceKm() == null ||
                race.getDistanceKm() <= 0) {
            throw new IllegalArgumentException("Race distance must be greater than zero");
        }

        if (race.getStatus() == null ||
                race.getStatus().trim().isEmpty()) {
            throw new IllegalArgumentException("Race status is required");
        }

        if (race.getOrganizer() == null) {
            throw new IllegalArgumentException("Race organizer is required");
        }
    }

    private void validateId(Long id) {

        if (id == null || id <= 0) {
            throw new IllegalArgumentException("Race ID must be greater than zero");
        }
    }
}