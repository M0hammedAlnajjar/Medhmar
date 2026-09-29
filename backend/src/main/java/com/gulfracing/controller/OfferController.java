package com.gulfracing.controller;

import com.gulfracing.dto.OfferDTO;
import com.gulfracing.service.OfferService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("offer")
public class OfferController {
    OfferService offerService;

    @Autowired
    public OfferController(OfferService offerService) {
        this.offerService = offerService;
    }

    //Add API
    @PostMapping("add")
    public Long addOffer(@Valid @RequestBody OfferDTO dto) {
        return offerService.addOffer(
                dto.getOfferedPriceOmr(),
                dto.getStatus(),
                dto.getUserId(),
                dto.getListingId()
        );
    }

    //Get all API
    @GetMapping("getAll")
    public List<OfferDTO> getAllOffers() {
        List<OfferDTO> offers = OfferDTO.convertToDTO(
                offerService.getAllOffers()
        );
        return offers;
    }

    //Get By Id API
    @GetMapping("getById")
    public OfferDTO getById(@RequestParam Long id) {
        return OfferDTO.convertToDTO(offerService.getById(id));
    }

    //Update API
    @PutMapping("update")
    public OfferDTO updateOffer(
            @Valid @RequestBody OfferDTO dto) {
        return OfferDTO.convertToDTO(
                offerService.updateOffer(
                        dto.getOfferId(),
                        dto.getOfferedPriceOmr(),
                        dto.getStatus()
                )
        );
    }

    //Delete API
    @DeleteMapping("deleteById")
    public Boolean deleteOffer(@RequestParam Long id) {
        return offerService.deleteById(id);
    }
}
