package com.gulfracing.repository;

import com.gulfracing.entity.MarketPlace;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketPlaceRepository extends JpaRepository<MarketPlace, Long> {

    @Query("SELECT m FROM MarketPlace m WHERE m.isActive = true ORDER BY m.listingId DESC")
    List<MarketPlace> getAllMarketPlaces();

    Optional<MarketPlace> findByListingIdAndIsActiveTrue(Long listingId);

    boolean existsByCamel_CamelIdAndIsActiveTrue(Long camelId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM MarketPlace m WHERE m.listingId = :id")
    Optional<MarketPlace> findLockedById(@Param("id") Long id);
}
