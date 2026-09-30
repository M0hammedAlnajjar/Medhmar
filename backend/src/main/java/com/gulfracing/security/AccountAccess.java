package com.gulfracing.security;

import com.gulfracing.exception.ApiException;
import org.springframework.security.core.Authentication;

public final class AccountAccess {
    private AccountAccess() {}
    public static Long optionalId(Authentication authentication) {
        return authentication != null && authentication.isAuthenticated()
            && authentication.getPrincipal() instanceof PlatformPrincipal p ? p.getUserId() : null;
    }
    public static Long requiredId(Authentication authentication) {
        Long id = optionalId(authentication);
        if (id == null) throw ApiException.unauthorized();
        return id;
    }
}
