package com.gulfracing.security;

import com.gulfracing.entity.User;
import com.gulfracing.enums.AccountStatus;
import org.springframework.security.core.*;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.io.Serial;
import java.util.List;

public final class AccountPrincipal implements UserDetails, CredentialsContainer, PlatformPrincipal {
    @Serial private static final long serialVersionUID = 1L;
    private final Long userId;
    private final long securityVersion;
    private final String email;
    private final boolean active;
    private final List<SimpleGrantedAuthority> authorities;
    private String password;

    public AccountPrincipal(User user, String password) {
        this.userId = user.getUserId();
        this.securityVersion = user.getSecurityVersion();
        this.email = user.getEmail();
        this.active = user.getAccountStatus() == AccountStatus.ACTIVE;
        this.authorities = user.getRoles().stream()
            .map(r -> new SimpleGrantedAuthority("ROLE_" + r.getRoleName())).toList();
        this.password = password;
    }
    @Override public Long getUserId() { return userId; }
    @Override public long getSecurityVersion() { return securityVersion; }
    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return password; }
    @Override public List<SimpleGrantedAuthority> getAuthorities() { return authorities; }
    @Override public boolean isEnabled() { return active; }
    @Override public void eraseCredentials() { password = null; }
}
