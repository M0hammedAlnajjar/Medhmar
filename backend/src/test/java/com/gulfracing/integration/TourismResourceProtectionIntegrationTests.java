package com.gulfracing.integration;

import com.gulfracing.dto.TourismDtos;
import com.gulfracing.service.TourismService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Set;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "app.security.resource-rate-limit-enabled=true")
class TourismResourceProtectionIntegrationTests extends IntegrationSupport {
    @Autowired TourismService tourism;

    @Test
    void repeatedAnonymousRequestsAreDeduplicatedAndRateLimitedEvenWithSpoofedHeaders() throws Exception {
        long event = event();
        String endpoint = "/api/tourism/events/" + event + "/visits";
        for (int i = 0; i < 60; i++) {
            mvc.perform(post(endpoint).with(csrf()).with(request -> {
                        request.setRemoteAddr("192.0.2.71"); return request;
                    }).header("User-Agent", "Test visitor").header("X-Forwarded-For", "198.51.100." + i))
                    .andExpect(status().isCreated());
        }
        mvc.perform(post(endpoint).with(csrf()).with(request -> {
                    request.setRemoteAddr("192.0.2.71"); return request;
                }).header("X-Forwarded-For", "203.0.113.2"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "60"))
                .andExpect(jsonPath("$.code").value("RESOURCE_RATE_LIMITED"));
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM visitor_info", Long.class)).isEqualTo(1);
    }

    @Test
    void visitsDeduplicatePerActorAndWindowWithoutReturningEarlierReferrers() {
        long event = event();
        var first = tourism.recordVisit(event, null, "192.0.2.72", "Browser", "https://example.test/private-first");
        var duplicate = tourism.recordVisit(event, null, "192.0.2.72", "Browser", "https://example.test/current");
        assertThat(duplicate.infoId()).isEqualTo(first.infoId());
        assertThat(duplicate.referrerUrl()).isEqualTo("https://example.test/current");
        var signedIn = register("visitor@example.com");
        var userVisit = tourism.recordVisit(event, signedIn.userId(), "192.0.2.72", "Browser", null);
        assertThat(tourism.recordVisit(event, signedIn.userId(), "192.0.2.73", "Another browser", null).infoId())
                .isEqualTo(userVisit.infoId());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM visitor_info", Long.class)).isEqualTo(2);
        when(clock.instant()).thenReturn(NOW.plusSeconds(901));
        assertThat(tourism.recordVisit(event, null, "192.0.2.72", "Browser", null).infoId()).isNotEqualTo(first.infoId());
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM visitor_info", Long.class)).isEqualTo(3);
    }

    @Test
    void simultaneousDuplicateVisitsProduceOneRow() throws Exception {
        long event = event();
        var start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            Callable<Long> visit = () -> {
                start.await();
                return tourism.recordVisit(event, null, "192.0.2.74", "Browser", null).infoId();
            };
            var first = executor.submit(visit);
            var second = executor.submit(visit);
            start.countDown();
            assertThat(first.get(10, TimeUnit.SECONDS)).isEqualTo(second.get(10, TimeUnit.SECONDS));
        }
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM visitor_info", Long.class)).isEqualTo(1);
    }

    private long event() {
        var admin = register("tourism-admin@example.com");
        users.updateRoles(admin.userId(), Set.of("ADMIN"));
        return tourism.createEvent(new TourismDtos.EventRequest(null, "Heritage Day", "CULTURAL_EVENT", "Muscat",
                NOW.plusSeconds(3600), NOW.plusSeconds(7200), "Public event"), admin.userId()).eventId();
    }
}
