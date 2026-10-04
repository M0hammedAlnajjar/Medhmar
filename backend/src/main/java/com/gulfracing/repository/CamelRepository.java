package com.gulfracing.repository;

import com.gulfracing.entity.Camel;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.Gender;

import jakarta.persistence.LockModeType;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CamelRepository extends JpaRepository<Camel, Long> {

    @Query("SELECT a FROM Camel a WHERE a.isActive = true")
    List<Camel> getAllCamels();

    @Query("""
            SELECT c
            FROM Camel c
            WHERE c.isActive = true
              AND (:search IS NULL
                   OR LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')))
              AND (:gender IS NULL OR c.gender = :gender)
              AND (:breed IS NULL
                   OR LOWER(c.breed) = LOWER(:breed))
              AND (:category IS NULL
                   OR LOWER(c.category) = LOWER(:category))
              AND (:status IS NULL OR c.status = :status)
            """)
    Page<Camel> searchCamels(
            @Param("search") String search,
            @Param("gender") Gender gender,
            @Param("breed") String breed,
            @Param("category") String category,
            @Param("status") CamelStatus status,
            Pageable pageable
    );

    @Query("SELECT a FROM Camel a WHERE a.isActive = true AND a.camelId = :camel")
    Camel getById(@Param("camel") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Camel c WHERE c.camelId = :id")
    java.util.Optional<Camel> findLockedById(@Param("id") Long id);
}