package com.gulfracing.repository;

import com.gulfracing.entity.OwnershipRecord;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import java.util.Date;

public interface OwnershipRecordRepository extends JpaRepository<OwnershipRecord, Long> {
    @Query("select count(o) > 0 from OwnershipRecord o where o.camel.camelId = :camelId " +
           "and o.owner.userId = :ownerId and o.sharePercent > 0 " +
           "and (o.startAt is null or o.startAt <= :now) and (o.endAt is null or o.endAt > :now)")
    boolean hasCurrentOwnership(@Param("camelId") Long camelId, @Param("ownerId") Long ownerId, @Param("now") Date now);
}
