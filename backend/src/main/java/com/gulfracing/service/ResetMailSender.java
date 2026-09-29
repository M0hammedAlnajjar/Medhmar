package com.gulfracing.service;

import com.gulfracing.exception.ApiException;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class ResetMailSender {
    private final ObjectProvider<JavaMailSender> senders;
    private final String from;
    private final String resetUrl;
    public ResetMailSender(ObjectProvider<JavaMailSender> senders,
        @Value("${app.mail.from:}") String from, @Value("${app.password-reset.url:}") String resetUrl) {
        this.senders = senders;
        this.from = from;
        this.resetUrl = resetUrl;
    }
    public void ensureAvailable() {
        if (senders.getIfAvailable() == null || from.isBlank() || resetUrl.isBlank()
            || !(resetUrl.startsWith("https://") || resetUrl.startsWith("http://localhost:"))
            || resetUrl.contains("#"))
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "MAIL_UNAVAILABLE",
                "Password reset email is not configured.");
    }
    public void send(String email, String token) {
        ensureAvailable();
        var message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Medhmar password reset");
        message.setText("Use this link within 30 minutes to reset your password:\n"
            + resetUrl + "#token=" + token
            + "\n\nIf you did not request this change, ignore this email.");
        senders.getObject().send(message);
    }
}
