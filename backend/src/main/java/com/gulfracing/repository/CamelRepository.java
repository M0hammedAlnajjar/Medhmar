package com.gulfracing.repository;

import com.gulfracing.entity.Camel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CamelRepository extends JpaRepository<Camel, Long> {

    @Query("SELECT a FROM Camel a WHERE a.isActive = true")
    List<Camel> getAllCamels();

    @Query("SELECT a FROM Camel a WHERE a.isActive = true AND a.camelId = :camel")
    Camel getById(@Param("camel") Long id);
}