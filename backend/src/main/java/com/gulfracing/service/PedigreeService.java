package com.gulfracing.service;

import com.gulfracing.dto.PedigreeDTO;
import com.gulfracing.dto.PedigreeTreeDTO;
import com.gulfracing.dto.PedigreeUpdateRequest;
import com.gulfracing.entity.Camel;
import com.gulfracing.entity.Pedigree;
import com.gulfracing.enums.Gender;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.PedigreeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PedigreeService {

    private final PedigreeRepository pedigrees;
    private final CamelRepository camelRepository;
    private final CamelService camels;
    private final CamelAccessService access;
    private final Clock clock;

    @Transactional(readOnly = true)
    public PedigreeDTO get(Long camelId) {
        Camel camel = camels.getById(camelId);
        return PedigreeDTO.of(camel, pedigrees.findByCamel_CamelId(camelId).orElse(null));
    }

    @Transactional(readOnly = true)
    public PedigreeTreeDTO getTree(Long camelId, int generations) {
        if (generations < 1 || generations > 4) {
            throw ApiException.badRequest("Generations must be between 1 and 4.");
        }

        Camel camel = camels.getById(camelId);
        return buildTree(camel, generations, new HashSet<>());
    }

    // Validate and write both registered parents atomically. Legacy free-text names are preserved
    // until a registered parent is explicitly linked, and remain available for unregistered parents.
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public PedigreeDTO update(Long camelId, PedigreeUpdateRequest request, Long actorId) {
        if (request == null) {
            throw ApiException.badRequest("Pedigree data is required.");
        }

        access.requireOwner(camelId, actorId);
        Camel camel = camels.getById(camelId);
        Long sireId = request.sireCamelId();
        Long damId = request.damCamelId();

        if (sireId != null && sireId.equals(camelId) || damId != null && damId.equals(camelId)) {
            throw ApiException.badRequest("A camel cannot be its own parent.");
        }

        if (sireId != null && sireId.equals(damId)) {
            throw ApiException.badRequest("Sire and dam must be different camels.");
        }

        Camel sire = registeredParent(sireId);
        Camel dam = registeredParent(damId);

        // Check ancestry before age/gender validation, so even inconsistent historical records
        // cannot be changed into a cyclic graph.
        if (sire != null && reaches(sire.getCamelId(), camelId, new HashSet<>())
                || dam != null && reaches(dam.getCamelId(), camelId, new HashSet<>())) {
            throw ApiException.badRequest("Circular pedigree is not allowed.");
        }

        validateParent(sire, camel, Gender.MALE, "Sire");
        validateParent(dam, camel, Gender.FEMALE, "Dam");

        Pedigree pedigree = pedigrees.findByCamel_CamelId(camelId).orElseGet(() -> {
            Pedigree record = new Pedigree();
            record.setCamel(camel);
            return record;
        });

        boolean hadRegisteredSire = pedigree.getSireCamel() != null;
        boolean hadRegisteredDam = pedigree.getDamCamel() != null;

        pedigree.setSireCamel(sire);
        pedigree.setDamCamel(dam);
        pedigree.setRecordedAt(Date.from(clock.instant()));

        if (sire != null) {
            camel.setSire(sire.getName());
        } else if (hadRegisteredSire) {
            camel.setSire(null);
        }

        if (dam != null) {
            camel.setDam(dam.getName());
        } else if (hadRegisteredDam) {
            camel.setDam(null);
        }

        camel.setUpdatedDate(Date.from(clock.instant()));
        pedigrees.saveAndFlush(pedigree);
        return PedigreeDTO.of(camel, pedigree);
    }

    private Camel registeredParent(Long id) {
        if (id == null) {
            return null;
        }

        if (id <= 0) {
            throw ApiException.badRequest("Registered parent IDs must be positive.");
        }

        return camelRepository.findById(id)
                .filter(candidate -> Boolean.TRUE.equals(candidate.getIsActive()))
                .orElseThrow(() -> ApiException.notFound("Registered parent camel"));
    }

    private void validateParent(Camel parent, Camel child, Gender requiredGender, String role) {
        if (parent == null) {
            return;
        }

        if (parent.getGender() != requiredGender) {
            throw ApiException.badRequest(role + " has an invalid gender.");
        }

        if (parent.getBirthDate() != null && child.getBirthDate() != null
                && !parent.getBirthDate().before(child.getBirthDate())) {
            throw ApiException.badRequest(role + " must be born before the child.");
        }
    }

    private boolean reaches(Long startId, Long targetId, Set<Long> visited) {
        if (startId.equals(targetId)) {
            return true;
        }

        if (!visited.add(startId)) {
            return false;
        }

        var pedigree = pedigrees.findByCamel_CamelId(startId).orElse(null);
        if (pedigree == null) {
            return false;
        }

        Camel sire = pedigree.getSireCamel();
        Camel dam = pedigree.getDamCamel();
        return sire != null && reaches(sire.getCamelId(), targetId, visited)
                || dam != null && reaches(dam.getCamelId(), targetId, visited);
    }

    private PedigreeTreeDTO buildTree(Camel camel, int remaining, Set<Long> path) {
        if (!path.add(camel.getCamelId())) {
            throw ApiException.conflict("An invalid circular pedigree was found.");
        }

        try {
            Pedigree pedigree = pedigrees.findByCamel_CamelId(camel.getCamelId()).orElse(null);
            PedigreeDTO direct = PedigreeDTO.of(camel, pedigree);
            Camel sire = pedigree == null ? null : pedigree.getSireCamel();
            Camel dam = pedigree == null ? null : pedigree.getDamCamel();

            return new PedigreeTreeDTO(
                    camel.getCamelId(),
                    camel.getName(),
                    camel.getGender(),
                    camel.getBirthDate(),
                    direct.sire(),
                    direct.dam(),
                    remaining > 1 && sire != null ? buildTree(sire, remaining - 1, path) : null,
                    remaining > 1 && dam != null ? buildTree(dam, remaining - 1, path) : null
            );
        } finally {
            path.remove(camel.getCamelId());
        }
    }
}
