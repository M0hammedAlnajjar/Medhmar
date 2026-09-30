package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

// Each camel has at most one pedigree record. Registered parents reference existing camels.
// Legacy free-text sire/dam names remain on Camel for ancestors not registered in the platform.
@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Pedigree {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pedigreeId;

    private Date recordedAt;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "camel_id", nullable = false, unique = true)
    private Camel camel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sire_camel_id")
    private Camel sireCamel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dam_camel_id")
    private Camel damCamel;
}
