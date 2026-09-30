package com.gulfracing.dto;

import com.gulfracing.entity.Camel;
import com.gulfracing.entity.Pedigree;

import java.util.Date;

// Public view: only camel identity and parent names are included; no owner/account data.
public record PedigreeDTO(
        Long pedigreeId,
        Long camelId,
        Date recordedAt,
        Long sireCamelId,
        String sire,
        Long damCamelId,
        String dam
) {
    public static PedigreeDTO of(Camel camel, Pedigree pedigree) {
        Camel sire = pedigree == null ? null : pedigree.getSireCamel();
        Camel dam = pedigree == null ? null : pedigree.getDamCamel();

        return new PedigreeDTO(
                pedigree == null ? null : pedigree.getPedigreeId(),
                camel.getCamelId(),
                pedigree == null ? null : pedigree.getRecordedAt(),
                sire == null ? null : sire.getCamelId(),
                sire == null ? camel.getSire() : sire.getName(),
                dam == null ? null : dam.getCamelId(),
                dam == null ? camel.getDam() : dam.getName()
        );
    }
}
