package com.gulfracing.repository;
import com.gulfracing.entity.Mudammer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MudammerRepository extends JpaRepository<Mudammer, Long> {
    @Query("SELECT m FROM Mudammer m WHERE m.isActive=true")
    List<Mudammer> getAllMudammer();


    @Query("SELECT m FROM Mudammer m WHERE m.isActive=true AND m.agreementId=:mudammerID")
    Mudammer getById(@Param("mudammerID") Long id);
}
