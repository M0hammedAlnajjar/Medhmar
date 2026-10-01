package com.gulfracing.controller;

import com.gulfracing.dto.RaceCardDtos;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.RaceCardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/race-cards")
@RequiredArgsConstructor
public class RaceCardController {
    private final RaceCardService cards;

    @PostMapping("/races/{raceId}/publish")
    @ResponseStatus(HttpStatus.CREATED)
    public RaceCardDtos.View publish(@PathVariable Long raceId, Authentication auth) {
        return cards.publish(raceId, AccountAccess.requiredId(auth));
    }

    @GetMapping("/{cardId}")
    public RaceCardDtos.View get(@PathVariable Long cardId) { return cards.get(cardId); }

    @GetMapping("/races/{raceId}/latest")
    public RaceCardDtos.View latest(@PathVariable Long raceId) { return cards.latest(raceId); }

    @GetMapping("/races/{raceId}")
    public List<RaceCardDtos.View> history(@PathVariable Long raceId) { return cards.history(raceId); }
}
