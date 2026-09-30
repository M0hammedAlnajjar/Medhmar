package com.gulfracing.controller;

import com.gulfracing.dto.MarketPlaceDTO;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.MarketPlaceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/marketplace")
@RequiredArgsConstructor
public class MarketPlaceController {

    private final MarketPlaceService marketPlaceService;

    @PostMapping("/add")
    public Long addMarketPlace(
            @Valid @RequestBody MarketPlaceDTO dto,
            Authentication auth
    ) {
        return marketPlaceService.addMarketPlace(
                dto.getAskingPriceOmr(),
                dto.getDescription(),
                dto.getCamelId(),
                AccountAccess.requiredId(auth)
        );
    }

    @GetMapping("/getAll")
    public List<MarketPlaceDTO> getAllMarketPlaces() {
        return MarketPlaceDTO.convertToDTO(
                marketPlaceService.getAllMarketPlaces()
        );
    }

    @GetMapping("/getById")
    public MarketPlaceDTO getById(@RequestParam Long id) {
        return MarketPlaceDTO.convertToDTO(
                marketPlaceService.getById(id)
        );
    }

    @PutMapping("/update")
    public MarketPlaceDTO updateMarketPlace(
            @Valid @RequestBody MarketPlaceDTO dto,
            Authentication auth
    ) {
        return MarketPlaceDTO.convertToDTO(
                marketPlaceService.updateMarketPlace(
                        dto.getListingId(),
                        dto.getAskingPriceOmr(),
                        dto.getDescription(),
                        AccountAccess.requiredId(auth)
                )
        );
    }

    @DeleteMapping("/deleteById")
    public Boolean deleteMarketPlace(
            @RequestParam Long id,
            Authentication auth
    ) {
        return marketPlaceService.deleteById(
                id,
                AccountAccess.requiredId(auth)
        );
    }
}
