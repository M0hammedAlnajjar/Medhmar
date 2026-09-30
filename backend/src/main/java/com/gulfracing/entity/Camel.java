package com.gulfracing.entity;

import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.Gender;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Date;
import java.util.List;

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

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private Gender gender;

    private Date birthDate;
    private String breed;
    private String photoUrl;
    private String sire;
    private String dam;
    private String category;
    private Boolean isActive;
    private Date createdDate;
    private Date updatedDate;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private CamelStatus status;

    @OneToMany(mappedBy = "camel")
    private List<OwnershipRecord> ownershipRecords;

    @OneToMany(mappedBy = "camel")
    private List<MarketPlace> marketplaces;

    @OneToOne(mappedBy = "camel")
    private Pedigree pedigree;
}
