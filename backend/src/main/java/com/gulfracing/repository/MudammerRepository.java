package com.gulfracing.repository;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.entity.Mudammer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MudammerRepository  extends JpaRepository<Mudammer, Long> {
    List<Mudammer> findByProposedBy_UserId(Long ownerUserId);

    List<Mudammer> findByMudammer_UserId(Long trainerUserId);

    List<Mudammer> findByCamel_CamelId(Long camelId);

    List<Mudammer> findByStatus(String status);
}
