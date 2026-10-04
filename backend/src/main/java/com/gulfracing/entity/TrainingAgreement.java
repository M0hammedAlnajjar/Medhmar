package com.gulfracing.entity;

import com.gulfracing.enums.AgreementStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "training_agreements", indexes = {
        @Index(name = "ix_agreement_camel_status", columnList = "camel_id,status"),
        @Index(name = "ix_agreement_owner", columnList = "owner_id"),
        @Index(name = "ix_agreement_trainer", columnList = "trainer_user_id")
})
@Getter
@Setter
@NoArgsConstructor
public class TrainingAgreement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "agreement_id")
    private Long agreementId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false, updatable = false)
    private User owner;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "trainer_user_id", nullable = false, updatable = false)
    private TrainerProfile trainer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "camel_id", nullable = false, updatable = false)
    private Camel camel;

    @Column(name = "fee_omr", nullable = false, precision = 12, scale = 3)
    private BigDecimal feeOmr;

    @Column(name = "prize_share_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal prizeSharePct;

    @Column(name = "sale_share_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal saleSharePct;

    @Column(name = "starts_at", nullable = false)
    private Instant startsAt;

    @Column(name = "ends_at", nullable = false)
    private Instant endsAt;

    @Column(name = "proposed_at", nullable = false, updatable = false)
    private Instant proposedAt;

    @Column(name = "responded_at")
    private Instant respondedAt;

    @Column(name = "accepted_at")
    private Instant acceptedAt;

    @Column(name = "terminated_at")
    private Instant terminatedAt;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "termination_reason", length = 1000)
    private String terminationReason;

    @Column(name = "completed_at")
    private Instant completedAt;

    @Column(name = "expired_at")
    private Instant expiredAt;

    @Column(name = "terms", columnDefinition = "TEXT")
    private String terms;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "terminated_by")
    private User terminatedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rejected_by")
    private User rejectedBy;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "status", nullable = false, length = 30)
    private AgreementStatus status;

    @Version
    @Column(name = "row_version", nullable = false)
    private long rowVersion;
}
