package com.gulfracing.dto;

import com.gulfracing.entity.Camel;
import com.gulfracing.entity.MarketPlace;
import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.entity.Pedigree;
import com.gulfracing.enums.CamelStatus;
import com.gulfracing.enums.Gender;
import com.gulfracing.enums.MarketPlaceStatus;

import java.util.Date;
import java.util.List;

// Read-only view of a camel: core data, pedigree, current owners (name only) and the active listing.
public record CamelProfileDTO(
        Long camelId,
        String name,
        Gender gender,
        Date birthDate,
        String breed,
        String photoUrl,
        String category,
        CamelStatus status,
        PedigreeInfo pedigree,
        List<OwnerInfo> owners,
        ListingInfo activeListing
) {
    public record PedigreeInfo(Long pedigreeId, Date recordedAt, String sire, String dam) {}

    public record OwnerInfo(String name, Double sharePercent) {}

    public record ListingInfo(Long listingId, Double askingPriceOmr, String description,
                              MarketPlaceStatus status, Date createdAt) {}

    public static CamelProfileDTO of(Camel camel, Pedigree pedigree,
                                     List<OwnershipRecord> owners, MarketPlace listing) {
        return new CamelProfileDTO(
                camel.getCamelId(),
                camel.getName(),
                camel.getGender(),
                camel.getBirthDate(),
                camel.getBreed(),
                camel.getPhotoUrl(),
                camel.getCategory(),
                camel.getStatus(),
                new PedigreeInfo(
                        pedigree == null ? null : pedigree.getPedigreeId(),
                        pedigree == null ? null : pedigree.getRecordedAt(),
                        camel.getSire(),
                        camel.getDam()),
                owners.stream()
                        .map(o -> new OwnerInfo(o.getOwner().getFullName(), o.getSharePercent()))
                        .toList(),
                listing == null ? null : new ListingInfo(
                        listing.getListingId(),
                        listing.getAskingPriceOmr(),
                        listing.getDescription(),
                        listing.getStatus(),
                        listing.getCreatedAt())
        );
    }
}
