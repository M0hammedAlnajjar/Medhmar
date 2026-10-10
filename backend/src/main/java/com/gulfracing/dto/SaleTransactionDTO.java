package com.gulfracing.dto;

import com.gulfracing.entity.SaleTransaction;
import java.math.BigDecimal;
import java.util.Date;

/** Read-only sale receipt. Access is restricted to the buyer, seller, or an admin. */
public record SaleTransactionDTO(
        Long saleTransactionId,
        Long offerId,
        Long listingId,
        Long camelId,
        String camelName,
        Long sellerId,
        Long buyerId,
        Double salePriceOmr,
        Date soldAt,
        BigDecimal trainerShareOmr,
        BigDecimal sellerNetOmr
) {
    public static SaleTransactionDTO from(SaleTransaction sale, boolean showSellerFinancials) {
        return new SaleTransactionDTO(
                sale.getSaleTransactionId(), sale.getOffer().getOfferId(),
                sale.getMarketplace().getListingId(), sale.getCamel().getCamelId(),
                sale.getCamel().getName(), sale.getSeller().getUserId(),
                sale.getBuyer().getUserId(), sale.getSalePriceOmr(), sale.getSoldAt(),
                showSellerFinancials ? sale.getTrainerShareOmr() : null, showSellerFinancials ? sale.getSellerNetOmr() : null);
    }
}
