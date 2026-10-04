package com.gulfracing.repository;

import com.gulfracing.entity.Race;
import com.gulfracing.enums.RaceStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RaceRepository extends JpaRepository<Race, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Race r WHERE r.raceId = :id")
    Optional<Race> findLockedById(@Param("id") Long id);

    @Query("""
            SELECT r
            FROM Race r
            WHERE (
                :search IS NULL
                OR LOWER(r.name) LIKE LOWER(CONCAT('%', :search, '%'))
                OR LOWER(r.location) LIKE LOWER(CONCAT('%', :search, '%'))
            )
            AND (
                :status IS NULL
                OR r.status = :status
            )
            """)
    Page<Race> searchAndFilter(
            @Param("search") String search,
            @Param("status") RaceStatus status,
            Pageable pageable
    );
}