package com.gulfracing.service;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.enums.MarketPlaceStatus;
import com.gulfracing.repository.MarketPlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class MarketPlaceService {

    MarketPlaceRepository marketPlaceRepository;

    @Autowired
    public MarketPlaceService(MarketPlaceRepository marketPlaceRepository) {
        this.marketPlaceRepository = marketPlaceRepository;
    }

    //Add service
    public Long addMarketPlace(Double askingPriceOmr,
                               MarketPlaceStatus status,
                               String description) {

        MarketPlace marketPlace = new MarketPlace();

        marketPlace.setAskingPriceOmr(askingPriceOmr);
        marketPlace.setCreatedAt(new Date());
        marketPlace.setStatus(status);
        marketPlace.setDescription(description);

        marketPlace = marketPlaceRepository.save(marketPlace);

        return marketPlace.getListingId();
    }

    //Get all service
    public List<MarketPlace> getAllMarketPlaces() {
        return marketPlaceRepository.getAllMarketPlaces();
    }

    //Get By Id service
    public MarketPlace getById(Long id) {

        Optional<MarketPlace> marketPlace =
                marketPlaceRepository.findById(id);

        if (marketPlace.isPresent()) {
            return marketPlace.get();
        }

        return new MarketPlace();
    }

    //Update service
    public MarketPlace updateMarketPlace(
            Long id,
            Double updateAskingPriceOmr,
            MarketPlaceStatus updateStatus,
            String updateDescription) {

        MarketPlace marketPlaceToUpdate =
                marketPlaceRepository.getById(id);

        if (marketPlaceToUpdate == null) {
            return new MarketPlace();
        }

        marketPlaceToUpdate.setAskingPriceOmr(updateAskingPriceOmr);
        marketPlaceToUpdate.setStatus(updateStatus);
        marketPlaceToUpdate.setDescription(updateDescription);

        marketPlaceToUpdate =
                marketPlaceRepository.save(marketPlaceToUpdate);

        return marketPlaceToUpdate;
    }

    //Delete service
    public Boolean deleteById(Long id) {

        MarketPlace deleteMarketPlace =
                marketPlaceRepository.getById(id);

        if (deleteMarketPlace == null) {
            return false;
        }

        marketPlaceRepository.deleteById(id);
        return true;
    }
}
