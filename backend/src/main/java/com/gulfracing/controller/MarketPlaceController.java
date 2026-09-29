package com.gulfracing.controller;

import com.gulfracing.dto.MarketPlaceDTO;
import com.gulfracing.service.MarketPlaceService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("marketplace")
public class MarketPlaceController {
    MarketPlaceService marketPlaceService;

    @Autowired
    public MarketPlaceController(MarketPlaceService marketPlaceService) {
        this.marketPlaceService = marketPlaceService;
    }

    //Add API
    @PostMapping("add")
    public Long addMarketPlace(@Valid @RequestBody MarketPlaceDTO dto) {
        return marketPlaceService.addMarketPlace(
                dto.getAskingPriceOmr(),
                dto.getStatus(),
                dto.getDescription()
        );
    }

    //Get all API
    @GetMapping("getAll")
    public List<MarketPlaceDTO> getAllMarketPlaces() {
        List<MarketPlaceDTO> marketPlaces = MarketPlaceDTO.convertToDTO(
                marketPlaceService.getAllMarketPlaces()
        );
        return marketPlaces;
    }

    //Get By Id API
    @GetMapping("getById")
    public MarketPlaceDTO getById(@RequestParam Long id) {
        return MarketPlaceDTO.convertToDTO(
                marketPlaceService.getById(id)
        );
    }

    //Update API
    @PutMapping("update")
    public MarketPlaceDTO updateMarketPlace(
            @Valid @RequestBody MarketPlaceDTO dto) {

        return MarketPlaceDTO.convertToDTO(
                marketPlaceService.updateMarketPlace(
                        dto.getListingId(),
                        dto.getAskingPriceOmr(),
                        dto.getStatus(),
                        dto.getDescription()
                )
        );
    }

    //Delete API
    @DeleteMapping("deleteById")
    public Boolean deleteMarketPlace(@RequestParam Long id) {
        return marketPlaceService.deleteById(id);
    }
}
