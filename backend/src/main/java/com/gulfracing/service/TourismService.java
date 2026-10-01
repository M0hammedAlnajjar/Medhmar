package com.gulfracing.service;

import com.gulfracing.dto.TourismDtos.*;
import com.gulfracing.entity.CulturalContent;
import com.gulfracing.entity.TouristEvent;
import com.gulfracing.entity.VisitorInfo;
import com.gulfracing.enums.ContentApprovalStatus;
import com.gulfracing.exception.ApiException;
import com.gulfracing.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TourismService {
    private final TouristEventRepository events;
    private final VisitorInfoRepository visits;
    private final CulturalContentRepository content;
    private final OrganizationRepository organizations;
    private final OrganizationService organizationService;
    private final UserService users;
    private final Clock clock;

    @Transactional
    public EventView createEvent(EventRequest request, Long actorId) {
        organizationService.requireManager(request.organizationId(), actorId);
        validateDates(request.startAt(), request.endAt());

        var event = new TouristEvent();
        event.setOrganization(organizations.findById(request.organizationId())
                .orElseThrow(() -> ApiException.notFound("Organization")));
        applyEvent(event, request);
        return EventView.from(events.saveAndFlush(event));
    }

    @Transactional(readOnly = true)
    public List<EventView> listEvents() {
        return events.findAllByOrderByStartAtAsc().stream().map(EventView::from).toList();
    }

    @Transactional(readOnly = true)
    public EventView getEvent(Long id) {
        return EventView.from(event(id));
    }

    @Transactional
    public EventView updateEvent(Long id, EventRequest request, Long actorId) {
        var event = event(id);
        organizationService.requireManager(event.getOrganization().getOrganizationId(), actorId);
        organizationService.requireManager(request.organizationId(), actorId);
        validateDates(request.startAt(), request.endAt());
        event.setOrganization(organizations.findById(request.organizationId())
                .orElseThrow(() -> ApiException.notFound("Organization")));
        applyEvent(event, request);
        return EventView.from(event);
    }

    @Transactional
    public VisitView recordVisit(Long eventId, Long actorId, String ipAddress, String deviceInfo, String referrerUrl) {
        var visit = new VisitorInfo();
        visit.setEvent(event(eventId));
        if (actorId != null) visit.setUser(users.getActive(actorId));
        visit.setIpAddress(limit(ipAddress, 64));
        visit.setDeviceInfo(limit(deviceInfo, 500));
        visit.setReferrerUrl(limit(referrerUrl, 2048));
        visit.setVisitDate(clock.instant());
        return VisitView.from(visits.saveAndFlush(visit));
    }

    @Transactional(readOnly = true)
    public List<VisitView> listVisits(Long eventId, Long actorId) {
        var event = event(eventId);
        organizationService.requireManager(event.getOrganization().getOrganizationId(), actorId);
        return visits.findByEvent_EventIdOrderByVisitDateDesc(eventId)
                .stream().map(VisitView::from).toList();
    }

    @Transactional
    public ContentView createContent(ContentRequest request, Long actorId) {
        organizationService.requireManager(request.organizationId(), actorId);
        var item = new CulturalContent();
        item.setOrganization(organizations.findById(request.organizationId())
                .orElseThrow(() -> ApiException.notFound("Organization")));
        applyContent(item, request);
        item.setApprovedStatus(ContentApprovalStatus.PENDING);
        return ContentView.from(content.saveAndFlush(item));
    }

    @Transactional(readOnly = true)
    public List<ContentView> listApprovedContent() {
        return content.findByApprovedStatusOrderByContentIdDesc(ContentApprovalStatus.APPROVED)
                .stream().map(ContentView::from).toList();
    }

    @Transactional(readOnly = true)
    public ContentView getApprovedContent(Long id) {
        var item = contentItem(id);
        if (item.getApprovedStatus() != ContentApprovalStatus.APPROVED) {
            throw ApiException.notFound("Cultural content");
        }
        return ContentView.from(item);
    }

    @Transactional(readOnly = true)
    public List<ContentView> manageContent(Long organizationId, Long actorId) {
        organizationService.requireManager(organizationId, actorId);
        return content.findByOrganization_OrganizationIdOrderByContentIdDesc(organizationId)
                .stream().map(ContentView::from).toList();
    }

    @Transactional
    public ContentView updateContent(Long id, ContentRequest request, Long actorId) {
        var item = contentItem(id);
        organizationService.requireManager(item.getOrganization().getOrganizationId(), actorId);
        organizationService.requireManager(request.organizationId(), actorId);
        item.setOrganization(organizations.findById(request.organizationId())
                .orElseThrow(() -> ApiException.notFound("Organization")));
        applyContent(item, request);
        item.setApprovedStatus(ContentApprovalStatus.PENDING);
        item.setApprovedBy(null);
        return ContentView.from(item);
    }

    @Transactional
    public ContentView decideContent(Long id, ContentApprovalStatus decision, Long actorId) {
        if (decision == ContentApprovalStatus.PENDING) {
            throw ApiException.badRequest("Approval decision must be APPROVED or REJECTED.");
        }
        var item = contentItem(id);
        organizationService.requireManager(item.getOrganization().getOrganizationId(), actorId);
        item.setApprovedStatus(decision);
        item.setApprovedBy(users.getActive(actorId));
        return ContentView.from(item);
    }

    private TouristEvent event(Long id) {
        if (id == null || id <= 0) throw ApiException.badRequest("Event ID must be greater than zero.");
        return events.findById(id).orElseThrow(() -> ApiException.notFound("Tourist event"));
    }

    private CulturalContent contentItem(Long id) {
        if (id == null || id <= 0) throw ApiException.badRequest("Content ID must be greater than zero.");
        return content.findById(id).orElseThrow(() -> ApiException.notFound("Cultural content"));
    }

    private void applyEvent(TouristEvent event, EventRequest request) {
        event.setName(request.name().strip());
        event.setType(request.type().strip());
        event.setLocation(request.location().strip());
        event.setStartAt(request.startAt());
        event.setEndAt(request.endAt());
        event.setDescription(request.description() == null ? null : request.description().strip());
    }

    private void applyContent(CulturalContent item, ContentRequest request) {
        item.setTitle(request.title().strip());
        item.setType(request.type().strip());
        item.setContentUrl(request.contentUrl().strip());
        item.setCategory(request.category().strip());
    }

    private void validateDates(Instant start, Instant end) {
        if (!end.isAfter(start)) throw ApiException.badRequest("Event end time must be after start time.");
    }

    private String limit(String value, int max) {
        if (value == null || value.isBlank()) return null;
        String clean = value.strip();
        return clean.length() <= max ? clean : clean.substring(0, max);
    }
}
