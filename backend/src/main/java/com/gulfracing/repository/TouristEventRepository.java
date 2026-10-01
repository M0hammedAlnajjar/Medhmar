package com.gulfracing.repository;

import com.gulfracing.entity.TouristEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TouristEventRepository extends JpaRepository<TouristEvent, Long> {
    List<TouristEvent> findAllByOrderByStartAtAsc();
}
