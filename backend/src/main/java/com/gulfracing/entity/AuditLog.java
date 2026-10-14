package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "audit_log")
@Getter
@Setter
@NoArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "audit_id")
    private Long auditId;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    // Snapshot ID intentionally survives account removal; legacy records may lack an actor.
    @Column(name = "actor_user_id")
    private Long actorUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camel_id")
    private Camel camel;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "race_card_audit_log",
            joinColumns = @JoinColumn(name = "audit_id"),
            inverseJoinColumns = @JoinColumn(name = "card_id")
    )
    private Set<RaceCard> raceCards = new HashSet<>();
}