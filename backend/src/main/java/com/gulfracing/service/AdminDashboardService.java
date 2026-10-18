package com.gulfracing.service;

import com.gulfracing.dto.AdminDashboardResponse;
import com.gulfracing.dto.AdminDashboardResponse.ActivityDay;
import com.gulfracing.dto.AdminDashboardResponse.RecentEvent;
import com.gulfracing.enums.MarketPlaceStatus;
import com.gulfracing.enums.RaceStatus;
import com.gulfracing.repository.AuditLogRepository;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.MarketPlaceRepository;
import com.gulfracing.repository.RaceRepository;
import com.gulfracing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {
    private final UserRepository users;
    private final CamelRepository camels;
    private final RaceRepository races;
    private final MarketPlaceRepository listings;
    private final AuditLogRepository audit;
    private final Clock clock;

    @Transactional(readOnly = true)
    public AdminDashboardResponse summary() {
        var now = clock.instant();
        var today = LocalDate.ofInstant(now, ZoneOffset.UTC);
        List<ActivityDay> days = new ArrayList<>();

        // Calendar buckets are UTC. Date counts are fetched on the database,
        // not by downloading all user/camel/listing records into the browser.
        for (int i = 6; i >= 0; i--) {
            var date = today.minusDays(i);
            var from = date.atStartOfDay().toInstant(ZoneOffset.UTC);
            var until = date.plusDays(1).atStartOfDay().toInstant(ZoneOffset.UTC);
            var fromDate = Date.from(from);
            var untilDate = Date.from(until);
            days.add(new ActivityDay(date,
                users.countByJoinedAtGreaterThanEqualAndJoinedAtLessThan(from, until),
                camels.countByCreatedDateGreaterThanEqualAndCreatedDateLessThan(fromDate, untilDate),
                listings.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(fromDate, untilDate)
            ));
        }

        // Fetch ONLY the latest six audit events; no full-table audit-log read.
        var events = audit.findAll(PageRequest.of(0, 6,
                Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("auditId"))))
            .getContent().stream()
            .map(a -> new RecentEvent(a.getAuditId(), a.getActionType(),
                a.getEntityType(), a.getEntityId(), a.getActorUserId(), a.getCreatedAt()))
            .toList();

        return new AdminDashboardResponse(
            users.count(),
            camels.countActiveCamels(),
            races.countByStatusIn(List.of(RaceStatus.SCHEDULED, RaceStatus.OPEN)),
            listings.countActiveListings(MarketPlaceStatus.AVAILABLE),
            days, events, now
        );
    }
}
