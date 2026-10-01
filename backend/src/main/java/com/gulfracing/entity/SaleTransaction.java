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
public class SaleTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long saleTransactionId;

    private Double salePriceOmr;
    private Date soldAt;

    private Boolean isActive;
    private Date createdDate;
    private Date updatedDate;

    @OneToOne
    @JoinColumn(name = "offer_id", nullable = false, unique = true)
    private Offer offer;

    @ManyToOne
    @JoinColumn(name = "listing_id", nullable = false)
    private MarketPlace marketplace;

    @ManyToOne
    @JoinColumn(name = "camel_id", nullable = false)
    private Camel camel;

    @ManyToOne
    @JoinColumn(name = "seller_id", nullable = false)
    private User seller;

    @ManyToOne
    @JoinColumn(name = "buyer_id", nullable = false)
    private User buyer;
}
