package com.gulfracing.service;

import org.springframework.stereotype.Service;
import com.gulfracing.entity.Camel;
import com.gulfracing.entity.Mudammer;
import com.gulfracing.entity.TrainerProfile;
import com.gulfracing.entity.User;
import com.gulfracing.enums.AgreementStatus;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.MudammerRepository;
import com.gulfracing.repository.TrainerProfileRepository;
import com.gulfracing.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class MudammerService {

    MudammerRepository mudammerRepository;
    UserRepository userRepository;
    TrainerProfileRepository trainerProfileRepository;
    CamelRepository camelRepository;

    @Autowired
    public MudammerService(
            MudammerRepository mudammerRepository,
            UserRepository userRepository,
            TrainerProfileRepository trainerProfileRepository,
            CamelRepository camelRepository
    ) {
        this.mudammerRepository = mudammerRepository;
        this.userRepository = userRepository;
        this.trainerProfileRepository = trainerProfileRepository;
        this.camelRepository = camelRepository;
    }

    public Long create(
            Date proposedAt,
            Date startsAt,
            Date endsAt,
            BigDecimal feeOmr,
            BigDecimal offeredSharePct,
            AgreementStatus status,
            Date acceptedAt,
            Long userId,
            Long trainerId,
            Long camelId
    ) {

        Optional<User> user = userRepository.findById(userId);

        if (user.isEmpty()) {
            return -1L;
        }

        Optional<TrainerProfile> trainer =
                trainerProfileRepository.findById(trainerId);

        if (trainer.isEmpty()) {
            return -1L;
        }

        Optional<Camel> camel =
                camelRepository.findById(camelId);

        if (camel.isEmpty()) {
            return -1L;
        }

        Mudammer mudammer = new Mudammer();

        mudammer.setProposedAt(proposedAt);
        mudammer.setStartsAt(startsAt);
        mudammer.setEndsAt(endsAt);
        mudammer.setFeeOmr(feeOmr);
        mudammer.setOfferedSharePct(offeredSharePct);
        mudammer.setStatus(status);
        mudammer.setAcceptedAt(acceptedAt);

        mudammer.setUser(user.get());
        mudammer.setTrainer(trainer.get());
        mudammer.setCamel(camel.get());

        // New agreements are active
        mudammer.setIsActive(true);

        // Set creation/update date
        mudammer.setUpdatedDate(new Date());

        mudammer = mudammerRepository.save(mudammer);

        return mudammer.getAgreementId();
    }

    public List<Mudammer> getAll() {
        return mudammerRepository.getAllMudammer();
    }

    public Mudammer getById(Long id) {

        Mudammer mudammer = mudammerRepository.getById(id);

        if (mudammer != null) {
            return mudammer;
        }

        return new Mudammer();
    }

    public Mudammer update(
            Long id,
            Date proposedAt,
            Date startsAt,
            Date endsAt,
            BigDecimal feeOmr,
            BigDecimal offeredSharePct,
            AgreementStatus status,
            Date acceptedAt,
            Long userId,
            Long trainerId,
            Long camelId
    ) {

        // Repository only returns active agreements
        Mudammer mudammerToUpdate =
                mudammerRepository.getById(id);

        if (mudammerToUpdate == null) {
            return new Mudammer();
        }

        Optional<User> user =
                userRepository.findById(userId);

        if (user.isEmpty()) {
            return new Mudammer();
        }

        Optional<TrainerProfile> trainer =
                trainerProfileRepository.findById(trainerId);

        if (trainer.isEmpty()) {
            return new Mudammer();
        }

        Optional<Camel> camel =
                camelRepository.findById(camelId);

        if (camel.isEmpty()) {
            return new Mudammer();
        }

        mudammerToUpdate.setProposedAt(proposedAt);
        mudammerToUpdate.setStartsAt(startsAt);
        mudammerToUpdate.setEndsAt(endsAt);
        mudammerToUpdate.setFeeOmr(feeOmr);
        mudammerToUpdate.setOfferedSharePct(offeredSharePct);
        mudammerToUpdate.setStatus(status);
        mudammerToUpdate.setAcceptedAt(acceptedAt);

        mudammerToUpdate.setUser(user.get());
        mudammerToUpdate.setTrainer(trainer.get());
        mudammerToUpdate.setCamel(camel.get());

        // Update modification date
        mudammerToUpdate.setUpdatedDate(new Date());

        mudammerToUpdate =
                mudammerRepository.save(mudammerToUpdate);

        return mudammerToUpdate;
    }

    public Boolean delete(Long id) {

        // Only active agreements can be deleted
        Mudammer mudammer =
                mudammerRepository.getById(id);

        if (mudammer == null) {
            return false;
        }

        // Soft delete
        mudammer.setIsActive(false);

        // Update modification date
        mudammer.setUpdatedDate(new Date());

        mudammerRepository.save(mudammer);

        return true;
    }
}