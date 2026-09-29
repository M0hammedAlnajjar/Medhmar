package com.gulfracing.security;

import com.gulfracing.entity.User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.user.*;
import java.io.Serial;

public final class AccountOidcUser extends DefaultOidcUser implements PlatformPrincipal {
    @Serial private static final long serialVersionUID = 1L;
    private final Long userId;
    private final long securityVersion;
    public AccountOidcUser(User user, OidcUser oidc) {
        super(user.getRoles().stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r.getRoleName())).toList(),
            oidc.getIdToken(), oidc.getUserInfo(), "sub");
        this.userId = user.getUserId();
        this.securityVersion = user.getSecurityVersion();
    }
    @Override public Long getUserId() { return userId; }
    @Override public long getSecurityVersion() { return securityVersion; }
}
