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
public class Offer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long offerId;


    private Double offeredPriceOmr;
    private Date createdAt;
    private String status;
    private Date respondedAt;

    @ManyToOne
    @JoinColumn(name = "listing_id")
    private MarketPlace marketplace;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;
}
