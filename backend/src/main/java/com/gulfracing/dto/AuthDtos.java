package com.gulfracing.dto;

import jakarta.validation.constraints.*;

public final class AuthDtos {
    private AuthDtos() {}
    public record RegisterRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(min = 12, max = 72) String password,
        @Pattern(regexp = "ar|en") String preferredLanguage
    ) {}
    public record LoginRequest(
        @NotBlank @Email @Size(max = 254) String email,
        @NotBlank @Size(max = 72) String password
    ) {}
    public record ForgotPasswordRequest(@NotBlank @Email @Size(max = 254) String email) {}
    public record ResetPasswordRequest(
        @NotBlank @Pattern(regexp = "[A-Za-z0-9_-]{43}") String token,
        @NotBlank @Size(min = 12, max = 72) String password
    ) {}
    public record MessageResponse(String message) {}
    public record CsrfResponse(String headerName, String token) {}
}
