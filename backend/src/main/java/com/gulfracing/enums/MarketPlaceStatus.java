package com.gulfracing.enums;

public enum MarketPlaceStatus {
    AVAILABLE,
    SOLD,
    CANCELLED,
    // Moderation states. Neither is publicly visible; stored as VARCHAR so no migration is needed.
    PENDING,
    REJECTED
}
