package com.gulfracing.service;

import com.gulfracing.entity.MarketPlace;
import com.gulfracing.entity.Offer;
import com.gulfracing.entity.User;
import com.gulfracing.enums.OfferStatus;
import com.gulfracing.repository.MarketPlaceRepository;
import com.gulfracing.repository.OfferRepository;
import com.gulfracing.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class OfferService {

    OfferRepository offerRepository;
    UserRepository userRepository;
    MarketPlaceRepository marketPlaceRepository;

    @Autowired
    public OfferService(OfferRepository offerRepository, UserRepository userRepository, MarketPlaceRepository marketPlaceRepository) {
        this.offerRepository = offerRepository;
        this.userRepository = userRepository;
        this.marketPlaceRepository = marketPlaceRepository;
    }

    //Add service
    public Long addOffer(Double offeredPriceOmr, OfferStatus status, Long userId, Long listingId) {
        Optional<User> user = userRepository.findById(userId);
        Optional<MarketPlace> marketPlace = marketPlaceRepository.findById(listingId);
        if (user.isEmpty() || marketPlace.isEmpty()) {
            return null;
        }

        Offer offer = new Offer();
        offer.setOfferedPriceOmr(offeredPriceOmr);
        offer.setCreatedAt(new Date());
        offer.setStatus(status);
        offer.setIsActive(true);
        offer.setCreatedDate(new Date());
        offer.setUser(user.get());
        offer.setMarketplace(marketPlace.get());
        offer = offerRepository.save(offer);
        return offer.getOfferId();
    }

    //Get all service
    public List<Offer> getAllOffers() {
        return offerRepository.getAllOffers();
    }

    //Get By Id service
    public Offer getById(Long id) {
        Optional<Offer> offer = offerRepository.findById(id);
        if (offer.isPresent() && offer.get().getIsActive()) {
            return offer.get();
        }
        return new Offer();
    }

    //Update service
    public Offer updateOffer(Long id, Double updateOfferedPriceOmr, OfferStatus updateStatus) {
        Offer offerToUpdate = offerRepository.getById(id);
        if (offerToUpdate == null) {
            return new Offer();
        }
        offerToUpdate.setUpdatedDate(new Date());
        offerToUpdate.setOfferedPriceOmr(updateOfferedPriceOmr);
        offerToUpdate.setStatus(updateStatus);

        if (updateStatus == OfferStatus.ACCEPTED || updateStatus == OfferStatus.DECLINED) {offerToUpdate.setRespondedAt(new Date());}
        offerToUpdate = offerRepository.save(offerToUpdate);
        return offerToUpdate;
    }

    //Delete service
    public Boolean deleteById(Long id) {
        Offer deleteOffer = offerRepository.getById(id);
        if (deleteOffer == null) {
            return false;
        } else {
            deleteOffer.setIsActive(false);
            deleteOffer.setUpdatedDate(new Date());
            offerRepository.save(deleteOffer);
            return true;
        }
    }
}