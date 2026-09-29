package com.gulfracing.repository;

import com.gulfracing.entity.MarketPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MarketPlaceRepository extends JpaRepository<MarketPlace, Long> {
    @Query("SELECT m FROM MarketPlace m WHERE m.isActive = true")
    List<MarketPlace> getAllMarketPlaces();

    @Query("SELECT m FROM MarketPlace m WHERE m.isActive = true AND m.listingId = :marketplace")
    MarketPlace getById(@Param("marketplace") Long id);
}
