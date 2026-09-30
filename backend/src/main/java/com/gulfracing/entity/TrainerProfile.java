package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@Setter
@Table(name = "trainer_profile")
public class TrainerProfile {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Column(name = "location", length = 150)
    private String location;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    // "Assigned To": one trainer profile -> many training agreements
    @OneToMany(mappedBy = "trainer")
    private List<Mudammer> agreements = new ArrayList<>();}


