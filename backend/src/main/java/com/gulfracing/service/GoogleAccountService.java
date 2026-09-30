package com.gulfracing.service;

import com.gulfracing.entity.*;
import com.gulfracing.enums.*;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.*;
import com.gulfracing.security.AccountOidcUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class GoogleAccountService {
    private final UserRepository users;
    private final AuthAccountRepository accounts;
    private final UserService userService;

    @Transactional
    public AccountOidcUser provision(OidcUser verifiedGoogleUser) {
        if (!Boolean.TRUE.equals(verifiedGoogleUser.getEmailVerified()) || verifiedGoogleUser.getEmail() == null)
            throw ApiException.forbidden();
        String subject = verifiedGoogleUser.getSubject();
        if (subject == null || subject.isBlank() || subject.length() > 255) throw ApiException.forbidden();
        var existing = accounts.findByProviderAndProviderSubject(Provider.GOOGLE, subject);
        if (existing.isPresent()) {
            var user = existing.get().getUser();
            if (user.getAccountStatus() != AccountStatus.ACTIVE) throw ApiException.forbidden();
            return new AccountOidcUser(user, verifiedGoogleUser);
        }
        String email = UserService.normalizeEmail(verifiedGoogleUser.getEmail());
        // Matching an email never silently links a new identity to an existing account.
        if (email.length() > 254 || users.existsByEmail(email))
            throw ApiException.conflict("Use the sign-in method already associated with this email.");
        var user = new User();
        String name = verifiedGoogleUser.getFullName();
        if (name == null || name.isBlank()) name = email.substring(0, email.indexOf('@'));
        user.setFullName(name.substring(0, Math.min(name.length(), 150)));
        user.setEmail(email);
        String picture = verifiedGoogleUser.getPicture();
        if (picture != null && picture.startsWith("https://") && picture.length() <= 2048) user.setAvatarUrl(picture);
        user.getRoles().add(userService.viewerRole());
        users.saveAndFlush(user);
        var account = new AuthAccount();
        account.setUser(user);
        account.setProvider(Provider.GOOGLE);
        account.setProviderSubject(subject);
        accounts.saveAndFlush(account);
        return new AccountOidcUser(user, verifiedGoogleUser);
    }
}
