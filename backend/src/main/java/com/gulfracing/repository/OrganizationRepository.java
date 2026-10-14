package com.gulfracing.repository;

import com.gulfracing.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Organization o where o.organizationId = :id")
    Optional<Organization> findLockedById(@Param("id") Long id);

    List<Organization> findAllByOrderByNameAsc();
}
