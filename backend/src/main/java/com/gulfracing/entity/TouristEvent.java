package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "tourist_events", indexes = {
        @Index(name = "ix_tourist_event_org_start", columnList = "organization_id,start_at")
})
@Getter
@Setter
@NoArgsConstructor
public class TouristEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "event_id")
    private Long eventId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;

    @Column(name = "name", nullable = false, length = 180)
    private String name;

    @Column(name = "event_type", nullable = false, length = 80)
    private String type;

    @Column(name = "location", nullable = false, length = 255)
    private String location;

    @Column(name = "start_at", nullable = false)
    private Instant startAt;

    @Column(name = "end_at", nullable = false)
    private Instant endAt;

    @Column(name = "description", length = 2000)
    private String description;
}
