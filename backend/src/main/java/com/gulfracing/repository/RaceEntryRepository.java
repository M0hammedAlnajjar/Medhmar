package com.gulfracing.repository;

import com.gulfracing.entity.RaceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RaceEntryRepository extends JpaRepository<RaceEntry, Long> {

}