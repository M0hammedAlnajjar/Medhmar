package com.gulfracing.service;

import com.gulfracing.dto.AuthDtos.RegisterRequest;
import com.gulfracing.dto.UserDtos.*;
import com.gulfracing.dto.PageResponse;
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

@Service
@RequiredArgsConstructor
public class UserService {
    private static final Set<String> SELF_REGISTRATION_ROLES = Set.of("VIEWER", "OWNER", "TRAINER");

    private final UserRepository users;
    private final RoleRepository roles;
    private final AuthAccountRepository accounts;
    private final PasswordEncoder passwords;

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
    @Transactional
    public UserResponse updateRoles(Long id, Set<String> roleNames) {
        var user = users.findLockedById(id).orElseThrow(() -> ApiException.notFound("User"));
        var selected = new HashSet<Role>();
        for (String name : roleNames)
            selected.add(roles.findByRoleName(name).orElseThrow(() -> ApiException.badRequest("Unknown role.")));
        if (selected.isEmpty()) throw ApiException.badRequest("At least one role is required.");
        user.setRoles(selected);
        user.setSecurityVersion(user.getSecurityVersion() + 1);
        return response(user);
    }
    @Transactional
    public UserResponse updateStatus(Long id, AccountStatus status) {
        var user = users.findLockedById(id).orElseThrow(() -> ApiException.notFound("User"));
        user.setAccountStatus(status);
        user.setSecurityVersion(user.getSecurityVersion() + 1);
        return response(user);
    }
    public UserResponse response(User user) {
        return new UserResponse(user.getUserId(), user.getFullName(), user.getEmail(),
            user.getPreferredLanguage(), user.getAccountStatus(), user.getJoinedAt(), user.getAvatarUrl(),
            user.getRoles().stream().map(Role::getRoleName).sorted().toList());
    }
}
