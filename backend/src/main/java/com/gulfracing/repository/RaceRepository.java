package com.gulfracing.repository;

import com.gulfracing.entity.Race;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RaceRepository extends JpaRepository<Race, Long> {
    // Serializes registration number allocation for the same race.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Race r WHERE r.raceId = :id")
    Optional<Race> findLockedById(@Param("id") Long id);
}
