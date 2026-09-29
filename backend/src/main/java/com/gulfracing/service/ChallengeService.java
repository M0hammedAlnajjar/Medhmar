package com.gulfracing.service;

import com.gulfracing.dto.ChallengeDtos.*;
import com.gulfracing.dto.PageResponse;
import com.gulfracing.entity.*;
import com.gulfracing.enums.ChallengeStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.*;
import java.time.*;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChallengeService {
    private final ChallengeRepository challenges;
    private final ChallengeCamelRepository entries;
    private final CamelRepository camels;
    private final VoteRepository votes;
    private final UserService users;
    private final Clock clock;

    @Transactional
    public ChallengeResponse create(Long actorId, ChallengeRequest request) {
        validateDates(request);
        var challenge = new Challenge();
        challenge.setCreator(users.getActive(actorId));
        apply(challenge, request);
        challenges.saveAndFlush(challenge);
        return response(challenge);
    }
    @Transactional
    public ChallengeResponse update(Long id, Long actorId, ChallengeRequest request) {
        var challenge = managedDraft(id, actorId);
        validateDates(request);
        apply(challenge, request);
        return response(challenge);
    }
    @Transactional
    public ChallengeResponse addCamel(Long id, Long camelId, Long actorId) {
        var challenge = managedDraft(id, actorId);
        var key = new ChallengeCamelId(id, camelId);
        if (entries.existsById(key)) return response(challenge);
        if (entries.countById_ChallengeId(id) >= 2)
            throw ApiException.conflict("A challenge can contain at most two camels.");
        var camel = camels.findById(camelId).orElseThrow(() -> ApiException.notFound("Camel"));
        if (Boolean.FALSE.equals(camel.getIsActive())) throw ApiException.badRequest("This camel is inactive.");
        var entry = new ChallengeCamel();
        entry.setChallenge(challenge);
        entry.setCamel(camel);
        entries.saveAndFlush(entry);
        return response(challenge);
    }
    @Transactional
    public ChallengeResponse removeCamel(Long id, Long camelId, Long actorId) {
        var challenge = managedDraft(id, actorId);
        var entry = entries.findById(new ChallengeCamelId(id, camelId))
            .orElseThrow(() -> ApiException.notFound("Challenge camel"));
        entries.delete(entry);
        entries.flush();
        return response(challenge);
    }
    @Transactional
    public ChallengeResponse open(Long id, Long actorId) {
        var challenge = managedDraft(id, actorId);
        if (entries.countById_ChallengeId(id) != 2)
            throw ApiException.conflict("Add exactly two different camels before opening a challenge.");
        if (!challenge.getClosesAt().isAfter(clock.instant()))
            throw ApiException.conflict("The challenge closing time has already passed.");
        challenge.setStatus(ChallengeStatus.OPEN);
        return response(challenge);
    }
    @Transactional
    public ChallengeResponse close(Long id, Long actorId) {
        var challenge = locked(id);
        requireManager(challenge, actorId);
        if (challenge.getStatus() != ChallengeStatus.OPEN)
            throw ApiException.conflict("Only an open challenge can be closed.");
        challenge.setStatus(ChallengeStatus.CLOSED);
        return response(challenge);
    }
    @Transactional
    public VoteResponse vote(Long id, Long camelId, Long actorId) {
        // Opening/closing/entry edits and voting serialize on the same challenge row.
        var challenge = locked(id);
        var user = users.getActive(actorId);
        Instant now = clock.instant();
        if (challenge.getStatus() != ChallengeStatus.OPEN || now.isBefore(challenge.getOpensAt())
            || !now.isBefore(challenge.getClosesAt()))
            throw ApiException.conflict("Voting is not open for this challenge.");
        if (votes.existsByUser_UserIdAndChallengeCamel_Id_ChallengeId(actorId, id))
            throw ApiException.conflict("You have already voted in this challenge.");
        var entry = entries.findById(new ChallengeCamelId(id, camelId))
            .orElseThrow(() -> ApiException.badRequest("This camel is not entered in the challenge."));
        var vote = new Vote();
        vote.setUser(user);
        vote.setChallengeCamel(entry);
        vote.setVotedAt(now);
        votes.saveAndFlush(vote);
        return new VoteResponse(vote.getVoteId(), id, camelId, vote.getVotedAt());
    }
    @Transactional(readOnly = true)
    public ChallengeResponse get(Long id, Long viewerId) {
        var challenge = challenges.findById(id).orElseThrow(() -> ApiException.notFound("Challenge"));
        if (challenge.getStatus() == ChallengeStatus.DRAFT
            && (viewerId == null || (!challenge.getCreator().getUserId().equals(viewerId) && !users.isAdmin(viewerId))))
            throw ApiException.notFound("Challenge");
        return response(challenge);
    }
    @Transactional(readOnly = true)
    public PageResponse<ChallengeResponse> list(int page, int size) {
        return PageResponse.from(challenges.findByStatusIn(List.of(ChallengeStatus.OPEN, ChallengeStatus.CLOSED),
            pageable(page, size)), this::response);
    }
    @Transactional(readOnly = true)
    public PageResponse<ChallengeResponse> mine(Long userId, int page, int size) {
        return PageResponse.from(challenges.findByCreator_UserId(userId, pageable(page, size)), this::response);
    }
    private Pageable pageable(int page, int size) {
        return PageRequest.of(page, size, Sort.by("challengeId").descending());
    }
    private Challenge locked(Long id) {
        return challenges.findLockedById(id).orElseThrow(() -> ApiException.notFound("Challenge"));
    }
    private Challenge managedDraft(Long id, Long actorId) {
        var challenge = locked(id);
        requireManager(challenge, actorId);
        if (challenge.getStatus() != ChallengeStatus.DRAFT)
            throw ApiException.conflict("Only draft challenges can be edited.");
        return challenge;
    }
    private void requireManager(Challenge challenge, Long actorId) {
        if (!challenge.getCreator().getUserId().equals(actorId) && !users.isAdmin(actorId))
            throw ApiException.forbidden();
    }
    private void validateDates(ChallengeRequest request) {
        if (!request.closesAt().isAfter(request.opensAt()) || !request.closesAt().isAfter(clock.instant()))
            throw ApiException.badRequest("Closing time must be after opening time and in the future.");
    }
    private void apply(Challenge challenge, ChallengeRequest request) {
        challenge.setTitle(request.title().strip());
        challenge.setOpensAt(request.opensAt());
        challenge.setClosesAt(request.closesAt());
    }
    private ChallengeResponse response(Challenge challenge) {
        Map<Long, Long> counts = votes.countVotes(challenge.getChallengeId()).stream()
            .collect(Collectors.toMap(VoteRepository.VoteCount::getCamelId, VoteRepository.VoteCount::getVoteCount));
        long total = counts.values().stream().mapToLong(Long::longValue).sum();
        List<CamelResult> results = entries.findById_ChallengeIdOrderById_CamelIdAsc(challenge.getChallengeId())
            .stream().map(entry -> {
                var camel = entry.getCamel();
                long count = counts.getOrDefault(camel.getCamelId(), 0L);
                BigDecimal percent = total == 0 ? BigDecimal.ZERO.setScale(2)
                    : BigDecimal.valueOf(count).multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(total), 2, RoundingMode.HALF_UP);
                return new CamelResult(camel.getCamelId(), camel.getName(), camel.getPhotoUrl(), count, percent);
            }).toList();
        ChallengeStatus effectiveStatus = challenge.getStatus();
        if (effectiveStatus == ChallengeStatus.OPEN && !clock.instant().isBefore(challenge.getClosesAt()))
            effectiveStatus = ChallengeStatus.CLOSED;
        return new ChallengeResponse(challenge.getChallengeId(), challenge.getTitle(), challenge.getOpensAt(),
            challenge.getClosesAt(), effectiveStatus, challenge.getCreator().getUserId(), total, results);
    }
}
