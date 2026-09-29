package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(
    name = "votes",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_vote_user_challenge",
        columnNames = {"user_id", "challenge_id"}
    )
)
@Getter
@Setter
@NoArgsConstructor
public class Vote {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vote_id")
    private Long voteId;

    @Column(name = "voted_at", nullable = false, updatable = false)
    private Instant votedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, updatable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumns({
        @JoinColumn(
            name = "challenge_id",
            referencedColumnName = "challenge_id",
            nullable = false,
            updatable = false
        ),
        @JoinColumn(
            name = "camel_id",
            referencedColumnName = "camel_id",
            nullable = false,
            updatable = false
        )
    })
    private ChallengeCamel challengeCamel;

    @PrePersist
    private void beforeInsert() {
        if (votedAt == null) {
            votedAt = Instant.now();
        }
    }
}
