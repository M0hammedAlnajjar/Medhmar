package com.gulfracing.ai;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.gulfracing.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class AiRequestLimiter {
    private final Cache<Long, Window> windows = Caffeine.newBuilder()
            .maximumSize(10000).expireAfterAccess(Duration.ofMinutes(2)).build();
    private final Clock clock;
    private final int requestsPerMinute;
    private final Semaphore concurrent;

    public AiRequestLimiter(Clock clock,
            @Value("${app.ai.requests-per-minute:10}") int requestsPerMinute,
            @Value("${app.ai.max-concurrent-requests:4}") int maxConcurrent) {
        if (requestsPerMinute < 1 || maxConcurrent < 1) {
            throw new IllegalArgumentException("AI limits must be positive.");
        }
        this.clock = clock;
        this.requestsPerMinute = requestsPerMinute;
        this.concurrent = new Semaphore(maxConcurrent);
    }

    public Permit acquire(Long userId) {
        if (!concurrent.tryAcquire()) throw limited("The assistant is busy. Please try again shortly.");
        var permit = new Permit(concurrent);
        var window = windows.get(userId, ignored -> new Window());
        synchronized (window) {
            var now = clock.instant();
            if (window.start == null || !now.isBefore(window.start.plusSeconds(60))) {
                window.start = now;
                window.count = 0;
            }
            if (window.count >= requestsPerMinute) {
                permit.close();
                throw limited("The assistant request limit was reached. Try again in a minute.");
            }
            window.count++;
        }
        return permit;
    }

    private static ApiException limited(String message) {
        return new ApiException(HttpStatus.TOO_MANY_REQUESTS, "AI_RATE_LIMITED", message);
    }

    private static class Window { Instant start; int count; }

    public static final class Permit implements AutoCloseable {
        private final Semaphore semaphore;
        private final AtomicBoolean closed = new AtomicBoolean();
        private Permit(Semaphore semaphore) { this.semaphore = semaphore; }
        @Override public void close() {
            if (closed.compareAndSet(false, true)) semaphore.release();
        }
    }
}
