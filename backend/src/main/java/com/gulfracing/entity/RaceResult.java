package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "race_results")
@Getter
@Setter
@NoArgsConstructor
public class RaceResult {

    @Id
    @Column(name = "entry_id")
    private Long entryId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "entry_id")
    private RaceEntry raceEntry;

    @Column(name = "finish_position", nullable = false)
    private Integer finishPosition;

    @Column(name = "elapsed_ms", nullable = false)
    private Long elapsedMs;
}