package com.gulfracing.controller;

import com.gulfracing.dto.OfferDTO;
import com.gulfracing.dto.SaleTransactionDTO;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.OfferService;
import com.gulfracing.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/offer")
@RequiredArgsConstructor
public class OfferController {

    private final OfferService offerService;
    private final UserService userService;

    @PostMapping("/add")
    public Long addOffer(
            @Valid @RequestBody OfferDTO dto,
            Authentication auth
    ) {
        return offerService.addOffer(
                dto.getOfferedPriceOmr(),
                dto.getListingId(),
                AccountAccess.requiredId(auth)
        );
    }

    @GetMapping("/getAll")
    public List<OfferDTO> getAllOffers(Authentication auth) {
        return OfferDTO.convertToDTO(
                offerService.getAllOffers(AccountAccess.requiredId(auth))
        );
    }

    @GetMapping("/listing/{listingId}")
    public List<OfferDTO> getOffersForListing(
            @PathVariable Long listingId,
            Authentication auth
    ) {
        return OfferDTO.convertToDTO(
                offerService.getOffersForListing(
                        listingId,
                        AccountAccess.requiredId(auth)
                )
        );
    }

    @GetMapping("/getById")
    public OfferDTO getById(
            @RequestParam Long id,
            Authentication auth
    ) {
        return OfferDTO.convertToDTO(
                offerService.getById(
                        id,
                        AccountAccess.requiredId(auth)
                )
        );
    }

    @GetMapping("/{id}/sale")
    public SaleTransactionDTO getSaleReceipt(@PathVariable Long id, Authentication auth) {
        Long userId = AccountAccess.requiredId(auth);
        var sale = offerService.getSaleByOfferId(id, userId);
        boolean showSellerFinancials = sale.getSeller().getUserId().equals(userId) || userService.isAdmin(userId);
        return SaleTransactionDTO.from(sale, showSellerFinancials);
    }

    @PutMapping("/update")
    public OfferDTO updateOffer(
            @Valid @RequestBody OfferDTO dto,
            Authentication auth
    ) {
        return OfferDTO.convertToDTO(
                offerService.updateOffer(
                        dto.getOfferId(),
                        dto.getOfferedPriceOmr(),
                        AccountAccess.requiredId(auth)
                )
        );
    }

    @PostMapping("/{id}/accept")
    public OfferDTO acceptOffer(
            @PathVariable Long id,
            Authentication auth
    ) {
        return OfferDTO.convertToDTO(
                offerService.acceptOffer(
                        id,
                        AccountAccess.requiredId(auth)
                )
        );
    }

    @PostMapping("/{id}/decline")
    public OfferDTO declineOffer(
            @PathVariable Long id,
            Authentication auth
    ) {
        return OfferDTO.convertToDTO(
                offerService.declineOffer(
                        id,
                        AccountAccess.requiredId(auth)
                )
        );
    }

    @DeleteMapping("/deleteById")
    public Boolean deleteOffer(
            @RequestParam Long id,
            Authentication auth
    ) {
        return offerService.deleteById(
                id,
                AccountAccess.requiredId(auth)
        );
    }
}
