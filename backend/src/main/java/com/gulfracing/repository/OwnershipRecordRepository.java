package com.gulfracing.repository;

import com.gulfracing.entity.OwnershipRecord;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Date;
import java.util.List;

public interface OwnershipRecordRepository extends JpaRepository<OwnershipRecord, Long> {

    @Query("SELECT o FROM OwnershipRecord o WHERE o.isActive = true")
    List<OwnershipRecord> getAllOwnershipRecords();

    @Query("SELECT o FROM OwnershipRecord o WHERE o.isActive = true AND o.ownershipId = :id")
    OwnershipRecord getById(@Param("id") Long id);

    @Query("""
        select count(o) > 0
        from OwnershipRecord o
        where o.camel.camelId = :camelId
          and o.owner.userId = :ownerId
          and o.isActive = true
          and o.sharePercent > 0
          and (o.startAt is null or o.startAt <= :now)
          and (o.endAt is null or o.endAt > :now)
        """)
    boolean hasCurrentOwnership(
            @Param("camelId") Long camelId,
            @Param("ownerId") Long ownerId,
            @Param("now") Date now
    );

    @Query("""
        select coalesce(sum(o.sharePercent), 0.0)
        from OwnershipRecord o
        where o.camel.camelId = :camelId
          and o.owner.userId = :ownerId
          and o.isActive = true
          and o.sharePercent > 0
          and (o.startAt is null or o.startAt <= :now)
          and (o.endAt is null or o.endAt > :now)
        """)
    Double currentOwnershipShare(
            @Param("camelId") Long camelId,
            @Param("ownerId") Long ownerId,
            @Param("now") Date now
    );

    @Query("""
        select o
        from OwnershipRecord o
        join fetch o.owner
        where o.camel.camelId = :camelId
          and o.isActive = true
          and o.sharePercent > 0
          and (o.startAt is null or o.startAt <= :now)
          and (o.endAt is null or o.endAt > :now)
        order by o.sharePercent desc, o.ownershipId
        """)
    List<OwnershipRecord> findCurrentOwnershipsWithOwner(
            @Param("camelId") Long camelId,
            @Param("now") Date now
    );

    // Full history for one camel: active and inactive records, oldest first.
    @Query("""
        select o
        from OwnershipRecord o
        join fetch o.owner
        where o.camel.camelId = :camelId
        order by o.startAt asc, o.ownershipId asc
        """)
    List<OwnershipRecord> findHistoryByCamelId(@Param("camelId") Long camelId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        select o
        from OwnershipRecord o
        where o.camel.camelId = :camelId
          and o.isActive = true
          and o.sharePercent > 0
          and (o.startAt is null or o.startAt <= :now)
          and (o.endAt is null or o.endAt > :now)
        """)
    List<OwnershipRecord> findCurrentOwnershipsForUpdate(
            @Param("camelId") Long camelId,
            @Param("now") Date now
    );
}
