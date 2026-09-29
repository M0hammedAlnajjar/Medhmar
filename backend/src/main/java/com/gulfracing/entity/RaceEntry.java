package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name = "race_entries")
@Getter
@Setter
@NoArgsConstructor
public class RaceEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "entry_id")
    private Long entryId;

    @Column(name = "registered_at", nullable = false)
    private Instant registeredAt;

    @Column(name = "participant_number", nullable = false)
    private Integer participantNumber;

    @Column(name = "entry_status", nullable = false, length = 30)
    private String entryStatus;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registrant_id", nullable = false)
    private User registrant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camel_id", nullable = false)
    private Camel camel;
}