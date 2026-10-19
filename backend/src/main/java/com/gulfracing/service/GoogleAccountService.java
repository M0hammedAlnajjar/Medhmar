
package com.gulfracing.service;

import com.gulfracing.entity.*;
import com.gulfracing.enums.*;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.*;
import com.gulfracing.security.AccountOidcUser;
import com.gulfracing.security.GoogleSignupIntent;
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
    private final RoleRepository roles;

    @Transactional
    public AccountOidcUser provision(
            OidcUser verifiedGoogleUser,
            String selectedRole) {

        if (!Boolean.TRUE.equals(verifiedGoogleUser.getEmailVerified())
                || verifiedGoogleUser.getEmail() == null) {
            throw ApiException.forbidden();
        }

        String subject = verifiedGoogleUser.getSubject();

        if (subject == null || subject.isBlank()
                || subject.length() > 255) {
            throw ApiException.forbidden();
        }

        // Existing Google accounts keep their original roles.
        var existing = accounts.findByProviderAndProviderSubject(
                Provider.GOOGLE,
                subject
        );

        if (existing.isPresent()) {
            var user = existing.get().getUser();

            if (user.getAccountStatus() != AccountStatus.ACTIVE) {
                throw ApiException.forbidden();
            }

            // Signup must not silently sign in an existing account
            // or change its previously assigned role.
            if (selectedRole != null) {
                throw ApiException.conflict(
                        "An account with this email already exists. Please sign in instead."
                );
            }

            return new AccountOidcUser(user, verifiedGoogleUser);
        }

        String email = UserService.normalizeEmail(
                verifiedGoogleUser.getEmail()
        );

        // Never silently link a Google identity to an existing account.
        if (email.length() > 254 || users.existsByEmail(email)) {
            throw ApiException.conflict(
                    "An account with this email already exists. Please sign in instead."
            );
        }

        // Only the three public signup roles are permitted.
        if (selectedRole != null
                && !GoogleSignupIntent.isAllowedRole(selectedRole)) {
            throw ApiException.forbidden();
        }

        // Preserve the VIEWER default when no role was selected.
        String roleName = selectedRole == null ? "VIEWER" : selectedRole;

        var role = roles.findByRoleName(roleName)
                .orElseThrow(() -> new IllegalStateException(
                        "Required signup role is missing: " + roleName
                ));

        var user = new User();

        String name = verifiedGoogleUser.getFullName();

        if (name == null || name.isBlank()) {
            name = email.substring(0, email.indexOf('@'));
        }

        user.setFullName(
                name.substring(0, Math.min(name.length(), 150))
        );

        user.setEmail(email);

        String picture = verifiedGoogleUser.getPicture();

        if (picture != null
                && picture.startsWith("https://")
                && picture.length() <= 2048) {
            user.setAvatarUrl(picture);
        }

        // Assign the selected signup role to the new Google user.
        user.getRoles().add(role);

        users.saveAndFlush(user);

        var account = new AuthAccount();
        account.setUser(user);
        account.setProvider(Provider.GOOGLE);
        account.setProviderSubject(subject);

        accounts.saveAndFlush(account);

        return new AccountOidcUser(user, verifiedGoogleUser);
    }
}
