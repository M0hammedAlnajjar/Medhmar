package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "race_cards",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_race_card_version",
                columnNames = {"race_id", "version"}
        ),
        indexes = @Index(name = "ix_race_card_race", columnList = "race_id,version"))
@Getter
@Setter
@NoArgsConstructor
public class RaceCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "card_id")
    private Long cardId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "race_id", nullable = false)
    private Race race;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "publish_date", nullable = false)
    private Instant publishDate;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "published_by", nullable = false)
    private User publishedBy;

    @OneToMany(mappedBy = "card", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("trimNumber ASC")
    private List<RaceCardEntry> entries = new ArrayList<>();
}
