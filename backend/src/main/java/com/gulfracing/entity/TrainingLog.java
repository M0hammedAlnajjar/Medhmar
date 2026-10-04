package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "training_logs", indexes = {
        @Index(name = "ix_training_log_agreement_session", columnList = "agreement_id,session_at")
})
@Getter
@Setter
@NoArgsConstructor
public class TrainingLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "log_id")
    private Long logId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "agreement_id", nullable = false, updatable = false)
    private TrainingAgreement agreement;

    @Column(name = "session_at", nullable = false, updatable = false)
    private Instant sessionAt;

    @Column(name = "duration_minutes", nullable = false, updatable = false)
    private Integer durationMinutes;

    @Column(name = "notes", nullable = false, length = 2000, updatable = false)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;
}
