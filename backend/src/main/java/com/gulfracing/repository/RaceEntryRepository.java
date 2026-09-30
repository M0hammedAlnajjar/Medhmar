package com.gulfracing.repository;

import com.gulfracing.entity.RaceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RaceEntryRepository extends JpaRepository<RaceEntry, Long> {

    boolean existsByRaceRaceIdAndCamelCamelId(Long raceId, Long camelId);

    @Query("""
            SELECT re.race.organizer.userId
            FROM RaceEntry re
            WHERE re.entryId = :entryId
            """)
    Optional<Long> findRaceOrganizerIdByEntryId(@Param("entryId") Long entryId);
}