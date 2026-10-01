package com.gulfracing.controller;

import com.gulfracing.dto.TourismDtos.*;
import com.gulfracing.enums.ContentApprovalStatus;
import com.gulfracing.security.AccountAccess;
import com.gulfracing.service.TourismService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tourism")
@RequiredArgsConstructor
public class TourismController {
    private final TourismService tourism;

    @PostMapping("/events")
    @ResponseStatus(HttpStatus.CREATED)
    public EventView createEvent(@Valid @RequestBody EventRequest request, Authentication auth) {
        return tourism.createEvent(request, AccountAccess.requiredId(auth));
    }

    @GetMapping("/events")
    public List<EventView> listEvents() { return tourism.listEvents(); }

    @GetMapping("/events/{id}")
    public EventView getEvent(@PathVariable Long id) { return tourism.getEvent(id); }

    @PutMapping("/events/{id}")
    public EventView updateEvent(@PathVariable Long id, @Valid @RequestBody EventRequest request, Authentication auth) {
        return tourism.updateEvent(id, request, AccountAccess.requiredId(auth));
    }

    @PostMapping("/events/{id}/visits")
    @ResponseStatus(HttpStatus.CREATED)
    public VisitView recordVisit(@PathVariable Long id, Authentication auth, HttpServletRequest request) {
        return tourism.recordVisit(id, AccountAccess.optionalId(auth), request.getRemoteAddr(),
                request.getHeader("User-Agent"), request.getHeader("Referer"));
    }

    @GetMapping("/events/{id}/visits")
    public List<VisitView> visits(@PathVariable Long id, Authentication auth) {
        return tourism.listVisits(id, AccountAccess.requiredId(auth));
    }

    @PostMapping("/content")
    @ResponseStatus(HttpStatus.CREATED)
    public ContentView createContent(@Valid @RequestBody ContentRequest request, Authentication auth) {
        return tourism.createContent(request, AccountAccess.requiredId(auth));
    }

    @GetMapping("/content")
    public List<ContentView> content() { return tourism.listApprovedContent(); }

    @GetMapping("/content/{id}")
    public ContentView content(@PathVariable Long id) { return tourism.getApprovedContent(id); }

    @GetMapping("/content/manage/{organizationId}")
    public List<ContentView> manageContent(@PathVariable Long organizationId, Authentication auth) {
        return tourism.manageContent(organizationId, AccountAccess.requiredId(auth));
    }

    @PutMapping("/content/{id}")
    public ContentView updateContent(@PathVariable Long id, @Valid @RequestBody ContentRequest request, Authentication auth) {
        return tourism.updateContent(id, request, AccountAccess.requiredId(auth));
    }

    @PostMapping("/content/{id}/approve")
    public ContentView approve(@PathVariable Long id, Authentication auth) {
        return tourism.decideContent(id, ContentApprovalStatus.APPROVED, AccountAccess.requiredId(auth));
    }

    @PostMapping("/content/{id}/reject")
    public ContentView reject(@PathVariable Long id, Authentication auth) {
        return tourism.decideContent(id, ContentApprovalStatus.REJECTED, AccountAccess.requiredId(auth));
    }
}
