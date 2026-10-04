package com.gulfracing.ai;

import com.gulfracing.exception.ApiException;
import org.junit.jupiter.api.Test;
import java.time.Clock;
import java.time.Instant;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class AiRequestLimiterTests {
    @Test
    void quotaIsPerAccountAndResetsAfterOneMinute() {
        var clock = mock(Clock.class);
        var now = Instant.parse("2030-01-01T10:00:00Z");
        when(clock.instant()).thenReturn(now);
        var limiter = new AiRequestLimiter(clock, 1, 2);
        limiter.acquire(1L).close();
        assertThatThrownBy(() -> limiter.acquire(1L)).isInstanceOf(ApiException.class);
        limiter.acquire(2L).close();
        when(clock.instant()).thenReturn(now.plusSeconds(60));
        limiter.acquire(1L).close();
    }

    @Test
    void concurrentCallsAreBoundedAndClosingTwiceDoesNotIncreaseCapacity() {
        var limiter = new AiRequestLimiter(Clock.systemUTC(), 10, 1);
        var first = limiter.acquire(1L);
        assertThatThrownBy(() -> limiter.acquire(2L)).isInstanceOf(ApiException.class);
        first.close();
        first.close();
        try (var second = limiter.acquire(2L)) {
            assertThatThrownBy(() -> limiter.acquire(3L)).isInstanceOf(ApiException.class);
        }
        limiter.acquire(3L).close();
    }
}
