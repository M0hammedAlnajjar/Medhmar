package com.gulfracing.entity;

import com.gulfracing.enums.MarketPlaceStatus;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Date;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MarketPlace {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long listingId;

    @jakarta.persistence.Column(precision = 12, scale = 3)
    private java.math.BigDecimal askingPriceOmr;
    private Date createdAt;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    private MarketPlaceStatus status;
    private String description;
    private Boolean isActive;
    private Date createdDate;
    private Date updatedDate;

    @ManyToOne
    @JoinColumn(name = "camel_id")
    private Camel camel;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @OneToMany(mappedBy = "marketplace")
    private List<Offer> offers;
}
