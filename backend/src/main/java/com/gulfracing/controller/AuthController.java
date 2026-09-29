package com.gulfracing.controller;

import com.gulfracing.dto.AuthDtos.*;
import com.gulfracing.dto.UserDtos.UserResponse;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.*;
import jakarta.servlet.http.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserService users;
    private final PasswordResetService resets;
    private final AuthenticationManager authenticationManager;
    private final SessionAuthenticationStrategy loginSessionStrategy;
    private final SecurityContextRepository contexts;

    @GetMapping("/csrf")
    public ResponseEntity<CsrfResponse> csrf(CsrfToken token) {
        return ResponseEntity.ok().cacheControl(CacheControl.noStore())
            .body(new CsrfResponse(token.getHeaderName(), token.getToken()));
    }
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse register(@Valid @RequestBody RegisterRequest request) {
        return users.register(request);
    }
    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest body,
        HttpServletRequest request, HttpServletResponse response) {
        if (body.password().getBytes(StandardCharsets.UTF_8).length > 72)
            throw new BadCredentialsException("Invalid credentials.");
        var auth = authenticationManager.authenticate(
            UsernamePasswordAuthenticationToken.unauthenticated(body.email(), body.password()));
        loginSessionStrategy.onAuthentication(auth, request, response);
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        contexts.saveContext(context, request, response);
        return users.me(AccountAccess.requiredId(auth));
    }
    @PostMapping("/forgot-password")
    public MessageResponse forgot(@Valid @RequestBody ForgotPasswordRequest request) {
        resets.requestReset(request.email());
        return new MessageResponse("If an eligible account exists, a reset link will be sent.");
    }
    @PostMapping("/reset-password")
    public MessageResponse reset(@Valid @RequestBody ResetPasswordRequest request) {
        resets.reset(request.token(), request.password());
        return new MessageResponse("Password changed. Sign in again.");
    }
}
