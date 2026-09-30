package com.gulfracing.service;

// An in-process event; never serialize or log this event because it contains a raw token.
public record PasswordResetRequested(String email, String token) {}
