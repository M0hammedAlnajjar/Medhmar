package com.gulfracing.repository;

import com.gulfracing.entity.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfferRepository extends JpaRepository<Offer, Long> {
    @Query("SELECT o FROM Offer o WHERE o.isActive = true")
    List<Offer> getAllOffers();

    @Query("SELECT o FROM Offer o WHERE o.isActive = true AND o.offerId = :id")
    Offer getById(@Param("id") Long id);
}
