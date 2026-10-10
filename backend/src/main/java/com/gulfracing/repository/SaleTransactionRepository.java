package com.gulfracing.repository;

import com.gulfracing.entity.SaleTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface SaleTransactionRepository  extends JpaRepository<SaleTransaction, Long> {
    boolean existsByOffer_OfferId(Long offerId);
    Optional<SaleTransaction> findByOffer_OfferId(Long offerId);
}

