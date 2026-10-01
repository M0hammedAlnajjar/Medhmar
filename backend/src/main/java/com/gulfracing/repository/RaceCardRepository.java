package com.gulfracing.repository;

import com.gulfracing.entity.RaceCard;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface RaceCardRepository extends JpaRepository<RaceCard, Long> {
    Optional<RaceCard> findTopByRace_RaceIdOrderByVersionDesc(Long raceId);
    List<RaceCard> findByRace_RaceIdOrderByVersionDesc(Long raceId);
}
