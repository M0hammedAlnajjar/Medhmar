package com.gulfracing.security;

import com.gulfracing.enums.AccountStatus;
import com.gulfracing.repository.UserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

// Registered only in the security chain, not as a servlet-container filter.
@RequiredArgsConstructor
public class SessionAccountFilter extends OncePerRequestFilter {
    private final UserRepository users;
    private final SecurityErrorWriter errors;
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
        throws ServletException, IOException {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof PlatformPrincipal principal) {
            var user = users.findById(principal.getUserId()).orElse(null);
            if (user == null || user.getAccountStatus() != AccountStatus.ACTIVE
                || user.getSecurityVersion() != principal.getSecurityVersion()) {
                new SecurityContextLogoutHandler().logout(request, response, auth);
                errors.write(response, 401, "SESSION_EXPIRED", "Sign in again to continue.");
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
