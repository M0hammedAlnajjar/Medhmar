package com.gulfracing.service;

import com.gulfracing.dto.AdminSystemHealthResponse;
import com.gulfracing.repository.ChallengeRepository;
import com.gulfracing.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Clock;

@Service
@RequiredArgsConstructor
public class AdminSystemHealthService {
    private final JdbcTemplate jdbc;
    private final ChallengeRepository challenges;
    private final VoteRepository votes;
    private final Clock clock;

    /**
     * This request itself confirms that the backend responded. A separate SELECT 1 checks
     * live database connectivity; counters are queried only after that succeeds.
     * No JDBC URL, SQL exception, credentials or server internals leave this service.
     */
    public AdminSystemHealthResponse check() {
        var checkedAt = clock.instant();
        try {
            var probe = jdbc.queryForObject("SELECT 1", Integer.class);
            if (!Integer.valueOf(1).equals(probe)) {
                return new AdminSystemHealthResponse("RESPONDING", "DISCONNECTED", null, null, checkedAt);
            }
            return new AdminSystemHealthResponse(
                "RESPONDING", "CONNECTED", challenges.count(), votes.count(), checkedAt);
        } catch (RuntimeException ex) {
            // A DB failure must not leak JDBC errors, credentials, or exception messages.
            return new AdminSystemHealthResponse("RESPONDING", "DISCONNECTED", null, null, checkedAt);
        }
    }
}
