package com.gulfracing.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.Period;

@Entity
@Table(name = "camels")
@Getter
@Setter
@NoArgsConstructor
public class Camel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "camel_id")
    private Long camelId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "gender", length = 10)
    private String gender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "breed", length = 100)
    private String breed;

    @Column(name = "photo_url", length = 2048)
    private String photoUrl;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "father_id")
    private Camel father;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mother_id")
    private Camel mother;

    @Transient
    public Integer getAge() {
        if (birthDate == null) {
            return null;
        }

        return Period.between(birthDate, LocalDate.now()).getYears();
    }
}
