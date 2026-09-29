package com.gulfracing.controller;

import com.gulfracing.dto.UserDtos.*;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService users;
    @GetMapping("/me")
    public UserResponse me(Authentication auth) { return users.me(AccountAccess.requiredId(auth)); }
    @PutMapping("/me")
    public UserResponse update(Authentication auth, @Valid @RequestBody UpdateProfileRequest request) {
        return users.updateProfile(AccountAccess.requiredId(auth), request);
    }
}
