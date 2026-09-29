package com.gulfracing.repository;

import com.gulfracing.entity.Challenge;
import com.gulfracing.enums.ChallengeStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.Optional;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {
    Page<Challenge> findByStatusIn(Collection<ChallengeStatus> statuses, Pageable pageable);
    Page<Challenge> findByCreator_UserId(Long creatorId, Pageable pageable);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Challenge c where c.challengeId = :id")
    Optional<Challenge> findLockedById(@Param("id") Long id);
}
