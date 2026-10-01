package com.gulfracing.service;

import com.gulfracing.dto.RaceEntryRequests;
import com.gulfracing.entity.Race;
import com.gulfracing.entity.RaceEntry;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.RaceEntryStatus;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.RaceEntryRepository;
import com.gulfracing.repository.RaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RaceEntryService {
    private final RaceEntryRepository entries;
    private final RaceRepository races;
    private final CamelRepository camels;
    private final CamelAccessService camelAccess;
    private final UserService users;
    private final Clock clock;

    @Transactional
    public RaceEntry register(RaceEntryRequests.Create request, Long actorId) {
        var registrant = users.getActive(actorId);
        if (request.registrantId() != null && !request.registrantId().equals(actorId)) {
            throw ApiException.forbidden();
        }
        var race = races.findLockedById(request.raceId())
                .orElseThrow(() -> ApiException.notFound("Race"));
        Instant now = clock.instant();
        if (race.getStatus() != RaceStatus.OPEN || !race.getStartsAt().isAfter(now)) {
            throw ApiException.conflict("Registration is not open for this race.");
        }
        var camel = camels.findById(request.camelId())
                .orElseThrow(() -> ApiException.notFound("Camel"));
        if (!Boolean.TRUE.equals(camel.getIsActive()) || camel.getStatus() != CamelStatus.ACTIVE) {
            throw ApiException.conflict("Only active camels can be registered.");
        }
        camelAccess.requireOwner(camel.getCamelId(), actorId);
        if (entries.existsByRaceRaceIdAndCamelCamelId(race.getRaceId(), camel.getCamelId())) {
            throw ApiException.conflict("This camel is already registered for the race.");
        }

        int nextNumber = entries.maxParticipantNumber(race.getRaceId()) + 1;
        var entry = new RaceEntry();
        entry.setRace(race);
        entry.setCamel(camel);
        entry.setRegistrant(registrant);
        entry.setRegisteredAt(now);
        entry.setParticipantNumber(nextNumber);
        entry.setEntryStatus(RaceEntryStatus.PENDING);
        return entries.saveAndFlush(entry);
    }

    @Transactional(readOnly = true)
    public List<RaceEntry> getAllRaceEntries(Long actorId) {
        requireAdmin(actorId);
        return entries.findAll();
    }

    @Transactional(readOnly = true)
    public List<RaceEntry> mine(Long actorId) {
        users.getActive(actorId);
        return entries.findByRegistrant_UserIdOrderByEntryIdDesc(actorId);
    }

    @Transactional(readOnly = true)
    public List<RaceEntry> forRace(Long raceId, Long actorId) {
        requireOrganizer(raceById(raceId), actorId);
        return entries.findByRace_RaceIdOrderByEntryIdAsc(raceId);
    }

    @Transactional(readOnly = true)
    public RaceEntry getById(Long id, Long actorId) {
        var entry = entryById(id);
        users.getActive(actorId);
        if (!actorId.equals(entry.getRegistrant().getUserId())
                && !actorId.equals(entry.getRace().getOrganizer().getUserId())
                && !users.isAdmin(actorId)) {
            throw ApiException.forbidden();
        }
        return entry;
    }

    @Transactional
    public RaceEntry decide(Long id, RaceEntryStatus decision, Long actorId) {
        if (decision != RaceEntryStatus.ACCEPTED && decision != RaceEntryStatus.REJECTED) {
            throw ApiException.badRequest("Decision must be ACCEPTED or REJECTED.");
        }
        var entry = lockedEntry(id);
        requireOrganizer(entry.getRace(), actorId);
        if (entry.getEntryStatus() != RaceEntryStatus.PENDING) {
            throw ApiException.conflict("Only pending entries can be decided.");
        }
        if (!entry.getRace().getStartsAt().isAfter(clock.instant())
                || (entry.getRace().getStatus() != RaceStatus.OPEN
                && entry.getRace().getStatus() != RaceStatus.CLOSED)) {
            throw ApiException.conflict("Registration decisions are closed for this race.");
        }
        entry.setEntryStatus(decision);
        return entry;
    }

    @Transactional
    public void withdraw(Long id, Long actorId) {
        var entry = lockedEntry(id);
        users.getActive(actorId);
        if (!actorId.equals(entry.getRegistrant().getUserId())) {
            throw ApiException.forbidden();
        }
        if (entry.getEntryStatus() != RaceEntryStatus.PENDING
                || !entry.getRace().getStartsAt().isAfter(clock.instant())) {
            throw ApiException.conflict("Only a pending entry can be withdrawn before the race starts.");
        }
        entry.setEntryStatus(RaceEntryStatus.WITHDRAWN);
    }

    @Transactional(readOnly = true)
    public Long getRaceOrganizerId(Long entryId) {
        validateId(entryId);
        return entries.findRaceOrganizerIdByEntryId(entryId)
                .orElseThrow(() -> ApiException.notFound("Race entry"));
    }

    private Race raceById(Long raceId) {
        validateId(raceId);
        return races.findById(raceId).orElseThrow(() -> ApiException.notFound("Race"));
    }

    private RaceEntry entryById(Long id) {
        validateId(id);
        return entries.findById(id).orElseThrow(() -> ApiException.notFound("Race entry"));
    }

    private RaceEntry lockedEntry(Long id) {
        validateId(id);
        return entries.findLockedById(id).orElseThrow(() -> ApiException.notFound("Race entry"));
    }

    private void requireOrganizer(Race race, Long actorId) {
        users.getActive(actorId);
        if (!users.isAdmin(actorId) && !actorId.equals(race.getOrganizer().getUserId())) {
            throw ApiException.forbidden();
        }
    }

    private void requireAdmin(Long actorId) {
        if (!users.isAdmin(actorId)) throw ApiException.forbidden();
    }

    private void validateId(Long id) {
        if (id == null || id <= 0) throw ApiException.badRequest("A positive ID is required.");
    }
}
