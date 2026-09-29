package com.gulfracing.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.gulfracing.enums.Provider;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
    name = "auth_accounts",
    uniqueConstraints = @UniqueConstraint(
        name = "uk_auth_provider_subject",
        columnNames = {"provider", "provider_subject"}
    )
)
@Getter
@Setter
@NoArgsConstructor
public class AuthAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "account_id")
    private Long accountId;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "provider", nullable = false, length = 20)
    private Provider provider;

    // LOCAL: normalized email.
    // GOOGLE: the verified Google "sub" identifier.
    @Column(name = "provider_subject", nullable = false, length = 255)
    private String providerSubject;

    // Store the password hash, never the original password.
    // This field can be null for a Google account.
    @JsonIgnore
    @Column(name = "password_hash", length = 255)
    private String passwordHash;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
