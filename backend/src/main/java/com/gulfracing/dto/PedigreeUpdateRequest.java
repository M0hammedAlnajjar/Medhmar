package com.gulfracing.dto;

import jakarta.validation.constraints.Positive;

// Null means no registered parent for that side. Legacy names can still be stored on Camel.
public record PedigreeUpdateRequest(
        @Positive(message = "Sire camel ID must be positive") Long sireCamelId,
        @Positive(message = "Dam camel ID must be positive") Long damCamelId
) {}
