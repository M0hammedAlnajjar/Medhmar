package com.gulfracing.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ChallengeCamelId implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Column(name = "challenge_id")
    private Long challengeId;

    @Column(name = "camel_id")
    private Long camelId;
}
