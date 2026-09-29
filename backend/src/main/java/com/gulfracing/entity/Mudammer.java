package com.gulfracing.entity;

import com.gulfracing.enums.AgreementStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "training_agreement")
@Getter
@Setter
public class Mudammer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "agreement_id")
    private Long agreementId;

    @Column(name = "proposed_at")
    private LocalDateTime proposedAt;

    @Column(name = "starts_at")
    private Date startsAt;

    @Column(name = "ends_at")
    private Date endsAt;

    @Column(name = "fee_omr", precision = 10, scale = 2)
    private Double feeOmr;

    @Column(name = "offered_share_pct", precision = 5, scale = 2)
    private Double offeredSharePct;

    @Column(name = "status", length = 30)
    private AgreementStatus status;

    @Column(name = "accepted_at")
    private LocalDateTime acceptedAt;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_by_user_id", nullable = false)
    private User user;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mudammer_id", nullable = false)
    private TrainerProfile trainer;


    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "camel_id", nullable = false)
    private Camel camel;


    @OneToMany(mappedBy = "agreement", cascade = CascadeType.ALL)
    private Set<TrainingLog> trainingLogs = new HashSet<>();
}
