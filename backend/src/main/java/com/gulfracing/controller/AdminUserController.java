package com.gulfracing.controller;

import com.gulfracing.dto.PageResponse;
import com.gulfracing.dto.UserDtos.*;
import com.gulfracing.service.UserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserService users;
    @GetMapping
    public PageResponse<UserResponse> list(@RequestParam(defaultValue = "0") @Min(0) int page,
        @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return users.list(page, size);
    }
    @PutMapping("/{id}/roles")
    public UserResponse roles(@PathVariable @Positive Long id, @Valid @RequestBody UpdateRolesRequest request) {
        return users.updateRoles(id, request.roles());
    }
    @PutMapping("/{id}/status")
    public UserResponse status(@PathVariable @Positive Long id, @Valid @RequestBody UpdateStatusRequest request) {
        return users.updateStatus(id, request.status());
    }
}
