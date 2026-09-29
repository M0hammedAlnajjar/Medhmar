package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OwnershipRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ownershipId;

    private Double sharePercent;
    private Date startAt;
    private Date endAt;

    @ManyToOne
    @JoinColumn(name = "camel_id")
    private Camel camel;
    
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;
}
