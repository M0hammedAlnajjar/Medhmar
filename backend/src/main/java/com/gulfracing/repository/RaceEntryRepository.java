package com.gulfracing.repository;

import com.gulfracing.entity.RaceEntry;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RaceEntryRepository extends JpaRepository<RaceEntry, Long> {
    boolean existsByRaceRaceIdAndCamelCamelId(Long raceId, Long camelId);

    List<RaceEntry> findByRegistrant_UserIdOrderByEntryIdDesc(Long userId);

    List<RaceEntry> findByRace_RaceIdOrderByEntryIdAsc(Long raceId);

    @Query("SELECT COALESCE(MAX(e.participantNumber), 0) FROM RaceEntry e WHERE e.race.raceId = :raceId")
    Integer maxParticipantNumber(@Param("raceId") Long raceId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM RaceEntry e WHERE e.entryId = :id")
    Optional<RaceEntry> findLockedById(@Param("id") Long id);

    @Query("""
            SELECT re.race.organizer.userId
            FROM RaceEntry re
            WHERE re.entryId = :entryId
            """)
    Optional<Long> findRaceOrganizerIdByEntryId(@Param("entryId") Long entryId);
}
