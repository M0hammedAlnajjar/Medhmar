package com.gulfracing.repository;

import com.gulfracing.entity.SaleTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SaleTransactionRepository  extends JpaRepository<SaleTransaction, Long> {
    boolean existsByOffer_OfferId(Long offerId);
}

