package com.gulfracing.repository;

import com.gulfracing.entity.VisitorInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.Instant;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VisitorInfoRepository extends JpaRepository<VisitorInfo, Long> {
    List<VisitorInfo> findByEvent_EventIdOrderByVisitDateDesc(Long eventId);
    @Query("""
        select v from VisitorInfo v left join v.user u
        where v.event.eventId = :eventId and v.visitDate > :since
          and ((:userId is not null and u.userId = :userId)
            or (:userId is null and u is null
              and (v.ipAddress = :ip or (v.ipAddress is null and :ip is null))
              and (v.deviceInfo = :device or (v.deviceInfo is null and :device is null))))
        order by v.visitDate desc
        """)
    List<VisitorInfo> findRecentVisit(@Param("eventId") Long eventId,
            @Param("userId") Long userId, @Param("ip") String ip,
            @Param("device") String device, @Param("since") Instant since, Pageable pageable);
}
