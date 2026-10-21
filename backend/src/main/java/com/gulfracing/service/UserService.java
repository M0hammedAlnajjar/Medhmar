package com.gulfracing.service;

import com.gulfracing.dto.AuthDtos.RegisterRequest;
import com.gulfracing.dto.UserDtos.*;
import com.gulfracing.dto.PageResponse;
import com.gulfracing.dto.AdminUserStatsResponse;
import com.gulfracing.entity.*;
import com.gulfracing.enums.*;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.time.*;

@Service
@RequiredArgsConstructor
public class UserService {
    private final AuditRecorder audit;
    private static final Set<String> SELF_REGISTRATION_ROLES = Set.of("VIEWER", "OWNER", "TRAINER");

    private final UserRepository users;
    private final RoleRepository roles;
    private final AuthAccountRepository accounts;
    private final PasswordEncoder passwords;
    private final Clock clock;

    public static String normalizeEmail(String email) {
        return email == null ? "" : email.strip().toLowerCase(Locale.ROOT);
    }
    public static void validatePassword(String password) {
        if (password == null || password.length() < 12 || password.getBytes(StandardCharsets.UTF_8).length > 72)
            throw ApiException.badRequest("Password must have at least 12 characters and at most 72 UTF-8 bytes.");
    }
    @Transactional
    public UserResponse register(RegisterRequest request) {
        validatePassword(request.password());
        String email = normalizeEmail(request.email());
        if (users.existsByEmail(email)) throw ApiException.conflict("This email is already registered.");
        var user = new User();
        user.setFullName(request.fullName().strip());
        user.setEmail(email);
        user.setPreferredLanguage(request.preferredLanguage() == null ? "ar" : request.preferredLanguage());

        String roleName = request.role() == null ? "" : request.role().strip().toUpperCase(Locale.ROOT);
        if (!SELF_REGISTRATION_ROLES.contains(roleName))
            throw ApiException.badRequest("Role must be VIEWER, OWNER or TRAINER.");

        var selectedRole = roles.findByRoleName(roleName)
            .orElseThrow(() -> new IllegalStateException("The selected registration role is missing. Apply the database migrations."));
        user.getRoles().add(selectedRole);

        users.saveAndFlush(user);
        var account = new AuthAccount();
        account.setUser(user);
        account.setProvider(Provider.LOCAL);
        account.setProviderSubject(email);
        account.setPasswordHash(passwords.encode(request.password()));
        accounts.saveAndFlush(account);
        return response(user);
    }
    public Role viewerRole() {
        return roles.findByRoleName("VIEWER").orElseThrow(() ->
            new IllegalStateException("The VIEWER role is missing. Apply the database migrations."));
    }

    /**
     * Called only after a marketplace offer has been accepted and ownership has
     * transferred, within the SAME database transaction as the sale.
     *
     * Locks the buyer to serialize concurrent role grants and admin role edits.
     * Only adds OWNER: existing VIEWER, TRAINER and other roles are preserved.
     * securityVersion invalidates sessions with stale role authorities.
     *
     * @return true only if OWNER was newly granted
     */
    @Transactional
    public boolean grantOwnerRoleAfterSale(Long buyerId, Long camelId, Long sellerId) {
        var buyer = users.findLockedById(buyerId)
            .orElseThrow(() -> ApiException.notFound("Buyer"));
        if (buyer.getAccountStatus() != AccountStatus.ACTIVE) {
            throw ApiException.forbidden();
        }
        if (buyer.getRoles().stream().anyMatch(role -> "OWNER".equals(role.getRoleName()))) {
            return false;
        }
        var ownerRole = roles.findByRoleName("OWNER").orElseThrow(() ->
            new IllegalStateException("The OWNER role is missing. Apply the database migrations."));
        buyer.getRoles().add(ownerRole);
        buyer.setSecurityVersion(buyer.getSecurityVersion() + 1);
        audit.record("OWNER_ROLE_GRANTED", "User", buyerId, camelId, sellerId);
        return true;
    }
    @Transactional(readOnly = true)
    public User getActive(Long id) {
        var user = users.findById(id).orElseThrow(ApiException::unauthorized);
        if (user.getAccountStatus() != AccountStatus.ACTIVE) throw ApiException.unauthorized();
        return user;
    }
    @Transactional(readOnly = true)
    public boolean isAdmin(Long id) {
        return id != null && getActive(id).getRoles().stream().anyMatch(r -> r.getRoleName().equals("ADMIN"));
    }
    @Transactional(readOnly = true)
    public UserResponse me(Long id) { return response(getActive(id)); }

    @Transactional
    public UserResponse updateProfile(Long id, UpdateProfileRequest request) {
        var user = getActive(id);
        user.setFullName(request.fullName().strip());
        user.setPreferredLanguage(request.preferredLanguage());
        user.setAvatarUrl(request.avatarUrl());
        return response(user);
    }
    @Transactional(readOnly = true)
    public PageResponse<UserResponse> list(int page, int size) {
        return PageResponse.from(users.findAll(PageRequest.of(page, size, Sort.by("userId"))), this::response);
    }
    private static Map<String, Long> countsByRole(List<Object[]> rows) {
        var result = new HashMap<String, Long>();
        for (var row : rows) {
            result.put((String) row[0], ((Number) row[1]).longValue());
        }
        return result;
    }

    /** Compare this month's registrations with an equally long portion of the previous month.
     * Role totals reflect CURRENT roles and may overlap; they are not exclusive account categories.
     */
    @Transactional(readOnly = true)
    public AdminUserStatsResponse statistics() {
        Instant now = clock.instant();
        LocalDate utcDate = now.atZone(ZoneOffset.UTC).toLocalDate();
        Instant currentMonth = utcDate.withDayOfMonth(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant previousMonth = utcDate.withDayOfMonth(1).minusMonths(1).atStartOfDay(ZoneOffset.UTC).toInstant();
        Instant previousEnd = previousMonth.plus(Duration.between(currentMonth, now));
        if (previousEnd.isAfter(currentMonth)) previousEnd = currentMonth;

        var allRoles = countsByRole(users.countUsersByRole());
        var thisMonth = countsByRole(users.countNewUsersByRoleBetween(currentMonth, now));
        var lastPeriod = countsByRole(users.countNewUsersByRoleBetween(previousMonth, previousEnd));
        var roleStats = new LinkedHashMap<String, AdminUserStatsResponse.RoleStats>();
        for (var role : List.of("VIEWER", "OWNER", "TRAINER", "ORGANIZER", "ADMIN")) {
            roleStats.put(role, new AdminUserStatsResponse.RoleStats(
                allRoles.getOrDefault(role, 0L),
                thisMonth.getOrDefault(role, 0L),
                lastPeriod.getOrDefault(role, 0L)));
        }
        return new AdminUserStatsResponse(
            users.count(),
            users.countByJoinedAtGreaterThanEqualAndJoinedAtLessThan(currentMonth, now),
            users.countByJoinedAtGreaterThanEqualAndJoinedAtLessThan(previousMonth, previousEnd),
            roleStats, now);
    }

    @Transactional
    public UserResponse updateRoles(Long id, Set<String> roleNames) {
        var user = users.findLockedById(id).orElseThrow(() -> ApiException.notFound("User"));
        var selected = new HashSet<Role>();
        for (String name : roleNames)
            selected.add(roles.findByRoleName(name).orElseThrow(() -> ApiException.badRequest("Unknown role.")));
        if (selected.isEmpty()) throw ApiException.badRequest("At least one role is required.");
        user.setRoles(selected);
        user.setSecurityVersion(user.getSecurityVersion() + 1);
        audit.record("ACCESS_CHANGED", "User", id, null, null);
        return response(user);
    }
    @Transactional
    public UserResponse updateStatus(Long id, AccountStatus status) {
        var user = users.findLockedById(id).orElseThrow(() -> ApiException.notFound("User"));
        user.setAccountStatus(status);
        user.setSecurityVersion(user.getSecurityVersion() + 1);
        audit.record("ACCESS_CHANGED", "User", id, null, null);
        return response(user);
    }
    public UserResponse response(User user) {
        return new UserResponse(user.getUserId(), user.getFullName(), user.getEmail(),
            user.getPreferredLanguage(), user.getAccountStatus(), user.getJoinedAt(), user.getAvatarUrl(),
            user.getRoles().stream().map(Role::getRoleName).sorted().toList());
    }
}
