package com.gulfracing.repository;

import com.gulfracing.entity.TrainingLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrainingLogRepository extends JpaRepository<TrainingLog, Long> {

    List<TrainingLog> findByAgreement_AgreementIdOrderBySessionAtDescLogIdDesc(Long agreementId);
}
