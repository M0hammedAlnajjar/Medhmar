package com.gulfracing.service;

import com.gulfracing.dto.CamelProfileDTO;
import com.gulfracing.enums.MarketPlaceStatus;
import com.gulfracing.repository.MarketPlaceRepository;
import com.gulfracing.repository.OwnershipRecordRepository;
import com.gulfracing.repository.PedigreeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Date;

@Service
@RequiredArgsConstructor
public class CamelProfileService {

    private final CamelService camels;
    private final PedigreeRepository pedigrees;
    private final OwnershipRecordRepository ownerships;
    private final MarketPlaceRepository marketPlaces;
    private final Clock clock;

    @Transactional(readOnly = true)
    public CamelProfileDTO getProfile(Long camelId) {
        var camel = camels.getById(camelId);
        var pedigree = pedigrees.findByCamel_CamelId(camelId).orElse(null);
        var owners = ownerships.findCurrentOwnershipsWithOwner(camelId, Date.from(clock.instant()));
        var listing = marketPlaces
                .findFirstByCamel_CamelIdAndIsActiveTrueAndStatusOrderByListingIdDesc(
                        camelId, MarketPlaceStatus.AVAILABLE)
                .orElse(null);
        return CamelProfileDTO.of(camel, pedigree, owners, listing);
    }
}
