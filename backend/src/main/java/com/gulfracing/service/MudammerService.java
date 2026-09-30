package com.gulfracing.service;

import com.gulfracing.entity.Camel;
import com.gulfracing.entity.Mudammer;
import com.gulfracing.entity.TrainerProfile;
import com.gulfracing.entity.User;
import com.gulfracing.enums.AgreementStatus;
import com.gulfracing.repository.CamelRepository;
import com.gulfracing.repository.MudammerRepository;
import com.gulfracing.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Service
public class MudammerService {
    MudammerRepository trainingAgreementRepository;
    TrainerProfileRepository trainerProfileRepository;
    UserRepository userRepository;
    CamelRepository camelRepository;

    @Autowired
    public TrainingAgreementService(MudammerRepository trainingAgreementRepository,
                                    TrainerProfileRepository trainerProfileRepository,
                                    UserRepository userRepository,
                                    CamelRepository camelRepository) {
        this.trainingAgreementRepository = trainingAgreementRepository;
        this.trainerProfileRepository = trainerProfileRepository;
        this.userRepository = userRepository;
        this.camelRepository = camelRepository;
    }

    public Long create(Long ownerUserId, Long mudammerId, Long camelId,
                       Double feeOmr, Double offeredSharePct,
                       Date startsAt, Date endsAt) {

        Optional<User> owner = userRepository.findById(ownerUserId);
        Optional<TrainerProfile> mudammer = trainerProfileRepository.findById(mudammerId);
        Optional<Camel> camel = camelRepository.findById(camelId);

        if (owner.isEmpty() || mudammer.isEmpty() || camel.isEmpty()) {
            return -1L;
        }

        Mudammer trainingAgreement = new Mudammer();
        trainingAgreement.setUser(owner.get());
        trainingAgreement.setTrainer(mudammer.get());
        trainingAgreement.setCamel(camel.get());
        trainingAgreement.setFeeOmr(feeOmr);
        trainingAgreement.setOfferedSharePct(offeredSharePct);
        trainingAgreement.setStartsAt(startsAt);
        trainingAgreement.setEndsAt(endsAt);
        trainingAgreement.setProposedAt(LocalDateTime.now());
        trainingAgreement.setStatus(AgreementStatus.PENDING_APPROVAL);

        trainingAgreement = trainingAgreementRepository.save(trainingAgreement);

        List<Mudammer> mudammerAgreements = mudammer.get().getAgreements();
        mudammerAgreements.add(trainingAgreement);
        mudammer.get().setAgreements(mudammerAgreements);
        trainerProfileRepository.save(mudammer.get());

        return trainingAgreement.getAgreementId();
    }

    public List<Mudammer> getAll() {
        return trainingAgreementRepository.findAll();
    }

    public Mudammer getById(Long id) {
        Optional<Mudammer> trainingAgreement = trainingAgreementRepository.findById(id);

        if (trainingAgreement.isPresent()) {
            return trainingAgreement.get();
        }

        return new Mudammer();
    }

    public Mudammer update(Long id, String status,
                                    Double feeOmr, Double offeredSharePct) {

        Optional<Mudammer> trainingAgreementOptional = trainingAgreementRepository.findById(id);

        if (trainingAgreementOptional.isEmpty()) {
            return new Mudammer();
        }

        Mudammer trainingAgreementToUpdate = trainingAgreementOptional.get();

        trainingAgreementToUpdate.setStatus( AgreementStatus.valueOf(status));
        trainingAgreementToUpdate.setFeeOmr(feeOmr);
        trainingAgreementToUpdate.setOfferedSharePct(offeredSharePct);

        if ("active".equalsIgnoreCase(status) && trainingAgreementToUpdate.getAcceptedAt() == null) {
            trainingAgreementToUpdate.setAcceptedAt(LocalDateTime.now());
        }

        trainingAgreementToUpdate = trainingAgreementRepository.save(trainingAgreementToUpdate);

        return trainingAgreementToUpdate;
    }

    public Boolean delete(Long id) {

        Optional<Mudammer> trainingAgreementOptional = trainingAgreementRepository.findById(id);

        if (trainingAgreementOptional.isEmpty()) {
            return false;
        }

        Mudammer trainingAgreementToUpdate = trainingAgreementOptional.get();

        trainingAgreementToUpdate.setStatus(AgreementStatus.TERMINATED);
        trainingAgreementToUpdate.setEndsAt(new Date());

        trainingAgreementRepository.save(trainingAgreementToUpdate);

        return true;
    }
}
