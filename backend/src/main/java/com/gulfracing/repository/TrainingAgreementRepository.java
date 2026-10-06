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

    List<TrainingAgreement> findByOwner_UserIdOrTrainer_UserIdOrderByAgreementIdDesc(
            Long ownerId, Long trainerUserId
    );

    List<TrainingAgreement> findByTrainer_UserIdAndStatusOrderByAgreementIdDesc(
            Long trainerUserId, AgreementStatus status
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM TrainingAgreement a WHERE a.agreementId = :id")
    Optional<TrainingAgreement> findLockedById(@Param("id") Long id);

    @Query("""
        SELECT a
        FROM TrainingAgreement a
        WHERE a.camel.camelId = :camelId
          AND a.status = :status
          AND a.startsAt <= :at
          AND a.endsAt > :at
        ORDER BY a.agreementId DESC
        """)
    List<TrainingAgreement> findEffectiveForCamel(
            @Param("camelId") Long camelId,
            @Param("status") AgreementStatus status,
            @Param("at") java.time.Instant at
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT a
    FROM TrainingAgreement a
    WHERE a.camel.camelId = :camelId
      AND a.status IN :statuses
    """)
    List<TrainingAgreement> findActiveForCamelForUpdate(
            @Param("camelId") Long camelId,
            @Param("statuses") Collection<AgreementStatus> statuses
    );
    
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
    SELECT a
    FROM TrainingAgreement a
    WHERE a.camel.camelId = :camelId
      AND a.status = :status
    ORDER BY a.agreementId DESC
    """)
    List<TrainingAgreement> findByCamelAndStatusForUpdate(
            @Param("camelId") Long camelId,
            @Param("status") AgreementStatus status
    );
}
