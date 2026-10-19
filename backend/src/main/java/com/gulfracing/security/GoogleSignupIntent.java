package com.gulfracing.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;

import java.time.Instant;
import java.util.Set;

public final class GoogleSignupIntent {

    private static final String SESSION_KEY =
        GoogleSignupIntent.class.getName();

    private static final Set<String> ALLOWED_ROLES =
        Set.of("VIEWER", "OWNER", "TRAINER");

    private static final long EXPIRY_SECONDS = 600;

    private GoogleSignupIntent() {}

    private record Intent(String role, Instant createdAt) {}

    public static boolean isAllowedRole(String role) {
        return ALLOWED_ROLES.contains(role);
    }

    public static void save(HttpServletRequest request, String role) {
        if (!isAllowedRole(role)) {
            throw new IllegalArgumentException("Invalid signup role.");
        }

        request.getSession(true).setAttribute(
            SESSION_KEY,
            new Intent(role, Instant.now())
        );
    }

    public static String consume(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session == null) {
            return null;
        }

        Object value = session.getAttribute(SESSION_KEY);
        session.removeAttribute(SESSION_KEY);

        if (!(value instanceof Intent intent)) {
            return null;
        }

        if (Instant.now().isAfter(
                intent.createdAt().plusSeconds(EXPIRY_SECONDS))) {
            return null;
        }

        return isAllowedRole(intent.role()) ? intent.role() : null;
    }

    public static void clear(HttpServletRequest request) {
        HttpSession session = request.getSession(false);

        if (session != null) {
            session.removeAttribute(SESSION_KEY);
        }
    }
}