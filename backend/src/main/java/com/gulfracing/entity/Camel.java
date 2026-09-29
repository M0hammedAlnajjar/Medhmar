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
public class Camel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long camelId;

    private String name;
    private String gender;
    private Date birthDate;
    private String breed;
    private String photoUrl;
    private String status;

    @OneToMany(mappedBy = "camel")
    private List<OwnershipRecord> ownershipRecords;

    @OneToMany(mappedBy = "camel")
    private List<Marketplace> marketplaces;
}