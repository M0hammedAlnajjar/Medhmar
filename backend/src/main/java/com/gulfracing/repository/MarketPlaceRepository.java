package com.gulfracing.repository;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.enums.MarketPlaceStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Repository
public interface MarketPlaceRepository extends JpaRepository<MarketPlace, Long> {

    @Query("SELECT m FROM MarketPlace m WHERE m.isActive = true ORDER BY m.listingId DESC")
    List<MarketPlace> getAllMarketPlaces();

    Optional<MarketPlace> findByListingIdAndIsActiveTrue(Long listingId);

    boolean existsByCamel_CamelIdAndIsActiveTrue(Long camelId);
    boolean existsByCamel_CamelIdAndIsActiveTrueAndStatus(Long camelId, MarketPlaceStatus status);

    Optional<MarketPlace> findFirstByCamel_CamelIdAndIsActiveTrueAndStatusOrderByListingIdDesc(
            Long camelId, MarketPlaceStatus status);

    List<MarketPlace> findByUser_UserIdOrderByListingIdDesc(Long userId);

    List<MarketPlace> findByUser_UserIdAndStatusInOrderByListingIdDesc(
            Long userId,
            List<MarketPlaceStatus> statuses
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT m FROM MarketPlace m WHERE m.listingId = :id")
    Optional<MarketPlace> findLockedById(@Param("id") Long id);

    @Query("""
        SELECT m
        FROM MarketPlace m
        WHERE m.isActive = true
          AND (:search IS NULL
               OR LOWER(m.description) LIKE LOWER(CONCAT('%', :search, '%'))
               OR LOWER(m.camel.name) LIKE LOWER(CONCAT('%', :search, '%')))
          AND (:status IS NULL OR m.status = :status)
          AND (:camelId IS NULL OR m.camel.camelId = :camelId)
          AND (:minPrice IS NULL OR m.askingPriceOmr >= :minPrice)
          AND (:maxPrice IS NULL OR m.askingPriceOmr <= :maxPrice)
        """)
    Page<MarketPlace> searchMarketPlaces(
            @Param("search") String search,
            @Param("status") MarketPlaceStatus status,
            @Param("camelId") Long camelId,
            @Param("minPrice") Double minPrice,
            @Param("maxPrice") Double maxPrice,
            Pageable pageable
    );
}
