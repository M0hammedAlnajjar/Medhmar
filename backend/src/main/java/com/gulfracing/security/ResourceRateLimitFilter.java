package com.gulfracing.security;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import com.github.benmanes.caffeine.cache.Ticker;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;

// Registered only in the security chain. Do not also register as a servlet filter.
public final class ResourceRateLimitFilter extends OncePerRequestFilter {
    private static final Pattern VISITS = Pattern.compile("/api/tourism/events/[0-9]+/visits");
    private final Cache<String, AtomicInteger> photos;
    private final Cache<String, AtomicInteger> visits;
    private final SecurityErrorWriter errors;
    private final boolean enabled;

    public ResourceRateLimitFilter(SecurityErrorWriter errors, boolean enabled) {
        this(errors, enabled, Ticker.systemTicker());
    }

    public ResourceRateLimitFilter(SecurityErrorWriter errors, boolean enabled, Ticker ticker) {
        this.errors = errors;
        this.enabled = enabled;
        photos = Caffeine.newBuilder().maximumSize(100_000)
                .expireAfterWrite(Duration.ofMinutes(15)).ticker(ticker).build();
        visits = Caffeine.newBuilder().maximumSize(100_000)
                .expireAfterWrite(Duration.ofMinutes(1)).ticker(ticker).build();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        if (enabled && "POST".equals(request.getMethod())) {
            String path = request.getServletPath();
            if (path.isEmpty()) path = request.getRequestURI().substring(request.getContextPath().length());
            Long userId = AccountAccess.optionalId(SecurityContextHolder.getContext().getAuthentication());
            // Never accept an arbitrary X-Forwarded-For value as the client address.
            String ipKey = "ip:" + request.getRemoteAddr();
            if ("/trainer-profile/photo".equals(path)) {
                if (!allow(photos, ipKey, 20)
                        || (userId != null && !allow(photos, "user:" + userId, 5))) {
                    limited(response, 900);
                    return;
                }
            } else if (VISITS.matcher(path).matches()) {
                if (!allow(visits, ipKey, 60)
                        || (userId != null && !allow(visits, "user:" + userId, 60))) {
                    limited(response, 60);
                    return;
                }
            }
        }
        chain.doFilter(request, response);
    }

    private boolean allow(Cache<String, AtomicInteger> cache, String key, int limit) {
        return cache.get(key, ignored -> new AtomicInteger()).incrementAndGet() <= limit;
    }

    private void limited(HttpServletResponse response, int retryAfter) throws IOException {
        response.setHeader("Retry-After", Integer.toString(retryAfter));
        errors.write(response, 429, "RESOURCE_RATE_LIMITED", "Too many requests. Try again later.");
    }
}
