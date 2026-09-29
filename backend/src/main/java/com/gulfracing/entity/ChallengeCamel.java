package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "challenge_camels")
@Getter
@Setter
@NoArgsConstructor
public class ChallengeCamel {

    @EmbeddedId
    private ChallengeCamelId id = new ChallengeCamelId();

    @MapsId("challengeId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "challenge_id", nullable = false)
    private Challenge challenge;

    @MapsId("camelId")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "camel_id", nullable = false)
    private Camel camel;

    // Calculated from votes by the service; not stored as a column.
    @Transient
    private Long voteCount;

    // Calculated from votes by the service; not stored as a column.
    @Transient
    private BigDecimal votePercent;
}
