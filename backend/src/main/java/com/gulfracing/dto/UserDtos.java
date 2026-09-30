package com.gulfracing.dto;

import com.gulfracing.enums.AccountStatus;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.List;
import java.util.Set;

public final class UserDtos {
    private UserDtos() {}
    public record UserResponse(Long userId, String fullName, String email,
        String preferredLanguage, AccountStatus accountStatus, Instant joinedAt,
        String avatarUrl, List<String> roles) {}
    public record UpdateProfileRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Pattern(regexp = "ar|en") String preferredLanguage,
        @Size(max = 2048) @Pattern(regexp = "https?://[^\\s]+") String avatarUrl
    ) {}
    public record UpdateRolesRequest(@NotEmpty Set<@Pattern(regexp = "OWNER|TRAINER|ORGANIZER|ADMIN|VIEWER") String> roles) {}
    public record UpdateStatusRequest(@NotNull AccountStatus status) {}
}
