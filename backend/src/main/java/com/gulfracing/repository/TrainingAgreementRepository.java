package com.gulfracing.repository;

import com.gulfracing.entity.TrainingAgreement;
import com.gulfracing.enums.AgreementStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TrainingAgreementRepository extends JpaRepository<TrainingAgreement, Long> {
    boolean existsByCamel_CamelIdAndStatusIn(Long camelId, Collection<AgreementStatus> statuses);

    List<TrainingAgreement> findByTrainer_UserIdAndStatusOrderByAgreementIdDesc(
            Long trainerUserId, AgreementStatus status
    );

    List<TrainingAgreement> findByOwner_UserIdOrTrainer_UserIdOrderByAgreementIdDesc(
            Long ownerId, Long trainerUserId
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM TrainingAgreement a WHERE a.agreementId = :id")
    Optional<TrainingAgreement> findLockedById(@Param("id") Long id);
}
