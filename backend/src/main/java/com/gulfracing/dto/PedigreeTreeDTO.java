package com.gulfracing.dto;

import com.gulfracing.enums.Gender;

import java.util.Date;

// Bounded read-only ancestry tree. Names cover unregistered ancestors; nested nodes cover registered ones.
public record PedigreeTreeDTO(
        Long camelId,
        String name,
        String photoUrl,
        Gender gender,
        Date birthDate,
        String sireName,
        String damName,
        PedigreeTreeDTO sire,
        PedigreeTreeDTO dam
) {}
