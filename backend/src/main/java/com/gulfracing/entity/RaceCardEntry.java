package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "race_card_entries",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_race_card_entry",
                columnNames = {"card_id", "entry_id"}
        ))
@Getter
@Setter
@NoArgsConstructor
public class RaceCardEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "card_entry_id")
    private Long cardEntryId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_id", nullable = false)
    private RaceCard card;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "entry_id", nullable = false)
    private RaceEntry entry;

    @Column(name = "trim_number", nullable = false)
    private Integer trimNumber;

    @Column(name = "camel_name_snapshot", nullable = false, length = 255)
    private String camelNameSnapshot;

    @Column(name = "owner_name_snapshot", nullable = false, length = 150)
    private String ownerNameSnapshot;

    @Column(name = "trainer_name_snapshot", length = 150)
    private String trainerNameSnapshot;
}
