package com.gulfracing.repository;

import com.gulfracing.entity.TrainerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrainerProfileRepository extends JpaRepository<TrainerProfile, Long> {

    }


