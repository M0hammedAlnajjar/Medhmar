package com.gulfracing.security;

import com.gulfracing.enums.Provider;
import com.gulfracing.repository.AuthAccountRepository;
import com.gulfracing.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AccountUserDetailsService implements UserDetailsService {
    private final AuthAccountRepository accounts;
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {
        var account = accounts.findByProviderAndProviderSubject(Provider.LOCAL, UserService.normalizeEmail(email))
            .orElseThrow(() -> new UsernameNotFoundException("Invalid credentials."));
        if (account.getPasswordHash() == null) throw new UsernameNotFoundException("Invalid credentials.");
        return new AccountPrincipal(account.getUser(), account.getPasswordHash());
    }
}
