package com.gulfracing.entity;

import com.gulfracing.enums.AgreementStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class Mudammer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long agreementId;

    private Date proposedAt;
    private Date startsAt;
    private Date endsAt;
    private BigDecimal feeOmr;
    private BigDecimal offeredSharePct;

    @Enumerated(EnumType.STRING)
    private AgreementStatus status;

    private Date acceptedAt;


    @ManyToOne
    private User user;


    @ManyToOne
    private TrainerProfile trainer;


    @ManyToOne
    private Camel camel;


    @OneToMany(cascade = CascadeType.ALL)
    private List<TrainingLog> trainingLogs = new ArrayList<>();
}
