package com.gulfracing.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
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

    @Column(name = "trainer_share_omr", precision = 12, scale = 3)
    private BigDecimal trainerShareOmr;

    @Column(name = "seller_net_omr", precision = 12, scale = 3)
    private BigDecimal sellerNetOmr;

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

    @ManyToOne
    @JoinColumn(name = "trainer_id")
    private User trainer;

    @ManyToOne
    @JoinColumn(name = "agreement_id")
    private TrainingAgreement agreement;
}
