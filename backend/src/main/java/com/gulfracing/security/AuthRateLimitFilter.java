package com.gulfracing.security;

import com.github.benmanes.caffeine.cache.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.time.Duration;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

public class AuthRateLimitFilter extends OncePerRequestFilter {
    private static final Set<String> PATHS = Set.of("/api/auth/login", "/api/auth/register",
        "/api/auth/forgot-password", "/api/auth/reset-password");
    private final Cache<String, AtomicInteger> attempts = Caffeine.newBuilder()
        .maximumSize(100_000).expireAfterWrite(Duration.ofMinutes(15)).build();
    private final SecurityErrorWriter errors;
    private final boolean enabled;
    public AuthRateLimitFilter(SecurityErrorWriter errors, boolean enabled) {
        this.errors = errors;
        this.enabled = enabled;
    }
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        String path = request.getServletPath();
        if (enabled && "POST".equals(request.getMethod()) && PATHS.contains(path)) {
            // Never trust client-supplied X-Forwarded-For. Configure a trusted proxy separately.
            String key = request.getRemoteAddr() + ":" + path;
            int limit = path.endsWith("login") ? 20 : 5;
            if (attempts.get(key, ignored -> new AtomicInteger()).incrementAndGet() > limit) {
                response.setHeader("Retry-After", "900");
                errors.write(response, 429, "RATE_LIMITED", "Too many attempts. Try again later.");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
