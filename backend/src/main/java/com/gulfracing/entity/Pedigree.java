package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

// Minimal pedigree record (ERD: Camel 1 - 1 Pedigree). The full pedigree module is a separate feature.
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
}
