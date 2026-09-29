package com.gulfracing.service;

import com.gulfracing.entity.PasswordReset;
import com.gulfracing.enums.*;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;

@Service
@RequiredArgsConstructor
public class PasswordResetService {
    private static final Duration TTL = Duration.ofMinutes(30);
    private final UserRepository users;
    private final AuthAccountRepository accounts;
    private final PasswordResetRepository resets;
    private final PasswordEncoder passwords;
    private final ResetMailSender mail;
    private final ApplicationEventPublisher events;
    private final SecureRandom random;
    private final Clock clock;

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void requestReset(String email) {
        // The same configuration check and public response apply to known and unknown emails.
        mail.ensureAvailable();
        var local = accounts.findUserIdByIdentity(Provider.LOCAL, UserService.normalizeEmail(email));
        if (local.isEmpty()) return;
        var user = users.findLockedById(local.get()).orElseThrow(ApiException::unauthorized);
        if (user.getAccountStatus() != AccountStatus.ACTIVE) return;
        Instant now = clock.instant();
        // Limit repeated emails to the same account, even when requests come from different IPs.
        if (resets.existsByUser_UserIdAndExpiresAtAfter(user.getUserId(), now.plus(TTL).minusSeconds(180))) return;
        resets.invalidateUnused(user.getUserId(), now);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String rawToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        var reset = new PasswordReset();
        reset.setUser(user);
        reset.setTokenHash(hash(rawToken));
        reset.setExpiresAt(now.plus(TTL));
        resets.saveAndFlush(reset);
        events.publishEvent(new PasswordResetRequested(user.getEmail(), rawToken));
    }
    @Transactional
    public void reset(String rawToken, String newPassword) {
        UserService.validatePassword(newPassword);
        String digest = hash(rawToken);
        var userId = resets.findUserIdByTokenHash(digest).orElseThrow(PasswordResetService::invalidToken);
        // All reset operations lock the user first, then tokens, to use a consistent lock order.
        var user = users.findLockedById(userId).orElseThrow(PasswordResetService::invalidToken);
        var token = resets.findLockedByTokenHash(digest).orElseThrow(PasswordResetService::invalidToken);
        Instant now = clock.instant();
        if (token.getUsedAt() != null || !token.getExpiresAt().isAfter(now)
            || user.getAccountStatus() != AccountStatus.ACTIVE) throw invalidToken();
        var account = accounts.findByUser_UserIdAndProvider(user.getUserId(), Provider.LOCAL)
            .orElseThrow(PasswordResetService::invalidToken);
        account.setPasswordHash(passwords.encode(newPassword));
        token.setUsedAt(now);
        user.setSecurityVersion(user.getSecurityVersion() + 1);
        resets.invalidateUnused(user.getUserId(), now);
    }
    public static String hash(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("SHA-256 is unavailable.", ex);
        }
    }
    private static ApiException invalidToken() {
        return ApiException.badRequest("The reset token is invalid, expired or already used.");
    }
}
