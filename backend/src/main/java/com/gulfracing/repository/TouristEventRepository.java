package com.gulfracing.repository;

import com.gulfracing.entity.TouristEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TouristEventRepository extends JpaRepository<TouristEvent, Long> {
    List<TouristEvent> findAllByOrderByStartAtAsc();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select e from TouristEvent e where e.eventId = :id")
    Optional<TouristEvent> findLockedById(@Param("id") Long id);
}
