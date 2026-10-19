package com.gulfracing.repository;

import com.gulfracing.entity.User;
import com.gulfracing.enums.AccountStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    boolean existsByEmail(String email);
    @EntityGraph(attributePaths = "roles")
    Optional<User> findByEmail(String email);
    @EntityGraph(attributePaths = "roles")
    java.util.List<User> findByAccountStatusAndRoles_RoleNameOrderByUserId(AccountStatus accountStatus, String roleName);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.userId = :id")
    Optional<User> findLockedById(@Param("id") Long id);
    long countByJoinedAtGreaterThanEqualAndJoinedAtLessThan(java.time.Instant from, java.time.Instant until);
}
