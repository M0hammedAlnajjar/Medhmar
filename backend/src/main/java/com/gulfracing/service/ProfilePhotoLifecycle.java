package com.gulfracing.service;

import com.gulfracing.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.util.Objects;

@Service
public class ProfilePhotoLifecycle {
    private static final Logger log = LoggerFactory.getLogger(ProfilePhotoLifecycle.class);
    private final TrainerPhotoStorageService storage;
    private final UserRepository users;
    private final TransactionTemplate cleanupTransaction;

    public ProfilePhotoLifecycle(TrainerPhotoStorageService storage, UserRepository users,
                                 PlatformTransactionManager transactions) {
        this.storage = storage;
        this.users = users;
        this.cleanupTransaction = new TransactionTemplate(transactions);
        this.cleanupTransaction.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        this.cleanupTransaction.setReadOnly(true);
    }

    // Call while holding the user's row lock. An upload is retained only if the
    // database commits its URL; the previous image is retained until that commit.
    public void replaced(String previousUrl, String nextUrl, boolean uploaded) {
        if (Objects.equals(previousUrl, nextUrl)) return;
        if (!TransactionSynchronizationManager.isActualTransactionActive()
                || !TransactionSynchronizationManager.isSynchronizationActive()) {
            throw new IllegalStateException("Photo replacement requires a transaction.");
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status == STATUS_COMMITTED) cleanUnreferenced(previousUrl);
                else if (status == STATUS_ROLLED_BACK && uploaded) cleanUnreferenced(nextUrl);
                // An unknown outcome must not remove a potentially committed file.
            }
        });
    }

    private void cleanUnreferenced(String url) {
        if (!storage.isManagedUrl(url)) return;
        try {
            cleanupTransaction.executeWithoutResult(status -> {
                // Preserve legacy photos still referenced by another profile.
                if (!users.existsByAvatarUrl(url)) {
                    try {
                        storage.deleteManaged(url);
                    } catch (IOException failure) {
                        throw new IllegalStateException("Photo cleanup failed.", failure);
                    }
                }
            });
        } catch (RuntimeException failure) {
            // Cleanup failure must not turn an already committed profile update into a 500.
            log.warn("Profile photo cleanup needs attention ({})", failure.getClass().getSimpleName());
        }
    }
}
