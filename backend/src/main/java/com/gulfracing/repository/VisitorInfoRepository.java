package com.gulfracing.repository;

import com.gulfracing.entity.VisitorInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VisitorInfoRepository extends JpaRepository<VisitorInfo, Long> {
    List<VisitorInfo> findByEvent_EventIdOrderByVisitDateDesc(Long eventId);
}
