package com.gulfracing.service;

import com.gulfracing.dto.CamelDTO;
import com.gulfracing.entity.OwnershipRecord;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.OwnershipRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Date;

// Connects the existing camel module to authenticated ownership.
@Service
@RequiredArgsConstructor
public class CamelAccessService {

    private final CamelService camels;
    private final CamelRepository camelRepository;
    private final OwnershipRecordRepository ownerships;
    private final UserService users;
    private final Clock clock;

    @Transactional
    public Long create(CamelDTO request, Long actorId) {
        var owner = users.getActive(actorId);
        Long id = camels.addCamel(
                request.getName(),
                request.getGender(),
                request.getBirthDate(),
                request.getBreed(),
                request.getPhotoUrl(),
                request.getSire(),
                request.getDam(),
                request.getCategory(),
                request.getStatus()
        );

        Date now = Date.from(clock.instant());
        var ownership = new OwnershipRecord();
        ownership.setCamel(camelRepository.getReferenceById(id));
        ownership.setOwner(owner);
        ownership.setSharePercent(100.0);
        ownership.setStartAt(now);
        ownership.setIsActive(true);
        ownership.setCreatedDate(now);
        ownerships.save(ownership);

        return id;
    }

    @Transactional(readOnly = true)
    public void requireOwner(Long camelId, Long actorId) {
        validateCamelId(camelId);

        if (users.isAdmin(actorId)) {
            return;
        }

        if (!ownerships.hasCurrentOwnership(camelId, actorId, Date.from(clock.instant()))) {
            throw ApiException.forbidden();
        }
    }

    @Transactional(readOnly = true)
    public void requireFullOwner(Long camelId, Long actorId) {
        validateCamelId(camelId);

        Double share = ownerships.currentOwnershipShare(
                camelId,
                actorId,
                Date.from(clock.instant())
        );

        if (share == null || share < 99.999d) {
            throw ApiException.conflict("Only the full owner can list this camel for sale.");
        }
    }

    private void validateCamelId(Long camelId) {
        if (camelId == null || camelId <= 0) {
            throw ApiException.badRequest("A camel ID is required.");
        }
    }
}
