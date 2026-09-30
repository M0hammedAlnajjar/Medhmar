package com.gulfracing.repository;

import com.gulfracing.entity.PasswordReset;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.time.Instant;
import java.util.Optional;

public interface PasswordResetRepository extends JpaRepository<PasswordReset, Long> {
    Optional<PasswordReset> findByTokenHash(String hash);
    @Query("select r.user.userId from PasswordReset r where r.tokenHash = :hash")
    Optional<Long> findUserIdByTokenHash(@Param("hash") String hash);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from PasswordReset r where r.tokenHash = :hash")
    Optional<PasswordReset> findLockedByTokenHash(@Param("hash") String hash);
    boolean existsByUser_UserIdAndExpiresAtAfter(Long userId, Instant threshold);
    @Modifying
    @Query("update PasswordReset r set r.usedAt = :now where r.user.userId = :id and r.usedAt is null")
    int invalidateUnused(@Param("id") Long userId, @Param("now") Instant now);
}
