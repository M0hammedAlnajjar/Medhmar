package com.gulfracing.service;

import com.gulfracing.dto.RaceCardDtos;
import com.gulfracing.entity.RaceCard;
import com.gulfracing.entity.RaceCardEntry;
import com.gulfracing.enums.AgreementStatus;
import com.gulfracing.enums.RaceEntryStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RaceCardService {
    private final RaceRepository races;
    private final RaceEntryRepository raceEntries;
    private final RaceCardRepository cards;
    private final RaceCardEntryRepository cardEntries;
    private final TrainingAgreementRepository agreements;
    private final UserService users;
    private final OrganizationService organizations;
    private final Clock clock;

    @Transactional
    public RaceCardDtos.View publish(Long raceId, Long actorId) {
        var race = races.findLockedById(raceId)
                .orElseThrow(() -> ApiException.notFound("Race"));
        requirePublisher(race, actorId);

        var accepted = raceEntries.findByRace_RaceIdOrderByEntryIdAsc(raceId).stream()
                .filter(e -> e.getEntryStatus() == RaceEntryStatus.ACCEPTED)
                .sorted(Comparator.comparing(e -> e.getParticipantNumber()))
                .toList();
        if (accepted.isEmpty()) {
            throw ApiException.conflict("A race card requires at least one accepted race entry.");
        }

        int version = cards.findTopByRace_RaceIdOrderByVersionDesc(raceId)
                .map(RaceCard::getVersion).orElse(0) + 1;

        var card = new RaceCard();
        card.setRace(race);
        card.setVersion(version);
        card.setPublishDate(clock.instant());
        card.setPublishedBy(users.getActive(actorId));
        cards.saveAndFlush(card);

        for (var entry : accepted) {
            var cardEntry = new RaceCardEntry();
            cardEntry.setCard(card);
            cardEntry.setEntry(entry);
            cardEntry.setTrimNumber(entry.getParticipantNumber());
            cardEntry.setCamelNameSnapshot(entry.getCamel().getName() == null
                    ? "Camel #" + entry.getCamel().getCamelId()
                    : entry.getCamel().getName());
            cardEntry.setOwnerNameSnapshot(entry.getRegistrant().getFullName());

            var trainers = agreements.findEffectiveForCamel(
                    entry.getCamel().getCamelId(),
                    List.of(
                            AgreementStatus.ACTIVE,
                            AgreementStatus.COMPLETED,
                            AgreementStatus.TERMINATED
                    ),
                    race.getStartsAt()
            );
            if (!trainers.isEmpty()) {
                cardEntry.setTrainerNameSnapshot(trainers.getFirst().getTrainer().getUser().getFullName());
            }

            cardEntries.save(cardEntry);
            card.getEntries().add(cardEntry);
        }
        cardEntries.flush();
        return RaceCardDtos.View.from(card);
    }

    @Transactional(readOnly = true)
    public RaceCardDtos.View get(Long cardId) {
        return RaceCardDtos.View.from(cards.findById(cardId)
                .orElseThrow(() -> ApiException.notFound("Race card")));
    }

    @Transactional(readOnly = true)
    public RaceCardDtos.View latest(Long raceId) {
        return RaceCardDtos.View.from(cards.findTopByRace_RaceIdOrderByVersionDesc(raceId)
                .orElseThrow(() -> ApiException.notFound("Race card")));
    }

    @Transactional(readOnly = true)
    public List<RaceCardDtos.View> history(Long raceId) {
        return cards.findByRace_RaceIdOrderByVersionDesc(raceId)
                .stream().map(RaceCardDtos.View::from).toList();
    }

    private void requirePublisher(com.gulfracing.entity.Race race, Long actorId) {
        if (users.isAdmin(actorId)) return;
        if (race.getOrganizer() != null && actorId.equals(race.getOrganizer().getUserId())) return;
        if (race.getOrganization() != null
                && organizations.canManage(race.getOrganization().getOrganizationId(), actorId)) return;
        throw ApiException.forbidden();
    }
}
