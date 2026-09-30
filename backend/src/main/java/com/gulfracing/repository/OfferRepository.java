package com.gulfracing.repository;

import com.gulfracing.entity.Offer;
import com.gulfracing.enums.OfferStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {

    List<Offer> findByIsActiveTrueOrderByOfferIdDesc();

    List<Offer> findByUser_UserIdAndIsActiveTrueOrderByOfferIdDesc(Long userId);

    List<Offer> findByMarketplace_ListingIdAndIsActiveTrueOrderByOfferIdDesc(Long listingId);

    List<Offer> findByMarketplace_ListingIdAndIsActiveTrueAndStatus(
            Long listingId,
            OfferStatus status
    );

    boolean existsByMarketplace_ListingIdAndUser_UserIdAndIsActiveTrueAndStatus(
            Long listingId,
            Long userId,
            OfferStatus status
    );
}
