package com.gulfracing.entity;

import com.gulfracing.enums.MarketPlaceStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Date;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MarketPlace {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long listingId;

    private Double askingPriceOmr;
    private Date createdAt;

    @Enumerated(EnumType.STRING)
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
