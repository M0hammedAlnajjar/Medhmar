package com.gulfracing.repository;

import com.gulfracing.entity.RaceCardEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RaceCardEntryRepository extends JpaRepository<RaceCardEntry, Long> {
}
