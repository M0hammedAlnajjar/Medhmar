package com.gulfracing.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class ResetMailListener {
    private static final Logger log = LoggerFactory.getLogger(ResetMailListener.class);
    private final ResetMailSender sender;
    @Async
    @TransactionalEventListener
    public void sendAfterCommit(PasswordResetRequested event) {
        try {
            sender.send(event.email(), event.token());
        } catch (RuntimeException ex) {
            // Do not expose an account's existence or log the token/email.
            log.error("Password reset email delivery failed; inspect SMTP configuration and availability.");
        }
    }
}
